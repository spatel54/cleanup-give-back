import AsyncStorage from '@react-native-async-storage/async-storage';

import { createSignedStorageUrl } from '@/lib/signedStorageUrl';
import { ensureAnonymousAuth, getUserId, supabase } from '@/lib/supabase';

const STORAGE_BUCKET = 'session-photos';
const LOCAL_URI_KEY = 'profile-photo-local-uri';
const AVATAR_METADATA_KEY = 'avatar_path';

async function readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

function profilePhotoPathForUser(userId: string): string {
  return `${userId}/profile.jpg`;
}

async function getAvatarPathFromMetadata(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  await ensureAnonymousAuth();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('[profile-photo] getUser failed:', error.message);
    return null;
  }

  const avatarPath = data.user?.user_metadata?.[AVATAR_METADATA_KEY];
  return typeof avatarPath === 'string' && avatarPath ? avatarPath : null;
}

async function syncAvatarPathMetadata(path: string | null): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  await ensureAnonymousAuth();
  const { error } = await supabase.auth.updateUser({
    data: { [AVATAR_METADATA_KEY]: path ?? '' },
  });

  if (error) {
    console.warn('[profile-photo] metadata sync failed:', error.message);
    return false;
  }

  return true;
}

/** Returns a signed URL for the current user's profile photo, if one exists. */
export async function loadProfilePhotoUrl(): Promise<string | null> {
  const avatarPath = await getAvatarPathFromMetadata();
  if (!avatarPath) {
    return null;
  }

  return createSignedStorageUrl(avatarPath);
}

export async function clearCachedProfilePhoto(): Promise<void> {
  await setCachedProfilePhotoUri(null);
}

/** Cached local URI shown immediately after pick while upload/signing completes. */
export async function getCachedProfilePhotoUri(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LOCAL_URI_KEY);
  } catch {
    return null;
  }
}

async function setCachedProfilePhotoUri(uri: string | null): Promise<void> {
  try {
    if (uri) {
      await AsyncStorage.setItem(LOCAL_URI_KEY, uri);
    } else {
      await AsyncStorage.removeItem(LOCAL_URI_KEY);
    }
  } catch {
    // Non-fatal — display falls back to initials.
  }
}

/** Uploads a profile photo and stores its Storage path in user metadata. */
export async function uploadProfilePhoto(localUri: string): Promise<string | null> {
  if (!supabase) {
    await setCachedProfilePhotoUri(localUri);
    return localUri;
  }

  const userId = await getUserId();
  if (!userId) {
    return null;
  }

  const path = profilePhotoPathForUser(userId);
  const imageData = await readFileAsArrayBuffer(localUri);

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, imageData, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) {
    console.warn('[profile-photo] upload failed:', error.message);
    return null;
  }

  const synced = await syncAvatarPathMetadata(path);
  if (!synced) {
    return null;
  }

  await setCachedProfilePhotoUri(localUri);
  return path;
}

/** Clears the stored profile photo path so the avatar falls back to initials. */
export async function removeProfilePhoto(): Promise<boolean> {
  await setCachedProfilePhotoUri(null);
  return syncAvatarPathMetadata(null);
}
