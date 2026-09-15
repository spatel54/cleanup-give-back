/** Ported from `admin/lib/volunteers.ts` - same Supabase Auth Admin API directory lookup. */
import { cache } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { tryCreateServiceClient } from '@/lib/supabase/server';

export type VolunteerDirectoryEntry = {
  id: string;
  name: string;
  email: string | null;
  /** True when `email` is a generated placeholder (`isMockEmail`), not a real
   * address - this volunteer hasn't synced a real email yet (no OTP email step
   * completed at onboarding). Never actually deliverable; see `MOCK_EMAIL_DOMAIN`. */
  isMockEmail: boolean;
  /** Account-level classification set once during onboarding (Court Ordered / Volunteering / School / Other). */
  serviceType: string | null;
  /** Expo push token saved from `NotificationPreferenceScreen`, or null if never granted. */
  pushToken: string | null;
  createdAt: string;
};

export type VolunteerDirectory = Map<string, VolunteerDirectoryEntry>;

const LIST_USERS_PAGE_SIZE = 1000;

/** Non-routable placeholder domain for volunteers with no real email on file yet -
 * lets them still show up in pickers/lists. `isMockAddress` below is the single
 * source of truth other code should check before actually sending mail. */
export const MOCK_EMAIL_DOMAIN = 'no-email.cleanupgiveback.internal';

export function isMockAddress(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${MOCK_EMAIL_DOMAIN}`));
}

function mockEmailFor(userId: string): string {
  return `volunteer-${userId.slice(0, 8)}@${MOCK_EMAIL_DOMAIN}`;
}

/** Mobile volunteers sign in anonymously - `auth.users.email` is only ever set for
 * admins who log in with a real password (e.g. Admin). A volunteer's actual contact
 * email is synced into `user_metadata.email` at onboarding (`syncVolunteerProfile`),
 * so that's the fallback every directory consumer needs. */
export function resolveVolunteerEmail(user: Pick<User, 'email' | 'user_metadata'>): string | null {
  if (user.email) return user.email;
  const metaEmail = user.user_metadata?.email;
  return typeof metaEmail === 'string' && metaEmail.trim() ? metaEmail.trim() : null;
}

/** Fallback chain: onboarding-synced display name → email local-part → short id. */
export function resolveVolunteerName(user: Pick<User, 'id' | 'email' | 'user_metadata'>): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();

  const email = resolveVolunteerEmail(user);
  if (email) {
    const local = email.split('@')[0];
    if (local) return local;
  }

  return `Volunteer ${user.id.slice(0, 8).toUpperCase()}`;
}

export function resolveVolunteerServiceType(
  user: Pick<User, 'user_metadata'>,
): string | null {
  const serviceType = user.user_metadata?.service_type;
  return typeof serviceType === 'string' && serviceType.trim() ? serviceType.trim() : null;
}

async function fetchVolunteerDirectory(serviceClient: SupabaseClient): Promise<VolunteerDirectory> {
  const directory: VolunteerDirectory = new Map();
  let page = 1;

  while (true) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: LIST_USERS_PAGE_SIZE,
    });
    if (error || !data) break;

    for (const user of data.users) {
      const realEmail = resolveVolunteerEmail(user);
      directory.set(user.id, {
        id: user.id,
        name: resolveVolunteerName(user),
        email: realEmail ?? mockEmailFor(user.id),
        isMockEmail: !realEmail,
        serviceType: resolveVolunteerServiceType(user),
        pushToken: typeof user.user_metadata?.push_token === 'string' ? user.user_metadata.push_token : null,
        createdAt: user.created_at,
      });
    }

    if (data.users.length < LIST_USERS_PAGE_SIZE) break;
    page += 1;
  }

  return directory;
}

/** Zero-arg so React.cache always hits within a single RSC request. */
const loadVolunteerDirectoryOnce = cache(async (): Promise<VolunteerDirectory> => {
  const client = await tryCreateServiceClient();
  if (!client) return new Map();
  return fetchVolunteerDirectory(client);
});

/**
 * Loads every Supabase Auth user once per request into an id-keyed map.
 * Requires the service-role key - Admin API only. Returns an empty map (not
 * an error) when the key is missing; callers render empty real lists (no fixtures).
 */
export async function getVolunteerDirectory(): Promise<VolunteerDirectory> {
  return loadVolunteerDirectoryOnce();
}

export function getVolunteerName(directory: VolunteerDirectory, userId: string): string {
  return directory.get(userId)?.name ?? `Volunteer ${userId.slice(0, 8).toUpperCase()}`;
}

export function getVolunteerServiceType(directory: VolunteerDirectory, userId: string): string | null {
  return directory.get(userId)?.serviceType ?? null;
}
