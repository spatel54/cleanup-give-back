'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { CloseIcon, UploadIcon } from '@/components/ui/Icons';
import { FIELD, LABEL } from './formStyles';

const MAX_PHOTOS = 8;

type PendingPhoto = {
  id: string;
  file: File;
  preview: string;
};

/**
 * Phone-friendly event photo field: multi-select from camera/library with
 * instant previews. Existing gallery URLs are kept via hidden inputs;
 * new files submit as `photo_files`. First photo is the app list hero;
 * all photos feed the registration detail carousel.
 */
export function EventPhotoUpload({
  defaultUrls = [],
}: {
  defaultUrls?: string[];
}) {
  const inputId = useId();
  const urlFieldId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [keptUrls, setKeptUrls] = useState<string[]>(() =>
    defaultUrls.map((u) => u.trim()).filter(Boolean),
  );
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [urlDraft, setUrlDraft] = useState('');

  const totalCount = keptUrls.length + pending.length;
  const atLimit = totalCount >= MAX_PHOTOS;

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    for (const item of pending) dt.items.add(item.file);
    input.files = dt.files;
  }, [pending]);

  useEffect(() => {
    return () => {
      for (const item of pending) URL.revokeObjectURL(item.preview);
    };
    // Only revoke on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const room = MAX_PHOTOS - keptUrls.length - pending.length;
    const accepted = files.slice(0, Math.max(0, room));
    if (accepted.length === 0) return;

    const next: PendingPhoto[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setPending((prev) => [...prev, ...next]);
  }

  function removeKept(url: string) {
    setKeptUrls((prev) => prev.filter((u) => u !== url));
  }

  function removePending(id: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  function addPastedUrl() {
    const url = urlDraft.trim();
    if (!url || atLimit) return;
    if (keptUrls.includes(url)) {
      setUrlDraft('');
      return;
    }
    setKeptUrls((prev) => [...prev, url]);
    setUrlDraft('');
  }

  return (
    <div>
      <label className={LABEL}>Event photos (optional)</label>
      <p className="font-body text-[12px] text-text-tertiary mb-sm">
        Skip if you prefer — published events without a photo use the app default. Up to {MAX_PHOTOS}{' '}
        photos: first is the list hero; all appear in the app registration carousel.
      </p>

      {(keptUrls.length > 0 || pending.length > 0) && (
        <ul className="mb-sm grid grid-cols-2 sm:grid-cols-3 gap-sm">
          {keptUrls.map((url, index) => (
            <li
              key={`kept-${url}`}
              className="relative aspect-video rounded-sm overflow-hidden border border-border-outline bg-bg-app"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Event photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && pending.length === 0 ? (
                <span className="absolute left-1 bottom-1 rounded-sm bg-primary px-xs py-px font-data text-[10px] font-semibold text-white">
                  Hero
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => removeKept(url)}
                className="absolute top-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-sm bg-black/55 text-white hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`Remove photo ${index + 1}`}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
              <input type="hidden" name="existing_image_urls" value={url} />
            </li>
          ))}
          {pending.map((item, index) => (
            <li
              key={item.id}
              className="relative aspect-video rounded-sm overflow-hidden border border-border-outline bg-bg-app"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt={`New photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {keptUrls.length === 0 && index === 0 ? (
                <span className="absolute left-1 bottom-1 rounded-sm bg-primary px-xs py-px font-data text-[10px] font-semibold text-white">
                  Hero
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => removePending(item.id)}
                className="absolute top-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-sm bg-black/55 text-white hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`Remove new photo ${index + 1}`}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <label
        htmlFor={inputId}
        className={`interactive inline-flex items-center gap-sm min-h-11 px-md rounded-sm border border-border-outline bg-bg-app font-data text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
          atLimit
            ? 'opacity-40 cursor-not-allowed text-text-tertiary'
            : 'text-text-primary hover:border-primary cursor-pointer'
        }`}
      >
        <UploadIcon className="w-4 h-4" aria-hidden />
        {totalCount === 0
          ? 'Add photos (optional)'
          : atLimit
            ? 'Photo limit reached'
            : 'Add more photos'}
      </label>
      <input
        ref={fileInputRef}
        id={inputId}
        name="photo_files"
        type="file"
        accept="image/*"
        multiple
        disabled={atLimit}
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="mt-sm">
        <label htmlFor={urlFieldId} className="font-body text-[12px] text-text-tertiary mb-xs block">
          Or paste an image URL
        </label>
        <div className="flex flex-col sm:flex-row gap-sm">
          <input
            id={urlFieldId}
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            className={FIELD}
            placeholder="https://…"
            disabled={atLimit}
          />
          <button
            type="button"
            onClick={addPastedUrl}
            disabled={atLimit || !urlDraft.trim()}
            className="min-h-11 shrink-0 px-md rounded-sm border border-border-outline font-data text-[13px] font-semibold text-text-primary hover:border-primary disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Add URL
          </button>
        </div>
      </div>
    </div>
  );
}
