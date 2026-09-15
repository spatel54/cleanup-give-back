import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session } from '@supabase/supabase-js';

/** Project root only — not `/rest/v1`. See docs/supabase.md */
export function normalizeSupabaseProjectUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.replace(/\/rest\/v1\/?$/i, '');
}

const supabaseUrlRaw = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseUrl = normalizeSupabaseProjectUrl(supabaseUrlRaw);
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

let supabaseUrlFormatWarned = false;
if (supabaseUrlRaw && supabaseUrlRaw.trim() !== supabaseUrl && !supabaseUrlFormatWarned) {
  supabaseUrlFormatWarned = true;
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL should be the project root (https://<ref>.supabase.co), not /rest/v1 — see docs/supabase.md',
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Signs out leftover anonymous sessions from the pre-auth test phase. */
export async function discardAnonymousSession(): Promise<void> {
  if (!supabase) {
    return;
  }
  const session = await getCurrentSession();
  if (session?.user?.is_anonymous) {
    await signOutCurrentUser({ localOnly: true });
  }
}

/**
 * Returns the current session. Does **not** create anonymous users —
 * volunteers must sign in (see `docs/frontend/specs/volunteer-auth.md`).
 */
export async function ensureAnonymousAuth(): Promise<Session | null> {
  return getCurrentSession();
}

/** Ends the current session without immediately creating a new anonymous user. */
export async function signOutCurrentUser(options?: { localOnly?: boolean }): Promise<void> {
  if (!supabase) {
    return;
  }
  const scope = options?.localOnly ? 'local' : 'global';
  try {
    await supabase.auth.signOut({ scope });
  } catch {
    await supabase.auth.signOut({ scope: 'local' });
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const session = await getCurrentSession();
  return session?.access_token ?? null;
}

export async function getUserId(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const session = await getCurrentSession();
  return session?.user?.id ?? null;
}

/** `user_metadata.service_type` synced at onboarding via `syncVolunteerProfile` — used
 * to gate the Court Progress card even before an admin has entered a court order. */
export async function getServiceType(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const session = await getCurrentSession();
  const serviceType = session?.user?.user_metadata?.service_type;
  return typeof serviceType === 'string' && serviceType ? serviceType : null;
}

const SYNC_VOLUNTEER_PROFILE_RETRY_DELAYS_MS = [500, 1500, 3000];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sync of the onboarding display name (and optionally email/phone/serviceType) into
 * `user_metadata`, so the admin dashboard can resolve real volunteer names.
 * Retries with backoff on transient failure and verifies the write actually
 * landed (not just that the request didn't error) before giving up — a
 * volunteer's name has no other path to admin once this is skipped, since
 * the onboarding store holding it is in-memory only. Never throws — safe to
 * fire-and-forget from UI code, but keeps retrying in the background even
 * after the calling screen unmounts.
 */
export async function syncVolunteerProfile(details: {
  preferredName?: string;
  email?: string;
  phone?: string;
  serviceType?: string;
  birthday?: Date | null;
  onboardingComplete?: boolean;
}): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const trimmedName = details.preferredName?.trim() ?? '';
  if (!trimmedName && details.onboardingComplete !== true) {
    return false;
  }

  const data: Record<string, string | boolean | number> = {};
  if (trimmedName) {
    data.full_name = trimmedName;
  }
  if (details.email?.trim()) {
    data.email = details.email.trim();
  }
  if (details.phone?.trim()) {
    data.phone = details.phone.trim();
  }
  if (details.serviceType?.trim()) {
    data.service_type = details.serviceType.trim();
  }
  if (details.birthday) {
    data.birth_year = details.birthday.getFullYear();
    data.birth_month = details.birthday.getMonth() + 1;
  }
  if (details.onboardingComplete === true) {
    data.onboarding_complete = true;
  }
  if (Object.keys(data).length === 0) {
    return false;
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= SYNC_VOLUNTEER_PROFILE_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const { data: updated, error } = await supabase.auth.updateUser({ data });
      const metadata = updated.user?.user_metadata ?? {};
      const wroteCleanly =
        !error &&
        (!trimmedName || metadata.full_name === trimmedName) &&
        (!data.phone || metadata.phone === data.phone) &&
        (!data.service_type || metadata.service_type === data.service_type) &&
        (!details.birthday ||
          (Number(metadata.birth_year) === data.birth_year &&
            Number(metadata.birth_month) === data.birth_month)) &&
        (details.onboardingComplete !== true || metadata.onboarding_complete === true);

      if (error) {
        lastError = error;
      } else if (!wroteCleanly) {
        // Request succeeded but the response doesn't reflect our write — treat as
        // unconfirmed and retry rather than trusting a no-error response blindly.
        lastError = new Error('profile fields mismatch after updateUser');
      } else {
        return true;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < SYNC_VOLUNTEER_PROFILE_RETRY_DELAYS_MS.length) {
      await delay(SYNC_VOLUNTEER_PROFILE_RETRY_DELAYS_MS[attempt]);
    }
  }

  console.warn('[supabase] volunteer profile sync failed after retries:', lastError);
  return false;
}
