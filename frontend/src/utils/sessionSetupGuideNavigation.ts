import type { Href, ImperativeRouter as Router } from 'expo-router';
import { useEffect, useState } from 'react';

import { canUseSessionPhotos } from '@/constants/ageGate';
import { isSessionLocationReadyToSkipAsk } from '@/utils/sessionPermissions';

type StackRoute = {
  name: string;
  params?: object;
};

type NavigationRouteState = {
  index?: number;
  routes: readonly StackRoute[];
};

/** Screen the user was on before opening the Track tab / session-setup guide. */
let sessionSetupGuideReturnHref: Href | null = null;

export function resetSessionSetupGuideReturnHref() {
  sessionSetupGuideReturnHref = null;
}

export function setSessionSetupGuideReturnHref(href: Href) {
  sessionSetupGuideReturnHref = href;
}

export function getSessionSetupGuideReturnHref(): Href | null {
  return sessionSetupGuideReturnHref;
}

export function hrefFromStackRoute(route: StackRoute): Href {
  if (route.name === 'index') {
    return '/';
  }

  const pathname = route.name.startsWith('/') ? route.name : `/${route.name}`;
  const params = route.params;
  if (!params) {
    return pathname as Href;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || key === 'entry') {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return (query ? `${pathname}?${query}` : pathname) as Href;
}

export function captureSessionSetupGuideReturnHref(state: NavigationRouteState) {
  const routes = state.routes;
  const index = state.index ?? Math.max(routes.length - 1, 0);

  if (index <= 0) {
    setSessionSetupGuideReturnHref('/');
    return;
  }

  const previousRoute = routes[index - 1];
  if (!previousRoute) {
    setSessionSetupGuideReturnHref('/');
    return;
  }

  setSessionSetupGuideReturnHref(hrefFromStackRoute(previousRoute));
}

/** Leave the guide from free-hour / free-kit back to the pre-Track tab screen. */
export function exitSessionSetupGuideToTrackEntry(router: Router) {
  const returnHref = getSessionSetupGuideReturnHref();
  if (returnHref) {
    router.dismissTo(returnHref);
    return;
  }

  goBackInSessionSetupGuide(router);
}

/**
 * Active Track entry skips coachmarks / free-hour / free-kit (screens retained).
 * Use this from bottom-nav Track and empty-state CTAs.
 */
export function openSessionSetupForm(router: Router) {
  router.push('/session-setup');
}

/** Pop the guide stack so the transition swipes in the reverse direction. */
export function goBackInSessionSetupGuide(router: Router) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/');
}

/**
 * Linear Previous targets — always `replace` with the shared guide `pop` animation.
 * Skip / permission auto-skip can collapse the back stack so `router.back()` would
 * jump to Home; each step names its predecessor explicitly (same pattern as
 * `goToPreviousFromSessionSetupComplete`).
 */
export function goToSessionSetupGuide(router: Router) {
  router.replace('/session-setup-guide');
}

export function goToSessionSetupStep2(router: Router) {
  router.replace('/session-setup-step2');
}

export function goToSessionSetupStep3(router: Router) {
  router.replace('/session-setup-step3');
}

export function goToSessionSetupStep4(router: Router) {
  router.replace('/session-setup-step4');
}

/** Step 6 may be reached via Skip (replace), so Previous always targets step 5 with a pop-style replace. */
export function goToSessionSetupStep5(router: Router) {
  router.replace('/session-setup-step5');
}

export function goToSessionFreeHour(router: Router) {
  router.replace('/session-free-hour');
}

export function goToSessionFreeKit(router: Router) {
  router.replace('/session-free-kit');
}

/**
 * Destination for guide Skip — first permission screen still needed, or the
 * finale when location is already granted and camera is not required (under-18).
 * 18+ always visit Allow Camera after location, even if camera was already granted.
 */
export type SessionSetupGuideSkipHref =
  | '/session-setup-step6'
  | '/session-setup-step7'
  | '/session-setup-complete';

export async function resolveSessionSetupGuideSkipHref(): Promise<SessionSetupGuideSkipHref> {
  const locationGranted = await isSessionLocationReadyToSkipAsk();

  if (!locationGranted) {
    return '/session-setup-step6';
  }

  if (canUseSessionPhotos()) {
    return '/session-setup-step7';
  }

  return '/session-setup-complete';
}

/**
 * Skip remaining guide steps in one forward replace (same slide direction as
 * Continue). Passes `enter=forward` so step6/step7 use push-style replace
 * animation instead of the shared guide `pop` used by Previous.
 */
export async function skipSessionSetupGuideForward(router: Router) {
  const href = await resolveSessionSetupGuideSkipHref();

  if (href === '/session-setup-complete') {
    router.replace('/session-setup-complete');
    return;
  }

  router.replace({ pathname: href, params: { enter: 'forward' } } as Href);
}

/**
 * Continue from free-kit. Pushes the first needed permission screen (location
 * if still needed, else camera for 18+), or the finale when under-18 and
 * location is already granted.
 */
export async function continueFromSessionFreeKit(router: Router) {
  const href = await resolveSessionSetupGuideSkipHref();
  router.push(href);
}

/**
 * Step 7 Previous uses `goToPreviousFromSessionSetupCamera` (location if still
 * needed, else free-kit). This helper remains for explicit location hops.
 */
export function goToSessionSetupStep6(router: Router) {
  router.replace('/session-setup-step6');
}

/**
 * The guide finale may be reached via a chain of auto-skip replaces (step 6 →
 * step 7 → complete, when location/camera were already granted), which can
 * collapse or bypass the back-stack entries for those steps. Previous always
 * targets step 7 explicitly with a pop-style replace, rather than
 * `goBackInSessionSetupGuide`'s `canGoBack()` check — which can incorrectly
 * fall through to the home screen after that replace chain.
 */
export function goToSessionSetupStep7(router: Router) {
  router.replace('/session-setup-step7');
}

/**
 * Previous from Allow Camera — skip location when it was already granted
 * (step 6 auto-skips forward and would bounce back here).
 */
export async function goToPreviousFromSessionSetupCamera(router: Router) {
  const locationGranted = await isSessionLocationReadyToSkipAsk();
  if (!locationGranted) {
    goToSessionSetupStep6(router);
    return;
  }

  goToSessionSetupStep5(router);
}

/**
 * Previous from the guide finale — never `router.back()` (stack may only be
 * home → complete after auto-skip replaces). Walks backward through the
 * linear guide, skipping location when it was auto-skipped forward.
 */
export async function goToPreviousFromSessionSetupComplete(router: Router) {
  if (canUseSessionPhotos()) {
    goToSessionSetupStep7(router);
    return;
  }

  const locationGranted = await isSessionLocationReadyToSkipAsk();
  if (!locationGranted) {
    goToSessionSetupStep6(router);
    return;
  }

  goToSessionSetupStep5(router);
}

/**
 * Minimum guide steps: 5 coachmarks + free-hour + free-kit + complete.
 * Location is always in the bar. Camera is always in the bar for 18+ so
 * Allow Camera is pill 9 after Allow Location (pill 8).
 */
export const SESSION_SETUP_GUIDE_BASE_PILLS = 8;

/** 18+ bar: location + camera on top of the 8 content/finale pills. */
export const SESSION_SETUP_GUIDE_TOTAL_PILLS =
  SESSION_SETUP_GUIDE_BASE_PILLS + 2;

/**
 * Screens that share pill progress.
 *
 * Linear indices: 1–5 coachmarks → 6 free-hour → 7 free-kit → 8 location
 * → 9 camera (18+) → finale. Totals do not shrink when a permission was
 * already granted — skipped location still occupies pill 8 so camera stays
 * wired to pill 9.
 */
export type SessionSetupGuidePillScreen =
  | 'guide'
  | 'step2'
  | 'step3'
  | 'step4'
  | 'step5'
  | 'free-hour'
  | 'free-kit'
  | 'location'
  | 'camera'
  | 'complete';

/** 1-based coachmark index (guide = step 1). */
const COACHMARK_LINEAR_ACTIVE: Record<
  'guide' | 'step2' | 'step3' | 'step4' | 'step5',
  number
> = {
  guide: 1,
  step2: 2,
  step3: 3,
  step4: 4,
  step5: 5,
};

export function getSessionSetupGuideTotalPills(
  permissionScreensRemaining: number,
): number {
  return SESSION_SETUP_GUIDE_BASE_PILLS + permissionScreensRemaining;
}

function getSessionSetupPermissionScreenCount(): number {
  return 1 + (canUseSessionPhotos() ? 1 : 0);
}

function getActivePillForScreen(
  screen: SessionSetupGuidePillScreen,
  total: number,
): number {
  switch (screen) {
    case 'guide':
    case 'step2':
    case 'step3':
    case 'step4':
    case 'step5':
      return COACHMARK_LINEAR_ACTIVE[screen];
    case 'free-hour':
      return 6;
    case 'free-kit':
      return 7;
    case 'location':
      return 8;
    case 'camera':
      return 9;
    case 'complete':
      return total;
    default: {
      const _exhaustive: never = screen;
      throw new Error(`Unknown session setup pill screen: ${_exhaustive}`);
    }
  }
}

export async function getSessionSetupGuidePillProgress(
  screen: SessionSetupGuidePillScreen,
): Promise<{ total: number; active: number }> {
  const total = getSessionSetupGuideTotalPills(getSessionSetupPermissionScreenCount());
  const active = getActivePillForScreen(screen, total);

  return {
    total,
    active: Math.max(1, Math.min(total, active)),
  };
}

/** Default pill counts before the async permission check resolves (assumes both perms still ahead). */
export function getSessionSetupGuidePillProgressDefault(
  screen: SessionSetupGuidePillScreen,
): { total: number; active: number } {
  const total = SESSION_SETUP_GUIDE_TOTAL_PILLS;

  return {
    total,
    active: getActivePillForScreen(screen, total),
  };
}

export function useSessionSetupGuidePillProgress(screen: SessionSetupGuidePillScreen) {
  const [progress, setProgress] = useState(() =>
    getSessionSetupGuidePillProgressDefault(screen),
  );

  useEffect(() => {
    let cancelled = false;
    void getSessionSetupGuidePillProgress(screen).then((next) => {
      if (!cancelled) {
        setProgress(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [screen]);

  return progress;
}
