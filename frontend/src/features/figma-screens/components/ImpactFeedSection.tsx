import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItem,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { durations, easing, modalSpring, sheetDismissSpring } from '@/motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { SessionMapSnapshot } from '@/features/session-tracking/components/SessionMapSnapshot';
import type { RouteCoordinate } from '@/features/session-tracking/utils/geo';
import {
  buildActiveImpactMonthOptionsForYear,
  buildActiveImpactYearOptions,
  buildImpactMonthSummary,
  formatImpactHoursPhrase,
  formatImpactMonthSentence,
  type SessionStatRecord,
} from '@/features/session-tracking/utils/homeDashboardStats';

import type { ImpactFeedItem } from '../mocks/home.types';
import { sessionStatusBadgeLabel } from '../mocks/sessionDetail';
import { colors, fontFamilies, radius as R, textStyles } from '../tokens';
import { ChevronDownIcon } from './HomeIcons';

const FEED_TILE_W = 220;
const FEED_TILE_H = 220;
const PHOTO_THUMB = 56;
const PICKER_SHEET_CHROME_HEIGHT = 72;
const PICKER_OPTION_HEIGHT = 48;
const PICKER_LIST_VERTICAL_PAD = 8;
const SHEET_BOTTOM_BLEED = 48;

type PickerRow = {
  key: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
};

type Props = {
  sessionStats: readonly SessionStatRecord[];
  feedItems: ImpactFeedItem[];
  onFeedItemPress?: (sessionId: string) => void;
  onViewAllPress?: () => void;
  onLogSession?: () => void;
};

type PickerKind = 'month' | 'year';

function statusBadgeColors(status: ImpactFeedItem['status']) {
  switch (status) {
    case 'approved':
      return { bg: colors.statusApprovedBg, text: colors.statusApprovedText };
    case 'pending':
      return { bg: colors.statusPendingBg, text: colors.statusPendingText };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function ImpactFeedMapPreview({
  coordinates,
  anchor,
}: {
  coordinates: ImpactFeedItem['routePreview'];
  anchor: ImpactFeedItem['mapAnchor'];
}) {
  if (!anchor) {
    return <View style={s.mapPreview} />;
  }

  return (
    <SessionMapSnapshot
      anchor={[anchor[0], anchor[1]]}
      coordinates={coordinates as RouteCoordinate[]}
      width={FEED_TILE_W}
      height={FEED_TILE_H}
    />
  );
}

export function ImpactFeedSection({
  sessionStats,
  feedItems,
  onFeedItemPress,
  onViewAllPress,
  onLogSession,
}: Props) {
  const now = useMemo(() => new Date(), []);
  const yearOptions = useMemo(
    () => buildActiveImpactYearOptions(sessionStats, now),
    [sessionStats, now],
  );
  const [selectedYear, setSelectedYear] = useState(() => now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => now.getMonth() + 1);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const sheetMaxHeight = windowHeight * 0.82;
  const pickerListMaxHeight = Math.max(
    240,
    sheetMaxHeight - PICKER_SHEET_CHROME_HEIGHT - insets.bottom,
  );
  const dismissTravel = sheetMaxHeight + SHEET_BOTTOM_BLEED;
  const pickerListRef = useRef<FlatList<PickerRow>>(null);
  const translateY = useSharedValue(dismissTravel);
  const backdropOpacity = useSharedValue(0);
  const [pickerOpen, setPickerOpen] = useState<PickerKind | null>(null);
  const [pickerModalShown, setPickerModalShown] = useState(false);
  const [scrimArmed, setScrimArmed] = useState(false);

  const finishClosePicker = useCallback(() => {
    setPickerModalShown(false);
    setPickerOpen(null);
  }, []);

  const dismissPicker = useCallback(() => {
    if (reducedMotion) {
      finishClosePicker();
      return;
    }

    backdropOpacity.value = withTiming(0, {
      duration: durations.sheetDismiss,
      easing: easing.drawer,
    });
    translateY.value = withSpring(dismissTravel, sheetDismissSpring, (finished) => {
      if (finished) {
        runOnJS(finishClosePicker)();
      }
    });
  }, [backdropOpacity, dismissTravel, finishClosePicker, reducedMotion, translateY]);

  useEffect(() => {
    if (!pickerModalShown || pickerOpen === null) {
      setScrimArmed(false);
      return;
    }

    translateY.value = dismissTravel;
    translateY.value = reducedMotion
      ? 0
      : withSpring(0, { ...modalSpring, overshootClamping: true });
    backdropOpacity.value = reducedMotion
      ? 1
      : withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });

    const armId = setTimeout(() => setScrimArmed(true), durations.modalEnter);
    return () => clearTimeout(armId);
  }, [backdropOpacity, dismissTravel, pickerModalShown, pickerOpen, reducedMotion, translateY]);

  const pickerSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const pickerBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  useEffect(() => {
    if (!yearOptions.includes(selectedYear)) {
      setSelectedYear(yearOptions[0] ?? now.getFullYear());
    }
  }, [now, selectedYear, yearOptions]);

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthOptions = useMemo(
    () => buildActiveImpactMonthOptionsForYear(sessionStats, selectedYear, now),
    [sessionStats, selectedYear, now],
  );

  useEffect(() => {
    if (!monthOptions.some((option) => option.monthKey === monthKey)) {
      const fallbackMonth = monthOptions[0]
        ? Number(monthOptions[0].monthKey.slice(5, 7))
        : now.getMonth() + 1;
      setSelectedMonth(fallbackMonth);
    }
  }, [monthKey, monthOptions, now]);
  const selectedSummary = useMemo(
    () => buildImpactMonthSummary(sessionStats, monthKey),
    [sessionStats, monthKey],
  );
  const sentence = formatImpactMonthSentence(selectedSummary);
  const placeWord = selectedSummary.placeCount === 1 ? 'place' : 'places';
  const hoursPhrase = formatImpactHoursPhrase(selectedSummary.hours);
  const pickerRows = useMemo<PickerRow[]>(() => {
    if (pickerOpen === 'year') {
      return yearOptions.map((year) => ({
        key: String(year),
        label: String(year),
        selected: year === selectedYear,
        onSelect: () => {
          setSelectedYear(year);
          dismissPicker();
        },
      }));
    }

    return monthOptions.map((option) => ({
      key: option.monthKey,
      label: option.monthLabel,
      selected: option.monthKey === monthKey,
      onSelect: () => {
        setSelectedMonth(Number(option.monthKey.slice(5, 7)));
        dismissPicker();
      },
    }));
  }, [dismissPicker, monthKey, monthOptions, pickerOpen, selectedYear, yearOptions]);

  const selectedPickerIndex = useMemo(
    () => Math.max(0, pickerRows.findIndex((row) => row.selected)),
    [pickerRows],
  );

  useEffect(() => {
    if (!pickerModalShown || pickerOpen === null || pickerRows.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (selectedPickerIndex <= 0) {
        pickerListRef.current?.scrollToOffset({ offset: 0, animated: false });
        return;
      }

      pickerListRef.current?.scrollToIndex({
        index: selectedPickerIndex,
        animated: false,
        viewPosition: 0,
        viewOffset: 8,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pickerModalShown, pickerOpen, pickerRows.length, selectedPickerIndex]);

  const renderPickerRow: ListRenderItem<PickerRow> = useCallback(({ item }) => {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: item.selected }}
        accessibilityLabel={item.label}
        onPress={item.onSelect}
        style={[s.monthOption, item.selected && s.monthOptionSelected]}
      >
        <Text style={[s.monthOptionText, item.selected && s.monthOptionTextSelected]}>
          {item.label}
        </Text>
      </Pressable>
    );
  }, []);

  function openPicker(kind: PickerKind) {
    setPickerOpen(kind);
    setPickerModalShown(true);
  }

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle} accessibilityRole="header">
        Your Impact
      </Text>

      <View style={s.lifetimeHero} accessibilityLabel={sentence}>
        <View style={s.heroRow}>
          <Text style={s.heroText}>In</Text>
          <Pressable
            onPress={() => openPicker('month')}
            style={s.monthChip}
            accessibilityRole="button"
            accessibilityLabel={`Change month, currently ${selectedSummary.monthLabel}`}
            accessibilityHint="Opens month picker"
          >
            <View style={s.monthChipRow}>
              <Text style={s.monthChipText}>{selectedSummary.monthLabel}</Text>
              <ChevronDownIcon size={16} color={colors.textPrimary} />
            </View>
            <View style={s.monthChipRule} />
          </Pressable>
          <Pressable
            onPress={() => openPicker('year')}
            style={s.monthChip}
            accessibilityRole="button"
            accessibilityLabel={`Change year, currently ${selectedYear}`}
            accessibilityHint="Opens year picker"
          >
            <View style={s.monthChipRow}>
              <Text style={s.monthChipText}>{selectedYear}</Text>
              <ChevronDownIcon size={16} color={colors.textPrimary} />
            </View>
            <View style={s.monthChipRule} />
          </Pressable>
          <Text style={s.heroText}>,</Text>
          <Text style={s.heroText}>you cleaned up</Text>
        </View>
        <View style={s.heroRow}>
          <Text style={s.heroHighlight}>
            {selectedSummary.placeCount} {placeWord}
          </Text>
          <Text style={s.heroText}>for a total of</Text>
          <Text style={s.heroHighlight}>
            {hoursPhrase}
            <Text style={s.heroText}>.</Text>
          </Text>
        </View>
      </View>

      <Modal
        visible={pickerModalShown}
        transparent
        animationType="none"
        onRequestClose={dismissPicker}
      >
        <View style={s.pickerBackdrop}>
          <Animated.View style={[s.pickerScrim, pickerBackdropStyle]} pointerEvents="none" />
          <Pressable
            style={s.pickerDismissHit}
            onPress={dismissPicker}
            disabled={!scrimArmed}
            pointerEvents={scrimArmed ? 'auto' : 'none'}
            accessibilityLabel="Close month and year picker"
          />
          <Animated.View style={[s.pickerSheetWrap, pickerSheetStyle]}>
            <View
              style={[
                s.monthSheet,
                { maxHeight: sheetMaxHeight, paddingBottom: 12 + insets.bottom },
              ]}
            >
              <Text style={s.monthSheetTitle}>
                {pickerOpen === 'year' ? 'Choose a year' : 'Choose a month'}
              </Text>
              <FlatList
                ref={pickerListRef}
                data={pickerRows}
                key={pickerOpen ?? 'closed'}
                keyExtractor={(item) => item.key}
                renderItem={renderPickerRow}
                extraData={selectedPickerIndex}
                style={[s.pickerList, { maxHeight: pickerListMaxHeight }]}
                contentContainerStyle={s.pickerListContent}
                nestedScrollEnabled
                bounces
                showsVerticalScrollIndicator
                overScrollMode="always"
                directionalLockEnabled
                initialNumToRender={16}
                windowSize={8}
                getItemLayout={(_data, index) => ({
                  length: PICKER_OPTION_HEIGHT,
                  offset: PICKER_LIST_VERTICAL_PAD + PICKER_OPTION_HEIGHT * index,
                  index,
                })}
                onScrollToIndexFailed={({ index }) => {
                  pickerListRef.current?.scrollToOffset({
                    offset: PICKER_LIST_VERTICAL_PAD + index * PICKER_OPTION_HEIGHT,
                    animated: false,
                  });
                }}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      <View style={s.feedHeader}>
        <Text style={s.sectionTitle} accessibilityRole="header">
          Recent Cleanups
        </Text>
        {feedItems.length > 0 && onViewAllPress ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="View all sessions"
            onPress={onViewAllPress}
            hitSlop={8}
          >
            <Text style={s.viewAllLink}>View All</Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {feedItems.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.feedRow}
          accessibilityRole="list"
          accessibilityLabel="Recent cleanups"
        >
          {feedItems.map((item) => {
            const badge = statusBadgeColors(item.status);
            return (
              <AnimatedPressable
                key={item.id}
                style={s.feedTile}
                onPress={onFeedItemPress ? () => onFeedItemPress(item.sessionId) : undefined}
                accessibilityRole="button"
                accessibilityLabel={`${item.sessionTitle}, ${item.dateLabel}, ${item.timeLabel}, ${item.durationLabel}, ${sessionStatusBadgeLabel(item.status)}`}
              >
                <View
                  style={s.mapFill}
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <ImpactFeedMapPreview
                    coordinates={item.routePreview}
                    anchor={item.mapAnchor}
                  />
                </View>
                {item.imageUri ? (
                  <View style={s.photoThumbWrap} accessibilityElementsHidden>
                    <Image
                      source={{ uri: item.imageUri }}
                      style={s.photoThumb}
                      contentFit="cover"
                      accessibilityIgnoresInvertColors
                    />
                  </View>
                ) : null}
                <View style={[s.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[s.statusBadgeText, { color: badge.text }]}>
                    {sessionStatusBadgeLabel(item.status)}
                  </Text>
                </View>
                <View style={s.feedOverlay}>
                  <Text style={s.feedTitle} numberOfLines={2}>
                    {item.sessionTitle}
                  </Text>
                  <Text style={s.feedMeta}>
                    {item.dateLabel}
                    {item.timeLabel ? ` · ${item.timeLabel}` : ''}
                  </Text>
                  {item.durationLabel ? (
                    <Text style={s.feedDuration}>{item.durationLabel}</Text>
                  ) : null}
                </View>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      ) : (
        <EmptyState
          title="No cleanup photos yet"
          body="Your cleanup photos will show up here after your first session."
          ctaLabel={onLogSession ? 'Log session?' : undefined}
          ctaAccessibilityLabel="Log session"
          onCtaPress={onLogSession}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    gap: 16,
  },
  sectionTitle: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  lifetimeHero: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.md,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 4,
  },
  heroRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    gap: 3,
  },
  heroText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  heroHighlight: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.statusApprovedText,
  },
  monthChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chipSelectedBg,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingTop: 3,
    paddingBottom: 4,
    marginTop: -3,
    gap: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  monthChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 4,
  },
  monthChipText: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  monthChipRule: {
    position: 'absolute',
    left: -3,
    right: -3,
    bottom: 0,
    height: 1,
    backgroundColor: colors.textPrimary,
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlayScrim,
  },
  pickerDismissHit: {
    flex: 1,
  },
  pickerSheetWrap: {
    width: '100%',
  },
  monthSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: R.md,
    borderTopRightRadius: R.md,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
    overflow: 'hidden',
  },
  monthSheetTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  pickerList: {
    flexGrow: 0,
  },
  pickerListContent: {
    paddingTop: PICKER_LIST_VERTICAL_PAD,
    paddingBottom: PICKER_LIST_VERTICAL_PAD,
  },
  monthOption: {
    height: PICKER_OPTION_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  monthOptionSelected: {
    backgroundColor: colors.chipBg,
  },
  monthOptionText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  monthOptionTextSelected: {
    fontFamily: fontFamilies.notoSansSemiBold,
    color: colors.primary,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllLink: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    color: colors.primary,
  },
  feedRow: {
    gap: 12,
    paddingRight: 4,
  },
  feedTile: {
    width: FEED_TILE_W,
    height: FEED_TILE_H,
    borderRadius: R.md,
    overflow: 'hidden',
    backgroundColor: colors.bgSurfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderOutline,
  },
  mapFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bgSurfaceElevated,
  },
  mapPreview: {
    width: FEED_TILE_W,
    height: FEED_TILE_H,
    borderRadius: 0,
    backgroundColor: colors.bgSurfaceElevated,
  },
  photoThumbWrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: PHOTO_THUMB,
    height: PHOTO_THUMB,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.bgSurfaceElevated,
    zIndex: 2,
  },
  photoThumb: {
    ...StyleSheet.absoluteFill,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  statusBadgeText: {
      ...textStyles.labelStatus,
    },
  feedOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
    backgroundColor: colors.overlayScrimStrong,
    zIndex: 2,
  },
  feedTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
  },
  feedMeta: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  feedDuration: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.white,
  },
});
