"use client";

/**
 * Event address field:
 * - With `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Places Autocomplete (live suggestions).
 * - Without: free-text + US Census verify on blur (Google Geocoding still used server-side
 *   as fallback when a key exists - see `forwardGeocodeAddress`).
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { MapPinIcon } from "@/components/ui/Icons";
import { verifyEventAddress } from "@/actions/geocode";
import { FIELD, LABEL } from "./formStyles";
import { hasGoogleMapsKey, loadPlacesScript } from "@/lib/google-places";

export function AddressAutocomplete({
  defaultAddress = "",
  defaultLat = null,
  defaultLng = null,
  onValidityChange,
}: {
  defaultAddress?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  onValidityChange?: (valid: boolean) => void;
}) {
  if (hasGoogleMapsKey()) {
    return (
      <GooglePlacesAddressField
        defaultAddress={defaultAddress}
        defaultLat={defaultLat}
        defaultLng={defaultLng}
        onValidityChange={onValidityChange}
      />
    );
  }

  return (
    <CensusVerifyAddressField
      defaultAddress={defaultAddress}
      defaultLat={defaultLat}
      defaultLng={defaultLng}
      onValidityChange={onValidityChange}
    />
  );
}

function GooglePlacesAddressField({
  defaultAddress,
  defaultLat,
  defaultLng,
  onValidityChange,
}: {
  defaultAddress: string;
  defaultLat: number | null;
  defaultLng: number | null;
  onValidityChange?: (valid: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [address, setAddress] = useState(defaultAddress);
  const [lat, setLat] = useState<number | null>(defaultLat);
  const [lng, setLng] = useState<number | null>(defaultLng);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    if (!inputRef.current) return;
    let cancelled = false;
    loadPlacesScript()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google) return;
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry"],
          types: ["address"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          setAddress(place.formatted_address ?? inputRef.current?.value ?? "");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualChange = useCallback((value: string) => {
    setAddress(value);
    setLat(null);
    setLng(null);
  }, []);

  const needsSelection = address.trim() !== "" && (lat == null || lng == null) && !scriptFailed;

  useEffect(() => {
    onValidityChange?.(!needsSelection);
  }, [needsSelection, onValidityChange]);

  return (
    <div>
      <label htmlFor="address-input" className={LABEL}>
        Address
      </label>
      <div className="relative">
        <MapPinIcon
          className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
          aria-hidden
        />
        <input
          id="address-input"
          ref={inputRef}
          type="text"
          value={address}
          onChange={(e) => handleManualChange(e.target.value)}
          placeholder="Street address, city, state"
          className={`${FIELD} pl-[2.25rem]`}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />

      {needsSelection ? (
        <p role="alert" className="font-body text-[12px] text-[#835400] mt-xs">
          Pick an address from the suggestions so the map pin is accurate.
        </p>
      ) : scriptFailed ? (
        <p className="font-body text-[12px] text-text-tertiary mt-xs">
          Couldn&apos;t load Google suggestions - type the address; we&apos;ll geocode on save.
        </p>
      ) : null}
    </div>
  );
}

function CensusVerifyAddressField({
  defaultAddress,
  defaultLat,
  defaultLng,
  onValidityChange,
}: {
  defaultAddress: string;
  defaultLat: number | null;
  defaultLng: number | null;
  onValidityChange?: (valid: boolean) => void;
}) {
  const [address, setAddress] = useState(defaultAddress);
  const [lat, setLat] = useState<number | null>(defaultLat);
  const [lng, setLng] = useState<number | null>(defaultLng);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<"idle" | "matched" | "miss" | "error">(() =>
    defaultAddress && defaultLat != null && defaultLng != null ? "matched" : "idle",
  );
  const [matchedLabel, setMatchedLabel] = useState<string | null>(
    defaultAddress && defaultLat != null ? defaultAddress : null,
  );
  const lastVerifiedRef = useRef<string>(
    defaultAddress && defaultLat != null ? defaultAddress.trim() : "",
  );

  useEffect(() => {
    onValidityChange?.(true);
  }, [onValidityChange]);

  const applyMatch = useCallback((matchedAddress: string, nextLat: number, nextLng: number) => {
    setAddress(matchedAddress);
    setLat(nextLat);
    setLng(nextLng);
    setMatchedLabel(matchedAddress);
    setStatus("matched");
    lastVerifiedRef.current = matchedAddress.trim();
  }, []);

  const verify = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed.length < 5) return;
      if (trimmed === lastVerifiedRef.current && lat != null && lng != null) return;

      setVerifying(true);
      try {
        const result = await verifyEventAddress(trimmed);
        if ("latitude" in result) {
          applyMatch(result.matchedAddress, result.latitude, result.longitude);
        } else if (result.code === "NOT_FOUND") {
          setLat(null);
          setLng(null);
          setMatchedLabel(null);
          setStatus("miss");
          lastVerifiedRef.current = "";
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      } finally {
        setVerifying(false);
      }
    },
    [applyMatch, lat, lng],
  );

  const handleManualChange = useCallback((value: string) => {
    setAddress(value);
    setLat(null);
    setLng(null);
    setMatchedLabel(null);
    setStatus("idle");
    lastVerifiedRef.current = "";
  }, []);

  return (
    <div>
      <label htmlFor="address-input" className={LABEL}>
        Address
      </label>
      <div className="relative">
        <MapPinIcon
          className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
          aria-hidden
        />
        <input
          id="address-input"
          type="text"
          value={address}
          onChange={(e) => handleManualChange(e.target.value)}
          onBlur={() => {
            void verify(address);
          }}
          placeholder="Street address, city, state"
          className={`${FIELD} pl-[2.25rem]`}
          autoComplete="street-address"
        />
      </div>
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />

      {verifying ? (
        <p className="font-body text-[12px] text-text-tertiary mt-xs">Verifying address…</p>
      ) : status === "matched" && matchedLabel ? (
        <p className="font-body text-[12px] text-text-tertiary mt-xs">
          Matched: <span className="text-text-primary">{matchedLabel}</span>
        </p>
      ) : status === "miss" ? (
        <p role="alert" className="font-body text-[12px] text-[#835400] mt-xs">
          Couldn&apos;t match that address - check spelling/city. We&apos;ll still try to geocode
          on save.
        </p>
      ) : status === "error" ? (
        <p className="font-body text-[12px] text-text-tertiary mt-xs">
          Verification unavailable - we&apos;ll geocode a pin on save.
        </p>
      ) : address.trim().length >= 5 ? (
        <p className="font-body text-[12px] text-text-tertiary mt-xs">
          Tab or click away to verify with the US Census geocoder.
        </p>
      ) : null}
    </div>
  );
}
