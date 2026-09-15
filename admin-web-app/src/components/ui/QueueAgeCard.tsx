'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { CourtBadge } from '@/components/ui/CourtBadge';
import { useHasMounted } from '@/hooks/useHasMounted';
import { buildQueueAgeBuckets, type MockSession } from '@/lib/mock-data';

const shell =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

const PREVIEW_LIMIT = 5;

function waitLabel(createdAt: string, now: Date): string {
  const created = parseISO(createdAt);
  if (Number.isNaN(created.getTime())) return '-';
  const days = Math.max(0, differenceInDays(now, created));
  if (days === 0) return 'Waiting since today';
  if (days === 1) return 'Waiting 1 day';
  return `Waiting ${days} days`;
}

function defaultExpandedBucket(buckets: ReturnType<typeof buildQueueAgeBuckets>): string | null {
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i]!.value > 0) return buckets[i]!.name;
  }
  return null;
}

type Props = {
  title: string;
  subtitle?: string;
  queue: MockSession[];
  now?: Date;
  index?: number;
  emptyLabel?: string;
  onReview: (sessionId: string) => void;
};

export function QueueAgeCard({
  title,
  subtitle,
  queue,
  now = new Date(),
  index = 0,
  emptyLabel = 'No sessions waiting for review',
  onReview,
}: Props) {
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();
  const buckets = useMemo(() => buildQueueAgeBuckets(queue, now), [queue, now]);
  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  const [expandedBucket, setExpandedBucket] = useState<string | null>(() =>
    defaultExpandedBucket(buckets),
  );

  useEffect(() => {
    setExpandedBucket((current) => {
      if (current && buckets.some((bucket) => bucket.name === current && bucket.value > 0)) {
        return current;
      }
      return defaultExpandedBucket(buckets);
    });
  }, [buckets]);

  const max = Math.max(1, ...buckets.map((bucket) => bucket.value));

  const body = (
    <>
      <div>
        <p className="font-data text-[11px] leading-[16px] tracking-[1px] text-text-tertiary uppercase">
          {title}
        </p>
        {subtitle ? <p className="font-body text-[12px] text-text-tertiary mt-xs">{subtitle}</p> : null}
      </div>

      {total === 0 ? (
        <div className="py-lg text-center">
          <p className="font-body text-[13px] text-text-tertiary">{emptyLabel}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-sm" role="list">
          {buckets.map((bucket) => {
            const pct = Math.round((bucket.value / max) * 100);
            const isExpanded = expandedBucket === bucket.name;
            const preview = bucket.sessions.slice(0, PREVIEW_LIMIT);
            const hiddenCount = bucket.sessions.length - preview.length;

            return (
              <li
                key={bucket.name}
                className={`rounded-sm ${isExpanded ? 'bg-bg-surface-elevated/50' : ''}`}
              >
                <button
                  type="button"
                  disabled={bucket.value === 0}
                  aria-expanded={bucket.value > 0 ? isExpanded : undefined}
                  onClick={() => {
                    if (bucket.value === 0) return;
                    setExpandedBucket((current) => (current === bucket.name ? null : bucket.name));
                  }}
                  className={`w-full text-left rounded-sm px-sm py-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    bucket.value > 0 ? 'hover:bg-bg-surface-elevated/70 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between gap-sm mb-xs">
                    <span className="font-body text-[13px] text-text-primary">{bucket.name}</span>
                    <span className="font-data text-[12px] font-semibold text-text-primary shrink-0">
                      {bucket.value}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full bg-bg-surface-elevated overflow-hidden"
                    role="img"
                    aria-label={`${bucket.name}: ${bucket.value}`}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                      style={{ width: `${pct}%`, backgroundColor: bucket.color }}
                    />
                  </div>
                  {bucket.value > 0 ? (
                    <p className="font-body text-[11px] leading-[16px] text-text-tertiary mt-xs min-h-[16px]">
                      {isExpanded ? 'Hide sessions' : 'Show sessions'}
                    </p>
                  ) : null}
                </button>

                {isExpanded && bucket.value > 0 ? (
                  <ul className="px-sm pb-sm flex flex-col gap-xs" role="list">
                    {preview.map((session) => (
                      <li
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-sm sm:gap-md px-sm py-sm rounded-sm bg-bg-app border border-border-outline/60"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-xs flex-wrap">
                            <Link
                              href={`/volunteers/${session.user_id}`}
                              className="font-body text-[13px] font-semibold text-text-primary hover:text-primary hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {session.volunteer_name}
                            </Link>
                            {session.court_ordered ? <CourtBadge /> : null}
                          </div>
                          <p className="font-body text-[12px] text-text-tertiary mt-0.5">
                            {session.activity ?? 'Cleanup'} · {waitLabel(session.created_at, now)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="min-h-11 shrink-0 self-start sm:self-center"
                          aria-label={`Review ${session.volunteer_name}`}
                          onClick={() => onReview(session.id)}
                        >
                          Review
                        </Button>
                      </li>
                    ))}
                    {hiddenCount > 0 ? (
                      <li className="py-xs">
                        <Link
                          href="/sessions?period=all"
                          className="font-body text-[12px] text-primary hover:underline"
                        >
                          {hiddenCount} more
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  if (!mounted) return <div className={shell}>{body}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
      className={shell}
    >
      {body}
    </motion.div>
  );
}
