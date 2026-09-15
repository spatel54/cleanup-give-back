'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CourtBadge } from '@/components/ui/CourtBadge';
import { ChevronRightIcon } from '@/components/ui/Icons';
import type { ReviewableSession } from '@/components/dashboard/types';

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const DRAWER_SPRING = { type: 'spring' as const, stiffness: 320, damping: 34, mass: 0.85 };

interface ReviewDrawerProps {
  open: boolean;
  session: ReviewableSession | null;
  queue: ReviewableSession[];
  isMock: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onDeclineRequest: (id: string) => void;
  busyId: string | null;
}

export function ReviewDrawer({
  open,
  session,
  queue,
  isMock: _isMock,
  onClose,
  onSelect,
  onApprove,
  onDeclineRequest,
  busyId,
}: ReviewDrawerProps) {
  const titleId = useId();
  const prefersReduced = useReducedMotion() ?? false;
  const [step, setStep] = useState<'summary' | 'decide'>('summary');
  const [heldSession, setHeldSession] = useState<ReviewableSession | null>(session);

  useEffect(() => {
    if (session) setHeldSession(session);
  }, [session]);

  useEffect(() => {
    if (open) setStep('summary');
  }, [open, session?.id]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!session) return;
      const idx = queue.findIndex((s) => s.id === session.id);
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const next = queue[idx + 1];
        if (next) onSelect(next.id);
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const prev = queue[idx - 1];
        if (prev) onSelect(prev.id);
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onApprove(session.id);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onDeclineRequest(session.id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, session, queue, onClose, onSelect, onApprove, onDeclineRequest]);

  const display = session ?? heldSession;
  const show = open && display != null;

  const hours = display
    ? display.adjusted_hours != null
      ? `${display.adjusted_hours.toFixed(1)}h`
      : display.duration_seconds
        ? `${(display.duration_seconds / 3600).toFixed(1)}h`
        : '—'
    : '—';

  const panelTransition = prefersReduced ? { duration: 0 } : DRAWER_SPRING;
  const scrimTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.4, ease: EASE_OUT };
  const contentTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.4, delay: 0.06, ease: EASE_OUT };

  return (
    <>
      <AnimatePresence>
        {show ? (
          <motion.button
            key="review-drawer-scrim"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={scrimTransition}
            className="fixed inset-0 z-[60] bg-[var(--color-overlay-scrim)]"
            aria-label="Close review panel"
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {show && display ? (
          <motion.aside
            key="review-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={prefersReduced ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={prefersReduced ? undefined : { x: '100%' }}
            transition={panelTransition}
            className="fixed inset-y-0 right-0 z-[61] w-full max-w-md h-full bg-bg-surface border-l border-border-outline shadow-bar-top flex flex-col will-change-transform"
          >
            <motion.div
              className="flex flex-col h-full min-h-0"
              initial={prefersReduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={contentTransition}
            >
              <header className="px-lg py-md border-b border-border-outline flex items-start justify-between gap-md shrink-0">
                <div className="min-w-0">
                  <p id={titleId} className="font-heading text-[20px] text-text-primary truncate">
                    {display.volunteer_name}
                  </p>
                  <p className="font-body text-[13px] text-text-tertiary truncate">
                    {display.activity ?? 'Cleanup session'} · {display.ageLabel}
                  </p>
                  <div className="flex items-center gap-md">
                    <Link
                      href={`/volunteers/${display.user_id}`}
                      className="font-data text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-2"
                    >
                      View profile
                      <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
                    </Link>
                    <Link
                      href={`/sessions/${display.id}`}
                      className="font-data text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-2"
                    >
                      Open full session
                      <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
                    </Link>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Close"
                >
                  ×
                </button>
              </header>

              <div className="px-lg py-sm border-b border-border-outline flex gap-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setStep('summary')}
                  className={`min-h-11 px-md rounded-sm font-data text-[12px] font-semibold ${
                    step === 'summary' ? 'bg-[#f7fff1] text-primary' : 'text-text-tertiary'
                  }`}
                >
                  1. Summary
                </button>
                <button
                  type="button"
                  onClick={() => setStep('decide')}
                  className={`min-h-11 px-md rounded-sm font-data text-[12px] font-semibold ${
                    step === 'decide' ? 'bg-[#f7fff1] text-primary' : 'text-text-tertiary'
                  }`}
                >
                  2. Decide
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-lg py-lg flex flex-col gap-lg">
                {step === 'summary' ? (
                  <>
                    <div className="grid grid-cols-2 gap-md">
                      <Stat label="Duration" value={hours} />
                      <Stat
                        label="Distance"
                        value={
                          display.distance_miles != null
                            ? `${display.distance_miles.toFixed(1)} mi`
                            : '—'
                        }
                      />
                      <Stat label="Type" value={display.court_ordered ? <CourtBadge /> : 'Voluntary'} />
                      <Stat label="Submitted" value={display.ageLabel} />
                    </div>
                    <div>
                      <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-sm">
                        Evidence
                      </p>
                      <div className="grid grid-cols-2 gap-sm">
                        <div className="aspect-[3/4] rounded-md bg-bg-surface-elevated border border-border-outline flex items-center justify-center font-body text-[12px] text-text-tertiary">
                          Selfie
                        </div>
                        <div className="aspect-[3/4] rounded-md bg-bg-surface-elevated border border-border-outline flex items-center justify-center font-body text-[12px] text-text-tertiary">
                          Progress
                        </div>
                      </div>
                    </div>
                    <Button type="button" onClick={() => setStep('decide')}>
                      Continue to decide
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="font-body text-[14px] text-text-tertiary">
                      Keyboard: <kbd className="font-data">J</kbd>/<kbd className="font-data">K</kbd>{' '}
                      next/prev · <kbd className="font-data">A</kbd> approve ·{' '}
                      <kbd className="font-data">D</kbd> decline · <kbd className="font-data">Esc</kbd>{' '}
                      close
                    </p>
                    <div className="flex flex-col gap-sm">
                      <Button
                        type="button"
                        disabled={busyId === display.id}
                        onClick={() => onApprove(display.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={busyId === display.id}
                        onClick={() => onDeclineRequest(display.id)}
                      >
                        Decline…
                      </Button>
                      <Button type="button" variant="ghost" onClick={onClose}>
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-border-outline bg-bg-surface-elevated px-md py-sm">
      <p className="font-data text-[10px] uppercase tracking-[0.8px] text-text-tertiary">{label}</p>
      <p className="font-data text-[14px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}
