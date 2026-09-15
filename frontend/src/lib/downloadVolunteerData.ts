import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import {
  getBirthday,
  getE164Phone,
  getEmail,
  getPreferredName,
  getServiceType,
} from '@/features/onboarding/onboardingStore';
import { listSessions } from '@/lib/sessionsApi';
import { getCachedProfilePhotoUri } from '@/lib/profilePhoto';

/**
 * Build a JSON export of the volunteer's local/API data and open the share sheet.
 */
export async function downloadVolunteerDataExport(): Promise<void> {
  const sessions = await listSessions().catch(() => []);
  const payload = {
    exportedAt: new Date().toISOString(),
    profile: {
      preferredName: getPreferredName(),
      email: getEmail(),
      phone: getE164Phone(),
      serviceType: getServiceType(),
      birthday: getBirthday()?.toISOString?.() ?? getBirthday() ?? null,
      profilePhotoCached: Boolean(await getCachedProfilePhotoUri()),
    },
    sessions: sessions.map((session) => ({
      id: session.id,
      activity: session.activity,
      status: session.status,
      courtOrdered: session.courtOrdered,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationSeconds: session.durationSeconds,
      distanceMiles: session.distanceMiles,
      description: session.description,
      declineReason: session.declineReason ?? null,
    })),
  };

  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) {
    throw new Error('File storage is unavailable on this device.');
  }

  const path = `${dir}cleanup-giveback-data-export.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: 'Download your data',
    UTI: 'public.json',
  });
}
