/**
 * Free place search for admin maps (no Google required).
 *
 * Parallel:
 * - US Census - strong US street coverage when the query looks like an address
 * - Photon - OSM places / parks / landmarks
 * Then Nominatim fills remaining slots if the list is still thin.
 *
 * Prefer `/api/place-search` so Nominatim gets a proper User-Agent.
 */

import { searchCensusAddresses, looksLikeUsStreetQuery } from "@/lib/census-geocode";
import { searchPhoton, type PhotonHit } from "@/lib/photon";

export type PlaceHit = PhotonHit;

export type PlaceSearchSource = "census" | "photon" | "nominatim" | "mixed" | "none";

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const UA = "CleanUpGiveBackAdmin/1.0 (heatmap place search)";

/** Shared bias helper - viewport center from `[minLng, minLat, maxLng, maxLat]`. */
export function biasFromViewbox(
  viewboxBounds?: [number, number, number, number],
): { latitude: number; longitude: number } | undefined {
  if (!viewboxBounds) return undefined;
  const [minLng, minLat, maxLng, maxLat] = viewboxBounds;
  return {
    longitude: (minLng + maxLng) / 2,
    latitude: (minLat + maxLat) / 2,
  };
}

function nearlySamePoint(a: PlaceHit, b: PlaceHit): boolean {
  return Math.abs(a.latitude - b.latitude) < 0.0008 && Math.abs(a.longitude - b.longitude) < 0.0008;
}

function mergePreferFirst(primary: PlaceHit[], secondary: PlaceHit[], limit: number): PlaceHit[] {
  const out: PlaceHit[] = [];
  for (const hit of [...primary, ...secondary]) {
    if (out.some((existing) => nearlySamePoint(existing, hit) || existing.label === hit.label)) {
      continue;
    }
    out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}

async function searchNominatimMany(
  query: string,
  opts?: {
    viewboxBounds?: [number, number, number, number];
    limit?: number;
    signal?: AbortSignal;
  },
): Promise<PlaceHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const limit = opts?.limit ?? 6;
  const params = new URLSearchParams({
    format: "jsonv2",
    q: trimmed,
    limit: String(limit),
    addressdetails: "0",
    countrycodes: "us",
  });
  if (opts?.viewboxBounds) {
    const [minLng, minLat, maxLng, maxLat] = opts.viewboxBounds;
    params.set("viewbox", `${minLng},${maxLat},${maxLng},${minLat}`);
    params.set("bounded", "0");
  }

  const timeoutSignal = AbortSignal.timeout(5000);
  const signal = opts?.signal ? AbortSignal.any([opts.signal, timeoutSignal]) : timeoutSignal;

  const res = await fetch(`${NOMINATIM_SEARCH}?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal,
  });
  if (!res.ok) return [];

  const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return results
    .map((r) => ({
      label: r.display_name,
      latitude: Number(r.lat),
      longitude: Number(r.lon),
    }))
    .filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude) && h.label);
}

/**
 * Typeahead / resolve. Never throws - empty array on total failure.
 */
export async function searchPlacesFree(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    viewboxBounds?: [number, number, number, number];
    limit?: number;
    signal?: AbortSignal;
  },
): Promise<{ hits: PlaceHit[]; source: PlaceSearchSource }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { hits: [], source: "none" };
  const limit = opts?.limit ?? 6;
  const wantCensus = looksLikeUsStreetQuery(trimmed);

  const photonPromise = searchPhoton(trimmed, {
    bias: opts?.bias,
    limit,
    signal: opts?.signal,
  }).catch((err) => {
    console.error("[place-search] photon failed:", err instanceof Error ? err.message : err);
    return [] as PlaceHit[];
  });

  const censusPromise = wantCensus
    ? searchCensusAddresses(trimmed, { limit, signal: opts?.signal })
    : Promise.resolve([] as PlaceHit[]);

  const [photonHits, censusHits] = await Promise.all([photonPromise, censusPromise]);
  if (opts?.signal?.aborted) return { hits: [], source: "none" };

  let hits = mergePreferFirst(censusHits, photonHits, limit);
  let source: PlaceSearchSource =
    censusHits.length > 0 && photonHits.length > 0
      ? "mixed"
      : censusHits.length > 0
        ? "census"
        : photonHits.length > 0
          ? "photon"
          : "none";

  if (hits.length < limit) {
    try {
      const nominatimHits = await searchNominatimMany(trimmed, {
        viewboxBounds: opts?.viewboxBounds,
        limit,
        signal: opts?.signal,
      });
      if (nominatimHits.length > 0) {
        const before = hits.length;
        hits = mergePreferFirst(hits, nominatimHits, limit);
        if (hits.length > before) {
          source = before === 0 ? "nominatim" : source === "none" ? "nominatim" : "mixed";
        }
      }
    } catch (err) {
      console.error("[place-search] nominatim failed:", err instanceof Error ? err.message : err);
    }
  }

  return { hits, source: hits.length === 0 ? "none" : source };
}

/** Single best place for Search / Enter. */
export async function resolvePlaceFree(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    viewboxBounds?: [number, number, number, number];
    signal?: AbortSignal;
  },
): Promise<PlaceHit | null> {
  const { hits } = await searchPlacesFree(query, { ...opts, limit: 1 });
  return hits[0] ?? null;
}
