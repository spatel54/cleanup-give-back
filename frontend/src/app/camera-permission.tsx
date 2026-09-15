import { Redirect, type Href } from 'expo-router';

/** Hidden: onboarding camera step is now `/device-permissions`. Keep this file. */
export default function CameraPermissionRoute() {
  return <Redirect href={'/device-permissions' as Href} />;
}
