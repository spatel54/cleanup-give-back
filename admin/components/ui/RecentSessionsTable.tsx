'use client';

import Link from 'next/link';
import { StatusChip } from '@/components/ui/StatusChip';
import type { SessionStatus } from '@/types/database';

export interface RecentSession {
  id: string;
  volunteer_name?: string | null;
  activity: string | null;
  started_at: string | null;
  created_at?: string | null;
  status: string;
  duration_seconds: number | null;
  adjusted_hours: number | null;
  court_ordered: boolean;
  distance_miles: number | null;
  ageLabel?: string;
}

function formatDurationShort(seconds: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface RecentSessionsTableProps {
  sessions: RecentSession[];
  isMock?: boolean;
}

export function RecentSessionsTable({ sessions, isMock = false }: RecentSessionsTableProps) {
  if (!sessions.length) {
    return (
      <div className="bg-bg-surface border border-border-outline rounded-md p-xl text-center">
        <p className="font-body text-[14px] text-text-tertiary">No sessions in this period</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
      <div className="hidden md:grid grid-cols-[1.2fr_1fr_auto_auto_auto_auto] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
        {['Volunteer', 'Activity', 'Submitted', 'Duration', 'Status', ''].map((col) => (
          <span key={col || 'actions'} className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">
            {col}
          </span>
        ))}
      </div>

      <ul role="list" className="divide-y divide-border-outline">
        {sessions.map((session) => {
          const durationDisplay =
            session.adjusted_hours != null
              ? `${session.adjusted_hours.toFixed(1)}h`
              : formatDurationShort(session.duration_seconds);
          const openHref = isMock ? '/sessions?status=under_review' : `/sessions/${session.id}`;
          const canApprove = !isMock && session.status === 'under_review';

          return (
            <li key={session.id} className="px-lg py-md">
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_auto_auto_auto_auto] gap-sm md:gap-md md:items-center">
                <div className="min-w-0">
                  <p className="font-body text-[14px] font-semibold text-text-primary truncate">
                    {session.volunteer_name ?? 'Unknown volunteer'}
                  </p>
                  {session.court_ordered && (
                    <span className="inline-block mt-xs font-data text-[10px] tracking-[0.6px] uppercase text-[#835400] bg-[#ffddb5] rounded-xs px-xs">
                      Court
                    </span>
                  )}
                </div>
                <p className="font-body text-[14px] text-text-primary truncate">
                  {session.activity ?? 'Cleanup session'}
                </p>
                <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">
                  {session.ageLabel ?? '—'}
                </span>
                <span className="font-data text-[13px] font-medium text-text-primary whitespace-nowrap">
                  {durationDisplay}
                </span>
                <StatusChip status={session.status as SessionStatus} />
                <div className="flex items-center gap-sm justify-start md:justify-end">
                  <button
                    type="button"
                    disabled={!canApprove}
                    title={
                      canApprove
                        ? 'Open session to approve'
                        : 'Only under-review sessions can be approved'
                    }
                    className="font-data text-[12px] font-semibold px-sm py-xs rounded-sm border border-border-outline text-text-tertiary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                  <Link
                    href={isMock ? '/sessions' : openHref}
                    className="font-data text-[12px] font-semibold text-primary hover:underline underline-offset-2"
                  >
                    Open
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
