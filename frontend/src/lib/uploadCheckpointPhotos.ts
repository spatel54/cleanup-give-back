import { supabase, getUserId } from './supabase';

async function readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

function contentTypeForPath(path: string): string {
  if (path.endsWith('.png')) {
    return 'image/png';
  }
  return 'image/jpeg';
}

/** Uploads checkpoint photos to Supabase Storage; returns storage paths. */
export async function uploadCheckpointPhotos(input: {
  sessionId: string;
  checkpointId: string;
  selfieUri: string;
  progressUri: string;
}): Promise<{ selfiePath: string; progressPath: string } | null> {
  if (!supabase) {
    return null;
  }

  const userId = await getUserId();
  if (!userId) {
    return null;
  }

  const selfiePath = `${userId}/${input.sessionId}/${input.checkpointId}-selfie.jpg`;
  const progressPath = `${userId}/${input.sessionId}/${input.checkpointId}-progress.jpg`;

  const [selfieData, progressData] = await Promise.all([
    readFileAsArrayBuffer(input.selfieUri),
    readFileAsArrayBuffer(input.progressUri),
  ]);

  const [selfieResult, progressResult] = await Promise.all([
    supabase.storage.from('session-photos').upload(selfiePath, selfieData, {
      contentType: contentTypeForPath(selfiePath),
      upsert: true,
    }),
    supabase.storage.from('session-photos').upload(progressPath, progressData, {
      contentType: contentTypeForPath(progressPath),
      upsert: true,
    }),
  ]);

  if (selfieResult.error || progressResult.error) {
    console.warn(
      '[storage] upload failed:',
      selfieResult.error?.message ?? progressResult.error?.message,
    );
    return null;
  }

  return { selfiePath, progressPath };
}
