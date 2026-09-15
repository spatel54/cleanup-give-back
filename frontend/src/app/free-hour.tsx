import { FreeHourScreen } from '@/screens/FreeHourScreen';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function FreeHourRoute() {
  const router = useRouter();
  return (
    <SafeAreaProvider>
      <FreeHourScreen
        totalPills={7}
        activePills={5}
        onContinue={() => router.push('/free-kit')}
        onPrevious={() => router.back()}
        onSkip={() => router.push('/setup-complete')}
      />
    </SafeAreaProvider>
  );
}
