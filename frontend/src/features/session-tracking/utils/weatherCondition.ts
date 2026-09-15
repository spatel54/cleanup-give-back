import type { WeatherIconKey } from './weatherIconPaths';

function dayNight(
  isDay: boolean,
  dayKey: WeatherIconKey,
  nightKey: WeatherIconKey,
): WeatherIconKey {
  return isDay ? dayKey : nightKey;
}

/**
 * Map Open-Meteo WMO weather codes → in-app glyph keys (Weather Icons / react-icons/wi).
 * @see https://open-meteo.com/en/docs
 */
export function weatherCodeToIconKey(
  weatherCode: number | null | undefined,
  isDay: boolean,
): WeatherIconKey {
  if (weatherCode == null || Number.isNaN(weatherCode)) {
    return dayNight(isDay, 'sunny', 'night-clear');
  }

  switch (true) {
    case weatherCode === 0:
      return dayNight(isDay, 'sunny', 'night-clear');
    case weatherCode === 1:
      return dayNight(isDay, 'overcast', 'night-partly-cloudy');
    case weatherCode === 2:
      return dayNight(isDay, 'partly-cloudy', 'night-partly-cloudy');
    case weatherCode === 3:
      return dayNight(isDay, 'cloudy', 'night-cloudy');
    case weatherCode === 45:
    case weatherCode === 48:
      return dayNight(isDay, 'day-fog', 'night-fog');
    case weatherCode >= 51 && weatherCode <= 55:
      return dayNight(isDay, 'day-showers', 'night-showers');
    case weatherCode === 56:
    case weatherCode === 57:
      return 'sleet';
    case weatherCode >= 61 && weatherCode <= 65:
      return dayNight(isDay, 'day-rain', 'night-rain');
    case weatherCode === 66:
    case weatherCode === 67:
      return 'sleet';
    case weatherCode >= 71 && weatherCode <= 77:
      return dayNight(isDay, 'day-snow', 'night-snow');
    case weatherCode >= 80 && weatherCode <= 82:
      return dayNight(isDay, 'day-showers', 'night-showers');
    case weatherCode >= 85 && weatherCode <= 86:
      return dayNight(isDay, 'day-snow', 'night-snow');
    case weatherCode === 95:
    case weatherCode === 97:
      return dayNight(isDay, 'day-thunderstorm', 'night-thunderstorm');
    case weatherCode === 96:
    case weatherCode === 99:
      return 'hail';
    default:
      return dayNight(isDay, 'partly-cloudy', 'night-clear');
  }
}
