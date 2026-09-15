import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionBottomNavStack,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';

import { AccountChevronIcon } from '../components/AccountIcons';
import { LinkedPolicyText } from '../components/LinkedPolicyText';
import type { PrivacySection } from '../content/privacyPolicyContent';
import { layout, colors, fontFamilies, radius, shadows, textStyles } from '../tokens';

export type { PrivacySection };

type Props = {
  /** Section title displayed inline below the top bar (e.g. "What we collect"). */
  sectionTitle: string;
  sections: PrivacySection[];
  /** Display date string, e.g. "July 23, 2026". */
  lastUpdated: string;
};

/**
 * Shared article template for all Privacy Policy detail screens.
 * Figma: `what-we-collect` (728:1295), `how-we-use-it` (735:101),
 *        `who-we-share-it-with` (735:160), `how-we-protect-it` (735:219).
 */
export function PrivacyPolicyDetailScreen({ sectionTitle, sections, lastUpdated }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 148;
  const scrollRef = useRef<ScrollView>(null);

  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const fabOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(0);
  const contentH = useRef(0);
  const layoutH = useRef(0);

  const checkAtBottom = useCallback(() => {
    const atBottom = scrollY.current + layoutH.current >= contentH.current - 20;
    setHasReachedBottom(atBottom);
  }, []);

  useEffect(() => {
    Animated.timing(fabOpacity, {
      toValue: hasReachedBottom ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fabOpacity, hasReachedBottom]);

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Privacy Policy" onBack={() => router.back()} />

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
          checkAtBottom();
        }}
        onLayout={(e) => {
          layoutH.current = e.nativeEvent.layout.height;
          checkAtBottom();
        }}
        onContentSizeChange={(_, h) => {
          contentH.current = h;
          checkAtBottom();
        }}
      >
        {/* Section header — back link + title + date */}
        <AnimatedPressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to Privacy Policy"
          style={s.sectionHeader}
        >
          <Text style={s.sectionTitle}>{sectionTitle}</Text>
        </AnimatedPressable>

        <Text style={s.lastUpdated}>Last updated: {lastUpdated}</Text>

        <View style={s.body}>
          {sections.map((section) => (
            <View key={section.title} style={s.section}>
              <Text style={s.sectionHeading}>{section.title}</Text>
              <LinkedPolicyText style={s.sectionBody}>{section.body}</LinkedPolicyText>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky FAB — hidden until user reaches the bottom, then scrolls to top */}
      <Animated.View
        style={[s.fab, { bottom: bottomInset + layout.bottomNavHeight + 16 }, { opacity: fabOpacity }]}
        pointerEvents={hasReachedBottom ? 'auto' : 'none'}
      >
        <AnimatedPressable
          scaleTo={0.94}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
          style={s.fabInner}
        >
          <View style={s.fabChevronWrap}>
            <AccountChevronIcon
              width={20}
              height={20}
              style={s.fabChevron}
            />
          </View>
        </AnimatedPressable>
      </Animated.View>


      <LiveSessionBottomNavStack
        isActive={isActive}
        barStyle={barStyle}
        expandLiveSession={expandLiveSession}
        bottomInset={bottomInset}
      >
        <BottomNavBar
          activeTab="profile"
          onHomePress={() => router.replace('/')}
          onShopPress={() => router.push('/shop' as Href)}
          onTrackPress={onTrackPress}
          onSessionsPress={() => router.push('/sessions-list' as Href)}
          onProfilePress={() => router.replace('/account' as Href)}
        />
      </LiveSessionBottomNavStack>
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
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 25,
  },
  sectionTitle: {
    ...textStyles.headlineTopBar,
    color: colors.textNavInactive,
  },
  lastUpdated: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    marginBottom: 30,
  },
  body: {
    gap: 30,
  },
  section: {
    gap: 15,
  },
  sectionHeading: {
    fontFamily: fontFamilies.notoSansBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionBody: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    ...shadows.barTop,
  },
  fabInner: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabChevronWrap: {
    transform: [{ rotate: '-90deg' }],
  },
  fabChevron: {
    tintColor: colors.white,
  },
});
