import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Radius, Spacing } from '../../constants/Typography';

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

export function SelectField({
  label,
  required = false,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  containerStyle,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? null;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label} accessibilityRole="text">
        {label}
        {required && <Text style={{ color: Colors.error }}> *</Text>}
      </Text>

      <TouchableOpacity
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={() => setOpen((prev) => !prev)}
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        activeOpacity={0.8}
      >
        <Text style={[styles.triggerText, !selectedLabel && styles.placeholder]}>
          {selectedLabel ?? placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? '▲' : '▾'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                index < options.length - 1 && styles.optionBorder,
                value === option.value && styles.optionSelected,
              ]}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              accessibilityRole="menuitem"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: value === option.value }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  value === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    zIndex: 10,
  } as ViewStyle,
  label: {
    ...(Typography.labelMedium as any),
    color: Colors.textPrimary,
  } as TextStyle,
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 14,
    minHeight: 52,
  } as ViewStyle,
  triggerOpen: {
    borderColor: Colors.borderFocus ?? Colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  } as ViewStyle,
  triggerText: {
    ...(Typography.bodyLarge as any),
    color: Colors.textPrimary,
    flex: 1,
  } as TextStyle,
  placeholder: {
    color: Colors.textSecondary,
  } as TextStyle,
  chevron: {
    ...(Typography.bodyMedium as any),
    color: Colors.textSecondary,
    marginLeft: 8,
  } as TextStyle,
  dropdown: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: Colors.borderFocus ?? Colors.primary,
    borderBottomLeftRadius: Radius.sm,
    borderBottomRightRadius: Radius.sm,
    overflow: 'hidden',
  } as ViewStyle,
  option: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 14,
  } as ViewStyle,
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  } as ViewStyle,
  optionSelected: {
    backgroundColor: Colors.primaryLight ?? Colors.surface,
  } as ViewStyle,
  optionText: {
    ...(Typography.bodyLarge as any),
    color: Colors.textPrimary,
  } as TextStyle,
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  } as TextStyle,
});
