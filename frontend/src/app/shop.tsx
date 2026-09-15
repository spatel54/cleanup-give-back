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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ShopScreen } from '@/features/figma-screens/screens/ShopScreen';
import { colors } from '@/features/figma-screens/tokens';
import { durations } from '@/motion';

function enterParamIsFade(enter: string | string[] | undefined): boolean {
  if (enter === 'fade') return true;
  return Array.isArray(enter) && enter[0] === 'fade';
}

export default function ShopRoute() {
  const router = useRouter();
  const { enter } = useLocalSearchParams<{ enter?: string | string[] }>();
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

  // Drop the one-shot fade param after the transition so BottomNav stays instant.
  useEffect(() => {
    if (!enterParamIsFade(enter)) {
      return;
    }
    const t = setTimeout(() => {
      router.setParams({ enter: undefined });
    }, durations.modalEnter + 50);
    return () => clearTimeout(t);
  }, [enter, router]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgApp }} />;
  }

  return (
    <SafeAreaProvider>
      <ShopScreen />
    </SafeAreaProvider>
  );
}
