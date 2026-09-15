import Animated from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useModalCardEnter } from '@/components/motion/hooks';
import { colors, fontFamilies, radius, spacing, textStyles } from '@/constants/tokens';

type Props = {
  onEnableFlash: () => void;
  onDismiss: () => void;
};

function FlashlightIcon() {
  const fill = colors.primary;
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
      <Path
        d="M14.8594 1.5H9.14062C8.31562 1.5 8.01562 2.175 8.01562 3H15.9844C15.9844 2.175 15.6844 1.5 14.8594 1.5ZM9.19219 6.91406C9.54844 7.32656 9.75 7.85156 9.75 8.4V20.8641C9.75 21.8906 10.5891 22.5 11.6203 22.5H12.3844C13.4109 22.5 14.2547 21.8953 14.2547 20.8641V8.4C14.2547 7.85156 14.4563 7.33125 14.8125 6.91406C15.5344 6.075 15.9844 5.29688 15.9844 3.75H8.01562C8.01562 5.39062 8.46563 6.075 9.19219 6.91406ZM10.6875 11.1703C10.6875 10.4391 11.2781 9.84375 12 9.84375C12.7219 9.84375 13.3125 10.4391 13.3125 11.1703V12.8297C13.3125 13.5609 12.7219 14.1562 12 14.1562C11.2781 14.1562 10.6875 13.5609 10.6875 12.8297V11.1703Z"
        fill={fill}
      />
      <Path
        d="M12 13.7344C12.5178 13.7344 12.9375 13.3146 12.9375 12.7969C12.9375 12.2791 12.5178 11.8594 12 11.8594C11.4822 11.8594 11.0625 12.2791 11.0625 12.7969C11.0625 13.3146 11.4822 13.7344 12 13.7344Z"
        fill={fill}
      />
    </Svg>
  );
}

/**
 * Shown once per capture session when it's nighttime (GPS+date sunset/sunrise
 * check) and flash is off — unclear low-light photos can cause a session to
 * be declined. Applies to selfie and rear progress steps.
 */
export function FlashWarningModal({ onEnableFlash, onDismiss }: Props) {
  const { cardStyle, scrimStyle } = useModalCardEnter();

  return (
    <View style={s.root}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, s.scrim, scrimStyle]}
      />
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <Animated.View style={[s.card, cardStyle]}>
          <View style={s.heroBlock}>
            <FlashlightIcon />
            <View style={s.titleBlock}>
              <Text style={s.title}>Turn on your flash</Text>
              <Text style={s.subtitle}>
                It looks like it&apos;s nighttime. Turning on your flash helps us capture a clear
                photo. Unclear photos can cause your session to be declined.
              </Text>
            </View>
          </View>

          <View style={s.footer}>
            <AnimatedPressable
              style={s.continueBtn}
              onPress={onEnableFlash}
              accessibilityRole="button"
              accessibilityLabel="Turn on flash"
            >
              <Text style={s.continueBtnText}>Turn on flash</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={s.dismissBtn}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Continue without flash"
            >
              <Text style={s.dismissText}>Continue without flash</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scrim: {
    backgroundColor: colors.overlayScrimStrong,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    gap: spacing.lg,
  },
  heroBlock: {
    alignItems: 'center',
    gap: 16,
  },
  titleBlock: {
    gap: 8,
    alignSelf: 'stretch',
  },
  title: {
    ...textStyles.headlineDetail,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.md,
    alignItems: 'center',
    paddingTop: 4,
  },
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
  dismissBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  dismissText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textNavInactive,
  },
});
