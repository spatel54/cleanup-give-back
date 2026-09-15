import { supabase } from './supabase';

/** Returns a short-lived signed URL for a private Storage object path. */
export async function createSignedStorageUrl(path: string): Promise<string | null> {
  if (!supabase || !path) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from('session-photos')
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.warn('[storage] signed url failed:', error.message);
    return null;
  }

  return data.signedUrl;
}

/** Signs multiple Storage paths in parallel. */
export async function createSignedStorageUrls(paths: string[]): Promise<Map<string, string>> {
  const results = await Promise.all(
    paths.map(async (path) => {
      const url = await createSignedStorageUrl(path);
      return [path, url] as const;
    }),
  );

  const signed = new Map<string, string>();
  for (const [path, url] of results) {
    if (url) {
      signed.set(path, url);
    }
  }

  return signed;
}
