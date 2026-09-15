import { FeedbackScreen } from '@/screens/FeedbackScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionFeedbackRoute() {
  return (
    <SafeAreaProvider>
      <FeedbackScreen />
    </SafeAreaProvider>
  );
}
