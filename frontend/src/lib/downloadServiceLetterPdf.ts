import { isApiConfigured } from './api';
import { shareCachedFile, type SharedCachedFile } from './shareCachedFile';
import { getAccessToken } from './supabase';
import {
  createDownloadedLetterId,
  persistLetterPdfFile,
  recordDownloadedLetter,
} from '@/features/session-tracking/downloadedLettersStore';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export type DownloadServiceLetterOptions = {
  /** Open the OS share sheet after writing the file. Default true. */
  share?: boolean;
  /** Append a Letters library row. Default true. */
  record?: boolean;
};

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? null;
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Download approved session letter PDF, save it to Letters, and optionally open the share sheet. */
export async function downloadServiceLetterPdf(
  sessionIds: string[],
  options: DownloadServiceLetterOptions = {},
): Promise<SharedCachedFile> {
  const share = options.share !== false;
  const record = options.record !== false;

  if (!isApiConfigured || !API_URL) {
    throw new Error('API URL not configured');
  }

  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const uniqueIds = [...new Set(sessionIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new Error('No sessions selected');
  }

  let response: Response;
  if (uniqueIds.length === 1) {
    response = await fetch(`${API_URL}/sessions/${uniqueIds[0]}/service-letter.pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } else {
    response = await fetch(`${API_URL}/sessions/service-letter.pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionIds: uniqueIds }),
    });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseServiceLetterError(text) || `Download failed (${response.status})`);
  }

  const fallback = `CGB-Service-Letter-${new Date().toISOString().slice(0, 10)}.pdf`;
  const filename = filenameFromContentDisposition(response.headers.get('Content-Disposition')) ?? fallback;
  const letterId = createDownloadedLetterId();
  const uniqueFilename = /\.pdf$/i.test(filename)
    ? filename.replace(/\.pdf$/i, `-${letterId}.pdf`)
    : `${filename}-${letterId}.pdf`;

  const arrayBuffer = await response.arrayBuffer();
  const file = await persistLetterPdfFile(arrayBufferToBase64(arrayBuffer), uniqueFilename);

  if (record) {
    recordDownloadedLetter({ id: letterId, sessionIds: uniqueIds, file });
  }

  if (share) {
    await shareCachedFile({
      uri: file.uri,
      mimeType: 'application/pdf',
      uti: 'com.adobe.pdf',
      dialogTitle: 'Service letter PDF',
    });
  }

  return file;
}

function parseServiceLetterError(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  try {
    const parsed = JSON.parse(trimmed) as { error?: unknown };
    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    // Use the raw body when it is not JSON.
  }
  return trimmed;
}
