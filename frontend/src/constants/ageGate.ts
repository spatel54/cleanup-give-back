import { getBirthday } from '@/features/onboarding/onboardingStore';

/** COPPA minimum age — users must be at least 13 (under 13 is blocked). */
export const MINIMUM_APP_AGE = 13;

/** Session selfie / progress photos — 18+ only. */
export const SESSION_PHOTO_MIN_AGE = 18;

export function ageFromBirthday(birthday: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthday.getFullYear();
  const monthDiff = now.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthday.getDate())) {
    age -= 1;
  }
  return age;
}

export function isUnderMinimumAge(birthday: Date): boolean {
  return ageFromBirthday(birthday) < MINIMUM_APP_AGE;
}

/**
 * Checkpoint camera is for adults. A missing birthday (legacy accounts)
 * stays eligible so we do not lock existing 18+ testers out of photos.
 */
export function isEligibleForSessionPhotos(birthday: Date | null | undefined): boolean {
  if (!birthday) {
    return true;
  }
  return ageFromBirthday(birthday) >= SESSION_PHOTO_MIN_AGE;
}

export function canUseSessionPhotos(): boolean {
  return isEligibleForSessionPhotos(getBirthday());
}
