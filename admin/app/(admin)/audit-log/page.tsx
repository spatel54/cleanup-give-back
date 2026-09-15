import { createDataClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/Icons';

const PAGE_SIZE = 50;

interface SearchParams {
  page?: string;
  action?: string;
}

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const supabase = await createDataClient();

  let query = supabase
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('performed_at', { ascending: false });

  if (params.action) {
    query = query.ilike('action', `%${params.action}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data: logs, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="font-heading text-[28px] leading-[36px] text-text-primary mb-lg">Audit Log</h1>

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-outline bg-bg-surface-elevated">
                {['Date/Time', 'Action', 'Target', 'Before', 'After'].map((h) => (
                  <th key={h} className="px-lg py-sm font-data text-[12px] font-medium tracking-[0.96px] text-text-tertiary uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-outline">
              {(logs ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-lg py-xl text-center font-body text-base text-text-tertiary">
                    No audit entries yet.
                  </td>
                </tr>
              )}
              {(logs ?? []).map((log) => (
                <tr key={log.id} className="table-row-hover transition-colors">
                  <td className="px-lg py-md font-body text-[14px] text-text-tertiary whitespace-nowrap">
                    {formatDate(log.performed_at, 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-lg py-md font-body text-base text-text-primary capitalize">
                    {log.action}
                  </td>
                  <td className="px-lg py-md">
                    {log.target_id ? (() => {
                      let href: string | null = null;
                      switch (log.target_table) {
                        case 'sessions':
                          href = `/sessions/${log.target_id}`;
                          break;
                        case 'events':
                          href = `/events/${log.target_id}`;
                          break;
                        case 'shop_orders':
                          href = `/orders/${log.target_id}`;
                          break;
                        case 'users':
                          href = `/users`;
                          break;
                        default:
                          href = null;
                      }
                      return href ? (
                        <Link
                          href={href}
                          className="font-data text-[12px] text-primary hover:underline"
                        >
                          {log.target_table} / {log.target_id.slice(0, 8)}
                        </Link>
                      ) : (
                        <span className="font-data text-[12px] text-text-tertiary">
                          {log.target_table} / {log.target_id.slice(0, 8)}
                        </span>
                      );
                    })() : (
                      <span className="font-body text-[14px] text-text-tertiary">{log.target_table}</span>
                    )}
                  </td>
                  <td className="px-lg py-md max-w-xs">
                    {log.before_value && (
                      <details className="cursor-pointer">
                        <summary className="font-data text-[11px] text-text-tertiary hover:text-text-primary">
                          View
                        </summary>
                        <pre className="mt-xs font-data text-[11px] text-text-tertiary bg-bg-surface-elevated p-xs rounded overflow-auto max-h-32">
                          {JSON.stringify(log.before_value, null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                  <td className="px-lg py-md max-w-xs">
                    {log.after_value && (
                      <details className="cursor-pointer">
                        <summary className="font-data text-[11px] text-text-tertiary hover:text-text-primary">
                          View
                        </summary>
                        <pre className="mt-xs font-data text-[11px] text-text-tertiary bg-bg-surface-elevated p-xs rounded overflow-auto max-h-32">
                          {JSON.stringify(log.after_value, null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-md mt-lg">
          {page > 1 && (
            <Link
              href={`/audit-log?page=${page - 1}`}
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
              href={`/audit-log?page=${page + 1}`}
              className="h-9 px-md rounded-sm border border-border-outline font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-2"
            >
              Next
              <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
