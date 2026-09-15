jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  removeItem: jest.fn(async () => {}),
}));

const insert = jest.fn();
const hydrateOrder = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: hydrateOrder }),
      insert,
    }),
  },
  getUserId: jest.fn(async () => 'user-1'),
  isSupabaseConfigured: true,
}));

import {
  getVolunteerNotifications,
  ingestIncomingVolunteerNotification,
  resetVolunteerNotifications,
} from './volunteerNotificationsStore';

describe('ingestIncomingVolunteerNotification', () => {
  beforeEach(() => {
    resetVolunteerNotifications();
    insert.mockReset();
    hydrateOrder.mockReset();
    hydrateOrder.mockResolvedValue({ data: [], error: null });
    insert.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: {
            id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
            created_at: '2026-08-26T06:00:00.000Z',
          },
          error: null,
        }),
      }),
    });
  });

  it('stores a received banner in the inbox and persists when it has no server id', async () => {
    await ingestIncomingVolunteerNotification({
      type: 'session_approved',
      title: 'Session Approved! · Lake Park',
      body: 'Your volunteer session at Lake Park has been approved.',
      sessionId: '11111111-2222-3333-4444-555555555555',
    });

    expect(insert).toHaveBeenCalled();
    const items = getVolunteerNotifications();
    expect(items.some((item) => item.type === 'session_approved')).toBe(true);
    expect(items.every((item) => !item.id.startsWith('sample-'))).toBe(true);
  });

  it('does not insert again when the push already carries a volunteer_notifications id', async () => {
    hydrateOrder.mockResolvedValue({
      data: [
        {
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          session_id: '11111111-2222-3333-4444-555555555555',
          order_id: null,
          type: 'session_approved',
          title: 'Session Approved! · Lake Park',
          body: 'Your volunteer session at Lake Park has been approved.',
          read_at: null,
          created_at: '2026-08-26T06:00:00.000Z',
        },
      ],
      error: null,
    });

    await ingestIncomingVolunteerNotification({
      notificationId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      type: 'session_approved',
      title: 'Session Approved! · Lake Park',
      body: 'Your volunteer session at Lake Park has been approved.',
      sessionId: '11111111-2222-3333-4444-555555555555',
      createdAt: '2026-08-26T06:00:00.000Z',
    });

    expect(insert).not.toHaveBeenCalled();
    expect(getVolunteerNotifications()[0]?.id).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(getVolunteerNotifications()[0]?.createdAt).toBe('2026-08-26T06:00:00.000Z');

    await ingestIncomingVolunteerNotification({
      notificationId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      type: 'session_approved',
      title: 'Session Approved! · Lake Park',
      body: 'Your volunteer session at Lake Park has been approved.',
      sessionId: '11111111-2222-3333-4444-555555555555',
    });

    expect(getVolunteerNotifications()[0]?.createdAt).toBe('2026-08-26T06:00:00.000Z');
  });
});
