'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useHasMounted } from '@/hooks/useHasMounted';
import type { NamedBar } from '@/lib/dashboard-charts';

const shell =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

type Props = {
  title: string;
  subtitle?: string;
  data: NamedBar[];
  index?: number;
  emptyLabel?: string;
};

/** Accessible horizontal bars — better than another donut for ranked counts. */
export function HorizontalBarChart({
  title,
  subtitle,
  data,
  index = 0,
  emptyLabel = 'No data in this period',
}: Props) {
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

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
      {total === 0 ? (
        <div className="py-lg text-center">
          <p className="font-body text-[13px] text-text-tertiary">{emptyLabel}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-sm" role="list">
          {data.map((row) => {
            const pct = Math.round((row.value / max) * 100);
            return (
              <li key={row.name}>
                <div className="flex items-center justify-between gap-sm mb-xs">
                  <span className="font-body text-[13px] text-text-primary truncate">{row.name}</span>
                  <span className="font-data text-[12px] font-semibold text-text-primary shrink-0">
                    {row.value}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full bg-bg-surface-elevated overflow-hidden"
                  role="img"
                  aria-label={`${row.name}: ${row.value}`}
                >
                  {/* Width/color only in style — motion via CSS class to avoid SSR/client style mismatch */}
                  <div
                    className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${pct}%`, backgroundColor: row.color }}
                  />
                </div>
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
