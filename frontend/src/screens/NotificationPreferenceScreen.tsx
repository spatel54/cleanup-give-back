import {
  NotifApprovalIcon,
  NotifBellIcon,
  NotifEventsIcon,
  NotifPhotoIcon,
} from '@/components/onboarding/OnboardingIcons';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C, textStyles } from '@/features/figma-screens/tokens';
import {
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { type ComponentType, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { requestSessionNotificationPermission } from '@/utils/notificationPermissions';
import { supabase } from '@/lib/supabase';

const PREFS: { key: string; label: string; Icon: ComponentType<{ color?: string }> }[] = [
  { key: 'approval', label: 'Approval Updates', Icon: NotifApprovalIcon },
  { key: 'photo', label: 'Photo Alerts', Icon: NotifPhotoIcon },
  { key: 'events', label: 'New Events', Icon: NotifEventsIcon },
  { key: 'reminders', label: 'Session Reminders', Icon: NotifBellIcon },
];

function PreferenceChip({
  label,
  Icon,
}: {
  label: string;
  Icon: ComponentType<{ color?: string }>;
}) {
  return (
    <View
      style={s.prefChip}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View style={s.prefInner}>
        <Icon color={C.primary} />
        <Text style={s.prefLabel}>{label}</Text>
      </View>
    </View>
  );
}

/** Figma `notif_account` (112:7130) — onboarding step 6 of 6. */
export function NotificationPreferenceScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  const finish = () => router.push('/setup-complete');

  const handleEnable = async () => {
    if (isRequesting) {
      return;
    }
    setIsRequesting(true);
    try {
      const result = await requestSessionNotificationPermission();
      if (!result.granted && !result.canAskAgain) {
        Alert.alert(
          'Notifications are off',
          'Enable Notifications for Expo Go in Settings to get alerts.',
          [
            { text: 'Not now', style: 'cancel', onPress: finish },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }

      // If permission granted, get and save push token
      if (result.granted) {
        try {
          const pushToken = await Notifications.getExpoPushTokenAsync();
          if (pushToken?.data && supabase) {
            // Get current user metadata
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const existingMetadata = user.user_metadata || {};
              // Merge push token into existing metadata
              await supabase.auth.updateUser({
                data: {
                  ...existingMetadata,
                  push_token: pushToken.data,
                },
              });
            }
          }
        } catch (tokenErr) {
          // Soft fail - don't block user from continuing
          console.warn('Failed to save push token:', tokenErr);
        }
      }
    } finally {
      setIsRequesting(false);
    }
    finish();
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.main}>
          <OnboardingProgressPills active={8} total={9} />
          <View style={s.titleSection}>
            <Text style={s.title}>Stay updated</Text>
            <Text style={s.subtitle}>
              Get alerts about approvals, events, and photo checkpoints.
            </Text>
          </View>
          <View style={s.prefList}>
            {PREFS.map(({ key, label, Icon }) => (
              <PreferenceChip key={key} label={label} Icon={Icon} />
            ))}
          </View>
        </View>
      </ScrollView>

      <OnboardingInfoFooterActions
        onContinue={handleEnable}
        onPrevious={() => router.back()}
        onSkip={finish}
        continueLabel={isRequesting ? 'Requesting…' : 'Enable notifications'}
        skipLabel="Not now"
        disabled={isRequesting}
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
    paddingBottom: 240,
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
    lineHeight: 22,
  },
  prefList: {
    width: '100%',
    gap: 26,
  },
  prefChip: {
    alignSelf: 'stretch',
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: C.borderOutline,
    backgroundColor: C.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: C.textPrimary,
  },
});
