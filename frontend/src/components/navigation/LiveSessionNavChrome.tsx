import React, { useCallback, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import {
  LiveSessionMinimizedPill,
  LIVE_SESSION_PILL_MIN_HEIGHT,
} from '@/features/session-tracking/components/LiveSessionMinimizedPill';
import { useLiveSessionBarExit } from '@/features/session-tracking/hooks/useLiveSessionBarExit';
import {
  getCheckpointProgress,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import { colors, shadows } from '@/features/figma-screens/tokens';
import { ensureTrackerAccessOrPaywall } from '@/utils/ensureTrackerAccess';

/** Pill height + vertical padding — add to scroll bottom padding when active. */
export const LIVE_SESSION_MINIMIZED_BAR_HEIGHT = LIVE_SESSION_PILL_MIN_HEIGHT + 16;

/**
 * Shared live-session chrome for any screen with the 5-tab bottom nav.
 * Shows the minimized pill whenever a session is active (not on `/live-session`).
 */
export function useLiveSessionNavChrome() {
  const router = useRouter();
  const { isActive } = useLiveSession();
  const navigateLiveSession = useCallback(() => router.push('/live-session' as Href), [router]);
  const { barStyle, expandLiveSession, resetBar } = useLiveSessionBarExit({
    onNavigate: navigateLiveSession,
  });

  useFocusEffect(
    useCallback(() => {
      resetBar();
    }, [resetBar]),
  );

  const onTrackPress = useCallback(() => {
    if (isActive) {
      expandLiveSession();
      return;
    }
    void (async () => {
      if (!(await ensureTrackerAccessOrPaywall(router))) {
        return;
      }
      router.push('/session-setup' as Href);
    })();
  }, [expandLiveSession, isActive, router]);

  const barExtraHeight = isActive ? LIVE_SESSION_MINIMIZED_BAR_HEIGHT : 0;

  return {
    isActive,
    onTrackPress,
    expandLiveSession,
    barStyle,
    barExtraHeight,
  };
}

type MinimizedBarProps = {
  barStyle: ReturnType<typeof useLiveSessionBarExit>['barStyle'];
  onExpand: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Green minimized tracker pill stacked above the bottom nav. */
export function LiveSessionMinimizedBar({ barStyle, onExpand, style }: MinimizedBarProps) {
  const {
    elapsedSeconds,
    checkpointSecondsRemaining,
    checkpointDueOrGrace,
    checkpointOverdueSeconds,
    distanceMiles,
    submittedCheckpoints,
    photosEnabled,
  } = useLiveSession();
  const checkpointProgress = getCheckpointProgress(checkpointSecondsRemaining);

  return (
    <Animated.View style={[styles.liveBar, barStyle, style]}>
      <LiveSessionMinimizedPill
        distanceMiles={distanceMiles}
        elapsedSeconds={elapsedSeconds}
        checkpointSecondsRemaining={checkpointSecondsRemaining}
        checkpointDueOrGrace={checkpointDueOrGrace}
        checkpointOverdueSeconds={checkpointOverdueSeconds}
        checkpointProgress={checkpointProgress}
        submittedCheckpoints={submittedCheckpoints}
        photosEnabled={photosEnabled}
        onExpand={onExpand}
        showExpandButton
      />
    </Animated.View>
  );
}

type BottomNavStackProps = {
  isActive: boolean;
  barStyle: ReturnType<typeof useLiveSessionBarExit>['barStyle'];
  expandLiveSession: () => void;
  bottomInset: number;
  children: ReactNode;
};

/**
 * Home-style bottom chrome: live pill floats above the nav bar; only the nav
 * bar gets the white fill + shadow (not the pill area).
 */
export function LiveSessionBottomNavStack({
  isActive,
  barStyle,
  expandLiveSession,
  bottomInset,
  children,
}: BottomNavStackProps) {
  return (
    <View style={bottomNavStyles.bottomStack}>
      {isActive ? (
        <LiveSessionMinimizedBar barStyle={barStyle} onExpand={expandLiveSession} />
      ) : null}
      <View style={[bottomNavStyles.navBarBg, { paddingBottom: bottomInset }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  liveBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
});

const bottomNavStyles = StyleSheet.create({
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  navBarBg: {
    backgroundColor: colors.white,
    ...shadows.navBottom,
  },
});
