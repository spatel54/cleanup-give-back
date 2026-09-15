import * as Location from 'expo-location';
import { useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { isApiConfigured } from '@/lib/api';
import {
  addCheckpoint,
  createSession,
  deleteSession,
  finalizeSession,
} from '@/lib/sessionsApi';
import { uploadCheckpointPhotos } from '@/lib/uploadCheckpointPhotos';
import { isExpoGoClient } from '@/utils/isExpoGoClient';
import { requestSessionAlwaysLocationIfPossible } from '@/utils/sessionPermissions';

import {
  endLiveSessionLiveActivity,
  maybeUpdateLiveSessionLiveActivity,
  startLiveSessionLiveActivity,
  syncLiveSessionLiveActivityCheckpoint,
  type LiveActivitySessionState,
} from './liveSessionLiveActivity';
import { BACKGROUND_LOCATION_TASK } from './backgroundLocationConstants';
import {
  CHECKPOINT_MISS_GRACE_MS,
  MIN_SUBMITTED_SESSION_PHOTOS,
  PHOTO_CHECKPOINT_INTERVAL_SECONDS,
} from './checkpointConstants';
import { recordCompletedSession } from './recentSessionsStore';
import { cacheCompletedSession } from './completedSessionCache';
import { recordSessionStatFromSnapshot } from './sessionStatsStore';
import { recordImpactFeedFromSnapshot } from './impactFeedStore';
import { DEFAULT_MAP_LAYER, type MapLayerType } from './utils/mapStyles';
import {
  computeSessionDurationSeconds,
  countSubmittedCheckpointPhotos,
} from './utils/sessionFormat';
import {
  haversineMiles,
  isRouteCoordinate,
  MIN_ROUTE_SAMPLE_METERS,
  toRouteCoordinate,
  type RouteCoordinate,
} from './utils/geo';
import {
  createLocationKalmanFilter,
  resetLocationKalmanFilter,
  updateLocationKalman,
  type LocationKalmanFilter,
} from './utils/locationKalman';
import {
  appendLiveTipToDisplayRoute,
  deltaMetersBetween,
  isAcceptableAccuracy,
  resolveAccuracyMeters,
  resolveCompassHeading,
  resolveHeading,
  resolveLivePinCoordinate,
  shouldAppendRoutePoint,
  shouldSkipDuplicateLocationSample,
  simplifyRouteForDisplay,
  simplifyRouteForLiveDisplay,
  smoothCoordinateEma,
  smoothHeadingEma,
  type RouteSample,
} from './utils/routeFiltering';
import {
  cancelCheckpointNotifications,
  scheduleCheckpointNotifications,
} from './checkpointNotifications';

export { CHECKPOINT_MISS_GRACE_MS, PHOTO_CHECKPOINT_INTERVAL_SECONDS } from './checkpointConstants';

export type LiveSessionSetup = {
  activity: string;
  date: Date;
  courtOrdered: boolean;
  description: string;
};

export type CheckpointSyncStatus = 'pending' | 'synced' | 'failed';

export type PhotoCheckpointSubmission = {
  id: string;
  selfieUri: string;
  progressUri: string;
  capturedAt: number;
  /** True when submitted before the 30-minute checkpoint countdown reached zero. */
  submittedEarly: boolean;
  /** WGS84 at capture — embedded on the Fly checkpoint row for trail pins. */
  latitude: number | null;
  longitude: number | null;
  /**
   * Upload status for this checkpoint's photos. The photos themselves are always
   * already saved to persistent on-device storage by the time this is 'failed' —
   * see `persistCheckpointPhotos.ts` — so 'failed' only ever means "not yet synced
   * to the server," never "photo lost."
   */
  syncStatus: CheckpointSyncStatus;
};

export type CompletedSessionSnapshot = {
  remoteSessionId: string | null;
  setup: LiveSessionSetup;
  startedAt: number;
  endedAt: number;
  elapsedSeconds: number;
  distanceMiles: number;
  routeCoordinates: RouteCoordinate[];
  routeSamples: RouteSample[];
  submittedCheckpoints: PhotoCheckpointSubmission[];
  /** Basemap layer at session end — preserved for route replay screens. */
  mapLayer: MapLayerType;
  /** Unpaid orientation End Session — logged as a 1-hour approved free hour. */
  skipOrientation?: boolean;
};

type LiveSessionState = {
  isActive: boolean;
  remoteSessionId: string | null;
  startedAt: number | null;
  checkpointWindowStartedAt: number | null;
  elapsedSeconds: number;
  checkpointSecondsRemaining: number;
  /**
   * Reactive mirror of isCheckpointDueOrGrace(), recomputed every tick.
   * Components MUST read this via useLiveSession() rather than calling
   * isCheckpointDueOrGrace() directly in a render body — that function reads
   * Date.now() and module-level state with no React-tracked inputs, so React
   * Compiler's auto-memoization sees zero dependencies and caches the first
   * result forever, freezing the UI on whatever it returned at first render.
   */
  checkpointDueOrGrace: boolean;
  /** Reactive mirror of getCheckpointOverdueSeconds() — same staleness trap as above. */
  checkpointOverdueSeconds: number;
  distanceMiles: number;
  setup: LiveSessionSetup | null;
  routeCoordinates: RouteCoordinate[];
  routeSamples: RouteSample[];
  displayRouteCoordinates: RouteCoordinate[];
  currentCoordinate: RouteCoordinate | null;
  displayCoordinate: RouteCoordinate | null;
  currentHeading: number | null;
  mapRecenterToken: number;
  mapFollowEnabled: boolean;
  mapLayer: MapLayerType;
  submittedCheckpoints: PhotoCheckpointSubmission[];
  sessionSyncWarning: string | null;
  backgroundLocationEnabled: boolean;
  /** `checkpointWindowStartedAt` of each window whose grace expired unsubmitted —
   * tracking never pauses for this; it's kept for the session's own record. */
  checkpointMisses: number[];
  /** False for volunteers under 18 — no start / mid / end session photos. */
  photosEnabled: boolean;
};

let state: LiveSessionState = {
  isActive: false,
  remoteSessionId: null,
  startedAt: null,
  checkpointWindowStartedAt: null,
  elapsedSeconds: 0,
  checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
  checkpointDueOrGrace: false,
  checkpointOverdueSeconds: 0,
  distanceMiles: 0,
  setup: null,
  routeCoordinates: [],
  routeSamples: [],
  displayRouteCoordinates: [],
  currentCoordinate: null,
  displayCoordinate: null,
  currentHeading: null,
  mapRecenterToken: 0,
  mapFollowEnabled: false,
  mapLayer: DEFAULT_MAP_LAYER,
  submittedCheckpoints: [],
  sessionSyncWarning: null,
  backgroundLocationEnabled: false,
  checkpointMisses: [],
  photosEnabled: true,
};

let completedSessionSnapshot: CompletedSessionSnapshot | null = null;
// Survives endLiveSession()'s `state` reset (unlike `state.sessionSyncWarning`)
// so the confirmation screen can still tell the last finalize didn't sync.
let lastFinalizeSyncFailed = false;

let tickInterval: ReturnType<typeof setInterval> | null = null;
let locationSubscription: Location.LocationSubscription | null = null;
let headingSubscription: Location.LocationSubscription | null = null;
let lastAcceptedTimestamp: number | null = null;
let lastRouteAppendTimestamp: number | null = null;
let lastProcessedSampleTimestamp: number | null = null;
let lastProcessedCoordinate: RouteCoordinate | null = null;
let locationKalman: LocationKalmanFilter = createLocationKalmanFilter();
let locationWatchGeneration = 0;
let headingWatchGeneration = 0;
let compassAvailable = false;
let lastHeadingNotifyMs = 0;
/** EMA accumulator for the compass, kept independent of the published heading
 * so readings held back by the notify gates below still advance the filter. */
let smoothedCompassHeading: number | null = null;
let lastUsableCompassReadingMs = 0;
let emptyRouteDiagnosticLogged = false;
let firstPinWithoutRouteAtMs: number | null = null;
const listeners = new Set<() => void>();

function notify() {
  // Isolate each listener — Set#forEach aborts the whole broadcast the moment
  // one callback throws, which previously let a single bad subscriber (e.g.
  // CheckpointAlertLoop) silently freeze every other screen's useLiveSession()
  // re-render (elapsed time, live pill, etc.) for the rest of the session.
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('[liveSessionStore] listener threw during notify():', error);
    }
  });
}

function setState(patch: Partial<LiveSessionState>) {
  state = { ...state, ...patch };
  notify();
}

function setSessionSyncWarning(message: string | null) {
  if (state.sessionSyncWarning === message) {
    return;
  }

  setState({ sessionSyncWarning: message });
}

function deriveElapsedSeconds(startedAt: number | null): number {
  if (startedAt == null) {
    return 0;
  }

  return Math.floor((Date.now() - startedAt) / 1000);
}

function deriveCheckpointSecondsRemaining(checkpointWindowStartedAt: number | null): number {
  if (checkpointWindowStartedAt == null) {
    return PHOTO_CHECKPOINT_INTERVAL_SECONDS;
  }

  const elapsedInWindow = Math.floor((Date.now() - checkpointWindowStartedAt) / 1000);
  return Math.max(0, PHOTO_CHECKPOINT_INTERVAL_SECONDS - elapsedInWindow);
}

function buildLiveActivitySessionState(): LiveActivitySessionState | null {
  if (!state.isActive || state.startedAt == null) {
    return null;
  }

  return {
    startedAt: state.startedAt,
    distanceMiles: state.distanceMiles,
    checkpointWindowStartedAt: state.checkpointWindowStartedAt,
    photosEnabled: state.photosEnabled,
    checkpointDueOrGrace: isCheckpointDueOrGrace(),
  };
}

function syncSessionClocks() {
  if (!state.isActive || state.startedAt == null) {
    return;
  }

  setState({
    elapsedSeconds: deriveElapsedSeconds(state.startedAt),
    checkpointSecondsRemaining: deriveCheckpointSecondsRemaining(state.checkpointWindowStartedAt),
    checkpointDueOrGrace: isCheckpointDueOrGrace(),
    checkpointOverdueSeconds: getCheckpointOverdueSeconds(),
  });

  if (isCheckpointMissed()) {
    recordCheckpointMissIfNeeded();
  }

  const liveActivityState = buildLiveActivitySessionState();
  if (liveActivityState) {
    maybeUpdateLiveSessionLiveActivity(liveActivityState);
  }
}

function startTicking() {
  if (tickInterval) {
    return;
  }

  tickInterval = setInterval(() => {
    if (!state.isActive) {
      return;
    }

    syncSessionClocks();
  }, 1000);
}

function stopTicking() {
  if (!tickInterval) {
    return;
  }

  clearInterval(tickInterval);
  tickInterval = null;
}

function buildDisplayRoute(routeCoordinates: RouteCoordinate[]): RouteCoordinate[] {
  return simplifyRouteForLiveDisplay(routeCoordinates);
}

function buildDisplayRouteWithTip(
  routeCoordinates: RouteCoordinate[],
  tip: RouteCoordinate | null,
): RouteCoordinate[] {
  return appendLiveTipToDisplayRoute(buildDisplayRoute(routeCoordinates), tip);
}

function resolveLastRoutePoint(
  routeCoordinates: RouteCoordinate[],
  fallback: RouteCoordinate | null,
): RouteCoordinate | null {
  const tail =
    routeCoordinates.length > 0 ? routeCoordinates[routeCoordinates.length - 1] : null;
  if (isRouteCoordinate(tail)) {
    return tail;
  }
  if (isRouteCoordinate(fallback)) {
    return fallback;
  }
  return null;
}

function appendRouteSample(sample: RouteSample) {
  const routeCoordinates = [...state.routeCoordinates, sample.coordinate];
  const displayRouteCoordinates = buildDisplayRouteWithTip(
    routeCoordinates,
    state.displayCoordinate,
  );
  setState({
    routeCoordinates,
    routeSamples: [...state.routeSamples, sample],
    displayRouteCoordinates,
  });
}

function recordLocationSample(position: Location.LocationObject) {
  if (!state.isActive || state.startedAt == null) {
    return;
  }

  const sampleTimestamp = position.timestamp ?? Date.now();

  const { latitude, longitude, accuracy, heading, speed } = position.coords;
  const resolvedAccuracy = resolveAccuracyMeters(accuracy);
  const filteredCoordinate = updateLocationKalman(locationKalman, {
    latitude,
    longitude,
    accuracyMeters: resolvedAccuracy,
    timestampMs: sampleTimestamp,
  });

  if (!isRouteCoordinate(filteredCoordinate)) {
    return;
  }

  if (
    lastProcessedSampleTimestamp != null &&
    !isRouteCoordinate(lastProcessedCoordinate)
  ) {
    lastProcessedSampleTimestamp = null;
    lastProcessedCoordinate = null;
  }

  if (
    shouldSkipDuplicateLocationSample({
      sampleTimestampMs: sampleTimestamp,
      coordinate: filteredCoordinate,
      lastProcessedTimestampMs: lastProcessedSampleTimestamp,
      lastProcessedCoordinate,
    })
  ) {
    lastProcessedSampleTimestamp = sampleTimestamp;
    return;
  }

  lastProcessedSampleTimestamp = sampleTimestamp;
  lastProcessedCoordinate = filteredCoordinate;

  const previousCoordinate = state.currentCoordinate;
  const speedMps = speed != null && Number.isFinite(speed) && speed >= 0 ? speed : null;
  const lastRoutePointForPin = resolveLastRoutePoint(state.routeCoordinates, null);
  const pinCoordinate = resolveLivePinCoordinate({
    filteredCoordinate,
    lastRoutePoint: lastRoutePointForPin,
    speedMps,
    accuracyMeters: resolvedAccuracy,
    sampleTimestampMs: sampleTimestamp,
    lastRouteAppendTimestampMs: lastRouteAppendTimestamp,
  });
  const pinIsFrozen =
    lastRoutePointForPin != null &&
    pinCoordinate[0] === lastRoutePointForPin[0] &&
    pinCoordinate[1] === lastRoutePointForPin[1];
  const nextDisplayCoordinate = pinIsFrozen
    ? lastRoutePointForPin
    : smoothCoordinateEma(state.displayCoordinate, filteredCoordinate);
  const nextHeading = isCompassLive()
    ? state.currentHeading
    : (resolveHeading({
        heading,
        previous: pinIsFrozen ? lastRoutePointForPin : previousCoordinate,
        current: pinCoordinate,
      }) ?? state.currentHeading);
  const nextDisplayRoute = buildDisplayRouteWithTip(state.routeCoordinates, nextDisplayCoordinate);

  // Pin the map to the latest fix immediately, even before GPS accuracy settles.
  setState({
    currentCoordinate: pinCoordinate,
    displayCoordinate: nextDisplayCoordinate,
    currentHeading: nextHeading,
    displayRouteCoordinates: nextDisplayRoute,
  });

  if (__DEV__) {
    if (state.routeCoordinates.length === 0) {
      if (firstPinWithoutRouteAtMs == null) {
        firstPinWithoutRouteAtMs = Date.now();
      } else if (
        !emptyRouteDiagnosticLogged &&
        Date.now() - firstPinWithoutRouteAtMs > 10_000
      ) {
        emptyRouteDiagnosticLogged = true;
        console.info('[location] route still empty after 10s with active pin', {
          rawAccuracyMeters: accuracy,
          resolvedAccuracyMeters: resolvedAccuracy,
        });
      }
    } else {
      firstPinWithoutRouteAtMs = null;
      emptyRouteDiagnosticLogged = false;
    }
  }

  if (!isAcceptableAccuracy(resolvedAccuracy)) {
    return;
  }

  const deltaMs =
    lastAcceptedTimestamp != null ? sampleTimestamp - lastAcceptedTimestamp : 0;
  const deltaMetersFromLastFix = isRouteCoordinate(previousCoordinate)
    ? deltaMetersBetween(previousCoordinate, filteredCoordinate)
    : 0;

  const sample: RouteSample = {
    coordinate: filteredCoordinate,
    accuracyMeters: resolvedAccuracy,
    speedMps,
    heading: nextHeading,
    timestampMs: sampleTimestamp,
  };

  // Seed on an empty route (not `!previousCoordinate`): a sample can set
  // `currentCoordinate` and still be rejected below for poor accuracy before
  // ever appending to `routeCoordinates`, which would otherwise make later
  // samples skip seeding while `routeCoordinates` is still empty and crash
  // on `state.routeCoordinates[-1]` being `undefined`.
  if (state.routeCoordinates.length === 0) {
    lastAcceptedTimestamp = sampleTimestamp;
    lastRouteAppendTimestamp = sampleTimestamp;
    setState({
      routeCoordinates: [filteredCoordinate],
      routeSamples: [sample],
      displayRouteCoordinates: buildDisplayRouteWithTip([filteredCoordinate], nextDisplayCoordinate),
    });
    return;
  }

  const lastRoutePoint = resolveLastRoutePoint(state.routeCoordinates, previousCoordinate);
  if (!lastRoutePoint) {
    lastAcceptedTimestamp = sampleTimestamp;
    lastRouteAppendTimestamp = sampleTimestamp;
    setState({
      routeCoordinates: [filteredCoordinate],
      routeSamples: [sample],
      displayRouteCoordinates: buildDisplayRouteWithTip([filteredCoordinate], nextDisplayCoordinate),
    });
    return;
  }

  const prevRoutePointRaw =
    state.routeCoordinates.length >= 2
      ? state.routeCoordinates[state.routeCoordinates.length - 2]
      : null;
  const prevRoutePoint = isRouteCoordinate(prevRoutePointRaw) ? prevRoutePointRaw : null;
  const deltaMetersFromRoute = deltaMetersBetween(lastRoutePoint, filteredCoordinate);

  if (
    shouldAppendRoutePoint({
      lastRoutePoint,
      prevRoutePoint,
      candidate: filteredCoordinate,
      accuracyMeters: resolvedAccuracy,
      speedMps,
      deltaMetersFromRoute,
      deltaMetersFromLastFix,
      deltaMs,
      sessionStartedAt: state.startedAt,
      sampleTimestamp,
      lastRouteAppendTimestamp,
    })
  ) {
    const deltaMiles = haversineMiles(
      lastRoutePoint[1],
      lastRoutePoint[0],
      filteredCoordinate[1],
      filteredCoordinate[0],
    );

    lastAcceptedTimestamp = sampleTimestamp;
    lastRouteAppendTimestamp = sampleTimestamp;
    appendRouteSample(sample);
    setState({
      distanceMiles: state.distanceMiles + deltaMiles,
    });
    return;
  }

  // Keep lastAcceptedTimestamp at the last seed/append so deltaMs measures
  // time since a route-accepted sample (not every rejected pin tick).
  setState({
    displayRouteCoordinates: buildDisplayRouteWithTip(state.routeCoordinates, nextDisplayCoordinate),
  });
}

export function ingestBackgroundLocationSample(position: Location.LocationObject) {
  recordLocationSample(position);
  if (isCheckpointMissed()) {
    recordCheckpointMissIfNeeded();
  }
}

function getForegroundWatchOptions(): Location.LocationOptions {
  return {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: MIN_ROUTE_SAMPLE_METERS,
    mayShowUserSettingsDialog: true,
    ...(Location.ActivityType && {
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false,
    }),
  };
}

function getBackgroundWatchOptions(): Location.LocationTaskOptions {
  return {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: MIN_ROUTE_SAMPLE_METERS,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Clean Up Give Back',
      notificationBody: 'Tracking your cleanup route',
      notificationColor: '#009540',
    },
    ...(Location.ActivityType && {
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false,
    }),
  };
}

/** Min turn (deg) before notifying React; below this is magnetometer noise. */
const HEADING_NOTIFY_MIN_DELTA_DEG = 0.35;
/** Cap store publish rate (~30 Hz) so listeners stay responsive without thrashing. */
const HEADING_NOTIFY_MIN_INTERVAL_MS = 33;
/**
 * Treat the compass as gone once usable readings stop arriving for this long.
 * `watchHeadingAsync` keeps firing during magnetic interference / a lost
 * calibration, but `resolveCompassHeading` rejects those readings — without
 * ageing the flag out, `compassAvailable` latched true for the whole session
 * and pinned `currentHeading` (compass dial + map arrow) to the last good
 * value while also blocking the GPS-bearing fallback below.
 */
const COMPASS_STALE_AFTER_MS = 6000;

/** Shortest signed delta from `from` → `to` in (-180, 180]. */
function shortestHeadingDelta(from: number, to: number): number {
  return ((to - from + 180) % 360 + 360) % 360 - 180;
}

function isCompassLive(): boolean {
  return compassAvailable && Date.now() - lastUsableCompassReadingMs < COMPASS_STALE_AFTER_MS;
}

function handleCompassUpdate(reading: Location.LocationHeadingObject) {
  const rawHeading = resolveCompassHeading({
    trueHeading: reading.trueHeading,
    magHeading: reading.magHeading,
    accuracy: reading.accuracy,
    platform: Platform.OS,
  });
  if (rawHeading == null) {
    return;
  }

  const now = Date.now();
  const wasLive = isCompassLive();
  compassAvailable = true;
  lastUsableCompassReadingMs = now;

  // Adaptive EMA: snap on large turns, damp when nearly still. Runs on its own
  // accumulator so a reading held back by the gates below is not thrown away —
  // re-seeding the EMA from the published heading each time made a slow, steady
  // turn produce sub-threshold steps forever and left the dial sitting still.
  // Coming back from a stale stretch restarts the filter rather than easing out
  // of an accumulator that may be a full turn out of date.
  smoothedCompassHeading = smoothHeadingEma(
    wasLive ? smoothedCompassHeading : null,
    rawHeading,
  );

  const published = state.currentHeading;
  if (published != null) {
    if (
      Math.abs(shortestHeadingDelta(published, smoothedCompassHeading)) <
      HEADING_NOTIFY_MIN_DELTA_DEG
    ) {
      return;
    }
    if (now - lastHeadingNotifyMs < HEADING_NOTIFY_MIN_INTERVAL_MS) {
      return;
    }
  }

  lastHeadingNotifyMs = now;
  setState({ currentHeading: smoothedCompassHeading });
}

async function startHeadingWatching() {
  stopHeadingWatching();
  const generation = headingWatchGeneration;

  try {
    const subscription = await Location.watchHeadingAsync(handleCompassUpdate);
    if (generation !== headingWatchGeneration) {
      // Superseded while awaiting (another start, or the session ended).
      // Keeping this would leave a second watch feeding handleCompassUpdate.
      subscription.remove();
      return;
    }
    headingSubscription = subscription;
  } catch {
    // Compass unavailable — GPS-derived heading in recordLocationSample is the fallback.
  }
}

function stopHeadingWatching() {
  headingWatchGeneration += 1;
  headingSubscription?.remove();
  headingSubscription = null;
  compassAvailable = false;
  smoothedCompassHeading = null;
  lastUsableCompassReadingMs = 0;
  lastHeadingNotifyMs = 0;
}

async function startBackgroundLocationUpdates(): Promise<boolean> {
  // Expo Go on a real device lacks the background-modes entitlement that
  // startLocationUpdatesAsync needs; calling it there can hard-crash the
  // native process (no catchable JS error). Only the Simulator tolerates it,
  // and this path can't tell simulator from device, so skip it entirely in
  // Expo Go — foreground watchPositionAsync still tracks the route live.
  if (isExpoGoClient()) {
    return false;
  }

  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
      return true;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, getBackgroundWatchOptions());
    return true;
  } catch (error) {
    console.warn('[location] background updates failed:', error);
    return false;
  }
}

async function stopBackgroundLocationUpdates() {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch (error) {
    console.warn('[location] stop background updates failed:', error);
  }
}

/** Stops subscriptions only — preserves Kalman and append timestamps (mid-session resume). */
function stopLocationSubscriptions() {
  locationWatchGeneration += 1;
  locationSubscription?.remove();
  locationSubscription = null;
  stopHeadingWatching();
  void stopBackgroundLocationUpdates();
}

/** Full teardown when a session ends or before a fresh Kalman/route reset. */
function stopLocationWatching() {
  stopLocationSubscriptions();
  lastAcceptedTimestamp = null;
  lastRouteAppendTimestamp = null;
  lastProcessedSampleTimestamp = null;
  lastProcessedCoordinate = null;
  resetLocationKalmanFilter(locationKalman);
  emptyRouteDiagnosticLogged = false;
  firstPinWithoutRouteAtMs = null;
}

/** One-shot GPS can hang indefinitely on some devices — never await it untimed. */
const INITIAL_FIX_TIMEOUT_MS = 8000;
/** Checkpoint submit should not block long on a cold fix — prefer last-known + store. */
const CHECKPOINT_GPS_TIMEOUT_MS = 5000;

async function getCurrentPositionWithTimeout(
  timeoutMs: number = INITIAL_FIX_TIMEOUT_MS,
): Promise<Location.LocationObject | null> {
  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } catch {
    return null;
  }
}

function coordsFromRoutePoint(
  point: RouteCoordinate | null,
): { latitude: number; longitude: number } | null {
  if (!isRouteCoordinate(point)) {
    return null;
  }
  return { longitude: point[0], latitude: point[1] };
}

function liveStoreCheckpointCoords(): { latitude: number; longitude: number } | null {
  return (
    coordsFromRoutePoint(state.displayCoordinate) ??
    coordsFromRoutePoint(state.currentCoordinate) ??
    coordsFromRoutePoint(
      state.routeCoordinates.length > 0
        ? state.routeCoordinates[state.routeCoordinates.length - 1]
        : null,
    )
  );
}

/**
 * Best-effort WGS84 for a photo checkpoint (admin trail pins).
 * Preference: explicit submission → live tracker → last-known → timed current fix.
 */
export async function resolveCheckpointCaptureCoords(explicit?: {
  latitude?: number | null;
  longitude?: number | null;
}): Promise<{ latitude: number | null; longitude: number | null }> {
  const explicitLat = explicit?.latitude;
  const explicitLng = explicit?.longitude;
  if (
    typeof explicitLat === 'number' &&
    Number.isFinite(explicitLat) &&
    typeof explicitLng === 'number' &&
    Number.isFinite(explicitLng) &&
    Math.abs(explicitLat) <= 90 &&
    Math.abs(explicitLng) <= 180
  ) {
    return { latitude: explicitLat, longitude: explicitLng };
  }

  const fromStore = liveStoreCheckpointCoords();
  if (fromStore) {
    return fromStore;
  }

  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return { latitude: null, longitude: null };
    }

    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 5 * 60 * 1000,
      requiredAccuracy: 100,
    });
    if (lastKnown) {
      const { latitude, longitude } = lastKnown.coords;
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }

    const current = await getCurrentPositionWithTimeout(CHECKPOINT_GPS_TIMEOUT_MS);
    if (current) {
      const { latitude, longitude } = current.coords;
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch {
    // Leave null — remote row still stores photos; admin falls back to time-along-route.
  }

  return { latitude: null, longitude: null };
}

/** Best-effort seed so the tracker map can mount centered on the user ASAP. */
async function seedInitialLocation() {
  try {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 15 * 60 * 1000,
      requiredAccuracy: 1000,
    });
    if (lastKnown) {
      recordLocationSample(lastKnown);
    }
  } catch {
    // Fall through to a timed current fix.
  }

  if (state.currentCoordinate) {
    return;
  }

  const position = await getCurrentPositionWithTimeout();
  if (position) {
    recordLocationSample(position);
  }
}

async function enableBackgroundLocationIfPossible() {
  // Same hard-crash hazard as startBackgroundLocationUpdates() below, but earlier
  // in the chain: requesting "Always" authorization itself (not just starting
  // updates) walks into CoreLocation/LocationSupport code that assumes the
  // UIBackgroundModes:location entitlement is declared. Expo Go's shell app
  // doesn't declare it, so the request can SIGKILL the whole process with an
  // uncatchable native EXC_BAD_ACCESS — the surrounding try/catch never runs.
  if (isExpoGoClient()) {
    setState({ backgroundLocationEnabled: false });
    return;
  }

  let backgroundEnabled = false;
  try {
    backgroundEnabled = await requestSessionAlwaysLocationIfPossible();
    if (backgroundEnabled) {
      backgroundEnabled = await startBackgroundLocationUpdates();
    }
  } catch {
    backgroundEnabled = false;
  }

  if (backgroundEnabled) {
    setSessionSyncWarning(null);
  }

  setState({ backgroundLocationEnabled: backgroundEnabled });
}

async function startLocationWatching() {
  stopLocationSubscriptions();
  // AppState can flip to 'active' twice in a row (permission sheets, Control
  // Center, notification banners), so two of these can be in flight at once.
  // Without this token the loser's subscription is silently overwritten and
  // leaks: two watches then interleave out-of-order fixes into
  // recordLocationSample, whose duplicate/monotonic gates drop most of them
  // and stall the marker.
  const generation = locationWatchGeneration;

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (generation !== locationWatchGeneration) {
    return;
  }
  if (status !== 'granted') {
    setSessionSyncWarning('Location permission denied. Route tracking is unavailable.');
    return;
  }

  // Compass + continuous watch first. Never block them behind Always permission
  // or getCurrentPositionAsync — both can stall and leave the map on a spinner
  // (map mounts only after a GPS seed).
  void startHeadingWatching();

  try {
    const subscription = await Location.watchPositionAsync(
      getForegroundWatchOptions(),
      (position) => {
        recordLocationSample(position);
      },
    );
    if (generation !== locationWatchGeneration) {
      subscription.remove();
      return;
    }
    locationSubscription = subscription;
  } catch (error) {
    console.warn('[location] foreground watch failed:', error);
    if (generation === locationWatchGeneration) {
      locationSubscription = null;
    }
    return;
  }

  void seedInitialLocation();
  void enableBackgroundLocationIfPossible();
}

async function ensureBackgroundLocationRunning() {
  if (!state.isActive) {
    return;
  }

  try {
    const backgroundPermission = await Location.getBackgroundPermissionsAsync();
    if (backgroundPermission.status !== 'granted') {
      return;
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
      setState({ backgroundLocationEnabled: true });
      return;
    }

    const started = await startBackgroundLocationUpdates();
    setState({ backgroundLocationEnabled: started });
  } catch {
    setState({ backgroundLocationEnabled: false });
  }
}

/** Creates a Fly session from setup. Safe after local teardown (finalize path). */
async function createRemoteSessionFromSetup(setup: LiveSessionSetup): Promise<string | null> {
  if (!isApiConfigured) {
    return null;
  }

  try {
    const created = await createSession({
      activity: setup.activity,
      courtOrdered: setup.courtOrdered,
      description: setup.description,
      date: setup.date.toISOString().slice(0, 10),
    });
    return created?.id ?? null;
  } catch (error) {
    console.warn('[sessions] create session failed:', error);
    return null;
  }
}

async function ensureRemoteSession(): Promise<string | null> {
  if (!state.isActive || !state.setup) {
    return null;
  }

  if (state.remoteSessionId) {
    return state.remoteSessionId;
  }

  const createdId = await createRemoteSessionFromSetup(state.setup);
  if (createdId) {
    setState({ remoteSessionId: createdId });
    return createdId;
  }

  return null;
}

function isActiveSessionNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('404') && message.includes('Active session not found');
}

async function ensureCheckpointHasCoords(
  checkpoint: PhotoCheckpointSubmission,
): Promise<PhotoCheckpointSubmission> {
  if (
    typeof checkpoint.latitude === 'number' &&
    Number.isFinite(checkpoint.latitude) &&
    typeof checkpoint.longitude === 'number' &&
    Number.isFinite(checkpoint.longitude)
  ) {
    return checkpoint;
  }

  const coords = await resolveCheckpointCaptureCoords({
    latitude: checkpoint.latitude,
    longitude: checkpoint.longitude,
  });
  if (coords.latitude == null || coords.longitude == null) {
    return checkpoint;
  }

  const withCoords: PhotoCheckpointSubmission = {
    ...checkpoint,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };

  setState({
    submittedCheckpoints: state.submittedCheckpoints.map((cp) =>
      cp.id === checkpoint.id ? withCoords : cp,
    ),
  });

  return withCoords;
}

async function postCheckpointToRemote(
  sessionId: string,
  checkpoint: PhotoCheckpointSubmission,
): Promise<void> {
  const paths = await uploadCheckpointPhotos({
    sessionId,
    checkpointId: checkpoint.id,
    selfieUri: checkpoint.selfieUri,
    progressUri: checkpoint.progressUri,
  });

  if (!paths) {
    throw new Error('Photo upload failed');
  }

  await addCheckpoint(sessionId, {
    selfiePath: paths.selfiePath,
    progressPath: paths.progressPath,
    capturedAt: new Date(checkpoint.capturedAt).toISOString(),
    submittedEarly: checkpoint.submittedEarly,
    latitude: checkpoint.latitude,
    longitude: checkpoint.longitude,
  });
}

function updateCheckpointSyncStatus(checkpointId: string, syncStatus: CheckpointSyncStatus) {
  setState({
    submittedCheckpoints: state.submittedCheckpoints.map((cp) =>
      cp.id === checkpointId ? { ...cp, syncStatus } : cp,
    ),
  });
}

async function persistCheckpointToRemote(
  checkpoint: PhotoCheckpointSubmission,
  retried = false,
): Promise<boolean> {
  let sessionId = await ensureRemoteSession();
  if (!sessionId) {
    updateCheckpointSyncStatus(checkpoint.id, 'failed');
    return false;
  }

  const withCoords = await ensureCheckpointHasCoords(checkpoint);

  try {
    await postCheckpointToRemote(sessionId, withCoords);
    setSessionSyncWarning(null);
    updateCheckpointSyncStatus(checkpoint.id, 'synced');
    return true;
  } catch (error) {
    if (!retried && isActiveSessionNotFoundError(error)) {
      setState({ remoteSessionId: null });
      sessionId = await ensureRemoteSession();
      if (sessionId) {
        return persistCheckpointToRemote(withCoords, true);
      }
    }

    console.warn('[sessions] checkpoint persist failed:', error);
    setSessionSyncWarning('Could not sync checkpoint to the server. Photos are saved on device.');
    updateCheckpointSyncStatus(checkpoint.id, 'failed');
    return false;
  }
}

/** Re-attempts upload for just one checkpoint — e.g. from a per-item "Retry" button. */
export async function retryCheckpointSync(checkpointId: string): Promise<boolean> {
  const checkpoint = state.submittedCheckpoints.find((cp) => cp.id === checkpointId);
  if (!checkpoint) {
    return false;
  }

  updateCheckpointSyncStatus(checkpointId, 'pending');
  return persistCheckpointToRemote(checkpoint);
}

function rememberCompletedRemoteSessionId(sessionId: string) {
  if (completedSessionSnapshot) {
    completedSessionSnapshot = {
      ...completedSessionSnapshot,
      remoteSessionId: sessionId,
    };
  }
}

const FINALIZE_RETRY_DELAYS_MS = [800, 2000];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function persistFinalizeToRemote(
  snapshot: CompletedSessionSnapshot,
  status: 'under_review' | 'invalid' | 'approved' = 'under_review',
  retried = false,
): Promise<boolean> {
  let sessionId = snapshot.remoteSessionId;
  if (!sessionId) {
    sessionId = await createRemoteSessionFromSetup(snapshot.setup);
    if (sessionId) {
      rememberCompletedRemoteSessionId(sessionId);
    }
  }

  if (!sessionId) {
    lastFinalizeSyncFailed = true;
    return false;
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= FINALIZE_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      await finalizeSession(sessionId, {
        endedAt: new Date(snapshot.endedAt).toISOString(),
        durationSeconds: snapshot.elapsedSeconds,
        distanceMiles: snapshot.distanceMiles,
        route: snapshot.routeCoordinates,
        status,
        skipOrientation: snapshot.skipOrientation === true,
      });
      lastFinalizeSyncFailed = false;
      setSessionSyncWarning(null);
      return true;
    } catch (error) {
      lastError = error;

      if (!retried && isActiveSessionNotFoundError(error)) {
        // Local session may already be torn down — create from snapshot setup, not live state.
        const recreatedId = await createRemoteSessionFromSetup(snapshot.setup);
        if (recreatedId) {
          rememberCompletedRemoteSessionId(recreatedId);
          return persistFinalizeToRemote(
            { ...snapshot, remoteSessionId: recreatedId },
            status,
            true,
          );
        }
      }

      if (attempt < FINALIZE_RETRY_DELAYS_MS.length) {
        await delay(FINALIZE_RETRY_DELAYS_MS[attempt]);
      }
    }
  }

  console.warn('[sessions] finalize persist failed after retries:', lastError);
  lastFinalizeSyncFailed = true;
  // Not setSessionSyncWarning — endLiveSession() (called right after this
  // returns, in finalizeLiveSession) unconditionally clears that banner, so it
  // only ever flashes for a frame during the transition to submission-confirmation,
  // which already has its own permanent sync-failure banner + retry button.
  return false;
}

/** Re-request location updates if the session is active but watching stopped (e.g. permission retry). */
export async function ensureLocationWatching() {
  if (!state.isActive || locationSubscription) {
    return;
  }

  await startLocationWatching();
}

/** Sync clocks and restart GPS after returning from background (Expo Go / When In Use). */
export async function resumeLiveSessionTrackingAfterForeground() {
  if (!state.isActive) {
    return;
  }

  syncSessionClocks();
  ensureLiveSessionTicking();
  await startLocationWatching();
  await ensureBackgroundLocationRunning();
}

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

function ensureLiveSessionAppStateListener() {
  if (appStateSubscription) {
    return;
  }

  appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState !== 'active') {
      return;
    }

    void resumeLiveSessionTrackingAfterForeground();
  });
}

ensureLiveSessionAppStateListener();

export function hasSubmittedCheckpointForCurrentWindow(): boolean {
  const windowStart = state.checkpointWindowStartedAt;
  if (!windowStart) {
    return false;
  }

  return state.submittedCheckpoints.some((checkpoint) => checkpoint.capturedAt >= windowStart);
}

export function isCheckpointMissed(): boolean {
  if (!state.photosEnabled || !state.isActive || state.checkpointWindowStartedAt == null) {
    return false;
  }

  if (hasSubmittedCheckpointForCurrentWindow()) {
    return false;
  }

  const overdueMs = Date.now() - state.checkpointWindowStartedAt;
  return (
    overdueMs >
    PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000 + CHECKPOINT_MISS_GRACE_MS
  );
}

export function isCheckpointInGracePeriod(): boolean {
  if (!state.isActive || state.checkpointWindowStartedAt == null) {
    return false;
  }

  if (hasSubmittedCheckpointForCurrentWindow()) {
    return false;
  }

  const overdueMs = Date.now() - state.checkpointWindowStartedAt;
  const intervalMs = PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000;
  return overdueMs >= intervalMs && overdueMs <= intervalMs + CHECKPOINT_MISS_GRACE_MS;
}

/** Seconds left in the 10-minute grace window after a checkpoint is due. */
export function getGraceSecondsRemaining(): number {
  if (!state.isActive || state.checkpointWindowStartedAt == null) {
    return 0;
  }

  if (hasSubmittedCheckpointForCurrentWindow()) {
    return 0;
  }

  const graceEndsAt =
    state.checkpointWindowStartedAt +
    PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000 +
    CHECKPOINT_MISS_GRACE_MS;
  return Math.max(0, Math.ceil((graceEndsAt - Date.now()) / 1000));
}

/** True when the current checkpoint is due or within grace (mid photo still required). */
export function isCheckpointDueOrGrace(): boolean {
  if (!state.photosEnabled || !state.isActive || state.checkpointWindowStartedAt == null) {
    return false;
  }

  if (hasSubmittedCheckpointForCurrentWindow()) {
    return false;
  }

  const overdueMs = Date.now() - state.checkpointWindowStartedAt;
  return overdueMs >= PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000;
}

/** Seconds elapsed since the checkpoint became due (0 while not yet due). */
export function getCheckpointOverdueSeconds(): number {
  if (!isCheckpointDueOrGrace() || state.checkpointWindowStartedAt == null) {
    return 0;
  }

  const dueAt = state.checkpointWindowStartedAt + PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000;
  return Math.max(0, Math.floor((Date.now() - dueAt) / 1000));
}

export function canSubmitCheckpointForCurrentWindow(): boolean {
  if (!state.isActive) {
    return false;
  }

  return !hasSubmittedCheckpointForCurrentWindow();
}

/** Records a missed checkpoint for the session's own record — once per window.
 * Does NOT touch checkpointWindowStartedAt: the window stays open and overdue
 * ("time elapsed" keeps counting up) until the volunteer actually submits a
 * photo via resetCheckpointCountdown(). Tracking (distance/elapsed session
 * time) was never affected by this either way — see removed forced-end pause. */
function recordCheckpointMissIfNeeded() {
  const windowStart = state.checkpointWindowStartedAt;
  if (windowStart == null || state.checkpointMisses.includes(windowStart)) {
    return;
  }

  setState({
    checkpointMisses: [...state.checkpointMisses, windowStart],
  });
}

export function clearSessionSyncWarning() {
  setSessionSyncWarning(null);
}

/** Starts a fresh live session: elapsed at 0, checkpoint countdown at 30:00. */
export async function startNewLiveSession(
  setup: LiveSessionSetup,
  options?: { photosEnabled?: boolean },
) {
  stopTicking();
  stopLocationWatching();
  completedSessionSnapshot = null;
  locationKalman = createLocationKalmanFilter();

  // Activate locally first so the tracker map can seed from last-known GPS
  // without waiting on the create-session network round-trip (and without
  // flashing the continental US default center).
  const startedAt = Date.now();
  const photosEnabled = options?.photosEnabled !== false;
  state = {
    isActive: true,
    remoteSessionId: null,
    startedAt,
    checkpointWindowStartedAt: photosEnabled ? startedAt : null,
    elapsedSeconds: 0,
    checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
    checkpointDueOrGrace: false,
    checkpointOverdueSeconds: 0,
    distanceMiles: 0,
    setup,
    routeCoordinates: [],
    routeSamples: [],
    displayRouteCoordinates: [],
    currentCoordinate: null,
    displayCoordinate: null,
    currentHeading: null,
    mapRecenterToken: 0,
    mapFollowEnabled: false,
    mapLayer: DEFAULT_MAP_LAYER,
    submittedCheckpoints: [],
    sessionSyncWarning: null,
    backgroundLocationEnabled: false,
    checkpointMisses: [],
    photosEnabled,
  };
  notify();
  startTicking();
  startLiveSessionLiveActivity({
    startedAt,
    distanceMiles: 0,
    checkpointWindowStartedAt: photosEnabled ? startedAt : null,
    photosEnabled,
    checkpointDueOrGrace: false,
  });
  void startLocationWatching();
  if (photosEnabled) {
    void scheduleCheckpointNotifications(startedAt);
  }

  await ensureRemoteSession();
}

/** Records a submitted selfie + progress photo pair for the session detail screen. */
export function addPhotoCheckpoint(
  submission: {
    selfieUri: string;
    progressUri: string;
    capturedAt: number;
    latitude?: number | null;
    longitude?: number | null;
  },
  options?: { allowDuplicateWindow?: boolean },
): boolean {
  if (!state.isActive || !state.photosEnabled) {
    return false;
  }

  if (!options?.allowDuplicateWindow && !canSubmitCheckpointForCurrentWindow()) {
    return false;
  }

  const nextIndex = state.submittedCheckpoints.length;
  const submittedEarly = state.checkpointSecondsRemaining > 0;
  const fromStore = liveStoreCheckpointCoords();
  const latitude =
    typeof submission.latitude === 'number' && Number.isFinite(submission.latitude)
      ? submission.latitude
      : (fromStore?.latitude ?? null);
  const longitude =
    typeof submission.longitude === 'number' && Number.isFinite(submission.longitude)
      ? submission.longitude
      : (fromStore?.longitude ?? null);

  const checkpoint: PhotoCheckpointSubmission = {
    id: `checkpoint-${nextIndex}-${submission.capturedAt}`,
    selfieUri: submission.selfieUri,
    progressUri: submission.progressUri,
    capturedAt: submission.capturedAt,
    submittedEarly,
    latitude,
    longitude,
    syncStatus: 'pending',
  };

  setState({
    submittedCheckpoints: [...state.submittedCheckpoints, checkpoint],
  });

  void persistCheckpointToRemote(checkpoint);

  return true;
}

/** Ensures the 1s session tick runs while a live session is active (e.g. after fast refresh). */
export function ensureLiveSessionTicking() {
  if (state.isActive) {
    syncSessionClocks();
    startTicking();
  }
}

/** Resets only the checkpoint countdown after a photo is submitted. */
export function resetCheckpointCountdown() {
  if (!state.isActive || !state.photosEnabled) {
    return;
  }

  setState({
    checkpointWindowStartedAt: Date.now(),
    checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
    checkpointDueOrGrace: false,
    checkpointOverdueSeconds: 0,
  });
  startTicking();
  const liveActivityState = buildLiveActivitySessionState();
  if (liveActivityState) {
    syncLiveSessionLiveActivityCheckpoint(liveActivityState);
  }
  if (state.checkpointWindowStartedAt != null) {
    void scheduleCheckpointNotifications(state.checkpointWindowStartedAt);
  }
}

/** Pay later on orientation paywall — drop the live session without saving or counting the hour. */
export async function discardOrientationPaywallSession(): Promise<void> {
  const remoteSessionId = state.remoteSessionId;
  endLiveSession();
  completedSessionSnapshot = null;
  lastFinalizeSyncFailed = false;

  if (!remoteSessionId || !isApiConfigured) {
    return;
  }

  try {
    await deleteSession(remoteSessionId);
  } catch (error) {
    console.warn('[sessions] discard orientation session failed:', error);
  }
}

export async function finalizeLiveSession(options?: {
  status?: 'under_review' | 'invalid' | 'approved';
  /** @deprecated Free orientation hour is off — ignored; never auto-approves. */
  skipOrientation?: boolean;
}): Promise<boolean> {
  if (!state.setup) {
    endLiveSession();
    return false;
  }

  if (state.photosEnabled) {
    const photoCount = countSubmittedCheckpointPhotos(state.submittedCheckpoints);
    if (photoCount < MIN_SUBMITTED_SESSION_PHOTOS) {
      console.warn(
        `[sessions] finalize blocked: ${photoCount} photos (need ${MIN_SUBMITTED_SESSION_PHOTOS})`,
      );
      return false;
    }
  }

  // Product: no free orientation hour. Completed sessions always go under review
  // (except explicit invalid). Do not honor skipOrientation auto-approve.
  const status =
    options?.status === 'invalid' ? 'invalid' : 'under_review';

  const endedAt = Date.now();
  const startedAt = state.startedAt ?? endedAt;
  const elapsedSeconds = computeSessionDurationSeconds(startedAt, endedAt);
  const distanceMiles = state.distanceMiles;

  completedSessionSnapshot = {
    remoteSessionId: state.remoteSessionId,
    setup: state.setup,
    startedAt,
    endedAt,
    elapsedSeconds,
    distanceMiles,
    routeCoordinates: [...state.routeCoordinates],
    routeSamples: [...state.routeSamples],
    submittedCheckpoints: [...state.submittedCheckpoints],
    mapLayer: state.mapLayer,
    skipOrientation: false,
  };

  const synced = await persistFinalizeToRemote(completedSessionSnapshot, status);
  recordCompletedSession(completedSessionSnapshot);
  recordSessionStatFromSnapshot(completedSessionSnapshot);
  recordImpactFeedFromSnapshot(completedSessionSnapshot);
  cacheCompletedSession(completedSessionSnapshot);
  endLiveSession();
  return synced;
}

export function getCompletedSessionSnapshot() {
  return completedSessionSnapshot;
}

/** True when the last finalize attempt exhausted its retries without syncing. */
export function getLastFinalizeSyncFailed(): boolean {
  return lastFinalizeSyncFailed;
}

/** Re-attempts syncing the last completed session after a failed finalize. */
export async function retryFinalizeSync(): Promise<boolean> {
  if (!completedSessionSnapshot || !lastFinalizeSyncFailed) {
    return !lastFinalizeSyncFailed;
  }
  return persistFinalizeToRemote(completedSessionSnapshot, 'under_review');
}

export function endLiveSession() {
  stopTicking();
  stopLocationWatching();
  endLiveSessionLiveActivity();
  void cancelCheckpointNotifications();
  state = {
    isActive: false,
    remoteSessionId: null,
    startedAt: null,
    checkpointWindowStartedAt: null,
    elapsedSeconds: 0,
    checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
    checkpointDueOrGrace: false,
    checkpointOverdueSeconds: 0,
    distanceMiles: 0,
    setup: null,
    routeCoordinates: [],
    routeSamples: [],
    displayRouteCoordinates: [],
    currentCoordinate: null,
    displayCoordinate: null,
    currentHeading: null,
    mapRecenterToken: 0,
    mapFollowEnabled: false,
    mapLayer: DEFAULT_MAP_LAYER,
    submittedCheckpoints: [],
    sessionSyncWarning: null,
    backgroundLocationEnabled: false,
    checkpointMisses: [],
    photosEnabled: true,
  };
  notify();
}

export function setLiveSessionMapFollow(enabled: boolean) {
  if (state.mapFollowEnabled === enabled) {
    return;
  }

  setState({ mapFollowEnabled: enabled });
}

export function toggleLiveSessionMapFollow() {
  setLiveSessionMapFollow(!state.mapFollowEnabled);
}

export function setLiveSessionMapLayer(layer: MapLayerType) {
  if (state.mapLayer === layer) {
    return;
  }

  setState({ mapLayer: layer });
}

export function requestLiveSessionMapRecenter() {
  if (!state.displayCoordinate && !state.currentCoordinate) {
    void ensureLocationWatching();
    return;
  }

  setState({ mapRecenterToken: state.mapRecenterToken + 1 });
}

export function getLiveSessionState() {
  return state;
}

export function subscribeLiveSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLiveSession() {
  return useSyncExternalStore(subscribeLiveSession, getLiveSessionState, getLiveSessionState);
}

export function getCheckpointProgress(checkpointSecondsRemaining: number): number {
  const elapsedInInterval =
    PHOTO_CHECKPOINT_INTERVAL_SECONDS - Math.max(0, checkpointSecondsRemaining);
  return elapsedInInterval / PHOTO_CHECKPOINT_INTERVAL_SECONDS;
}

/** No `getLiveSessionMapCenter()` here on purpose: an argument-less getter over
 * module state is invisible to React Compiler, which memoizes the call with no
 * dependencies and caches the first result forever. Map components must derive
 * the center from their `useLiveSession()` snapshot instead. */
export function getLiveSessionMapZoom(): number {
  return 15;
}

