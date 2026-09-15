import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { sanitizeCachedFilename } from './sanitizeCachedFilename';

export type SharedCachedFile = {
  uri: string;
  filename: string;
};

function isShareDismissed(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dismiss|cancel|not share/i.test(message);
}

export async function shareCachedFile(options: {
  uri: string;
  mimeType: string;
  uti: string;
  dialogTitle: string;
}): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  try {
    await Sharing.shareAsync(options.uri, {
      mimeType: options.mimeType,
      UTI: options.uti,
      dialogTitle: options.dialogTitle,
    });
  } catch (error) {
    if (isShareDismissed(error)) {
      return;
    }
    throw error;
  }
}

export async function writeCachedFile(options: {
  contents: string;
  encoding: FileSystem.EncodingType;
  filename: string;
}): Promise<SharedCachedFile> {
  const directory = FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error('File cache is not available on this device');
  }

  const filename = sanitizeCachedFilename(options.filename, 'CGB-export');
  const uri = `${directory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, options.contents, {
    encoding: options.encoding,
  });
  return { uri, filename };
}

export async function writeCachedFileAndShare(options: {
  contents: string;
  encoding: FileSystem.EncodingType;
  filename: string;
  mimeType: string;
  uti: string;
  dialogTitle: string;
}): Promise<SharedCachedFile> {
  const file = await writeCachedFile(options);
  await shareCachedFile({
    uri: file.uri,
    mimeType: options.mimeType,
    uti: options.uti,
    dialogTitle: options.dialogTitle,
  });
  return file;
}
