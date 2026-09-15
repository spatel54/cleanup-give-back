import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  RadioCheckedIcon,
  RadioEmptyIcon,
  AccountChevronIcon,
} from '@/features/figma-screens/components/AccountIcons';
import { colors, fontFamilies, radius, shadows, textStyles } from '@/features/figma-screens/tokens';
import {
  TrackerMapLightIcon,
  TrackerMapDarkIcon,
} from '@/features/session-tracking/components/icons/TrackerMapThemeIcons';
import {
  setMapThemeMode,
  useMapThemeMode,
  type MapThemeMode,
} from '@/features/session-tracking/mapThemeStore';

function SystemThemeIcon({ color = '#3E4A3D', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 1.01L7 1C5.9 1 5 1.9 5 3V21C5 22.1 5.9 23 7 23H17C18.1 23 19 22.1 19 21V3C19 1.9 18.1 1.01 17 1.01ZM17 19H7V5H17V19ZM12 21C12.55 21 13 20.55 13 20C13 19.45 12.55 19 12 19C11.45 19 11 19.45 11 20C11 20.55 11.45 21 12 21Z"
        fill={color}
      />
    </Svg>
  );
}

const OPTIONS: { mode: MapThemeMode; label: string; description: string }[] = [
  { mode: 'light', label: 'Light', description: 'Always use light map style' },
  { mode: 'dark', label: 'Dark', description: 'Always use dark map style' },
  { mode: 'system', label: 'System', description: 'Switches with time of day' },
];

function OptionIcon({ mode }: { mode: MapThemeMode }) {
  const color = colors.textTertiary;
  const size = 20;
  if (mode === 'light') return <TrackerMapLightIcon color={color} size={size} />;
  if (mode === 'dark') return <TrackerMapDarkIcon color={color} size={size} />;
  return <SystemThemeIcon color={color} size={size} />;
}

export function MapThemeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentMode = useMapThemeMode();
  const [selected, setSelected] = useState<MapThemeMode>(currentMode);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  function handleSave() {
    setMapThemeMode(selected);
    router.back();
  }

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      {/* Top bar */}
      <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable
          scaleTo={0.97}
          onPress={() => router.back()}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <View style={s.backChevron}>
            <AccountChevronIcon width={16} height={16} />
          </View>
        </AnimatedPressable>
        <Text style={s.topBarTitle}>Map Theme</Text>
        <View style={s.topBarSpacer} />
      </View>

      {/* Options */}
      <View style={s.body}>
        <View style={s.card}>
          {OPTIONS.map(({ mode, label, description }, index) => (
            <AnimatedPressable
              key={mode}
              style={[s.optionRow, index < OPTIONS.length - 1 && s.optionRowBorder]}
              onPress={() => setSelected(mode)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === mode }}
              accessibilityLabel={label}
            >
              <View style={s.optionLeft}>
                <OptionIcon mode={mode} />
                <View style={s.optionText}>
                  <Text style={s.optionLabel}>{label}</Text>
                  <Text style={s.optionDesc}>{description}</Text>
                </View>
              </View>
              {selected === mode ? (
                <RadioCheckedIcon width={22} height={22} />
              ) : (
                <RadioEmptyIcon width={22} height={22} />
              )}
            </AnimatedPressable>
          ))}
        </View>
      </View>

      {/* Save button */}
      <View style={s.footer}>
        <AnimatedPressable
          style={s.saveBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save"
        >
          <Text style={s.saveBtnLabel}>Save</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.white,
  },
  backBtn: {
    padding: 4,
  },
  backChevron: {
    transform: [{ rotate: '180deg' }],
  },
  topBarTitle: {
    ...textStyles.headlineTopBar,
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  topBarSpacer: {
    width: 24,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  optionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderOutline,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  optionText: {
    gap: 2,
  },
  optionLabel: {
    ...textStyles.bodyDefault,
    color: colors.textPrimary,
  },
  optionDesc: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textTertiary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  saveBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnLabel: {
    ...textStyles.labelButton,
    color: colors.textOnPrimary,
  },
});
