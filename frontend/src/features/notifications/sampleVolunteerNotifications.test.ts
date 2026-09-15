import {
  buildSampleVolunteerNotifications,
  isSampleNotificationId,
  isSampleVolunteerInbox,
} from './sampleVolunteerNotifications';
import { isVolunteerNotificationType } from './notificationRouting';

describe('sampleVolunteerNotifications', () => {
  it('uses sample ids and valid types', () => {
    const items = buildSampleVolunteerNotifications();
    expect(items.length).toBeGreaterThan(0);
    expect(isSampleVolunteerInbox(items)).toBe(true);
    for (const item of items) {
      expect(isSampleNotificationId(item.id)).toBe(true);
      expect(isVolunteerNotificationType(item.type)).toBe(true);
    }
  });

  it('keeps some rows unread so the Home badge can show', () => {
    const unread = buildSampleVolunteerNotifications().filter((item) => item.readAt == null);
    expect(unread.length).toBeGreaterThan(0);
  });

  it('names the place on session-update rows', () => {
    const items = buildSampleVolunteerNotifications();
    const sessionRows = items.filter((item) =>
      ['session_approved', 'session_declined', 'hours_adjusted', 'status_updated'].includes(
        item.type,
      ),
    );
    expect(sessionRows.length).toBe(4);
    for (const item of sessionRows) {
      expect(item.title).toMatch(/· /);
      expect(item.body.toLowerCase()).toMatch(/ at /);
    }
  });
});
