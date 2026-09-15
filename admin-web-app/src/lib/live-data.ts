/**
 * Live Supabase reads for web-app pages.
 *
 * Empty tables / missing Auth directory return empty arrays with `useMock: false`
 * so Vercel never shows sample volunteers, orders, feedback, events, or revenue.
 *
 * Every table read here is the same shared Supabase project the mobile app writes to.
 */
import {
  differenceInCalendarDays,
  endOfMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import { connection } from 'next/server';
import { createDataClient, createServiceClient } from '@/lib/supabase/server';
import {
  getVolunteerDirectory,
  getVolunteerName,
  getVolunteerServiceType,
  resolveVolunteerEmail,
  resolveVolunteerName,
  type VolunteerDirectory,
} from '@/lib/volunteers';
import {
  buildMockMonthlyRevenue,
  normalizeFulfillmentMethod,
  normalizeOrderStatus,
  type MockSession,
  type FeedbackEntry,
  type OrderLineItem,
  type OrderRow,
  type MonthlyRevenuePoint,
  type ShippingAddress,
} from '@/lib/mock-data';
import {
  SHOP_ITEM_CATALOG,
  type ShopItemBreakdown,
  type ShopItemBreakdownRow,
  type ShopItemId,
} from '@/lib/shop-catalog';
import { withEventTiming, type EventListItem, type EventRow } from '@/lib/events';
import { geoFipsForPoint } from '@/lib/us-geo';
import { ILLINOIS_FIPS } from '@/lib/us-heatmap';

export type LiveResult<T> = { data: T; useMock: boolean };

/**
 * Sessions scoped for Dashboard/Sessions pages - real `sessions` rows enriched with Auth names.
 * Excludes `active` (in-progress, not yet submitted) sessions: admin must never see a
 * volunteer's location/activity while a session is still live, only after they submit it.
 */
export async function loadLiveSessions(): Promise<LiveResult<MockSession[]>> {
  await connection();
  const supabase = await createDataClient();
  const [{ data: rows, error }, directory] = await Promise.all([
    supabase
      .from('sessions')
      .select(
        'id, user_id, activity, started_at, ended_at, created_at, status, duration_seconds, adjusted_hours, court_ordered, distance_miles, route',
      )
      .neq('status', 'active')
      .order('created_at', { ascending: false }),
    getVolunteerDirectory(),
  ]);

  // Query failures must not fall through to fixtures - that looks "loaded" with
  // fake volunteers while production is broken. Empty table stays empty (real mode).
  if (error) {
    throw new Error(`Failed to load sessions from Supabase: ${error.message}`);
  }

  if (!rows || rows.length === 0) {
    return { data: [], useMock: false };
  }

  // Route (GPS trail) is preferred; checkpoint selfie/progress pins are the
  // fallback for sessions logged before route capture or with a sparse route.
  const sessionIds = rows.map((s) => s.id);
  const { data: checkpointRows } = await supabase
    .from('checkpoints')
    .select('session_id, latitude, longitude')
    .in('session_id', sessionIds)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  const checkpointBySession = new Map<string, { latitude: number; longitude: number }>();
  for (const c of checkpointRows ?? []) {
    if (c.latitude == null || c.longitude == null || checkpointBySession.has(c.session_id)) continue;
    checkpointBySession.set(c.session_id, { latitude: c.latitude, longitude: c.longitude });
  }

  const sessions: MockSession[] = await Promise.all(
    rows.map(async (s) => {
      const point = firstRoutePoint(s.route) ?? checkpointBySession.get(s.id) ?? null;
      const { stateFips, countyFips } = point
        ? await geoFipsForPoint(point.longitude, point.latitude)
        : { stateFips: null, countyFips: null };

      return {
        id: s.id,
        user_id: s.user_id,
        volunteer_name: getVolunteerName(directory, s.user_id),
        volunteer_service_type: getVolunteerServiceType(directory, s.user_id),
        activity: s.activity,
        status: (s.status ?? 'under_review') as MockSession['status'],
        duration_seconds: s.duration_seconds,
        adjusted_hours: s.adjusted_hours,
        court_ordered: Boolean(s.court_ordered),
        distance_miles: s.distance_miles,
        started_at: s.started_at ?? s.created_at,
        ended_at: s.ended_at ?? s.started_at ?? s.created_at,
        created_at: s.created_at ?? s.started_at ?? new Date().toISOString(),
        // Geocoded from the session's GPS route (or a checkpoint pin) via point-in-polygon
        // against the states/counties map; sessions with no GPS data fall back to the IL placeholder.
        state_fips: stateFips ?? ILLINOIS_FIPS,
        state_fips_placeholder: stateFips == null,
        county_fips: countyFips,
        latitude: point?.latitude ?? null,
        longitude: point?.longitude ?? null,
      };
    }),
  );

  return { data: sessions, useMock: false };
}

/** First finite `[longitude, latitude]` pair in a session's route jsonb, if any. */
function firstRoutePoint(route: unknown): { longitude: number; latitude: number } | null {
  if (!Array.isArray(route)) return null;
  for (const point of route) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const [longitude, latitude] = point;
    if (typeof longitude === 'number' && typeof latitude === 'number' && Number.isFinite(longitude) && Number.isFinite(latitude)) {
      return { longitude, latitude };
    }
  }
  return null;
}

type FeedbackRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  rating: string | null;
  comment: string | null;
  flagged: boolean | null;
  submitted_at: string;
};

/** Feedback scoped for the Feedback page - real `volunteer_feedback` rows enriched with names + activity. */
export async function loadLiveFeedback(): Promise<LiveResult<FeedbackEntry[]>> {
  const supabase = await createDataClient();
  const { data: rows } = await supabase
    .from('volunteer_feedback')
    .select('id, user_id, session_id, rating, comment, flagged, submitted_at')
    .order('submitted_at', { ascending: false });

  if (!rows || rows.length === 0) {
    return { data: [], useMock: false };
  }

  const feedbackRows = rows as FeedbackRow[];
  const sessionIds = [...new Set(feedbackRows.map((f) => f.session_id).filter((id): id is string => Boolean(id)))];
  const [directory, { data: sessions }] = await Promise.all([
    getVolunteerDirectory(),
    sessionIds.length > 0
      ? supabase.from('sessions').select('id, activity').in('id', sessionIds)
      : Promise.resolve({ data: [] as { id: string; activity: string | null }[] }),
  ]);
  const activityById = new Map((sessions ?? []).map((s) => [s.id, s.activity]));

  const feedback: FeedbackEntry[] = feedbackRows.map((f) => ({
    id: f.id,
    volunteer: f.user_id ? getVolunteerName(directory, f.user_id) : 'Unknown volunteer',
    rating: (f.rating ?? 'neutral') as FeedbackEntry['rating'],
    comment: f.comment,
    submittedAt: f.submitted_at,
    activity: (f.session_id ? activityById.get(f.session_id) : null) ?? 'Cleanup',
    flagged: f.flagged ?? false,
  }));

  return { data: feedback, useMock: false };
}

type ShopOrderRow = {
  id: string;
  user_id: string | null;
  items: unknown;
  total_cents: number | null;
  status: string | null;
  fulfillment_method?: string | null;
  includes_kit?: boolean | null;
  shipping_address: unknown;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  payment_reference?: string | null;
  stripe_payment_intent_id?: string | null;
  payment_method_label?: string | null;
  label_url?: string | null;
  tracking_status?: string | null;
  shippo_transaction_id?: string | null;
};

function describeItems(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return '-';
  return items
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const raw = entry as Record<string, unknown>;
      const name = String(raw.name ?? raw.id ?? raw.productId ?? 'Item');
      const qty = Number(raw.qty ?? raw.quantity ?? 1) || 1;
      return `${name} × ${qty}`;
    })
    .filter(Boolean)
    .join(', ');
}

/** Shop orders for Orders + dashboard preview - real `shop_orders` rows. */
export async function loadLiveOrders(): Promise<LiveResult<OrderRow[]>> {
  const supabase = await createDataClient();
  const { data: rows } = await supabase
    .from('shop_orders')
    .select('id, user_id, items, total_cents, status, fulfillment_method, includes_kit, created_at, payment_reference, stripe_payment_intent_id, payment_method_label')
    .order('created_at', { ascending: false });

  if (!rows || rows.length === 0) {
    return { data: [], useMock: false };
  }

  const directory = await getVolunteerDirectory();
  const orderRows = rows as ShopOrderRow[];
  const orders: OrderRow[] = orderRows.map((o) => transformOrderRow(o, directory));

  return { data: orders, useMock: false };
}

export type VolunteerOrderTracking = { trackingNumber: string; carrier: string | null };

/** Latest tracking number per volunteer, for auto-filling the Emails tab's Order
 * tracking template - one row per volunteer, their most recent order that actually
 * has a tracking number set (skips pending/unshipped orders with none yet). */
export async function loadLatestOrderTrackingByVolunteer(): Promise<Map<string, VolunteerOrderTracking>> {
  const supabase = await createDataClient();
  const { data: rows } = await supabase
    .from('shop_orders')
    .select('user_id, tracking_number, carrier, created_at')
    .not('tracking_number', 'is', null)
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false });

  const map = new Map<string, VolunteerOrderTracking>();
  for (const row of (rows ?? []) as { user_id: string; tracking_number: string; carrier: string | null }[]) {
    if (map.has(row.user_id)) continue;
    map.set(row.user_id, { trackingNumber: row.tracking_number, carrier: row.carrier });
  }
  return map;
}

/**
 * Pure aggregation over a volunteer's own session/audit-log history - every input here
 * is already individually visible to Admin one row at a time. Answers checklist red
 * flags #5 ("court-ordered + near deadline + sudden session volume") and #6 ("repeated
 * delete/resubmit or frequent invalid → dispute"). Advisory display only, not a score.
 */
export type VolunteerActivityPattern = {
  sessionsLast7Days: number;
  priorWeeklyAverage: number;
  invalidSessionsLast30Days: number;
  /** True when several sessions cluster in the run-up to a court due date. */
  nearDeadlineVolumeSpike: boolean;
  /** Count of volunteer-initiated session deletes (from `admin_audit_log`). */
  deleteCount: number;
};

const NEAR_DEADLINE_WINDOW_DAYS = 14;
const NEAR_DEADLINE_SPIKE_THRESHOLD = 3;

function buildActivityPattern(
  sessions: Array<{ started_at: string | null; status: string }>,
  auditDeleteCount: number,
  courtDueDate: string | null,
  now: Date,
): VolunteerActivityPattern {
  const startedDates = sessions
    .map((s) => (s.started_at ? parseISO(s.started_at) : null))
    .filter((d): d is Date => d != null);

  const last7 = { start: subDays(now, 7), end: now };
  const prior28 = { start: subDays(now, 35), end: subDays(now, 7) };
  const last30 = { start: subDays(now, 30), end: now };

  const sessionsLast7Days = startedDates.filter((d) => isWithinInterval(d, last7)).length;
  const priorSessions28Days = startedDates.filter((d) => isWithinInterval(d, prior28)).length;
  const priorWeeklyAverage = priorSessions28Days / 4;

  const invalidSessionsLast30Days = sessions.filter(
    (s) => s.status === 'invalid' && s.started_at && isWithinInterval(parseISO(s.started_at), last30),
  ).length;

  let nearDeadlineVolumeSpike = false;
  if (courtDueDate) {
    const due = parseISO(courtDueDate);
    const windowCount = startedDates.filter((d) => {
      const daysBeforeDue = differenceInCalendarDays(due, d);
      return daysBeforeDue >= 0 && daysBeforeDue <= NEAR_DEADLINE_WINDOW_DAYS;
    }).length;
    nearDeadlineVolumeSpike = windowCount >= NEAR_DEADLINE_SPIKE_THRESHOLD;
  }

  return {
    sessionsLast7Days,
    priorWeeklyAverage,
    invalidSessionsLast30Days,
    nearDeadlineVolumeSpike,
    deleteCount: auditDeleteCount,
  };
}

type VolunteerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  joinedAt: string | null;
  lastActive: string | null;
  courtOrdered: boolean;
  requiredHours: number | null;
  courtDueDate: string | null;
  caseReference: string | null;
  hoursResetAt: string | null;
  activityPattern: VolunteerActivityPattern;
  sessions: Array<{
    id: string;
    activity: string | null;
    started_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    adjusted_hours: number | null;
    distance_miles: number | null;
    status: string;
    court_ordered: boolean;
  }>;
};

/**
 * Lean version of `loadLiveVolunteerById`'s activity-pattern computation, for the
 * session drawer's red-flag badge - skips the Auth `getUserById` call since the
 * drawer only needs the rollup, not the full volunteer profile.
 */
export async function loadVolunteerActivityPattern(userId: string): Promise<VolunteerActivityPattern> {
  const supabase = await createDataClient();

  const [{ data: sessions }, { data: courtOrders }, { count: deleteCount }] = await Promise.all([
    supabase
      .from('sessions')
      .select('started_at, status')
      .eq('user_id', userId)
      .neq('status', 'active'),
    supabase
      .from('court_orders')
      .select('due_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('admin_audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('admin_user_id', userId)
      .eq('action', 'volunteer deleted session'),
  ]);

  return buildActivityPattern(
    sessions ?? [],
    deleteCount ?? 0,
    courtOrders?.[0]?.due_date ?? null,
    new Date(),
  );
}

/** Load a single volunteer profile with detailed information including sessions and court orders */
export async function loadLiveVolunteerById(id: string): Promise<LiveResult<VolunteerDetail | null>> {
  const supabase = await createDataClient();
  const serviceClient = await createServiceClient();

  // Try to get the user from Auth
  try {
    const { data: userResponse, error: userError } = await serviceClient.auth.admin.getUserById(id);
    if (userError || !userResponse?.user) {
      return { data: null, useMock: false };
    }

    const user = userResponse.user;
    const meta = user.user_metadata ?? {};
    const name = resolveVolunteerName(user);
    const email = resolveVolunteerEmail(user);
    const phone = user.phone ?? (typeof meta.phone === 'string' ? meta.phone : null);

    // Get sessions, court orders, and delete-audit history (for the Activity Pattern rollup)
    const [{ data: sessions }, { data: courtOrders }, { count: deleteCount }] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, activity, started_at, ended_at, duration_seconds, adjusted_hours, distance_miles, status, court_ordered')
        .eq('user_id', id)
        .neq('status', 'active')
        .order('started_at', { ascending: false }),
      supabase
        .from('court_orders')
        .select('required_hours, due_date, case_reference, hours_reset_at, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('admin_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('admin_user_id', id)
        .eq('action', 'volunteer deleted session'),
    ]);

    const sessionRows = sessions ?? [];
    const courtOrderList = courtOrders ?? [];
    const courtOrder = courtOrderList[0] ?? null;
    const courtOrdered = courtOrderList.length > 0;
    const activityPattern = buildActivityPattern(
      sessionRows,
      deleteCount ?? 0,
      courtOrder?.due_date ?? null,
      new Date(),
    );

    return {
      data: {
        id: user.id,
        name,
        email: email || '-',
        phone,
        joinedAt: user.created_at,
        lastActive: user.last_sign_in_at ?? null,
        courtOrdered,
        requiredHours: courtOrder?.required_hours ?? null,
        courtDueDate: courtOrder?.due_date ?? null,
        caseReference: courtOrder?.case_reference ?? null,
        hoursResetAt: courtOrder?.hours_reset_at ?? null,
        activityPattern,
        sessions: sessionRows,
      },
      useMock: false
    };
  } catch {
    return { data: null, useMock: false };
  }
}

export type TimelineEvent = {
  id: string;
  action: string;
  targetTable: string;
  targetId: string | null;
  beforeValue: unknown;
  afterValue: unknown;
  createdAt: string;
};

/**
 * Chronological review timeline for the volunteer profile page - sessions' status changes,
 * declines, hours adjustments, admin notes, court-order edits, emails sent, and volunteer
 * deletes, all sourced from `admin_audit_log`.
 *
 * `admin_audit_log.target_id` means different things per action: for `sessions` rows it's
 * the session id; for `court_orders` rows `upsertCourtOrder` (`actions/courtOrders.ts`)
 * stores the *volunteer's* user id (not the court-order row's own id, since a volunteer has
 * at most one order); for `volunteer deleted session` it's the (now-deleted) session id, so
 * that branch is matched by `admin_user_id = userId` instead - see `backend/sessions/src/
 * routes/sessions.ts` where the volunteer's own id is written as the audit's admin_user_id.
 */
export async function loadVolunteerTimeline(
  userId: string,
  sessionIds: string[],
): Promise<TimelineEvent[]> {
  const supabase = await createDataClient();

  const sessionIdList = sessionIds.filter(Boolean);
  const orFilters = [
    `and(target_table.eq.court_orders,target_id.eq.${userId})`,
    `and(admin_user_id.eq.${userId},action.eq.volunteer deleted session)`,
  ];
  if (sessionIdList.length > 0) {
    orFilters.unshift(`and(target_table.eq.sessions,target_id.in.(${sessionIdList.join(',')}))`);
  }

  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, action, target_table, target_id, before_value, after_value, performed_at')
    .or(orFilters.join(','))
    .order('performed_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    action: row.action,
    targetTable: row.target_table,
    targetId: row.target_id,
    beforeValue: row.before_value,
    afterValue: row.after_value,
    createdAt: row.performed_at,
  }));
}

export type EmailLogEntry = {
  id: string;
  templateType: string;
  toEmail: string;
  subject: string;
  status: string;
  sentAt: string;
};

/** Every logged email send to this volunteer, for the profile's Communication section. */
export async function loadVolunteerEmailLog(userId: string): Promise<EmailLogEntry[]> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from('email_log')
    .select('id, template_type, to_email, subject, status, sent_at')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false });

  // Table may not exist yet if the migration hasn't been applied - degrade to empty.
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    templateType: row.template_type,
    toEmail: row.to_email,
    subject: row.subject,
    status: row.status,
    sentAt: row.sent_at,
  }));
}

export type ContactNoteEntry = {
  id: string;
  note: string;
  adminUserId: string;
  performedAt: string;
};

/** Manual "called/texted the volunteer" notes logged via `logManualContactNote`. */
export async function loadVolunteerContactNotes(userId: string): Promise<ContactNoteEntry[]> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, admin_user_id, after_value, performed_at')
    .eq('target_table', 'volunteers')
    .eq('target_id', userId)
    .eq('action', 'logged contact note')
    .order('performed_at', { ascending: false });

  if (error || !data) return [];

  return data
    .map((row) => {
      const note = row.after_value && typeof row.after_value === 'object' ? (row.after_value as { note?: string }).note : null;
      return note
        ? { id: row.id, note, adminUserId: row.admin_user_id, performedAt: row.performed_at }
        : null;
    })
    .filter((entry): entry is ContactNoteEntry => entry != null);
}

/** Load a single order by ID with full details including shipping, tracking, and line items */
export async function loadLiveOrderById(id: string): Promise<LiveResult<OrderRow | null>> {
  const supabase = await createDataClient();
  const { data: row } = await supabase
    .from('shop_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (!row) {
    return { data: null, useMock: false };
  }

  const directory = await getVolunteerDirectory();
  const order = transformOrderRow(row as any, directory);

  return { data: order, useMock: false };
}

function transformOrderRow(o: ShopOrderRow, directory: VolunteerDirectory): OrderRow {
  const entry = o.user_id ? directory.get(o.user_id) : undefined;
  
  // Parse shipping address from jsonb
  const shipping = parseShippingAddress(o.shipping_address, entry?.name || 'Unknown volunteer');
  
  // Parse line items from jsonb
  const lineItems = parseLineItems(o.items);

  return {
    id: o.id,
    volunteer: entry?.name ?? (o.user_id ? getVolunteerName(directory, o.user_id) : 'Unknown volunteer'),
    email: entry?.email ?? '-',
    items: describeItems(o.items),
    lineItems,
    totalCents: o.total_cents ?? 0,
    status: normalizeOrderStatus(o.status ?? 'pending'),
    fulfillmentMethod: normalizeFulfillmentMethod(o.fulfillment_method),
    includesKit: o.includes_kit !== false,
    tracking: o.tracking_number || null,
    carrier: o.carrier || null,
    shipping,
    createdAt: o.created_at,
    paymentReference: o.payment_reference ?? null,
    paymentIntentId: o.stripe_payment_intent_id ?? null,
    paymentMethodLabel: o.payment_method_label ?? null,
    labelUrl: o.label_url ?? null,
    trackingStatus: o.tracking_status ?? null,
    shippoTransactionId: o.shippo_transaction_id ?? null,
  };
}

function parseShippingAddress(shippingData: any, fallbackName: string): ShippingAddress {
  if (!shippingData || typeof shippingData !== 'object') {
    return {
      name: fallbackName,
      line1: 'Address not provided',
      city: '-',
      state: '-',
      postalCode: '-',
      country: 'US',
    };
  }

  return {
    name: shippingData.name || fallbackName,
    line1: shippingData.line1 || shippingData.address || 'Address not provided',
    line2: shippingData.line2 || null,
    city: shippingData.city || '-',
    state: shippingData.state || '-',
    postalCode: shippingData.postalCode || shippingData.postal_code || shippingData.zip || '-',
    country: shippingData.country || 'US',
    phone: shippingData.phone || null,
  };
}

function parseLineItems(itemsData: any): OrderLineItem[] {
  if (!Array.isArray(itemsData)) return [];
  
  return itemsData
    .map((item: any) => {
      if (!item || typeof item !== 'object') return null;
      
      return {
        name: String(item.name || item.id || item.productId || 'Item'),
        qty: Number(item.qty || item.quantity || 1) || 1,
        unitCents: Number(item.unitCents || item.unit_cents || item.price || 0),
      };
    })
    .filter(Boolean) as OrderLineItem[];
}

type CourtOrderRow = { user_id: string; required_hours: number; due_date: string | null };

function computedHours(seconds: number | null, adjustedHours: number | null): number {
  if (adjustedHours != null) return adjustedHours;
  if (!seconds) return 0;
  return seconds / 3600;
}

function monthKeyUtc(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function buildZeroMonthlyRevenue(now = new Date()): MonthlyRevenuePoint[] {
  return buildMockMonthlyRevenue(now).map((point) => ({
    ...point,
    donationsCents: 0,
    shopCents: 0,
  }));
}

/**
 * Live shop + donation revenue for the last six calendar months.
 * Empty windows stay zeroed (`useMock: false`) - never sample revenue.
 */
export async function loadLiveMonthlyRevenue(now = new Date()): Promise<LiveResult<MonthlyRevenuePoint[]>> {
  const monthly = buildZeroMonthlyRevenue(now);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthly.length - 1), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const supabase = await createDataClient();
  const [{ data: orders }, { data: donations }] = await Promise.all([
    supabase
      .from('shop_orders')
      .select('total_cents, status, created_at')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .in('status', ['paid', 'shipped', 'fulfilled', 'delivered']),
    supabase
      .from('donations')
      .select('amount_cents, status, created_at')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .eq('status', 'succeeded'),
  ]);

  const byMonth = new Map(monthly.map((point) => [point.monthKey, point]));
  for (const order of orders ?? []) {
    if (!order.created_at) continue;
    const point = byMonth.get(monthKeyUtc(order.created_at));
    if (point) point.shopCents += order.total_cents ?? 0;
  }
  for (const donation of donations ?? []) {
    if (!donation.created_at) continue;
    const point = byMonth.get(monthKeyUtc(donation.created_at));
    if (point) point.donationsCents += donation.amount_cents ?? 0;
  }

  return { data: monthly, useMock: false };
}

function resolveShopItemId(raw: { id?: unknown; name?: unknown; productId?: unknown }): ShopItemId | null {
  const idHint = String(raw.id ?? raw.productId ?? '').trim().toLowerCase();
  const byId = SHOP_ITEM_CATALOG.find((p) => p.id === idHint);
  if (byId) return byId.id;
  const name = String(raw.name ?? '').trim().toLowerCase();
  const byLabel = SHOP_ITEM_CATALOG.find((p) => p.label.toLowerCase() === name);
  return byLabel?.id ?? null;
}

function emptyItemTallies(): Record<ShopItemId, { qty: number; revenueCents: number }> {
  return Object.fromEntries(SHOP_ITEM_CATALOG.map((p) => [p.id, { qty: 0, revenueCents: 0 }])) as Record<
    ShopItemId,
    { qty: number; revenueCents: number }
  >;
}

/** Units sold + revenue per catalog item for the Payments breakdown - real `shop_orders.items`. */
export async function loadLiveShopItemBreakdown(now = new Date()): Promise<LiveResult<ShopItemBreakdown>> {
  const supabase = await createDataClient();
  const { data } = await supabase
    .from('shop_orders')
    .select('items, status, created_at')
    .gte('created_at', subYears(now, 1).toISOString())
    .in('status', ['paid', 'shipped', 'fulfilled', 'delivered']);

  const tallies = emptyItemTallies();
  const currentMonthTallies = emptyItemTallies();
  const priorMonthTallies = emptyItemTallies();
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const priorMonthDate = subMonths(now, 1);
  const priorMonth = { start: startOfMonth(priorMonthDate), end: endOfMonth(priorMonthDate) };
  let matchedAny = false;

  for (const order of data ?? []) {
    const items = order.items;
    if (!Array.isArray(items)) continue;

    let createdAt: Date | null = null;
    if (typeof order.created_at === 'string') {
      try {
        createdAt = parseISO(order.created_at);
      } catch {
        createdAt = null;
      }
    }
    const inCurrentMonth = createdAt != null && isWithinInterval(createdAt, thisMonth);
    const inPriorMonth = createdAt != null && isWithinInterval(createdAt, priorMonth);

    for (const entry of items) {
      if (!entry || typeof entry !== 'object') continue;
      const raw = entry as Record<string, unknown>;
      const id = resolveShopItemId(raw);
      if (!id) continue;
      const qty = Number(raw.qty ?? raw.quantity ?? 0);
      if (!(qty > 0)) continue;
      const catalog = SHOP_ITEM_CATALOG.find((p) => p.id === id)!;
      const unitCents = Number(raw.unitCents ?? raw.unit_cents ?? catalog.unitCents) || catalog.unitCents;
      const lineCents = qty * unitCents;
      tallies[id].qty += qty;
      tallies[id].revenueCents += lineCents;
      if (inCurrentMonth) {
        currentMonthTallies[id].qty += qty;
        currentMonthTallies[id].revenueCents += lineCents;
      }
      if (inPriorMonth) {
        priorMonthTallies[id].qty += qty;
        priorMonthTallies[id].revenueCents += lineCents;
      }
      matchedAny = true;
    }
  }

  const totalRevenueCents = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + tallies[p.id].revenueCents, 0);
  const totalQty = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + tallies[p.id].qty, 0);
  const currentMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + currentMonthTallies[p.id].revenueCents,
    0,
  );
  const priorMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + priorMonthTallies[p.id].revenueCents,
    0,
  );
  const rows: ShopItemBreakdownRow[] = SHOP_ITEM_CATALOG.map((p) => {
    const { qty, revenueCents } = tallies[p.id];
    const monthRevenueCents = currentMonthTallies[p.id].revenueCents;
    const priorRevenueCents = priorMonthTallies[p.id].revenueCents;
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
  }).sort((a, b) => (b.qtySold !== a.qtySold ? b.qtySold - a.qtySold : b.revenueCents - a.revenueCents));
  rows.forEach((row, i) => {
    row.rankByQty = i + 1;
  });
  const withSales = rows.filter((r) => r.qtySold > 0);

  return {
    data: {
      rows,
      totalQty,
      totalRevenueCents,
      mostBought: withSales[0] ?? null,
      leastBought: withSales.length > 0 ? withSales[withSales.length - 1]! : null,
      fromDb: matchedAny,
      currentMonthRevenueCents,
      priorMonthRevenueCents,
    },
    useMock: false,
  };
}

type SessionForUser = { user_id: string; status: string | null; duration_seconds: number | null; adjusted_hours: number | null };

/**
 * Full Users/Volunteers directory for `/users` + `/volunteers` - every Auth
 * user with session-derived hours, court-ordered ones flagged from
 * `court_orders`. Empty Auth directory (missing service-role key or no users)
 * returns `[]` in real mode - never the illustrative mock roster.
 */
export async function loadLiveUsers(): Promise<LiveResult<import('@/components/ui/UserPreviewDrawer').UserRow[]>> {
  const directory = await getVolunteerDirectory();
  if (directory.size === 0) {
    return { data: [], useMock: false };
  }

  const supabase = await createDataClient();
  const [{ data: sessions }, { data: courtOrders }] = await Promise.all([
    supabase.from('sessions').select('user_id, status, duration_seconds, adjusted_hours').neq('status', 'active'),
    supabase.from('court_orders').select('user_id, required_hours, due_date'),
  ]);

  const courtByUser = new Map((courtOrders as CourtOrderRow[] | null ?? []).map((c) => [c.user_id, c]));
  const sessionsByUser = new Map<string, SessionForUser[]>();
  for (const s of (sessions as SessionForUser[] | null) ?? []) {
    const list = sessionsByUser.get(s.user_id) ?? [];
    list.push(s);
    sessionsByUser.set(s.user_id, list);
  }

  const users = [...directory.values()].map((entry) => {
    const userSessions = sessionsByUser.get(entry.id) ?? [];
    const approvedHours = userSessions
      .filter((s) => s.status === 'approved')
      .reduce((sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours), 0);
    const courtOrder = courtByUser.get(entry.id);

    return {
      id: entry.id,
      name: entry.name,
      email: entry.email ?? '-',
      phone: null,
      sessions: userSessions.length,
      totalHours: approvedHours,
      courtOrdered: Boolean(courtOrder),
      lastActive: null,
      joinedAt: entry.createdAt,
      requiredHours: courtOrder?.required_hours ?? null,
      completedHours: courtOrder ? approvedHours : null,
    };
  });

  return { data: users, useMock: false };
}

/** Events for `/events` - real `events` table rows, same one the mobile app reads. */
export async function loadLiveEvents(): Promise<LiveResult<EventListItem[]>> {
  const supabase = await createDataClient();
  const { data } = await supabase.from('events').select('*').order('starts_at', { ascending: true });
  const rows = (data ?? []) as EventRow[];
  return { data: rows.map((r) => withEventTiming(r)), useMock: false };
}

/** Single event for `/events/[id]` - real `events` row by id. */
export async function loadLiveEvent(id: string): Promise<EventListItem | null> {
  const supabase = await createDataClient();
  const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
  return data ? withEventTiming(data as EventRow) : null;
}

export type { VolunteerDirectory };
