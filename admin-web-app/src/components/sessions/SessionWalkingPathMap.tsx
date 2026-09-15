"use client";

/**
 * MapLibre walking-path map with mobile-style route replay, Start/End labels,
 * square rounded checkpoint photo thumbnails along the trail (tap to enlarge), and
 * a admin-facing fullscreen mode.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useReducedMotion } from "framer-motion";
import {
  CloseIcon,
  ExpandIcon,
  CollapseIcon,
  PauseIcon,
  PlayIcon,
  ReplayIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/ui/Icons";
import type { SessionPhoto, SessionPhotoPin } from "@/lib/session-evidence";
import {
  computeBearingDegrees,
  computeRouteReplayDurationMs,
  computeRouteReplayDurationSeconds,
  formatReplayClock,
  routeBounds,
  sliceRouteByDistanceProgress,
  type RouteCoordinate,
} from "@/lib/session-route";
import { VOYAGER_RASTER_STYLE } from "@/lib/maplibre-basemap";

const PRIMARY = "#009540";
const START_FILL = "#1a1a1a";
const END_FILL = "#ba1a1a";
const FULL_SOURCE_ID = "session-route-full";
const FULL_LAYER_ID = "session-route-full-line";
const LIVE_SOURCE_ID = "session-route-live";
const LIVE_LAYER_ID = "session-route-live-line";
const PHOTO_SOURCE_ID = "session-photo-pins";
const PHOTO_LAYER_ID = "session-photo-pins-dots";

function lineFeature(coords: RouteCoordinate[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: coords.length >= 2 ? coords : coords.length === 1 ? [coords[0], coords[0]] : [],
    },
  };
}

function createLabeledMarker(label: string, fill: string): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.position = "relative";
  wrap.style.width = "18px";
  wrap.style.height = "18px";
  wrap.style.pointerEvents = "none";
  wrap.style.filter = "drop-shadow(0 2px 3px rgba(0,0,0,0.35))";

  const dot = document.createElement("div");
  dot.style.width = "18px";
  dot.style.height = "18px";
  dot.style.borderRadius = "50%";
  dot.style.background = fill;
  dot.style.border = "2.5px solid #fff";
  dot.style.boxSizing = "border-box";

  const badge = document.createElement("div");
  badge.textContent = label;
  badge.style.position = "absolute";
  badge.style.top = "22px";
  badge.style.left = "50%";
  badge.style.transform = "translateX(-50%)";
  badge.style.padding = "2px 6px";
  badge.style.borderRadius = "3px";
  badge.style.background = fill;
  badge.style.color = "#fff";
  badge.style.font = "600 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace";
  badge.style.letterSpacing = "0.06em";
  badge.style.textTransform = "uppercase";
  badge.style.whiteSpace = "nowrap";

  wrap.appendChild(dot);
  wrap.appendChild(badge);
  return wrap;
}

function createTipMarker(heading: number | null): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "28px";
  el.style.height = "28px";
  el.style.pointerEvents = "none";
  el.style.filter = "drop-shadow(0 2px 3px rgba(0,0,0,0.35))";
  const rotator = document.createElement("div");
  rotator.style.width = "28px";
  rotator.style.height = "28px";
  rotator.style.display = "flex";
  rotator.style.alignItems = "center";
  rotator.style.justifyContent = "center";
  if (heading != null && Number.isFinite(heading)) {
    rotator.style.transform = `rotate(${heading}deg)`;
  }
  rotator.innerHTML =
    `<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">` +
    `<circle cx="14" cy="14" r="10" fill="#ffffff"/>` +
    `<circle cx="14" cy="14" r="7" fill="${PRIMARY}"/>` +
    `<path d="M14 3 L17 10 L14 8.5 L11 10 Z" fill="${PRIMARY}"/>` +
    `</svg>`;
  el.appendChild(rotator);
  return el;
}

function updateTipHeading(el: HTMLDivElement, heading: number | null) {
  const rotator = el.firstElementChild as HTMLDivElement | null;
  if (!rotator) return;
  if (heading != null && Number.isFinite(heading)) {
    rotator.style.transform = `rotate(${heading}deg)`;
  } else {
    rotator.style.transform = "";
  }
}

function photoPinsFeatureCollection(
  pins: SessionPhotoPin[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: pins.map((pin) => ({
      type: "Feature",
      properties: { id: pin.id },
      geometry: {
        type: "Point",
        coordinates: pin.coordinate,
      },
    })),
  };
}

/** Square rounded photo thumbnail pin on the trail (tap opens lightbox). */
function createPhotoPinElement(
  pin: SessionPhotoPin,
  onOpen: (photos: SessionPhoto[], index: number) => void,
): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "session-photo-pin";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "2px";
  wrap.style.minWidth = "44px";
  wrap.style.minHeight = "44px";
  wrap.style.cursor = "pointer";
  wrap.style.pointerEvents = "auto";
  wrap.style.zIndex = "3";
  wrap.style.filter = "drop-shadow(0 2px 3px rgba(0,0,0,0.35))";
  wrap.setAttribute("role", "button");
  wrap.setAttribute(
    "aria-label",
    `Checkpoint photo${pin.photos.length > 1 ? "s" : ""}: ${pin.photos.map((p) => p.label).join(", ")}`,
  );
  wrap.tabIndex = 0;

  pin.photos.forEach((photo, photoIndex) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.style.width = "44px";
    thumb.style.height = "44px";
    thumb.style.flex = "0 0 44px";
    thumb.style.padding = "0";
    thumb.style.borderRadius = "12px";
    thumb.style.border = `3px solid ${PRIMARY}`;
    thumb.style.overflow = "hidden";
    thumb.style.background = "#fff";
    thumb.style.cursor = "pointer";
    thumb.style.pointerEvents = "auto";
    thumb.style.marginLeft = photoIndex > 0 ? "-12px" : "0";
    thumb.style.position = "relative";
    thumb.style.zIndex = String(20 - photoIndex);
    thumb.setAttribute("aria-label", `Open ${photo.label} photo`);
    thumb.title = `Open ${photo.label} photo`;

    const img = document.createElement("img");
    img.src = photo.url;
    img.alt = photo.label;
    img.loading = "eager";
    img.decoding = "async";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.display = "block";
    img.style.pointerEvents = "none";
    img.draggable = false;

    thumb.appendChild(img);
    thumb.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onOpen(pin.photos, photoIndex);
    });
    wrap.appendChild(thumb);
  });

  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(pin.photos, 0);
    }
  });

  return wrap;
}

type Props = {
  route: RouteCoordinate[];
  photoPins?: SessionPhotoPin[];
  className?: string;
  /** Auto-play once on mount (skipped when reduced motion is preferred). */
  autoReplay?: boolean;
};

export function SessionWalkingPathMap({
  route,
  photoPins = [],
  className,
  autoReplay = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const endMarkerRef = useRef<maplibregl.Marker | null>(null);
  const tipMarkerRef = useRef<maplibregl.Marker | null>(null);
  const photoMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routeRef = useRef(route);
  routeRef.current = route;
  const photoPinsRef = useRef(photoPins);
  photoPinsRef.current = photoPins;
  const onOpenPhotoRef = useRef<(photos: SessionPhoto[], index: number) => void>(() => {});

  const prefersReduced = useReducedMotion() ?? false;

  const [replayProgress, setReplayProgress] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showPhotoThumbnails, setShowPhotoThumbnails] = useState(true);
  const showPhotoThumbnailsRef = useRef(showPhotoThumbnails);
  showPhotoThumbnailsRef.current = showPhotoThumbnails;
  const [lightbox, setLightbox] = useState<{ photos: SessionPhoto[]; index: number } | null>(
    null,
  );
  const animationRef = useRef<number | null>(null);
  const playStartRef = useRef(0);
  const playFromRef = useRef(0);
  const hasAutoPlayedRef = useRef(false);

  const routeKey = useMemo(
    () => route.map(([lng, lat]) => `${lng},${lat}`).join("|"),
    [route],
  );
  const pinsKey = useMemo(
    () => photoPins.map((p) => `${p.id}:${p.progress}`).join("|"),
    [photoPins],
  );

  const durationMs = useMemo(() => computeRouteReplayDurationMs(route), [routeKey]);
  const durationSeconds = useMemo(() => computeRouteReplayDurationSeconds(route), [routeKey]);
  const durationMsRef = useRef(durationMs);
  durationMsRef.current = durationMs;

  const currentSeconds = Math.round(Math.max(0, Math.min(1, replayProgress)) * durationSeconds);
  const timeLabel = `${formatReplayClock(currentSeconds)} / ${formatReplayClock(durationSeconds)}`;

  onOpenPhotoRef.current = (photos, index) => {
    setLightbox({ photos, index });
  };

  const stopAnimation = useCallback(() => {
    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const tickReplay = useCallback(() => {
    const elapsed = Date.now() - playStartRef.current;
    const next = Math.min(1, playFromRef.current + elapsed / durationMsRef.current);
    setReplayProgress(next);
    if (next >= 1) {
      setIsPlaying(false);
      animationRef.current = null;
      return;
    }
    animationRef.current = requestAnimationFrame(tickReplay);
  }, []);

  const startReplay = useCallback(
    (fromProgress = 0) => {
      stopAnimation();
      playFromRef.current = fromProgress;
      playStartRef.current = Date.now();
      setReplayProgress(fromProgress);
      setIsPlaying(true);
    },
    [stopAnimation],
  );

  useEffect(() => {
    if (!isPlaying) return undefined;
    animationRef.current = requestAnimationFrame(tickReplay);
    return () => stopAnimation();
  }, [isPlaying, stopAnimation, tickReplay]);

  useEffect(() => {
    setReplayProgress(autoReplay && !prefersReduced ? 0 : 1);
    setIsPlaying(false);
    stopAnimation();
    hasAutoPlayedRef.current = false;
  }, [routeKey, autoReplay, prefersReduced, stopAnimation]);

  useEffect(() => {
    if (!autoReplay || prefersReduced || hasAutoPlayedRef.current || route.length < 2) return;
    hasAutoPlayedRef.current = true;
    startReplay(0);
  }, [autoReplay, prefersReduced, route.length, routeKey, startReplay]);

  // Escape exits lightbox first, then fullscreen.
  useEffect(() => {
    if (!fullscreen && !lightbox) return undefined;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (lightbox) {
        setLightbox(null);
        return;
      }
      setFullscreen(false);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [fullscreen, lightbox]);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const clearPhotoMarkers = useCallback(() => {
    for (const m of photoMarkersRef.current) m.remove();
    photoMarkersRef.current = [];
  }, []);

  const syncPhotoPinLayer = useCallback((map: maplibregl.Map, pins: SessionPhotoPin[]) => {
    const data = photoPinsFeatureCollection(pins);
    const existing = map.getSource(PHOTO_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(data);
      return;
    }
    map.addSource(PHOTO_SOURCE_ID, { type: "geojson", data });
    map.addLayer({
      id: PHOTO_LAYER_ID,
      type: "circle",
      source: PHOTO_SOURCE_ID,
      paint: {
        "circle-radius": 10,
        "circle-color": "#e8f5ec",
        "circle-stroke-width": 3,
        "circle-stroke-color": PRIMARY,
        "circle-opacity": 0.95,
      },
    });
  }, []);

  const syncPhotoMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      map.once("load", () => {
        syncPhotoMarkers();
      });
      return;
    }

    const pins = showPhotoThumbnailsRef.current ? photoPinsRef.current : [];
    syncPhotoPinLayer(map, pins);
    clearPhotoMarkers();

    for (const pin of pins) {
      const [lng, lat] = pin.coordinate;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;

      const el = createPhotoPinElement(pin, (photos, index) => {
        onOpenPhotoRef.current(photos, index);
      });
      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        offset: [0, -6],
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      })
        .setLngLat([lng, lat])
        .addTo(map);
      marker.getElement().style.zIndex = "3";
      photoMarkersRef.current.push(marker);
    }
  }, [clearPhotoMarkers, syncPhotoPinLayer]);

  const syncMarkers = useCallback(
    (visible: RouteCoordinate[], progress: number) => {
      const map = mapRef.current;
      if (!map) return;

      const fullRoute = routeRef.current;
      const start = fullRoute[0];
      const finalEnd = fullRoute[fullRoute.length - 1];
      const tip = visible[visible.length - 1] ?? start;
      const showFinalEnd = progress >= 1;

      if (start) {
        if (!startMarkerRef.current) {
          startMarkerRef.current = new maplibregl.Marker({
            element: createLabeledMarker("Start", START_FILL),
            anchor: "center",
          })
            .setLngLat(start)
            .addTo(map);
        } else {
          startMarkerRef.current.setLngLat(start);
        }
      }

      if (showFinalEnd && finalEnd) {
        if (tipMarkerRef.current) {
          tipMarkerRef.current.remove();
          tipMarkerRef.current = null;
        }
        const sameAsStart = start && finalEnd[0] === start[0] && finalEnd[1] === start[1];
        if (!sameAsStart) {
          if (!endMarkerRef.current) {
            endMarkerRef.current = new maplibregl.Marker({
              element: createLabeledMarker("End", END_FILL),
              anchor: "center",
            })
              .setLngLat(finalEnd)
              .addTo(map);
          } else {
            endMarkerRef.current.setLngLat(finalEnd);
          }
        }
        return;
      }

      if (endMarkerRef.current) {
        endMarkerRef.current.remove();
        endMarkerRef.current = null;
      }

      if (tip && progress < 1) {
        let heading: number | null = null;
        if (visible.length >= 2) {
          heading = computeBearingDegrees(visible[visible.length - 2], visible[visible.length - 1]);
        }
        if (!tipMarkerRef.current) {
          const el = createTipMarker(heading);
          tipMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat(tip)
            .addTo(map);
        } else {
          tipMarkerRef.current.setLngLat(tip);
          updateTipHeading(tipMarkerRef.current.getElement() as HTMLDivElement, heading);
        }
      }
    },
    [],
  );

  const applyProgress = useCallback(
    (progress: number) => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      const visible = sliceRouteByDistanceProgress(routeRef.current, progress);
      const live = map.getSource(LIVE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (live) {
        live.setData(lineFeature(visible));
      }
      syncMarkers(visible, progress);
    },
    [syncMarkers],
  );

  // Mount map once per route.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || route.length < 2) return;

    const map = new maplibregl.Map({
      container,
      style: VOYAGER_RASTER_STYLE,
      center: route[0],
      zoom: 14,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    map.on("load", () => {
      map.resize();
      map.addSource(FULL_SOURCE_ID, {
        type: "geojson",
        data: lineFeature(route),
      });
      map.addLayer({
        id: FULL_LAYER_ID,
        type: "line",
        source: FULL_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": PRIMARY,
          "line-width": 4,
          "line-opacity": 0.22,
        },
      });

      const initial = sliceRouteByDistanceProgress(route, replayProgress);
      map.addSource(LIVE_SOURCE_ID, {
        type: "geojson",
        data: lineFeature(initial),
      });
      map.addLayer({
        id: LIVE_LAYER_ID,
        type: "line",
        source: LIVE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": PRIMARY,
          "line-width": 5,
          "line-opacity": 0.95,
        },
      });

      syncMarkers(initial, replayProgress);
      syncPhotoMarkers();

      const bounds = routeBounds(route);
      if (bounds) {
        map.fitBounds([bounds.sw, bounds.ne], {
          padding: fullscreen ? 80 : 56,
          maxZoom: 16,
          duration: 0,
        });
      }

      // FitBounds can run before marker layout settles - re-sync pins once idle.
      map.once("idle", () => {
        syncPhotoMarkers();
      });
    });

    return () => {
      resizeObserver.disconnect();
      clearPhotoMarkers();
      startMarkerRef.current?.remove();
      endMarkerRef.current?.remove();
      tipMarkerRef.current?.remove();
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      tipMarkerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
    // Remount when entering/exiting fullscreen - drawer uses CSS transform so
    // true viewport fullscreen must portal (new MapLibre container).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [routeKey, fullscreen]);

  useEffect(() => {
    applyProgress(replayProgress);
  }, [replayProgress, applyProgress]);

  useEffect(() => {
    syncPhotoMarkers();
  }, [pinsKey, showPhotoThumbnails, syncPhotoMarkers]);

  // Heal missing HTML markers if a race cleared them while the style was loading.
  useEffect(() => {
    if (photoPins.length === 0 || !showPhotoThumbnails) return undefined;
    const id = window.setTimeout(() => {
      if (photoMarkersRef.current.length !== photoPinsRef.current.length) {
        syncPhotoMarkers();
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [pinsKey, routeKey, fullscreen, photoPins.length, showPhotoThumbnails, syncPhotoMarkers]);

  // Resize after entering/exiting fullscreen so the canvas fills the new box.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Double rAF so layout has applied the new size.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        map.resize();
        const bounds = routeBounds(routeRef.current);
        if (bounds) {
          map.fitBounds([bounds.sw, bounds.ne], {
            padding: fullscreen ? 80 : 56,
            maxZoom: 16,
            duration: 0,
          });
        }
      });
    });
  }, [fullscreen]);

  function handlePlayPause() {
    if (isPlaying) {
      stopAnimation();
      setIsPlaying(false);
      return;
    }
    if (replayProgress >= 1) {
      startReplay(0);
      return;
    }
    playFromRef.current = replayProgress;
    playStartRef.current = Date.now();
    setIsPlaying(true);
  }

  const mapShell = (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[100] bg-bg-app flex flex-col"
          : `relative w-full overflow-hidden rounded-sm border border-border-outline bg-bg-surface-elevated aspect-[16/9] ${className ?? ""}`
      }
      role="region"
      aria-label={`Walking path with ${route.length} GPS points${photoPins.length ? `, ${photoPins.length} photo checkpoint${photoPins.length !== 1 ? "s" : ""}` : ""}`}
      aria-modal={fullscreen || undefined}
    >
      {fullscreen && (
        <header className="shrink-0 flex items-center justify-between gap-md px-lg py-md border-b border-border-outline bg-bg-surface">
          <div>
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">
              Walking path
            </p>
            <p className="font-heading text-[20px] leading-[28px] text-text-primary">
              Full screen map
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="inline-flex h-11 items-center gap-sm px-md rounded-sm border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Exit full screen"
          >
            <CollapseIcon className="w-4 h-4" />
            Exit full screen
          </button>
        </header>
      )}

      <div className={fullscreen ? "relative flex-1 min-h-0" : "absolute inset-0"}>
        {/* MapLibre's WebGL canvas is GPU-composited and can bleed square corners past an
            ancestor's `overflow-hidden` + rounded border (a known cross-browser clipping
            bug for canvas/video elements) - round the canvas itself, since a canvas always
            clips its own content to its own border-radius, and back it with a matching
            border on the container as a visual seam in case of residual bleed. */}
        <div
          ref={containerRef}
          className={`absolute inset-0 h-full w-full overflow-hidden [&_.maplibregl-canvas]:!outline-none ${
            fullscreen ? "" : "rounded-sm border border-border-outline [&_.maplibregl-canvas]:!rounded-sm"
          }`}
        />

        {!fullscreen && (
          <div className="absolute top-sm right-14 z-10 flex flex-col gap-sm pointer-events-none">
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-outline bg-bg-app/95 text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Enter full screen"
              aria-pressed="false"
            >
              <ExpandIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="absolute bottom-sm left-sm right-sm z-10 flex items-end justify-between gap-sm pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-sm flex-wrap">
            <div
              className="inline-flex h-11 items-center justify-center px-md rounded-sm border border-border-outline bg-bg-app/95 font-data text-[13px] leading-none tabular-nums text-text-primary"
              aria-live="polite"
              aria-label={`Replay time ${timeLabel}`}
            >
              {timeLabel}
            </div>
            <button
              type="button"
              onClick={handlePlayPause}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-outline bg-bg-app/95 text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={isPlaying ? "Pause route replay" : "Play route replay"}
            >
              {isPlaying ? (
                <PauseIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => startReplay(0)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-outline bg-bg-app/95 text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Replay route from start"
            >
              <ReplayIcon className="w-5 h-5" />
            </button>
            {photoPins.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPhotoThumbnails((v) => !v)}
                aria-pressed={showPhotoThumbnails}
                className="inline-flex h-11 items-center gap-sm px-md rounded-full border border-border-outline bg-bg-app/95 font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={
                  showPhotoThumbnails ? "Hide checkpoint photo thumbnails" : "Show checkpoint photo thumbnails"
                }
                title={showPhotoThumbnails ? "Hide photo thumbnails" : "Show photo thumbnails"}
              >
                {showPhotoThumbnails ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeOffIcon className="w-5 h-5" />
                )}
                Photos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const lightboxUi =
    lightbox &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Checkpoint photo"
        onClick={() => setLightbox(null)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLightbox(null);
          }}
          className="absolute top-md right-md z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70"
          aria-label="Close photo"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
        <div
          className="relative max-h-[85vh] max-w-[90vw] flex flex-col items-center gap-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.photos[lightbox.index]?.url}
            alt={lightbox.photos[lightbox.index]?.label ?? "Photo"}
            className="max-h-[80vh] max-w-full object-contain rounded-sm"
          />
          <p className="font-data text-[13px] text-white">
            {lightbox.photos[lightbox.index]?.label}
            {lightbox.photos.length > 1
              ? ` · ${lightbox.index + 1} / ${lightbox.photos.length}`
              : ""}
          </p>
          {lightbox.photos.length > 1 && (
            <div className="flex gap-sm">
              <button
                type="button"
                className="h-9 px-md rounded-sm bg-white/15 text-white font-data text-[12px]"
                onClick={() =>
                  setLightbox((cur) =>
                    cur
                      ? {
                          ...cur,
                          index: (cur.index - 1 + cur.photos.length) % cur.photos.length,
                        }
                      : cur,
                  )
                }
              >
                Previous
              </button>
              <button
                type="button"
                className="h-9 px-md rounded-sm bg-white/15 text-white font-data text-[12px]"
                onClick={() =>
                  setLightbox((cur) =>
                    cur
                      ? { ...cur, index: (cur.index + 1) % cur.photos.length }
                      : cur,
                  )
                }
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      {fullscreen ? (
        <>
          <div
            className={`w-full rounded-sm border border-dashed border-border-outline bg-bg-surface-elevated aspect-[16/9] flex items-center justify-center ${className ?? ""}`}
            aria-hidden
          >
            <p className="font-body text-[13px] text-text-tertiary">Map open in full screen</p>
          </div>
          {typeof document !== "undefined"
            ? createPortal(mapShell, document.body)
            : null}
        </>
      ) : (
        mapShell
      )}
      {lightboxUi}
    </>
  );
}

/** High-contrast legend under the map - replaces the old grey “black Start · red End” line. */
export function WalkingPathLegend({
  pointCount,
  photoCount,
}: {
  pointCount: number;
  photoCount: number;
}) {
  return (
    <div className="mt-md flex flex-col gap-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-lg sm:gap-y-sm">
      <p className="font-data text-[13px] font-medium text-text-primary tabular-nums">
        {pointCount.toLocaleString()} GPS points
      </p>
      <ul className="flex flex-wrap items-center gap-x-md gap-y-sm list-none m-0 p-0">
        <li className="inline-flex items-center gap-xs font-body text-[13px] text-text-primary">
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-white shrink-0"
            style={{ background: START_FILL }}
            aria-hidden
          />
          Start
        </li>
        <li className="inline-flex items-center gap-xs font-body text-[13px] text-text-primary">
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-white shrink-0"
            style={{ background: END_FILL }}
            aria-hidden
          />
          End
        </li>
        {photoCount > 0 && (
          <li className="inline-flex items-center gap-xs font-body text-[13px] text-text-primary">
            <span
              className="inline-block w-3 h-3 rounded-full border-2 shrink-0"
              style={{ borderColor: PRIMARY, background: "#e8f5ec" }}
              aria-hidden
            />
            Photos on trail ({photoCount})
          </li>
        )}
      </ul>
      <p className="font-body text-[13px] text-text-tertiary">
        Use Play to replay the walk
        {photoCount > 0 ? " · tap a thumbnail to enlarge" : ""}
      </p>
    </div>
  );
}
