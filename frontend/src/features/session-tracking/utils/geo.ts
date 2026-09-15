/** [longitude, latitude] — MapLibre / GeoJSON order. */
export type RouteCoordinate = [number, number];

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in miles between two WGS84 points. */
export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const startLat = toRadians(lat1);
  const endLat = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function toRouteCoordinate(longitude: number, latitude: number): RouteCoordinate {
  return [longitude, latitude];
}

export function isRouteCoordinate(value: unknown): value is RouteCoordinate {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

/** Normalizes API route arrays to MapLibre-ready coordinates. */
export function toRouteCoordinates(route: number[][] | null | undefined): RouteCoordinate[] {
  if (!route || route.length === 0) {
    return [];
  }

  return route
    .filter(
      (point) =>
        point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]),
    )
    .map(([longitude, latitude]) => toRouteCoordinate(longitude, latitude));
}

/**
 * OS watch `distanceInterval`. Keep at 0 so iOS still delivers ~1 Hz while
 * the volunteer walks slowly or turns a corner (1 m skipped too many sidewalk
 * samples and produced long chords through buildings).
 */
export const MIN_ROUTE_SAMPLE_METERS = 0;

export function milesToMeters(miles: number): number {
  return miles * 1609.344;
}

export const DEFAULT_MAP_CENTER: RouteCoordinate = [-98.5795, 39.8283];

export function getRouteMapCenter(coordinates: RouteCoordinate[]): RouteCoordinate {
  if (coordinates.length === 0) {
    return DEFAULT_MAP_CENTER;
  }
  if (coordinates.length === 1) {
    return coordinates[0];
  }

  const longitudes = coordinates.map((coordinate) => coordinate[0]);
  const latitudes = coordinates.map((coordinate) => coordinate[1]);

  return [
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  ];
}

export function getRouteMapZoom(coordinates: RouteCoordinate[]): number {
  if (coordinates.length < 2) {
    return coordinates.length === 1 ? 15 : 4;
  }

  const longitudes = coordinates.map((coordinate) => coordinate[0]);
  const latitudes = coordinates.map((coordinate) => coordinate[1]);
  const lngSpan = Math.max(...longitudes) - Math.min(...longitudes);
  const latSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const span = Math.max(lngSpan, latSpan);

  if (span > 0.05) return 12;
  if (span > 0.02) return 13;
  if (span > 0.01) return 14;
  return 15;
}
