/**
 * Parse `sessions.route` jsonb (`[[lng, lat], …]`) into MapLibre-ready coords.
 * Replay helpers mirror mobile `routeFiltering` / `routeReplayDuration`.
 */

export type RouteCoordinate = [number, number];

const EARTH_RADIUS_MILES = 3958.8;

export const ROUTE_REPLAY_MIN_MS = 3000;
export const ROUTE_REPLAY_MAX_MS = 10_000;
/** Approximate playback speed along the recorded path (m/s) - matches mobile. */
export const ROUTE_REPLAY_SPEED_MPS = 2.2;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const startLat = toRadians(lat1);
  const endLat = toRadians(lat2);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function deltaMetersBetween(from: RouteCoordinate, to: RouteCoordinate): number {
  return haversineMiles(from[1], from[0], to[1], to[0]) * 1609.344;
}

/** Bearing in degrees clockwise from north (0–360). */
export function computeBearingDegrees(from: RouteCoordinate, to: RouteCoordinate): number {
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const dLng = ((to[0] - from[0]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export function parseSessionRoute(route: unknown): RouteCoordinate[] {
  if (!Array.isArray(route)) return [];

  const coords: RouteCoordinate[] = [];
  for (const point of route) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    coords.push([lng, lat]);
  }
  return coords;
}

export function routeBounds(coords: RouteCoordinate[]): {
  sw: RouteCoordinate;
  ne: RouteCoordinate;
} | null {
  if (coords.length === 0) return null;
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { sw: [minLng, minLat], ne: [maxLng, maxLat] };
}

/** Grow the polyline by distance fraction (0–1), matching mobile replay. */
export function sliceRouteByDistanceProgress(
  coords: RouteCoordinate[],
  progress: number,
): RouteCoordinate[] {
  if (coords.length < 2) return coords;

  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped <= 0) return [coords[0]];
  if (clamped >= 1) return coords;

  const cumulative: number[] = [0];
  for (let index = 1; index < coords.length; index += 1) {
    cumulative.push(cumulative[index - 1] + deltaMetersBetween(coords[index - 1], coords[index]));
  }

  const totalMeters = cumulative[cumulative.length - 1];
  if (totalMeters <= 0) return [coords[0]];

  const targetMeters = clamped * totalMeters;
  let segmentIndex = 1;
  while (segmentIndex < cumulative.length && cumulative[segmentIndex] < targetMeters) {
    segmentIndex += 1;
  }

  if (segmentIndex >= coords.length) return coords;

  const segmentStart = segmentIndex - 1;
  const segmentLength = cumulative[segmentIndex] - cumulative[segmentStart];
  const segmentT =
    segmentLength > 0 ? (targetMeters - cumulative[segmentStart]) / segmentLength : 0;
  const from = coords[segmentStart];
  const to = coords[segmentIndex];
  const tip: RouteCoordinate = [
    from[0] + (to[0] - from[0]) * segmentT,
    from[1] + (to[1] - from[1]) * segmentT,
  ];

  return [...coords.slice(0, segmentIndex), tip];
}

export function computeRouteReplayDurationMs(routeCoordinates: RouteCoordinate[]): number {
  if (routeCoordinates.length < 2) return ROUTE_REPLAY_MIN_MS;

  let totalMeters = 0;
  for (let index = 1; index < routeCoordinates.length; index += 1) {
    totalMeters += deltaMetersBetween(routeCoordinates[index - 1], routeCoordinates[index]);
  }

  const rawMs = (totalMeters / ROUTE_REPLAY_SPEED_MPS) * 1000;
  return Math.round(Math.min(ROUTE_REPLAY_MAX_MS, Math.max(ROUTE_REPLAY_MIN_MS, rawMs)));
}

export function computeRouteReplayDurationSeconds(routeCoordinates: RouteCoordinate[]): number {
  return computeRouteReplayDurationMs(routeCoordinates) / 1000;
}

export function formatReplayClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

/** Tip of the route at a 0–1 distance fraction. */
export function pointAlongRouteByProgress(
  coords: RouteCoordinate[],
  progress: number,
): RouteCoordinate | null {
  if (coords.length === 0) return null;
  if (coords.length === 1) return coords[0];
  const sliced = sliceRouteByDistanceProgress(coords, progress);
  return sliced[sliced.length - 1] ?? coords[0];
}

/**
 * Snap an arbitrary WGS84 point to the nearest vertex (or interpolated segment
 * tip) on the recorded route so photo pins sit on the polyline.
 */
export function nearestPointOnRoute(
  coords: RouteCoordinate[],
  point: RouteCoordinate,
): RouteCoordinate {
  if (coords.length === 0) return point;
  if (coords.length === 1) return coords[0];

  let best: RouteCoordinate = coords[0];
  let bestMeters = deltaMetersBetween(point, coords[0]);

  for (let i = 1; i < coords.length; i += 1) {
    const a = coords[i - 1];
    const b = coords[i];
    const ax = a[0];
    const ay = a[1];
    const bx = b[0];
    const by = b[1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((point[0] - ax) * dx + (point[1] - ay) * dy) / len2)) : 0;
    const candidate: RouteCoordinate = [ax + dx * t, ay + dy * t];
    const meters = deltaMetersBetween(point, candidate);
    if (meters < bestMeters) {
      bestMeters = meters;
      best = candidate;
    }
  }

  return best;
}

/**
 * Map a photo capture time onto route distance progress.
 * Prefer (captured − started) / (ended − started); fall back to even spacing.
 */
export function progressFromCaptureTime(params: {
  capturedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  index: number;
  total: number;
}): number {
  const { capturedAt, startedAt, endedAt, index, total } = params;
  if (capturedAt && startedAt && endedAt) {
    const t0 = Date.parse(startedAt);
    const t1 = Date.parse(endedAt);
    const tc = Date.parse(capturedAt);
    if (Number.isFinite(t0) && Number.isFinite(t1) && Number.isFinite(tc) && t1 > t0) {
      return Math.max(0, Math.min(1, (tc - t0) / (t1 - t0)));
    }
  }
  if (total <= 1) return 0.5;
  return index / (total - 1);
}

