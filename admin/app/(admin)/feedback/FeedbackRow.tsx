'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { flagFeedback } from '@/actions/feedback';

type FeedbackWithVolunteer = {
  id: string;
  user_id: string | null;
  rating: string | null;
  comment: string | null;
  flagged: boolean;
  submitted_at: string;
  volunteer_name?: string;
  volunteer_email?: string;
  activity?: string;
};

interface Props {
  feedback: FeedbackWithVolunteer;
  emojiMap: Record<string, { emoji: string; label: string; score: number; color: string }>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function FeedbackRow({ feedback: fb, emojiMap }: Props) {
  const [flagged, setFlagged] = useState(fb.flagged);
  const [isPending, startTransition] = useTransition();
  const meta = emojiMap[fb.rating ?? 'neutral'];

  function handleToggleFlag() {
    startTransition(async () => {
      try {
        await flagFeedback(fb.id, !flagged);
        setFlagged(!flagged);
      } catch (err) {
        console.error('Failed to toggle flag:', err);
      }
    });
  }

  const volunteerName = fb.volunteer_name || 'Unknown';

  return (
    <div
      className={`bg-bg-surface border rounded-md p-lg ${
        flagged ? 'border-[#ba1a1a]/40 bg-[#ffd9de]/20' : 'border-border-outline'
      }`}
    >
      <div className="flex items-start justify-between gap-md">
        <div className="flex items-center gap-sm">
          <span className="text-xl" title={meta?.label}>
            {meta?.emoji}
          </span>
          <div>
            {fb.user_id ? (
              <Link
                href={`/volunteers/${fb.user_id}`}
                className="font-body text-[14px] font-semibold text-text-primary hover:text-primary transition-colors"
              >
                {volunteerName}
              </Link>
            ) : (
              <p className="font-body text-[14px] font-semibold text-text-primary">{volunteerName}</p>
            )}
            <p className="font-data text-[12px] text-text-tertiary">
              {fb.activity || 'Unknown Activity'} · {formatTime(fb.submitted_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={handleToggleFlag}
            disabled={isPending}
            className={`interactive px-sm py-xs rounded-xs font-data text-[11px] font-semibold transition-colors ${
              flagged
                ? 'bg-[#ffd9de] text-[#ba1a1a] hover:bg-[#ffb3ba]'
                : 'bg-bg-surface-elevated text-text-tertiary hover:bg-border-outline'
            }`}
            aria-label={flagged ? 'Unflag feedback' : 'Flag feedback'}
          >
            {flagged ? 'Flagged' : 'Flag'}
          </button>
          {fb.volunteer_email && (
            <a
              href={`mailto:${fb.volunteer_email}`}
              className="interactive inline-flex items-center justify-center h-7 px-sm rounded-xs border border-border-outline bg-bg-surface font-data text-[11px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors"
              aria-label="Email volunteer"
            >
              Email
            </a>
          )}
        </div>
      </div>
      {fb.comment && (
        <p className="font-body text-[14px] text-text-primary mt-md pl-[calc(1.25rem+8px)] border-l-2 border-border-outline ml-[10px]">
          {fb.comment}
        </p>
      )}
    </div>
  );
}
