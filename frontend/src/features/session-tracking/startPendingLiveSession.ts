import { canUseSessionPhotos } from '@/constants/ageGate';
import { consumePendingSessionSetupForm } from '@/features/session-tracking/pendingSessionSetup';
import { startNewLiveSession } from '@/features/session-tracking/liveSessionStore';

/** Starts the pending setup form as a live session (with or without photos). */
export async function startPendingLiveSession(): Promise<boolean> {
  const setup = consumePendingSessionSetupForm();
  if (!setup) {
    return false;
  }

  await startNewLiveSession(
    {
      activity: setup.activity,
      date: new Date(setup.dateIso),
      courtOrdered: setup.courtOrdered,
      description: setup.description,
    },
    { photosEnabled: canUseSessionPhotos() },
  );
  return true;
}
