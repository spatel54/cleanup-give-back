import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { WelcomeLogoMark } from '@/components/onboarding/OnboardingIcons';
import { colors, textStyles } from '@/features/figma-screens/tokens';

interface Props {
  onReady: () => void;
  fontsLoaded: boolean;
}

const MIN_DISPLAY_MS = 1800;
const FILL_DURATION_MS = 1600;
const TEXT_FILL_DELAY_MS = 180;
const LOGO_W = 90;
const LOGO_H = 115;
const TITLE_H = 52;
const PRIMARY_GREEN = colors.primary;
const CREAM = colors.bgApp;

function BrandLogo() {
  return <WelcomeLogoMark width={LOGO_W} height={LOGO_H} />;
}

function BrandTitle() {
  return (
    <Text style={styles.title} allowFontScaling={false}>
      Clean Up - Give Back
    </Text>
  );
}

/**
 * Bottom-up fill: one content layer + a solid green cover that shrinks from the top.
 * Avoids stacking two logo/title copies (which read as duplicates when clipping fails).
 */
function FillUp({
  progress,
  height,
  width,
  children,
  style,
}: {
  progress: Animated.Value;
  height: number;
  width: number | `${number}%`;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const coverHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  return (
    <View style={[{ height, width, overflow: 'hidden' }, style]}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: coverHeight,
          backgroundColor: PRIMARY_GREEN,
        }}
      />
    </View>
  );
}

export function AppSplashScreen({ onReady, fontsLoaded }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const logoFill = useRef(new Animated.Value(0)).current;
  const textFill = useRef(new Animated.Value(0)).current;
  const startTime = useRef(Date.now());
  const notified = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      logoFill.setValue(1);
      textFill.setValue(1);
      return;
    }

    const fill = Animated.parallel([
      Animated.timing(logoFill, {
        toValue: 1,
        duration: FILL_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.delay(TEXT_FILL_DELAY_MS),
        Animated.timing(textFill, {
          toValue: 1,
          duration: FILL_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]);
    fill.start();
    return () => fill.stop();
  }, [reducedMotion, logoFill, textFill]);

  useEffect(() => {
    if (!fontsLoaded) return;

    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (!notified.current) {
          notified.current = true;
          onReady();
        }
      });
    }, remaining);

    return () => clearTimeout(timer);
  }, [fontsLoaded, onReady, opacity]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <View style={styles.container}>
        <View style={styles.content}>
          <FillUp progress={logoFill} height={LOGO_H} width={LOGO_W}>
            <BrandLogo />
          </FillUp>
          <FillUp progress={textFill} height={TITLE_H} width="100%">
            <BrandTitle />
          </FillUp>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: PRIMARY_GREEN,
  },
  content: {
    alignItems: 'center',
    gap: 30,
    width: '100%',
    paddingHorizontal: 28,
  },
  title: {
    ...textStyles.headlinePage,
    color: CREAM,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 6,
  },
});
