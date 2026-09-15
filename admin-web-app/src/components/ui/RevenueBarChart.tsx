'use client';

/** Ported from `admin/components/ui/RevenueBarChart.tsx`, using the web-app's local `useHasMounted` + mock data. */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { useHasMounted } from '@/hooks/useHasMounted';
import { formatCents, type MonthlyRevenuePoint } from '@/lib/mock-data';

const shell =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

type ChartRow = {
  label: string;
  Donations: number;
  Shop: number;
};

function centsToDollars(cents: number) {
  return Math.round(cents) / 100;
}

function RevenueTooltip({
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
          <span className="font-semibold">{formatCents(Math.round(p.value * 100))}</span>
        </p>
      ))}
    </div>
  );
}

type Props = {
  title: string;
  subtitle?: string;
  data: MonthlyRevenuePoint[];
  index?: number;
};

/** Stacked monthly bars: donations + shop revenue (dollars on axis). */
export function RevenueBarChart({ title, subtitle, data, index = 0 }: Props) {
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();
  const rows: ChartRow[] = data.map((d) => ({
    label: d.label,
    Donations: centsToDollars(d.donationsCents),
    Shop: centsToDollars(d.shopCents),
  }));
  const hasData = data.some((d) => d.donationsCents > 0 || d.shopCents > 0);

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
          <p className="font-body text-[13px] text-text-tertiary">No payment activity in this window</p>
        </div>
      ) : (
        <div className="h-56 w-full" role="img" aria-label={`${title} bar chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#bdcaba" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#3e4a3d' }}
                tickLine={false}
                axisLine={{ stroke: '#bdcaba' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#3e4a3d' }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'inherit' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="Donations"
                stackId="rev"
                fill="#007536"
                radius={[0, 0, 0, 0]}
                isAnimationActive={mounted && !prefersReduced}
              />
              <Bar
                dataKey="Shop"
                stackId="rev"
                fill="#835400"
                radius={[4, 4, 0, 0]}
                isAnimationActive={mounted && !prefersReduced}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
