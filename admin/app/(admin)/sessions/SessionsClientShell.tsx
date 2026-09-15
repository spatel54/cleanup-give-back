'use client';

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { StatusChip } from '@/components/ui/StatusChip';
import { CourtBadge } from '@/components/ui/CourtBadge';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@/components/ui/Icons';
import { AdminSearchBar } from '@/components/ui/AdminSearchBar';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDate, formatDuration, formatMiles, shortId } from '@/lib/format';
import { approveSession, declineSession } from '@/actions/sessions';
import type { Session, SessionStatus } from '@/types/database';
import { motion } from 'framer-motion';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'not_approved', label: 'Declined' },
];

type SessionWithVolunteer = Session & { volunteer_name: string };

interface Props {
  sessions: SessionWithVolunteer[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  currentStatus: string;
  currentQ: string;
  courtOnly: boolean;
  sort: string;
  from: string;
  to: string;
  isMock?: boolean;
}

export function SessionsClientShell({
  sessions: initialSessions,
  totalCount,
  totalPages,
  currentPage,
  currentStatus,
  currentQ,
  courtOnly,
  sort,
  from,
  to,
  isMock = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [sessions, setSessions] = useState(initialSessions);
  const { pushToast } = useToast();

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  function updateParams(updates: Record<string, string>) {
    const sp = new URLSearchParams();
    if (currentStatus !== 'all') sp.set('status', currentStatus);
    if (currentQ) sp.set('q', currentQ);
    if (courtOnly) sp.set('court', '1');
    if (sort !== 'newest') sp.set('sort', sort);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    sp.set('page', '1');
    Object.entries(updates).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  function updateLocalStatus(id: string, status: SessionStatus) {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-sm mb-lg">
        <AdminSearchBar
          value={currentQ}
          onChange={(v) => updateParams({ q: v })}
          placeholder="Search by volunteer, activity, or ID…"
          className="w-full sm:w-64"
        />
        
        <label className="inline-flex flex-col gap-xs">
          <span className="font-data text-[11px] text-text-tertiary tracking-[0.88px] uppercase">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => updateParams({ from: e.target.value })}
            className="h-11 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] text-text-primary focus:outline-none focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </label>

        <label className="inline-flex flex-col gap-xs">
          <span className="font-data text-[11px] text-text-tertiary tracking-[0.88px] uppercase">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => updateParams({ to: e.target.value })}
            className="h-11 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] text-text-primary focus:outline-none focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </label>

        <div
          className="flex items-center gap-xs overflow-x-auto"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={currentStatus === f.value}
              onClick={() => updateParams({ status: f.value === 'all' ? '' : f.value, page: '1' })}
              className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                currentStatus === f.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-sm min-h-11 cursor-pointer">
          <input
            type="checkbox"
            checked={courtOnly}
            onChange={(e) => updateParams({ court: e.target.checked ? '1' : '' })}
            className="w-4 h-4 accent-primary"
          />
          <span className="font-data text-[12px] font-semibold text-text-tertiary">Court-ordered only</span>
        </label>

        <label className="relative inline-flex items-center min-h-11">
          <span className="sr-only">Sort sessions</span>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            aria-label="Sort sessions"
            className="min-h-11 appearance-none pl-md pr-xl rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] text-text-primary leading-none focus:outline-none focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <ChevronDownIcon
            className="pointer-events-none absolute right-md top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary"
            aria-hidden
          />
        </label>

        <span className="ml-auto font-body text-[14px] text-text-tertiary self-end h-11 inline-flex items-center">
          {totalCount} session{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-outline bg-bg-surface-elevated">
                {['Date', 'Volunteer', 'Activity', 'Duration', 'Distance', 'Status', 'Court', 'Actions'].map((h) => (
                  <th key={h} className="px-lg py-sm font-data text-[12px] font-medium tracking-[0.96px] text-text-tertiary uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-outline">
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-lg py-xl text-center">
                    <p className="font-body text-base text-text-tertiary mb-md">
                      No sessions found.
                    </p>
                    {(currentStatus !== 'all' || currentQ || courtOnly || from || to) && (
                      <button
                        onClick={() => {
                          const sp = new URLSearchParams();
                          startTransition(() => router.push(`${pathname}?${sp.toString()}`));
                        }}
                        className="font-data text-[12px] text-primary hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isMock={isMock}
                  onLocalStatusChange={updateLocalStatus}
                  onToast={pushToast}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-border-outline">
          {sessions.length === 0 && (
            <div className="px-lg py-xl text-center">
              <p className="font-body text-base text-text-tertiary mb-md">No sessions found.</p>
              {(currentStatus !== 'all' || currentQ || courtOnly || from || to) && (
                <button
                  onClick={() => {
                    const sp = new URLSearchParams();
                    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
                  }}
                  className="font-data text-[12px] text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-md mt-lg">
          {currentPage > 1 && (
            <button
              onClick={() => updateParams({ page: String(currentPage - 1) })}
              className="h-9 px-md rounded-sm border border-border-outline font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-2"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
              Previous
            </button>
          )}
          <span className="font-data text-[12px] text-text-tertiary">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <button
              onClick={() => updateParams({ page: String(currentPage + 1) })}
              className="h-9 px-md rounded-sm border border-border-outline font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-2"
            >
              Next
              <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type ToastFn = (toast: { message: string; kind: 'success' | 'error' | 'info' }) => string;

function SessionRow({
  session,
  isMock,
  onLocalStatusChange,
  onToast,
}: {
  session: SessionWithVolunteer;
  isMock: boolean;
  onLocalStatusChange: (id: string, status: SessionStatus) => void;
  onToast: ToastFn;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const canModerate = session.status === 'under_review';

  function closeMenu() {
    setMenuOpen(false);
    setMenuPos(null);
  }

  function closeDecline() {
    setShowDecline(false);
    setDeclineReason('');
  }

  useLayoutEffect(() => {
    if (!menuOpen || !buttonRef.current) {
      setMenuPos(null);
      return;
    }
    function place() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const menuWidth = 256;
      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8,
      );
      setMenuPos({ top: rect.bottom + 4, left });
    }
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!showDecline) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDecline();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showDecline]);

  function handleApprove() {
    startTransition(async () => {
      if (isMock) {
        onLocalStatusChange(session.id, 'approved');
        onToast({ message: 'Approved (demo — not saved)', kind: 'success' });
        closeMenu();
        return;
      }
      try {
        await approveSession(session.id);
        closeMenu();
      } catch (err) {
        onToast({ message: err instanceof Error ? err.message : 'Approve failed', kind: 'error' });
      }
    });
  }

  function handleDecline() {
    startTransition(async () => {
      if (isMock) {
        onLocalStatusChange(session.id, 'not_approved');
        onToast({ message: 'Declined (demo — not saved)', kind: 'info' });
        closeDecline();
        return;
      }
      try {
        await declineSession(session.id, declineReason || undefined);
        closeDecline();
      } catch (err) {
        onToast({ message: err instanceof Error ? err.message : 'Decline failed', kind: 'error' });
      }
    });
  }

  const actionsMenu =
    menuOpen && menuPos
      ? createPortal(
          <motion.div
            ref={menuRef}
            role="menu"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="fixed z-[80] w-64 bg-bg-surface border border-border-outline rounded-md p-sm shadow-bar-top"
            style={{ top: menuPos.top, left: menuPos.left, transformOrigin: 'top right' }}
          >
            <div className="flex flex-col gap-xs">
              <button
                type="button"
                role="menuitem"
                onClick={handleApprove}
                disabled={isPending}
                className="w-full text-left h-9 px-sm rounded-sm text-primary font-data text-[12px] font-semibold hover:bg-[#f7fff1] transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  setShowDecline(true);
                }}
                disabled={isPending}
                className="w-full text-left h-9 px-sm rounded-sm text-[#ba1a1a] font-data text-[12px] font-semibold hover:bg-[#ffd9de] transition-colors disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </motion.div>,
          document.body,
        )
      : null;

  const declineModal =
    showDecline
      ? createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`decline-title-${session.id}`}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[var(--color-overlay-scrim)]"
              aria-label="Cancel decline"
              onClick={closeDecline}
            />
            <div className="relative w-full max-w-md rounded-md bg-bg-surface border border-border-outline p-lg shadow-bar-top">
              <h3
                id={`decline-title-${session.id}`}
                className="font-heading text-[20px] text-text-primary mb-sm"
              >
                Decline session
              </h3>
              <p className="font-body text-[13px] text-text-tertiary mb-sm">
                {session.volunteer_name} · {session.activity ?? 'Cleanup session'}
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason (optional)"
                rows={3}
                autoFocus
                className="w-full rounded-sm border border-border-outline bg-bg-app px-md py-sm font-body text-[14px] mb-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary resize-none"
              />
              <div className="flex gap-sm justify-end">
                <button
                  type="button"
                  onClick={closeDecline}
                  className="h-9 px-md font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isPending}
                  className="h-9 px-md font-data text-[12px] font-semibold bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] rounded-sm hover:bg-[#ffc5ca] transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Declining…' : 'Decline'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <tr className="table-row-hover transition-colors">
      <td className="px-lg py-md font-body text-[14px] text-text-tertiary whitespace-nowrap">
        {formatDate(session.started_at)}
      </td>
      <td className="px-lg py-md">
        {isMock ? (
          <span className="font-body text-[14px] font-medium text-text-primary whitespace-nowrap">
            {session.volunteer_name}
          </span>
        ) : (
          <Link
            href={`/volunteers/${session.user_id}`}
            className="font-body text-[14px] font-medium text-text-primary hover:text-primary hover:underline whitespace-nowrap"
          >
            {session.volunteer_name}
          </Link>
        )}
      </td>
      <td className="px-lg py-md">
        <Link href={`/sessions/${session.id}`} className="font-body text-base text-text-primary hover:text-primary hover:underline">
          {session.activity ?? '—'}
        </Link>
        <p className="font-data text-[11px] text-text-tertiary">{shortId(session.id)}</p>
      </td>
      <td className="px-lg py-md font-body text-[14px] text-text-primary whitespace-nowrap">
        {formatDuration(session.duration_seconds, session.adjusted_hours)}
      </td>
      <td className="px-lg py-md font-body text-[14px] text-text-tertiary whitespace-nowrap">
        {formatMiles(session.distance_miles)}
      </td>
      <td className="px-lg py-md">
        <StatusChip status={session.status} />
      </td>
      <td className="px-lg py-md text-center">
        {session.court_ordered && <CourtBadge />}
      </td>
      <td className="px-lg py-md">
        <div className="flex items-center gap-sm">
          {canModerate && (
            <>
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                disabled={isPending}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="h-8 px-sm rounded-sm border border-border-outline bg-bg-surface text-text-primary font-data text-[11px] font-semibold hover:bg-bg-surface-elevated transition-colors disabled:opacity-50 inline-flex items-center gap-xs"
              >
                Actions
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {actionsMenu}
              {declineModal}
            </>
          )}
          <Link href={`/sessions/${session.id}`} className="h-8 px-sm rounded-sm border border-border-outline text-text-tertiary font-data text-[11px] font-semibold hover:bg-bg-surface-elevated transition-colors flex items-center">
            View
          </Link>
        </div>
      </td>
    </tr>
  );
}

function SessionCard({ session }: { session: SessionWithVolunteer }) {
  return (
    <Link href={`/sessions/${session.id}`} className="block px-lg py-md table-row-hover transition-colors">
      <div className="flex items-start justify-between gap-md mb-sm">
        <div>
          <p className="font-body text-base font-medium text-text-primary">{session.activity ?? 'Cleanup session'}</p>
          <p className="font-body text-[14px] text-text-tertiary">
            {session.volunteer_name} · {formatDate(session.started_at)}
          </p>
        </div>
        <StatusChip status={session.status} />
      </div>
      <div className="flex items-center gap-lg text-[14px] text-text-tertiary font-body">
        <span>{formatDuration(session.duration_seconds, session.adjusted_hours)}</span>
        <span>{formatMiles(session.distance_miles)}</span>
        {session.court_ordered && <CourtBadge />}
      </div>
    </Link>
  );
}
