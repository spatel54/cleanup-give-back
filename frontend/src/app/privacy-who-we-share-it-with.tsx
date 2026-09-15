import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PrivacyPolicyDetailScreen } from '@/features/figma-screens/screens/PrivacyPolicyDetailScreen';
import { colors } from '@/features/figma-screens/tokens';
import {
  PRIVACY_POLICY_LAST_UPDATED,
  WHO_WE_SHARE_IT_WITH_SECTIONS,
} from '@/features/figma-screens/content/privacyPolicyContent';

export default function PrivacyWhoWeShareRoute() {
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgApp }} />;
  }

  return (
    <SafeAreaProvider>
      <PrivacyPolicyDetailScreen
        sectionTitle="Who we share it with"
        sections={WHO_WE_SHARE_IT_WITH_SECTIONS}
        lastUpdated={PRIVACY_POLICY_LAST_UPDATED}
      />
    </SafeAreaProvider>
  );
}
