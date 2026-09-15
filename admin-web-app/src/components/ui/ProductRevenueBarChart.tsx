'use client';

/** Vertical bar chart of shop revenue by product (Payments → Shop filter). */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { useHasMounted } from '@/hooks/useHasMounted';
import { formatCents } from '@/lib/mock-data';
import { SHOP_ITEM_CATALOG, shopItemBarColor, type ShopItemBreakdownRow } from '@/lib/shop-catalog';

const shell =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

type ChartRow = {
  id: string;
  label: string;
  chartLabel: string;
  Revenue: number;
  color: string;
};

function ProductTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;
  return (
    <div className="bg-bg-surface border border-border-outline rounded-sm px-md py-sm shadow-bar-top">
      <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
        {row.label}
      </p>
      <p className="font-data text-[12px] text-text-primary">
        <span style={{ color: row.color }}>●</span> Revenue:{' '}
        <span className="font-semibold">{formatCents(Math.round(row.Revenue * 100))}</span>
      </p>
    </div>
  );
}

type Props = {
  title: string;
  subtitle?: string;
  rows: ShopItemBreakdownRow[];
  index?: number;
};

export function ProductRevenueBarChart({ title, subtitle, rows, index = 0 }: Props) {
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();

  const chartRows: ChartRow[] = rows.map((r) => {
    const catalog = SHOP_ITEM_CATALOG.find((p) => p.id === r.id);
    return {
      id: r.id,
      label: r.label,
      chartLabel: catalog?.chartLabel ?? r.label,
      Revenue: Math.round(r.revenueCents) / 100,
      color: shopItemBarColor(r.id),
    };
  });
  const hasData = rows.some((r) => r.revenueCents > 0);

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
          <p className="font-body text-[13px] text-text-tertiary">No shop item sales in this window</p>
        </div>
      ) : (
        <div className="h-56 w-full" role="img" aria-label={`${title} bar chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="#bdcaba" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="chartLabel"
                tick={{ fontSize: 11, fill: '#3e4a3d' }}
                tickLine={false}
                axisLine={{ stroke: '#bdcaba' }}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#3e4a3d' }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip content={<ProductTooltip />} />
              <Bar
                dataKey="Revenue"
                radius={[4, 4, 0, 0]}
                isAnimationActive={mounted && !prefersReduced}
              >
                {chartRows.map((row) => (
                  <Cell key={row.id} fill={row.color} />
                ))}
              </Bar>
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
