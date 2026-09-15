/**
 * Chronological review timeline for the volunteer profile page (`volunteers/[id]/page.tsx`).
 * Renders `TimelineEvent[]` from `loadVolunteerTimeline` (`lib/live-data.ts`) - reuses the
 * same `auditActionLabel`/`auditActionTone`/`describeAuditChanges` helpers the Audit Log
 * page uses, so labels stay consistent across both surfaces.
 */
import { auditActionLabel, auditActionTone, describeAuditChanges } from '@/lib/audit-log-summary';
import { formatDateTime } from '@/lib/mock-data';
import type { TimelineEvent } from '@/lib/live-data';
import { AuditDiffCard } from '@/components/ui/AuditDiffCard';

const TONE_DOT: Record<'positive' | 'negative' | 'neutral', string> = {
  positive: 'bg-primary',
  negative: 'bg-[#ba1a1a]',
  neutral: 'bg-text-tertiary',
};

export function VolunteerTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md mb-lg">
        <p className="font-body text-[13px] text-text-tertiary">
          No recorded activity yet - approvals, declines, court-order edits, and emails will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md mb-lg">
      <ol className="flex flex-col">
        {events.map((event) => {
          const tone = auditActionTone(event.action);
          const changes = describeAuditChanges(event.beforeValue, event.afterValue);
          return (
            <li
              key={event.id}
              className="flex gap-md py-sm border-b border-border-outline last:border-0"
            >
              <div className="flex flex-col items-center pt-xs shrink-0">
                <span className={`w-2 h-2 rounded-full ${TONE_DOT[tone]}`} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-md flex-wrap">
                  <p className="font-body text-[14px] font-medium text-text-primary">
                    {auditActionLabel(event.action)}
                  </p>
                  <span className="font-data text-[11px] text-text-tertiary whitespace-nowrap">
                    {formatDateTime(event.createdAt)}
                  </span>
                </div>
                {changes.length > 0 && (
                  <div className="mt-xs">
                    <AuditDiffCard changes={changes} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
