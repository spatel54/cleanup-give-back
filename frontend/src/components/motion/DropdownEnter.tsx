import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useDropdownEnter } from './hooks';

type Props = ViewProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Popover / dropdown panel — opacity + scale (enterFrom→1), ease-out 200ms. */
export function DropdownEnter({ children, style, ...rest }: Props) {
  const animatedStyle = useDropdownEnter();

  return (
    <Animated.View style={[style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
