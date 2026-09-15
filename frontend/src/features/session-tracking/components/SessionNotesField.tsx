import { useCallback, useRef, type RefObject } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, fontFamilies } from '@/features/figma-screens/tokens';

import {
  SESSION_NOTES_MAX_LENGTH,
  useSessionNotes,
} from '../sessionNotesStore';

/** Scroll offset so the notes card sits below the top bar when focused. */
const FOCUS_SCROLL_TOP_INSET = 112;

type SessionNotesFieldProps = {
  sessionId?: string;
  scrollRef?: RefObject<ScrollView | null>;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  inputStyle?: TextStyle;
  counterStyle?: TextStyle;
};

export function SessionNotesField({
  sessionId,
  scrollRef,
  containerStyle,
  titleStyle,
  inputStyle,
  counterStyle,
}: SessionNotesFieldProps) {
  const { notes, setNotes } = useSessionNotes(sessionId);
  const inputRef = useRef<TextInput>(null);

  const scrollIntoView = useCallback(() => {
    const scroll = scrollRef?.current;
    const input = inputRef.current;
    if (!scroll || !input) {
      return;
    }

    const delay = Platform.OS === 'ios' ? 300 : 100;
    setTimeout(() => {
      scroll.scrollResponderScrollNativeHandleToKeyboard(
        input,
        FOCUS_SCROLL_TOP_INSET,
        true,
      );
    }, delay);
  }, [scrollRef]);

  return (
    <View style={[s.card, containerStyle]}>
      <Text style={[s.title, titleStyle]}>Notes</Text>
      <View style={s.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={[s.input, inputStyle]}
          value={notes}
          onChangeText={setNotes}
          onFocus={scrollIntoView}
          placeholder="Add personal notes about this session..."
          placeholderTextColor={colors.textNavInactive}
          multiline
          textAlignVertical="top"
          maxLength={SESSION_NOTES_MAX_LENGTH}
          editable={Boolean(sessionId)}
          accessibilityLabel="Session notes"
          accessibilityHint={`Up to ${SESSION_NOTES_MAX_LENGTH} characters`}
        />
        {notes.length > 0 ? (
          <Text style={[s.charCount, counterStyle]} accessibilityLiveRegion="polite">
            {notes.length}/{SESSION_NOTES_MAX_LENGTH}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  title: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputWrapper: {
    gap: 8,
  },
  input: {
    minHeight: 96,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    padding: 0,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
});
