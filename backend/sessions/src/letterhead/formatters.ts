import type { Prisma } from '@prisma/client';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatLetterDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatSessionDate(date: Date | null): string {
  if (!date) {
    return '—';
  }
  return dateFormatter.format(date);
}

export function formatSessionDateTime(date: Date | null): string {
  if (!date) {
    return '—';
  }
  return dateTimeFormatter.format(date);
}

export function sessionHours(
  session: {
    adjustedHours: Prisma.Decimal | null;
    durationSeconds: number | null;
  },
): number {
  if (session.adjustedHours != null) {
    return Number(session.adjustedHours);
  }
  if (session.durationSeconds != null) {
    return session.durationSeconds / 3600;
  }
  return 0;
}

export function formatHoursValue(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatMiles(distanceMiles: Prisma.Decimal | null): string {
  if (distanceMiles == null) {
    return '—';
  }
  const miles = Number(distanceMiles);
  if (!Number.isFinite(miles)) {
    return '—';
  }
  return miles.toFixed(1);
}
