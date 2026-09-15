'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangleIcon, CloseIcon } from '@/components/ui/Icons';
import type { RedFlag } from '@/lib/session-red-flags';

/**
 * Advisory badge for the checklist's "Quick red-flag bundle" - never a bare
 * "SUSPICIOUS" label (the checklist warns "One red flag ≠ decline"). Hover
 * shows a short why; click opens a modal with the full explanation.
 */
export function RedFlagBadge({ flags, className = '' }: { flags: RedFlag[]; className?: string }) {
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeHoverTimer = useRef<number | null>(null);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ top: number; left: number } | null>(null);

  const sessionFlags = flags.filter((f) => f.scope === 'session');
  const volunteerFlags = flags.filter((f) => f.scope === 'volunteer');

  function clearHoverTimer() {
    if (closeHoverTimer.current != null) {
      window.clearTimeout(closeHoverTimer.current);
      closeHoverTimer.current = null;
    }
  }

  function placeHover() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 320;
    const gap = 8;
    let left = rect.left;
    if (left + width > window.innerWidth - 16) {
      left = window.innerWidth - width - 16;
    }
    if (left < 16) left = 16;
    setHoverPos({ top: rect.bottom + gap, left });
  }

  function openHover() {
    if (modalOpen) return;
    clearHoverTimer();
    placeHover();
    setHoverOpen(true);
  }

  function scheduleCloseHover() {
    clearHoverTimer();
    closeHoverTimer.current = window.setTimeout(() => setHoverOpen(false), 140);
  }

  function openModal() {
    clearHoverTimer();
    setHoverOpen(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  useEffect(() => {
    return () => clearHoverTimer();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  if (flags.length === 0) return null;

  const countLabel = `${flags.length} flag${flags.length === 1 ? '' : 's'} to review`;

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={openModal}
        onMouseEnter={openHover}
        onMouseLeave={scheduleCloseHover}
        onFocus={openHover}
        onBlur={scheduleCloseHover}
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap bg-status-pending-bg text-status-pending-text border-status-pending-border hover:brightness-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0" color="currentColor" />
        {countLabel}
      </button>

      {hoverOpen && !modalOpen && hoverPos && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="tooltip"
              onMouseEnter={openHover}
              onMouseLeave={scheduleCloseHover}
              className="fixed z-[80] w-80 rounded-md border border-status-pending-border bg-bg-surface px-md py-sm shadow-bar-top"
              style={{ top: hoverPos.top, left: hoverPos.left }}
            >
              <FlagGroups
                sessionFlags={sessionFlags}
                volunteerFlags={volunteerFlags}
                compact
              />
              <p className="font-body text-[11px] text-text-tertiary mt-sm pt-sm border-t border-border-outline">
                Click for details. Signals only - check the evidence before deciding.
              </p>
            </div>,
            document.body,
          )
        : null}

      {modalOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-lg"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <button
                type="button"
                className="absolute inset-0 bg-[var(--color-overlay-scrim)]"
                aria-label="Close flags"
                onClick={closeModal}
              />
              <div className="relative w-full max-w-md max-h-[min(36rem,calc(100vh-2rem))] overflow-y-auto rounded-md bg-bg-surface border border-border-outline p-lg shadow-bar-top">
                <div className="flex items-start justify-between gap-md mb-sm">
                  <div className="min-w-0">
                    <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-xs">
                      Review checklist
                    </p>
                    <h3 id={titleId} className="font-heading text-[20px] leading-[28px] text-text-primary">
                      {countLabel}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm text-text-tertiary hover:bg-bg-surface-elevated hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    aria-label="Close"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-body text-[13px] leading-[18px] text-text-tertiary mb-md">
                  These are prompts to look closer, not a decline. One flag does not mean the session is bad.
                </p>
                <FlagGroups
                  sessionFlags={sessionFlags}
                  volunteerFlags={volunteerFlags}
                  compact={false}
                />
                <div className="flex justify-end mt-md">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-9 px-md font-data text-[12px] font-semibold bg-primary text-white rounded-sm hover:bg-primary-hover transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

function FlagGroups({
  sessionFlags,
  volunteerFlags,
  compact,
}: {
  sessionFlags: RedFlag[];
  volunteerFlags: RedFlag[];
  compact: boolean;
}) {
  const showSessionHeading = sessionFlags.length > 0 && volunteerFlags.length > 0;
  const showVolunteerHeading = volunteerFlags.length > 0;

  return (
    <div className="flex flex-col gap-sm">
      {sessionFlags.length > 0 && (
        <section>
          {showSessionHeading ? (
            <p className="font-data text-[11px] font-semibold tracking-[0.64px] uppercase text-text-tertiary mb-xs">
              This session
            </p>
          ) : null}
          <ul className="flex flex-col gap-sm">
            {sessionFlags.map((flag) => (
              <FlagItem key={flag.key} flag={flag} compact={compact} />
            ))}
          </ul>
        </section>
      )}
      {volunteerFlags.length > 0 && (
        <section>
          {showVolunteerHeading ? (
            <p className="font-data text-[11px] font-semibold tracking-[0.64px] uppercase text-text-tertiary mb-xs">
              This volunteer
            </p>
          ) : null}
          <ul className="flex flex-col gap-sm">
            {volunteerFlags.map((flag) => (
              <FlagItem key={flag.key} flag={flag} compact={compact} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FlagItem({ flag, compact }: { flag: RedFlag; compact: boolean }) {
  return (
    <li
      className={
        compact
          ? 'flex flex-col gap-xs'
          : 'rounded-sm border border-status-pending-border bg-status-pending-bg/40 px-sm py-sm'
      }
    >
      <p className="font-body text-[13px] font-semibold leading-[18px] text-text-primary">{flag.label}</p>
      <p
        className={`font-body text-[12px] leading-[16px] text-text-tertiary ${compact ? 'line-clamp-2' : ''}`}
      >
        {flag.explanation}
      </p>
      {!compact ? (
        <p className="font-body text-[12px] leading-[16px] text-text-primary mt-xs">
          <span className="font-semibold">Look at: </span>
          {flag.lookAt}
        </p>
      ) : null}
    </li>
  );
}
