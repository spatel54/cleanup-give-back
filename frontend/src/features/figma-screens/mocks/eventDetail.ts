import type { MapCoordinate } from '../utils/openLocationInMaps';

export type WhatToBringIcon = 'clothing' | 'water' | 'shoes';

export type WhatToBringItem = {
  id: string;
  icon: WhatToBringIcon;
  label: string;
};

export type EventOrganizer = {
  name: string;
  bio: string;
  image: number;
};

export type EventDetail = {
  id: string;
  title: string;
  statusLabel: string;
  registeredCount: number;
  dateTimeLabel: string;
  /** ISO 8601 local start for calendar export. */
  calendarStartIso: string;
  /** ISO 8601 local end for calendar export. */
  calendarEndIso: string;
  addressShort: string;
  overview: string;
  organizer: EventOrganizer;
  whatToBring: WhatToBringItem[];
  /** Optional description shown below the "What to bring" heading. */
  whatToBringDescription?: string;
  locationName: string;
  locationAddress: string;
  /** WGS84 pin for the location map + Apple/Google Maps deep link. */
  coordinate: MapCoordinate;
  /** Local `require()` id or remote URI (admin-published events). */
  headerImages: Array<number | { uri: string }>;
};

const HEADER = require('@/assets/figma/event-detail/header.png');
const ORGANIZER = require('@/assets/figma/event-detail/organizer.png');

const DEFAULT_WHAT_TO_BRING: WhatToBringItem[] = [
  {
    id: 'clothing',
    icon: 'clothing',
    label: 'Wear weather-appropriate clothing',
  },
];

const DEFAULT_WHAT_TO_BRING_DESCRIPTION =
  'CleanUp Give Back provides snacks, supplies, water, and music.';

/** Figma `events_detail` (`196:226`) — Downtown Riverfront Clean-up. */
export const downtownRiverfrontEvent: EventDetail = {
  id: 'ev-1',
  title: 'Downtown Riverfront Clean-up',
  statusLabel: 'UPCOMING',
  registeredCount: 14,
  dateTimeLabel: 'July 15 from 5PM - 7PM',
  calendarStartIso: '2026-07-15T17:00:00',
  calendarEndIso: '2026-07-15T19:00:00',
  addressShort: '600 E Algonquin Rd, Des Plaines, IL, 60018',
  overview:
    "Join us for a community clean-up at the downtown riverfront! Let's come together to beautify our local waterways and enjoy a day of teamwork and fun. Bring your friends and family, and help us make a difference!",
  organizer: {
    name: 'D214 Life Program',
    bio: "Our schools are designed to serve students' unique needs with a focus on post-school success.",
    image: ORGANIZER,
  },
  whatToBring: DEFAULT_WHAT_TO_BRING,
  whatToBringDescription: DEFAULT_WHAT_TO_BRING_DESCRIPTION,
  locationName: 'Clean Up - Give Back',
  locationAddress: '600 E Algonquin Rd, Des Plaines, IL, 60018',
  // Approximate pin for 600 E Algonquin Rd, Des Plaines, IL
  coordinate: { latitude: 42.0417, longitude: -87.887 },
  headerImages: [HEADER, HEADER, HEADER, HEADER],
};

const EVENT_DETAILS: Record<string, EventDetail> = {
  'ev-1': downtownRiverfrontEvent,
  'ev-2': {
    ...downtownRiverfrontEvent,
    id: 'ev-2',
    title: 'McKinley Road Clean-up',
    registeredCount: 9,
    dateTimeLabel: 'July 27 from 9AM - 11AM',
    calendarStartIso: '2026-07-27T09:00:00',
    calendarEndIso: '2026-07-27T11:00:00',
    addressShort: '1425 N McKinley Rd, Des Plaines, IL, 60016',
    locationAddress: '1425 N McKinley Rd, Des Plaines, IL, 60016',
    coordinate: { latitude: 42.0512, longitude: -87.9005 },
    organizer: {
      name: 'Park District Volunteer Corps',
      bio: 'Local volunteers keeping Des Plaines parks and trails clean year-round.',
      image: ORGANIZER,
    },
  },
  'ev-3': {
    ...downtownRiverfrontEvent,
    id: 'ev-3',
    title: 'Mt Prospect Trail Clean-up',
    registeredCount: 11,
    dateTimeLabel: 'August 3 from 1PM - 3:30PM',
    calendarStartIso: '2026-08-03T13:00:00',
    calendarEndIso: '2026-08-03T15:30:00',
    addressShort: '2200 E Algonquin Rd, Mt Prospect, IL, 60056',
    locationAddress: '2200 E Algonquin Rd, Mt Prospect, IL, 60056',
    coordinate: { latitude: 42.0458, longitude: -87.9372 },
    organizer: {
      name: 'Northwest Community Partners',
      bio: 'Community partners organizing neighborhood clean-ups across the northwest suburbs.',
      image: ORGANIZER,
    },
  },
  'ev-4': {
    ...downtownRiverfrontEvent,
    id: 'ev-4',
    title: 'Glenview Central Clean-up',
    registeredCount: 6,
    dateTimeLabel: 'August 10 from 8:30AM - 10:30AM',
    calendarStartIso: '2026-08-10T08:30:00',
    calendarEndIso: '2026-08-10T10:30:00',
    addressShort: '800 Central Rd, Glenview, IL, 60025',
    locationAddress: '800 Central Rd, Glenview, IL, 60025',
    coordinate: { latitude: 42.0696, longitude: -87.7874 },
    organizer: {
      name: 'Glenview Green Team',
      bio: 'Neighbors working together to keep Glenview green and litter-free.',
      image: ORGANIZER,
    },
  },
};

export function getEventDetail(id: string | undefined): EventDetail | null {
  if (id && EVENT_DETAILS[id]) {
    return EVENT_DETAILS[id];
  }
  return null;
}
