import type { ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNavBar } from '../components/BottomNavBar';
import { Icon } from '../components/Icon';
import { MinimizedTrackerBar } from '../components/MinimizedTrackerBar';
import { WeeklyHoursChart } from '../components/WeeklyHoursChart';
import {
  homeUser,
  impactStats,
  notificationCount,
  recentEvents,
  recentSessions,
  serviceHoursTotalLabel,
  weekNumberLabel,
  weekRangeLabel,
  weeklyHoursChart,
  weeklyStreakHours,
} from '../mocks/home';
import { mockSession } from '../mocks/session';
import { colors, fontFamilies, radius, screenPaddingHorizontal, shadows, spacing } from '../tokens';

type Props = {
  /** True once the user has minimized an active LiveSessionScreen to Home. */
  isSessionMinimized?: boolean;
  elapsedLabel?: string;
  /** Tapping the MinimizedTrackerBar or the Track FAB — re-opens LiveSessionScreen. */
  onExpandSession?: () => void;
  /** Tapping the Track FAB when no session is active — opens SessionSetupScreen. */
  onStartSession?: () => void;
  onOpenSessions?: () => void;
  onOpenNotifications?: () => void;
};

/**
 * PRD Home & Events area · Figma `home_dashboard___final_branding` (`406:291`).
 * Built directly from `get_design_context` on that node — see
 * figma-to-native-handoff.md for how this relates to the Session Tracking
 * flow (PRD §6.9–6.15) proper. All content is mocked (`mocks/home.ts`); the
 * only live behavior is the `MinimizedTrackerBar` when a session is active,
 * carried over from `dev/HomePlaceholderScreen`'s original demo of Figma
 * `622:176`.
 */
export function HomeScreen({
  isSessionMinimized = false,
  elapsedLabel = '00:42',
  onExpandSession,
  onStartSession,
  onOpenSessions,
  onOpenNotifications,
}: Props) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <TopAppBar onPressNotifications={onOpenNotifications} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Greeting />
          <ServiceHoursCard />
          <ImpactCard />
          <RecentSessionsCard />
          <RecentEventsCard />
        </ScrollView>
      </SafeAreaView>

      <View style={styles.bottomStack}>
        {isSessionMinimized && (
          <View style={styles.trackerBarWrap}>
            <MinimizedTrackerBar
              distanceMiles={mockSession.distanceMiles}
              elapsedLabel={elapsedLabel}
              timeLeftLabel="12:04"
              progress={0.6}
              onExpand={onExpandSession}
            />
          </View>
        )}
        <BottomNavBar
          activeTab="home"
          sessionActive={isSessionMinimized}
          onTrackPress={isSessionMinimized ? onExpandSession : onStartSession}
          onSessionsPress={onOpenSessions}
        />
      </View>
    </View>
  );
}

function TopAppBar({ onPressNotifications }: { onPressNotifications?: () => void }) {
  return (
    <View style={[styles.topAppBar, shadows.barTop]}>
      <Text style={styles.logoText}>Clean Up Give Back</Text>
      <Pressable
        onPress={onPressNotifications}
        accessibilityRole="button"
        accessibilityLabel={`Notifications, ${notificationCount} unread`}
        style={styles.notificationButton}
      >
        <Icon name="bell" size={24} color={colors.textPrimary} />
        {notificationCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function Greeting() {
  return (
    <View style={styles.greetingBlock}>
      <Text style={styles.greetingText}>
        Good morning, <Text style={styles.greetingName}>{homeUser.firstName}!</Text>
      </Text>
      <View style={styles.streakBadge}>
        <Icon name="flame" size={22} />
        <Text style={styles.streakText}>{weeklyStreakHours} hour streak this week. Keep it up!</Text>
      </View>
    </View>
  );
}

function ServiceHoursCard() {
  return (
    <Card>
      <View style={styles.serviceHoursHeader}>
        <Text style={styles.sectionTitle}>Service Hours</Text>
        <Text style={styles.serviceHoursValue}>{serviceHoursTotalLabel}</Text>
      </View>

      <View style={styles.dateNavRow}>
        <View style={styles.weekArrows}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous week" hitSlop={8}>
            <Icon name="chevronLeft" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next week" hitSlop={8}>
            <Icon name="chevronRight" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.dateRangeBadge}>
          <Text style={styles.dateRangeText}>{weekRangeLabel}</Text>
          <Icon name="calendar" size={16} color={colors.textTertiary} />
        </View>
        <View style={styles.weekNumberBadge}>
          <Text style={styles.weekNumberText}>{weekNumberLabel}</Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        <WeeklyHoursChart data={weeklyHoursChart} />
      </View>
    </Card>
  );
}

function ImpactCard() {
  return (
    <Card>
      <Text style={[styles.sectionTitle, styles.impactTitle]}>Your Impact</Text>
      <View style={styles.impactGrid}>
        {impactStats.map((stat) => (
          <View key={stat.id} style={styles.impactStatCard}>
            <View style={styles.impactStatValueRow}>
              <Icon name={stat.icon} size={18} color={colors.primary} />
              <Text style={styles.impactStatValue}>{stat.value}</Text>
            </View>
            <Text style={styles.impactStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function RecentSessionsCard() {
  return (
    <Card>
      <SectionHeader title="Recent Sessions" />
      <View style={styles.sessionsList}>
        {recentSessions.map((session) => (
          <View key={session.id} style={styles.sessionRow}>
            <View style={styles.sessionTitleBlock}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <View style={styles.sessionDetailsRow}>
                <View style={styles.sessionDetailChip}>
                  <Icon name="calendar" size={16} color={colors.textTertiary} />
                  <Text style={styles.sessionDetailText}>{session.dateLabel}</Text>
                </View>
                <View style={styles.sessionDetailChip}>
                  <Icon name="clock" size={16} color={colors.textTertiary} />
                  <Text style={styles.sessionDetailText}>{session.timeLabel}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.sessionDuration}>{session.durationLabel}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function RecentEventsCard() {
  return (
    <Card>
      <SectionHeader title="Recent Events" />
      <View style={styles.eventsList}>
        {recentEvents.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <View style={styles.eventDateBlock}>
              <View style={styles.eventDayBadge}>
                <Text style={styles.eventDayText}>{event.day}</Text>
              </View>
              <View>
                <Text style={styles.eventMonthText}>{event.month}</Text>
                <Text style={styles.eventWeekdayText}>{event.weekday}</Text>
              </View>
            </View>
            <View style={styles.eventDetailsBlock}>
              <View style={styles.eventDetailRow}>
                <Icon name="locationPin" size={18} color={colors.textTertiary} />
                <Text style={[styles.eventDetailText, styles.eventLocationText]}>{event.location}</Text>
              </View>
              <View style={styles.eventDetailRow}>
                <Icon name="clock" size={18} color={colors.textTertiary} />
                <Text style={styles.eventDetailText}>{event.timeLabel}</Text>
              </View>
              <View style={styles.eventDetailRow}>
                <Icon name="building" size={18} color={colors.textTertiary} />
                <Text style={styles.eventDetailText}>{event.organization}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.seeMoreText}>See More</Text>
    </Card>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.viewAllText}>View All</Text>
    </View>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  safeArea: {
    flex: 1,
  },
  topAppBar: {
    backgroundColor: colors.textOnPrimary,
    paddingHorizontal: screenPaddingHorizontal,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoText: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 16,
    color: colors.primary,
  },
  notificationButton: {
    padding: spacing.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.accentLime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.sanchezRegular,
    color: colors.textTertiary,
  },
  scrollContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  greetingBlock: {
    gap: spacing.sm,
  },
  greetingText: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 24,
    color: colors.textPrimary,
  },
  greetingName: {
    color: colors.primary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  streakText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.textOnPrimary,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  impactTitle: {
    marginBottom: -spacing.sm,
  },
  serviceHoursHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  serviceHoursValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
    color: colors.primary,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -spacing.sm,
  },
  weekArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateRangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  dateRangeText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  weekNumberBadge: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  weekNumberText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  chartWrap: {
    marginTop: -spacing.sm,
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  impactStatCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.textOnPrimary,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  impactStatValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  impactStatValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 30,
    color: colors.primary,
  },
  impactStatLabel: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 9,
    letterSpacing: 0.4,
    color: colors.textTertiary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllText: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    color: colors.primary,
  },
  sessionsList: {
    gap: spacing.md,
    marginTop: -spacing.sm,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.textOnPrimary,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  sessionTitleBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  sessionTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sessionDetailsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sessionDetailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sessionDetailText: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 12,
    color: colors.textTertiary,
  },
  sessionDuration: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 18,
    color: colors.primary,
  },
  eventsList: {
    gap: spacing.md,
    marginTop: -spacing.sm,
  },
  eventCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.textOnPrimary,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  eventDateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventDayBadge: {
    width: 47,
    height: 45,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDayText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 24,
    color: colors.textOnPrimary,
  },
  eventMonthText: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    color: colors.primary,
  },
  eventWeekdayText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.primary,
  },
  eventDetailsBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  eventDetailText: {
    flex: 1,
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 12,
    color: colors.textTertiary,
  },
  eventLocationText: {
    lineHeight: 16,
  },
  seeMoreText: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  bottomStack: {
    paddingHorizontal: screenPaddingHorizontal,
  },
  trackerBarWrap: {
    marginBottom: spacing.sm,
  },
});
