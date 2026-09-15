'use client';

import { useState, useTransition } from 'react';
import { notifyAtRiskVolunteers, type NotifyAtRiskResult } from '@/actions/events';
import { MailIcon } from '@/components/ui/Icons';

export type NotifyCandidate = {
  id: string;
  name: string;
  email: string | null;
  remainingHours: number;
  lastNotifiedAt?: string | null;
};

export function NotifyAtRiskVolunteers({
  eventId,
  candidates,
}: {
  eventId: string;
  candidates: NotifyCandidate[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(candidates.filter((c) => c.email).map((c) => c.id)),
  );
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<NotifyAtRiskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (candidates.length === 0) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSend() {
    if (selected.size === 0) return;
    const count = selected.size;
    if (!window.confirm(`Send this event to ${count} at-risk volunteer${count !== 1 ? 's' : ''}?`)) return;

    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await notifyAtRiskVolunteers(eventId, [...selected]);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send notifications');
      }
    });
  }

  return (
    <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
      <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-xs">Notify at-risk volunteers</h2>
      <p className="font-body text-[13px] text-text-tertiary mb-md">
        Email this event to court-ordered volunteers who are behind on hours.
      </p>

      <ul role="list" className="flex flex-col gap-xs mb-md max-h-64 overflow-y-auto">
        {candidates.map((c) => (
          <li key={c.id}>
            <label
              className={`flex items-center gap-sm px-sm py-xs rounded-sm ${
                c.email ? 'cursor-pointer hover:bg-bg-app' : 'opacity-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                disabled={!c.email}
                onChange={() => toggle(c.id)}
                className="w-4 h-4 accent-primary shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-body text-[13px] text-text-primary truncate">{c.name}</span>
                <span className="block font-data text-[11px] text-text-tertiary truncate">
                  {c.email ?? 'No email on file'} · {c.remainingHours.toFixed(1)}h remaining
                  {c.lastNotifiedAt
                    ? ` · emailed ${new Date(c.lastNotifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : ''}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={pending || selected.size === 0}
        onClick={handleSend}
        className="interactive w-full h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-sm"
      >
        <MailIcon className="w-4 h-4" aria-hidden />
        {pending ? 'Sending…' : `Notify ${selected.size} volunteer${selected.size !== 1 ? 's' : ''}`}
      </button>

      {error && (
        <p role="alert" className="mt-sm font-body text-[13px] text-[#ba1a1a]">
          {error}
        </p>
      )}
      {result && (
        <p role="status" className="mt-sm font-body text-[13px] text-primary">
          Sent {result.sent}
          {result.skippedNoEmail > 0 ? `, skipped ${result.skippedNoEmail} (no email on file)` : ''}
          {result.failed > 0 ? `, ${result.failed} failed to send` : ''}.
        </p>
      )}
    </section>
  );
}
