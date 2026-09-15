import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { DropdownEnter } from '@/components/motion/DropdownEnter';
import { EmptyState } from '@/components/ui/EmptyState';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import {
  uniqueRemoteSessionIdsFromLetters,
  type DownloadedLetter,
} from '@/features/session-tracking/downloadedLetters';
import {
  hydrateDownloadedLettersFromStorage,
  useDownloadedLetters,
} from '@/features/session-tracking/downloadedLettersStore';
import { openDownloadServiceRecord } from '@/features/session-tracking/openDownloadServiceRecord';
import { isApiConfigured } from '@/lib/api';
import { downloadServiceLetterPdf } from '@/lib/downloadServiceLetterPdf';

import { RadioCheckedIcon, RadioEmptyIcon } from '../components/AccountIcons';
import { LetterDocumentIcon } from '../components/LetterDocumentIcon';
import {
  SessionsSearchIcon,
  SessionsSortChevronIcon,
} from '../components/SessionsIcons';
import { SessionDetailShareIcon } from '../components/SessionDetailIcons';
import { colors, fontFamilies, radius, shadows, textStyles } from '../tokens';

type LetterSortOption = 'most-recent' | 'oldest' | 'title-az';

const LETTER_SORT_OPTIONS: { id: LetterSortOption; label: string }[] = [
  { id: 'most-recent', label: 'MOST RECENT' },
  { id: 'oldest', label: 'OLDEST FIRST' },
  { id: 'title-az', label: 'A–Z' },
];

const EXPORT_FAB_HEIGHT = 52;
const EXPORT_FAB_GAP = 16;
const EXPORT_ACTION_HEIGHT = 52;

function sortOptionLabel(sort: LetterSortOption): string {
  const match = LETTER_SORT_OPTIONS.find((option) => option.id === sort);
  return match?.label ?? 'MOST RECENT';
}

function sortLetters(
  letters: DownloadedLetter[],
  sort: LetterSortOption,
): DownloadedLetter[] {
  const next = [...letters];
  switch (sort) {
    case 'most-recent':
      return next.sort((a, b) => b.downloadedAtMs - a.downloadedAtMs);
    case 'oldest':
      return next.sort((a, b) => a.downloadedAtMs - b.downloadedAtMs);
    case 'title-az':
      return next.sort((a, b) => {
        const byTitle = a.title.localeCompare(b.title);
        if (byTitle !== 0) {
          return byTitle;
        }
        return a.subtitle.localeCompare(b.subtitle);
      });
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}

function LetterSortDropdown({
  value,
  open,
  onToggle,
  onSelect,
}: {
  value: LetterSortOption;
  open: boolean;
  onToggle: () => void;
  onSelect: (next: LetterSortOption) => void;
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
      </View>
      <View style={s.sortDivider} />
      {open ? (
        <DropdownEnter style={s.sortMenu} accessibilityRole="menu">
          {LETTER_SORT_OPTIONS.map((option) => {
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

/**
 * Account → Letters list — downloaded service-letter PDFs (not every approved session).
 * Search/sort + per-letter cards; Export FAB enters multi-select or starts a new download.
 */
export function LettersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const letters = useDownloadedLetters();
  const [exportMode, setExportMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LetterSortOption>('most-recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void hydrateDownloadedLettersFromStorage();
    }, []),
  );

  const selectedCount = selectedIds.size;
  const showExportFab = !exportMode;
  const bottomInset = Math.max(insets.bottom, 0);
  const bulkBarHeight = exportMode
    ? 12 + EXPORT_ACTION_HEIGHT * 3 + 10 * 2 + 8
    : 0;
  const exportFabBottom = bottomInset + EXPORT_FAB_GAP;
  const exportFabClearance = showExportFab ? EXPORT_FAB_HEIGHT + EXPORT_FAB_GAP : 0;
  const scrollBottomPad = bottomInset + 32 + bulkBarHeight + exportFabClearance;

  const filteredLetters = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = letters.filter((letter) => {
      if (!normalized) {
        return true;
      }
      return (
        letter.title.toLowerCase().includes(normalized) ||
        letter.subtitle.toLowerCase().includes(normalized)
      );
    });
    return sortLetters(filtered, sort);
  }, [letters, query, sort]);

  const selectedLetters = useMemo(
    () => letters.filter((letter) => selectedIds.has(letter.id)),
    [letters, selectedIds],
  );

  const openDownloadRecord = useCallback(() => {
    void openDownloadServiceRecord(() =>
      router.push('/export-service-record?returnTo=letters' as Href),
    );
  }, [router]);

  const handleEnterExport = useCallback(() => {
    setSortOpen(false);
    if (letters.length === 0) {
      openDownloadRecord();
      return;
    }
    setSelectedIds(new Set());
    setExportMode(true);
  }, [letters.length, openDownloadRecord]);

  const handleCancelExport = useCallback(() => {
    setSelectedIds(new Set());
    setExportMode(false);
  }, []);

  const handleToggleLetter = useCallback((letterId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(letterId)) {
        next.delete(letterId);
      } else {
        next.add(letterId);
      }
      return next;
    });
  }, []);

  const handleSelectSort = useCallback((next: LetterSortOption) => {
    setSort(next);
    setSortOpen(false);
  }, []);

  const handleExportAll = useCallback(() => {
    openDownloadRecord();
  }, [openDownloadRecord]);

  const handleShareSelected = useCallback(() => {
    if (sharing) {
      return;
    }
    if (selectedLetters.length === 0) {
      Alert.alert('Select a letter', 'Choose at least one letter to share.');
      return;
    }
    const sessionIds = uniqueRemoteSessionIdsFromLetters(selectedLetters);
    if (sessionIds.length === 0) {
      Alert.alert(
        'Could not share',
        'These letters are not linked to approved sessions that can generate a PDF.',
      );
      return;
    }
    if (!isApiConfigured) {
      Alert.alert('Share unavailable', 'Connect to the server to share a service letter.');
      return;
    }

    void (async () => {
      setSharing(true);
      try {
        await downloadServiceLetterPdf(sessionIds);
        setExportMode(false);
        setSelectedIds(new Set());
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not share the letter';
        Alert.alert('Share failed', message);
      } finally {
        setSharing(false);
      }
    })();
  }, [selectedLetters, sharing]);

  return (
    <View style={s.root}>
      {sortOpen ? (
        <Pressable
          style={s.sortBackdrop}
          onPress={() => setSortOpen(false)}
          accessibilityLabel="Close sort menu"
        />
      ) : null}

      <SessionSetupTopAppBar
        title={exportMode ? `${selectedCount} selected` : 'Letters'}
        onBack={() => {
          if (exportMode) {
            handleCancelExport();
            return;
          }
          router.back();
        }}
      />

      <View style={s.stickyControls}>
        <View style={s.searchBar} accessibilityRole="search">
          <SessionsSearchIcon />
          <TextInput
            style={s.searchInput}
            placeholder="Search letters"
            placeholderTextColor={colors.textNavInactive}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search letters"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <LetterSortDropdown
          value={sort}
          open={sortOpen}
          onToggle={() => setSortOpen((current) => !current)}
          onSelect={handleSelectSort}
        />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredLetters.length === 0 ? (
          query.trim() ? (
            <EmptyState
              title="No letters match your search."
              ctaLabel="Clear search"
              ctaAccessibilityLabel="Clear search"
              onCtaPress={() => setQuery('')}
            />
          ) : (
            <EmptyState
              title="No letters downloaded"
              body="After a session is approved, download a PDF from the session or from Download Service Record. It will show up here."
              ctaLabel="Download a letter"
              ctaAccessibilityLabel="Download a letter"
              onCtaPress={openDownloadRecord}
            />
          )
        ) : (
          <View style={s.cards}>
            {filteredLetters.map((letter) => {
              const selected = selectedIds.has(letter.id);
              return (
                <View
                  key={letter.id}
                  style={[s.letterCard, exportMode && selected ? s.letterCardSelected : null]}
                >
                  <AnimatedPressable
                    onPress={() => {
                      if (exportMode) {
                        handleToggleLetter(letter.id);
                        return;
                      }
                      router.push(
                        `/letter-detail?id=${encodeURIComponent(letter.id)}` as Href,
                      );
                    }}
                    accessibilityRole={exportMode ? 'checkbox' : 'button'}
                    accessibilityState={exportMode ? { checked: selected } : undefined}
                    accessibilityLabel={`${letter.title}. ${letter.subtitle}`}
                    style={s.letterRowMain}
                  >
                    {exportMode ? (
                      <View style={s.checkbox}>
                        {selected ? (
                          <RadioCheckedIcon width={22} height={22} />
                        ) : (
                          <RadioEmptyIcon width={22} height={22} />
                        )}
                      </View>
                    ) : null}
                    <LetterDocumentIcon size={44} />
                    <View style={s.letterCopy}>
                      <Text style={s.letterTitle}>{letter.title}</Text>
                      <Text style={s.letterSubtitle}>{letter.subtitle}</Text>
                    </View>
                  </AnimatedPressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {showExportFab ? (
        <AnimatedPressable
          onPress={handleEnterExport}
          scaleTo={0.96}
          accessibilityRole="button"
          accessibilityLabel="Export letters"
          style={[s.exportFab, { bottom: exportFabBottom }]}
        >
          <Text style={s.exportFabLabel}>Export</Text>
        </AnimatedPressable>
      ) : null}

      {exportMode ? (
        <View style={[s.bulkBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <AnimatedPressable
            onPress={handleExportAll}
            disabled={sharing}
            accessibilityRole="button"
            accessibilityLabel="Export all letters"
            style={[s.bulkActionButton, s.bulkExportAllButton]}
          >
            <Text style={s.bulkExportAllLabel}>Export all</Text>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={handleShareSelected}
            disabled={sharing}
            accessibilityRole="button"
            accessibilityLabel={
              selectedCount > 0
                ? `Share ${selectedCount} selected letters`
                : 'Share selected letters'
            }
            style={[s.bulkActionButton, s.bulkShareButton]}
          >
            {sharing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <SessionDetailShareIcon
                width={18}
                height={18}
                color={colors.primary}
              />
            )}
            <Text style={s.bulkShareLabel}>
              {sharing
                ? 'Sharing…'
                : selectedCount > 0
                  ? `Share (${selectedCount})`
                  : 'Share'}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={handleCancelExport}
            accessibilityRole="button"
            accessibilityLabel="Cancel export"
            style={[s.bulkActionButton, s.bulkCancelButton]}
          >
            <Text style={s.bulkCancelLabel}>Cancel</Text>
          </AnimatedPressable>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  stickyControls: {
    backgroundColor: colors.bgApp,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 20,
    zIndex: 10,
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
    borderRadius: radius.search,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    paddingVertical: 0,
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
    borderRadius: radius.sm,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 13,
  },
  cards: {
    gap: 8,
  },
  letterCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    justifyContent: 'center',
  },
  letterCardSelected: {
    backgroundColor: colors.chipSelectedBg,
  },
  letterRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  checkbox: {
    flexShrink: 0,
  },
  letterCopy: {
    flex: 1,
    gap: 2,
  },
  letterTitle: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  letterSubtitle: {
    ...textStyles.bodySmall,
    color: colors.textNavInactive,
  },
  exportFab: {
    position: 'absolute',
    right: 16,
    zIndex: 12,
    minHeight: EXPORT_FAB_HEIGHT,
    paddingHorizontal: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportFabLabel: {
    ...textStyles.labelButton,
    color: colors.white,
  },
  bulkBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
    backgroundColor: colors.white,
    gap: 10,
  },
  bulkActionButton: {
    minHeight: EXPORT_ACTION_HEIGHT,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  bulkExportAllButton: {
    backgroundColor: colors.primary,
  },
  bulkShareButton: {
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  bulkCancelButton: {
    backgroundColor: colors.chipBg,
  },
  bulkExportAllLabel: {
    ...textStyles.labelButton,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  bulkShareLabel: {
    ...textStyles.labelButton,
    color: colors.primary,
    textAlign: 'center',
  },
  bulkCancelLabel: {
    ...textStyles.labelButton,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
