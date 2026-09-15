import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = '@cugb/sessionNotes';

/** Max characters for per-session notes on Session Detail. */
export const SESSION_NOTES_MAX_LENGTH = 500;

type SessionNotesMap = Record<string, string>;

let sessionNotes: SessionNotesMap = {};
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setNotesMap(next: SessionNotesMap) {
  sessionNotes = next;
  notify();
  void persistSessionNotes();
}

async function persistSessionNotes() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessionNotes));
  } catch (error) {
    console.warn('[sessions] persist notes failed:', error);
  }
}

export function getSessionNotesMap(): SessionNotesMap {
  return sessionNotes;
}

export function subscribeSessionNotes(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSessionNotes(sessionId: string): string {
  return sessionNotes[sessionId] ?? '';
}

export function setSessionNotes(sessionId: string, text: string) {
  const nextText = text.slice(0, SESSION_NOTES_MAX_LENGTH);
  setNotesMap({ ...sessionNotes, [sessionId]: nextText });
}

export function useSessionNotes(sessionId?: string): {
  notes: string;
  setNotes: (text: string) => void;
} {
  const map = useSyncExternalStore(
    subscribeSessionNotes,
    getSessionNotesMap,
    getSessionNotesMap,
  );

  const notes = sessionId ? (map[sessionId] ?? '') : '';

  return {
    notes,
    setNotes: (text: string) => {
      if (sessionId) {
        setSessionNotes(sessionId, text);
      }
    },
  };
}

export async function hydrateSessionNotesFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as SessionNotesMap;
    if (!parsed || typeof parsed !== 'object') {
      return;
    }

    setNotesMap(parsed);
  } catch (error) {
    console.warn('[sessions] hydrate notes from storage failed:', error);
  }
}

/** Test/dev helper — clears persisted session notes. */
export function resetSessionNotes() {
  setNotesMap({});
}
