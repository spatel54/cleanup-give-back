/** Ported from `admin/app/(admin)/audit-log/page.tsx` - reads the same shared
 * `admin_audit_log` table every mutating action in `@/actions/sessions.ts` and
 * `@/actions/courtOrders.ts` already writes to via `writeAuditLog`.
 *
 * Rows are summarized in plain language via `@/lib/audit-log-summary` - this page is
 * read by Admin, not a developer, so raw JSON never reaches it by default. Search (`q`)
 * matches against the action, target table, and the session/case name captured in the
 * before/after snapshot (not `target_id` - `ilike` on a `uuid` column errors in
 * Postgres); the action dropdown filters to an exact action type. */
import Link from 'next/link';
import { createDataClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/mock-data';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/ui/Icons';
import { SidebarDemo } from '@/components/ui/sidebar-demo';
import { PageStickyHeader } from '@/components/ui/PageStickyHeader';
import { AuditDiffCard } from '@/components/ui/AuditDiffCard';
import {
  AUDIT_ACTION_OPTIONS,
  auditActionLabel,
  auditActionTone,
  auditTargetLabel,
  describeAuditChanges,
  type AuditLogRow,
} from '@/lib/audit-log-summary';

// Live audit data - see admin-web-app/src/app/sessions/page.tsx for the same
// static-prerender staleness issue this avoids.
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

interface SearchParams {
  page?: string;
  action?: string;
  q?: string;
}

const TONE_CLASSNAME: Record<'positive' | 'negative' | 'neutral', string> = {
  positive: 'bg-[#f7fff1] text-[#007536] border-[#007536]',
  negative: 'bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]',
  neutral: 'bg-[#f6f3f2] text-[#3e4a3d] border-[#bdcaba]',
};

/** PostreSQL `.or()` filter strings break on commas/parens - strip them from free text. */
function sanitizeForOrFilter(value: string): string {
  return value.replace(/[,()]/g, ' ').trim();
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const q = (params.q ?? '').trim();
  const actionFilter = params.action ?? '';
  const supabase = await createDataClient();

  let query = supabase
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('performed_at', { ascending: false });

  if (actionFilter) {
    query = query.eq('action', actionFilter);
  }

  if (q) {
    const term = sanitizeForOrFilter(q);
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        [
          `action.ilike.${like}`,
          `target_table.ilike.${like}`,
          `before_value->>activity.ilike.${like}`,
          `after_value->>activity.ilike.${like}`,
          `before_value->>case_reference.ilike.${like}`,
          `after_value->>case_reference.ilike.${like}`,
        ].join(','),
      );
    }
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, count } = await query;
  const logs = (data ?? []) as AuditLogRow[];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const hasFilters = Boolean(q || actionFilter);

  function pageHref(targetPage: number): string {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (actionFilter) sp.set('action', actionFilter);
    sp.set('page', String(targetPage));
    return `/audit-log?${sp.toString()}`;
  }

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div>
          <PageStickyHeader>
            <div className="max-w-7xl mx-auto w-full flex flex-col gap-md">
              <div>
                <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">
                  Audit Log
                </h1>
                <p className="mt-xs font-body text-[13px] text-text-tertiary">
                  A running history of every approval, decline, hours adjustment, and court-order
                  edit - who did it, when, and what changed.
                </p>
              </div>

              <form method="GET" className="flex flex-col sm:flex-row sm:items-center gap-sm">
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by session name or case reference"
                  aria-label="Search audit log"
                  className="flex-1 h-11 px-md rounded-full border border-border-outline bg-bg-surface font-body text-[13px] text-text-primary placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                />
                <select
                  name="action"
                  defaultValue={actionFilter}
                  aria-label="Filter by what happened"
                  className="h-11 w-fit max-w-full pl-md pr-8 rounded-full border border-border-outline bg-bg-surface font-data text-[12px] text-text-primary field-sizing-content appearance-none bg-no-repeat bg-[length:12px_12px] bg-[position:right_12px_center] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%233e4a3d' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
                  }}
                >
                  <option value="">All actions</option>
                  {AUDIT_ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="h-11 px-lg rounded-full bg-primary text-white font-data text-[12px] font-semibold hover:bg-primary-hover transition-colors"
                >
                  Search
                </button>
                {hasFilters && (
                  <Link
                    href="/audit-log"
                    className="inline-flex items-center gap-xs h-11 px-md rounded-full border border-border-outline font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                    Clear
                  </Link>
                )}
              </form>
            </div>
          </PageStickyHeader>
          <div className="max-w-7xl mx-auto">

          <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-outline bg-bg-surface-elevated">
                    {['When', 'What happened', 'On', 'What changed'].map((h) => (
                      <th
                        key={h}
                        className="px-lg py-sm font-data text-[12px] font-medium tracking-[0.96px] text-text-tertiary uppercase whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-outline">
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-lg py-xl text-center font-body text-base text-text-tertiary">
                        {hasFilters ? 'No audit entries match this search.' : 'No audit entries yet.'}
                      </td>
                    </tr>
                  )}
                  {logs.map((log) => {
                    const target = auditTargetLabel(log);
                    const changes = describeAuditChanges(log.before_value, log.after_value);
                    const tone = auditActionTone(log.action);
                    const isVolunteerAction = log.action === 'volunteer deleted session';

                    return (
                      <tr key={log.id} className="hover:bg-bg-surface-elevated transition-colors align-top">
                        <td className="px-lg py-md font-body text-[13px] text-text-tertiary whitespace-nowrap">
                          {formatDateTime(log.performed_at)}
                        </td>
                        <td className="px-lg py-md">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap ${TONE_CLASSNAME[tone]}`}
                          >
                            {auditActionLabel(log.action)}
                          </span>
                          {isVolunteerAction && (
                            <p className="mt-xs font-body text-[11px] text-text-tertiary">
                              Done by the volunteer, not an admin
                            </p>
                          )}
                        </td>
                        <td className="px-lg py-md">
                          {target.href ? (
                            <Link href={target.href} className="font-body text-[14px] text-primary hover:underline">
                              {target.label}
                            </Link>
                          ) : (
                            <span className="font-body text-[14px] text-text-primary">{target.label}</span>
                          )}
                          {target.shortId && (
                            <p className="font-data text-[11px] text-text-tertiary">#{target.shortId}</p>
                          )}
                        </td>
                        <td className="px-lg py-md">
                          <AuditDiffCard changes={changes} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-md mt-lg">
              {page > 1 && (
                <Link
                  href={pageHref(page - 1)}
                  className="h-9 px-md rounded-sm border border-border-outline font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-2"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
                  Previous
                </Link>
              )}
              <span className="font-data text-[12px] text-text-tertiary">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={pageHref(page + 1)}
                  className="h-9 px-md rounded-sm border border-border-outline font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-2"
                >
                  Next
                  <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
                </Link>
              )}
            </div>
          )}
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}
