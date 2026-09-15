import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useAttentionShake } from '@/components/motion/hooks';

import { colors, fontFamilies, radius, shadows, textStyles } from '../tokens';

type Props = {
  visible: boolean;
  onDismiss?: () => void;
};

/** Session-setup-style toast confirming a link was copied to the clipboard. */
export function LinkCopiedToast({ visible, onDismiss }: Props) {
  const shakeStyle = useAttentionShake();

  if (!visible) return null;

  return (
    <Animated.View
      style={[s.toast, shakeStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={s.toastHeader}>
        <Text style={s.toastTitle}>Link has been copied</Text>
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          >
            <Ionicons name="close" size={18} color={colors.textNavInactive} />
          </Pressable>
        ) : null}
      </View>
      <Text style={s.toastLine}>Paste it anywhere to share this location</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toast: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.statusApprovedBorder,
    gap: 4,
    zIndex: 20,
    ...shadows.barTop,
  },
  toastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  toastTitle: {
    flex: 1,
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  toastLine: {
    ...textStyles.bodySmall,
    color: colors.textNavInactive,
  },
});
