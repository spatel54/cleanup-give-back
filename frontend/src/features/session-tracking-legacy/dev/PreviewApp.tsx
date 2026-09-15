import '../../../../global.css';

import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CameraPermissionScreen } from '../screens/CameraPermissionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LiveSessionScreen } from '../screens/LiveSessionScreen';
import { LocationPermissionScreen } from '../screens/LocationPermissionScreen';
import { MissedCheckpointScreen } from '../screens/MissedCheckpointScreen';
import { PhotoCheckpointScreen } from '../screens/PhotoCheckpointScreen';
import { PhotoSubmittedScreen } from '../screens/PhotoSubmittedScreen';
import { SessionReviewScreen } from '../screens/SessionReviewScreen';
import { SessionSetupScreen } from '../screens/SessionSetupScreen';
import { SubmissionConfirmationScreen } from '../screens/SubmissionConfirmationScreen';
import { colors } from '../tokens';

const SCREENS = [
  'session-setup',
  'location-permission',
  'camera-permission',
  'live-session',
  'photo-checkpoint',
  'photo-submitted',
  'missed-checkpoint',
  'session-review',
  'submission-confirmation',
  'home',
] as const;

type ScreenKey = (typeof SCREENS)[number];

const SCREEN_LABELS: Record<ScreenKey, string> = {
  'session-setup': 'Session Setup',
  'location-permission': 'Location Permission',
  'camera-permission': 'Camera Permission',
  'live-session': 'Live Session',
  'photo-checkpoint': 'Photo Checkpoint',
  'photo-submitted': 'Photo Submitted',
  'missed-checkpoint': 'Missed Checkpoint',
  'session-review': 'Session Review',
  'submission-confirmation': 'Submission Confirmation',
  home: 'Home',
};

/**
 * Standalone dev harness for the Session Tracking feature — exercises the
 * full flow end to end (PRD §6.9–6.15) without touching the main Expo
 * Router tree. Point a temporary route or `expo start --dev-client`
 * entry at this component to preview it (see README.md "Previewing this
 * feature"). Not part of the shipped app.
 */
export function PreviewApp() {
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const [screen, setScreen] = useState<ScreenKey>('session-setup');
  // Single source of truth for "is there a live session right now", set exactly
  // once when tracking starts and cleared exactly once when it truly ends.
  // `HomeScreen` derives its minimized-widget visibility straight from this —
  // no per-navigation-callsite toggling, so no call site can forget to
  // reset it (see docs/progress.md for the bug this replaced: the
  // CameraPermissionScreen "Skip" path used to skip the reset entirely).
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <DevSwitcher current={screen} onSelect={setScreen} />
          <View style={styles.stage}>
            {renderScreen(screen, setScreen, isTrackingActive, setIsTrackingActive)}
          </View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function renderScreen(
  screen: ScreenKey,
  setScreen: (s: ScreenKey) => void,
  isTrackingActive: boolean,
  setIsTrackingActive: (v: boolean) => void,
) {
  switch (screen) {
    case 'session-setup':
      return (
        <SessionSetupScreen
          onComplete={() => setScreen('location-permission')}
          onExit={() => setScreen('home')}
        />
      );
    case 'location-permission':
      return (
        <LocationPermissionScreen
          onNext={() => setScreen('camera-permission')}
          onBack={() => setScreen('session-setup')}
          onSkip={() => setScreen('camera-permission')}
        />
      );
    case 'camera-permission': {
      // Both "Next" and "Skip" start tracking — either way the next screen is
      // the live session, so both must flip the flag the same way.
      const startTracking = () => {
        setIsTrackingActive(true);
        setScreen('live-session');
      };
      return <CameraPermissionScreen onNext={startTracking} onBack={() => setScreen('location-permission')} onSkip={startTracking} />;
    }
    case 'live-session':
      return (
        <LiveSessionScreen
          onSubmitPhoto={() => setScreen('photo-checkpoint')}
          onEndSession={() => setScreen('session-review')}
          onMinimize={() => setScreen('home')}
          onOpenSessions={() => setScreen('session-review')}
        />
      );
    case 'photo-checkpoint':
      return (
        <PhotoCheckpointScreen
          onTakePhoto={() => setScreen('photo-submitted')}
          onDismiss={() => setScreen('live-session')}
        />
      );
    case 'photo-submitted':
      return <PhotoSubmittedScreen onContinue={() => setScreen('live-session')} />;
    case 'missed-checkpoint':
      return (
        <MissedCheckpointScreen
          onRestart={() => setScreen('session-setup')}
          onReturnHome={() => {
            setIsTrackingActive(false);
            setScreen('home');
          }}
        />
      );
    case 'session-review':
      return (
        <SessionReviewScreen
          onBack={() => setScreen('live-session')}
          onSubmit={() => setScreen('submission-confirmation')}
        />
      );
    case 'submission-confirmation':
      return (
        <SubmissionConfirmationScreen
          onViewSession={() => setScreen('session-review')}
          onReturnHome={() => {
            setIsTrackingActive(false);
            setScreen('home');
          }}
        />
      );
    case 'home':
      return (
        <HomeScreen
          isSessionMinimized={isTrackingActive}
          onExpandSession={() => setScreen('live-session')}
          onStartSession={() => setScreen('session-setup')}
          onOpenSessions={() => setScreen('session-review')}
        />
      );
    default:
      return null;
  }
}

function DevSwitcher({
  current,
  onSelect,
}: {
  current: ScreenKey;
  onSelect: (screen: ScreenKey) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.switcher}
      contentContainerStyle={styles.switcherContent}
    >
      {SCREENS.map((key) => (
        <Text
          key={key}
          onPress={() => onSelect(key)}
          style={[styles.switcherChip, key === current && styles.switcherChipActive]}
        >
          {SCREEN_LABELS[key]}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  switcher: {
    flexGrow: 0,
    backgroundColor: colors.textPrimary,
  },
  switcherContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  switcherChip: {
    color: colors.textOnPrimary,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  switcherChipActive: {
    backgroundColor: colors.primary,
  },
  stage: {
    flex: 1,
  },
});
