import { Image as ExpoImage, type ImageSource } from 'expo-image';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useModalCardEnter } from '@/components/motion/hooks';
import { ChevronLeftIcon } from '@/features/session-tracking/components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/features/session-tracking/components/icons/ChevronRightIcon';
import { CloseIcon } from '@/features/session-tracking/components/icons/CloseIcon';
import { colors, radius, textStyles } from '@/constants/tokens';

const C = {
  overlay: colors.textPrimary,
  textOnDark: colors.white,
  textMuted: 'rgba(252, 249, 248, 0.72)',
  chromeScrim: colors.overlayScrimStrong,
} as const;

type Props = {
  visible: boolean;
  /** Remote / file URI — used when `source` is omitted. */
  uri?: string | null;
  /** Prefer this when available (session detail thumbs use the same source). */
  source?: ImageSource | { uri: string } | null;
  /**
   * Optional a11y label only (e.g. "Selfie" / "Progress") — not shown in chrome.
   */
  caption?: string;
  /** Date line (e.g. "July 20, 2026"). */
  dateLabel?: string;
  /** Time line (e.g. "2:30 PM"). */
  timeLabel?: string;
  /** Position counter, e.g. "1/2". */
  counterLabel?: string;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

/** Full-screen photo viewer for session detail and live checkpoint thumbs. */
export function PhotoEnlargeModal({
  visible,
  uri = null,
  source = null,
  caption,
  dateLabel,
  timeLabel,
  counterLabel,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: Props) {
  const timestampLine = [dateLabel, timeLabel].filter(Boolean).join(' · ');
  const imageSource: ImageSource | { uri: string } | null =
    source ?? (uri ? { uri } : null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {visible ? (
        <PhotoEnlargeContent
          imageSource={imageSource}
          caption={caption}
          timestampLine={timestampLine}
          counterLabel={counterLabel}
          onClose={onClose}
          onPrevious={onPrevious}
          onNext={onNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
      ) : null}
    </Modal>
  );
}

function PhotoEnlargeContent({
  imageSource,
  caption,
  timestampLine,
  counterLabel,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  imageSource: ImageSource | { uri: string } | null;
  caption?: string;
  timestampLine: string;
  counterLabel?: string;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  const { scrimStyle } = useModalCardEnter();

  const handlePhotoPress = () => {
    if (hasNext && onNext) {
      onNext();
      return;
    }
    if (hasPrevious && onPrevious) {
      onPrevious();
    }
  };

  const photoSwitchHint =
    hasNext || hasPrevious ? 'Tap photo to switch' : undefined;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={s.root}>
        <StatusBar style="light" />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, s.scrimFill, scrimStyle]}
        />

        {imageSource ? (
          <Pressable
            style={s.fullScreenImage}
            onPress={handlePhotoPress}
            disabled={!hasNext && !hasPrevious}
            accessibilityRole="button"
            accessibilityLabel={
              photoSwitchHint ?? caption ?? 'Enlarged session photo'
            }
          >
            <ExpoImage
              source={imageSource}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
              accessibilityLabel={caption ?? 'Enlarged session photo'}
            />
          </Pressable>
        ) : null}

        <SafeAreaView style={s.chrome} pointerEvents="box-none" edges={['top', 'bottom']}>
          <View style={s.topRow} pointerEvents="box-none">
            {timestampLine ? (
              <View style={[s.tag, s.chromeScrim]} pointerEvents="none">
                <Text style={s.tagText} numberOfLines={1}>
                  {timestampLine}
                </Text>
              </View>
            ) : (
              <View style={s.topSpacer} />
            )}
            <AnimatedPressable
              style={[s.roundBtn, s.chromeScrim]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close photo viewer"
            >
              <CloseIcon color={C.textOnDark} size={22} />
            </AnimatedPressable>
          </View>

          <View style={s.navRow} pointerEvents="box-none">
            <AnimatedPressable
              style={[s.roundBtn, s.chromeScrim, !hasPrevious && s.roundBtnHidden]}
              onPress={onPrevious}
              disabled={!hasPrevious}
              accessibilityRole="button"
              accessibilityLabel="Previous photo"
            >
              <ChevronLeftIcon color={C.textOnDark} size={28} strokeWidth={2.25} />
            </AnimatedPressable>

            <AnimatedPressable
              style={[s.roundBtn, s.chromeScrim, !hasNext && s.roundBtnHidden]}
              onPress={onNext}
              disabled={!hasNext}
              accessibilityRole="button"
              accessibilityLabel="Next photo"
            >
              <ChevronRightIcon color={C.textOnDark} size={28} strokeWidth={2.25} />
            </AnimatedPressable>
          </View>

          <View style={s.bottomStack} pointerEvents="none">
            {counterLabel ? (
              <View style={[s.tag, s.chromeScrim]}>
                <Text style={s.counterText} accessibilityLabel={`Photo ${counterLabel}`}>
                  {counterLabel}
                </Text>
              </View>
            ) : null}
            {photoSwitchHint ? <Text style={s.hint}>{photoSwitchHint}</Text> : null}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.overlay,
  },
  scrimFill: {
    backgroundColor: C.overlay,
  },

  fullScreenImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },

  chrome: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },

  chromeScrim: {
    backgroundColor: C.chromeScrim,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 12,
  },

  topSpacer: {
    flex: 1,
  },

  tag: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
  },

  tagText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textOnDark,
  },

  counterText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 14,
    letterSpacing: 1,
    color: C.textOnDark,
    textAlign: 'center',
  },

  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roundBtnHidden: {
    opacity: 0,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    flex: 1,
  },

  bottomStack: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },

  hint: {
    ...textStyles.bodySmall,
    color: C.textMuted,
    textAlign: 'center',
  },
});
