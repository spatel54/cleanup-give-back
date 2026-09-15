import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../tokens';

/**
 * Figma letter row graphic (node `1369:138`) — cream document card with header + body lines.
 */
export function LetterDocumentIcon({ size = 44 }: { size?: number }) {
  const scale = size / 44;
  const lineGap = 4 * scale;
  const padH = 6 * scale;
  const padTop = 9 * scale;
  const padBottom = 7 * scale;

  return (
    <View
      style={[
        s.root,
        {
          width: size,
          height: Math.round(size * (58 / 44)),
          paddingHorizontal: padH,
          paddingTop: padTop,
          paddingBottom: padBottom,
          borderRadius: 8 * scale,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <View style={[s.headerRow, { marginBottom: lineGap }]}>
        <View style={[s.headerLeft, { width: 15 * scale, height: 1 * scale }]} />
        <View style={{ width: 10 * scale, height: 4 * scale, justifyContent: 'space-between' }}>
          <View style={[s.headerRightShort, { width: 8 * scale, height: 1 * scale, marginLeft: 2 * scale }]} />
          <View style={[s.headerRightLong, { width: 10 * scale, height: 1 * scale }]} />
        </View>
      </View>
      <View style={{ gap: lineGap }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={[s.bodyLine, { height: 1 * scale }]} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeft: {
    backgroundColor: colors.textNavInactive,
  },
  headerRightShort: {
    backgroundColor: colors.textTertiary,
  },
  headerRightLong: {
    backgroundColor: colors.textTertiary,
  },
  bodyLine: {
    width: '100%',
    backgroundColor: '#D9D9D9',
  },
});
