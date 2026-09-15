import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const CHECKPOINTS_DIR = `${FileSystem.documentDirectory ?? ''}checkpoint-photos/`;

async function ensureCheckpointDir() {
  if (!FileSystem.documentDirectory) {
    return;
  }

  const info = await FileSystem.getInfoAsync(CHECKPOINTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CHECKPOINTS_DIR, { intermediates: true });
  }
}

async function copyPhoto(uri: string, filename: string): Promise<string> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return uri;
  }

  try {
    const sourceInfo = await FileSystem.getInfoAsync(uri);
    if (!sourceInfo.exists) {
      return uri;
    }

    await ensureCheckpointDir();
    const destination = `${CHECKPOINTS_DIR}${filename}`;
    const destInfo = await FileSystem.getInfoAsync(destination);
    if (destInfo.exists) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
    }

    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  } catch {
    // Fall back to the camera cache URI so submit still completes.
    return uri;
  }
}

/** Copies checkpoint camera URIs into app document storage so they survive until Session Detail. */
export async function persistCheckpointPhotos(submission: {
  selfieUri: string;
  progressUri: string;
  capturedAt: number;
}): Promise<{ selfieUri: string; progressUri: string; capturedAt: number }> {
  const prefix = `checkpoint-${submission.capturedAt}`;

  const [selfieUri, progressUri] = await Promise.all([
    copyPhoto(submission.selfieUri, `${prefix}-selfie.jpg`),
    copyPhoto(submission.progressUri, `${prefix}-progress.jpg`),
  ]);

  return {
    ...submission,
    selfieUri,
    progressUri,
  };
}
