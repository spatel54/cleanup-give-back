'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { deleteEvent, setEventPublished } from '@/actions/events';

export function EventDetailActions({
  eventId,
  isPublished,
}: {
  eventId: string;
  isPublished: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-sm">
      <Link
        href={`/events/${eventId}/edit`}
        className="interactive h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors flex items-center justify-center"
      >
        Edit event
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await setEventPublished(eventId, !isPublished);
          });
        }}
        className="interactive h-10 px-lg rounded-sm border border-border-outline bg-bg-surface font-data text-[13px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors disabled:opacity-60"
      >
        {pending ? 'Updating…' : isPublished ? 'Unpublish' : 'Publish to app'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm('Delete this event? This cannot be undone.')) return;
          startTransition(async () => {
            await deleteEvent(eventId);
          });
        }}
        className="interactive h-10 px-lg rounded-sm border border-[#ba1a1a]/40 font-data text-[13px] font-semibold text-[#ba1a1a] hover:bg-[#ffd9de] transition-colors disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
