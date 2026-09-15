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
import { openDownloadServiceRecord } from '@/features/session-tracking/openDownloadServiceRecord';

import {
  AccountChevronIcon,
  DeleteAccountIcon,
  ExportRecordIcon,
  PermissionsLockIcon,
  PrivacyRowIcon,
  RequestDataIcon,
} from '../components/AccountIcons';
import { layout, colors, fontFamilies, radius, textStyles } from '../tokens';


type NavRowProps = {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
};

function PrivacyNavRow({ label, icon, onPress }: NavRowProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={s.navRow}
    >
      <View style={s.navRowLeading}>
        <View style={s.navRowIcon}>{icon}</View>
        <Text style={s.navRowLabel}>{label}</Text>
      </View>
      <AccountChevronIcon width={16} height={16} />
    </AnimatedPressable>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function PrivacySection({ title, children }: SectionProps) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{title}</Text>
      <View style={s.sectionCard}>{children}</View>
    </View>
  );
}

/**
 * Account privacy hub (§6.37, account-privacy).
 * Entry: Account → Preferences → Privacy.
 * Figma node `723:405` is missing — built from PRD wireframe.
 */
export function AccountPrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 48;

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Privacy" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Your data */}
        <PrivacySection title="Your data">
          <View style={s.dataCard}>
            <Text style={s.dataCardText}>
              We collect photos and location during sessions to verify your service hours.{' '}
              <Text
                style={s.dataCardLink}
                onPress={() => router.push('/privacy-what-we-collect' as Href)}
              >
                Learn more →
              </Text>
            </Text>
          </View>
        </PrivacySection>

        {/* Legal */}
        <PrivacySection title="Legal">
          <PrivacyNavRow
            label="Privacy Policy"
            icon={<PrivacyRowIcon width={14} height={17} />}
            onPress={() => router.push('/privacy-policy' as Href)}
          />
          <View style={s.rowDivider} />
          <PrivacyNavRow
            label="Terms of Service"
            icon={<PrivacyRowIcon width={14} height={17} />}
            onPress={() => {}}
          />
        </PrivacySection>

        {/* Your rights */}
        <PrivacySection title="Your rights">
          <PrivacyNavRow
            label="Request my data"
            icon={<RequestDataIcon />}
            onPress={() => router.push('/request-data' as Href)}
          />
          <View style={s.rowDivider} />
          <PrivacyNavRow
            label="Request deletion"
            icon={<DeleteAccountIcon width={18} height={18} />}
            onPress={() => router.push('/delete-account-confirm' as Href)}
          />
          <View style={s.rowDivider} />
          <PrivacyNavRow
            label="Download service record"
            icon={<ExportRecordIcon />}
            onPress={() => {
              void openDownloadServiceRecord(() =>
                router.push('/export-service-record?returnTo=account' as Href),
              );
            }}
          />
        </PrivacySection>

        {/* Controls */}
        <PrivacySection title="Controls">
          <PrivacyNavRow
            label="App permissions"
            icon={<PermissionsLockIcon width={18} height={18} />}
            onPress={() => {}}
          />
        </PrivacySection>

        <Text style={s.noSellNotice}>We do not sell your personal information.</Text>
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
    paddingTop: 20,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  dataCard: {
    paddingVertical: 16,
  },
  dataCardText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textNavInactive,
  },
  dataCardLink: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  navRowLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navRowIcon: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRowLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderOutline,
    marginLeft: 30,
  },
  noSellNotice: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
});
