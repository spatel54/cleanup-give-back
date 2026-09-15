// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.16 — Sessions List View

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Screen } from '../../App';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import type { StatusType } from '../../components/ui/StatusTag';

interface Props {
  go: (screen: Screen) => void;
}

type FilterOption = 'All' | 'Approved' | 'Pending' | 'Declined';

interface SessionCard {
  id: string;
  title: string;
  status: StatusType;
  date: string;      // "Jun 3 · 9:30–11:00 AM"
  duration: string;  // "1.5 hrs · River Cleanup"
  group: 'This Week' | 'Last Week';
}

const SESSIONS: SessionCard[] = [
  {
    id: '1',
    title: 'Lake Park',
    status: 'approved',
    date: 'Jun 3 · 9:30–11:00 AM',
    duration: '1.5 hrs · River Cleanup',
    group: 'This Week',
  },
  {
    id: '2',
    title: 'River Trail',
    status: 'under-review',
    date: 'Jun 1 · 10:00–12:00 PM',
    duration: '2.0 hrs · River Cleanup',
    group: 'This Week',
  },
  {
    id: '3',
    title: 'Downtown Des Plaines',
    status: 'not-approved',
    date: 'May 28 · 1:00–2:00 PM',
    duration: '1.0 hr · River Cleanup',
    group: 'Last Week',
  },
];

const FILTERS: FilterOption[] = ['All', 'Approved', 'Pending', 'Declined'];

const STATUS_MAP: Record<FilterOption, StatusType | null> = {
  'All': null,
  'Approved': 'approved',
  'Pending': 'under-review',
  'Declined': 'not-approved',
};

const STATUS_DOT_COLOR: Record<string, string> = {
  'approved': Colors.approved,
  'under-review': Colors.pending,
  'not-approved': Colors.declined,
  'photo-due': Colors.accent,
  'restart-required': Colors.error,
  'gps-active': Colors.primary,
};

const STATUS_LABEL: Record<string, string> = {
  'approved': 'Approved',
  'under-review': 'Pending',
  'not-approved': 'Declined',
  'photo-due': 'Photo Due',
  'restart-required': 'Restart Required',
  'gps-active': 'GPS Active',
};

function parseDateParts(dateStr: string): { month: string; day: string; time: string } {
  const [datePart, timePart = ''] = dateStr.split(' · ');
  const [month = '', day = ''] = datePart.trim().split(' ');
  return { month: month.toUpperCase(), day, time: timePart };
}

export function SessionsList({ go }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleRowToggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const filtered = SESSIONS.filter((s) => {
    const matchesFilter = activeFilter === 'All' || s.status === STATUS_MAP[activeFilter];
    const matchesSearch =
      searchQuery.trim() === '' ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const thisWeek = filtered.filter((s) => s.group === 'This Week');
  const lastWeek = filtered.filter((s) => s.group === 'Last Week');

  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader variant="root" title="Sessions" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hours summary */}
        <View style={styles.header}>
          <Text style={styles.subheadline}>
            <Text style={styles.hoursNumber}>42.5</Text>
            {' total hours logged'}
          </Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar} accessibilityRole="search">
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search sessions"
            returnKeyType="search"
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${filter}`}
                accessibilityState={{ selected: isActive }}
                style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive ? styles.chipTextActive : styles.chipTextInactive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filtered.length === 0 && (
          <Text style={styles.emptyText}>No sessions match your filter.</Text>
        )}

        {/* This Week group */}
        {thisWeek.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupLabel}>THIS WEEK</Text>
            <View style={styles.groupDivider} />
            {thisWeek.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                expanded={expandedId === session.id}
                onToggle={() => handleRowToggle(session.id)}
                onNavigate={() => go('session-detail')}
              />
            ))}
          </View>
        )}

        {/* Last Week group */}
        {lastWeek.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupLabel}>LAST WEEK</Text>
            <View style={styles.groupDivider} />
            {lastWeek.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                expanded={expandedId === session.id}
                onToggle={() => handleRowToggle(session.id)}
                onNavigate={() => go('session-detail')}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface SessionRowProps {
  session: SessionCard;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

function SessionRow({ session, expanded, onToggle, onNavigate }: SessionRowProps) {
  const { month, day, time } = parseDateParts(session.date);
  const dotColor = STATUS_DOT_COLOR[session.status] ?? Colors.textSecondary;
  const statusLabel = STATUS_LABEL[session.status] ?? session.status;

  return (
    <View style={styles.row}>
      {/* Collapsed header — always visible, tap to expand/collapse */}
      <TouchableOpacity
        style={styles.rowHeader}
        onPress={onToggle}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${session.title}, ${statusLabel}, ${session.date}. ${expanded ? 'Collapse' : 'Expand'}`}
        accessibilityState={{ expanded }}
      >
        {/* Date column */}
        <View style={styles.dateCol}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateDay}>{day}</Text>
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        </View>

        {/* Vertical separator */}
        <View style={styles.colDivider} />

        {/* Location + time */}
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle} numberOfLines={1}>{session.title}</Text>
          <Text style={styles.rowTime}>{time}</Text>
        </View>

        {/* Expand/collapse chevron */}
        <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>
          {expanded ? '⌃' : '›'}
        </Text>
      </TouchableOpacity>

      {/* Expanded detail — inline, no navigation */}
      {expanded && (
        <View style={styles.expandedArea}>
          {/* Spacer aligns content with the row's text column */}
          <View style={styles.expandedSpacer} />
          <View style={styles.expandedContent}>
            <Text style={styles.expandedDuration}>{session.duration}</Text>
            <Text style={[styles.expandedStatus, { color: dotColor }]}>{statusLabel}</Text>
            <TouchableOpacity
              onPress={onNavigate}
              accessibilityRole="link"
              accessibilityLabel="View full session details"
              style={styles.detailLink}
            >
              <Text style={styles.detailLinkText}>View full details  →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const DATE_COL_WIDTH = 56;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
  } as ViewStyle,

  // Hours summary
  header: {
    marginBottom: 20,
  } as ViewStyle,
  subheadline: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  hoursNumber: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  } as TextStyle,

  // Search bar
  searchBar: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
    marginBottom: 12,
  } as ViewStyle,
  searchInput: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textPrimary,
    flex: 1,
  } as TextStyle,

  // Filter chips
  chipsScroll: {
    marginBottom: 28,
  } as ViewStyle,
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,
  chip: {
    height: 36,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  chipActive: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  chipInactive: {
    backgroundColor: Colors.surface,
  } as ViewStyle,
  chipText: {
    ...(Typography.labelSmall as TextStyle),
  } as TextStyle,
  chipTextActive: {
    color: Colors.white,
  } as TextStyle,
  chipTextInactive: {
    color: Colors.textSecondary,
  } as TextStyle,

  // Section group
  group: {
    marginBottom: 24,
  } as ViewStyle,
  groupLabel: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  } as TextStyle,
  groupDivider: {
    height: 1,
    backgroundColor: Colors.surfaceVariant,
    marginBottom: 4,
  } as ViewStyle,

  // Session row container
  row: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: 8,
  } as ViewStyle,

  // Collapsed row header
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
  } as ViewStyle,

  // Date column
  dateCol: {
    width: DATE_COL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  } as ViewStyle,
  dateMonth: {
    fontFamily: 'IBMPlexSans',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  } as TextStyle,
  dateDay: {
    ...(Typography.labelMedium as TextStyle),
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
    color: Colors.textPrimary,
  } as TextStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  } as ViewStyle,

  // Vertical separator
  colDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Colors.surfaceVariant,
    marginHorizontal: 12,
  } as ViewStyle,

  // Row main content
  rowContent: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  rowTitle: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '600',
    color: Colors.textPrimary,
  } as TextStyle,
  rowTime: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  // Chevron
  chevron: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textSecondary,
    paddingLeft: 12,
    fontSize: 18,
  } as TextStyle,
  chevronExpanded: {
    color: Colors.primary,
  } as TextStyle,

  // Expanded inline detail
  expandedArea: {
    flexDirection: 'row',
    paddingBottom: 16,
    paddingLeft: 12,
    paddingRight: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  } as ViewStyle,
  expandedSpacer: {
    width: DATE_COL_WIDTH,
    marginRight: 13, // matches colDivider width (1) + marginHorizontal (12) = 13
  } as ViewStyle,
  expandedContent: {
    flex: 1,
    paddingTop: 12,
    gap: 4,
  } as ViewStyle,
  expandedDuration: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textPrimary,
  } as TextStyle,
  expandedStatus: {
    ...(Typography.labelSmall as TextStyle),
    fontWeight: '600',
  } as TextStyle,
  detailLink: {
    marginTop: 12,
  } as ViewStyle,
  detailLinkText: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.primary,
    fontWeight: '600',
  } as TextStyle,

  emptyText: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  } as TextStyle,
  bottomPad: {
    height: 32,
  } as ViewStyle,
});
