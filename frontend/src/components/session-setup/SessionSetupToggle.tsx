import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors as tokens } from '@/constants/tokens';

const C = {
  primary: tokens.primary,
  trackOff: tokens.chipBg,
  thumb: tokens.white,
} as const;

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const TRACK_PAD = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - TRACK_PAD * 2;

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  /** Off-track fill. Default `chipBg` — pass a darker token on chipBg cards. */
  offTrackColor?: string;
};

export function SessionSetupToggle({
  value,
  onValueChange,
  accessibilityLabel,
  offTrackColor = C.trackOff,
}: Props) {
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    offset.value = reduceMotion
      ? value ? 1 : 0
      : withTiming(value ? 1 : 0, { duration: 160 });
  }, [offset, reduceMotion, value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value * THUMB_TRAVEL }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[s.track, { backgroundColor: value ? C.primary : offTrackColor }]}
    >
      <Animated.View style={[s.thumb, thumbStyle]} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: TRACK_PAD,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: C.thumb,
  },
});
