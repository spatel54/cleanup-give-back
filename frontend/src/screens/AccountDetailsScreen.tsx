import { useState } from 'react';
import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SessionSetupCalendarIcon } from '@/components/session-setup/icons/SessionSetupCalendarIcon';
import { isUnderMinimumAge } from '@/constants/ageGate';
import { SERVICE_TYPES, type ServiceType } from '@/constants/serviceTypes';
import {
  BirthdayPickerModal,
  DEFAULT_BIRTHDAY_PICKER_DATE,
  formatBirthdayDraft,
  formatBirthdayLabel,
  parseBirthdayDraft,
} from '@/features/figma-screens/components/BirthdayPickerModal';
import { colors as C, textStyles } from '@/features/figma-screens/tokens';
import {
  clearOnboardingSignupData,
  getBirthday,
  getServiceType,
  setBirthday as persistBirthday,
  setServiceType as persistServiceType,
} from '@/features/onboarding/onboardingStore';
import { clearCreateAccountDraft } from '@/lib/createAccountDraft';
import { createAccountAfterPersonalDetails } from '@/lib/createAccountAfterPersonalDetails';
import { isRegisteredSession } from '@/lib/authHelpers';
import { getCurrentSession, signOutCurrentUser } from '@/lib/supabase';
import { deleteVolunteerAccount } from '@/lib/volunteerAccount';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
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

function validate(birthday: Date | null, birthdayText: string, serviceType: ServiceType | null) {
  const errors: { birthday?: string; serviceType?: string } = {};
  if (!birthdayText.trim()) {
    errors.birthday = 'Birthday is required';
  } else if (!birthday) {
    errors.birthday = 'Enter a valid birthday (MM/YYYY)';
  }
  if (!serviceType) errors.serviceType = 'Select a service type';
  return errors;
}

function CalendarIcon({ color = C.textTertiary }: { color?: string }) {
  return <SessionSetupCalendarIcon color={color} size={18} />;
}

/** Figma `details_account` (112:6882) — account onboarding step 3 of 5. */
export function AccountDetailsScreen() {
  const router = useRouter();
  const [birthday, setBirthday] = useState<Date | null>(() => getBirthday());
  const [birthdayText, setBirthdayText] = useState(() => {
    const existing = getBirthday();
    return existing ? formatBirthdayLabel(existing) : '';
  });
  const [pickerDate, setPickerDate] = useState(() => getBirthday() ?? DEFAULT_BIRTHDAY_PICKER_DATE);
  const [showPicker, setShowPicker] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType | null>(() => getServiceType());
  const [touched, setTouched] = useState<{ birthday?: boolean; serviceType?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  const errors = validate(birthday, birthdayText, serviceType);
  const showError = (field: keyof typeof errors) =>
    (submitted || touched[field]) ? errors[field] : undefined;

  const commitTypedBirthday = () => {
    const parsed = parseBirthdayDraft(birthdayText);
    if (parsed) {
      setBirthday(parsed);
      setPickerDate(parsed);
      setBirthdayText(formatBirthdayLabel(parsed));
      return;
    }
    if (birthday) {
      setBirthdayText(formatBirthdayLabel(birthday));
      return;
    }
    setBirthdayText(formatBirthdayDraft(birthdayText));
  };

  const openPicker = () => {
    Keyboard.dismiss();
    setPickerDate(birthday ?? DEFAULT_BIRTHDAY_PICKER_DATE);
    setShowPicker(true);
  };

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
          <Pressable style={s.content} onPress={Keyboard.dismiss}>
            <View style={s.form}>
              <OnboardingProgressPills active={3} total={5} />

              <View style={s.titleSection}>
                <Text style={s.title}>A few details</Text>
                <Text style={s.subtitle}>
                  We need this information to help tailor your clean-up experience and verify your
                  impact. Please make sure all details are accurate. You are responsible for making
                  sure your court accepts this program.
                </Text>
              </View>

              <View style={s.formSection}>
                <Text style={s.sectionTitle}>Birthday</Text>
                <View>
                  <View style={[s.dateField, showError('birthday') ? s.fieldError : null]}>
                    <TextInput
                      style={s.dateInput}
                      value={birthdayText}
                      onChangeText={(text) => {
                        const next = formatBirthdayDraft(text);
                        setBirthdayText(next);
                        const parsed = parseBirthdayDraft(next);
                        if (parsed) {
                          setBirthday(parsed);
                          setPickerDate(parsed);
                        } else if (next.length === 0) {
                          setBirthday(null);
                        }
                      }}
                      onBlur={() => {
                        commitTypedBirthday();
                        setTouched((t) => ({ ...t, birthday: true }));
                      }}
                      onSubmitEditing={commitTypedBirthday}
                      placeholder="MM/YYYY"
                      placeholderTextColor={C.textTertiary}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      maxLength={7}
                      accessibilityLabel="Birthday month and year"
                    />
                    <AnimatedPressable
                      style={s.calendarBtn}
                      onPress={openPicker}
                      accessibilityRole="button"
                      accessibilityLabel="Open birthday picker"
                      hitSlop={8}
                    >
                      <CalendarIcon color={showError('birthday') ? C.statusDeclinedText : C.textTertiary} />
                    </AnimatedPressable>
                  </View>
                  {showError('birthday') ? <Text style={s.errorText}>{showError('birthday')}</Text> : null}
                </View>
              </View>

              <View style={s.formSection}>
                <Text style={s.sectionTitle}>Service Type</Text>
                <View>
                  <View style={s.serviceGrid}>
                    <View style={s.serviceRow}>
                      {(SERVICE_TYPES.slice(0, 2) as ServiceType[]).map((type) => (
                        <ServiceTypeButton
                          key={type}
                          label={type}
                          selected={serviceType === type}
                          onPress={() => {
                            setServiceType(type);
                            setTouched((t) => ({ ...t, serviceType: true }));
                          }}
                        />
                      ))}
                    </View>
                    <View style={s.serviceRow}>
                      {(SERVICE_TYPES.slice(2) as ServiceType[]).map((type) => (
                        <ServiceTypeButton
                          key={type}
                          label={type}
                          selected={serviceType === type}
                          onPress={() => {
                            setServiceType(type);
                            setTouched((t) => ({ ...t, serviceType: true }));
                          }}
                        />
                      ))}
                    </View>
                  </View>
                  {showError('serviceType') ? <Text style={s.errorText}>{showError('serviceType')}</Text> : null}
                </View>
              </View>
            </View>
          </Pressable>
        </ScrollView>

        <OnboardingInfoFooterActions
          onContinue={() => {
            Keyboard.dismiss();
            commitTypedBirthday();
            setSubmitted(true);
            const resolved = parseBirthdayDraft(birthdayText) ?? birthday;
            const currentErrors = validate(resolved, birthdayText, serviceType);
            if (Object.keys(currentErrors).length > 0 || busy) return;
            if (resolved && isUnderMinimumAge(resolved)) {
              setBusy(true);
              void (async () => {
                try {
                  const session = await getCurrentSession();
                  if (isRegisteredSession(session)) {
                    try {
                      await deleteVolunteerAccount();
                    } catch {
                      clearCreateAccountDraft();
                      clearOnboardingSignupData();
                      await signOutCurrentUser();
                    }
                  } else {
                    clearCreateAccountDraft();
                    clearOnboardingSignupData();
                  }
                } finally {
                  router.replace('/under-age');
                }
              })();
              return;
            }
            persistBirthday(resolved);
            persistServiceType(serviceType);
            setFormError(null);
            setBusy(true);
            void (async () => {
              const result = await createAccountAfterPersonalDetails(router);
              if (result.ok) {
                return;
              }
              if (!result.canceled) {
                setFormError(result.error);
              }
              setBusy(false);
            })();
          }}
          onPrevious={() => {
            Keyboard.dismiss();
            router.back();
          }}
          hideSkip
          compact
          disabled={busy}
          continueLabel={busy ? 'Creating…' : 'Continue'}
        />
        {formError ? (
          <Text style={s.footerError} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
      </KeyboardAvoidingView>

      <BirthdayPickerModal
        visible={showPicker}
        value={pickerDate}
        onChange={setPickerDate}
        onConfirm={(date) => {
          setBirthday(date);
          setBirthdayText(formatBirthdayLabel(date));
        }}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
  );
}

function ServiceTypeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      style={[s.serviceBtn, selected && s.serviceBtnActive]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[s.serviceBtnText, selected && s.serviceBtnTextActive]}>{label}</Text>
    </AnimatedPressable>
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
    paddingBottom: 280,
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
    color: C.textTertiary,
    lineHeight: 22,
  },
  formSection: {
    gap: 20,
  },
  sectionTitle: {
    ...textStyles.headlineTopBar,
    color: C.textPrimary,
  },
  dateField: {
    height: 56,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
    paddingVertical: 0,
  },
  calendarBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  serviceGrid: {
    gap: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceBtn: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  serviceBtnActive: {
    borderColor: C.primary,
    backgroundColor: C.statusApprovedBg,
  },
  serviceBtnText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: C.textTertiary,
    textAlign: 'center',
  },
  serviceBtnTextActive: {
    color: C.primary,
  },
  footerError: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.statusDeclinedText,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
