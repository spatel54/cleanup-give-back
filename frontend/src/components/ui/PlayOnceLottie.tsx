import LottieView from 'lottie-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  source: React.ComponentProps<typeof LottieView>['source'];
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** When true, the animation repeats. Defaults to false (play once). */
  loop?: boolean;
  /**
   * Headroom above the artboard for effects that extend upward (e.g. burst lines).
   * Shifts the Lottie down inside a taller frame so parents with borderRadius don't clip it.
   */
  topInset?: number;
};

/** Lottie hero that scales to fit without cropping. Loops only when `loop` is set. */
export function PlayOnceLottie({
  source,
  size = 150,
  style,
  accessibilityLabel,
  loop = false,
  topInset = 0,
}: Props) {
  const frameHeight = size + topInset;

  return (
    <View
      style={[s.frame, { width: size, height: frameHeight }, style]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <LottieView
        source={source}
        style={[s.lottie, { width: size, height: size, marginTop: topInset }]}
        autoPlay
        loop={loop}
        resizeMode="contain"
      />
    </View>
  );
}

const s = StyleSheet.create({
  frame: {
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lottie: {
    width: '100%',
    height: '100%',
  },
});
