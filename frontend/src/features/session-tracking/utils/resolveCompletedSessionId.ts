/** Stable local id for a completed session snapshot (matches cache + recent sessions list). */
export function resolveCompletedSessionId(snapshot: {
  remoteSessionId: string | null;
  endedAt: number;
}): string {
  return snapshot.remoteSessionId ?? `session-${snapshot.endedAt}`;
}
