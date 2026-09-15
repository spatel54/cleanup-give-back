'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { upsertCourtOrder } from '@/actions/courtOrders';

type CourtOrderFormProps = {
  userId: string;
  requiredHours: number | null;
  dueDate: string | null;
  caseReference: string | null;
};

export function CourtOrderForm({ userId, requiredHours, dueDate, caseReference }: CourtOrderFormProps) {
  const [hours, setHours] = useState(requiredHours?.toString() ?? '');
  const [date, setDate] = useState(dueDate ?? '');
  const [caseRef, setCaseRef] = useState(caseReference ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      setError('Required hours must be a positive number');
      return;
    }

    startTransition(async () => {
      try {
        await upsertCourtOrder({
          userId,
          requiredHours: parsedHours,
          dueDate: date.trim() || null,
          caseReference: caseRef.trim() || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save court order');
      }
    });
  };

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md p-lg mb-xl">
      <h3 className="font-heading text-[16px] leading-[24px] text-text-primary mb-md">
        Edit Court Order
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label htmlFor="required-hours" className="block font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
              Required Hours *
            </label>
            <input
              id="required-hours"
              type="number"
              step="0.1"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
              className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface text-text-primary font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="due-date" className="block font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
              Due Date
            </label>
            <input
              id="due-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface text-text-primary font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label htmlFor="case-reference" className="block font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
            Case Reference
          </label>
          <input
            id="case-reference"
            type="text"
            value={caseRef}
            onChange={(e) => setCaseRef(e.target.value)}
            placeholder="e.g. 2026-CR-1234"
            className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface text-text-primary font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        {error && (
          <div className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-md py-sm rounded-sm font-body text-[13px]">
            {error}
          </div>
        )}
        <div>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? 'Saving...' : 'Save Court Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}
