import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans';
import { useFonts } from 'expo-font';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { colors as tokens } from '@/constants/tokens';

const C = {
  textPrimary: tokens.textPrimary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
  labelOptional: tokens.borderOutline,
  statusDeclined: tokens.statusDeclinedText,
} as const;


const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const GUIDED_DATE_PATTERN = /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/;

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  hasError?: boolean;
  onInteraction?: () => void;
};

export type SessionSetupDateFieldRef = {
  validate: () => boolean;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function today(): Date {
  return startOfDay(new Date());
}

function daysInMonth(monthIndex: number, year: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clampDateToToday(date: Date): Date {
  const max = today();
  const candidate = startOfDay(date);
  return candidate.getTime() > max.getTime() ? max : candidate;
}

function formatDisplayDate(date: Date): string {
  const month = MONTHS_SHORT[date.getMonth()];
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function isValidMonthPrefix(prefix: string): boolean {
  if (!prefix) {
    return true;
  }
  const lower = prefix.toLowerCase();
  return MONTHS_SHORT.some((month) => month.toLowerCase().startsWith(lower));
}

function formatMonthPrefix(prefix: string): string {
  if (!prefix) {
    return '';
  }
  return prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
}

function extractDateParts(alnum: string): { month: string; day: string; year: string } {
  let index = 0;
  let month = '';

  while (index < alnum.length && /[A-Za-z]/.test(alnum[index]) && month.length < 3) {
    const next = month + alnum[index];
    if (!isValidMonthPrefix(next)) {
      break;
    }
    month = next;
    index += 1;
  }

  let day = '';
  let year = '';

  if (index < alnum.length && /\d/.test(alnum[index])) {
    day = alnum[index];
    index += 1;

    if (index < alnum.length && /\d/.test(alnum[index]) && Number(day) <= 3) {
      const combined = day + alnum[index];
      if (Number(combined) <= 31) {
        day = combined;
        index += 1;
      }
    }

    while (index < alnum.length && /\d/.test(alnum[index]) && year.length < 4) {
      year += alnum[index];
      index += 1;
    }
  }

  return { month, day, year };
}

function formatGuidedDate(parts: { month: string; day: string; year: string }): string {
  const month = formatMonthPrefix(parts.month);
  let result = month;

  if (parts.day.length > 0) {
    result += ` ${parts.day}`;
  }

  if (parts.year.length > 0) {
    result += `, ${parts.year}`;
  }

  return result;
}

function guideDateInput(text: string): string {
  const alnum = text.replace(/[^A-Za-z0-9]/g, '');
  return formatGuidedDate(extractDateParts(alnum));
}

function buildValidDate(year: number, month: number, day: number): Date | null {
  if (month < 0 || month > 11 || day < 1) {
    return null;
  }
  const maxDay = daysInMonth(month, year);
  if (day > maxDay) {
    return null;
  }
  return new Date(year, month, day);
}

function parseGuidedDate(text: string): Date | null {
  const match = GUIDED_DATE_PATTERN.exec(text.trim());
  if (!match) {
    return null;
  }

  const monthIndex = MONTHS_SHORT.findIndex(
    (month) => month.toLowerCase() === match[1].toLowerCase(),
  );
  if (monthIndex < 0) {
    return null;
  }

  const day = Number(match[2]);
  const year = Number(match[3]);
  return buildValidDate(year, monthIndex, day);
}

function isFutureDate(date: Date): boolean {
  return startOfDay(date).getTime() > today().getTime();
}

/** Guided typed date input for session setup (`Jun 16, 2026`; prefilled to today; no future dates). */
export const SessionSetupDateField = forwardRef<SessionSetupDateFieldRef, Props>(
  function SessionSetupDateField({ value, onChange, hasError = false, onInteraction }, ref) {
    const [fontsLoaded] = useFonts({ IBMPlexSans_400Regular });
    const [textValue, setTextValue] = useState(() => formatDisplayDate(value));
    const [isEditing, setIsEditing] = useState(false);

    useImperativeHandle(ref, () => ({
      validate: () => {
        const parsed = parseGuidedDate(textValue);
        return parsed !== null && !isFutureDate(parsed);
      },
    }));

    useEffect(() => {
      if (!isEditing) {
        setTextValue(formatDisplayDate(value));
      }
    }, [isEditing, value]);

    const commitTypedDate = () => {
      setIsEditing(false);
      const parsed = parseGuidedDate(textValue);
      if (!parsed) {
        setTextValue(formatDisplayDate(value));
        return;
      }

      const clamped = clampDateToToday(parsed);
      onChange(clamped);
      setTextValue(formatDisplayDate(clamped));
      onInteraction?.();
    };

    return (
      <TextInput
        value={textValue}
        onChangeText={(text) => {
          onInteraction?.();
          setTextValue(guideDateInput(text));
        }}
        onFocus={() => setIsEditing(true)}
        onBlur={commitTypedDate}
        onSubmitEditing={commitTypedDate}
        style={[
          s.dateField,
          fontsLoaded && s.dateFieldFont,
          hasError && s.dateFieldError,
        ]}
        placeholder={formatDisplayDate(today())}
        placeholderTextColor={C.labelOptional}
        accessibilityLabel={`Session date, ${textValue}`}
        accessibilityHint="Prefilled to today. Tap to edit the date as month, day, and year, for example Jun 16, 2026"
        autoCapitalize="words"
        autoCorrect={false}
        keyboardType="default"
        returnKeyType="done"
        selectTextOnFocus
      />
    );
  },
);

const s = StyleSheet.create({
  dateField: {
    height: 48,
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 16,
    color: C.textPrimary,
  },

  dateFieldFont: {
    fontFamily: 'IBMPlexSans_400Regular',
  },

  dateFieldError: {
    borderColor: C.statusDeclined,
  },
});
