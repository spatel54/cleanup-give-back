import { clearCart } from '@/features/figma-screens/cartStore';
import { resetVolunteerNotifications } from '@/features/notifications/volunteerNotificationsStore';
import { clearOnboardingSignupData } from '@/features/onboarding/onboardingStore';
import { resetCompletedSessionCache } from '@/features/session-tracking/completedSessionCache';
import { resetDownloadedLetters } from '@/features/session-tracking/downloadedLettersStore';
import { resetImpactFeed } from '@/features/session-tracking/impactFeedStore';
import { endLiveSession } from '@/features/session-tracking/liveSessionStore';
import { clearPendingSessionSetup } from '@/features/session-tracking/pendingSessionSetup';
import { resetRecentSessions } from '@/features/session-tracking/recentSessionsStore';
import { resetSessionNotes } from '@/features/session-tracking/sessionNotesStore';
import { resetSessionStats } from '@/features/session-tracking/sessionStatsStore';
import { resetTrackerPaymentStore } from '@/features/session-tracking/trackerPaymentStore';
import { clearVolunteerDeletedSessions } from '@/features/session-tracking/volunteerDeletedSessions';
import { apiFetch, isApiConfigured } from '@/lib/api';
import { clearCachedProfilePhoto } from '@/lib/profilePhoto';
import { signOutCurrentUser } from '@/lib/supabase';

export {
  ACCOUNT_DELETE_CONFIRM_WORD,
  isAccountDeleteConfirmed,
} from '@/lib/accountDeletionConfirm';

export async function clearVolunteerDeviceState(): Promise<void> {
  endLiveSession();
  clearPendingSessionSetup();
  resetRecentSessions();
  resetImpactFeed();
  resetSessionStats();
  resetSessionNotes();
  resetCompletedSessionCache();
  resetVolunteerNotifications();
  clearCart();
  resetTrackerPaymentStore();
  clearOnboardingSignupData();
  await Promise.all([
    clearVolunteerDeletedSessions(),
    clearCachedProfilePhoto(),
    resetDownloadedLetters(),
  ]);
}

export async function logOutVolunteer(): Promise<void> {
  await clearVolunteerDeviceState();
  await signOutCurrentUser();
}

export type DeleteVolunteerAccountResult = {
  courtLogsRetained: boolean;
};

export async function deleteVolunteerAccount(): Promise<DeleteVolunteerAccountResult> {
  if (!isApiConfigured) {
    throw new Error('Could not delete your account. Try again when you have a connection.');
  }
  try {
    const result = await apiFetch<DeleteVolunteerAccountResult>('/users/me', {
      method: 'DELETE',
    });
    await clearVolunteerDeviceState();
    await signOutCurrentUser({ localOnly: true });
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API ')) {
      throw new Error('Could not delete your account. Try again.');
    }
    throw error;
  }
}
