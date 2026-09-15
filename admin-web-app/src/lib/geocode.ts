/**
 * GPS → FIPS geocoding service for county/neighborhood heatmap tiers.
 *
 * Event address → lat/lng uses `forwardGeocodeAddress` (Census → Google).
 * Point → FIPS remains a mock lookup for heatmap demos.
 */

import { forwardGeocodeAddress } from './forward-geocode';

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type GeocodingResult = {
  fips: {
    state: string;
    county: string;
    tract?: string; // For neighborhood-level data
  };
  names: {
    state: string;
    county: string;
    neighborhood?: string;
  };
  confidence: number; // 0-1, how confident the geocoding is
};

export type GeocodingError = {
  code: 'INVALID_COORDINATES' | 'OUTSIDE_US' | 'API_ERROR' | 'RATE_LIMITED';
  message: string;
};

/**
 * Mock geocoding implementation using approximate geographic regions.
 * In production, this would call a real geocoding API.
 */
export async function geocodePoint(point: GeoPoint): Promise<GeocodingResult | GeocodingError> {
  const { latitude, longitude } = point;
  
  // Basic validation
  if (!isValidCoordinate(latitude, longitude)) {
    return {
      code: 'INVALID_COORDINATES',
      message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
    };
  }
  
  // Check if coordinates are roughly within US bounds
  if (latitude < 24.396308 || latitude > 49.384358 || 
      longitude < -125.0 || longitude > -66.93457) {
    return {
      code: 'OUTSIDE_US',
      message: 'Coordinates appear to be outside the continental United States'
    };
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock geocoding based on approximate regions
  const result = mockGeocodeLookup(latitude, longitude);
  
  if (!result) {
    return {
      code: 'API_ERROR',
      message: 'Unable to determine FIPS code for coordinates'
    };
  }
  
  return result;
}

/**
 * Batch geocoding for multiple points with rate limiting.
 */
export async function geocodePoints(
  points: (GeoPoint & { id: string })[]
): Promise<Map<string, GeocodingResult | GeocodingError>> {
  const results = new Map<string, GeocodingResult | GeocodingError>();
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async point => ({
        id: point.id,
        result: await geocodePoint(point)
      }))
    );
    
    // Add to results
    for (const { id, result } of batchResults) {
      results.set(id, result);
    }
    
    // Rate limit between batches
    if (i + batchSize < points.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Mock geocoding lookup table based on approximate US regions.
 * In production, this would be replaced with real API calls.
 */
function mockGeocodeLookup(lat: number, lng: number): GeocodingResult | null {
  // Chicago/Illinois region (expanded for testing)
  if (lat >= 40.0 && lat <= 42.5 && lng >= -89.0 && lng <= -87.0) {
    return {
      fips: {
        state: '17', // Illinois
        county: '031', // Cook County (Chicago)
        tract: Math.random() > 0.5 ? '0001' : '0002' // Random tract for demo
      },
      names: {
        state: 'Illinois',
        county: 'Cook County',
        neighborhood: Math.random() > 0.5 ? 'Lincoln Park' : 'River North'
      },
      confidence: 0.95
    };
  }
  
  // New York region
  if (lat >= 40.4 && lat <= 41.0 && lng >= -74.5 && lng <= -73.5) {
    return {
      fips: {
        state: '36', // New York
        county: Math.random() > 0.5 ? '061' : '081', // Manhattan or Queens
        tract: Math.floor(Math.random() * 10).toString().padStart(4, '0')
      },
      names: {
        state: 'New York',
        county: Math.random() > 0.5 ? 'Manhattan' : 'Queens',
        neighborhood: Math.random() > 0.5 ? 'Midtown' : 'Astoria'
      },
      confidence: 0.92
    };
  }
  
  // California (LA/San Francisco regions)
  if (lat >= 32.5 && lat <= 38.0 && lng >= -125.0 && lng <= -117.0) {
    return {
      fips: {
        state: '06', // California
        county: lat > 35.0 ? '075' : '037', // San Francisco or Los Angeles
        tract: Math.floor(Math.random() * 20).toString().padStart(4, '0')
      },
      names: {
        state: 'California',
        county: lat > 35.0 ? 'San Francisco County' : 'Los Angeles County',
        neighborhood: lat > 35.0 ? 'Mission District' : 'Hollywood'
      },
      confidence: 0.88
    };
  }
  
  // Texas (generic)
  if (lat >= 25.8 && lat <= 36.5 && lng >= -106.6 && lng <= -93.5) {
    return {
      fips: {
        state: '48', // Texas
        county: '201', // Harris County (Houston area)
        tract: Math.floor(Math.random() * 15).toString().padStart(4, '0')
      },
      names: {
        state: 'Texas',
        county: 'Harris County',
        neighborhood: 'Downtown Houston'
      },
      confidence: 0.80
    };
  }
  
  // Florida (generic)
  if (lat >= 24.0 && lat <= 31.0 && lng >= -87.6 && lng <= -80.0) {
    return {
      fips: {
        state: '12', // Florida
        county: '086', // Miami-Dade
        tract: Math.floor(Math.random() * 25).toString().padStart(4, '0')
      },
      names: {
        state: 'Florida',
        county: 'Miami-Dade County',
        neighborhood: 'South Beach'
      },
      confidence: 0.85
    };
  }
  
  return null;
}

/**
 * Enhanced session type that includes GPS coordinates for geocoding.
 */
export type SessionWithGPS = {
  id: string;
  latitude?: number;
  longitude?: number;
  // ... other session fields
};

/**
 * Geocode a text address for event pins (Census → Google fallback).
 * Attaches mock FIPS via `geocodePoint` for heatmap helpers that expect that shape.
 */
export async function geocodeAddress(
  address: string,
): Promise<(GeocodingResult & { latitude: number; longitude: number }) | GeocodingError> {
  if (!address || address.trim().length < 3) {
    return {
      code: 'INVALID_COORDINATES',
      message: 'Address is too short or empty',
    };
  }

  const hit = await forwardGeocodeAddress(address);
  if (!('latitude' in hit)) {
    const code =
      hit.code === 'RATE_LIMITED'
        ? 'RATE_LIMITED'
        : hit.code === 'INVALID_ADDRESS'
          ? 'INVALID_COORDINATES'
          : 'API_ERROR';
    return { code, message: hit.message };
  }

  const { latitude, longitude } = hit;
  const geoResult = await geocodePoint({ latitude, longitude });

  if ('fips' in geoResult) {
    return {
      ...geoResult,
      latitude,
      longitude,
    };
  }
  return geoResult;
}