import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { durations, easing } from '@/motion';

import { markLiveSessionExpandFromHome } from '../liveSessionExpandIntent';

type Options = {
  onNavigate: () => void;
};

/** Slides the minimized pill down before / during expand navigation; resets on Home refocus. */
export function useLiveSessionBarExit({ onNavigate }: Options) {
  const reducedMotion = useReducedMotion();
  const visibility = useSharedValue(1);

  const barStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [{ translateY: (1 - visibility.value) * 56 }],
  }));

  const expandLiveSession = useCallback(() => {
    markLiveSessionExpandFromHome();
    if (reducedMotion) {
      onNavigate();
      return;
    }
    visibility.value = withTiming(0, {
      duration: durations.screenEnter,
      easing: easing.easeInOut,
    });
    onNavigate();
  }, [onNavigate, reducedMotion, visibility]);

  const resetBar = useCallback(() => {
    visibility.value = withTiming(1, {
      duration: durations.screenEnter,
      easing: easing.easeOut,
    });
  }, [visibility]);

  return { barStyle, expandLiveSession, resetBar };
}
