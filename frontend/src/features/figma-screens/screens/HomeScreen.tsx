import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionBottomNavStack,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { usePreferredName } from '@/features/onboarding/onboardingStore';
import {
  getSessionStats,
  hydrateSessionStatsFromApi,
  useSessionStats,
} from '@/features/session-tracking/sessionStatsStore';
import {
  buildWeeklyHoursChart,
  computeWeeklyStreakHours,
  chartUsesMinuteScale,
  chartYAxisAccessibilityLabel,
  formatChartHourLabel,
  formatChartYAxisTickLabel,
  formatLifetimeServiceHoursValue,
  formatImpactPlacesCopy,
  formatWeekServiceHoursTotal,
  formatWeeklyHoursBadgeCopy,
  type SessionStatRecord,
} from '@/features/session-tracking/utils/homeDashboardStats';
import { roundHoursToMinutes } from '@/features/session-tracking/utils/sessionFormat';
import {
  refreshImpactFeedFromSessionStats,
  useImpactFeed,
} from '@/features/session-tracking/impactFeedStore';
import {
  hydrateVolunteerNotifications,
  useUnreadNotificationCount,
} from '@/features/notifications/volunteerNotificationsStore';
import { ensureTrackerAccessOrPaywall } from '@/utils/ensureTrackerAccess';

import { EmptyState } from '@/components/ui/EmptyState';

import { APP_BAR_ICON_SIZE, appBarIconWrap } from '../components/appBarChrome';
import { CartBadge } from '../components/CartBadge';
import { EventsViewAllModal } from '../components/EventsViewAllModal';
import { ImpactFeedSection } from '../components/ImpactFeedSection';
import { UpcomingEventCard } from '../components/UpcomingEventCard';
import { ServiceHoursWeekPicker } from '../components/ServiceHoursWeekPicker';
import {
  NotificationIcon,
  StreakIcon,
} from '../components/HomeIcons';
import { firstTimeHomeDashboard } from '../mocks/home';
import type { HomeDashboardData, UpcomingEventSummary } from '../mocks/home.types';
import { getTimeOfDayGreeting } from '../utils/getTimeOfDayGreeting';
import {
  formatWeekNumberLabel,
  formatWeekRangeLabel,
  getCurrentWeekMeta,
  parseIsoDate,
} from '../utils/weekCalendar';
import { layout, colors, fontFamilies, radius as R, shadows, textStyles } from '../tokens';
import {
  fetchPublishedEventsCatalog,
  fetchPublishedUpcomingEvents,
} from '@/lib/eventsApi';

const Y_AXIS_GUTTER = 36;
const CHART_ROW_COUNT = 4;
/** Vertical breathing room so top/bottom tick labels are not flush with the plot edge. */
const Y_AXIS_INSET = 12;
/** Tighter space between week picker and chart top. */
const CHART_TOP_OFFSET = -12;
/** Taller plot; each horizontal band is CHART_PLOT_H / CHART_ROW_COUNT px. */
const CHART_PLOT_H = 280;
const Y_TICK_LINE_HEIGHT = 12;
const CHART_BAR_WIDTH = 30;
const CHART_BAR_RADIUS = 4;
const BARS_ROW_COL_GAP = 4;

type PlotMetrics = {
  plotH: number;
  rowHeight: number;
};

/** Rectangular grid: fixed plot height, four equal horizontal bands. */
function computePlotMetrics(): PlotMetrics {
  const plotH = CHART_PLOT_H;
  return { plotH, rowHeight: plotH / CHART_ROW_COUNT };
}

/**
 * Round up to an integer ceiling with 4 equal integer Y-axis steps
 * (avoids decimal ticks like 37.5 / 7.5 when max is not divisible by 4).
 */
function niceMax(max: number): number {
  if (max <= 0) return 4;
  const step = Math.max(1, Math.ceil(max / 4));
  return step * 4;
}

function buildYLabels(chartMax: number): number[] {
  const step = chartMax / 4;
  return [chartMax, step * 3, step * 2, step, 0].map((v) => Math.round(v));
}

/** Y position of tick/grid line from top of plot (inset keeps 4 hrs / 0 off the edge). */
function yTickLineY(index: number, labelCount: number, plotH: number): number {
  const innerH = plotH - 2 * Y_AXIS_INSET;
  return Y_AXIS_INSET + (index / (labelCount - 1)) * innerH;
}

/** Center tick label vertically on its grid line. */
function yTickTop(index: number, labelCount: number, plotH: number): number {
  return yTickLineY(index, labelCount, plotH) - Y_TICK_LINE_HEIGHT / 2;
}

function BarChart({ weeklyHoursChart }: { weeklyHoursChart: HomeDashboardData['weeklyHoursChart'] }) {
  const dataMaxHours = Math.max(...weeklyHoursChart.map((d) => d.value), 0);
  const useMinutes = chartUsesMinuteScale(dataMaxHours);
  const dataMax = useMinutes ? roundHoursToMinutes(dataMaxHours) : dataMaxHours;
  const chartMax = niceMax(dataMax);
  const yLabels = buildYLabels(chartMax);
  const labelCount = yLabels.length;
  const { plotH } = computePlotMetrics();
  const innerPlotH = plotH - 2 * Y_AXIS_INSET;

  return (
    <View
      style={chart.wrapper}
      accessible
      accessibilityRole="image"
      accessibilityLabel={chartYAxisAccessibilityLabel(useMinutes)}
    >
      <View style={[chart.barsRow, { height: plotH }]}>
        <View style={[chart.yAxisGutter, { height: plotH }]} importantForAccessibility="no-hide-descendants">
          {yLabels.map((value, index) => (
            <Text
              key={`${value}-${index}`}
              style={[chart.yLabel, { top: yTickTop(index, labelCount, plotH) }]}
              numberOfLines={1}
            >
              {formatChartYAxisTickLabel(value, useMinutes)}
            </Text>
          ))}
        </View>
        <View style={chart.barsPlot}>
          {Array.from({ length: labelCount }, (_, index) => {
            const top = yTickLineY(index, labelCount, plotH);
            return <View key={`h-grid-${top}`} style={[chart.gridLine, { top }]} />;
          })}
          {weeklyHoursChart.map(({ day, value }) => {
            const plotValue = useMinutes ? roundHoursToMinutes(value) : value;
            const barH = Math.round((plotValue / chartMax) * innerPlotH);
            const label = formatChartHourLabel(value, useMinutes);
            return (
              <View key={day} style={chart.barColumn}>
                {value > 0 ? (
                  <View style={[chart.barShell, { height: Math.max(barH, 20) }]}>
                    <Text style={chart.barValue} numberOfLines={1}>
                      {label}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
      <View style={chart.xLabelsRow}>
        <View style={chart.xAxisGutter} />
        <View style={chart.xDaysRow}>
          {weeklyHoursChart.map(({ day }) => (
            <Text key={day} style={chart.xLabel}>
              {day}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function ServiceHoursCard({
  serviceHoursTotalLabel,
  weekStartIso,
  weekRangeLabel,
  weekNumberLabel,
  weeklyHoursChart,
  hasLifetimeHours,
  onLogSession,
  onWeekStartChange,
}: Pick<
  HomeDashboardData,
  'serviceHoursTotalLabel' | 'weekStartIso' | 'weekRangeLabel' | 'weekNumberLabel' | 'weeklyHoursChart'
> & {
  hasLifetimeHours: boolean;
  onLogSession: () => void;
  onWeekStartChange: (weekStartIso: string) => void;
}) {
  return (
    <View style={s.serviceHoursCard}>
      <View style={s.rowBetween}>
        <Text style={s.sectionTitle}>Service Hours</Text>
        <Text style={s.hoursValue}>{serviceHoursTotalLabel}</Text>
      </View>

      <ServiceHoursWeekPicker
        weekStartIso={weekStartIso}
        weekRangeLabel={weekRangeLabel}
        weekNumberLabel={weekNumberLabel}
        onWeekStartChange={onWeekStartChange}
      />

      <BarChart weeklyHoursChart={weeklyHoursChart} />

      {!hasLifetimeHours ? (
        <EmptyState
          title="No service hours yet"
          body="Tracking starts from the center Track button. Your weekly chart will fill in after your first session."
          ctaLabel="Log session?"
          ctaAccessibilityLabel="Log session"
          onCtaPress={onLogSession}
        />
      ) : null}
    </View>
  );
}

function RecentEventsSection({
  recentEvents,
  allEvents,
}: {
  recentEvents: HomeDashboardData['recentEvents'];
  allEvents: HomeDashboardData['allEvents'];
}) {
  const router = useRouter();
  const [viewAllVisible, setViewAllVisible] = useState(false);

  function openEventDetail(eventId: string) {
    setViewAllVisible(false);
    router.push({ pathname: '/event-detail', params: { id: eventId } } as Href);
  }

  const hasCatalog = allEvents.length > 0;

  return (
    <View style={s.eventsSection}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Upcoming Events</Text>
        {hasCatalog ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="View all events"
            onPress={() => setViewAllVisible(true)}
            hitSlop={8}
          >
            <Text style={s.viewAllLink}>View All</Text>
          </AnimatedPressable>
        ) : null}
      </View>
      {recentEvents.length > 0 ? (
        <View style={s.listGap}>
          {recentEvents.map((event) => (
            <UpcomingEventCard
              key={event.id}
              event={event}
              onPress={() => openEventDetail(event.id)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          title="No upcoming events yet"
          body="Check back soon for community clean-ups near you."
        />
      )}
      <EventsViewAllModal
        visible={viewAllVisible}
        events={allEvents}
        onClose={() => setViewAllVisible(false)}
        onSelectEvent={openEventDetail}
      />
    </View>
  );
}

/**
 * Home dashboard (Figma `home_dashboard___final_branding`, node `406:291`).
 * Pass `data` to render a specific mock variant; defaults to first-time user.
 */
export function HomeScreenWithData({
  data,
  sessionStats = [],
  onWeekStartChange = () => {},
}: {
  data: HomeDashboardData;
  sessionStats?: readonly SessionStatRecord[];
  onWeekStartChange?: (weekStartIso: string) => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();
  const unreadCount = useUnreadNotificationCount();
  const greeting = useMemo(() => getTimeOfDayGreeting(), []);
  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 24;
  const hasLifetimeHours = Number.parseFloat(data.lifetimeServiceHoursValue) > 0;

  function openSessionSetup() {
    void (async () => {
      if (!(await ensureTrackerAccessOrPaywall(router))) {
        return;
      }
      router.push('/session-setup' as Href);
    })();
  }

  return (
    <View style={s.root}>
      <View style={[s.appBar, shadows.barTop, { paddingTop: insets.top + 8 }]}>
        <Text style={s.appBarTitle}>Clean Up Give Back</Text>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${unreadCount} unread`}
          style={appBarIconWrap}
          onPress={() => router.push('/notifications')}
          hitSlop={8}
        >
          <NotificationIcon size={APP_BAR_ICON_SIZE} color={colors.textTertiary} />
          <CartBadge count={unreadCount} />
        </AnimatedPressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.greeting}>
          <Text style={s.greetingText}>
            {greeting}, <Text style={s.greetingName}>{data.homeUser.firstName}!</Text>
          </Text>
          {data.weeklyStreakHours > 0 && (
            <View
              style={s.streakBadge}
              accessible
              accessibilityRole="text"
              accessibilityLabel={formatWeeklyHoursBadgeCopy(data.weeklyStreakHours)}
            >
              <StreakIcon color={colors.textPrimary} />
              <Text style={s.streakText}>{formatWeeklyHoursBadgeCopy(data.weeklyStreakHours)}</Text>
            </View>
          )}
        </View>

        <ServiceHoursCard
          serviceHoursTotalLabel={data.serviceHoursTotalLabel}
          weekStartIso={data.weekStartIso}
          weekRangeLabel={data.weekRangeLabel}
          weekNumberLabel={data.weekNumberLabel}
          weeklyHoursChart={data.weeklyHoursChart}
          hasLifetimeHours={hasLifetimeHours}
          onLogSession={openSessionSetup}
          onWeekStartChange={onWeekStartChange}
        />
        <ImpactFeedSection
          sessionStats={sessionStats}
          feedItems={data.impactFeed}
          onFeedItemPress={(sessionId) =>
            router.push(`/session-detail?id=${encodeURIComponent(sessionId)}` as Href)
          }
          onViewAllPress={() => router.push('/sessions-list' as Href)}
          onLogSession={openSessionSetup}
        />
        {/* Upcoming Events hidden (section retained in file for restore). */}
        {false ? (
          <RecentEventsSection recentEvents={data.recentEvents} allEvents={data.allEvents} />
        ) : null}
      </ScrollView>


      <LiveSessionBottomNavStack
        isActive={isActive}
        barStyle={barStyle}
        expandLiveSession={expandLiveSession}
        bottomInset={bottomInset}
      >
        <BottomNavBar
          activeTab="home"
          onShopPress={() => {
            router.push('/shop' as Href);
          }}
          onTrackPress={onTrackPress}
          onSessionsPress={() => {
            router.push('/sessions-list' as Href);
          }}
          onProfilePress={() => {
            router.push('/account' as Href);
          }}
        />
      </LiveSessionBottomNavStack>
    </View>
  );
}

/** First-time user home — session-driven stats, current calendar week. */
export function HomeScreen() {
  const preferredName = usePreferredName();
  const sessionStats = useSessionStats();
  const impactFeed = useImpactFeed();
  const [selectedWeekStartIso, setSelectedWeekStartIso] = useState(
    () => getCurrentWeekMeta().weekStartIso,
  );
  const [liveUpcomingEvents, setLiveUpcomingEvents] = useState<UpcomingEventSummary[] | null>(null);
  const [liveAllEvents, setLiveAllEvents] = useState<UpcomingEventSummary[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      void hydrateSessionStatsFromApi().then(() => {
        void refreshImpactFeedFromSessionStats(getSessionStats());
      });
      void hydrateVolunteerNotifications();
      let cancelled = false;
      void (async () => {
        const [upcoming, catalog] = await Promise.all([
          fetchPublishedUpcomingEvents(),
          fetchPublishedEventsCatalog(),
        ]);
        if (cancelled) return;
        setLiveUpcomingEvents(upcoming);
        setLiveAllEvents(catalog.length > 0 ? catalog : upcoming);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const data = useMemo(() => {
    const selectedWeekStart = parseIsoDate(selectedWeekStartIso);
    const recentEvents = liveUpcomingEvents ?? [];
    const allEvents = liveAllEvents ?? [];

    return {
      ...firstTimeHomeDashboard,
      weekStartIso: selectedWeekStartIso,
      weekRangeLabel: formatWeekRangeLabel(selectedWeekStart),
      weekNumberLabel: formatWeekNumberLabel(selectedWeekStart),
      weeklyHoursChart: buildWeeklyHoursChart(sessionStats, selectedWeekStartIso),
      serviceHoursTotalLabel: formatWeekServiceHoursTotal(sessionStats, selectedWeekStartIso),
      weeklyStreakHours: computeWeeklyStreakHours(sessionStats),
      lifetimeServiceHoursValue: formatLifetimeServiceHoursValue(sessionStats),
      lifetimePlacesCopy: formatImpactPlacesCopy(sessionStats),
      impactFeed,
      recentEvents: recentEvents.slice(0, 3),
      allEvents,
      homeUser: {
        firstName: preferredName || firstTimeHomeDashboard.homeUser.firstName,
      },
    };
  }, [
    liveAllEvents,
    liveUpcomingEvents,
    preferredName,
    impactFeed,
    selectedWeekStartIso,
    sessionStats,
  ]);

  return (
    <HomeScreenWithData
      data={data}
      sessionStats={sessionStats}
      onWeekStartChange={setSelectedWeekStartIso}
    />
  );
}

const chart = StyleSheet.create({
  wrapper: {
    marginTop: CHART_TOP_OFFSET,
    width: '100%',
    overflow: 'visible',
  },
  yAxisGutter: {
    width: Y_AXIS_GUTTER,
    position: 'relative',
    flexShrink: 0,
    paddingRight: 4,
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: Y_AXIS_GUTTER - 4,
    height: Y_TICK_LINE_HEIGHT,
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 10,
    lineHeight: Y_TICK_LINE_HEIGHT,
    color: colors.copyright,
    textAlign: 'right',
    includeFontPadding: false,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderChipSelected,
    zIndex: 0,
  },
  barsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
    overflow: 'visible',
  },
  barsPlot: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: Y_AXIS_INSET,
    paddingBottom: Y_AXIS_INSET,
    paddingHorizontal: 2,
    gap: BARS_ROW_COL_GAP,
    position: 'relative',
    overflow: 'visible',
  },
  barColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    zIndex: 1,
    overflow: 'visible',
  },
  barShell: {
    width: CHART_BAR_WIDTH,
    borderTopLeftRadius: CHART_BAR_RADIUS,
    borderTopRightRadius: CHART_BAR_RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    minHeight: 20,
  },
  barValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 11,
    lineHeight: 13,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  xLabelsRow: {
    flexDirection: 'row',
    marginTop: 8,
    width: '100%',
  },
  xAxisGutter: {
    width: Y_AXIS_GUTTER,
    flexShrink: 0,
  },
  xDaysRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    gap: BARS_ROW_COL_GAP,
  },
  xLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  appBar: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  appBarTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 16,
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 22,
  },
  greeting: {
    gap: 6,
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
    gap: 6,
    backgroundColor: colors.accentLime,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.full,
    alignSelf: 'flex-start',
  },
  streakText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  serviceHoursCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingTop: 19,
    paddingBottom: 19,
    gap: 20,
    overflow: 'visible',
  },
  eventsSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  viewAllLink: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    color: colors.primary,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
    color: colors.primary,
  },
  listGap: {
    gap: 20,
  },
});
