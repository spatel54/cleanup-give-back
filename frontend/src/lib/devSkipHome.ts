/**
 * TEMP (__DEV__ only): bypass Welcome / onboarding gates so Home can open
 * without a real session. Remove when QA is done.
 */

let forceHome = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Enable the Home gate bypass for this JS session. */
export function enableDevSkipToHome(): void {
  if (!__DEV__) {
    return;
  }
  forceHome = true;
  notify();
}

export function isDevSkipToHomeEnabled(): boolean {
  return __DEV__ && forceHome;
}

export function subscribeDevSkipToHome(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
