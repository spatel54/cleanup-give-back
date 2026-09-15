import type { ImperativeRouter as Router } from 'expo-router';

import { colors } from '@/features/figma-screens/tokens';

/**
 * Requests a fade-in the next time Home (`/`) gains focus.
 * Used by tour finale and submission-confirmation "Go Home".
 *
 * (Previously also used after session-start photo Cancel via `/hold-on`;
 * that Cancel path now returns to Session Setup instead.)
 */
let pendingHomeFadeIn = false;
/** Skip the post-boot homeOpacity 0→1 when Cancel / hold-on lands on Home. */
let pendingHomeInstant = false;

export type HomeTransitionCoverPhase =
  | 'hidden'
  | 'fading-in'
  | 'visible'
  | 'fading-out';

let coverPhase: HomeTransitionCoverPhase = 'hidden';
const coverListeners = new Set<() => void>();

let fadeInResolver: (() => void) | null = null;
let fadeOutResolver: (() => void) | null = null;

function notifyCoverListeners() {
  for (const listener of coverListeners) {
    listener();
  }
}

export function requestHomeFadeIn() {
  pendingHomeFadeIn = true;
  pendingHomeInstant = false;
}

export function requestHomeInstant() {
  pendingHomeInstant = true;
  pendingHomeFadeIn = false;
}

export function consumeHomeFadeIn(): boolean {
  if (!pendingHomeFadeIn) {
    return false;
  }
  pendingHomeFadeIn = false;
  return true;
}

export function consumeHomeInstant(): boolean {
  if (!pendingHomeInstant) {
    return false;
  }
  pendingHomeInstant = false;
  return true;
}

export function getHomeTransitionCoverPhase(): HomeTransitionCoverPhase {
  return coverPhase;
}

export function subscribeHomeTransitionCover(listener: () => void): () => void {
  coverListeners.add(listener);
  return () => {
    coverListeners.delete(listener);
  };
}

export function fadeInHomeTransitionCover(): Promise<void> {
  if (coverPhase === 'visible') {
    return Promise.resolve();
  }
  if (coverPhase === 'fading-in') {
    return new Promise((resolve) => {
      const previous = fadeInResolver;
      fadeInResolver = () => {
        previous?.();
        resolve();
      };
    });
  }
  return new Promise((resolve) => {
    fadeInResolver = resolve;
    coverPhase = 'fading-in';
    notifyCoverListeners();
  });
}

export function fadeOutHomeTransitionCover(): Promise<void> {
  if (coverPhase === 'hidden') {
    return Promise.resolve();
  }
  if (coverPhase === 'fading-out') {
    return new Promise((resolve) => {
      const previous = fadeOutResolver;
      fadeOutResolver = () => {
        previous?.();
        resolve();
      };
    });
  }
  return new Promise((resolve) => {
    fadeOutResolver = resolve;
    coverPhase = 'fading-out';
    notifyCoverListeners();
  });
}

export function notifyHomeTransitionCoverFadeInDone() {
  coverPhase = 'visible';
  notifyCoverListeners();
  const resolve = fadeInResolver;
  fadeInResolver = null;
  resolve?.();
}

export function notifyHomeTransitionCoverFadeOutDone() {
  coverPhase = 'hidden';
  notifyCoverListeners();
  const resolve = fadeOutResolver;
  fadeOutResolver = null;
  resolve?.();
}

export function requestHomeTransitionCoverFadeOut() {
  void fadeOutHomeTransitionCover();
}

export function completeHomeTransitionCoverFadeOut() {
  notifyHomeTransitionCoverFadeOutDone();
}

export function hideHomeTransitionCover() {
  coverPhase = 'hidden';
  notifyCoverListeners();
  fadeInResolver?.();
  fadeInResolver = null;
  fadeOutResolver?.();
  fadeOutResolver = null;
}

type CancelNavigation = {
  dispatch: (action: { type: string; payload?: object }) => void;
  setOptions?: (options: Record<string, unknown>) => void;
};

/**
 * Legacy: abort session-start photo capture → Hold On bridge → Home.
 * Session-start Cancel now `dismissTo('/session-setup')` instead; keep this
 * helper only if a future flow needs the Hold On bridge again.
 */
export function cancelSessionStartToHome(
  navigation: CancelNavigation,
  _router?: Router,
) {
  navigation.setOptions?.({
    animation: 'none',
    contentStyle: { backgroundColor: colors.bgApp },
  });

  navigation.dispatch({
    type: 'RESET',
    payload: {
      index: 0,
      routes: [{ name: 'hold-on' }],
    },
  });
}
