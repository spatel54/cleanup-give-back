'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';

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

export async function flagFeedback(feedbackId: string, flagged: boolean) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('volunteer_feedback')
    .select('flagged')
    .eq('id', feedbackId)
    .single();

  const { error } = await supabase
    .from('volunteer_feedback')
    .update({ flagged })
    .eq('id', feedbackId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: flagged ? 'flagged feedback' : 'unflagged feedback',
    targetTable: 'volunteer_feedback',
    targetId: feedbackId,
    beforeValue: before,
    afterValue: { flagged },
  });

  revalidatePath('/feedback');
}
