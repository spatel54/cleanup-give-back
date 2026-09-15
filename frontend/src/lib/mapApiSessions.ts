import type { ApiSession } from '@/lib/sessionsApi';
import type { SessionApprovalStatus, SessionListItem } from '@/features/figma-screens/mocks/sessions';

function mapApiStatus(status: ApiSession['status']): SessionApprovalStatus {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'under_review':
    case 'active':
      return 'pending';
    case 'not_approved':
    case 'invalid':
      return 'declined';
    default:
      return 'pending';
  }
}

export function mapApiStatusToApproval(status: ApiSession['status']): SessionApprovalStatus {
  return mapApiStatus(status);
}

function formatDateLabel(iso: string | null): string {
  if (!iso) {
    return '-';
  }
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeLabel(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt) {
    return '-';
  }
  const start = new Date(startedAt);
  const startLabel = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (!endedAt) {
    return startLabel;
  }
  const end = new Date(endedAt);
  const endLabel = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${startLabel}–${endLabel}`;
}

export function mapApiSessionToListItem(session: ApiSession): SessionListItem {
  const sortDate = session.startedAt?.slice(0, 10) ?? session.createdAt.slice(0, 10);
  return {
    id: session.id,
    title: session.activity ?? 'Cleanup Session',
    dateLabel: formatDateLabel(session.startedAt),
    timeLabel: formatTimeLabel(session.startedAt, session.endedAt),
    sortDate,
    status: mapApiStatus(session.status),
  };
}
