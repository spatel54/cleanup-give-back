import * as Location from 'expo-location';

/** Human-readable place line from a native reverse-geocode result. */
export function formatGeocodedPlace(place: Location.LocationGeocodedAddress): string {
  const street = [place.streetNumber, place.street].filter(Boolean).join(' ').trim();
  const parts = [street || place.name, place.city, place.region, place.postalCode]
    .map((part) => (part ?? '').trim())
    .filter(Boolean);
  return [...new Set(parts)].join(', ');
}

/** High-accuracy GPS + native reverse geocode. Caller must already have location permission. */
export async function reverseGeocodeCurrentPlace(): Promise<string | null> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });
  const results = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
  const first = results[0];
  if (!first) {
    return null;
  }
  const label = formatGeocodedPlace(first);
  return label || null;
}
