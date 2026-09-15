import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { colors, fontFamilies } from '../tokens';

/** Emails and http(s)/www URLs in plain policy copy. */
const LINK_PATTERN =
  /(https?:\/\/[^\s]+|www\.[^\s]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

type Props = {
  children: string;
  style?: StyleProp<TextStyle>;
};

function trimTrailingPunctuation(value: string): string {
  return value.replace(/[),.;:!?]+$/u, '');
}

function hrefForMatch(raw: string): string {
  const match = trimTrailingPunctuation(raw);
  if (match.includes('@') && !/^https?:\/\//i.test(match) && !/^www\./i.test(match)) {
    return `mailto:${match}`;
  }
  if (/^https?:\/\//i.test(match)) {
    return match;
  }
  return `https://${match}`;
}

function displayForMatch(raw: string): string {
  return trimTrailingPunctuation(raw);
}

/**
 * Renders policy body text with emails and URLs as tappable primary-green links.
 */
export function LinkedPolicyText({ children, style }: Props) {
  const parts = useMemo(() => {
    const segments: Array<{ text: string; href?: string }> = [];
    let lastIndex = 0;
    const re = new RegExp(LINK_PATTERN.source, LINK_PATTERN.flags);
    let found: RegExpExecArray | null;
    while ((found = re.exec(children)) !== null) {
      if (found.index > lastIndex) {
        segments.push({ text: children.slice(lastIndex, found.index) });
      }
      const raw = found[0];
      const display = displayForMatch(raw);
      const trailing = raw.slice(display.length);
      segments.push({ text: display, href: hrefForMatch(raw) });
      if (trailing) {
        segments.push({ text: trailing });
      }
      lastIndex = found.index + raw.length;
    }
    if (lastIndex < children.length) {
      segments.push({ text: children.slice(lastIndex) });
    }
    return segments;
  }, [children]);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (!part.href) {
          return <Text key={`text-${index}`}>{part.text}</Text>;
        }
        const href = part.href;
        return (
          <Text
            key={`link-${index}`}
            style={s.link}
            onPress={() => {
              void Linking.openURL(href);
            }}
            accessibilityRole="link"
            accessibilityLabel={part.text}
          >
            {part.text}
          </Text>
        );
      })}
    </Text>
  );
}

const s = StyleSheet.create({
  link: {
    color: colors.primary,
    fontFamily: fontFamilies.notoSansRegular,
    textDecorationLine: 'underline',
  },
});
