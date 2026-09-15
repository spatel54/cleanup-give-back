import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionBottomNavStack,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';

import { AccountChevronIcon, CopyrightIcon } from '../components/AccountIcons';
import {
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_INDEX_ROWS,
  PRIVACY_POLICY_LAST_UPDATED,
} from '../content/privacyPolicyContent';
import { layout, colors, fontFamilies, textStyles } from '../tokens';


type PolicyRowProps = {
  title: string;
  description: string;
  onPress: () => void;
};

function PolicyRow({ title, description, onPress }: PolicyRowProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={s.policyRow}
    >
      <View style={s.policyRowText}>
        <Text style={s.policyRowTitle}>{title}</Text>
        <Text style={s.policyRowDesc}>{description}</Text>
      </View>
      <View style={s.policyRowChevron}>
        <AccountChevronIcon width={16} height={16} />
      </View>
    </AnimatedPressable>
  );
}

/**
 * Privacy Policy index (Figma `privacy_policy`, node `728:995` / PRD §6.31).
 * Lists four sections; each navigates to a detail screen.
 */
export function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 48;

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Privacy Policy" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.headline}>Privacy Policy</Text>
          <Text style={s.lastUpdated}>Effective: {PRIVACY_POLICY_EFFECTIVE_DATE}</Text>
          <Text style={s.lastUpdated}>Last updated: {PRIVACY_POLICY_LAST_UPDATED}</Text>
        </View>

        <View style={s.rows}>
          {PRIVACY_POLICY_INDEX_ROWS.map((row) => (
            <PolicyRow
              key={row.href}
              title={row.title}
              description={row.description}
              onPress={() => router.push(row.href as Href)}
            />
          ))}
        </View>

        <View style={s.copyrightRow}>
          <CopyrightIcon width={16} height={16} />
          <Text style={s.copyrightText}>
            CleanUp Give Back is a 501(c)(3) nonprofit corporation.
          </Text>
        </View>
      </ScrollView>

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
    paddingTop: 24,
    gap: 22,
  },
  header: {
    gap: 8,
  },
  headline: {
    ...textStyles.headlineDetail,
    color: colors.textPrimary,
  },
  lastUpdated: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  rows: {
    gap: 20,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  policyRowText: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  policyRowTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  policyRowDesc: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  policyRowChevron: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyrightRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 28,
    paddingBottom: 8,
  },
  copyrightText: {
    flexShrink: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.textNavInactive,
  },
});
