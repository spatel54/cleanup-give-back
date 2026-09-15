// PROTOTYPE — NOT FINAL. All data mocked. No business logic.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

export function NotificationPreference({ go }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* ── Bell icon placeholder ────────────────────────────────── */}
        <View
          style={styles.iconWrap}
          accessibilityRole="image"
          accessibilityLabel="Notification bell icon"
        >
          <Text style={styles.iconGlyph}>🔔</Text>
        </View>

        {/* ── Headline + body ───────────────────────────────────────── */}
        <Text style={styles.headline} accessibilityRole="header">
          Stay updated
        </Text>
        <Text style={styles.body}>
          Get notified about session reviews, approval updates, photo checkpoints, and new events.
        </Text>

        {/* ── CTA buttons ───────────────────────────────────────────── */}
        <View style={styles.buttonGroup}>
          <PrimaryButton
            label="Enable Notifications"
            onPress={() => go('setup-complete')}
            accessibilityLabel="Enable push notifications"
          />
          <SecondaryButton
            label="Not now"
            onPress={() => go('setup-complete')}
            accessibilityLabel="Skip enabling notifications for now"
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

  // ── Icon ──────────────────────────────────────────────────────────────────
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  iconGlyph: {
    fontSize: 20,
  } as TextStyle,

  // ── Text ──────────────────────────────────────────────────────────────────
  headline: {
    ...(Typography.headlineLarge as TextStyle),
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 12,
  } as TextStyle,
  body: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  } as TextStyle,

  // ── Buttons ───────────────────────────────────────────────────────────────
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
});
