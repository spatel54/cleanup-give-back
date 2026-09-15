import { Alert } from 'react-native';

import { getSessionStats, hydrateSessionStatsFromApi } from './sessionStatsStore';
import { hasApprovedSessions } from './utils/homeDashboardStats';

export const NO_APPROVED_SESSIONS_TITLE = 'No approved sessions';
export const NO_APPROVED_SESSIONS_MESSAGE = 'No approved sessions to download.';

export async function openDownloadServiceRecord(
  navigate: () => void,
  extraHasApproved = false,
): Promise<void> {
  await hydrateSessionStatsFromApi();
  if (!extraHasApproved && !hasApprovedSessions(getSessionStats())) {
    Alert.alert(NO_APPROVED_SESSIONS_TITLE, NO_APPROVED_SESSIONS_MESSAGE);
    return;
  }
  navigate();
}
