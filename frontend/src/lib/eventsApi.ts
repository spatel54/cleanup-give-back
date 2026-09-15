import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import type { EventDetail, WhatToBringItem } from '@/features/figma-screens/mocks/eventDetail';
import type { UpcomingEventSummary } from '@/features/figma-screens/mocks/home.types';
import { eventImageForLocation } from '@/features/figma-screens/mocks/home';

const ORGANIZER_IMAGE = require('@/assets/figma/event-detail/organizer.png');
const HEADER_IMAGE = require('@/assets/figma/event-detail/header.png');

const DEFAULT_WHAT_TO_BRING_DESCRIPTION =
  'CleanUp Give Back provides snacks, supplies, water, and music.';

const DEFAULT_COORDINATE = { latitude: 42.0417, longitude: -87.887 };

export type PublishedEventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  starts_at: string;
  ends_at: string | null;
  what_to_bring: string | null;
  organizer: string | null;
  image_url: string | null;
  image_urls?: string[] | null;
  is_published: boolean;
};

const EVENT_SELECT =
  'id, title, description, location, address, lat, lng, starts_at, ends_at, what_to_bring, organizer, image_url, image_urls, is_published';

function galleryUrls(row: PublishedEventRow): string[] {
  const fromArray = (row.image_urls ?? [])
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter(Boolean);
  if (fromArray.length > 0) {
    return [...new Set(fromArray)];
  }
  const single = row.image_url?.trim();
  return single ? [single] : [];
}

function eventImage(row: PublishedEventRow): number | { uri: string } {
  const first = galleryUrls(row)[0];
  if (first) {
    return { uri: first };
  }
  const locationKey = row.address?.trim() || row.location?.trim() || '';
  if (locationKey) {
    return eventImageForLocation(locationKey);
  }
  return HEADER_IMAGE;
}

function eventHeaderImages(row: PublishedEventRow): EventDetail['headerImages'] {
  const urls = galleryUrls(row);
  if (urls.length > 0) {
    return urls.map((uri) => ({ uri }));
  }
  return [eventImage(row)];
}

function formatTimeRange(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const startLabel = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  const endLabel = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${startLabel} - ${endLabel}`;
}

function formatDateTimeLabel(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const datePart = start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
  const startTime = start
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(' ', '')
    .replace(':00', '');
  if (!endsAt) return `${datePart} from ${startTime}`;
  const end = new Date(endsAt);
  const endTime = end
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(' ', '')
    .replace(':00', '');
  return `${datePart} from ${startTime} - ${endTime}`;
}

function toLocalIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseWhatToBring(raw: string | null): WhatToBringItem[] {
  const lines = (raw ?? '')
    .split(/\n|•|;/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [
      {
        id: 'clothing',
        icon: 'clothing',
        label: 'Wear weather-appropriate clothing',
      },
    ];
  }

  return lines.map((label, index) => {
    const lower = label.toLowerCase();
    let icon: WhatToBringItem['icon'] = 'clothing';
    if (lower.includes('water') || lower.includes('bottle') || lower.includes('drink')) {
      icon = 'water';
    } else if (lower.includes('shoe') || lower.includes('boot')) {
      icon = 'shoes';
    }
    return { id: `bring-${index}`, icon, label };
  });
}

export function mapRowToUpcomingSummary(row: PublishedEventRow): UpcomingEventSummary {
  const start = new Date(row.starts_at);
  return {
    id: row.id,
    title: row.title,
    day: String(start.getDate()),
    month: start.toLocaleDateString('en-US', { month: 'long' }),
    weekday: start.toLocaleDateString('en-US', { weekday: 'short' }),
    year: String(start.getFullYear()),
    location: row.address?.trim() || row.location?.trim() || 'Location TBA',
    timeLabel: formatTimeRange(row.starts_at, row.ends_at),
    organization: row.organizer?.trim() || 'Clean Up - Give Back',
    image: eventImage(row),
  };
}

export function mapRowToEventDetail(row: PublishedEventRow): EventDetail {
  const start = new Date(row.starts_at);
  const end = row.ends_at ? new Date(row.ends_at) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const address = row.address?.trim() || row.location?.trim() || 'Address TBA';
  const headerImages = eventHeaderImages(row);

  const isUpcoming = start.getTime() >= Date.now();

  return {
    id: row.id,
    title: row.title,
    statusLabel: isUpcoming ? 'UPCOMING' : 'PAST',
    registeredCount: 0,
    dateTimeLabel: formatDateTimeLabel(row.starts_at, row.ends_at),
    calendarStartIso: toLocalIso(start),
    calendarEndIso: toLocalIso(end),
    addressShort: address,
    overview:
      row.description?.trim() ||
      'Join us for a community clean-up. Bring your friends and family, and help us make a difference!',
    organizer: {
      name: row.organizer?.trim() || 'Clean Up - Give Back',
      bio: 'Community clean-up organized by Clean Up - Give Back.',
      image: ORGANIZER_IMAGE,
    },
    whatToBring: parseWhatToBring(row.what_to_bring),
    whatToBringDescription: DEFAULT_WHAT_TO_BRING_DESCRIPTION,
    locationName: row.location?.trim() || 'Clean Up - Give Back',
    locationAddress: address,
    coordinate: {
      latitude: row.lat ?? DEFAULT_COORDINATE.latitude,
      longitude: row.lng ?? DEFAULT_COORDINATE.longitude,
    },
    headerImages,
  };
}

/** Published upcoming events for the home feed (newest start first among future). */
export async function fetchPublishedUpcomingEvents(): Promise<UpcomingEventSummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('is_published', true)
    .gte('starts_at', nowIso)
    .order('starts_at', { ascending: true });

  if (error) {
    console.warn('[events] fetchPublishedUpcomingEvents failed:', error.message);
    return [];
  }

  return ((data ?? []) as PublishedEventRow[]).map(mapRowToUpcomingSummary);
}

/** All published events (upcoming + past) for View All. */
export async function fetchPublishedEventsCatalog(): Promise<UpcomingEventSummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('is_published', true)
    .order('starts_at', { ascending: true });

  if (error) {
    console.warn('[events] fetchPublishedEventsCatalog failed:', error.message);
    return [];
  }

  return ((data ?? []) as PublishedEventRow[]).map(mapRowToUpcomingSummary);
}

export async function fetchPublishedEventById(id: string): Promise<EventDetail | null> {
  if (!isSupabaseConfigured || !supabase || !id) {
    return null;
  }

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    console.warn('[events] fetchPublishedEventById failed:', error.message);
    return null;
  }
  if (!data) return null;

  return mapRowToEventDetail(data as PublishedEventRow);
}
