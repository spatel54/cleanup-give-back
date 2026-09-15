import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BrandLoadingView, GARBAGIO_SAVING_MESSAGE } from '@/components/ui/BrandLoadingView';
import { colors, fontFamilies } from '@/constants/tokens';

/** Dev preview for the Garbagio save overlay — open `/tidy-man-preview`. */
export function TidyManPreviewScreen() {
  const router = useRouter();

  return (
    <View style={s.root}>
      <BrandLoadingView visible message={GARBAGIO_SAVING_MESSAGE} />
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={s.back}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={s.backLabel}>Back</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 110,
  },
  backLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textOnPrimarySoft,
  },
});
