import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../tokens';
import { buildYearOptions, daysInMonth, MONTH_NAMES } from '../utils/weekCalendar';
import { WHEEL_ITEM_HEIGHT, WHEEL_PICKER_HEIGHT, WheelPickerColumn } from './WheelPickerColumn';

const YEAR_OPTIONS = buildYearOptions(new Date().getFullYear(), 81).map(String);

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  /** When true, shows Month | Day | Year (export). Home uses month/year only. */
  includeDay?: boolean;
};

export function DateWheelPicker({ value, onChange, includeDay = false }: Props) {
  const month = value.getMonth();
  const day = value.getDate();
  const year = value.getFullYear();

  const monthItems = useMemo(() => MONTH_NAMES as unknown as string[], []);
  const yearItems = YEAR_OPTIONS;
  const yearIndex = Math.max(0, yearItems.indexOf(String(year)));

  const dayItems = useMemo(() => {
    const count = daysInMonth(month, year);
    return Array.from({ length: count }, (_, i) => String(i + 1));
  }, [month, year]);

  const dayIndex = Math.max(0, Math.min(dayItems.length - 1, day - 1));

  const updateDate = (nextMonth: number, nextYear: number, nextDay = day) => {
    const clampedDay = Math.min(nextDay, daysInMonth(nextMonth, nextYear));
    onChange(new Date(nextYear, nextMonth, clampedDay));
  };

  return (
    <View style={s.root}>
      <View pointerEvents="none" style={s.selectionBand} />
      <View style={s.columns}>
        <WheelPickerColumn
          items={monthItems}
          selectedIndex={month}
          onIndexChange={(index) => updateDate(index, year)}
          style={includeDay ? s.monthColumnWithDay : s.monthColumn}
        />
        {includeDay ? (
          <WheelPickerColumn
            items={dayItems}
            selectedIndex={dayIndex}
            onIndexChange={(index) => updateDate(month, year, index + 1)}
            style={s.dayColumn}
          />
        ) : null}
        <WheelPickerColumn
          items={yearItems}
          selectedIndex={yearIndex}
          onIndexChange={(index) => updateDate(month, Number(yearItems[index]))}
          style={s.yearColumn}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    position: 'relative',
    height: WHEEL_PICKER_HEIGHT,
    marginBottom: 4,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  monthColumn: {
    flex: 1.4,
  },
  monthColumnWithDay: {
    flex: 1.5,
  },
  dayColumn: {
    flex: 0.85,
  },
  yearColumn: {
    flex: 1,
  },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (WHEEL_PICKER_HEIGHT - WHEEL_ITEM_HEIGHT) / 2,
    height: WHEEL_ITEM_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderOutline,
    zIndex: 1,
  },
});
