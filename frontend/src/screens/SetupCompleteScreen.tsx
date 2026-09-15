import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  AccountCreatedCheck,
  SuccessBlobBottomRight,
  SuccessBlobTopLeft,
} from '@/components/onboarding/OnboardingIcons';
import { prefetchTourGraphics } from '@/components/onboarding/tourAssets';
import {
  getE164Phone,
  getEmail,
  getBirthday,
  getPreferredName,
  getServiceType,
  markOnboardingComplete,
} from '@/features/onboarding/onboardingStore';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import { syncVolunteerProfile } from '@/lib/supabase';
import { enableDevSkipToHome } from '@/lib/devSkipHome';
import { durations, easing, enterFrom, modalSpring, popSpring } from '@/motion';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';

/** How far the blobs drift from their resting positions (px). */
const BLOB_DRIFT = 28;

/** Delay offsets for the sequenced entrance. */
const T_BLOB = 0;
const T_CHECK = 160;
const T_COPY = T_CHECK + durations.checkmarkPop + 60;
const T_CTA = T_COPY + durations.staggerStep * 2;

/** Figma `create_account_success` (133:93) — setup-complete after onboarding. */
export function SetupCompleteScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  // ─── Blob entrance + drift ────────────────────────────────────────────────
  const blobOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const blobTLScale = useSharedValue(reducedMotion ? 1 : 0.82);
  const blobBRScale = useSharedValue(reducedMotion ? 1 : 0.82);
  const blobTLX = useSharedValue(0);
  const blobTLY = useSharedValue(0);
  const blobBRX = useSharedValue(0);
  const blobBRY = useSharedValue(0);

  // ─── Checkmark pop ───────────────────────────────────────────────────────
  const checkScale = useSharedValue(reducedMotion ? 1 : 0);
  const checkOpacity = useSharedValue(reducedMotion ? 1 : 0);

  // ─── Copy + CTA entrance ─────────────────────────────────────────────────
  const copyOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const copyTranslateY = useSharedValue(reducedMotion ? 0 : enterFrom.translateY);
  const ctaOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const ctaTranslateY = useSharedValue(reducedMotion ? 0 : enterFrom.translateY);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  useEffect(() => {
    void prefetchTourGraphics(['shopShowcase', 'trackMap', 'homeStatsChart', 'homeStatsCards']);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const fadeTiming = { duration: durations.screenEnter, easing: easing.easeOut };
    const driftTiming = { duration: durations.modalEnter, easing: easing.easeOut };

    // 1. Blobs fade + scale in from slightly smaller
    blobOpacity.value = withDelay(T_BLOB, withTiming(1, { duration: 280, easing: easing.easeOut }));
    blobTLScale.value = withDelay(T_BLOB, withSpring(1, modalSpring));
    blobBRScale.value = withDelay(T_BLOB, withSpring(1, modalSpring));

    // After blobs settle, drift them in opposite corners for a breathing feel
    blobTLX.value = withDelay(T_BLOB + 220, withTiming(BLOB_DRIFT, driftTiming));
    blobTLY.value = withDelay(T_BLOB + 220, withTiming(BLOB_DRIFT, driftTiming));
    blobBRX.value = withDelay(T_BLOB + 220, withTiming(-BLOB_DRIFT, driftTiming));
    blobBRY.value = withDelay(T_BLOB + 220, withTiming(-BLOB_DRIFT, driftTiming));

    // 2. Checkmark pops in with spring overshoot
    checkOpacity.value = withDelay(T_CHECK, withTiming(1, { duration: 120, easing: easing.easeOut }));
    checkScale.value = withDelay(T_CHECK, withSpring(1, popSpring));

    // 3. Copy slides up + fades in
    copyOpacity.value = withDelay(T_COPY, withTiming(1, fadeTiming));
    copyTranslateY.value = withDelay(T_COPY, withTiming(0, fadeTiming));

    // 4. CTA slides up + fades in
    ctaOpacity.value = withDelay(T_CTA, withTiming(1, fadeTiming));
    ctaTranslateY.value = withDelay(T_CTA, withTiming(0, fadeTiming));
  }, [
    blobBRScale,
    blobBRX,
    blobBRY,
    blobOpacity,
    blobTLScale,
    blobTLX,
    blobTLY,
    checkOpacity,
    checkScale,
    copyOpacity,
    copyTranslateY,
    ctaOpacity,
    ctaTranslateY,
    reducedMotion,
  ]);

  const blobTLStyle = useAnimatedStyle(() => ({
    opacity: blobOpacity.value,
    transform: [
      { translateX: blobTLX.value },
      { translateY: blobTLY.value },
      { scale: blobTLScale.value },
    ],
  }));

  const blobBRStyle = useAnimatedStyle(() => ({
    opacity: blobOpacity.value,
    transform: [
      { translateX: blobBRX.value },
      { translateY: blobBRY.value },
      { scale: blobBRScale.value },
    ],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [{ translateY: copyTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <Animated.View style={[s.blobTL, blobTLStyle]} pointerEvents="none">
        <SuccessBlobTopLeft size={280} />
      </Animated.View>
      <Animated.View style={[s.blobBR, blobBRStyle]} pointerEvents="none">
        <SuccessBlobBottomRight size={280} />
      </Animated.View>

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.content}>
          <Animated.View
            style={checkStyle}
            accessibilityRole="image"
            accessibilityLabel="Success"
          >
            <AccountCreatedCheck width={95} height={75} />
          </Animated.View>

          <Animated.View style={[s.copy, copyStyle]}>
            <Text style={s.title}>Your account was created!</Text>
            <Text style={s.subtitle}>You're ready to start cleaning up and giving back.</Text>
          </Animated.View>
        </View>

        <Animated.View style={ctaStyle}>
          <AnimatedPressable
            style={s.continueBtn}
            onPress={() => {
              markOnboardingComplete();
              // TEMP __DEV__: TEMP Welcome → How it works has no session; Home gate
              // otherwise Redirects to /welcome. Safe no-op when already registered.
              enableDevSkipToHome();
              void syncVolunteerProfile({
                preferredName: getPreferredName(),
                email: getEmail(),
                phone: getE164Phone(),
                serviceType: getServiceType() ?? undefined,
                birthday: getBirthday(),
                onboardingComplete: true,
              });
              router.replace('/' as Href);
            }}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={s.continueBtnText}>Continue</Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.primary,
    overflow: 'hidden',
  },
  blobTL: {
    position: 'absolute',
    left: -180,
    top: -160,
  },
  blobBR: {
    position: 'absolute',
    right: -140,
    bottom: -80,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 19,
    paddingBottom: 40,
  },
  copy: {
    alignItems: 'center',
    gap: 19,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    color: C.textOnPrimarySoft,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textOnPrimary,
    textAlign: 'center',
  },
  continueBtn: {
    backgroundColor: C.bgApp,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  continueBtnText: {
    ...textStyles.labelButtonLarge,
    color: C.primary,
  },
});
