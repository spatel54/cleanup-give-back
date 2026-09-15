import React, { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionBottomNavStack,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { SessionSetupToggle } from '@/components/session-setup/SessionSetupToggle';
import { TrackerMapDarkIcon } from '@/features/session-tracking/components/icons/TrackerMapThemeIcons';
import { TRACKER_ACCESS_PRICE } from '@/constants/commerce';
import {
  isValidCompanyCode,
  markTrackerPaid,
  useTrackerHasPaid,
} from '@/features/session-tracking/trackerPaymentStore';
import { usePersonalDetails, usePreferredName } from '@/features/onboarding/onboardingStore';
import {
  getCachedProfilePhotoUri,
  loadProfilePhotoUrl,
  removeProfilePhoto,
  uploadProfilePhoto,
} from '@/lib/profilePhoto';
import { getServiceType } from '@/lib/supabase';
import { openDownloadServiceRecord } from '@/features/session-tracking/openDownloadServiceRecord';
import { logOutVolunteer } from '@/lib/volunteerAccount';
import {
  isSessionNotificationPermissionGranted,
  requestSessionNotificationPermission,
} from '@/utils/notificationPermissions';
import {
  isSessionCameraPermissionGranted,
  isSessionLocationPermissionGranted,
  requestSessionCameraPermission,
  requestSessionLocationPermission,
} from '@/utils/sessionPermissions';

import {
  AccountChevronIcon,
  ApprovalHistoryIcon,
  CameraAccessIcon,
  CopyrightIcon,
  DonationHistoryIcon,
  ExportRecordIcon,
  LocationAccessIcon,
  LettersRowIcon,
  NotificationsRowIcon,
  OrderHistoryIcon,
  PrivacyRowIcon,
  ProfileLeafLargeIcon,
  ProfileLeafSmallIcon,
  RequestDataIcon,
} from '../components/AccountIcons';
import {
  CompanyCodeConfirmModal,
  CompanyCodeUpgradeSuccessModal,
} from '../components/CompanyCodeModals';
import { PersonalDetailsRowIcon } from '../components/PersonalDetailsIcon';
import { ProfilePhotoCropModal } from '../components/ProfilePhotoCropModal';
import { defaultAccountProfile, type AccountProfile } from '../mocks/account';
import { firstTimeHomeDashboard } from '../mocks/home';
import { layout, colors, fontFamilies, radius, shadows, textStyles } from '../tokens';

/** Hidden (not deleted) — payment / company code moved to onboarding How it works. */
const SHOW_ACCOUNT_MEMBERSHIP = false;

const ACCOUNT_FAQ: { id: string; question: string; answer: string }[] = [
  {
    id: 'faq-1',
    question: 'How do I track my cleanup hours?',
    answer:
      'Tap Track, fill in Session Setup, and start the live tracker. Allow location so your walking path is recorded. If you are 18 or older, take checkpoint photos (selfie and progress) when the app asks. End the session to submit it. An admin reviews every session. Approved hours show on Home, Sessions, and Approval History.',
  },
  {
    id: 'faq-2',
    question: 'When can I download a service letter?',
    answer:
      'After an admin approves a session, open that session and tap Download PDF, or use Download Service Record under Records (or Export record on Sessions) to pick a date range. The signed PDF is for courts and schools. CSV is a spreadsheet of the same approved sessions.',
  },
  {
    id: 'faq-3',
    question: 'Where do my letters go after I download them?',
    answer:
      'Each PDF you download is saved under Records, then Letters. Letters only lists letters you have already downloaded, not every approved session. Tap a letter to view or share it again. Export all starts a new date-range download. Share on selected letters builds one combined PDF.',
  },
  {
    id: 'faq-4',
    question: 'Why was my session not approved?',
    answer:
      'Sessions need a real walking path and, if you are 18 or older, checkpoint photos with a visible high-visibility vest. If a session is declined, open it to read the reason. You can log another session and try again.',
  },
  {
    id: 'faq-5',
    question: 'What if I need to change my name?',
    answer:
      'Your legal name is locked after you create an account. Contact support@example.org if it needs an update. You can change your phone number under Edit Personal Details.',
  },
];

/** Derives 1-2 letter avatar initials from a display name. */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}


type NavRowProps = {
  label: string;
  icon?: ReactNode;
  onPress?: () => void;
};

function AccountNavRow({ label, icon, onPress }: NavRowProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={s.navRow}
    >
      <View style={s.navRowLeading}>
        {icon ? <View style={s.navRowIcon}>{icon}</View> : null}
        <Text style={s.navRowLabel}>{label}</Text>
      </View>
      <AccountChevronIcon width={16} height={16} />
    </AnimatedPressable>
  );
}

type ToggleRowProps = {
  label: string;
  icon: ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function AccountToggleRow({ label, icon, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={s.navRow}>
      <View style={s.navRowLeading}>
        <View style={s.navRowIcon}>{icon}</View>
        <Text style={s.navRowLabel}>{label}</Text>
      </View>
      <SessionSetupToggle
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
      />
    </View>
  );
}

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function FaqAccordionItem({
  question,
  answer,
  expanded,
  onToggle,
}: {
  question: string;
  answer: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={s.faqItem}>
      <AnimatedPressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={question}
        style={s.faqHeader}
      >
        <Text style={s.faqQuestion}>{question}</Text>
        <AccountChevronIcon
          width={16}
          height={16}
          style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }}
        />
      </AnimatedPressable>
      {expanded ? <Text style={s.faqAnswer}>{answer}</Text> : null}
    </View>
  );
}

function AccountTopAppBar() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom }]}>
      <View style={s.topBarTitleRow}>
        <Text style={s.topBarTitle}>Account</Text>
      </View>
    </View>
  );
}

function ProfileRoleTag({ isCourtOrdered }: { isCourtOrdered: boolean }) {
  const label = isCourtOrdered ? 'Court Ordered' : 'Volunteer';

  return (
    <View
      style={[
        s.roleTag,
        isCourtOrdered ? s.roleTagCourtOrdered : s.roleTagVolunteer,
      ]}
      accessibilityRole="text"
    >
      <Text
        style={[
          s.roleTagLabel,
          isCourtOrdered ? s.roleTagCourtOrderedLabel : s.roleTagVolunteerLabel,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ProfileHero({
  profile,
  photoUri,
  isUploadingPhoto,
  isCourtOrdered,
  onAvatarPress,
}: {
  profile: AccountProfile;
  photoUri: string | null;
  isUploadingPhoto: boolean;
  isCourtOrdered: boolean;
  onAvatarPress: () => void;
}) {
  return (
    <View style={s.profileHero}>
      {/* Figma ProfileHero leaves (569:917 / 569:918) — absolute, rotated, clipped by overflow */}
      <View style={s.profileLeafLarge} pointerEvents="none">
        <View style={s.profileLeafLargeRotate}>
          <ProfileLeafLargeIcon width={58} height={58} />
        </View>
      </View>
      <View style={s.profileLeafSmall} pointerEvents="none">
        <View style={s.profileLeafSmallRotate}>
          <ProfileLeafSmallIcon width={40} height={40} />
        </View>
      </View>

      <View style={s.profileTopRow}>
        <AnimatedPressable
          onPress={onAvatarPress}
          disabled={isUploadingPhoto}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          accessibilityHint="Opens options to take a photo or choose one from your library"
          style={s.avatarButton}
        >
          <View style={s.avatar}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={s.avatarImage} contentFit="cover" />
            ) : (
              <Text style={s.avatarText}>{profile.initials}</Text>
            )}
            {isUploadingPhoto ? (
              <View style={s.avatarOverlay}>
                <ActivityIndicator color={colors.white} />
              </View>
            ) : null}
          </View>
          <View style={s.avatarBadge} pointerEvents="none">
            <CameraAccessIcon width={14} height={14} />
          </View>
        </AnimatedPressable>
        <View style={s.profileNameCol}>
          <Text style={s.profileName}>{profile.displayName}</Text>
          <ProfileRoleTag isCourtOrdered={isCourtOrdered} />
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCol}>
          <Text style={[s.statValue, { color: colors.statusPendingText }]}>{profile.totalHoursLabel}</Text>
          <Text style={s.statLabel}>Total Hours</Text>
        </View>
        <View style={s.statCol}>
          <Text style={[s.statValue, { color: colors.primary }]}>{profile.approvedHoursLabel}</Text>
          <Text style={s.statLabel}>Approved</Text>
        </View>
        <View style={s.statCol}>
          <Text style={[s.statValue, { color: colors.textPrimary }]}>{profile.sessionsLabel}</Text>
          <Text style={s.statLabel}>Sessions</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Account tab (Figma `account`, node `569:896`).
 * Icons load from `frontend/assets/figma/account/*.svg`.
 */
export function AccountScreen({ profile = defaultAccountProfile }: { profile?: AccountProfile }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();
  const hasPaid = useTrackerHasPaid();
  const { serviceType: onboardingServiceType } = usePersonalDetails();
  const [supabaseServiceType, setSupabaseServiceType] = useState<string | null>(null);
  const isCourtOrdered = (supabaseServiceType ?? onboardingServiceType) === 'Court Ordered';
  const [cameraAccess, setCameraAccess] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);
  const [notificationsAccess, setNotificationsAccess] = useState(false);
  const [companyCode, setCompanyCode] = useState('');
  const [companyCodeError, setCompanyCodeError] = useState<string | undefined>();
  const [confirmCodeVisible, setConfirmCodeVisible] = useState(false);
  const [upgradeSuccessVisible, setUpgradeSuccessVisible] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropSourceUri, setCropSourceUri] = useState<string | null>(null);
  const [cropImageWidth, setCropImageWidth] = useState(0);
  const [cropImageHeight, setCropImageHeight] = useState(0);
  const preferredName = usePreferredName();

  // Same name shown in the Home greeting, so Account stays in sync with it.
  const displayName = preferredName || firstTimeHomeDashboard.homeUser.firstName;
  const heroProfile: AccountProfile = {
    ...profile,
    displayName,
    initials: getInitials(displayName),
  };

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 48;

  // Mirror the real OS permission status every time this screen is focused —
  // e.g. after the user grants/revokes access in the iOS Settings app and
  // comes back.
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      void isSessionCameraPermissionGranted().then((granted) => {
        if (isMounted) setCameraAccess(granted);
      });
      void isSessionLocationPermissionGranted().then((granted) => {
        if (isMounted) setLocationAccess(granted);
      });
      void isSessionNotificationPermissionGranted().then((granted) => {
        if (isMounted) setNotificationsAccess(granted);
      });
      void getServiceType().then((serviceType) => {
        if (isMounted) setSupabaseServiceType(serviceType);
      });
      void (async () => {
        const signedUrl = await loadProfilePhotoUrl();
        if (!isMounted) {
          return;
        }
        if (signedUrl) {
          setProfilePhotoUri(signedUrl);
          return;
        }
        const cachedUri = await getCachedProfilePhotoUri();
        if (isMounted) {
          setProfilePhotoUri(cachedUri);
        }
      })();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  const promptOpenSettings = useCallback((label: string) => {
    Alert.alert(
      `${label} access is off`,
      `To turn ${label.toLowerCase()} on, enable it for Expo Go in iOS Settings. The system permission dialog only appears the first time. After that, Settings is the only way to change it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
  }, []);

  const openProfilePhotoCrop = useCallback((uri: string, width: number, height: number) => {
    setCropSourceUri(uri);
    setCropImageWidth(width);
    setCropImageHeight(height);
    setCropModalVisible(true);
  }, []);

  const closeProfilePhotoCrop = useCallback(() => {
    setCropModalVisible(false);
    setCropSourceUri(null);
    setCropImageWidth(0);
    setCropImageHeight(0);
  }, []);

  const handleProfilePhotoSelected = useCallback(async (localUri: string) => {
    setProfilePhotoUri(localUri);
    setIsUploadingPhoto(true);

    try {
      const uploadedPath = await uploadProfilePhoto(localUri);
      if (!uploadedPath) {
        Alert.alert(
          'Photo not saved',
          'We could not upload your profile photo. Check your connection and try again.',
        );
        const signedUrl = await loadProfilePhotoUrl();
        setProfilePhotoUri(signedUrl ?? (await getCachedProfilePhotoUri()));
        return;
      }

      const signedUrl = await loadProfilePhotoUrl();
      if (signedUrl) {
        setProfilePhotoUri(signedUrl);
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  }, []);

  const pickProfilePhotoFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      promptOpenSettings('Photo Library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const asset = result.assets[0];
    openProfilePhotoCrop(asset.uri, asset.width ?? 1024, asset.height ?? 1024);
  }, [openProfilePhotoCrop, promptOpenSettings]);

  const takeProfilePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      promptOpenSettings('Camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const asset = result.assets[0];
    openProfilePhotoCrop(asset.uri, asset.width ?? 1024, asset.height ?? 1024);
  }, [openProfilePhotoCrop, promptOpenSettings]);

  const handleRemoveProfilePhoto = useCallback(async () => {
    setIsUploadingPhoto(true);
    try {
      const removed = await removeProfilePhoto();
      if (!removed) {
        Alert.alert(
          'Photo not removed',
          'We could not remove your profile photo. Check your connection and try again.',
        );
        return;
      }
      setProfilePhotoUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  }, []);

  const handleAvatarPress = useCallback(() => {
    const buttons: Array<{ text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }> = [
      { text: 'Take Photo', onPress: () => void takeProfilePhoto() },
      { text: 'Choose from Library', onPress: () => void pickProfilePhotoFromLibrary() },
    ];

    if (profilePhotoUri) {
      buttons.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => void handleRemoveProfilePhoto(),
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Profile Photo', 'Add or update the photo shown on your account.', buttons);
  }, [
    handleRemoveProfilePhoto,
    pickProfilePhotoFromLibrary,
    profilePhotoUri,
    takeProfilePhoto,
  ]);

  const handleCameraAccessChange = useCallback(
    async (value: boolean) => {
      if (!value) {
        // App cannot revoke OS permission — flip UI off and send user to Settings.
        setCameraAccess(false);
        promptOpenSettings('Camera');
        return;
      }

      const result = await requestSessionCameraPermission();
      setCameraAccess(result.granted);
      if (!result.granted) {
        promptOpenSettings('Camera');
      }
    },
    [promptOpenSettings],
  );

  const handleLocationAccessChange = useCallback(
    async (value: boolean) => {
      if (!value) {
        setLocationAccess(false);
        promptOpenSettings('Location');
        return;
      }

      const result = await requestSessionLocationPermission();
      setLocationAccess(result.granted);
      if (!result.granted) {
        promptOpenSettings('Location');
      }
    },
    [promptOpenSettings],
  );

  const handleNotificationsAccessChange = useCallback(
    async (value: boolean) => {
      if (!value) {
        setNotificationsAccess(false);
        promptOpenSettings('Notifications');
        return;
      }

      const result = await requestSessionNotificationPermission();
      setNotificationsAccess(result.granted);
      if (!result.granted) {
        promptOpenSettings('Notifications');
      }
    },
    [promptOpenSettings],
  );

  return (
    <View style={s.root}>
      <AccountTopAppBar />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          profile={heroProfile}
          photoUri={profilePhotoUri}
          isUploadingPhoto={isUploadingPhoto}
          isCourtOrdered={isCourtOrdered}
          onAvatarPress={handleAvatarPress}
        />

        <View style={s.sections}>
          <SectionCard title="Personal Details">
            <AccountNavRow
              label="Edit Personal Details"
              icon={<PersonalDetailsRowIcon width={16} height={16} />}
              onPress={() => router.push('/personal-details' as Href)}
            />
          </SectionCard>

          {SHOW_ACCOUNT_MEMBERSHIP ? (
          <SectionCard title="Membership">
            <View style={s.companyCodeBlock}>
              {hasPaid ? (
                <Text style={s.companyCodeUpgraded}>
                  Unlimited tracking is active.
                </Text>
              ) : (
                <>
                  <AnimatedPressable
                    style={s.payAccessBtn}
                    onPress={() =>
                      router.push('/checkout?mode=tracker&returnTo=account' as Href)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Pay ${TRACKER_ACCESS_PRICE.toFixed(2)} for unlimited tracking`}
                  >
                    <Text style={s.payAccessBtnLabel}>
                      {`Pay $${TRACKER_ACCESS_PRICE.toFixed(2)}`}
                    </Text>
                  </AnimatedPressable>
                  <Text style={s.companyCodeHint}>
                    One-time fee for unlimited tracking. Optional cleanup kit at checkout.
                  </Text>
                  <Text style={s.companyCodeOr}>or enter a company code</Text>
                  <View style={s.companyCodeRow}>
                    <TextInput
                      style={[
                        s.companyCodeInput,
                        companyCodeError ? s.companyCodeInputError : null,
                      ]}
                      value={companyCode}
                      onChangeText={(text) => {
                        setCompanyCode(text.replace(/\D/g, '').slice(0, 10));
                        setCompanyCodeError(undefined);
                      }}
                      keyboardType="number-pad"
                      maxLength={10}
                      placeholder="10-digit company code"
                      placeholderTextColor={colors.textNavInactive}
                      accessibilityLabel="Company code"
                    />
                    <AnimatedPressable
                      style={[
                        s.companyCodeApply,
                        companyCode.length !== 10 && s.companyCodeApplyDisabled,
                      ]}
                      disabled={companyCode.length !== 10}
                      onPress={() => {
                        if (!isValidCompanyCode(companyCode)) {
                          setCompanyCodeError('Invalid company code');
                          return;
                        }
                        setCompanyCodeError(undefined);
                        setConfirmCodeVisible(true);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Apply company code"
                      accessibilityState={{ disabled: companyCode.length !== 10 }}
                    >
                      <Text style={s.companyCodeApplyLabel}>Apply</Text>
                    </AnimatedPressable>
                  </View>
                  {companyCodeError ? (
                    <Text style={s.companyCodeError}>{companyCodeError}</Text>
                  ) : (
                    <Text style={s.companyCodeHint}>
                      A 10-digit company code also upgrades your account.
                    </Text>
                  )}
                </>
              )}
            </View>
          </SectionCard>
          ) : null}

          <SectionCard title="Records">
            <AccountNavRow
              label="Letters"
              icon={<LettersRowIcon width={20} height={20} />}
              onPress={() => router.push('/letters' as Href)}
            />
            <AccountNavRow
              label="Download Service Record"
              icon={<ExportRecordIcon />}
              onPress={() => {
                void openDownloadServiceRecord(() =>
                  router.push('/export-service-record?returnTo=account' as Href),
                );
              }}
            />
            <AccountNavRow
              label="Approval History"
              icon={<ApprovalHistoryIcon />}
              onPress={() => router.push('/approval-history' as Href)}
            />
            <AccountNavRow
              label="Request Data"
              icon={<RequestDataIcon />}
              onPress={() => router.push('/request-data' as Href)}
            />
          </SectionCard>

          <SectionCard title="Shop">
            <AccountNavRow
              label="Order History"
              icon={<OrderHistoryIcon />}
              onPress={() => router.push('/order-history' as Href)}
            />
            <AccountNavRow
              label="Donation History"
              icon={<DonationHistoryIcon />}
              onPress={() => router.push('/donation-history' as Href)}
            />
          </SectionCard>

          <SectionCard title="Preferences">
            <AccountNavRow
              label="Notification Preferences"
              icon={<NotificationsRowIcon />}
              onPress={() => router.push('/notifications?tab=preferences&preferencesOnly=1' as Href)}
            />
            <AccountNavRow
              label="Privacy"
              icon={<PrivacyRowIcon />}
              onPress={() => router.push('/privacy-policy' as Href)}
            />
            <AccountNavRow
              label="Map Theme"
              icon={<TrackerMapDarkIcon color={colors.textTertiary} size={18} />}
              onPress={() => router.push('/map-theme' as Href)}
            />
          </SectionCard>

          <SectionCard title="Permissions">
            <AccountToggleRow
              label="Camera Access"
              icon={<CameraAccessIcon />}
              value={cameraAccess}
              onValueChange={handleCameraAccessChange}
            />
            <AccountToggleRow
              label="Location Access"
              icon={<LocationAccessIcon />}
              value={locationAccess}
              onValueChange={handleLocationAccessChange}
            />
            <AccountToggleRow
              label="Notifications"
              icon={<NotificationsRowIcon />}
              value={notificationsAccess}
              onValueChange={handleNotificationsAccessChange}
            />
          </SectionCard>

          <SectionCard title="FAQ">
            {ACCOUNT_FAQ.map((item) => (
              <FaqAccordionItem
                key={item.id}
                question={item.question}
                answer={item.answer}
                expanded={expandedFaqId === item.id}
                onToggle={() =>
                  setExpandedFaqId((prev) => (prev === item.id ? null : item.id))
                }
              />
            ))}
          </SectionCard>

          <View style={s.feedbackCard}>
            <AccountNavRow
              label="Give Feedback"
              onPress={() => router.push('/give-feedback' as Href)}
            />
          </View>

        </View>

        <View style={s.actions}>
          <AnimatedPressable
            onPress={() => {
              Alert.alert('Log out?', 'You will need to sign in again to track hours.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log Out',
                  style: 'destructive',
                  onPress: () => {
                    void (async () => {
                      try {
                        await logOutVolunteer();
                        router.replace('/welcome' as Href);
                      } catch {
                        Alert.alert('Could not log out', 'Check your connection and try again.');
                      }
                    })();
                  },
                },
              ]);
            }}
            accessibilityRole="button"
            accessibilityLabel="Log Out"
            style={s.logOutBtn}
          >
            <Text style={s.logOutLabel}>Log Out</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => router.push('/delete-account-confirm' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Delete Account"
            style={s.deleteBtn}
          >
            <Text style={s.deleteLabel}>Delete Account</Text>
          </AnimatedPressable>
        </View>

        <View style={s.copyrightBlock}>
          <View style={s.copyrightRow}>
            <CopyrightIcon width={16} height={16} />
            <Text style={s.copyrightText}>
              CleanUp Give Back is a 501(c)(3) nonprofit corporation.
            </Text>
          </View>
        </View>
      </ScrollView>

      <LiveSessionBottomNavStack
        isActive={isActive}
        barStyle={barStyle}
        expandLiveSession={expandLiveSession}
        bottomInset={bottomInset}
      >
        <BottomNavBar
          activeTab="profile"
          onHomePress={() => router.replace('/')}
          onShopPress={() => router.push('/shop' as Href)}
          onTrackPress={onTrackPress}
          onSessionsPress={() => router.push('/sessions-list' as Href)}
          onProfilePress={() => {}}
        />
      </LiveSessionBottomNavStack>

      <CompanyCodeConfirmModal
        visible={confirmCodeVisible}
        onCancel={() => setConfirmCodeVisible(false)}
        onConfirm={() => {
          setConfirmCodeVisible(false);
          markTrackerPaid();
          setCompanyCode('');
          setUpgradeSuccessVisible(true);
        }}
      />
      <CompanyCodeUpgradeSuccessModal
        visible={upgradeSuccessVisible}
        onDone={() => setUpgradeSuccessVisible(false)}
      />
      <ProfilePhotoCropModal
        visible={cropModalVisible}
        imageUri={cropSourceUri}
        imageWidth={cropImageWidth}
        imageHeight={cropImageHeight}
        onCancel={closeProfilePhotoCrop}
        onConfirm={(croppedUri) => {
          closeProfilePhotoCrop();
          void handleProfilePhotoSelected(croppedUri);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  courtDisclaimer: {
    backgroundColor: colors.statusPendingBg,
    borderWidth: 1,
    borderColor: colors.statusPendingBorder,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  courtDisclaimerText: {
    ...textStyles.bodySmall,
    color: colors.statusPendingText,
  },
  faqItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
    paddingVertical: 4,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  faqQuestion: {
    ...textStyles.bodyDefault,
    color: colors.textPrimary,
    flex: 1,
  },
  faqAnswer: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
    paddingBottom: 12,
  },
  topBar: {
    backgroundColor: colors.white,
  },
  topBarTitleRow: {
    minHeight: layout.topBarTitleRow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  profileHero: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 19,
    paddingTop: 19,
    paddingBottom: 16,
    overflow: 'hidden',
    minHeight: 171,
  },
  // Figma 569:917 — wrapper 70.5×70.5 at top≈-16 / right≈-7, icon 57.6 rotated −75°
  profileLeafLarge: {
    position: 'absolute',
    top: -16,
    right: -7,
    width: 71,
    height: 71,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLeafLargeRotate: {
    transform: [{ rotate: '-75deg' }],
  },
  // Figma 569:918 — wrapper 56.8×56.8 at top≈23 / right≈-9, icon 40.3 rotated −50°
  profileLeafSmall: {
    position: 'absolute',
    top: 23,
    right: -9,
    width: 57,
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLeafSmallRotate: {
    transform: [{ rotate: '-50deg' }],
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarButton: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayScrim,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.headlineDetail,
    color: colors.textOnPrimary,
  },
  profileNameCol: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  roleTag: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  roleTagCourtOrdered: {
    backgroundColor: colors.statusPendingBg,
    borderColor: colors.statusPendingBorder,
  },
  roleTagCourtOrderedLabel: {
    color: colors.statusPendingText,
  },
  roleTagVolunteer: {
    backgroundColor: colors.statusApprovedBg,
    borderColor: colors.statusApprovedBorder,
  },
  roleTagVolunteerLabel: {
    color: colors.statusApprovedText,
  },
  roleTagLabel: {
      ...textStyles.labelStatus,
    },
  profileEmail: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
  },
  statLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  sections: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 21,
    gap: 16,
  },
  feedbackCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 21,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  sectionBody: {
    gap: 4,
  },
  companyCodeBlock: {
    gap: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  payAccessBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payAccessBtnLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.white,
  },
  companyCodeOr: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.textNavInactive,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 12,
    marginBottom: 12,
  },
  companyCodeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  companyCodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  companyCodeInputError: {
    borderColor: colors.statusDeclinedBorder,
  },
  companyCodeApply: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  companyCodeApplyDisabled: {
    opacity: 0.5,
  },
  companyCodeApplyLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 14,
    color: colors.white,
  },
  companyCodeError: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.statusDeclinedText,
  },
  companyCodeHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    lineHeight: 16,
  },
  companyCodeUpgraded: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  navRowLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navRowIcon: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRowLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  actions: {
    gap: 12,
    paddingTop: 16,
  },
  logOutBtn: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logOutLabel: {
    ...textStyles.labelButton,
    color: colors.textTertiary,
  },
  deleteBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  deleteLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.statusDeclinedText,
  },
  copyrightBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  copyrightRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyrightText: {
    flexShrink: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.textNavInactive,
  },
});
