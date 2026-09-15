import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { PlayOnceLottie } from '@/components/ui/PlayOnceLottie';
import { staggerDelay } from '@/motion';

import { endLiveSession } from '@/features/session-tracking/liveSessionStore';

import { colors as tokens, radius } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
  statusDeclined: tokens.statusDeclinedText,
  overlayScrimStrong: tokens.overlayScrimStrong,
} as const;

/** Shown when a session draft is discarded without end photos — not a grace-miss dead-end. */
export function MissedCheckpointScreen() {
  const router = useRouter();
  const heroStyle = useFadeUpEnter(0);
  const copyStyle = useFadeUpEnter(staggerDelay(1));
  const actionsStyle = useFadeUpEnter(staggerDelay(2));

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  const handleReturnHome = () => {
    endLiveSession();
    router.replace('/');
  };

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <View style={s.root}>
      <View style={s.scrim} />

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        <Animated.View style={[s.card, heroStyle]}>
          <View style={s.cardContent}>
            <Animated.View style={s.heroBlock}>
              <PlayOnceLottie
                source={require('../../assets/animations/missed-checkpoint.json')}
                accessibilityLabel="Session not submitted"
                loop
              />
              <Text style={s.title}>Session not submitted</Text>
            </Animated.View>

            <Animated.View style={[s.infoBox, copyStyle]}>
              <Text style={s.infoPrimary}>
                This session was not submitted because the required end photos were not taken.
              </Text>
              <Text style={s.infoSecondary}>
                Start a new session when you are ready to track again.
              </Text>
            </Animated.View>

            <Animated.View style={[s.actions, actionsStyle]}>
              <AnimatedPressable
                style={s.homeBtn}
                onPress={handleReturnHome}
                accessibilityRole="button"
                accessibilityLabel="Return home"
              >
                <Text style={s.homeBtnText}>Return Home</Text>
              </AnimatedPressable>
            </Animated.View>
          </View>
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
  },

  card: {
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 16,
    paddingHorizontal: 27,
    paddingVertical: 17,
    alignItems: 'center',
  },

  cardContent: {
    width: '100%',
    maxWidth: 303,
    gap: 20,
    alignItems: 'center',
  },

  heroBlock: {
    alignItems: 'center',
  },

  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
  },

  infoBox: {
    width: '100%',
    gap: 8,
  },

  infoPrimary: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: C.textPrimary,
    textAlign: 'center',
  },

  infoSecondary: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: C.textTertiary,
    textAlign: 'center',
  },

  actions: {
    width: '100%',
  },

  homeBtn: {
    width: '100%',
    height: 59,
    backgroundColor: C.statusDeclined,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  homeBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },
});
