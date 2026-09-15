import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@cugb/volunteer-deleted-sessions';

const deletedSessionIds = new Set<string>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

async function persistDeletedSessionIds() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...deletedSessionIds]));
  } catch (error) {
    console.warn('[sessions] persist deleted tombstones failed:', error);
  }
}

/** Loads tombstones from device storage (call before list/recent hydrate). */
export async function hydrateVolunteerDeletedSessions(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return;
    }

    let changed = false;
    for (const id of parsed) {
      if (typeof id !== 'string') {
        continue;
      }
      const trimmed = id.trim();
      if (!trimmed || deletedSessionIds.has(trimmed)) {
        continue;
      }
      deletedSessionIds.add(trimmed);
      changed = true;
    }
    if (changed) {
      notify();
    }
  } catch (error) {
    console.warn('[sessions] hydrate deleted tombstones failed:', error);
  }
}

/** Marks session ids hidden from volunteer lists after delete (persisted across app restarts). */
export function markVolunteerSessionsDeleted(ids: string[]): void {
  let changed = false;
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || deletedSessionIds.has(trimmed)) {
      continue;
    }
    deletedSessionIds.add(trimmed);
    changed = true;
  }
  if (changed) {
    notify();
    void persistDeletedSessionIds();
  }
}

export function isVolunteerSessionDeleted(sessionId: string | undefined | null): boolean {
  if (!sessionId?.trim()) {
    return false;
  }
  return deletedSessionIds.has(sessionId.trim());
}

export async function clearVolunteerDeletedSessions(): Promise<void> {
  deletedSessionIds.clear();
  notify();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // In-memory tombstones are already empty.
  }
}

export function subscribeVolunteerSessionDeletes(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
