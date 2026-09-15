import { Redirect } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { canUseSessionPhotos } from '@/constants/ageGate';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';
import { PhotoCaptureScreen } from '@/screens/PhotoCaptureScreen';

export default function PhotoCaptureRoute() {
  const { isActive } = useLiveSession();
  if (!canUseSessionPhotos()) {
    return <Redirect href={isActive ? '/live-session' : '/'} />;
  }
  return (
    <SafeAreaProvider>
      <PhotoCaptureScreen />
    </SafeAreaProvider>
  );
}
