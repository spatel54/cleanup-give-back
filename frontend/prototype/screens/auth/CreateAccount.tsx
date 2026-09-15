// PROTOTYPE — NOT FINAL. All data mocked. No business logic.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Input } from '../../components/ui/Input';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

export function CreateAccount({ go }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Create Account"
        onBack={() => go('welcome')}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Headline + subtext ────────────────────────────────────── */}
        <Text style={styles.headline} accessibilityRole="header">
          Create your account
        </Text>
        <Text style={styles.body}>
          Enter your details to get started.
        </Text>

        {/* ── Form fields ───────────────────────────────────────────── */}
        <View style={styles.formGroup}>
          <Input
            label="Full Name"
            placeholder="Jane Smith"
            required
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="name"
          />
          <Input
            label="Email"
            placeholder="jane@example.com"
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
          />
          <Input
            label="Password"
            placeholder="Create a password"
            required
            secureTextEntry
            textContentType="newPassword"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <View style={styles.ctaWrap}>
          <PrimaryButton
            label="Continue"
            onPress={() => go('account-details')}
            accessibilityLabel="Continue to account details"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
  } as ViewStyle,

  // ── Headline + body ───────────────────────────────────────────────────────
  headline: {
    ...(Typography.headlineLarge as TextStyle),
    color: Colors.black,
    marginBottom: 8,
  } as TextStyle,
  body: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  } as TextStyle,

  // ── Form ──────────────────────────────────────────────────────────────────
  formGroup: {
    gap: 16,
    marginBottom: Spacing.md,
  } as ViewStyle,

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaWrap: {
    marginTop: 'auto',
    paddingTop: Spacing.md,
  } as ViewStyle,
});
