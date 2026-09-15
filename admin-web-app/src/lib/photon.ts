/**
 * Free forward geocoding / typeahead via Photon (Komoot / OpenStreetMap).
 * No API key. Bias results with optional `lat`/`lon` from the current map viewport.
 *
 * https://photon.komoot.io
 */

export type PhotonHit = {
  label: string;
  latitude: number;
  longitude: number;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
    osm_value?: string;
  };
};

function formatLabel(props: NonNullable<PhotonFeature["properties"]>): string {
  const line1 = [props.housenumber, props.street ?? props.name].filter(Boolean).join(" ").trim();
  const locality = props.city ?? props.town ?? props.village;
  const parts = [line1 || props.name, locality, props.state, props.postcode].filter(Boolean);
  // De-dupe when name === city etc.
  return [...new Set(parts)].join(", ");
}

/**
 * Typeahead search. `bias` is the viewport center (optional). `limit` defaults to 6.
 */
export async function searchPhoton(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    limit?: number;
    signal?: AbortSignal;
  },
): Promise<PhotonHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: String(opts?.limit ?? 6),
    lang: "en",
  });
  if (opts?.bias) {
    params.set("lat", String(opts.bias.latitude));
    params.set("lon", String(opts.bias.longitude));
  }

  const timeoutSignal = AbortSignal.timeout(5000);
  const signal = opts?.signal ? AbortSignal.any([opts.signal, timeoutSignal]) : timeoutSignal;

  const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const hits: PhotonHit[] = [];
  for (const f of data.features ?? []) {
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const [longitude, latitude] = coords;
    const label = formatLabel(f.properties ?? {});
    if (!label) continue;
    hits.push({ label, latitude, longitude });
  }
  return hits;
}
