import { Platform } from 'react-native';

import { isExpoGoClient } from '@/utils/isExpoGoClient';

/** Minimum seconds between Live Activity pushes while a session runs. */
const LIVE_ACTIVITY_UPDATE_INTERVAL_MS = 30_000;

type LiveActivityHandle = {
  update: (state: Record<string, number | boolean>) => void;
  end: (state: Record<string, boolean>) => void;
};

export type LiveActivitySessionState = {
  startedAt: number;
  distanceMiles: number;
  checkpointWindowStartedAt: number | null;
  photosEnabled: boolean;
  checkpointDueOrGrace: boolean;
};

let activityHandle: LiveActivityHandle | null = null;
let lastPushMs = 0;
let lastDistanceTenth = -1;
let lastCheckpointDueOrGrace: boolean | null = null;

function loadActivityKit():
  | typeof import('@kingstinct/react-native-activity-kit').ActivityKit
  | null {
  if (Platform.OS !== 'ios' || isExpoGoClient()) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ActivityKit } = require('@kingstinct/react-native-activity-kit') as {
      ActivityKit: typeof import('@kingstinct/react-native-activity-kit').ActivityKit;
    };
    return ActivityKit.isAvailable ? ActivityKit : null;
  } catch {
    return null;
  }
}

function distanceTenth(miles: number): number {
  return Math.floor(miles * 10);
}

function serializeLiveActivityState(state: LiveActivitySessionState): Record<string, number | boolean> {
  const payload: Record<string, number | boolean> = {
    startedAt: state.startedAt,
    distanceMiles: Math.max(0, state.distanceMiles),
    photosEnabled: state.photosEnabled,
    checkpointDueOrGrace: state.checkpointDueOrGrace,
  };

  if (state.checkpointWindowStartedAt != null) {
    payload.checkpointWindowStartedAt = state.checkpointWindowStartedAt;
  }

  return payload;
}

function pushLiveActivityUpdate(state: LiveActivitySessionState, options?: { force?: boolean }): void {
  if (!activityHandle) {
    return;
  }

  const now = Date.now();
  const tenth = distanceTenth(state.distanceMiles);
  const crossedTenth = tenth !== lastDistanceTenth;
  const dueStateChanged = lastCheckpointDueOrGrace !== state.checkpointDueOrGrace;
  const intervalElapsed = now - lastPushMs >= LIVE_ACTIVITY_UPDATE_INTERVAL_MS;

  if (!options?.force && !crossedTenth && !dueStateChanged && !intervalElapsed) {
    return;
  }

  try {
    activityHandle.update(serializeLiveActivityState(state));
    lastPushMs = now;
    lastDistanceTenth = tenth;
    lastCheckpointDueOrGrace = state.checkpointDueOrGrace;
  } catch (error) {
    console.warn('[liveActivity] update failed:', error);
  }
}

/** Start the iOS Lock Screen / Dynamic Island live session widget. No-op on Android / Expo Go. */
export function startLiveSessionLiveActivity(state: LiveActivitySessionState): void {
  const ActivityKit = loadActivityKit();
  if (!ActivityKit) {
    return;
  }

  endLiveSessionLiveActivity();

  try {
    activityHandle = ActivityKit.startActivity(
      { name: 'Clean Up Give Back session' },
      serializeLiveActivityState(state),
      {
        relevanceScore: 1,
        staleDate: new Date(state.startedAt + 12 * 60 * 60 * 1000),
      },
    ) as LiveActivityHandle;
    lastPushMs = Date.now();
    lastDistanceTenth = distanceTenth(state.distanceMiles);
    lastCheckpointDueOrGrace = state.checkpointDueOrGrace;
  } catch (error) {
    console.warn('[liveActivity] start failed:', error);
    activityHandle = null;
  }
}

/** Throttled refresh for distance + checkpoint due state on the lock-screen widget. */
export function maybeUpdateLiveSessionLiveActivity(state: LiveActivitySessionState): void {
  pushLiveActivityUpdate(state);
}

/** Immediate checkpoint-window reset push (new countdown anchor). */
export function syncLiveSessionLiveActivityCheckpoint(state: LiveActivitySessionState): void {
  pushLiveActivityUpdate(state, { force: true });
}

/** Dismiss the lock-screen widget when the session ends. */
export function endLiveSessionLiveActivity(): void {
  if (!activityHandle) {
    lastDistanceTenth = -1;
    lastPushMs = 0;
    lastCheckpointDueOrGrace = null;
    return;
  }

  try {
    activityHandle.end({ completed: true });
  } catch (error) {
    console.warn('[liveActivity] end failed:', error);
  }

  activityHandle = null;
  lastDistanceTenth = -1;
  lastPushMs = 0;
  lastCheckpointDueOrGrace = null;
}
