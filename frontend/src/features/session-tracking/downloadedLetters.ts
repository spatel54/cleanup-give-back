import { formatServiceDurationCompactFromHours } from '@/features/session-tracking/utils/sessionFormat';
import { isRemoteSessionId } from '@/features/session-tracking/utils/homeDashboardStats';
import { startOfDay } from '@/features/figma-screens/utils/weekCalendar';

export const LETTER_TITLE = 'Service letter';

export type DownloadedLetter = {
  id: string;
  title: typeof LETTER_TITLE;
  subtitle: string;
  downloadedAtMs: number;
  fileUri: string;
  filename: string;
  sessionIds: string[];
  sessionDatesMs: number[];
  totalDurationSeconds: number;
};

const letterDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const letterDateNoYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

export function formatLetterDate(timestampMs: number): string {
  return letterDateFormatter.format(new Date(timestampMs));
}

function uniqueSortedDayMs(timestampsMs: readonly number[]): number[] {
  const days = new Set<number>();
  for (const timestampMs of timestampsMs) {
    days.add(startOfDay(new Date(timestampMs)).getTime());
  }
  return [...days].sort((a, b) => a - b);
}

export function formatLetterDateRange(timestampsMs: readonly number[]): string {
  const days = uniqueSortedDayMs(timestampsMs);
  if (days.length === 0) {
    return '';
  }
  if (days.length === 1) {
    return formatLetterDate(days[0]);
  }
  const start = days[0];
  const end = days[days.length - 1];
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${letterDateNoYearFormatter.format(startDate)} – ${formatLetterDate(end)}`;
  }
  return `${formatLetterDate(start)} – ${formatLetterDate(end)}`;
}

/** Row subtitle: `Apr 12, 2026 · 2.0 hrs` or a date span for multi-day PDFs. */
export function formatLetterSubtitle(
  sessionDatesMs: readonly number[],
  totalDurationSeconds: number,
  fallbackDateMs = Date.now(),
): string {
  const dateLabel = formatLetterDateRange(
    sessionDatesMs.length > 0 ? sessionDatesMs : [fallbackDateMs],
  );
  const hoursLabel = formatServiceDurationCompactFromHours(totalDurationSeconds / 3600);
  return `${dateLabel} · ${hoursLabel}`;
}

export function uniqueRemoteSessionIdsFromLetters(
  letters: readonly DownloadedLetter[],
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const letter of letters) {
    for (const sessionId of letter.sessionIds) {
      if (!isRemoteSessionId(sessionId) || seen.has(sessionId)) {
        continue;
      }
      seen.add(sessionId);
      ids.push(sessionId);
    }
  }
  return ids;
}

export function parseDownloadedLetter(value: unknown): DownloadedLetter | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || !row.id.trim()) {
    return null;
  }
  if (typeof row.fileUri !== 'string' || !row.fileUri.trim()) {
    return null;
  }
  if (typeof row.filename !== 'string' || !row.filename.trim()) {
    return null;
  }
  if (typeof row.downloadedAtMs !== 'number' || !Number.isFinite(row.downloadedAtMs)) {
    return null;
  }
  const sessionIds = Array.isArray(row.sessionIds)
    ? row.sessionIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];
  const sessionDatesMs = Array.isArray(row.sessionDatesMs)
    ? row.sessionDatesMs.filter(
        (timestamp): timestamp is number => typeof timestamp === 'number' && Number.isFinite(timestamp),
      )
    : [];
  const totalDurationSeconds =
    typeof row.totalDurationSeconds === 'number' && Number.isFinite(row.totalDurationSeconds)
      ? Math.max(0, row.totalDurationSeconds)
      : 0;
  const subtitle =
    typeof row.subtitle === 'string' && row.subtitle.trim()
      ? row.subtitle
      : formatLetterSubtitle(sessionDatesMs, totalDurationSeconds, row.downloadedAtMs);

  return {
    id: row.id,
    title: LETTER_TITLE,
    subtitle,
    downloadedAtMs: row.downloadedAtMs,
    fileUri: row.fileUri,
    filename: row.filename,
    sessionIds,
    sessionDatesMs,
    totalDurationSeconds,
  };
}
