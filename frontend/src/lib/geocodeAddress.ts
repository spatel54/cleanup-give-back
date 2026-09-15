/**
 * Forward geocoding via Photon (Komoot / OpenStreetMap). No API key.
 * https://photon.komoot.io
 */

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    district?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
    osm_value?: string;
  };
};

export type AddressSuggestion = {
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
};

const US_STATE_ABBR: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
};

export function normalizeUsState(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  return US_STATE_ABBR[trimmed.toLowerCase()] ?? trimmed;
}

export const US_STATE_CODES = [...new Set(Object.values(US_STATE_ABBR))].sort();

export type CitySuggestion = {
  city: string;
  state: string;
};

function locality(props: NonNullable<PhotonFeature['properties']>): string {
  return (props.city ?? props.town ?? props.village ?? props.district ?? '').trim();
}

function cityName(props: NonNullable<PhotonFeature['properties']>): string {
  return locality(props) || (props.name ?? '').trim();
}

function withTimeoutSignal(signal?: AbortSignal, ms = 8000): AbortSignal | undefined {
  const timeout =
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(ms)
      : undefined;
  if (signal && timeout && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal, timeout]);
  }
  return signal ?? timeout;
}

function streetLine(props: NonNullable<PhotonFeature['properties']>): string {
  const line = [props.housenumber, props.street ?? props.name].filter(Boolean).join(' ').trim();
  return line || (props.name ?? '').trim();
}

function formatLabel(props: NonNullable<PhotonFeature['properties']>): string {
  const parts = [streetLine(props) || props.name, locality(props), normalizeUsState(props.state ?? ''), props.postcode]
    .map((part) => (part ?? '').trim())
    .filter(Boolean);
  return [...new Set(parts)].join(', ');
}

function isUsResult(props: NonNullable<PhotonFeature['properties']>): boolean {
  const code = (props.countrycode ?? '').toLowerCase();
  if (code) return code === 'us' || code === 'usa';
  const country = (props.country ?? '').toLowerCase();
  return !country || country === 'united states' || country === 'usa' || country === 'us';
}

function toSuggestion(feature: PhotonFeature): AddressSuggestion | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [longitude, latitude] = coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const props = feature.properties ?? {};
  if (!isUsResult(props)) return null;

  const street = streetLine(props);
  const city = locality(props);
  const state = normalizeUsState(props.state ?? '');
  const zip = (props.postcode ?? '').trim();
  const label = formatLabel(props);
  if (!label) return null;

  return { label, street, city, state, zip, latitude, longitude };
}

async function fetchPhotonFeatures(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    limit?: number;
    layers?: string[];
    signal?: AbortSignal;
  },
): Promise<PhotonFeature[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: String(opts?.limit ?? 8),
    lang: 'en',
  });
  const layers = opts?.layers ?? ['house', 'street'];
  for (const layer of layers) {
    params.append('layer', layer);
  }
  if (opts?.bias) {
    params.set('lat', String(opts.bias.latitude));
    params.set('lon', String(opts.bias.longitude));
  }

  const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: withTimeoutSignal(opts?.signal),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { features?: PhotonFeature[] };
  return data.features ?? [];
}

export async function searchAddressSuggestions(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    limit?: number;
    signal?: AbortSignal;
  },
): Promise<AddressSuggestion[]> {
  const features = await fetchPhotonFeatures(query, opts);
  const hits: AddressSuggestion[] = [];
  const seen = new Set<string>();
  for (const feature of features) {
    const hit = toSuggestion(feature);
    if (!hit) continue;
    const key = `${hit.street}|${hit.city}|${hit.state}|${hit.zip}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(hit);
  }
  return hits;
}

function collectCityHits(features: PhotonFeature[]): CitySuggestion[] {
  const hits: CitySuggestion[] = [];
  const seen = new Set<string>();
  for (const feature of features) {
    const props = feature.properties ?? {};
    if (!isUsResult(props)) continue;
    const city = cityName(props);
    const state = normalizeUsState(props.state ?? '');
    if (!city) continue;
    const key = `${city}|${state}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ city, state });
  }
  return hits;
}

export async function searchCitySuggestions(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    limit?: number;
    signal?: AbortSignal;
  },
): Promise<CitySuggestion[]> {
  const layered = await fetchPhotonFeatures(query, {
    ...opts,
    layers: ['city'],
    limit: opts?.limit ?? 8,
  });
  const layeredHits = collectCityHits(layered);
  if (layeredHits.length > 0) return layeredHits;

  const fallback = await fetchPhotonFeatures(query, {
    ...opts,
    layers: [],
    limit: opts?.limit ?? 8,
  });
  return collectCityHits(fallback);
}

export async function lookupZipsForCityState(
  city: string,
  state: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const localityName = city.trim();
  const abbr = normalizeUsState(state);
  if (!localityName || abbr.length !== 2) return [];

  const url = `https://api.zippopotam.us/us/${abbr.toLowerCase()}/${encodeURIComponent(localityName)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: withTimeoutSignal(signal),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { places?: { 'post code'?: string }[] };
  const zips: string[] = [];
  const seen = new Set<string>();
  for (const place of data.places ?? []) {
    const zip = (place['post code'] ?? '').trim();
    if (!zip || seen.has(zip)) continue;
    seen.add(zip);
    zips.push(zip);
  }
  return zips;
}

export async function geocodeAddressQuery(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    signal?: AbortSignal;
  },
): Promise<{ latitude: number; longitude: number } | null> {
  const hits = await searchAddressSuggestions(query, { ...opts, limit: 1 });
  const first = hits[0];
  return first ? { latitude: first.latitude, longitude: first.longitude } : null;
}
