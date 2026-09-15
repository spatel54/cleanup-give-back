import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  CHECKPOINT_MISS_GRACE_MS,
  PHOTO_CHECKPOINT_INTERVAL_SECONDS,
} from './checkpointConstants';

export const CHECKPOINT_NOTIFICATIONS_CHANNEL_ID = 'photo-checkpoints-v2';

const SCHEDULED_ID_PREFIX = 'checkpoint-reminder-';

const GRACE_REMINDER_INTERVAL_SEC = 45;

async function ensureCheckpointChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(CHECKPOINT_NOTIFICATIONS_CHANNEL_ID, {
    name: 'Photo checkpoints',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400, 200, 400],
    enableVibrate: true,
    sound: 'default',
    bypassDnd: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/** Schedules due + escalating grace reminders for the current checkpoint window. */
export async function scheduleCheckpointNotifications(
  checkpointWindowStartedAt: number,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await ensureCheckpointChannel();
  await cancelCheckpointNotifications();

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted' && permissions.granted !== true) {
    return;
  }

  const dueAtMs =
    checkpointWindowStartedAt + PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000;
  const graceEndsAtMs = dueAtMs + CHECKPOINT_MISS_GRACE_MS;
  const now = Date.now();

  // iOS only allows a single custom sound + the system's default alert vibration on a
  // scheduled notification while the app is locked/backgrounded — it does not permit
  // the richer multi-pulse Taptic sequence in photoCheckpointAlert.ts to run outside the
  // foreground. This is the closest match to that in-app alert clip that iOS allows here.
  const contentBase = {
    sound: 'photo-checkpoint-alert.wav' as const,
    priority: Notifications.AndroidNotificationPriority.MAX,
    ...(Platform.OS === 'android'
      ? { channelId: CHECKPOINT_NOTIFICATIONS_CHANNEL_ID }
      : {}),
    data: { type: 'photo-checkpoint' },
  };

  if (dueAtMs > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${SCHEDULED_ID_PREFIX}due`,
      content: {
        ...contentBase,
        title: 'Checkpoint time!',
        body: 'Snap a quick photo to keep this session on track.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(dueAtMs),
      },
    });
  }

  // Grace reminders repeat on a fixed cadence while the window stays overdue —
  // tracking is never paused or force-ended for a missed checkpoint, so these
  // are just nudges, not a countdown to a consequence.
  let slot = 0;
  for (
    let fireAt = Math.max(dueAtMs, now + 2000);
    fireAt < graceEndsAtMs;
    fireAt += GRACE_REMINDER_INTERVAL_SEC * 1000
  ) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${SCHEDULED_ID_PREFIX}grace-${slot}`,
      content: {
        ...contentBase,
        title: "Don't forget your checkpoint",
        body: 'Still missing a photo for this checkpoint. Take one when you get a chance.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
      },
    });
    slot += 1;
  }
}

export async function cancelCheckpointNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (request.identifier.startsWith(SCHEDULED_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }
}

export function configureCheckpointNotificationPresentation(): void {
  if (Platform.OS === 'web') {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
