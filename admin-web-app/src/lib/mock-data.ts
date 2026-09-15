/**
 * Mock fixtures ported verbatim from the real admin app's built-in demo data
 * (used there when Supabase is empty), since web-app has no database connection:
 * - `admin/lib/dashboard-mock.ts` (MOCK_SESSIONS, MOCK_COURT_AT_RISK, MOCK_FEEDBACK_AVG, MOCK_OPEN_ORDERS)
 * - `admin/lib/orders-data.ts` (MOCK_ORDERS, ORDER_STATUS_CONFIG, format helpers)
 * - `admin/app/(admin)/feedback/page.tsx` (MOCK_FEEDBACK, EMOJI_MAP)
 */

import { format, parseISO } from "date-fns";
import { inInterval, type DateInterval } from "@/lib/dashboard-period";

export type MockSession = {
  id: string;
  user_id: string;
  volunteer_name: string;
  /** Volunteer's account-level classification (Court Ordered / Volunteering / School / Other), if synced. */
  volunteer_service_type?: string | null;
  activity: string | null;
  /** Matches admin `SessionStatus` + live Supabase rows (`active` while tracking). */
  status: "active" | "approved" | "under_review" | "not_approved" | "invalid";
  duration_seconds: number | null;
  adjusted_hours: number | null;
  court_ordered: boolean;
  distance_miles: number | null;
  started_at: string;
  ended_at: string;
  created_at: string;
  /** US state FIPS code - powers the simplified state-activity heatmap. */
  state_fips: string;
  /** True when `state_fips` is a fallback (no GPS route/checkpoint on the session) rather than geocoded. */
  state_fips_placeholder?: boolean;
  /** US county FIPS code (5-digit), when geocoded - powers the heatmap's county drill-down. */
  county_fips?: string | null;
  /** Geocoded WGS84 point (session's first route point, or a checkpoint pin) - powers the
   *  heatmap's census-tract drill-down, computed client-side once tract boundaries load. */
  latitude?: number | null;
  longitude?: number | null;
  /** Internal-only note, never shown to the volunteer. Optional - not set on the base fixtures. */
  admin_notes?: string | null;
  /** Populated when `declineSession` is called with a reason. */
  decline_reason?: string | null;
  letterhead_generated_at?: string | null;
};

export const MOCK_SESSIONS: MockSession[] = [
  { id: "m1", user_id: "u1", volunteer_name: "Maya Chen", activity: "Park Cleanup", status: "approved", duration_seconds: 5400, adjusted_hours: null, court_ordered: false, distance_miles: 2.3, started_at: "2026-07-14T09:00:00Z", ended_at: "2026-07-14T10:30:00Z", created_at: "2026-07-14T10:35:00Z", state_fips: "17" },
  { id: "m2", user_id: "u2", volunteer_name: "Jordan Lee", activity: "Beach Cleanup", status: "approved", duration_seconds: 7200, adjusted_hours: null, court_ordered: true, distance_miles: 3.1, started_at: "2026-07-13T08:30:00Z", ended_at: "2026-07-13T10:30:00Z", created_at: "2026-07-13T10:40:00Z", state_fips: "17" },
  { id: "m3", user_id: "u3", volunteer_name: "Isaiah Grant", activity: "Trail Cleanup", status: "under_review", duration_seconds: 3600, adjusted_hours: null, court_ordered: false, distance_miles: 1.8, started_at: "2026-07-12T10:00:00Z", ended_at: "2026-07-12T11:00:00Z", created_at: "2026-07-12T11:05:00Z", state_fips: "17" },
  { id: "m4", user_id: "u4", volunteer_name: "Priya Nair", activity: "Neighborhood Cleanup", status: "approved", duration_seconds: 4500, adjusted_hours: null, court_ordered: true, distance_miles: 2.0, started_at: "2026-07-11T09:00:00Z", ended_at: "2026-07-11T10:15:00Z", created_at: "2026-07-11T10:20:00Z", state_fips: "17" },
  { id: "m5", user_id: "u5", volunteer_name: "Sam Ortiz", activity: "River Cleanup", status: "not_approved", duration_seconds: 2700, adjusted_hours: null, court_ordered: false, distance_miles: 1.2, started_at: "2026-07-10T11:00:00Z", ended_at: "2026-07-10T11:45:00Z", created_at: "2026-07-10T11:50:00Z", state_fips: "17" },
  { id: "m6", user_id: "u1", volunteer_name: "Maya Chen", activity: "Park Cleanup", status: "approved", duration_seconds: 6300, adjusted_hours: null, court_ordered: false, distance_miles: 2.8, started_at: "2026-07-09T08:00:00Z", ended_at: "2026-07-09T09:45:00Z", created_at: "2026-07-09T09:50:00Z", state_fips: "17" },
  { id: "m7", user_id: "u6", volunteer_name: "Nadia Flores", activity: "Beach Cleanup", status: "under_review", duration_seconds: 3900, adjusted_hours: null, court_ordered: true, distance_miles: 1.5, started_at: "2026-07-08T09:30:00Z", ended_at: "2026-07-08T10:35:00Z", created_at: "2026-07-08T10:40:00Z", state_fips: "17" },
  { id: "m8", user_id: "u7", volunteer_name: "Tyler Washington", activity: "Highway Litter Pick", status: "approved", duration_seconds: 5100, adjusted_hours: 2.0, court_ordered: true, distance_miles: 3.5, started_at: "2026-07-07T07:00:00Z", ended_at: "2026-07-07T08:25:00Z", created_at: "2026-07-07T08:30:00Z", state_fips: "18" },
  { id: "m9", user_id: "u8", volunteer_name: "Alex Rivera", activity: "Trail Cleanup", status: "approved", duration_seconds: 4200, adjusted_hours: null, court_ordered: false, distance_miles: 2.1, started_at: "2026-07-06T10:00:00Z", ended_at: "2026-07-06T11:10:00Z", created_at: "2026-07-06T11:15:00Z", state_fips: "55" },
  { id: "m10", user_id: "u9", volunteer_name: "Aaliyah Brooks", activity: "Neighborhood Cleanup", status: "under_review", duration_seconds: 3300, adjusted_hours: null, court_ordered: false, distance_miles: 1.7, started_at: "2026-07-05T09:00:00Z", ended_at: "2026-07-05T09:55:00Z", created_at: "2026-07-05T10:00:00Z", state_fips: "17" },
  { id: "m11", user_id: "u2", volunteer_name: "Jordan Lee", activity: "Park Cleanup", status: "approved", duration_seconds: 7800, adjusted_hours: null, court_ordered: true, distance_miles: 4.0, started_at: "2026-07-04T08:00:00Z", ended_at: "2026-07-04T10:10:00Z", created_at: "2026-07-04T10:15:00Z", state_fips: "26" },
  { id: "m12", user_id: "u10", volunteer_name: "Chris Park", activity: "River Cleanup", status: "not_approved", duration_seconds: 600, adjusted_hours: null, court_ordered: false, distance_miles: 0.3, started_at: "2026-07-03T12:00:00Z", ended_at: "2026-07-03T12:10:00Z", created_at: "2026-07-03T12:12:00Z", state_fips: "17" },
];

/**
 * Insights-only fixtures: same mix as `MOCK_SESSIONS`, but timestamps are shifted
 * relative to `now` so PeriodToggle (default Today) still fills every chart.
 * Day 0 gets approved / under_review / declined + court + multi-state coverage.
 * Does not affect Dashboard/Sessions - those keep empty-real lists.
 */
export function buildInsightsMockSessions(now = new Date()): MockSession[] {
  /** Days before today - first four land on “today” for a dense Today view. */
  const dayOffsets = [0, 0, 0, 1, 0, 2, 3, 4, 5, 6, 8, 10] as const;
  const hourSlots = [9, 11, 13, 15] as const;

  return MOCK_SESSIONS.map((session, index) => {
    const offset = dayOffsets[index] ?? index;
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);

    const slot = hourSlots[index % hourSlots.length]!;
    const started = new Date(day);
    started.setHours(slot, 0, 0, 0);
    const durationMs = (session.duration_seconds ?? 3600) * 1000;
    const ended = new Date(started.getTime() + durationMs);
    const created = new Date(ended.getTime() + 5 * 60 * 1000);

    return {
      ...session,
      id: `insights-${session.id}`,
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      created_at: created.toISOString(),
    };
  });
}

/** State FIPS → display name, subset used by mock session fixtures. Mirrors `admin/lib/us-heatmap.ts`. */
export const STATE_FIPS_NAME: Record<string, string> = {
  "17": "Illinois",
  "18": "Indiana",
  "55": "Wisconsin",
  "26": "Michigan",
};

/** Heat color ramp - mirrors `admin/lib/us-heatmap.ts` `heatFill`/`heatText`. */
export function heatFill(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity));
  if (t <= 0) return "#f0eded";
  if (t < 0.25) return "#dcefe0";
  if (t < 0.5) return "#7fb089";
  if (t < 0.75) return "#3d8f5c";
  return "#007536";
}

export function heatText(intensity: number): string {
  return intensity >= 0.5 ? "#ffffff" : "#1c1b1b";
}

export type StateActivity = { fips: string; name: string; sessionCount: number; hours: number };

/** Session counts grouped by state - feeds the simplified US activity heatmap. */
export function loadStateActivity(sessions: MockSession[] = MOCK_SESSIONS): StateActivity[] {
  const map = new Map<string, StateActivity>();
  for (const s of sessions) {
    const cur = map.get(s.state_fips) ?? {
      fips: s.state_fips,
      name: STATE_FIPS_NAME[s.state_fips] ?? `State ${s.state_fips}`,
      sessionCount: 0,
      hours: 0,
    };
    cur.sessionCount += 1;
    cur.hours += computedHours(s.duration_seconds, s.adjusted_hours);
    map.set(s.state_fips, cur);
  }
  return [...map.values()].sort((a, b) => b.sessionCount - a.sessionCount);
}

/**
 * `GeoActivityBundle` for the real drill-down `UsHeatmap` (`admin/lib/us-heatmap.ts` shape).
 * County stats only populate for sessions carrying a geocoded `county_fips` (live sessions
 * with GPS route/checkpoint data); mock fixtures and ungeocoded live sessions only have
 * state-level FIPS, so the county tier stays empty for those - same as neighborhoods, which
 * `UsHeatmap` derives client-side from the schematic Cook County tile set, not from here.
 */
export function buildGeoActivity(sessions: MockSession[] = MOCK_SESSIONS): {
  byState: { id: string; name: string; sessionCount: number; hours: number; underReview: number }[];
  byCounty: { id: string; name: string; sessionCount: number; hours: number; underReview: number }[];
  byNeighborhood: { id: string; name: string; sessionCount: number; hours: number; underReview: number }[];
} {
  type Bucket = { id: string; name: string; sessionCount: number; hours: number; underReview: number };
  const byState = new Map<string, Bucket>();
  const byCounty = new Map<string, Bucket>();

  for (const s of sessions) {
    const hours = computedHours(s.duration_seconds, s.adjusted_hours);
    const underReview = s.status === "under_review" ? 1 : 0;

    const stateBucket = byState.get(s.state_fips) ?? {
      id: s.state_fips,
      name: STATE_FIPS_NAME[s.state_fips] ?? `State ${s.state_fips}`,
      sessionCount: 0,
      hours: 0,
      underReview: 0,
    };
    stateBucket.sessionCount += 1;
    stateBucket.hours += hours;
    stateBucket.underReview += underReview;
    byState.set(s.state_fips, stateBucket);

    if (s.county_fips) {
      const countyBucket = byCounty.get(s.county_fips) ?? {
        id: s.county_fips,
        name: `County ${s.county_fips}`,
        sessionCount: 0,
        hours: 0,
        underReview: 0,
      };
      countyBucket.sessionCount += 1;
      countyBucket.hours += hours;
      countyBucket.underReview += underReview;
      byCounty.set(s.county_fips, countyBucket);
    }
  }

  return { byState: [...byState.values()], byCounty: [...byCounty.values()], byNeighborhood: [] };
}

export type NamedBar = { name: string; value: number; color: string };

export type QueueAgeBucket = NamedBar & { sessions: MockSession[] };

function queueWaitDays(createdAt: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / 86_400_000));
}

/** Days under-review items have waited - mirrors `admin/lib/dashboard-charts.ts` `buildQueueAgeBars`. */
export function buildQueueAgeBars(underReview: { created_at: string }[], now = new Date()): NamedBar[] {
  return buildQueueAgeBuckets(underReview as MockSession[], now).map(({ name, value, color }) => ({
    name,
    value,
    color,
  }));
}

/** Queue age buckets with the sessions in each - for drill-down on the dashboard. */
export function buildQueueAgeBuckets(underReview: MockSession[], now = new Date()): QueueAgeBucket[] {
  const specs = [
    { name: '≤1 day', min: 0, max: 1, color: '#007536' },
    { name: '2–3 days', min: 2, max: 3, color: '#5a8f3a' },
    { name: '4–7 days', min: 4, max: 7, color: '#835400' },
    { name: '8+ days', min: 8, max: Infinity, color: '#ba1a1a' },
  ] as const;

  const buckets: QueueAgeBucket[] = specs.map((spec) => ({
    name: spec.name,
    color: spec.color,
    value: 0,
    sessions: [],
  }));

  for (const s of underReview) {
    const days = queueWaitDays(s.created_at, now);
    const index = specs.findIndex((spec) => days >= spec.min && days <= spec.max);
    if (index >= 0) buckets[index]!.sessions.push(s);
  }

  for (const bucket of buckets) {
    bucket.sessions.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    bucket.value = bucket.sessions.length;
  }

  return buckets;
}

export type TrendPoint = {
  key: string;
  label: string;
  submissions: number;
  approvedHours: number;
  approved: number;
  declined: number;
};

/** Weekly submissions + approved hours series - mirrors `admin/lib/dashboard-charts.ts` `buildTrendSeries`. */
export function buildTrendSeries(sessions: MockSession[]): TrendPoint[] {
  const byWeekStart = new Map<string, TrendPoint>();
  for (const s of sessions) {
    const when = new Date(s.created_at);
    const weekStart = new Date(when);
    weekStart.setUTCDate(when.getUTCDate() - when.getUTCDay());
    const key = weekStart.toISOString().slice(0, 10);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    const point = byWeekStart.get(key) ?? { key, label, submissions: 0, approvedHours: 0, approved: 0, declined: 0 };
    point.submissions += 1;
    if (s.status === "approved") {
      point.approved += 1;
      point.approvedHours += computedHours(s.duration_seconds, s.adjusted_hours);
    } else if (s.status === "not_approved") {
      point.declined += 1;
    }
    byWeekStart.set(key, point);
  }
  return [...byWeekStart.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function computedHours(seconds: number | null, adjustedHours: number | null): number {
  if (adjustedHours != null) return adjustedHours;
  if (!seconds) return 0;
  return seconds / 3600;
}

/** Page-level empty→fixture for Insights/Analytics only (not Sessions loaders). */
export function resolveInsightsFixtures(
  liveSessions: MockSession[],
  now = new Date(),
  /** When set, fixtures also apply if no live sessions fall in this window (e.g. Today). Pass null for All time. */
  periodInterval: DateInterval | null = null,
): { sessions: MockSession[]; isMock: boolean } {
  const sessionsEmpty = liveSessions.length === 0;
  const liveInPeriod =
    periodInterval == null
      ? liveSessions
      : liveSessions.filter((s) => inInterval(s.ended_at ?? s.started_at ?? s.created_at, periodInterval));
  const periodEmpty = liveInPeriod.length === 0;
  const useSessionFixtures = sessionsEmpty || (periodInterval != null && periodEmpty);
  return {
    sessions: useSessionFixtures ? buildInsightsMockSessions(now) : liveSessions,
    isMock: useSessionFixtures,
  };
}

/** Period decision mix - mirrors `admin/lib/dashboard-charts.ts` `buildDecisionBars`. */
export function buildDecisionBars(scoped: Pick<MockSession, "status">[]): NamedBar[] {
  const approved = scoped.filter((s) => s.status === "approved").length;
  const declined = scoped.filter((s) => s.status === "not_approved").length;
  const review = scoped.filter((s) => s.status === "under_review").length;
  return [
    { name: "Approved", value: approved, color: "#007536" },
    { name: "Declined", value: declined, color: "#ba1a1a" },
    { name: "Still reviewing", value: review, color: "#fcab29" },
  ].filter((b) => b.value > 0);
}

export const MOCK_FEEDBACK_AVG = 4.1;
export const MOCK_OPEN_ORDERS = 4;

export type MonthlyRevenuePoint = {
  label: string;
  monthKey: string;
  donationsCents: number;
  shopCents: number;
};

/** Six calendar months of revenue fixtures - mirrors `admin/lib/payments-mock.ts`. */
export function buildMockMonthlyRevenue(now = new Date()): MonthlyRevenuePoint[] {
  const fixtures: Record<string, { donationsCents: number; shopCents: number }> = {
    "2026-02": { donationsCents: 12_500, shopCents: 8_997 },
    "2026-03": { donationsCents: 18_000, shopCents: 14_495 },
    "2026-04": { donationsCents: 9_500, shopCents: 11_996 },
    "2026-05": { donationsCents: 22_000, shopCents: 19_493 },
    "2026-06": { donationsCents: 15_500, shopCents: 16_994 },
    "2026-07": { donationsCents: 27_500, shopCents: 24_986 },
  };
  const points: MonthlyRevenuePoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const fixture = fixtures[monthKey] ?? {
      donationsCents: 8_000 + ((5 - i) % 4) * 2_500,
      shopCents: 6_000 + ((5 - i) % 5) * 3_000,
    };
    points.push({ label, monthKey, donationsCents: fixture.donationsCents, shopCents: fixture.shopCents });
  }
  return points;
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export type OrderStatus = "pending" | "paid" | "shipped" | "fulfilled" | "cancelled";

export type FulfillmentMethod = "usps_ship" | "office_pickup" | "local_dropoff";

/** Map legacy `delivered` (same as shipped) for display/filters. */
export function normalizeOrderStatus(status: string): OrderStatus {
  if (status === "delivered" || status === "shipped") return "shipped";
  if (status === "fulfilled") return "fulfilled";
  if (status === "pending" || status === "paid" || status === "cancelled") return status;
  return "pending";
}

export function normalizeFulfillmentMethod(
  value: string | null | undefined,
): FulfillmentMethod {
  if (value === "office_pickup" || value === "local_dropoff" || value === "usps_ship") {
    return value;
  }
  return "usps_ship";
}

export const RECEIVING_METHOD_LABELS: Record<FulfillmentMethod, string> = {
  usps_ship: "USPS ship",
  office_pickup: "Office pickup",
  local_dropoff: "Local drop-off",
};

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
  fulfillmentMethod: FulfillmentMethod;
  includesKit: boolean;
  tracking: string | null;
  carrier: string | null;
  shipping: ShippingAddress;
  createdAt: string;
  paymentReference?: string | null;
  paymentIntentId?: string | null;
  paymentMethodLabel?: string | null;
  labelUrl?: string | null;
  trackingStatus?: string | null;
  shippoTransactionId?: string | null;
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
    id: "o1",
    volunteer: "Jordan Kim",
    email: "jordan.k@email.com",
    items: "Water Bottle × 1, Cap × 1",
    lineItems: [
      { name: "Water Bottle", qty: 1, unitCents: 1999 },
      { name: "Cap", qty: 1, unitCents: 1499 },
    ],
    totalCents: 3499,
    status: "shipped",
    fulfillmentMethod: "usps_ship",
    includesKit: true,
    tracking: "9400111202550035000000",
    carrier: "USPS",
    shipping: shipping("Jordan Kim", "100 Sample Street", "Example City", "IL", "00000", {
      phone: "(312) 555-0142",
    }),
    createdAt: "2026-07-15T10:22:00Z",
  },
  {
    id: "o2",
    volunteer: "Devon Okafor",
    email: "devon.o@email.com",
    items: "Tote Bag × 2",
    lineItems: [{ name: "Tote Bag", qty: 2, unitCents: 1499 }],
    totalCents: 2998,
    status: "shipped",
    fulfillmentMethod: "usps_ship",
    includesKit: true,
    tracking: "1Z9999999999999999",
    carrier: "UPS",
    shipping: shipping("Devon Okafor", "110 Sample Parkway", "Atlanta", "GA", "30346"),
    createdAt: "2026-07-12T14:05:00Z",
  },
  {
    id: "o3",
    volunteer: "Sophia Chen",
    email: "sophia.c@email.com",
    items: "Cap × 1",
    lineItems: [{ name: "Cap", qty: 1, unitCents: 1499 }],
    totalCents: 1499,
    status: "paid",
    fulfillmentMethod: "office_pickup",
    includesKit: true,
    tracking: null,
    carrier: null,
    shipping: shipping("Sophia Chen", "120 Sample Heights", "New York", "NY", "10065"),
    createdAt: "2026-07-18T09:00:00Z",
  },
  {
    id: "o4",
    volunteer: "Marcus Rivera",
    email: "marcus.r@email.com",
    items: "Water Bottle × 2, Tote Bag × 1",
    lineItems: [
      { name: "Water Bottle", qty: 2, unitCents: 1999 },
      { name: "Tote Bag", qty: 1, unitCents: 1499 },
    ],
    totalCents: 5497,
    status: "pending",
    tracking: null,
    carrier: null,
    shipping: shipping("Marcus Rivera", "900 Sample Circle", "Washington", "DC", "20500"),
    fulfillmentMethod: "usps_ship",
    includesKit: true,
    createdAt: "2026-07-20T16:30:00Z",
  },
  {
    id: "o5",
    volunteer: "Luna Martinez",
    email: "luna.m@email.com",
    items: "Gloves × 3",
    lineItems: [{ name: "Gloves", qty: 3, unitCents: 999 }],
    totalCents: 2997,
    status: "shipped",
    tracking: "773901234567890123",
    carrier: "FedEx",
    shipping: shipping("Luna Martinez", "130 Sample Commons", "Menlo Park", "CA", "94025"),
    fulfillmentMethod: "usps_ship",
    includesKit: true,
    createdAt: "2026-07-16T11:10:00Z",
  },
  {
    id: "o6",
    volunteer: "Miguel Santos",
    email: "miguel.s@email.com",
    items: "Water Bottle × 1",
    lineItems: [{ name: "Water Bottle", qty: 1, unitCents: 1999 }],
    totalCents: 1999,
    status: "shipped",
    tracking: "9400111202550035000001",
    carrier: "USPS",
    shipping: shipping("Miguel Santos", "2100 Woodward Ave", "Detroit", "MI", "48201"),
    fulfillmentMethod: "usps_ship",
    includesKit: true,
    createdAt: "2026-07-10T08:45:00Z",
  },
  {
    id: "o7",
    volunteer: "Fatima Hassan",
    email: "fatima.h@email.com",
    items: "Cap × 2, Tote Bag × 1",
    lineItems: [
      { name: "Cap", qty: 2, unitCents: 1499 },
      { name: "Tote Bag", qty: 1, unitCents: 1499 },
    ],
    totalCents: 4497,
    status: "pending",
    tracking: null,
    carrier: null,
    shipping: shipping("Fatima Hassan", "301 Fremont St", "Las Vegas", "NV", "89101"),
    fulfillmentMethod: "usps_ship",
    includesKit: true,
    createdAt: "2026-07-21T07:55:00Z",
  },
  {
    id: "o8",
    volunteer: "Tyler Washington",
    email: "tyler.w@email.com",
    items: "Gloves × 1",
    lineItems: [{ name: "Gloves", qty: 1, unitCents: 999 }],
    totalCents: 999,
    status: "cancelled",
    tracking: null,
    carrier: null,
    shipping: shipping("Tyler Washington", "1 Microsoft Way", "Redmond", "WA", "98052"),
    fulfillmentMethod: "usps_ship",
    includesKit: true,
    createdAt: "2026-07-11T13:20:00Z",
  },
];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: "Pending" | "Paid" | "Shipped" | "Fulfilled" | "Cancelled"; className: string }> = {
  pending: { label: "Pending", className: "bg-[#ffddb5] text-[#835400] border-[#fcab29]/40" },
  paid: { label: "Paid", className: "bg-[#f7fff1] text-primary border-primary/30" },
  shipped: { label: "Shipped", className: "bg-[#e8f4fe] text-[#1565c0] border-[#1565c0]/30" },
  fulfilled: { label: "Fulfilled", className: "bg-[#e8f5e9] text-[#2e7d32] border-[#2e7d32]/30" },
  cancelled: { label: "Cancelled", className: "bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]/30" },
};

export function formatOrderCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatOrderDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return "-";
  }
}

/** Local calendar date of the timestamp (the admin's browser TZ) - mirrors `admin/lib/format.ts`. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return "-";
  }
}

export function formatShippingAddress(addr: ShippingAddress): string {
  const lines = [addr.name, addr.line1];
  if (addr.line2) lines.push(addr.line2);
  lines.push(`${addr.city}, ${addr.state} ${addr.postalCode}`);
  if (addr.country !== "US") lines.push(addr.country);
  return lines.join("\n");
}

export function trackingUrl(carrier: string | null, tracking: string | null): string | null {
  if (!carrier || !tracking) return null;
  const c = carrier.toLowerCase();
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${tracking}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
  return null;
}

/** Local datetime - mirrors admin session detail rows (`MMM d, yyyy HH:mm`). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), "MMM d, yyyy HH:mm");
  } catch {
    return "-";
  }
}

/** Mirrors `admin/lib/format.ts` `formatMiles`. */
export function formatMiles(miles: number | null | undefined): string {
  if (miles == null) return "-";
  return `${miles.toFixed(2)} mi`;
}

/** Mirrors `admin/components/ui/StatusChip.tsx` / `admin/types/database.ts`. */
export type SessionStatus = MockSession["status"];

export const SESSION_STATUS_CONFIG: Record<SessionStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-[#f6f3f2] text-[#3e4a3d] border-[#bdcaba]" },
  under_review: { label: "Under Review", className: "bg-[#ffddb5] text-[#835400] border-[#fcab29]" },
  approved: { label: "Approved", className: "bg-[#f7fff1] text-[#007536] border-[#007536]" },
  not_approved: { label: "Declined", className: "bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]" },
  // Legacy DB rows only - "Invalid" is not a product status.
  invalid: { label: "Declined", className: "bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]" },
};

/** Safe lookup for live rows - unknown statuses fall back to Active styling (admin StatusChip). */
export function getSessionStatusConfig(status: string): { label: string; className: string } {
  return SESSION_STATUS_CONFIG[status as SessionStatus] ?? SESSION_STATUS_CONFIG.active;
}

/** Mirrors `admin/lib/format.ts` `formatDuration`. */
export function formatDuration(seconds: number | null | undefined, adjustedHours?: number | null): string {
  if (adjustedHours != null) {
    const h = Math.floor(adjustedHours);
    const m = Math.round((adjustedHours - h) * 60);
    return `${h}h ${m}m (adjusted)`;
  }
  if (!seconds) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

/** Mirrors `admin/lib/format.ts` `shortId`. */
export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

const OPEN_STATUSES: OrderStatus[] = ["pending", "paid", "shipped"];

export function loadOrdersSummary() {
  return summarizeOrders(MOCK_ORDERS);
}

/** Pure - safe to call from client components with either live or mock `OrderRow[]`. */
export function summarizeOrders(orders: OrderRow[]) {
  const open = orders.filter((o) => OPEN_STATUSES.includes(o.status)).length;
  const totalRevenueCents = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalCents, 0);
  return { open, total: orders.length, totalRevenueCents };
}

export type FeedbackEntry = {
  id: string;
  volunteer: string;
  rating: keyof typeof EMOJI_MAP;
  comment: string | null;
  submittedAt: string;
  activity: string;
  flagged?: boolean;
};

export const EMOJI_MAP: Record<string, { emoji: string; label: string; score: number; color: string }> = {
  excited: { emoji: "🤩", label: "Excited", score: 5, color: "#007536" },
  happy: { emoji: "😊", label: "Happy", score: 4, color: "#4a9e6e" },
  neutral: { emoji: "😐", label: "Neutral", score: 3, color: "#835400" },
  sad: { emoji: "😔", label: "Sad", score: 2, color: "#cc7700" },
  very_sad: { emoji: "😢", label: "Very Sad", score: 1, color: "#ba1a1a" },
};

/** Fixture ratings tally 5 / 3 / 2 / 1 / 1 (no twin adjacent totals like the old 4 / 4). */
export const MOCK_FEEDBACK: FeedbackEntry[] = [
  { id: "f1", volunteer: "Jordan Kim", rating: "excited", comment: "Loved every minute - the team coordination was excellent and the park looks so much better!", submittedAt: "2026-07-20T14:23:00Z", activity: "Park Cleanup" },
  { id: "f2", volunteer: "Devon Okafor", rating: "happy", comment: "Great experience. The route was well-planned and volunteers were friendly.", submittedAt: "2026-07-20T11:05:00Z", activity: "Beach Cleanup" },
  { id: "f3", volunteer: "Sophia Chen", rating: "excited", comment: null, submittedAt: "2026-07-19T16:40:00Z", activity: "Trail Cleanup" },
  { id: "f4", volunteer: "Marcus Rivera", rating: "neutral", comment: "It was okay. Wish we had more supplies at the start.", submittedAt: "2026-07-19T09:15:00Z", activity: "Neighborhood Cleanup" },
  { id: "f5", volunteer: "Luna Martinez", rating: "happy", comment: "Really fulfilling! Will definitely come back.", submittedAt: "2026-07-18T13:30:00Z", activity: "River Cleanup" },
  { id: "f6", volunteer: "Miguel Santos", rating: "excited", comment: "Best session yet. We cleared an entire trail section in under 3 hours.", submittedAt: "2026-07-18T10:00:00Z", activity: "Trail Cleanup" },
  { id: "f7", volunteer: "Fatima Hassan", rating: "excited", comment: null, submittedAt: "2026-07-17T15:20:00Z", activity: "Park Cleanup" },
  { id: "f8", volunteer: "Destiny Thompson", rating: "neutral", comment: "Session was fine. The location was hard to get to without a car.", submittedAt: "2026-07-17T08:50:00Z", activity: "Highway Litter Pick" },
  { id: "f9", volunteer: "Priya Nair", rating: "sad", comment: "I got there and nobody else showed up for 45 minutes.", submittedAt: "2026-07-16T12:10:00Z", activity: "Beach Cleanup", flagged: true },
  { id: "f10", volunteer: "Tyler Washington", rating: "happy", comment: "Good vibes, easy to follow instructions.", submittedAt: "2026-07-15T14:05:00Z", activity: "Neighborhood Cleanup" },
  { id: "f11", volunteer: "Isaiah Grant", rating: "excited", comment: "First time volunteering and it was amazing!", submittedAt: "2026-07-14T09:30:00Z", activity: "Park Cleanup" },
  { id: "f12", volunteer: "Aaliyah Brooks", rating: "very_sad", comment: "Session was cancelled last minute with no notice. Very frustrating.", submittedAt: "2026-07-13T16:00:00Z", activity: "River Cleanup", flagged: true },
];
