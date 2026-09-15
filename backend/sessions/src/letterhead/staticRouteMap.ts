import StaticMaps from 'staticmaps';

import { ORG } from './orgConstants.js';

function parseRoute(route: unknown): [number, number][] {
  if (!Array.isArray(route)) {
    return [];
  }

  const coords: [number, number][] = [];
  for (const point of route) {
    if (!Array.isArray(point) || point.length < 2) {
      continue;
    }
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      continue;
    }
    coords.push([lng, lat]);
  }
  return coords;
}

/** Renders a static OSM basemap PNG with the session route polyline. */
export async function renderStaticRouteMapPng(route: unknown): Promise<Buffer | null> {
  const coords = parseRoute(route);
  if (coords.length < 2) {
    return null;
  }

  const map = new StaticMaps({
    width: 640,
    height: 360,
    paddingX: 24,
    paddingY: 24,
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileSubdomains: ['a', 'b', 'c'],
  });

  map.addLine({
    coords,
    color: `${ORG.brandGreen}DD`,
    width: 4,
  });

  await map.render();
  return map.image.buffer('png');
}
