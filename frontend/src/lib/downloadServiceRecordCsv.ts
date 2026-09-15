import * as FileSystem from 'expo-file-system/legacy';

import type { SessionStatRecord } from '@/features/session-tracking/utils/homeDashboardStats';

import { buildServiceRecordCsv } from './buildServiceRecordCsv';
import { writeCachedFileAndShare, type SharedCachedFile } from './shareCachedFile';

export { buildServiceRecordCsv } from './buildServiceRecordCsv';

export async function downloadServiceRecordCsv(
  sessions: readonly SessionStatRecord[],
): Promise<SharedCachedFile> {
  if (sessions.length === 0) {
    throw new Error('No sessions selected');
  }

  const filename = `CGB-Service-Record-${new Date().toISOString().slice(0, 10)}.csv`;
  return writeCachedFileAndShare({
    contents: buildServiceRecordCsv(sessions),
    encoding: FileSystem.EncodingType.UTF8,
    filename,
    mimeType: 'text/csv',
    uti: 'public.comma-separated-values-text',
    dialogTitle: 'Service record CSV',
  });
}
