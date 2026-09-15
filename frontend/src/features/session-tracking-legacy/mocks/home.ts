import type { WeeklyHoursDatum } from '../components/WeeklyHoursChart';

/**
 * Mock data for the Home dashboard screen (Figma `home_dashboard___final_branding`,
 * `406:291`). Distinct from `mocks/session.ts`, which backs the Session
 * Tracking flow proper (PRD §6.9–6.15) — the Home dashboard is a separate
 * Home & Events area (figma-to-native-handoff.md) that this feature slice
 * only touches for the minimize-to-Home interaction.
 */

export const homeUser = {
  firstName: 'Shivam',
};

export const weeklyStreakHours = 5;

/** Bars, left to right, matching the Figma mock exactly. */
export const weeklyHoursChart: WeeklyHoursDatum[] = [
  { day: 'Mon', minutes: 60 },
  { day: 'Tue', minutes: 105 },
  { day: 'Wed', minutes: 160 },
  { day: 'Thr', minutes: 75 },
  { day: 'Fri', minutes: 120 },
  { day: 'Sat', minutes: 110 },
  { day: 'Sun', minutes: 180 },
];

export const serviceHoursTotalLabel = '20.5 hrs';
export const weekRangeLabel = 'October 21 - 28, 2026';
export const weekNumberLabel = 'Week 16';

export type ImpactStat = {
  id: string;
  value: string;
  label: string;
  icon: 'route' | 'locationPin' | 'sessions' | 'camera';
};

/**
 * Values are copied verbatim from the Figma mock — "Sessions Completed" and
 * "Photos Submitted" showing decimals is a quirk of the source design's
 * placeholder data, not a real-world unit.
 */
export const impactStats: ImpactStat[] = [
  { id: 'miles', value: '12.5', label: 'MILES COVERED', icon: 'route' },
  { id: 'locations', value: '15.0', label: 'LOCATIONS CLEANED', icon: 'locationPin' },
  { id: 'sessions', value: '20.3', label: 'SESSIONS COMPLETED', icon: 'sessions' },
  { id: 'photos', value: '9.8', label: 'PHOTOS SUBMITTED', icon: 'camera' },
];

export type RecentSessionSummary = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
};

export const recentSessions: RecentSessionSummary[] = [
  { id: 'rs-1', title: 'City Park Trail Clean-up', dateLabel: 'Oct 24', timeLabel: '9:00-11:00 AM', durationLabel: '2.5 hrs' },
  { id: 'rs-2', title: 'City Park Trail Clean-up', dateLabel: 'Oct 24', timeLabel: '9:00-11:00 AM', durationLabel: '2.5 hrs' },
  { id: 'rs-3', title: 'City Park Trail Clean-up', dateLabel: 'Oct 24', timeLabel: '9:00-11:00 AM', durationLabel: '2.5 hrs' },
];

export type UpcomingEventSummary = {
  id: string;
  day: string;
  month: string;
  weekday: string;
  location: string;
  timeLabel: string;
  organization: string;
};

export const recentEvents: UpcomingEventSummary[] = [
  {
    id: 'ev-1',
    day: '15',
    month: 'June',
    weekday: 'Mon',
    location: '600 E Algonquin Rd, Des Plaines, IL 60016, USA',
    timeLabel: '10:30 AM - 12:30 PM',
    organization: 'D214 Life Program',
  },
  {
    id: 'ev-2',
    day: '15',
    month: 'June',
    weekday: 'Mon',
    location: '600 E Algonquin Rd, Des Plaines, IL 60016, USA',
    timeLabel: '10:30 AM - 12:30 PM',
    organization: 'D214 Life Program',
  },
];

export const notificationCount = 1;
