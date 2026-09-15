import { toRouteCoordinate, type RouteCoordinate } from './geo';

/** Default horizontal accuracy when the OS omits accuracy (meters). */
export const DEFAULT_ACCURACY_METERS = 20;

export type KalmanSampleInput = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestampMs: number;
};

export type LocationKalmanFilter = {
  initialized: boolean;
  lat: number;
  lng: number;
  vLat: number;
  vLng: number;
  pLat: number;
  pLng: number;
  pVLat: number;
  pVLng: number;
  lastTimestampMs: number | null;
};

const PROCESS_NOISE_POSITION = 0.25;
const PROCESS_NOISE_VELOCITY = 0.75;

/**
 * Minimum predict dt (seconds). The old 0.05s floor divided innovation by a
 * tiny interval on clustered or out-of-order GPS ticks and amplified velocity
 * up to ~20×, which lurched the trail through buildings.
 */
const MIN_KALMAN_DT_SECONDS = 0.25;

export function createLocationKalmanFilter(): LocationKalmanFilter {
  return {
    initialized: false,
    lat: 0,
    lng: 0,
    vLat: 0,
    vLng: 0,
    pLat: 1,
    pLng: 1,
    pVLat: 1,
    pVLng: 1,
    lastTimestampMs: null,
  };
}

export function resetLocationKalmanFilter(filter: LocationKalmanFilter): void {
  filter.initialized = false;
  filter.lat = 0;
  filter.lng = 0;
  filter.vLat = 0;
  filter.vLng = 0;
  filter.pLat = 1;
  filter.pLng = 1;
  filter.pVLat = 1;
  filter.pVLng = 1;
  filter.lastTimestampMs = null;
}

function metersPerDegreeLat(): number {
  return 111_320;
}

function metersPerDegreeLng(latitude: number): number {
  return 111_320 * Math.cos((latitude * Math.PI) / 180);
}

function clampAccuracy(accuracyMeters: number): number {
  if (!Number.isFinite(accuracyMeters) || accuracyMeters <= 0) {
    return DEFAULT_ACCURACY_METERS;
  }

  return Math.min(accuracyMeters, DEFAULT_ACCURACY_METERS);
}

/** Accuracy-weighted 2D constant-velocity Kalman update; returns filtered coordinate. */
export function updateLocationKalman(
  filter: LocationKalmanFilter,
  input: KalmanSampleInput,
): RouteCoordinate {
  const accuracy = clampAccuracy(input.accuracyMeters);
  const measurementNoiseLat = (accuracy / metersPerDegreeLat()) ** 2;
  const measurementNoiseLng =
    (accuracy / metersPerDegreeLng(input.latitude)) ** 2;

  if (!filter.initialized) {
    filter.initialized = true;
    filter.lat = input.latitude;
    filter.lng = input.longitude;
    filter.vLat = 0;
    filter.vLng = 0;
    filter.pLat = measurementNoiseLat;
    filter.pLng = measurementNoiseLng;
    filter.pVLat = 1;
    filter.pVLng = 1;
    filter.lastTimestampMs = input.timestampMs;
    return toRouteCoordinate(input.longitude, input.latitude);
  }

  if (filter.lastTimestampMs != null && input.timestampMs <= filter.lastTimestampMs) {
    return toRouteCoordinate(filter.lng, filter.lat);
  }

  const dtSeconds =
    filter.lastTimestampMs != null
      ? Math.max(
          MIN_KALMAN_DT_SECONDS,
          (input.timestampMs - filter.lastTimestampMs) / 1000,
        )
      : 1;

  filter.lat += filter.vLat * dtSeconds;
  filter.lng += filter.vLng * dtSeconds;

  filter.pLat += PROCESS_NOISE_POSITION * dtSeconds;
  filter.pLng += PROCESS_NOISE_POSITION * dtSeconds;
  filter.pVLat += PROCESS_NOISE_VELOCITY * dtSeconds;
  filter.pVLng += PROCESS_NOISE_VELOCITY * dtSeconds;

  const kLat = filter.pLat / (filter.pLat + measurementNoiseLat);
  const innovationLat = input.latitude - filter.lat;
  filter.lat += kLat * innovationLat;
  filter.vLat += kLat * (innovationLat / dtSeconds) * 0.35;
  filter.pLat = (1 - kLat) * filter.pLat;

  const kLng = filter.pLng / (filter.pLng + measurementNoiseLng);
  const innovationLng = input.longitude - filter.lng;
  filter.lng += kLng * innovationLng;
  filter.vLng += kLng * (innovationLng / dtSeconds) * 0.35;
  filter.pLng = (1 - kLng) * filter.pLng;

  filter.pVLat = Math.max(0.01, filter.pVLat * (1 - kLat));
  filter.pVLng = Math.max(0.01, filter.pVLng * (1 - kLng));
  filter.lastTimestampMs = input.timestampMs;

  return toRouteCoordinate(filter.lng, filter.lat);
}
