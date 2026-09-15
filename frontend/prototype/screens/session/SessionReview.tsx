// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.14 — Session Review (read-only)

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Screen } from '../../App';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

interface Props {
  go: (screen: Screen) => void;
}

export function SessionReview({ go }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader
        variant="detail"
        title="Session Review"
        onBack={() => go('live-session')}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Sub-headline context */}
        <Text style={styles.reviewLabel}>Review session</Text>

        {/* Prominent duration */}
        <Text
          style={styles.duration}
          accessibilityRole="header"
        >
          1h 24m completed
        </Text>

        <View style={styles.gap20} />

        {/* Session name */}
        <Text style={styles.sessionName}>River Trail Cleanup</Text>

        {/* Stats row */}
        <Text style={styles.statsRow}>
          3 photos submitted · 1.8 miles tracked
        </Text>

        <View style={styles.gap20} />

        {/* Map placeholder */}
        <View
          style={styles.mapContainer}
          accessibilityRole="none"
          accessibilityLabel="Route summary map"
        >
          <Text style={styles.mapLabel}>Route Summary</Text>
        </View>

        <View style={styles.gap24} />

        {/* Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailRow}>Date: Jun 5, 2026</Text>
          <Text style={styles.detailRow}>Time: 9:30 AM – 10:54 AM</Text>
          <Text style={styles.detailRow}>Court Ordered: No</Text>
          <Text style={styles.detailRow}>Signature: Completed</Text>
        </View>

        <View style={styles.gap20} />

        {/* Description */}
        <Text style={styles.descriptionLabel}>Description</Text>
        <View style={styles.gap6} />
        <Text style={styles.descriptionBody}>
          Cleaned litter along the trail and surrounding park area.
        </Text>

        <View style={styles.gap32} />

        {/* Read-only notice */}
        <Text style={styles.readOnlyNotice}>
          Session records are read-only. No editing allowed.
        </Text>

        <View style={styles.gap12} />

        <PrimaryButton
          label="Submit for Approval"
          onPress={() => go('submission-confirmation')}
          accessibilityLabel="Submit session for approval"
        />

        <View style={styles.gap24} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 40,
  } as ViewStyle,
  reviewLabel: {
    ...(Typography.headlineSmall as TextStyle),
    color: Colors.textSecondary,
    fontFamily: 'IBMPlexSans',
    marginBottom: 4,
  },
  duration: {
    ...(Typography.headlineLarge as TextStyle),
    color: Colors.black,
  },
  gap20: {
    height: 20,
  } as ViewStyle,
  gap24: {
    height: 24,
  } as ViewStyle,
  gap32: {
    height: 32,
  } as ViewStyle,
  gap12: {
    height: 12,
  } as ViewStyle,
  gap6: {
    height: 6,
  } as ViewStyle,
  sessionName: {
    ...(Typography.labelXLarge as TextStyle),
    color: Colors.black,
    fontWeight: '700',
    marginBottom: 6,
  },
  statsRow: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  },
  mapContainer: {
    height: 180,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  mapLabel: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
  },
  detailsSection: {
    gap: 8,
  } as ViewStyle,
  detailRow: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textPrimary,
  },
  descriptionLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
  },
  descriptionBody: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  },
  readOnlyNotice: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
