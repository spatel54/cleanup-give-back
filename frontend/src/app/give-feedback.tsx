import { FeedbackScreen } from '@/screens/FeedbackScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Account → Give Feedback entry. Reuses `FeedbackScreen` with alternate copy so
 * `/session-feedback` keeps the original "Rate your experience!" title.
 */
export default function GiveFeedbackRoute() {
  return (
    <SafeAreaProvider>
      <FeedbackScreen
        title="We'd love your feedback!"
        subtitle="Tell us what is working well and what we can improve."
        source="account"
      />
    </SafeAreaProvider>
  );
}
