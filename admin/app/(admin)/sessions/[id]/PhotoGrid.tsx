'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '@/components/ui/Icons';
import { formatDate } from '@/lib/format';
import type { Checkpoint } from '@/types/database';

interface SignedCheckpoint extends Checkpoint {
  selfieSignedUrl: string | null;
  progressSignedUrl: string | null;
}

type PhotoItem = {
  url: string;
  label: string;
  time: string | null;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
}

function ZoomablePhoto({
  photo,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  photo: PhotoItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const resetView = useCallback(() => {
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Reset pan/zoom when the active photo changes.
  useEffect(() => {
    resetView();
  }, [photo.url, resetView]);

  const zoomBy = useCallback((delta: number) => {
    setZoom((z) => {
      const next = clampZoom(z + delta);
      if (next <= MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft' && zoom <= MIN_ZOOM) onPrev();
      if (e.key === 'ArrowRight' && zoom <= MIN_ZOOM) onNext();
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomBy(ZOOM_STEP);
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomBy(-ZOOM_STEP);
      }
      if (e.key === '0') resetView();
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, onPrev, onNext, zoom, zoomBy, resetView]);

  function handleWheel(e: ReactWheelEvent) {
    e.preventDefault();
    e.stopPropagation();
    zoomBy(e.deltaY < 0 ? ZOOM_STEP / 2 : -ZOOM_STEP / 2);
  }

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (zoom > MIN_ZOOM) {
      resetView();
    } else {
      setZoom(2);
    }
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (zoom <= MIN_ZOOM) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
    setOffset({ x: drag.originX + dx, y: drag.originY + dy });
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  }

  const zoomed = zoom > MIN_ZOOM;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay-scrim)]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.label} photo ${index + 1} of ${total}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-md right-md z-20 w-11 h-11 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Close lightbox (Esc)"
      >
        <CloseIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={zoomed}
        className="absolute left-md sm:left-lg z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 disabled:opacity-30 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Previous photo"
      >
        <ChevronLeftIcon className="w-5 h-5" color="currentColor" />
      </button>

      <div
        className="relative max-w-3xl max-h-[85vh] w-full mx-4xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        <div
          className={`relative flex items-center justify-center max-h-[85vh] ${
            zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={photo.label}
            draggable={false}
            className="rounded-md object-contain w-full max-h-[85vh] select-none transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          />
        </div>

        <div className="absolute bottom-md left-md pointer-events-none">
          <div className="rounded-sm bg-black/60 px-md py-sm text-white">
            <p className="font-data text-[12px] font-semibold">{photo.label}</p>
            {photo.time ? (
              <p className="font-data text-[11px] text-white/85 mt-xs">
                {formatDate(photo.time, 'MMM d, yyyy · h:mm a')}
              </p>
            ) : null}
            <p className="font-data text-[10px] text-white/70 mt-xs">
              {index + 1} / {total}
              {zoomed ? ` · ${Math.round(zoom * 100)}%` : ''}
            </p>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-md right-md z-20 inline-flex items-center rounded-full bg-black/55 p-0.5"
        role="group"
        aria-label="Zoom controls"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoomBy(-ZOOM_STEP);
          }}
          disabled={zoom <= MIN_ZOOM}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-black/40 disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Zoom out"
        >
          <ZoomOutIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            resetView();
          }}
          className="min-w-12 px-sm h-11 font-data text-[11px] font-semibold text-white hover:bg-black/40 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoomBy(ZOOM_STEP);
          }}
          disabled={zoom >= MAX_ZOOM}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-black/40 disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Zoom in"
        >
          <ZoomInIcon className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        disabled={zoomed}
        className="absolute right-md sm:right-lg z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 disabled:opacity-30 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Next photo"
      >
        <ChevronRightIcon className="w-5 h-5" color="currentColor" />
      </button>
    </div>
  );
}

export function PhotoGrid({ checkpoints }: { checkpoints: SignedCheckpoint[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allPhotos: PhotoItem[] = checkpoints.flatMap((cp) => [
    cp.selfieSignedUrl ? { url: cp.selfieSignedUrl, label: 'Selfie', time: cp.captured_at } : null,
    cp.progressSignedUrl
      ? { url: cp.progressSignedUrl, label: 'Progress', time: cp.captured_at }
      : null,
  ]).filter(Boolean) as PhotoItem[];

  const close = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => {
      if (i == null || allPhotos.length === 0) return i;
      return (i - 1 + allPhotos.length) % allPhotos.length;
    });
  }, [allPhotos.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => {
      if (i == null || allPhotos.length === 0) return i;
      return (i + 1) % allPhotos.length;
    });
  }, [allPhotos.length]);

  if (allPhotos.length === 0) {
    return (
      <p className="font-body text-[13px] text-text-tertiary">
        {checkpoints.length > 0
          ? 'Photo signing failed for this session — check the Storage bucket policy for session-photos and that SUPABASE_SERVICE_ROLE_KEY is current.'
          : 'No photos captured for this session yet.'}
      </p>
    );
  }

  const active = lightboxIndex != null ? allPhotos[lightboxIndex] : null;

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-sm">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className="h-8 px-sm rounded-sm border border-border-outline bg-bg-surface text-text-primary font-data text-[11px] font-semibold hover:bg-bg-surface-elevated transition-colors disabled:opacity-50"
        >
          {isPending ? 'Refreshing…' : 'Refresh photos'}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
        {allPhotos.map((photo, i) => (
          <button
            key={`${photo.url}-${i}`}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square rounded-sm overflow-hidden border border-border-outline hover:border-primary transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.label}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-xs py-1">
              <p className="font-data text-[10px] text-white">{photo.label}</p>
              {photo.time ? (
                <p className="font-data text-[9px] text-white/70">
                  {formatDate(photo.time, 'MMM d, yyyy · HH:mm')}
                </p>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && lightboxIndex != null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ZoomablePhoto
              photo={active}
              index={lightboxIndex}
              total={allPhotos.length}
              onClose={close}
              onPrev={goPrev}
              onNext={goNext}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
