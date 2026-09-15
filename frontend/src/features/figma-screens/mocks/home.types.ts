/** Shared mock shapes for Home dashboard variants. */

export type ImpactStat = {
  id: string;
  value: string;
  label: string;
  icon: 'miles' | 'locations' | 'sessions' | 'photos';
};

/** Progress-photo tile in the Home impact feed. */
export type ImpactFeedItem = {
  id: string;
  sessionId: string;
  imageUri: string;
  sessionTitle: string;
  dateLabel: string;
  /** Photo capture time, e.g. `5:30 PM`. */
  timeLabel: string;
  /** Session duration, e.g. `2.5 hrs`. */
  durationLabel: string;
  capturedAtMs: number;
  status: 'approved' | 'pending';
  /** Downsampled walking path `[lon, lat]` for the tile map thumbnail. */
  routePreview: readonly [number, number][];
  /** Last known session location `[lon, lat]` for the static map snapshot. */
  mapAnchor: readonly [number, number] | null;
};

export type RecentSessionSummary = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
};

export type UpcomingEventSummary = {
  id: string;
  title: string;
  day: string;
  month: string;
  weekday: string;
  year: string;
  location: string;
  timeLabel: string;
  organization: string;
  /** Local `require()` id or remote URI mock mapped by location. */
  image: number | { uri: string };
};

export type WeeklyHoursDatum = {
  day: string;
  /** Hours of service logged that day (one decimal place). */
  value: number;
};

/** Per-month impact totals for the Home “In {month}…” sentence. */
export type ImpactMonthSummary = {
  monthKey: string;
  monthLabel: string;
  placeCount: number;
  hours: number;
};

export type HomeDashboardData = {
  homeUser: { firstName: string };
  weeklyStreakHours: number;
  serviceHoursTotalLabel: string;
  weekRangeLabel: string;
  weekNumberLabel: string;
  /** ISO date (`YYYY-MM-DD`) for the Monday that starts the default chart week. */
  weekStartIso: string;
  weeklyHoursChart: readonly WeeklyHoursDatum[];
  /** Lifetime service hours headline value (one decimal), e.g. `24.5`. */
  lifetimeServiceHoursValue: string;
  /** Human places line under lifetime hours; empty when no named locations. */
  lifetimePlacesCopy: string;
  /** Month picker options + place/hour totals for the impact sentence. */
  impactMonthSummaries: ImpactMonthSummary[];
  impactFeed: ImpactFeedItem[];
  recentSessions: RecentSessionSummary[];
  /** Preview list shown on the home card. */
  recentEvents: UpcomingEventSummary[];
  /** Full catalog shown in the View All events modal. */
  allEvents: UpcomingEventSummary[];
  notificationCount: number;
};
