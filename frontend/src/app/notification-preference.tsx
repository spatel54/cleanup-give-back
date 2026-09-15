import { Redirect, type Href } from 'expo-router';

/** Hidden: onboarding notifications step is now `/device-permissions`. Keep this file. */
export default function NotificationPreferenceRoute() {
  return <Redirect href={'/device-permissions' as Href} />;
}
