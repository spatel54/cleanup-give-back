/** Mock shop order fixtures for `/orders` until live checkout ships. */

import {
  addDays,
  addWeeks,
  addYears,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfYear,
  subYears,
} from 'date-fns';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

/** Map legacy `delivered` (same as shipped) and unknown values for display/forms. */
export function normalizeOrderStatus(status: string): OrderStatus {
  if (status === 'delivered' || status === 'shipped') return 'shipped';
  if (status === 'pending' || status === 'paid' || status === 'cancelled') return status;
  return 'pending';
}

export type OrderLineItem = {
  name: string;
  qty: number;
  unitCents: number;
};

export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string | null;
};

export type OrderRow = {
  id: string;
  volunteer: string;
  email: string;
  items: string;
  lineItems: OrderLineItem[];
  totalCents: number;
  status: OrderStatus;
  tracking: string | null;
  carrier: string | null;
  shipping: ShippingAddress;
  createdAt: string;
};

function shipping(
  name: string,
  line1: string,
  city: string,
  state: string,
  postalCode: string,
  extras?: Partial<ShippingAddress>,
): ShippingAddress {
  return {
    name,
    line1,
    line2: extras?.line2 ?? null,
    city,
    state,
    postalCode,
    country: extras?.country ?? 'US',
    phone: extras?.phone ?? null,
  };
}

export const MOCK_ORDERS: OrderRow[] = [
  {
    id: 'o1',
    volunteer: 'Jordan Kim',
    email: 'jordan.k@email.com',
    items: 'Water Bottle × 1, Cap × 1',
    lineItems: [
      { name: 'Water Bottle', qty: 1, unitCents: 1999 },
      { name: 'Cap', qty: 1, unitCents: 1499 },
    ],
    totalCents: 3499,
    status: 'shipped',
    tracking: '9400111202550035000000',
    carrier: 'USPS',
    shipping: shipping('Jordan Kim', '1842 N Milwaukee Ave', 'Chicago', 'IL', '60647', {
      phone: '(312) 555-0142',
    }),
    createdAt: '2026-07-15T10:22:00Z',
  },
  {
    id: 'o2',
    volunteer: 'Devon Okafor',
    email: 'devon.o@email.com',
    items: 'Tote Bag × 2',
    lineItems: [{ name: 'Tote Bag', qty: 2, unitCents: 1499 }],
    totalCents: 2998,
    status: 'shipped',
    tracking: '9400111202550035111111',
    carrier: 'USPS',
    shipping: shipping('Devon Okafor', '2200 S Michigan Ave', 'Chicago', 'IL', '60616', {
      line2: 'Apt 4B',
      phone: '(773) 555-0198',
    }),
    createdAt: '2026-07-12T14:05:00Z',
  },
  {
    id: 'o3',
    volunteer: 'Sophia Chen',
    email: 'sophia.c@email.com',
    items: 'Cap × 1',
    lineItems: [{ name: 'Cap', qty: 1, unitCents: 1499 }],
    totalCents: 1499,
    status: 'paid',
    tracking: null,
    carrier: null,
    shipping: shipping('Sophia Chen', '55 W Erie St', 'Chicago', 'IL', '60654'),
    createdAt: '2026-07-18T09:00:00Z',
  },
  {
    id: 'o4',
    volunteer: 'Marcus Rivera',
    email: 'marcus.r@email.com',
    items: 'Water Bottle × 2, Tote Bag × 1',
    lineItems: [
      { name: 'Water Bottle', qty: 2, unitCents: 1999 },
      { name: 'Tote Bag', qty: 1, unitCents: 1499 },
    ],
    totalCents: 5497,
    status: 'pending',
    tracking: null,
    carrier: null,
    shipping: shipping('Marcus Rivera', '4707 N Broadway', 'Chicago', 'IL', '60640', {
      phone: '(872) 555-0110',
    }),
    createdAt: '2026-07-20T16:30:00Z',
  },
  {
    id: 'o5',
    volunteer: 'Luna Martinez',
    email: 'luna.m@email.com',
    items: 'Gloves × 3',
    lineItems: [{ name: 'Gloves', qty: 3, unitCents: 999 }],
    totalCents: 2997,
    status: 'shipped',
    tracking: '9400111202550035222222',
    carrier: 'UPS',
    shipping: shipping('Luna Martinez', '901 W Randolph St', 'Chicago', 'IL', '60607', {
      line2: 'Unit 12',
    }),
    createdAt: '2026-07-16T11:10:00Z',
  },
  {
    id: 'o6',
    volunteer: 'Miguel Santos',
    email: 'miguel.s@email.com',
    items: 'Water Bottle × 1',
    lineItems: [{ name: 'Water Bottle', qty: 1, unitCents: 1999 }],
    totalCents: 1999,
    status: 'shipped',
    tracking: '9400111202550035333333',
    carrier: 'USPS',
    shipping: shipping('Miguel Santos', '1300 W Belmont Ave', 'Chicago', 'IL', '60657'),
    createdAt: '2026-07-10T08:45:00Z',
  },
  {
    id: 'o7',
    volunteer: 'Fatima Hassan',
    email: 'fatima.h@email.com',
    items: 'Cap × 2, Tote Bag × 1',
    lineItems: [
      { name: 'Cap', qty: 2, unitCents: 1499 },
      { name: 'Tote Bag', qty: 1, unitCents: 1499 },
    ],
    totalCents: 4497,
    status: 'pending',
    tracking: null,
    carrier: null,
    shipping: shipping('Fatima Hassan', '233 S Wacker Dr', 'Chicago', 'IL', '60606', {
      line2: 'Floor 18',
      phone: '(312) 555-0177',
    }),
    createdAt: '2026-07-21T07:55:00Z',
  },
  {
    id: 'o8',
    volunteer: 'Tyler Washington',
    email: 'tyler.w@email.com',
    items: 'Gloves × 1',
    lineItems: [{ name: 'Gloves', qty: 1, unitCents: 999 }],
    totalCents: 999,
    status: 'cancelled',
    tracking: null,
    carrier: null,
    shipping: shipping('Tyler Washington', '1600 S Indiana Ave', 'Chicago', 'IL', '60616'),
    createdAt: '2026-07-11T13:20:00Z',
  },
];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-[#ffddb5] text-[#835400] border-[#fcab29]/40' },
  paid: { label: 'Paid', className: 'bg-[#f7fff1] text-primary border-primary/30' },
  shipped: { label: 'Shipped', className: 'bg-[#e8f4fe] text-[#1565c0] border-[#1565c0]/30' },
  cancelled: { label: 'Cancelled', className: 'bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]/30' },
};

export function formatOrderCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShippingAddress(addr: ShippingAddress): string {
  const lines = [
    addr.name,
    addr.line1,
    addr.line2?.trim() || null,
    `${addr.city}, ${addr.state} ${addr.postalCode}`,
    addr.country !== 'US' ? addr.country : null,
  ].filter(Boolean);
  return lines.join('\n');
}

export function trackingUrl(carrier: string | null, tracking: string | null): string | null {
  if (!tracking) return null;
  const code = tracking.trim();
  const c = (carrier ?? '').toUpperCase();
  if (c.includes('UPS')) return `https://www.ups.com/track?tracknum=${encodeURIComponent(code)}`;
  if (c.includes('FEDEX')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(code)}`;
  // Default to USPS
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(code)}`;
}

export function getOrderById(id: string): OrderRow | null {
  return MOCK_ORDERS.find((o) => o.id === id) ?? null;
}

export type OrdersSummary = {
  open: number;
  total: number;
  totalRevenueCents: number;
};

/** Static summary for the dashboard preview card and the Orders page header. */
export function loadOrdersSummary(): OrdersSummary {
  const open = MOCK_ORDERS.filter((o) => ['pending', 'paid', 'shipped'].includes(o.status)).length;
  const totalRevenueCents = MOCK_ORDERS.filter((o) => o.status !== 'cancelled').reduce(
    (sum, o) => sum + o.totalCents,
    0,
  );
  return { open, total: MOCK_ORDERS.length, totalRevenueCents };
}

const OPEN_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped'];

/** Newest open orders for the Today dashboard preview table (max `limit`). */
export function loadOpenOrdersPreview(limit = 4): OrderRow[] {
  return MOCK_ORDERS.filter((o) => OPEN_STATUSES.includes(o.status))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export type OrdersBreakdownGranularity = 'day' | 'week' | 'year';

export type OrdersBreakdownRow = {
  key: string;
  label: string;
  orderCount: number;
  revenueCents: number;
};

export type OrdersStatusBar = {
  name: string;
  value: number;
  color: string;
};

export type OrdersBreakdown = {
  rows: OrdersBreakdownRow[];
  statusBars: OrdersStatusBar[];
  open: number;
  total: number;
  totalRevenueCents: number;
};

const STATUS_BAR_META: Record<OrderStatus, { name: string; color: string }> = {
  pending: { name: 'Pending', color: '#fcab29' },
  paid: { name: 'Paid', color: '#007536' },
  shipped: { name: 'Shipped', color: '#1565c0' },
  cancelled: { name: 'Cancelled', color: '#ba1a1a' },
};

function bucketStart(d: Date, granularity: OrdersBreakdownGranularity): Date {
  if (granularity === 'day') return startOfDay(d);
  if (granularity === 'week') return startOfWeek(d, { weekStartsOn: 1 });
  return startOfYear(d);
}

function bucketKey(d: Date, granularity: OrdersBreakdownGranularity): string {
  if (granularity === 'day') return format(d, 'yyyy-MM-dd');
  if (granularity === 'week') return format(d, "yyyy-'W'II");
  return format(d, 'yyyy');
}

function bucketLabel(d: Date, granularity: OrdersBreakdownGranularity): string {
  if (granularity === 'day') return format(d, 'MMM d');
  if (granularity === 'week') return `Wk of ${format(d, 'MMM d')}`;
  return format(d, 'yyyy');
}

function nextBucket(d: Date, granularity: OrdersBreakdownGranularity): Date {
  if (granularity === 'day') return addDays(d, 1);
  if (granularity === 'week') return addWeeks(d, 1);
  return addYears(d, 1);
}

export function ordersBreakdownGranularity(
  period: string,
  interval: { start: Date; end: Date } | null,
): OrdersBreakdownGranularity {
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
      const days = Math.round((interval.end.getTime() - interval.start.getTime()) / 86_400_000) + 1;
      if (days <= 14) return 'day';
      if (days <= 120) return 'week';
      return 'year';
    }
    default:
      return 'week';
  }
}

const MAX_BUCKETS = 366;

/**
 * Mock shop-order revenue + counts by day/week/year for the Orders page charts.
 * Filters cancelled orders out of revenue (they still count in status bars).
 */
export function loadOrdersBreakdown(
  interval: { start: Date; end: Date } | null,
  granularity: OrdersBreakdownGranularity,
  now = new Date(),
): OrdersBreakdown {
  const scoped = interval ?? { start: subYears(now, 1), end: now };
  const inRange = MOCK_ORDERS.filter((o) => {
    try {
      return isWithinInterval(parseISO(o.createdAt), scoped);
    } catch {
      return false;
    }
  });

  const buckets = new Map<string, OrdersBreakdownRow>();
  let cursor = bucketStart(scoped.start, granularity);
  let guard = 0;
  while (cursor.getTime() <= scoped.end.getTime() && guard < MAX_BUCKETS) {
    const key = bucketKey(cursor, granularity);
    buckets.set(key, {
      key,
      label: bucketLabel(cursor, granularity),
      orderCount: 0,
      revenueCents: 0,
    });
    cursor = nextBucket(cursor, granularity);
    guard += 1;
  }

  for (const order of inRange) {
    const start = bucketStart(parseISO(order.createdAt), granularity);
    const key = bucketKey(start, granularity);
    const existing = buckets.get(key);
    if (!existing) continue;
    existing.orderCount += 1;
    if (order.status !== 'cancelled') {
      existing.revenueCents += order.totalCents;
    }
  }

  const statusCounts: Record<OrderStatus, number> = {
    pending: 0,
    paid: 0,
    shipped: 0,
    cancelled: 0,
  };
  for (const order of inRange) {
    statusCounts[normalizeOrderStatus(order.status)] += 1;
  }

  const statusBars: OrdersStatusBar[] = (Object.keys(STATUS_BAR_META) as OrderStatus[]).map(
    (status) => ({
      name: STATUS_BAR_META[status].name,
      value: statusCounts[status],
      color: STATUS_BAR_META[status].color,
    }),
  );

  const open = inRange.filter((o) => OPEN_STATUSES.includes(o.status)).length;
  const totalRevenueCents = inRange
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalCents, 0);

  return {
    rows: [...buckets.values()],
    statusBars,
    open,
    total: inRange.length,
    totalRevenueCents,
  };
}
