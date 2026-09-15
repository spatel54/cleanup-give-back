import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import {
  isCheckpointDueOrGrace,
  subscribeLiveSession,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import { alertPhotoCheckpointDue } from '@/utils/photoCheckpointAlert';

/** Repeat cadence for sound + haptics while a checkpoint is due/overdue — same
 * whether the modal is still showing or the user has dismissed it once. */
const CHECKPOINT_ALERT_REPEAT_INTERVAL_MS = 5_000;

/** Routes where the photo-checkpoint prompt is already on screen (or being acted on) —
 * never yank the user away from these, and never re-prompt once a photo is submitted. */
const CHECKPOINT_PROMPT_ROUTES = new Set([
  '/photo-checkpoint',
  '/photo-capture',
  '/photo-submitted',
  '/submission-confirmation',
]);

/**
 * Escalating sound + haptics while a checkpoint is due or in grace.
 * Every alert re-summons the "Take Photo" modal — it must not stay dismissed
 * while the audio keeps playing. If the user is minimized elsewhere (not on
 * the live tracker), the alert first brings them back to /live-session so the
 * modal has the real tracker underneath it instead of whatever tab they left
 * open — "Back to tracker" then naturally lands on the tracker, not the tab.
 */
export function CheckpointAlertLoop() {
  const { isActive, photosEnabled } = useLiveSession();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (!isActive || !photosEnabled) {
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    let wasDueOrGrace = false;

    const fireAlert = () => {
      void alertPhotoCheckpointDue();
      if (!CHECKPOINT_PROMPT_ROUTES.has(pathnameRef.current)) {
        const wasMinimized = pathnameRef.current !== '/live-session';
        // Deferred a tick — this runs synchronously inside the live-session
        // store's notify() broadcast (setInterval -> setState -> notify), and
        // navigating mid-broadcast can throw depending on router state. That
        // throw used to abort the broadcast for every other subscriber too.
        setTimeout(() => {
          try {
            // Minimized elsewhere — stack the tracker underneath the modal
            // first, so dismissing the modal reveals the tracker, not the tab.
            if (wasMinimized) {
              router.push('/live-session');
            }
            router.push('/photo-checkpoint');
          } catch (error) {
            console.error('[CheckpointAlertLoop] router.push failed:', error);
          }
        }, 0);
      }
    };

    const armInterval = () => {
      if (interval) {
        return;
      }
      interval = setInterval(() => {
        if (isCheckpointDueOrGrace()) {
          fireAlert();
        }
      }, CHECKPOINT_ALERT_REPEAT_INTERVAL_MS);
    };

    const sync = () => {
      const dueOrGrace = isCheckpointDueOrGrace();

      if (!dueOrGrace) {
        wasDueOrGrace = false;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        return;
      }

      if (!wasDueOrGrace) {
        wasDueOrGrace = true;
        fireAlert();
      }

      armInterval();
    };

    sync();
    const unsubscribe = subscribeLiveSession(sync);

    return () => {
      unsubscribe();
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, photosEnabled, router]);

  return null;
}
