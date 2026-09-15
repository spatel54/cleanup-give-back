import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useFonts } from 'expo-font';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { CheckCircleIcon } from '@/features/session-tracking/components/icons/CheckCircleIcon';
import { easing, popSpring, staggerDelay } from '@/motion';

import { colors as tokens, radius, textStyles } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  bgSurface: tokens.white,
  primary: tokens.primary,
  primaryBorder: tokens.primary,
  textPrimary: tokens.textPrimary,
  textSecondary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
} as const;

const CHECK_SIZE = 84;

/**
 * Hand-designed — no Figma source. Sits between `FeedbackScreen`'s "Submit" and
 * `SubmissionConfirmationScreen`, giving the user a distinct acknowledgment moment
 * before landing on the session review. Reuses `FeedbackScreen`'s centered-card shell
 * for visual continuity with the screen that leads into it.
 */
export function FeedbackThankYouScreen() {
  const router = useRouter();
  const { returnTo, id } = useLocalSearchParams<{ returnTo?: string; id?: string }>();
  const reducedMotion = useReducedMotion();

  const titleStyle = useFadeUpEnter(staggerDelay(1));
  const ctaStyle = useFadeUpEnter(staggerDelay(2));

  const checkScale = useSharedValue(reducedMotion ? 1 : 0);
  const checkOpacity = useSharedValue(reducedMotion ? 1 : 0);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  useEffect(() => {
    if (reducedMotion) return;
    checkOpacity.value = withDelay(
      120,
      withTiming(1, { duration: 120, easing: easing.easeOut }),
    );
    checkScale.value = withDelay(120, withSpring(1, popSpring));
  }, [reducedMotion, checkOpacity, checkScale]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  function handleContinue() {
    if (returnTo === 'account') {
      // Pop feedback + thank-you so Account is not buried under stale stack entries.
      router.dismissTo('/account');
      return;
    }
    if (returnTo === 'session-detail' && typeof id === 'string' && id.length > 0) {
      const href = `/session-detail?id=${encodeURIComponent(id)}` as Href;
      try {
        router.dismissTo(href);
      } catch {
        router.replace(href);
      }
      return;
    }
    // Session path: confirmation → feedback → thank-you. Dismiss back to the
    // original confirmation so Back does not reopen the feedback form.
    router.dismissTo('/submission-confirmation');
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.center}>
        <View style={s.card}>
          <Animated.View
            style={checkStyle}
            accessibilityRole="image"
            accessibilityLabel="Feedback submitted"
          >
            <CheckCircleIcon color={C.primary} size={CHECK_SIZE} />
          </Animated.View>

          <Animated.View style={[s.textBlock, titleStyle]}>
            <Text style={s.title}>Thank you for your feedback!</Text>
            <Text style={s.subtitle}>
              We read every response. It helps us keep improving Clean Up - Give Back
              for everyone.
            </Text>
          </Animated.View>

          <Animated.View style={[s.ctaWrapper, ctaStyle]}>
            <AnimatedPressable
              style={s.continueButton}
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <Text style={s.continueLabel}>Continue</Text>
            </AnimatedPressable>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    paddingHorizontal: 25,
    paddingVertical: 32,
    gap: 20,
    alignItems: 'center',
  },
  textBlock: {
    width: '100%',
    gap: 8,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: C.textSecondary,
    textAlign: 'center',
  },
  ctaWrapper: {
    width: '100%',
  },
  continueButton: {
    width: '100%',
    height: 59,
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    ...textStyles.labelButton,
    color: C.textOnPrimary,
  },
});
