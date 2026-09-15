import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function cookieHandlers(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch {
        // Ignore in Server Components — middleware handles refresh
      }
    },
  };
}

/**
 * Cookie-free service-role client for use inside `unstable_cache` (cookies/headers
 * are disallowed in cached callbacks). Prefer `createDataClient` / `tryCreateServiceClient`
 * for normal Server Components.
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieHandlers(cookieStore) },
  );
}

/** True when admin/.env.local has a non-empty service-role key. */
export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Service-role client for Auth Admin API (listUsers / getUserById).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is missing so layout/nav
 * can degrade gracefully instead of crashing the whole admin shell.
 */
export async function tryCreateServiceClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, { cookies: cookieHandlers(cookieStore) });
}

export async function createServiceClient(): Promise<SupabaseClient> {
  const client = await tryCreateServiceClient();
  if (!client) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in admin/.env.local. ' +
        'Copy the service_role secret from Supabase Dashboard → Project Settings → API.',
    );
  }
  return client;
}

/**
 * Admin data-plane client. Prefers service role so dashboard pages can read
 * volunteer-owned rows (sessions / checkpoints) even with BYPASS_AUTH or
 * without a logged-in admin JWT. Falls back to the cookie/anon client.
 */
export async function createDataClient(): Promise<SupabaseClient> {
  const service = await tryCreateServiceClient();
  if (service) return service;
  return createClient();
}
