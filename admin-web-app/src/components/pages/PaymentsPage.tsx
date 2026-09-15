"use client";

/**
 * Payments console - KPIs, All/Donations/Shop chart filter, period-scoped
 * revenue bars + table, and shop item breakdown.
 *
 * PeriodToggle updates `?period=` / `from` / `to`; the server page reloads
 * `loadPaymentsBreakdown` + `loadShopItemBreakdown` for that window
 * (day → one bar, month → last 6 months, year → last 6 years, all → years).
 */
import { Suspense, useState } from "react";
import { KPICard } from "@/components/ui/KPICard";
import { RevenueBarChart } from "@/components/ui/RevenueBarChart";
import { ShopItemBreakdownSection } from "@/components/ui/ShopItemBreakdownSection";
import { ChevronRightIcon } from "@/components/ui/Icons";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { PageStickyHeader } from "@/components/ui/PageStickyHeader";
import { usePeriodSelection } from "@/components/ui/PeriodToggleBar";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { downloadCsv, openPrintablePdf } from "@/lib/export-download";
import { formatCents, type MonthlyRevenuePoint } from "@/lib/mock-data";
import { buildMockShopItemBreakdown, type ShopItemBreakdown } from "@/lib/shop-catalog";
import type { BreakdownRow, RecentDonationRow } from "@/lib/payments-data";
import { paymentsPeriodLabel, type DashboardPeriod } from "@/lib/dashboard-period";
import {
  formatPaymentMethodLabel,
  isStripeTestMode,
  paymentStatusLabel,
  stripeDashboardHomeUrl,
  stripePaymentUrl,
} from "@/lib/stripe-dashboard";
import { formatOrderDate } from "@/lib/mock-data";

type TypeFilter = "all" | "donations" | "shop";

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "donations", label: "Donations" },
  { value: "shop", label: "Shop" },
];

const PAYMENTS_TABLE_COLS = "lg:grid-cols-[1.4fr_6.5rem_6.5rem_6.5rem]";

function chartSubtitle(period: DashboardPeriod, rangeLabel: string): string {
  switch (period) {
    case "day":
      return "Totals for today";
    case "month":
      return "Monthly totals for the last 6 months";
    case "year":
      return "Yearly totals for the last 6 years";
    case "all":
      return "Yearly totals (all time)";
    case "custom":
      return `Totals for ${rangeLabel}`;
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

function toChartPoints(rows: BreakdownRow[]): MonthlyRevenuePoint[] {
  return rows.map((r) => ({
    label: r.label,
    monthKey: r.key,
    donationsCents: r.donationsCents,
    shopCents: r.shopCents,
  }));
}

export function PaymentsPage({
  rows = [],
  totalDonationsCents = 0,
  totalShopCents = 0,
  itemBreakdown = buildMockShopItemBreakdown(),
  donationsFromDb = false,
  shopFromDb = false,
  isMock = false,
  recentDonations = [],
}: {
  rows?: BreakdownRow[];
  totalDonationsCents?: number;
  totalShopCents?: number;
  itemBreakdown?: ShopItemBreakdown;
  donationsFromDb?: boolean;
  shopFromDb?: boolean;
  isMock?: boolean;
  recentDonations?: RecentDonationRow[];
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto">
          <div className="h-11 w-full bg-bg-surface-elevated rounded-sm animate-pulse mb-lg" />
        </div>
      }
    >
      <PaymentsPageInner
        rows={rows}
        totalDonationsCents={totalDonationsCents}
        totalShopCents={totalShopCents}
        itemBreakdown={itemBreakdown}
        donationsFromDb={donationsFromDb}
        shopFromDb={shopFromDb}
        isMock={isMock}
        recentDonations={recentDonations}
      />
    </Suspense>
  );
}

function PaymentsPageInner({
  rows,
  totalDonationsCents,
  totalShopCents,
  itemBreakdown,
  donationsFromDb,
  shopFromDb,
  isMock,
  recentDonations,
}: {
  rows: BreakdownRow[];
  totalDonationsCents: number;
  totalShopCents: number;
  itemBreakdown: ShopItemBreakdown;
  donationsFromDb: boolean;
  shopFromDb: boolean;
  isMock: boolean;
  recentDonations: RecentDonationRow[];
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const selection = usePeriodSelection();
  const rangeLabel = paymentsPeriodLabel(selection);
  const totalCents = totalDonationsCents + totalShopCents;
  const points = toChartPoints(rows);

  const chartData = points.map((m) => ({
    label: m.label,
    monthKey: m.monthKey,
    donationsCents: typeFilter === "shop" ? 0 : m.donationsCents,
    shopCents: typeFilter === "donations" ? 0 : m.shopCents,
  }));

  const exportColumns = [
    { key: "period", label: "period" },
    { key: "donations", label: "donations" },
    { key: "shop", label: "shop" },
    { key: "total", label: "total" },
  ];
  const exportRows = chartData.map((m) => ({
    period: m.label,
    donations: formatCents(m.donationsCents),
    shop: formatCents(m.shopCents),
    total: formatCents(m.donationsCents + m.shopCents),
  }));

  const tableRows = [...points].reverse();
  const stripeTestMode = recentDonations.some(
    (d) => isStripeTestMode(d.paymentReference) || isStripeTestMode(d.paymentIntentId),
  );

  return (
    <div>
      <PageStickyHeader>
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-md">
          <div className="flex items-start justify-between gap-md flex-wrap">
            <div>
              <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Payments</h1>
              <p className="mt-xs font-body text-[14px] text-text-tertiary">
                Donation and shop revenue for {rangeLabel}. Refunds and disputes stay in Stripe.
              </p>
            </div>
            <ExportMenu
              onExportCsv={() => downloadCsv("payments-export", exportColumns, exportRows)}
              onExportPdf={() => openPrintablePdf("Payments export", exportColumns, exportRows)}
            />
          </div>
          <PeriodToggle selection={selection} />
        </div>
      </PageStickyHeader>
      <div className="max-w-6xl mx-auto">

      {isMock && <SampleDataBanner />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md mb-xl">
        <KPICard
          label="Donations"
          value={formatCents(totalDonationsCents)}
          subtext={donationsFromDb ? "From donations" : rangeLabel}
          index={0}
        />
        <KPICard
          label="Shop revenue"
          value={formatCents(totalShopCents)}
          subtext={shopFromDb ? "From shop orders" : "Merchandise + kits"}
          index={1}
          href="/orders"
          showChevron
        />
        <KPICard label="Total" value={formatCents(totalCents)} subtext="Donations + shop" index={2} />
      </div>

      <div className="flex flex-col gap-md mb-xl">
        <div
          className="flex items-center gap-xs w-full min-w-0 overflow-x-auto"
          role="group"
          aria-label="Filter by revenue type"
        >
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={typeFilter === f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                typeFilter === f.value
                  ? "bg-primary text-white border-primary"
                  : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <RevenueBarChart
          title="Revenue breakdown"
          subtitle={chartSubtitle(selection.period, rangeLabel)}
          data={chartData}
          index={0}
        />

        <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
          <div
            className={`hidden lg:grid ${PAYMENTS_TABLE_COLS} gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline`}
          >
            {["Period", "Donations", "Shop", "Total"].map((col) => (
              <span
                key={col}
                className={`font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary ${
                  col === "Period" ? "text-left" : "text-center"
                }`}
              >
                {col}
              </span>
            ))}
          </div>
          {tableRows.length === 0 ? (
            <p className="px-lg py-xl text-center font-body text-base text-text-tertiary">
              No payment activity in this window.
            </p>
          ) : (
            <ul role="list" className="divide-y divide-border-outline max-h-[420px] overflow-y-auto">
              {tableRows.map((row) => {
                const donationsDisplay = typeFilter === "shop" ? "-" : formatCents(row.donationsCents);
                const shopDisplay = typeFilter === "donations" ? "-" : formatCents(row.shopCents);
                const periodTotal = formatCents(
                  (typeFilter === "shop" ? 0 : row.donationsCents) +
                    (typeFilter === "donations" ? 0 : row.shopCents),
                );
                return (
                  <li
                    key={row.monthKey}
                    className={`grid grid-cols-1 ${PAYMENTS_TABLE_COLS} gap-xs lg:gap-md lg:items-center px-lg py-md lg:py-sm`}
                  >
                    <span className="font-body text-[14px] font-medium text-text-primary">{row.label}</span>
                    <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap lg:text-center">
                      <span className="lg:hidden text-text-tertiary/70">Donations </span>
                      {donationsDisplay}
                    </span>
                    <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap lg:text-center">
                      <span className="lg:hidden text-text-tertiary/70">Shop </span>
                      {shopDisplay}
                    </span>
                    <span className="font-data text-[13px] font-semibold text-text-primary whitespace-nowrap lg:text-center">
                      <span className="lg:hidden text-text-tertiary/70 font-normal">Total </span>
                      {periodTotal}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mb-xl">
        <ShopItemBreakdownSection breakdown={itemBreakdown} />
      </div>

      <section className="bg-bg-surface border border-border-outline rounded-md overflow-hidden mb-xl">
        <div className="px-lg py-md border-b border-border-outline">
          <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Recent donations</h2>
          <p className="font-body text-[13px] text-text-tertiary mt-xs">
            Individual Stripe contributions - open in Dashboard for refunds.
          </p>
        </div>
        {recentDonations.length === 0 ? (
          <p className="px-lg py-xl text-center font-body text-base text-text-tertiary">
            No donations recorded yet.
          </p>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1.2fr_1fr_5rem_6rem_6.5rem_5rem] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
              {["Volunteer", "Email", "Amount", "Status", "Payment", "Stripe"].map((col) => (
                <span
                  key={col}
                  className={`font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary ${
                    col === "Volunteer" || col === "Email" ? "text-left" : "text-center"
                  }`}
                >
                  {col}
                </span>
              ))}
            </div>
            <ul role="list" className="divide-y divide-border-outline max-h-[360px] overflow-y-auto">
              {recentDonations.map((donation) => {
                const stripeUrl = stripePaymentUrl({
                  paymentReference: donation.paymentReference,
                  paymentIntentId: donation.paymentIntentId,
                });
                return (
                  <li
                    key={donation.id}
                    className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_5rem_6rem_6.5rem_5rem] gap-xs lg:gap-md lg:items-center px-lg py-md"
                  >
                    <div className="min-w-0">
                      <p className="font-body text-[14px] font-medium text-text-primary">{donation.volunteer}</p>
                      <p className="font-data text-[11px] text-text-tertiary lg:hidden">
                        {formatOrderDate(donation.createdAt)}
                      </p>
                    </div>
                    <p className="font-body text-[12px] text-text-tertiary truncate">{donation.email}</p>
                    <p className="font-data text-[13px] font-semibold text-text-primary lg:text-center">
                      {formatCents(donation.amountCents)}
                    </p>
                    <p className="font-data text-[12px] text-text-tertiary lg:text-center">
                      {paymentStatusLabel(donation.status)}
                    </p>
                    <p className="font-data text-[12px] text-text-tertiary lg:text-center truncate">
                      {formatPaymentMethodLabel(donation.paymentMethodLabel, donation.status)}
                    </p>
                    <div className="lg:flex lg:justify-center">
                      {stripeUrl ? (
                        <a
                          href={stripeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-data text-[12px] text-primary hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="font-data text-[12px] text-text-tertiary">-</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <p className="font-body text-[14px] font-medium text-text-primary">Stripe Dashboard</p>
          <p className="font-body text-[13px] text-text-tertiary">
            Manage refunds, disputes, and payout details in Stripe. Full in-app Stripe tools ship in v2.
          </p>
        </div>
        <a
          href={stripeDashboardHomeUrl(stripeTestMode)}
          target="_blank"
          rel="noopener noreferrer"
          className="interactive h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-sm shrink-0 w-full sm:w-auto"
        >
          Manage in Stripe
          <ChevronRightIcon className="w-4 h-4" color="currentColor" />
        </a>
      </div>
      </div>
    </div>
  );
}
