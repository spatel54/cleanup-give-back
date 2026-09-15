import React, { useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { getLastServiceRecordExport } from '@/features/session-tracking/lastServiceRecordExport';
import { shareCachedFile } from '@/lib/shareCachedFile';

import { ExportRecordSuccessCheckIcon } from '../components/AccountIcons';
import { colors, fontFamilies, radius, textStyles } from '../tokens';

function continueHref(returnTo?: string): Href {
  if (returnTo === 'account') {
    return { pathname: '/account', params: { enter: 'fade' } } as Href;
  }
  if (returnTo === 'letters') {
    return '/letters' as Href;
  }
  return '/sessions-list' as Href;
}

/**
 * Download record success — View re-opens the share sheet for the last exported file.
 */
export function ExportRecordSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ format?: string; returnTo?: string }>();
  const format = params.format === 'csv' ? 'CSV' : 'PDF';
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : undefined;

  const handleContinue = useCallback(() => {
    router.replace(continueHref(returnTo));
  }, [returnTo, router]);

  const handleViewFile = useCallback(() => {
    const last = getLastServiceRecordExport();
    const expected = format === 'CSV' ? 'csv' : 'pdf';
    if (!last || last.format !== expected) {
      Alert.alert(`View ${format}`, `The ${format} is no longer available. Download it again.`);
      return;
    }

    void shareCachedFile({
      uri: last.uri,
      mimeType: last.format === 'csv' ? 'text/csv' : 'application/pdf',
      uti: last.format === 'csv' ? 'public.comma-separated-values-text' : 'com.adobe.pdf',
      dialogTitle: last.format === 'csv' ? 'Service record CSV' : 'Service letter PDF',
    }).catch((error) => {
      const message = error instanceof Error ? error.message : `Could not open the ${format}`;
      Alert.alert('Could not open file', message);
    });
  }, [format]);

  return (
    <View style={s.root}>
      <View style={s.card}>
        <View style={s.content}>
          <View style={s.hero}>
            <ExportRecordSuccessCheckIcon width={79} height={79} />
            <Text style={s.headline}>Your record has been downloaded!</Text>
          </View>

          <View style={s.actions}>
            <AnimatedPressable
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              style={s.continueBtn}
            >
              <Text style={s.continueLabel}>Continue</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={handleViewFile}
              accessibilityRole="button"
              accessibilityLabel={`View ${format}`}
            >
              <Text style={s.viewLink}>View {format}</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 28,
    paddingVertical: 27,
  },
  content: {
    width: '100%',
    gap: 15,
  },
  hero: {
    width: '100%',
    gap: 14,
    alignItems: 'center',
  },
  headline: {
    ...textStyles.headlineDetail,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 14,
  },
  continueBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
  viewLink: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
});
