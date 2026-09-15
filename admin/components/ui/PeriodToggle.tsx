'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { DashboardPeriod, PeriodSelection } from '@/lib/dashboard-period';
import { CalendarIcon, ChevronDownIcon } from '@/components/ui/Icons';

const PRESETS: { value: Exclude<DashboardPeriod, 'custom'>; label: string; shortLabel?: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'month', label: 'Month' },
  { value: '30d', label: '30 days', shortLabel: '30d' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
];

function formatRangeLabel(from: string, to: string) {
  if (!from && !to) return 'Custom range';
  const fmt = (iso: string) => {
    try {
      return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  return fmt(from || to);
}

export function PeriodToggle({
  selection,
  pending: pendingProp,
}: {
  selection: PeriodSelection;
  pending?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelId = useId();
  const [isPending, startTransition] = useTransition();
  const pending = pendingProp ?? isPending;

  const customActive = selection.period === 'custom';
  const [open, setOpen] = useState(customActive);
  const [from, setFrom] = useState(selection.from ?? '');
  const [to, setTo] = useState(selection.to ?? '');

  useEffect(() => {
    setFrom(selection.from ?? '');
    setTo(selection.to ?? '');
  }, [selection.from, selection.to]);

  useEffect(() => {
    if (customActive) setOpen(true);
  }, [customActive]);

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === '') params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function setPreset(next: Exclude<DashboardPeriod, 'custom'>) {
    setFrom('');
    setTo('');
    setOpen(false);
    pushParams({
      period: next === 'day' ? null : next,
      from: null,
      to: null,
    });
  }

  function applyCustomRange() {
    if (!from && !to) return;
    const start = from || to;
    const end = to || from;
    if (!start || !end) return;
    const [a, b] = start <= end ? [start, end] : [end, start];
    setFrom(a);
    setTo(b);
    pushParams({ period: null, from: a, to: b });
  }

  function clearCustom() {
    setFrom('');
    setTo('');
    setOpen(false);
    pushParams({ from: null, to: null, period: null });
  }

  return (
    <div
      role="group"
      aria-label="Dashboard period"
      aria-busy={pending}
      className={`w-full min-w-0 max-w-full overflow-hidden rounded-sm border border-border-outline bg-bg-surface ${
        pending ? 'opacity-70' : ''
      }`}
    >
      <div className="flex min-w-0 items-stretch">
        <div
          className="grid min-w-0 flex-1 grid-cols-5"
          role="group"
          aria-label="Period presets"
        >
          {PRESETS.map((opt) => {
            const active = !customActive && selection.period === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPreset(opt.value)}
                disabled={pending}
                aria-pressed={active}
                className={`min-h-11 min-w-0 border-r border-border-outline px-0.5 font-data text-[10px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:z-10 sm:px-sm sm:text-[12px] ${
                  active
                    ? 'bg-primary text-white'
                    : 'text-text-tertiary hover:bg-bg-surface-elevated'
                }`}
              >
                <span className="block truncate px-0.5 sm:hidden">{opt.shortLabel ?? opt.label}</span>
                <span className="hidden truncate px-0.5 sm:block">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={pending}
          aria-expanded={open}
          aria-controls={panelId}
          title={customActive ? formatRangeLabel(from, to) : 'Custom date range'}
          className={`inline-flex min-h-11 shrink-0 items-center gap-sm px-sm sm:px-md font-data text-[11px] sm:text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
            customActive || open
              ? 'bg-[#f7fff1] text-primary'
              : 'text-text-tertiary hover:bg-bg-surface-elevated hover:text-text-primary'
          }`}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline max-w-[9rem] truncate">
            {customActive ? formatRangeLabel(from, to) : 'Custom'}
          </span>
          <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div
          id={panelId}
          className={`flex w-full min-w-0 flex-col gap-sm border-t border-border-outline p-sm ${
            customActive ? 'bg-[#f7fff1]' : ''
          }`}
        >
          <div className="grid w-full min-w-0 grid-cols-1 gap-sm sm:grid-cols-2">
            <label className="block w-full min-w-0 overflow-hidden">
              <span className="mb-xs block font-data text-[10px] uppercase tracking-[0.5px] text-text-tertiary">
                From
              </span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                disabled={pending}
                aria-label="From date"
                className="period-date-input h-9 w-full max-w-full rounded-sm border border-border-outline bg-bg-surface px-xs font-data text-[12px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </label>
            <label className="block w-full min-w-0 overflow-hidden">
              <span className="mb-xs block font-data text-[10px] uppercase tracking-[0.5px] text-text-tertiary">
                To
              </span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={pending}
                aria-label="To date"
                className="period-date-input h-9 w-full max-w-full rounded-sm border border-border-outline bg-bg-surface px-xs font-data text-[12px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </label>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-xs">
            <button
              type="button"
              onClick={applyCustomRange}
              disabled={pending || (!from && !to)}
              className="h-8 min-w-[4.5rem] px-md rounded-sm bg-primary text-white font-data text-[11px] font-semibold disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              Apply
            </button>
            {customActive && (
              <button
                type="button"
                onClick={clearCustom}
                disabled={pending}
                className="h-8 px-sm rounded-sm font-data text-[11px] font-semibold text-text-tertiary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
