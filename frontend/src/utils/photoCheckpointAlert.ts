import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

const ALERT_SOUND = require('../../assets/sounds/photo-checkpoint-alert.wav');

/** Four long, hard bursts — deliberately insistent so it can't be missed. */
const ANDROID_VIBRATE_PATTERN = [0, 450, 150, 450, 150, 450, 150, 450] as const;

const LOAD_TIMEOUT_MS = 4000;
// Below the 5s "ignored" escalation cadence in CheckpointAlertLoop, so those
// reminders never get silently swallowed by this throttle.
const MIN_ALERT_INTERVAL_MS = 4_000;

let audioModeReady = false;
let alertPlayer: AudioPlayer | null = null;
let preloadPromise: Promise<AudioPlayer> | null = null;
let lastAlertAt = 0;

async function ensureAlertAudioMode() {
  if (audioModeReady) {
    return;
  }

  await setIsAudioActiveAsync(true);
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
    allowsRecording: false,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  });
  audioModeReady = true;
}

function waitForPlayerLoaded(player: AudioPlayer, timeoutMs: number): Promise<void> {
  if (player.isLoaded) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      subscription.remove();
      resolve();
    }, timeoutMs);

    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded) {
        clearTimeout(timeout);
        subscription.remove();
        resolve();
      }
    });
  });
}

async function ensureAlertPlayerLoaded(): Promise<AudioPlayer> {
  if (alertPlayer?.isLoaded) {
    return alertPlayer;
  }

  if (!preloadPromise) {
    preloadPromise = (async () => {
      await ensureAlertAudioMode();
      const player = createAudioPlayer(ALERT_SOUND, { downloadFirst: true });
      await waitForPlayerLoaded(player, LOAD_TIMEOUT_MS);
      alertPlayer = player;
      return player;
    })();
  }

  return preloadPromise;
}

/** Warm the alert clip so the first due ping plays immediately. */
export async function preloadPhotoCheckpointAlert(): Promise<void> {
  try {
    await ensureAlertPlayerLoaded();
  } catch (error) {
    console.warn('[photo-checkpoint] preload failed:', error);
  }
}

async function playAlertHaptics() {
  // Fire a baseline OS vibration immediately, on every platform, regardless of
  // whether the Haptics engine below succeeds — guarantees something is felt
  // even if Taptic Engine calls get throttled by the OS from repeated firing.
  Vibration.vibrate(Platform.OS === 'android' ? [...ANDROID_VIBRATE_PATTERN] : undefined);

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  await new Promise((resolve) => setTimeout(resolve, 220));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise((resolve) => setTimeout(resolve, 220));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise((resolve) => setTimeout(resolve, 220));
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

async function playAlertSound() {
  const player = await ensureAlertPlayerLoaded();
  player.volume = 1;
  player.muted = false;

  if (player.currentTime > 0) {
    await player.seekTo(0);
  }

  player.play();
}

/**
 * Sound + haptic feedback when the 30-minute photo checkpoint is due and the
 * in-app photo-required popup is about to appear.
 * Pass `{ force: true }` to bypass the repeat throttle (e.g. free-trial expiry).
 */
export async function alertPhotoCheckpointDue(options?: {
  force?: boolean;
}): Promise<void> {
  const now = Date.now();
  if (!options?.force && now - lastAlertAt < MIN_ALERT_INTERVAL_MS) {
    return;
  }
  lastAlertAt = now;

  await Promise.all([
    playAlertSound().catch((error) => {
      console.warn('[photo-checkpoint] alert sound failed:', error);
    }),
    playAlertHaptics().catch(() => {
      Vibration.vibrate([...ANDROID_VIBRATE_PATTERN]);
    }),
  ]);
}
