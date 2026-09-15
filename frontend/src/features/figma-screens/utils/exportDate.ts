import {
  MONTH_NAMES_SHORT,
  parseIsoDate,
  startOfDay,
} from './weekCalendar';

/**
 * Coerce timeframe values to a local calendar `Date`.
 * Guards against Fast Refresh / leftover string state from earlier mock fields.
 */
export function toExportDate(value: Date | string | number | null | undefined): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return startOfDay(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromMs = new Date(value);
    if (!Number.isNaN(fromMs.getTime())) {
      return startOfDay(fromMs);
    }
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const named = parseExportDate(trimmed);
    if (named) {
      return named;
    }
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
      return startOfDay(parseIsoDate(trimmed));
    }
  }
  return startOfDay(new Date(2026, 0, 1));
}

/** Display format matching Figma export timeframe fields (e.g. `Jan 1, 2026`). */
export function formatExportDate(date: Date | string | number): string {
  const day = toExportDate(date);
  return `${MONTH_NAMES_SHORT[day.getMonth()]} ${day.getDate()}, ${day.getFullYear()}`;
}

/**
 * Parses common typed date inputs into a local calendar day.
 * Accepts: `Jan 1, 2026`, `January 1 2026`, `1/1/2026`, `2026-01-01`.
 */
export function parseExportDate(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return validLocalDate(year, month, day);
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = Number(slashMatch[1]) - 1;
    const day = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    return validLocalDate(year, month, day);
  }

  const namedMatch = trimmed.match(
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
  );
  if (namedMatch) {
    const month = monthIndexFromName(namedMatch[1]);
    if (month === null) {
      return null;
    }
    const day = Number(namedMatch[2]);
    const year = Number(namedMatch[3]);
    return validLocalDate(year, month, day);
  }

  return null;
}

function monthIndexFromName(name: string): number | null {
  const lower = name.toLowerCase();
  const shortIdx = MONTH_NAMES_SHORT.findIndex((m) => m.toLowerCase() === lower);
  if (shortIdx >= 0) {
    return shortIdx;
  }

  const fullNames = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
  const fullIdx = fullNames.findIndex((m) => m === lower || m.startsWith(lower));
  return fullIdx >= 0 ? fullIdx : null;
}

function validLocalDate(year: number, month: number, day: number): Date | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  if (month < 0 || month > 11 || day < 1 || day > 31) {
    return null;
  }
  const date = startOfDay(new Date(year, month, day));
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
