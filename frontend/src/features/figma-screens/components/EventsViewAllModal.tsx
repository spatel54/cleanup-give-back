import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
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
import { EmptyState } from '@/components/ui/EmptyState';
import { durations, easing, modalSpring, sheetDismissSpring } from '@/motion';

import type { UpcomingEventSummary } from '../mocks/home.types';
import { colors, fontFamilies, radius as R } from '../tokens';
import {
  filterEventsByDateRange,
} from '../utils/eventFormat';
import { startOfDay } from '../utils/weekCalendar';
import { CloseIcon } from './HomeIcons';
import { ExportDateField } from './ExportDateField';
import { UpcomingEventCard } from './UpcomingEventCard';

/** Travel distance for slide — sheet height plus bleed so the panel starts fully off-screen. */
const SHEET_BOTTOM_BLEED = 48;
const HEADER_HEIGHT = 61;
const FILTER_HEIGHT = 100;

function startOfCurrentYear(reference = new Date()): Date {
  return startOfDay(new Date(reference.getFullYear(), 0, 1));
}

function defaultEventFilterRange(reference = new Date()) {
  return {
    start: startOfCurrentYear(reference),
    end: startOfDay(reference),
  };
}

type Props = {
  visible: boolean;
  events: UpcomingEventSummary[];
  onClose: () => void;
  onSelectEvent?: (eventId: string) => void;
};


export function EventsViewAllModal({ visible, events, onClose, onSelectEvent }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetMaxHeight = windowHeight * 0.82;
  const scrollMaxHeight = Math.max(180, sheetMaxHeight - HEADER_HEIGHT - FILTER_HEIGHT);
  const reducedMotion = useReducedMotion();
  const dismissTravel = sheetMaxHeight + insets.bottom + SHEET_BOTTOM_BLEED;
  const translateY = useSharedValue(dismissTravel);
  const backdropOpacity = useSharedValue(0);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filtersTouched, setFiltersTouched] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStartDate(null);
      setEndDate(null);
      setFiltersTouched(false);
      return;
    }

    const { start, end } = defaultEventFilterRange();
    setStartDate(start);
    setEndDate(end);
    setFiltersTouched(false);
  }, [visible]);

  const filteredEvents = useMemo(() => {
    if (!filtersTouched) {
      return events;
    }

    if (!startDate || !endDate) {
      return events;
    }

    return filterEventsByDateRange(events, startDate, endDate);
  }, [endDate, events, filtersTouched, startDate]);

  function handleStartDateChange(next: Date) {
    const day = startOfDay(next);
    setFiltersTouched(true);
    setStartDate(day);
    setEndDate((current) => {
      if (!current || day.getTime() > current.getTime()) {
        return day;
      }
      return current;
    });
  }

  function handleEndDateChange(next: Date) {
    const day = startOfDay(next);
    setFiltersTouched(true);
    setEndDate(day);
    setStartDate((current) => {
      if (!current || day.getTime() < current.getTime()) {
        return day;
      }
      return current;
    });
  }

  const dismiss = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }

    backdropOpacity.value = withTiming(0, {
      duration: durations.sheetDismiss,
      easing: easing.drawer,
    });
    translateY.value = withSpring(dismissTravel, sheetDismissSpring, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [backdropOpacity, dismissTravel, onClose, reducedMotion, translateY]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    translateY.value = dismissTravel;
    translateY.value = reducedMotion
      ? 0
      : withSpring(0, { damping: 24, mass: 1.4, stiffness: 140, overshootClamping: true });
    backdropOpacity.value = reducedMotion
      ? 1
      : withTiming(1, { duration: 420, easing: easing.easeOut });
  }, [backdropOpacity, dismissTravel, reducedMotion, translateY, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <View style={s.backdrop}>
        <Animated.View style={[s.scrim, backdropStyle]} pointerEvents="none" />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityLabel="Close events list"
        />

        <Animated.View style={[s.sheetWrap, sheetStyle]}>
          <View style={[s.sheet, { maxHeight: sheetMaxHeight }]}>
            <View style={s.header}>
              <Text style={s.title}>All Events</Text>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={dismiss}
                hitSlop={8}
                style={s.closeBtn}
              >
                <CloseIcon size={20} color={colors.textPrimary} />
              </AnimatedPressable>
            </View>

            <View style={s.filters}>
              <View style={s.dateCol}>
                <ExportDateField
                  label="From"
                  value={startDate ?? startOfCurrentYear()}
                  onChange={handleStartDateChange}
                  accessibilityLabel="Filter events from date"
                />
              </View>
              <View style={s.dateCol}>
                <ExportDateField
                  label="To"
                  value={endDate ?? startOfDay(new Date())}
                  onChange={handleEndDateChange}
                  accessibilityLabel="Filter events to date"
                />
              </View>
            </View>

            <ScrollView
              style={[s.scroll, { maxHeight: scrollMaxHeight }]}
              contentContainerStyle={[s.scrollContent, { paddingBottom: 24 + insets.bottom }]}
              showsVerticalScrollIndicator
              bounces
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {filteredEvents.length === 0 ? (
                events.length === 0 ? (
                  <EmptyState
                    title="No upcoming events yet"
                    body="Check back soon for community clean-ups near you."
                  />
                ) : (
                  <EmptyState
                    title="No events match your date range."
                    ctaLabel="Clear filters"
                    ctaAccessibilityLabel="Clear date filters"
                    onCtaPress={() => setFiltersTouched(false)}
                  />
                )
              ) : (
                filteredEvents.map((event) => (
                  <UpcomingEventCard
                    key={event.id}
                    event={event}
                    onPress={onSelectEvent ? () => onSelectEvent(event.id) : undefined}
                  />
                ))
              )}
            </ScrollView>
          </View>
          <View style={[s.sheetBleed, { height: insets.bottom + SHEET_BOTTOM_BLEED }]} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 27, 27, 0.45)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: R.md,
    borderTopRightRadius: R.md,
    width: '100%',
    paddingTop: 16,
    overflow: 'hidden',
    flexDirection: 'column',
    flexShrink: 1,
  },
  sheetBleed: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderOutline,
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 20,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.full,
  },
  filters: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderOutline,
  },
  dateCol: {
    flex: 1,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
    paddingBottom: 24,
  },
});
