'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  createEvent,
  updateEvent,
  type EventActionState,
} from '@/actions/events';
import { toDatetimeLocalValue } from '@/lib/events';
import type { Event } from '@/types/database';
import { AddressAutocomplete } from './AddressAutocomplete';
import { EventPhotoUpload } from './EventPhotoUpload';
import { FIELD, TEXTAREA, LABEL } from './formStyles';

type EventFormProps =
  | { mode: 'create'; event?: undefined }
  | { mode: 'edit'; event: Event };

const initialState: EventActionState = {};

export function EventForm({ mode, event }: EventFormProps) {
  const boundUpdate =
    mode === 'edit'
      ? updateEvent.bind(null, event.id)
      : createEvent;

  const [state, formAction, pending] = useActionState(boundUpdate, initialState);
  const [addressValid, setAddressValid] = useState(true);

  return (
    <form action={formAction} className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md">
      {state.error ? (
        <p className="font-body text-[14px] text-[#ba1a1a] bg-[#ffd9de] border border-[#ba1a1a]/40 rounded-sm px-md py-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="title" className={LABEL}>
          Title <span className="text-[#ba1a1a]">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={event?.title ?? ''}
          className={FIELD}
          placeholder="Downtown Riverfront Clean-up"
        />
      </div>

      <div>
        <label htmlFor="description" className={LABEL}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={event?.description ?? ''}
          className={TEXTAREA}
          placeholder="What volunteers will do and why it matters"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <div>
          <label htmlFor="location" className={LABEL}>
            Location name
          </label>
          <input
            id="location"
            name="location"
            defaultValue={event?.location ?? ''}
            className={FIELD}
            placeholder="Riverside Park"
          />
        </div>
        <div>
          <label htmlFor="organizer" className={LABEL}>
            Organizer
          </label>
          <input
            id="organizer"
            name="organizer"
            defaultValue={event?.organizer ?? ''}
            className={FIELD}
            placeholder="Clean Up - Give Back"
          />
        </div>
      </div>

      <AddressAutocomplete
        defaultAddress={event?.address ?? ''}
        defaultLat={event?.lat ?? null}
        defaultLng={event?.lng ?? null}
        onValidityChange={setAddressValid}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <div>
          <label htmlFor="starts_at" className={LABEL}>
            Starts <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocalValue(event?.starts_at)}
            className={`${FIELD} period-date-input`}
          />
        </div>
        <div>
          <label htmlFor="ends_at" className={LABEL}>
            Ends
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(event?.ends_at)}
            className={`${FIELD} period-date-input`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="what_to_bring" className={LABEL}>
          What to bring (optional)
        </label>
        <textarea
          id="what_to_bring"
          name="what_to_bring"
          defaultValue={event?.what_to_bring ?? ''}
          className={TEXTAREA}
          placeholder="One item per line (e.g. Wear weather-appropriate clothing)"
        />
      </div>

      <EventPhotoUpload
        defaultUrls={
          event?.image_urls?.length
            ? event.image_urls
            : event?.image_url
              ? [event.image_url]
              : []
        }
      />

      <label className="flex items-center gap-sm font-body text-[14px] text-text-primary cursor-pointer select-none">
        <input
          type="checkbox"
          name="is_published"
          value="true"
          defaultChecked={event?.is_published ?? true}
          className="w-4 h-4 accent-primary"
        />
        Publish to mobile app
      </label>
      <p className="font-body text-[12px] text-text-tertiary -mt-sm">
        Only published events appear in the volunteer app Upcoming Events feed.
      </p>

      <div className="flex items-center gap-md pt-sm">
        <button
          type="submit"
          disabled={pending || !addressValid}
          title={!addressValid ? 'Pick an address from the suggestions first' : undefined}
          className="interactive h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors disabled:opacity-60"
        >
          {pending ? 'Saving…' : mode === 'create' ? 'Create event' : 'Save changes'}
        </button>
        <Link
          href={mode === 'edit' ? `/events/${event.id}` : '/events'}
          className="font-data text-[13px] text-text-tertiary hover:text-primary"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
