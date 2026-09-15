// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.18 — Session Detail (READ-ONLY)

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
import { StatusTag } from '../../components/ui/StatusTag';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

interface Props {
  go: (screen: Screen) => void;
}

const PHOTO_CHECKPOINTS = [
  { time: '9:30 AM', label: 'Submitted ✓' },
  { time: '10:00 AM', label: 'Submitted ✓' },
  { time: '10:30 AM', label: 'Submitted ✓' },
];

export function SessionDetail({ go }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader
        variant="detail"
        title="Session Detail"
        onBack={() => go('sessions-list')}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.headline} accessibilityRole="header">
          River Trail Cleanup
        </Text>

        {/* Status tag */}
        <View style={styles.statusRow}>
          <StatusTag status="under-review" />
        </View>

        <View style={styles.gap16} />

        {/* Duration + date */}
        <View style={styles.durationRow}>
          <Text style={styles.durationValue}>1h 24m</Text>
          <Text style={styles.durationLabel}> completed</Text>
        </View>
        <Text style={styles.dateLabel}>Jun 3, 2026 · 9:30–10:54 AM</Text>

        <View style={styles.gap16} />

        {/* Map placeholder */}
        <View
          style={styles.mapPlaceholder}
          accessibilityLabel="GPS route map placeholder"
        >
          <Text style={styles.mapLabel}>GPS Route Map</Text>
        </View>

        <View style={styles.gap20} />

        {/* Photos section */}
        <Text style={styles.sectionLabel}>Photos</Text>
        <View style={styles.photosRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={styles.photoPlaceholder}
              accessibilityLabel={`Photo ${i + 1} placeholder`}
            />
          ))}
        </View>

        <View style={styles.gap20} />

        {/* Photo Checkpoints section */}
        <Text style={styles.sectionLabel}>Photo Checkpoints</Text>
        <View style={styles.checkpointsContainer}>
          {PHOTO_CHECKPOINTS.map((cp, i) => (
            <View key={i} style={styles.checkpointRow}>
              <Text style={styles.checkpointTime}>{cp.time}</Text>
              <Text style={styles.checkpointStatus}>
                {'  ·  '}
                <Text style={styles.checkpointSubmitted}>{cp.label}</Text>
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.gap20} />

        {/* Description section */}
        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.descriptionText}>
          Cleaned litter along the trail and surrounding park area.
        </Text>

        <View style={styles.gap20} />

        {/* Metadata */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Court Ordered: No</Text>
          <Text style={styles.metaDivider}>  ·  </Text>
          <Text style={styles.metaText}>Signature: Completed</Text>
        </View>

        <View style={styles.gap32} />

        {/* Lock note */}
        <Text style={styles.lockNote}>
          This record is locked. Sessions cannot be edited after submission.
        </Text>

        <View style={styles.gap12} />

        {/* CTA */}
        <PrimaryButton
          label="Export Record"
          onPress={() => go('export-record')}
          accessibilityLabel="Export session record"
        />

        <View style={styles.bottomPad} />
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
  } as ViewStyle,

  // Headline
  headline: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 10,
  } as TextStyle,

  // Status
  statusRow: {
    flexDirection: 'row',
  } as ViewStyle,

  // Gaps
  gap12: { height: 12 } as ViewStyle,
  gap16: { height: 16 } as ViewStyle,
  gap20: { height: 20 } as ViewStyle,
  gap32: { height: 32 } as ViewStyle,

  // Duration row
  durationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  } as ViewStyle,
  durationValue: {
    ...(Typography.monoLarge as TextStyle),
    color: Colors.primary,
  } as TextStyle,
  durationLabel: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  dateLabel: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  // Map placeholder
  mapPlaceholder: {
    height: 180,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  mapLabel: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  // Section label
  sectionLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 12,
  } as TextStyle,

  // Photos row
  photosRow: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,
  photoPlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
  } as ViewStyle,

  // Checkpoints
  checkpointsContainer: {
    gap: 10,
  } as ViewStyle,
  checkpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  checkpointTime: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
  } as TextStyle,
  checkpointStatus: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  checkpointSubmitted: {
    color: Colors.primary,
    fontWeight: '600',
  } as TextStyle,

  // Description
  descriptionText: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    lineHeight: 22,
  } as TextStyle,

  // Metadata
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  metaText: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
  metaDivider: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  // Lock note
  lockNote: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  } as TextStyle,

  bottomPad: {
    height: 32,
  } as ViewStyle,
});
