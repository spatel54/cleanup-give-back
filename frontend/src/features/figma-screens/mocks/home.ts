import type { HomeDashboardData, ImpactMonthSummary, ImpactStat, RecentSessionSummary, UpcomingEventSummary } from './home.types';
import { getCurrentWeekMeta } from '../utils/weekCalendar';

export type { HomeDashboardData, ImpactMonthSummary, ImpactStat, RecentSessionSummary, UpcomingEventSummary };

/**
 * Mock location-mapped remote thumbnails (stand-in for Google Places photos).
 * Keys are stable Unsplash Source URLs keyed by Des Plaines / Mt Prospect venues.
 */
const EVENT_IMAGE_BY_LOCATION: Record<string, { uri: string }> = {
  '600 E Algonquin Rd, Des Plaines, IL 60016, USA': {
    uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  },
  '1425 N McKinley Rd, Des Plaines, IL 60016, USA': {
    uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
  },
  '2200 E Algonquin Rd, Mt Prospect, IL 60056, USA': {
    uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
  },
  '800 Central Rd, Glenview, IL 60025, USA': {
    uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  },
};

function eventImageForLocation(location: string): { uri: string } {
  return (
    EVENT_IMAGE_BY_LOCATION[location] ?? {
      uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    }
  );
}

export { eventImageForLocation };

/** First-time user — empty stats; week fields are merged at render time in `HomeScreen`. */
export const firstTimeHomeDashboard: HomeDashboardData = {
  homeUser: { firstName: 'Shivam' },
  weeklyStreakHours: 0,
  serviceHoursTotalLabel: '0 min',
  ...getCurrentWeekMeta(),
  weeklyHoursChart: [
    { day: 'Mon', value: 0 },
    { day: 'Tue', value: 0 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 },
    { day: 'Fri', value: 0 },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ],
  lifetimeServiceHoursValue: '0.0',
  lifetimePlacesCopy: '',
  impactMonthSummaries: [
    {
      monthKey: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      monthLabel: new Date().toLocaleString('en-US', { month: 'long' }),
      placeCount: 0,
      hours: 0,
    },
  ],
  impactFeed: [],
  recentSessions: [],
  recentEvents: [],
  allEvents: [],
  notificationCount: 0,
};
