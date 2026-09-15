import { formatSessionDateLabel } from '@/features/session-tracking/utils/sessionFormat';
import type { SessionStatRecord } from '@/features/session-tracking/utils/homeDashboardStats';

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvHours(durationSeconds: number): string {
  const hours = durationSeconds / 3600;
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatCsvMiles(miles: number): string {
  if (!Number.isFinite(miles)) {
    return '';
  }
  return miles.toFixed(1);
}

const STATUS_LABEL: Record<SessionStatRecord['status'], string> = {
  approved: 'Approved',
  pending: 'Under review',
  declined: 'Not approved',
};

/** Builds a UTF-8 CSV (with BOM) of matching sessions for spreadsheet export. */
export function buildServiceRecordCsv(sessions: readonly SessionStatRecord[]): string {
  const header = ['Date', 'Title', 'Hours', 'Miles', 'Status'];
  const rows = [...sessions]
    .sort((a, b) => a.startedAtMs - b.startedAtMs)
    .map((session) => [
      formatSessionDateLabel(session.startedAtMs),
      session.locationLabel,
      formatCsvHours(session.durationSeconds),
      formatCsvMiles(session.distanceMiles),
      STATUS_LABEL[session.status],
    ]);

  const lines = [header, ...rows].map((cells) => cells.map(csvEscape).join(','));
  return `\uFEFF${lines.join('\n')}\n`;
}
