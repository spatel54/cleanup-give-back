/** CARTO raster basemap API key — free at https://carto.com/basemaps/apikey */
export function getCartoBasemapApiKey(): string {
  return (process.env.EXPO_PUBLIC_CARTO_BASEMAP_API_KEY ?? '').trim();
}

const VOYAGER_RASTER_PATH = 'rastertiles/voyager';

function appendCartoKey(url: string, apiKey: string): string {
  if (!apiKey) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}key=${encodeURIComponent(apiKey)}`;
}

/** Single CARTO Voyager raster tile URL (`@2x` for Retina snapshots). */
export function cartoVoyagerRasterTileUrl(z: number, x: number, y: number): string {
  const base = `https://basemaps.cartocdn.com/${VOYAGER_RASTER_PATH}/${z}/${x}/${y}@2x.png`;
  return appendCartoKey(base, getCartoBasemapApiKey());
}

const RASTER_SUBDOMAINS = ['a', 'b', 'c', 'd'] as const;

/** Round-robin subdomain tile URLs for MapLibre raster sources. */
export function cartoVoyagerRasterTileUrls(): string[] {
  const apiKey = getCartoBasemapApiKey();
  return RASTER_SUBDOMAINS.map((subdomain) =>
    appendCartoKey(
      `https://${subdomain}.basemaps.cartocdn.com/${VOYAGER_RASTER_PATH}/{z}/{x}/{y}@2x.png`,
      apiKey,
    ),
  );
}
