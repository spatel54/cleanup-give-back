import * as Notifications from 'expo-notifications';
import { InteractionManager, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { SessionPermissionResult } from '@/utils/sessionPermissions';

/** Android 8+ requires a notification channel to exist before the OS will
 * show the permission prompt at all (no-op on iOS). */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function waitForInteractions(): Promise<void> {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
  if (Platform.OS === 'ios') {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

function normalizeStatus(status: string): SessionPermissionResult['status'] {
  if (status === 'granted') return 'granted';
  if (status === 'undetermined') return 'undetermined';
  return 'denied';
}

/** Reads the current notification permission status without prompting. */
export async function getSessionNotificationPermission(): Promise<SessionPermissionResult> {
  try {
    const response = await Notifications.getPermissionsAsync();
    return {
      granted: response.status === 'granted' || response.granted === true,
      canAskAgain: response.canAskAgain !== false,
      status: normalizeStatus(response.status),
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'undetermined' };
  }
}

export async function isSessionNotificationPermissionGranted(): Promise<boolean> {
  return (await getSessionNotificationPermission()).granted;
}

/** Triggers the OS notification permission dialog when allowed to ask. */
export async function requestSessionNotificationPermission(): Promise<SessionPermissionResult> {
  await waitForInteractions();
  try {
    await ensureAndroidChannel();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'denied' && existing.canAskAgain === false) {
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }

    const response = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return {
      granted: response.status === 'granted' || response.granted === true,
      canAskAgain: response.canAskAgain !== false,
      status: normalizeStatus(response.status),
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'denied' };
  }
}

/** Saves the Expo push token to user metadata. Soft-fails if Expo or Auth is unavailable. */
export async function saveExpoPushTokenIfGranted(): Promise<void> {
  if (!supabase) {
    return;
  }
  try {
    const pushToken = await Notifications.getExpoPushTokenAsync();
    if (!pushToken?.data) {
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return;
    }
    const existingMetadata = user.user_metadata || {};
    await supabase.auth.updateUser({
      data: {
        ...existingMetadata,
        push_token: pushToken.data,
      },
    });
  } catch (tokenErr) {
    console.warn('Failed to save push token:', tokenErr);
  }
}
