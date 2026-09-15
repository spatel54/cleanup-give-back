/**
 * Period selection helpers - ported from `admin/lib/dashboard-period.ts`
 * (parse, labels, interval math for period-scoped KPIs / deltas).
 */

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
} from "date-fns";

export type DashboardPeriod = "day" | "month" | "year" | "all" | "custom";

export type PeriodSelection = {
  period: DashboardPeriod;
  /** Inclusive start, yyyy-MM-dd - set when period is custom. */
  from: string | null;
  /** Inclusive end, yyyy-MM-dd. */
  to: string | null;
};

export type DateInterval = { start: Date; end: Date };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateParam(raw: string | null | undefined): raw is string {
  if (!raw || !DATE_RE.test(raw)) return false;
  const d = parseISO(raw);
  return Number.isFinite(d.getTime());
}

export function parsePeriod(raw: string | string[] | undefined | null): DashboardPeriod {
  const value = Array.isArray(raw) ? raw[0] : raw;
  switch (value) {
    case "day":
    case "month":
    case "year":
    case "all":
    case "custom":
      return value;
    case "30d":
      // Legacy URL - 30-day preset removed from PeriodToggle.
      return "month";
    default:
      return "day";
  }
}

export function parsePeriodSelection(params: {
  period?: string | string[] | null;
  from?: string | string[] | null;
  to?: string | string[] | null;
}): PeriodSelection {
  const fromRaw = Array.isArray(params.from) ? params.from[0] : params.from;
  const toRaw = Array.isArray(params.to) ? params.to[0] : params.to;
  const from = isValidDateParam(fromRaw) ? fromRaw : null;
  const to = isValidDateParam(toRaw) ? toRaw : null;

  if (from || to) {
    const start = from ?? to!;
    const end = to ?? from!;
    const [a, b] = start <= end ? [start, end] : [end, start];
    return { period: "custom", from: a, to: b };
  }

  return { period: parsePeriod(params.period), from: null, to: null };
}

export function periodLabel(selection: PeriodSelection, now = new Date()): string {
  switch (selection.period) {
    case "day":
      return format(now, "MMM d, yyyy");
    case "month":
      return format(now, "MMMM yyyy");
    case "year":
      return format(now, "yyyy");
    case "all":
      return "All time";
    case "custom": {
      if (!selection.from || !selection.to) return "Custom range";
      if (selection.from === selection.to) {
        return format(parseISO(selection.from), "MMM d, yyyy");
      }
      return `${format(parseISO(selection.from), "MMM d, yyyy")} – ${format(parseISO(selection.to), "MMM d, yyyy")}`;
    }
    default: {
      const _exhaustive: never = selection.period;
      return _exhaustive;
    }
  }
}

export function periodInterval(selection: PeriodSelection, now = new Date()): DateInterval | null {
  switch (selection.period) {
    case "day":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "all":
      return null;
    case "custom": {
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

/**
 * Payments Month/Year use rolling windows (last 6 months / last 6 years),
 * not the calendar month/year used on Dashboard / Insights.
 */
export function paymentsPeriodInterval(selection: PeriodSelection, now = new Date()): DateInterval | null {
  switch (selection.period) {
    case "month":
      return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(subYears(now, 5)), end: endOfYear(now) };
    default:
      return periodInterval(selection, now);
  }
}

/** Labels for Payments period copy (rolling 6-month / 6-year windows). */
export function paymentsPeriodLabel(selection: PeriodSelection, now = new Date()): string {
  switch (selection.period) {
    case "month":
      return "Last 6 months";
    case "year":
      return "Last 6 years";
    default:
      return periodLabel(selection, now);
  }
}

/**
 * List ops pages (Sessions / Orders / Feedback) use rolling last-30-days for Month -
 * the legacy `30d` preset the PeriodToggle replaced - not calendar month.
 */
export function listPeriodInterval(selection: PeriodSelection, now = new Date()): DateInterval | null {
  if (selection.period === "month") {
    return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
  }
  return periodInterval(selection, now);
}

/** Labels for Sessions / Orders / Feedback period copy. */
export function listPeriodLabel(selection: PeriodSelection, now = new Date()): string {
  if (selection.period === "month") return "Last 30 days";
  return periodLabel(selection, now);
}

/** Previous comparable window for sparklines / deltas. */
export function previousPeriodInterval(selection: PeriodSelection, now = new Date()): DateInterval | null {
  switch (selection.period) {
    case "day": {
      const prev = subDays(now, 1);
      return { start: startOfDay(prev), end: endOfDay(prev) };
    }
    case "month": {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case "year": {
      const prev = subYears(now, 1);
      return { start: startOfYear(prev), end: endOfYear(prev) };
    }
    case "all":
      return null;
    case "custom": {
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

export function inInterval(iso: string | null | undefined, interval: DateInterval | null): boolean {
  if (!interval) return true;
  if (!iso) return false;
  try {
    return isWithinInterval(parseISO(iso), interval);
  } catch {
    return false;
  }
}

export type DateFilterable = {
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  submittedAt?: string | null;
};

function getRecordDate(record: DateFilterable): string | null {
  return record.ended_at ?? record.started_at ?? record.created_at ?? record.createdAt ?? record.submittedAt ?? null;
}

/** Filter records by period selection based on date fields (ended_at → started_at → created). */
export function filterByPeriod<T extends DateFilterable>(
  records: T[],
  selection: PeriodSelection,
  now = new Date(),
): T[] {
  const interval = periodInterval(selection, now);
  if (!interval) return records;
  return records.filter((record) => inInterval(getRecordDate(record), interval));
}

/** Same as `filterByPeriod`, but Month is rolling last 30 days (Sessions / Orders / Feedback). */
export function filterByListPeriod<T extends DateFilterable>(
  records: T[],
  selection: PeriodSelection,
  now = new Date(),
): T[] {
  const interval = listPeriodInterval(selection, now);
  if (!interval) return records;
  return records.filter((record) => inInterval(getRecordDate(record), interval));
}

/** Filter records into an explicit interval (null = all). Prefer ended_at like legacy admin. */
export function filterByInterval<T extends DateFilterable>(records: T[], interval: DateInterval | null): T[] {
  if (!interval) return records;
  return records.filter((r) => inInterval(getRecordDate(r), interval));
}

/**
 * Signed change for metric tiles: "+3", "-1.2", "0". Returns null when there is no prior window.
 */
export function formatSignedDelta(current: number, prior: number, decimals = 0): string {
  const diff = current - prior;
  if (decimals > 0) {
    const rounded = Number(diff.toFixed(decimals));
    if (rounded === 0) return "0";
    const abs = Math.abs(rounded).toFixed(decimals);
    return `${rounded > 0 ? "+" : "-"}${abs}`;
  }
  const whole = Math.round(diff);
  if (whole === 0) return "0";
  return `${whole > 0 ? "+" : ""}${whole}`;
}

/** Short relative caption for the prior comparison window. */
export function priorPeriodCaption(selection: PeriodSelection): string | null {
  switch (selection.period) {
    case "day":
      return "vs yesterday";
    case "month":
      return "vs last month";
    case "year":
      return "vs last year";
    case "custom":
      return "vs prior range";
    case "all":
      return null;
    default: {
      const _exhaustive: never = selection.period;
      return _exhaustive;
    }
  }
}
