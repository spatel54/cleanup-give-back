import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import type { UpcomingEventSummary } from '../mocks/home.types';
import { colors, fontFamilies } from '../tokens';
import { DateIcon } from './HomeIcons';

type Props = {
  event: UpcomingEventSummary;
  onPress?: () => void;
};

export function UpcomingEventCard({ event, onPress }: Props) {
  const dateLabel = `${event.month} ${event.day}, ${event.year}`;

  const content = (
    <>
      <Image
        source={event.image}
        style={s.thumb}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={s.body}>
        <Text style={s.title} numberOfLines={1}>{event.title}</Text>
        <Text style={s.sub} numberOfLines={1}>{event.timeLabel}</Text>
        <View style={s.meta}>
          <DateIcon />
          <Text style={s.metaText} numberOfLines={1}>
            {dateLabel}{'  ·  '}{event.location.split(',')[0]}
          </Text>
        </View>
      </View>
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
      accessibilityLabel={`${event.title} on ${dateLabel} at ${event.location}`}
    >
      {content}
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 72,
    height: 88,
    borderRadius: 10,
    flexShrink: 0,
    backgroundColor: colors.chipBg,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sub: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textTertiary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  metaText: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textTertiary,
  },
});
