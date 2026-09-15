import { Suspense } from 'react';
import { ChevronRightIcon } from '@/components/ui/Icons';
import { KPICard } from '@/components/ui/KPICard';
import { PeriodToggle } from '@/components/ui/PeriodToggle';
import { PaymentsBreakdownSection } from '@/components/ui/PaymentsBreakdownSection';
import { ShopItemBreakdownSection } from '@/components/ui/ShopItemBreakdownSection';
import {
  breakdownGranularityForPeriod,
  formatCents,
  loadPaymentsBreakdown,
  loadShopItemBreakdown,
} from '@/lib/payments-data';
import { parsePeriodSelection, periodInterval, periodLabel } from '@/lib/dashboard-period';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const selection = parsePeriodSelection(params);
  const now = new Date();
  const interval = periodInterval(selection, now);
  const granularity = breakdownGranularityForPeriod(selection.period, interval);

  const [breakdown, itemBreakdown] = await Promise.all([
    loadPaymentsBreakdown(interval, granularity, now),
    loadShopItemBreakdown(interval, now),
  ]);
  const totalCents = breakdown.totalDonationsCents + breakdown.totalShopCents;

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col gap-md mb-lg">
        <div>
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Payments</h1>
          <p className="mt-xs font-body text-[14px] text-text-tertiary">
            Donation and shop revenue for {periodLabel(selection, now)}. Refunds and disputes stay in Stripe.
          </p>
        </div>
        <Suspense fallback={<div className="h-11 w-full sm:w-96 bg-bg-surface-elevated rounded-sm animate-pulse" />}>
          <PeriodToggle selection={selection} />
        </Suspense>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-xl">
        <KPICard
          label="Donations"
          value={formatCents(breakdown.totalDonationsCents)}
          subtext={breakdown.donationsFromDb ? 'From donations' : periodLabel(selection, now)}
          index={0}
        />
        <KPICard
          label="Shop revenue"
          value={formatCents(breakdown.totalShopCents)}
          subtext={breakdown.shopFromDb ? 'From shop orders' : 'Merchandise + kits'}
          index={1}
          href="/orders"
          showChevron
        />
        <KPICard label="Total" value={formatCents(totalCents)} subtext="Donations + shop" index={2} />
      </div>

      <div className="mb-xl">
        <PaymentsBreakdownSection rows={breakdown.rows} />
      </div>

      <div className="mb-xl">
        <ShopItemBreakdownSection breakdown={itemBreakdown} />
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <p className="font-body text-[14px] font-medium text-text-primary">Stripe Dashboard</p>
          <p className="font-body text-[13px] text-text-tertiary">
            Manage refunds, disputes, and payout details in Stripe. Full in-app Stripe tools ship in
            v2.
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="interactive h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors inline-flex items-center justify-center gap-sm shrink-0"
        >
          Manage in Stripe
          <ChevronRightIcon className="w-4 h-4" color="currentColor" />
        </a>
      </div>
    </div>
  );
}
