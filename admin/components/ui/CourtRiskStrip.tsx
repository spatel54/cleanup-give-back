import Link from 'next/link';
import { ChevronRightIcon } from '@/components/ui/Icons';
import type { MockCourtVolunteer } from '@/lib/dashboard-mock';

interface CourtRiskStripProps {
  volunteers: MockCourtVolunteer[];
}

export function CourtRiskStrip({ volunteers }: CourtRiskStripProps) {
  const atRisk = volunteers.filter((v) => v.status === 'at_risk' || v.status === 'in_progress');
  if (atRisk.length === 0) return null;

  return (
    <section className="mb-xl" aria-labelledby="court-risk-heading">
      <div className="flex items-center justify-between mb-md">
        <h2 id="court-risk-heading" className="font-heading text-[18px] leading-[26px] text-text-primary">
          Court hours at risk
        </h2>
        <Link
          href="/users?filter=court"
          className="font-data text-[12px] font-semibold text-primary hover:underline underline-offset-2 inline-flex items-center gap-2"
        >
          View court hours
          <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {atRisk.slice(0, 3).map((v) => {
          const remaining = Math.max(0, v.requiredHours - v.completedHours);
          const due = new Date(v.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const risk = v.status === 'at_risk';
          return (
            <Link
              key={v.id}
              href={`/volunteers/${v.id}`}
              className={`block rounded-md border p-md transition-colors hover:border-primary/40 ${
                risk
                  ? 'bg-[#ffd9de]/40 border-[#ba1a1a]/30'
                  : 'bg-[#ffddb5]/40 border-[#fcab29]/30'
              }`}
            >
              <div className="flex items-start justify-between gap-sm mb-xs">
                <p className="font-body text-[14px] font-semibold text-text-primary truncate">{v.name}</p>
                <span
                  className={`font-data text-[10px] uppercase tracking-[0.5px] shrink-0 ${
                    risk ? 'text-[#ba1a1a]' : 'text-[#835400]'
                  }`}
                >
                  {risk ? 'At risk' : 'Due soon'}
                </span>
              </div>
              <p className="font-data text-[12px] text-text-tertiary">
                {remaining.toFixed(1)}h left · due {due}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
