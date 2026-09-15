import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  fetchCurrentWeather,
  fetchPlaceName,
  formatTemperatureFahrenheit,
} from '../services/weather';
import { weatherCodeToIconKey } from '../utils/weatherCondition';
import type { WeatherIconKey } from '../utils/weatherIconPaths';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export type LiveWeatherState = {
  placeLabel: string | null;
  temperatureLabel: string;
  weatherIcon: WeatherIconKey;
  isLoading: boolean;
};

const INITIAL_STATE: LiveWeatherState = {
  placeLabel: null,
  temperatureLabel: '-',
  weatherIcon: 'sunny',
  isLoading: true,
};

async function resolvePlaceLabel(latitude: number, longitude: number): Promise<string | null> {
  if (Platform.OS !== 'web') {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const first = results[0];
      if (first) {
        return first.city ?? first.subregion ?? first.region ?? first.district ?? null;
      }
    } catch {
      // Fall through to Open-Meteo reverse geocoding.
    }
  }

  return fetchPlaceName(latitude, longitude);
}

async function loadLiveWeather(): Promise<
  Pick<LiveWeatherState, 'placeLabel' | 'temperatureLabel' | 'weatherIcon'>
> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { placeLabel: null, temperatureLabel: '-', weatherIcon: 'sunny' };
  }

  const position = await Promise.race([
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 8000);
    }),
  ]);

  if (!position) {
    return { placeLabel: null, temperatureLabel: '-', weatherIcon: 'sunny' };
  }

  const { latitude, longitude } = position.coords;
  const [placeLabel, weather] = await Promise.all([
    resolvePlaceLabel(latitude, longitude),
    fetchCurrentWeather(latitude, longitude),
  ]);

  return {
    placeLabel,
    temperatureLabel: formatTemperatureFahrenheit(weather.temperatureF),
    weatherIcon: weatherCodeToIconKey(weather.weatherCode, weather.isDay),
  };
}

export function useLiveWeather(): LiveWeatherState {
  const [state, setState] = useState<LiveWeatherState>(INITIAL_STATE);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true }));

    try {
      const next = await loadLiveWeather();
      setState({
        placeLabel: next.placeLabel,
        temperatureLabel: next.temperatureLabel,
        weatherIcon: next.weatherIcon,
        isLoading: false,
      });
    } catch {
      setState((current) => ({
        placeLabel: current.placeLabel,
        temperatureLabel: '-',
        weatherIcon: current.weatherIcon,
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();

    const intervalId = setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [refresh]);

  return state;
}
