import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { DropdownEnter } from '@/components/motion/DropdownEnter';
import { SessionSetupCalendarIcon } from '@/components/session-setup/icons/SessionSetupCalendarIcon';

import { DateWheelPicker } from './DateWheelPicker';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PickerMonthYearChevronIcon,
} from './HomeIcons';
import { colors, fontFamilies, radius, shadows, textStyles } from '../tokens';
import { formatExportDate, parseExportDate, toExportDate } from '../utils/exportDate';
import {
  DAY_HEADERS,
  MONTH_NAMES,
  addMonths,
  buildMonthGrid,
  daysInMonth,
  isSameDay,
  startOfDay,
  toIsoDate,
} from '../utils/weekCalendar';

type Props = {
  label: string;
  labelBold?: boolean;
  value: Date | string;
  onChange: (date: Date) => void;
  accessibilityLabel: string;
  minDate?: Date;
  maxDate?: Date;
  selectableDates?: ReadonlySet<string>;
};

function clampFocusDay(month: number, year: number, day: Date): Date {
  const maxDay = daysInMonth(month, year);
  const dayNum = Math.min(day.getDate(), maxDay);
  return startOfDay(new Date(year, month, dayNum));
}

/**
 * Export timeframe date field — typed input + homepage-style calendar modal
 * (month grid; month/day/year wheel when the header is tapped).
 */
function monthKey(year: number, month: number): number {
  return year * 12 + month;
}

export function ExportDateField({
  label,
  labelBold = false,
  value,
  onChange,
  accessibilityLabel,
  minDate,
  maxDate,
  selectableDates,
}: Props) {
  const dateValue = toExportDate(value);
  const [draftText, setDraftText] = useState(() => formatExportDate(dateValue));
  const [pickerVisible, setPickerVisible] = useState(false);
  const [monthYearPickerVisible, setMonthYearPickerVisible] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => dateValue.getMonth());
  const [pickerYear, setPickerYear] = useState(() => dateValue.getFullYear());
  const [pickerDay, setPickerDay] = useState(() => startOfDay(dateValue));

  const today = useMemo(() => startOfDay(new Date()), []);
  const minDay = minDate ? startOfDay(minDate) : null;
  const maxDay = maxDate ? startOfDay(maxDate) : null;

  function isDayEnabled(day: Date): boolean {
    const normalized = startOfDay(day);
    if (minDay && normalized.getTime() < minDay.getTime()) {
      return false;
    }
    if (maxDay && normalized.getTime() > maxDay.getTime()) {
      return false;
    }
    if (selectableDates && !selectableDates.has(toIsoDate(normalized))) {
      return false;
    }
    return true;
  }

  const canGoPreviousMonth =
    !minDay || monthKey(pickerYear, pickerMonth) > monthKey(minDay.getFullYear(), minDay.getMonth());
  const canGoNextMonth =
    !maxDay || monthKey(pickerYear, pickerMonth) < monthKey(maxDay.getFullYear(), maxDay.getMonth());
  const todayEnabled = isDayEnabled(today);
  const showTodayButton =
    todayEnabled &&
    (pickerMonth !== today.getMonth() ||
      pickerYear !== today.getFullYear() ||
      !isSameDay(pickerDay, today));

  const monthGrid = useMemo(
    () => buildMonthGrid(pickerYear, pickerMonth),
    [pickerYear, pickerMonth],
  );

  useEffect(() => {
    const next = toExportDate(value);
    setDraftText(formatExportDate(next));
  }, [value]);

  function openPicker() {
    const day = toExportDate(value);
    setPickerDay(day);
    setPickerMonth(day.getMonth());
    setPickerYear(day.getFullYear());
    setMonthYearPickerVisible(false);
    setPickerVisible(true);
  }

  function closePicker() {
    setPickerVisible(false);
    setMonthYearPickerVisible(false);
  }

  function commitTypedDate() {
    const parsed = parseExportDate(draftText);
    if (parsed && isDayEnabled(parsed)) {
      onChange(parsed);
      setDraftText(formatExportDate(parsed));
      return;
    }
    setDraftText(formatExportDate(dateValue));
  }

  function confirmPicker() {
    const day = toExportDate(pickerDay);
    if (!isDayEnabled(day)) {
      return;
    }
    onChange(day);
    setDraftText(formatExportDate(day));
    closePicker();
  }

  function toggleMonthYearPicker() {
    setMonthYearPickerVisible((open) => !open);
  }

  function handleWheelDateChange(date: Date) {
    let normalized = startOfDay(date);
    if (!isDayEnabled(normalized) && selectableDates && selectableDates.size > 0) {
      const iso = toIsoDate(normalized);
      const sorted = [...selectableDates].sort();
      const next = sorted.find((key) => key >= iso) ?? sorted[sorted.length - 1];
      const [year, month, day] = next.split('-').map(Number);
      normalized = startOfDay(new Date(year, month - 1, day));
    }
    setPickerDay(normalized);
    setPickerMonth(normalized.getMonth());
    setPickerYear(normalized.getFullYear());
  }

  function goToToday() {
    setPickerMonth(today.getMonth());
    setPickerYear(today.getFullYear());
    setPickerDay(today);
    setMonthYearPickerVisible(false);
  }

  function goToPreviousMonth() {
    if (!canGoPreviousMonth) {
      return;
    }
    const next = addMonths(pickerYear, pickerMonth, -1);
    setPickerYear(next.year);
    setPickerMonth(next.month);
    setPickerDay((current) => clampFocusDay(next.month, next.year, current));
  }

  function goToNextMonth() {
    if (!canGoNextMonth) {
      return;
    }
    const next = addMonths(pickerYear, pickerMonth, 1);
    setPickerYear(next.year);
    setPickerMonth(next.month);
    setPickerDay((current) => clampFocusDay(next.month, next.year, current));
  }

  function selectDay(day: Date) {
    const normalized = startOfDay(day);
    if (!isDayEnabled(normalized)) {
      return;
    }
    setPickerDay(normalized);
    if (normalized.getMonth() !== pickerMonth || normalized.getFullYear() !== pickerYear) {
      setPickerMonth(normalized.getMonth());
      setPickerYear(normalized.getFullYear());
    }
  }

  return (
    <View style={s.fieldBlock}>
      <Text style={labelBold ? s.fieldLabelBold : s.fieldLabel}>{label}</Text>
      <View style={s.dateField}>
        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          onBlur={commitTypedDate}
          onSubmitEditing={commitTypedDate}
          returnKeyType="done"
          placeholder="Jan 1, 2026"
          placeholderTextColor={colors.borderOutline}
          accessibilityLabel={accessibilityLabel}
          style={s.dateInput}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <AnimatedPressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={`Open calendar for ${label}`}
          hitSlop={8}
          style={s.calendarBtn}
        >
          <SessionSetupCalendarIcon color={colors.textNavInactive} size={18} />
        </AnimatedPressable>
      </View>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="none"
        onRequestClose={closePicker}
      >
        <View style={s.backdropContainer}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closePicker}
            accessibilityLabel="Close calendar"
          />
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
                    accessibilityLabel="Choose month, day, and year"
                    accessibilityState={{ expanded: monthYearPickerVisible }}
                    onPress={toggleMonthYearPicker}
                    style={({ pressed }) => [
                      s.monthYearTrigger,
                      pressed && s.monthYearTriggerPressed,
                    ]}
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
                      accessibilityState={{ disabled: !canGoPreviousMonth }}
                      disabled={!canGoPreviousMonth}
                      hitSlop={8}
                      onPress={goToPreviousMonth}
                      style={({ pressed }) => [
                        s.pickerNavBtn,
                        !canGoPreviousMonth && s.dateCellDisabled,
                        pressed && canGoPreviousMonth && s.arrowBtnPressed,
                      ]}
                    >
                      <ChevronLeftIcon size={22} color={colors.textNavInactive} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next month"
                      accessibilityState={{ disabled: !canGoNextMonth }}
                      disabled={!canGoNextMonth}
                      hitSlop={8}
                      onPress={goToNextMonth}
                      style={({ pressed }) => [
                        s.pickerNavBtn,
                        !canGoNextMonth && s.dateCellDisabled,
                        pressed && canGoNextMonth && s.arrowBtnPressed,
                      ]}
                    >
                      <ChevronRightIcon size={22} color={colors.textNavInactive} />
                    </Pressable>
                  </View>
                </>
              )}
            </View>

            {monthYearPickerVisible ? (
              <DateWheelPicker
                value={pickerDay}
                onChange={handleWheelDateChange}
                includeDay
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.calendarScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={s.dayHeaderRow}>
                  {DAY_HEADERS.map((header, index) => (
                    <View key={`${header}-${index}`} style={s.dayHeaderCell}>
                      <Text style={s.dayHeaderText}>{header}</Text>
                    </View>
                  ))}
                </View>

                {monthGrid.map((row, rowIndex) => (
                  <View key={rowIndex} style={s.dateRow}>
                    {row.map((cell) => {
                      const { date: day, inCurrentMonth } = cell;
                      const enabled = isDayEnabled(day);
                      const isSelected = enabled && isSameDay(day, pickerDay);
                      const isToday = isSameDay(day, today);

                      return (
                        <Pressable
                          key={toIsoDate(day)}
                          accessibilityRole="button"
                          accessibilityLabel={`${day.toDateString()}${isToday ? ', today' : ''}${isSelected ? ', selected' : ''}${enabled ? '' : ', no approved sessions'}${inCurrentMonth ? '' : ', outside current month'}`}
                          accessibilityState={{ selected: isSelected, disabled: !enabled }}
                          disabled={!enabled}
                          onPress={() => selectDay(day)}
                          style={[
                            s.dateCell,
                            !inCurrentMonth && s.dateCellOutside,
                            !enabled && s.dateCellDisabled,
                            isToday && !isSelected && enabled && s.dateCellToday,
                            isSelected && s.dateCellSelected,
                          ]}
                        >
                          <Text
                            style={[
                              s.dateCellText,
                              !inCurrentMonth && s.dateCellTextOutside,
                              !enabled && s.dateCellTextDisabled,
                              isToday && !isSelected && enabled && s.dateCellTextToday,
                              isSelected && s.dateCellTextSelected,
                            ]}
                          >
                            {day.getDate()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={s.footerRow}>
              <View style={s.footerLeft}>
                {showTodayButton ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go to today"
                    onPress={goToToday}
                    style={({ pressed }) => [s.footerBtn, pressed && s.footerBtnPressed]}
                  >
                    <Text style={s.footerBtnText}>Today</Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                accessibilityState={{ disabled: !isDayEnabled(pickerDay) }}
                disabled={!isDayEnabled(pickerDay)}
                onPress={confirmPicker}
                style={({ pressed }) => [
                  s.footerBtn,
                  s.footerBtnPrimary,
                  !isDayEnabled(pickerDay) && s.dateCellDisabled,
                  pressed && isDayEnabled(pickerDay) && s.footerBtnPressed,
                ]}
              >
                <Text style={[s.footerBtnText, s.footerBtnTextPrimary]}>Done</Text>
              </Pressable>
            </View>
          </DropdownEnter>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  fieldBlock: {
    gap: 6,
  },
  fieldLabelBold: {
    fontFamily: fontFamilies.notoSansBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  fieldLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dateField: {
    height: 44,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
    paddingVertical: 0,
  },
  calendarBtn: {
    padding: 4,
  },
  backdropContainer: {
    flex: 1,
    backgroundColor: 'rgba(28, 27, 27, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
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
    borderRadius: radius.full,
  },
  arrowBtnPressed: {
    opacity: 0.65,
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
  },
  dateCell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  dateCellOutside: {
    opacity: 0.55,
  },
  dateCellDisabled: {
    opacity: 0.28,
  },
  dateCellTextDisabled: {
    color: colors.borderOutline,
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
