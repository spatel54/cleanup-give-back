'use client';

import { useState, useEffect } from 'react';
import { CloseIcon } from '@/components/ui/Icons';

const STORAGE_KEY = 'cugb-dismiss-sample-banner';

export function SampleDataBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === '1');
    } catch {
      // ignore private-mode / blocked storage
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="mb-lg px-lg py-md rounded-md bg-[#ffddb5] border border-[#fcab29] flex items-center justify-between gap-md"
    >
      <p className="font-body text-[14px] text-[#835400] flex-1">
        <strong className="font-semibold">Sample data</strong> — This dashboard shows fixture data for demo
        purposes.
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-sm text-[#835400] hover:bg-[#fcab29]/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <CloseIcon className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}
