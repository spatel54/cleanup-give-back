import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  const url = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) {
    throw new Error('Server misconfigured: missing Supabase service credentials');
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export async function getVolunteerDisplayName(userId: string): Promise<string> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) {
    return 'Volunteer';
  }

  const meta = data.user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (typeof data.user.email === 'string' && data.user.email) ||
    'Volunteer';

  return fullName;
}

export async function createSignedPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) {
    return null;
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.storage
    .from('session-photos')
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
