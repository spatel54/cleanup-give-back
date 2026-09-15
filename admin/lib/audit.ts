import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type AuditInsert = Database['public']['Tables']['admin_audit_log']['Insert'];

export async function writeAuditLog(
  supabase: SupabaseClient<Database>,
  {
    adminUserId,
    action,
    targetTable,
    targetId,
    beforeValue,
    afterValue,
  }: {
    adminUserId: string;
    action: string;
    targetTable: string;
    targetId?: string;
    beforeValue?: unknown;
    afterValue?: unknown;
  }
) {
  const row: AuditInsert = {
    admin_user_id: adminUserId,
    action,
    target_table: targetTable,
    target_id: targetId ?? null,
    before_value: beforeValue ?? null,
    after_value: afterValue ?? null,
  };
  const { error } = await supabase.from('admin_audit_log').insert(row as never);
  if (error) {
    console.error('[audit] Failed to write audit log:', error);
  }
}
