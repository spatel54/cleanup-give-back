import { colors as C } from '@/features/figma-screens/tokens';
import { requestHomeFadeIn } from '@/features/onboarding/homeEnterTransition';
import { durations, easing } from '@/motion';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Long enough to feel intentional and cover Home mount — short enough not to annoy. */
const LOAD_DURATION_MS = 1600;

/**
 * Temporary bridge after session-start photo Cancel.
 * Cream screen + progress bar so the deep setup stack can unwind / Home can
 * mount without a white flash or hard cut. Leaves with a fade into Home.
 */
export function HoldOnScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const rootOpacity = useSharedValue(1);
  const isLeaving = useRef(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
  });

  const navigateHome = useCallback(() => {
    requestHomeFadeIn();
    router.replace({ pathname: '/', params: { enter: 'fade' } });
  }, [router]);

  const goHome = useCallback(() => {
    if (isLeaving.current) {
      return;
    }
    isLeaving.current = true;

    if (reducedMotion) {
      navigateHome();
      return;
    }

    // Fade this screen out, then Home fades in (same pattern as tour Go Home).
    rootOpacity.value = withTiming(
      0,
      { duration: durations.modalExit, easing: easing.easeOut },
      (finished) => {
        if (finished) {
          runOnJS(navigateHome)();
        }
      },
    );
  }, [navigateHome, reducedMotion, rootOpacity]);

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    let cancelled = false;
    const finish = () => {
      if (!cancelled) {
        goHome();
      }
    };

    if (reducedMotion) {
      progress.value = 1;
      const timer = setTimeout(finish, 400);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: LOAD_DURATION_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(finish)();
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [fontsLoaded, goHome, progress, reducedMotion]);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  const rootStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: rootOpacity.value,
    backgroundColor: C.bgApp,
  }));

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <Animated.View style={rootStyle}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.content} accessibilityLiveRegion="polite">
          <Text style={s.title} accessibilityRole="header">
            Hold on for a moment
          </Text>
          <Text style={s.subtitle}>Getting you back home…</Text>

          <View
            style={s.track}
            accessibilityRole="progressbar"
            accessibilityLabel="Loading home"
            accessibilityValue={{ min: 0, max: 100, now: 50 }}
          >
            <Animated.View style={[s.fill, progressStyle]} />
          </View>
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
    backgroundColor: C.bgApp,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 48,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    lineHeight: 43,
    color: C.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: C.textTertiary,
    textAlign: 'center',
    marginBottom: 28,
  },
  track: {
    width: '100%',
    maxWidth: 280,
    height: 4,
    borderRadius: 9999,
    backgroundColor: C.borderOutline,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    backgroundColor: C.primary,
    transformOrigin: 'left',
  },
});
