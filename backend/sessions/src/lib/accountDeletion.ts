import { randomBytes } from 'node:crypto';

import { prisma } from '../prisma.js';
import { getServiceSupabase } from '../letterhead/supabaseAdmin.js';
import {
  partitionSessionsForDeletion,
  shouldRetainCourtRecords,
} from './accountDeletionPolicy.js';

const PHOTO_BUCKET = 'session-photos';

export type AccountDeletionResult = {
  courtLogsRetained: boolean;
};

function serviceRoleHeaders(): { url: string; key: string } {
  const url = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) {
    throw new Error('Server misconfigured: missing Supabase service credentials');
  }
  return { url, key };
}

async function unlinkSocialIdentities(userId: string): Promise<void> {
  const { url, key } = serviceRoleHeaders();
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) {
    return;
  }

  for (const identity of data.user.identities ?? []) {
    if (identity.provider === 'email') {
      continue;
    }
    const record = identity as { id?: string; identity_id?: string };
    const identityId = record.identity_id || record.id;
    if (!identityId) {
      continue;
    }
    await fetch(`${url}/auth/v1/admin/users/${userId}/identities/${identityId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
    });
  }
}

async function removeStorageObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return;
  }
  const supabase = getServiceSupabase();
  const unique = [...new Set(paths.filter(Boolean))];
  for (let index = 0; index < unique.length; index += 100) {
    const chunk = unique.slice(index, index + 100);
    await supabase.storage.from(PHOTO_BUCKET).remove(chunk);
  }
}

async function collectStoragePathsUnderPrefix(
  userId: string,
  keepSessionIds: Set<string>,
): Promise<string[]> {
  const supabase = getServiceSupabase();
  const bucket = supabase.storage.from(PHOTO_BUCKET);
  const { data: entries, error } = await bucket.list(userId, { limit: 1000 });
  if (error || !entries) {
    return [`${userId}/profile.jpg`];
  }

  const paths: string[] = [];
  for (const entry of entries) {
    const isFolder = entry.id == null;
    if (isFolder) {
      if (keepSessionIds.has(entry.name)) {
        continue;
      }
      const { data: files } = await bucket.list(`${userId}/${entry.name}`, { limit: 1000 });
      for (const file of files ?? []) {
        paths.push(`${userId}/${entry.name}/${file.name}`);
      }
      continue;
    }
    paths.push(`${userId}/${entry.name}`);
  }
  return paths;
}

async function anonymizeAuthUser(userId: string): Promise<void> {
  const supabase = getServiceSupabase();
  await unlinkSocialIdentities(userId);
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email: `deleted-${userId}@noreply.cleanupgiveback.org`,
    password: randomBytes(32).toString('hex'),
    ban_duration: '876000h',
    user_metadata: {
      full_name: '',
      name: '',
      email: '',
      phone: '',
      avatar_path: '',
      onboarding_complete: false,
      account_deleted: true,
      deleted_at: new Date().toISOString(),
    },
  });
  if (error) {
    throw error;
  }
}

async function deleteRowsForUser(label: string, execute: () => Promise<unknown>): Promise<void> {
  try {
    await execute();
  } catch (error) {
    console.warn(`[account-deletion] ${label} failed:`, error);
  }
}

async function deleteAuthUser(userId: string): Promise<void> {
  const supabase = getServiceSupabase();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    throw error;
  }
}

export async function deleteVolunteerAccount(userId: string): Promise<AccountDeletionResult> {
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: { checkpoints: true },
  });
  const courtOrder = await prisma.courtOrder.findFirst({ where: { userId } });
  const retainCourtRecords = shouldRetainCourtRecords(
    sessions.map((session) => ({ id: session.id, courtOrdered: session.courtOrdered })),
    Boolean(courtOrder),
  );
  const { retainIds, deleteIds } = partitionSessionsForDeletion(
    sessions.map((session) => ({ id: session.id, courtOrdered: session.courtOrdered })),
    retainCourtRecords,
  );
  const retainSet = new Set(retainIds);

  const storagePaths = [
    ...(await collectStoragePathsUnderPrefix(userId, retainSet)),
    ...sessions.flatMap((session) => {
      if (retainSet.has(session.id)) {
        return [];
      }
      return session.checkpoints.flatMap((checkpoint) => [
        checkpoint.selfiePath,
        checkpoint.progressPath,
      ]);
    }),
  ].filter((path): path is string => Boolean(path));

  await removeStorageObjects(storagePaths);

  await deleteRowsForUser('volunteer_feedback', () =>
    prisma.$executeRaw`DELETE FROM public.volunteer_feedback WHERE user_id = ${userId}::uuid`,
  );
  await deleteRowsForUser('volunteer_notifications', () =>
    prisma.$executeRaw`DELETE FROM public.volunteer_notifications WHERE user_id = ${userId}::uuid`,
  );
  await deleteRowsForUser('event_volunteer_notices', () =>
    prisma.$executeRaw`DELETE FROM public.event_volunteer_notices WHERE user_id = ${userId}::uuid`,
  );

  if (deleteIds.length > 0) {
    await prisma.session.deleteMany({
      where: { id: { in: deleteIds }, userId },
    });
  }

  await prisma.$executeRaw`
    INSERT INTO public.admin_audit_log (admin_user_id, action, target_table, target_id, before_value)
    VALUES (
      ${userId}::uuid,
      'volunteer deleted account',
      'auth.users',
      ${userId}::uuid,
      ${JSON.stringify({ courtLogsRetained: retainCourtRecords, deletedSessionIds: deleteIds })}::jsonb
    )
  `;

  if (retainCourtRecords) {
    await anonymizeAuthUser(userId);
  } else {
    await deleteAuthUser(userId);
  }

  return { courtLogsRetained: retainCourtRecords };
}
