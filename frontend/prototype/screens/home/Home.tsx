// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.7 — Home Dashboard

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { SceneImages } from '../../constants/Assets';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { StatusTag } from '../../components/ui/StatusTag';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

type TimePeriod = 'Day' | 'Month' | 'Year';

// ── Fix 1: Dynamic greeting ────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning, Shivam';
  if (hour < 17) return 'Good afternoon, Shivam';
  return 'Good evening, Shivam';
}

// ── Fix 2: Chart data ─────────────────────────────────────────────────────────
const CHART_DATA_MONTH = [
  { label: 'W1', approved: 2.5, review: 1.0, rejected: 0 },
  { label: 'W2', approved: 3.0, review: 0.5, rejected: 0.5 },
  { label: 'W3', approved: 1.5, review: 2.0, rejected: 0 },
  { label: 'W4', approved: 2.0, review: 0.5, rejected: 1.0 },
];

const CHART_DATA_DAY = [
  { label: 'M', approved: 0.5, review: 0.5, rejected: 0 },
  { label: 'T', approved: 1.0, review: 0, rejected: 0 },
  { label: 'W', approved: 0, review: 1.5, rejected: 0 },
  { label: 'T', approved: 1.0, review: 0.5, rejected: 0.5 },
  { label: 'F', approved: 0.5, review: 0, rejected: 0 },
  { label: 'S', approved: 2.0, review: 0, rejected: 0 },
  { label: 'S', approved: 0, review: 0, rejected: 0 },
];

const CHART_DATA_YEAR = [
  { label: 'J', approved: 5.0, review: 2.0, rejected: 1.0 },
  { label: 'F', approved: 4.0, review: 1.5, rejected: 0.5 },
  { label: 'M', approved: 6.0, review: 1.0, rejected: 0 },
  { label: 'A', approved: 3.5, review: 2.5, rejected: 1.0 },
  { label: 'M', approved: 7.0, review: 1.0, rejected: 0.5 },
  { label: 'J', approved: 4.5, review: 3.0, rejected: 0 },
];

const TOP_LOCATIONS = [
  { name: 'Des Plaines River Trail', hours: '18.5 hrs' },
  { name: 'Lake Park', hours: '12.0 hrs' },
  { name: 'Downtown Des Plaines', hours: '7.5 hrs' },
] as const;

const RECENT_LOGS = [
  { location: 'Lake Park', duration: '1.5 hrs', status: 'approved' as const },
  { location: 'River Trail', duration: '2.0 hrs', status: 'under-review' as const },
  { location: 'Downtown', duration: '1.0 hr', status: 'not-approved' as const },
] as const;

export function Home({ go }: Props) {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('Month');
  const periods: TimePeriod[] = ['Day', 'Month', 'Year'];

  // Fix 4: gate empty state
  const totalHours: number = 3.5;
  const isEmpty = totalHours === 0;

  const bellButton = (
    <TouchableOpacity
      style={styles.bellButton}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <BellIcon />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="root"
        rightElement={bellButton}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View className="mb-6">
          <Text className="font-headline text-3xl font-bold text-on-background leading-tight">
            {getGreeting()}
          </Text>
          <View className="flex-row items-center gap-2 mt-3 bg-primary-container/10 self-start px-3 py-1.5 rounded-full">
            <Text className="font-label text-sm font-semibold text-primary">
              {totalHours} hours this week
            </Text>
          </View>
        </View>

        {/* ── Service Hours ── */}
        <Text
          className="font-headline text-xl font-semibold text-on-background mt-8 mb-4"
          accessibilityRole="header"
        >
          Service Hours
        </Text>

        {/* Period toggle */}
        <View style={styles.toggleRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setActivePeriod(p)}
              style={[
                styles.chip,
                activePeriod === p ? styles.chipActive : styles.chipInactive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${p} period`}
              accessibilityState={{ selected: activePeriod === p }}
            >
              <Text
                style={[
                  styles.chipLabel,
                  activePeriod === p ? styles.chipLabelActive : styles.chipLabelInactive,
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fix 2: Real stacked bar chart */}
        <ServiceHoursChart activePeriod={activePeriod} />

        {isEmpty ? (
          /* Fix 4: Empty state */
          <EmptyState onStart={() => go('session-setup')} />
        ) : (
          <>
            {/* ── Environmental Impact 2×2 ── */}
            <Text
              className="font-headline text-xl font-semibold text-on-background mt-8 mb-4"
              accessibilityRole="header"
            >
              Your Impact
            </Text>
            <View className="flex-row flex-wrap gap-4">
              {/* Fix 3: ImpactCard with icon glyphs */}
              <ImpactCard value="8.2 mi" label="Distance covered" iconGlyph="↗" />
              <ImpactCard value="4" label="Locations cleaned" iconGlyph="◎" />
              <ImpactCard value="6" label="Sessions completed" iconGlyph="✓" />
              <ImpactCard value="12" label="Photos submitted" iconGlyph="▣" />
            </View>

            {/* ── Top Locations ── */}
            <Text
              className="font-headline text-xl font-semibold text-on-background mt-8 mb-4"
              accessibilityRole="header"
            >
              Top Locations
            </Text>
            <View className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-6 py-2 shadow-sm">
              {TOP_LOCATIONS.map((loc, idx) => (
                <View key={loc.name}>
                  <View className="flex-row justify-between items-center py-4">
                    <Text className="font-label text-base text-on-background font-medium flex-1 pr-2">{loc.name}</Text>
                    <Text className="font-mono text-sm text-on-surface-variant">{loc.hours}</Text>
                  </View>
                  {idx < TOP_LOCATIONS.length - 1 && <View className="h-px bg-outline-variant/20" />}
                </View>
              ))}
            </View>

            {/* ── Recent Logs ── */}
            <View className="flex-row items-end justify-between mt-8 mb-4">
              <Text
                className="font-headline text-xl font-semibold text-on-background"
                accessibilityRole="header"
              >
                Recent Logs
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="See all recent logs"
              >
                <Text className="text-primary font-label text-sm font-semibold hover:underline">See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16, paddingRight: 24 }}
            >
              {RECENT_LOGS.map((log) => (
                <TouchableOpacity
                  key={log.location}
                  onPress={() => go('session-detail')}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${log.location} session, ${log.duration}, status ${log.status}`}
                >
                  <View className="w-[280px] bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
                    {/* Fix 5: Real map image instead of placeholder */}
                    <View className="h-32 relative bg-surface-container overflow-hidden">
                      <Image
                        source={SceneImages.mapRoute}
                        className="absolute inset-0 w-full h-full opacity-80"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="p-4">
                      <Text className="font-headline font-semibold text-on-background text-lg">{log.location}</Text>
                      <Text className="font-mono text-xs text-on-surface-variant mt-1 mb-3">{log.duration}</Text>
                      <StatusTag status={log.status} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── New Events ── */}
        <Text
          className="font-headline text-xl font-semibold text-on-background mt-8 mb-4"
          accessibilityRole="header"
        >
          New Events
        </Text>
        <View className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 mb-8">
          <Text className="font-headline text-lg font-bold text-on-background mb-1">Community Cleanup Day</Text>
          <Text className="font-label text-sm text-on-surface-variant">Sat, Jun 8 · 10:00 AM</Text>
          <Text className="font-label text-sm text-on-surface-variant mb-4">Des Plaines River Trail</Text>
          <PrimaryButton
            label="View Event"
            onPress={() => go('event-detail')}
            accessibilityLabel="View Community Cleanup Day event"
          />
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Fix 2: Stacked bar chart sub-component
interface ChartBar {
  label: string;
  approved: number;
  review: number;
  rejected: number;
}

interface ServiceHoursChartProps {
  activePeriod: TimePeriod;
}

function ServiceHoursChart({ activePeriod }: ServiceHoursChartProps) {
  let data: ChartBar[];
  if (activePeriod === 'Day') {
    data = CHART_DATA_DAY;
  } else if (activePeriod === 'Year') {
    data = CHART_DATA_YEAR;
  } else {
    data = CHART_DATA_MONTH;
  }

  const maxTotal = Math.max(...data.map((d) => d.approved + d.review + d.rejected));
  const BAR_MAX_HEIGHT = 100;

  return (
    <View style={chartStyles.container}>
      {/* Bars */}
      <View style={chartStyles.barsRow}>
        {data.map((d, idx) => {
          const total = d.approved + d.review + d.rejected;
          const scale = maxTotal > 0 ? BAR_MAX_HEIGHT / maxTotal : 0;
          const approvedH = d.approved * scale;
          const reviewH = d.review * scale;
          const rejectedH = d.rejected * scale;
          const totalH = total * scale;

          return (
            <View key={`${d.label}-${idx}`} style={chartStyles.barColumn}>
              <View style={[chartStyles.barStack, { height: BAR_MAX_HEIGHT }]}>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  {/* Stack from bottom: approved → review → rejected */}
                  {totalH > 0 && (
                    <View style={{ height: totalH, width: 32, overflow: 'hidden', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                      {/* Rejected on top */}
                      {rejectedH > 0 && (
                        <View style={{ height: rejectedH, backgroundColor: Colors.error }} />
                      )}
                      {/* Review in middle */}
                      {reviewH > 0 && (
                        <View style={{ height: reviewH, backgroundColor: Colors.accent }} />
                      )}
                      {/* Approved at bottom */}
                      {approvedH > 0 && (
                        <View style={{ height: approvedH, backgroundColor: Colors.primary }} />
                      )}
                    </View>
                  )}
                  {totalH === 0 && (
                    <View style={{ height: 4, width: 32, backgroundColor: Colors.surfaceVariant, borderRadius: 2 }} />
                  )}
                </View>
              </View>
              <Text style={chartStyles.barLabel}>{d.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={chartStyles.legendRow}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={chartStyles.legendLabel}>Approved</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: Colors.accent }]} />
          <Text style={chartStyles.legendLabel}>In Review</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: Colors.error }]} />
          <Text style={chartStyles.legendLabel}>Not Approved</Text>
        </View>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: 4,
  } as ViewStyle,
  barsRow: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingVertical: 8,
  } as ViewStyle,
  barColumn: {
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  barStack: {
    justifyContent: 'flex-end',
  } as ViewStyle,
  barLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: Colors.textSecondary,
  } as TextStyle,
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  } as ViewStyle,
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  legendLabel: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
});

// Fix 3: ImpactCard with icon glyph
interface ImpactCardProps {
  value: string;
  label: string;
  iconGlyph: string;
  iconColor?: string;
}

function ImpactCard({ value, label, iconGlyph, iconColor }: ImpactCardProps) {
  return (
    <View className="flex-1 min-w-[45%] bg-surface-container-low border border-outline-variant/20 rounded-lg p-5 justify-between">
      <Text className={`font-mono text-2xl mb-4 ${iconColor ? '' : 'text-primary'}`} style={iconColor ? { color: iconColor } : undefined}>
        {iconGlyph}
      </Text>
      <View>
        <Text className="font-mono text-3xl font-medium tracking-tight text-on-background">{value}</Text>
        <Text className="font-mono text-[10px] text-outline uppercase tracking-widest mt-1">{label}</Text>
      </View>
    </View>
  );
}

// Fix 4: Empty state sub-component
interface EmptyStateProps {
  onStart: () => void;
}

function EmptyState({ onStart }: EmptyStateProps) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconCircle}>
        <Text style={emptyStyles.iconGlyph}>+</Text>
      </View>
      <Text style={emptyStyles.heading}>Start your first session</Text>
      <Text style={emptyStyles.body}>
        Track your cleanup hours and build your service record.
      </Text>
      <View style={emptyStyles.ctaWrapper}>
        <PrimaryButton
          label="Start Tracking"
          onPress={onStart}
          accessibilityLabel="Start tracking your first cleanup session"
        />
      </View>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    marginTop: 48,
    alignItems: 'center',
  } as ViewStyle,
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  iconGlyph: {
    fontFamily: 'Sanchez',
    fontSize: 32,
    color: Colors.primary,
  } as TextStyle,
  heading: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
  } as TextStyle,
  body: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  } as TextStyle,
  ctaWrapper: {
    marginTop: 24,
  } as ViewStyle,
});

function BellIcon() {
  return (
    <View style={styles.bellIcon}>
      {/* Simple bell approximation with Views */}
      <View style={styles.bellBody} />
      <View style={styles.bellClapper} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
  } as ViewStyle,

  bellButton: {
    padding: 4,
  } as ViewStyle,

  // Bell icon (primitive stand-in)
  bellIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  bellBody: {
    width: 18,
    height: 16,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.textPrimary,
    borderBottomWidth: 0,
  } as ViewStyle,
  bellClapper: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textPrimary,
    marginTop: -2,
  } as ViewStyle,

  // Period toggle
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.full,
  } as ViewStyle,
  chipActive: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  chipInactive: {
    backgroundColor: Colors.surface,
  } as ViewStyle,
  chipLabel: {
    ...(Typography.labelSmall as TextStyle),
    fontWeight: '600',
  } as TextStyle,
  chipLabelActive: {
    color: Colors.textOnPrimary,
  } as TextStyle,
  chipLabelInactive: {
    color: Colors.textSecondary,
  } as TextStyle,

  bottomPad: {
    height: 32,
  } as ViewStyle,
});
