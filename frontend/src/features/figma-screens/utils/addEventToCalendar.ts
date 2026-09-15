import * as Calendar from 'expo-calendar';
import { Alert, Linking, Platform } from 'react-native';

import type { EventDetail } from '../mocks/eventDetail';

function formatGoogleCalendarDates(start: Date, end: Date): string {
  const toUtc = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
  return `${toUtc(start)}/${toUtc(end)}`;
}

function buildEventPayload(event: EventDetail) {
  return {
    title: event.title,
    location: event.locationAddress,
    notes: `${event.overview}\n\nOrganizer: ${event.organizer.name}`,
    startDate: new Date(event.calendarStartIso),
    endDate: new Date(event.calendarEndIso),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

async function createNativeCalendarEvent(event: EventDetail): Promise<void> {
  const available = await Calendar.isAvailableAsync();
  if (!available) {
    throw new Error('Calendar is not available on this device');
  }

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission is required to add this event');
  }

  if (Platform.OS === 'ios') {
    await Calendar.createEventInCalendarAsync(buildEventPayload(event));
    return;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable =
    calendars.find((calendar) => calendar.isPrimary && calendar.allowsModifications) ??
    calendars.find((calendar) => calendar.allowsModifications);

  if (!writable) {
    throw new Error('No writable calendar found on this device');
  }

  await Calendar.createEventAsync(writable.id, buildEventPayload(event));
}

async function openGoogleCalendar(event: EventDetail): Promise<void> {
  const start = new Date(event.calendarStartIso);
  const end = new Date(event.calendarEndIso);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: `${event.overview}\nOrganizer: ${event.organizer.name}`,
    location: event.locationAddress,
    dates: formatGoogleCalendarDates(start, end),
  });

  const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    throw new Error('Google Calendar is not available on this device');
  }

  await Linking.openURL(url);
}

export async function addEventToAppleCalendar(event: EventDetail): Promise<void> {
  await createNativeCalendarEvent(event);
}

export async function addEventToGoogleCalendar(event: EventDetail): Promise<void> {
  await openGoogleCalendar(event);
}

export function promptAddEventToCalendar(event: EventDetail) {
  Alert.alert('Add to calendar', 'Choose where to save this event.', [
    {
      text: Platform.OS === 'ios' ? 'Apple Calendar' : 'Google Calendar',
      onPress: () => {
        void (Platform.OS === 'ios' ? addEventToAppleCalendar(event) : addEventToGoogleCalendar(event)).catch(
          (error: Error) => {
            Alert.alert('Could not add event', error.message);
          },
        );
      },
    },
    {
      text: Platform.OS === 'ios' ? 'Google Calendar' : 'Device Calendar',
      onPress: () => {
        void (Platform.OS === 'ios' ? addEventToGoogleCalendar(event) : createNativeCalendarEvent(event)).catch(
          (error: Error) => {
            Alert.alert('Could not add event', error.message);
          },
        );
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
