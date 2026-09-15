// PROTOTYPE — NOT FINAL.
// PRD §6.6 — Tutorial Completion screen (after Coachmark finishes)

import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
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

export function CoachmarkComplete({ go }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconGlyph}>✓</Text>
        </View>

        <Text style={styles.headline} accessibilityRole="header">
          You've seen the basics
        </Text>
        <Text style={styles.body}>
          You're ready to start tracking your cleanup sessions and building your service record.
        </Text>

        <View style={styles.actions}>
          <PrimaryButton
            label="Start Tracking"
            onPress={() => go('session-setup')}
            accessibilityLabel="Start tracking a cleanup session"
          />
          <SecondaryButton
            label="Go to Home"
            onPress={() => go('home')}
            accessibilityLabel="Go to home screen"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
  } as ViewStyle,
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  iconGlyph: {
    fontFamily: 'Sanchez',
    fontSize: 36,
    color: Colors.white,
    lineHeight: 42,
  } as TextStyle,
  headline: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  } as TextStyle,
  body: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: 8,
  } as TextStyle,
  actions: {
    width: '100%',
    gap: 12,
  } as ViewStyle,
});
