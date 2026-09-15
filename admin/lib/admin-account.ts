/** Defaults for the admin's admin identity when auth metadata / env are unset. */
export function defaultAdminDisplayName(): string {
  return process.env.ADMIN_DISPLAY_NAME ?? 'Admin';
}

export function defaultAdminEmail(): string {
  return process.env.ADMIN_NOTIFY_EMAIL ?? 'support@example.org';
}

export function resolveAdminDisplayName(user?: {
  user_metadata?: Record<string, unknown> | null;
} | null): string {
  const raw = user?.user_metadata?.full_name;
  const fromMeta = typeof raw === 'string' ? raw.trim() : '';
  if (fromMeta) return fromMeta;
  return defaultAdminDisplayName();
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}
