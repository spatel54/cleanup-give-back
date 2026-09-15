"use client";

import type { CSSProperties, ReactNode } from "react";

interface GradientBarsProps {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  className?: string;
}

type BarStyle = CSSProperties & {
  "--initial-scale": number;
};

function GradientBars({
  numBars = 12,
  gradientFrom = "rgba(0, 149, 64, 0.14)",
  gradientTo = "transparent",
  animationDuration = 5,
  className = "",
}: GradientBarsProps) {
  const calculateHeight = (index: number, total: number) => {
    if (total <= 1) return 45;
    const position = index / (total - 1);
    const maxHeight = 55;
    const minHeight = 28;
    const center = 0.5;
    const distanceFromCenter = Math.abs(position - center);
    // Soft U-shape: taller near edges, quieter in the middle so the form stays readable
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.35);
    return minHeight + (maxHeight - minHeight) * heightPercentage;
  };

  return (
    <>
      <style>{`
        @keyframes pulseBar {
          0% { transform: scaleY(var(--initial-scale)); opacity: 0.85; }
          100% { transform: scaleY(calc(var(--initial-scale) * 0.92)); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .gradient-bars-bar {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
        aria-hidden
      >
        <div
          className="flex h-full w-full"
          style={{
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        >
          {Array.from({ length: numBars }).map((_, index) => {
            const height = calculateHeight(index, numBars);
            const style: BarStyle = {
              flex: `1 0 calc(100% / ${numBars})`,
              maxWidth: `calc(100% / ${numBars})`,
              height: "100%",
              background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
              transform: `scaleY(${height / 100})`,
              transformOrigin: "bottom",
              animation: `pulseBar ${animationDuration}s ease-in-out infinite alternate`,
              animationDelay: `${index * 0.18}s`,
              boxSizing: "border-box",
              "--initial-scale": height / 100,
            };

            return <div key={index} className="gradient-bars-bar" style={style} />;
          })}
        </div>
      </div>
    </>
  );
}

export interface GradientBarsBackgroundProps {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  /** Page canvas behind the bars - brand cream by default */
  backgroundColor?: string;
  /** Soft secondary wash at the top (brand lime at very low opacity) */
  showLimeWash?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * Full-viewport atmospheric background for branded screens (e.g. admin login).
 * Defaults are tuned for Clean Up – Give Back: cream canvas, soft forest-green
 * bars, slow pulse, reduced motion respected.
 */
export default function GradientBarsBackground({
  numBars = 12,
  gradientFrom = "rgba(0, 149, 64, 0.14)",
  gradientTo = "transparent",
  animationDuration = 5,
  backgroundColor = "#fcf9f8",
  showLimeWash = true,
  children,
  className = "",
}: GradientBarsBackgroundProps) {
  return (
    <section
      className={`relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundColor }}
    >
      {showLimeWash ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-1/3 opacity-40"
          style={{
            background:
              "linear-gradient(to bottom, rgba(194, 216, 50, 0.12), transparent)",
          }}
        />
      ) : null}

      <GradientBars
        numBars={numBars}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        animationDuration={animationDuration}
      />

      {children ? (
        <div className="relative z-10 flex h-full w-full items-center justify-center px-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
