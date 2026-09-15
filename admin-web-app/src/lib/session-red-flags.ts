/**
 * Implements `docs/agents/session-abuse-checklist.md`'s "Quick red-flag bundle" as a
 * pure function over data already surfaced in the session drawer. Advisory only - the
 * checklist explicitly warns "One red flag ≠ decline," so this returns a list of
 * triggered reasons for a tooltip, never a single verdict.
 */
import type { PlausibilitySignal, SessionPhotoPin } from '@/lib/session-evidence';
import type { VolunteerActivityPattern } from '@/lib/live-data';

export type RedFlagScope = 'session' | 'volunteer';

export type RedFlag = {
  key: string;
  label: string;
  /** One-sentence why this fired, in admin-facing language. */
  explanation: string;
  /** Where to look next in the drawer or volunteer profile. */
  lookAt: string;
  scope: RedFlagScope;
};

/** Off-route pins beyond this distance are treated as a mismatch worth flagging. */
const OFF_ROUTE_METERS_THRESHOLD = 150;

/** Sessions this long with fewer than 2 checkpoint photos look thin on evidence. */
const LOW_PHOTO_COUNT_DURATION_SECONDS = 1800;
const LOW_PHOTO_COUNT_THRESHOLD = 2;

const WALKING_CLEANUP_MPH = 4;

export function metersPerSecondToMph(mps: number): string {
  return (mps * 2.2369362921).toFixed(1);
}

export function computeRedFlags(params: {
  durationSeconds: number | null;
  checkpointCount: number;
  photoPins: Pick<SessionPhotoPin, 'fromGps' | 'offRouteMeters'>[];
  plausibilitySignal: PlausibilitySignal | null;
  volunteerPattern: VolunteerActivityPattern | null;
}): RedFlag[] {
  const { durationSeconds, checkpointCount, photoPins, plausibilitySignal, volunteerPattern } = params;
  const flags: RedFlag[] = [];

  if (
    durationSeconds != null &&
    durationSeconds >= LOW_PHOTO_COUNT_DURATION_SECONDS &&
    checkpointCount < LOW_PHOTO_COUNT_THRESHOLD
  ) {
    flags.push({
      key: 'low-photo-count',
      scope: 'session',
      label: `${Math.round(durationSeconds / 60)} min session with only ${checkpointCount} checkpoint${checkpointCount === 1 ? '' : 's'}`,
      explanation:
        'This cleanup ran a long time but submitted fewer than two checkpoint photos. Check whether the photos cover the whole session.',
      lookAt: 'Photos in this drawer',
    });
  }

  if (plausibilitySignal?.exceedsPlausibleSpeed) {
    const avgMph = metersPerSecondToMph(plausibilitySignal.avgSpeedMps);
    const maxMph = metersPerSecondToMph(plausibilitySignal.maxSpeedMps);
    flags.push({
      key: 'exceeds-speed',
      scope: 'session',
      label: 'Route implies faster-than-walking speed',
      explanation: `Average pace ${avgMph} mph, peak ${maxMph} mph. A walking cleanup is usually under ${WALKING_CLEANUP_MPH} mph.`,
      lookAt: 'Walking path - long straight stretches can mean the phone was in a car',
    });
  }
  if (plausibilitySignal?.tightLoop) {
    flags.push({
      key: 'tight-loop',
      scope: 'session',
      label: 'High distance claimed but route never leaves a small area',
      explanation:
        'The miles look real, but the path stays in a tiny area. That can be looping a parking lot or driveway instead of a cleanup walk.',
      lookAt: 'Walking path shape on the map',
    });
  }
  if (plausibilitySignal?.idleHighDuration) {
    flags.push({
      key: 'idle-high-duration',
      scope: 'session',
      label: 'Long duration with almost no movement',
      explanation:
        'The clock ran a long time but the phone barely moved. Could be sitting still with the session left on.',
      lookAt: 'Walking path and session duration',
    });
  }

  const offRoutePins = photoPins.filter((p) => p.fromGps && p.offRouteMeters > OFF_ROUTE_METERS_THRESHOLD);
  if (offRoutePins.length > 0) {
    flags.push({
      key: 'off-route-checkpoints',
      scope: 'session',
      label: `${offRoutePins.length} checkpoint photo${offRoutePins.length === 1 ? '' : 's'} captured off the route`,
      explanation:
        'Photo GPS does not match the walking path. The volunteer may have taken the photo somewhere else, or GPS drifted.',
      lookAt: 'Photo pins on the walking path',
    });
  }

  if (volunteerPattern?.nearDeadlineVolumeSpike) {
    flags.push({
      key: 'near-deadline-spike',
      scope: 'volunteer',
      label: 'Multiple sessions clustered near the court due date',
      explanation:
        'This volunteer logged several sessions in the two weeks before their court due date. Look at whether the work looks rushed or padded.',
      lookAt: 'Volunteer profile session history',
    });
  }

  if (volunteerPattern) {
    const { invalidSessionsLast30Days, deleteCount } = volunteerPattern;
    // Split these: bundling "0 invalid, 12 deleted" looked like two reasons when
    // only deletes actually crossed the threshold.
    if (invalidSessionsLast30Days >= 2) {
      flags.push({
        key: 'invalid-pattern',
        scope: 'volunteer',
        label: `${invalidSessionsLast30Days} invalid session${invalidSessionsLast30Days === 1 ? '' : 's'} in the last 30 days`,
        explanation:
          'Invalid usually means missed checkpoints, not a fraud verdict. A cluster of them is worth checking on their profile.',
        lookAt: 'Volunteer profile - Activity Pattern',
      });
    }
    if (deleteCount >= 2) {
      flags.push({
        key: 'delete-pattern',
        scope: 'volunteer',
        label: `${deleteCount} session${deleteCount === 1 ? '' : 's'} deleted (all-time)`,
        explanation:
          'Volunteers can delete under-review sessions and try again. Repeated deletes can be a retry-until-it-looks-clean pattern.',
        lookAt: 'Volunteer profile - Activity Pattern and session history',
      });
    }
  }

  return flags;
}
