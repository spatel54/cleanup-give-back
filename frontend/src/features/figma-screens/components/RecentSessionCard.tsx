import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import type { RecentSessionSummary } from '../mocks/home.types';
import { colors, fontFamilies, radius as R, textStyles } from '../tokens';
import { SessionsMetaDot } from './SessionsIcons';

type Props = {
  session: RecentSessionSummary;
  onPress?: () => void;
};

/** Recent Sessions card — mirrors SessionRow layout with tighter padding. */
export function RecentSessionCard({ session, onPress }: Props) {
  const content = (
    <>
      <View style={s.copy}>
        <Text style={s.title} numberOfLines={2}>
          {session.title}
        </Text>
        <View style={s.meta}>
          <Text style={s.metaText}>{session.dateLabel}</Text>
          <SessionsMetaDot />
          <Text style={s.metaText}>{session.timeLabel}</Text>
        </View>
      </View>
      <Text style={s.duration}>{session.durationLabel}</Text>
    </>
  );

  if (!onPress) {
    return <View style={s.card}>{content}</View>;
  }

  return (
    <AnimatedPressable
      style={s.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${session.title}, ${session.dateLabel}, ${session.durationLabel}`}
    >
      {content}
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  duration: {
    ...textStyles.bodySmall,
    fontFamily: fontFamilies.notoSansSemiBold,
    color: colors.primary,
    flexShrink: 0,
  },
});
