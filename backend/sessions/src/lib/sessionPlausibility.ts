/**
 * Server-side GPS/speed plausibility check, run at session finalize. The client-side
 * equivalent (`frontend/src/features/session-tracking/utils/routeFiltering.ts`) only
 * filters what gets displayed/appended live in the app bundle — it ships to the client
 * and is trivially bypassable by a modified client, so it is not a fraud signal.
 * This module ports the same pure math server-side, over the client's full submitted
 * route, and stores a signal for admin display — it never rejects a finalize.
 */

type RouteCoordinate = [number, number];

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const startLat = toRadians(lat1);
  const endLat = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function milesToMeters(miles: number): number {
  return miles * 1609.344;
}

function isRouteCoordinate(value: unknown): value is RouteCoordinate {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function deltaMetersBetween(from: RouteCoordinate, to: RouteCoordinate): number {
  if (!isRouteCoordinate(from) || !isRouteCoordinate(to)) {
    return Number.POSITIVE_INFINITY;
  }
  return milesToMeters(haversineMiles(from[1], from[0], to[1], to[0]));
}

function computeBearingDegrees(from: RouteCoordinate, to: RouteCoordinate): number {
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function bearingDifferenceDegrees(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Reject GPS spikes that reverse direction sharply over a short segment. Mirrors
 * `routeFiltering.ts`'s `isSharpReversal` thresholds. */
const SHARP_REVERSAL_MAX_DISTANCE_METERS = 12;
const SHARP_REVERSAL_BEARING_DEGREES = 120;

function isSharpReversal(
  prev: RouteCoordinate,
  last: RouteCoordinate,
  candidate: RouteCoordinate,
): boolean {
  const segmentMeters = deltaMetersBetween(last, candidate);
  if (segmentMeters > SHARP_REVERSAL_MAX_DISTANCE_METERS) return false;

  const inboundBearing = computeBearingDegrees(prev, last);
  const outboundBearing = computeBearingDegrees(last, candidate);
  return bearingDifferenceDegrees(inboundBearing, outboundBearing) >= SHARP_REVERSAL_BEARING_DEGREES;
}

/** Mirrors `routeFiltering.ts`'s `MAX_PLAUSIBLE_SPEED_MPS` — top-end brisk walk/jog pace. */
export const MAX_PLAUSIBLE_SPEED_MPS = 6;

/** Below this span, a route is effectively "never moved" (mirrors `routeFiltering.ts`). */
const STATIONARY_ROUTE_SPAN_METERS = 8;

function getRouteSpanMeters(coordinates: RouteCoordinate[]): number {
  if (coordinates.length < 2) return 0;
  const origin = coordinates[0];
  let maxSpan = 0;
  for (const coordinate of coordinates) {
    const distance = deltaMetersBetween(origin, coordinate);
    if (distance > maxSpan) maxSpan = distance;
  }
  return maxSpan;
}

export type PlausibilitySignal = {
  avgSpeedMps: number;
  maxSpeedMps: number;
  /** True if any consecutive-point implied speed exceeds a brisk walk/jog pace. */
  exceedsPlausibleSpeed: boolean;
  sharpReversalCount: number;
  routeSpanMeters: number;
  /** High reported distance but the route never actually leaves a small area — a
   * parking-lot/driveway loop, not a cleanup walk. */
  tightLoop: boolean;
  /** Duration is high but the submitted route distance is near zero (phone left running). */
  idleHighDuration: boolean;
};

/**
 * Computes a plausibility signal from the client's submitted route + duration/distance
 * at finalize time. Advisory only — the caller must not use this to reject a finalize;
 * it exists so an admin (not the client) has a trustworthy movement signal to review.
 */
export function computePlausibilitySignal(
  route: number[][],
  distanceMiles: number,
  durationSeconds: number,
): PlausibilitySignal {
  const coords = route.filter(isRouteCoordinate) as RouteCoordinate[];

  let totalMeters = 0;
  let maxSpeedMps = 0;
  let sharpReversalCount = 0;

  // A rough per-point timestamp isn't submitted with the route today, so speed is
  // estimated by distributing durationSeconds evenly across segments — sufficient to
  // catch grossly implausible average pace, not to certify exact per-segment speed.
  const segmentSeconds = coords.length > 1 ? durationSeconds / (coords.length - 1) : 0;

  for (let i = 1; i < coords.length; i += 1) {
    const segmentMeters = deltaMetersBetween(coords[i - 1], coords[i]);
    if (Number.isFinite(segmentMeters)) totalMeters += segmentMeters;

    if (segmentSeconds > 0 && Number.isFinite(segmentMeters)) {
      const speedMps = segmentMeters / segmentSeconds;
      if (speedMps > maxSpeedMps) maxSpeedMps = speedMps;
    }

    if (i >= 2 && isSharpReversal(coords[i - 2], coords[i - 1], coords[i])) {
      sharpReversalCount += 1;
    }
  }

  const avgSpeedMps = durationSeconds > 0 ? totalMeters / durationSeconds : 0;
  const routeSpanMeters = getRouteSpanMeters(coords);

  return {
    avgSpeedMps,
    maxSpeedMps,
    exceedsPlausibleSpeed: maxSpeedMps > MAX_PLAUSIBLE_SPEED_MPS || avgSpeedMps > MAX_PLAUSIBLE_SPEED_MPS,
    sharpReversalCount,
    routeSpanMeters,
    tightLoop: distanceMiles > 0.25 && routeSpanMeters < STATIONARY_ROUTE_SPAN_METERS * 4,
    idleHighDuration: durationSeconds > 900 && milesToMeters(distanceMiles) < STATIONARY_ROUTE_SPAN_METERS,
  };
}
