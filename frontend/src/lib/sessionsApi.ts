import { apiFetch, isApiConfigured } from './api';

export type ApiSessionStatus =
  | 'active'
  | 'under_review'
  | 'approved'
  | 'not_approved'
  | 'invalid';

export type ApiSession = {
  id: string;
  userId: string;
  activity: string | null;
  courtOrdered: boolean;
  description: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  distanceMiles: number | null;
  route: number[][] | null;
  status: ApiSessionStatus;
  /** Set when Admin declines — volunteer-facing; never includes private admin notes. */
  declineReason?: string | null;
  createdAt: string;
  checkpointCount?: number;
  photoCount?: number;
};

export type CreateSessionInput = {
  activity: string;
  courtOrdered: boolean;
  description: string;
  date: string;
};

export async function createSession(input: CreateSessionInput): Promise<{
  id: string;
  status: ApiSessionStatus;
  startedAt: string;
} | null> {
  if (!isApiConfigured) {
    return null;
  }

  return apiFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function addCheckpoint(
  sessionId: string,
  input: {
    selfiePath: string;
    progressPath: string;
    capturedAt: string;
    submittedEarly: boolean;
    /** WGS84 — preferred for admin/web-app trail photo pins. */
    latitude?: number | null;
    longitude?: number | null;
  },
): Promise<{ id: string } | null> {
  if (!isApiConfigured) {
    return null;
  }

  return apiFetch(`/sessions/${sessionId}/checkpoints`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function finalizeSession(
  sessionId: string,
  input: {
    endedAt: string;
    durationSeconds: number;
    distanceMiles: number;
    route: number[][];
    status?: ApiSessionStatus;
    /** Unpaid orientation End Session — server logs a 1-hour approved free hour. */
    skipOrientation?: boolean;
  },
): Promise<{ id: string; status: ApiSessionStatus } | null> {
  if (!isApiConfigured) {
    return null;
  }

  return apiFetch(`/sessions/${sessionId}/finalize`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

const LIST_PAGE_SIZE = 100;
const LIST_MAX_SESSIONS = 5000;

export async function listSessions(): Promise<ApiSession[]> {
  if (!isApiConfigured) {
    return [];
  }

  const all: ApiSession[] = [];
  let offset = 0;

  while (offset < LIST_MAX_SESSIONS) {
    const data = await apiFetch<{ sessions: ApiSession[] }>(
      `/sessions?limit=${LIST_PAGE_SIZE}&offset=${offset}`,
    );
    const page = data.sessions ?? [];
    all.push(...page);
    if (page.length < LIST_PAGE_SIZE) {
      break;
    }
    offset += LIST_PAGE_SIZE;
  }

  return all;
}

export async function getSession(sessionId: string): Promise<{
  session: ApiSession;
  checkpoints: Array<{
    id: string;
    selfiePath: string | null;
    progressPath: string | null;
    capturedAt: string | null;
    submittedEarly: boolean;
    latitude: number | null;
    longitude: number | null;
  }>;
} | null> {
  if (!isApiConfigured) {
    return null;
  }

  return apiFetch(`/sessions/${sessionId}`);
}

/** Hard-delete a session owned by the caller. Fails with 409 when already approved. */
export async function deleteSession(sessionId: string): Promise<boolean> {
  if (!isApiConfigured) {
    return false;
  }

  await apiFetch<void>(`/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  return true;
}
