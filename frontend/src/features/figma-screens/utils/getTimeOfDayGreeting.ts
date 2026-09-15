export type TimeOfDayGreeting =
  | 'Good night'
  | 'Good morning'
  | 'Good afternoon'
  | 'Good evening';

/**
 * Returns the greeting phrase for the current local time.
 *
 * Boundaries (local device clock):
 * - Night: 12:00 AM – 4:59 AM
 * - Morning: 5:00 AM – 11:59 AM
 * - Afternoon: 12:00 PM – 4:59 PM
 * - Evening: 5:00 PM – 11:59 PM
 */
export function getTimeOfDayGreeting(date: Date = new Date()): TimeOfDayGreeting {
  const hour = date.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
