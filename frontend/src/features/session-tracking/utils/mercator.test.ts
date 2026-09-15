import {
  SNAPSHOT_ANCHOR_ZOOM,
  fitZoomForBounds,
  getSnapshotLayout,
  lngLatToWorldPixel,
} from './mercator';
import type { RouteCoordinate } from './geo';

describe('lngLatToWorldPixel', () => {
  it('places 0,0 at the center of the zoom-0 world', () => {
    expect(lngLatToWorldPixel([0, 0], 0)).toEqual([128, 128]);
  });

  it('places the antimeridian on the west edge at zoom 0', () => {
    expect(lngLatToWorldPixel([-180, 0], 0)[0]).toBeCloseTo(0);
    expect(lngLatToWorldPixel([180, 0], 0)[0]).toBeCloseTo(256);
  });
});

describe('fitZoomForBounds', () => {
  it('returns street-level zoom for a single point', () => {
    expect(fitZoomForBounds([[-87.63, 41.88]], 220, 220)).toBe(SNAPSHOT_ANCHOR_ZOOM);
  });

  it('zooms out when a route bbox cannot fit at street level', () => {
    const route: RouteCoordinate[] = [
      [-87.9, 41.85],
      [-87.6, 41.95],
    ];
    expect(fitZoomForBounds(route, 220, 220)).toBeLessThan(SNAPSHOT_ANCHOR_ZOOM);
  });
});

describe('getSnapshotLayout', () => {
  it('returns null when there is no anchor and no route', () => {
    expect(getSnapshotLayout({ anchor: null, width: 220, height: 220 })).toBeNull();
  });

  it('centers a single-anchor snapshot at zoom 16', () => {
    const anchor: RouteCoordinate = [-87.6298, 41.8781];
    const layout = getSnapshotLayout({
      anchor,
      coordinates: [anchor],
      width: 220,
      height: 220,
    });

    expect(layout).not.toBeNull();
    expect(layout?.zoom).toBe(SNAPSHOT_ANCHOR_ZOOM);
    expect(layout?.center).toEqual(anchor);
    expect(layout?.tiles.length).toBeGreaterThan(0);
    expect(layout?.pathPoints).toEqual([]);
  });

  it('projects the marker to the tile center for a single anchor', () => {
    const anchor: RouteCoordinate = [-87.6298, 41.8781];
    const layout = getSnapshotLayout({ anchor, width: 220, height: 220 });

    expect(layout?.anchorPoint.x).toBeCloseTo(110);
    expect(layout?.anchorPoint.y).toBeCloseTo(110);
  });

  it('places the marker at the end of a recorded route', () => {
    const route: RouteCoordinate[] = [
      [-87.63, 41.88],
      [-87.628, 41.881],
    ];
    const layout = getSnapshotLayout({
      anchor: route[1],
      coordinates: route,
      width: 220,
      height: 220,
    });
    const lastPathPoint = layout!.pathPoints[layout!.pathPoints.length - 1];

    expect(layout?.anchorPoint.x).toBeCloseTo(lastPathPoint.x);
    expect(layout?.anchorPoint.y).toBeCloseTo(lastPathPoint.y);
  });

  it('projects a walking path when the route has two or more points', () => {
    const route: RouteCoordinate[] = [
      [-87.63, 41.88],
      [-87.628, 41.881],
    ];
    const layout = getSnapshotLayout({
      anchor: route[1],
      coordinates: route,
      width: 220,
      height: 220,
    });

    expect(layout?.pathPoints).toHaveLength(2);
    expect(layout?.pathPoints[0].x).toBeGreaterThanOrEqual(0);
    expect(layout?.pathPoints[0].x).toBeLessThanOrEqual(220);
  });
});
