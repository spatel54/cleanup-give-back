import type { Session, User } from '@supabase/supabase-js';
import type { Href, ImperativeRouter as Router } from 'expo-router';

import { COUNTRIES, DEFAULT_COUNTRY } from '@/constants/countries';
import { SERVICE_TYPES, type ServiceType } from '@/constants/serviceTypes';
import {
  isOnboardingComplete,
  markOnboardingComplete,
  setBirthday,
  setEmail,
  setPhone,
  setPreferredName,
  setServiceType,
} from '@/features/onboarding/onboardingStore';
import { isLikelyNewUser, userHasCompletedOnboarding } from '@/lib/authHelpers';
import { incompleteOnboardingHref } from '@/lib/onboardingNavigation';
import { getTrackerHasPaid } from '@/features/session-tracking/trackerPaymentStore';

function birthdayFromMetadata(user: User): Date | null {
  const year = Number(user.user_metadata?.birth_year);
  const month = Number(user.user_metadata?.birth_month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return new Date(year, month - 1, 1);
}

function displayNameFromMetadata(user: User): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }
  const name = user.user_metadata?.name;
  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }
  return '';
}

function applyPhoneFromE164(e164: string): void {
  const digits = e164.replace(/\D/g, '');
  if (!digits) {
    return;
  }
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const country of sorted) {
    if (digits.startsWith(country.dialCode) && digits.length > country.dialCode.length) {
      setPhone(country.iso2, digits.slice(country.dialCode.length));
      return;
    }
  }
  setPhone(DEFAULT_COUNTRY.iso2, digits);
}

/** Phone, birthday, and service type are required before How it works / Home. */
export function userHasOnboardingDetails(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }
  const phone = user.user_metadata?.phone;
  const hasPhone = typeof phone === 'string' && phone.trim().length > 0;
  const birthday = birthdayFromMetadata(user);
  const serviceType = user.user_metadata?.service_type;
  const hasService =
    typeof serviceType === 'string' && SERVICE_TYPES.includes(serviceType as ServiceType);
  return hasPhone && birthday !== null && hasService;
}

export function applyVolunteerProfileFromUser(user: User | null | undefined): void {
  if (!user) {
    return;
  }
  const displayName = displayNameFromMetadata(user);
  if (displayName) {
    setPreferredName(displayName);
  }
  if (user.email) {
    setEmail(user.email);
  }
  const phone = user.user_metadata?.phone;
  if (typeof phone === 'string' && phone.trim()) {
    applyPhoneFromE164(phone);
  }
  const birthday = birthdayFromMetadata(user);
  if (birthday) {
    setBirthday(birthday);
  }
  const serviceType = user.user_metadata?.service_type;
  if (typeof serviceType === 'string' && SERVICE_TYPES.includes(serviceType as ServiceType)) {
    setServiceType(serviceType as ServiceType);
  }
  if (userHasCompletedOnboarding(user)) {
    markOnboardingComplete();
  }
}

export function destinationAfterAuth(session: Session | null): Href {
  const user = session?.user;
  if (!user) {
    return '/welcome';
  }
  if (isOnboardingComplete() || userHasCompletedOnboarding(user)) {
    return '/';
  }
  if (!userHasOnboardingDetails(user)) {
    return '/account-phone';
  }
  if (isLikelyNewUser(user)) {
    return '/creating-account';
  }
  return incompleteOnboardingHref(getTrackerHasPaid());
}

export function continueAfterAuth(session: Session, router: Pick<Router, 'replace'>): void {
  applyVolunteerProfileFromUser(session.user);
  router.replace(destinationAfterAuth(session));
}
