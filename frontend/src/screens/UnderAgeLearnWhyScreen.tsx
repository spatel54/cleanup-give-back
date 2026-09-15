import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';


const REASONS = [
  {
    title: 'Federal privacy law (COPPA)',
    body: `The Children's Online Privacy Protection Act (COPPA) requires special protections for children under 13. Our Privacy Policy follows this standard.`,
  },
  {
    title: 'Sensitive data during cleanups',
    body: 'The app collects live photos and precise GPS routes while you track cleanup sessions. That kind of personal information cannot be collected from users under 13 without parental consent, which we do not offer.',
  },
  {
    title: 'What happens at signup',
    body: 'If you are under 13, account creation is blocked and the signup details you entered are purged from your device. Nothing is stored on our servers.',
  },
  {
    title: 'Who can use the app',
    body: 'You must be 13 or older to sign up. Users aged 13 and older receive the same high privacy defaults described in our Privacy Policy.',
  },
] as const;

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.2426 6.34317L14.8284 4.92896L7.75739 12L14.8285 19.0711L16.2427 17.6569L10.5858 12L16.2426 6.34317Z"
        fill={C.textPrimary}
      />
    </Svg>
  );
}

/** Figma `admin_permission_learn_why` (833:314) — Learn why explainer. */
export function UnderAgeLearnWhyScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.topBar}>
        <AnimatedPressable
          style={s.backRow}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackIcon />
          <Text style={s.backText}>Back</Text>
        </AnimatedPressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.intro}>
          <Text style={s.title}>Why users under 13 cannot sign up</Text>
          <Text style={s.subtitle}>
            Clean Up - Give Back is not intended for children under 13. These are the privacy-policy
            reasons account creation is blocked.
          </Text>
        </View>

        <View style={s.reasons}>
          {REASONS.map((reason) => (
            <View key={reason.title} style={s.reasonCard}>
              <Text style={s.reasonTitle}>{reason.title}</Text>
              <Text style={s.reasonBody}>{reason.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <AnimatedPressable
          style={s.contactBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Okay"
        >
          <Text style={s.contactBtnText}>Okay</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  backText: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 16,
    color: C.textPrimary,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 40,
  },

  intro: {
    gap: 20,
  },

  title: {

    ...textStyles.headlineTopBar,

    color: C.textPrimary,

  },

  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textNavInactive,
    lineHeight: 20,
  },

  reasons: {
    gap: 20,
  },

  reasonCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },

  reasonTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.textPrimary,
  },

  reasonBody: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textNavInactive,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },

  contactBtn: {
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
});
