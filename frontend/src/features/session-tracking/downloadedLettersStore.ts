import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useSyncExternalStore } from 'react';

import {
  LETTER_TITLE,
  formatLetterSubtitle,
  parseDownloadedLetter,
  type DownloadedLetter,
} from './downloadedLetters';
import { getSessionStats } from './sessionStatsStore';
import { sanitizeCachedFilename } from '@/lib/sanitizeCachedFilename';
import type { SharedCachedFile } from '@/lib/shareCachedFile';

const STORAGE_KEY = '@cugb/downloadedLetters';

let downloadedLetters: DownloadedLetter[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function sortLettersNewestFirst(letters: DownloadedLetter[]): DownloadedLetter[] {
  return [...letters].sort((a, b) => b.downloadedAtMs - a.downloadedAtMs);
}

function setDownloadedLetters(next: DownloadedLetter[]) {
  downloadedLetters = sortLettersNewestFirst(next);
  notify();
  void persistDownloadedLetters();
}

async function persistDownloadedLetters() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(downloadedLetters));
  } catch (error) {
    console.warn('[letters] persist failed:', error);
  }
}

export function lettersDirectory(): string | null {
  const root = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!root) {
    return null;
  }
  return `${root}letters/`;
}

async function ensureLettersDirectory(): Promise<string> {
  const directory = lettersDirectory();
  if (!directory) {
    throw new Error('File storage is not available on this device');
  }
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }
  return directory;
}

export function createDownloadedLetterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `letter-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Writes a PDF into durable app storage (not OS cache). */
export async function persistLetterPdfFile(
  contentsBase64: string,
  filename: string,
): Promise<SharedCachedFile> {
  const directory = await ensureLettersDirectory();
  const safeName = sanitizeCachedFilename(
    filename,
    `CGB-Service-Letter-${Date.now()}.pdf`,
  );
  const uri = `${directory}${safeName}`;
  const existing = await FileSystem.getInfoAsync(uri);
  if (existing.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
  await FileSystem.writeAsStringAsync(uri, contentsBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { uri, filename: safeName };
}

export async function letterFileExists(uri: string): Promise<boolean> {
  if (!uri) {
    return false;
  }
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

export function getDownloadedLetters(): DownloadedLetter[] {
  return downloadedLetters;
}

export function getDownloadedLetter(id: string): DownloadedLetter | null {
  return downloadedLetters.find((letter) => letter.id === id) ?? null;
}

export function subscribeDownloadedLetters(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDownloadedLetters(): DownloadedLetter[] {
  return useSyncExternalStore(
    subscribeDownloadedLetters,
    getDownloadedLetters,
    getDownloadedLetters,
  );
}

export function useDownloadedLetter(id: string | undefined): DownloadedLetter | null {
  const letters = useDownloadedLetters();
  if (!id) {
    return null;
  }
  return letters.find((letter) => letter.id === id) ?? null;
}

export function recordDownloadedLetter(input: {
  id?: string;
  sessionIds: string[];
  file: SharedCachedFile;
}): DownloadedLetter {
  const id = input.id ?? createDownloadedLetterId();
  const sessionIds = [...new Set(input.sessionIds.filter(Boolean))];
  const stats = getSessionStats();
  const matched = sessionIds
    .map((sessionId) => stats.find((stat) => stat.id === sessionId))
    .filter((stat): stat is NonNullable<typeof stat> => stat != null);
  const sessionDatesMs = matched.map((stat) => stat.startedAtMs).sort((a, b) => a - b);
  const totalDurationSeconds = matched.reduce((sum, stat) => sum + stat.durationSeconds, 0);
  const downloadedAtMs = Date.now();
  const letter: DownloadedLetter = {
    id,
    title: LETTER_TITLE,
    subtitle: formatLetterSubtitle(sessionDatesMs, totalDurationSeconds, downloadedAtMs),
    downloadedAtMs,
    fileUri: input.file.uri,
    filename: input.file.filename,
    sessionIds,
    sessionDatesMs,
    totalDurationSeconds,
  };
  setDownloadedLetters([letter, ...downloadedLetters.filter((row) => row.id !== id)]);
  return letter;
}

export function updateDownloadedLetterFile(id: string, file: SharedCachedFile): void {
  setDownloadedLetters(
    downloadedLetters.map((letter) =>
      letter.id === id
        ? { ...letter, fileUri: file.uri, filename: file.filename }
        : letter,
    ),
  );
}

export async function hydrateDownloadedLettersFromStorage(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return;
    }
    const fromStorage = parsed
      .map(parseDownloadedLetter)
      .filter((letter): letter is DownloadedLetter => letter != null);
    const byId = new Map<string, DownloadedLetter>();
    for (const letter of fromStorage) {
      byId.set(letter.id, letter);
    }
    for (const letter of downloadedLetters) {
      byId.set(letter.id, letter);
    }
    setDownloadedLetters([...byId.values()]);
  } catch (error) {
    console.warn('[letters] hydrate failed:', error);
  }
}

export async function resetDownloadedLetters(): Promise<void> {
  downloadedLetters = [];
  notify();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[letters] clear storage failed:', error);
  }
  const directory = lettersDirectory();
  if (!directory) {
    return;
  }
  try {
    await FileSystem.deleteAsync(directory, { idempotent: true });
  } catch (error) {
    console.warn('[letters] clear files failed:', error);
  }
}
