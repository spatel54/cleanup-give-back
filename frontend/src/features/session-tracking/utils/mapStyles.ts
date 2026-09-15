import type { StyleSpecification } from '@maplibre/maplibre-react-native';

import type { MapBasemapTheme } from '../mapThemeStore';
import cartoDarkMatterBaseStyle from './cartoDarkMatterStyle.json';

export type MapLayerType = 'standard' | 'satellite' | 'hybrid';

export const DEFAULT_MAP_LAYER: MapLayerType = 'standard';

export const MAP_LAYER_OPTIONS: ReadonlyArray<{ id: MapLayerType; label: string }> = [
  { id: 'standard', label: 'Standard' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'hybrid', label: 'Hybrid' },
] as const;

const CARTO_VOYAGER = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

/**
 * Upstream Carto Dark Matter renders parks, nature reserves, and green
 * landcover (wood/grass/recreation ground) in the same near-black
 * (`#0e0e0e`) as the base map background, making them effectively
 * invisible. `cartoDarkMatterStyle.json` is a local snapshot of that style
 * (sources/sprite/glyphs still point at Carto's CDN — only the `layers`
 * styling is vendored) so these specific layers can be repainted a legible
 * dark green without depending on a runtime style-patch step that MapLibre's
 * React Native wrapper doesn't expose a hook for.
 *
 * Separately, Carto's vector `park` source-layer only ships a *fill* layer
 * for `class == national_park` and `class == nature_reserve` — this is true
 * in Voyager (light) too, not just Dark Matter. Named local parks (e.g.
 * Devonshire Park) come through with `class == "park"` (or similar) and get
 * no polygon fill at all in the stock style, only a `poi_park` point label —
 * so they're invisible/hard to spot regardless of theme. `park_local` below
 * adds the missing catch-all fill for dark mode so those parks actually show
 * up as shaded areas, not just a label.
 */
const DARK_GREENSPACE_FILL = '#1f3d2a';
const DARK_GREENSPACE_POI_TEXT = '#7fae8f';

function buildCartoDarkMatterStyle(): StyleSpecification {
  const style = structuredClone(cartoDarkMatterBaseStyle) as StyleSpecification;
  const greenspaceFillLayerIds = new Set([
    'landcover', // wood / grass / recreation_ground
    'park_national_park',
    'park_nature_reserve',
  ]);

  const layers: StyleSpecification['layers'] = [];
  for (const layer of style.layers) {
    if (greenspaceFillLayerIds.has(layer.id) && layer.type === 'fill') {
      layer.paint = { ...layer.paint, 'fill-color': DARK_GREENSPACE_FILL };
    } else if (layer.id === 'poi_park' && layer.type === 'symbol') {
      layer.paint = { ...layer.paint, 'text-color': DARK_GREENSPACE_POI_TEXT };
    }

    layers.push(layer);

    // Insert right after park_nature_reserve so it sits in the same visual
    // slot as the other park fills (below roads/water/labels, above landcover).
    if (layer.id === 'park_nature_reserve') {
      layers.push({
        id: 'park_local',
        type: 'fill',
        source: 'carto',
        'source-layer': 'park',
        filter: ['all', ['!=', 'class', 'national_park'], ['!=', 'class', 'nature_reserve']],
        paint: { 'fill-color': DARK_GREENSPACE_FILL, 'fill-opacity': 0.9 },
      });
    }
  }

  style.layers = layers;
  return style;
}

const CARTO_DARK_MATTER: StyleSpecification = buildCartoDarkMatterStyle();

const ESRI_WORLD_IMAGERY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const ESRI_WORLD_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

const ESRI_WORLD_TRANSPORTATION =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}';

/**
 * Esri's tile services don't have imagery/labels for every zoom level in every
 * location. Requesting a tile past this cap returns a placeholder image with
 * "Map data not available" baked in instead of a 404, so MapLibre can't fall
 * back automatically. Capping source `maxzoom` here makes MapLibre stop
 * fetching new tiles past this level and instead over-zoom (upscale) the last
 * real tile it has, which avoids ever rendering the placeholder.
 */
const ESRI_TILE_MAX_ZOOM = 19;

export const SATELLITE_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [ESRI_WORLD_IMAGERY],
      tileSize: 256,
      maxzoom: ESRI_TILE_MAX_ZOOM,
      attribution: 'Esri',
    },
  },
  layers: [
    {
      id: 'esri-imagery',
      type: 'raster',
      source: 'esri-imagery',
    },
  ],
};

export const HYBRID_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [ESRI_WORLD_IMAGERY],
      tileSize: 256,
      maxzoom: ESRI_TILE_MAX_ZOOM,
      attribution: 'Esri',
    },
    'esri-transportation': {
      type: 'raster',
      tiles: [ESRI_WORLD_TRANSPORTATION],
      tileSize: 256,
      maxzoom: ESRI_TILE_MAX_ZOOM,
      attribution: 'Esri',
    },
    'esri-labels': {
      type: 'raster',
      tiles: [ESRI_WORLD_LABELS],
      tileSize: 256,
      maxzoom: ESRI_TILE_MAX_ZOOM,
      attribution: 'Esri',
    },
  },
  layers: [
    {
      id: 'esri-imagery',
      type: 'raster',
      source: 'esri-imagery',
    },
    {
      // Road lines + road name labels — drawn above imagery, below place/boundary labels.
      id: 'esri-transportation',
      type: 'raster',
      source: 'esri-transportation',
    },
    {
      // Place names + political boundaries — drawn last so they sit on top of road lines.
      id: 'esri-labels',
      type: 'raster',
      source: 'esri-labels',
    },
  ],
};

export type MapStylePayload =
  | { type: 'url'; value: string }
  | { type: 'json'; value: StyleSpecification };

export function getMapStylePayload(
  layer: MapLayerType,
  theme: MapBasemapTheme = 'light',
): MapStylePayload {
  switch (layer) {
    case 'satellite':
      return { type: 'json', value: SATELLITE_MAP_STYLE };
    case 'hybrid':
      return { type: 'json', value: HYBRID_MAP_STYLE };
    case 'standard':
      return theme === 'dark'
        ? { type: 'json', value: CARTO_DARK_MATTER }
        : { type: 'url', value: CARTO_VOYAGER };
    default: {
      const _exhaustive: never = layer;
      return _exhaustive;
    }
  }
}

export function getNativeMapStyle(
  layer: MapLayerType,
  theme: MapBasemapTheme = 'light',
): string | StyleSpecification {
  const payload = getMapStylePayload(layer, theme);
  return payload.type === 'url' ? payload.value : payload.value;
}

export function getMapLayerLabel(layer: MapLayerType): string {
  return MAP_LAYER_OPTIONS.find((option) => option.id === layer)?.label ?? 'Standard';
}

/**
 * Fill + border for the fixed start pin on route replay / session-detail
 * previews. Contrasts against the basemap: black on the light Standard
 * style, white on dark Satellite/Hybrid imagery.
 */
export function getReplayStartMarkerColors(
  layer: MapLayerType,
  theme: MapBasemapTheme = 'light',
): {
  fill: string;
  border: string;
} {
  switch (layer) {
    case 'satellite':
    case 'hybrid':
      return { fill: '#ffffff', border: '#000000' };
    case 'standard':
      return theme === 'dark'
        ? { fill: '#ffffff', border: '#000000' }
        : { fill: '#000000', border: '#ffffff' };
    default: {
      const _exhaustive: never = layer;
      return _exhaustive;
    }
  }
}
