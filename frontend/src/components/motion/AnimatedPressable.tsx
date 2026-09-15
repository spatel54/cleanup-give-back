import type { ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { pressScale, pressSpring } from '@/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'children' | 'style'> & {
  /** Press-down scale — defaults to Emil `0.97`. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Pressable with Reanimated spring scale feedback (`@emil press=spring scale=0.97`).
 * Use on all primary touch targets in the Expo Go flow.
 *
 * Layout styles (width / alignSelf / height) must live on the Pressable itself so
 * percentage widths and stretch resolve against the parent — not an unstyled wrapper.
 */
export function AnimatedPressable({
  scaleTo = pressScale.default,
  style,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      disabled={disabled}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        if (!disabled) {
          scale.value = withSpring(scaleTo, pressSpring);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, pressSpring);
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressableBase>
  );
}
