"use client";

/**
 * Web port of mobile `EventLocationMapWebView` - MapLibre GL JS + Carto Voyager
 * raster tiles with a brand pin. Gestures are off; the whole map opens Google Maps.
 *
 * Uses in-page MapLibre (not a srcDoc iframe) and raster tiles so the basemap
 * still paints when vector tile hosts or WebGL-in-iframe are blocked.
 */
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VOYAGER_RASTER_STYLE } from "@/lib/maplibre-basemap";

const PRIMARY = "#009540";

export type EventMapCoordinate = {
  latitude: number;
  longitude: number;
};

type Props = {
  address: string;
  coordinate: EventMapCoordinate;
  className?: string;
};

function createPinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "32px";
  el.style.height = "40px";
  el.style.filter = "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35))";
  el.style.pointerEvents = "none";
  el.innerHTML =
    '<svg width="32" height="40" viewBox="0 0 32 40" fill="none" aria-hidden="true">' +
    `<path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="${PRIMARY}"/>` +
    '<circle cx="16" cy="16" r="6" fill="#ffffff"/>' +
    "</svg>";
  return el;
}

/** Prefer the street address so Google shows a place name, not bare lat/lng. */
function mapsUrl(address: string, coordinate: EventMapCoordinate): string {
  const trimmed = address.trim();
  if (trimmed) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
  }
  const { latitude, longitude } = coordinate;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function EventLocationMap({ address, coordinate, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const href = mapsUrl(address, coordinate);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { latitude, longitude } = coordinate;

    const map = new maplibregl.Map({
      container,
      style: VOYAGER_RASTER_STYLE,
      center: [longitude, latitude],
      zoom: 14,
      interactive: false,
      attributionControl: false,
    });

    const marker = new maplibregl.Marker({
      element: createPinElement(),
      anchor: "bottom",
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    map.on("load", () => {
      map.resize();
    });

    return () => {
      resizeObserver.disconnect();
      marker.remove();
      map.remove();
    };
  }, [coordinate.latitude, coordinate.longitude]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${address} in Maps`}
      className={`relative block w-full overflow-hidden rounded-md border border-border-outline bg-bg-surface-elevated aspect-[382/203] ${className ?? ""}`}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full [&_.maplibregl-canvas]:!outline-none"
      />
    </a>
  );
}
