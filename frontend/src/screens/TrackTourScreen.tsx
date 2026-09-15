import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { Image as ExpoImage } from 'expo-image';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TourNavButtons } from '@/components/onboarding/TourNavButtons';
import { TOUR_GRAPHICS } from '@/components/onboarding/tourAssets';
import { TOUR_LAYOUT } from '@/components/onboarding/tourLayout';
import { colors as C } from '@/features/figma-screens/tokens';

/** Figma `track_tour` (137:431) — onboarding tour step 3. */
export function TrackTourScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.body}>
          <Text style={s.title}>
            <Text style={s.titleDark}>Track your hours.{'\n'}</Text>
            <Text style={s.titleGreen}>Real time.</Text>
          </Text>

          <View style={s.mapCard}>
            <ExpoImage
              source={TOUR_GRAPHICS.trackMap}
              style={s.mapImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={0}
              accessibilityLabel="Live session map with timer and checkpoint progress"
            />
          </View>
        </View>

        <TourNavButtons
          variant="light"
          onContinue={() => router.push('/session-tour')}
          onPrevious={() => router.back()}
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
  mapCard: {
    width: '100%',
    height: 370,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: C.primary,
    overflow: 'hidden',
    backgroundColor: C.chipBg,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
});
