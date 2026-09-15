import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { listSessions } from '@/lib/sessionsApi';
import { isApiConfigured } from '@/lib/api';

import type { CompletedSessionSnapshot } from './liveSessionStore';
import {
  mergeSessionStats,
  sessionStatFromApi,
  sessionStatFromSnapshot,
  type SessionStatRecord,
} from './utils/homeDashboardStats';

const STORAGE_KEY = '@cugb/sessionStats';

let sessionStats: SessionStatRecord[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setSessionStats(next: SessionStatRecord[]) {
  sessionStats = next;
  notify();
  void persistSessionStats();
}

async function persistSessionStats() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessionStats));
  } catch (error) {
    console.warn('[sessions] persist stats failed:', error);
  }
}

export function getSessionStats(): SessionStatRecord[] {
  return sessionStats;
}

export function subscribeSessionStats(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSessionStats() {
  return useSyncExternalStore(subscribeSessionStats, getSessionStats, getSessionStats);
}

export function recordSessionStatFromSnapshot(snapshot: CompletedSessionSnapshot) {
  setSessionStats(mergeSessionStats(sessionStats, [sessionStatFromSnapshot(snapshot)]));
}

export async function hydrateSessionStatsFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as SessionStatRecord[];
    if (!Array.isArray(parsed)) {
      return;
    }

    setSessionStats(mergeSessionStats(sessionStats, parsed));
  } catch (error) {
    console.warn('[sessions] hydrate stats from storage failed:', error);
  }
}

export async function hydrateSessionStatsFromApi() {
  if (!isApiConfigured) {
    return;
  }

  try {
    const sessions = await listSessions();
    const fromApi = sessions
      .map(sessionStatFromApi)
      .filter((record): record is SessionStatRecord => record != null);
    setSessionStats(mergeSessionStats(sessionStats, fromApi));
  } catch (error) {
    console.warn('[sessions] hydrate stats failed:', error);
  }
}

export function resetSessionStats() {
  setSessionStats([]);
}

function statIdsForSession(sessionId: string): Set<string> {
  const ids = new Set<string>([sessionId]);
  const localMatch = sessionId.match(/^session-(\d+)$/);
  if (localMatch) {
    ids.add(`local-${localMatch[1]}`);
  }
  return ids;
}

/** Removes dashboard stats for a deleted session. */
export function removeSessionStatsForSession(sessionId: string) {
  const ids = statIdsForSession(sessionId);
  setSessionStats(sessionStats.filter((record) => !ids.has(record.id)));
}
