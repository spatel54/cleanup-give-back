import { useCallback, useEffect } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { COUNTRIES, type Country } from '@/constants/countries';
import { durations, easing, modalSpring } from '@/motion';

import { colors as C } from '../tokens';

/** Extra travel so the sheet starts fully off-screen below the fold. */
const SHEET_BOTTOM_BLEED = 48;

export function digitsOnly(value: string, maxDigits: number): string {
  return value.replace(/\D/g, '').slice(0, maxDigits);
}

function formatUsPhone(digits: string): string {
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${a}`;
  if (digits.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

export function formatPhoneDisplay(digits: string, country: Country): string {
  if (country.iso2 === 'US' || country.iso2 === 'CA') {
    return formatUsPhone(digits);
  }
  return digits;
}

export function phonePlaceholder(country: Country): string {
  if (country.iso2 === 'US' || country.iso2 === 'CA') {
    return '(___) ___-____';
  }
  return 'Phone number';
}

/** Max TextInput length for formatted display (prevents extra digits flashing before slice). */
export function phoneDisplayMaxLength(country: Country): number {
  if (country.iso2 === 'US' || country.iso2 === 'CA') {
    return formatPhoneDisplay('9'.repeat(country.maxDigits), country).length;
  }
  return country.maxDigits;
}

export function validatePhone(digits: string, country: Country): string | undefined {
  if (!digits) return 'Phone number is required';
  const minDigits = country.iso2 === 'US' || country.iso2 === 'CA' ? 10 : 4;
  if (digits.length < minDigits) {
    return country.iso2 === 'US' || country.iso2 === 'CA'
      ? 'Enter a valid 10-digit number'
      : 'Enter a valid phone number';
  }
  return undefined;
}

export function CountryChevronDownIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.964 15.108L18.4995 8.5725L19.4295 9.4995L12.426 16.5H11.499L4.5 9.4995L5.4285 8.5725L11.964 15.108Z"
        fill={C.textPrimary}
      />
    </Svg>
  );
}

type CountryPickerModalProps = {
  visible: boolean;
  selectedIso2: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
};

/** Scrim appears immediately; only the sheet slides up (matches EventsViewAllModal). */
export function CountryPickerModal({
  visible,
  selectedIso2,
  onSelect,
  onClose,
}: CountryPickerModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const sheetMaxHeight = windowHeight * 0.7;
  const dismissTravel = sheetMaxHeight + insets.bottom + SHEET_BOTTOM_BLEED;
  const translateY = useSharedValue(dismissTravel);
  const scrimOpacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }
    scrimOpacity.value = withTiming(0, { duration: 320, easing: easing.drawer });
    translateY.value = withTiming(
      dismissTravel,
      { duration: 320, easing: easing.drawer },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  }, [dismissTravel, onClose, reducedMotion, scrimOpacity, translateY]);

  useEffect(() => {
    if (!visible) return;
    translateY.value = dismissTravel;
    scrimOpacity.value = 0;
    if (reducedMotion) {
      translateY.value = 0;
      scrimOpacity.value = 1;
    } else {
      translateY.value = withSpring(0, { ...modalSpring, overshootClamping: true });
      scrimOpacity.value = withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });
    }
  }, [dismissTravel, reducedMotion, scrimOpacity, translateY, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
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
        <Animated.View style={[s.modalScrim, scrimStyle]} pointerEvents="none" />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityLabel="Close country list"
        />
        <Animated.View style={[s.modalSheetWrap, sheetStyle]}>
          <View style={[s.modalSheet, { maxHeight: sheetMaxHeight }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Country code</Text>
              <AnimatedPressable
                onPress={dismiss}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={s.modalDone}>Done</Text>
              </AnimatedPressable>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.iso2}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              windowSize={10}
              contentContainerStyle={{ paddingBottom: 16 + insets.bottom }}
              getItemLayout={(_data, index) => ({
                length: 56,
                offset: 56 * index,
                index,
              })}
              renderItem={({ item }) => {
                const selected = item.iso2 === selectedIso2;
                return (
                  <Pressable
                    style={[s.countryRow, selected && s.countryRowSelected]}
                    onPress={() => {
                      onSelect(item);
                      dismiss();
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${item.name}, plus ${item.dialCode}`}
                  >
                    <Text style={s.countryFlag}>{item.flag}</Text>
                    <Text style={s.countryName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={s.countryDial}>+{item.dialCode}</Text>
                  </Pressable>
                );
              }}
            />
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
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 20,
    color: C.textPrimary,
  },
  modalDone: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: C.primary,
  },
  countryRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  countryRowSelected: {
    backgroundColor: C.statusApprovedBg,
  },
  countryFlag: {
    fontSize: 24,
    lineHeight: 28,
    width: 36,
    textAlign: 'center',
  },
  countryName: {
    flex: 1,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textPrimary,
  },
  countryDial: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textNavInactive,
  },
});
