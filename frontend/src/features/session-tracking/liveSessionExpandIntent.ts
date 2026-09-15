let expandFromHome = false;

/** Marks the next `/live-session` push as an expand-from-home (map wipe + pill exit). */
export function markLiveSessionExpandFromHome(): void {
  expandFromHome = true;
}

/** Returns and clears the expand-from-home flag. */
export function consumeLiveSessionExpandFromHome(): boolean {
  const value = expandFromHome;
  expandFromHome = false;
  return value;
}
