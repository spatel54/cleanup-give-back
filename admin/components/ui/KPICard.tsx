'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useHasMounted } from '@/hooks/useHasMounted';
import { ChevronRightIcon } from '@/components/ui/Icons';

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: boolean;
  index?: number;
  href?: string;
  delta?: string | null;
  sparkline?: number[];
  showChevron?: boolean;
}

const cardClassName =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-sm h-full transition-colors';

function CountUp({
  value,
  accent,
  reduceMotion,
}: {
  value: string | number;
  accent?: boolean;
  reduceMotion: boolean;
}) {
  const numeric = typeof value === 'number' ? value : Number(value);
  const isNumeric =
    Number.isFinite(numeric) && String(value).trim() !== '' && String(value) !== '—' && !Number.isNaN(numeric);
  const decimals = typeof value === 'string' && value.includes('.') ? 1 : 0;
  const [display, setDisplay] = useState(reduceMotion || !isNumeric ? value : 0);

  useEffect(() => {
    if (!isNumeric || reduceMotion) {
      setDisplay(value);
      return;
    }
    const target = numeric;
    const duration = 450;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = target * eased;
      setDisplay(decimals ? current.toFixed(decimals) : Math.round(current));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, isNumeric, numeric, decimals, reduceMotion]);

  return (
    <p
      className={`font-data text-[28px] leading-[36px] font-semibold ${accent ? 'text-[#ba1a1a]' : 'text-text-primary'}`}
    >
      {display}
    </p>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 0.0001);
  const w = 56;
  const h = 20;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - (v / max) * (h - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0">
      <polyline fill="none" stroke="#007536" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

export function KPICard({
  label,
  value,
  subtext,
  accent,
  index = 0,
  href,
  delta,
  sparkline,
  showChevron,
}: KPICardProps) {
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();

  const body = (
    <>
      <div className="flex items-start justify-between gap-sm">
        <p className="font-data text-[12px] leading-[18px] tracking-[0.96px] text-text-tertiary uppercase">
          {label}
        </p>
        <div className="flex items-center gap-xs shrink-0">
          {sparkline && sparkline.length > 1 && <MiniSparkline values={sparkline} />}
          {showChevron && href && (
            <ChevronRightIcon className="w-2 h-3.5 text-primary" color="currentColor" />
          )}
        </div>
      </div>
      {mounted ? (
        <CountUp value={value} accent={accent} reduceMotion={prefersReduced} />
      ) : (
        <p
          className={`font-data text-[28px] leading-[36px] font-semibold ${accent ? 'text-[#ba1a1a]' : 'text-text-primary'}`}
        >
          {value}
        </p>
      )}
      {subtext && (
        <p className="font-body text-[14px] leading-[20px] text-text-tertiary">{subtext}</p>
      )}
      {delta && <p className="font-data text-[11px] text-text-tertiary">{delta}</p>}
    </>
  );

  const interactiveClass = href
    ? `${cardClassName} hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`
    : cardClassName;

  const inner =
    !mounted || prefersReduced ? (
      <div className={interactiveClass}>{body}</div>
    ) : (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: index * 0.03 }}
        className={interactiveClass}
      >
        {body}
      </motion.div>
    );

  if (href) {
    return (
      <Link href={href} className="block h-full no-underline text-inherit" aria-label={`View ${label}`}>
        {inner}
      </Link>
    );
  }

  return inner;
}
