import { isEligibleForSessionPhotos, isUnderMinimumAge, SESSION_PHOTO_MIN_AGE } from '@/constants/ageGate';

function birthdayYearsAgo(years: number, extraMonths = 0): Date {
  const now = new Date();
  return new Date(now.getFullYear() - years, now.getMonth() - extraMonths, 1);
}

describe('ageGate', () => {
  it('blocks COPPA ages under 13', () => {
    expect(isUnderMinimumAge(birthdayYearsAgo(12))).toBe(true);
    expect(isUnderMinimumAge(birthdayYearsAgo(13))).toBe(false);
  });

  it('disables session photos for 13–17 and allows 18+', () => {
    expect(isEligibleForSessionPhotos(birthdayYearsAgo(17))).toBe(false);
    expect(isEligibleForSessionPhotos(birthdayYearsAgo(SESSION_PHOTO_MIN_AGE))).toBe(true);
    expect(isEligibleForSessionPhotos(birthdayYearsAgo(21))).toBe(true);
  });

  it('keeps photos on when birthday is unknown', () => {
    expect(isEligibleForSessionPhotos(null)).toBe(true);
    expect(isEligibleForSessionPhotos(undefined)).toBe(true);
  });
});
