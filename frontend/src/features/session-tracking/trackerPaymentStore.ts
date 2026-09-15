import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * One free hour of live tracking before the paywall (Figma `free_trial_done`).
 * In `__DEV__`, set `EXPO_PUBLIC_FREE_TRIAL_SECONDS` (e.g. `60`) to shorten QA.
 * Company codes and checkout call `markTrackerPaid()` to remove the free-hour limit.
 */
export const FREE_TRIAL_DURATION_SECONDS = (() => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const fromEnv = Number(process.env.EXPO_PUBLIC_FREE_TRIAL_SECONDS);
    if (Number.isFinite(fromEnv) && fromEnv > 0) {
      return fromEnv;
    }
  }
  return 60 * 60;
})();

const STORAGE_KEY = '@cugb/trackerHasPaid';
const ORIENTATION_TRIAL_STORAGE_KEY = '@cugb/orientationTrialConsumed';

/** Prototype flag — set after tracker payment or company code upgrade. */
let hasPaid = false;
let orientationTrialConsumed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

let hydratePromise: Promise<void> | null = null;

/** Load persisted paid + orientation-trial flags once at app start. */
export function hydrateTrackerPaymentStore(): Promise<void> {
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const [paidRaw, trialRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(ORIENTATION_TRIAL_STORAGE_KEY),
        ]);
        let changed = false;
        if (paidRaw === '1') {
          hasPaid = true;
          changed = true;
        }
        if (trialRaw === '1') {
          orientationTrialConsumed = true;
          changed = true;
        }
        if (changed) {
          notify();
        }
      } catch {
        // Ignore storage failures; in-memory flags still work for the session.
      }
    })();
  }
  return hydratePromise;
}

void hydrateTrackerPaymentStore();

export function getTrackerHasPaid(): boolean {
  return hasPaid;
}

export function markTrackerPaid(): void {
  if (hasPaid) return;
  hasPaid = true;
  notify();
  void AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
}

export function getOrientationTrialConsumed(): boolean {
  return orientationTrialConsumed;
}

export function markOrientationTrialConsumed(): void {
  if (orientationTrialConsumed) return;
  orientationTrialConsumed = true;
  notify();
  void AsyncStorage.setItem(ORIENTATION_TRIAL_STORAGE_KEY, '1').catch(() => {});
}

/**
 * Pre-track `/tracker-paywall` is hidden from the active path — Track goes
 * straight to session setup. Route + FreeTrialModal stay for later re-enable.
 * Dev-only: `EXPO_PUBLIC_BYPASS_SECOND_TRACK_PAYWALL=1` was the old QA skip.
 */
export function needsTrackerPaymentBeforeTrack(): boolean {
  return false;
}

/** Seconds left in the free hour for an unpaid tracker session. */
export function getFreeTrialSecondsRemaining(elapsedSeconds: number): number {
  return Math.max(0, FREE_TRIAL_DURATION_SECONDS - elapsedSeconds);
}

/** True when unpaid session elapsed time has reached the free-hour limit. */
export function isFreeTrialExpired(elapsedSeconds: number): boolean {
  return elapsedSeconds >= FREE_TRIAL_DURATION_SECONDS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTrackerHasPaid(): boolean {
  return useSyncExternalStore(subscribe, getTrackerHasPaid, getTrackerHasPaid);
}

export function useOrientationTrialConsumed(): boolean {
  return useSyncExternalStore(
    subscribe,
    getOrientationTrialConsumed,
    getOrientationTrialConsumed,
  );
}

export function useNeedsTrackerPaymentBeforeTrack(): boolean {
  return useSyncExternalStore(
    subscribe,
    needsTrackerPaymentBeforeTrack,
    needsTrackerPaymentBeforeTrack,
  );
}

/**
 * @deprecated Prefer `redeemCompanyCode` from `@/lib/companyCodesApi`.
 * Kept for local demo / Account Membership (hidden) fallback.
 */
export const COMPANY_UPGRADE_CODES = new Set([
  '1234567890',
  '9876543210',
  '5555555555',
]);

export function isValidCompanyCode(code: string): boolean {
  return COMPANY_UPGRADE_CODES.has(code.trim());
}

/** Clears paid/trial flags so the next volunteer on this device does not inherit them. */
export function resetTrackerPaymentStore(): void {
  hasPaid = false;
  orientationTrialConsumed = false;
  hydratePromise = null;
  notify();
  void Promise.all([
    AsyncStorage.removeItem(STORAGE_KEY),
    AsyncStorage.removeItem(ORIENTATION_TRIAL_STORAGE_KEY),
  ]);
}
