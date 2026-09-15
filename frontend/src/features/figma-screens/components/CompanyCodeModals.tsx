import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useModalCardEnter } from '@/components/motion/hooks';

import { EventSuccessCheckIcon } from './EventIcons';
import { colors, fontFamilies, radius, textStyles } from '../tokens';

function CompanyBuildingIcon({
  size = 48,
  color = colors.primary,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 19H23V21H1V19H3V4C3 3.73478 3.10536 3.48043 3.29289 3.29289C3.48043 3.10536 3.73478 3 4 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V19H19V11H17V9H20C20.2652 9 20.5196 9.10536 20.7071 9.29289C20.8946 9.48043 21 9.73478 21 10V19ZM5 5V19H13V5H5ZM7 11H11V13H7V11ZM7 7H11V9H7V7Z"
        fill={color}
      />
    </Svg>
  );
}

type ConfirmProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirm redeeming a company upgrade code. */
export function CompanyCodeConfirmModal({ visible, onConfirm, onCancel }: ConfirmProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <CompanyCodeConfirmContent onConfirm={onConfirm} onCancel={onCancel} />
    </Modal>
  );
}

function CompanyCodeConfirmContent({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { cardStyle, scrimStyle } = useModalCardEnter();

  return (
    <View style={s.root}>
      <Animated.View style={[s.scrim, scrimStyle]} pointerEvents="none" />
      <Animated.View style={[s.card, cardStyle]}>
        <View style={s.inner}>
          <CompanyBuildingIcon />
          <Text style={s.title} accessibilityRole="header">
            Redeem company code?
          </Text>
          <Text style={s.body}>
            Redeem this company code and upgrade your account? This code can only be used once.
          </Text>
          <AnimatedPressable
            style={s.primaryBtn}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm upgrade"
          >
            <Text style={s.primaryLabel}>Upgrade account</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={s.secondaryBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={s.secondaryLabel}>Cancel</Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </View>
  );
}

type SuccessProps = {
  visible: boolean;
  onDone: () => void;
};

/** Success after company code upgrades the account. */
export function CompanyCodeUpgradeSuccessModal({ visible, onDone }: SuccessProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDone}>
      <CompanyCodeUpgradeSuccessContent onDone={onDone} />
    </Modal>
  );
}

function CompanyCodeUpgradeSuccessContent({ onDone }: { onDone: () => void }) {
  const { cardStyle, scrimStyle } = useModalCardEnter();

  return (
    <View style={s.root}>
      <Animated.View style={[s.scrim, scrimStyle]} pointerEvents="none" />
      <Animated.View style={[s.card, cardStyle]}>
        <View style={s.inner}>
          <EventSuccessCheckIcon width={79} height={79} />
          <Text style={s.title} accessibilityRole="header">
            Account has been upgraded
          </Text>
          <Text style={s.body}>
            You now have unlimited tracker access. Start a cleanup whenever you are ready.
          </Text>
          <AnimatedPressable
            style={s.primaryBtn}
            onPress={onDone}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={s.primaryLabel}>Done</Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 27, 27, 0.35)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 24,
  },
  inner: {
    gap: 16,
    alignItems: 'center',
  },
  title: {
    ...textStyles.headlineDetail,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryBtn: {
    paddingVertical: 8,
  },
  secondaryLabel: {
    ...textStyles.bodyDefault,
    color: colors.textTertiary,
  },
});
