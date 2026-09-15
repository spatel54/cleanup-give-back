/**
 * US Census Bureau forward geocode helpers (free, no API key).
 * Strong US street-address coverage; weak for POIs/parks/landmarks.
 * https://geocoding.geo.census.gov/geocoder
 */

const CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";

export type CensusPlaceHit = {
  label: string;
  latitude: number;
  longitude: number;
};

type CensusResponse = {
  result?: {
    addressMatches?: Array<{
      matchedAddress?: string;
      coordinates?: { x?: number; y?: number };
    }>;
  };
};

/** True when the query likely includes a street number / road token - worth hitting Census. */
export function looksLikeUsStreetQuery(query: string): boolean {
  const q = query.trim();
  if (q.length < 5) return false;
  if (/\d/.test(q)) return true;
  return /\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court|way|hwy|highway|pkwy|parkway|pl|place|cir|circle|trl|trail)\b/i.test(
    q,
  );
}

/**
 * One-line Census address search. Returns up to `limit` matches (empty on miss/error).
 * Never throws.
 */
export async function searchCensusAddresses(
  query: string,
  opts?: { limit?: number; signal?: AbortSignal },
): Promise<CensusPlaceHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL(CENSUS_URL);
  url.searchParams.set("address", trimmed);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");

  try {
    const timeoutSignal = AbortSignal.timeout(5000);
    const signal = opts?.signal ? AbortSignal.any([opts.signal, timeoutSignal]) : timeoutSignal;
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as CensusResponse;
    const matches = data.result?.addressMatches ?? [];
    const limit = opts?.limit ?? 6;
    const hits: CensusPlaceHit[] = [];
    for (const match of matches) {
      if (hits.length >= limit) break;
      const latitude = match.coordinates?.y;
      const longitude = match.coordinates?.x;
      const label = match.matchedAddress?.trim();
      if (
        !label ||
        latitude == null ||
        longitude == null ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        continue;
      }
      hits.push({ label, latitude, longitude });
    }
    return hits;
  } catch {
    return [];
  }
}
