// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.10 — Permissions (Location → Camera two-step flow)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Screen } from '../../App';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';

interface Props {
  go: (screen: Screen) => void;
}

const STEPS = [
  {
    iconLabel: '⊕',
    headline: 'Enable location',
    body: 'Location is required to verify your walking path during the cleanup.',
    primaryLabel: 'Enable Location',
    secondaryLabel: 'Not now',
  },
  {
    iconLabel: '📷',
    headline: 'Enable camera',
    body: 'Camera access is required for photo checkpoints during tracking.',
    primaryLabel: 'Enable Camera',
    secondaryLabel: 'Not now',
  },
];

export function Permissions({ go }: Props) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];

  function handlePrimary() {
    if (step === 0) {
      setStep(1);
    } else {
      go('live-session');
    }
  }

  function handleSecondary() {
    go('home');
  }

  return (
    <View style={styles.root}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step ? styles.dotActive : styles.dotInactive,
            ]}
            accessibilityRole="none"
            accessibilityLabel={`Step ${i + 1} of ${STEPS.length}${i === step ? ', current' : ''}`}
          />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Permission icon circle */}
        <View style={styles.iconCircle} accessibilityRole="none">
          <Text style={styles.iconText}>{current.iconLabel}</Text>
        </View>

        <View style={styles.gap24} />

        <Text
          style={styles.headline}
          accessibilityRole="header"
        >
          {current.headline}
        </Text>

        <View style={styles.gap12} />

        <Text style={styles.body}>{current.body}</Text>

        <View style={styles.gap40} />

        <PrimaryButton
          label={current.primaryLabel}
          onPress={handlePrimary}
          accessibilityLabel={current.primaryLabel}
        />

        <View style={styles.gap8} />

        <SecondaryButton
          label={current.secondaryLabel}
          onPress={handleSecondary}
          accessibilityLabel={`${current.secondaryLabel} — cannot start session without permission`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 60,
    paddingBottom: 40,
  } as ViewStyle,
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 48,
  } as ViewStyle,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  dotActive: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  dotInactive: {
    backgroundColor: Colors.surfaceDeep,
  } as ViewStyle,
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  } as ViewStyle,
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  iconText: {
    fontSize: 28,
    color: Colors.white,
    lineHeight: 34,
  } as TextStyle,
  gap24: {
    height: 24,
  } as ViewStyle,
  gap12: {
    height: 12,
  } as ViewStyle,
  gap40: {
    height: 40,
  } as ViewStyle,
  gap8: {
    height: 8,
  } as ViewStyle,
  headline: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.black,
    textAlign: 'center',
  },
  body: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
});
