/**
 * Ported from `admin/lib/audit.ts` - writes to the same shared `admin_audit_log`
 * table. Untyped here (web-app has no generated `types/database.ts`); admin's
 * version types the insert against `Database['public']['Tables']['admin_audit_log']`.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export async function writeAuditLog(
  supabase: SupabaseClient,
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
  },
) {
  const row = {
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
