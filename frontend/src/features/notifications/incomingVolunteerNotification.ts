import {
  isVolunteerNotificationType,
  type VolunteerNotification,
  type VolunteerNotificationType,
} from './notificationRouting';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type IncomingVolunteerNotificationInput = {
  notificationId?: string | null;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  sessionId?: string | null;
  orderId?: string | null;
  createdAt?: string | number | null;
};

function readNonEmpty(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readUuid(value: string | null | undefined): string | null {
  const trimmed = readNonEmpty(value);
  if (!trimmed || !UUID_RE.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/** Expo `notification.date` is ms on most platforms and seconds on some iOS builds. */
export function parseIncomingCreatedAt(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value > 0 && value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseIncomingCreatedAt(Number(trimmed));
  }
  const parsed = new Date(trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function earlierCreatedAt(left: string, right: string): string {
  const leftMs = Date.parse(left);
  const rightMs = Date.parse(right);
  if (Number.isNaN(leftMs)) {
    return right;
  }
  if (Number.isNaN(rightMs)) {
    return left;
  }
  return leftMs <= rightMs ? left : right;
}

/** Expo push data historically used `hours-reminder`; the inbox type is `hours_reminder`. */
export function normalizeIncomingVolunteerNotificationType(
  value: string | null | undefined,
): VolunteerNotificationType | null {
  const raw = readNonEmpty(value);
  if (!raw) {
    return null;
  }
  const type = raw === 'hours-reminder' ? 'hours_reminder' : raw;
  return isVolunteerNotificationType(type) ? type : null;
}

/**
 * Maps an Expo notification payload onto an inbox row.
 * Photo-checkpoint banners are excluded — they are live-session nudges, not Messages.
 */
export function incomingVolunteerNotificationFromPayload(
  input: IncomingVolunteerNotificationInput,
): VolunteerNotification | null {
  const type = normalizeIncomingVolunteerNotificationType(input.type);
  const title = readNonEmpty(input.title);
  const body = readNonEmpty(input.body);
  if (!type || !title || !body) {
    return null;
  }
  const id = readUuid(input.notificationId);
  return {
    id: id ?? `incoming-${type}-${Date.now()}`,
    sessionId: readUuid(input.sessionId),
    orderId: readUuid(input.orderId),
    type,
    title,
    body,
    readAt: null,
    createdAt: parseIncomingCreatedAt(input.createdAt) ?? new Date().toISOString(),
    pinnedAt: null,
  };
}

export function isSameIncomingVolunteerNotification(
  left: VolunteerNotification,
  right: VolunteerNotification,
): boolean {
  return (
    left.id === right.id
    || (
      left.type === right.type
      && left.title === right.title
      && left.body === right.body
      && left.sessionId === right.sessionId
      && left.orderId === right.orderId
    )
  );
}
