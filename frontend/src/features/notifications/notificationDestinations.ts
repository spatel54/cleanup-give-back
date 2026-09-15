import {
  fetchPublishedEventsCatalog,
  fetchPublishedUpcomingEvents,
} from '@/lib/eventsApi';
import { listSessions } from '@/lib/sessionsApi';

import {
  hrefForVolunteerNotification,
  pickEventIdForNotification,
  pickSessionIdForNotification,
  type VolunteerNotification,
} from './notificationRouting';

function sessionDetailHref(sessionId: string): string {
  return `/session-detail?id=${encodeURIComponent(sessionId)}`;
}

function eventDetailHref(eventId: string): string {
  return `/event-detail?id=${encodeURIComponent(eventId)}`;
}

/** Resolves inbox taps to a live session, event, or Order History when ids are missing. */
export async function resolveVolunteerNotificationHref(
  item: VolunteerNotification,
): Promise<string> {
  const direct = hrefForVolunteerNotification(item);

  switch (item.type) {
    case 'session_approved':
    case 'session_declined':
    case 'status_updated':
    case 'hours_adjusted': {
      if (direct !== '/sessions-list') {
        return direct;
      }
      try {
        const picked = pickSessionIdForNotification(item.type, await listSessions());
        if (picked) {
          return sessionDetailHref(picked);
        }
      } catch (error) {
        console.warn('[notifications] session lookup failed:', error);
      }
      return '/sessions-list';
    }
    case 'event': {
      if (direct !== '/') {
        return direct;
      }
      try {
        const upcoming = await fetchPublishedUpcomingEvents();
        const events = upcoming.length > 0 ? upcoming : await fetchPublishedEventsCatalog();
        const picked = pickEventIdForNotification(item, events);
        if (picked) {
          return eventDetailHref(picked);
        }
      } catch (error) {
        console.warn('[notifications] event lookup failed:', error);
      }
      return '/';
    }
    case 'order_update':
    case 'hours_reminder':
      return direct;
    default: {
      const _exhaustive: never = item.type;
      return _exhaustive;
    }
  }
}
