/**
 * Load GPS route + signed checkpoint photos for a session preview.
 * Used by `loadSessionEvidence` (server action) so the client drawer can
 * hydrate Walking Path / Photos when live Supabase data exists.
 *
 * Photo map pins prefer stored `checkpoints.latitude` / `longitude` (new
 * sessions). Legacy rows without coords fall back to time-along-route, then
 * snap onto the polyline so thumbs sit on the trail.
 */
import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import {
  deltaMetersBetween,
  nearestPointOnRoute,
  parseSessionRoute,
  pointAlongRouteByProgress,
  progressFromCaptureTime,
  type RouteCoordinate,
} from '@/lib/session-route';

export type SessionPhoto = {
  url: string;
  label: 'Selfie' | 'Progress';
  capturedAt: string | null;
};

/** One map pin per checkpoint (selfie + progress stacked when both exist). */
export type SessionPhotoPin = {
  id: string;
  coordinate: RouteCoordinate;
  /** 0–1 distance fraction along the route (approx for GPS-backed pins). */
  progress: number;
  /** True when placed from stored lat/lng rather than time interpolation. */
  fromGps: boolean;
  /** Distance from the raw GPS fix to the nearest point on the route (0 for
   * time-interpolated pins, which are placed on the route line by construction). */
  offRouteMeters: number;
  photos: SessionPhoto[];
};

/** Server-computed GPS/speed signal from finalize - see
 * `backend/sessions/src/lib/sessionPlausibility.ts`. Advisory display only. */
export type PlausibilitySignal = {
  avgSpeedMps: number;
  maxSpeedMps: number;
  exceedsPlausibleSpeed: boolean;
  sharpReversalCount: number;
  routeSpanMeters: number;
  tightLoop: boolean;
  idleHighDuration: boolean;
};

export type SessionEvidence = {
  route: RouteCoordinate[];
  photos: SessionPhoto[];
  photoPins: SessionPhotoPin[];
  checkpointCount: number;
  /** True when checkpoints have storage paths but signing produced no URLs. */
  photoSignFailed: boolean;
  plausibilitySignal: PlausibilitySignal | null;
};

type CheckpointRow = {
  id: string;
  selfie_path: string | null;
  progress_path: string | null;
  captured_at: string | null;
  latitude: number | null;
  longitude: number | null;
};

function resolvePinCoordinate(
  route: RouteCoordinate[],
  cp: CheckpointRow,
  index: number,
  total: number,
  startedAt: string | null,
  endedAt: string | null,
): { coordinate: RouteCoordinate; progress: number; fromGps: boolean; offRouteMeters: number } | null {
  if (route.length < 2) return null;

  const lat = cp.latitude != null ? Number(cp.latitude) : NaN;
  const lng = cp.longitude != null ? Number(cp.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    const raw: RouteCoordinate = [lng, lat];
    const coordinate = nearestPointOnRoute(route, raw);
    const offRouteMeters = deltaMetersBetween(raw, coordinate);
    const progress = progressFromCaptureTime({
      capturedAt: cp.captured_at,
      startedAt,
      endedAt,
      index,
      total,
    });
    return { coordinate, progress, fromGps: true, offRouteMeters };
  }

  const progress = progressFromCaptureTime({
    capturedAt: cp.captured_at,
    startedAt,
    endedAt,
    index,
    total,
  });
  // Session-start photos often share started_at → progress 0 and hide under the
  // Start badge. Nudge legacy (non-GPS) pins slightly onto the trail.
  const nudged = Math.max(0.04, Math.min(0.96, progress));
  const along = pointAlongRouteByProgress(route, nudged);
  if (!along) return null;
  return { coordinate: along, progress: nudged, fromGps: false, offRouteMeters: 0 };
}

export async function fetchSessionEvidence(sessionId: string): Promise<SessionEvidence | null> {
  // Mock fixture ids are short (`m1`, …) - skip the round-trip.
  if (!sessionId || sessionId.length < 20) {
    return null;
  }

  const supabase = await createDataClient();
  const [{ data: session, error: sessionError }, { data: checkpoints, error: cpError }] =
    await Promise.all([
      supabase
        .from('sessions')
        .select('id, route, started_at, ended_at, plausibility_signal')
        .eq('id', sessionId)
        .maybeSingle(),
      supabase
        .from('checkpoints')
        .select('id, selfie_path, progress_path, captured_at, latitude, longitude')
        .eq('session_id', sessionId)
        .order('captured_at', { ascending: true }),
    ]);

  if (sessionError || !session) {
    return null;
  }
  if (cpError) {
    // Older DBs without latitude/longitude - retry without those columns.
    if (/latitude|longitude|column/i.test(cpError.message)) {
      console.warn(
        `[session-evidence] checkpoint GPS columns missing - run admin/db/007_checkpoint_coordinates.sql (${cpError.message})`,
      );
      const { data: legacyRows, error: legacyError } = await supabase
        .from('checkpoints')
        .select('id, selfie_path, progress_path, captured_at')
        .eq('session_id', sessionId)
        .order('captured_at', { ascending: true });
      if (legacyError) {
        console.warn(`[session-evidence] checkpoints query failed:`, legacyError.message);
      }
      return buildEvidence(session, (legacyRows ?? []) as Omit<CheckpointRow, 'latitude' | 'longitude'>[], true);
    }
    console.warn(`[session-evidence] checkpoints query failed for ${sessionId}:`, cpError.message);
  }

  return buildEvidence(session, (checkpoints ?? []) as CheckpointRow[], false);
}

async function buildEvidence(
  session: {
    route: unknown;
    started_at: string | null;
    ended_at: string | null;
    plausibility_signal?: unknown;
  },
  rowsIn: Array<
    Omit<CheckpointRow, 'latitude' | 'longitude'> & {
      latitude?: number | null;
      longitude?: number | null;
    }
  >,
  forceLegacy: boolean,
): Promise<SessionEvidence> {
  const route = parseSessionRoute(session.route);
  const rows: CheckpointRow[] = rowsIn.map((r) => ({
    id: r.id,
    selfie_path: r.selfie_path,
    progress_path: r.progress_path,
    captured_at: r.captured_at,
    latitude: forceLegacy ? null : (r.latitude ?? null),
    longitude: forceLegacy ? null : (r.longitude ?? null),
  }));
  const checkpointCount = rows.length;
  const startedAt = session.started_at;
  const endedAt = session.ended_at;

  const serviceClient = await tryCreateServiceClient();
  const photos: SessionPhoto[] = [];
  const photoPins: SessionPhotoPin[] = [];
  let hadPaths = false;

  if (serviceClient) {
    for (let index = 0; index < rows.length; index += 1) {
      const cp = rows[index];
      const pinPhotos: SessionPhoto[] = [];

      if (cp.selfie_path) {
        hadPaths = true;
        const { data, error } = await serviceClient.storage
          .from('session-photos')
          .createSignedUrl(cp.selfie_path, 3600);
        if (error) {
          console.warn(`[session-evidence] selfie sign failed:`, error.message);
        } else if (data?.signedUrl) {
          const photo: SessionPhoto = {
            url: data.signedUrl,
            label: 'Selfie',
            capturedAt: cp.captured_at,
          };
          photos.push(photo);
          pinPhotos.push(photo);
        }
      }
      if (cp.progress_path) {
        hadPaths = true;
        const { data, error } = await serviceClient.storage
          .from('session-photos')
          .createSignedUrl(cp.progress_path, 3600);
        if (error) {
          console.warn(`[session-evidence] progress sign failed:`, error.message);
        } else if (data?.signedUrl) {
          const photo: SessionPhoto = {
            url: data.signedUrl,
            label: 'Progress',
            capturedAt: cp.captured_at,
          };
          photos.push(photo);
          pinPhotos.push(photo);
        }
      }

      if (pinPhotos.length === 0) continue;

      const placed = resolvePinCoordinate(route, cp, index, rows.length, startedAt, endedAt);
      if (!placed) continue;

      photoPins.push({
        id: cp.id,
        coordinate: placed.coordinate,
        progress: placed.progress,
        fromGps: placed.fromGps,
        offRouteMeters: placed.offRouteMeters,
        photos: pinPhotos,
      });
    }
  } else if (rows.some((cp) => cp.selfie_path || cp.progress_path)) {
    hadPaths = true;
  }

  return {
    route,
    photos,
    photoPins,
    checkpointCount,
    photoSignFailed: hadPaths && photos.length === 0,
    plausibilitySignal: (session.plausibility_signal as PlausibilitySignal | null) ?? null,
  };
}
