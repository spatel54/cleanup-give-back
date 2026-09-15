import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function SecondaryButton({ label, onPress, accessibilityLabel, style }: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.button, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  } as ViewStyle,
  label: {
    ...(Typography.labelMedium as any),
    color: Colors.textSecondary,
  },
});
