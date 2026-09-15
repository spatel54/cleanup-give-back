import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFocusEffect, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { requestHomeFadeIn } from '@/features/onboarding/homeEnterTransition';
import { staggerDelay } from '@/motion';

import { CheckCircleIcon } from '@/features/session-tracking/components/icons/CheckCircleIcon';
import { SessionRouteMapPanel } from '@/features/session-tracking/components/SessionRouteMapPanel';
import { StatusPill } from '@/features/session-tracking/components/StatusPill';
import { SessionNotesField } from '@/features/session-tracking/components/SessionNotesField';
import {
  SessionPhotosSection,
  type SessionPhotosSectionItem,
} from '@/features/session-tracking/components/SessionPhotosSection';
import {
  getCompletedSessionSnapshot,
  getLastFinalizeSyncFailed,
  retryFinalizeSync,
} from '@/features/session-tracking/liveSessionStore';
import { removeVolunteerSession } from '@/features/session-tracking/removeVolunteerSession';
import { resolveCompletedSessionId } from '@/features/session-tracking/utils/resolveCompletedSessionId';
import {
  formatPhotoTimeLabel,
  formatSessionDateLabel,
  formatSessionDurationLabel,
  formatSessionTimeRange,
  getCheckpointLabel,
  resolveSessionDurationSeconds,
} from '@/features/session-tracking/utils/sessionFormat';

import { colors as tokens, textStyles } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  bgSurface: tokens.chipBg,
  bgSurfaceWhite: tokens.white,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
  mapTint: '#eae3d0',
  statusPendingBg: tokens.statusPendingBorder,
  statusPendingText: tokens.statusPendingText,
  statusPendingDot: tokens.statusPendingText,
  approvalIcon: tokens.statusPendingText,
  statusDeclinedText: tokens.statusDeclinedText,
  statusDeclinedBorder: tokens.statusDeclinedBorder,
} as const;

const FOOTER_HEIGHT = 296;
/** Extra scroll room below Court Ordered Status so content can clear the sticky footer. */
const SCROLL_FOOTER_GAP = 96;

type Checkpoint = {
  time: string;
  label: string;
  isLast?: boolean;
};

function ApprovalIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 16V22H20V16C20 14.9 19.1 14 18 14H6C4.9 14 4 14.9 4 16ZM18 18H6V16H18V18ZM12 2C9.24 2 7 4.24 7 7L12 14L17 7C17 4.24 14.76 2 12 2ZM12 11L9 7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7L12 11Z"
        fill={C.approvalIcon}
      />
    </Svg>
  );
}

function DotSeparator() {
  return <Circle cx={2} cy={2} r={2} fill={C.textTertiary} />;
}

function InlineDot() {
  return (
    <Svg width={4} height={4} viewBox="0 0 4 4" fill="none">
      <DotSeparator />
    </Svg>
  );
}

function CheckpointTimelineItem({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <View style={s.checkpointRow}>
      <View style={s.checkpointIconCol}>
        {!checkpoint.isLast ? (
          <View style={s.checkpointIconStack}>
            <CheckCircleIcon color={C.primary} size={24} />
            <View style={s.checkpointConnector} />
          </View>
        ) : (
          <CheckCircleIcon color={C.primary} size={24} />
        )}
      </View>
      <View style={s.checkpointCopy}>
        <View style={s.checkpointMetaRow}>
          <Text style={s.checkpointTime}>{checkpoint.time}</Text>
          <InlineDot />
          <Text style={s.checkpointLabel}>{checkpoint.label}</Text>
        </View>
        <Text style={s.checkpointStatus}>Submitted</Text>
      </View>
    </View>
  );
}

/** PRD §6.15 · Figma `submission_confirmation___prd_aligned` (269:1615). */
export function SubmissionConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerStyle = useFadeUpEnter(0);
  const mapStyle = useFadeUpEnter(staggerDelay(1));
  const photosStyle = useFadeUpEnter(staggerDelay(2));
  const timelineStyle = useFadeUpEnter(staggerDelay(3));
  const footerStyle = useFadeUpEnter(staggerDelay(4));
  const [session, setSession] = useState(() => getCompletedSessionSnapshot());
  const [syncFailed, setSyncFailed] = useState(() => getLastFinalizeSyncFailed());
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      setSession(getCompletedSessionSnapshot());
      setSyncFailed(getLastFinalizeSyncFailed());
    }, []),
  );

  const handleRetrySync = useCallback(async () => {
    setIsRetryingSync(true);
    const synced = await retryFinalizeSync();
    setSyncFailed(!synced);
    setIsRetryingSync(false);
  }, []);

  const sessionId = session ? resolveCompletedSessionId(session) : undefined;

  const goHome = useCallback(() => {
    requestHomeFadeIn();
    router.replace({ pathname: '/', params: { enter: 'fade' } });
  }, [router]);

  const handleDeleteSession = useCallback(() => {
    if (!sessionId || deleting) {
      return;
    }

    Alert.alert(
      'Delete session?',
      'This removes the session from your history and cancels admin review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleting(true);
              const result = await removeVolunteerSession(sessionId, 'pending');
              setDeleting(false);
              if (!result.ok) {
                Alert.alert('Could not delete', result.message);
                return;
              }
              goHome();
            })();
          },
        },
      ],
    );
  }, [deleting, goHome, sessionId]);

  const sessionPhotos: SessionPhotosSectionItem[] = useMemo(
    () =>
      (session?.submittedCheckpoints ?? []).flatMap((checkpoint) => [
        {
          key: `${checkpoint.id}-selfie`,
          uri: checkpoint.selfieUri,
          timeLabel: formatPhotoTimeLabel(checkpoint.capturedAt),
          label: 'Selfie',
          capturedAt: checkpoint.capturedAt,
        },
        {
          key: `${checkpoint.id}-progress`,
          uri: checkpoint.progressUri,
          timeLabel: formatPhotoTimeLabel(checkpoint.capturedAt),
          label: 'Progress',
          capturedAt: checkpoint.capturedAt,
        },
      ]),
    [session],
  );

  const checkpoints: Checkpoint[] = useMemo(() => {
    const submissions = session?.submittedCheckpoints ?? [];
    return submissions.map((checkpoint, index) => ({
      time: formatPhotoTimeLabel(checkpoint.capturedAt),
      label: getCheckpointLabel(index, submissions.length),
      isLast: index === submissions.length - 1,
    }));
  }, [session]);

  const durationLabel = session
    ? formatSessionDurationLabel(
        resolveSessionDurationSeconds({
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          elapsedSeconds: session.elapsedSeconds,
        }),
      )
    : '0m';
  const sessionTitle = session?.setup.activity ?? 'Cleanup Session';
  const sessionDateLabel = session
    ? formatSessionDateLabel(session.startedAt)
    : '-';
  const sessionTimeRange = session
    ? formatSessionTimeRange(session.startedAt, session.endedAt)
    : '-';
  const sessionDescription =
    session?.setup.description?.trim() || 'No description provided for this session.';
  const courtOrderedValue = session?.setup.courtOrdered ? 'Yes' : 'No';
  const routeCoordinates = session?.routeCoordinates ?? [];

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.topSafeArea}>
        <View style={s.topBar}>
          <Text style={s.topBarTitle} accessibilityRole="header">
            Session Detail
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: FOOTER_HEIGHT + insets.bottom + SCROLL_FOOTER_GAP },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <Animated.View style={headerStyle}>
        <View style={s.detailsBlock}>
          <View style={s.titleBlock}>
            <StatusPill status="pending" label="Under Review" />
            <Text style={s.sessionTitle}>{sessionTitle}</Text>
          </View>

          <View style={s.metaBlock}>
            <View style={s.metaField}>
              <Text style={s.metaLabel}>DURATION</Text>
              <View style={s.durationRow}>
                <Text style={s.durationValue}>{durationLabel}</Text>
              </View>
            </View>

            <View style={s.metaFieldWide}>
              <Text style={s.metaLabel}>DATE & TIME</Text>
              <View style={s.dateTimeRow}>
                <Text style={s.dateTimeText}>{sessionDateLabel}</Text>
                <InlineDot />
                <Text style={s.dateTimeText}>{sessionTimeRange}</Text>
              </View>
            </View>
          </View>
        </View>
        </Animated.View>

        <Animated.View style={mapStyle}>
        <View style={s.mapCard} accessibilityLabel="Session route map">
          <SessionRouteMapPanel
            routeCoordinates={routeCoordinates}
            distanceMiles={session?.distanceMiles}
            replayOnce
            initialMapLayer={session?.mapLayer}
            style={s.mapPreview}
          />
        </View>
        </Animated.View>

        <Animated.View style={photosStyle}>
          <SessionPhotosSection photos={sessionPhotos} style={s.sectionBlock} />
        </Animated.View>

        <Animated.View style={[s.timelineBlock, timelineStyle]}>
        {checkpoints.length > 0 ? (
        <View style={s.checkpointsCard}>
          <Text style={s.sectionTitleCompact}>Photo Checkpoints</Text>
          <View style={s.checkpointsList}>
            {checkpoints.map((checkpoint) => (
              <CheckpointTimelineItem key={`${checkpoint.time}-${checkpoint.label}`} checkpoint={checkpoint} />
            ))}
          </View>
        </View>
        ) : null}

        <View style={s.sectionBlock}>
          <Text style={s.sectionHeading}>Description</Text>
          <Text style={s.descriptionText}>{sessionDescription}</Text>
        </View>

        <SessionNotesField
          sessionId={sessionId}
          scrollRef={scrollRef}
          containerStyle={s.notesCard}
          titleStyle={s.sectionHeading}
          inputStyle={s.notesInput}
          counterStyle={s.notesCharCount}
        />

        <View style={s.courtOrderedRow}>
          <Text style={s.courtOrderedLabel}>Court Ordered Status</Text>
          <Text style={s.courtOrderedValue}>{courtOrderedValue}</Text>
        </View>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[s.footer, { paddingBottom: 12 + insets.bottom }, footerStyle]}>
        <View style={s.footerContent}>
          {syncFailed ? (
            <View style={s.syncWarningBlock}>
              <Text style={s.syncWarningText} accessibilityRole="alert">
                Could not sync this session to the server yet. It&apos;s saved on your device.
                Tap retry before closing the app.
              </Text>
              <AnimatedPressable
                style={s.syncRetryBtn}
                onPress={handleRetrySync}
                disabled={isRetryingSync}
                accessibilityRole="button"
                accessibilityLabel="Retry syncing session"
              >
                <Text style={s.syncRetryBtnText}>
                  {isRetryingSync ? 'Retrying…' : 'Retry Sync'}
                </Text>
              </AnimatedPressable>
            </View>
          ) : (
            <View style={s.footerMessageBlock}>
              <ApprovalIcon />
              <Text style={s.footerMessage}>
                Your session has been submitted{'\n'}for manual approval. You will be notified
                in-app and email once approved.
              </Text>
            </View>
          )}

          <View style={s.goHomeBtnWrap}>
            <AnimatedPressable
              style={s.goHomeBtn}
              onPress={goHome}
              accessibilityRole="button"
              accessibilityLabel="Go home"
            >
              <Text style={s.goHomeBtnText}>Go Home</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={s.feedbackBtn}
              onPress={() => router.push('/session-feedback')}
              accessibilityRole="button"
              accessibilityLabel="Share feedback"
            >
              <Text style={s.feedbackBtnText}>Share Feedback</Text>
            </AnimatedPressable>
            {sessionId ? (
              <AnimatedPressable
                style={s.deleteBtn}
                onPress={handleDeleteSession}
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel="Delete session"
                accessibilityState={{ disabled: deleting }}
              >
                {deleting ? (
                  <ActivityIndicator color={C.statusDeclinedText} />
                ) : (
                  <Text style={s.deleteBtnText}>Delete session</Text>
                )}
              </AnimatedPressable>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  topSafeArea: {
    backgroundColor: C.bgSurfaceWhite,
  },

  topBar: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: C.bgSurfaceWhite,
  },

  topBarTitle: {

    ...textStyles.headlineTopBar,

    color: C.textPrimary,

  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: FOOTER_HEIGHT + SCROLL_FOOTER_GAP,
    gap: 24,
  },

  detailsBlock: {
    gap: 15,
  },

  titleBlock: {
    gap: 15,
  },

  sessionTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    color: C.textPrimary,
  },

  metaBlock: {
    gap: 20,
  },

  metaField: {
    gap: 5,
  },

  metaFieldWide: {
    gap: 5,
    width: '100%',
  },

  metaLabel: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 12,
    color: C.textTertiary,
    letterSpacing: 0.5,
  },

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  durationValue: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 24,
    color: C.primary,
  },

  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dateTimeText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textTertiary,
  },

  mapCard: {
    height: 250,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderOutline,
    backgroundColor: C.bgSurfaceWhite,
    overflow: 'hidden',
  },

  mapPreview: {
    flex: 1,
  },

  sectionBlock: {
    gap: 0,
  },

  sectionHeading: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 16,
    lineHeight: 20,
    color: C.textPrimary,
    marginBottom: 6,
  },

  sectionTitleCompact: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 16,
    lineHeight: 20,
    color: C.textPrimary,
  },

  timelineBlock: {
    gap: 16,
  },

  checkpointsCard: {
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 16,
    backgroundColor: C.bgSurfaceWhite,
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },

  checkpointsList: {
    gap: 10,
  },

  checkpointRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },

  checkpointIconCol: {
    width: 24,
    alignItems: 'center',
  },

  checkpointIconStack: {
    alignItems: 'center',
  },

  checkpointConnector: {
    width: 2,
    height: 24,
    backgroundColor: C.borderOutline,
    marginTop: 2,
  },

  checkpointCopy: {
    flex: 1,
    gap: 2,
  },

  checkpointMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  checkpointTime: {
    ...textStyles.bodySmall,
    fontFamily: 'NotoSans_500Medium',
    color: C.textTertiary,
  },

  checkpointLabel: {
    ...textStyles.bodySmall,
    fontFamily: 'NotoSans_500Medium',
    color: C.textTertiary,
  },

  checkpointStatus: {
    ...textStyles.bodySmall,
    color: C.textTertiary,
  },

  descriptionText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textTertiary,
    includeFontPadding: false,
  },

  notesCard: {
    backgroundColor: C.bgSurfaceWhite,
    borderColor: C.borderOutline,
  },

  notesInput: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textPrimary,
    includeFontPadding: false,
  },

  notesCharCount: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textTertiary,
    includeFontPadding: false,
  },

  courtOrderedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 53,
  },

  courtOrderedLabel: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textPrimary,
  },

  courtOrderedValue: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: C.textTertiary,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bgApp,
    borderTopWidth: 1,
    borderTopColor: C.borderOutline,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  footerContent: {
    width: '100%',
    gap: 18,
    alignItems: 'center',
  },

  footerMessageBlock: {
    alignItems: 'center',
    gap: 10,
    maxWidth: 310,
  },

  footerMessage: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textPrimary,
    textAlign: 'center',
  },

  syncWarningBlock: {
    alignItems: 'center',
    gap: 10,
    maxWidth: 310,
  },

  syncWarningText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: C.statusDeclinedText,
    textAlign: 'center',
  },

  syncRetryBtn: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.statusDeclinedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  syncRetryBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.statusDeclinedText,
  },

  goHomeBtnWrap: {
    width: '100%',
    gap: 10,
  },

  feedbackBtn: {
    width: '100%',
    minHeight: 54,
    backgroundColor: C.bgSurfaceWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    overflow: 'hidden',
  },

  feedbackBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.primary,
    textAlign: 'center',
  },

  goHomeBtn: {
    width: '100%',
    minHeight: 54,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    overflow: 'hidden',
  },

  goHomeBtnText: {
    ...textStyles.labelButton,
    color: C.textOnPrimary,
    textAlign: 'center',
  },

  deleteBtn: {
    width: '100%',
    minHeight: 54,
    backgroundColor: C.bgSurfaceWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.statusDeclinedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    overflow: 'hidden',
  },

  deleteBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.statusDeclinedText,
    textAlign: 'center',
  },
});
