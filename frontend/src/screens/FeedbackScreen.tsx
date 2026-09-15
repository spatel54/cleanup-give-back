import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { staggerDelay } from '@/motion';

import { colors as tokens, radius, textStyles } from '@/constants/tokens';
import { submitFeedback, type FeedbackRating } from '@/lib/feedbackApi';

const C = {
  bgApp: tokens.bgApp,
  bgSurface: tokens.white,
  primary: tokens.primary,
  primaryBorder: tokens.primary,
  selectedBg: tokens.statusApprovedBg,
  textPrimary: tokens.textPrimary,
  textSecondary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
} as const;

const CHAT_W = 138;
const CHAT_H = 121;
/** PRD: Figma "Feedback Icon" (1126:1419) frame is 46.875×46.875. */
const EMOJI_SIZE = 46.875;
/**
 * Glyph size inside the frame. Figma used half-frame (23.4375) with equal padding;
 * we size up so the muted outline faces stay readable on cream button fills.
 */
const EMOJI_ICON_SIZE = 32;
const FEEDBACK_MAX_LENGTH = 1000;

/**
 * PRD: Figma feedback_screen (1126:1516) "Feedback Icons Row" shows 5 icon slots, but
 * two are an identical duplicate "Neutral" glyph — a Figma authoring artifact, not an
 * intentional design. Extended into a coherent 5-point scale using the existing asset
 * SVGs plus a hand-authored `very-sad.svg` (same style/viewBox) for the 5th slot, which
 * has no Figma source. Left-to-right order is Very Sad → Excited (negative → positive).
 */
const EMOJIS: Array<{ key: string; rating: FeedbackRating; source: number; label: string }> = [
  { key: 'verySad', rating: 'very_sad', source: require('../../assets/figma/feedback-screen/very-sad.svg'), label: 'Very sad' },
  { key: 'sad', rating: 'sad', source: require('../../assets/figma/feedback-screen/sad.svg'), label: 'Sad' },
  { key: 'neutral', rating: 'neutral', source: require('../../assets/figma/feedback-screen/neutral.svg'), label: 'Neutral' },
  { key: 'happy', rating: 'happy', source: require('../../assets/figma/feedback-screen/happy.svg'), label: 'Happy' },
  { key: 'excited', rating: 'excited', source: require('../../assets/figma/feedback-screen/excited.svg'), label: 'Excited' },
] as const;

const BUBBLE_TIMING = { duration: 180, easing: Easing.out(Easing.ease) };
/** Delay before the first bubble appears, letting the card entrance finish. */
const BUBBLE_START_MS = 280;
/** Exceeds BUBBLE_TIMING.duration so each dot finishes fading in before the next starts. */
const BUBBLE_STAGGER_MS = 220;

/** A single emoji rating option — tints primary green and pops with a little bounce when selected. */
function EmojiRatingButton({
  source,
  label,
  selected,
  onPress,
}: {
  source: number;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const bounce = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      bounce.value = withSequence(
        withTiming(1.08, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 14, stiffness: 160 }),
      );
    }
  }, [selected, bounce]);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounce.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[s.emojiButton, selected && s.emojiButtonSelected]}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Animated.View style={bounceStyle}>
        <Image
          source={source}
          style={[s.emojiImage, selected ? s.emojiImageSelected : s.emojiImageIdle]}
          contentFit="contain"
          pointerEvents="none"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </AnimatedPressable>
  );
}

export type FeedbackSource = 'session' | 'account';

type FeedbackScreenProps = {
  /** Defaults to the session-end copy so `/session-feedback` is unchanged. */
  title?: string;
  subtitle?: string;
  /** Controls post-submit / skip destinations. Default `'session'`. */
  source?: FeedbackSource;
};

const DEFAULT_TITLE = 'Rate your experience!';
const DEFAULT_SUBTITLE =
  'Your feedback will help us improve this experience for others.';

/** PRD: Figma feedback_screen (1126:1516) */
export function FeedbackScreen({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  source = 'session',
}: FeedbackScreenProps = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; id?: string }>();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Card section entrance animations
  const iconStyle = useFadeUpEnter(0);
  const titleStyle = useFadeUpEnter(staggerDelay(1));
  const emojiStyle = useFadeUpEnter(staggerDelay(2));
  const inputStyle = useFadeUpEnter(staggerDelay(3));
  const actionsStyle = useFadeUpEnter(staggerDelay(4));

  // Bubble progressive fade-in along the arc, small → medium → big
  // (PRD: Figma "Feedback Icons Group" 1126:1554 typing dots).
  const bigOpacity = useSharedValue(0);
  const mediumOpacity = useSharedValue(0);
  const smallOpacity = useSharedValue(0);

  const bigBubbleStyle = useAnimatedStyle(() => ({ opacity: bigOpacity.value }));
  const mediumBubbleStyle = useAnimatedStyle(() => ({ opacity: mediumOpacity.value }));
  const smallBubbleStyle = useAnimatedStyle(() => ({ opacity: smallOpacity.value }));

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    smallOpacity.value = withDelay(BUBBLE_START_MS, withTiming(1, BUBBLE_TIMING));
    mediumOpacity.value = withDelay(BUBBLE_START_MS + BUBBLE_STAGGER_MS, withTiming(1, BUBBLE_TIMING));
    bigOpacity.value = withDelay(BUBBLE_START_MS + BUBBLE_STAGGER_MS * 2, withTiming(1, BUBBLE_TIMING));
  }, [fontsLoaded, bigOpacity, mediumOpacity, smallOpacity]);

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  async function handleSubmit() {
    if (selectedRating !== null && feedbackText.trim()) {
      const rating = EMOJIS[selectedRating]?.rating;
      if (rating) {
        try {
          await submitFeedback({
            source,
            rating,
            comment: feedbackText.trim(),
          });
        } catch (error) {
          Alert.alert(
            'Feedback not sent',
            "We couldn't send your feedback right now, but we appreciate your input.",
          );
        }
      }
    }

    switch (source) {
      case 'account':
        router.push({ pathname: '/feedback-thank-you', params: { returnTo: 'account' } });
        return;
      case 'session': {
        const returnTo = typeof params.returnTo === 'string' ? params.returnTo : undefined;
        const sessionId = typeof params.id === 'string' ? params.id : undefined;
        if (returnTo === 'session-detail' && sessionId) {
          router.push({
            pathname: '/feedback-thank-you',
            params: { returnTo: 'session-detail', id: sessionId },
          });
          return;
        }
        router.push('/feedback-thank-you');
        return;
      }
      default: {
        const _exhaustive: never = source;
        return _exhaustive;
      }
    }
  }

  function handleSkip() {
    switch (source) {
      case 'account':
        router.back();
        return;
      case 'session':
        router.back();
        return;
      default: {
        const _exhaustive: never = source;
        return _exhaustive;
      }
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={s.root}>
        <View style={s.center}>
          <View style={s.card}>
            {/* Chat bubble + progressive typing dots */}
            <Animated.View style={[s.iconGroup, iconStyle]}>
              <Image
                source={require('../../assets/figma/feedback-screen/chat.svg')}
                style={s.chatSvg}
                contentFit="contain"
                pointerEvents="none"
                accessibilityIgnoresInvertColors
              />
              {/* Bubbles trail along an arc, big (top-left) to small (bottom-right), fading in that order */}
              <Animated.View style={[s.bigBubble, bigBubbleStyle]}>
                <Image
                  source={require('../../assets/figma/feedback-screen/big-bubble.svg')}
                  style={s.bigBubbleImg}
                  contentFit="contain"
                  pointerEvents="none"
                  accessibilityIgnoresInvertColors
                />
              </Animated.View>
              <Animated.View style={[s.mediumBubble, mediumBubbleStyle]}>
                <Image
                  source={require('../../assets/figma/feedback-screen/medium-bubble.svg')}
                  style={s.mediumBubbleImg}
                  contentFit="contain"
                  pointerEvents="none"
                  accessibilityIgnoresInvertColors
                />
              </Animated.View>
              <Animated.View style={[s.smallBubble, smallBubbleStyle]}>
                <Image
                  source={require('../../assets/figma/feedback-screen/small-bubble.svg')}
                  style={s.smallBubbleImg}
                  contentFit="contain"
                  pointerEvents="none"
                  accessibilityIgnoresInvertColors
                />
              </Animated.View>
            </Animated.View>

            {/* Title + subtitle */}
            <Animated.View style={[s.textBlock, titleStyle]}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.subtitle}>{subtitle}</Text>
            </Animated.View>

            {/* Emoji rating row */}
            <Animated.View style={[s.emojiRow, emojiStyle]}>
              {EMOJIS.map(({ key, rating, source, label }, index) => (
                <EmojiRatingButton
                  key={key}
                  source={source}
                  label={label}
                  selected={selectedRating === index}
                  onPress={() => setSelectedRating(index)}
                />
              ))}
            </Animated.View>

            {/* Text input */}
            <Animated.View style={[s.inputWrapper, inputStyle]}>
              <TextInput
                style={s.textInput}
                placeholder="Tell us how we can improve...."
                placeholderTextColor={C.textSecondary}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                textAlignVertical="top"
                maxLength={FEEDBACK_MAX_LENGTH}
                accessibilityLabel="Feedback text input"
              />
              {feedbackText.length > 0 && (
                <Text style={s.charCount} accessibilityLiveRegion="polite">
                  {feedbackText.length}/{FEEDBACK_MAX_LENGTH}
                </Text>
              )}
            </Animated.View>

            {/* Actions */}
            <Animated.View style={[s.actions, actionsStyle]}>
              <AnimatedPressable style={s.submitButton} onPress={handleSubmit}>
                <Text style={s.submitLabel}>Submit</Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={handleSkip} style={s.skipButton}>
                <Text style={s.skipLabel}>Skip</Text>
              </AnimatedPressable>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    paddingHorizontal: 25,
    paddingVertical: 20,
    gap: 20,
    alignItems: 'center',
  },

  // ── Chat bubble illustration ─────────────────────────────────────────────
  // Container sized to 2× the chat.svg source dimensions (81×71 → 162×142).
  // The bubble tail is at the bottom-left, so the body occupies the upper ~65%.
  iconGroup: {
    width: CHAT_W,
    height: CHAT_H,
  },
  chatSvg: {
    position: 'absolute',
    inset: 0,
    width: CHAT_W,
    height: CHAT_H,
  },

  bigBubble: {
    position: 'absolute',
    left: 23,
    top: 16,
    width: 22,
    height: 28,
  },
  bigBubbleImg: {
    width: 22,
    height: 28,
  },
  mediumBubble: {
    position: 'absolute',
    left: 61,
    top: 39,
    width: 20,
    height: 20,
  },
  mediumBubbleImg: {
    width: 20,
    height: 20,
  },
  smallBubble: {
    position: 'absolute',
    left: 92,
    top: 58,
    width: 13,
    height: 13,
  },
  smallBubbleImg: {
    width: 15,
    height: 15,
  },

  // ── Text ─────────────────────────────────────────────────────────────────
  textBlock: {
    width: '100%',
    gap: 6,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    color: C.textPrimary,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 17,
  },

  // ── Emoji row ─────────────────────────────────────────────────────────────
  emojiRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.borderOutline,
    backgroundColor: C.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSelected: {
    backgroundColor: C.selectedBg,
    borderColor: C.primary,
  },
  emojiImage: {
    width: EMOJI_ICON_SIZE,
    height: EMOJI_ICON_SIZE,
  },
  /** Assets ship as gray300 (#BDCABA); tint so idle faces read clearly on cream. */
  emojiImageIdle: {
    tintColor: C.textPrimary,
  },
  emojiImageSelected: {
    tintColor: C.primary,
  },

  // ── Text input ────────────────────────────────────────────────────────────
  inputWrapper: {
    width: '100%',
  },
  textInput: {
    height: 145,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 6,
    paddingHorizontal: 9.5,
    paddingTop: 11,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textPrimary,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 11,
    color: C.textSecondary,
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  submitButton: {
    width: '100%',
    height: 59,
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    ...textStyles.labelButton,
    color: C.textOnPrimary,
  },
  skipButton: {
    paddingVertical: 4,
  },
  skipLabel: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textSecondary,
  },
});
