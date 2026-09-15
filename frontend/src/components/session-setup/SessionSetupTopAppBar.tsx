import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';

import { colors as tokens, shadows, textStyles } from '@/constants/tokens';

const C = {
  textOnPrimary: tokens.textOnPrimary,
  textPrimary: tokens.textPrimary,
} as const;


type Props = {
  title: string;
  onBack: () => void;
  /** Optional trailing control (e.g. Letters Select). Keeps title centered. */
  rightAction?: ReactNode;
};

const BAR_PADDING_BOTTOM = 8.5;

/** Figma TopAppBar `260:1392` — white bar, drop shadow, back chevron + centered title. */
export function SessionSetupTopAppBar({ title, onBack, rightAction }: Props) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Sanchez_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={[s.bar, { paddingTop: insets.top, paddingBottom: BAR_PADDING_BOTTOM }]} />
    );
  }

  return (
    <View style={[s.bar, { paddingTop: insets.top, paddingBottom: BAR_PADDING_BOTTOM }]}>
      <View style={s.navRow}>
        <AnimatedPressable
          style={s.backBtn}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SessionSetupBackChevronIcon color={C.textPrimary} />
        </AnimatedPressable>

        <View style={s.titleOverlay} pointerEvents="none">
          <Text style={s.title}>{title}</Text>
        </View>

        <View style={s.rightSlot}>{rightAction}</View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: C.textOnPrimary,
    ...shadows.barTop,
  },

  navRow: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backBtn: {
    width: 24,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 1,
  },

  titleOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    ...textStyles.headlineTopBar,
    color: C.textPrimary,
    textAlign: 'center',
  },

  rightSlot: {
    minWidth: 24,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1,
  },
});
