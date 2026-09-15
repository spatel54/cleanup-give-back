import { PhotoSubmittedScreen } from '@/screens/PhotoSubmittedScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function PhotoSubmittedRoute() {
  return (
    <SafeAreaProvider>
      <PhotoSubmittedScreen />
    </SafeAreaProvider>
  );
}
