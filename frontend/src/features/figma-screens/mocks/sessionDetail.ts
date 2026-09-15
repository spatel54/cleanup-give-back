import type { ImageSource } from 'expo-image';

import { getCachedCompletedSession } from '@/features/session-tracking/completedSessionCache';
import type { CompletedSessionSnapshot } from '@/features/session-tracking/liveSessionStore';
import {
  formatSessionDateLabel,
  formatSessionHoursStatValue,
  formatSessionTimeRange,
  resolveSessionDurationSeconds,
} from '@/features/session-tracking/utils/sessionFormat';
import type { RouteCoordinate } from '@/features/session-tracking/utils/geo';
import { DEFAULT_MAP_LAYER, type MapLayerType } from '@/features/session-tracking/utils/mapStyles';

import { mockSessionsList, type SessionApprovalStatus } from './sessions';

/**
 * Photo evidence entry shape for session detail.
 */
export type SessionEvidencePhoto = {
  id: string;
  source: ImageSource | { uri: string };
  caption?: string;
  /** Epoch ms when the checkpoint was captured — drives full-screen viewer timestamp. */
  capturedAt?: number;
};

export type SessionDetailData = {
  id: string;
  title: string;
  status: SessionApprovalStatus;
  dateTimeLabel: string;
  locationAddress: string;
  /** Session setup description (read-only on detail). */
  description: string;
  hoursLabel: string;
  hoursUnitLabel: 'HOURS' | 'MINUTES';
  milesLabel: string;
  photosCountLabel: string;
  routeCoordinates: RouteCoordinate[];
  evidencePhotos: SessionEvidencePhoto[];
  /** Basemap layer the user had selected when the session ended. */
  mapLayer: MapLayerType;
  /** Volunteer-facing decline reason from admin review (when status is declined). */
  declineReason?: string | null;
};

/** Figma `session_detail` (node `515:1848`) — default Downtown Riverfront mock. */
const DEFAULT_DETAIL: SessionDetailData = {
  id: 'downtown-riverfront',
  title: 'Downtown Riverfront Clean-up',
  status: 'approved',
  dateTimeLabel: 'July 15 at 5PM',
  locationAddress: '100 Sample St, Example City, IL, 00000',
  description: 'Cleaned litter along the riverfront trail and surrounding park area.',
  hoursLabel: '2.5',
  hoursUnitLabel: 'HOURS',
  milesLabel: '3.4',
  photosCountLabel: '4',
  routeCoordinates: [],
  evidencePhotos: [],
  mapLayer: DEFAULT_MAP_LAYER,
};
const EMPTY_LOCATION = '-';

export function emptySessionDetail(id = ''): SessionDetailData {
  return {
    id,
    title: 'Session',
    status: 'pending',
    dateTimeLabel: '-',
    locationAddress: EMPTY_LOCATION,
    description: '',
    hoursLabel: '0',
    hoursUnitLabel: 'MINUTES',
    milesLabel: '0.0',
    photosCountLabel: '0',
    routeCoordinates: [],
    evidencePhotos: [],
    mapLayer: DEFAULT_MAP_LAYER,
  };
}

function statusLabel(status: SessionApprovalStatus): string {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'pending':
      return 'Under Review';
    case 'declined':
      return 'Declined';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function sessionStatusBadgeLabel(status: SessionApprovalStatus): string {
  return statusLabel(status);
}

export function detailFromCompletedSnapshot(
  snapshot: CompletedSessionSnapshot,
  id: string,
): SessionDetailData {
  const durationSeconds = resolveSessionDurationSeconds({
    startedAt: snapshot.startedAt,
    endedAt: snapshot.endedAt,
    elapsedSeconds: snapshot.elapsedSeconds,
  });

  const evidencePhotos: SessionEvidencePhoto[] = snapshot.submittedCheckpoints.flatMap(
    (checkpoint) => {
      const photos: SessionEvidencePhoto[] = [];
      if (checkpoint.selfieUri) {
        photos.push({
          id: `${checkpoint.id}-selfie`,
          source: { uri: checkpoint.selfieUri },
          caption: 'Selfie',
          capturedAt: checkpoint.capturedAt,
        });
      }
      if (checkpoint.progressUri) {
        photos.push({
          id: `${checkpoint.id}-progress`,
          source: { uri: checkpoint.progressUri },
          caption: 'Progress',
          capturedAt: checkpoint.capturedAt,
        });
      }
      return photos;
    },
  );

  const hoursStat = formatSessionHoursStatValue(durationSeconds);

  return {
    id,
    title: snapshot.setup.activity,
    status: 'pending',
    dateTimeLabel: `${formatSessionDateLabel(snapshot.startedAt)} · ${formatSessionTimeRange(snapshot.startedAt, snapshot.endedAt)}`,
    locationAddress: snapshot.setup.description?.trim() || EMPTY_LOCATION,
    description: snapshot.setup.description?.trim() || '',
    hoursLabel: hoursStat.value,
    hoursUnitLabel: hoursStat.unitLabel,
    milesLabel: snapshot.distanceMiles.toFixed(1),
    photosCountLabel: String(evidencePhotos.length),
    routeCoordinates: snapshot.routeCoordinates,
    evidencePhotos,
    mapLayer: snapshot.mapLayer ?? DEFAULT_MAP_LAYER,
  };
}

function detailFromMockListItem(id: string): SessionDetailData | null {
  const listItem = mockSessionsList.find((session) => session.id === id);
  if (!listItem) {
    return null;
  }

  const declineReason =
    listItem.status === 'declined'
      ? 'Photos submitted do not clearly show cleanup activity.'
      : null;

  return {
    ...DEFAULT_DETAIL,
    id: listItem.id,
    title: listItem.title,
    status: listItem.status,
    dateTimeLabel: `${listItem.dateLabel} · ${listItem.timeLabel}`,
    declineReason,
  };
}

/**
 * Resolves session detail from completed-session cache, mock list fallback, or
 * static default/empty shapes.
 */
export function getSessionDetail(id?: string): SessionDetailData {
  if (id) {
    const cached = getCachedCompletedSession(id);
    if (cached) {
      return detailFromCompletedSnapshot(cached, id);
    }

    const mockDetail = detailFromMockListItem(id);
    if (mockDetail) {
      return mockDetail;
    }
  }

  if (!id) {
    return DEFAULT_DETAIL;
  }

  return emptySessionDetail(id);
}
