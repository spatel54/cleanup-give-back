import { useEffect, useState } from 'react';

import type { SessionDetailData } from '@/features/figma-screens/mocks/sessionDetail';
import {
  detailFromCompletedSnapshot,
  emptySessionDetail,
} from '@/features/figma-screens/mocks/sessionDetail';
import { mapApiStatusToApproval } from '@/lib/mapApiSessions';
import { isApiConfigured } from '@/lib/api';
import { getSession } from '@/lib/sessionsApi';
import { createSignedStorageUrls } from '@/lib/signedStorageUrl';

import { getCachedCompletedSession } from '../completedSessionCache';
import { toRouteCoordinates } from '../utils/geo';
import { DEFAULT_MAP_LAYER } from '../utils/mapStyles';
import {
  formatSessionDateLabel,
  formatSessionHoursStatValue,
  formatSessionTimeRange,
  resolveSessionDurationSeconds,
} from '../utils/sessionFormat';

type SessionDetailState = {
  detail: SessionDetailData;
  loading: boolean;
  error: string | null;
};

function formatDateTimeLabel(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt) {
    return '-';
  }

  const startedMs = new Date(startedAt).getTime();
  const endedMs = endedAt ? new Date(endedAt).getTime() : startedMs;
  return `${formatSessionDateLabel(startedMs)} · ${formatSessionTimeRange(startedMs, endedMs)}`;
}

export function useSessionDetail(sessionId?: string): SessionDetailState {
  const [state, setState] = useState<SessionDetailState>(() => {
    if (sessionId) {
      const cached = getCachedCompletedSession(sessionId);
      if (cached) {
        return {
          detail: detailFromCompletedSnapshot(cached, sessionId),
          loading: false,
          error: null,
        };
      }
    }

    return {
      detail: emptySessionDetail(sessionId),
      loading: Boolean(sessionId && isApiConfigured),
      error: sessionId && !isApiConfigured ? 'Unable to load session details.' : null,
    };
  });

  useEffect(() => {
    if (!sessionId) {
      setState({
        detail: emptySessionDetail(),
        loading: false,
        error: null,
      });
      return;
    }

    const cached = getCachedCompletedSession(sessionId);
    if (cached) {
      setState({
        detail: detailFromCompletedSnapshot(cached, sessionId),
        loading: false,
        error: null,
      });
      return;
    }

    if (!isApiConfigured) {
      setState({
        detail: emptySessionDetail(sessionId),
        loading: false,
        error: 'Unable to load session details.',
      });
      return;
    }

    let cancelled = false;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    void (async () => {
      try {
        const data = await getSession(sessionId);
        if (cancelled) {
          return;
        }

        if (!data) {
          setState({
            detail: emptySessionDetail(sessionId),
            loading: false,
            error: 'Session not found.',
          });
          return;
        }

        const { session, checkpoints } = data;
        const durationSeconds =
          session.durationSeconds ??
          (session.startedAt && session.endedAt
            ? resolveSessionDurationSeconds({
                startedAt: new Date(session.startedAt).getTime(),
                endedAt: new Date(session.endedAt).getTime(),
              })
            : 0);

        const storagePaths = checkpoints.flatMap((checkpoint) =>
          [checkpoint.selfiePath, checkpoint.progressPath].filter(
            (path): path is string => Boolean(path),
          ),
        );
        const signedUrls = await createSignedStorageUrls(storagePaths);

        const evidencePhotos = checkpoints.flatMap((checkpoint) => {
          const photos: SessionDetailData['evidencePhotos'] = [];
          const selfieUrl = checkpoint.selfiePath
            ? signedUrls.get(checkpoint.selfiePath)
            : null;
          const progressUrl = checkpoint.progressPath
            ? signedUrls.get(checkpoint.progressPath)
            : null;

          const capturedAt = checkpoint.capturedAt
            ? new Date(checkpoint.capturedAt).getTime()
            : undefined;

          if (selfieUrl) {
            photos.push({
              id: `${checkpoint.id}-selfie`,
              source: { uri: selfieUrl },
              caption: 'Selfie',
              capturedAt,
            });
          }

          if (progressUrl) {
            photos.push({
              id: `${checkpoint.id}-progress`,
              source: { uri: progressUrl },
              caption: 'Progress',
              capturedAt,
            });
          }

          return photos;
        });

        const routeCoordinates = toRouteCoordinates(session.route);

        const hoursStat = formatSessionHoursStatValue(durationSeconds);

        setState({
          detail: {
            id: session.id,
            title: session.activity ?? 'Cleanup Session',
            status: mapApiStatusToApproval(session.status),
            dateTimeLabel: formatDateTimeLabel(session.startedAt, session.endedAt),
            locationAddress: session.description?.trim() || '-',
            description: session.description?.trim() || '',
            hoursLabel: hoursStat.value,
            hoursUnitLabel: hoursStat.unitLabel,
            milesLabel:
              session.distanceMiles != null ? Number(session.distanceMiles).toFixed(1) : '0.0',
            photosCountLabel: String(evidencePhotos.length),
            routeCoordinates,
            evidencePhotos,
            // Fly API doesn't return a stored basemap layer; only the local
            // completed-session cache path (detailFromCompletedSnapshot) has one.
            mapLayer: DEFAULT_MAP_LAYER,
            declineReason: session.declineReason?.trim() || null,
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.warn('[sessions] detail fetch failed:', error);
        setState({
          detail: emptySessionDetail(sessionId),
          loading: false,
          error: 'Unable to load session details.',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return state;
}
