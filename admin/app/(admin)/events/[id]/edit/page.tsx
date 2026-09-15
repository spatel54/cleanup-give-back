import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createDataClient } from '@/lib/supabase/server';
import { ChevronLeftIcon } from '@/components/ui/Icons';
import { EventForm } from '@/components/events/EventForm';
import type { Event } from '@/types/database';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createDataClient();
  const { data } = await supabase.from('events').select('*').eq('id', id).single();
  if (!data) notFound();

  const event = data as Event;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/events/${event.id}`}
        className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
        Event details
      </Link>
      <h1 className="font-heading text-[28px] leading-[36px] text-text-primary mb-lg">Edit Event</h1>
      <EventForm mode="edit" event={event} />
    </div>
  );
}
