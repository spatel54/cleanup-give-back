'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { NAV_BADGES_TAG } from '@/lib/nav-badges';

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return {
      id: 'bypass-admin',
      user_metadata: { role: 'admin' },
    };
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

  const { error } = await supabase
    .from('court_orders')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: before ? 'updated court order' : 'created court order',
    targetTable: 'court_orders',
    targetId: userId,
    beforeValue: before,
    afterValue: payload,
  });

  revalidatePath('/users');
  revalidatePath(`/volunteers/${userId}`);
  revalidateTag(NAV_BADGES_TAG);
}
