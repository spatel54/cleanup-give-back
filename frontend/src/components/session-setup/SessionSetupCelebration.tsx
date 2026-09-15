import { useEffect } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/** Emil Kowalski entrance — strong ease-out; fade + rotate only (no scale). */
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER_MS = 380;
const INITIAL_DELAY_MS = 350;
const STAGGER_MS = 80;
const ROTATE_OFFSET = 90;

type StarLayout = {
  style: StyleProp<ImageStyle>;
  /** Final rotation in degrees once settled. */
  rotateTo: number;
  /** Entrance spin direction — alternates for visual variety. */
  rotateFromOffset: number;
};

/**
 * Star scatter around the smiley — matched to Figma 251:405 / reference layout.
 * TL hugs upper-left of circle; TR is highest/smallest; BL is lowest/largest; BR sits mid-right below center.
 */
const STARS: StarLayout[] = [
  { style: { top: 54, left: 14, width: 50, height: 56 }, rotateTo: 18, rotateFromOffset: -ROTATE_OFFSET },
  { style: { top: 22, right: 46, width: 42, height: 48 }, rotateTo: -14, rotateFromOffset: ROTATE_OFFSET },
  { style: { bottom: 10, left: 2, width: 62, height: 70 }, rotateTo: -34, rotateFromOffset: -ROTATE_OFFSET },
  { style: { bottom: 52, right: 12, width: 52, height: 59 }, rotateTo: 14, rotateFromOffset: ROTATE_OFFSET },
];

function AnimatedStar({
  index,
  layout,
}: {
  index: number;
  layout: StarLayout;
}) {
  const reducedMotion = useReducedMotion();
  const rotateFrom = layout.rotateTo + layout.rotateFromOffset;
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const rotation = useSharedValue(reducedMotion ? layout.rotateTo : rotateFrom);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const delay = INITIAL_DELAY_MS + index * STAGGER_MS;
    const timing = { duration: ENTER_MS, easing: EASE_OUT };

    opacity.value = withDelay(delay, withTiming(1, timing));
    rotation.value = withDelay(delay, withTiming(layout.rotateTo, timing));
  }, [index, layout.rotateTo, layout.rotateFromOffset, opacity, reducedMotion, rotateFrom, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[s.star, layout.style, animatedStyle]}>
      <Image
        source={require('@/assets/images/screens/session-setup/complete-star.png')}
        style={s.starImage}
        resizeMode="contain"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </Animated.View>
  );
}

/** Smiley center + four staggered, rotating stars (Figma 251:405). */
export function SessionSetupCelebration() {
  return (
    <View style={s.artboard} accessibilityLabel="Celebration smiley with stars">
      <Image
        source={require('@/assets/images/screens/session-setup/complete-smiley.png')}
        style={s.smiley}
        resizeMode="contain"
      />
      {STARS.map((layout, index) => (
        <AnimatedStar key={index} index={index} layout={layout} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  artboard: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smiley: {
    width: 176,
    height: 176,
  },
  star: {
    position: 'absolute',
  },

  starImage: {
    width: '100%',
    height: '100%',
  },
});
