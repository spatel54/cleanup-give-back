import { Linking, Platform } from 'react-native';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

/** Shareable maps URL for clipboard (works on iOS, Android, and web). */
export function mapsLinkForLocation(address: string, coordinate?: MapCoordinate): string {
  const trimmed = address.trim();
  // Prefer the street address so Maps shows a place name, not bare lat/lng.
  if (trimmed) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
  }
  if (coordinate) {
    const { latitude, longitude } = coordinate;
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  return 'https://www.google.com/maps';
}

/** Opens Apple Maps on iOS and Google Maps on Android/web for the location. */
export async function openLocationInMaps(
  address: string,
  coordinate?: MapCoordinate,
): Promise<void> {
  const query = encodeURIComponent(address);
  let url: string;

  if (Platform.OS === 'ios') {
    if (coordinate) {
      const { latitude, longitude } = coordinate;
      url = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${query}`;
    } else {
      url = `http://maps.apple.com/?q=${query}`;
    }
  } else {
    // Google Maps HTTPS works on Android, web, and as a universal fallback.
    url = mapsLinkForLocation(address, coordinate);
  }

  await Linking.openURL(url);
}
