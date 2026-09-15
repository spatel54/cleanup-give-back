import { useEffect } from 'react';
import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { QuestionIcon } from '@/components/onboarding/OnboardingIcons';
import { clearOnboardingSignupData } from '@/features/onboarding/onboardingStore';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import {
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polygon } from 'react-native-svg';

function AlertTriangleIcon() {
  return (
    <Svg width={79} height={79} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="12,2 22,20 2,20"
        fill={C.statusPendingBorder}
        stroke={C.statusPendingBorder}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <Path
        d="M12 9v4"
        stroke={C.white}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M12 16.5v.5"
        stroke={C.white}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Figma `parent-permission-confirmation` (728:901). */
export function UnderAgeScreen() {
  const router = useRouter();

  useEffect(() => {
    clearOnboardingSignupData();
  }, []);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.centerZone}>
        <View style={s.card}>
          <View style={s.iconRow}>
            <AlertTriangleIcon />
          </View>

          <Text style={s.title}>You must be 13 or older to use this app.</Text>

          <Text style={s.body}>
            Users under 13 are not allowed to create an account or use Clean Up - Give Back, as required
            by the Children's Online Privacy Protection Act (COPPA) and our Privacy Policy.
          </Text>

          <View style={s.actions}>
            <AnimatedPressable
              style={s.contactBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Okay"
            >
              <Text style={s.contactBtnText}>Okay</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={s.learnWhyRow}
              onPress={() => router.push('/under-age-learn-why')}
              accessibilityRole="button"
              accessibilityLabel="Learn why you can't use the app yet"
            >
              <Text style={s.learnWhyText}>Learn why</Text>
              <QuestionIcon width={14} height={14} color={C.textNavInactive} />
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  centerZone: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  card: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.statusPendingBorder,
    borderRadius: radius.md,
    paddingHorizontal: 28,
    paddingVertical: 24,
    gap: 14,
    alignItems: 'center',
  },

  iconRow: {
    alignItems: 'center',
  },

  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    lineHeight: 40,
    color: C.textPrimary,
    textAlign: 'center',
  },

  body: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textNavInactive,
    textAlign: 'center',
    lineHeight: 18,
  },

  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 1,
  },

  contactBtn: {
    width: '100%',
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  contactBtnText: {
    ...textStyles.labelButtonLarge,
    color: C.textOnPrimary,
  },

  learnWhyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  learnWhyText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textNavInactive,
  },
});
