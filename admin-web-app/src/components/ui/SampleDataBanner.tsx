"use client";

/** Ported from `admin/components/ui/SampleDataBanner.tsx` - shown when a page's `isMock` prop is true. */
import { useState, useEffect } from "react";
import { CloseIcon } from "@/components/ui/Icons";

const STORAGE_KEY = "cugb-dismiss-sample-banner";

export function SampleDataBanner() {
  // Starts dismissed on the server (and first client paint) to avoid a
  // hydration mismatch, then reads localStorage once mounted - same pattern
  // as `useHasMounted`/`PeriodToggle` elsewhere in this app.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore private-mode / blocked storage
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
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
        <strong className="font-semibold">Sample data</strong> - Supabase has no rows for this view yet, so this
        page shows fixture data.
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
