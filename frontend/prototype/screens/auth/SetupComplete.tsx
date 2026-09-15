// PROTOTYPE — NOT FINAL. All data mocked. No business logic.

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
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

export function SetupComplete({ go }: Props) {
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
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
        {/* ── Checkmark icon ────────────────────────────────────────── */}
        <View
          style={styles.checkWrap}
          accessibilityRole="image"
          accessibilityLabel="Setup complete checkmark"
        >
          <Text style={styles.checkGlyph}>✓</Text>
        </View>

        {/* ── Headline + body ───────────────────────────────────────── */}
        <Text style={styles.headline} accessibilityRole="header">
          You're ready
        </Text>
        <Text style={styles.body}>
          Your account is set up. You can now track cleanup sessions, submit hours, and view your impact.
        </Text>

        {/* ── CTA buttons ───────────────────────────────────────────── */}
        <View style={styles.buttonGroup}>
          <PrimaryButton
            label="Start Tracking"
            onPress={() => go('session-setup')}
            accessibilityLabel="Start tracking a cleanup session"
          />
          <View style={styles.secondaryGroup}>
            <SecondaryButton
              label="Start Quick Tour"
              onPress={() => go('coachmark')}
              accessibilityLabel="Start the quick app tour"
            />
            <SecondaryButton
              label="Go to Home"
              onPress={() => go('home')}
              accessibilityLabel="Go to the home screen"
            />
          </View>
        </View>
      </Animated.View>
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

  // ── Checkmark ─────────────────────────────────────────────────────────────
  checkWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  checkGlyph: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: '700',
    lineHeight: 34,
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
    gap: 16,
  } as ViewStyle,
  secondaryGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
});
