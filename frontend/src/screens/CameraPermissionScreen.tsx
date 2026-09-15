import { CameraPermissionIllustration } from '@/components/onboarding/OnboardingIcons';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C, textStyles } from '@/features/figma-screens/tokens';
import { canUseSessionPhotos } from '@/constants/ageGate';
import { nextOnboardingAfterCamera } from '@/lib/onboardingNavigation';
import { requestSessionCameraPermission } from '@/utils/sessionPermissions';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Figma `camera_permission` (725:613) — onboarding camera step (after How it works). */
export function CameraPermissionScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  useEffect(() => {
    if (!canUseSessionPhotos()) {
      router.replace(nextOnboardingAfterCamera() as Href);
    }
  }, [router]);

  async function handleEnable() {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const result = await requestSessionCameraPermission();
      if (!result.granted && !result.canAskAgain) {
        Alert.alert(
          'Camera access is off',
          'Enable Camera for Expo Go in Settings to continue using photo checkpoints.',
          [
            {
              text: 'Not now',
              style: 'cancel',
              onPress: () => router.push(nextOnboardingAfterCamera() as Href),
            },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
    } finally {
      setIsRequesting(false);
    }
    router.push(nextOnboardingAfterCamera() as Href);
  }

  function handleNotNow() {
    router.push(nextOnboardingAfterCamera() as Href);
  }

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.illustration} pointerEvents="none">
        <CameraPermissionIllustration />
      </View>

      <View style={s.flex}>
        <View style={s.main}>
          <OnboardingProgressPills active={5} total={9} />
          <View style={s.titleSection}>
            <Text style={s.title} accessibilityRole="header">
              Allow camera?
            </Text>
            <Text style={s.subtitle}>
              Camera access is required for photo checkpoints during sessions.
            </Text>
          </View>
        </View>
      </View>

      <OnboardingInfoFooterActions
        onContinue={handleEnable}
        onPrevious={() => router.back()}
        onSkip={handleNotNow}
        continueLabel={isRequesting ? 'Requesting…' : 'Enable camera'}
        skipLabel="Not now"
        disabled={isRequesting}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  illustration: {
    position: 'absolute',
    left: '40.77%',
    top: '16%',
    width: 240,
    height: 210,
  },
  main: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 30,
  },
  titleSection: {
    gap: 15,
  },
  title: {
    ...textStyles.headlinePage,
    color: C.textPrimary,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textNavInactive,
    lineHeight: 24,
  },
});
