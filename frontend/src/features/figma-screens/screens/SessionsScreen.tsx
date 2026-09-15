import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { DropdownEnter } from '@/components/motion/DropdownEnter';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionBottomNavStack,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { EmptyState } from '@/components/ui/EmptyState';
import { removeVolunteerSessions } from '@/features/session-tracking/removeVolunteerSession';
import {
  isVolunteerSessionDeleted,
  subscribeVolunteerSessionDeletes,
} from '@/features/session-tracking/volunteerDeletedSessions';
import { openDownloadServiceRecord } from '@/features/session-tracking/openDownloadServiceRecord';
import { isApiConfigured } from '@/lib/api';
import { listSessions } from '@/lib/sessionsApi';
import { mapApiSessionToListItem } from '@/lib/mapApiSessions';

import {
  SessionsExpandIcon,
  SessionsMetaDot,
  SessionsSearchIcon,
  SessionsSortChevronIcon,
} from '../components/SessionsIcons';
import { RadioCheckedIcon, RadioEmptyIcon } from '../components/AccountIcons';
import { SessionDetailShareIcon } from '../components/SessionDetailIcons';
import {
  filterMatchesStatus,
  SESSION_FILTER_CHIPS,
  SESSION_SORT_OPTIONS,
  sortSessions,
  type SessionApprovalStatus,
  type SessionListFilter,
  type SessionListItem,
  type SessionSortOption,
} from '../mocks/sessions';
import { layout, colors, fontFamilies, radius as R, shadows, textStyles } from '../tokens';

const TOP_BAR_BOTTOM_PAD = 8.5;
const SESSIONS_PAGE_SIZE = 10;
const EXPORT_FAB_HEIGHT = 52;
const EXPORT_FAB_GAP = 16;
const EXPORT_ACTION_HEIGHT = 52;

function filterDeletedSessions(items: SessionListItem[]): SessionListItem[] {
  return items.filter((session) => !isVolunteerSessionDeleted(session.id));
}

const STATUS_LABEL: Record<SessionApprovalStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  declined: 'Declined',
};

function sortOptionLabel(sort: SessionSortOption): string {
  const match = SESSION_SORT_OPTIONS.find((option) => option.id === sort);
  return match?.label ?? 'MOST RECENT';
}

function shareMessageForSessions(sessions: SessionListItem[]): string {
  if (sessions.length === 1) {
    const session = sessions[0];
    return `Clean Up Give Back — ${session.title}\n${session.dateLabel} · ${session.timeLabel} · ${STATUS_LABEL[session.status]}`;
  }
  const lines = sessions.map(
    (session) =>
      `• ${session.title} (${session.dateLabel} · ${session.timeLabel} · ${STATUS_LABEL[session.status]})`,
  );
  return `Clean Up Give Back — Sessions\n\n${lines.join('\n')}`;
}

async function shareSessions(sessions: SessionListItem[]): Promise<void> {
  if (sessions.length === 0) {
    Alert.alert('Select a session', 'Choose at least one session to share.');
    return;
  }
  try {
    await Share.share({
      message: shareMessageForSessions(sessions),
      title:
        sessions.length === 1
          ? 'Share session'
          : `Share ${sessions.length} sessions`,
    });
  } catch {
    // User dismissed the share sheet or sharing is unavailable.
  }
}

function statusStyles(status: SessionApprovalStatus) {
  switch (status) {
    case 'approved':
      return {
        border: colors.statusApprovedBorder,
        badgeBg: colors.statusApprovedBg,
        badgeText: colors.statusApprovedText,
      };
    case 'pending':
      return {
        border: colors.statusPendingBorder,
        badgeBg: colors.statusPendingBg,
        badgeText: colors.statusPendingText,
      };
    case 'declined':
      return {
        border: colors.statusDeclinedBorder,
        badgeBg: colors.statusDeclinedBg,
        badgeText: colors.statusDeclinedText,
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function canDeleteSessionStatus(status: SessionApprovalStatus): boolean {
  return status !== 'approved';
}

function isSessionSelectable(status: SessionApprovalStatus): boolean {
  return canDeleteSessionStatus(status);
}

function SessionsTopAppBar({
  title,
  selectionMode,
  showSelectAll,
  onCancelSelection,
  onSelectAll,
  selectAllEnabled,
}: {
  title: string;
  selectionMode: boolean;
  showSelectAll: boolean;
  onCancelSelection: () => void;
  onSelectAll: () => void;
  selectAllEnabled: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, { paddingTop: insets.top, paddingBottom: TOP_BAR_BOTTOM_PAD }]}>
      <View style={s.topBarRow}>
        {selectionMode ? (
          <AnimatedPressable
            onPress={onCancelSelection}
            style={s.topBarSideLeft}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Cancel selection"
          >
            <Text style={s.topBarActionLabel}>Cancel</Text>
          </AnimatedPressable>
        ) : (
          <View style={s.topBarSideLeft} />
        )}
        <Text style={s.topBarTitle} numberOfLines={1}>
          {title}
        </Text>
        {selectionMode && showSelectAll ? (
          <AnimatedPressable
            onPress={onSelectAll}
            disabled={!selectAllEnabled}
            style={[s.topBarSideRight, !selectAllEnabled && s.topBarActionDisabled]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Select all deletable sessions"
            accessibilityState={{ disabled: !selectAllEnabled }}
          >
            <Text style={[s.topBarActionLabel, !selectAllEnabled && s.topBarActionDisabledText]}>
              Select all
            </Text>
          </AnimatedPressable>
        ) : (
          <View style={s.topBarSideRight} />
        )}
      </View>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected }}
      style={[s.chip, selected ? s.chipSelected : s.chipIdle]}
    >
      <Text
        style={[s.chipLabel, selected ? s.chipLabelSelected : s.chipLabelIdle]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function SortDropdown({
  value,
  open,
  onToggle,
  onSelect,
  onEnterSelection,
  showSelect,
}: {
  value: SessionSortOption;
  open: boolean;
  onToggle: () => void;
  onSelect: (next: SessionSortOption) => void;
  onEnterSelection: () => void;
  showSelect: boolean;
}) {
  return (
    <View style={s.sortHeader}>
      <View style={s.sortRow}>
        <AnimatedPressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${sortOptionLabel(value).toLowerCase()}`}
          accessibilityState={{ expanded: open }}
          style={s.sortControl}
        >
          <Text style={s.sortLabel}>{sortOptionLabel(value)}</Text>
          <SessionsSortChevronIcon pointingDown={!open} />
        </AnimatedPressable>
        {showSelect ? (
          <AnimatedPressable
            onPress={onEnterSelection}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Select sessions"
          >
            <Text style={s.sortSelectLabel}>Select</Text>
          </AnimatedPressable>
        ) : null}
      </View>
      <View style={s.sortDivider} />
      {open ? (
        <DropdownEnter style={s.sortMenu} accessibilityRole="menu">
          {SESSION_SORT_OPTIONS.map((option) => {
            const selected = option.id === value;
            return (
              <AnimatedPressable
                key={option.id}
                onPress={() => onSelect(option.id)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                style={[s.sortOption, selected && s.sortOptionSelected]}
              >
                <Text style={[s.sortOptionLabel, selected && s.sortOptionLabelSelected]}>
                  {option.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </DropdownEnter>
      ) : null}
    </View>
  );
}

function SessionRow({
  session,
  selectionMode,
  selected,
  selectable,
  onPress,
}: {
  session: SessionListItem;
  selectionMode: boolean;
  selected: boolean;
  selectable: boolean;
  onPress: () => void;
}) {
  const tone = statusStyles(session.status);
  const statusLabel = STATUS_LABEL[session.status];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={selectionMode && !selectable}
      accessibilityRole={selectionMode ? 'checkbox' : 'button'}
      accessibilityState={
        selectionMode
          ? { checked: selected, disabled: !selectable }
          : undefined
      }
      accessibilityLabel={`${session.title}, ${statusLabel}, ${session.dateLabel}, ${session.timeLabel}`}
      style={[
        s.row,
        { borderColor: tone.border },
        selectionMode && selected && s.rowSelected,
        selectionMode && !selectable && s.rowDisabled,
      ]}
    >
      {selectionMode && (
        <View style={s.rowCheckbox}>
          {selectable ? (
            selected ? (
              <RadioCheckedIcon width={22} height={22} />
            ) : (
              <RadioEmptyIcon width={22} height={22} />
            )
          ) : (
            <View style={s.rowCheckboxPlaceholder} />
          )}
        </View>
      )}
      <View style={s.rowCopy}>
        <Text style={s.rowTitle} numberOfLines={2}>
          {session.title}
        </Text>
        <View style={s.rowMeta}>
          <Text style={s.rowMetaText}>{session.dateLabel}</Text>
          <SessionsMetaDot />
          <Text style={s.rowMetaText}>{session.timeLabel}</Text>
        </View>
      </View>
      <View style={s.rowTrailing}>
        <View style={[s.statusBadge, { backgroundColor: tone.badgeBg }]}>
          <Text style={[s.statusBadgeLabel, { color: tone.badgeText }]}>{statusLabel}</Text>
        </View>
        {!selectionMode && <SessionsExpandIcon />}
      </View>
    </AnimatedPressable>
  );
}

/**
 * Sessions list (Figma `sessions_list___hybrid_redesign`, node `515:1791`).
 */
export function SessionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();
  const [filter, setFilter] = useState<SessionListFilter>('all');
  const [sort, setSort] = useState<SessionSortOption>('most-recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(SESSIONS_PAGE_SIZE);
  const [apiSessions, setApiSessions] = useState<SessionListItem[] | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready'>(
    isApiConfigured ? 'loading' : 'ready',
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [exportMode, setExportMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [tombstoneRevision, setTombstoneRevision] = useState(0);

  const loadSessions = useCallback(() => {
    if (!isApiConfigured) {
      setApiSessions([]);
      setLoadState('ready');
      return;
    }

    setLoadState('loading');

    listSessions()
      .then((sessions) => {
        setApiSessions(
          filterDeletedSessions(
            sessions
              .filter((session) => session.status !== 'active')
              .map(mapApiSessionToListItem),
          ),
        );
        setLoadState('ready');
      })
      .catch((error) => {
        console.warn('[sessions] list fetch failed:', error);
        // Preserve any previously loaded rows. First-load failures (common for
        // brand-new accounts) fall through to the empty "Log session?" CTA
        // instead of a hard "Unable to load" error.
        setApiSessions((current) => (current && current.length > 0 ? current : []));
        setLoadState('ready');
      });
  }, []);

  useEffect(() => {
    return subscribeVolunteerSessionDeletes(() => {
      setTombstoneRevision((current) => current + 1);
      setApiSessions((current) =>
        current ? filterDeletedSessions(current) : current,
      );
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const sessionSource = useMemo(() => {
    void tombstoneRevision;
    return filterDeletedSessions(apiSessions ?? []);
  }, [apiSessions, tombstoneRevision]);

  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = sessionSource.filter((session) => {
      const matchesFilter = filterMatchesStatus(filter, session.status);
      const matchesQuery =
        normalized.length === 0 || session.title.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
    return sortSessions(filtered, sort);
  }, [filter, query, sort, sessionSource]);

  useEffect(() => {
    setVisibleCount(SESSIONS_PAGE_SIZE);
  }, [filter, sort, query]);

  const visibleSessions = useMemo(
    () => filteredSessions.slice(0, visibleCount),
    [filteredSessions, visibleCount],
  );
  const showViewMore = filteredSessions.length > visibleCount;

  const selectableVisibleSessions = useMemo(
    () => visibleSessions.filter((session) => isSessionSelectable(session.status)),
    [visibleSessions],
  );

  const selectedSessions = useMemo(
    () => filteredSessions.filter((session) => selectedIds.has(session.id)),
    [filteredSessions, selectedIds],
  );

  const selectedDeletableSessions = useMemo(
    () => selectedSessions.filter((session) => canDeleteSessionStatus(session.status)),
    [selectedSessions],
  );

  const selectedCount = selectedIds.size;
  const inMultiSelect = selectionMode || exportMode;
  const showBulkActionBar = selectionMode && selectedDeletableSessions.length > 0;
  const showExportBar = exportMode;
  const showExportFab = !selectionMode && !exportMode;

  const bottomInset = Math.max(insets.bottom, 0);
  const deleteBarHeight = showBulkActionBar ? 16 + 44 : 0;
  const exportBarHeight = showExportBar
    ? 12 + EXPORT_ACTION_HEIGHT * 3 + 10 * 2 + 8
    : 0;
  const bulkBarHeight = deleteBarHeight + exportBarHeight;
  const exportFabClearance = showExportFab ? EXPORT_FAB_HEIGHT + EXPORT_FAB_GAP : 0;
  const chromeAboveNav = bulkBarHeight + barExtraHeight;
  const exportFabBottom = bottomInset + layout.bottomNavHeight + chromeAboveNav + EXPORT_FAB_GAP;
  const scrollBottomPad =
    bottomInset + layout.bottomNavHeight + chromeAboveNav + exportFabClearance + 24;

  const handleEnterSelection = useCallback(() => {
    setExportMode(false);
    setSelectedIds(new Set());
    setSelectionMode(true);
    setSortOpen(false);
  }, []);

  const handleEnterExport = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setExportMode(true);
    setSortOpen(false);
  }, []);

  const handleCancelSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
    setExportMode(false);
  }, []);

  const handleToggleSessionSelection = useCallback(
    (session: SessionListItem) => {
      if (selectionMode && !isSessionSelectable(session.status)) {
        return;
      }
      setSelectedIds((current) => {
        const next = new Set(current);
        if (next.has(session.id)) {
          next.delete(session.id);
        } else {
          next.add(session.id);
        }
        return next;
      });
    },
    [selectionMode],
  );

  const handleSelectAllVisible = useCallback(() => {
    setSelectedIds(new Set(selectableVisibleSessions.map((session) => session.id)));
  }, [selectableVisibleSessions]);

  const handleBulkDelete = useCallback(() => {
    if (bulkDeleting || selectedCount === 0) {
      return;
    }

    const targets = selectedDeletableSessions;
    const deleteTitle = targets.length === 1 ? 'Delete session?' : 'Delete sessions?';
    const deleteMessage =
      targets.length === 1
        ? 'Are you sure you want to delete this session? This action is irreversible.'
        : 'Are you sure you want to delete these sessions? This action is irreversible.';

    Alert.alert(
      deleteTitle,
      deleteMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBulkDeleting(true);
              const result = await removeVolunteerSessions(
                targets.map((session) => ({ id: session.id, status: session.status })),
              );
              setBulkDeleting(false);

              if (result.deletedIds.length > 0) {
                setSelectedIds(new Set());
                setSelectionMode(false);
              }

              if (result.failed.length === 0) {
                return;
              }

              const failedSummary = result.failed
                .slice(0, 3)
                .map((entry) => entry.message)
                .join('\n');
              const extra =
                result.failed.length > 3
                  ? `\n…and ${result.failed.length - 3} more could not be deleted.`
                  : '';

              Alert.alert(
                result.deletedIds.length > 0 ? 'Some sessions not deleted' : 'Could not delete',
                `${failedSummary}${extra}`,
              );
            })();
          },
        },
      ],
    );
  }, [bulkDeleting, selectedCount, selectedDeletableSessions]);

  const handleExportAll = useCallback(() => {
    void openDownloadServiceRecord(
      () => router.push('/export-service-record' as Href),
      sessionSource.some((session) => session.status === 'approved'),
    );
  }, [router, sessionSource]);

  const handleShareSelected = useCallback(() => {
    void shareSessions(selectedSessions);
  }, [selectedSessions]);

  function handleSelectSort(next: SessionSortOption) {
    setSort(next);
    setSortOpen(false);
  }

  function handleViewMore() {
    setVisibleCount((current) => current + SESSIONS_PAGE_SIZE);
  }
  return (
    <View style={s.root}>
      {sortOpen && (
        <Pressable
          style={s.sortBackdrop}
          onPress={() => setSortOpen(false)}
          accessibilityLabel="Close sort menu"
        />
      )}
      <SessionsTopAppBar
        title={inMultiSelect ? `${selectedCount} selected` : 'Sessions'}
        selectionMode={inMultiSelect}
        showSelectAll={selectionMode}
        onCancelSelection={handleCancelSelection}
        onSelectAll={handleSelectAllVisible}
        selectAllEnabled={selectableVisibleSessions.length > 0}
      />

      {/* Stays visible while list scrolls */}
      <View style={s.stickyControls}>
        <View style={s.searchBar} accessibilityRole="search">
          <SessionsSearchIcon />
          <TextInput
            style={s.searchInput}
            placeholder="Search sessions"
            placeholderTextColor={colors.textNavInactive}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search sessions"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
        >
          {SESSION_FILTER_CHIPS.map((chip) => (
            <FilterChip
              key={chip.id}
              label={chip.label}
              selected={filter === chip.id}
              onPress={() => setFilter(chip.id)}
            />
          ))}
        </ScrollView>

        <SortDropdown
          value={sort}
          open={sortOpen}
          onToggle={() => setSortOpen((current) => !current)}
          onSelect={handleSelectSort}
          onEnterSelection={handleEnterSelection}
          showSelect={!inMultiSelect}
        />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loadState === 'loading' ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.loadingLabel}>Loading sessions…</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          sessionSource.length === 0 ? (
            <EmptyState
              title="No sessions logged yet."
              ctaLabel="Log session?"
              ctaAccessibilityLabel="Log session"
              onCtaPress={() => router.push('/session-setup')}
            />
          ) : (
            <EmptyState
              title="No sessions match your filter."
              ctaLabel="Clear filters"
              ctaAccessibilityLabel="Clear filters"
              onCtaPress={() => {
                setFilter('all');
                setQuery('');
              }}
            />
          )
        ) : (
          <View style={s.rows}>
            {visibleSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                selectionMode={inMultiSelect}
                selected={selectedIds.has(session.id)}
                selectable={exportMode || isSessionSelectable(session.status)}
                onPress={() => {
                  if (inMultiSelect) {
                    handleToggleSessionSelection(session);
                    return;
                  }
                  router.push(`/session-detail?id=${encodeURIComponent(session.id)}` as Href);
                }}
              />
            ))}
          </View>
        )}

        {loadState !== 'loading' && showViewMore && (
          <AnimatedPressable
            onPress={handleViewMore}
            accessibilityRole="button"
            accessibilityLabel="View more sessions"
            style={s.viewMore}
          >
            <Text style={s.viewMoreLabel}>View more</Text>
          </AnimatedPressable>
        )}
      </ScrollView>

      {showExportFab ? (
        <AnimatedPressable
          onPress={handleEnterExport}
          disabled={loadState === 'loading'}
          scaleTo={0.96}
          accessibilityRole="button"
          accessibilityLabel="Export record"
          accessibilityState={{ disabled: loadState === 'loading' }}
          style={[
            s.exportFab,
            { bottom: exportFabBottom },
            loadState === 'loading' && s.exportFabDisabled,
          ]}
        >
          <Text style={s.exportFabLabel}>Export record</Text>
        </AnimatedPressable>
      ) : null}

      {showExportBar || showBulkActionBar ? (
        <View
          style={[
            s.actionBarsAboveNav,
            { bottom: bottomInset + layout.bottomNavHeight + barExtraHeight },
          ]}
        >
          {showExportBar ? (
            <View style={s.exportBulkBar}>
              <AnimatedPressable
                onPress={handleExportAll}
                accessibilityRole="button"
                accessibilityLabel="Export all sessions"
                style={[s.exportBulkButton, s.exportBulkPrimaryButton]}
              >
                <Text style={s.exportBulkPrimaryLabel}>Export all</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleShareSelected}
                accessibilityRole="button"
                accessibilityLabel={
                  selectedCount > 0
                    ? `Share ${selectedCount} selected sessions`
                    : 'Share selected sessions'
                }
                style={[s.exportBulkButton, s.exportBulkShareButton]}
              >
              <SessionDetailShareIcon width={18} height={18} color={colors.primary} />
              <Text style={s.exportBulkShareLabel}>
                {selectedCount > 0 ? `Share (${selectedCount})` : 'Share'}
              </Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleCancelSelection}
                accessibilityRole="button"
                accessibilityLabel="Cancel export"
                style={[s.exportBulkButton, s.exportBulkCancelButton]}
              >
                <Text style={s.exportBulkCancelLabel}>Cancel</Text>
              </AnimatedPressable>
            </View>
          ) : null}
          {showBulkActionBar ? (
            <View style={s.bulkBar}>
              <AnimatedPressable
                onPress={handleBulkDelete}
                disabled={bulkDeleting}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${selectedDeletableSessions.length} selected sessions`}
                accessibilityState={{ disabled: bulkDeleting }}
                style={[s.bulkActionButton, s.bulkDeleteButton, bulkDeleting && s.bulkActionButtonDisabled]}
              >
                {bulkDeleting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={s.bulkActionLabel}>
                    Delete ({selectedDeletableSessions.length})
                  </Text>
                )}
              </AnimatedPressable>
            </View>
          ) : null}
        </View>
      ) : null}
      <LiveSessionBottomNavStack
        isActive={isActive}
        barStyle={barStyle}
        expandLiveSession={expandLiveSession}
        bottomInset={bottomInset}
      >
        <BottomNavBar
          activeTab="sessions"
          onHomePress={() => router.replace('/')}
          onShopPress={() => router.push('/shop' as Href)}
          onTrackPress={onTrackPress}
          onSessionsPress={() => {}}
          onProfilePress={() => router.push('/account' as Href)}
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
  topBar: {
    backgroundColor: colors.white,
    ...shadows.barTop,
    zIndex: 11,
  },
  topBarRow: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topBarSideLeft: {
    position: 'absolute',
    left: 16,
    minWidth: 72,
    justifyContent: 'center',
  },
  topBarSideRight: {
    position: 'absolute',
    right: 16,
    minWidth: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  topBarActionLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  topBarActionDisabled: {
    opacity: 0.45,
  },
  topBarActionDisabledText: {
    color: colors.textNavInactive,
  },
  topBarTitle: {
    ...textStyles.headlineTopBar,
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  stickyControls: {
    backgroundColor: colors.bgApp,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 20,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 13,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.search,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 1,
  },
  chip: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIdle: {
    backgroundColor: colors.white,
  },
  chipLabel: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  chipLabelSelected: {
    fontFamily: fontFamilies.notoSansSemiBold,
    color: colors.textOnPrimary,
  },
  chipLabelIdle: {
    fontFamily: fontFamilies.notoSansRegular,
  },
  sortBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 9,
  },
  sortHeader: {
    gap: 5,
    position: 'relative',
    zIndex: 10,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  sortLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 10,
    color: colors.textNavInactive,
  },
  sortSelectLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.primary,
  },
  sortDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    minWidth: 148,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.sm,
    overflow: 'hidden',
    zIndex: 20,
    ...shadows.barTop,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortOptionSelected: {
    backgroundColor: colors.chipSelectedBg,
  },
  sortOptionLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 10,
    color: colors.textNavInactive,
  },
  sortOptionLabelSelected: {
    fontFamily: fontFamilies.notoSansSemiBold,
    color: colors.textPrimary,
  },
  rows: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: R.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowSelected: {
    backgroundColor: colors.chipSelectedBg,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowCheckbox: {
    marginRight: 4,
    flexShrink: 0,
  },
  rowCheckboxPlaceholder: {
    width: 22,
    height: 22,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rowMetaText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  statusBadge: {
    borderRadius: R.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeLabel: {
      ...textStyles.labelStatus,
    },
  viewMore: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  viewMoreLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  actionBarsAboveNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 11,
  },
  exportFab: {
    position: 'absolute',
    right: 16,
    zIndex: 12,
    minHeight: EXPORT_FAB_HEIGHT,
    paddingHorizontal: 20,
    borderRadius: R.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportFabDisabled: {
    opacity: 0.45,
  },
  exportFabLabel: {
    ...textStyles.labelButton,
    color: colors.white,
  },
  exportBulkBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
    backgroundColor: colors.white,
    gap: 10,
  },
  exportBulkButton: {
    minHeight: EXPORT_ACTION_HEIGHT,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  exportBulkPrimaryButton: {
    backgroundColor: colors.primary,
  },
  exportBulkShareButton: {
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  exportBulkCancelButton: {
    backgroundColor: colors.chipBg,
  },
  exportBulkPrimaryLabel: {
    ...textStyles.labelButton,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  exportBulkShareLabel: {
    ...textStyles.labelButton,
    color: colors.primary,
    textAlign: 'center',
  },
  exportBulkCancelLabel: {
    ...textStyles.labelButton,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  bulkBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
    backgroundColor: colors.white,
    flexDirection: 'row',
    gap: 10,
  },
  bulkActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bulkDeleteButton: {
    backgroundColor: colors.statusDeclinedText,
  },
  bulkActionButtonDisabled: {
    opacity: 0.7,
  },
  bulkActionLabel: {
    ...textStyles.bodySemiBold,
    color: colors.white,
    textAlign: 'center',
  },
});
