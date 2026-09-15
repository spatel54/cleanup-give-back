import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  WelcomeBurstIcon,
  WelcomeLogoMark,
  WelcomeUnderline,
} from '@/components/onboarding/OnboardingIcons';
import { ONBOARDING_GRAPHICS } from '@/components/onboarding/onboardingGraphics';
import { SocialAuthButtons } from '@/components/onboarding/SocialAuthButtons';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import { isAuthCanceledError, mapAuthErrorMessage } from '@/lib/authHelpers';
import { resetPasswordForEmail, signInWithEmail } from '@/lib/auth';
import { setPendingCreateAccountDraft } from '@/lib/createAccountDraft';
import { enableDevSkipToHome } from '@/lib/devSkipHome';
import { markOnboardingComplete } from '@/features/onboarding/onboardingStore';
import { continueAfterAuth } from '@/lib/volunteerAuthNavigation';
import { Ionicons } from '@expo/vector-icons';
import {
  IBMPlexSans_400Regular,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Figma `welcome` (112:6776) — post-splash login / create-account entry. */
export function WelcomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToCreateAccount = () => {
    setPendingCreateAccountDraft(email, password);
    router.push('/create-account');
  };

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <View style={s.hero}>
        <ExpoImage
          source={ONBOARDING_GRAPHICS.welcomeHero}
          style={s.heroImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          accessibilityLabel="Volunteers at a CleanUp Give Back event"
        />
        <LinearGradient
          colors={[
            'rgba(0,149,64,0)',
            'rgba(0,149,64,0.15)',
            'rgba(0,149,64,0.55)',
            'rgba(0,149,64,0.85)',
            'rgba(0,149,64,1)',
          ]}
          locations={[0, 0.35, 0.55, 0.72, 0.88]}
          style={s.heroGradient}
        />
        <SafeAreaView edges={['top']} style={s.logoWrap} pointerEvents="none">
          <WelcomeLogoMark width={30} height={39} />
        </SafeAreaView>
      </View>

      <SafeAreaView style={s.formSafe} edges={['bottom']}>
        <View style={s.form}>
          {/* Figma Title Section 137:900 — burst @ (0,0); text inset 10.5/5; squiggle under impact. */}
          <View style={s.titleBlock}>
            <View style={s.burstWrap} pointerEvents="none">
              <WelcomeBurstIcon size={16} />
            </View>
            <View style={s.titleTextWrap}>
              <Text style={s.titleRow} numberOfLines={1}>
                <Text style={[s.title, s.titleWhite]}>Track your service. </Text>
                <Text style={[s.title, s.titleLime]}>Prove your</Text>
              </Text>
              <View style={s.impactWord}>
                <Text style={[s.title, s.titleLime]}>impact.</Text>
                <View style={s.underlineWrap} pointerEvents="none">
                  <WelcomeUnderline width={83} height={7} />
                </View>
              </View>
            </View>
          </View>

          <View style={s.fields}>
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor="rgba(252,249,248,0.88)"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              accessibilityLabel="Email"
            />
            <View style={s.passwordWrap}>
              <TextInput
                style={s.passwordInput}
                placeholder="Password"
                placeholderTextColor="rgba(252,249,248,0.88)"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError(null);
                }}
                secureTextEntry={!showPassword}
                textContentType="password"
                accessibilityLabel="Password"
              />
              <Pressable
                style={s.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color="rgba(252,249,248,0.9)"
                />
              </Pressable>
            </View>
          </View>

          {error ? (
            <Text style={s.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <View style={s.actions}>
          <AnimatedPressable
            style={[s.loginBtn, busy && s.loginBtnBusy]}
            disabled={busy}
            onPress={() => {
              void (async () => {
                if (!email.trim() || !password) {
                  setError('Enter your email and password.');
                  return;
                }
                setBusy(true);
                setError(null);
                try {
                  const session = await signInWithEmail(email, password);
                  continueAfterAuth(session, router);
                } catch (caught) {
                  if (!isAuthCanceledError(caught)) {
                    setError(mapAuthErrorMessage(caught));
                  }
                } finally {
                  setBusy(false);
                }
              })();
            }}
            accessibilityRole="button"
            accessibilityLabel="Log In"
            accessibilityState={{ busy, disabled: busy }}
          >
            {busy ? (
              <ActivityIndicator color={C.primary} />
            ) : (
              <Text style={s.loginBtnText}>Log In</Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => {
              void (async () => {
                if (!email.trim()) {
                  setError('Enter your email, then tap Forgot Password.');
                  return;
                }
                try {
                  await resetPasswordForEmail(email);
                  Alert.alert(
                    'Check your email',
                    'If an account exists for that address, we sent a reset link.',
                  );
                } catch (caught) {
                  setError(mapAuthErrorMessage(caught));
                }
              })();
            }}
            accessibilityRole="button"
            accessibilityLabel="Forgot Password"
          >
            <Text style={s.forgot}>Forgot Password?</Text>
          </AnimatedPressable>

          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>or login with</Text>
            <View style={s.orLine} />
          </View>

          <SocialAuthButtons
            layout="row"
            disabled={busy}
            onSuccess={(session) => continueAfterAuth(session, router)}
          />

          <AnimatedPressable
            onPress={goToCreateAccount}
            accessibilityRole="button"
            accessibilityLabel="Don't have an account? Sign up"
            style={s.signupLinkWrap}
          >
            <Text style={s.signupPrompt}>
              Don't have an account?{' '}
              <Text style={s.signupLink}>Sign up</Text>
            </Text>
          </AnimatedPressable>

          {__DEV__ ? (
            <Pressable
              onPress={() => {
                markOnboardingComplete();
                enableDevSkipToHome();
                router.replace('/');
              }}
              accessibilityRole="button"
              accessibilityLabel="Skip to Home"
              style={s.devSkipHome}
            >
              <Text style={s.devSkipHomeLabel}>TEMP · Skip to Home</Text>
            </Pressable>
          ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.primary,
  },
  hero: {
    flex: 1,
    minHeight: 160,
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  logoWrap: {
    position: 'absolute',
    left: 16,
    top: 0,
    paddingTop: 8,
  },
  formSafe: {
    flexGrow: 0,
    flexShrink: 0,
    marginTop: -88,
  },
  form: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  actions: {
    gap: 20,
  },
  /** Figma `137:900` — burst @ (0,0); text inset 10.5 / 5; squiggle under “impact.” */
  titleBlock: {
    position: 'relative',
    minHeight: 72,
    width: '100%',
  },
  burstWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  titleTextWrap: {
    marginLeft: 10.5,
    marginTop: 5,
  },
  titleRow: {
    ...textStyles.headlineDetail,
  },
  title: {
    ...textStyles.headlineDetail,
  },
  titleWhite: {
    color: C.bgApp,
  },
  titleLime: {
    color: C.accentLime,
  },
  impactWord: {
    alignItems: 'flex-start',
  },
  underlineWrap: {
    marginTop: 2,
    width: 83,
    height: 7,
  },
  fields: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: C.bgApp,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.bgApp,
    // iOS email keyboard type otherwise stretches placeholder tracking.
    letterSpacing: 0,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.bgApp,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.bgApp,
    letterSpacing: 0,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  loginBtn: {
    backgroundColor: C.bgApp,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
  loginBtnBusy: {
    opacity: 0.8,
  },
  loginBtnText: {
    ...textStyles.labelButton,
    color: C.primary,
  },
  error: {
    ...textStyles.bodySmall,
    color: C.bgApp,
    textAlign: 'center',
  },
  forgot: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.bgApp,
    textAlign: 'center',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  orLine: {
    flex: 1,
    height: 1,
    alignSelf: 'center',
    backgroundColor: C.borderOutline,
  },
  orText: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 14,
    lineHeight: 14,
    color: C.bgApp,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  signupLinkWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  signupPrompt: {
    ...textStyles.bodyDefault,
    color: C.bgApp,
    textAlign: 'center',
  },
  signupLink: {
    ...textStyles.bodySemiBold,
    color: C.accentLime,
    textDecorationLine: 'underline',
  },
  /** TEMP __DEV__ only — remove with `lib/devSkipHome.ts`. */
  devSkipHome: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(252,249,248,0.35)',
    borderStyle: 'dashed',
  },
  devSkipHomeLabel: {
    ...textStyles.bodySmall,
    fontFamily: 'NotoSans_600SemiBold',
    color: 'rgba(252,249,248,0.9)',
    textAlign: 'center',
  },
  createBtn: {
    backgroundColor: C.textPrimary,
    borderRadius: radius.md,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },
});
