import type { CompletedSessionSnapshot } from './liveSessionStore';

const cache = new Map<string, CompletedSessionSnapshot>();

/** Stores completed session snapshots for session detail / list lookups. */
export function cacheCompletedSession(snapshot: CompletedSessionSnapshot) {
  const primaryId = snapshot.remoteSessionId ?? `session-${snapshot.endedAt}`;
  cache.set(primaryId, snapshot);
  cache.set(`session-${snapshot.endedAt}`, snapshot);
}

export function getCachedCompletedSession(id?: string): CompletedSessionSnapshot | null {
  if (!id) {
    return null;
  }

  return cache.get(id) ?? null;
}

/** Test/dev helper — clears cached completed sessions. */
export function resetCompletedSessionCache() {
  cache.clear();
}

/** Drops cached snapshot keys for a session id (local or remote). */
export function removeCompletedSessionFromCache(sessionId: string) {
  const keysToDelete = new Set<string>([sessionId]);
  const snapshot = cache.get(sessionId);

  if (snapshot) {
    if (snapshot.remoteSessionId) {
      keysToDelete.add(snapshot.remoteSessionId);
    }
    keysToDelete.add(`session-${snapshot.endedAt}`);
  } else {
    const localMatch = sessionId.match(/^session-(\d+)$/);
    if (localMatch) {
      for (const [key, value] of cache.entries()) {
        if (String(value.endedAt) === localMatch[1]) {
          keysToDelete.add(key);
        }
      }
    }
  }

  for (const key of keysToDelete) {
    cache.delete(key);
  }
}
