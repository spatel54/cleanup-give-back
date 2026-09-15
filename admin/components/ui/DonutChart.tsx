'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { useHasMounted } from '@/hooks/useHasMounted';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  data: DonutSlice[];
  total: number;
  index?: number;
}

const chartShellClassName =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

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
  return (
    <div className="relative z-50 bg-bg-surface border border-border-outline rounded-sm px-md py-sm shadow-bar-top pointer-events-none">
      <p className="font-data text-[12px] font-semibold text-text-primary leading-snug whitespace-nowrap">
        {label}
      </p>
      <p className="font-data text-[12px] text-text-tertiary leading-snug mt-xs">{slice.value}</p>
    </div>
  );
}

export function DonutChart({ title, data, total, index = 0 }: DonutChartProps) {
  const hasData = data.some((d) => d.value > 0);
  const prefersReduced = useReducedMotion();
  const mounted = useHasMounted();

  const body = !hasData ? (
    <>
      <p className="font-data text-[11px] leading-[16px] tracking-[1px] text-text-tertiary uppercase">
        {title}
      </p>
      <div className="py-lg text-center">
        <p className="font-body text-[13px] text-text-tertiary">No sessions in this period</p>
      </div>
    </>
  ) : (
    <>
      <p className="font-data text-[11px] leading-[16px] tracking-[1px] text-text-tertiary uppercase">
        {title}
      </p>

      <div className="flex items-center gap-lg">
        <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
          {/* Behind the chart so hover tooltips are not covered by the center label */}
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-data text-[11px] text-text-tertiary leading-none">Total</span>
            <span className="font-data text-[18px] font-semibold text-text-primary leading-none mt-0.5">
              {total}
            </span>
          </div>
          <div className="relative z-10 h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={44}
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

        <ul className="flex flex-col gap-xs flex-1 min-w-0">
          {data.map((slice) => (
            <li key={slice.name} className="flex items-center justify-between gap-sm">
              <div className="flex items-center gap-xs min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="font-body text-[12px] text-text-tertiary truncate">{slice.name}</span>
              </div>
              <span className="font-data text-[12px] font-semibold text-text-primary shrink-0">
                {String(slice.value).padStart(2, '0')}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  if (!mounted) {
    return <div className={chartShellClassName}>{body}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.07, ease: [0.23, 1, 0.32, 1] }}
      className={chartShellClassName}
    >
      {body}
    </motion.div>
  );
}
