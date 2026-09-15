import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useCoachmarkEnter } from './hooks';

type Props = {
  children: ReactNode;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
};

/** Wraps coachmark tutorial content with fade + scale enter (`design.md` §10.2). */
export function CoachmarkEnter({ children, delayMs = 0, style }: Props) {
  const animatedStyle = useCoachmarkEnter(delayMs);

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
