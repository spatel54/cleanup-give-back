import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page title + period/filter chrome that stays visible while the main pane
 * scrolls. Opaque cream `bg-bg-app` covers content passing underneath,
 * including a bleed layer into the shell padding so cards cannot peek
 * through above or beside the bar.
 */
export function PageStickyHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "page-sticky-header relative sticky top-0 z-30 bg-bg-app",
        "pt-4 sm:pt-6 lg:pt-8 pb-lg",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -top-4 bg-bg-app sm:-top-6 lg:-top-8 -mx-4 sm:-mx-6 lg:-mx-8"
      />
      <div className="relative flex flex-col gap-md">{children}</div>
    </header>
  );
}
