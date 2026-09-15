/**
 * Period-scoped payments loaders - ported from `admin/lib/payments-data.ts`
 * so Payments KPIs / bars / shop breakdown follow PeriodToggle (`?period=`).
 */
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns";
import { createDataClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/mock-data";
import {
  SHOP_ITEM_CATALOG,
  type ShopItemBreakdown,
  type ShopItemBreakdownRow,
  type ShopItemId,
} from "@/lib/shop-catalog";
import type { DashboardPeriod } from "@/lib/dashboard-period";
import { getVolunteerDirectory, getVolunteerName } from "@/lib/volunteers";

/** Shop revenue counts only paid or fulfilled orders (excludes abandoned pending checkouts). */
const PAID_SHOP_STATUSES = ["paid", "shipped", "fulfilled", "delivered"] as const;

export { formatCents };
export type { ShopItemBreakdown, ShopItemBreakdownRow, ShopItemId };

export type BreakdownGranularity = "day" | "week" | "month" | "year";

export type BreakdownRow = {
  key: string;
  label: string;
  donationsCents: number;
  shopCents: number;
};

export type PaymentsBreakdown = {
  rows: BreakdownRow[];
  totalDonationsCents: number;
  totalShopCents: number;
  shopFromDb: boolean;
  donationsFromDb: boolean;
};

/**
 * Pick chart bucket size from the page period - short windows → daily bars;
 * medium → weekly/monthly; long → yearly.
 */
export function breakdownGranularityForPeriod(
  period: DashboardPeriod,
  interval: { start: Date; end: Date } | null,
): BreakdownGranularity {
  switch (period) {
    case "day":
      return "day";
    case "month":
      return "month";
    case "year":
    case "all":
      return "year";
    case "custom": {
      if (!interval) return "week";
      const days = Math.round((interval.end.getTime() - interval.start.getTime()) / 86_400_000) + 1;
      if (days <= 14) return "day";
      if (days <= 120) return "week";
      if (days <= 400) return "month";
      return "year";
    }
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

function bucketStart(d: Date, granularity: BreakdownGranularity): Date {
  switch (granularity) {
    case "day":
      return startOfDay(d);
    case "week":
      return startOfWeek(d, { weekStartsOn: 1 });
    case "month":
      return startOfMonth(d);
    case "year":
      return startOfYear(d);
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

function bucketKey(d: Date, granularity: BreakdownGranularity): string {
  switch (granularity) {
    case "day":
      return format(d, "yyyy-MM-dd");
    case "week":
      return format(d, "yyyy-'W'II");
    case "month":
      return format(d, "yyyy-MM");
    case "year":
      return format(d, "yyyy");
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

function bucketLabel(d: Date, granularity: BreakdownGranularity): string {
  switch (granularity) {
    case "day":
      return format(d, "MMM d");
    case "week":
      return `Wk of ${format(d, "MMM d")}`;
    case "month":
      return format(d, "MMM yyyy");
    case "year":
      return format(d, "yyyy");
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

function nextBucket(d: Date, granularity: BreakdownGranularity): Date {
  switch (granularity) {
    case "day":
      return addDays(d, 1);
    case "week":
      return addWeeks(d, 1);
    case "month":
      return addMonths(d, 1);
    case "year":
      return addYears(d, 1);
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

const MAX_BUCKETS = 366;

/**
 * Donation + shop revenue by day/week/year across the selected interval.
 * Prefers live `donations` / `shop_orders`; empty windows stay at zero.
 */
export async function loadPaymentsBreakdown(
  interval: { start: Date; end: Date } | null,
  granularity: BreakdownGranularity,
  now = new Date(),
): Promise<PaymentsBreakdown> {
  const scoped = interval ?? { start: subYears(now, 1), end: now };

  let shopOrders: { total_cents: number; created_at: string }[] = [];
  let shopFromDb = false;
  let donations: { amount_cents: number; created_at: string }[] = [];
  let donationsFromDb = false;

  try {
    const supabase = await createDataClient();
    const [{ data: orderData }, { data: donationData }] = await Promise.all([
      supabase
        .from("shop_orders")
        .select("total_cents, created_at, status")
        .gte("created_at", scoped.start.toISOString())
        .lte("created_at", scoped.end.toISOString())
        .in("status", [...PAID_SHOP_STATUSES]),
      supabase
        .from("donations")
        .select("amount_cents, created_at, status")
        .gte("created_at", scoped.start.toISOString())
        .lte("created_at", scoped.end.toISOString())
        .eq("status", "succeeded"),
    ]);
    if (orderData) {
      shopOrders = orderData;
      shopFromDb = orderData.length > 0;
    }
    if (donationData) {
      donations = donationData;
      donationsFromDb = donationData.length > 0;
    }
  } catch {
    // Table missing or RLS - keep shop and donations at 0.
  }

  const buckets = new Map<string, BreakdownRow>();
  let cursor = bucketStart(scoped.start, granularity);
  let guard = 0;
  while (cursor.getTime() <= scoped.end.getTime() && guard < MAX_BUCKETS) {
    const key = bucketKey(cursor, granularity);
    buckets.set(key, {
      key,
      label: bucketLabel(cursor, granularity),
      donationsCents: 0,
      shopCents: 0,
    });
    cursor = nextBucket(cursor, granularity);
    guard += 1;
  }

  for (const order of shopOrders) {
    const start = bucketStart(parseISO(order.created_at), granularity);
    const key = bucketKey(start, granularity);
    const existing = buckets.get(key);
    if (existing) {
      existing.shopCents += order.total_cents ?? 0;
    } else {
      buckets.set(key, {
        key,
        label: bucketLabel(start, granularity),
        donationsCents: 0,
        shopCents: order.total_cents ?? 0,
      });
    }
  }

  if (donationsFromDb) {
    for (const donation of donations) {
      const start = bucketStart(parseISO(donation.created_at), granularity);
      const key = bucketKey(start, granularity);
      const existing = buckets.get(key);
      if (existing) {
        existing.donationsCents += donation.amount_cents ?? 0;
      } else {
        buckets.set(key, {
          key,
          label: bucketLabel(start, granularity),
          donationsCents: donation.amount_cents ?? 0,
          shopCents: 0,
        });
      }
    }
  }

  const rows = [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
  const totalDonationsCents = rows.reduce((sum, r) => sum + r.donationsCents, 0);
  const totalShopCents = rows.reduce((sum, r) => sum + r.shopCents, 0);

  return { rows, totalDonationsCents, totalShopCents, shopFromDb, donationsFromDb };
}

function resolveShopItemId(raw: { id?: unknown; name?: unknown; productId?: unknown }): ShopItemId | null {
  const idHint = String(raw.id ?? raw.productId ?? "")
    .trim()
    .toLowerCase();
  if (idHint) {
    const byId = SHOP_ITEM_CATALOG.find((p) => p.id === idHint);
    if (byId) return byId.id;
  }
  const name = String(raw.name ?? "")
    .trim()
    .toLowerCase();
  if (!name) return null;
  const byLabel = SHOP_ITEM_CATALOG.find((p) => p.label.toLowerCase() === name);
  return byLabel?.id ?? null;
}

function parseLineQty(raw: Record<string, unknown>): number {
  const qty = Number(raw.qty ?? raw.quantity ?? 0);
  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
}

function parseLineUnitCents(raw: Record<string, unknown>, fallback: number): number {
  if (typeof raw.unitCents === "number" && Number.isFinite(raw.unitCents)) {
    return Math.max(0, Math.round(raw.unitCents));
  }
  if (typeof raw.unit_cents === "number" && Number.isFinite(raw.unit_cents)) {
    return Math.max(0, Math.round(raw.unit_cents));
  }
  if (typeof raw.unitPrice === "number" && Number.isFinite(raw.unitPrice)) {
    return Math.max(0, Math.round(raw.unitPrice * 100));
  }
  if (typeof raw.price === "number" && Number.isFinite(raw.price)) {
    return raw.price >= 100 ? Math.round(raw.price) : Math.round(raw.price * 100);
  }
  return fallback;
}

function emptyItemTallies(): Record<ShopItemId, { qty: number; revenueCents: number }> {
  return Object.fromEntries(SHOP_ITEM_CATALOG.map((p) => [p.id, { qty: 0, revenueCents: 0 }])) as Record<
    ShopItemId,
    { qty: number; revenueCents: number }
  >;
}

function accumulateItemsJson(
  items: unknown,
  tallies: Record<ShopItemId, { qty: number; revenueCents: number }>,
): boolean {
  if (!Array.isArray(items)) return false;
  let matched = false;
  for (const entry of items) {
    if (!entry || typeof entry !== "object") continue;
    const raw = entry as Record<string, unknown>;
    const id = resolveShopItemId(raw);
    if (!id) continue;
    const catalog = SHOP_ITEM_CATALOG.find((p) => p.id === id)!;
    const qty = parseLineQty(raw);
    if (qty <= 0) continue;
    const unitCents = parseLineUnitCents(raw, catalog.unitCents);
    tallies[id].qty += qty;
    tallies[id].revenueCents += qty * unitCents;
    matched = true;
  }
  return matched;
}

function finalizeItemBreakdown(
  tallies: Record<ShopItemId, { qty: number; revenueCents: number }>,
  fromDb: boolean,
  currentMonthTallies?: Record<ShopItemId, { qty: number; revenueCents: number }>,
  priorMonthTallies?: Record<ShopItemId, { qty: number; revenueCents: number }>,
): ShopItemBreakdown {
  const monthTallies = currentMonthTallies ?? tallies;
  const priorTallies = priorMonthTallies ?? emptyItemTallies();
  const totalRevenueCents = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + tallies[p.id].revenueCents, 0);
  const totalQty = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + tallies[p.id].qty, 0);
  const currentMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + monthTallies[p.id].revenueCents,
    0,
  );
  const priorMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + priorTallies[p.id].revenueCents,
    0,
  );
  const unsorted: ShopItemBreakdownRow[] = SHOP_ITEM_CATALOG.map((p) => {
    const { qty, revenueCents } = tallies[p.id];
    const monthRevenueCents = monthTallies[p.id].revenueCents;
    const priorRevenueCents = priorTallies[p.id].revenueCents;
    return {
      id: p.id,
      label: p.label,
      unitCents: p.unitCents,
      qtySold: qty,
      revenueCents,
      sharePct: totalRevenueCents > 0 ? Math.round((revenueCents / totalRevenueCents) * 100) : 0,
      rankByQty: 0,
      currentMonthRevenueCents: monthRevenueCents,
      currentMonthSharePct:
        currentMonthRevenueCents > 0
          ? Math.round((monthRevenueCents / currentMonthRevenueCents) * 100)
          : currentMonthRevenueCents === 0 && priorMonthRevenueCents === 0
            ? null
            : 0,
      priorRevenueCents,
      priorSharePct:
        priorMonthRevenueCents > 0
          ? Math.round((priorRevenueCents / priorMonthRevenueCents) * 100)
          : priorMonthRevenueCents === 0 && currentMonthRevenueCents === 0
            ? null
            : 0,
    };
  });
  const rows = [...unsorted].sort((a, b) => {
    if (b.qtySold !== a.qtySold) return b.qtySold - a.qtySold;
    return b.revenueCents - a.revenueCents;
  });
  rows.forEach((row, i) => {
    row.rankByQty = i + 1;
  });
  const withSales = rows.filter((r) => r.qtySold > 0);
  return {
    rows,
    totalQty,
    totalRevenueCents,
    mostBought: withSales[0] ?? null,
    leastBought: withSales.length > 0 ? withSales[withSales.length - 1]! : null,
    fromDb,
    currentMonthRevenueCents,
    priorMonthRevenueCents,
  };
}

/**
 * Units sold + revenue per catalog item for the selected payments window.
 * Also attaches calendar MoM tallies for the Revenue share card trend.
 * Empty live window or load failure → zero tallies (`useMock: false`).
 */
export async function loadShopItemBreakdown(
  interval: { start: Date; end: Date } | null,
  now = new Date(),
): Promise<{ data: ShopItemBreakdown; useMock: boolean }> {
  const scoped = interval ?? { start: subYears(now, 1), end: now };
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const priorMonthDate = subMonths(now, 1);
  const priorMonth = { start: startOfMonth(priorMonthDate), end: endOfMonth(priorMonthDate) };
  const queryStart = scoped.start < priorMonth.start ? scoped.start : priorMonth.start;
  const queryEnd = scoped.end > thisMonth.end ? scoped.end : thisMonth.end;

  const tallies = emptyItemTallies();
  const currentMonthTallies = emptyItemTallies();
  const priorMonthTallies = emptyItemTallies();
  let matchedAny = false;

  try {
    const supabase = await createDataClient();
    const { data, error } = await supabase
      .from("shop_orders")
      .select("items, status, created_at")
      .gte("created_at", queryStart.toISOString())
      .lte("created_at", queryEnd.toISOString())
      .in("status", [...PAID_SHOP_STATUSES]);

    if (!error) {
      for (const order of data ?? []) {
        let createdAt: Date | null = null;
        if (typeof order.created_at === "string") {
          try {
            createdAt = parseISO(order.created_at);
          } catch {
            createdAt = null;
          }
        }
        const inScoped =
          createdAt != null && isWithinInterval(createdAt, { start: scoped.start, end: scoped.end });
        const inCurrentMonth = createdAt != null && isWithinInterval(createdAt, thisMonth);
        const inPriorMonth = createdAt != null && isWithinInterval(createdAt, priorMonth);

        if (inScoped && accumulateItemsJson(order.items, tallies)) matchedAny = true;
        if (inCurrentMonth) accumulateItemsJson(order.items, currentMonthTallies);
        if (inPriorMonth) accumulateItemsJson(order.items, priorMonthTallies);
      }
    }
  } catch {
    // Keep empty tallies.
  }

  return {
    data: finalizeItemBreakdown(tallies, matchedAny, currentMonthTallies, priorMonthTallies),
    useMock: false,
  };
}

export type RecentDonationRow = {
  id: string;
  volunteer: string;
  email: string;
  amountCents: number;
  status: string;
  paymentMethodLabel: string | null;
  paymentReference: string | null;
  paymentIntentId: string | null;
  createdAt: string;
};

/** Latest donations for the Payments page - includes pending/failed for Stripe ops. */
export async function loadRecentDonations(limit = 20): Promise<{
  data: RecentDonationRow[];
  useMock: boolean;
}> {
  try {
    const supabase = await createDataClient();
    const { data, error } = await supabase
      .from("donations")
      .select(
        "id, user_id, amount_cents, status, payment_method_label, payment_reference, stripe_payment_intent_id, created_at, donor_email",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return { data: [], useMock: false };
    }

    const directory = await getVolunteerDirectory();
    const rows: RecentDonationRow[] = data.map((row) => {
      const entry = row.user_id ? directory.get(row.user_id) : undefined;
      return {
        id: row.id,
        volunteer: row.user_id ? getVolunteerName(directory, row.user_id) : "Unknown volunteer",
        email: entry?.email ?? row.donor_email ?? "-",
        amountCents: row.amount_cents ?? 0,
        status: row.status ?? "pending",
        paymentMethodLabel: row.payment_method_label ?? null,
        paymentReference: row.payment_reference ?? null,
        paymentIntentId: row.stripe_payment_intent_id ?? null,
        createdAt: row.created_at,
      };
    });

    return { data: rows, useMock: false };
  } catch {
    return { data: [], useMock: false };
  }
}
