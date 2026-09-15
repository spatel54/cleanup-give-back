import React from 'react';
import { TouchableOpacity, Text, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'default',
  accessibilityLabel,
  style,
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }

  let bgClass = disabled 
    ? 'bg-surface-variant' 
    : variant === 'destructive' 
      ? 'bg-error' 
      : 'bg-primary';

  let textClass = disabled 
    ? 'text-on-surface-variant' 
    : variant === 'destructive' 
      ? 'text-on-error' 
      : 'text-on-primary';

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        className={`w-full h-[52px] rounded-full items-center justify-center px-6 ${bgClass}`}
      >
        <Text className={`font-label text-base font-semibold ${textClass}`}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
