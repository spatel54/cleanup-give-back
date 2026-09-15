import { useCallback, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { durations, easing, modalSpring } from '@/motion';

import { DateWheelPicker } from './DateWheelPicker';
import { colors as C, textStyles } from '../tokens';

/** Extra travel so the sheet starts fully off-screen below the fold. */
const SHEET_BOTTOM_BLEED = 48;

/** Default wheel position when no birthday has been chosen yet. */
export const DEFAULT_BIRTHDAY_PICKER_DATE = new Date(2000, 0, 1);

/** Format as MM/YYYY while typing (digits only, max 6). */
export function formatBirthdayDraft(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatBirthdayLabel(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${mm}/${date.getFullYear()}`;
}

/** Parse MM/YYYY (or M/YYYY) into the 1st of that month. */
export function parseBirthdayDraft(text: string): Date | null {
  const match = text.trim().match(/^(\d{1,2})\s*\/\s*(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const now = new Date();
  if (year < 1900 || year > now.getFullYear()) return null;
  const date = new Date(year, month - 1, 1);
  if (date > now) return null;
  return date;
}

export { ageFromBirthday } from '@/constants/ageGate';

type BirthdayPickerModalProps = {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onConfirm: (date: Date) => void;
  onClose: () => void;
};

/** Scrim fades with the sheet; Modal unmounts when exit finishes. */
export function BirthdayPickerModal({
  visible,
  value,
  onChange,
  onConfirm,
  onClose,
}: BirthdayPickerModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const sheetHeight = 280 + insets.bottom;
  const dismissTravel = Math.min(windowHeight * 0.55, sheetHeight) + SHEET_BOTTOM_BLEED;
  const translateY = useSharedValue(dismissTravel);
  const backdropOpacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }
    // Fade scrim immediately so the dimmed screen does not linger while the
    // sheet spring settles (sheetDismissSpring can take >1s to finish).
    backdropOpacity.value = withTiming(0, {
      duration: durations.sheetDismiss,
      easing: easing.drawer,
    });
    translateY.value = withTiming(
      dismissTravel,
      { duration: durations.sheetDismiss, easing: easing.drawer },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      },
    );
  }, [backdropOpacity, dismissTravel, onClose, reducedMotion, translateY]);

  const confirm = useCallback(() => {
    onConfirm(value);
    dismiss();
  }, [dismiss, onConfirm, value]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    translateY.value = dismissTravel;
    translateY.value = reducedMotion
      ? 0
      : withSpring(0, { ...modalSpring, overshootClamping: true });
    backdropOpacity.value = reducedMotion
      ? 1
      : withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });
  }, [backdropOpacity, dismissTravel, reducedMotion, translateY, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={s.modalRoot}>
        <Animated.View style={[s.modalScrim, backdropStyle]} pointerEvents="none" />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityLabel="Close birthday picker"
        />
        <Animated.View style={[s.modalSheetWrap, sheetStyle]}>
          <View style={[s.modalSheet, { paddingBottom: 24 + insets.bottom }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Birthday</Text>
              <AnimatedPressable
                onPress={confirm}
                accessibilityRole="button"
                accessibilityLabel="Confirm birthday"
              >
                <Text style={s.modalDone}>Done</Text>
              </AnimatedPressable>
            </View>
            <DateWheelPicker value={value} onChange={onChange} includeDay={false} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: C.overlayScrim,
  },
  modalSheetWrap: {
    width: '100%',
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.borderOutline,
  },
  modalTitle: {
    ...textStyles.headlineTopBar,
    color: C.textPrimary,
  },
  modalDone: {
    ...textStyles.bodySemiBold,
    color: C.primary,
  },
});
