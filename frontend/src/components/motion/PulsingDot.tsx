import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { easing } from '@/motion';

/** One half of a full pulse cycle — 1.2s × 2 ≈ 2.4s per loop (gentle, not frantic). */
const PULSE_HALF_CYCLE_MS = 1200;

type Props = {
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Live-status dot — opacity pulse only; skipped when reduced motion is on. */
export function PulsingDot({ color, size = 8, style }: Props) {
  const reducedMotion = useReducedMotion();
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      dotOpacity.value = 1;
      return;
    }

    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: PULSE_HALF_CYCLE_MS, easing: easing.easeInOut }),
        withTiming(1, { duration: PULSE_HALF_CYCLE_MS, easing: easing.easeInOut }),
      ),
      -1,
    );

    return () => cancelAnimation(dotOpacity);
  }, [dotOpacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
