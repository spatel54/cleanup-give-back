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

/** Figma `session_tour` (137:173) — onboarding tour step 4. */
export function SessionTourScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Sanchez_400Regular });

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.body}>
          <Text style={s.title}>View your previous sessions.</Text>

          <View style={s.showcaseWrap}>
            <ExpoImage
              source={TOUR_GRAPHICS.sessionList}
              style={s.showcase}
              contentFit="contain"
              cachePolicy="memory-disk"
              priority="high"
              transition={0}
              accessibilityLabel="Previous sessions list with statuses"
            />
          </View>
        </View>

        <TourNavButtons
          variant="dark"
          onContinue={() => router.push('/set-tour')}
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
    width: '95%',
    height: '100%',
    maxHeight: 460,
  },
});
