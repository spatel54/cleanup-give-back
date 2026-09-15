import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { PhotoSubmittedHeroVideo } from '@/components/ui/PhotoSubmittedHeroVideo';
import { staggerDelay } from '@/motion';
import { formatCountdown } from '@/features/session-tracking/mocks/session';
import {
  PHOTO_CHECKPOINT_INTERVAL_SECONDS,
  ensureLiveSessionTicking,
  resetCheckpointCountdown,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import {
  countSubmittedCheckpointPhotos,
  formatCheckpointOrdinal,
  formatSubmittedCheckpointCount,
} from '@/features/session-tracking/utils/sessionFormat';

import { colors as tokens, radius, textStyles } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  bgSurface: tokens.chipBg,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
  overlayScrimStrong: tokens.overlayScrimStrong,
} as const;

/** Match missed-checkpoint `PlayOnceLottie` default size (150). */
const HERO_SIZE = 150;
/** Headroom unused — artboard matches missed-checkpoint 500×500 fill. */
const HERO_TOP_INSET = 0;
/** Equal inset from card border to hero top and button bottom. */
const CARD_VERTICAL_INSET = 24;

/** PRD §6.12 · Figma `photo_submitted` (260:1571). */
export function PhotoSubmittedScreen() {
  const router = useRouter();
  const { checkpointSecondsRemaining, isActive, submittedCheckpoints } = useLiveSession();
  const submittedCheckpointCount = submittedCheckpoints.length;
  const latestSubmission = submittedCheckpoints[submittedCheckpointCount - 1];
  const showSubmissionCount = latestSubmission?.submittedEarly ?? false;
  const submittedCheckpointLabel = formatSubmittedCheckpointCount(
    countSubmittedCheckpointPhotos(submittedCheckpoints),
  );
  const [previewSeconds, setPreviewSeconds] = useState(PHOTO_CHECKPOINT_INTERVAL_SECONDS);
  const heroStyle = useFadeUpEnter(0);
  const copyStyle = useFadeUpEnter(staggerDelay(1));
  const timerStyle = useFadeUpEnter(staggerDelay(2));
  const ctaStyle = useFadeUpEnter(staggerDelay(3));

  useEffect(() => {
    resetCheckpointCountdown();
    ensureLiveSessionTicking();
  }, []);

  useEffect(() => {
    if (isActive) {
      return;
    }

    setPreviewSeconds(PHOTO_CHECKPOINT_INTERVAL_SECONDS);
    const timer = setInterval(() => {
      setPreviewSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  const secondsUntilNextPhoto = isActive
    ? checkpointSecondsRemaining
    : previewSeconds;

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <View style={s.root}>
      <View style={s.scrim} />

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        <Animated.View style={s.modal}>
          <Animated.View style={s.card}>
            <Animated.View style={[s.heroSection, heroStyle]}>
              <PhotoSubmittedHeroVideo
                size={HERO_SIZE}
                topInset={HERO_TOP_INSET}
                accessibilityLabel="Photo submitted"
              />
            </Animated.View>

            <View style={[s.cardContent, s.cardContentInset]}>
              <Animated.View style={[s.copyBlock, copyStyle]}>
                <Text style={s.title}>Photo Submitted</Text>
                {showSubmissionCount && (
                  <Text style={s.sessionCount}>{submittedCheckpointLabel}</Text>
                )}
                <Text style={s.body}>
                  {submittedCheckpointCount > 1
                    ? `Your ${formatCheckpointOrdinal(submittedCheckpointCount)} progress photo has been recorded.\nKeep up the great work!`
                    : 'Your progress photo has been recorded.\nKeep up the great work!'}
                </Text>
              </Animated.View>

              <View style={s.footerBlock}>
                <Animated.View style={[s.timerChip, timerStyle]}>
                  <View style={s.timerDot} />
                  <Text style={s.timerText}>
                    Next photo in {formatCountdown(secondsUntilNextPhoto)}
                  </Text>
                </Animated.View>

                <Animated.View style={ctaStyle}>
                  <AnimatedPressable
                    style={s.continueBtn}
                    onPress={() => {
                      router.dismissTo('/live-session');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Continue tracking"
                  >
                    <Text style={s.continueBtnText}>Continue Tracking</Text>
                  </AnimatedPressable>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.overlayScrimStrong,
    justifyContent: 'flex-end',
  },

  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: C.overlayScrimStrong,
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    overflow: 'visible',
  },

  modal: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },

  card: {
    width: '100%',
    backgroundColor: C.bgApp,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 16,
    paddingBottom: CARD_VERTICAL_INSET,
    overflow: 'visible',
  },

  heroSection: {
    alignItems: 'center',
    width: '100%',
    paddingTop: CARD_VERTICAL_INSET,
    paddingHorizontal: 28,
    marginBottom: -32,
    overflow: 'visible',
  },

  cardContent: {
    gap: 16,
  },

  cardContentInset: {
    paddingHorizontal: 28,
  },

  copyBlock: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },

  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
    width: '100%',
  },

  sessionCount: {
    ...textStyles.bodySmall,
    fontFamily: 'NotoSans_600SemiBold',
    color: C.primary,
    textAlign: 'center',
  },

  body: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: C.textTertiary,
    textAlign: 'center',
    width: '100%',
  },

  footerBlock: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },

  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },

  timerText: {
    ...textStyles.bodySmall,
    fontFamily: 'IBMPlexSans_400Regular',
    color: C.textPrimary,
  },

  continueBtn: {
    width: '100%',
    height: 52,
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },

  continueBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },
});
