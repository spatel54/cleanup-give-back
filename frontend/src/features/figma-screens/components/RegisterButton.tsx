import React from 'react';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { colors, fontFamilies, radius, textStyles } from '../tokens';

type Props = {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Figma `RegisterButton` (`196:272`) — primary full-width CTA.
 * 358×50 on the event detail frame; padding 24×14, radius.md, Noto Sans SemiBold 16.
 */
export function RegisterButton({
  onPress,
  label = 'Register',
  accessibilityLabel = 'Register for this event',
  style,
}: Props) {
  return (
    <AnimatedPressable
      style={[s.button, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={s.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    width: '100%',
    height: 50,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    ...textStyles.labelButton,
    color: colors.textOnPrimary,
  },
});
