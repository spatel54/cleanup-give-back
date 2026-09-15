import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { setLastServiceRecordExport } from '@/features/session-tracking/lastServiceRecordExport';
import {
  hydrateSessionStatsFromApi,
  useSessionStats,
} from '@/features/session-tracking/sessionStatsStore';
import {
  approvedSessionDateBounds,
  approvedSessionDateKeys,
  filterExportMatchingSessions,
  hasApprovedSessions,
  isRemoteSessionId,
  snapToApprovedSessionDate,
} from '@/features/session-tracking/utils/homeDashboardStats';
import { isApiConfigured } from '@/lib/api';
import { downloadServiceLetterPdf } from '@/lib/downloadServiceLetterPdf';
import { downloadServiceRecordCsv } from '@/lib/downloadServiceRecordCsv';

import { ExportDateField } from '../components/ExportDateField';
import { colors, fontFamilies, radius, shadows, textStyles } from '../tokens';
import { toExportDate } from '../utils/exportDate';
import { startOfDay } from '../utils/weekCalendar';

const FOOTER_PAD_TOP = 18;
const PRIMARY_FOOTER_BTN_HEIGHT = 52;

type ExportFormat = 'pdf' | 'csv';

/**
 * Download Service Record — approved hours only; date range then real PDF or CSV.
 */
export function ExportServiceRecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : undefined;

  const sessionStats = useSessionStats();
  const approvedBounds = approvedSessionDateBounds(sessionStats);
  const approvedDateKeys = useMemo(() => approvedSessionDateKeys(sessionStats), [sessionStats]);
  const [startOverride, setStartOverride] = useState<Date | null>(null);
  const [endOverride, setEndOverride] = useState<Date | null>(null);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [downloading, setDownloading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void hydrateSessionStatsFromApi();
    }, []),
  );

  const startDay = toExportDate(startOverride ?? approvedBounds?.start ?? new Date());
  const endDay = toExportDate(endOverride ?? approvedBounds?.end ?? new Date());
  const anyApproved = hasApprovedSessions(sessionStats);
  const matchingSessions = useMemo(
    () => filterExportMatchingSessions(sessionStats, startDay, endDay),
    [endDay, sessionStats, startDay],
  );
  const matchCount = matchingSessions.length;
  const remoteMatchIds = useMemo(
    () => matchingSessions.map((session) => session.id).filter(isRemoteSessionId),
    [matchingSessions],
  );

  const footerBottom = Math.max(insets.bottom, 12);
  const scrollBottomPad = FOOTER_PAD_TOP + PRIMARY_FOOTER_BTN_HEIGHT + footerBottom + 16;

  function handleStartChange(next: Date) {
    const day = snapToApprovedSessionDate(startOfDay(next), approvedDateKeys, 'start') ?? startOfDay(next);
    setStartOverride(day);
    if (day.getTime() > endDay.getTime()) {
      setEndOverride(day);
    }
  }

  function handleEndChange(next: Date) {
    const day = snapToApprovedSessionDate(startOfDay(next), approvedDateKeys, 'end') ?? startOfDay(next);
    setEndOverride(day);
    if (day.getTime() < startDay.getTime()) {
      setStartOverride(day);
    }
  }

  function resetExportFilters() {
    setStartOverride(null);
    setEndOverride(null);
  }

  const handleDownload = useCallback(() => {
    if (downloading || matchCount === 0) {
      return;
    }

    void (async () => {
      setDownloading(true);
      try {
        if (format === 'csv') {
          const file = await downloadServiceRecordCsv(matchingSessions);
          setLastServiceRecordExport({ ...file, format: 'csv' });
        } else {
          if (!isApiConfigured) {
            throw new Error('Connect to the server to download service letters.');
          }
          if (remoteMatchIds.length === 0) {
            throw new Error('These approved sessions are not yet synced for a PDF letter.');
          }
          const file = await downloadServiceLetterPdf(remoteMatchIds);
          setLastServiceRecordExport({ ...file, format: 'pdf' });
        }
        router.push(`/export-record-success?format=${format}&returnTo=${returnTo ?? 'sessions'}` as Href);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not download the record';
        Alert.alert('Download failed', message);
      } finally {
        setDownloading(false);
      }
    })();
  }, [downloading, format, matchCount, matchingSessions, remoteMatchIds, returnTo, router]);

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Download Service Record" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.intro}>
          Choose start and end dates from days you have approved sessions. The PDF is one combined
          letter plus evidence for every approved session in that range.
        </Text>

        {!anyApproved ? (
          <EmptyState
            title="No approved sessions to download."
            body="A session must be approved before it can be included in a service record."
            ctaLabel="Log session?"
            ctaAccessibilityLabel="Log session"
            onCtaPress={() => router.push('/session-setup-guide' as Href)}
          />
        ) : (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Timeframe</Text>
              <View style={s.timeframeFields}>
                <ExportDateField
                  label="Start Date"
                  labelBold
                  value={startDay}
                  onChange={handleStartChange}
                  accessibilityLabel="Start date"
                  minDate={approvedBounds?.start}
                  maxDate={approvedBounds?.end}
                  selectableDates={approvedDateKeys}
                />
                <ExportDateField
                  label="End Date"
                  value={endDay}
                  onChange={handleEndChange}
                  accessibilityLabel="End date"
                  minDate={approvedBounds?.start}
                  maxDate={approvedBounds?.end}
                  selectableDates={approvedDateKeys}
                />
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>Included hours</Text>
              <Text style={s.cardHint}>
                Only approved service hours are included in your downloaded record.
              </Text>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>File Format</Text>
              <View style={s.formatRow}>
                <AnimatedPressable
                  onPress={() => setFormat('pdf')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: format === 'pdf' }}
                  accessibilityLabel="PDF, Best for printing"
                  style={[s.formatTile, format === 'pdf' ? s.formatTileSelected : null]}
                >
                  <Text style={[s.formatTitle, format === 'pdf' ? s.formatTitleSelected : null]}>
                    PDF
                  </Text>
                  <Text style={s.formatHint}>Best for printing</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={() => setFormat('csv')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: format === 'csv' }}
                  accessibilityLabel="CSV, Best for spreadsheets"
                  style={[s.formatTile, format === 'csv' ? s.formatTileSelected : null]}
                >
                  <Text style={[s.formatTitle, format === 'csv' ? s.formatTitleSelected : null]}>
                    CSV
                  </Text>
                  <Text style={s.formatHint}>Best for spreadsheets</Text>
                </AnimatedPressable>
              </View>
            </View>

            {matchCount === 0 ? (
              <EmptyState
                title="No sessions match these filters"
                body="Try a wider date range. Only approved sessions are downloaded."
                ctaLabel="Reset filters"
                ctaAccessibilityLabel="Reset filters"
                onCtaPress={resetExportFilters}
              />
            ) : (
              <Text style={s.matchCount}>
                {matchCount} session{matchCount === 1 ? '' : 's'} will be included.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: footerBottom }]}>
        <AnimatedPressable
          onPress={handleDownload}
          disabled={matchCount === 0 || downloading}
          accessibilityRole="button"
          accessibilityLabel="Download record"
          accessibilityState={{ disabled: matchCount === 0 || downloading }}
          style={[s.exportBtn, matchCount === 0 || downloading ? s.exportBtnDisabled : null]}
        >
          {downloading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={s.exportLabel}>Download</Text>
          )}
        </AnimatedPressable>
      </View>
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
    paddingTop: 16,
    gap: 24,
  },
  intro: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textNavInactive,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  cardHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textNavInactive,
    marginTop: -8,
  },
  timeframeFields: {
    gap: 16,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formatTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  formatTileSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  formatTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  formatTitleSelected: {
    color: colors.primary,
  },
  formatHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  matchCount: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  exportBtn: {
    height: PRIMARY_FOOTER_BTN_HEIGHT,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnDisabled: {
    opacity: 0.45,
  },
  exportLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.white,
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
});
