import type { Href, ImperativeRouter as Router } from 'expo-router';

import { waitForBrandLoadingMinimum } from '@/components/ui/BrandLoadingView';
import { finalizeLiveSession } from '@/features/session-tracking/liveSessionStore';

/**
 * Finalize the live session under review and open submission confirmation.
 * Free-orientation auto-approve (`skipOrientation`) is intentionally not used —
 * every completed session waits for Admin to review.
 */
export async function finalizeAndLeaveSession(router: Pick<Router, 'dismissTo' | 'replace' | 'push'>) {
  await finalizeLiveSession({ status: 'under_review' });
  await waitForBrandLoadingMinimum();
  router.replace('/submission-confirmation' as Href);
}
