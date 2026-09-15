/**
 * Mock data for the Session Tracking feature preview. No `expo-location` /
 * `expo-camera` in this pass — every value here is static or driven by a
 * local fake timer. See tokens.ts for design values.
 */

export type CourtOrderedStatus = 'yes' | 'no';

export type CheckpointState = 'due' | 'submitted' | 'missed';

export type Checkpoint = {
  id: string;
  dueAtLabel: string;
  submittedAtLabel?: string;
  state: CheckpointState;
};

export type MockSession = {
  title: string;
  dateLabel: string;
  courtOrdered: CourtOrderedStatus;
  description: string;
  signatureComplete: boolean;
  distanceMiles: number;
  photosSubmitted: number;
  checkpoints: Checkpoint[];
  startTimeLabel: string;
  endTimeLabel: string;
  elapsedSeconds: number;
  photoCheckpointIntervalSeconds: number;
};

export const mockSession: MockSession = {
  title: 'River Trail Cleanup',
  dateLabel: 'Jun 3, 2026',
  courtOrdered: 'no',
  description:
    'Focused on the north bend of the river trail. Collected mostly plastic debris caught in the brush near the waterline.',
  signatureComplete: true,
  distanceMiles: 1.2,
  photosSubmitted: 1,
  checkpoints: [
    { id: 'checkpoint-1', dueAtLabel: '9:30 AM', submittedAtLabel: '9:30 AM', state: 'submitted' },
    { id: 'checkpoint-2', dueAtLabel: '10:00 AM', submittedAtLabel: '10:00 AM', state: 'submitted' },
    { id: 'checkpoint-3', dueAtLabel: '10:30 AM', state: 'due' },
  ],
  startTimeLabel: '9:30 AM',
  endTimeLabel: '10:54 AM',
  elapsedSeconds: 42 * 60 + 18,
  photoCheckpointIntervalSeconds: 30 * 60,
};

export const mockReviewedSession = {
  ...mockSession,
  durationLabel: '1h 24m',
  photosSubmittedTotal: 3,
  distanceMilesTracked: 1.8,
};

/**
 * Mocked walking-path polyline near the Des Plaines River Trail, IL —
 * matches the "River Trail Cleanup" mock session title. [longitude, latitude].
 * Static reference only — no live GPS in this pass.
 */
export const mockRouteCoordinates: Array<[number, number]> = [
  [-87.8845, 42.031],
  [-87.883, 42.0328],
  [-87.8809, 42.0339],
  [-87.8784, 42.0335],
  [-87.8765, 42.0347],
  [-87.8749, 42.0361],
];

export const mockRouteStart = mockRouteCoordinates[0];
export const mockRouteCurrent = mockRouteCoordinates[mockRouteCoordinates.length - 1];
export const mockRouteCenter: [number, number] = [-87.8797, 42.0339];

/** Formats a seconds count as `HH:MM:SS` for the live-session timer. */
export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Formats a seconds count as `MM:SS` for the "next photo due in" countdown. */
export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = Math.floor(clamped % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
