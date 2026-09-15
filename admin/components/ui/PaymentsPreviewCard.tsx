'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { MonthlyRevenuePoint } from '@/lib/payments-mock';
import { formatCents } from '@/lib/payments-mock';
import { ChevronRightIcon } from '@/components/ui/Icons';

const DONATIONS_COLOR = '#007536';
const SHOP_COLOR = '#835400';

/** Compact stacked-bar preview for the Today payments card. */
export function PaymentsPreviewCard({
  totalCents,
  monthLabel,
  monthly,
}: {
  totalCents: number;
  monthLabel: string;
  monthly: MonthlyRevenuePoint[];
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const maxTotal = Math.max(
    ...monthly.map((m) => m.donationsCents + m.shopCents),
    1,
  );

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-sm h-full min-h-0 transition-colors hover:border-primary/40">
      <Link
        href="/payments"
        className="flex items-start justify-between gap-sm shrink-0 no-underline text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
        aria-label="View payments"
      >
        <div>
          <p className="font-data text-[12px] leading-[18px] tracking-[0.96px] text-text-tertiary uppercase">
            Payments this month
          </p>
          <p className="font-data text-[28px] leading-[36px] font-semibold text-text-primary mt-xs">
            {formatCents(totalCents)}
          </p>
          <p className="font-body text-[14px] leading-[20px] text-text-tertiary">{monthLabel}</p>
        </div>
        <ChevronRightIcon className="w-2 h-3.5 text-primary shrink-0 mt-1" color="currentColor" />
      </Link>

      <div
        className="mt-sm flex-1 min-h-[7.5rem] flex flex-col gap-sm"
        role="img"
        aria-label="Six-month revenue preview. Hover a bar for amounts."
      >
        <div className="flex-1 min-h-0 flex items-end gap-2">
          {monthly.map((m) => {
            const total = m.donationsCents + m.shopCents;
            const heightPct = Math.max(6, (total / maxTotal) * 100);
            const donationsPct = total > 0 ? (m.donationsCents / total) * 100 : 0;
            const shopPct = total > 0 ? (m.shopCents / total) * 100 : 0;
            const isHovered = hoverKey === m.monthKey;
            const isDimmed = hoverKey !== null && !isHovered;

            return (
              <div
                key={m.monthKey}
                className={`relative flex-1 flex flex-col justify-end items-center min-w-0 h-full transition-opacity ${
                  isDimmed ? 'opacity-40' : 'opacity-100'
                }`}
                onMouseEnter={() => setHoverKey(m.monthKey)}
                onMouseLeave={() => setHoverKey(null)}
              >
                {isHovered ? (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%-0.25rem)] z-10 pointer-events-none bg-bg-surface border border-border-outline rounded-sm px-md py-sm shadow-bar-top whitespace-nowrap"
                    role="tooltip"
                  >
                    <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
                      {m.label}
                    </p>
                    <p className="font-data text-[12px] text-text-primary">
                      <span style={{ color: DONATIONS_COLOR }}>●</span> Donations:{' '}
                      <span className="font-semibold">{formatCents(m.donationsCents)}</span>
                    </p>
                    <p className="font-data text-[12px] text-text-primary">
                      <span style={{ color: SHOP_COLOR }}>●</span> Shop:{' '}
                      <span className="font-semibold">{formatCents(m.shopCents)}</span>
                    </p>
                    <p className="font-data text-[12px] font-semibold text-text-primary mt-xs border-t border-border-outline pt-xs">
                      Total {formatCents(total)}
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="w-full h-full flex flex-col justify-end items-center bg-transparent border-0 p-0 cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
                  aria-label={`${m.label}: ${formatCents(total)} — donations ${formatCents(m.donationsCents)}, shop ${formatCents(m.shopCents)}`}
                  onFocus={() => setHoverKey(m.monthKey)}
                  onBlur={() => setHoverKey(null)}
                >
                  <div
                    className="w-full max-w-[28px] rounded-t-[4px] overflow-hidden flex flex-col justify-end"
                    style={{ height: `${heightPct}%` }}
                  >
                    {shopPct > 0 ? (
                      <div
                        className="w-full shrink-0"
                        style={{ height: `${shopPct}%`, backgroundColor: SHOP_COLOR }}
                      />
                    ) : null}
                    {donationsPct > 0 ? (
                      <div
                        className="w-full shrink-0"
                        style={{ height: `${donationsPct}%`, backgroundColor: DONATIONS_COLOR }}
                      />
                    ) : null}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 shrink-0">
          {monthly.map((m) => (
            <span
              key={`label-${m.monthKey}`}
              className="flex-1 font-data text-[10px] leading-[14px] text-text-tertiary text-center truncate"
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-md shrink-0">
          <span className="inline-flex items-center gap-xs font-data text-[10px] text-text-tertiary">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: DONATIONS_COLOR }}
              aria-hidden
            />
            Donations
          </span>
          <span className="inline-flex items-center gap-xs font-data text-[10px] text-text-tertiary">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: SHOP_COLOR }}
              aria-hidden
            />
            Shop
          </span>
        </div>
      </div>
    </div>
  );
}
