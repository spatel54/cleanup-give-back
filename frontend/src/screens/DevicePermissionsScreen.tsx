import {
  NotifApprovalIcon,
  NotifBellIcon,
  NotifEventsIcon,
  NotifPhotoIcon,
} from '@/components/onboarding/OnboardingIcons';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { canUseSessionPhotos } from '@/constants/ageGate';
import { CameraIcon } from '@/features/session-tracking/components/icons/CameraIcon';
import { LocationPinIcon } from '@/features/session-tracking/components/icons/LocationPinIcon';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import {
  getSessionNotificationPermission,
  requestSessionNotificationPermission,
  saveExpoPushTokenIfGranted,
} from '@/utils/notificationPermissions';
import {
  getSessionCameraPermission,
  getSessionLocationPermission,
  requestSessionCameraPermission,
  requestSessionLocationPermission,
  type SessionPermissionResult,
} from '@/utils/sessionPermissions';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter, type Href } from 'expo-router';
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PREFS: { key: string; label: string; Icon: ComponentType<{ color?: string }> }[] = [
  { key: 'approval', label: 'Approval Updates', Icon: NotifApprovalIcon },
  { key: 'photo', label: 'Photo Alerts', Icon: NotifPhotoIcon },
  { key: 'events', label: 'New Events', Icon: NotifEventsIcon },
  { key: 'reminders', label: 'Session Reminders', Icon: NotifBellIcon },
];

type RowKey = 'location' | 'camera' | 'notifications';

function settingsCopy(kind: RowKey): { title: string; body: string } {
  if (kind === 'location') {
    return {
      title: 'Location access is off',
      body: 'Enable Location for Expo Go in Settings to continue using location features.',
    };
  }
  if (kind === 'camera') {
    return {
      title: 'Camera access is off',
      body: 'Enable Camera for Expo Go in Settings to continue using photo checkpoints.',
    };
  }
  return {
    title: 'Notifications are off',
    body: 'Enable Notifications for Expo Go in Settings to get alerts.',
  };
}

function PermissionRow({
  icon,
  title,
  why,
  granted,
  busy,
  onAllow,
}: {
  icon: ReactNode;
  title: string;
  why: string;
  granted: boolean;
  busy: boolean;
  onAllow: () => void;
}) {
  return (
    <View style={s.row}>
      <View style={s.rowHeader}>
        <View style={s.rowTitleGroup}>
          {icon}
          <Text style={s.rowTitle}>{title}</Text>
        </View>
        {granted ? (
          <View style={s.allowedBadge} accessibilityLabel={`${title} allowed`}>
            <Text style={s.allowedText}>Allowed</Text>
          </View>
        ) : (
          <AnimatedPressable
            style={[s.allowBtn, busy && s.allowBtnDisabled]}
            onPress={onAllow}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Allow ${title}`}
            accessibilityState={{ busy, disabled: busy }}
          >
            <Text style={s.allowBtnText}>{busy ? 'Asking…' : 'Allow'}</Text>
          </AnimatedPressable>
        )}
      </View>
      <Text style={s.rowWhy}>{why}</Text>
    </View>
  );
}

/** Combined onboarding location / camera / notifications step (replaces three hidden pages). */
export function DevicePermissionsScreen() {
  const router = useRouter();
  const photosRequired = canUseSessionPhotos();
  const [busyKey, setBusyKey] = useState<RowKey | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      getSessionLocationPermission(),
      getSessionCameraPermission(),
      getSessionNotificationPermission(),
    ]).then(([location, camera, notifications]) => {
      if (!mounted) return;
      setLocationGranted(location.granted);
      setCameraGranted(camera.granted);
      setNotificationsGranted(notifications.granted);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const finish = () => router.push('/setup-complete' as Href);

  const handleDenied = (kind: RowKey, result: SessionPermissionResult) => {
    if (result.granted || result.canAskAgain) {
      return;
    }
    const copy = settingsCopy(kind);
    Alert.alert(copy.title, copy.body, [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => void Linking.openSettings() },
    ]);
  };

  const requestRow = async (kind: RowKey) => {
    if (busyKey) return;
    setBusyKey(kind);
    try {
      if (kind === 'location') {
        const result = await requestSessionLocationPermission();
        setLocationGranted(result.granted);
        handleDenied(kind, result);
        return;
      }
      if (kind === 'camera') {
        const result = await requestSessionCameraPermission();
        setCameraGranted(result.granted);
        handleDenied(kind, result);
        return;
      }
      const result = await requestSessionNotificationPermission();
      setNotificationsGranted(result.granted);
      if (result.granted) {
        await saveExpoPushTokenIfGranted();
      }
      handleDenied(kind, result);
    } finally {
      setBusyKey(null);
    }
  };

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.main}>
          <OnboardingProgressPills active={4} total={5} />
          <View style={s.titleSection}>
            <Text style={s.title} accessibilityRole="header">
              Allow access
            </Text>
            <Text style={s.subtitle}>
              Location, camera, and notifications help verify cleanup hours.
            </Text>
          </View>

          <View style={s.stack}>
            <PermissionRow
              icon={<LocationPinIcon color={C.textTertiary} size={22} strokeWidth={1.5} />}
              title="Location"
              why="Used only during active cleanup sessions to verify your route. Allow Always so tracking can continue when the screen is locked."
              granted={locationGranted}
              busy={busyKey === 'location'}
              onAllow={() => void requestRow('location')}
            />

            {photosRequired ? (
              <PermissionRow
                icon={<CameraIcon color={C.textTertiary} size={22} strokeWidth={1.5} />}
                title="Camera"
                why="Camera access is required for photo checkpoints during sessions."
                granted={cameraGranted}
                busy={busyKey === 'camera'}
                onAllow={() => void requestRow('camera')}
              />
            ) : null}

            <View style={s.row}>
              <View style={s.rowHeader}>
                <View style={s.rowTitleGroup}>
                  <NotifBellIcon size={22} color={C.textTertiary} />
                  <Text style={s.rowTitle}>Notifications</Text>
                </View>
                {notificationsGranted ? (
                  <View style={s.allowedBadge} accessibilityLabel="Notifications allowed">
                    <Text style={s.allowedText}>Allowed</Text>
                  </View>
                ) : (
                  <AnimatedPressable
                    style={[s.allowBtn, busyKey === 'notifications' && s.allowBtnDisabled]}
                    onPress={() => void requestRow('notifications')}
                    disabled={Boolean(busyKey)}
                    accessibilityRole="button"
                    accessibilityLabel="Allow Notifications"
                    accessibilityState={{ busy: busyKey === 'notifications', disabled: Boolean(busyKey) }}
                  >
                    <Text style={s.allowBtnText}>
                      {busyKey === 'notifications' ? 'Asking…' : 'Allow'}
                    </Text>
                  </AnimatedPressable>
                )}
              </View>
              <Text style={s.rowWhy}>
                Get alerts about approvals, events, and photo checkpoints.
              </Text>
              <View style={s.prefWrap}>
                {PREFS.map(({ key, label, Icon }) => (
                  <View key={key} style={s.prefChip} accessibilityLabel={label}>
                    <Icon color={C.primary} />
                    <Text style={s.prefLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <OnboardingInfoFooterActions
        onContinue={finish}
        onPrevious={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/how-it-works' as Href);
        }}
        hideSkip
        disabled={Boolean(busyKey)}
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
    paddingBottom: 220,
  },
  main: {
    gap: 30,
  },
  titleSection: {
    gap: 15,
  },
  title: {
    ...textStyles.headlinePage,
    color: C.textPrimary,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textNavInactive,
    lineHeight: 24,
  },
  stack: {
    gap: 12,
  },
  row: {
    backgroundColor: C.chipBg,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textPrimary,
  },
  rowWhy: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textNavInactive,
  },
  allowBtn: {
    backgroundColor: C.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 76,
    alignItems: 'center',
  },
  allowBtnDisabled: {
    opacity: 0.7,
  },
  allowBtnText: {
    ...textStyles.labelButton,
    color: C.textOnPrimary,
  },
  allowedBadge: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: C.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 76,
    alignItems: 'center',
  },
  allowedText: {
    ...textStyles.labelButton,
    color: C.primary,
  },
  prefWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  prefChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.bgApp,
  },
  prefLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: C.textPrimary,
  },
});
