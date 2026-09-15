import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { durations, easing, modalSpring, sheetDismissSpring } from '@/motion';
import { colors, fontFamilies, radius as R, textStyles } from '../tokens';
import type { MapBasemapTheme } from '../mapThemeStore';
import { getTrackerChromeColors } from '../utils/trackerChromeTheme';
import type { MapLayerType } from '../utils/mapStyles';

/** Travel distance for slide — sheet height plus bleed so the panel starts fully off-screen. */
const SHEET_BOTTOM_BLEED = 48;

export type MapTypeOption = MapLayerType;

type Props = {
  visible: boolean;
  selectedType: MapTypeOption;
  onSelect: (type: MapTypeOption) => void;
  onClose: () => void;
  /** Matches live tracker map theme so the sheet chrome follows dark mode. */
  mapTheme?: MapBasemapTheme;
};

const OPTIONS: {
  id: MapTypeOption;
  label: string;
  source: ImageSourcePropType;
}[] = [
  {
    id: 'standard',
    label: 'Standard',
    source: require('@/assets/figma/live-session/map-type-standard.png') as number,
  },
  {
    id: 'satellite',
    label: 'Satellite',
    source: require('@/assets/figma/live-session/map-type-satellite.png') as number,
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    source: require('@/assets/figma/live-session/map-type-hybrid.png') as number,
  },
];

function CloseIcon({ size = 18, color = colors.textPrimary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MapTypeOptionButton({
  label,
  source,
  selected,
  onPress,
  labelColor,
  frameBg,
}: {
  label: string;
  source: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
  labelColor: string;
  frameBg: string;
}) {
  return (
    <AnimatedPressable
      style={s.option}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} map type${selected ? ', selected' : ''}`}
    >
      <View
        style={[
          s.thumbFrame,
          { backgroundColor: frameBg },
          selected && s.thumbFrameSelected,
        ]}
      >
        <Image source={source} style={s.thumb} accessibilityIgnoresInvertColors />
      </View>
      <Text
        style={[
          s.optionLabel,
          { color: labelColor },
          selected && s.optionLabelSelected,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function MapTypesSheet({
  visible,
  selectedType,
  onSelect,
  onClose,
  mapTheme = 'light',
}: Props) {
  const chrome = getTrackerChromeColors(mapTheme);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const dismissTravel = 280 + insets.bottom + SHEET_BOTTOM_BLEED;
  const translateY = useSharedValue(dismissTravel);
  const backdropOpacity = useSharedValue(0);
  /** Prevents the opening tap from immediately dismissing via the full-screen scrim. */
  const [scrimArmed, setScrimArmed] = useState(false);

  const dismiss = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }

    backdropOpacity.value = withTiming(0, {
      duration: durations.sheetDismiss,
      easing: easing.drawer,
    });
    translateY.value = withSpring(dismissTravel, sheetDismissSpring, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [backdropOpacity, dismissTravel, onClose, reducedMotion, translateY]);

  useEffect(() => {
    if (!visible) {
      setScrimArmed(false);
      return;
    }

    translateY.value = dismissTravel;
    translateY.value = reducedMotion
      ? 0
      : withSpring(0, { ...modalSpring, overshootClamping: true });
    backdropOpacity.value = reducedMotion
      ? 1
      : withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });

    const armId = setTimeout(() => setScrimArmed(true), durations.modalEnter);
    return () => clearTimeout(armId);
  }, [backdropOpacity, dismissTravel, reducedMotion, translateY, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSelect = useCallback(
    (type: MapTypeOption) => {
      onSelect(type);
      // Animate closed; parent should only flip `visible` via `onClose` after this.
      dismiss();
    },
    [dismiss, onSelect],
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <View style={s.backdrop}>
        <Animated.View style={[s.scrim, backdropStyle]} pointerEvents="none" />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          disabled={!scrimArmed}
          pointerEvents={scrimArmed ? 'auto' : 'none'}
          accessibilityLabel="Close map types"
        />

        <Animated.View style={[s.sheetWrap, sheetStyle]}>
          <View
            style={[
              s.sheet,
              {
                backgroundColor: chrome.surface,
                paddingBottom: 20 + insets.bottom,
              },
            ]}
          >
            <View
              style={[s.grabber, { backgroundColor: chrome.borderOutline }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />

            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={dismiss}
              hitSlop={8}
              style={s.closeBtn}
            >
              <CloseIcon color={chrome.textPrimary} />
            </AnimatedPressable>

            <Text style={[s.title, { color: chrome.textPrimary }]}>Map Types</Text>

            <View style={s.optionsRow}>
              {OPTIONS.map((option) => (
                <MapTypeOptionButton
                  key={option.id}
                  label={option.label}
                  source={option.source}
                  selected={selectedType === option.id}
                  onPress={() => handleSelect(option.id)}
                  labelColor={chrome.textPrimary}
                  frameBg={chrome.surfaceMuted}
                />
              ))}
            </View>
          </View>
          <View
            style={[
              s.sheetBleed,
              { height: SHEET_BOTTOM_BLEED, backgroundColor: chrome.surface },
            ]}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const THUMB_SIZE = 72;

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 27, 27, 0.45)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: R.md,
    borderTopRightRadius: R.md,
    width: '100%',
    paddingTop: 10,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  sheetBleed: {},
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: R.full,
    marginBottom: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 20,
    marginTop: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 12,
  },
  option: {
    width: THUMB_SIZE + 8,
    alignItems: 'center',
    gap: 8,
  },
  thumbFrame: {
    width: THUMB_SIZE + 8,
    height: THUMB_SIZE + 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  thumbFrameSelected: {
    borderColor: colors.primary,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
  },
  optionLabel: {
    ...textStyles.bodySmall,
    textAlign: 'center',
  },
  optionLabelSelected: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
});
