export type SessionHoldInput = {
  id: string;
  courtOrdered: boolean;
};

export function shouldRetainCourtRecords(
  sessions: SessionHoldInput[],
  hasCourtOrderRow: boolean,
): boolean {
  return hasCourtOrderRow || sessions.some((session) => session.courtOrdered);
}

export function partitionSessionsForDeletion(
  sessions: SessionHoldInput[],
  retainCourtRecords: boolean,
): { retainIds: string[]; deleteIds: string[] } {
  if (!retainCourtRecords) {
    return {
      retainIds: [],
      deleteIds: sessions.map((session) => session.id),
    };
  }

  const retainIds: string[] = [];
  const deleteIds: string[] = [];
  for (const session of sessions) {
    if (session.courtOrdered) {
      retainIds.push(session.id);
    } else {
      deleteIds.push(session.id);
    }
  }
  return { retainIds, deleteIds };
}
