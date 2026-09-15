import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { DataRequestSentCheckIcon } from '../components/AccountIcons';
import { colors, fontFamilies, radius, textStyles } from '../tokens';

/**
 * Data request sent confirmation (Figma `request_data_sent`, node `728:1648`).
 */
export function RequestDataSentScreen() {
  const router = useRouter();

  function handleContinue() {
    router.replace({ pathname: '/account', params: { enter: 'fade' } } as Href);
  }

  return (
    <View style={s.root}>
      <View style={s.card}>
        <View style={s.content}>
          <View style={s.hero}>
            <DataRequestSentCheckIcon width={79} height={79} />
            <Text style={s.headline}>Your data request has been sent.</Text>
          </View>

          <View style={s.footer}>
            <Text style={s.body}>
              You will be contact by the CleanUpGiveBack team to take further action on your data.
            </Text>
            <AnimatedPressable
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              style={s.continueBtn}
            >
              <Text style={s.continueLabel}>Continue</Text>
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
    paddingVertical: 30,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 303,
    alignSelf: 'center',
    gap: 15,
    alignItems: 'center',
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
  footer: {
    width: '100%',
    gap: 15,
  },
  body: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textNavInactive,
    textAlign: 'center',
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
});
