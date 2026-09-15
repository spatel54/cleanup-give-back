import { feature } from 'topojson-client';
import { geoAlbersUsa, geoCentroid, geoMercator, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

const STATES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
const COUNTIES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';

export type UsGeoFeature = Feature<Geometry, { name?: string }> & { id?: string | number };

type AtlasTopology = {
  type: 'Topology';
  objects: Record<string, unknown>;
  arcs: unknown;
};

let statesCache: Promise<FeatureCollection> | null = null;
let countiesCache: Promise<FeatureCollection> | null = null;

async function loadTopology(url: string): Promise<AtlasTopology> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load map data (${res.status})`);
  }
  return (await res.json()) as AtlasTopology;
}

export function loadUsStates(): Promise<FeatureCollection> {
  if (!statesCache) {
    statesCache = loadTopology(STATES_URL).then((topo) => {
      const obj = topo.objects.states;
      if (!obj) throw new Error('states topology missing');
      return feature(topo as never, obj as never) as unknown as FeatureCollection;
    });
  }
  return statesCache;
}

export function loadUsCounties(): Promise<FeatureCollection> {
  if (!countiesCache) {
    countiesCache = loadTopology(COUNTIES_URL).then((topo) => {
      const obj = topo.objects.counties;
      if (!obj) throw new Error('counties topology missing');
      return feature(topo as never, obj as never) as unknown as FeatureCollection;
    });
  }
  return countiesCache;
}

export function fipsId(featureOrId: UsGeoFeature | string | number | undefined): string {
  if (featureOrId == null) return '';
  if (typeof featureOrId === 'string' || typeof featureOrId === 'number') {
    const raw = String(featureOrId);
    return raw.length <= 2 ? raw.padStart(2, '0') : raw.padStart(5, '0');
  }
  const raw = featureOrId.id != null ? String(featureOrId.id) : '';
  if (raw.length <= 2) return raw.padStart(2, '0');
  return raw.padStart(5, '0');
}

export function stateFipsFromCounty(countyFips: string): string {
  return countyFips.slice(0, 2);
}

/** Nation-scale Albers USA (AK/HI insets). */
export function makePathForCollection(
  collection: FeatureCollection,
  width: number,
  height: number,
  padding = 8,
) {
  const projection = geoAlbersUsa().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    collection,
  );
  return { path: geoPath(projection), projection };
}

/**
 * Single-state / regional fit — Mercator reads clearer than Albers USA when
 * zoomed into one state's counties (bubble heatmap layer).
 */
export function makeRegionalPathForCollection(
  collection: FeatureCollection,
  width: number,
  height: number,
  padding = 16,
) {
  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    collection,
  );
  return { path: geoPath(projection), projection };
}

export type CountyBubble = {
  id: string;
  name: string;
  cx: number;
  cy: number;
  sessionCount: number;
  hours: number;
  underReview: number;
};

/** County centroids projected for bubble heatmap (skip null projections). */
export function countyBubblesForState(
  counties: FeatureCollection,
  projection: ReturnType<typeof geoMercator>,
  statsById: Map<
    string,
    { sessionCount: number; hours: number; underReview: number; name: string }
  >,
): CountyBubble[] {
  const bubbles: CountyBubble[] = [];
  for (const raw of counties.features) {
    const f = raw as UsGeoFeature;
    const id = fipsId(f);
    const centroid = geoCentroid(f);
    const xy = projection(centroid);
    if (!xy || !Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) continue;
    const stat = statsById.get(id);
    bubbles.push({
      id,
      name: f.properties?.name ?? stat?.name ?? id,
      cx: xy[0],
      cy: xy[1],
      sessionCount: stat?.sessionCount ?? 0,
      hours: stat?.hours ?? 0,
      underReview: stat?.underReview ?? 0,
    });
  }
  return bubbles;
}

export function filterCountiesByState(
  counties: FeatureCollection,
  stateFips: string,
): FeatureCollection {
  const features = counties.features.filter((f) => fipsId(f as UsGeoFeature).startsWith(stateFips));
  return { type: 'FeatureCollection', features };
}

export function findFeatureByFips(
  collection: FeatureCollection,
  fips: string,
): UsGeoFeature | undefined {
  return collection.features.find((f) => fipsId(f as UsGeoFeature) === fips) as
    | UsGeoFeature
    | undefined;
}
