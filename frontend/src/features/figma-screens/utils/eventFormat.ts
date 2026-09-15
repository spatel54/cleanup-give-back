import type { UpcomingEventSummary } from '../mocks/home.types';
import { startOfDay } from './weekCalendar';

const MONTH_ABBREVIATIONS: Record<string, string> = {
  January: 'Jan',
  February: 'Feb',
  March: 'Mar',
  April: 'Apr',
  August: 'Aug',
  September: 'Sep',
  October: 'Oct',
  November: 'Nov',
  December: 'Dec',
};

/** Parses mock event card date parts into a local start-of-day `Date`. */
export function parseEventSummaryDate(event: UpcomingEventSummary): Date {
  return startOfDay(new Date(`${event.month} ${event.day}, ${event.year}`));
}

/** Returns events whose date falls within the inclusive start/end range. */
export function filterEventsByDateRange(
  events: readonly UpcomingEventSummary[],
  start: Date,
  end: Date,
): UpcomingEventSummary[] {
  const startDay = startOfDay(start);
  const endDay = startOfDay(end);
  const rangeStart = startDay.getTime() <= endDay.getTime() ? startDay : endDay;
  const rangeEnd = startDay.getTime() <= endDay.getTime() ? endDay : startDay;

  return events
    .filter((event) => {
      const eventDay = parseEventSummaryDate(event);
      return eventDay.getTime() >= rangeStart.getTime() && eventDay.getTime() <= rangeEnd.getTime();
    })
    .sort(
      (left, right) =>
        parseEventSummaryDate(left).getTime() - parseEventSummaryDate(right).getTime(),
    );
}

/** Earliest and latest event dates from a catalog list. */
export function eventCatalogDateBounds(events: readonly UpcomingEventSummary[]): {
  start: Date;
  end: Date;
} {
  const sorted = [...events].sort(
    (left, right) =>
      parseEventSummaryDate(left).getTime() - parseEventSummaryDate(right).getTime(),
  );

  return {
    start: parseEventSummaryDate(sorted[0]!),
    end: parseEventSummaryDate(sorted[sorted.length - 1]!),
  };
}

/** Shortens full month names for compact event calendar badges (e.g. August → Aug). */
export function formatEventMonthLabel(month: string): string {
  const trimmed = month.trim();
  if (trimmed.length <= 4) {
    return trimmed;
  }

  return MONTH_ABBREVIATIONS[trimmed] ?? trimmed.slice(0, 3);
}
