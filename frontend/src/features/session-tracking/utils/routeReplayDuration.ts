import type { RouteCoordinate } from './geo';
import { deltaMetersBetween } from './routeFiltering';

export const ROUTE_REPLAY_MIN_MS = 3000;
export const ROUTE_REPLAY_MAX_MS = 10_000;
/** Approximate playback speed along the recorded path (m/s). */
export const ROUTE_REPLAY_SPEED_MPS = 2.2;

export function computeRouteReplayDurationMs(routeCoordinates: RouteCoordinate[]): number {
  if (routeCoordinates.length < 2) {
    return ROUTE_REPLAY_MIN_MS;
  }

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
