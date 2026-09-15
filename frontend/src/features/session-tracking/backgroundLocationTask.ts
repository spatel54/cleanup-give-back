import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { BACKGROUND_LOCATION_TASK } from './backgroundLocationConstants';
import { ingestBackgroundLocationSample } from './liveSessionStore';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[location] background task error:', error.message);
    return;
  }

  const payload = data as { locations?: Location.LocationObject[] } | undefined;
  const locations = payload?.locations;
  if (!locations?.length) {
    return;
  }

  for (const location of locations) {
    ingestBackgroundLocationSample(location);
  }
});

export function isBackgroundLocationTaskDefined(): boolean {
  return TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
}
