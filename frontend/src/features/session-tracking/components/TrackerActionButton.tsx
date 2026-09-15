import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { radius, textStyles } from '../tokens';
import type { TrackerChromeColors } from '../utils/trackerChromeTheme';

const ICON_SIZE = 24;
const LABEL_LINE_HEIGHT = 24;
const ICON_LABEL_GAP = 7;

type Variant = 'primary' | 'secondary';

type Props = {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Live-tracker chrome palette (follows map light/dark). */
  chrome: Pick<
    TrackerChromeColors,
    | 'primary'
    | 'textOnPrimary'
    | 'secondaryFill'
    | 'secondaryBorder'
    | 'secondaryLabel'
  >;
};

/**
 * Full-width tracker CTA with icon + label locked to a shared 24px row so both
 * glyphs center on the same axis (Figma `251:439` Submit Photo / End Session).
 */
export function TrackerActionButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  style,
  chrome,
}: Props) {
  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      style={[
        styles.button,
        isPrimary
          ? { backgroundColor: chrome.primary }
          : {
              backgroundColor: chrome.secondaryFill,
              borderWidth: 1,
              borderColor: chrome.secondaryBorder,
            },
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <View style={styles.content}>
        <View style={styles.iconSlot}>{icon}</View>
        <Text
          style={[
            styles.label,
            {
              color: isPrimary ? chrome.textOnPrimary : chrome.secondaryLabel,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ICON_LABEL_GAP,
    height: LABEL_LINE_HEIGHT,
  },
  iconSlot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...textStyles.labelButton,
    lineHeight: LABEL_LINE_HEIGHT,
    height: LABEL_LINE_HEIGHT,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
