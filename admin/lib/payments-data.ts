import {
  addDays,
  addWeeks,
  addYears,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfYear,
  subYears,
} from 'date-fns';
import { createDataClient } from '@/lib/supabase/server';
import {
  buildMockMonthlyRevenue,
  formatCents,
  type MonthlyRevenuePoint,
} from '@/lib/payments-mock';
import {
  SHOP_ITEM_CATALOG,
  shopItemBarColor,
  type ShopItemBreakdown,
  type ShopItemBreakdownRow,
  type ShopItemId,
} from '@/lib/shop-catalog';

export type { ShopItemBreakdown, ShopItemBreakdownRow, ShopItemId };
export { SHOP_ITEM_CATALOG, shopItemBarColor };

export type PaymentsSummary = {
  monthLabel: string;
  donationsThisMonthCents: number;
  shopThisMonthCents: number;
  totalThisMonthCents: number;
  monthly: MonthlyRevenuePoint[];
  /** True when shop revenue this month came from `shop_orders` rows. */
  shopFromDb: boolean;
  /** True when donations this month came from `donations` rows. */
  donationsFromDb: boolean;
};

function monthBounds(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

function monthLabel(now: Date) {
  return now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Payments summary for Admin. Prefers live `donations` / `shop_orders` rows
 * for the current month, falling back to fixtures when either table is empty
 * (no writer for `donations` yet — mobile Donate flow is still local/mock
 * until Stripe ships, see `admin/db/006_donations.sql`).
 */
export async function loadPaymentsSummary(now = new Date()): Promise<PaymentsSummary> {
  const monthly = buildMockMonthlyRevenue(now);
  const current = monthly[monthly.length - 1]!;
  const { start, end } = monthBounds(now);

  let shopThisMonthCents = current.shopCents;
  let shopFromDb = false;
  let donationsThisMonthCents = current.donationsCents;
  let donationsFromDb = false;

  try {
    const supabase = await createDataClient();
    const [{ data: orders }, { data: donations }] = await Promise.all([
      supabase
        .from('shop_orders')
        .select('total_cents, status, created_at')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .neq('status', 'cancelled'),
      supabase
        .from('donations')
        .select('amount_cents, status, created_at')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .eq('status', 'succeeded'),
    ]);

    if (orders && orders.length > 0) {
      shopThisMonthCents = orders.reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
      shopFromDb = true;
    }
    if (donations && donations.length > 0) {
      donationsThisMonthCents = donations.reduce((sum, d) => sum + (d.amount_cents ?? 0), 0);
      donationsFromDb = true;
    }
    if (shopFromDb || donationsFromDb) {
      monthly[monthly.length - 1] = {
        ...current,
        shopCents: shopThisMonthCents,
        donationsCents: donationsThisMonthCents,
      };
    }
  } catch {
    // Table missing or RLS — keep mock series.
  }

  return {
    monthLabel: monthLabel(now),
    donationsThisMonthCents,
    shopThisMonthCents,
    totalThisMonthCents: donationsThisMonthCents + shopThisMonthCents,
    monthly,
    shopFromDb,
    donationsFromDb,
  };
}

export { formatCents };

export type BreakdownGranularity = 'day' | 'week' | 'year';

/**
 * Pick chart bucket size from the page period — no Day/Week/Year UI.
 * Short windows → daily bars; medium → weekly; long → yearly.
 */
export function breakdownGranularityForPeriod(
  period: 'day' | 'month' | '30d' | 'year' | 'all' | 'custom',
  interval: { start: Date; end: Date } | null,
): BreakdownGranularity {
  switch (period) {
    case 'day':
      return 'day';
    case 'month':
    case '30d':
      return 'week';
    case 'year':
    case 'all':
      return 'year';
    case 'custom': {
      if (!interval) return 'week';
      const days =
        Math.round((interval.end.getTime() - interval.start.getTime()) / 86_400_000) + 1;
      if (days <= 14) return 'day';
      if (days <= 120) return 'week';
      return 'year';
    }
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

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

function bucketStart(d: Date, granularity: BreakdownGranularity): Date {
  if (granularity === 'day') return startOfDay(d);
  if (granularity === 'week') return startOfWeek(d, { weekStartsOn: 1 });
  return startOfYear(d);
}

function bucketKey(d: Date, granularity: BreakdownGranularity): string {
  if (granularity === 'day') return format(d, 'yyyy-MM-dd');
  if (granularity === 'week') return format(d, "yyyy-'W'II");
  return format(d, 'yyyy');
}

function bucketLabel(d: Date, granularity: BreakdownGranularity): string {
  if (granularity === 'day') return format(d, 'MMM d');
  if (granularity === 'week') return `Wk of ${format(d, 'MMM d')}`;
  return format(d, 'yyyy');
}

function nextBucket(d: Date, granularity: BreakdownGranularity): Date {
  if (granularity === 'day') return addDays(d, 1);
  if (granularity === 'week') return addWeeks(d, 1);
  return addYears(d, 1);
}

/** Deterministic mock donation total for a bucket — stable across renders. */
function mockDonationCentsForBucket(d: Date, granularity: BreakdownGranularity): number {
  const dayIndex = Math.floor(d.getTime() / 86_400_000);
  const base = granularity === 'day' ? 1_800 : granularity === 'week' ? 9_800 : 145_000;
  const variance = ((dayIndex % 7) - 3) * (base * 0.08);
  return Math.max(0, Math.round(base + variance));
}

const MAX_BUCKETS = 366;

/**
 * Donation + shop revenue broken down by day, week, or year across an
 * arbitrary interval (backing the Payments datepicker). Prefers live
 * `donations` / `shop_orders` rows in range, falling back to deterministic
 * donation fixtures only when the `donations` table has no rows at all in
 * the window (no writer yet — see `admin/db/006_donations.sql`).
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
        .from('shop_orders')
        .select('total_cents, created_at, status')
        .gte('created_at', scoped.start.toISOString())
        .lte('created_at', scoped.end.toISOString())
        .neq('status', 'cancelled'),
      supabase
        .from('donations')
        .select('amount_cents, created_at, status')
        .gte('created_at', scoped.start.toISOString())
        .lte('created_at', scoped.end.toISOString())
        .eq('status', 'succeeded'),
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
    // Table missing or RLS — keep shop series at 0 and donations on fixtures.
  }

  const buckets = new Map<string, BreakdownRow>();
  let cursor = bucketStart(scoped.start, granularity);
  let guard = 0;
  while (cursor.getTime() <= scoped.end.getTime() && guard < MAX_BUCKETS) {
    const key = bucketKey(cursor, granularity);
    buckets.set(key, {
      key,
      label: bucketLabel(cursor, granularity),
      donationsCents: donationsFromDb ? 0 : mockDonationCentsForBucket(cursor, granularity),
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

function resolveShopItemId(raw: {
  id?: unknown;
  name?: unknown;
  productId?: unknown;
}): ShopItemId | null {
  const idHint = String(raw.id ?? raw.productId ?? '')
    .trim()
    .toLowerCase();
  if (idHint) {
    const byId = SHOP_ITEM_CATALOG.find((p) => p.id === idHint);
    if (byId) return byId.id;
  }
  const name = String(raw.name ?? '').trim();
  if (!name) return null;
  for (const product of SHOP_ITEM_CATALOG) {
    if (product.match.some((re) => re.test(name))) return product.id;
  }
  return null;
}

function parseLineQty(raw: Record<string, unknown>): number {
  const qty = Number(raw.qty ?? raw.quantity ?? 0);
  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
}

function parseLineUnitCents(raw: Record<string, unknown>, fallback: number): number {
  if (typeof raw.unitCents === 'number' && Number.isFinite(raw.unitCents)) {
    return Math.max(0, Math.round(raw.unitCents));
  }
  if (typeof raw.unit_cents === 'number' && Number.isFinite(raw.unit_cents)) {
    return Math.max(0, Math.round(raw.unit_cents));
  }
  if (typeof raw.unitPrice === 'number' && Number.isFinite(raw.unitPrice)) {
    return Math.max(0, Math.round(raw.unitPrice * 100));
  }
  if (typeof raw.price === 'number' && Number.isFinite(raw.price)) {
    // Treat values ≥ 100 as already-cents; smaller as dollars.
    return raw.price >= 100 ? Math.round(raw.price) : Math.round(raw.price * 100);
  }
  return fallback;
}

function emptyItemTallies(): Record<ShopItemId, { qty: number; revenueCents: number }> {
  return {
    'cleanup-kit': { qty: 0, revenueCents: 0 },
    'tote-bags': { qty: 0, revenueCents: 0 },
    'trash-grabber': { qty: 0, revenueCents: 0 },
    'adult-safety-vest': { qty: 0, revenueCents: 0 },
    'child-safety-vest': { qty: 0, revenueCents: 0 },
  };
}

/** Deterministic mock sales mix when `shop_orders.items` is empty / unavailable. */
function mockItemTallies(now: Date): Record<ShopItemId, { qty: number; revenueCents: number }> {
  const seed = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const baseQty: Record<ShopItemId, number> = {
    'cleanup-kit': 18 + (seed % 5),
    'tote-bags': 42 + (seed % 7),
    'trash-grabber': 11 + (seed % 4),
    'adult-safety-vest': 15 + (seed % 3),
    'child-safety-vest': 8 + (seed % 3),
  };
  const tallies = emptyItemTallies();
  for (const product of SHOP_ITEM_CATALOG) {
    const qty = baseQty[product.id];
    tallies[product.id] = {
      qty,
      revenueCents: qty * product.unitCents,
    };
  }
  return tallies;
}

function accumulateItemsJson(
  items: unknown,
  tallies: Record<ShopItemId, { qty: number; revenueCents: number }>,
): boolean {
  if (!Array.isArray(items)) return false;
  let matched = false;
  for (const entry of items) {
    if (!entry || typeof entry !== 'object') continue;
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
): ShopItemBreakdown {
  const totalRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + tallies[p.id].revenueCents,
    0,
  );
  const totalQty = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + tallies[p.id].qty, 0);

  const unsorted: ShopItemBreakdownRow[] = SHOP_ITEM_CATALOG.map((p) => {
    const { qty, revenueCents } = tallies[p.id];
    return {
      id: p.id,
      label: p.label,
      unitCents: p.unitCents,
      qtySold: qty,
      revenueCents,
      sharePct: totalRevenueCents > 0 ? Math.round((revenueCents / totalRevenueCents) * 100) : 0,
      rankByQty: 0,
    };
  });

  const byQtyDesc = [...unsorted].sort((a, b) => {
    if (b.qtySold !== a.qtySold) return b.qtySold - a.qtySold;
    return b.revenueCents - a.revenueCents;
  });
  byQtyDesc.forEach((row, i) => {
    row.rankByQty = i + 1;
  });

  const rows = byQtyDesc;
  const withSales = rows.filter((r) => r.qtySold > 0);
  return {
    rows,
    totalQty,
    totalRevenueCents,
    mostBought: withSales[0] ?? null,
    leastBought: withSales.length > 0 ? withSales[withSales.length - 1]! : null,
    fromDb,
  };
}

/**
 * Units sold + revenue per shop catalog item for the selected payments window.
 * Prefers live `shop_orders.items` jsonb; falls back to a deterministic mock mix.
 */
export async function loadShopItemBreakdown(
  interval: { start: Date; end: Date } | null,
  now = new Date(),
): Promise<ShopItemBreakdown> {
  const scoped = interval ?? { start: subYears(now, 1), end: now };
  const tallies = emptyItemTallies();
  let matchedAny = false;

  try {
    const supabase = await createDataClient();
    const { data } = await supabase
      .from('shop_orders')
      .select('items, status, created_at')
      .gte('created_at', scoped.start.toISOString())
      .lte('created_at', scoped.end.toISOString())
      .neq('status', 'cancelled');

    if (data) {
      for (const order of data) {
        if (accumulateItemsJson(order.items, tallies)) matchedAny = true;
      }
    }
  } catch {
    // Table missing or RLS — fall through to mock.
  }

  if (!matchedAny) {
    return finalizeItemBreakdown(mockItemTallies(now), false);
  }
  return finalizeItemBreakdown(tallies, true);
}
