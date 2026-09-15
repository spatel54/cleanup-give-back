import {
  haversineMiles,
  isRouteCoordinate,
  milesToMeters,
  type RouteCoordinate,
} from './geo';
import { DEFAULT_ACCURACY_METERS } from './locationKalman';

/** Reject fixes with horizontal accuracy worse than this (meters). */
export const MAX_ACCEPTABLE_ACCURACY_METERS = 25;

/** After this gap since last route append, relax movement gates (ms). */
export const ROUTE_GAP_RECOVERY_MS = 30_000;

/** Reject implied speeds above this when appending route points (m/s). */
export const MAX_PLAUSIBLE_SPEED_MPS = 6;

/** Device-reported speed below this is treated as stationary (m/s). */
export const MIN_SPEED_TO_RECORD_MPS = 0.14;

/** Ignore route appends for this long after session start (ms). */
export const GPS_WARMUP_MS = 3000;

/** EMA weight for live arrow smoothing (display only). */
export const DISPLAY_COORDINATE_EMA_ALPHA = 0.5;

/** Douglas-Peucker tolerance for display simplification (meters). */
export const DISPLAY_SIMPLIFY_TOLERANCE_METERS = 4;
/** Tighter Douglas-Peucker tolerance for the live tracker trail only. */
export const LIVE_DISPLAY_SIMPLIFY_TOLERANCE_METERS = 0.55;
const LIVE_DISPLAY_TAIL_RAW_POINTS = 28;

export type MotionState = 'walking' | 'stationary';

export type RouteSample = {
  coordinate: RouteCoordinate;
  accuracyMeters: number;
  speedMps: number | null;
  heading: number | null;
  timestampMs: number;
};

/** Max distance for sharp-reversal outlier detection (meters). */
const SHARP_REVERSAL_MAX_DISTANCE_METERS = 12;

/** Bearing change above this with short segment is treated as a spike (degrees). */
const SHARP_REVERSAL_BEARING_DEGREES = 120;

export function resolveAccuracyMeters(accuracyMeters: number | null | undefined): number {
  if (accuracyMeters == null || !Number.isFinite(accuracyMeters) || accuracyMeters <= 0) {
    return DEFAULT_ACCURACY_METERS;
  }

  return accuracyMeters;
}

export function isAcceptableAccuracy(accuracyMeters: number | null | undefined): boolean {
  if (accuracyMeters == null || !Number.isFinite(accuracyMeters)) {
    return true;
  }

  return accuracyMeters > 0 && accuracyMeters <= MAX_ACCEPTABLE_ACCURACY_METERS;
}

export function isPlausibleMovement(
  deltaMeters: number,
  deltaMs: number,
  options?: { relaxed?: boolean },
): boolean {
  if (deltaMs <= 0) {
    return deltaMeters === 0;
  }

  const speedMps = deltaMeters / (deltaMs / 1000);
  const maxSpeed = options?.relaxed ? MAX_PLAUSIBLE_SPEED_MPS * 1.35 : MAX_PLAUSIBLE_SPEED_MPS;
  return speedMps <= maxSpeed;
}

/**
 * Floor for the movement gate (meters). Outdoor GPS still jitters ~1 m while
 * standing; 1.4 m lets sidewalk steps and corners append without waiting 2–3
 * walking strides (2.5 m previously chorded the trail through buildings).
 */
const STATIONARY_JITTER_FLOOR_METERS = 1.4;

/** Movement must exceed a fraction of GPS error radius before appending a route point. */
export function getMinMovementMeters(accuracyMeters: number): number {
  const safeAccuracy = resolveAccuracyMeters(accuracyMeters);
  return Math.max(STATIONARY_JITTER_FLOOR_METERS, safeAccuracy * 0.22);
}

export function detectMotionState(
  speedMps: number | null,
  deltaMeters: number,
  deltaMs: number,
): MotionState {
  const impliedSpeed = deltaMs > 0 ? deltaMeters / (deltaMs / 1000) : 0;
  const effectiveSpeed = speedMps != null && Number.isFinite(speedMps) ? speedMps : impliedSpeed;
  return effectiveSpeed >= MIN_SPEED_TO_RECORD_MPS ? 'walking' : 'stationary';
}

type StationaryInput = {
  speedMps: number | null;
  deltaMeters: number;
  deltaMs: number;
  minMovementMeters: number;
};

export function isStationary({
  speedMps,
  deltaMeters,
  deltaMs,
  minMovementMeters,
}: StationaryInput): boolean {
  const impliedSpeed =
    deltaMs > 0 ? deltaMeters / (deltaMs / 1000) : 0;

  // When the OS reports stopped (speed === 0) or omits speed, do not treat GPS
  // jitter between fixes as walking — implied speed can exceed the record floor
  // even while the volunteer stands still (common outdoors with multipath).
  if (speedMps == null || (Number.isFinite(speedMps) && speedMps === 0)) {
    return deltaMeters < minMovementMeters * 2;
  }

  // Trust device speed only when it reports a positive value. iOS/Android
  // often report speedMps === 0 while the user is walking outdoors, which
  // previously classified real movement as stationary and blocked the trail.
  if (speedMps > 0) {
    if (speedMps < MIN_SPEED_TO_RECORD_MPS && deltaMeters < minMovementMeters * 2) {
      return true;
    }
  }

  return impliedSpeed < MIN_SPEED_TO_RECORD_MPS && deltaMeters < minMovementMeters;
}

function bearingDifferenceDegrees(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Reject GPS spikes that reverse direction sharply over a short segment. */
export function isSharpReversal(
  prevRoutePoint: RouteCoordinate,
  lastRoutePoint: RouteCoordinate,
  candidate: RouteCoordinate,
): boolean {
  const segmentMeters = deltaMetersBetween(lastRoutePoint, candidate);
  if (segmentMeters > SHARP_REVERSAL_MAX_DISTANCE_METERS) {
    return false;
  }

  const inboundBearing = computeBearingDegrees(prevRoutePoint, lastRoutePoint);
  const outboundBearing = computeBearingDegrees(lastRoutePoint, candidate);
  const turn = bearingDifferenceDegrees(inboundBearing, outboundBearing);

  return turn >= SHARP_REVERSAL_BEARING_DEGREES;
}

export type AppendRoutePointInput = {
  lastRoutePoint: RouteCoordinate;
  prevRoutePoint: RouteCoordinate | null;
  candidate: RouteCoordinate;
  accuracyMeters: number;
  speedMps: number | null;
  deltaMetersFromRoute: number;
  deltaMetersFromLastFix: number;
  deltaMs: number;
  sessionStartedAt: number;
  sampleTimestamp: number;
  lastRouteAppendTimestamp: number | null;
};

export function shouldAppendRoutePoint(input: AppendRoutePointInput): boolean {
  const {
    lastRoutePoint,
    prevRoutePoint,
    candidate,
    accuracyMeters,
    speedMps,
    deltaMetersFromRoute,
    deltaMetersFromLastFix,
    deltaMs,
    sessionStartedAt,
    sampleTimestamp,
    lastRouteAppendTimestamp,
  } = input;

  if (sampleTimestamp - sessionStartedAt < GPS_WARMUP_MS) {
    return false;
  }

  const minMovementMeters = getMinMovementMeters(accuracyMeters);
  const gapSinceRouteAppend =
    lastRouteAppendTimestamp != null ? sampleTimestamp - lastRouteAppendTimestamp : deltaMs;
  const longGapRecovery = gapSinceRouteAppend >= ROUTE_GAP_RECOVERY_MS;
  const effectiveMinMovement = longGapRecovery ? minMovementMeters * 0.5 : minMovementMeters;

  if (deltaMetersFromRoute < effectiveMinMovement) {
    return false;
  }

  // Use distance from the last *route* point (not the last pin tick). Kalman
  // pin steps are often <1 m even while walking; the route gap is the signal.
  if (
    isStationary({
      speedMps,
      deltaMeters: deltaMetersFromRoute,
      deltaMs: gapSinceRouteAppend > 0 ? gapSinceRouteAppend : deltaMs,
      minMovementMeters: effectiveMinMovement,
    })
  ) {
    return false;
  }

  if (!isPlausibleMovement(deltaMetersFromLastFix, deltaMs, { relaxed: longGapRecovery })) {
    return false;
  }

  if (prevRoutePoint && isSharpReversal(prevRoutePoint, lastRoutePoint, candidate)) {
    return false;
  }

  return true;
}

/** Bearing in degrees clockwise from north (0–360). */
export function computeBearingDegrees(from: RouteCoordinate, to: RouteCoordinate): number {
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

type HeadingInput = {
  heading?: number | null;
  previous: RouteCoordinate | null;
  current: RouteCoordinate;
};

/** Prefer GPS heading when valid; otherwise derive from last movement. Used
 * only as a fallback while the device compass is unavailable — see
 * `resolveCompassHeading` for the primary heading source. */
export function resolveHeading({ heading, previous, current }: HeadingInput): number | null {
  if (heading != null && Number.isFinite(heading) && heading >= 0) {
    return heading;
  }

  if (!previous) {
    return null;
  }

  return computeBearingDegrees(previous, current);
}

type CompassHeadingInput = {
  trueHeading?: number | null;
  magHeading?: number | null;
  /** Platform-specific compass accuracy from `Location.watchHeadingAsync`. */
  accuracy?: number | null;
  /**
   * OS for interpreting `accuracy` (iOS = degrees of deviation; Android = 0–3
   * calibration). Defaults to iOS semantics when omitted (unit-test friendly).
   */
  platform?: string | null;
};

/** iOS: max degrees of deviation still trusted for true-north. */
const IOS_TRUE_HEADING_MAX_DEVIATION_DEG = 15;

/** iOS: reject the whole reading when deviation is this bad (interference). */
const IOS_COMPASS_UNUSABLE_DEVIATION_DEG = 40;

/** Android: minimum calibration tier (0–3) for trusting true-north. */
const ANDROID_TRUE_HEADING_MIN_CALIBRATION = 2;

/** Android: reject readings at or below this calibration tier. */
const ANDROID_COMPASS_UNUSABLE_CALIBRATION = 0;

function isAndroidPlatform(platform: string | null | undefined): boolean {
  return platform === 'android';
}

/**
 * Resolves a compass reading (from `Location.watchHeadingAsync`) to a single
 * heading in degrees.
 *
 * Prefers true-north when available and sufficiently calibrated; otherwise
 * uses magnetic-north. Returns null when the sensor looks unusable (avoids
 * locking onto `-1` / uncalibrated spikes that make the UI spin).
 */
export function resolveCompassHeading({
  trueHeading,
  magHeading,
  accuracy = null,
  platform = null,
}: CompassHeadingInput): number | null {
  if (!isCompassReadingUsable(accuracy, platform)) {
    return null;
  }

  const trueOk =
    trueHeading != null && Number.isFinite(trueHeading) && trueHeading >= 0;
  const magOk =
    magHeading != null && Number.isFinite(magHeading) && magHeading >= 0;

  if (trueOk && isTrueHeadingReliable(accuracy, platform)) {
    return trueHeading;
  }

  if (magOk) {
    return magHeading;
  }

  // Last resort: accept true heading even with unknown accuracy.
  if (trueOk) {
    return trueHeading;
  }

  return null;
}

/**
 * Whether the magnetometer reading is trustworthy enough to update UI.
 *
 * expo-location heading `accuracy`:
 * - iOS: degrees of deviation (lower is better); negative = unreliable
 * - Android: calibration level 0–3 (higher is better); negative = uncalibrated
 */
export function isCompassReadingUsable(
  accuracy: number | null | undefined,
  platform?: string | null,
): boolean {
  if (accuracy == null || !Number.isFinite(accuracy)) {
    return true;
  }

  if (accuracy < 0) {
    return false;
  }

  if (isAndroidPlatform(platform)) {
    return accuracy > ANDROID_COMPASS_UNUSABLE_CALIBRATION;
  }

  return accuracy <= IOS_COMPASS_UNUSABLE_DEVIATION_DEG;
}

/**
 * Whether true-north (vs magnetic) should be preferred for this reading.
 *
 * Accept excellent iOS deviation (including 0°) and Android medium/high
 * calibration (2–3). Large iOS deviation and Android low/uncalibrated tiers
 * fall through to magnetic north.
 */
export function isTrueHeadingReliable(
  accuracy: number | null | undefined,
  platform?: string | null,
): boolean {
  if (accuracy == null || !Number.isFinite(accuracy) || accuracy < 0) {
    return false;
  }

  if (isAndroidPlatform(platform)) {
    return accuracy >= ANDROID_TRUE_HEADING_MIN_CALIBRATION;
  }

  return accuracy <= IOS_TRUE_HEADING_MAX_DEVIATION_DEG;
}

/**
 * Baseline EMA weight when callers pass an explicit alpha.
 * Prefer {@link headingEmaAlpha} / adaptive {@link smoothHeadingEma} for live UI.
 */
export const HEADING_EMA_ALPHA = 0.45;

/** Slow EMA when the phone is nearly still (suppress magnetometer noise). */
export const HEADING_EMA_ALPHA_MIN = 0.35;

/** Fast EMA on intentional turns (cut perceived lag). */
export const HEADING_EMA_ALPHA_MAX = 0.8;

const HEADING_EMA_DEADBAND_DEG = 3;
const HEADING_EMA_SNAP_DEG = 40;

/**
 * Adaptive EMA weight from the shortest-path turn size: low for jitter,
 * high for quick direction changes.
 */
export function headingEmaAlpha(deltaDegrees: number): number {
  const abs = Math.abs(deltaDegrees);
  if (abs <= HEADING_EMA_DEADBAND_DEG) {
    return HEADING_EMA_ALPHA_MIN;
  }
  if (abs >= HEADING_EMA_SNAP_DEG) {
    return HEADING_EMA_ALPHA_MAX;
  }

  const t =
    (abs - HEADING_EMA_DEADBAND_DEG) /
    (HEADING_EMA_SNAP_DEG - HEADING_EMA_DEADBAND_DEG);
  return HEADING_EMA_ALPHA_MIN + t * (HEADING_EMA_ALPHA_MAX - HEADING_EMA_ALPHA_MIN);
}

/**
 * EMA-smooths a compass heading to reduce magnetometer jitter, correctly
 * handling the 0°/360° wrap-around (e.g. 359° → 2° is a +3° turn, not -357°).
 *
 * When `alpha` is omitted, uses {@link headingEmaAlpha} so large turns track
 * quickly while small noise stays damped.
 */
export function smoothHeadingEma(
  previous: number | null,
  next: number,
  alpha?: number,
): number {
  if (previous == null) {
    return next;
  }

  const rawDelta = next - previous;
  const shortestDelta = ((rawDelta + 180) % 360 + 360) % 360 - 180;
  const resolvedAlpha = alpha ?? headingEmaAlpha(shortestDelta);
  return (previous + shortestDelta * resolvedAlpha + 360) % 360;
}

/** Live map pin: hold at the last route point while jitter is classified stationary. */
export function resolveLivePinCoordinate(input: {
  filteredCoordinate: RouteCoordinate;
  lastRoutePoint: RouteCoordinate | null;
  speedMps: number | null;
  accuracyMeters: number;
  sampleTimestampMs: number;
  lastRouteAppendTimestampMs: number | null;
}): RouteCoordinate {
  const {
    filteredCoordinate,
    lastRoutePoint,
    speedMps,
    accuracyMeters,
    sampleTimestampMs,
    lastRouteAppendTimestampMs,
  } = input;

  if (!lastRoutePoint) {
    return filteredCoordinate;
  }

  const deltaMeters = deltaMetersBetween(lastRoutePoint, filteredCoordinate);
  const minMovementMeters = getMinMovementMeters(accuracyMeters);
  const gapMs =
    lastRouteAppendTimestampMs != null
      ? Math.max(0, sampleTimestampMs - lastRouteAppendTimestampMs)
      : 1000;

  if (
    isStationary({
      speedMps,
      deltaMeters,
      deltaMs: gapMs,
      minMovementMeters,
    })
  ) {
    return lastRoutePoint;
  }

  return filteredCoordinate;
}

/** EMA smooth a coordinate for live map display only. */
export function smoothCoordinateEma(
  previous: RouteCoordinate | null,
  next: RouteCoordinate,
  alpha = DISPLAY_COORDINATE_EMA_ALPHA,
): RouteCoordinate {
  if (!previous) {
    return next;
  }

  return [
    previous[0] * (1 - alpha) + next[0] * alpha,
    previous[1] * (1 - alpha) + next[1] * alpha,
  ];
}

function perpendicularDistanceMeters(
  point: RouteCoordinate,
  lineStart: RouteCoordinate,
  lineEnd: RouteCoordinate,
): number {
  const lineLengthMeters = deltaMetersBetween(lineStart, lineEnd);
  if (lineLengthMeters === 0) {
    return deltaMetersBetween(point, lineStart);
  }

  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const t = Math.max(
    0,
    Math.min(
      1,
      ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) /
        ((x2 - x1) ** 2 + (y2 - y1) ** 2),
    ),
  );

  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);

  return deltaMetersBetween(point, [projX, projY]);
}

function douglasPeucker(
  coordinates: RouteCoordinate[],
  toleranceMeters: number,
): RouteCoordinate[] {
  if (coordinates.length < 3) {
    return coordinates;
  }

  let maxDistance = 0;
  let maxIndex = 0;
  const endIndex = coordinates.length - 1;

  for (let index = 1; index < endIndex; index += 1) {
    const distance = perpendicularDistanceMeters(
      coordinates[index],
      coordinates[0],
      coordinates[endIndex],
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = index;
    }
  }

  if (maxDistance > toleranceMeters) {
    const left = douglasPeucker(coordinates.slice(0, maxIndex + 1), toleranceMeters);
    const right = douglasPeucker(coordinates.slice(maxIndex), toleranceMeters);
    return [...left.slice(0, -1), ...right];
  }

  return [coordinates[0], coordinates[endIndex]];
}

/** Remove isolated spikes before display simplification. */
function removeDisplayOutliers(coordinates: RouteCoordinate[]): RouteCoordinate[] {
  if (coordinates.length < 3) {
    return coordinates;
  }

  const filtered: RouteCoordinate[] = [coordinates[0]];

  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const prevRoutePoint = filtered[filtered.length - 1];
    const prevRoutePoint2 = filtered.length >= 2 ? filtered[filtered.length - 2] : null;
    const current = coordinates[index];
    const next = coordinates[index + 1];

    if (prevRoutePoint2 && isSharpReversal(prevRoutePoint2, prevRoutePoint, current)) {
      continue;
    }

    const deviation = perpendicularDistanceMeters(current, prevRoutePoint, next);
    if (deviation > DISPLAY_SIMPLIFY_TOLERANCE_METERS * 2) {
      continue;
    }

    filtered.push(current);
  }

  filtered.push(coordinates[coordinates.length - 1]);
  return filtered;
}

/** Light 3-point weighted moving average for map display only. */
export function smoothRouteForDisplay(coordinates: RouteCoordinate[]): RouteCoordinate[] {
  if (coordinates.length < 3) {
    return coordinates;
  }

  const smoothed: RouteCoordinate[] = [coordinates[0]];

  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const prev = coordinates[index - 1];
    const current = coordinates[index];
    const next = coordinates[index + 1];

    smoothed.push([
      prev[0] * 0.25 + current[0] * 0.5 + next[0] * 0.25,
      prev[1] * 0.25 + current[1] * 0.5 + next[1] * 0.25,
    ]);
  }

  smoothed.push(coordinates[coordinates.length - 1]);
  return smoothed;
}

/** Full display pipeline: outlier removal → Douglas-Peucker → light smooth. */
export function simplifyRouteForDisplay(
  coordinates: RouteCoordinate[],
  toleranceMeters = DISPLAY_SIMPLIFY_TOLERANCE_METERS,
): RouteCoordinate[] {
  if (coordinates.length < 2) {
    return coordinates;
  }

  const withoutOutliers = removeDisplayOutliers(coordinates);
  const simplified =
    withoutOutliers.length >= 3
      ? douglasPeucker(withoutOutliers, toleranceMeters)
      : withoutOutliers;

  return smoothRouteForDisplay(simplified);
}

/** Live tracker display: lighter simplify with recent raw tail for fluid motion. */
export function simplifyRouteForLiveDisplay(coordinates: RouteCoordinate[]): RouteCoordinate[] {
  if (coordinates.length < 2) {
    return coordinates;
  }

  if (coordinates.length <= LIVE_DISPLAY_TAIL_RAW_POINTS + 2) {
    return simplifyRouteForDisplay(coordinates, LIVE_DISPLAY_SIMPLIFY_TOLERANCE_METERS);
  }

  const splitIndex = coordinates.length - LIVE_DISPLAY_TAIL_RAW_POINTS;
  const head = coordinates.slice(0, splitIndex);
  const tail = coordinates.slice(splitIndex);
  const simplifiedHead = simplifyRouteForDisplay(head, LIVE_DISPLAY_SIMPLIFY_TOLERANCE_METERS);

  if (simplifiedHead.length === 0) {
    return tail;
  }

  const lastHead = simplifiedHead[simplifiedHead.length - 1];
  const firstTail = tail[0];
  if (deltaMetersBetween(lastHead, firstTail) < 1) {
    return [...simplifiedHead.slice(0, -1), ...tail];
  }

  return [...simplifiedHead, ...tail];
}

/**
 * Extends an existing display polyline to the EMA-smoothed tip between GPS
 * appends. Does not invent a line from a single seed/pin — standing still
 * (or pre-walk GPS jitter) must keep the map as a marker only.
 */
export function appendLiveTipToDisplayRoute(
  displayRoute: RouteCoordinate[],
  tip: RouteCoordinate | null,
): RouteCoordinate[] {
  if (!tip || !isRouteCoordinate(tip)) {
    return displayRoute;
  }

  // Need a real polyline (≥2 committed points) before extending to the tip.
  // A single seed + jittered pin would otherwise draw a fake straight segment.
  if (displayRoute.length < 2) {
    return displayRoute;
  }

  const last = displayRoute[displayRoute.length - 1];
  if (deltaMetersBetween(last, tip) < 0.15) {
    return displayRoute;
  }

  return [...displayRoute, tip];
}

/** Slices a route by fraction of path length (0–1), with interpolated tip. */
export function sliceRouteByDistanceProgress(
  coords: RouteCoordinate[],
  progress: number,
): RouteCoordinate[] {
  if (coords.length < 2) {
    return coords;
  }

  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped <= 0) {
    return [coords[0]];
  }

  if (clamped >= 1) {
    return coords;
  }

  const cumulative: number[] = [0];
  for (let index = 1; index < coords.length; index += 1) {
    cumulative.push(cumulative[index - 1] + deltaMetersBetween(coords[index - 1], coords[index]));
  }

  const totalMeters = cumulative[cumulative.length - 1];
  if (totalMeters <= 0) {
    return [coords[0]];
  }

  const targetMeters = clamped * totalMeters;
  let segmentIndex = 1;
  while (segmentIndex < cumulative.length && cumulative[segmentIndex] < targetMeters) {
    segmentIndex += 1;
  }

  if (segmentIndex >= coords.length) {
    return coords;
  }

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

/** Foreground + background GPS can deliver the same fix within a short window. */
export const DUPLICATE_SAMPLE_WINDOW_MS = 750;
export const DUPLICATE_SAMPLE_MAX_METERS = 2;

export function shouldSkipDuplicateLocationSample(params: {
  sampleTimestampMs: number;
  coordinate: RouteCoordinate;
  lastProcessedTimestampMs: number | null;
  lastProcessedCoordinate: RouteCoordinate | null;
}): boolean {
  const {
    sampleTimestampMs,
    coordinate,
    lastProcessedTimestampMs,
    lastProcessedCoordinate,
  } = params;

  if (lastProcessedTimestampMs == null || lastProcessedCoordinate == null) {
    return false;
  }

  if (sampleTimestampMs <= lastProcessedTimestampMs) {
    return true;
  }

  const deltaMs = sampleTimestampMs - lastProcessedTimestampMs;
  if (deltaMs > DUPLICATE_SAMPLE_WINDOW_MS) {
    return false;
  }

  return deltaMetersBetween(lastProcessedCoordinate, coordinate) < DUPLICATE_SAMPLE_MAX_METERS;
}

export function deltaMetersBetween(from: RouteCoordinate, to: RouteCoordinate): number {
  if (!isRouteCoordinate(from) || !isRouteCoordinate(to)) {
    return Number.POSITIVE_INFINITY;
  }
  return milesToMeters(
    haversineMiles(from[1], from[0], to[1], to[0]),
  );
}

/**
 * Below this span, a route is treated as "the user never actually moved" for display
 * purposes — e.g. a GPS fix settling shortly after the warmup seed can produce a second,
 * spurious point a few meters from the first even though the user stood still.
 */
const STATIONARY_ROUTE_SPAN_METERS = 8;

/** Recorded distance below this is treated as jitter-only for replay collapse (miles). */
const STATIONARY_ROUTE_DISTANCE_MILES = 0.01;

/** Max distance from the first point to any other point in the route. */
export function getRouteSpanMeters(coordinates: RouteCoordinate[]): number {
  if (coordinates.length < 2) {
    return 0;
  }
  const origin = coordinates[0];
  let maxSpan = 0;
  for (const coordinate of coordinates) {
    const distance = deltaMetersBetween(origin, coordinate);
    if (distance > maxSpan) {
      maxSpan = distance;
    }
  }
  return maxSpan;
}

export type CollapseStationaryRouteOptions = {
  /** Session distance from the tracker — suppresses replay lines for jitter-only paths. */
  distanceMiles?: number | null;
};

/**
 * Collapses a route to its single starting point when every recorded point is within
 * jitter distance of it, so replay UIs don't draw a line or animate a marker for a
 * session where the user never moved.
 */
export function collapseStationaryRoute(
  coordinates: RouteCoordinate[],
  options?: CollapseStationaryRouteOptions,
): RouteCoordinate[] {
  if (coordinates.length < 2) {
    return coordinates;
  }

  if (getRouteSpanMeters(coordinates) < STATIONARY_ROUTE_SPAN_METERS) {
    return [coordinates[0]];
  }

  const distanceMiles = options?.distanceMiles;
  if (
    distanceMiles != null &&
    Number.isFinite(distanceMiles) &&
    Math.max(0, distanceMiles) < STATIONARY_ROUTE_DISTANCE_MILES
  ) {
    return [coordinates[0]];
  }

  return coordinates;
}
