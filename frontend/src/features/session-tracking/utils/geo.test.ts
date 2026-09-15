import { toRouteCoordinates } from './geo';

describe('toRouteCoordinates', () => {
  it('keeps a single valid [lng, lat] point', () => {
    expect(toRouteCoordinates([[-87.63, 41.88]])).toEqual([[-87.63, 41.88]]);
  });

  it('keeps multi-point routes', () => {
    expect(
      toRouteCoordinates([
        [-87.63, 41.88],
        [-87.628, 41.881],
      ]),
    ).toEqual([
      [-87.63, 41.88],
      [-87.628, 41.881],
    ]);
  });

  it('returns an empty array for null, undefined, or empty input', () => {
    expect(toRouteCoordinates(null)).toEqual([]);
    expect(toRouteCoordinates(undefined)).toEqual([]);
    expect(toRouteCoordinates([])).toEqual([]);
  });

  it('drops malformed points', () => {
    expect(toRouteCoordinates([[-87.63], [-87.62, 41.88, 12], [Number.NaN, 41.88]])).toEqual(
      [],
    );
  });
});
