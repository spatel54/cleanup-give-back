import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';
import {
  CountryChevronDownIcon,
  CountryPickerModal,
  digitsOnly,
  formatPhoneDisplay,
  phoneDisplayMaxLength,
  phonePlaceholder,
  validatePhone,
} from '@/features/figma-screens/components/CountryPickerModal';
import { colors as C, textStyles } from '@/features/figma-screens/tokens';
import {
  getEmail,
  getPhoneCountryIso2,
  getPhoneDigits,
  getPreferredName,
  setPhone as persistPhone,
  setPreferredName as persistPreferredName,
} from '@/features/onboarding/onboardingStore';
import {
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function validateLegalName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'Full legal name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  return undefined;
}

/** Figma `details_account` phone step (712:323) — onboarding step 2 of 5. */
export function AccountPhoneScreen() {
  const router = useRouter();
  const [preferredName, setPreferredName] = useState(() => getPreferredName());
  const prefilledEmail = getEmail();
  const [country, setCountry] = useState<Country>(
    () => COUNTRIES.find((item) => item.iso2 === getPhoneCountryIso2()) ?? DEFAULT_COUNTRY,
  );
  const [digits, setDigits] = useState(() => getPhoneDigits());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [touched, setTouched] = useState<{ preferredName?: boolean; phone?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const display = useMemo(
    () => formatPhoneDisplay(digits, country),
    [digits, country],
  );

  if (!fontsLoaded) return <View style={s.root} />;

  const legalNameError = validateLegalName(preferredName);
  const phoneError = validatePhone(digits, country);
  const showPreferredNameError =
    submitted || touched.preferredName ? legalNameError : undefined;
  const showPhoneError = submitted || touched.phone ? phoneError : undefined;

  const dismissKeyboard = () => Keyboard.dismiss();

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={s.content} onPress={dismissKeyboard}>
            <View style={s.form}>
              <OnboardingProgressPills active={2} total={5} />

              <View style={s.titleSection}>
                <Text style={s.title}>A few details</Text>
                <Text style={s.subtitle}>
                  We need this information to help tailor your clean-up experience and verify your
                  impact. Please make sure all details are accurate. You are responsible for making
                  sure your court accepts this program.
                </Text>
              </View>

              <View style={s.fieldSection}>
                <Text style={s.fieldLabel}>Full legal name</Text>
                <View>
                  <View style={[s.textField, showPreferredNameError ? s.fieldError : null]}>
                    <TextInput
                      style={s.textInput}
                      value={preferredName}
                      onChangeText={setPreferredName}
                      onBlur={() => setTouched((t) => ({ ...t, preferredName: true }))}
                      placeholder="Full legal name"
                      placeholderTextColor={C.textNavInactive}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      textContentType="name"
                      accessibilityLabel="Full legal name"
                    />
                  </View>
                  {showPreferredNameError ? (
                    <Text style={s.errorText}>{showPreferredNameError}</Text>
                  ) : (
                    <Text style={s.helperText}>
                      This name cannot be changed after setup. To change it later, contact admin.
                    </Text>
                  )}
                </View>
              </View>

              {prefilledEmail ? (
                <View style={s.fieldSection}>
                  <Text style={s.fieldLabel}>Email</Text>
                  <View
                    style={s.textField}
                    accessibilityLabel={`Email ${prefilledEmail}`}
                    accessibilityState={{ disabled: true }}
                  >
                    <Text style={s.prefilledEmail}>{prefilledEmail}</Text>
                  </View>
                </View>
              ) : null}

              <View style={s.fieldSection}>
                <Text style={s.fieldLabel}>Phone Number</Text>
                <View style={s.phoneRow}>
                  <AnimatedPressable
                    style={s.countryBtn}
                    onPress={() => {
                      dismissKeyboard();
                      setPickerOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Country code ${country.name}`}
                    accessibilityState={{ expanded: pickerOpen }}
                  >
                    <Text style={s.flagEmoji} accessibilityLabel={country.name}>
                      {country.flag}
                    </Text>
                    <CountryChevronDownIcon />
                  </AnimatedPressable>

                  <View style={s.phoneFieldCol}>
                    <View style={[s.phoneField, showPhoneError ? s.fieldError : null]}>
                      <Text style={s.dialCode}>+{country.dialCode}</Text>
                      <TextInput
                        style={s.phoneInput}
                        value={display}
                        onChangeText={(text) =>
                          setDigits(digitsOnly(text, country.maxDigits))
                        }
                        onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                        keyboardType="phone-pad"
                        maxLength={phoneDisplayMaxLength(country)}
                        placeholder={phonePlaceholder(country)}
                        placeholderTextColor={C.textNavInactive}
                        accessibilityLabel="Phone number"
                        textContentType="telephoneNumber"
                      />
                    </View>
                    {showPhoneError ? <Text style={s.errorText}>{showPhoneError}</Text> : null}
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        </ScrollView>

        <OnboardingInfoFooterActions
          onContinue={() => {
            dismissKeyboard();
            setSubmitted(true);
            if (legalNameError || phoneError) return;
            persistPreferredName(preferredName);
            persistPhone(country.iso2, digits);
            router.push('/account-details');
          }}
          onPrevious={() => {
            dismissKeyboard();
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/welcome');
          }}
          hideSkip
        />
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={pickerOpen}
        selectedIso2={country.iso2}
        onSelect={(item) => {
          setCountry(item);
          setDigits((prev) => digitsOnly(prev, item.maxDigits));
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 180,
  },
  content: {
    flexGrow: 1,
  },
  form: {
    gap: 30,
  },
  titleSection: {
    gap: 15,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    color: C.textPrimary,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textNavInactive,
    lineHeight: 22,
  },
  fieldSection: {
    gap: 20,
  },
  fieldLabel: {
    ...textStyles.headlineTopBar,
    color: C.textPrimary,
  },
  textField: {
    height: 56,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },
  textInput: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
    paddingVertical: 0,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  countryBtn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  flagEmoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  phoneField: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
  },
  phoneFieldCol: {
    flex: 1,
  },
  fieldError: {
    borderColor: C.statusDeclinedBorder,
  },
  errorText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.statusDeclinedText,
    marginTop: 2,
    marginLeft: 4,
  },
  helperText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textNavInactive,
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 16,
  },
  prefilledEmail: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
  },
  dialCode: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textNavInactive,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
    paddingVertical: 0,
  },
});
