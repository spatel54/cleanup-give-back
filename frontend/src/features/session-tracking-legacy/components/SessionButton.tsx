import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, radius, textStyles } from '../tokens';
import { pressScale, pressSpring } from '../motion';

export type SessionButtonVariant = 'primary' | 'secondary' | 'text';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: SessionButtonVariant;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/**
 * Primary/secondary/text button with `scale(0.97)` press feedback
 * (emil-design-eng: "buttons must feel responsive"). 56px height per
 * design.md §9.3 `Button/Primary`.
 */
export function SessionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
  accessibilityHint,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withSpring(pressScale.default, pressSpring);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, pressSpring);
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={[
          styles.base,
          variant === 'primary' && styles.primary,
          variant === 'secondary' && styles.secondary,
          variant === 'text' && styles.text,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              textStyles.labelButton,
              variant === 'primary' ? styles.primaryLabel : styles.nonPrimaryLabel,
            ]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.textPrimary,
    backgroundColor: 'transparent',
  },
  text: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryLabel: {
    color: colors.textOnPrimary,
  },
  nonPrimaryLabel: {
    color: colors.textPrimary,
  },
});
