"use client";

/**
 * Checkpoint photo grid for the session preview drawer - signed Supabase
 * Storage URLs with a simple lightbox (prev/next). Ported/simplified from
 * `admin/app/(admin)/sessions/[id]/PhotoGrid.tsx`.
 */
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/ui/Icons";
import { formatDateTime } from "@/lib/mock-data";

export type SessionPhotoItem = {
  url: string;
  label: string;
  capturedAt: string | null;
};

type Props = {
  photos: SessionPhotoItem[];
};

function Lightbox({
  photo,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  photo: SessionPhotoItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-lg"
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.label} photo ${index + 1} of ${total}`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-md right-md z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Close photo"
      >
        <CloseIcon className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-md sm:left-lg z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Previous photo"
      >
        <ChevronLeftIcon className="w-5 h-5" color="currentColor" />
      </button>

      <div
        className="relative max-h-[85vh] max-w-[90vw] flex flex-col items-center gap-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.label}
          className="max-h-[80vh] max-w-full object-contain rounded-sm"
        />
        <p className="font-data text-[12px] text-white">
          {photo.label}
          {photo.capturedAt ? ` · ${formatDateTime(photo.capturedAt)}` : ""}
          {` · ${index + 1} / ${total}`}
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-md sm:right-lg z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Next photo"
      >
        <ChevronRightIcon className="w-5 h-5" color="currentColor" />
      </button>
    </div>
  );
}

export function SessionPhotoGrid({ photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => {
      if (i == null || photos.length === 0) return i;
      return (i - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => {
      if (i == null || photos.length === 0) return i;
      return (i + 1) % photos.length;
    });
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <p className="font-body text-[13px] text-text-tertiary">No photos captured for this session yet.</p>
    );
  }

  const active = lightboxIndex != null ? photos[lightboxIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
        {photos.map((photo, i) => (
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
              {photo.capturedAt ? (
                <p className="font-data text-[9px] text-white/70">{formatDateTime(photo.capturedAt)}</p>
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
            <Lightbox
              photo={active}
              index={lightboxIndex}
              total={photos.length}
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
