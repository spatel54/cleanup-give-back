import { Redirect } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { canUseSessionPhotos } from '@/constants/ageGate';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';
import { PhotoCheckpointScreen } from '@/screens/PhotoCheckpointScreen';

export default function PhotoCheckpointRoute() {
  const { isActive, photosEnabled } = useLiveSession();
  if (!canUseSessionPhotos() || !photosEnabled) {
    return <Redirect href={isActive ? '/live-session' : '/'} />;
  }

  return (
    <SafeAreaProvider>
      <PhotoCheckpointScreen />
    </SafeAreaProvider>
  );
}
