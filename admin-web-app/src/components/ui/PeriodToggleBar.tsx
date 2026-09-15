"use client";

/**
 * Suspense-safe wrappers around PeriodToggle that read `period`/`from`/`to`
 * from the URL - same query contract as admin pages.
 */
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  listPeriodLabel,
  parsePeriodSelection,
  periodLabel,
  type PeriodSelection,
} from "@/lib/dashboard-period";
import { PeriodToggle } from "@/components/ui/PeriodToggle";

export function usePeriodSelection(): PeriodSelection {
  const searchParams = useSearchParams();
  return parsePeriodSelection({
    period: searchParams.get("period"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });
}

export function usePeriodLabel(now = new Date()): string {
  return periodLabel(usePeriodSelection(), now);
}

/** Period label for Sessions / Orders / Feedback (Month → “Last 30 days”). */
export function useListPeriodLabel(now = new Date()): string {
  return listPeriodLabel(usePeriodSelection(), now);
}

function PeriodToggleInner() {
  return <PeriodToggle selection={usePeriodSelection()} />;
}

function PeriodLabelInner({ className }: { className?: string }) {
  return <span className={className}>{usePeriodLabel()}</span>;
}

function ToggleFallback() {
  return <div className="h-11 w-full bg-bg-surface-elevated rounded-sm animate-pulse" aria-hidden />;
}

/** Drop-in period bar for page headers (Suspense-wrapped). */
export function PeriodToggleBar() {
  return (
    <Suspense fallback={<ToggleFallback />}>
      <PeriodToggleInner />
    </Suspense>
  );
}

/** Live period label text that tracks URL selection. */
export function PeriodLabelText({ className }: { className?: string }) {
  return (
    <Suspense fallback={<span className={className}>Today</span>}>
      <PeriodLabelInner className={className} />
    </Suspense>
  );
}
