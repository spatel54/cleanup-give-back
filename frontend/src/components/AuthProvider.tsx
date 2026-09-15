import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import {
  hydrateVolunteerNotifications,
  startVolunteerNotificationsRealtime,
  stopVolunteerNotificationsRealtime,
} from '@/features/notifications/volunteerNotificationsStore';
import {
  hydrateOnboardingComplete,
  markOnboardingComplete,
} from '@/features/onboarding/onboardingStore';
import { hydrateMapThemeSettings } from '@/features/session-tracking/mapThemeStore';
import { hydrateRecentSessionsFromApi } from '@/features/session-tracking/recentSessionsStore';
import { hydrateImpactFeedFromApi, hydrateImpactFeedFromStorage } from '@/features/session-tracking/impactFeedStore';
import { hydrateVolunteerDeletedSessions } from '@/features/session-tracking/volunteerDeletedSessions';
import { hydrateDownloadedLettersFromStorage } from '@/features/session-tracking/downloadedLettersStore';
import { hydrateSessionNotesFromStorage } from '@/features/session-tracking/sessionNotesStore';
import { hydrateSessionStatsFromApi, hydrateSessionStatsFromStorage } from '@/features/session-tracking/sessionStatsStore';
import { isRegisteredSession, userHasCompletedOnboarding } from '@/lib/authHelpers';
import { applyVolunteerProfileFromUser } from '@/lib/volunteerAuthNavigation';
import {
  discardAnonymousSession,
  getCurrentSession,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';

type AuthContextValue = {
  ready: boolean;
  configured: boolean;
  isRegistered: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  ready: true,
  configured: false,
  isRegistered: false,
});

export function useAuthReady() {
  return use(AuthContext);
}

async function hydrateVolunteerData(): Promise<void> {
  await hydrateVolunteerDeletedSessions();
  await hydrateRecentSessionsFromApi();
  await hydrateSessionStatsFromApi();
  await hydrateImpactFeedFromApi();
  await hydrateVolunteerNotifications();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    void hydrateMapThemeSettings();
  }, []);

  useEffect(() => {
    void hydrateVolunteerDeletedSessions();
    void hydrateSessionStatsFromStorage();
    void hydrateImpactFeedFromStorage();
    void hydrateSessionNotesFromStorage();
    void hydrateDownloadedLettersFromStorage();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      void hydrateOnboardingComplete().finally(() => setReady(true));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await hydrateOnboardingComplete();
        await discardAnonymousSession();
        const session = await getCurrentSession();
        if (cancelled) {
          return;
        }
        const registered = isRegisteredSession(session);
        setIsRegistered(registered);
        applyVolunteerProfileFromUser(session?.user);
        if (userHasCompletedOnboarding(session?.user)) {
          markOnboardingComplete();
        }
        if (registered) {
          await hydrateVolunteerData();
          if (!cancelled) {
            await startVolunteerNotificationsRealtime();
          }
        }
      } catch (error) {
        console.warn('[auth] bootstrap failed:', error);
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) {
        return;
      }
      const registered = isRegisteredSession(session);
      setIsRegistered(registered);
      if (userHasCompletedOnboarding(session?.user)) {
        markOnboardingComplete();
      }
      if (event === 'SIGNED_IN' && registered) {
        void hydrateVolunteerData().then(() => {
          if (!cancelled) {
            return startVolunteerNotificationsRealtime();
          }
        });
      }
      if (event === 'SIGNED_OUT') {
        stopVolunteerNotificationsRealtime();
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
      stopVolunteerNotificationsRealtime();
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <AuthContext value={{ ready, configured: isSupabaseConfigured, isRegistered }}>
      {children}
    </AuthContext>
  );
}
