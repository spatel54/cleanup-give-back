'use client';

import { useMemo, useState } from 'react';
import { RevenueBarChart } from '@/components/ui/RevenueBarChart';
// formatCents comes from the client-safe payments-mock module, not payments-data —
// payments-data pulls in next/headers via the Supabase server client, which breaks
// the client bundle for any component importing a runtime value from it.
import { formatCents } from '@/lib/payments-mock';
import type { BreakdownRow } from '@/lib/payments-data';

type TypeFilter = 'all' | 'donations' | 'shop';

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'donations', label: 'Donations' },
  { value: 'shop', label: 'Shop' },
];

/** Shared tracks so header + rows size the same columns. */
const PAYMENTS_TABLE_COLS = 'grid-cols-[1.4fr_6.5rem_6.5rem_6.5rem]';

export function PaymentsBreakdownSection({ rows }: { rows: BreakdownRow[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        label: r.label,
        monthKey: r.key,
        donationsCents: typeFilter === 'shop' ? 0 : r.donationsCents,
        shopCents: typeFilter === 'donations' ? 0 : r.shopCents,
      })),
    [rows, typeFilter],
  );

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center gap-xs" role="group" aria-label="Filter by revenue type">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={typeFilter === f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              typeFilter === f.value
                ? 'bg-primary text-white border-primary'
                : 'bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <RevenueBarChart
        title="Revenue breakdown"
        subtitle="Totals for the selected range"
        data={chartData}
        index={0}
      />

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div
          className={`grid ${PAYMENTS_TABLE_COLS} gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline`}
        >
          {['Period', 'Donations', 'Shop', 'Total'].map((col) => (
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
        {rows.length === 0 ? (
          <p className="px-lg py-xl text-center font-body text-base text-text-tertiary">
            No payment activity in this window.
          </p>
        ) : (
          <ul role="list" className="divide-y divide-border-outline max-h-[420px] overflow-y-auto">
            {[...rows].reverse().map((row) => (
              <li
                key={row.key}
                className={`grid ${PAYMENTS_TABLE_COLS} gap-md items-center px-lg py-sm`}
              >
                <span className="font-body text-[14px] font-medium text-text-primary">{row.label}</span>
                <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap text-center">
                  {typeFilter === 'shop' ? '—' : formatCents(row.donationsCents)}
                </span>
                <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap text-center">
                  {typeFilter === 'donations' ? '—' : formatCents(row.shopCents)}
                </span>
                <span className="font-data text-[13px] font-semibold text-text-primary whitespace-nowrap text-center">
                  {formatCents(
                    (typeFilter === 'shop' ? 0 : row.donationsCents) +
                      (typeFilter === 'donations' ? 0 : row.shopCents),
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
