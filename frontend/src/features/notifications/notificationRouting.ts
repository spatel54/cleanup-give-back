export const VOLUNTEER_NOTIFICATION_TYPES = [
  'session_approved',
  'session_declined',
  'hours_adjusted',
  'status_updated',
  'order_update',
  'event',
  'hours_reminder',
] as const;

export type VolunteerNotificationType = (typeof VOLUNTEER_NOTIFICATION_TYPES)[number];

export type VolunteerNotification = {
  id: string;
  sessionId: string | null;
  orderId: string | null;
  type: VolunteerNotificationType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  /** Local-only pin timestamp; not stored in Supabase. */
  pinnedAt: string | null;
};

/** Chip palettes: session outcomes stay status-colored; other kinds share one notice chip. */
export type NotificationTypeTone = 'approved' | 'declined' | 'hours' | 'notice';

export type NotificationTypePresentation = {
  label: string;
  tone: NotificationTypeTone;
};

export function presentationForVolunteerNotificationType(
  type: VolunteerNotificationType,
): NotificationTypePresentation {
  switch (type) {
    case 'session_approved':
      return { label: 'Approved', tone: 'approved' };
    case 'session_declined':
      return { label: 'Not approved', tone: 'declined' };
    case 'hours_adjusted':
      return { label: 'Under review', tone: 'hours' };
    case 'status_updated':
      return { label: 'Status', tone: 'notice' };
    case 'order_update':
      return { label: 'Order', tone: 'notice' };
    case 'event':
      return { label: 'Event', tone: 'notice' };
    case 'hours_reminder':
      return { label: 'Reminder', tone: 'notice' };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function isVolunteerNotificationType(value: string): value is VolunteerNotificationType {
  return (VOLUNTEER_NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export function extractIdFromText(text: string): string | null {
  const match = text.match(UUID_RE);
  return match?.[0] ?? null;
}

function sessionDetailHref(sessionId: string | null): string {
  if (!sessionId) {
    return '/sessions-list';
  }
  return `/session-detail?id=${encodeURIComponent(sessionId)}`;
}

function eventDetailHref(eventId: string | null): string {
  if (!eventId) {
    return '/';
  }
  return `/event-detail?id=${encodeURIComponent(eventId)}`;
}

function linkedSessionId(item: VolunteerNotification): string | null {
  return item.sessionId ?? extractIdFromText(item.body);
}

function linkedEventId(item: VolunteerNotification): string | null {
  return extractIdFromText(item.body) ?? item.sessionId;
}

const SESSION_STATUSES_FOR_TYPE: Partial<Record<VolunteerNotificationType, readonly string[]>> = {
  session_approved: ['approved'],
  session_declined: ['not_approved'],
  status_updated: ['under_review'],
  hours_adjusted: ['approved', 'under_review', 'not_approved'],
};

export function pickSessionIdForNotification(
  type: VolunteerNotificationType,
  sessions: readonly { id: string; status: string; createdAt?: string }[],
): string | null {
  const wanted = SESSION_STATUSES_FOR_TYPE[type];
  if (!wanted) {
    return null;
  }
  const sorted = [...sessions].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bTime - aTime;
  });
  const match = sorted.find(
    (session) => session.status !== 'active' && wanted.includes(session.status),
  );
  if (match) {
    return match.id;
  }
  return sorted.find((session) => session.status !== 'active')?.id ?? null;
}

export function pickEventIdForNotification(
  item: VolunteerNotification,
  events: readonly { id: string; title: string; location?: string }[],
): string | null {
  const haystack = `${item.title} ${item.body}`.toLowerCase();
  const match = events.find((event) => {
    const title = event.title.trim().toLowerCase();
    const location = (event.location ?? '').trim().toLowerCase();
    return (title.length > 0 && haystack.includes(title))
      || (location.length > 0 && haystack.includes(location));
  });
  return match?.id ?? events[0]?.id ?? null;
}

export function hrefForVolunteerNotification(item: VolunteerNotification): string {
  switch (item.type) {
    case 'session_approved':
    case 'session_declined':
    case 'status_updated':
    case 'hours_adjusted':
      return sessionDetailHref(linkedSessionId(item));
    case 'order_update':
      return '/order-history';
    case 'event':
      return eventDetailHref(linkedEventId(item));
    case 'hours_reminder':
      return '/';
    default: {
      const _exhaustive: never = item.type;
      return _exhaustive;
    }
  }
}

