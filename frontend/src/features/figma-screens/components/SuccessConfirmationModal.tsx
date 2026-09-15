import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useModalCardEnter } from '@/components/motion/hooks';

import { EventSuccessCheckIcon } from './EventIcons';
import { colors, fontFamilies, radius, textStyles } from '../tokens';

type Props = {
  visible: boolean;
  message: string;
  buttonLabel: string;
  onPress: () => void;
};

/**
 * Shared success overlay with checkmark — same shell as event registration
 * confirmation (`EventRegistrationSuccessModal`).
 */
export function SuccessConfirmationModal({ visible, message, buttonLabel, onPress }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onPress}>
      <SuccessConfirmationContent message={message} buttonLabel={buttonLabel} onPress={onPress} />
    </Modal>
  );
}

function SuccessConfirmationContent({
  message,
  buttonLabel,
  onPress,
}: {
  message: string;
  buttonLabel: string;
  onPress: () => void;
}) {
  const { cardStyle, scrimStyle } = useModalCardEnter();

  return (
    <View style={s.root}>
      <Animated.View style={[s.scrim, scrimStyle]} pointerEvents="none" />
      <Animated.View style={[s.card, cardStyle]}>
        <View style={s.cardInner}>
          <View style={s.messageBlock}>
            <EventSuccessCheckIcon width={79} height={79} />
            <Text style={s.message} accessibilityRole="header">
              {message}
            </Text>
          </View>
          <AnimatedPressable
            style={s.actionBtn}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
          >
            <Text style={s.actionLabel}>{buttonLabel}</Text>
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
    maxWidth: 359,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 28,
    paddingVertical: 30,
  },
  cardInner: {
    gap: 15,
    alignItems: 'center',
  },
  messageBlock: {
    width: '100%',
    gap: 14,
    alignItems: 'center',
  },
  message: {
    ...textStyles.headlineDetail,
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  actionBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
});
