import type { VolunteerNotification } from './notificationRouting';
import { formatSessionUpdateBody, formatSessionUpdateTitle } from './sessionNotificationCopy';

export const SAMPLE_NOTIFICATION_ID_PREFIX = 'sample-';

export function isSampleNotificationId(id: string): boolean {
  return id.startsWith(SAMPLE_NOTIFICATION_ID_PREFIX);
}

export function isSampleVolunteerInbox(items: VolunteerNotification[]): boolean {
  return items.length > 0 && items.every((item) => isSampleNotificationId(item.id));
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/** Dev-only inbox when `volunteer_notifications` is empty. Copy matches live notify/reminder text. */
export function buildSampleVolunteerNotifications(): VolunteerNotification[] {
  return [
    {
      id: `${SAMPLE_NOTIFICATION_ID_PREFIX}approved`,
      sessionId: null,
      orderId: null,
      type: 'session_approved',
      title: formatSessionUpdateTitle('Session Approved!', 'Lake Park'),
      body: formatSessionUpdateBody(
        'Your volunteer session has been approved.',
        'Lake Park',
      ),
      readAt: null,
      createdAt: hoursAgo(2),
      pinnedAt: null,
    },
    {
      id: `${SAMPLE_NOTIFICATION_ID_PREFIX}reminder`,
      sessionId: null,
      orderId: null,
      type: 'hours_reminder',
      title: 'Ready for a session?',
      body: 'Takes just a minute to start. Pick up right where you left off.',
      readAt: null,
      createdAt: hoursAgo(8),
      pinnedAt: null,
    },
    {
      id: `${SAMPLE_NOTIFICATION_ID_PREFIX}order`,
      sessionId: null,
      orderId: null,
      type: 'order_update',
      title: 'Order shipped',
      body: 'Your cleanup kit is on the way. Tracking is in Order History.',
      readAt: null,
      createdAt: hoursAgo(26),
      pinnedAt: null,
    },
    {
      id: `${SAMPLE_NOTIFICATION_ID_PREFIX}declined`,
      sessionId: null,
      orderId: null,
      type: 'session_declined',
      title: formatSessionUpdateTitle('Session Update', 'River Trail'),
      body: formatSessionUpdateBody(
        'Your session was not approved. Please add a clearer progress photo and resubmit.',
        'River Trail',
      ),
      readAt: hoursAgo(30),
      createdAt: hoursAgo(48),
      pinnedAt: null,
    },
    {
      id: `${SAMPLE_NOTIFICATION_ID_PREFIX}hours`,
      sessionId: null,
      orderId: null,
      type: 'hours_adjusted',
      title: formatSessionUpdateTitle('Hours updated', 'Oakton Park'),
      body: formatSessionUpdateBody(
        'Your session hours were updated to 2 hours.',
        'Oakton Park',
      ),
      readAt: hoursAgo(72),
      createdAt: hoursAgo(80),
      pinnedAt: null,
    },
    {
      id: `${SAMPLE_NOTIFICATION_ID_PREFIX}status`,
      sessionId: null,
      orderId: null,
      type: 'status_updated',
      title: formatSessionUpdateTitle('Session status updated', 'Downtown Plaza'),
      body: formatSessionUpdateBody(
        'Your session is now under review.',
        'Downtown Plaza',
      ),
      readAt: hoursAgo(84),
      createdAt: hoursAgo(90),
      pinnedAt: null,
    },
    {
      id: `${SAMPLE_NOTIFICATION_ID_PREFIX}event`,
      sessionId: null,
      orderId: null,
      type: 'event',
      title: 'New community cleanup',
      body: 'A lakefront cleanup was just posted. Open Events on Home to register.',
      readAt: hoursAgo(96),
      createdAt: hoursAgo(100),
      pinnedAt: null,
    },
  ];
}
