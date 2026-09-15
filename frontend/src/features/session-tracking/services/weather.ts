const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_REVERSE_GEOCODE = 'https://geocoding-api.open-meteo.com/v1/reverse';

type OpenMeteoForecastResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
};

type OpenMeteoReverseGeocodeResponse = {
  results?: Array<{
    name?: string;
  }>;
};

export type CurrentWeatherSnapshot = {
  temperatureF: number;
  weatherCode: number | null;
  isDay: boolean;
};

export function formatTemperatureFahrenheit(tempF: number): string {
  return `${Math.round(tempF)}°`;
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,weather_code,is_day',
    temperature_unit: 'fahrenheit',
  });

  const response = await fetch(`${OPEN_METEO_FORECAST}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }

  const data = (await response.json()) as OpenMeteoForecastResponse;
  const temperature = data.current?.temperature_2m;
  if (typeof temperature !== 'number' || Number.isNaN(temperature)) {
    throw new Error('Weather response missing temperature');
  }

  const weatherCode =
    typeof data.current?.weather_code === 'number' ? data.current.weather_code : null;
  const isDay = data.current?.is_day !== 0;

  return { temperatureF: temperature, weatherCode, isDay };
}

/** @deprecated Prefer `fetchCurrentWeather` — kept for callers that only need °F. */
export async function fetchCurrentTemperatureF(
  latitude: number,
  longitude: number,
): Promise<number> {
  const weather = await fetchCurrentWeather(latitude, longitude);
  return weather.temperatureF;
}

/** City/town label — used on web and as a native fallback when reverse geocoding fails. */
export async function fetchPlaceName(latitude: number, longitude: number): Promise<string | null> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    count: '1',
  });

  const response = await fetch(`${OPEN_METEO_REVERSE_GEOCODE}?${params.toString()}`);
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as OpenMeteoReverseGeocodeResponse;
  return data.results?.[0]?.name ?? null;
}
