import type { ImpactMonthSummary, ImpactStat, WeeklyHoursDatum } from '@/features/figma-screens/mocks/home.types';
import type { ApiSession } from '@/lib/sessionsApi';
import { mapApiStatusToApproval } from '@/lib/mapApiSessions';
import {
  formatServiceDurationCompactFromHours,
  formatServiceDurationPhraseFromHours,
  roundHoursToMinutes,
} from '@/features/session-tracking/utils/sessionFormat';

import type { CompletedSessionSnapshot } from '../liveSessionStore';
import { resolveSessionDurationSeconds } from './sessionFormat';
import { addDays, parseIsoDate, startOfDay, startOfWeekMonday, toIsoDate } from '@/features/figma-screens/utils/weekCalendar';

const CHART_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type SessionStatRecord = {
  id: string;
  startedAtMs: number;
  durationSeconds: number;
  distanceMiles: number;
  photoCount: number;
  locationLabel: string;
  status: 'approved' | 'pending' | 'declined';
};

function emptyWeekChart(): WeeklyHoursDatum[] {
  return CHART_DAY_LABELS.map((day) => ({ day, value: 0 }));
}

function dayIndexMondayBased(date: Date): number {
  const weekday = date.getDay();
  return weekday === 0 ? 6 : weekday - 1;
}

/** Converts session duration to chart hours (one decimal place). */
function secondsToChartHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10) / 10;
}

function addChartHours(current: number, seconds: number): number {
  return Math.round((current + secondsToChartHours(seconds)) * 10) / 10;
}

function sessionDurationFromApi(session: ApiSession): number {
  if (session.durationSeconds != null) {
    return session.durationSeconds;
  }

  if (session.startedAt && session.endedAt) {
    return resolveSessionDurationSeconds({
      startedAt: new Date(session.startedAt).getTime(),
      endedAt: new Date(session.endedAt).getTime(),
    });
  }

  return 0;
}

export function sessionStatFromApi(session: ApiSession): SessionStatRecord | null {
  if (session.status === 'active' || !session.startedAt) {
    return null;
  }

  return {
    id: session.id,
    startedAtMs: new Date(session.startedAt).getTime(),
    durationSeconds: sessionDurationFromApi(session),
    distanceMiles: session.distanceMiles ?? 0,
    photoCount: session.photoCount ?? (session.checkpointCount ?? 0) * 2,
    locationLabel: session.description?.trim() || session.activity?.trim() || 'Unknown',
    status: mapApiStatusToApproval(session.status),
  };
}

export function sessionStatFromSnapshot(snapshot: CompletedSessionSnapshot): SessionStatRecord {
  const id = snapshot.remoteSessionId ?? `local-${snapshot.endedAt}`;
  const photoCount = snapshot.submittedCheckpoints.reduce(
    (count, checkpoint) => count + (checkpoint.selfieUri ? 1 : 0) + (checkpoint.progressUri ? 1 : 0),
    0,
  );

  const durationSeconds = snapshot.skipOrientation
    ? snapshot.elapsedSeconds
    : resolveSessionDurationSeconds({
        startedAt: snapshot.startedAt,
        endedAt: snapshot.endedAt,
        elapsedSeconds: snapshot.elapsedSeconds,
      });

  return {
    id,
    startedAtMs: snapshot.startedAt,
    durationSeconds,
    distanceMiles: snapshot.distanceMiles,
    photoCount,
    locationLabel: snapshot.setup.description?.trim() || snapshot.setup.activity?.trim() || 'Unknown',
    status: snapshot.skipOrientation ? 'approved' : 'pending',
  };
}

export function mergeSessionStats(
  existing: SessionStatRecord[],
  incoming: SessionStatRecord[],
): SessionStatRecord[] {
  const byId = new Map<string, SessionStatRecord>();
  for (const record of existing) {
    byId.set(record.id, record);
  }
  for (const record of incoming) {
    const existingRecord = byId.get(record.id);
    if (existingRecord) {
      byId.set(record.id, {
        ...record,
        photoCount: Math.max(existingRecord.photoCount, record.photoCount),
      });
      continue;
    }

    byId.set(record.id, record);
  }

  return [...byId.values()].sort((a, b) => b.startedAtMs - a.startedAtMs);
}

export function buildWeeklyHoursChart(
  stats: readonly SessionStatRecord[],
  weekStartIso: string,
): WeeklyHoursDatum[] {
  const chart = emptyWeekChart();

  for (const stat of stats) {
    if (stat.status === 'declined') {
      continue;
    }

    const sessionDay = startOfWeekMonday(new Date(stat.startedAtMs));
    const sessionWeekIso = toIsoDate(sessionDay);
    if (sessionWeekIso !== weekStartIso) {
      continue;
    }

    const dayIndex = dayIndexMondayBased(new Date(stat.startedAtMs));
    chart[dayIndex] = {
      day: chart[dayIndex].day,
      value: addChartHours(chart[dayIndex].value, stat.durationSeconds),
    };
  }

  return chart;
}

function sumWeeklyChartHours(stats: readonly SessionStatRecord[], weekStartIso: string): number {
  const totalHours = buildWeeklyHoursChart(stats, weekStartIso).reduce(
    (sum, day) => sum + day.value,
    0,
  );
  return Math.round(totalHours * 10) / 10;
}

export function formatWeekServiceHoursTotal(
  stats: readonly SessionStatRecord[],
  weekStartIso: string,
): string {
  return formatServiceDurationCompactFromHours(sumWeeklyChartHours(stats, weekStartIso));
}

/** Current Monday-week hours at chart precision (0.1 hr). Not a consecutive-day streak. */
export function computeWeeklyStreakHours(
  stats: readonly SessionStatRecord[],
  now: Date = new Date(),
): number {
  return sumWeeklyChartHours(stats, toIsoDate(startOfWeekMonday(now)));
}

export function formatWeeklyHoursBadgeCopy(hours: number): string {
  if (hours <= 0) {
    return '0 minutes this week. Keep it up!';
  }

  if (hours < 1) {
    const minutes = roundHoursToMinutes(hours);
    const unit = minutes === 1 ? 'minute' : 'minutes';
    return `${minutes} ${unit} this week. Keep it up!`;
  }

  const rounded = Math.round(hours * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  const unit = rounded === 1 ? 'hour' : 'hours';
  return `${display} ${unit} this week. Keep it up!`;
}

/** Formats a chart bucket value as an integer with no units (hours or minutes). */
export function formatChartHourLabel(value: number, useMinutes = false): string {
  if (value <= 0) {
    return '0';
  }

  if (useMinutes) {
    return String(roundHoursToMinutes(value));
  }

  return String(Math.round(value));
}

/** Formats a Y-axis tick for the weekly Service Hours chart. */
export function formatChartYAxisTickLabel(value: number, useMinutes: boolean): string {
  if (value <= 0) {
    return '0';
  }

  if (useMinutes) {
    return `${value} min`;
  }

  const display = Number.isInteger(value) ? String(value) : value.toFixed(1);
  const unit = value === 1 ? 'hr' : 'hrs';
  return `${display} ${unit}`;
}

/** True when the weekly chart should use a minute scale on the Y axis. */
export function chartUsesMinuteScale(chartMaxHours: number): boolean {
  return chartMaxHours > 0 && chartMaxHours < 1;
}

/** Screen-reader summary for the weekly bar chart scale. */
export function chartYAxisAccessibilityLabel(useMinutes: boolean): string {
  const unit = useMinutes ? 'minutes' : 'hours';
  return `Weekly service time chart. Vertical axis in ${unit}, Monday through Sunday.`;
}

/** Sums completed session duration (pending + approved; excludes declined). */
export function computeLifetimeServiceHours(stats: readonly SessionStatRecord[]): number {
  const totalSeconds = stats
    .filter((stat) => stat.status !== 'declined')
    .reduce((sum, stat) => sum + stat.durationSeconds, 0);
  return Math.round((totalSeconds / 3600) * 10) / 10;
}

/** Formats lifetime hours for the Home impact hero (one decimal). */
export function formatLifetimeServiceHoursValue(stats: readonly SessionStatRecord[]): string {
  const hours = computeLifetimeServiceHours(stats);
  if (hours <= 0) {
    return '0.0';
  }
  return hours.toFixed(1);
}

const SKIP_PLACE_KEYS = new Set(['unknown', '—', '-', '']);

function shortPlaceName(label: string): string {
  const trimmed = label.trim();
  const firstSegment = trimmed.split(',')[0]?.trim() ?? trimmed;
  return firstSegment;
}

/** One-line story of unique cleanup places (pending + approved). */
export function formatImpactPlacesCopy(stats: readonly SessionStatRecord[]): string {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const stat of stats) {
    if (stat.status === 'declined') {
      continue;
    }

    const short = shortPlaceName(stat.locationLabel);
    const key = short.toLowerCase();
    if (SKIP_PLACE_KEYS.has(key) || seen.has(key)) {
      continue;
    }

    seen.add(key);
    names.push(short);
  }

  if (names.length === 0) {
    return '';
  }

  if (names.length === 1) {
    return `You've cleaned up at ${names[0]}.`;
  }

  if (names.length === 2) {
    return `You've cleaned up at ${names[0]} and ${names[1]}.`;
  }

  const extra = names.length - 2;
  const other = extra === 1 ? '1 other place' : `${extra} other places`;
  return `You've cleaned up at ${names[0]}, ${names[1]}, and ${other}.`;
}

export function monthKeyFromMs(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function countUniqueImpactPlaces(stats: readonly SessionStatRecord[]): number {
  const seen = new Set<string>();

  for (const stat of stats) {
    if (stat.status === 'declined') {
      continue;
    }

    const short = shortPlaceName(stat.locationLabel);
    const key = short.toLowerCase();
    if (SKIP_PLACE_KEYS.has(key)) {
      continue;
    }

    seen.add(key);
  }

  return seen.size;
}

function formatImpactMonthName(monthKey: string): string {
  const [yearText, monthText] = monthKey.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  return new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'long' });
}

/** Hours phrase for the impact sentence (`36 minutes`, `1 hour`). */
export function formatImpactHoursPhrase(hours: number): string {
  return formatServiceDurationPhraseFromHours(hours);
}

export function formatImpactMonthSentence(summary: ImpactMonthSummary): string {
  const year = Number(summary.monthKey.slice(0, 4));
  const placeWord = summary.placeCount === 1 ? 'place' : 'places';
  return `In ${summary.monthLabel} ${year}, you cleaned up ${summary.placeCount} ${placeWord} for a total of ${formatImpactHoursPhrase(summary.hours)}.`;
}

/** How far back the impact year picker goes (current year inclusive). */
export const IMPACT_YEAR_SPAN = 100;

/** Newest-first calendar years from the current year back through `IMPACT_YEAR_SPAN` years. Never includes future years. */
export function buildImpactYearOptions(now: Date = new Date()): number[] {
  const maxYear = now.getFullYear();
  const minYear = maxYear - (IMPACT_YEAR_SPAN - 1);
  const years: number[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(year);
  }
  return years;
}

/** All twelve calendar months for a year (January → December). */
export function buildImpactMonthOptionsForYear(
  year: number,
): readonly { monthKey: string; monthLabel: string }[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return {
      monthKey,
      monthLabel: formatImpactMonthName(monthKey),
    };
  });
}

/** Newest-first years the user actually has session activity in, plus the current year as a floor. */
export function buildActiveImpactYearOptions(
  sessionStats: readonly SessionStatRecord[],
  now: Date = new Date(),
): number[] {
  const years = new Set(sessionStats.map((stat) => new Date(stat.startedAtMs).getFullYear()));
  years.add(now.getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

/** Newest-first months the user actually has session activity in for `year`, plus the current month as a floor when `year` is the current year. */
export function buildActiveImpactMonthOptionsForYear(
  sessionStats: readonly SessionStatRecord[],
  year: number,
  now: Date = new Date(),
): readonly { monthKey: string; monthLabel: string }[] {
  const months = new Set(
    sessionStats
      .filter((stat) => new Date(stat.startedAtMs).getFullYear() === year)
      .map((stat) => new Date(stat.startedAtMs).getMonth() + 1),
  );
  if (year === now.getFullYear()) {
    months.add(now.getMonth() + 1);
  }
  return Array.from(months)
    .sort((a, b) => b - a)
    .map((month) => {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      return { monthKey, monthLabel: formatImpactMonthName(monthKey) };
    });
}

/** Parses typed month input (name, abbreviation, or 1–12). */
export function parseImpactMonthInput(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const numeric = Number(trimmed);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
    return numeric;
  }

  const lower = trimmed.toLowerCase();
  for (let month = 1; month <= 12; month += 1) {
    const date = new Date(2000, month - 1, 1);
    const longName = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const shortName = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    if (lower === longName || lower === shortName || (lower.length >= 3 && longName.startsWith(lower))) {
      return month;
    }
  }

  return null;
}

/** Parses typed year input within the allowed range (inclusive). */
export function parseImpactYearInput(
  text: string,
  minYear: number,
  maxYear: number,
): number | null {
  const trimmed = text.trim();
  if (!/^\d{4}$/.test(trimmed)) {
    return null;
  }

  const year = Number(trimmed);
  if (!Number.isInteger(year) || year < minYear || year > maxYear) {
    return null;
  }

  return year;
}

export function buildImpactMonthSummary(
  stats: readonly SessionStatRecord[],
  monthKey: string,
): ImpactMonthSummary {
  const monthStats = stats.filter(
    (stat) => stat.status !== 'declined' && monthKeyFromMs(stat.startedAtMs) === monthKey,
  );

  return {
    monthKey,
    monthLabel: formatImpactMonthName(monthKey),
    placeCount: countUniqueImpactPlaces(monthStats),
    hours: computeLifetimeServiceHours(monthStats),
  };
}

/** Months with session activity plus the current month, newest first. */
export function buildImpactMonthSummaries(
  stats: readonly SessionStatRecord[],
  now: Date = new Date(),
): ImpactMonthSummary[] {
  const keys = new Set<string>([monthKeyFromMs(now.getTime())]);
  for (const stat of stats) {
    if (stat.status === 'declined') {
      continue;
    }
    keys.add(monthKeyFromMs(stat.startedAtMs));
  }

  return [...keys]
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((monthKey) => buildImpactMonthSummary(stats, monthKey));
}

export function buildImpactStats(stats: readonly SessionStatRecord[]): ImpactStat[] {
  const completed = stats.filter((stat) => stat.status !== 'declined');
  const miles = completed.reduce((sum, stat) => sum + stat.distanceMiles, 0);
  const locations = new Set(completed.map((stat) => stat.locationLabel.toLowerCase())).size;
  const sessions = completed.length;
  const photos = completed.reduce((sum, stat) => sum + stat.photoCount, 0);

  return [
    { id: 'miles', value: miles.toFixed(1), label: 'MILES COVERED', icon: 'miles' },
    { id: 'locations', value: String(locations), label: 'LOCATIONS CLEANED', icon: 'locations' },
    { id: 'sessions', value: String(sessions), label: 'SESSIONS COMPLETED', icon: 'sessions' },
    { id: 'photos', value: String(photos), label: 'PHOTOS SUBMITTED', icon: 'photos' },
  ];
}

export function weekIsoForDate(date: Date): string {
  return toIsoDate(startOfWeekMonday(date));
}

export function isDateInWeekIso(dateMs: number, weekStartIso: string): boolean {
  const weekStart = startOfWeekMonday(new Date(`${weekStartIso}T12:00:00`));
  const weekEnd = addDays(weekStart, 6);
  const day = new Date(dateMs);
  return day >= weekStart && day <= weekEnd;
}

export type ExportStatusSelection = {
  approved: boolean;
  pending: boolean;
  declined: boolean;
};

const APPROVED_ONLY: ExportStatusSelection = {
  approved: true,
  pending: false,
  declined: false,
};

export function hasApprovedSessions(stats: readonly SessionStatRecord[]): boolean {
  return stats.some((stat) => stat.status === 'approved');
}

/** Inclusive start-of-day through inclusive end-of-day matches for export filters. */
export function filterExportMatchingSessions(
  stats: readonly SessionStatRecord[],
  startDay: Date,
  endDay: Date,
  statuses: ExportStatusSelection = APPROVED_ONLY,
): SessionStatRecord[] {
  const startMs = startDay.getTime();
  const endMs = addDays(endDay, 1).getTime();

  return stats.filter((stat) => {
    if (stat.startedAtMs < startMs || stat.startedAtMs >= endMs) {
      return false;
    }

    switch (stat.status) {
      case 'approved':
        return statuses.approved;
      case 'pending':
        return statuses.pending;
      case 'declined':
        return statuses.declined;
      default: {
        const _exhaustive: never = stat.status;
        return _exhaustive;
      }
    }
  });
}

/** Inclusive start-of-day through inclusive end-of-day match count for export filters. */
export function countExportMatchingSessions(
  stats: readonly SessionStatRecord[],
  startDay: Date,
  endDay: Date,
  statuses: ExportStatusSelection,
): number {
  return filterExportMatchingSessions(stats, startDay, endDay, statuses).length;
}

/** Local calendar days that have at least one approved session. */
export function approvedSessionDateKeys(stats: readonly SessionStatRecord[]): Set<string> {
  const keys = new Set<string>();
  for (const stat of stats) {
    if (stat.status !== 'approved') {
      continue;
    }
    keys.add(toIsoDate(startOfDay(new Date(stat.startedAtMs))));
  }
  return keys;
}

/**
 * Snap a calendar day onto a day that has approved sessions.
 * Start prefers the next approved day on/after; end prefers the previous on/before.
 */
export function snapToApprovedSessionDate(
  date: Date,
  keys: ReadonlySet<string>,
  prefer: 'start' | 'end',
): Date | null {
  if (keys.size === 0) {
    return null;
  }
  const day = startOfDay(date);
  const iso = toIsoDate(day);
  if (keys.has(iso)) {
    return day;
  }
  const sorted = [...keys].sort();
  if (prefer === 'start') {
    const next = sorted.find((key) => key >= iso);
    return parseIsoDate(next ?? sorted[sorted.length - 1]);
  }
  const previous = [...sorted].reverse().find((key) => key <= iso);
  return parseIsoDate(previous ?? sorted[0]);
}

/** Earliest approved session day through the latest approved session day. */
export function approvedSessionDateBounds(
  stats: readonly SessionStatRecord[],
): { start: Date; end: Date } | null {
  let earliestMs: number | null = null;
  let latestMs: number | null = null;
  for (const stat of stats) {
    if (stat.status !== 'approved') {
      continue;
    }
    if (earliestMs == null || stat.startedAtMs < earliestMs) {
      earliestMs = stat.startedAtMs;
    }
    if (latestMs == null || stat.startedAtMs > latestMs) {
      latestMs = stat.startedAtMs;
    }
  }
  if (earliestMs == null || latestMs == null) {
    return null;
  }
  return {
    start: startOfDay(new Date(earliestMs)),
    end: startOfDay(new Date(latestMs)),
  };
}

/** Fly / Supabase session ids only — local snapshot ids cannot generate a letter. */
export function isRemoteSessionId(sessionId: string): boolean {
  return Boolean(sessionId) && !sessionId.startsWith('local-') && !sessionId.startsWith('session-');
}
