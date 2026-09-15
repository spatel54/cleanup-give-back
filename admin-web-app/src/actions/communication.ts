'use server';

/**
 * Volunteer communication log - manual contact notes ("called the volunteer",
 * "texted about missing photos") logged against `admin_audit_log` rather than a
 * new table, since it's the same "who did what, when" shape the rest of the
 * audit trail already uses. Rendered alongside `email_log` rows on the
 * volunteer profile's Communication section.
 */
import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return { id: 'bypass-admin', user_metadata: { role: 'admin' } };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function logManualContactNote(volunteerId: string, note: string): Promise<void> {
  const trimmed = note.trim();
  if (!trimmed) {
    throw new Error('Note cannot be empty');
  }

  const user = await getAdminUser();
  const supabase = await createServiceClient();

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'logged contact note',
    targetTable: 'volunteers',
    targetId: volunteerId,
    afterValue: { note: trimmed },
  });

  revalidatePath(`/volunteers/${volunteerId}`);
}
