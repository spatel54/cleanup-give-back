'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPinIcon } from '@/components/ui/Icons';
import { FIELD, LABEL } from './formStyles';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const SCRIPT_ID = 'google-maps-places-script';

/**
 * Minimal shape of the Places widget we touch — avoids pulling in
 * `@types/google.maps` for a handful of calls.
 */
type PlacesAutocomplete = {
  addListener: (event: string, handler: () => void) => void;
  getPlace: () => {
    formatted_address?: string;
    geometry?: { location?: { lat: () => number; lng: () => number } };
  };
};

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts: { fields: string[]; types: string[] },
          ) => PlacesAutocomplete;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadPlacesScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Live address suggestions via Google Places, with hidden lat/lng inputs
 * kept in sync so `EventForm` submits geocoded coordinates without ever
 * showing a raw number input. Falls back to a plain text field — still
 * named `address` — when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is unset.
 */
export function AddressAutocomplete({
  defaultAddress = '',
  defaultLat = null,
  defaultLng = null,
  onValidityChange,
}: {
  defaultAddress?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  onValidityChange?: (valid: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [address, setAddress] = useState(defaultAddress);
  const [lat, setLat] = useState<number | null>(defaultLat);
  const [lng, setLng] = useState<number | null>(defaultLng);
  const [scriptFailed, setScriptFailed] = useState(false);

  const hasApiKey = Boolean(GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (!hasApiKey || !inputRef.current) return;
    let cancelled = false;
    loadPlacesScript()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google) return;
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry'],
          types: ['address'],
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          setAddress(place.formatted_address ?? inputRef.current?.value ?? '');
          setLat(place.geometry?.location?.lat() ?? null);
          setLng(place.geometry?.location?.lng() ?? null);
        });
      })
      .catch(() => {
        if (!cancelled) setScriptFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // Widget attaches once per mount; defaultAddress/defaultLat/defaultLng seed initial state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiKey]);

  const handleManualChange = useCallback((value: string) => {
    setAddress(value);
    // Typing invalidates a prior selection's coordinates until a new one is chosen.
    setLat(null);
    setLng(null);
  }, []);

  const needsSelection = hasApiKey && address.trim() !== '' && (lat == null || lng == null);

  useEffect(() => {
    onValidityChange?.(!needsSelection);
  }, [needsSelection, onValidityChange]);

  return (
    <div>
      <label htmlFor="address-input" className={LABEL}>
        Address
      </label>
      <div className="relative">
        <MapPinIcon className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" aria-hidden />
        <input
          id="address-input"
          ref={inputRef}
          type="text"
          value={address}
          onChange={(e) => handleManualChange(e.target.value)}
          placeholder="600 E Algonquin Rd, Des Plaines, IL 60018"
          className={`${FIELD} pl-[2.25rem]`}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="lat" value={lat ?? ''} />
      <input type="hidden" name="lng" value={lng ?? ''} />

      {needsSelection ? (
        <p role="alert" className="font-body text-[12px] text-[#835400] mt-xs">
          Pick an address from the suggestions so the map pin is accurate.
        </p>
      ) : !hasApiKey ? (
        <p className="font-body text-[12px] text-text-tertiary mt-xs">
          Set <span className="font-data">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</span> to enable live address suggestions.
        </p>
      ) : scriptFailed ? (
        <p className="font-body text-[12px] text-text-tertiary mt-xs">
          Couldn&apos;t load address suggestions — you can still type the address manually.
        </p>
      ) : null}
    </div>
  );
}
