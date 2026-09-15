'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminSearchBar } from '@/components/ui/AdminSearchBar';
import {
  ORDER_STATUS_CONFIG,
  formatOrderCents,
  formatOrderDate,
  normalizeOrderStatus,
  type OrderRow,
  type OrderStatus,
} from '@/lib/orders-data';

const STATUS_FILTERS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Shared tracks so header + rows size the same columns. */
const ORDER_TABLE_COLS = 'sm:grid-cols-[1.4fr_1fr_7.5rem_5rem_6.5rem]';

export function OrdersClientShell({ orders }: { orders: OrderRow[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== 'all' && normalizeOrderStatus(order.status) !== status) return false;
      if (!needle) return true;
      return (
        order.volunteer.toLowerCase().includes(needle) ||
        order.email.toLowerCase().includes(needle) ||
        order.id.toLowerCase().includes(needle) ||
        order.items.toLowerCase().includes(needle)
      );
    });
  }, [orders, q, status]);

  return (
    <div>
      <div className="flex flex-wrap gap-sm mb-lg">
        <AdminSearchBar
          value={q}
          onChange={setQ}
          placeholder="Search by volunteer, email, or order ID…"
          className="w-full sm:w-64"
        />
        <div className="flex items-center gap-xs overflow-x-auto" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={status === f.value}
              onClick={() => setStatus(f.value)}
              className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                status === f.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-body text-[14px] text-text-tertiary self-center">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div
          className={`hidden sm:grid ${ORDER_TABLE_COLS} gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline`}
        >
          {['Volunteer', 'Items', 'Date', 'Total', 'Status'].map((col) => (
            <span
              key={col}
              className={`font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary ${
                col === 'Volunteer' || col === 'Items' ? 'text-left' : 'text-center'
              }`}
            >
              {col}
            </span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="px-lg py-xl text-center font-body text-base text-text-tertiary">No orders found.</p>
        ) : (
          <ul role="list" className="divide-y divide-border-outline">
            {filtered.map((order) => {
              const cfg = ORDER_STATUS_CONFIG[normalizeOrderStatus(order.status)];
              return (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className={`grid grid-cols-1 ${ORDER_TABLE_COLS} gap-xs sm:gap-md items-center px-lg py-md table-row-hover transition-colors no-underline text-inherit`}
                    aria-label={`View order for ${order.volunteer}`}
                  >
                    <div className="min-w-0">
                      <p className="font-body text-[14px] font-medium text-text-primary hover:text-primary">
                        {order.volunteer}
                      </p>
                      <p className="font-body text-[12px] text-text-tertiary">{order.email}</p>
                    </div>
                    <span className="font-data text-[13px] text-text-tertiary sm:whitespace-nowrap sm:truncate min-w-0">
                      {order.items}
                    </span>
                    <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap sm:text-center">
                      {formatOrderDate(order.createdAt)}
                    </span>
                    <span className="font-data text-[13px] font-semibold text-text-primary whitespace-nowrap sm:text-center">
                      {formatOrderCents(order.totalCents)}
                    </span>
                    <div className="sm:flex sm:justify-center">
                      <span
                        className={`inline-flex font-data text-[11px] font-semibold px-sm py-xs rounded-xs border whitespace-nowrap w-fit ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
