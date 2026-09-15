import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { Image as ExpoImage } from 'expo-image';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TourNavButtons } from '@/components/onboarding/TourNavButtons';
import {
  prefetchTourGraphics,
  TOUR_GRAPHICS,
} from '@/components/onboarding/tourAssets';
import { TOUR_LAYOUT } from '@/components/onboarding/tourLayout';
import { colors as C } from '@/features/figma-screens/tokens';

/** Figma `shop_tour` (137:115) — onboarding tour step 2. */
export function ShopTourScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
  });

  useEffect(() => {
    void prefetchTourGraphics(['trackMap']);
  }, []);

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.body}>
          <Text style={s.title}>Get your gear at the shop.</Text>

          <View style={s.showcaseWrap}>
            <ExpoImage
              source={TOUR_GRAPHICS.shopShowcase}
              style={s.showcase}
              contentFit="contain"
              cachePolicy="memory-disk"
              priority="high"
              transition={0}
              accessibilityLabel="Trash Cleanup Kit product showcase"
            />
          </View>
        </View>

        <TourNavButtons
          variant="dark"
          onContinue={() => router.push('/track-tour')}
          onPrevious={() => router.back()}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.primary,
  },
  safe: {
    flex: 1,
    paddingHorizontal: TOUR_LAYOUT.horizontalPadding,
    paddingBottom: TOUR_LAYOUT.bottomPadding,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    gap: TOUR_LAYOUT.graphicGapFromTitle,
    paddingTop: TOUR_LAYOUT.bodyPaddingTop,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 40,
    lineHeight: 48,
    color: C.bgApp,
  },
  showcaseWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  showcase: {
    width: '100%',
    height: '100%',
    maxHeight: 420,
  },
});
