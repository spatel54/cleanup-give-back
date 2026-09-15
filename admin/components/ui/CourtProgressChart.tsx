'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useHasMounted } from '@/hooks/useHasMounted';
import { Button } from '@/components/ui/Button';

const shell =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

const VISIBLE_LIMIT = 5;

export type CourtProgressRow = {
  name: string;
  completed: number;
  remaining: number;
  pct: number;
  status: string;
};

type Props = {
  title: string;
  subtitle?: string;
  data: CourtProgressRow[];
  index?: number;
};

/** Stacked progress toward court-required hours — scan who is behind. */
export function CourtProgressChart({ title, subtitle, data, index = 0 }: Props) {
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();
  const [expanded, setExpanded] = useState(false);

  const needsViewMore = data.length > VISIBLE_LIMIT;
  const visible = needsViewMore && !expanded ? data.slice(0, VISIBLE_LIMIT) : data;
  const hiddenCount = data.length - VISIBLE_LIMIT;

  const body = (
    <>
      <div>
        <p className="font-data text-[11px] leading-[16px] tracking-[1px] text-text-tertiary uppercase">
          {title}
        </p>
        {subtitle && (
          <p className="font-body text-[12px] text-text-tertiary mt-xs">{subtitle}</p>
        )}
      </div>
      {data.length === 0 ? (
        <div className="py-lg text-center">
          <p className="font-body text-[13px] text-text-tertiary">No court volunteers at risk</p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-md" role="list">
            {visible.map((row) => {
              const behind = row.status === 'at_risk';
              const widthPct = Math.round(row.pct);
              return (
                <li key={row.name}>
                  <div className="flex items-center justify-between gap-sm mb-xs">
                    <span className="font-body text-[13px] font-medium text-text-primary truncate">
                      {row.name}
                    </span>
                    <span
                      className={`font-data text-[11px] font-semibold shrink-0 ${
                        behind ? 'text-[#ba1a1a]' : 'text-[#835400]'
                      }`}
                    >
                      {widthPct}%
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full bg-bg-surface-elevated overflow-hidden flex"
                    role="img"
                    aria-label={`${row.name}: ${row.completed.toFixed(1)} of ${
                      row.completed + row.remaining
                    } hours complete`}
                  >
                    <div
                      className="h-full transition-[width] duration-[450ms] ease-out motion-reduce:transition-none"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: behind ? '#ba1a1a' : '#007536',
                      }}
                    />
                  </div>
                  <p className="mt-xs font-data text-[11px] text-text-tertiary">
                    {row.completed.toFixed(1)}h done · {row.remaining.toFixed(1)}h left
                  </p>
                </li>
              );
            })}
          </ul>
          {needsViewMore ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? 'View less' : `View more (${hiddenCount} more)`}
            </Button>
          ) : null}
        </>
      )}
    </>
  );

  if (!mounted) return <div className={shell}>{body}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 + index * 0.05 }}
      className={shell}
    >
      {body}
    </motion.div>
  );
}
