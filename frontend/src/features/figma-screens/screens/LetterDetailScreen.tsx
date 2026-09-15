import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatLetterDate, type DownloadedLetter } from '@/features/session-tracking/downloadedLetters';
import {
  letterFileExists,
  updateDownloadedLetterFile,
  useDownloadedLetter,
} from '@/features/session-tracking/downloadedLettersStore';
import { isApiConfigured } from '@/lib/api';
import { downloadServiceLetterPdf } from '@/lib/downloadServiceLetterPdf';
import { shareCachedFile } from '@/lib/shareCachedFile';

import { LetterDocumentIcon } from '../components/LetterDocumentIcon';
import { colors, fontFamilies, radius, textStyles } from '../tokens';

async function shareLetterFile(uri: string): Promise<void> {
  await shareCachedFile({
    uri,
    mimeType: 'application/pdf',
    uti: 'com.adobe.pdf',
    dialogTitle: 'Service letter PDF',
  });
}

async function openLetterPdf(letter: DownloadedLetter): Promise<void> {
  const exists = await letterFileExists(letter.fileUri);
  if (exists) {
    await shareLetterFile(letter.fileUri);
    return;
  }

  if (letter.sessionIds.length === 0 || !isApiConfigured) {
    throw new Error('This letter is no longer on this device. Download it again from an approved session.');
  }

  const file = await downloadServiceLetterPdf(letter.sessionIds, {
    share: false,
    record: false,
  });
  updateDownloadedLetterFile(letter.id, file);
  await shareLetterFile(file.uri);
}

/**
 * Saved service letter — metadata plus View PDF / Share (OS share sheet).
 */
export function LetterDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const letterId = typeof params.id === 'string' ? params.id : undefined;
  const letter = useDownloadedLetter(letterId);
  const [busy, setBusy] = useState(false);

  const handleOpenPdf = useCallback(() => {
    if (!letter || busy) {
      return;
    }
    void (async () => {
      setBusy(true);
      try {
        await openLetterPdf(letter);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not open the service letter';
        Alert.alert('Could not open letter', message);
      } finally {
        setBusy(false);
      }
    })();
  }, [busy, letter]);

  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Service letter" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: bottomInset + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {!letter ? (
          <EmptyState
            title="Letter not found"
            body="This letter is no longer in your library."
            ctaLabel="Back to Letters"
            ctaAccessibilityLabel="Back to Letters"
            onCtaPress={() => router.replace('/letters' as Href)}
          />
        ) : (
          <View style={s.card}>
            <LetterDocumentIcon size={56} />
            <Text style={s.title}>{letter.title}</Text>
            <Text style={s.subtitle}>{letter.subtitle}</Text>
            <Text style={s.savedLabel}>Saved {formatLetterDate(letter.downloadedAtMs)}</Text>

            <View style={s.actions}>
              <AnimatedPressable
                onPress={handleOpenPdf}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="View PDF"
                style={s.primaryButton}
              >
                {busy ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={s.primaryLabel}>View PDF</Text>
                )}
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleOpenPdf}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Share service letter"
                style={s.secondaryButton}
              >
                <Text style={s.secondaryLabel}>Share</Text>
              </AnimatedPressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...textStyles.headlineDetail,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  savedLabel: {
    ...textStyles.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    ...textStyles.labelButton,
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.primary,
  },
});
