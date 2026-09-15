import type { Href, ImperativeRouter as Router } from 'expo-router';

import {
  hydrateTrackerPaymentStore,
  needsTrackerPaymentBeforeTrack,
} from '@/features/session-tracking/trackerPaymentStore';

/**
 * Await storage hydrate, then allow Track → session setup.
 * Pre-track `/tracker-paywall` is currently hidden (`needsTrackerPaymentBeforeTrack` always false).
 */
export async function ensureTrackerAccessOrPaywall(router: Router): Promise<boolean> {
  await hydrateTrackerPaymentStore();
  if (!needsTrackerPaymentBeforeTrack()) {
    return true;
  }
  router.push('/tracker-paywall' as Href);
  return false;
}
