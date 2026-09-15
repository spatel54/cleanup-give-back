import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { TourReplayIcon, TourSetStar } from '@/components/onboarding/TourIcons';
import { requestHomeFadeIn } from '@/features/onboarding/homeEnterTransition';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import { durations, easing, staggerDelay } from '@/motion';

const STAR_ENTER_MS = durations.screenEnter;
/** Hold an empty hero before mounting stars — avoids first-paint flash. */
const STAR_INITIAL_DELAY_MS = 450;
const STAR_STAGGER_MS = durations.staggerStep * 2;

type StarLayout = {
  style: StyleProp<ViewStyle>;
  rotate: number;
  width: number;
  height: number;
};

/** Absolute positions relative to `copyBlock` padding — outside the text. */
const starPos = StyleSheet.create({
  top: {
    top: 4,
    alignSelf: 'center',
  },
  tl: {
    left: 0,
    top: 36,
  },
  tr: {
    right: 0,
    top: 28,
  },
  ml: {
    left: 0,
    bottom: 28,
  },
  mr: {
    right: 0,
    bottom: 28,
  },
  bottom: {
    bottom: 4,
    alignSelf: 'center',
  },
});

/**
 * Stars orbit the copy block with clear padding so they never sit on the title/subtitle.
 * Order = fade-in sequence (top → corners → sides → bottom).
 */
const STARS: StarLayout[] = [
  { style: starPos.top, rotate: 30, width: 36, height: 26 },
  { style: starPos.tl, rotate: -17, width: 42, height: 31 },
  { style: starPos.tr, rotate: 30, width: 42, height: 31 },
  { style: starPos.ml, rotate: 30, width: 36, height: 26 },
  { style: starPos.mr, rotate: 30, width: 36, height: 26 },
  { style: starPos.bottom, rotate: 30, width: 36, height: 26 },
];

function AnimatedSetStar({ index, layout }: { index: number; layout: StarLayout }) {
  const reducedMotion = useReducedMotion();
  // Always start hidden; parent only mounts us after the empty-hero hold (or reduced motion).
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0;
    opacity.value = withDelay(
      staggerDelay(index, STAR_STAGGER_MS),
      withTiming(1, { duration: STAR_ENTER_MS, easing: easing.easeOut }),
    );
  }, [index, opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        s.star,
        layout.style,
        { transform: [{ rotate: `${layout.rotate}deg` }], opacity: 0 },
        animatedStyle,
      ]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <TourSetStar width={layout.width} height={layout.height} />
    </Animated.View>
  );
}

/** Mount stars only after the empty-hero hold so nothing paints on first frame. */
function SetTourStars() {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(!!reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setMounted(true);
      return;
    }
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), STAR_INITIAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {STARS.map((layout, index) => (
        <AnimatedSetStar key={index} index={index} layout={layout} />
      ))}
    </>
  );
}

/** Figma `set_tour` (112:7170) — onboarding tour finale. */
export function SetTourScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const rootOpacity = useSharedValue(1);
  const isLeaving = useRef(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  const rootStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: rootOpacity.value,
    backgroundColor: C.bgApp,
  }));

  const goHome = () => {
    requestHomeFadeIn();
    router.replace({ pathname: '/', params: { enter: 'fade' } });
  };

  const finishToHome = () => {
    if (isLeaving.current) return;
    isLeaving.current = true;

    if (reducedMotion) {
      goHome();
      return;
    }

    rootOpacity.value = withTiming(
      0,
      { duration: durations.modalExit, easing: easing.easeOut },
      (finished) => {
        if (finished) {
          runOnJS(goHome)();
        }
      },
    );
  };

  const startTracking = () => {
    router.replace('/session-setup' as Href);
  };

  const replayTour = () => {
    router.replace('/home-tour');
  };

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <Animated.View style={rootStyle}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.hero}>
          <View style={s.copyBlock}>
            <SetTourStars />

            <Text style={s.title}>You’re all set!</Text>
            <Text style={s.subtitle}>
              Start tracking your sessions and making an impact today.
            </Text>
          </View>
        </View>

        <View style={s.actions}>
          <AnimatedPressable
            style={s.replayBtn}
            onPress={replayTour}
            accessibilityRole="button"
            accessibilityLabel="Replay tour"
          >
            <Text style={s.replayText}>Replay tour</Text>
            <TourReplayIcon size={24} color={C.textPrimary} />
          </AnimatedPressable>

          <AnimatedPressable
            style={s.primaryBtn}
            onPress={startTracking}
            accessibilityRole="button"
            accessibilityLabel="Start Tracking"
          >
            <Text style={s.primaryBtnText}>Start Tracking</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={s.homeBtn}
            onPress={finishToHome}
            accessibilityRole="button"
            accessibilityLabel="Go Home"
          >
            <Text style={s.homeBtnText}>Go Home</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  copyBlock: {
    position: 'relative',
    alignItems: 'center',
    gap: 15,
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 52,
    paddingTop: 64,
    paddingBottom: 72,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    color: C.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: C.textTertiary,
    textAlign: 'center',
  },
  star: {
    position: 'absolute',
    zIndex: 1,
  },
  actions: {
    gap: 12,
    width: '100%',
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 20,
  },
  replayText: {
    ...textStyles.labelButtonLarge,
    color: C.textPrimary,
  },
  primaryBtn: {
    borderRadius: radius.md,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  primaryBtnText: {
    ...textStyles.labelButtonLarge,
    color: C.textOnPrimary,
  },
  homeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  homeBtnText: {
    ...textStyles.labelButtonLarge,
    color: C.primary,
  },
});
