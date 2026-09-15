import { InfoCircleIcon } from '@/components/onboarding/OnboardingIcons';
import { colors as C } from '@/features/figma-screens/tokens';
import { durations, easing } from '@/motion';
import { useCallback, useEffect, useState } from 'react';
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
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter, type Href } from 'expo-router';


/** Figma `creating_account` (137:85) — two rotating Did-you-know facts. */
export const CREATING_ACCOUNT_FACTS = [
  'One reusable bag can replace 600 plastic bags in its lifetime!',
  'A plastic bottle can take up to 450 years to break down in nature.',
] as const;

const LOAD_DURATION_MS = 7500;
const FACT_INTERVAL_MS = Math.floor(LOAD_DURATION_MS / CREATING_ACCOUNT_FACTS.length);
const FACT_FADE_MS = durations.screenEnter;

/** Figma `creating_account` (137:73) — shown while account creation is in progress. */
export function CreatingAccountScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [factIndex, setFactIndex] = useState(0);
  const progress = useSharedValue(0);
  const factOpacity = useSharedValue(1);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
  });

  const goNext = useCallback(() => {
    router.replace('/how-it-works' as Href);
  }, [router]);

  const showFact = useCallback(
    (index: number) => {
      if (reducedMotion) {
        setFactIndex(index);
        factOpacity.value = 1;
        return;
      }

      factOpacity.value = withTiming(0, { duration: FACT_FADE_MS / 2, easing: easing.easeInOut }, (finished) => {
        if (!finished) return;
        runOnJS(setFactIndex)(index);
        factOpacity.value = withTiming(1, { duration: FACT_FADE_MS / 2, easing: easing.easeOut });
      });
    },
    [factOpacity, reducedMotion],
  );

  useEffect(() => {
    if (!fontsLoaded) return;

    let cancelled = false;
    const finish = () => {
      if (!cancelled) goNext();
    };

    if (reducedMotion) {
      progress.value = 1;
      const timer = setTimeout(finish, 400);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    progress.value = withTiming(
      1,
      { duration: LOAD_DURATION_MS, easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(finish)();
      },
    );

    const timers = CREATING_ACCOUNT_FACTS.slice(1).map((_, i) =>
      setTimeout(() => {
        if (!cancelled) showFact(i + 1);
      }, FACT_INTERVAL_MS * (i + 1)),
    );

    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
    };
  }, [fontsLoaded, goNext, progress, reducedMotion, showFact]);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  const factStyle = useAnimatedStyle(() => ({
    opacity: factOpacity.value,
  }));

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.content} accessibilityLiveRegion="polite">
        <Text style={s.title} accessibilityRole="header">
          {'Creating your\naccount now...'}
        </Text>

        <View style={s.didYouKnowBlock}>
          <View style={s.didYouKnowRow}>
            <InfoCircleIcon width={18} height={18} />
            <Text style={s.didYouKnowLabel}>Did you know</Text>
          </View>

          <Animated.View style={factStyle}>
            <Text style={s.fact}>{CREATING_ACCOUNT_FACTS[factIndex]}</Text>
          </Animated.View>
        </View>

        <View
          style={s.track}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round((factIndex + 1) / CREATING_ACCOUNT_FACTS.length * 100),
          }}
          accessibilityLabel="Creating account"
        >
          <Animated.View style={[s.fill, progressStyle]} />
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 43,
    paddingBottom: 48,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    color: C.primary,
    textAlign: 'center',
    lineHeight: 43,
  },
  didYouKnowBlock: {
    width: 256,
    alignItems: 'center',
    gap: 30,
  },
  didYouKnowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  didYouKnowLabel: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textNavInactive,
  },
  fact: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 18,
    color: C.textNavInactive,
    textAlign: 'center',
    lineHeight: 25,
  },
  track: {
    width: '100%',
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
