import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors as tokens, textStyles } from '@/constants/tokens';

const C = {
  textPrimary: tokens.textPrimary,
  textNavInactive: tokens.textNavInactive,
  statusDeclined: tokens.statusDeclinedText,
  statusDeclinedBg: tokens.statusDeclinedBg,
} as const;

type Props = {
  visible: boolean;
  missingLabels: string[];
  onDismiss?: () => void;
};

/** Top toast for session setup form validation errors. */
export function SessionSetupValidationToast({ visible, missingLabels, onDismiss }: Props) {
  if (!visible || missingLabels.length === 0) {
    return null;
  }

  return (
    <View
      style={s.toast}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={s.toastHeader}>
        <Text style={s.toastTitle}>There are missing fields</Text>
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          >
            <Ionicons name="close" size={18} color={C.textNavInactive} />
          </Pressable>
        ) : null}
      </View>
      {missingLabels.map((label) => (
        <Text key={label} style={s.listLine}>
          {'\u2022  '}
          {label}
        </Text>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  toast: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: C.statusDeclinedBg,
    borderWidth: 1,
    borderColor: C.statusDeclined,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  toastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  toastTitle: {
    flex: 1,
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.statusDeclined,
  },
  listLine: {
    ...textStyles.bodySmall,
    fontFamily: 'NotoSans_500Medium',
    color: C.textPrimary,
  },
});
