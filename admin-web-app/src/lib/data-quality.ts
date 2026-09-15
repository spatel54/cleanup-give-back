/**
 * Automated data-integrity checks over sessions/checkpoints/orders/events -
 * same "pure function over already-typed rows" shape as `session-red-flags.ts`,
 * but these are record-completeness issues rather than abuse signals. Feeds the
 * "Needs attention" inbox (`attention-inbox.ts`).
 */
import { createDataClient } from '@/lib/supabase/server';
import { getVolunteerDirectory } from '@/lib/volunteers';

export type DataQualityAlert = {
  key: string;
  table: 'sessions' | 'checkpoints' | 'shop_orders' | 'events';
  targetId: string;
  label: string;
};

type CheckpointRow = {
  id: string;
  session_id: string;
  latitude: number | null;
  longitude: number | null;
  selfie_path: string | null;
  progress_path: string | null;
};

type SessionRow = {
  id: string;
  status: string;
  distance_miles: number | null;
  route: unknown;
};

type OrderRow = { id: string; user_id: string | null };

type EventRow = { id: string; title: string; address: string | null };

function hasRoutePoints(route: unknown): boolean {
  return Array.isArray(route) && route.length > 0;
}

/** Checkpoints missing lat/lng - can't plot a trail pin or verify photo location. */
export function checkMissingCheckpointCoordinates(checkpoints: CheckpointRow[]): DataQualityAlert[] {
  return checkpoints
    .filter((c) => c.latitude == null || c.longitude == null)
    .map((c) => ({
      key: `missing-checkpoint-coords-${c.id}`,
      table: 'checkpoints',
      targetId: c.session_id,
      label: 'Checkpoint photo has no GPS coordinates',
    }));
}

/** A session with checkpoint photos but no GPS route - evidence exists but can't be map-verified. */
export function checkRouteMissingWithPhotos(
  sessions: SessionRow[],
  checkpoints: CheckpointRow[],
): DataQualityAlert[] {
  const sessionsWithPhotos = new Set(
    checkpoints.filter((c) => c.selfie_path || c.progress_path).map((c) => c.session_id),
  );
  return sessions
    .filter((s) => !hasRoutePoints(s.route) && sessionsWithPhotos.has(s.id))
    .map((s) => ({
      key: `route-missing-with-photos-${s.id}`,
      table: 'sessions',
      targetId: s.id,
      label: 'Session has checkpoint photos but no GPS route',
    }));
}

/** Approved sessions claiming zero miles - likely a distance-capture bug or a bad approval. */
export function checkZeroMileApprovedSessions(sessions: SessionRow[]): DataQualityAlert[] {
  return sessions
    .filter((s) => s.status === 'approved' && (s.distance_miles ?? 0) === 0)
    .map((s) => ({
      key: `zero-mile-approved-${s.id}`,
      table: 'sessions',
      targetId: s.id,
      label: 'Approved session has zero recorded miles',
    }));
}

/** Orders with no resolvable customer email - no dedicated column, resolved via Auth directory. */
export function checkOrdersWithoutEmail(
  orders: OrderRow[],
  emailByUserId: Map<string, string | null>,
): DataQualityAlert[] {
  return orders
    .filter((o) => !o.user_id || !emailByUserId.get(o.user_id))
    .map((o) => ({
      key: `order-missing-email-${o.id}`,
      table: 'shop_orders',
      targetId: o.id,
      label: 'Order has no resolvable customer email',
    }));
}

/** Events with no address - can't show volunteers where to go. */
export function checkEventsWithoutAddress(events: EventRow[]): DataQualityAlert[] {
  return events
    .filter((e) => !e.address || !e.address.trim())
    .map((e) => ({
      key: `event-missing-address-${e.id}`,
      table: 'events',
      targetId: e.id,
      label: `"${e.title}" has no address`,
    }));
}

/** Runs every check against a fresh, lean read of each table. Real data only - no mock fallback. */
export async function loadDataQualityAlerts(): Promise<DataQualityAlert[]> {
  const supabase = await createDataClient();

  const [{ data: sessions }, { data: checkpoints }, { data: orders }, { data: events }, directory] =
    await Promise.all([
      supabase.from('sessions').select('id, status, distance_miles, route').neq('status', 'active'),
      supabase.from('checkpoints').select('id, session_id, latitude, longitude, selfie_path, progress_path'),
      supabase.from('shop_orders').select('id, user_id'),
      supabase.from('events').select('id, title, address'),
      getVolunteerDirectory(),
    ]);

  const emailByUserId = new Map<string, string | null>();
  for (const [userId, entry] of directory) {
    emailByUserId.set(userId, entry.email);
  }

  const sessionRows = (sessions ?? []) as SessionRow[];
  const checkpointRows = (checkpoints ?? []) as CheckpointRow[];
  const orderRows = (orders ?? []) as OrderRow[];
  const eventRows = (events ?? []) as EventRow[];

  return [
    ...checkMissingCheckpointCoordinates(checkpointRows),
    ...checkRouteMissingWithPhotos(sessionRows, checkpointRows),
    ...checkZeroMileApprovedSessions(sessionRows),
    ...checkOrdersWithoutEmail(orderRows, emailByUserId),
    ...checkEventsWithoutAddress(eventRows),
  ];
}
