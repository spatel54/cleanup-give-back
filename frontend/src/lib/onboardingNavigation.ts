import {
  getBirthday,
  getPhoneDigits,
  getServiceType,
} from '@/features/onboarding/onboardingStore';
import type { Href } from 'expo-router';

export const DEVICE_PERMISSIONS_HREF = '/device-permissions' as Href;

/** After How it works / tracker pay: one combined permissions screen. */
export function nextOnboardingAfterAccess(): Href {
  return DEVICE_PERMISSIONS_HREF;
}

/** Kept for hidden camera-permission screen internals. */
export function nextOnboardingAfterCamera(): '/location-permission' {
  return '/location-permission';
}

/** Kept for hidden location-permission screen internals. */
export function nextOnboardingAfterLocation(): '/notification-preference' {
  return '/notification-preference';
}

export function localOnboardingDetailsComplete(): boolean {
  return Boolean(getPhoneDigits() && getBirthday() && getServiceType());
}

/** Paid vs unpaid resume after details exist. Missing details use `resumeOnboardingHref`. */
export function incompleteOnboardingHref(trackerHasPaid: boolean): Href {
  if (!trackerHasPaid) {
    return '/how-it-works' as Href;
  }
  return DEVICE_PERMISSIONS_HREF;
}

/** Cold-start / Home redirect for a registered user who has not finished onboarding. */
export function resumeOnboardingHref(trackerHasPaid: boolean): Href {
  if (!localOnboardingDetailsComplete()) {
    return '/account-phone' as Href;
  }
  return incompleteOnboardingHref(trackerHasPaid);
}
