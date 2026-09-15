import {
  IBMPlexSans_400Regular,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useAttentionShake, useFadeUpEnter } from '@/components/motion/hooks';
import { staggerDelay } from '@/motion';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter, type Href } from 'expo-router';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionSetupToggle } from '@/components/session-setup/SessionSetupToggle';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { CameraIcon } from '@/features/session-tracking/components/icons/CameraIcon';
import { LocationPinIcon } from '@/features/session-tracking/components/icons/LocationPinIcon';
import {
  clearPendingSessionSetup,
  getPendingSessionSetupForm,
  setPendingSessionSetupForm,
} from '@/features/session-tracking/pendingSessionSetup';
import { canUseSessionPhotos } from '@/constants/ageGate';
import { getServiceType } from '@/features/onboarding/onboardingStore';
import { searchAddressSuggestions, type AddressSuggestion } from '@/lib/geocodeAddress';
import { reverseGeocodeCurrentPlace } from '@/lib/sessionPlace';
import { startPendingLiveSession } from '@/features/session-tracking/startPendingLiveSession';
import { ensureTrackerAccessOrPaywall } from '@/utils/ensureTrackerAccess';
import {
  isSessionCameraPermissionGranted,
  isSessionLocationPermissionGranted,
  requestSessionLocationPermission,
} from '@/utils/sessionPermissions';

import { colors as tokens, textStyles } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  bgSurface: tokens.chipBg,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
  labelOptional: tokens.borderOutline,
  statusDeclined: tokens.statusDeclinedText,
} as const;

type FieldErrors = {
  place: boolean;
  location: boolean;
  camera: boolean;
};

const EMPTY_FIELD_ERRORS: FieldErrors = {
  place: false,
  location: false,
  camera: false,
};

function defaultCourtOrdered(): boolean {
  const pending = getPendingSessionSetupForm();
  if (pending) {
    return pending.courtOrdered;
  }
  return getServiceType() === 'Court Ordered';
}

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function formatLockedSessionDate(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function warnCannotTrackWithoutPermissions(photosRequired: boolean) {
  Alert.alert(
    'Permissions required',
    photosRequired
      ? 'You cannot track a session without Location and Camera permissions. Turn them on to start tracking.'
      : 'You cannot track a session without Location permission. Turn it on to start tracking.',
    [
      { text: 'OK', style: 'cancel' },
      { text: 'Open Settings', onPress: () => void Linking.openSettings() },
    ],
  );
}

function ValidationToastAlert({ labels }: { labels: string[] }) {
  const shakeStyle = useAttentionShake();

  return (
    <Animated.View
      style={[s.validationToast, shakeStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={s.validationToastTitle}>There are missing fields</Text>
      {labels.map((label) => (
        <Text key={label} style={s.validationToastLine}>
          {'\u2022  '}
          {label}
        </Text>
      ))}
    </Animated.View>
  );
}

/** Figma `session_setup_guide` form (260:1312) — PRD §6.9 session setup. */
export function SessionSetupFormScreen() {
  const router = useRouter();
  const [activity, setActivity] = useState(
    () => getPendingSessionSetupForm()?.activity ?? '',
  );
  const [courtOrdered, setCourtOrdered] = useState(defaultCourtOrdered);
  const [description, setDescription] = useState(
    () => getPendingSessionSetupForm()?.description ?? '',
  );
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [locating, setLocating] = useState(false);
  const skipSuggestRef = useRef(false);
  const didAutoLocateRef = useRef(false);
  const locatingRef = useRef(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [sessionDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_FIELD_ERRORS);
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [missingLabels, setMissingLabels] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const photosRequired = canUseSessionPhotos();
  const scrollRef = useRef<ScrollView>(null);

  const locatePlace = useCallback(async (force: boolean) => {
    if (locatingRef.current) {
      return;
    }
    if (!force && activity.trim()) {
      return;
    }
    locatingRef.current = true;
    setLocating(true);
    try {
      const alreadyGranted = await isSessionLocationPermissionGranted();
      if (!alreadyGranted) {
        const result = await requestSessionLocationPermission();
        setLocationEnabled(result.granted);
        if (!result.granted) {
          return;
        }
      } else {
        setLocationEnabled(true);
      }
      const label = await reverseGeocodeCurrentPlace();
      if (label) {
        skipSuggestRef.current = true;
        setActivity(label);
        setSuggestions([]);
      }
    } catch {
      // Manual entry still available.
    } finally {
      locatingRef.current = false;
      setLocating(false);
    }
  }, [activity]);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });
  // Default the permission toggles to "on" when the OS has already granted
  // them (e.g. via the onboarding or session-setup-guide permission prompts),
  // so the user doesn't have to re-enable something iOS already allows.
  useEffect(() => {
    let isMounted = true;

    void isSessionLocationPermissionGranted().then((granted) => {
      if (isMounted && granted) {
        setLocationEnabled(true);
      }
    });
    void isSessionCameraPermissionGranted().then((granted) => {
      if (isMounted && granted) {
        setCameraEnabled(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!locationEnabled || didAutoLocateRef.current) {
      return;
    }
    didAutoLocateRef.current = true;
    void locatePlace(false);
  }, [locationEnabled, locatePlace]);

  useEffect(() => {
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      return;
    }
    const query = activity.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const handle = setTimeout(() => {
      void searchAddressSuggestions(query, { limit: 5, signal: controller.signal })
        .then((hits) => {
          if (!controller.signal.aborted) {
            setSuggestions(hits);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
          }
        });
    }, 280);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [activity]);

  const introStyle = useFadeUpEnter(0);
  const fieldsStyle = useFadeUpEnter(staggerDelay(1));
  const permissionsStyle = useFadeUpEnter(staggerDelay(2));
  const ctaStyle = useFadeUpEnter(staggerDelay(3));

  const handleBack = () => {
    clearPendingSessionSetup();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/session-setup-complete');
  };

  const collectValidationErrors = (
    locationOn: boolean,
    cameraOn: boolean,
    placeValue = activity,
  ) => {
    const missing: string[] = [];
    const errors: FieldErrors = { ...EMPTY_FIELD_ERRORS };

    if (!placeValue.trim()) {
      missing.push('Where are you?');
      errors.place = true;
    }

    if (!locationOn) {
      missing.push('Location');
      errors.location = true;
    }

    if (canUseSessionPhotos() && !cameraOn) {
      missing.push('Camera');
      errors.camera = true;
    }

    return { missing, errors };
  };

  const applyValidationState = (
    locationOn: boolean,
    cameraOn: boolean,
    placeValue = activity,
  ) => {
    const { missing, errors } = collectValidationErrors(locationOn, cameraOn, placeValue);
    setFieldErrors(errors);
    setMissingLabels(missing);
    setShowValidationToast(missing.length > 0);
    return missing.length === 0;
  };

  const refreshValidationFeedback = (
    nextLocation = locationEnabled,
    nextCamera = cameraEnabled,
    nextPlace = activity,
  ) => {
    if (!showValidationToast) {
      return;
    }
    applyValidationState(nextLocation, nextCamera, nextPlace);
  };

  const setPlaceFromSource = (label: string) => {
    skipSuggestRef.current = true;
    setActivity(label);
    setSuggestions([]);
    if (showValidationToast) {
      requestAnimationFrame(() =>
        refreshValidationFeedback(locationEnabled, cameraEnabled, label),
      );
    }
  };

  const handleStartSession = () => {
    if (isStarting) {
      return;
    }

    Keyboard.dismiss();

    const isValid = applyValidationState(locationEnabled, cameraEnabled);

    if (!isValid) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setIsStarting(true);
    void (async () => {
      await requestSessionLocationPermission();

      if (!(await ensureTrackerAccessOrPaywall(router))) {
        setIsStarting(false);
        return;
      }

      setFieldErrors(EMPTY_FIELD_ERRORS);
      setShowValidationToast(false);
      setIsStarting(true);

      setPendingSessionSetupForm({
        activity: activity.trim(),
        dateIso: sessionDate.toISOString(),
        courtOrdered,
        description: description.trim(),
      });
      if (!canUseSessionPhotos()) {
        const started = await startPendingLiveSession();
        setIsStarting(false);
        if (!started) {
          return;
        }
        router.dismissTo('/');
        router.push('/live-session?from=onboarding' as Href);
        return;
      }
      // Push (not replace) so Cancel / back after retake returns to this form
      // with field state intact — replace left only the guide finale underneath
      // and made the next guide Previous hops jump to Home on a shallow stack.
      router.push('/photo-capture?mode=session-start' as Href);
      setIsStarting(false);
    })();
  };

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <View style={s.root}>
      <View style={s.topSection}>
        <SessionSetupTopAppBar title="Session Setup" onBack={handleBack} />
        {showValidationToast && missingLabels.length > 0 ? (
          <ValidationToastAlert labels={missingLabels} />
        ) : null}
      </View>

      <SafeAreaView style={s.body} edges={['bottom']}>
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Animated.View style={introStyle}>
          <View style={s.introCard}>
            <Text style={s.introTitle}>Ready to Make an Impact?</Text>
            <Text style={s.introSubtitle}>
              Fill out the details to start tracking your clean-up session.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[fieldsStyle, s.fieldsStack]}>
        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, fieldErrors.place && s.fieldLabelError]}>
            Where are you?
          </Text>
          <View style={[s.input, s.placeInput, fieldErrors.place && s.inputError]}>
            <LocationPinIcon color={C.textTertiary} size={18} strokeWidth={1.5} />
            <TextInput
              value={activity}
              onChangeText={(value) => {
                setActivity(value);
                if (showValidationToast) {
                  requestAnimationFrame(() =>
                    refreshValidationFeedback(locationEnabled, cameraEnabled, value),
                  );
                }
              }}
              style={s.placeTextInput}
              placeholder={locating ? 'Finding your location…' : 'Street, city, or park'}
              placeholderTextColor={C.labelOptional}
              accessibilityLabel="Where are you?"
            />
            {locating ? <ActivityIndicator color={C.primary} /> : null}
          </View>
          <AnimatedPressable
            onPress={() => void locatePlace(true)}
            disabled={locating}
            accessibilityRole="button"
            accessibilityLabel="Use current location"
            style={s.locateBtn}
          >
            <Text style={s.locateBtnText}>
              {locating ? 'Locating…' : 'Use current location'}
            </Text>
          </AnimatedPressable>
          {suggestions.length > 0 ? (
            <View style={s.suggestList}>
              {suggestions.map((hit) => (
                <Pressable
                  key={`${hit.label}-${hit.latitude}-${hit.longitude}`}
                  onPress={() => setPlaceFromSource(hit.label)}
                  accessibilityRole="button"
                  accessibilityLabel={hit.label}
                  style={s.suggestRow}
                >
                  <Text style={s.suggestText}>{hit.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Date</Text>
          <View
            style={[s.input, s.inputDisabled]}
            accessibilityLabel={`Date ${formatLockedSessionDate(sessionDate)}`}
            accessibilityState={{ disabled: true }}
          >
            <Text style={s.lockedDateText}>{formatLockedSessionDate(sessionDate)}</Text>
          </View>
        </View>

        <View style={s.courtBlock}>
        <View style={s.surfaceCard}>
          <View style={s.surfaceCardText}>
            <Text style={s.surfaceCardTitle}>Court Ordered Status</Text>
            <Text style={s.surfaceCardSubtitle}>
              Does this session count towards mandated hours?
            </Text>
          </View>
          <SessionSetupToggle
            value={courtOrdered}
            onValueChange={setCourtOrdered}
            accessibilityLabel="Court ordered status"
            offTrackColor={C.borderOutline}
          />
        </View>
        {courtOrdered ? (
          <Text style={s.courtScrutinyNote} accessibilityLiveRegion="polite">
            Court-ordered hours are reviewed carefully. GPS, photos, and timing must match a real
            cleanup.
          </Text>
        ) : null}
        </View>

        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>
            Description <Text style={s.optionalLabel}>(Optional)</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[s.input, s.textArea]}
            multiline
            textAlignVertical="top"
            placeholderTextColor={C.labelOptional}
            accessibilityLabel="Session description"
          />
        </View>
        </Animated.View>

        <Animated.View style={permissionsStyle}>
        <View style={[s.permissionsCard, (fieldErrors.location || fieldErrors.camera) && s.permissionsCardError]}>
          <Text
            style={[
              s.surfaceCardTitle,
              (fieldErrors.location || fieldErrors.camera) && s.fieldLabelError,
            ]}
          >
            Required Permissions*
          </Text>

          <View style={[s.permissionRow, fieldErrors.location && s.permissionRowError]}>
            <View style={s.permissionLabel}>
              <LocationPinIcon color={C.textTertiary} size={20} strokeWidth={1.5} />
              <Text style={[s.permissionText, fieldErrors.location && s.fieldLabelError]}>
                Location
              </Text>
            </View>
            <SessionSetupToggle
              offTrackColor={C.borderOutline}
              value={locationEnabled}
              onValueChange={(value) => {
                if (!value) {
                  setLocationEnabled(false);
                  warnCannotTrackWithoutPermissions(photosRequired);
                  if (showValidationToast) {
                    requestAnimationFrame(() => refreshValidationFeedback(false, cameraEnabled));
                  }
                  return;
                }
                void (async () => {
                  const result = await requestSessionLocationPermission();
                  setLocationEnabled(result.granted);
                  if (showValidationToast) {
                    requestAnimationFrame(() =>
                      refreshValidationFeedback(result.granted, cameraEnabled),
                    );
                  }
                })();
              }}
              accessibilityLabel="Location permission"
            />
          </View>

          {photosRequired ? (
          <View style={[s.permissionRow, fieldErrors.camera && s.permissionRowError]}>
            <View style={s.permissionLabel}>
              <CameraIcon color={C.textTertiary} size={20} strokeWidth={1.5} />
              <Text style={[s.permissionText, fieldErrors.camera && s.fieldLabelError]}>
                Camera
              </Text>
            </View>
            <SessionSetupToggle
              offTrackColor={C.borderOutline}
              value={cameraEnabled}
              onValueChange={(value) => {
                setCameraEnabled(value);
                if (!value) {
                  warnCannotTrackWithoutPermissions(true);
                }
                if (showValidationToast) {
                  requestAnimationFrame(() =>
                    refreshValidationFeedback(locationEnabled, value),
                  );
                }
              }}
              accessibilityLabel="Camera permission"
            />
          </View>
          ) : null}
        </View>
        </Animated.View>

        <Animated.View style={ctaStyle}>
        <AnimatedPressable
          style={[s.startBtn, isStarting && s.startBtnDisabled]}
          onPress={() => {
            void handleStartSession();
          }}
          disabled={isStarting}
          accessibilityRole="button"
          accessibilityLabel="Start session"
          accessibilityState={{ disabled: isStarting }}
        >
          <Text style={s.startBtnText}>{isStarting ? 'Starting…' : 'Start Session'}</Text>
        </AnimatedPressable>
        </Animated.View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  topSection: {
    zIndex: 10,
    backgroundColor: C.bgApp,
  },

  validationToast: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#ffd9de',
    borderWidth: 1,
    borderColor: C.statusDeclined,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },

  validationToastTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.statusDeclined,
    marginBottom: 2,
  },

  validationToastLine: {
    ...textStyles.bodySmall,
    fontFamily: 'NotoSans_500Medium',
    color: C.textPrimary,
  },

  scroll: {
    flex: 1,
  },

  body: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 30,
  },

  fieldsStack: {
    gap: 30,
  },

  introCard: {
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 6,
  },

  introTitle: {

    ...textStyles.headlineTopBar,

    color: C.textPrimary,

  },

  introSubtitle: {
    ...textStyles.bodySmall,
    color: C.textTertiary,
  },

  fieldGroup: {
    gap: 15,
  },

  fieldLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: C.textPrimary,
  },

  fieldLabelError: {
    color: C.statusDeclined,
  },

  optionalLabel: {
    color: C.labelOptional,
  },

  input: {
    height: 48,
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 6,
    paddingHorizontal: 16,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textPrimary,
  },

  placeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },

  placeTextInput: {
    flex: 1,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textPrimary,
    paddingVertical: 0,
  },

  locateBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },

  locateBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.primary,
  },

  suggestList: {
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 6,
    overflow: 'hidden',
  },

  suggestRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderOutline,
  },

  suggestText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
  },

  courtBlock: {
    gap: 8,
  },

  courtScrutinyNote: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: C.textTertiary,
    paddingHorizontal: 4,
  },

  inputError: {
    borderColor: C.statusDeclined,
  },

  inputDisabled: {
    backgroundColor: C.bgApp,
    justifyContent: 'center',
  },

  lockedDateText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textPrimary,
  },

  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },

  surfaceCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 96,
  },

  surfaceCardText: {
    flex: 1,
    gap: 2,
  },

  surfaceCardTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.textPrimary,
  },

  surfaceCardSubtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textTertiary,
    lineHeight: 16,
  },

  permissionsCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 21,
    gap: 10,
  },

  permissionsCardError: {
    borderColor: C.statusDeclined,
  },

  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: -8,
  },

  permissionRowError: {
    borderColor: C.statusDeclined,
  },

  permissionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  permissionText: {
    ...textStyles.bodyDefault,
    color: C.textTertiary,
  },

  startBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 30,
  },

  startBtnDisabled: {
    opacity: 0.7,
  },

  startBtnText: {
    ...textStyles.labelButtonLarge,
    color: C.textOnPrimary,
  },
});
