import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { ImpactFeedItem } from '@/features/figma-screens/mocks/home.types';
import { isApiConfigured } from '@/lib/api';
import { getSession, listSessions } from '@/lib/sessionsApi';
import { mapApiStatusToApproval } from '@/lib/mapApiSessions';
import { createSignedStorageUrls } from '@/lib/signedStorageUrl';

import type { CompletedSessionSnapshot } from './liveSessionStore';
import { isVolunteerSessionDeleted } from './volunteerDeletedSessions';
import {
  formatPhotoTimeLabel,
  formatRecentSessionDateLabel,
  formatRecentSessionDurationLabel,
  resolveSessionDurationSeconds,
} from './utils/sessionFormat';
import type { SessionStatRecord } from './utils/homeDashboardStats';
import {
  isRouteCoordinate,
  toRouteCoordinate,
  toRouteCoordinates,
  type RouteCoordinate,
} from './utils/geo';
import { collapseStationaryRoute } from './utils/routeFiltering';

const STORAGE_KEY = '@cugb/impactFeedLocal';
const MAX_FEED_ITEMS = 20;
const HYDRATE_SESSION_LIMIT = 10;
const ROUTE_PREVIEW_POINTS = 64;
const EMPTY_IMPACT_FEED: ImpactFeedItem[] = [];
const EMPTY_ROUTE: RouteCoordinate[] = [];

let localFeedItems: ImpactFeedItem[] = [];
let remoteFeedItems: ImpactFeedItem[] = [];
/** Cached snapshot for `useSyncExternalStore` — must keep a stable reference between notifies. */
let impactFeed: ImpactFeedItem[] = EMPTY_IMPACT_FEED;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function routePreviewsEqual(
  a: readonly [number, number][],
  b: readonly [number, number][],
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  if (a.length === 0) {
    return true;
  }

  const firstA = a[0];
  const firstB = b[0];
  const lastA = a[a.length - 1];
  const lastB = b[b.length - 1];
  return (
    firstA[0] === firstB[0] &&
    firstA[1] === firstB[1] &&
    lastA[0] === lastB[0] &&
    lastA[1] === lastB[1]
  );
}

function mapAnchorsEqual(
  a: ImpactFeedItem['mapAnchor'],
  b: ImpactFeedItem['mapAnchor'],
): boolean {
  if (a == null || b == null) {
    return a == null && b == null;
  }
  return a[0] === b[0] && a[1] === b[1];
}

function toMapAnchor(
  longitude: number | null | undefined,
  latitude: number | null | undefined,
): RouteCoordinate | null {
  if (
    typeof longitude !== 'number' ||
    typeof latitude !== 'number' ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }
  return toRouteCoordinate(longitude, latitude);
}

function lastRouteAnchor(route: readonly RouteCoordinate[]): RouteCoordinate | null {
  return route.length > 0 ? route[route.length - 1] : null;
}

function latestCheckpointAnchor(
  checkpoints: readonly { latitude?: number | null; longitude?: number | null }[],
): RouteCoordinate | null {
  for (let index = checkpoints.length - 1; index >= 0; index -= 1) {
    const checkpoint = checkpoints[index];
    const anchor = toMapAnchor(checkpoint.longitude, checkpoint.latitude);
    if (anchor) {
      return anchor;
    }
  }
  return null;
}

function resolveMapAnchor(
  route: readonly RouteCoordinate[],
  ownCheckpoint?: { latitude?: number | null; longitude?: number | null },
  checkpoints: readonly { latitude?: number | null; longitude?: number | null }[] = [],
): RouteCoordinate | null {
  return (
    lastRouteAnchor(route) ??
    toMapAnchor(ownCheckpoint?.longitude, ownCheckpoint?.latitude) ??
    latestCheckpointAnchor(checkpoints)
  );
}

function preferFeedItem(existing: ImpactFeedItem, incoming: ImpactFeedItem): ImpactFeedItem {
  const existingHasAnchor = existing.mapAnchor != null;
  const incomingHasAnchor = incoming.mapAnchor != null;
  if (existingHasAnchor !== incomingHasAnchor) {
    return existingHasAnchor ? existing : incoming;
  }
  if (incoming.routePreview.length !== existing.routePreview.length) {
    return incoming.routePreview.length > existing.routePreview.length ? incoming : existing;
  }
  return incoming;
}

function feedItemsEqual(a: readonly ImpactFeedItem[], b: readonly ImpactFeedItem[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];
    if (
      left.id !== right.id ||
      left.sessionId !== right.sessionId ||
      left.imageUri !== right.imageUri ||
      left.sessionTitle !== right.sessionTitle ||
      left.dateLabel !== right.dateLabel ||
      left.timeLabel !== right.timeLabel ||
      left.durationLabel !== right.durationLabel ||
      left.capturedAtMs !== right.capturedAtMs ||
      left.status !== right.status ||
      !routePreviewsEqual(left.routePreview, right.routePreview) ||
      !mapAnchorsEqual(left.mapAnchor, right.mapAnchor)
    ) {
      return false;
    }
  }

  return true;
}

function simplifyRoutePreview(coordinates: readonly RouteCoordinate[]): RouteCoordinate[] {
  if (coordinates.length < 2) {
    return EMPTY_ROUTE;
  }

  if (coordinates.length <= ROUTE_PREVIEW_POINTS) {
    return [...coordinates];
  }

  const step = (coordinates.length - 1) / (ROUTE_PREVIEW_POINTS - 1);
  const preview: RouteCoordinate[] = [];
  for (let index = 0; index < ROUTE_PREVIEW_POINTS; index += 1) {
    const sourceIndex = Math.round(index * step);
    preview.push(coordinates[sourceIndex]);
  }
  return preview;
}

/** Matches session-detail map collapse so jitter-only paths don't draw in feed tiles. */
function buildRoutePreview(
  coordinates: readonly RouteCoordinate[],
  distanceMiles?: number | null,
): RouteCoordinate[] {
  const collapsed = collapseStationaryRoute(
    coordinates.length > 0 ? [...coordinates] : [],
    { distanceMiles },
  );
  const simplified = simplifyRoutePreview(collapsed);

  // When the route collapsed to a single GPS anchor (stationary/short session),
  // preserve that point so the map card centers on the actual location instead
  // of falling back to the US default center.
  if (simplified.length === 0 && collapsed.length > 0) {
    return collapsed.slice(0, 1);
  }

  return simplified;
}

function normalizeStoredFeedItem(value: unknown): ImpactFeedItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<ImpactFeedItem>;
  if (
    typeof item.id !== 'string' ||
    typeof item.sessionId !== 'string' ||
    typeof item.imageUri !== 'string' ||
    typeof item.sessionTitle !== 'string' ||
    typeof item.dateLabel !== 'string' ||
    typeof item.capturedAtMs !== 'number'
  ) {
    return null;
  }

  const routePreview = Array.isArray(item.routePreview)
    ? buildRoutePreview((item.routePreview as unknown[]).filter(isRouteCoordinate))
    : EMPTY_ROUTE;
  const storedAnchor = isRouteCoordinate(item.mapAnchor)
    ? toRouteCoordinate(item.mapAnchor[0], item.mapAnchor[1])
    : null;

  return {
    id: item.id,
    sessionId: item.sessionId,
    imageUri: item.imageUri,
    sessionTitle: item.sessionTitle,
    dateLabel: item.dateLabel,
    timeLabel:
      typeof item.timeLabel === 'string' && item.timeLabel
        ? item.timeLabel
        : formatPhotoTimeLabel(item.capturedAtMs),
    durationLabel: typeof item.durationLabel === 'string' ? item.durationLabel : '',
    capturedAtMs: item.capturedAtMs,
    status: item.status === 'approved' ? 'approved' : 'pending',
    routePreview,
    mapAnchor: storedAnchor ?? lastRouteAnchor(routePreview),
  };
}

function mergeFeedItems(items: ImpactFeedItem[]): ImpactFeedItem[] {
  const byId = new Map<string, ImpactFeedItem>();
  for (const item of items) {
    const existing = byId.get(item.id);
    byId.set(item.id, existing ? preferFeedItem(existing, item) : item);
  }
  return [...byId.values()]
    .sort((a, b) => b.capturedAtMs - a.capturedAtMs)
    .slice(0, MAX_FEED_ITEMS);
}

function recomputeImpactFeed(): boolean {
  const next = mergeFeedItems([...localFeedItems, ...remoteFeedItems]);
  if (feedItemsEqual(next, impactFeed)) {
    return false;
  }

  impactFeed = next.length > 0 ? next : EMPTY_IMPACT_FEED;
  return true;
}

function setLocalFeedItems(next: ImpactFeedItem[]) {
  const merged = mergeFeedItems(next);
  if (feedItemsEqual(merged, localFeedItems)) {
    return;
  }

  localFeedItems = merged;
  if (recomputeImpactFeed()) {
    notify();
  }
  void persistLocalImpactFeed();
}

function setRemoteFeedItems(next: ImpactFeedItem[]) {
  const merged = mergeFeedItems(next);
  if (feedItemsEqual(merged, remoteFeedItems)) {
    return;
  }

  remoteFeedItems = merged;
  if (recomputeImpactFeed()) {
    notify();
  }
}

async function persistLocalImpactFeed() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localFeedItems));
  } catch (error) {
    console.warn('[sessions] persist impact feed failed:', error);
  }
}

export function feedItemsFromSnapshot(snapshot: CompletedSessionSnapshot): ImpactFeedItem[] {
  const sessionId = snapshot.remoteSessionId ?? `session-${snapshot.endedAt}`;
  const sessionTitle = snapshot.setup.activity?.trim() || 'Cleanup Session';
  const dateLabel = formatRecentSessionDateLabel(snapshot.startedAt);
  const durationLabel = formatRecentSessionDurationLabel(
    snapshot.skipOrientation
      ? snapshot.elapsedSeconds
      : resolveSessionDurationSeconds({
          startedAt: snapshot.startedAt,
          endedAt: snapshot.endedAt,
          elapsedSeconds: snapshot.elapsedSeconds,
        }),
  );
  const routePreview = buildRoutePreview(snapshot.routeCoordinates, snapshot.distanceMiles);

  const checkpointsWithPhotos = snapshot.submittedCheckpoints.filter(
    (checkpoint) => checkpoint.progressUri,
  );
  const coverCheckpoint = checkpointsWithPhotos[checkpointsWithPhotos.length - 1];
  if (!coverCheckpoint?.progressUri) {
    return [];
  }

  return [
    {
      id: `${sessionId}-progress`,
      sessionId,
      imageUri: coverCheckpoint.progressUri,
      sessionTitle,
      dateLabel,
      timeLabel: formatPhotoTimeLabel(coverCheckpoint.capturedAt),
      durationLabel,
      capturedAtMs: coverCheckpoint.capturedAt,
      status: snapshot.skipOrientation ? 'approved' : 'pending',
      routePreview,
      mapAnchor: resolveMapAnchor(
        snapshot.routeCoordinates,
        coverCheckpoint,
        snapshot.submittedCheckpoints,
      ),
    },
  ];
}

/** Prepends progress photos from a completed session for the Home impact feed. */
export function recordImpactFeedFromSnapshot(snapshot: CompletedSessionSnapshot) {
  const incoming = feedItemsFromSnapshot(snapshot);
  if (incoming.length === 0) {
    return;
  }

  setLocalFeedItems(mergeFeedItems([...incoming, ...localFeedItems]));
}

export async function hydrateImpactFeedFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return;
    }

    localFeedItems = mergeFeedItems(
      parsed
        .map(normalizeStoredFeedItem)
        .filter((item): item is ImpactFeedItem => item != null),
    );
    if (recomputeImpactFeed()) {
      notify();
    }
  } catch (error) {
    console.warn('[sessions] hydrate impact feed from storage failed:', error);
  }
}

async function feedItemsFromApiSession(sessionId: string): Promise<ImpactFeedItem[]> {
  const data = await getSession(sessionId);
  if (!data) {
    return [];
  }

  if (mapApiStatusToApproval(data.session.status) === 'declined') {
    return [];
  }

  const sessionTitle = data.session.activity?.trim() || 'Cleanup Session';
  const startedMs = data.session.startedAt ? new Date(data.session.startedAt).getTime() : Date.now();
  const endedMs = data.session.endedAt ? new Date(data.session.endedAt).getTime() : startedMs;
  const dateLabel = formatRecentSessionDateLabel(startedMs);
  const durationLabel = formatRecentSessionDurationLabel(
    data.session.durationSeconds ??
      resolveSessionDurationSeconds({
        startedAt: startedMs,
        endedAt: endedMs,
      }),
  );
  const status = mapApiStatusToApproval(data.session.status);
  const routeCoordinates = toRouteCoordinates(data.session.route ?? []);
  const routePreview = buildRoutePreview(routeCoordinates, data.session.distanceMiles);

  const storagePaths = data.checkpoints
    .map((checkpoint) => checkpoint.progressPath)
    .filter((path): path is string => Boolean(path));
  const signedUrls = await createSignedStorageUrls(storagePaths);

  const checkpointsWithPhotos = data.checkpoints.filter((checkpoint) =>
    Boolean(checkpoint.progressPath && signedUrls.get(checkpoint.progressPath)),
  );
  const coverCheckpoint = checkpointsWithPhotos[checkpointsWithPhotos.length - 1];
  const imageUri = coverCheckpoint?.progressPath
    ? signedUrls.get(coverCheckpoint.progressPath)
    : undefined;
  if (!coverCheckpoint || !imageUri) {
    return [];
  }

  const capturedAtMs = coverCheckpoint.capturedAt
    ? new Date(coverCheckpoint.capturedAt).getTime()
    : startedMs;

  return [
    {
      id: `${sessionId}-progress`,
      sessionId,
      imageUri,
      sessionTitle,
      dateLabel,
      timeLabel: formatPhotoTimeLabel(capturedAtMs),
      durationLabel,
      capturedAtMs,
      status: status === 'approved' ? 'approved' : 'pending',
      routePreview,
      mapAnchor: resolveMapAnchor(routeCoordinates, coverCheckpoint, data.checkpoints),
    },
  ];
}

/** Loads recent remote checkpoint photos for the Home impact feed. */
export async function hydrateImpactFeedFromApi() {
  if (!isApiConfigured) {
    return;
  }

  try {
    const sessions = await listSessions();
    const sessionIds = sessions
      .filter((session) => session.status !== 'active')
      .filter((session) => !isVolunteerSessionDeleted(session.id))
      .filter((session) => mapApiStatusToApproval(session.status) !== 'declined')
      .slice(0, HYDRATE_SESSION_LIMIT)
      .map((session) => session.id);

    const batches = await Promise.all(sessionIds.map((sessionId) => feedItemsFromApiSession(sessionId)));
    setRemoteFeedItems(mergeFeedItems(batches.flat()));
  } catch (error) {
    console.warn('[sessions] hydrate impact feed failed:', error);
  }
}

/** Refreshes remote feed tiles when session stats are already in memory. */
export async function refreshImpactFeedFromSessionStats(stats: readonly SessionStatRecord[]) {
  if (!isApiConfigured) {
    return;
  }

  const sessionIds = stats
    .filter((stat) => stat.status !== 'declined')
    .sort((a, b) => b.startedAtMs - a.startedAtMs)
    .slice(0, HYDRATE_SESSION_LIMIT)
    .map((stat) => stat.id)
    .filter((id) => !id.startsWith('local-'));

  if (sessionIds.length === 0) {
    return;
  }

  try {
    const batches = await Promise.all(sessionIds.map((sessionId) => feedItemsFromApiSession(sessionId)));
    setRemoteFeedItems(mergeFeedItems(batches.flat()));
  } catch (error) {
    console.warn('[sessions] refresh impact feed failed:', error);
  }
}

export function getImpactFeed(): ImpactFeedItem[] {
  return impactFeed;
}

export function subscribeImpactFeed(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useImpactFeed() {
  return useSyncExternalStore(subscribeImpactFeed, getImpactFeed, getImpactFeed);
}

export function resetImpactFeed() {
  localFeedItems = [];
  remoteFeedItems = [];
  impactFeed = EMPTY_IMPACT_FEED;
  notify();
  void AsyncStorage.removeItem(STORAGE_KEY);
}

function feedIdsForSession(sessionId: string): Set<string> {
  const ids = new Set<string>([sessionId]);
  const localMatch = sessionId.match(/^session-(\d+)$/);
  if (localMatch) {
    ids.add(`local-${localMatch[1]}`);
  }
  return ids;
}

/** Removes feed tiles for a deleted session. */
export function removeImpactFeedForSession(sessionId: string) {
  const ids = feedIdsForSession(sessionId);
  localFeedItems = localFeedItems.filter((item) => !ids.has(item.sessionId));
  remoteFeedItems = remoteFeedItems.filter((item) => !ids.has(item.sessionId));
  if (recomputeImpactFeed()) {
    notify();
  }
  void persistLocalImpactFeed();
}
