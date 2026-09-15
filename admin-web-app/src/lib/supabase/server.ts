/**
 * Server-side Supabase clients - ported from `admin/lib/supabase/server.ts`.
 * web-app shares the same Supabase project as `admin/` and the mobile app
 * (`frontend/`), so this is the same client shape wired to `NEXT_PUBLIC_SUPABASE_*`
 * / `SUPABASE_SERVICE_ROLE_KEY` in `admin-web-app/.env.local`.
 */
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
        // Ignore in Server Components - middleware handles refresh.
      }
    },
  };
}

/** Bypass the Next.js fetch Data Cache so session lists are never a stale RSC snapshot. */
function noStoreFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, cache: 'no-store' });
}

/** Cookie-free service-role client for use outside request scope (e.g. `unstable_cache`). */
export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  });
}

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieHandlers(cookieStore), global: { fetch: noStoreFetch } },
  );
}

/** True when admin-web-app/.env.local has a non-empty service-role key. */
export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Service-role client for Auth Admin API (listUsers / getUserById) and for
 * reading volunteer-owned rows without RLS. Cookie-free on purpose: pairing
 * `createServerClient(serviceRoleKey, { cookies })` with a logged-in admin
 * session can scope PostgREST as the user JWT and return zero rows under
 * volunteer RLS. Returns null when `SUPABASE_SERVICE_ROLE_KEY` is missing so
 * callers can render empty real lists (sessions/users never inject fixtures).
 */
export async function tryCreateServiceClient(): Promise<SupabaseClient | null> {
  return createServiceRoleClient();
}

export async function createServiceClient(): Promise<SupabaseClient> {
  const client = await tryCreateServiceClient();
  if (!client) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in admin-web-app/.env.local. ' +
        'Copy the service_role secret from Supabase Dashboard → Project Settings → API.',
    );
  }
  return client;
}

/**
 * Data-plane client for reads. Prefers the cookie-free service role so pages
 * can list every volunteer-owned row (sessions / feedback / orders) even when
 * Admin is signed in with a normal admin JWT; falls back to the cookie/anon
 * client when the service-role key is unset.
 */
export async function createDataClient(): Promise<SupabaseClient> {
  const service = await tryCreateServiceClient();
  if (service) return service;
  return createClient();
}
