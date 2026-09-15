import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, textStyles } from '../tokens';
import { Icon } from './Icon';

type Props = {
  timeLabel: string;
  size?: number;
};

/**
 * Mocked "captured photo" placeholder — tinted background + camera icon
 * + timestamp chip, in place of the legacy Stitch prototype's dangling
 * `googleusercontent` stock-photo reference (no real image asset exists
 * in the repo for this flow — see figma-to-native-handoff.md).
 */
export function PhotoPreviewCard({ timeLabel, size = 171 }: Props) {
  return (
    <View style={[styles.card, { width: size, height: size }]}>
      <View style={styles.iconWrap}>
        <Icon name="camera" size={28} color={colors.textTertiary} />
      </View>
      <View style={styles.timeChip}>
        <Text style={[textStyles.labelStatus, styles.timeText]}>{timeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrap: {
    opacity: 0.7,
  },
  timeChip: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: colors.borderOutline,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timeText: {
    color: colors.textTertiary,
    fontSize: 10,
    lineHeight: 12,
  },
});
