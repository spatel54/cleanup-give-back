import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  clampProfilePhotoTranslation,
  exportCroppedProfilePhoto,
  getCenteredTranslation,
  getDisplayBaseSize,
  getPresetScale,
  getScaleLimits,
  type ProfilePhotoCropPreset,
  type ProfilePhotoCropTransform,
} from '@/lib/cropProfilePhoto';

import { colors, fontFamilies, layout, radius, shadows, textStyles } from '../tokens';

type Props = {
  visible: boolean;
  imageUri: string | null;
  imageWidth: number;
  imageHeight: number;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;
};

const CROP_HORIZONTAL_PADDING = 32;

function clampTranslationWorklet(
  translateX: number,
  translateY: number,
  scale: number,
  cropSize: number,
  displayBaseWidth: number,
  displayBaseHeight: number,
): { translateX: number; translateY: number } {
  'worklet';

  const scaledWidth = displayBaseWidth * scale;
  const scaledHeight = displayBaseHeight * scale;

  let nextX = translateX;
  let nextY = translateY;

  if (scaledWidth >= cropSize) {
    nextX = Math.min(0, Math.max(cropSize - scaledWidth, nextX));
  } else {
    nextX = (cropSize - scaledWidth) / 2;
  }

  if (scaledHeight >= cropSize) {
    nextY = Math.min(0, Math.max(cropSize - scaledHeight, nextY));
  } else {
    nextY = (cropSize - scaledHeight) / 2;
  }

  return { translateX: nextX, translateY: nextY };
}

function PresetButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[s.presetButton, selected ? s.presetButtonSelected : s.presetButtonIdle]}
    >
      <Text style={[s.presetLabel, selected ? s.presetLabelSelected : s.presetLabelIdle]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/** Full-screen crop editor with free pan/pinch and Fit / Fill / Crop presets. */
export function ProfilePhotoCropModal({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  onCancel,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const cropSize = Math.min(windowWidth - CROP_HORIZONTAL_PADDING, 360);

  const { displayBaseWidth, displayBaseHeight } = useMemo(
    () => getDisplayBaseSize(imageWidth, imageHeight, cropSize),
    [cropSize, imageHeight, imageWidth],
  );

  const { minScale, maxScale } = useMemo(
    () => getScaleLimits(cropSize, displayBaseWidth, displayBaseHeight),
    [cropSize, displayBaseHeight, displayBaseWidth],
  );

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const [activePreset, setActivePreset] = useState<ProfilePhotoCropPreset>('crop');
  const [isExporting, setIsExporting] = useState(false);

  const applyPreset = useCallback(
    (preset: ProfilePhotoCropPreset) => {
      const nextScale = getPresetScale(preset, cropSize, displayBaseWidth, displayBaseHeight);
      const centered = getCenteredTranslation(
        cropSize,
        displayBaseWidth,
        displayBaseHeight,
        nextScale,
      );

      scale.value = withTiming(nextScale, { duration: 220 });
      translateX.value = withTiming(centered.translateX, { duration: 220 });
      translateY.value = withTiming(centered.translateY, { duration: 220 });
      savedScale.value = nextScale;
      savedTranslateX.value = centered.translateX;
      savedTranslateY.value = centered.translateY;
      setActivePreset(preset);
    },
    [
      cropSize,
      displayBaseHeight,
      displayBaseWidth,
      savedScale,
      savedTranslateX,
      savedTranslateY,
      scale,
      translateX,
      translateY,
    ],
  );

  useEffect(() => {
    if (!visible || !imageUri) {
      return;
    }

    applyPreset('crop');
  }, [applyPreset, imageUri, visible]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      const clamped = clampTranslationWorklet(
        translateX.value,
        translateY.value,
        scale.value,
        cropSize,
        displayBaseWidth,
        displayBaseHeight,
      );
      translateX.value = withTiming(clamped.translateX, { duration: 120 });
      translateY.value = withTiming(clamped.translateY, { duration: 120 });
      savedTranslateX.value = clamped.translateX;
      savedTranslateY.value = clamped.translateY;
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      const nextScale = Math.min(maxScale, Math.max(minScale, savedScale.value * event.scale));
      scale.value = nextScale;
    })
    .onEnd(() => {
      const clamped = clampTranslationWorklet(
        translateX.value,
        translateY.value,
        scale.value,
        cropSize,
        displayBaseWidth,
        displayBaseHeight,
      );
      translateX.value = withTiming(clamped.translateX, { duration: 120 });
      translateY.value = withTiming(clamped.translateY, { duration: 120 });
      savedTranslateX.value = clamped.translateX;
      savedTranslateY.value = clamped.translateY;
      savedScale.value = scale.value;
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleConfirm = useCallback(async () => {
    if (!imageUri || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const clamped = clampProfilePhotoTranslation(
        translateX.value,
        translateY.value,
        scale.value,
        cropSize,
        displayBaseWidth,
        displayBaseHeight,
      );

      const transform: ProfilePhotoCropTransform = {
        imageWidth,
        imageHeight,
        cropSize,
        displayBaseWidth,
        displayBaseHeight,
        scale: scale.value,
        translateX: clamped.translateX,
        translateY: clamped.translateY,
      };
      const croppedUri = await exportCroppedProfilePhoto(imageUri, transform);
      onConfirm(croppedUri);
    } finally {
      setIsExporting(false);
    }
  }, [
    cropSize,
    displayBaseHeight,
    displayBaseWidth,
    imageHeight,
    imageUri,
    imageWidth,
    isExporting,
    onConfirm,
    scale,
    translateX,
    translateY,
  ]);

  if (!visible || !imageUri) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="none" presentationStyle="fullScreen">
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <View
          style={[
            s.header,
            shadows.barTop,
            { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom },
          ]}
        >
          <View style={s.headerRow}>
            <AnimatedPressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={s.headerSide}
            >
              <Text style={s.headerAction}>Cancel</Text>
            </AnimatedPressable>
            <Text style={s.headerTitle}>Adjust Photo</Text>
            <AnimatedPressable
              onPress={() => void handleConfirm()}
              disabled={isExporting}
              accessibilityRole="button"
              accessibilityLabel="Use photo"
              style={s.headerSide}
            >
              {isExporting ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[s.headerAction, s.headerActionPrimary]}>Use Photo</Text>
              )}
            </AnimatedPressable>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.helperText}>Pinch to zoom and drag to reposition your photo.</Text>

          <View style={[s.cropFrame, { width: cropSize, height: cropSize }]}>
            <GestureDetector gesture={gesture}>
              <Animated.View style={[s.imageLayer, { width: cropSize, height: cropSize }]}>
                <Animated.View style={imageStyle}>
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: displayBaseWidth, height: displayBaseHeight }}
                    contentFit="fill"
                  />
                </Animated.View>
              </Animated.View>
            </GestureDetector>
            <View style={s.cropMask} pointerEvents="none">
              <View style={[s.cropWindow, { width: cropSize, height: cropSize }]} />
            </View>
          </View>

          <View style={s.presetRow}>
            <PresetButton
              label="Fill"
              selected={activePreset === 'fill'}
              onPress={() => applyPreset('fill')}
            />
            <PresetButton
              label="Crop"
              selected={activePreset === 'crop'}
              onPress={() => applyPreset('crop')}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderOutline,
  },
  headerRow: {
    minHeight: layout.topBarTitleRow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerSide: {
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerAction: {
    ...textStyles.bodySemiBold,
    color: colors.textNavInactive,
  },
  headerActionPrimary: {
    color: colors.primary,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 20,
  },
  helperText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  cropFrame: {
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.borderOutline,
  },
  imageLayer: {
    overflow: 'hidden',
  },
  cropMask: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropWindow: {
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.white,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 360,
  },
  presetButton: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonIdle: {
    backgroundColor: colors.white,
    borderColor: colors.borderOutline,
  },
  presetButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
  },
  presetLabelIdle: {
    color: colors.textPrimary,
  },
  presetLabelSelected: {
    color: colors.white,
  },
});
