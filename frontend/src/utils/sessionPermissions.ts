import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { InteractionManager, Platform } from 'react-native';

import { isExpoGoClient } from '@/utils/isExpoGoClient';

export type SessionPermissionResult = {
  granted: boolean;
  /** Whether the OS may show (or just showed) its permission dialog. */
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
};

/** Yield to the UI thread so the native permission sheet isn't blocked by the press animation. */
async function waitForInteractions(): Promise<void> {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
  // Small extra beat on iOS — Expo Go sometimes swallows the sheet if request
  // runs in the same turn as the button press / navigation prep.
  if (Platform.OS === 'ios') {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

function normalizeStatus(status: string): SessionPermissionResult['status'] {
  if (status === 'granted') return 'granted';
  if (status === 'undetermined') return 'undetermined';
  return 'denied';
}

/** Reads location permission without prompting. */
export async function getSessionLocationPermission(): Promise<SessionPermissionResult> {
  try {
    const response = await Location.getForegroundPermissionsAsync();
    return {
      granted: response.status === Location.PermissionStatus.GRANTED,
      canAskAgain: response.canAskAgain !== false,
      status: normalizeStatus(response.status),
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'undetermined' };
  }
}

/** Reads camera permission without prompting. */
export async function getSessionCameraPermission(): Promise<SessionPermissionResult> {
  try {
    const response = await Camera.getCameraPermissionsAsync();
    return {
      granted: response.granted === true,
      canAskAgain: response.canAskAgain !== false,
      status: normalizeStatus(response.status),
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'undetermined' };
  }
}

export async function isSessionLocationPermissionGranted(): Promise<boolean> {
  return (await getSessionLocationPermission()).granted;
}

/** Reads Always / background location without prompting. Expo Go is always false. */
export async function isSessionAlwaysLocationGranted(): Promise<boolean> {
  if (isExpoGoClient()) {
    return false;
  }

  try {
    const response = await Location.getBackgroundPermissionsAsync();
    return response.status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Whether we can skip asking for location again.
 * Store/EAS builds need Always so lock-screen tracking works; Expo Go is When In Use only.
 */
export async function isSessionLocationReadyToSkipAsk(): Promise<boolean> {
  if (isExpoGoClient()) {
    return isSessionLocationPermissionGranted();
  }
  return isSessionAlwaysLocationGranted();
}

/**
 * Asks for Always after When In Use. Skipped in Expo Go (no background entitlement).
 */
export async function requestSessionAlwaysLocationIfPossible(): Promise<boolean> {
  if (isExpoGoClient()) {
    return false;
  }

  try {
    const existing = await Location.getBackgroundPermissionsAsync();
    if (existing.status === Location.PermissionStatus.GRANTED) {
      return true;
    }
    if (
      existing.status === Location.PermissionStatus.DENIED &&
      existing.canAskAgain === false
    ) {
      return false;
    }

    await waitForInteractions();
    const response = await Location.requestBackgroundPermissionsAsync();
    return response.status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

export async function isSessionCameraPermissionGranted(): Promise<boolean> {
  return (await getSessionCameraPermission()).granted;
}

/**
 * Triggers the OS location permission dialog when status is still undetermined
 * (or when the platform says we can ask again).
 *
 * Always calls `requestForegroundPermissionsAsync` unless iOS/Android says we
 * cannot ask again — Expo Go scopes grants per experience, so skipping when a
 * prior `get()` looks granted can hide the prompt entirely.
 */
export async function requestSessionLocationPermission(): Promise<SessionPermissionResult> {
  await waitForInteractions();
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    if (
      existing.status === Location.PermissionStatus.DENIED &&
      existing.canAskAgain === false
    ) {
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }

    const response = await Location.requestForegroundPermissionsAsync();
    const granted = response.status === Location.PermissionStatus.GRANTED;
    if (granted) {
      await requestSessionAlwaysLocationIfPossible();
    }
    return {
      granted,
      canAskAgain: response.canAskAgain !== false,
      status: normalizeStatus(response.status),
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'denied' };
  }
}

/**
 * Triggers the OS camera permission dialog when allowed to ask.
 * Always requests unless the platform says we cannot ask again (see location note).
 */
export async function requestSessionCameraPermission(): Promise<SessionPermissionResult> {
  await waitForInteractions();
  try {
    const existing = await Camera.getCameraPermissionsAsync();
    if (existing.status === 'denied' && existing.canAskAgain === false) {
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }

    const response = await Camera.requestCameraPermissionsAsync();
    return {
      granted: response.granted === true,
      canAskAgain: response.canAskAgain !== false,
      status: normalizeStatus(response.status),
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'denied' };
  }
}
