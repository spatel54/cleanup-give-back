import { Redirect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/features/figma-screens/tokens';
import { markOnboardingComplete } from '@/features/onboarding/onboardingStore';
import { completeOAuthFromUrl } from '@/lib/auth';
import { userHasCompletedOnboarding } from '@/lib/authHelpers';
import { destinationAfterAuth } from '@/lib/volunteerAuthNavigation';

/** Deep-link landing for Supabase OAuth when the browser returns to the app. */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const session = await completeOAuthFromUrl(url);
        if (cancelled) {
          return;
        }
        if (session && userHasCompletedOnboarding(session.user)) {
          markOnboardingComplete();
        }
        router.replace(destinationAfterAuth(session));
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, router]);

  if (failed) {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={s.root}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
