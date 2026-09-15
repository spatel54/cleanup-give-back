import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DropdownEnter } from '@/components/motion/DropdownEnter';

import { DateWheelPicker } from './DateWheelPicker';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PickerMonthYearChevronIcon,
} from './HomeIcons';
import { colors, fontFamilies, radius as R, shadows, textStyles } from '../tokens';
import {
  addMonths,
  addWeeks,
  buildMonthGrid,
  DAY_HEADERS,
  daysInMonth,
  formatWeekNumberLabel,
  formatWeekRangeLabel,
  isDateInWeek,
  isSameDay,
  MONTH_NAMES,
  parseIsoDate,
  startOfDay,
  startOfWeekMonday,
  toIsoDate,
} from '../utils/weekCalendar';

function clampFocusDay(month: number, year: number, day: Date): Date {
  const maxDay = daysInMonth(month, year);
  const dayNum = Math.min(day.getDate(), maxDay);
  return startOfDay(new Date(year, month, dayNum));
}

type Props = {
  weekStartIso: string;
  /** Figma mock labels for the default week; recomputed when the user navigates weeks. */
  weekRangeLabel?: string;
  weekNumberLabel?: string;
  onWeekStartChange?: (weekStartIso: string) => void;
};

export function ServiceHoursWeekPicker({
  weekStartIso,
  weekRangeLabel: _defaultWeekRangeLabel,
  weekNumberLabel: _defaultWeekNumberLabel,
  onWeekStartChange,
}: Props) {
  const initialWeekStart = useMemo(() => parseIsoDate(weekStartIso), [weekStartIso]);
  const currentWeekStart = useMemo(() => startOfWeekMonday(new Date()), []);
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [monthYearPickerVisible, setMonthYearPickerVisible] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(currentWeekStart.getMonth());
  const [pickerYear, setPickerYear] = useState(currentWeekStart.getFullYear());
  const [selectedDay, setSelectedDay] = useState(currentWeekStart);
  const [pickerFocusDay, setPickerFocusDay] = useState(currentWeekStart);

  useEffect(() => {
    const nextWeekStart = parseIsoDate(weekStartIso);
    setWeekStart(nextWeekStart);
    setSelectedDay(nextWeekStart);
  }, [weekStartIso]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const showTodayButton =
    pickerMonth !== today.getMonth() ||
    pickerYear !== today.getFullYear() ||
    !isSameDay(pickerFocusDay, today);
  const weekRangeLabel = formatWeekRangeLabel(weekStart);
  const weekNumberLabel = formatWeekNumberLabel(weekStart);
  const monthGrid = useMemo(
    () => buildMonthGrid(pickerYear, pickerMonth),
    [pickerMonth, pickerYear],
  );

  const applyWeekStart = (nextWeekStart: Date, focusDay?: Date) => {
    const normalized = startOfWeekMonday(nextWeekStart);
    setWeekStart(normalized);
    setSelectedDay(focusDay ? startOfDay(focusDay) : normalized);
    setPickerMonth((focusDay ?? normalized).getMonth());
    setPickerYear((focusDay ?? normalized).getFullYear());
    onWeekStartChange?.(toIsoDate(normalized));
  };

  const openPicker = () => {
    const month = selectedDay.getMonth();
    const year = selectedDay.getFullYear();
    setPickerMonth(month);
    setPickerYear(year);
    setPickerFocusDay(selectedDay);
    setMonthYearPickerVisible(false);
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setMonthYearPickerVisible(false);
  };

  const confirmPicker = () => {
    if (monthYearPickerVisible) {
      // Return to calendar view at the selected month/year
      setMonthYearPickerVisible(false);
    } else {
      applyWeekStart(startOfWeekMonday(pickerFocusDay), pickerFocusDay);
      closePicker();
    }
  };

  const goToPreviousWeek = () => {
    applyWeekStart(addWeeks(weekStart, -1), addWeeks(selectedDay, -1));
  };

  const goToNextWeek = () => {
    applyWeekStart(addWeeks(weekStart, 1), addWeeks(selectedDay, 1));
  };

  const goToCurrentWeek = () => {
    const now = startOfDay(new Date());
    applyWeekStart(startOfWeekMonday(now), now);
  };

  const isViewingCurrentWeek = isSameDay(weekStart, startOfWeekMonday(new Date()));

  const selectDay = (day: Date) => {
    setPickerFocusDay(startOfDay(day));
  };

  const toggleMonthYearPicker = () => {
    setMonthYearPickerVisible((open) => !open);
  };

  const handleWheelDateChange = (date: Date) => {
    const normalized = startOfDay(date);
    setPickerFocusDay(normalized);
    setPickerMonth(normalized.getMonth());
    setPickerYear(normalized.getFullYear());
  };

  const goToToday = () => {
    setPickerMonth(today.getMonth());
    setPickerYear(today.getFullYear());
    setPickerFocusDay(today);
    setMonthYearPickerVisible(false);
  };

  const goToPreviousMonth = () => {
    const next = addMonths(pickerYear, pickerMonth, -1);
    setPickerYear(next.year);
    setPickerMonth(next.month);
    setPickerFocusDay((current) => clampFocusDay(next.month, next.year, current));
  };

  const goToNextMonth = () => {
    const next = addMonths(pickerYear, pickerMonth, 1);
    setPickerYear(next.year);
    setPickerMonth(next.month);
    setPickerFocusDay((current) => clampFocusDay(next.month, next.year, current));
  };

  return (
    <>
      {/* Date Container — row: [< > badge] ... [Week N] */}
      <View style={s.dateNavRow}>
        {/* Navigation Container */}
        <View style={s.dateNav}>
          {/* Arrows */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous week"
            hitSlop={8}
            onPress={goToPreviousWeek}
            style={({ pressed }) => pressed && s.arrowBtnPressed}
          >
            <ChevronLeftIcon />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next week"
            hitSlop={8}
            onPress={goToNextWeek}
            style={({ pressed }) => pressed && s.arrowBtnPressed}
          >
            <ChevronRightIcon />
          </Pressable>

          {/* Date Badge — View container so absolute children position correctly */}
          <View style={s.dateBadge}>
            <Text style={s.dateBadgeText} numberOfLines={1}>
              {weekRangeLabel}
            </Text>
            <View style={s.dateBadgeIcon} pointerEvents="none">
              <CalendarIcon size={18} color={colors.textNavInactive} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Selected week ${weekRangeLabel}. Open calendar picker`}
              onPress={openPicker}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>

        {isViewingCurrentWeek ? (
          <View style={s.weekBadge} accessibilityLabel={weekNumberLabel}>
            <Text style={s.weekBadgeText}>{weekNumberLabel}</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to this week"
            hitSlop={8}
            onPress={goToCurrentWeek}
            style={({ pressed }) => pressed && s.thisWeekPressed}
          >
            {/* View chip (not Pressable styles) so the fill always paints on native + web */}
            <View style={s.thisWeekChip}>
              <Text style={s.thisWeekChipText}>This week</Text>
            </View>
          </Pressable>
        )}
      </View>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="none"
        onRequestClose={closePicker}
      >
        <View style={s.backdropContainer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} accessibilityLabel="Close calendar" />
          <DropdownEnter style={s.pickerCard}>
            <View style={s.pickerHeader}>
              {monthYearPickerVisible ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to calendar"
                  onPress={toggleMonthYearPicker}
                  style={({ pressed }) => [s.backBtn, pressed && s.monthYearTriggerPressed]}
                >
                  <View style={s.backBtnInner}>
                    <ChevronLeftIcon size={22} color={colors.textNavInactive} />
                    <Text style={s.backBtnText}>Back</Text>
                  </View>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose month and year"
                    accessibilityState={{ expanded: monthYearPickerVisible }}
                    onPress={toggleMonthYearPicker}
                    style={({ pressed }) => [s.monthYearTrigger, pressed && s.monthYearTriggerPressed]}
                  >
                    <View style={s.monthYearLabelRow}>
                      <Text style={s.pickerMonthLabel}>{MONTH_NAMES[pickerMonth]}</Text>
                      <Text style={s.pickerMonthLabel}>{` ${pickerYear}`}</Text>
                      <View style={s.pickerMonthChevron}>
                        <PickerMonthYearChevronIcon size={16} />
                      </View>
                    </View>
                  </Pressable>
                  <View style={s.monthNavArrows}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous month"
                      hitSlop={8}
                      onPress={goToPreviousMonth}
                      style={({ pressed }) => [s.pickerNavBtn, pressed && s.arrowBtnPressed]}
                    >
                      <ChevronLeftIcon size={22} color={colors.textNavInactive} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next month"
                      hitSlop={8}
                      onPress={goToNextMonth}
                      style={({ pressed }) => [s.pickerNavBtn, pressed && s.arrowBtnPressed]}
                    >
                      <ChevronRightIcon size={22} color={colors.textNavInactive} />
                    </Pressable>
                  </View>
                </>
              )}
            </View>

            {monthYearPickerVisible ? (
              <DateWheelPicker value={pickerFocusDay} onChange={handleWheelDateChange} />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.calendarScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={s.dayHeaderRow}>
                  {DAY_HEADERS.map((label, index) => (
                    <View key={`${label}-${index}`} style={s.dayHeaderCell}>
                      <Text style={s.dayHeaderText}>{label}</Text>
                    </View>
                  ))}
                </View>

                {monthGrid.map((row, rowIndex) => (
                  <View key={rowIndex} style={s.dateRow}>
                    {row.map((cell) => {
                      const { date: day, inCurrentMonth } = cell;
                      const isSelected = isSameDay(day, pickerFocusDay);
                      const isToday = isSameDay(day, today);
                      const inActiveWeek = isDateInWeek(day, startOfWeekMonday(pickerFocusDay));

                      return (
                        <Pressable
                          key={toIsoDate(day)}
                          accessibilityRole="button"
                          accessibilityLabel={`${day.toDateString()}${isToday ? ', today' : ''}${isSelected ? ', selected' : ''}${inCurrentMonth ? '' : ', outside current month'}`}
                          onPress={() => selectDay(day)}
                          style={s.dateCell}
                        >
                          <View
                            style={[
                              s.dateCellInner,
                              !inCurrentMonth && s.dateCellOutside,
                              inActiveWeek && inCurrentMonth && s.dateCellInWeek,
                              isToday && !isSelected && s.dateCellToday,
                              isSelected && s.dateCellSelected,
                            ]}
                          >
                            <Text
                              style={[
                                s.dateCellText,
                                !inCurrentMonth && s.dateCellTextOutside,
                                inActiveWeek && inCurrentMonth && s.dateCellTextInWeek,
                                isToday && !isSelected && s.dateCellTextToday,
                                isSelected && s.dateCellTextSelected,
                              ]}
                            >
                              {day.getDate()}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={s.footerRow}>
              <View style={s.footerLeft}>
                {showTodayButton && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go to today"
                    onPress={goToToday}
                    style={({ pressed }) => [s.footerBtn, pressed && s.footerBtnPressed]}
                  >
                    <Text style={s.footerBtnText}>Today</Text>
                  </Pressable>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                onPress={confirmPicker}
                style={({ pressed }) => [s.footerBtn, s.footerBtnPrimary, pressed && s.footerBtnPressed]}
              >
                <Text style={[s.footerBtnText, s.footerBtnTextPrimary]}>Done</Text>
              </Pressable>
            </View>
          </DropdownEnter>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  dateNav: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowBtnPressed: {
    opacity: 0.65,
  },
  // Badge: plain View so absolute children position relative to it reliably
  dateBadge: {
    flex: 1,
    minWidth: 0,
    height: 36,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.textNavInactive,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 9,
  },
  dateBadgeText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.textNavInactive,
    lineHeight: 16,
  },
  dateBadgeIcon: {
    width: 18,
    height: 18,
    marginLeft: 8,
    flexShrink: 0,
  },
  weekBadge: {
    minWidth: 68,
    height: 36,
    paddingHorizontal: 10,
    backgroundColor: colors.chipBg,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekBadgeText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  /** Quieter than tour mint — chip family + soft green edge so it stays findable. */
  thisWeekChip: {
    height: 36,
    minWidth: 72,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: 'rgba(0, 149, 64, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  thisWeekPressed: {
    opacity: 0.72,
  },
  thisWeekChipText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.primary,
  },
  backdropContainer: {
    flex: 1,
    backgroundColor: 'rgba(28, 27, 27, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 4,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  backBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backBtnText: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textNavInactive,
    lineHeight: 20,
  },
  pickerCard: {
    backgroundColor: colors.white,
    borderRadius: R.md,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
    position: 'relative',
    ...shadows.barTop,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
    paddingBottom: 4,
  },
  monthYearTrigger: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    paddingVertical: 4,
    paddingRight: 4,
  },
  monthYearTriggerPressed: {
    opacity: 0.7,
  },
  monthYearLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  pickerMonthChevron: {
    marginLeft: 4,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  monthNavArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 0,
    marginLeft: 12,
  },
  pickerNavBtn: {
    padding: 2,
    borderRadius: R.full,
  },
  pickerMonthLabel: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textNavInactive,
    letterSpacing: 0.1,
    lineHeight: 20,
    includeFontPadding: false,
    flexShrink: 0,
  },
  calendarScrollContent: {
    flexGrow: 0,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayHeaderText: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 12,
    color: colors.textTertiary,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dateCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dateCellInner: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.full,
  },
  dateCellOutside: {
    opacity: 0.55,
  },
  dateCellInWeek: {
    backgroundColor: colors.chipBg,
  },
  dateCellToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dateCellSelected: {
    backgroundColor: colors.primary,
  },
  dateCellText: {
    ...textStyles.bodyDefault,
    color: colors.textPrimary,
  },
  dateCellTextOutside: {
    color: colors.borderOutline,
  },
  dateCellTextInWeek: {
    color: colors.primary,
  },
  dateCellTextToday: {
    color: colors.primary,
  },
  dateCellTextSelected: {
    color: colors.textOnPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderOutline,
  },
  footerLeft: {
    minWidth: 72,
    alignItems: 'flex-start',
  },
  footerBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  footerBtnPrimary: {
    paddingHorizontal: 8,
  },
  footerBtnPressed: {
    opacity: 0.7,
  },
  footerBtnText: {
    ...textStyles.bodySemiBold,
    color: colors.primary,
  },
  footerBtnTextPrimary: {
    color: colors.primary,
  },
});
