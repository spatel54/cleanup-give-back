import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type MapBasemapTheme = 'light' | 'dark';

/** The three user-facing map theme choices. 'system' maps to followTimeOfDay. */
export type MapThemeMode = 'light' | 'dark' | 'system';

export type MapThemeSettings = {
  /** When true, Standard basemap follows local day/night hours. */
  followTimeOfDay: boolean;
  /** Used when `followTimeOfDay` is false, and as the seed after a manual toggle. */
  manualTheme: MapBasemapTheme;
};

const STORAGE_KEY = '@cugb/mapThemeSettings';

/** Dark Standard basemap from 7:00 PM local through 5:59 AM. */
export function mapThemeFromLocalTime(now: Date = new Date()): MapBasemapTheme {
  const hour = now.getHours();
  return hour >= 19 || hour < 6 ? 'dark' : 'light';
}

export function getEffectiveMapTheme(
  settings: MapThemeSettings,
  now: Date = new Date(),
): MapBasemapTheme {
  return settings.followTimeOfDay ? mapThemeFromLocalTime(now) : settings.manualTheme;
}

const DEFAULT_SETTINGS: MapThemeSettings = {
  followTimeOfDay: true,
  manualTheme: 'light',
};

let settings: MapThemeSettings = { ...DEFAULT_SETTINGS };
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

async function persist(next: MapThemeSettings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Preference persistence is best-effort.
  }
}

export async function hydrateMapThemeSettings(): Promise<void> {
  if (hydrated) {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MapThemeSettings>;
      settings = {
        followTimeOfDay:
          typeof parsed.followTimeOfDay === 'boolean'
            ? parsed.followTimeOfDay
            : DEFAULT_SETTINGS.followTimeOfDay,
        manualTheme: parsed.manualTheme === 'dark' ? 'dark' : 'light',
      };
    }
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }

  hydrated = true;
  notify();
}

export function getMapThemeSettings(): MapThemeSettings {
  return settings;
}

export function subscribeMapThemeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setMapThemeFollowTimeOfDay(follow: boolean) {
  if (settings.followTimeOfDay === follow) {
    return;
  }

  settings = {
    ...settings,
    followTimeOfDay: follow,
    // When leaving auto, seed manual from the current effective theme.
    manualTheme: follow ? settings.manualTheme : getEffectiveMapTheme(settings),
  };
  notify();
  void persist(settings);
}

/** Manual light/dark choice — turns off time-of-day follow. */
export function setManualMapTheme(theme: MapBasemapTheme) {
  settings = {
    followTimeOfDay: false,
    manualTheme: theme,
  };
  notify();
  void persist(settings);
}

export function toggleManualMapTheme() {
  const next: MapBasemapTheme = getEffectiveMapTheme(settings) === 'dark' ? 'light' : 'dark';
  setManualMapTheme(next);
}

export function useMapThemeSettings(): MapThemeSettings {
  return useSyncExternalStore(subscribeMapThemeSettings, getMapThemeSettings, getMapThemeSettings);
}

/** Effective Standard basemap theme; re-renders when settings change. */
export function useEffectiveMapTheme(): MapBasemapTheme {
  const current = useMapThemeSettings();
  // Tick once a minute so auto day/night flips without a remount.
  const tick = useSyncExternalStore(
    (onStoreChange) => {
      const id = setInterval(onStoreChange, 60_000);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / 60_000),
    () => 0,
  );
  void tick;
  return getEffectiveMapTheme(current);
}

export function getMapThemeMode(): MapThemeMode {
  if (settings.followTimeOfDay) return 'system';
  return settings.manualTheme;
}

export function setMapThemeMode(mode: MapThemeMode) {
  if (mode === 'system') {
    setMapThemeFollowTimeOfDay(true);
  } else {
    setManualMapTheme(mode);
  }
}

export function useMapThemeMode(): MapThemeMode {
  const s = useMapThemeSettings();
  return s.followTimeOfDay ? 'system' : s.manualTheme;
}
