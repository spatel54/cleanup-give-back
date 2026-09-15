import { Suspense } from 'react';
import { ChevronRightIcon } from '@/components/ui/Icons';
import { KPICard } from '@/components/ui/KPICard';
import { PeriodToggle } from '@/components/ui/PeriodToggle';
import { OrdersBreakdownSection } from '@/components/ui/OrdersBreakdownSection';
import {
  MOCK_ORDERS,
  formatOrderCents,
  loadOrdersBreakdown,
  ordersBreakdownGranularity,
} from '@/lib/orders-data';
import { parsePeriodSelection, periodInterval, periodLabel } from '@/lib/dashboard-period';
import { OrdersClientShell } from './OrdersClientShell';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const selection = parsePeriodSelection(params);
  const now = new Date();
  const interval = periodInterval(selection, now);
  const granularity = ordersBreakdownGranularity(selection.period, interval);
  const breakdown = loadOrdersBreakdown(interval, granularity, now);
  const rangeLabel = periodLabel(selection, now);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col gap-md mb-lg">
        <div>
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Shop Orders</h1>
          <p className="mt-xs font-body text-[14px] text-text-tertiary">
            Fulfillment and shop revenue for {rangeLabel}. Refunds stay in Stripe.
          </p>
        </div>
        <Suspense fallback={<div className="h-11 w-full sm:w-96 bg-bg-surface-elevated rounded-sm animate-pulse" />}>
          <PeriodToggle selection={selection} />
        </Suspense>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-xl">
        <KPICard label="Open Orders" value={breakdown.open} subtext={rangeLabel} index={0} />
        <KPICard label="Total Orders" value={breakdown.total} subtext={rangeLabel} index={1} />
        <KPICard
          label="Revenue"
          value={formatOrderCents(breakdown.totalRevenueCents)}
          subtext="Excludes cancelled"
          index={2}
        />
      </div>

      <div className="mb-xl">
        <OrdersBreakdownSection rows={breakdown.rows} statusBars={breakdown.statusBars} />
      </div>

      <OrdersClientShell orders={MOCK_ORDERS} />

      <div className="mt-lg bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <p className="font-body text-[14px] font-medium text-text-primary">Stripe Dashboard</p>
          <p className="font-body text-[13px] text-text-tertiary">
            Refunds, disputes, and payment details are managed in Stripe.
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="interactive h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors inline-flex items-center gap-sm shrink-0"
        >
          Open Stripe
          <ChevronRightIcon className="w-4 h-4" color="currentColor" />
        </a>
      </div>
    </div>
  );
}
