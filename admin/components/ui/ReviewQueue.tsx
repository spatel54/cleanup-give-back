import Link from 'next/link';
import { ChevronRightIcon } from '@/components/ui/Icons';

export type ReviewQueueItem = {
  id: string;
  volunteer_name: string;
  activity: string | null;
  court_ordered: boolean;
  created_at: string;
  ageLabel: string;
};

interface ReviewQueueProps {
  items: ReviewQueueItem[];
  isMock: boolean;
}

export function ReviewQueue({ items, isMock }: ReviewQueueProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-xl" aria-labelledby="review-queue-heading">
      <div className="flex items-center justify-between mb-md">
        <h2 id="review-queue-heading" className="font-heading text-[18px] leading-[26px] text-text-primary">
          Review queue
        </h2>
        <Link
          href="/sessions?status=under_review"
          className="font-data text-[12px] font-semibold text-primary hover:underline underline-offset-2 inline-flex items-center gap-2"
        >
          View all under review
          <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
        </Link>
      </div>

      <ul
        role="list"
        className="bg-bg-surface border border-border-outline rounded-md divide-y divide-border-outline overflow-hidden"
      >
        {items.map((item) => {
          const openHref = isMock ? '/sessions?status=under_review' : `/sessions/${item.id}`;
          return (
            <li
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-md px-lg py-md"
            >
              <div className="min-w-0 flex-1">
                <p className="font-body text-[14px] font-semibold text-text-primary truncate">
                  {item.volunteer_name}
                </p>
                <p className="font-body text-[13px] text-text-tertiary truncate">
                  {item.activity ?? 'Cleanup session'}
                  <span className="text-text-tertiary/70"> · {item.ageLabel}</span>
                </p>
                {item.court_ordered && (
                  <span className="inline-block mt-xs font-data text-[10px] tracking-[0.6px] uppercase text-[#835400] bg-[#ffddb5] rounded-xs px-xs">
                    Court-ordered
                  </span>
                )}
              </div>
              <div className="flex items-center gap-sm shrink-0">
                <button
                  type="button"
                  disabled
                  title={isMock ? 'Approve unavailable' : 'Approve from session detail'}
                  className="font-data text-[12px] font-semibold px-md py-xs rounded-sm border border-border-outline text-text-tertiary opacity-50 cursor-not-allowed"
                >
                  Approve
                </button>
                <Link
                  href={openHref}
                  className="font-data text-[12px] font-semibold px-md py-xs rounded-sm bg-primary text-text-on-primary hover:opacity-90"
                >
                  Open
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
