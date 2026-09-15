import { Redirect, type Href } from 'expo-router';

/** Hidden: onboarding location step is now `/device-permissions`. Keep this file. */
export default function LocationPermissionRoute() {
  return <Redirect href={'/device-permissions' as Href} />;
}
