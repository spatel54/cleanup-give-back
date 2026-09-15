'use client';

import { useState, useTransition } from 'react';
import { upsertCourtOrder, resetCourtOrderHours } from '@/actions/courtOrders';
import { InfoRow } from '@/components/ui/InfoRow';
import { formatDate } from '@/lib/mock-data';

function displayOrDash(value: string | null | undefined) {
  if (value == null) return '-';
  const trimmed = value.trim();
  return trimmed || '-';
}

/** Editable Court Order card - view mode mirrors the prior read-only `InfoRow` block,
 * edit mode is a small inline form that calls `upsertCourtOrder`. */
export function CourtOrderForm({
  userId,
  requiredHours,
  dueDate,
  caseReference,
  completedHours,
}: {
  userId: string;
  requiredHours: number | null;
  dueDate: string | null;
  caseReference: string | null;
  completedHours: number;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [resetPending, startResetTransition] = useTransition();
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [hoursInput, setHoursInput] = useState(requiredHours != null ? String(requiredHours) : '');
  const [dueDateInput, setDueDateInput] = useState(dueDate ?? '');
  const [caseRefInput, setCaseRefInput] = useState(caseReference ?? '');

  function handleResetHours() {
    startResetTransition(async () => {
      try {
        await resetCourtOrderHours(userId);
        setResetMessage('Hours reset to zero');
      } catch (err) {
        setResetMessage(err instanceof Error ? err.message : 'Failed to reset hours');
      }
    });
  }

  function handleSave() {
    const hours = parseFloat(hoursInput);
    if (Number.isNaN(hours) || hours < 0) {
      setMessage('Enter a valid number of required hours (e.g. 40)');
      return;
    }
    startTransition(async () => {
      try {
        await upsertCourtOrder({
          userId,
          requiredHours: hours,
          dueDate: dueDateInput.trim() || null,
          caseReference: caseRefInput.trim() || null,
        });
        setMessage('Saved');
        setEditing(false);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to save court order');
      }
    });
  }

  if (!editing) {
    return (
      <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md mb-lg">
        <div className="flex items-start justify-between gap-md">
          <dl className="flex-1 min-w-0">
            <InfoRow label="Required hours" value={requiredHours != null ? `${requiredHours}h` : '-'} />
            <InfoRow label="Completed hours (since last reset)" value={`${completedHours.toFixed(1)}h`} />
            <InfoRow label="Due date" value={dueDate ? formatDate(dueDate) : '-'} />
            <InfoRow label="Case reference" value={displayOrDash(caseReference)} />
          </dl>
          <div className="flex shrink-0 flex-col items-end gap-sm">
            <div className="flex gap-sm">
              <button
                type="button"
                onClick={handleResetHours}
                disabled={resetPending}
                className="h-9 px-md rounded-sm border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors disabled:opacity-50"
              >
                Reset hours
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setEditing(true);
                }}
                className="h-9 px-md rounded-sm border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors"
              >
                Edit
              </button>
            </div>
            {resetMessage && <p className="font-body text-[12px] text-text-tertiary">{resetMessage}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md mb-lg flex flex-col gap-md">
      <div className="flex flex-col gap-sm">
        <label className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">
          Required hours
        </label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={hoursInput}
          onChange={(e) => setHoursInput(e.target.value)}
          placeholder="e.g. 40"
          className="h-9 px-sm rounded-sm border border-border-outline font-body text-base text-text-primary focus:outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-col gap-sm">
        <label className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">
          Due date
        </label>
        <input
          type="date"
          value={dueDateInput}
          onChange={(e) => setDueDateInput(e.target.value)}
          className="h-9 px-sm rounded-sm border border-border-outline font-body text-base text-text-primary focus:outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-col gap-sm">
        <label className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">
          Case reference
        </label>
        <input
          type="text"
          value={caseRefInput}
          onChange={(e) => setCaseRefInput(e.target.value)}
          placeholder="e.g. 24-CV-01234"
          className="h-9 px-sm rounded-sm border border-border-outline font-body text-base text-text-primary focus:outline-none focus:border-primary"
        />
      </div>
      <div className="flex items-center gap-sm">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="h-9 px-md rounded-sm border border-border-outline bg-primary text-white font-data text-[12px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setMessage(null);
          }}
          disabled={isPending}
          className="h-9 px-md rounded-sm border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        {message && <p className="font-body text-[12px] text-text-tertiary">{message}</p>}
      </div>
    </div>
  );
}
