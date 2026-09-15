import type { RouteCoordinate } from './geo';

/** Logical CSS pixels per Web Mercator tile (CARTO @2x images scale into this). */
export const MERCATOR_TILE_SIZE = 256;
export const SNAPSHOT_ANCHOR_ZOOM = 16;
export const SNAPSHOT_MIN_ZOOM = 1;
export const SNAPSHOT_MAX_ZOOM = 18;
const SNAPSHOT_FIT_PADDING = 24;
const MAX_LAT = 85.05112878;

export type SnapshotTile = {
  key: string;
  z: number;
  x: number;
  y: number;
  left: number;
  top: number;
};

export type SnapshotPathPoint = {
  x: number;
  y: number;
};

export type SnapshotLayout = {
  zoom: number;
  center: RouteCoordinate;
  tiles: SnapshotTile[];
  pathPoints: SnapshotPathPoint[];
  /** Projected session end/anchor location — where the marker is drawn. */
  anchorPoint: SnapshotPathPoint;
};

function clampLatitude(latitude: number): number {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, latitude));
}

function worldSize(zoom: number): number {
  return MERCATOR_TILE_SIZE * 2 ** zoom;
}

function wrapTileIndex(index: number, tileCount: number): number {
  return ((index % tileCount) + tileCount) % tileCount;
}

/** Projects WGS84 `[lng, lat]` into Web Mercator world pixels at `zoom`. */
export function lngLatToWorldPixel(
  lngLat: RouteCoordinate,
  zoom: number,
): [number, number] {
  const [longitude, latitude] = lngLat;
  const scale = worldSize(zoom);
  const x = ((longitude + 180) / 360) * scale;
  const latRad = (clampLatitude(latitude) * Math.PI) / 180;
  const y =
    (0.5 - Math.log((1 + Math.sin(latRad)) / (1 - Math.sin(latRad))) / (4 * Math.PI)) *
    scale;
  return [x, y];
}

function bboxCenter(coordinates: readonly RouteCoordinate[]): RouteCoordinate {
  const longitudes = coordinates.map((coordinate) => coordinate[0]);
  const latitudes = coordinates.map((coordinate) => coordinate[1]);
  return [
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  ];
}

/** Highest zoom where the route bbox plus padding still fits the snapshot. */
export function fitZoomForBounds(
  coordinates: readonly RouteCoordinate[],
  width: number,
  height: number,
  padding = SNAPSHOT_FIT_PADDING,
): number {
  if (coordinates.length < 2) {
    return SNAPSHOT_ANCHOR_ZOOM;
  }

  const longitudes = coordinates.map((coordinate) => coordinate[0]);
  const latitudes = coordinates.map((coordinate) => coordinate[1]);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const innerW = Math.max(width - padding * 2, 1);
  const innerH = Math.max(height - padding * 2, 1);

  if (minLng === maxLng && minLat === maxLat) {
    return SNAPSHOT_ANCHOR_ZOOM;
  }

  for (let zoom = SNAPSHOT_MAX_ZOOM; zoom >= SNAPSHOT_MIN_ZOOM; zoom -= 1) {
    const [west, north] = lngLatToWorldPixel([minLng, maxLat], zoom);
    const [east, south] = lngLatToWorldPixel([maxLng, minLat], zoom);
    if (Math.abs(east - west) <= innerW && Math.abs(south - north) <= innerH) {
      return zoom;
    }
  }

  return SNAPSHOT_MIN_ZOOM;
}

function tilesForViewport(
  zoom: number,
  originX: number,
  originY: number,
  width: number,
  height: number,
): SnapshotTile[] {
  const tileCount = 2 ** zoom;
  const startTileX = Math.floor(originX / MERCATOR_TILE_SIZE);
  const endTileX = Math.floor((originX + width - 1) / MERCATOR_TILE_SIZE);
  const startTileY = Math.floor(originY / MERCATOR_TILE_SIZE);
  const endTileY = Math.floor((originY + height - 1) / MERCATOR_TILE_SIZE);
  const tiles: SnapshotTile[] = [];

  for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
    if (tileY < 0 || tileY >= tileCount) {
      continue;
    }

    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
      const wrappedX = wrapTileIndex(tileX, tileCount);
      tiles.push({
        key: `${zoom}/${wrappedX}/${tileY}`,
        z: zoom,
        x: wrappedX,
        y: tileY,
        left: tileX * MERCATOR_TILE_SIZE - originX,
        top: tileY * MERCATOR_TILE_SIZE - originY,
      });
    }
  }

  return tiles;
}

/**
 * Tile mosaic + projected path for a static session map snapshot.
 * Single-anchor sessions use street-level zoom 16; multi-point routes fit their bbox.
 */
export function getSnapshotLayout({
  anchor,
  coordinates = [],
  width,
  height,
}: {
  anchor: RouteCoordinate | null;
  coordinates?: readonly RouteCoordinate[];
  width: number;
  height: number;
}): SnapshotLayout | null {
  const center: RouteCoordinate | null =
    coordinates.length >= 2 ? bboxCenter(coordinates) : anchor;
  if (!center) {
    return null;
  }

  const zoom =
    coordinates.length >= 2
      ? fitZoomForBounds(coordinates, width, height)
      : SNAPSHOT_ANCHOR_ZOOM;
  const [centerX, centerY] = lngLatToWorldPixel(center, zoom);
  const originX = centerX - width / 2;
  const originY = centerY - height / 2;
  const pathSource = coordinates.length >= 2 ? coordinates : [];
  const project = (coordinate: RouteCoordinate): SnapshotPathPoint => {
    const [worldX, worldY] = lngLatToWorldPixel(coordinate, zoom);
    return { x: worldX - originX, y: worldY - originY };
  };

  return {
    zoom,
    center,
    tiles: tilesForViewport(zoom, originX, originY, width, height),
    pathPoints: pathSource.map(project),
    anchorPoint: project(anchor ?? center),
  };
}
