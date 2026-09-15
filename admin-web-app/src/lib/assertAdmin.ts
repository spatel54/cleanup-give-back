/**
 * Ported from `admin/lib/assertAdmin.ts` - shared admin check for Route
 * Handlers (API routes). Honors `BYPASS_AUTH=true` the same way server
 * actions do (`@/actions/sessions`, `@/actions/events`) so local/demo mode
 * doesn't 401 on PDF generation while everything else works.
 */
import { createClient } from '@/lib/supabase/server';

export async function assertAdminRequest(): Promise<{ id: string } | null> {
  if (process.env.BYPASS_AUTH === 'true') {
    return { id: 'bypass-admin' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'admin') {
    return null;
  }

  return { id: user.id };
}
