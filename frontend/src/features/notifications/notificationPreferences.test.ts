jest.mock('@/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isInboxDeliveryEnabled,
  parseNotificationPreferences,
} from './notificationPreferences';

describe('isInboxDeliveryEnabled', () => {
  it('treats a missing preferences object as opted-in', () => {
    expect(isInboxDeliveryEnabled(undefined, 'approvalStatus')).toBe(true);
    expect(isInboxDeliveryEnabled(null, 'sessionReviews')).toBe(true);
  });

  it('skips delivery when the key is explicitly false', () => {
    expect(isInboxDeliveryEnabled({ approvalStatus: false }, 'approvalStatus')).toBe(false);
    expect(isInboxDeliveryEnabled({ sessionReviews: false }, 'sessionReviews')).toBe(false);
  });

  it('delivers when the key is true or omitted on a saved object', () => {
    expect(isInboxDeliveryEnabled({ approvalStatus: true }, 'approvalStatus')).toBe(true);
    expect(isInboxDeliveryEnabled({ photoCheckpoints: true }, 'approvalStatus')).toBe(true);
  });
});

describe('parseNotificationPreferences', () => {
  it('defaults all keys off when nothing is stored', () => {
    expect(parseNotificationPreferences(undefined)).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('merges saved booleans onto opt-in defaults', () => {
    expect(parseNotificationPreferences({ approvalStatus: true, newEvents: true })).toEqual({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      approvalStatus: true,
      newEvents: true,
    });
  });
});
