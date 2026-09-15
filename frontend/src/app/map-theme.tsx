import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MapThemeScreen } from '@/screens/MapThemeScreen';

export default function MapThemeRoute() {
  return (
    <SafeAreaProvider>
      <MapThemeScreen />
    </SafeAreaProvider>
  );
}
