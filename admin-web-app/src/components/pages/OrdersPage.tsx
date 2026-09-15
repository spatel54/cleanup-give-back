"use client";

/**
 * Faithful port of `admin/app/(admin)/orders/page.tsx` + `OrdersClientShell.tsx`.
 *
 * `orders` is fetched live from the shared Supabase `shop_orders` table by
 * `admin-web-app/src/app/orders/page.tsx` (see `@/lib/live-data`), falling back to
 * `MOCK_ORDERS` when that table has no rows yet. PeriodToggle scopes the list +
 * KPIs via `filterByListPeriod` on `createdAt` (Month = rolling last 30 days).
 */
import { Suspense, useState } from "react";
import Link from "next/link";
import {
  RECEIVING_METHOD_LABELS,
  MOCK_ORDERS,
  ORDER_STATUS_CONFIG,
  formatOrderCents,
  formatOrderDate,
  normalizeOrderStatus,
  summarizeOrders,
  type OrderRow,
  type OrderStatus,
} from "@/lib/mock-data";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { PageStickyHeader } from "@/components/ui/PageStickyHeader";
import { useListPeriodLabel, usePeriodSelection } from "@/components/ui/PeriodToggleBar";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { downloadCsv, openPrintablePdf } from "@/lib/export-download";
import { filterByListPeriod } from "@/lib/dashboard-period";
import { ChevronRightIcon } from "@/components/ui/Icons";
import { formatPaymentMethodLabel, stripeDashboardHomeUrl } from "@/lib/stripe-dashboard";

const STATUS_FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrdersPage({ orders = MOCK_ORDERS, isMock = false }: { orders?: OrderRow[]; isMock?: boolean }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto">
          <div className="h-11 w-full bg-bg-surface-elevated rounded-sm animate-pulse mb-lg" />
        </div>
      }
    >
      <OrdersPageInner orders={orders} isMock={isMock} />
    </Suspense>
  );
}

function OrdersPageInner({ orders, isMock }: { orders: OrderRow[]; isMock: boolean }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const selection = usePeriodSelection();
  const rangeLabel = useListPeriodLabel();

  const periodScoped = filterByListPeriod(orders, selection);
  const summary = summarizeOrders(periodScoped);

  const needle = q.trim().toLowerCase();
  const filtered = periodScoped.filter((order) => {
    if (status !== "all" && normalizeOrderStatus(order.status) !== status) return false;
    if (!needle) return true;
    return (
      order.volunteer.toLowerCase().includes(needle) ||
      order.email.toLowerCase().includes(needle) ||
      order.id.toLowerCase().includes(needle) ||
      order.items.toLowerCase().includes(needle)
    );
  });

  const emptyMessage =
    periodScoped.length === 0
      ? `No orders in ${rangeLabel}.`
      : "No orders match these filters.";

  const exportColumns = [
    { key: "id", label: "id" },
    { key: "volunteer", label: "volunteer" },
    { key: "email", label: "email" },
    { key: "items", label: "items" },
    { key: "receiving", label: "receiving" },
    { key: "status", label: "status" },
    { key: "payment", label: "payment_method" },
    { key: "total", label: "total" },
    { key: "createdAt", label: "created_at" },
  ];
  const exportRows = filtered.map((o) => ({
    id: o.id,
    volunteer: o.volunteer,
    email: o.email,
    items: o.items,
    receiving: RECEIVING_METHOD_LABELS[o.fulfillmentMethod],
    status: normalizeOrderStatus(o.status),
    payment: formatPaymentMethodLabel(o.paymentMethodLabel, normalizeOrderStatus(o.status)),
    total: formatOrderCents(o.totalCents),
    createdAt: o.createdAt,
  }));

  return (
    <div>
      <PageStickyHeader>
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-md">
          <div className="flex items-start justify-between gap-md flex-wrap">
            <div>
              <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Shop Orders</h1>
              <p className="mt-xs font-body text-[14px] text-text-tertiary">
                Shop orders and revenue for {rangeLabel}. Refunds stay in Stripe.
              </p>
            </div>
            <ExportMenu
              onExportCsv={() => downloadCsv("orders-export", exportColumns, exportRows)}
              onExportPdf={() => openPrintablePdf("Shop orders export", exportColumns, exportRows)}
            />
          </div>
          <PeriodToggle selection={selection} />
        </div>
      </PageStickyHeader>
      <div className="max-w-6xl mx-auto">

      {isMock && <SampleDataBanner />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md mb-xl">
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[12px] tracking-[0.96px] text-text-tertiary uppercase mb-sm">Open Orders</p>
          <p className="font-data text-[28px] font-semibold text-text-primary">{summary.open}</p>
          <p className="font-body text-[13px] text-text-tertiary mt-xs">{rangeLabel}</p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[12px] tracking-[0.96px] text-text-tertiary uppercase mb-sm">Total Orders</p>
          <p className="font-data text-[28px] font-semibold text-text-primary">{summary.total}</p>
          <p className="font-body text-[13px] text-text-tertiary mt-xs">{rangeLabel}</p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg sm:col-span-2 lg:col-span-1">
          <p className="font-data text-[12px] tracking-[0.96px] text-text-tertiary uppercase mb-sm">Revenue</p>
          <p className="font-data text-[28px] font-semibold text-text-primary">
            {formatOrderCents(summary.totalRevenueCents)}
          </p>
          <p className="font-body text-[13px] text-text-tertiary mt-xs">Excludes cancelled</p>
        </div>
      </div>

      <div className="flex flex-col gap-sm mb-lg lg:flex-row lg:flex-wrap lg:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by volunteer, email, or order ID…"
          className="w-full lg:w-64 lg:max-w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface font-body text-[14px] placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:shrink-0"
        />
        <div className="flex items-center gap-xs min-w-0 max-w-full overflow-x-auto pb-0.5" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={status === f.value}
              onClick={() => setStatus(f.value)}
              className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
                status === f.value
                  ? "bg-primary text-white border-primary"
                  : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="lg:ml-auto font-body text-[14px] text-text-tertiary self-start lg:self-center shrink-0">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[1.4fr_1fr_7.5rem_5rem_6.5rem] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
          {["Volunteer", "Items", "Date", "Total", "Status"].map((col) => (
            <span
              key={col}
              className={`font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary ${
                col === "Volunteer" || col === "Items" ? "text-left" : "text-center"
              }`}
            >
              {col}
            </span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="px-lg py-xl text-center font-body text-base text-text-tertiary">{emptyMessage}</p>
        ) : (
          <ul role="list" className="divide-y divide-border-outline">
            {filtered.map((order) => {
              const cfg = ORDER_STATUS_CONFIG[normalizeOrderStatus(order.status)];
              return (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_7.5rem_5rem_6.5rem] gap-xs lg:gap-md lg:items-center px-lg py-md hover:bg-bg-surface-elevated transition-colors no-underline text-inherit"
                    aria-label={`View order for ${order.volunteer}`}
                  >
                    <div className="min-w-0">
                      <p className="font-body text-[14px] font-medium text-text-primary hover:text-primary">
                        {order.volunteer}
                      </p>
                      <p className="font-body text-[12px] text-text-tertiary">{order.email}</p>
                      <p className="font-data text-[11px] text-text-tertiary mt-0.5">
                        {RECEIVING_METHOD_LABELS[order.fulfillmentMethod]}
                        {order.includesKit ? '' : ' · no kit'}
                      </p>
                    </div>
                    <span className="font-data text-[13px] text-text-tertiary lg:whitespace-nowrap lg:truncate min-w-0">
                      <span className="lg:hidden text-text-tertiary/70">Items </span>
                      {order.items}
                    </span>
                    <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap lg:text-center">
                      <span className="lg:hidden text-text-tertiary/70">Date </span>
                      {formatOrderDate(order.createdAt)}
                    </span>
                    <span className="font-data text-[13px] font-semibold text-text-primary whitespace-nowrap lg:text-center">
                      {formatOrderCents(order.totalCents)}
                    </span>
                    <div className="lg:flex lg:justify-center">
                      <span
                        className={`inline-flex font-data text-[11px] font-semibold px-sm py-xs rounded-sm border whitespace-nowrap w-fit ${cfg.className}`}
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

      <div className="mt-xl bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <p className="font-body text-[14px] font-medium text-text-primary">Stripe Dashboard</p>
          <p className="font-body text-[13px] text-text-tertiary">
            Manage refunds, disputes, and payout details in Stripe.
          </p>
        </div>
        <a
          href={stripeDashboardHomeUrl()}
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
