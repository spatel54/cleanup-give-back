import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { CloseIcon } from './HomeIcons';
import { layout, colors, fontFamilies, radius, shadows, textStyles } from '../tokens';

const THUMB_SIZE = 74;
const THUMB_GAP = 21;
const THUMB_PAD_H = 16;
const THUMB_PAD_TOP = 12;
const THUMB_PAD_BOTTOM = 16;

type Props = {
  visible: boolean;
  images: number[];
  initialIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/**
 * Full-screen product image viewer — swipe between slides, tap bottom thumbnails
 * to jump (same 74px strip as product detail), centered title, top-right close.
 */
export function ProductImagesModal({
  visible,
  images,
  initialIndex,
  onIndexChange,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {visible ? (
        <SafeAreaProvider
          initialMetrics={initialWindowMetrics}
          style={[s.modalHost, webFill]}
        >
          <ProductImagesContent
            images={images}
            initialIndex={initialIndex}
            onIndexChange={onIndexChange}
            onClose={onClose}
          />
        </SafeAreaProvider>
      ) : null}
    </Modal>
  );
}

function ProductImagesContent({
  images,
  initialIndex,
  onIndexChange,
  onClose,
}: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const thumbScrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(initialIndex);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const showThumbs = images.length > 1;
  const stageW = stageSize.width || width;
  const stageH = stageSize.height;

  const onStageLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: nextW, height: nextH } = e.nativeEvent.layout;
    setStageSize((prev) =>
      prev.width === nextW && prev.height === nextH ? prev : { width: nextW, height: nextH },
    );
  }, []);

  useEffect(() => {
    if (stageW <= 0) {
      return;
    }
    const x = initialIndex * stageW;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x, animated: false });
    });
    return () => cancelAnimationFrame(id);
  }, [initialIndex, stageW]);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= images.length || next === index) {
        return;
      }
      setIndex(next);
      onIndexChange(next);
      scrollRef.current?.scrollTo({ x: next * stageW, animated: true });
    },
    [images.length, index, onIndexChange, stageW],
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / stageW);
      if (next === index || next < 0 || next >= images.length) {
        return;
      }
      setIndex(next);
      onIndexChange(next);
    },
    [images.length, index, onIndexChange, stageW],
  );

  const thumbsFit =
    images.length * THUMB_SIZE + Math.max(0, images.length - 1) * THUMB_GAP + THUMB_PAD_H * 2 <=
    width;

  useEffect(() => {
    if (!showThumbs || thumbsFit) {
      return;
    }
    const x = index * (THUMB_SIZE + THUMB_GAP) - (width - THUMB_SIZE) / 2 + THUMB_PAD_H;
    thumbScrollRef.current?.scrollTo({ x: Math.max(0, x), animated: true });
  }, [index, showThumbs, thumbsFit, width]);

  return (
    <View style={[s.root, webFill]}>
      <StatusBar style="dark" />
      <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom }]}>
        <View style={s.topBarRow}>
          <View style={s.topBarSide} />
          <View style={s.topBarTitleOverlay} pointerEvents="none">
            <Text style={s.topBarTitle}>Product images</Text>
          </View>
          <AnimatedPressable
            style={s.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close product images"
          >
            <CloseIcon size={22} color={colors.textPrimary} />
          </AnimatedPressable>
        </View>
      </View>

      <View style={s.stage} onLayout={onStageLayout}>
        {stageH > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            style={{ width: stageW, height: stageH }}
            accessibilityLabel="Product images"
          >
            {images.map((src, i) => (
              <View key={i} style={[s.slide, { width: stageW, height: stageH }]}>
                <ExpoImage
                  source={src}
                  style={{ width: stageW - 32, height: stageH - 24 }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  accessibilityIgnoresInvertColors
                  accessibilityLabel={`Product image ${i + 1} of ${images.length}`}
                />
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {showThumbs ? (
        <View style={[s.thumbBar, { paddingBottom: insets.bottom + THUMB_PAD_BOTTOM }]}>
          <ScrollView
            ref={thumbScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.thumbRow, thumbsFit ? s.thumbRowCentered : null]}
            accessibilityLabel="Product image thumbnails"
          >
            {images.map((src, i) => {
              const active = i === index;
              return (
                <AnimatedPressable
                  key={i}
                  scaleTo={0.96}
                  style={[s.thumb, active ? s.thumbActive : s.thumbInactive]}
                  onPress={() => goTo(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Product image ${i + 1}`}
                  accessibilityState={{ selected: active }}
                >
                  <ExpoImage source={src} style={s.thumbImage} contentFit="contain" cachePolicy="memory-disk" />
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
    </View>
  );
}

const webFill: ViewStyle | null =
  Platform.OS === 'web' ? ({ height: '100vh' } as unknown as ViewStyle) : null;

const s = StyleSheet.create({
  modalHost: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgApp,
  },
  topBar: {
    backgroundColor: colors.white,
    zIndex: 2,
  },
  topBarRow: {
    height: layout.topBarTitleRow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBarSide: {
    width: 44,
    height: 44,
  },
  topBarTitleOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgApp,
  },
  thumbBar: {
    flexShrink: 0,
    paddingTop: THUMB_PAD_TOP,
    backgroundColor: colors.bgApp,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THUMB_GAP,
    paddingHorizontal: THUMB_PAD_H,
  },
  thumbRowCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  thumbInactive: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
  },
  thumbImage: {
    width: '90%',
    height: '90%',
  },
});
