// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.15 — Submission Confirmation

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Screen } from '../../App';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { StatusTag } from '../../components/ui/StatusTag';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';

interface Props {
  go: (screen: Screen) => void;
}

export function SubmissionConfirmation({ go }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.root,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.content}>
        {/* Checkmark icon */}
        <View
          style={styles.checkCircle}
          accessibilityRole="none"
          accessibilityLabel="Success checkmark"
        >
          <Text style={styles.checkText}>✓</Text>
        </View>

        <View style={styles.gap20} />

        <Text
          style={styles.headline}
          accessibilityRole="header"
        >
          Submitted
        </Text>

        <View style={styles.gap8} />

        <Text style={styles.subhead}>Your session is under review.</Text>

        <View style={styles.gap24} />

        <StatusTag status="under-review" />

        <View style={styles.gap24} />

        {/* Summary card */}
        <View
          style={styles.summaryCard}
          accessibilityRole="none"
          accessibilityLabel="Session summary: 1 hour 24 minutes, Jun 5 2026, River Trail Cleanup"
        >
          <Text style={styles.summaryDuration}>1h 24m</Text>
          <View style={styles.gap4} />
          <Text style={styles.summaryDate}>Jun 5, 2026</Text>
          <View style={styles.gap4} />
          <Text style={styles.summaryTitle}>River Trail Cleanup</Text>
        </View>

        <View style={styles.gap32} />

        <PrimaryButton
          label="View Session"
          onPress={() => go('session-detail')}
          accessibilityLabel="View session detail"
        />

        <View style={styles.gap16} />

        <SecondaryButton
          label="Return Home"
          onPress={() => go('home')}
          accessibilityLabel="Return to home screen"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
  } as ViewStyle,
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  } as ViewStyle,
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  checkText: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: '700',
    lineHeight: 34,
  } as TextStyle,
  gap20: {
    height: 20,
  } as ViewStyle,
  gap8: {
    height: 8,
  } as ViewStyle,
  gap24: {
    height: 24,
  } as ViewStyle,
  gap32: {
    height: 32,
  } as ViewStyle,
  gap16: {
    height: 16,
  } as ViewStyle,
  gap4: {
    height: 4,
  } as ViewStyle,
  headline: {
    ...(Typography.headlineLarge as TextStyle),
    color: Colors.black,
    textAlign: 'center',
  },
  subhead: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: 'center',
  } as ViewStyle,
  summaryDuration: {
    ...(Typography.monoLarge as TextStyle),
    color: Colors.black,
  },
  summaryDate: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  },
  summaryTitle: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
    color: Colors.black,
  },
});
