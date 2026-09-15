"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/Icons";

type ExportMenuProps = {
  onExportCsv: () => void;
  onExportPdf: () => void;
  className?: string;
};

/**
 * Accordion export control - expands to CSV / PDF choices.
 * Used on list tabs in place of a single "Export CSV" button.
 */
export function ExportMenu({ onExportCsv, onExportPdf, className = "" }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function run(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        Export
        <ChevronDownIcon
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Export options"
          className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[11rem] rounded-sm border border-border-outline bg-bg-surface shadow-bar-top overflow-hidden"
        >
          <button
            type="button"
            onClick={() => run(onExportCsv)}
            className="w-full text-left px-md py-sm font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated hover:text-primary transition-colors"
          >
            Export as CSV
          </button>
          <button
            type="button"
            onClick={() => run(onExportPdf)}
            className="w-full text-left px-md py-sm font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated hover:text-primary transition-colors border-t border-border-outline"
          >
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}
