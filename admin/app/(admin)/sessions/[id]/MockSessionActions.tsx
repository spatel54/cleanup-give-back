'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { useToast } from '@/components/ui/ToastProvider';
import type { SessionStatus } from '@/types/database';

interface Props {
  volunteerName: string;
  initialStatus: SessionStatus;
}

/**
 * Mock preview counterpart to `SessionActions` — approve/decline update local
 * state + toast only, since fixture sessions have no row to mutate.
 */
export function MockSessionActions({ volunteerName, initialStatus }: Props) {
  const [status, setStatus] = useState<SessionStatus>(initialStatus);
  const { pushToast } = useToast();

  const canApprove = status !== 'approved';
  const canDecline = status !== 'not_approved';

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-lg sticky top-6">
      <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Admin Actions</h2>

      <div className="flex items-center justify-between gap-md rounded-sm border border-border-outline bg-bg-surface-elevated px-md py-sm">
        <span className="font-data text-[12px] text-text-tertiary uppercase tracking-[0.5px]">Status</span>
        <StatusChip status={status} />
      </div>

      <div className="flex flex-col gap-sm">
        {canApprove && (
          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={() => {
              setStatus('approved');
              pushToast({ kind: 'success', message: `Approved ${volunteerName}` });
            }}
          >
            Approve
          </Button>
        )}
        {canDecline && (
          <Button
            variant="danger"
            className="w-full justify-center"
            onClick={() => {
              setStatus('not_approved');
              pushToast({ kind: 'info', message: `Declined ${volunteerName}` });
            }}
          >
            Decline
          </Button>
        )}
      </div>
    </div>
  );
}
