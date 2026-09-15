import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { SessionSetupGuideNavRow } from '@/components/session-setup/SessionSetupGuideNavRow';
import { staggerDelay } from '@/motion';
import { goToSessionSetupStep5, useSessionSetupGuidePillProgress } from '@/utils/sessionSetupGuideNavigation';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { canUseSessionPhotos } from '@/constants/ageGate';
import { colors as C, textStyles } from '@/constants/tokens';
import {
  isSessionLocationReadyToSkipAsk,
  requestSessionLocationPermission,
} from '@/utils/sessionPermissions';

/** PRD §6.10 · Figma `location_permission` (728:639) — session setup guide step 6. */
export function SessionSetupStep6Screen() {
  const router = useRouter();
  const { total, active } = useSessionSetupGuidePillProgress('location');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  const goToNextAfterLocation = useCallback(() => {
    if (canUseSessionPhotos()) {
      router.push('/session-setup-step7');
      return;
    }
    router.push('/session-setup-complete');
  }, [router]);

  // Location was already granted (e.g. during onboarding) — nothing to ask.
  // Jump once to Allow Camera for 18+, or the finale when photos are not used.
  useEffect(() => {
    let isMounted = true;

    void isSessionLocationReadyToSkipAsk()
      .then((locationGranted) => {
        if (!isMounted) {
          return;
        }
        if (!locationGranted) {
          setIsCheckingPermission(false);
          return;
        }
        if (canUseSessionPhotos()) {
          router.replace({
            pathname: '/session-setup-step7',
            params: { enter: 'forward' },
          });
          return;
        }
        router.replace('/session-setup-complete');
      })
      .catch(() => {
        if (isMounted) {
          setIsCheckingPermission(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleEnableLocation = useCallback(async () => {
    if (isRequesting) {
      return;
    }

    setIsRequesting(true);
    try {
      await requestSessionLocationPermission();
    } finally {
      setIsRequesting(false);
      goToNextAfterLocation();
    }
  }, [goToNextAfterLocation, isRequesting]);

  if (!fontsLoaded || isCheckingPermission) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      <View style={s.navSection}>
        <SessionSetupGuideNavRow
          total={total}
          active={active}
          onBack={() => goToSessionSetupStep5(router)}
        />
      </View>

      <CoachmarkEnter style={s.main}>
        <Image
          source={require('../../assets/images/screens/permissions/location-pin.png')}
          style={s.decorativePin}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        <CoachmarkEnter delayMs={staggerDelay(1)} style={s.headingContainer}>
          <Text style={s.title}>Allow location?</Text>
          <Text style={s.subtitle}>
            Location is used only during active cleanup sessions to verify your route. Allow Always
            access so tracking continues when the screen is locked.
          </Text>
        </CoachmarkEnter>
      </CoachmarkEnter>

      <SessionSetupGuideFooterActions
        continueLabel={isRequesting ? 'Requesting…' : 'Enable location'}
        skipLabel="Not now"
        disabled={isRequesting}
        onContinuePress={() => {
          void handleEnableLocation();
        }}
        onPreviousPress={() => goToSessionSetupStep5(router)}
        onSkipPress={goToNextAfterLocation}
      />

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  navSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 20,
  },

  main: {
    flex: 1,
    paddingHorizontal: 16,
  },

  decorativePin: {
    position: 'absolute',
    right: -32,
    top: 28,
    width: 190,
    height: 256,
    opacity: 0.75,
  },

  headingContainer: {
    marginTop: 42,
    gap: 15,
    maxWidth: 280,
    zIndex: 1,
  },

  title: {
    ...textStyles.headlinePage,
    color: C.textPrimary,
  },

  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textTertiary,
    lineHeight: 22,
  },
});
