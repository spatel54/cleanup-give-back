import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getUserId, supabase } from '@/lib/supabase';

import {
  earlierCreatedAt,
  incomingVolunteerNotificationFromPayload,
  isSameIncomingVolunteerNotification,
  type IncomingVolunteerNotificationInput,
} from './incomingVolunteerNotification';
import {
  hrefForVolunteerNotification,
  isVolunteerNotificationType,
  type VolunteerNotification,
  type VolunteerNotificationType,
} from './notificationRouting';
import {
  buildSampleVolunteerNotifications,
  isSampleNotificationId,
  isSampleVolunteerInbox,
} from './sampleVolunteerNotifications';

export type { VolunteerNotification, VolunteerNotificationType };
export { hrefForVolunteerNotification };

type NotificationRow = {
  id: string;
  session_id: string | null;
  order_id: string | null;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

let notifications: VolunteerNotification[] = buildSampleVolunteerNotifications();
const listeners = new Set<() => void>();
const CLEARED_STORAGE_KEY = '@cugb/notificationsInboxCleared';
const PINNED_STORAGE_KEY = '@cugb/notificationsPinned';
let inboxClearedByUser = false;
/** Local pin timestamps keyed by notification id (not synced to Supabase). */
let pinnedById: Record<string, string> = {};
let realtimeChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function pinnedAtFor(id: string): string | null {
  return pinnedById[id] ?? null;
}

function withPinnedState(item: VolunteerNotification): VolunteerNotification {
  return { ...item, pinnedAt: pinnedAtFor(item.id) };
}

function mapRow(row: NotificationRow): VolunteerNotification | null {
  if (!isVolunteerNotificationType(row.type)) {
    return null;
  }
  return withPinnedState({
    id: row.id,
    sessionId: row.session_id,
    orderId: row.order_id,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
    pinnedAt: null,
  });
}

function unreadCountFrom(items: VolunteerNotification[]): number {
  return items.reduce((count, item) => (item.readAt ? count : count + 1), 0);
}

function hasLiveInboxRows(items: VolunteerNotification[]): boolean {
  return items.some((item) => !isSampleNotificationId(item.id));
}

function sortInbox(items: VolunteerNotification[]): VolunteerNotification[] {
  return [...items].sort((left, right) => {
    const leftPinned = left.pinnedAt != null;
    const rightPinned = right.pinnedAt != null;
    if (leftPinned !== rightPinned) {
      return leftPinned ? -1 : 1;
    }
    if (leftPinned && rightPinned && left.pinnedAt && right.pinnedAt) {
      const pinDiff = Date.parse(right.pinnedAt) - Date.parse(left.pinnedAt);
      if (pinDiff !== 0) {
        return pinDiff;
      }
    }
    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
}

async function persistPinnedMap(): Promise<void> {
  try {
    if (Object.keys(pinnedById).length === 0) {
      await AsyncStorage.removeItem(PINNED_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedById));
  } catch {
    // In-memory pin state remains usable.
  }
}

async function loadPinnedMap(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PINNED_STORAGE_KEY);
    if (!raw) {
      pinnedById = {};
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      pinnedById = {};
      return;
    }
    const next: Record<string, string> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof id === 'string' && typeof value === 'string' && value.length > 0) {
        next[id] = value;
      }
    }
    pinnedById = next;
  } catch {
    pinnedById = {};
  }
}

function prunePinnedToExisting(items: VolunteerNotification[]): void {
  const ids = new Set(items.map((item) => item.id));
  let changed = false;
  for (const id of Object.keys(pinnedById)) {
    if (!ids.has(id)) {
      delete pinnedById[id];
      changed = true;
    }
  }
  if (changed) {
    void persistPinnedMap();
  }
}

function mergeLiveNotification(item: VolunteerNotification): void {
  const live = notifications.filter((existing) => !isSampleNotificationId(existing.id));
  const existing = live.find((row) => isSameIncomingVolunteerNotification(row, item));
  const withoutDup = live.filter((row) => !isSameIncomingVolunteerNotification(row, item));
  const mergedId = existing && !existing.id.startsWith('incoming-') ? existing.id : item.id;
  if (existing && existing.id !== mergedId && pinnedById[existing.id]) {
    pinnedById[mergedId] = pinnedById[existing.id];
    delete pinnedById[existing.id];
    void persistPinnedMap();
  }
  const merged: VolunteerNotification = withPinnedState({
    ...item,
    id: mergedId,
    createdAt: existing ? earlierCreatedAt(existing.createdAt, item.createdAt) : item.createdAt,
    readAt: existing?.readAt ?? item.readAt,
    pinnedAt: null,
  });
  notifications = sortInbox([merged, ...withoutDup]);
  inboxClearedByUser = false;
  emit();
}

function applyEmptyInbox(): void {
  if (inboxClearedByUser) {
    notifications = [];
    emit();
    return;
  }
  if (hasLiveInboxRows(notifications) || isSampleVolunteerInbox(notifications)) {
    notifications = sortInbox(notifications.map((item) => withPinnedState(item)));
    emit();
    return;
  }
  notifications = sortInbox(
    buildSampleVolunteerNotifications().map((item) => withPinnedState(item)),
  );
  emit();
}

async function loadClearedFlag(): Promise<void> {
  try {
    inboxClearedByUser = (await AsyncStorage.getItem(CLEARED_STORAGE_KEY)) === '1';
  } catch {
    inboxClearedByUser = false;
  }
}

/** Loads the signed-in volunteer's inbox. Sample rows fill an empty or failed fetch. */
export async function hydrateVolunteerNotifications(): Promise<void> {
  await loadClearedFlag();
  await loadPinnedMap();
  if (!supabase) {
    applyEmptyInbox();
    return;
  }

  try {
    const { data, error } = await supabase
      .from('volunteer_notifications')
      .select('id, session_id, order_id, type, title, body, read_at, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    const mapped = (data ?? [])
      .map((row) => mapRow(row as NotificationRow))
      .filter((item): item is VolunteerNotification => item != null);
    if (mapped.length === 0) {
      applyEmptyInbox();
      return;
    }
    inboxClearedByUser = false;
    await AsyncStorage.removeItem(CLEARED_STORAGE_KEY);
    const mappedMerged = mapped.map((row) => {
      const existing = notifications.find((item) => isSameIncomingVolunteerNotification(item, row));
      if (!existing) {
        return withPinnedState(row);
      }
      return withPinnedState({
        ...row,
        createdAt: earlierCreatedAt(existing.createdAt, row.createdAt),
        readAt: existing.readAt ?? row.readAt,
        pinnedAt: null,
      });
    });
    const incomingOnly = notifications.filter(
      (item) =>
        !isSampleNotificationId(item.id)
        && !mappedMerged.some((row) => isSameIncomingVolunteerNotification(row, item)),
    ).map((item) => withPinnedState(item));
    notifications = sortInbox([...mappedMerged, ...incomingOnly]);
    prunePinnedToExisting(notifications);
    emit();
  } catch (error) {
    console.warn('[notifications] hydrate failed:', error);
    applyEmptyInbox();
  }
}

/**
 * Persist a received Expo banner into Messages. Server rows (real UUID id) are
 * merged locally then hydrated; payloads without an id are inserted by the volunteer.
 */
export async function ingestIncomingVolunteerNotification(
  input: IncomingVolunteerNotificationInput,
): Promise<void> {
  const item = incomingVolunteerNotificationFromPayload(input);
  if (!item) {
    return;
  }

  mergeLiveNotification(item);
  try {
    await AsyncStorage.removeItem(CLEARED_STORAGE_KEY);
  } catch {
    // In-memory merge already happened.
  }

  const stored = notifications.find((row) => isSameIncomingVolunteerNotification(row, item));
  const isPersistedId = Boolean(stored && !stored.id.startsWith('incoming-'));
  if (supabase && !isPersistedId) {
    const userId = await getUserId();
    if (userId) {
      const { data, error } = await supabase
        .from('volunteer_notifications')
        .insert({
          user_id: userId,
          type: item.type,
          title: item.title,
          body: item.body,
          session_id: item.sessionId,
          order_id: item.orderId,
        })
        .select('id, created_at')
        .single();
      if (error) {
        console.warn('[notifications] persist incoming failed:', error.message);
      } else if (typeof data?.id === 'string') {
        const previousId = stored?.id ?? item.id;
        if (previousId !== data.id && pinnedById[previousId]) {
          pinnedById[data.id] = pinnedById[previousId];
          delete pinnedById[previousId];
          void persistPinnedMap();
        }
        notifications = sortInbox(
          notifications.map((existing) =>
            existing.id === previousId
              ? withPinnedState({
                  ...existing,
                  id: data.id,
                  createdAt:
                    typeof data.created_at === 'string'
                      ? earlierCreatedAt(existing.createdAt, data.created_at)
                      : existing.createdAt,
                  pinnedAt: null,
                })
              : existing,
          ),
        );
        emit();
      }
    }
  }

  await hydrateVolunteerNotifications();
}

export async function startVolunteerNotificationsRealtime(): Promise<() => void> {
  stopVolunteerNotificationsRealtime();
  if (!supabase) {
    return () => undefined;
  }

  const userId = await getUserId();
  if (!userId) {
    return () => undefined;
  }

  const channel = supabase
    .channel(`volunteer-notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'volunteer_notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const mapped = mapRow(payload.new as NotificationRow);
          if (mapped) {
            mergeLiveNotification(mapped);
          }
          return;
        }
        if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as { id?: string } | null)?.id;
          if (!deletedId) {
            return;
          }
          notifications = notifications.filter((item) => item.id !== deletedId);
          emit();
        }
      },
    )
    .subscribe();
  realtimeChannel = channel;
  return stopVolunteerNotificationsRealtime;
}

export function stopVolunteerNotificationsRealtime(): void {
  if (!supabase || !realtimeChannel) {
    realtimeChannel = null;
    return;
  }
  void supabase.removeChannel(realtimeChannel);
  realtimeChannel = null;
}

export async function markNotificationRead(id: string): Promise<void> {
  const existing = notifications.find((item) => item.id === id);
  if (!existing || existing.readAt) {
    return;
  }

  const readAt = new Date().toISOString();
  notifications = notifications.map((item) =>
    item.id === id ? { ...item, readAt } : item,
  );
  emit();

  if (!supabase || isSampleNotificationId(id)) {
    return;
  }

  const { error } = await supabase
    .from('volunteer_notifications')
    .update({ read_at: readAt })
    .eq('id', id);
  if (error) {
    console.warn('[notifications] mark read failed:', error.message);
  }
}

export async function clearVolunteerNotifications(): Promise<void> {
  const liveIds = notifications
    .map((item) => item.id)
    .filter((id) => !isSampleNotificationId(id));
  notifications = [];
  pinnedById = {};
  inboxClearedByUser = true;
  emit();
  try {
    await AsyncStorage.setItem(CLEARED_STORAGE_KEY, '1');
    await AsyncStorage.removeItem(PINNED_STORAGE_KEY);
  } catch {
    // Keep the in-memory empty inbox even if storage write fails.
  }

  if (!supabase || liveIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('volunteer_notifications')
    .delete()
    .in('id', liveIds);
  if (error) {
    console.warn('[notifications] clear failed:', error.message);
  }
}

/** Remove one inbox message (swipe-to-delete). */
export async function removeVolunteerNotification(id: string): Promise<void> {
  const existed = notifications.some((item) => item.id === id);
  if (!existed) {
    return;
  }

  notifications = notifications.filter((item) => item.id !== id);
  if (pinnedById[id]) {
    delete pinnedById[id];
    void persistPinnedMap();
  }
  emit();

  if (!supabase || isSampleNotificationId(id)) {
    return;
  }

  const { error } = await supabase.from('volunteer_notifications').delete().eq('id', id);
  if (error) {
    console.warn('[notifications] delete one failed:', error.message);
  }
}

/** Pin or unpin a message (local device only). */
export async function togglePinVolunteerNotification(id: string): Promise<void> {
  const existing = notifications.find((item) => item.id === id);
  if (!existing) {
    return;
  }

  if (pinnedById[id]) {
    delete pinnedById[id];
  } else {
    pinnedById[id] = new Date().toISOString();
  }

  notifications = sortInbox(notifications.map((item) => withPinnedState(item)));
  emit();
  await persistPinnedMap();
}

export function getVolunteerNotifications(): VolunteerNotification[] {
  return notifications;
}

export function getUnreadNotificationCount(): number {
  return unreadCountFrom(notifications);
}

export function subscribeVolunteerNotifications(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useVolunteerNotifications(): VolunteerNotification[] {
  return useSyncExternalStore(
    subscribeVolunteerNotifications,
    getVolunteerNotifications,
    getVolunteerNotifications,
  );
}

export function useUnreadNotificationCount(): number {
  return useSyncExternalStore(
    subscribeVolunteerNotifications,
    getUnreadNotificationCount,
    getUnreadNotificationCount,
  );
}

/** Clears inbox memory and the device flag so the next volunteer gets a fresh inbox. */
export function resetVolunteerNotifications() {
  stopVolunteerNotificationsRealtime();
  notifications = [];
  pinnedById = {};
  inboxClearedByUser = false;
  emit();
  void AsyncStorage.removeItem(CLEARED_STORAGE_KEY);
  void AsyncStorage.removeItem(PINNED_STORAGE_KEY);
}
