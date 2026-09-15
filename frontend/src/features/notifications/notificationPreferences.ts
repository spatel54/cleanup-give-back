import { supabase } from '@/lib/supabase';
import type { NotificationPreferenceKey } from '@/features/figma-screens/mocks/notifications';

export type NotificationPreferenceMap = Record<NotificationPreferenceKey, boolean>;

const PREFERENCE_KEYS: NotificationPreferenceKey[] = [
  'sessionReviews',
  'approvalStatus',
  'photoCheckpoints',
  'newEvents',
  'shopOrders',
];

/**
 * Display defaults when no `notification_preferences` object is saved.
 * Match delivery: missing object is treated as opted-in (`!== false`).
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferenceMap = {
  sessionReviews: true,
  approvalStatus: true,
  photoCheckpoints: true,
  newEvents: true,
  shopOrders: true,
};

export function isNotificationPreferencesRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Delivery gate: skip inbox+push only when the key is explicitly false.
 * If the preferences object is missing, treat as opted-in for session status
 * (approvalStatus true) so existing users still get approve/decline.
 */
export function isInboxDeliveryEnabled(
  stored: unknown,
  key: NotificationPreferenceKey,
): boolean {
  if (!isNotificationPreferencesRecord(stored)) {
    return true;
  }
  return stored[key] !== false;
}

export function parseNotificationPreferences(raw: unknown): NotificationPreferenceMap {
  if (!isNotificationPreferencesRecord(raw)) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  const next: NotificationPreferenceMap = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (const key of PREFERENCE_KEYS) {
    if (typeof raw[key] === 'boolean') {
      next[key] = raw[key];
    }
  }
  return next;
}

export async function loadNotificationPreferences(): Promise<NotificationPreferenceMap> {
  if (!supabase) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  const { data } = await supabase.auth.getUser();
  return parseNotificationPreferences(data.user?.user_metadata?.notification_preferences);
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferenceMap,
): Promise<void> {
  if (!supabase) {
    return;
  }
  const { error } = await supabase.auth.updateUser({
    data: { notification_preferences: preferences },
  });
  if (error) {
    console.warn('[notifications] failed to save preferences:', error.message);
  }
}
