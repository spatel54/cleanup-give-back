'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { useHasMounted } from '@/hooks/useHasMounted';
import { HorizontalBarChart } from '@/components/ui/HorizontalBarChart';
import { formatOrderCents, type OrdersBreakdownRow, type OrdersStatusBar } from '@/lib/orders-data';

const shell =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

/** Shared tracks so header + rows size the same columns. */
const ORDERS_PERIOD_COLS = 'grid-cols-[1.4fr_4.5rem_6.5rem]';

type ChartRow = {
  label: string;
  Revenue: number;
  Orders: number;
};

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>;
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
            {p.dataKey === 'Orders' ? p.value : formatOrderCents(Math.round(p.value * 100))}
          </span>
        </p>
      ))}
    </div>
  );
}

export function OrdersBreakdownSection({
  rows,
  statusBars,
}: {
  rows: OrdersBreakdownRow[];
  statusBars: OrdersStatusBar[];
}) {
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();

  const chartRows: ChartRow[] = rows.map((r) => ({
    label: r.label,
    Revenue: Math.round(r.revenueCents) / 100,
    Orders: r.orderCount,
  }));
  const hasData = rows.some((r) => r.orderCount > 0 || r.revenueCents > 0);

  const chartBody = (
    <>
      <div>
        <p className="font-data text-[11px] leading-[16px] tracking-[1px] text-text-tertiary uppercase">
          Order revenue
        </p>
        <p className="font-body text-[12px] text-text-tertiary mt-xs">Totals for the selected range</p>
      </div>
      {!hasData ? (
        <div className="py-lg text-center">
          <p className="font-body text-[13px] text-text-tertiary">No orders in this window</p>
        </div>
      ) : (
        <div className="h-56 w-full" role="img" aria-label="Order revenue bar chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#bdcaba" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#3e4a3d' }}
                tickLine={false}
                axisLine={{ stroke: '#bdcaba' }}
              />
              <YAxis
                yAxisId="revenue"
                tick={{ fontSize: 10, fill: '#3e4a3d' }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Bar
                yAxisId="revenue"
                dataKey="Revenue"
                fill="#007536"
                radius={[4, 4, 0, 0]}
                isAnimationActive={mounted && !prefersReduced}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-md">
      {mounted ? (
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className={shell}
        >
          {chartBody}
        </motion.div>
      ) : (
        <div className={shell}>{chartBody}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <HorizontalBarChart
          title="Orders by status"
          subtitle="Count in the selected range"
          data={statusBars}
          index={1}
          emptyLabel="No orders in this window"
        />

        <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
          <div
            className={`grid ${ORDERS_PERIOD_COLS} gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline`}
          >
            {['Period', 'Orders', 'Revenue'].map((col) => (
              <span
                key={col}
                className={`font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary ${
                  col === 'Period' ? 'text-left' : 'text-center'
                }`}
              >
                {col}
              </span>
            ))}
          </div>
          {rows.every((r) => r.orderCount === 0) ? (
            <p className="px-lg py-xl text-center font-body text-base text-text-tertiary">
              No orders in this window.
            </p>
          ) : (
            <ul role="list" className="divide-y divide-border-outline max-h-[280px] overflow-y-auto">
              {[...rows].reverse().map((row) => (
                <li
                  key={row.key}
                  className={`grid ${ORDERS_PERIOD_COLS} gap-md items-center px-lg py-sm`}
                >
                  <span className="font-body text-[14px] font-medium text-text-primary">
                    {row.label}
                  </span>
                  <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap text-center">
                    {row.orderCount}
                  </span>
                  <span className="font-data text-[13px] font-semibold text-text-primary whitespace-nowrap text-center">
                    {formatOrderCents(row.revenueCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
