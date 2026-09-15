// PROTOTYPE — NOT FINAL. All data mocked. No business logic.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

interface CoachStep {
  title: string;
  body: string;
}

const STEPS: CoachStep[] = [
  {
    title: 'Home Impact Dashboard',
    body: 'Home shows your hours, impact, recent logs, and events.',
  },
  {
    title: 'Center Track Button',
    body: 'Tap Track anytime to start or resume a cleanup session.',
  },
  {
    title: 'Photo Checkpoints',
    body: 'Submit a photo every 30 minutes to keep the session valid.',
  },
  {
    title: 'Sessions',
    body: 'Search, filter, and view sessions by calendar.',
  },
  {
    title: 'Shop + Donate',
    body: 'Buy cleanup items or donate directly.',
  },
  {
    title: 'Account + Export',
    body: 'Export hours, view orders, donations, and preferences.',
  },
];

export function Coachmark({ go }: Props) {
  const [step, setStep] = useState(0);

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // Animate card on every step change
  useEffect(() => {
    // Reset to entry values
    cardOpacity.setValue(0);
    cardScale.setValue(0.95);

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, cardOpacity, cardScale]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleNext() {
    if (isLast) {
      go('coachmark-complete');
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleSkip() {
    go('home');
  }

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      {/* ── Dimmed background ─────────────────────────────────────── */}
      <View style={styles.dim} pointerEvents="none" />

      {/* ── Card ──────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
        accessibilityRole="none"
        accessibilityLabel={`Coachmark step ${step + 1} of ${STEPS.length}: ${current.title}`}
      >
        {/* Step indicator */}
        <Text style={styles.stepIndicator}>
          {step + 1} of {STEPS.length}
        </Text>

        {/* Title */}
        <Text style={styles.cardTitle} accessibilityRole="header">
          {current.title}
        </Text>

        {/* Body */}
        <Text style={styles.cardBody}>{current.body}</Text>

        {/* Button row */}
        <View style={styles.buttonRow}>
          <View style={styles.skipWrap}>
            <SecondaryButton
              label="Skip tour"
              onPress={handleSkip}
              accessibilityLabel="Skip the quick tour and go to Home"
            />
          </View>
          <View style={styles.nextWrap}>
            <PrimaryButton
              label={isLast ? 'Finish' : 'Next'}
              onPress={handleNext}
              accessibilityLabel={
                isLast
                  ? 'Finish the tour and go to Home'
                  : `Next: step ${step + 2} of ${STEPS.length}`
              }
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Overlay container ─────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
  } as ViewStyle,
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.overlay,
  } as ViewStyle,

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  } as ViewStyle,

  // ── Step indicator ────────────────────────────────────────────────────────
  stepIndicator: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
    marginBottom: 8,
  } as TextStyle,

  // ── Title + body ──────────────────────────────────────────────────────────
  cardTitle: {
    ...(Typography.headlineSmall as TextStyle),
    color: Colors.black,
    marginBottom: 8,
  } as TextStyle,
  cardBody: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  } as TextStyle,

  // ── Button row ────────────────────────────────────────────────────────────
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  skipWrap: {
    flex: 1,
  } as ViewStyle,
  nextWrap: {
    flex: 1,
  } as ViewStyle,
});
