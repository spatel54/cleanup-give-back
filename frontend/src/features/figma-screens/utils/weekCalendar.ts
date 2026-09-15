const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export { DAY_HEADERS, MONTH_NAMES, MONTH_NAMES_SHORT };

export type CalendarDayCell = {
  date: Date;
  inCurrentMonth: boolean;
};

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Monday-based week start for the given calendar day. */
export function startOfWeekMonday(date: Date): Date {
  const normalized = startOfDay(date);
  const weekday = normalized.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  return addDays(normalized, -daysFromMonday);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return {
    year: Math.floor(total / 12),
    month: ((total % 12) + 12) % 12,
  };
}

export function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function mondayColumnIndex(date: Date): number {
  const weekday = date.getDay();
  return weekday === 0 ? 6 : weekday - 1;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isDateInWeek(day: Date, weekStart: Date): boolean {
  const start = startOfDay(weekStart);
  const end = addDays(start, 6);
  const candidate = startOfDay(day);
  return candidate.getTime() >= start.getTime() && candidate.getTime() <= end.getTime();
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const start = startOfDay(weekStart);
  const end = addDays(start, 6);
  const startMonth = MONTH_NAMES_SHORT[start.getMonth()];
  const year = start.getFullYear();
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
  }
  const endMonth = MONTH_NAMES_SHORT[end.getMonth()];
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
}

export function formatWeekNumberLabel(weekStart: Date): string {
  return `Week ${getIsoWeekNumber(weekStart)}`;
}

export function formatMonthYearLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

/** ISO-8601 week number (Monday week start). */
export function getIsoWeekNumber(date: Date): number {
  const normalized = startOfDay(date);
  const day = normalized.getDay() || 7;
  normalized.setDate(normalized.getDate() + 4 - day);
  const yearStart = new Date(normalized.getFullYear(), 0, 1);
  return Math.ceil(((normalized.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function buildMonthGrid(year: number, month: number): CalendarDayCell[][] {
  const firstOfMonth = new Date(year, month, 1);
  const leadingEmpty = mondayColumnIndex(firstOfMonth);
  const totalDays = daysInMonth(month, year);
  const cells: CalendarDayCell[] = [];

  const previous = addMonths(year, month, -1);
  const previousMonthDays = daysInMonth(previous.month, previous.year);
  for (let i = leadingEmpty - 1; i >= 0; i -= 1) {
    const day = previousMonthDays - i;
    cells.push({
      date: new Date(previous.year, previous.month, day),
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      inCurrentMonth: true,
    });
  }

  const next = addMonths(year, month, 1);
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(next.year, next.month, nextDay),
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  const rows: CalendarDayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export function getCurrentWeekMeta() {
  const weekStart = startOfWeekMonday(new Date());
  return {
    weekStart,
    weekStartIso: toIsoDate(weekStart),
    weekRangeLabel: formatWeekRangeLabel(weekStart),
    weekNumberLabel: formatWeekNumberLabel(weekStart),
  };
}

export function buildYearOptions(anchorYear: number, span = 12): number[] {
  const start = anchorYear - Math.floor(span / 2);
  return Array.from({ length: span }, (_, index) => start + index);
}
