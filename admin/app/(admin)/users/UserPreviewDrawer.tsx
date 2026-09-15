'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CourtBadge } from '@/components/ui/CourtBadge';
import { ChevronRightIcon, CloseIcon } from '@/components/ui/Icons';
import { formatDate } from '@/lib/format';
import type { UserRow } from './UsersClientShell';

/** Soft ease-out for scrim / content (Emil). */
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** Spring panel — keeps momentum when Escape interrupts mid-open. */
const DRAWER_SPRING = { type: 'spring' as const, stiffness: 320, damping: 34, mass: 0.85 };

function ProgressBar({ pct }: { pct: number }) {
  const clipped = Math.min(100, pct);
  const color = pct >= 100 ? '#007536' : pct >= 60 ? '#5a8f3a' : pct >= 30 ? '#835400' : '#ba1a1a';
  return (
    <div className="w-full bg-bg-surface-elevated rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full" style={{ width: `${clipped}%`, backgroundColor: color }} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-outline bg-bg-surface-elevated px-md py-sm">
      <p className="font-data text-[10px] uppercase tracking-[0.8px] text-text-tertiary">{label}</p>
      <p className="font-data text-[16px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}

export function UserPreviewDrawer({
  user,
  open,
  onClose,
}: {
  user: UserRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const prefersReduced = useReducedMotion() ?? false;
  /** Keep last user while exit animation runs (parent clears `user` on close). */
  const [heldUser, setHeldUser] = useState<UserRow | null>(user);

  useEffect(() => {
    if (user) setHeldUser(user);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const display = user ?? heldUser;
  const show = open && display != null;
  const courtPct =
    display?.requiredHours != null && display.requiredHours > 0 && display.completedHours != null
      ? (display.completedHours / display.requiredHours) * 100
      : null;

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
            key="user-preview-scrim"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={scrimTransition}
            className="fixed inset-0 z-[60] bg-[var(--color-overlay-scrim)]"
            aria-label="Close user preview"
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {show && display ? (
          <motion.aside
            key="user-preview-panel"
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
                <div className="min-w-0 flex items-start gap-md">
                  <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="font-heading text-[18px] text-primary">
                      {display.name[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p id={titleId} className="font-heading text-[20px] text-text-primary truncate">
                      {display.name}
                    </p>
                    <p className="font-body text-[13px] text-text-tertiary truncate">{display.email}</p>
                    <div className="mt-xs">
                      {display.courtOrdered ? (
                        <CourtBadge />
                      ) : (
                        <span className="inline-flex font-data text-[11px] font-semibold px-sm py-xs rounded-xs bg-[#f7fff1] text-primary">
                          Voluntary
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm text-text-tertiary hover:bg-bg-surface-elevated hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Close"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 min-h-0 overflow-y-auto px-lg py-lg flex flex-col gap-lg">
                <div className="grid grid-cols-2 gap-sm">
                  <Stat label="Sessions" value={String(display.sessions)} />
                  <Stat label="Hours" value={`${display.totalHours.toFixed(1)}h`} />
                  <Stat label="Joined" value={display.joinedAt ? formatDate(display.joinedAt) : '—'} />
                  <Stat
                    label="Last active"
                    value={display.lastActive ? formatDate(display.lastActive) : 'Never'}
                  />
                </div>

                {display.courtOrdered && (
                  <section>
                    <h3 className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">
                      Court progress
                    </h3>
                    <div className="rounded-md border border-border-outline bg-bg-surface-elevated p-md flex flex-col gap-sm">
                      {display.requiredHours != null && display.completedHours != null ? (
                        <>
                          <div className="flex items-baseline justify-between gap-sm">
                            <p className="font-data text-[18px] font-semibold text-text-primary">
                              {display.completedHours.toFixed(1)}
                              <span className="text-text-tertiary font-normal text-[13px]">
                                {' '}
                                / {display.requiredHours}h
                              </span>
                            </p>
                            {courtPct != null && (
                              <span className="font-data text-[12px] text-text-tertiary">
                                {Math.round(courtPct)}%
                              </span>
                            )}
                          </div>
                          {courtPct != null && <ProgressBar pct={courtPct} />}
                          {display.courtStatus && (
                            <p className="font-body text-[13px] text-text-tertiary capitalize">
                              Status: {display.courtStatus.replace('_', ' ')}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="font-body text-[13px] text-text-tertiary">
                          Court-ordered — hours not fully recorded yet.
                        </p>
                      )}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">
                    Contact
                  </h3>
                  <div className="rounded-md border border-border-outline divide-y divide-border-outline">
                    <div className="px-md py-sm flex justify-between gap-md">
                      <span className="font-data text-[12px] text-text-tertiary">Email</span>
                      <a
                        href={`mailto:${display.email}`}
                        className="font-body text-[13px] text-primary hover:underline truncate text-right"
                      >
                        {display.email}
                      </a>
                    </div>
                    <div className="px-md py-sm flex justify-between gap-md">
                      <span className="font-data text-[12px] text-text-tertiary">User ID</span>
                      <span className="font-data text-[12px] text-text-primary truncate text-right">
                        {display.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <footer className="shrink-0 border-t border-border-outline px-lg py-md flex flex-col gap-sm">
                <Link
                  href={`/volunteers/${display.id}`}
                  className="interactive h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors inline-flex items-center justify-center gap-sm"
                >
                  Open full profile
                  <ChevronRightIcon className="w-4 h-4" color="currentColor" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="interactive h-11 px-lg rounded-sm border border-border-outline bg-bg-surface font-data text-[13px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors"
                >
                  Close
                </button>
              </footer>
            </motion.div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
