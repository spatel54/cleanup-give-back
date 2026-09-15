import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { PlayOnceLottie } from '@/components/ui/PlayOnceLottie';

/**
 * Photo-submitted Camera Pop-Up animation (dotLottie).
 * Metro already resolves `.lottie` via `assetExts`. The file is a repeater-baked
 * repack of `Camera Pop-Up.lottie` so native Lottie draws all flash rays.
 */
const SUCCESS_LOTTIE = require('../../../assets/animations/photo-submitted.lottie');

type Props = {
  size?: number;
  /** Headroom above the artboard when effects extend upward. */
  topInset?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Photo-submitted hero — looping Camera Pop-Up `.lottie`. */
export function PhotoSubmittedHeroVideo({
  size = 150,
  topInset = 0,
  style,
  accessibilityLabel = 'Photo submitted',
}: Props) {
  return (
    <PlayOnceLottie
      source={SUCCESS_LOTTIE}
      size={size}
      topInset={topInset}
      style={[s.frame, style]}
      accessibilityLabel={accessibilityLabel}
      loop
    />
  );
}

const s = StyleSheet.create({
  frame: {
    backgroundColor: 'transparent',
  },
});
