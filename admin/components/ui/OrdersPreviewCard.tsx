'use client';

import Link from 'next/link';
import { ChevronRightIcon } from '@/components/ui/Icons';
import {
  ORDER_STATUS_CONFIG,
  formatOrderCents,
  normalizeOrderStatus,
  type OrderRow,
} from '@/lib/orders-data';

/** Compact open-orders table preview for the Today commerce card. */
export function OrdersPreviewCard({
  openCount,
  revenueCents,
  preview,
}: {
  openCount: number;
  revenueCents: number;
  preview: OrderRow[];
}) {
  return (
    <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md h-full transition-colors hover:border-primary/40">
      <Link
        href="/orders"
        className="flex items-start justify-between gap-sm no-underline text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
        aria-label="View all open orders"
      >
        <div>
          <p className="font-data text-[12px] leading-[18px] tracking-[0.96px] text-text-tertiary uppercase">
            Open orders
          </p>
          <p className="font-data text-[28px] leading-[36px] font-semibold text-text-primary mt-xs">
            {openCount}
          </p>
          <p className="font-body text-[14px] leading-[20px] text-text-tertiary">
            {formatOrderCents(revenueCents)} total revenue
          </p>
        </div>
        <ChevronRightIcon className="w-2 h-3.5 text-primary shrink-0 mt-1" color="currentColor" />
      </Link>

      {preview.length === 0 ? (
        <p className="font-body text-[13px] text-text-tertiary py-sm">No open orders right now.</p>
      ) : (
        <div className="rounded-sm border border-border-outline overflow-hidden -mx-xs">
          <div className="grid grid-cols-[1fr_auto_auto] gap-sm px-sm py-xs bg-bg-surface-elevated border-b border-border-outline">
            {['Volunteer', 'Total', 'Status'].map((col) => (
              <span
                key={col}
                className="font-data text-[10px] tracking-[0.5px] uppercase text-text-tertiary"
              >
                {col}
              </span>
            ))}
          </div>
          <ul role="list" className="divide-y divide-border-outline">
            {preview.map((order) => {
              const cfg = ORDER_STATUS_CONFIG[normalizeOrderStatus(order.status)];
              return (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="grid grid-cols-[1fr_auto_auto] gap-sm items-center px-sm py-sm no-underline text-inherit table-row-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    aria-label={`View shipping for ${order.volunteer}`}
                  >
                    <div className="min-w-0">
                      <p className="font-body text-[13px] font-medium text-text-primary truncate">
                        {order.volunteer}
                      </p>
                      <p className="font-data text-[11px] text-text-tertiary truncate">{order.items}</p>
                    </div>
                    <span className="font-data text-[12px] font-semibold text-text-primary whitespace-nowrap">
                      {formatOrderCents(order.totalCents)}
                    </span>
                    <span
                      className={`inline-flex font-data text-[10px] font-semibold px-xs py-px rounded-xs border whitespace-nowrap w-fit ${cfg.className}`}
                    >
                      {cfg.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
