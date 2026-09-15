import { FreeKitScreen } from '@/screens/FreeKitScreen';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function FreeKitRoute() {
  const router = useRouter();
  return (
    <SafeAreaProvider>
      <FreeKitScreen
        totalPills={7}
        activePills={6}
        onContinue={() => router.push('/device-permissions' as Href)}
        onPrevious={() => router.back()}
        onSkip={() => router.push('/device-permissions' as Href)}
      />
    </SafeAreaProvider>
  );
}
