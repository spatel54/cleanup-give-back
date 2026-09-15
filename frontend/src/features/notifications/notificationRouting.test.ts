import {
  hrefForVolunteerNotification,
  pickEventIdForNotification,
  pickSessionIdForNotification,
  presentationForVolunteerNotificationType,
  VOLUNTEER_NOTIFICATION_TYPES,
  type VolunteerNotification,
} from './notificationRouting';

function makeItem(overrides: Partial<VolunteerNotification>): VolunteerNotification {
  return {
    id: 'n-1',
    sessionId: null,
    orderId: null,
    type: 'hours_reminder',
    title: 'Ready for a session?',
    body: 'Log a quick session today.',
    readAt: null,
    createdAt: '2026-08-25T12:00:00.000Z',
    ...overrides,
  };
}

describe('hrefForVolunteerNotification', () => {
  it('opens session detail for session, hours-adjusted, and status types', () => {
    expect(
      hrefForVolunteerNotification(
        makeItem({ type: 'session_approved', sessionId: 'sess-1' }),
      ),
    ).toBe('/session-detail?id=sess-1');
    expect(
      hrefForVolunteerNotification(
        makeItem({ type: 'session_declined', sessionId: 'sess-3' }),
      ),
    ).toBe('/session-detail?id=sess-3');
    expect(
      hrefForVolunteerNotification(
        makeItem({ type: 'status_updated', sessionId: 'sess-4' }),
      ),
    ).toBe('/session-detail?id=sess-4');
    expect(
      hrefForVolunteerNotification(
        makeItem({ type: 'hours_adjusted', sessionId: 'sess-2' }),
      ),
    ).toBe('/session-detail?id=sess-2');
  });

  it('opens sessions list when a session notice has no session id', () => {
    expect(hrefForVolunteerNotification(makeItem({ type: 'session_approved' }))).toBe(
      '/sessions-list',
    );
  });

  it('opens order history for order updates', () => {
    expect(hrefForVolunteerNotification(makeItem({ type: 'order_update' }))).toBe(
      '/order-history',
    );
  });

  it('opens event detail when a UUID is in the body, otherwise home', () => {
    const eventId = '11111111-2222-3333-4444-555555555555';
    expect(
      hrefForVolunteerNotification(makeItem({ type: 'event', body: `Join ${eventId}` })),
    ).toBe(`/event-detail?id=${eventId}`);
    expect(hrefForVolunteerNotification(makeItem({ type: 'event', body: 'Join us' }))).toBe(
      '/',
    );
  });

  it('opens home for hours reminders', () => {
    expect(hrefForVolunteerNotification(makeItem({ type: 'hours_reminder' }))).toBe('/');
  });
});

describe('pickSessionIdForNotification', () => {
  const sessions = [
    { id: 'old-approved', status: 'approved', createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'review', status: 'under_review', createdAt: '2026-08-20T00:00:00.000Z' },
    { id: 'declined', status: 'not_approved', createdAt: '2026-08-18T00:00:00.000Z' },
    { id: 'new-approved', status: 'approved', createdAt: '2026-08-24T00:00:00.000Z' },
  ];

  it('picks the newest matching session status', () => {
    expect(pickSessionIdForNotification('session_approved', sessions)).toBe('new-approved');
    expect(pickSessionIdForNotification('session_declined', sessions)).toBe('declined');
    expect(pickSessionIdForNotification('status_updated', sessions)).toBe('review');
  });
});

describe('pickEventIdForNotification', () => {
  it('matches community cleanup copy to an event title, else the first event', () => {
    const events = [
      { id: 'evt-1', title: 'Park sweep', location: 'Lincoln Park' },
      { id: 'evt-2', title: 'Lakefront cleanup', location: 'Lakefront' },
    ];
    expect(
      pickEventIdForNotification(
        makeItem({ type: 'event', title: 'New community cleanup', body: 'A lakefront cleanup was just posted.' }),
        events,
      ),
    ).toBe('evt-2');
    expect(
      pickEventIdForNotification(makeItem({ type: 'event', body: 'Join us' }), events),
    ).toBe('evt-1');
  });
});

describe('presentationForVolunteerNotificationType', () => {
  it('gives every type a unique label', () => {
    const labels = VOLUNTEER_NOTIFICATION_TYPES.map(
      (type) => presentationForVolunteerNotificationType(type).label,
    );
    expect(new Set(labels).size).toBe(VOLUNTEER_NOTIFICATION_TYPES.length);
  });

  it('maps hours-adjusted notices onto the Under review chip', () => {
    expect(presentationForVolunteerNotificationType('hours_adjusted')).toEqual({
      label: 'Under review',
      tone: 'hours',
    });
  });

  it('maps session outcomes onto approved and declined tones', () => {
    expect(presentationForVolunteerNotificationType('session_approved')).toEqual({
      label: 'Approved',
      tone: 'approved',
    });
    expect(presentationForVolunteerNotificationType('session_declined')).toEqual({
      label: 'Not approved',
      tone: 'declined',
    });
  });

  it('shares one notice tone for event, status, order, and reminder', () => {
    expect(presentationForVolunteerNotificationType('event').tone).toBe('notice');
    expect(presentationForVolunteerNotificationType('status_updated').tone).toBe('notice');
    expect(presentationForVolunteerNotificationType('order_update').tone).toBe('notice');
    expect(presentationForVolunteerNotificationType('hours_reminder').tone).toBe('notice');
  });
});
