import {
  cartoVoyagerRasterTileUrl,
  cartoVoyagerRasterTileUrls,
} from './cartoBasemap';

describe('cartoBasemap', () => {
  const originalKey = process.env.EXPO_PUBLIC_CARTO_BASEMAP_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.EXPO_PUBLIC_CARTO_BASEMAP_API_KEY;
    } else {
      process.env.EXPO_PUBLIC_CARTO_BASEMAP_API_KEY = originalKey;
    }
  });

  it('builds voyager raster tile URLs without a key', () => {
    delete process.env.EXPO_PUBLIC_CARTO_BASEMAP_API_KEY;

    expect(cartoVoyagerRasterTileUrl(14, 4096, 6144)).toBe(
      'https://basemaps.cartocdn.com/rastertiles/voyager/14/4096/6144@2x.png',
    );
    expect(cartoVoyagerRasterTileUrls()).toEqual([
      'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
    ]);
  });

  it('appends the CARTO basemap key when configured', () => {
    process.env.EXPO_PUBLIC_CARTO_BASEMAP_API_KEY = 'test-carto-key';

    expect(cartoVoyagerRasterTileUrl(14, 4096, 6144)).toBe(
      'https://basemaps.cartocdn.com/rastertiles/voyager/14/4096/6144@2x.png?key=test-carto-key',
    );
    expect(cartoVoyagerRasterTileUrls()[0]).toBe(
      'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=test-carto-key',
    );
  });
});
