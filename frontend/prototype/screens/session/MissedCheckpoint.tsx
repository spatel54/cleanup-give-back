// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.13 — Missed Checkpoint

import React from 'react';
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

export function MissedCheckpoint({ go }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {/* Warning icon */}
        <View
          style={styles.iconCircle}
          accessibilityRole="none"
          accessibilityLabel="Warning icon"
        >
          <Text style={styles.iconText}>✕</Text>
        </View>

        <View style={styles.gap24} />

        <Text
          style={styles.headline}
          accessibilityRole="header"
        >
          Photo checkpoint missed
        </Text>

        <View style={styles.gap16} />

        <Text style={styles.body}>
          This session can't be submitted because a required photo checkpoint was
          missed. Please restart your session to continue tracking.
        </Text>

        <View style={styles.gap40} />

        <PrimaryButton
          label="Restart Session"
          onPress={() => go('session-setup')}
          variant="destructive"
          accessibilityLabel="Restart session"
        />

        <View style={styles.gap16} />

        <SecondaryButton
          label="Return Home"
          onPress={() => go('home')}
          accessibilityLabel="Return to home screen"
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
  } as ViewStyle,
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  } as ViewStyle,
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.notApprovedContainer,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  iconText: {
    fontSize: 28,
    color: Colors.notApproved,
    lineHeight: 34,
    fontWeight: '700',
  } as TextStyle,
  gap24: {
    height: 24,
  } as ViewStyle,
  gap16: {
    height: 16,
  } as ViewStyle,
  gap40: {
    height: 40,
  } as ViewStyle,
  headline: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.black,
    textAlign: 'center',
  },
  body: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textPrimary,
    textAlign: 'center',
    maxWidth: 320,
  },
});
