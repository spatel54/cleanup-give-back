import { SubmissionConfirmationScreen } from '@/screens/SubmissionConfirmationScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SubmissionConfirmationRoute() {
  return (
    <SafeAreaProvider>
      <SubmissionConfirmationScreen />
    </SafeAreaProvider>
  );
}
