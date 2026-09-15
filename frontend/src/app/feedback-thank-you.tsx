import { FeedbackThankYouScreen } from '@/screens/FeedbackThankYouScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function FeedbackThankYouRoute() {
  return (
    <SafeAreaProvider>
      <FeedbackThankYouScreen />
    </SafeAreaProvider>
  );
}
