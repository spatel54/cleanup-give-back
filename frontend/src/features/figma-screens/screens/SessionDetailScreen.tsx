import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill } from '@/features/session-tracking/components/StatusPill';
import { SessionRouteMapPanel } from '@/features/session-tracking/components/SessionRouteMapPanel';
import { SessionNotesField } from '@/features/session-tracking/components/SessionNotesField';
import {
  SessionPhotosSection,
  type SessionPhotosSectionItem,
} from '@/features/session-tracking/components/SessionPhotosSection';
import { useSessionDetail } from '@/features/session-tracking/hooks/useSessionDetail';
import { removeVolunteerSession } from '@/features/session-tracking/removeVolunteerSession';
import { useSessionRouteCoordinates } from '@/features/session-tracking/hooks/useSessionRouteCoordinates';
import { formatPhotoTimeLabel } from '@/features/session-tracking/utils/sessionFormat';
import { isApiConfigured } from '@/lib/api';
import { downloadServiceLetterPdf } from '@/lib/downloadServiceLetterPdf';

import {
  SessionDetailHoursIcon,
  SessionDetailMilesIcon,
  SessionDetailPhotosIcon,
  SessionDetailShareIcon,
} from '../components/SessionDetailIcons';
import { sessionStatusBadgeLabel } from '../mocks/sessionDetail';
import { layout, colors, fontFamilies, radius, shadows, textStyles } from '../tokens';

const MAP_HEIGHT = 250;
const FOOTER_PAD_TOP = 18;
const SECONDARY_FOOTER_BTN_HEIGHT = 52;
const PRIMARY_FOOTER_BTN_HEIGHT = 52;
const FOOTER_ACTIONS_GAP = 15;

function SessionDetailTopBar({
  onBack,
  onShare,
}: {
  onBack: () => void;
  onShare: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom }]}>
      <View style={s.topBarRow}>
        <AnimatedPressable
          style={s.topBarIconBtn}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SessionSetupBackChevronIcon color={colors.textPrimary} />
        </AnimatedPressable>

        <View style={s.topBarTitleOverlay} pointerEvents="none">
          <Text style={s.topBarTitle} numberOfLines={1}>
            Session Details
          </Text>
        </View>

        <AnimatedPressable
          style={s.topBarIconBtn}
          onPress={onShare}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Share session"
        >
          <SessionDetailShareIcon />
        </AnimatedPressable>
      </View>
    </View>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={s.statCard}>
      <View style={s.statIcon}>{icon}</View>
      <View style={s.statCopy}>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function SessionDescriptionSection({ description }: { description: string }) {
  const body = description.trim() || '-';

  return (
    <View style={s.infoCard}>
      <Text style={s.infoCardTitle}>Description</Text>
      <Text style={s.infoCardBody}>{body}</Text>
    </View>
  );
}

function SessionDeclineReasonSection({ reason }: { reason: string }) {
  const body = reason.trim();
  if (!body) {
    return null;
  }

  return (
    <View style={s.declineCard} accessibilityRole="text">
      <Text style={s.declineCardTitle}>Reason not approved</Text>
      <Text style={s.declineCardBody}>{body}</Text>
    </View>
  );
}

/**
 * Session detail (Figma `session_detail`, node `515:1848`).
 * Map resolves the completed walking path from local cache or the sessions API.
 */
export function SessionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string }>();
  const sessionId = typeof params.id === 'string' ? params.id : undefined;
  const { detail, loading, error } = useSessionDetail(sessionId);
  const routeCoordinates = useSessionRouteCoordinates(sessionId);

  const [deleting, setDeleting] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const canDownloadPdf =
    Boolean(sessionId) && !loading && !error && detail.status === 'approved';

  const canDeleteSession =
    Boolean(sessionId) && !loading && !error && detail.status !== 'approved';

  const goHome = useCallback(() => {
    try {
      router.dismissTo('/');
    } catch {
      router.replace('/');
    }
  }, [router]);

  const footerBottom = Math.max(insets.bottom, 12);
  const showSessionActions = Boolean(sessionId) && !loading && !error;
  // Share Feedback + optional Delete + optional Download PDF + Go Home
  const stackedFooterActions =
    (showSessionActions ? 1 : 0) +
    (canDownloadPdf ? 1 : 0) +
    (canDeleteSession ? 1 : 0) +
    1;
  const footerContentHeight =
    stackedFooterActions === 1
      ? PRIMARY_FOOTER_BTN_HEIGHT
      : stackedFooterActions * PRIMARY_FOOTER_BTN_HEIGHT +
        (stackedFooterActions - 1) * FOOTER_ACTIONS_GAP;
  const scrollBottomPad = FOOTER_PAD_TOP + footerContentHeight + footerBottom + 16;
  const contentWidth = Math.min(windowWidth - 32, 358);

  const sessionPhotos: SessionPhotosSectionItem[] = useMemo(
    () =>
      detail.evidencePhotos.map((photo) => ({
        key: photo.id,
        source: photo.source,
        timeLabel: photo.capturedAt ? formatPhotoTimeLabel(photo.capturedAt) : '',
        label: photo.caption ?? 'Photo',
        capturedAt: photo.capturedAt,
      })),
    [detail.evidencePhotos],
  );

  const statusLabel = sessionStatusBadgeLabel(detail.status);
  const photosStatLabel =
    detail.evidencePhotos.length > 0
      ? String(detail.evidencePhotos.length)
      : detail.photosCountLabel;

  const handleShareFeedback = useCallback(() => {
    router.push(
      (sessionId
        ? {
            pathname: '/session-feedback',
            params: { returnTo: 'session-detail', id: sessionId },
          }
        : '/session-feedback') as Href,
    );
  }, [router, sessionId]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${detail.title}: ${detail.dateTimeLabel} · ${detail.locationAddress}`,
      });
    } catch {
      // User dismissed or share unavailable.
    }
  }, [detail.dateTimeLabel, detail.locationAddress, detail.title]);

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
              const result = await removeVolunteerSession(sessionId, detail.status);
              setDeleting(false);
              if (!result.ok) {
                Alert.alert('Could not delete', result.message);
                return;
              }
              router.replace('/sessions-list' as Href);
            })();
          },
        },
      ],
    );
  }, [deleting, detail.status, router, sessionId]);

  const handleDownloadPdf = useCallback(() => {
    if (!sessionId || pdfDownloading || !canDownloadPdf) {
      return;
    }

    if (!isApiConfigured) {
      Alert.alert('Download unavailable', 'Connect to the server to download the service letter.');
      return;
    }

    void (async () => {
      setPdfDownloading(true);
      try {
        await downloadServiceLetterPdf([sessionId]);
      } catch (downloadError) {
        const message =
          downloadError instanceof Error ? downloadError.message : 'Could not download PDF';
        Alert.alert('Download failed', message);
      } finally {
        setPdfDownloading(false);
      }
    })();
  }, [canDownloadPdf, pdfDownloading, sessionId]);

  return (
    <View style={s.root}>
      <View style={s.topSection}>
        <SessionDetailTopBar onBack={goHome} onShare={handleShare} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {!error && !loading ? (
          <View
            style={[s.mapHero, { width: windowWidth, height: MAP_HEIGHT }]}
            accessibilityLabel="Session walking path map"
          >
            <SessionRouteMapPanel
              routeCoordinates={routeCoordinates}
              replayOnce
              initialMapLayer={detail.mapLayer}
              style={s.mapPreview}
            />
          </View>
        ) : null}

        <View style={[s.mainCard, { width: contentWidth, alignSelf: 'center' }]}>
          {!loading && error ? (
            <EmptyState
              title={error}
              body="This session may have been deleted, or it could not be loaded."
              ctaLabel="View sessions"
              ctaAccessibilityLabel="View sessions"
              onCtaPress={() => router.replace('/sessions-list' as Href)}
            />
          ) : !loading ? (
            <>
              <View style={s.eventDetails}>
                <View style={s.statusAndInfo}>
                  <StatusPill status={detail.status} label={statusLabel} />

                  <View style={s.eventInfo}>
                    <Text style={s.title}>{detail.title}</Text>
                    <Text style={s.metaText}>{detail.dateTimeLabel}</Text>
                  </View>
                </View>

                <View style={s.statsRow}>
                  <StatCard
                    value={detail.hoursLabel}
                    label={detail.hoursUnitLabel}
                    icon={<SessionDetailHoursIcon />}
                  />
                  <StatCard value={detail.milesLabel} label="MILES" icon={<SessionDetailMilesIcon />} />
                  <StatCard
                    value={photosStatLabel}
                    label="PHOTOS"
                    icon={<SessionDetailPhotosIcon />}
                  />
                </View>
              </View>

              <SessionPhotosSection photos={sessionPhotos} />

              {detail.status === 'declined' && detail.declineReason ? (
                <SessionDeclineReasonSection reason={detail.declineReason} />
              ) : null}

              <SessionDescriptionSection description={detail.description} />
            </>
          ) : loading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={s.loadingLabel}>Loading session…</Text>
            </View>
          ) : null}

          {!loading && !error ? <SessionNotesField sessionId={sessionId} scrollRef={scrollRef} /> : null}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: footerBottom }]}>
        <View style={s.footerActions}>
          {showSessionActions ? (
            <AnimatedPressable
              onPress={handleShareFeedback}
              accessibilityRole="button"
              accessibilityLabel="Share feedback"
              style={s.feedbackBtn}
            >
              <Text style={s.feedbackLabel}>Share Feedback</Text>
            </AnimatedPressable>
          ) : null}
          {!error && canDeleteSession ? (
            <AnimatedPressable
              onPress={handleDeleteSession}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Delete session"
              style={s.deleteBtn}
            >
              {deleting ? (
                <ActivityIndicator color={colors.statusDeclinedText} />
              ) : (
                <Text style={s.deleteLabel}>Delete session</Text>
              )}
            </AnimatedPressable>
          ) : null}
          {canDownloadPdf ? (
            <AnimatedPressable
              onPress={handleDownloadPdf}
              disabled={pdfDownloading}
              accessibilityRole="button"
              accessibilityLabel="Download service letter PDF"
              style={s.newSessionBtn}
            >
              {pdfDownloading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={s.newSessionLabel}>Download PDF</Text>
              )}
            </AnimatedPressable>
          ) : null}
          <AnimatedPressable
            style={s.goHomeBtn}
            onPress={goHome}
            accessibilityRole="button"
            accessibilityLabel="Go home"
          >
            <Text style={s.goHomeLabel}>Go Home</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  topSection: {
    zIndex: 20,
    backgroundColor: colors.white,
  },
  topBar: {
    backgroundColor: colors.white,
    ...shadows.barTop,
    zIndex: 11,
  },
  topBarRow: {
    minHeight: layout.topBarTitleRow,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarIconBtn: {
    width: 24,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  topBarTitleOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    ...textStyles.headlineTopBar,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  mapHero: {
    backgroundColor: colors.chipSelectedBg,
    overflow: 'hidden',
  },
  mapPreview: {
    flex: 1,
    borderRadius: 0,
  },
  mainCard: {
    marginTop: 12,
    gap: 20,
    paddingHorizontal: 0,
  },
  eventDetails: {
    gap: 16,
  },
  statusAndInfo: {
    gap: 15,
  },
  eventInfo: {
    gap: 7,
  },
  title: {
    ...textStyles.headlineDetail,
    color: colors.textPrimary,
  },
  metaText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    maxWidth: 105,
    height: 115,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    overflow: 'hidden',
    paddingTop: 7,
    paddingHorizontal: 13,
  },
  statIcon: {
    alignSelf: 'flex-end',
  },
  statCopy: {
    marginTop: -6,
    gap: 22,
  },
  statValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 32,
    lineHeight: 38,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 9,
    color: colors.textNavInactive,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoCardTitle: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  infoCardBody: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  declineCard: {
    backgroundColor: colors.statusDeclinedBg,
    borderWidth: 1,
    borderColor: colors.statusDeclinedBorder,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  declineCardTitle: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.statusDeclinedText,
  },
  declineCardBody: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    paddingTop: FOOTER_PAD_TOP,
    paddingHorizontal: 16,
    ...shadows.navBottom,
  },
  footerActions: {
    gap: FOOTER_ACTIONS_GAP,
    alignItems: 'stretch',
  },
  feedbackBtn: {
    height: SECONDARY_FOOTER_BTN_HEIGHT,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  deleteBtn: {
    height: SECONDARY_FOOTER_BTN_HEIGHT,
    borderWidth: 1,
    borderColor: colors.statusDeclinedBorder,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.statusDeclinedText,
  },
  newSessionBtn: {
    height: PRIMARY_FOOTER_BTN_HEIGHT,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSessionLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.white,
  },
  goHomeBtn: {
    height: SECONDARY_FOOTER_BTN_HEIGHT,
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goHomeLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textTertiary,
  },
});