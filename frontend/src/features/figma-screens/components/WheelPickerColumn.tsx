import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fontFamilies } from '../tokens';

export const WHEEL_ITEM_HEIGHT = 34;
const VISIBLE_ITEMS = 5;
export const WHEEL_PICKER_HEIGHT = WHEEL_ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = WHEEL_ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

type Props = {
  items: readonly string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

function opacityForDistance(distance: number): number {
  if (distance === 0) {
    return 1;
  }
  if (distance === 1) {
    return 0.45;
  }
  if (distance === 2) {
    return 0.25;
  }
  return 0.12;
}

export function WheelPickerColumn({ items, selectedIndex, onIndexChange, style }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (isUserScrolling.current) {
      return;
    }
    scrollRef.current?.scrollTo({
      y: selectedIndex * WHEEL_ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex, items.length]);

  const snapToIndex = (offsetY: number) => {
    const nextIndex = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, nextIndex));
    setActiveIndex(clamped);
    scrollRef.current?.scrollTo({
      y: clamped * WHEEL_ITEM_HEIGHT,
      animated: true,
    });
    if (clamped !== selectedIndex) {
      onIndexChange(clamped);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, nextIndex));
    setActiveIndex(clamped);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserScrolling.current = false;
    snapToIndex(event.nativeEvent.contentOffset.y);
  };

  return (
    <View style={[s.column, style]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          isUserScrolling.current = true;
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(event) => {
          if (!event.nativeEvent.velocity || Math.abs(event.nativeEvent.velocity.y) < 0.1) {
            handleScrollEnd(event);
          }
        }}
        contentContainerStyle={s.content}
      >
        {items.map((label, index) => {
          const distance = Math.abs(index - activeIndex);
          return (
            <View key={`${label}-${index}`} style={s.item}>
              <Text
                style={[
                  s.itemText,
                  distance === 0 && s.itemTextSelected,
                  { opacity: opacityForDistance(distance) },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  column: {
    flex: 1,
    height: WHEEL_PICKER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    paddingVertical: WHEEL_PADDING,
  },
  item: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  itemText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  itemTextSelected: {
    fontFamily: fontFamilies.notoSansMedium,
    color: colors.textPrimary,
  },
});
