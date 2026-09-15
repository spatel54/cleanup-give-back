import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionBottomNavStack,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { isApiConfigured } from '@/lib/api';
import { listSessions } from '@/lib/sessionsApi';
import {
  hydrateSessionStatsFromApi,
  useSessionStats,
} from '@/features/session-tracking/sessionStatsStore';

import {
  buildApprovalHistoryStats,
  filterVisibleApprovalItems,
  mapApiSessionToApprovalItem,
  mapStatToApprovalItem,
  type ApprovalHistoryItem,
  type ApprovalHistoryStats,
  type ApprovalStatus,
} from '../mocks/approvalHistory';
import { layout, colors, fontFamilies, radius, textStyles } from '../tokens';


const STATUS_LABEL: Record<ApprovalStatus, string> = {
  approved: 'Approved',
  underReview: 'Under Review',
  notApproved: 'Not Approved',
};

function statusTagStyles(status: ApprovalStatus) {
  switch (status) {
    case 'approved':
      return { bg: colors.statusApprovedBg, text: colors.statusApprovedText };
    case 'underReview':
      return { bg: colors.statusPendingBg, text: colors.statusPendingText };
    case 'notApproved':
      return { bg: colors.statusDeclinedBg, text: colors.statusDeclinedText };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function noteStyles(status: ApprovalStatus) {
  switch (status) {
    case 'underReview':
      return { bg: colors.bgApp, text: colors.statusPendingText };
    case 'notApproved':
      return { bg: colors.statusDeclinedBg, text: colors.statusDeclinedText };
    case 'approved':
      return { bg: colors.bgApp, text: colors.textNavInactive };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function StatusTag({ status }: { status: ApprovalStatus }) {
  const tag = statusTagStyles(status);
  return (
    <View style={[s.statusTag, { backgroundColor: tag.bg }]}>
      <Text style={[s.statusLabel, { color: tag.text }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

function SessionCard({ item }: { item: ApprovalHistoryItem }) {
  const note = item.note ? noteStyles(item.status) : null;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <Text style={s.sessionNumber}>{item.sessionNumber}</Text>
          <Text style={s.sessionDate}>{item.dateLabel}</Text>
        </View>
        <StatusTag status={item.status} />
      </View>

      <View style={s.divider} />

      <View style={s.metaRow}>
        <Text style={s.metaText}>{item.durationLabel}</Text>
        <Text style={s.metaText}>{item.locationLabel}</Text>
      </View>

      {item.note && note ? (
        <View style={[s.note, { backgroundColor: note.bg }]}>
          <Text style={[s.noteText, { color: note.text }]}>{item.note}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Approval History (Figma `approval_history`, node `854:294`).
 */
export function ApprovalHistoryScreen({
  stats: statsProp,
  sessions: sessionsProp,
}: {
  stats?: ApprovalHistoryStats;
  sessions?: ApprovalHistoryItem[];
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();
  const sessionStats = useSessionStats();
  const isControlled = sessionsProp !== undefined;
  const [liveSessions, setLiveSessions] = useState<ApprovalHistoryItem[] | null>(
    isControlled ? sessionsProp : null,
  );
  const [loadState, setLoadState] = useState<'loading' | 'ready'>(
    isControlled || !isApiConfigured ? 'ready' : 'loading',
  );

  const loadSessions = useCallback(() => {
    if (isControlled) {
      setLiveSessions(sessionsProp);
      setLoadState('ready');
      return;
    }

    void hydrateSessionStatsFromApi();

    if (!isApiConfigured) {
      setLiveSessions(null);
      setLoadState('ready');
      return;
    }

    setLoadState('loading');
    listSessions()
      .then((sessions) => {
        setLiveSessions(
          filterVisibleApprovalItems(
            sessions
              .map(mapApiSessionToApprovalItem)
              .filter((item): item is ApprovalHistoryItem => item !== null),
          ),
        );
        setLoadState('ready');
      })
      .catch((error) => {
        console.warn('[approval-history] list fetch failed:', error);
        setLiveSessions((current) => current);
        setLoadState('ready');
      });
  }, [isControlled, sessionsProp]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const sessions = useMemo(() => {
    if (isControlled) {
      return filterVisibleApprovalItems(sessionsProp);
    }
    if (liveSessions && liveSessions.length > 0) {
      return filterVisibleApprovalItems(liveSessions);
    }
    return filterVisibleApprovalItems(sessionStats.map(mapStatToApprovalItem));
  }, [isControlled, liveSessions, sessionStats, sessionsProp]);

  const stats = statsProp ?? buildApprovalHistoryStats(sessions);

  const initialLoading = loadState === 'loading' && sessions.length === 0;
  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 32;

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Approval History" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {initialLoading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.loadingLabel}>Loading approval history…</Text>
          </View>
        ) : (
          <>
        <Text style={s.intro}>
          Review the approval status of your submitted clean-up sessions.
        </Text>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: colors.statusApprovedText }]}>{stats.approved}</Text>
            <Text style={s.statLabel}>Approved</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: colors.statusPendingText }]}>
              {stats.underReview}
            </Text>
            <Text style={s.statLabel}>Under Review</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: colors.statusDeclinedText }]}>
              {stats.notApproved}
            </Text>
            <Text style={s.statLabel}>Not Approved</Text>
          </View>
        </View>

        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions to review yet"
            body="Log a cleanup and your approval status will show up here."
            ctaLabel="Log session?"
            ctaAccessibilityLabel="Log session"
            onCtaPress={() => router.push('/session-setup' as Href)}
          />
        ) : (
          <View style={s.list}>
            {sessions.map((item) => (
              <SessionCard key={item.id} item={item} />
            ))}
          </View>
        )}
          </>
        )}
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
          onShopPress={() => {}}
          onTrackPress={onTrackPress}
          onSessionsPress={() => router.push('/sessions-list' as Href)}
          onProfilePress={() => router.replace('/account' as Href)}
        />
      </LiveSessionBottomNavStack>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  intro: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textNavInactive,
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
  },
  statLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 24,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    gap: 4,
    flex: 1,
    paddingRight: 12,
  },
  sessionNumber: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 10,
    color: colors.textNavInactive,
  },
  sessionDate: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  statusTag: {
    height: 32,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
      ...textStyles.labelStatus,
    },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  note: {
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
  },
  noteText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
});
