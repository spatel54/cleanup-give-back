import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Radius, Spacing } from '../../constants/Typography';

interface InputProps extends TextInputProps {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
}

export function Input({ label, helper, error, required = false, containerStyle, ...textInputProps }: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? Colors.error : focused ? Colors.borderFocus : Colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label} accessibilityRole="text">
        {label}
        {required && <Text style={{ color: Colors.error }}> *</Text>}
      </Text>
      <TextInput
        {...textInputProps}
        onFocus={(e) => { setFocused(true); textInputProps.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); textInputProps.onBlur?.(e); }}
        style={[styles.input, { borderColor }, textInputProps.style]}
        placeholderTextColor={Colors.textSecondary}
        accessibilityLabel={label}
        accessibilityState={{ disabled: false }}
      />
      {(helper || error) && (
        <Text style={[styles.helper, error && styles.errorText]} accessibilityRole="text">
          {error ?? helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  } as ViewStyle,
  label: {
    ...(Typography.labelMedium as any),
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 14,
    ...(Typography.bodyLarge as any),
    color: Colors.textPrimary,
    minHeight: 52,
  },
  helper: {
    ...(Typography.bodySmall as any),
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
  },
});
