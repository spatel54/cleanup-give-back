import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
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

/** Figma `home_tour` (137:527) — onboarding tour step 1. */
export function HomeTourScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    IBMPlexSans_600SemiBold,
  });

  useEffect(() => {
    void prefetchTourGraphics(['shopShowcase', 'trackMap']);
  }, []);

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.body}>
          <Text style={s.title}>
            <Text style={s.titleDark}>Your home dashboard. </Text>
            <Text style={s.titleGreen}>Quantify your impact.</Text>
          </Text>

          <View style={s.illustrationStack}>
            <ExpoImage
              source={TOUR_GRAPHICS.homeStatsChart}
              style={s.chartImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              priority="high"
              transition={0}
              accessibilityLabel="Total service hours chart"
            />
            <ExpoImage
              source={TOUR_GRAPHICS.homeStatsCards}
              style={s.cardsImage}
              contentFit="contain"
              contentPosition={{ left: 0, top: 0 }}
              cachePolicy="memory-disk"
              priority="high"
              transition={0}
              accessibilityLabel="Sessions, miles, and locations stats"
            />
          </View>
        </View>

        <TourNavButtons
          variant="light"
          onContinue={() => router.push('/shop-tour')}
          onPrevious={() => router.back()}
          hidePrevious
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgTour,
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
    alignItems: 'stretch',
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 40,
    lineHeight: 48,
  },
  titleDark: {
    color: C.textTertiary,
  },
  titleGreen: {
    color: C.primary,
  },
  illustrationStack: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 0,
  },
  chartImage: {
    width: '100%',
    aspectRatio: 716 / 470,
  },
  cardsImage: {
    width: '88%',
    aspectRatio: 668 / 221,
    marginTop: 6,
    alignSelf: 'center',
  },
});
