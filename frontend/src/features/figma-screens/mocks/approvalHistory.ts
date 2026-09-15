import type { ApiSession } from '@/lib/sessionsApi';
import { mapApiStatusToApproval } from '@/lib/mapApiSessions';
import type { SessionStatRecord } from '@/features/session-tracking/utils/homeDashboardStats';
import { formatDurationParts, formatServiceDurationCompactFromSeconds } from '@/features/session-tracking/utils/sessionFormat';
import { isVolunteerSessionDeleted } from '@/features/session-tracking/volunteerDeletedSessions';

export type ApprovalStatus = 'approved' | 'underReview' | 'notApproved';

export type ApprovalHistoryItem = {
  id: string;
  sessionNumber: string;
  dateLabel: string;
  durationLabel: string;
  locationLabel: string;
  status: ApprovalStatus;
  note?: string;
};

export type ApprovalHistoryStats = {
  approved: number;
  underReview: number;
  notApproved: number;
};

/** Summary stats for Approval History (Figma `approval_history`, node `854:294`). */
export const defaultApprovalHistoryStats: ApprovalHistoryStats = {
  approved: 14,
  underReview: 3,
  notApproved: 1,
};

/** Mock session rows for Approval History (Figma `854:294`). */
export const defaultApprovalHistory: ApprovalHistoryItem[] = [
  {
    id: 's-0182',
    sessionNumber: 'SESSION #S-0182',
    dateLabel: 'November 14, 2023',
    durationLabel: '2h 15min',
    locationLabel: 'Riverside Park',
    status: 'approved',
  },
  {
    id: 's-0179',
    sessionNumber: 'SESSION #S-0179',
    dateLabel: 'October 29, 2023',
    durationLabel: '1h 45min',
    locationLabel: 'Main Street Trail',
    status: 'approved',
  },
  {
    id: 's-0183',
    sessionNumber: 'SESSION #S-0183',
    dateLabel: 'November 18, 2023',
    durationLabel: '3h 00min',
    locationLabel: 'Oak Valley Beach',
    status: 'underReview',
    note: 'Awaiting admin review. Typically 2–3 business days.',
  },
  {
    id: 's-0171',
    sessionNumber: 'SESSION #S-0171',
    dateLabel: 'September 05, 2023',
    durationLabel: '45min',
    locationLabel: 'Downtown Plaza',
    status: 'notApproved',
    note: 'Reason: Insufficient photo documentation. Please resubmit with before/after photos.',
  },
];

function listStatusToApproval(status: SessionStatRecord['status']): ApprovalStatus {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'pending':
      return 'underReview';
    case 'declined':
      return 'notApproved';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function formatApprovalDateLabel(startedAtMs: number): string {
  return new Date(startedAtMs).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatApprovalDurationLabel(durationSeconds: number): string {
  if (durationSeconds < 3600) {
    return formatServiceDurationCompactFromSeconds(durationSeconds);
  }

  const { hours, minutes } = formatDurationParts(durationSeconds);
  return `${hours}h ${String(minutes).padStart(2, '0')}min`;
}

function formatSessionNumber(id: string): string {
  const compact = id.replace(/-/g, '').slice(-4).toUpperCase();
  return `SESSION #S-${compact || '0000'}`;
}

function approvalNote(status: ApprovalStatus, declineReason?: string | null): string | undefined {
  if (status === 'notApproved' && declineReason?.trim()) {
    return `Reason: ${declineReason.trim()}`;
  }
  if (status === 'underReview') {
    return 'Awaiting admin review. Typically 2–3 business days.';
  }
  return undefined;
}

export function mapStatToApprovalItem(stat: SessionStatRecord): ApprovalHistoryItem {
  const status = listStatusToApproval(stat.status);
  return {
    id: stat.id,
    sessionNumber: formatSessionNumber(stat.id),
    dateLabel: formatApprovalDateLabel(stat.startedAtMs),
    durationLabel: formatApprovalDurationLabel(stat.durationSeconds),
    locationLabel: stat.locationLabel,
    status,
    note: approvalNote(status),
  };
}

export function mapApiSessionToApprovalItem(session: ApiSession): ApprovalHistoryItem | null {
  if (session.status === 'active' || !session.startedAt) {
    return null;
  }

  const status = listStatusToApproval(mapApiStatusToApproval(session.status));
  const startedAtMs = new Date(session.startedAt).getTime();
  const durationSeconds =
    session.durationSeconds ??
    (session.endedAt
      ? Math.max(0, Math.round((new Date(session.endedAt).getTime() - startedAtMs) / 1000))
      : 0);

  return {
    id: session.id,
    sessionNumber: formatSessionNumber(session.id),
    dateLabel: formatApprovalDateLabel(startedAtMs),
    durationLabel: formatApprovalDurationLabel(durationSeconds),
    locationLabel: session.description?.trim() || session.activity?.trim() || 'Unknown',
    status,
    note: approvalNote(status, session.declineReason),
  };
}

export function buildApprovalHistoryStats(items: readonly ApprovalHistoryItem[]): ApprovalHistoryStats {
  return items.reduce(
    (stats, item) => {
      switch (item.status) {
        case 'approved':
          stats.approved += 1;
          break;
        case 'underReview':
          stats.underReview += 1;
          break;
        case 'notApproved':
          stats.notApproved += 1;
          break;
        default: {
          const _exhaustive: never = item.status;
          return _exhaustive;
        }
      }
      return stats;
    },
    { approved: 0, underReview: 0, notApproved: 0 },
  );
}

export function filterVisibleApprovalItems(
  items: readonly ApprovalHistoryItem[],
): ApprovalHistoryItem[] {
  return items.filter((item) => !isVolunteerSessionDeleted(item.id));
}
