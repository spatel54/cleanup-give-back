/**
 * Forward geocode for event addresses.
 * Primary: US Census Bureau (free, strong US street coverage).
 * Fallback: Google Geocoding when GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set.
 */

export type ForwardGeocodeHit = {
  matchedAddress: string;
  latitude: number;
  longitude: number;
  source: 'census' | 'google';
};

export type ForwardGeocodeError = {
  code: 'INVALID_ADDRESS' | 'NOT_FOUND' | 'RATE_LIMITED' | 'API_ERROR';
  message: string;
};

const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

function googleMapsApiKey(): string | undefined {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    undefined
  );
}

type CensusResponse = {
  result?: {
    addressMatches?: Array<{
      matchedAddress?: string;
      coordinates?: { x?: number; y?: number };
    }>;
  };
};

async function lookupCensus(address: string): Promise<ForwardGeocodeHit | ForwardGeocodeError> {
  const url = new URL(CENSUS_URL);
  url.searchParams.set('address', address);
  url.searchParams.set('benchmark', 'Public_AR_Current');
  url.searchParams.set('format', 'json');

  let data: CensusResponse;
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.status === 429) {
      return { code: 'RATE_LIMITED', message: 'Census geocoder rate limit - try again shortly' };
    }
    if (!res.ok) {
      return { code: 'API_ERROR', message: `Census geocoder returned ${res.status}` };
    }
    data = (await res.json()) as CensusResponse;
  } catch {
    return { code: 'API_ERROR', message: 'Failed to reach Census geocoder' };
  }

  const match = data.result?.addressMatches?.[0];
  const latitude = match?.coordinates?.y;
  const longitude = match?.coordinates?.x;
  const matchedAddress = match?.matchedAddress?.trim();

  if (
    !matchedAddress ||
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return { code: 'NOT_FOUND', message: 'Address not found in Census geocoder' };
  }

  return {
    matchedAddress,
    latitude,
    longitude,
    source: 'census',
  };
}

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
};

async function lookupGoogle(address: string): Promise<ForwardGeocodeHit | ForwardGeocodeError> {
  const key = googleMapsApiKey();
  if (!key) {
    return { code: 'API_ERROR', message: 'Google Maps API key not configured' };
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', key);

  let data: GoogleGeocodeResponse;
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { code: 'API_ERROR', message: `Google Geocoding returned ${res.status}` };
    }
    data = (await res.json()) as GoogleGeocodeResponse;
  } catch {
    return { code: 'API_ERROR', message: 'Failed to reach Google Geocoding' };
  }

  if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'RESOURCE_EXHAUSTED') {
    return { code: 'RATE_LIMITED', message: data.error_message ?? 'Google Geocoding rate limited' };
  }
  if (data.status === 'ZERO_RESULTS') {
    return { code: 'NOT_FOUND', message: 'Address not found via Google Geocoding' };
  }
  if (data.status !== 'OK' || !data.results?.length) {
    return {
      code: 'API_ERROR',
      message: data.error_message ?? `Google Geocoding status ${data.status}`,
    };
  }

  const hit = data.results[0];
  const latitude = hit.geometry?.location?.lat;
  const longitude = hit.geometry?.location?.lng;
  const matchedAddress = hit.formatted_address?.trim();

  if (
    !matchedAddress ||
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return { code: 'NOT_FOUND', message: 'Google Geocoding returned an incomplete result' };
  }

  return {
    matchedAddress,
    latitude,
    longitude,
    source: 'google',
  };
}

function isHit(
  result: ForwardGeocodeHit | ForwardGeocodeError,
): result is ForwardGeocodeHit {
  return 'latitude' in result;
}

/**
 * Census first; Google Geocoding if Census misses and a Maps key is configured.
 */
export async function forwardGeocodeAddress(
  address: string,
): Promise<ForwardGeocodeHit | ForwardGeocodeError> {
  const trimmed = address.trim();
  if (trimmed.length < 3) {
    return { code: 'INVALID_ADDRESS', message: 'Address is too short or empty' };
  }

  const census = await lookupCensus(trimmed);
  if (isHit(census)) return census;

  if (googleMapsApiKey()) {
    const google = await lookupGoogle(trimmed);
    if (isHit(google)) return google;
    // Prefer Google's error only when Census was a miss; otherwise keep Census error.
    if (census.code === 'NOT_FOUND') return google;
  }

  return census;
}

export function hasGoogleMapsApiKey(): boolean {
  return Boolean(googleMapsApiKey());
}
