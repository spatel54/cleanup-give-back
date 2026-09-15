/**
 * Server-only dependency probes for the Production Readiness page
 * (`components/ui/ProductionReadinessPanel.tsx`, `actions/health.ts`). Each check
 * reuses the same accessors the rest of admin-web-app already uses (soft-fail to
 * null/undefined when unconfigured), so a red check here means the exact same thing
 * a red check would mean anywhere else in the app.
 */
import { getResendClient } from './resend';
import { getAdminApiKey, getSessionsApiUrl } from './sessionsApiConfig';
import { createClient, tryCreateServiceClient } from './supabase/server';

export type HealthCheckResult = {
  name: string;
  ok: boolean;
  detail?: string;
  latencyMs?: number;
};

async function timed(name: string, fn: () => Promise<Omit<HealthCheckResult, 'name' | 'latencyMs'>>) {
  const startedAt = Date.now();
  try {
    const result = await fn();
    return { name, latencyMs: Date.now() - startedAt, ...result };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - startedAt,
    };
  }
}

async function checkResend(): Promise<HealthCheckResult> {
  return timed('Resend', async () => {
    const client = getResendClient();
    if (!client) return { ok: false, detail: 'RESEND_API_KEY not set' };
    return { ok: true, detail: 'Configured' };
  });
}

async function checkSessionsApi(): Promise<HealthCheckResult> {
  return timed('Sessions API', async () => {
    const baseUrl = getSessionsApiUrl();
    if (!baseUrl) return { ok: false, detail: 'SESSIONS_API_URL not set' };
    const response = await fetch(`${baseUrl}/health/deep`, { cache: 'no-store' });
    if (!response.ok) return { ok: false, detail: `HTTP ${response.status}` };
    const body = (await response.json()) as { status?: string };
    return body.status === 'ok'
      ? { ok: true, detail: 'Reachable, database connected' }
      : { ok: false, detail: 'Reachable, but database check failed' };
  });
}

async function checkAdminApiKeyConfigured(): Promise<HealthCheckResult> {
  return timed('Admin API key', async () => {
    const key = getAdminApiKey();
    return key ? { ok: true, detail: 'Configured' } : { ok: false, detail: 'ADMIN_API_KEY not set' };
  });
}

async function checkSupabaseAuth(): Promise<HealthCheckResult> {
  return timed('Supabase Auth (admin claim)', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, detail: 'No signed-in admin session' };
    if (user.user_metadata?.role !== 'admin') {
      return { ok: false, detail: 'Signed in, but user_metadata.role is not "admin"' };
    }
    return { ok: true, detail: `Admin claim valid for ${user.email ?? user.id}` };
  });
}

async function checkSupabaseData(): Promise<HealthCheckResult> {
  return timed('Supabase data connection', async () => {
    const client = await tryCreateServiceClient();
    if (!client) return { ok: false, detail: 'SUPABASE_SERVICE_ROLE_KEY not set' };
    const { error } = await client.from('sessions').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) return { ok: false, detail: error.message };
    return { ok: true, detail: 'sessions table reachable' };
  });
}

async function checkStorageBucket(bucket: string): Promise<HealthCheckResult> {
  return timed(`Storage bucket: ${bucket}`, async () => {
    const client = await tryCreateServiceClient();
    if (!client) return { ok: false, detail: 'SUPABASE_SERVICE_ROLE_KEY not set' };
    const { error } = await client.storage.from(bucket).list('', { limit: 1 });
    if (error) return { ok: false, detail: error.message };
    return { ok: true, detail: 'Bucket reachable' };
  });
}

/**
 * Confirms Realtime events actually arrive, not just that a channel connects. Per
 * `useSessionsRealtimeRefresh.ts`'s own warning, a broken RLS/publication setup
 * (see `admin/db/008_admin_sessions_realtime_read.sql`) connects successfully but
 * silently delivers no events - so this subscribes to a private broadcast channel
 * and waits for a message it sends itself, round-tripping through Supabase's
 * Realtime server rather than just checking `.subscribe()` status.
 */
async function checkRealtimeRoundTrip(): Promise<HealthCheckResult> {
  return timed('Realtime round-trip', async () => {
    const client = await tryCreateServiceClient();
    if (!client) return { ok: false, detail: 'SUPABASE_SERVICE_ROLE_KEY not set' };

    const channelName = `health-check-${Date.now()}`;
    const channel = client.channel(channelName, { config: { broadcast: { self: true } } });

    const delivered = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 4000);
      channel
        .on('broadcast', { event: 'ping' }, () => {
          clearTimeout(timeout);
          resolve(true);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({ type: 'broadcast', event: 'ping', payload: {} });
          }
        });
    });

    await client.removeChannel(channel);

    return delivered
      ? { ok: true, detail: 'Event round-trip confirmed' }
      : { ok: false, detail: 'Channel connected but no event was delivered within 4s' };
  });
}

export async function runAllHealthChecks(): Promise<HealthCheckResult[]> {
  const results = await Promise.allSettled([
    checkResend(),
    checkSessionsApi(),
    checkAdminApiKeyConfigured(),
    checkSupabaseAuth(),
    checkSupabaseData(),
    checkStorageBucket('session-photos'),
    checkStorageBucket('event-photos'),
    checkRealtimeRoundTrip(),
  ]);

  return results.map((result, i) =>
    result.status === 'fulfilled'
      ? result.value
      : { name: `Check ${i}`, ok: false, detail: 'Check threw unexpectedly' },
  );
}
