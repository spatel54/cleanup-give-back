import type { SessionApprovalStatus } from '@/features/figma-screens/mocks/sessions';
import { isApiConfigured } from '@/lib/api';
import { deleteSession } from '@/lib/sessionsApi';

import {
  getCachedCompletedSession,
  removeCompletedSessionFromCache,
} from './completedSessionCache';
import {
  removeRecentSession,
} from './recentSessionsStore';
import { removeSessionStatsForSession } from './sessionStatsStore';
import { removeImpactFeedForSession } from './impactFeedStore';
import { markVolunteerSessionsDeleted } from './volunteerDeletedSessions';

const LOCAL_SESSION_ID_PREFIX = 'session-';

function isLocalOnlySessionId(sessionId: string): boolean {
  return sessionId.startsWith(LOCAL_SESSION_ID_PREFIX);
}

export type RemoveVolunteerSessionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Deletes a volunteer session from remote (when synced) and local caches.
 * Approved sessions are blocked in UI; this guard is a safety net.
 */
export async function removeVolunteerSession(
  sessionId: string,
  approvalStatus: SessionApprovalStatus,
): Promise<RemoveVolunteerSessionResult> {
  if (approvalStatus === 'approved') {
    return { ok: false, message: 'Approved sessions cannot be deleted.' };
  }

  if (!sessionId.trim()) {
    return { ok: false, message: 'Session not found.' };
  }

  const cached = getCachedCompletedSession(sessionId);
  const remoteIdsToDelete = new Set<string>();

  if (isApiConfigured && !isLocalOnlySessionId(sessionId)) {
    remoteIdsToDelete.add(sessionId);
  }
  if (isApiConfigured && cached?.remoteSessionId) {
    remoteIdsToDelete.add(cached.remoteSessionId);
  }

  for (const remoteId of remoteIdsToDelete) {
    try {
      await deleteSession(remoteId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not delete session.';
      if (message.includes('409')) {
        return { ok: false, message: 'Approved sessions cannot be deleted.' };
      }
      if (message.includes('404')) {
        // Already gone remotely — continue with local cleanup.
        continue;
      }
      console.warn('[sessions] delete failed:', error);
      return { ok: false, message: 'Could not delete session. Please try again.' };
    }
  }

  removeRecentSession(sessionId);
  removeCompletedSessionFromCache(sessionId);
  removeSessionStatsForSession(sessionId);
  removeImpactFeedForSession(sessionId);
  if (cached?.remoteSessionId && cached.remoteSessionId !== sessionId) {
    removeRecentSession(cached.remoteSessionId);
    removeSessionStatsForSession(cached.remoteSessionId);
    removeImpactFeedForSession(cached.remoteSessionId);
  }

  const tombstoneIds = new Set<string>([sessionId]);
  if (cached?.remoteSessionId) {
    tombstoneIds.add(cached.remoteSessionId);
  }
  if (cached?.endedAt) {
    tombstoneIds.add(`session-${cached.endedAt}`);
  }
  markVolunteerSessionsDeleted([...tombstoneIds]);

  return { ok: true };
}

export type BulkRemoveVolunteerSessionsResult = {
  deletedIds: string[];
  failed: { id: string; message: string }[];
};

/** Hard-deletes multiple volunteer sessions sequentially (same rules as single delete). */
export async function removeVolunteerSessions(
  sessions: { id: string; status: SessionApprovalStatus }[],
): Promise<BulkRemoveVolunteerSessionsResult> {
  const deletedIds: string[] = [];
  const failed: { id: string; message: string }[] = [];

  for (const session of sessions) {
    const result = await removeVolunteerSession(session.id, session.status);
    if (result.ok) {
      deletedIds.push(session.id);
    } else {
      failed.push({ id: session.id, message: result.message });
    }
  }

  return { deletedIds, failed };
}
