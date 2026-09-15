import { StyleSheet, Text, View } from 'react-native';

import { colors, textStyles } from '../tokens';

interface Props {
  routeKey: string;
  figmaPage: string;
}

export function PlaceholderScreen({ routeKey, figmaPage }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.page}>{figmaPage}</Text>
      <Text style={styles.title}>{routeKey}</Text>
      <Text style={styles.hint}>Figma implementation pending</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  page: {
    fontFamily: textStyles.labelOverline.fontFamily,
    fontSize: textStyles.labelOverline.fontSize,
    color: colors.textTertiary,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: textStyles.headlinePage.fontFamily,
    fontSize: textStyles.headlinePage.fontSize,
    lineHeight: textStyles.headlinePage.lineHeight,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  hint: {
    fontFamily: textStyles.bodySmall.fontFamily,
    fontSize: textStyles.bodySmall.fontSize,
    lineHeight: textStyles.bodySmall.lineHeight,
    color: colors.primary,
    textAlign: 'center',
  },
});
