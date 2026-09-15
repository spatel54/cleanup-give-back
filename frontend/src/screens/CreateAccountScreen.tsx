import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  EyeOffIcon,
  EyeOpenIcon,
} from '@/components/onboarding/OnboardingIcons';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SocialAuthButtons } from '@/components/onboarding/SocialAuthButtons';
import {
  setEmail as persistEmail,
  setPreferredName as persistPreferredName,
} from '@/features/onboarding/onboardingStore';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import {
  setCreateAccountDraft,
  takePendingCreateAccountDraft,
} from '@/lib/createAccountDraft';
import { continueAfterAuth } from '@/lib/volunteerAuthNavigation';
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
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name: string, email: string, password: string) {
  const errors: { name?: string; email?: string; password?: string } = {};
  if (!name.trim()) errors.name = 'Name is required';
  else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  return errors;
}

/** Figma `create_account` (105:2) — onboarding step 1 of 5. */
export function CreateAccountScreen() {
  const router = useRouter();
  const draft = takePendingCreateAccountDraft();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(draft?.email ?? '');
  const [password, setPassword] = useState(draft?.password ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  const errors = validate(name, email, password);
  const showError = (field: keyof typeof errors) =>
    (submitted || touched[field]) ? errors[field] : undefined;

  const goPersonalDetails = () => {
    router.push('/account-phone' as Href);
  };

  /** Email path: stash draft only — Supabase signUp waits until after the age gate. */
  const goNext = () => {
    setSubmitted(true);
    if (Object.keys(errors).length !== 0) {
      return;
    }
    persistPreferredName(name);
    persistEmail(email);
    setCreateAccountDraft({ name, email, password });
    goPersonalDetails();
  };

  const goToLogin = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.page}>
          <View style={s.main}>
              <OnboardingProgressPills active={1} total={5} />

            <Text style={s.title}>Create your account</Text>

            <View style={s.fields}>
              <View>
                <TextInput
                  style={[s.input, showError('name') ? s.inputError : null]}
                  placeholder="Name"
                  placeholderTextColor={C.textNavInactive}
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  autoCapitalize="words"
                  textContentType="name"
                  accessibilityLabel="Name"
                />
                {showError('name') ? <Text style={s.errorText}>{showError('name')}</Text> : null}
              </View>

              <View>
                <TextInput
                  style={[s.input, showError('email') ? s.inputError : null]}
                  placeholder="Email"
                  placeholderTextColor={C.textNavInactive}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  accessibilityLabel="Email"
                />
                {showError('email') ? <Text style={s.errorText}>{showError('email')}</Text> : null}
              </View>

              <View>
                <View style={[s.passwordWrap, showError('password') ? s.inputError : null]}>
                  <TextInput
                    style={s.passwordInput}
                    placeholder="Password"
                    placeholderTextColor={C.textNavInactive}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    accessibilityLabel="Password"
                  />
                  <Pressable
                    style={s.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    hitSlop={8}
                  >
                    {showPassword
                      ? <EyeOpenIcon size={20} color={C.textNavInactive} />
                      : <EyeOffIcon size={20} color={C.textNavInactive} />
                    }
                  </Pressable>
                </View>
                {showError('password') ? <Text style={s.errorText}>{showError('password')}</Text> : null}
              </View>
            </View>

            <AnimatedPressable
              style={s.primaryBtn}
              onPress={goNext}
              accessibilityRole="button"
              accessibilityLabel="Create Account"
            >
              <Text style={s.primaryBtnText}>Create Account</Text>
            </AnimatedPressable>

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>or</Text>
              <View style={s.orLine} />
            </View>

            <SocialAuthButtons
              compact
              onSuccess={(session) => continueAfterAuth(session, router)}
            />
          </View>

          <AnimatedPressable
            style={s.loginRow}
            onPress={goToLogin}
            accessibilityRole="button"
            accessibilityLabel="Log In"
            accessibilityHint="Returns to the login screen"
          >
            <Text style={s.loginPrompt}>
              Already have an account? <Text style={s.loginLink}>Log In</Text>
            </Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },
  flex: { flex: 1 },
  page: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  main: {
    flex: 1,
    gap: 20,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    color: C.textPrimary,
    marginTop: 0,
  },
  fields: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
    backgroundColor: C.bgApp,
  },
  inputError: {
    borderColor: C.statusDeclinedBorder,
  },
  errorText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.statusDeclinedText,
    marginTop: 4,
    marginLeft: 4,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    backgroundColor: C.bgApp,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  primaryBtnText: {
    ...textStyles.labelButtonLarge,
    color: C.textOnPrimary,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.borderOutline,
  },
  orText: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 12,
    color: C.textPrimary,
  },
  loginRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  loginPrompt: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textNavInactive,
    textAlign: 'center',
  },
  loginLink: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.primary,
    textDecorationLine: 'underline',
  },
});
