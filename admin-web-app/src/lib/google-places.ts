/**
 * Shared Google Maps JS API (Places library) loader for admin address / place search.
 * Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. When unset, callers fall back to free geocoders.
 */

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

export function hasGoogleMapsKey(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY);
}

const SCRIPT_ID = "google-maps-places-script";

export type GooglePlaceResult = {
  formatted_address?: string;
  name?: string;
  geometry?: { location?: { lat: () => number; lng: () => number } };
};

export type PlacesAutocomplete = {
  addListener: (event: string, handler: () => void) => void;
  getPlace: () => GooglePlaceResult;
  setBounds?: (bounds: unknown) => void;
};

declare global {
  interface Window {
    google?: {
      maps: {
        LatLngBounds: new (sw?: unknown, ne?: unknown) => unknown;
        LatLng: new (lat: number, lng: number) => unknown;
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts: {
              fields: string[];
              types?: string[];
              componentRestrictions?: { country: string | string[] };
              bounds?: unknown;
              strictBounds?: boolean;
            },
          ) => PlacesAutocomplete;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Loads the Maps JS API with the Places library (idempotent). */
export function loadPlacesScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error("Missing Google Maps API key"));
  if (window.google?.maps?.places) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export type PlaceSelection = {
  label: string;
  latitude: number;
  longitude: number;
};

/** Builds a LatLngBounds from `[minLng, minLat, maxLng, maxLat]` when Maps is loaded. */
export function boundsFromFlat(
  flat: [number, number, number, number] | undefined,
): unknown | undefined {
  if (!flat || !window.google?.maps) return undefined;
  const [minLng, minLat, maxLng, maxLat] = flat;
  return new window.google.maps.LatLngBounds(
    new window.google.maps.LatLng(minLat, minLng),
    new window.google.maps.LatLng(maxLat, maxLng),
  );
}
