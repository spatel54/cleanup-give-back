import { getTimes } from 'suncalc';

/**
 * True when `date` falls before sunrise or after sunset at the given coordinates.
 * Sunrise/sunset can be `null` at extreme latitudes during polar day/night — in
 * that case we can't determine nighttime, so we fail open (return false).
 */
export function isNighttime(date: Date, latitude: number, longitude: number): boolean {
  const times = getTimes(date, latitude, longitude);
  if (!times.sunrise || !times.sunset) return false;
  return date < times.sunrise || date > times.sunset;
}
