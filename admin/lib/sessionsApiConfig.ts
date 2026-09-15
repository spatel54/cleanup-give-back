const SESSIONS_API_URL = (process.env.SESSIONS_API_URL ?? process.env.NEXT_PUBLIC_SESSIONS_API_URL ?? '')
  .replace(/\/$/, '');

export function getSessionsApiUrl(): string {
  return SESSIONS_API_URL;
}

export function getAdminApiKey(): string | undefined {
  return process.env.ADMIN_API_KEY;
}
