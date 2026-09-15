import {
  earlierCreatedAt,
  incomingVolunteerNotificationFromPayload,
  isSameIncomingVolunteerNotification,
  normalizeIncomingVolunteerNotificationType,
  parseIncomingCreatedAt,
} from './incomingVolunteerNotification';

describe('incomingVolunteerNotificationFromPayload', () => {
  it('maps a session-approved push onto an inbox row', () => {
    const item = incomingVolunteerNotificationFromPayload({
      notificationId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      type: 'session_approved',
      title: 'Session Approved! · Lake Park',
      body: 'Your volunteer session at Lake Park has been approved.',
      sessionId: '11111111-2222-3333-4444-555555555555',
    });
    expect(item).toEqual(
      expect.objectContaining({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        type: 'session_approved',
        sessionId: '11111111-2222-3333-4444-555555555555',
        orderId: null,
        readAt: null,
      }),
    );
  });

  it('normalizes hours-reminder and ignores photo-checkpoint banners', () => {
    expect(normalizeIncomingVolunteerNotificationType('hours-reminder')).toBe('hours_reminder');
    expect(
      incomingVolunteerNotificationFromPayload({
        type: 'photo-checkpoint',
        title: 'Checkpoint time!',
        body: 'Snap a quick photo to keep this session on track.',
      }),
    ).toBeNull();
  });

  it('keeps the Expo/server createdAt instead of stamping now', () => {
    const item = incomingVolunteerNotificationFromPayload({
      type: 'session_approved',
      title: 'Session Approved! · Lake Park',
      body: 'Your volunteer session at Lake Park has been approved.',
      createdAt: '2026-08-26T06:00:00.000Z',
    });
    expect(item?.createdAt).toBe('2026-08-26T06:00:00.000Z');
  });

  it('parses Expo date seconds and prefers the earlier stamp', () => {
    const iso = '2026-08-26T06:00:00.000Z';
    expect(parseIncomingCreatedAt(Date.parse(iso) / 1000)).toBe(iso);
    expect(earlierCreatedAt(iso, '2026-08-26T18:00:00.000Z')).toBe(iso);
  });

  it('treats matching type/title/body as the same incoming notice', () => {
    const left = incomingVolunteerNotificationFromPayload({
      type: 'order_update',
      title: 'Order shipped',
      body: 'Your cleanup kit is on the way. Tracking is in Order History.',
      orderId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    });
    const right = incomingVolunteerNotificationFromPayload({
      notificationId: '11111111-2222-3333-4444-555555555555',
      type: 'order_update',
      title: 'Order shipped',
      body: 'Your cleanup kit is on the way. Tracking is in Order History.',
      orderId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    });
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(isSameIncomingVolunteerNotification(left!, right!)).toBe(true);
  });
});
