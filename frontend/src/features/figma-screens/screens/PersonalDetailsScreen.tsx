import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupCalendarIcon } from '@/components/session-setup/icons/SessionSetupCalendarIcon';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';
import { SERVICE_TYPES, type ServiceType } from '@/constants/serviceTypes';
import {
  confirmEmailChangeCode,
  requestEmailChangeCode,
} from '@/lib/emailsApi';
import { AccountChevronIcon } from '../components/AccountIcons';
import {
  formatBirthdayLabel,
} from '../components/BirthdayPickerModal';
import {
  CountryChevronDownIcon,
  CountryPickerModal,
  digitsOnly,
  formatPhoneDisplay,
  phoneDisplayMaxLength,
  phonePlaceholder,
  validatePhone,
} from '../components/CountryPickerModal';
import { EmailVerificationModal } from '../components/EmailVerificationModal';
import { SuccessConfirmationModal } from '../components/SuccessConfirmationModal';
import { colors, fontFamilies, radius, shadows, textStyles } from '../tokens';
import {
  getE164Phone,
  getEmail,
  getPhoneCountryIso2,
  getPhoneDigits,
  getPreferredName,
  usePersonalDetails,
  setEmail as persistEmail,
  setPhone as persistPhone,
} from '@/features/onboarding/onboardingStore';
import { syncVolunteerProfile } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Matches OnboardingInfoFooterActions' `compact` padding/button sizing
// (Account Details' footer) so the two Details screens' footers read at the
// same, slightly tighter scale.
const FOOTER_PAD_TOP = 32;
const PRIMARY_FOOTER_BTN_HEIGHT = 56;
const FOOTER_PAD_BOTTOM_MIN = 24;

function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required';
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address';
  return undefined;
}

/**
 * Account → Personal Details. Email (OTP) and phone are editable; name,
 * birthday, and service type are read-only.
 */
export function PersonalDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stored = usePersonalDetails();

  const [name] = useState(() => getPreferredName());
  const [email, setEmail] = useState(() => getEmail());
  const [initialEmail] = useState(() => getEmail().trim().toLowerCase());
  const [country, setCountry] = useState<Country>(
    () => COUNTRIES.find((item) => item.iso2 === getPhoneCountryIso2()) ?? DEFAULT_COUNTRY,
  );
  const [initialCountryIso2] = useState(() => getPhoneCountryIso2());
  const [digits, setDigits] = useState(() => getPhoneDigits());
  const [initialDigits] = useState(() => getPhoneDigits());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [birthdayText] = useState(() =>
    stored.birthday ? formatBirthdayLabel(stored.birthday) : '',
  );
  const [serviceType] = useState<ServiceType | null>(stored.serviceType);
  const [touched, setTouched] = useState<{ email?: boolean; phone?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);
  const [verifyVisible, setVerifyVisible] = useState(false);
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | undefined>();
  const [pendingEmail, setPendingEmail] = useState('');
  const [requesting, setRequesting] = useState(false);

  const emailError = validateEmail(email);
  const phoneError = validatePhone(digits, country);
  const showEmailError = submitted || touched.email ? emailError : undefined;
  const showPhoneError = submitted || touched.phone ? phoneError : undefined;

  const phoneDisplay = formatPhoneDisplay(digits, country);

  const footerBottom = Math.max(insets.bottom, FOOTER_PAD_BOTTOM_MIN);
  const scrollBottomPad = FOOTER_PAD_TOP + PRIMARY_FOOTER_BTN_HEIGHT + footerBottom + 16;

  const dismissKeyboard = () => Keyboard.dismiss();

  function persistPhoneIfChanged(): string {
    if (country.iso2 !== initialCountryIso2 || digits !== initialDigits) {
      persistPhone(country.iso2, digits);
    }
    return getE164Phone();
  }

  function syncProfile(nextEmail: string) {
    void syncVolunteerProfile({
      preferredName: name,
      email: nextEmail,
      phone: persistPhoneIfChanged(),
    });
  }

  async function handleSave() {
    dismissKeyboard();
    setSubmitted(true);

    if (validateEmail(email) || validatePhone(digits, country)) {
      return;
    }

    const nextEmail = email.trim();
    if (nextEmail.toLowerCase() === initialEmail) {
      syncProfile(nextEmail);
      setSaveSuccessVisible(true);
      return;
    }

    setRequesting(true);
    setVerifyError(undefined);
    try {
      await requestEmailChangeCode({ to: nextEmail });
      setPendingEmail(nextEmail);
      setVerifyVisible(true);
    } catch {
      setVerifyError('Could not send verification code. Try again.');
      setPendingEmail(nextEmail);
      setVerifyVisible(true);
    } finally {
      setRequesting(false);
    }
  }

  async function handleVerifyConfirm(code: string) {
    setVerifySubmitting(true);
    setVerifyError(undefined);
    try {
      await confirmEmailChangeCode({ to: pendingEmail, code });
      persistEmail(pendingEmail);
      setEmail(pendingEmail);
      syncProfile(pendingEmail);
      setVerifyVisible(false);
      setSaveSuccessVisible(true);
    } catch {
      setVerifyError('Invalid or expired code');
    } finally {
      setVerifySubmitting(false);
    }
  }

  function handleSaveSuccessDismiss() {
    setSaveSuccessVisible(false);
    router.back();
  }

  return (
    <View style={s.root}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top + 14 }]}>
          <AnimatedPressable
            scaleTo={0.97}
            onPress={() => router.back()}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <View style={s.backChevron}>
              <AccountChevronIcon width={16} height={16} />
            </View>
          </AnimatedPressable>
          <Text style={s.topBarTitle}>Personal Details</Text>
          <View style={s.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: scrollBottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={s.content} onPress={dismissKeyboard}>
            <View style={s.form}>
              <Text style={s.pageNotice}>
                You can update your email and phone number here. Name, birthday, and service type
                cannot be changed in the app. Contact admin if those need an update.
              </Text>

              <View style={s.fieldSection}>
                <Text style={[s.fieldLabel, s.fieldLabelDisabled]}>Preferred name</Text>
                <View>
                  <View style={[s.textField, s.fieldDisabled]}>
                    <TextInput
                      style={[s.textInput, s.textInputDisabled]}
                      value={name}
                      editable={false}
                      placeholder="Preferred name"
                      placeholderTextColor={colors.textNavInactive}
                      accessibilityLabel="Preferred name"
                      accessibilityState={{ disabled: true }}
                    />
                  </View>
                  <Text style={s.helperText}>
                    This name cannot be edited. Contact admin to update it.
                  </Text>
                </View>
              </View>

              <View style={s.fieldSection}>
                <Text style={s.fieldLabel}>Email</Text>
                <View>
                  <View style={[s.textField, showEmailError ? s.fieldError : null]}>
                    <TextInput
                      style={s.textInput}
                      value={email}
                      onChangeText={setEmail}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="Email address"
                      placeholderTextColor={colors.textNavInactive}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="done"
                      textContentType="emailAddress"
                      accessibilityLabel="Email"
                    />
                  </View>
                  {showEmailError ? (
                    <Text style={s.errorText}>{showEmailError}</Text>
                  ) : (
                    <Text style={s.helperText}>
                      Changing email requires a confirmation code sent to the new address.
                    </Text>
                  )}
                </View>
              </View>

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
                      value={phoneDisplay}
                      onChangeText={(text) => setDigits(digitsOnly(text, country.maxDigits))}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      editable
                      keyboardType="phone-pad"
                      maxLength={phoneDisplayMaxLength(country)}
                      placeholder={phonePlaceholder(country)}
                      placeholderTextColor={colors.textNavInactive}
                      accessibilityLabel="Phone number"
                      accessibilityState={{ disabled: false }}
                      textContentType="telephoneNumber"
                    />
                    </View>
                    {showPhoneError ? (
                      <Text style={s.errorText}>{showPhoneError}</Text>
                    ) : (
                      <Text style={s.helperText}>You can update your phone number here.</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={s.fieldSection}>
                <Text style={[s.fieldLabel, s.fieldLabelDisabled]}>Birthday</Text>
                <View>
                  <View style={[s.dateField, s.fieldDisabled]}>
                    <TextInput
                      style={[s.dateInput, s.textInputDisabled]}
                      value={birthdayText}
                      editable={false}
                      placeholder="MM/YYYY"
                      placeholderTextColor={colors.textNavInactive}
                      accessibilityLabel="Birthday month and year"
                      accessibilityState={{ disabled: true }}
                    />
                    <View style={s.calendarBtn}>
                      <SessionSetupCalendarIcon color={colors.textNavInactive} size={18} />
                    </View>
                  </View>
                  <Text style={s.helperText}>
                    This birthday cannot be edited. Contact admin to update it.
                  </Text>
                </View>
              </View>

              <View style={s.fieldSection}>
                <Text style={[s.fieldLabel, s.fieldLabelDisabled]}>Service Type</Text>
                <View>
                  <View style={s.serviceGrid}>
                    <View style={s.serviceRow}>
                      {SERVICE_TYPES.slice(0, 2).map((type) => (
                        <ServiceTypeButton
                          key={type}
                          label={type}
                          selected={serviceType === type}
                        />
                      ))}
                    </View>
                    <View style={s.serviceRow}>
                      {SERVICE_TYPES.slice(2).map((type) => (
                        <ServiceTypeButton
                          key={type}
                          label={type}
                          selected={serviceType === type}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={s.helperText}>
                    This service type cannot be edited. Contact admin to update it.
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.footer, { paddingBottom: footerBottom }]}>
        <AnimatedPressable
          style={[s.saveBtn, requesting && s.saveBtnDisabled]}
          onPress={() => {
            void handleSave();
          }}
          disabled={requesting}
          accessibilityRole="button"
          accessibilityLabel="Save personal details"
          accessibilityState={{ disabled: requesting }}
        >
          <Text style={s.saveBtnLabel}>
            {requesting ? 'Sending code…' : 'Save Changes'}
          </Text>
        </AnimatedPressable>
      </View>

      <EmailVerificationModal
        visible={verifyVisible}
        email={pendingEmail}
        submitting={verifySubmitting}
        error={verifyError}
        onConfirm={(code) => {
          void handleVerifyConfirm(code);
        }}
        onCancel={() => {
          setVerifyVisible(false);
          setVerifyError(undefined);
        }}
      />

      <SuccessConfirmationModal
        visible={saveSuccessVisible}
        message="Your personal details were saved."
        buttonLabel="Done"
        onPress={handleSaveSuccessDismiss}
      />

      <CountryPickerModal
        visible={pickerOpen}
        selectedIso2={country.iso2}
        onSelect={(item) => {
          setCountry(item);
          setDigits((prev) => digitsOnly(prev, item.maxDigits));
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

function ServiceTypeButton({
  label,
  selected,
}: {
  label: string;
  selected: boolean;
}) {
  return (
    <View
      style={[s.serviceBtn, selected && s.serviceBtnActive, s.serviceBtnDisabled]}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: true }}
    >
      <Text style={[s.serviceBtnText, selected && s.serviceBtnTextActive, s.textInputDisabled]}>
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.white,
  },
  backBtn: {
    padding: 4,
  },
  backChevron: {
    transform: [{ rotate: '180deg' }],
  },
  topBarTitle: {
    ...textStyles.headlineTopBar,
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  topBarSpacer: {
    width: 28,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  content: {
    flexGrow: 1,
  },
  form: {
    gap: 24,
  },
  pageNotice: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  fieldSection: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  fieldLabelDisabled: {
    color: colors.textNavInactive,
  },
  textField: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  fieldDisabled: {
    backgroundColor: colors.bgApp,
    opacity: 0.85,
  },
  fieldError: {
    borderColor: colors.statusDeclinedBorder,
  },
  textInput: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  textInputDisabled: {
    color: colors.textNavInactive,
  },
  helperText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    marginTop: 6,
    lineHeight: 16,
  },
  errorText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.statusDeclinedText,
    marginTop: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryBtn: {
    width: 72,
    height: 56,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    flexDirection: 'row',
    gap: 4,
  },
  flagEmoji: {
    fontSize: 22,
  },
  phoneFieldCol: {
    flex: 1,
  },
  phoneField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: colors.white,
    gap: 8,
  },
  dialCode: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: colors.white,
  },
  dateInput: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  calendarBtn: {
    padding: 4,
  },
  serviceGrid: {
    gap: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceBtn: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: colors.white,
  },
  serviceBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.statusApprovedBg,
  },
  serviceBtnDisabled: {
    opacity: 0.7,
  },
  serviceBtnText: {
    ...textStyles.bodyDefault,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  serviceBtnTextActive: {
    color: colors.primary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: FOOTER_PAD_TOP,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    ...shadows.navBottom,
  },
  saveBtn: {
    height: PRIMARY_FOOTER_BTN_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.white,
  },
});
