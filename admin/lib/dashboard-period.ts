import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subDays,
  subYears,
  differenceInCalendarDays,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns';

export type DashboardPeriod = 'day' | 'month' | '30d' | 'year' | 'all' | 'custom';

export type PeriodSelection = {
  period: DashboardPeriod;
  /** Inclusive start, yyyy-MM-dd — set when period is custom (and optional override). */
  from: string | null;
  /** Inclusive end, yyyy-MM-dd. */
  to: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateParam(raw: string | null | undefined): raw is string {
  if (!raw || !DATE_RE.test(raw)) return false;
  const d = parseISO(raw);
  return Number.isFinite(d.getTime());
}

export function parsePeriod(raw: string | string[] | undefined): DashboardPeriod {
  const value = Array.isArray(raw) ? raw[0] : raw;
  switch (value) {
    case 'day':
    case 'month':
    case '30d':
    case 'year':
    case 'all':
    case 'custom':
      return value;
    default:
      return 'day';
  }
}

export function parsePeriodSelection(params: {
  period?: string | string[];
  from?: string | string[];
  to?: string | string[];
}): PeriodSelection {
  const fromRaw = Array.isArray(params.from) ? params.from[0] : params.from;
  const toRaw = Array.isArray(params.to) ? params.to[0] : params.to;
  const from = isValidDateParam(fromRaw) ? fromRaw : null;
  const to = isValidDateParam(toRaw) ? toRaw : null;

  // Explicit from/to wins and becomes a custom range.
  if (from || to) {
    const start = from ?? to!;
    const end = to ?? from!;
    const [a, b] = start <= end ? [start, end] : [end, start];
    return { period: 'custom', from: a, to: b };
  }

  return { period: parsePeriod(params.period), from: null, to: null };
}

export function periodLabel(selection: PeriodSelection, now = new Date()): string {
  switch (selection.period) {
    case 'day':
      return format(now, 'MMM d, yyyy');
    case 'month':
      return format(now, 'MMMM yyyy');
    case '30d':
      return 'Last 30 days';
    case 'year':
      return format(now, 'yyyy');
    case 'all':
      return 'All time';
    case 'custom': {
      if (!selection.from || !selection.to) return 'Custom range';
      if (selection.from === selection.to) {
        return format(parseISO(selection.from), 'MMM d, yyyy');
      }
      return `${format(parseISO(selection.from), 'MMM d, yyyy')} – ${format(parseISO(selection.to), 'MMM d, yyyy')}`;
    }
    default: {
      const _exhaustive: never = selection.period;
      return _exhaustive;
    }
  }
}

export function periodInterval(
  selection: PeriodSelection,
  now = new Date(),
): { start: Date; end: Date } | null {
  switch (selection.period) {
    case 'day':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case '30d':
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'all':
      return null;
    case 'custom': {
      if (!selection.from || !selection.to) return null;
      return {
        start: startOfDay(parseISO(selection.from)),
        end: endOfDay(parseISO(selection.to)),
      };
    }
    default: {
      const _exhaustive: never = selection.period;
      return _exhaustive;
    }
  }
}

/** Previous comparable window for sparklines / deltas. */
export function previousPeriodInterval(
  selection: PeriodSelection,
  now = new Date(),
): { start: Date; end: Date } | null {
  switch (selection.period) {
    case 'day': {
      const prev = subDays(now, 1);
      return { start: startOfDay(prev), end: endOfDay(prev) };
    }
    case 'month': {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case '30d':
      return { start: startOfDay(subDays(now, 60)), end: endOfDay(subDays(now, 30)) };
    case 'year': {
      const prev = subYears(now, 1);
      return { start: startOfYear(prev), end: endOfYear(prev) };
    }
    case 'all':
      return null;
    case 'custom': {
      const current = periodInterval(selection, now);
      if (!current) return null;
      const spanDays = differenceInCalendarDays(current.end, current.start) + 1;
      const prevEnd = endOfDay(subDays(current.start, 1));
      const prevStart = startOfDay(subDays(prevEnd, spanDays - 1));
      return { start: prevStart, end: prevEnd };
    }
    default: {
      const _exhaustive: never = selection.period;
      return _exhaustive;
    }
  }
}

/** Day buckets for short windows; week buckets for longer ones. */
export function periodTrendGranularity(
  selection: PeriodSelection,
  interval: { start: Date; end: Date } | null,
): 'day' | 'week' {
  switch (selection.period) {
    case 'day':
    case '30d':
      return 'day';
    case 'month':
    case 'year':
    case 'all':
      return 'week';
    case 'custom': {
      if (!interval) return 'week';
      const days = differenceInCalendarDays(interval.end, interval.start) + 1;
      return days <= 45 ? 'day' : 'week';
    }
    default: {
      const _exhaustive: never = selection.period;
      return _exhaustive;
    }
  }
}

export function inInterval(iso: string | null | undefined, interval: { start: Date; end: Date } | null): boolean {
  if (!interval) return true;
  if (!iso) return false;
  try {
    return isWithinInterval(parseISO(iso), interval);
  } catch {
    return false;
  }
}
