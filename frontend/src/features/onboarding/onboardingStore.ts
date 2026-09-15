import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { COUNTRIES, DEFAULT_COUNTRY } from '@/constants/countries';
import type { ServiceType } from '@/constants/serviceTypes';
import { clearCreateAccountDraft } from '@/lib/createAccountDraft';

const ONBOARDING_COMPLETE_KEY = 'onboarding-complete';
const ONBOARDING_BIRTHDAY_KEY = 'onboarding-birthday-iso';

/** Onboarding gate + profile fields. The complete flag is persisted so returning logins skip Welcome. */
let onboardingComplete = false;
let preferredName = '';
let email = '';
let phoneCountryIso2 = DEFAULT_COUNTRY.iso2;
let phoneDigits = '';
/** First-of-month ISO date string (yyyy-mm-01), or null if not set. */
let birthdayIso: string | null = null;
let serviceType: ServiceType | null = null;

const listeners = new Set<() => void>();

let personalDetailsSnapshot: PersonalDetails = computePersonalDetailsSnapshot();

function notify() {
  personalDetailsSnapshot = computePersonalDetailsSnapshot();
  listeners.forEach((listener) => listener());
}

export function markOnboardingComplete(): void {
  onboardingComplete = true;
  void AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');
  notify();
}

export function isOnboardingComplete(): boolean {
  return onboardingComplete;
}

export async function hydrateOnboardingComplete(): Promise<void> {
  try {
    const [raw, birthdayRaw] = await Promise.all([
      AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
      AsyncStorage.getItem(ONBOARDING_BIRTHDAY_KEY),
    ]);
    onboardingComplete = raw === '1';
    if (birthdayRaw) {
      const parsed = new Date(birthdayRaw);
      if (!Number.isNaN(parsed.getTime())) {
        birthdayIso = new Date(parsed.getFullYear(), parsed.getMonth(), 1).toISOString();
      }
    }
    notify();
  } catch {
    // Keep the in-memory default.
  }
}

/** Saves the preferred/display name from the account-phone details step. */
export function setPreferredName(name: string): void {
  preferredName = name.trim();
  notify();
}

export function getPreferredName(): string {
  return preferredName;
}

/** Saves the email address from the create-account step. */
export function setEmail(value: string): void {
  email = value.trim().toLowerCase();
  notify();
}

export function getEmail(): string {
  return email;
}

/** Saves the phone number (country + national digits) from the account-phone step. */
export function setPhone(countryIso2: string, digits: string): void {
  phoneCountryIso2 = countryIso2;
  phoneDigits = digits;
  notify();
}

export function getPhoneCountryIso2(): string {
  return phoneCountryIso2;
}

export function getPhoneDigits(): string {
  return phoneDigits;
}

/** E.164-formatted phone number (e.g. `+15551234567`), or empty string if no digits are set. */
export function getE164Phone(): string {
  if (!phoneDigits) {
    return '';
  }
  const dialCode = COUNTRIES.find((country) => country.iso2 === phoneCountryIso2)?.dialCode
    ?? DEFAULT_COUNTRY.dialCode;
  return `+${dialCode}${phoneDigits}`;
}

/** Saves the birthday (month + year) from the account-details step. */
export function setBirthday(date: Date | null): void {
  birthdayIso = date ? new Date(date.getFullYear(), date.getMonth(), 1).toISOString() : null;
  if (birthdayIso) {
    void AsyncStorage.setItem(ONBOARDING_BIRTHDAY_KEY, birthdayIso);
  } else {
    void AsyncStorage.removeItem(ONBOARDING_BIRTHDAY_KEY);
  }
  notify();
}

export function getBirthday(): Date | null {
  return birthdayIso ? new Date(birthdayIso) : null;
}

/** Saves the service type (court ordered, volunteering, etc.) from the account-details step. */
export function setServiceType(value: ServiceType | null): void {
  serviceType = value;
  notify();
}

export function getServiceType(): ServiceType | null {
  return serviceType;
}

/** Clears signup/onboarding PII after COPPA under-age block (in-memory only). */
export function clearOnboardingSignupData(): void {
  onboardingComplete = false;
  preferredName = '';
  email = '';
  phoneCountryIso2 = DEFAULT_COUNTRY.iso2;
  phoneDigits = '';
  birthdayIso = null;
  serviceType = null;
  clearCreateAccountDraft();
  void AsyncStorage.multiRemove([ONBOARDING_COMPLETE_KEY, ONBOARDING_BIRTHDAY_KEY]);
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribePreferredName(listener: () => void) {
  return subscribe(listener);
}

export function usePreferredName(): string {
  return useSyncExternalStore(subscribe, getPreferredName, getPreferredName);
}

export type PersonalDetails = {
  preferredName: string;
  email: string;
  phoneCountryIso2: string;
  phoneDigits: string;
  birthday: Date | null;
  serviceType: ServiceType | null;
};

function computePersonalDetailsSnapshot(): PersonalDetails {
  return {
    preferredName,
    email,
    phoneCountryIso2,
    phoneDigits,
    birthday: getBirthday(),
    serviceType,
  };
}

function getPersonalDetailsSnapshot(): PersonalDetails {
  return personalDetailsSnapshot;
}

/** Reads all editable personal-details fields as one snapshot, updating on any change. */
export function usePersonalDetails(): PersonalDetails {
  return useSyncExternalStore(subscribe, getPersonalDetailsSnapshot, getPersonalDetailsSnapshot);
}
