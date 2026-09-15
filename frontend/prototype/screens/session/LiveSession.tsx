// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.11 — Live Session

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { SceneImages } from '../../constants/Assets';
import { Screen } from '../../App';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { StatusTag } from '../../components/ui/StatusTag';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';

interface Props {
  go: (screen: Screen) => void;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':');
}

// Start at 42m 18s for prototype realism
const INITIAL_SECONDS = 42 * 60 + 18;

export function LiveSession({ go }: Props) {
  const [elapsed, setElapsed] = useState(INITIAL_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Live Session
        </Text>
        <StatusTag status="gps-active" />
      </View>

      {/* Timer */}
      <View style={styles.timerSection}>
        <Text
          style={styles.timer}
          accessibilityLabel={`Elapsed time: ${formatTime(elapsed)}`}
          accessibilityRole="text"
        >
          {formatTime(elapsed)}
        </Text>
        <Text style={styles.sessionName}>River Trail Cleanup</Text>
      </View>

      {/* Map — route image */}
      <View style={styles.mapWrapper}>
        <Image
          source={SceneImages.mapRoute}
          style={styles.mapImage}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel="Route map, GPS tracking active"
        />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue} accessibilityRole="text">1</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue} accessibilityRole="text">17:42</Text>
          <Text style={styles.statLabel}>Next photo</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue} accessibilityRole="text">1.2 mi</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
      </View>

      {/* Bottom actions */}
      <View style={styles.actions}>
        <PrimaryButton
          label="Submit Photo"
          onPress={() => go('photo-checkpoint')}
          accessibilityLabel="Submit a photo checkpoint"
        />
        <View style={styles.gap12} />
        <SecondaryButton
          label="End Session"
          onPress={() => go('session-review')}
          accessibilityLabel="End the current session"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 8,
  } as ViewStyle,
  headerTitle: {
    ...(Typography.labelLarge as TextStyle),
    fontWeight: '700',
    color: Colors.black,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: Spacing.screenPadding,
  } as ViewStyle,
  timer: {
    ...(Typography.monoDisplay as TextStyle),
    fontSize: 48,
    color: Colors.black,
    letterSpacing: 2,
  },
  sessionName: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textSecondary,
    marginTop: 6,
  },
  mapWrapper: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: 20,
  } as ViewStyle,
  mapImage: {
    height: 220,
    width: '100%',
    borderRadius: Radius.md,
  } as ImageStyle,
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: 24,
    alignItems: 'center',
  } as ViewStyle,
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  statValue: {
    ...(Typography.monoBody as TextStyle),
    color: Colors.black,
  },
  statLabel: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  } as ViewStyle,
  actions: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  } as ViewStyle,
  gap12: {
    height: 12,
  } as ViewStyle,
});
