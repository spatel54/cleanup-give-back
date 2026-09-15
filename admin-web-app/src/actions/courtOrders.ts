'use server';

/** Ported from `admin/actions/courtOrders.ts` - same `court_orders` upsert, adapted to
 * web-app's `getAdminUser`/`writeAuditLog` pattern in `actions/sessions.ts`. */
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

export async function upsertCourtOrder({
  userId,
  requiredHours,
  dueDate,
  caseReference,
}: {
  userId: string;
  requiredHours: number;
  dueDate: string | null;
  caseReference: string | null;
}) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('court_orders')
    .select('*')
    .eq('user_id', userId)
    .single();

  const payload = {
    user_id: userId,
    required_hours: requiredHours,
    due_date: dueDate,
    case_reference: caseReference,
  };

  const { error } = await supabase.from('court_orders').upsert(payload, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: before ? 'updated court order' : 'created court order',
    targetTable: 'court_orders',
    targetId: userId,
    beforeValue: before,
    afterValue: payload,
  });

  revalidatePath('/volunteers');
  revalidatePath(`/volunteers/${userId}`);
}

/**
 * Resets a court-ordered volunteer's completed-hours count to zero as of now -
 * sessions approved before this marker no longer count. Fires automatically when
 * a court packet PDF is generated (`backend/sessions`'s `buildServiceLetterPdf`);
 * this is the manual path for Admin to reset without generating a new letter,
 * or to redo a reset.
 */
export async function resetCourtOrderHours(userId: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('court_orders')
    .select('hours_reset_at')
    .eq('user_id', userId)
    .single();

  if (!before) {
    throw new Error('This volunteer has no court order on file');
  }

  const hoursResetAt = new Date().toISOString();
  const { error } = await supabase
    .from('court_orders')
    .update({ hours_reset_at: hoursResetAt })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'reset court hours',
    targetTable: 'court_orders',
    targetId: userId,
    beforeValue: before,
    afterValue: { hours_reset_at: hoursResetAt },
  });

  revalidatePath('/volunteers');
  revalidatePath(`/volunteers/${userId}`);
}

export type BulkResetHoursResult = { userId: string; success: boolean; error?: string };

/** Resets hours for every distinct court-ordered volunteer represented in a
 * multi-select of sessions - see `resetCourtOrderHours` for what "reset" means. */
export async function resetCourtOrderHoursBulk(userIds: string[]): Promise<BulkResetHoursResult[]> {
  const uniqueUserIds = [...new Set(userIds)];
  const results: BulkResetHoursResult[] = [];

  for (const userId of uniqueUserIds) {
    try {
      await resetCourtOrderHours(userId);
      results.push({ userId, success: true });
    } catch (err) {
      results.push({ userId, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  revalidatePath('/sessions');
  return results;
}
