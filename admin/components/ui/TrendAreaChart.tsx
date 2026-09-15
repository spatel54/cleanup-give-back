'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { useHasMounted } from '@/hooks/useHasMounted';
import type { TrendPoint } from '@/lib/dashboard-charts';

const shell =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-surface border border-border-outline rounded-sm px-md py-sm shadow-bar-top">
      <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="font-data text-[12px] text-text-primary">
          <span style={{ color: p.color }}>●</span> {p.name}:{' '}
          <span className="font-semibold">
            {p.name.includes('Hours') ? Number(p.value).toFixed(1) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

type Props = {
  title: string;
  subtitle?: string;
  data: TrendPoint[];
  index?: number;
};

/** Dual-series area: submissions + approved hours over the period. */
export function TrendAreaChart({ title, subtitle, data, index = 0 }: Props) {
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();
  const hasData = data.some((d) => d.submissions > 0 || d.approvedHours > 0);

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
      {!hasData ? (
        <div className="py-lg text-center">
          <p className="font-body text-[13px] text-text-tertiary">No trend data in this period</p>
        </div>
      ) : (
        <>
          <div className="h-44 w-full" role="img" aria-label={`${title} trend chart`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hoursFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007536" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#007536" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="subsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#835400" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#835400" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#bdcaba" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#3e4a3d' }}
                  tickLine={false}
                  axisLine={{ stroke: '#bdcaba' }}
                  interval="preserveStartEnd"
                  minTickGap={28}
                />
                <YAxis
                  yAxisId="hours"
                  tick={{ fontSize: 10, fill: '#3e4a3d' }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <YAxis yAxisId="count" orientation="right" hide />
                <Tooltip content={<TrendTooltip />} />
                <Area
                  yAxisId="hours"
                  type="monotone"
                  dataKey="approvedHours"
                  name="Approved hours"
                  stroke="#007536"
                  fill="url(#hoursFill)"
                  strokeWidth={2}
                  isAnimationActive={mounted && !prefersReduced}
                />
                <Area
                  yAxisId="count"
                  type="monotone"
                  dataKey="submissions"
                  name="Submissions"
                  stroke="#835400"
                  fill="url(#subsFill)"
                  strokeWidth={2}
                  isAnimationActive={mounted && !prefersReduced}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex flex-wrap gap-md" aria-hidden>
            <li className="flex items-center gap-xs font-data text-[11px] text-text-tertiary">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Approved hours
            </li>
            <li className="flex items-center gap-xs font-data text-[11px] text-text-tertiary">
              <span className="w-2.5 h-2.5 rounded-full bg-[#835400]" /> Submissions
            </li>
          </ul>
        </>
      )}
    </>
  );

  if (!mounted) return <div className={shell}>{body}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 + index * 0.05 }}
      className={shell}
    >
      {body}
    </motion.div>
  );
}
