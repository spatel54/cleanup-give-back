export const PHOTO_CHECKPOINT_INTERVAL_SECONDS = 30 * 60;

/** Grace after a missed checkpoint before it's recorded as missed for the session's record. */
export const CHECKPOINT_MISS_GRACE_MS = 10 * 60 * 1000;

/** Start pair + end pair (selfie + progress each). Mid-session checkpoints may add more. */
export const MIN_SUBMITTED_SESSION_PHOTOS = 4;
