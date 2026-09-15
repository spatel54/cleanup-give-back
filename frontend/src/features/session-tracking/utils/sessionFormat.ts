export function formatPhotoTimeLabel(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
}

export function formatSessionDateLabel(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function formatSessionTimeRange(startedAt: number, endedAt: number): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${formatter.format(new Date(startedAt))} - ${formatter.format(new Date(endedAt))}`;
}

export function computeSessionDurationSeconds(startedAt: number, endedAt: number): number {
  return Math.max(0, Math.round((endedAt - startedAt) / 1000));
}

type SessionDurationInput = {
  startedAt?: number | null;
  endedAt?: number | null;
  elapsedSeconds?: number | null;
};

/** Wall-clock duration when timestamps exist; otherwise falls back to elapsedSeconds. */
export function resolveSessionDurationSeconds(input: SessionDurationInput): number {
  const { startedAt, endedAt, elapsedSeconds } = input;

  if (startedAt != null && endedAt != null) {
    return computeSessionDurationSeconds(startedAt, endedAt);
  }

  return Math.max(0, elapsedSeconds ?? 0);
}

export function formatDurationParts(elapsedSeconds: number): { hours: number; minutes: number } {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  return { hours, minutes };
}

/** Whole minutes from seconds (rounded). */
export function roundSecondsToMinutes(seconds: number): number {
  return Math.max(0, Math.round(seconds / 60));
}

/** Whole minutes from fractional hours (rounded). */
export function roundHoursToMinutes(hours: number): number {
  return Math.max(0, Math.round(hours * 60));
}

/** Compact service duration — e.g. `36 min`, `2.5 hrs`. */
export function formatServiceDurationCompactFromSeconds(seconds: number): string {
  if (seconds < 3600) {
    return `${roundSecondsToMinutes(seconds)} min`;
  }

  const hours = seconds / 3600;
  const rounded = Math.round(hours * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${display} hrs`;
}

/** Compact service duration from chart/lifetime hours — e.g. `36 min`, `2.0 hrs`. */
export function formatServiceDurationCompactFromHours(hours: number): string {
  if (hours <= 0) {
    return '0 min';
  }

  if (hours < 1) {
    return `${roundHoursToMinutes(hours)} min`;
  }

  const rounded = Math.round(hours * 10) / 10;
  return `${rounded.toFixed(1)} hrs`;
}

/** Sentence duration — e.g. `36 minutes`, `1 hour`. */
export function formatServiceDurationPhraseFromHours(hours: number): string {
  if (hours <= 0) {
    return '0 minutes';
  }

  if (hours < 1) {
    const minutes = roundHoursToMinutes(hours);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  const rounded = Math.round(hours * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  const unit = rounded === 1 ? 'hour' : 'hours';
  return `${display} ${unit}`;
}

/** Session detail stat — value + unit label for the HOURS/MINUTES card. */
export function formatSessionHoursStatValue(
  seconds: number,
): { value: string; unitLabel: 'HOURS' | 'MINUTES' } {
  if (seconds < 3600) {
    return { value: String(roundSecondsToMinutes(seconds)), unitLabel: 'MINUTES' };
  }

  return { value: (seconds / 3600).toFixed(1), unitLabel: 'HOURS' };
}

/** Submission detail — e.g. `5m`, `1h 24m`. Rounds up to 1m when >= 30s and < 60s. */
export function formatSessionDurationLabel(totalSeconds: number): string {
  const { hours, minutes } = formatDurationParts(totalSeconds);
  const remainderSeconds = totalSeconds % 60;
  const displayMinutes =
    hours === 0 && minutes === 0 && remainderSeconds >= 30 ? 1 : minutes;

  if (hours > 0 && displayMinutes > 0) {
    return `${hours}h ${displayMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${displayMinutes}m`;
}

export function getCheckpointLabel(index: number, total: number): string {
  if (total <= 1) {
    return 'Checkpoint Photo';
  }
  if (index === 0) {
    return 'Start Photo';
  }
  if (index === total - 1) {
    return 'End Photo';
  }
  return 'Midpoint Photo';
}

/** Live tracker copy — e.g. `2 photos submitted`. Empty when count is 0. */
export function formatSubmittedCheckpointCount(count: number): string {
  if (count <= 0) {
    return '';
  }

  return count === 1 ? '1 photo submitted' : `${count} photos submitted`;
}

type CheckpointPhotoLike = {
  selfieUri?: string | null;
  progressUri?: string | null;
};

/** Selfie + rear (progress) each count as one submitted photo. */
export function countSubmittedCheckpointPhotos(
  checkpoints: readonly CheckpointPhotoLike[],
): number {
  return checkpoints.reduce(
    (count, checkpoint) =>
      count + (checkpoint.selfieUri ? 1 : 0) + (checkpoint.progressUri ? 1 : 0),
    0,
  );
}

type CheckpointSubmissionLike = { submittedEarly: boolean };

/** Count of checkpoint photos taken before the 30-minute window expired. */
export function countEarlyCheckpointSubmissions(
  checkpoints: readonly CheckpointSubmissionLike[],
): number {
  return checkpoints.filter((checkpoint) => checkpoint.submittedEarly).length;
}

/** Show submission tally in the live checkpoint card only after at least one early submit. */
export function shouldShowCheckpointSubmissionCount(
  checkpoints: readonly CheckpointSubmissionLike[],
): boolean {
  return countEarlyCheckpointSubmissions(checkpoints) > 0;
}

/** 1-based ordinal for photo-submitted confirmation — `1st`, `2nd`, `3rd`, `4th`, … */
/** Home recent-sessions card — e.g. `Oct 24`. */
export function formatRecentSessionDateLabel(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

function formatRecentSessionClock(timestamp: number, includePeriod: boolean): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const clock = `${hour12}:${minutes.toString().padStart(2, '0')}`;
  return includePeriod ? `${clock} ${period}` : clock;
}

/** Home recent-sessions card — e.g. `9:00-11:00 AM`. */
export function formatRecentSessionTimeLabel(startedAt: number, endedAt: number): string {
  return `${formatRecentSessionClock(startedAt, false)}-${formatRecentSessionClock(endedAt, true)}`;
}

/** Home recent-sessions card — e.g. `36 min`, `2.5 hrs`. */
export function formatRecentSessionDurationLabel(elapsedSeconds: number): string {
  return formatServiceDurationCompactFromSeconds(elapsedSeconds);
}

export function formatCheckpointOrdinal(oneBasedIndex: number): string {
  const mod100 = oneBasedIndex % 100;
  const mod10 = oneBasedIndex % 10;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${oneBasedIndex}th`;
  }

  if (mod10 === 1) {
    return `${oneBasedIndex}st`;
  }

  if (mod10 === 2) {
    return `${oneBasedIndex}nd`;
  }

  if (mod10 === 3) {
    return `${oneBasedIndex}rd`;
  }

  return `${oneBasedIndex}th`;
}
