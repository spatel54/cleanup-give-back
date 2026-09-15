// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.17 — Sessions Calendar View

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Screen } from '../../App';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { StatusTag } from '../../components/ui/StatusTag';

interface Props {
  go: (screen: Screen) => void;
}

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const CALENDAR_ROWS: (number | null)[][] = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
];

// Dates that have sessions and their status dot colors
// date 1 → under-review dot (accent)
// date 3 → approved + under-review dots
// date 10 → approved dot
type DotColor = string;
const SESSION_DATES: Record<number, DotColor[]> = {
  1: [Colors.accent],
  3: [Colors.primary, Colors.accent],
  10: [Colors.primary],
};

interface SelectedDaySession {
  id: string;
  title: string;
  status: 'approved' | 'under-review';
  timeRange: string;
  duration: string;
}

const SELECTED_DATE_SESSIONS: SelectedDaySession[] = [
  {
    id: '1',
    title: 'Lake Park',
    status: 'approved',
    timeRange: '9:30–11:00 AM',
    duration: '1.5 hrs',
  },
  {
    id: '2',
    title: 'River Trail',
    status: 'under-review',
    timeRange: '12:00–2:00 PM',
    duration: '2.0 hrs',
  },
];

export function SessionsCalendar({ go }: Props) {
  const [selectedDate, setSelectedDate] = useState<number>(3);

  const hasSessions = selectedDate in SESSION_DATES;
  const sessions = selectedDate === 3 ? SELECTED_DATE_SESSIONS : [];

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top half: Calendar ── */}
      <View style={styles.calendarSection}>
        {/* Month header */}
        <View style={styles.monthRow}>
          <TouchableOpacity
            style={styles.navArrow}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => {}}
          >
            <Text style={styles.navArrowText}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel} accessibilityRole="header">
            June 2026
          </Text>
          <TouchableOpacity
            style={styles.navArrow}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => {}}
          >
            <Text style={styles.navArrowText}>{'›'}</Text>
          </TouchableOpacity>
        </View>

        {/* Day header row */}
        <View style={styles.dayHeaderRow}>
          {DAY_HEADERS.map((day, idx) => (
            <View key={`${day}-${idx}`} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Date rows */}
        {CALENDAR_ROWS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.dateRow}>
            {row.map((date, colIdx) => {
              if (date === null) {
                return <View key={colIdx} style={styles.dateCell} />;
              }
              const isSelected = selectedDate === date;
              const dots = SESSION_DATES[date] ?? [];
              return (
                <TouchableOpacity
                  key={date}
                  style={styles.dateCell}
                  onPress={() => setSelectedDate(date)}
                  accessibilityRole="button"
                  accessibilityLabel={`June ${date}${isSelected ? ', selected' : ''}${dots.length > 0 ? `, has ${dots.length} session${dots.length > 1 ? 's' : ''}` : ''}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View
                    style={[
                      styles.dateBubble,
                      isSelected && styles.dateBubbleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {date}
                    </Text>
                  </View>
                  {dots.length > 0 && (
                    <View
                      style={styles.dotsRow}
                      accessibilityLabel={`${dots.length} session indicator${dots.length > 1 ? 's' : ''} for June ${date}`}
                    >
                      {dots.map((color, i) => (
                        <View
                          key={i}
                          style={[styles.dot, { backgroundColor: color }]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* ── Bottom half: Selected date logs ── */}
      <View style={styles.logsSection}>
        <Text style={styles.selectedDateLabel} accessibilityRole="header">
          Jun {selectedDate}
        </Text>
        <Text style={styles.hoursLogged}>
          <Text style={styles.hoursNumber}>3.5</Text>
          {' hours logged'}
        </Text>

        {sessions.length > 0 ? (
          sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionRow}
              onPress={() => go('session-detail')}
              accessibilityRole="button"
              accessibilityLabel={`${session.title}, ${session.status}, ${session.timeRange}, ${session.duration}`}
            >
              <View style={styles.sessionRowLeft}>
                <Text style={styles.sessionRowTitle}>
                  {session.title} ·{' '}
                  <Text style={styles.sessionRowStatus}>
                    {session.status === 'approved' ? 'Approved' : 'Under Review'}
                  </Text>
                </Text>
                <Text style={styles.sessionRowMeta}>
                  {session.timeRange} · {session.duration}
                </Text>
              </View>
              <StatusTag status={session.status} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {'No sessions on this date.\nUse Track to start a cleanup session.'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,

  // ── Calendar section ──────────────────────────────────────────────────────
  calendarSection: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
  } as ViewStyle,

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  } as ViewStyle,
  navArrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  navArrowText: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: 'IBMPlexSans',
  } as TextStyle,
  monthLabel: {
    ...(Typography.headlineSmall as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,

  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 4,
  } as ViewStyle,
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  } as ViewStyle,
  dayHeaderText: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  dateRow: {
    flexDirection: 'row',
    marginBottom: 2,
  } as ViewStyle,
  dateCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  } as ViewStyle,
  dateBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  dateBubbleSelected: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  dateText: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
  dateTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  } as TextStyle,
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  } as ViewStyle,
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  } as ViewStyle,

  // ── Separator ─────────────────────────────────────────────────────────────
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.screenPadding,
  } as ViewStyle,

  // ── Logs section ──────────────────────────────────────────────────────────
  logsSection: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 20,
  } as ViewStyle,
  selectedDateLabel: {
    ...(Typography.headlineSmall as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 4,
  } as TextStyle,
  hoursLogged: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    marginBottom: 16,
  } as TextStyle,
  hoursNumber: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  } as TextStyle,

  sessionRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  } as ViewStyle,
  sessionRowLeft: {
    flex: 1,
    marginRight: 12,
  } as ViewStyle,
  sessionRowTitle: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 2,
  } as TextStyle,
  sessionRowStatus: {
    color: Colors.textSecondary,
    fontWeight: '400',
  } as TextStyle,
  sessionRowMeta: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
  } as ViewStyle,
  emptyText: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,
});
