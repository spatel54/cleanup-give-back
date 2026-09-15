import { useEffect, useSyncExternalStore } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  getHomeTransitionCoverPhase,
  notifyHomeTransitionCoverFadeInDone,
  notifyHomeTransitionCoverFadeOutDone,
  subscribeHomeTransitionCover,
} from '@/features/onboarding/homeEnterTransition';
import { colors } from '@/features/figma-screens/tokens';
import { durations, easing } from '@/motion';

/**
 * Always-mounted cream veil above the root stack.
 * Never uses React Native Modal (mounting that flashes white on iOS).
 * Opacity is driven by homeEnterTransition phase: fading-in → visible → fading-out.
 */
export function HomeTransitionCover() {
  const phase = useSyncExternalStore(
    subscribeHomeTransitionCover,
    getHomeTransitionCoverPhase,
    () => 'hidden' as const,
  );
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (phase === 'fading-in') {
      opacity.value = withTiming(
        1,
        { duration: durations.modalEnter, easing: easing.easeOut },
        (finished) => {
          if (finished) {
            runOnJS(notifyHomeTransitionCoverFadeInDone)();
          }
        },
      );
      return;
    }

    if (phase === 'visible') {
      opacity.value = 1;
      return;
    }

    if (phase === 'fading-out') {
      opacity.value = withTiming(
        0,
        { duration: durations.modalEnter, easing: easing.easeOut },
        (finished) => {
          if (finished) {
            runOnJS(notifyHomeTransitionCoverFadeOutDone)();
          }
        },
      );
      return;
    }

    // hidden
    opacity.value = 0;
  }, [opacity, phase]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[s.cover, animatedStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const s = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bgApp,
    zIndex: 9999,
    elevation: 9999,
  },
});
