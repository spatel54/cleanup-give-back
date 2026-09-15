// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.8 — Event Detail

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

export function EventDetail({ go }: Props) {
  // Entrance animation: fade + 8px slide up, 220ms
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Event Detail"
        onBack={() => go('home')}
      />
      <Animated.View style={[styles.flex, animatedStyle]}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Event image placeholder (full width, no horizontal padding) ── */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderLabel}>Event Image</Text>
          </View>

          {/* ── Content (24px horizontal padding) ── */}
          <View style={styles.contentPad}>
            <Text
              style={styles.eventTitle}
              accessibilityRole="header"
            >
              Community Cleanup Day
            </Text>
            <Text style={styles.eventMeta}>Sat, Jun 8 · 10:00 AM</Text>
            <Text style={styles.eventMeta}>Des Plaines River Trail</Text>

            <View style={styles.descriptionGap} />

            <Text style={styles.description}>
              Join us for a community-wide cleanup along the Des Plaines River Trail.
              Supplies provided. All volunteers welcome.
            </Text>

            <View style={styles.buttonGap} />

            <PrimaryButton
              label="View Website Event Page"
              onPress={() => {
                // no-op — prototype
              }}
              accessibilityLabel="View website event page for Community Cleanup Day"
            />

            <View style={styles.buttonSpacer} />

            <SecondaryButton
              label="Return Home"
              onPress={() => go('home')}
              accessibilityLabel="Return to home screen"
            />

            <View style={styles.bottomPad} />
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  flex: {
    flex: 1,
  } as ViewStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,

  // Image placeholder — full width, no radius
  imagePlaceholder: {
    height: 200,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  } as ViewStyle,
  imagePlaceholderLabel: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  // Content area
  contentPad: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
  } as ViewStyle,
  eventTitle: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 6,
  } as TextStyle,
  eventMeta: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    marginBottom: 2,
  } as TextStyle,
  descriptionGap: {
    height: Spacing.md,
  } as ViewStyle,
  description: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
  buttonGap: {
    height: 32,
  } as ViewStyle,
  buttonSpacer: {
    height: 16,
  } as ViewStyle,
  bottomPad: {
    height: 32,
  } as ViewStyle,
});
