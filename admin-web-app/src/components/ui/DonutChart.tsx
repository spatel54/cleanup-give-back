'use client';

/** Ported from `admin/components/ui/DonutChart.tsx` - optional layout/trend props for denser cards. */
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { useHasMounted } from '@/hooks/useHasMounted';
import { cn } from '@/lib/utils';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
  /** Optional right-side primary label (defaults to zero-padded `value`). */
  valueLabel?: string;
  /** Optional share / secondary label under the name (e.g. "42%"). */
  meta?: string;
  /** Signed MoM delta, e.g. "+3 percentage points" or "+12%". */
  delta?: string | null;
}

export interface DonutTrend {
  /** Signed change label, e.g. "+12%". */
  delta: string;
  /** Prior-window caption, e.g. "vs last month". */
  caption: string;
}

interface DonutChartProps {
  title: string;
  data: DonutSlice[];
  total: number;
  index?: number;
  className?: string;
  /** Override center total text (e.g. "$1,240"). */
  totalLabel?: string;
  emptyLabel?: string;
  /** One-line insight under the legend (e.g. top mover). Ignored when `variant="simple"`. */
  insight?: string | null;
  /** Footer trend strip. Ignored when `variant="simple"`. */
  trend?: DonutTrend | null;
  /** Plain-language line under the title (simple variant only). */
  subtitle?: string | null;
  /** `simple` = name + share only; hides deltas, dollars in legend, insight, and trend footer. */
  variant?: 'default' | 'simple';
}

const chartShellClassName =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

/** False for flat / zero deltas so they stay tertiary. */
function isPositiveDelta(delta: string): boolean {
  if (delta === 'New') return true;
  if (!delta.startsWith('+')) return false;
  if (delta === '+0%' || delta === '+0 percentage points') return false;
  if (delta === '0%' || delta.startsWith('0 ')) return false;
  return true;
}

function deltaToneClass(delta: string | null | undefined): string {
  if (delta == null) return 'text-text-tertiary';
  if (isPositiveDelta(delta)) return 'text-primary';
  if (delta.startsWith('-')) return 'text-[#ba1a1a]';
  return 'text-text-tertiary';
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value: number; payload?: DonutSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const slice = payload[0]!;
  const label = slice.payload?.name ?? slice.name ?? '';
  const meta = slice.payload?.meta;
  const delta = slice.payload?.delta;
  return (
    <div className="relative z-50 bg-bg-surface border border-border-outline rounded-sm px-md py-sm shadow-bar-top pointer-events-none">
      <p className="font-data text-[12px] font-semibold text-text-primary leading-snug whitespace-nowrap">
        {label}
      </p>
      <p className="font-data text-[12px] text-text-tertiary leading-snug mt-xs">
        {slice.payload?.valueLabel ?? slice.value}
        {meta ? ` · ${meta}` : ''}
      </p>
      {delta ? (
        <p className={`font-data text-[11px] leading-snug mt-xs ${deltaToneClass(delta)}`}>{delta}</p>
      ) : null}
    </div>
  );
}

export function DonutChart({
  title,
  data,
  total,
  index = 0,
  className,
  totalLabel,
  emptyLabel = 'No sessions in this period',
  insight = null,
  trend = null,
  subtitle = null,
  variant = 'default',
}: DonutChartProps) {
  const hasData = data.some((d) => d.value > 0);
  const prefersReduced = useReducedMotion();
  const mounted = useHasMounted();
  const shellClassName = cn(chartShellClassName, className);
  const centerTotal = totalLabel ?? String(total);
  const isSimple = variant === 'simple';
  const showInsight = !isSimple && insight;
  const showTrend = !isSimple && trend;

  const body = !hasData ? (
    <>
      <p className="font-data text-[11px] leading-[16px] tracking-[1px] text-text-tertiary uppercase">
        {title}
      </p>
      <div className="flex-1 flex items-center justify-center py-lg text-center">
        <p className="font-body text-[13px] text-text-tertiary">{emptyLabel}</p>
      </div>
    </>
  ) : (
    <>
      <p className="font-data text-[11px] leading-[16px] tracking-[1px] text-text-tertiary uppercase shrink-0">
        {title}
      </p>
      {isSimple && subtitle ? (
        <p className="font-body text-[13px] text-text-tertiary -mt-xs shrink-0">{subtitle}</p>
      ) : null}

      <div className="flex flex-1 items-center gap-lg min-h-0">
        <div className="relative shrink-0" style={{ width: 128, height: 128 }}>
          {/* Behind the chart so hover tooltips are not covered by the center label */}
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none px-2">
            <span className="font-data text-[11px] text-text-tertiary leading-none">Total</span>
            <span
              className={`font-data font-semibold text-text-primary leading-tight mt-0.5 tabular-nums text-center ${
                centerTotal.length > 8 ? 'text-[13px]' : 'text-[16px]'
              }`}
            >
              {centerTotal}
            </span>
          </div>
          <div className="relative z-10 h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={58}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ zIndex: 50, outline: 'none' }}
                  allowEscapeViewBox={{ x: true, y: true }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ul className="flex flex-col gap-sm flex-1 min-w-0 justify-center">
          {data.map((slice) => (
            <li key={slice.name} className="flex items-start justify-between gap-sm">
              {isSimple ? (
                <>
                  <div className="flex items-start gap-xs min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="font-body text-[13px] leading-snug text-text-primary break-words">
                      {slice.name}
                    </span>
                  </div>
                  <span className="font-data text-[13px] font-semibold text-text-primary shrink-0 tabular-nums pt-0.5">
                    {slice.meta ?? `${slice.value}`}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-xs min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: slice.color }}
                    />
                    <div className="min-w-0">
                      <span className="font-body text-[12px] leading-snug text-text-tertiary break-words block">
                        {slice.name}
                      </span>
                      {slice.meta || slice.delta ? (
                        <span className="font-data text-[11px] tabular-nums mt-0.5 block">
                          {slice.meta ? (
                            <span className="text-text-primary font-semibold">{slice.meta}</span>
                          ) : null}
                          {slice.meta && slice.delta != null ? (
                            <span className="text-text-tertiary"> · </span>
                          ) : null}
                          {slice.delta != null ? (
                            <span className={deltaToneClass(slice.delta)}>{slice.delta}</span>
                          ) : null}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="font-data text-[12px] font-semibold text-text-primary shrink-0 tabular-nums pt-0.5">
                    {slice.valueLabel ?? String(slice.value).padStart(2, '0')}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {showInsight ? (
        <p className="font-body text-[12px] text-text-tertiary shrink-0 border-t border-border-outline pt-md">
          <span className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary font-semibold mr-sm">
            Top mover
          </span>
          {insight}
        </p>
      ) : null}

      {showTrend ? (
        <div
          className={`flex items-baseline justify-between gap-sm shrink-0 ${
            showInsight ? '' : 'border-t border-border-outline pt-md'
          }`}
        >
          <p className={`font-data text-[13px] font-semibold tabular-nums ${deltaToneClass(trend!.delta)}`}>
            {trend!.delta}
          </p>
          <p className="font-data text-[11px] text-text-tertiary shrink-0">{trend!.caption}</p>
        </div>
      ) : null}
    </>
  );

  if (!mounted) {
    return <div className={shellClassName}>{body}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.07, ease: [0.23, 1, 0.32, 1] }}
      className={shellClassName}
    >
      {body}
    </motion.div>
  );
}
