import { useSyncExternalStore } from 'react';

import type { RecentSessionSummary } from '@/features/figma-screens/mocks/home.types';
import { listSessions } from '@/lib/sessionsApi';
import { isApiConfigured } from '@/lib/api';
import { mapApiSessionToListItem } from '@/lib/mapApiSessions';

import type { CompletedSessionSnapshot } from './liveSessionStore';
import { isVolunteerSessionDeleted } from './volunteerDeletedSessions';
import {
  formatRecentSessionDateLabel,
  formatRecentSessionDurationLabel,
  formatRecentSessionTimeLabel,
  resolveSessionDurationSeconds,
} from './utils/sessionFormat';

const MAX_RECENT_SESSIONS = 10;

let recentSessions: RecentSessionSummary[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function toRecentSessionSummary(snapshot: CompletedSessionSnapshot): RecentSessionSummary {
  const durationSeconds = resolveSessionDurationSeconds({
    startedAt: snapshot.startedAt,
    endedAt: snapshot.endedAt,
    elapsedSeconds: snapshot.elapsedSeconds,
  });

  return {
    id: snapshot.remoteSessionId ?? `session-${snapshot.endedAt}`,
    title: snapshot.setup.activity,
    dateLabel: formatRecentSessionDateLabel(snapshot.startedAt),
    timeLabel: formatRecentSessionTimeLabel(snapshot.startedAt, snapshot.endedAt),
    durationLabel: formatRecentSessionDurationLabel(durationSeconds),
  };
}

/** Prepends a completed session for the Home dashboard recent-sessions list. */
export function recordCompletedSession(snapshot: CompletedSessionSnapshot) {
  const summary = toRecentSessionSummary(snapshot);
  recentSessions = [summary, ...recentSessions.filter((session) => session.id !== summary.id)].slice(
    0,
    MAX_RECENT_SESSIONS,
  );
  notify();
}

/** Loads recent sessions from the API when configured. */
export async function hydrateRecentSessionsFromApi() {
  if (!isApiConfigured) {
    return;
  }

  try {
    const sessions = await listSessions();
    recentSessions = sessions
      .filter((session) => session.status !== 'active')
      .filter((session) => !isVolunteerSessionDeleted(session.id))
      .slice(0, MAX_RECENT_SESSIONS)
      .map((session) => {
        const item = mapApiSessionToListItem(session);
        return {
          id: item.id,
          title: item.title,
          dateLabel: item.dateLabel,
          timeLabel: item.timeLabel,
          durationLabel:
            session.durationSeconds != null
              ? formatRecentSessionDurationLabel(session.durationSeconds)
              : session.startedAt && session.endedAt
                ? formatRecentSessionDurationLabel(
                    resolveSessionDurationSeconds({
                      startedAt: new Date(session.startedAt).getTime(),
                      endedAt: new Date(session.endedAt).getTime(),
                    }),
                  )
                : '-',
        };
      });
    notify();
  } catch (error) {
    console.warn('[sessions] hydrate recent failed:', error);
  }
}

export function getRecentSessions(): RecentSessionSummary[] {
  return recentSessions;
}

export function subscribeRecentSessions(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRecentSessions() {
  return useSyncExternalStore(subscribeRecentSessions, getRecentSessions, getRecentSessions);
}

/** Test/dev helper — clears in-memory recent sessions. */
export function resetRecentSessions() {
  recentSessions = [];
  notify();
}

/** Removes one session from the Home recent list (e.g. after volunteer delete). */
export function removeRecentSession(sessionId: string) {
  recentSessions = recentSessions.filter((session) => session.id !== sessionId);
  notify();
}
