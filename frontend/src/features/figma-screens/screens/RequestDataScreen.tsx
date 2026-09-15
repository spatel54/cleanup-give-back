import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';

import { RadioCheckedIcon, RadioEmptyIcon } from '../components/AccountIcons';
import { colors, fontFamilies, radius, textStyles } from '../tokens';


type DataRequestOption = 'access' | 'delete' | 'download';

const OPTIONS: { id: DataRequestOption; label: string }[] = [
  { id: 'access', label: 'Access my data' },
  { id: 'delete', label: 'Delete my data' },
  { id: 'download', label: 'Download my data' },
];

/**
 * Request your data (Figma `request_data`, node `728:1385`).
 */
export function RequestDataScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<DataRequestOption>('access');

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + 32;

  function handleSubmit() {
    router.push('/request-data-sent' as Href);
  }

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Privacy Policy" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.intro}>
          <Text style={s.headline}>Request your data</Text>
          <Text style={s.body}>
            You have the right to see your data, delete it, or download it. Choose an option below.
          </Text>
        </View>

        <View style={s.formStack}>
          <View style={s.options}>
            {OPTIONS.map((option) => {
              const isSelected = selected === option.id;
              return (
                <AnimatedPressable
                  key={option.id}
                  onPress={() => setSelected(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={option.label}
                  style={[s.optionRow, isSelected ? s.optionRowSelected : null]}
                >
                  <Text style={[s.optionLabel, isSelected ? s.optionLabelSelected : null]}>
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <RadioCheckedIcon width={24} height={24} />
                  ) : (
                    <RadioEmptyIcon width={24} height={24} />
                  )}
                </AnimatedPressable>
              );
            })}
          </View>

          <AnimatedPressable
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel="Submit request"
            style={s.submitBtn}
          >
            <Text style={s.submitLabel}>Submit request</Text>
          </AnimatedPressable>
        </View>
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
    paddingTop: 30,
    gap: 42,
  },
  intro: {
    gap: 12,
  },
  headline: {
    ...textStyles.headlineDetail,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  formStack: {
    gap: 50,
  },
  options: {
    gap: 10,
  },
  optionRow: {
    minHeight: 52,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRowSelected: {
    borderColor: colors.primary,
  },
  optionLabel: {
    flex: 1,
    paddingRight: 12,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    fontFamily: fontFamilies.notoSansSemiBold,
  },
  submitBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
});
