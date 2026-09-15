import '@/global.css';
import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from '@/components/AuthProvider';
import { CheckpointAlertLoop } from '@/components/CheckpointAlertLoop';
import { CheckpointNotificationBootstrap } from '@/components/CheckpointNotificationBootstrap';
import { HomeTransitionCover } from '@/components/navigation/HomeTransitionCover';
import { prefetchAllOnboardingGraphics } from '@/components/onboarding/onboardingGraphics';
import { prefetchAllTourGraphics } from '@/components/onboarding/tourAssets';
import { prefetchAllShopGraphics } from '@/features/figma-screens/shopAssets';
import { colors } from '@/features/figma-screens/tokens';

import '@/features/session-tracking/backgroundLocationTask';

import { preloadGarbagio } from '@/components/ui/BrandLoadingView';
import { preloadPhotoCheckpointAlert } from '@/utils/photoCheckpointAlert';

// Kick off tour + session-setup image prefetch immediately at module load —
// before any navigation occurs — so images are in expo-image's memory-disk
// cache by the time the onboarding screens are visited.
prefetchAllTourGraphics();
prefetchAllOnboardingGraphics();
prefetchAllShopGraphics();
void preloadPhotoCheckpointAlert();
preloadGarbagio();

const guideBackwardScreenOptions = {
  animationTypeForReplace: 'pop' as const,
};

/**
 * Permission steps: Previous uses replace with `pop` (reverse slide). Skip /
 * auto-skip forward passes `enter=forward` so the same replace slides forward
 * like Continue.
 */
const guidePermissionScreenOptions = ({
  route,
}: {
  route: { params?: { enter?: string } };
}) => ({
  animationTypeForReplace:
    route.params?.enter === 'forward' ? ('push' as const) : ('pop' as const),
});

/**
 * `session-setup-complete` uses the same default slide as the other guide
 * screens. Step7 can land here via `router.replace` (camera already granted)
 * as well as via a normal push from free-hour/free-kit — so keep replace
 * forward (`push`) instead of the shared guide `pop`, which would reverse
 * the slide on a screen that is progressing the user forward.
 */
const sessionSetupCompleteScreenOptions = {
  animationTypeForReplace: 'push' as const,
};

/** Tab roots: no animation when switching via BottomNavBar. */
const tabRootScreenOptions = {
  animation: 'none' as const,
};

/**
 * Home stays instant for BottomNav (`replace('/')` with no params).
 * Tour finale and submission-confirmation Go Home pass `enter=fade`
 * for a cross-fade into home.
 */
const homeScreenOptions = ({ route }: { route: { params?: { enter?: string } } }) => ({
  animation: route.params?.enter === 'fade' ? ('fade' as const) : ('none' as const),
});

/**
 * Account stays instant for BottomNav (`replace('/account')` with no params).
 * Flows that land back on Account via `replace` (export record, request
 * data, event registration confirmation) pass `enter=fade` for a cross-fade
 * instead of an instant cut — same pattern as `homeScreenOptions`.
 */
const accountScreenOptions = ({ route }: { route: { params?: { enter?: string } } }) => ({
  animation: route.params?.enter === 'fade' ? ('fade' as const) : ('none' as const),
});

/**
 * Shop stays instant for BottomNav (`push('/shop')` with no params).
 * Empty cart / order history Browse Shop CTAs pass `enter=fade` for a
 * cross-fade instead of an instant cut.
 */
const shopScreenOptions = ({ route }: { route: { params?: { enter?: string } } }) => ({
  animation: route.params?.enter === 'fade' ? ('fade' as const) : ('none' as const),
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <AuthProvider>
        <CheckpointNotificationBootstrap />
        <CheckpointAlertLoop />
        <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bgApp },
            }}
          >
      <Stack.Screen name="index" options={homeScreenOptions} />
      <Stack.Screen name="session-setup-guide" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup" />
      <Stack.Screen name="session-setup-step2" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step3" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step4" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step5" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step6" options={guidePermissionScreenOptions} />
      <Stack.Screen name="session-setup-step7" options={guidePermissionScreenOptions} />
      <Stack.Screen name="session-free-hour" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-free-kit" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-complete" options={sessionSetupCompleteScreenOptions} />
      <Stack.Screen name="live-session" options={{ animation: 'slide_from_bottom', animationTypeForReplace: 'push' }} />
      <Stack.Screen name="session-feedback" />
      <Stack.Screen name="give-feedback" />
      <Stack.Screen name="letters" />
      <Stack.Screen name="letter-detail" />
      <Stack.Screen name="feedback-thank-you" />
      <Stack.Screen name="photo-checkpoint" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen
        name="photo-capture"
        options={{
          // Card (not fullScreenModal). Session-start Cancel dismisses to `/session-setup`.
          contentStyle: { backgroundColor: '#000000' },
          gestureEnabled: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="hold-on"
        options={{
          animation: 'fade',
          contentStyle: { backgroundColor: colors.bgApp },
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="photo-submitted" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="submission-confirmation" />
      <Stack.Screen name="missed-checkpoint" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="shop" options={shopScreenOptions} />
      <Stack.Screen name="donate" />
      <Stack.Screen name="product-detail" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="purchase-confirmation" />
      <Stack.Screen name="sessions-list" options={tabRootScreenOptions} />
      <Stack.Screen name="session-detail" />
      <Stack.Screen name="account" options={accountScreenOptions} />
      <Stack.Screen name="map-theme" />
      <Stack.Screen name="delete-account-confirm" />
      <Stack.Screen name="account-privacy" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="privacy-what-we-collect" />
      <Stack.Screen name="privacy-how-we-use-it" />
      <Stack.Screen name="privacy-who-we-share-it-with" />
      <Stack.Screen name="privacy-how-we-protect-it" />
      <Stack.Screen name="request-data" />
      <Stack.Screen name="request-data-sent" />
      <Stack.Screen name="order-history" />
      <Stack.Screen name="donation-history" />
      <Stack.Screen name="approval-history" />
      <Stack.Screen name="export-service-record" />
      <Stack.Screen name="export-record-success" />
      <Stack.Screen name="event-detail" />
      <Stack.Screen name="under-age" />
      <Stack.Screen name="under-age-learn-why" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="creating-account" />
      <Stack.Screen name="account-phone" />
      <Stack.Screen name="account-details" />
      <Stack.Screen name="how-it-works" options={{ gestureEnabled: false }} />
      <Stack.Screen name="device-permissions" />
      <Stack.Screen name="location-permission" />
      <Stack.Screen name="camera-permission" />
      <Stack.Screen name="free-hour" />
      <Stack.Screen name="free-kit" />
      <Stack.Screen name="notification-preference" />
      <Stack.Screen name="setup-complete" />
      <Stack.Screen name="home-tour" />
      <Stack.Screen name="shop-tour" />
      <Stack.Screen name="track-tour" />
      <Stack.Screen name="session-tour" />
      <Stack.Screen name="set-tour" />
      <Stack.Screen name="prototype/[screen]" />
      <Stack.Screen name="free-trial-done" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="orientation-complete" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="tracker-paywall" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />
          </Stack>
          <HomeTransitionCover />
        </View>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
