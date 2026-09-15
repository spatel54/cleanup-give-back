import '../../../global.css';

import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import { Fragment } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { HomeScreenReturningUser } from '../screens/HomeScreenReturningUser';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { PurchaseConfirmationScreen } from '../screens/PurchaseConfirmationScreen';
import { SessionDetailScreen } from '../screens/SessionDetailScreen';
import { SessionsScreen } from '../screens/SessionsScreen';
import { DonateScreen } from '../screens/DonateScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { colors } from '../tokens';

// ─── Screen registry ────────────────────────────────────────────────────────
// All 52 screens from frontend/design/figma/manifest.yaml.
// To implement a screen: replace PlaceholderScreen in renderScreen() with the
// real component and remove the entry from PLACEHOLDER_KEYS.

type ScreenEntry = { key: string; label: string; page: string };

const PAGES: { title: string; screens: ScreenEntry[] }[] = [
  {
    title: '1 · Onboarding',
    screens: [
      { key: 'splash-loading',                label: 'Splash Loading',               page: '1·Onboarding' },
      { key: 'parent-permission-confirmation', label: 'Parent Permission',            page: '1·Onboarding' },
      { key: 'parent-permission-learn-why',    label: 'Parent Permission Learn Why',  page: '1·Onboarding' },
      { key: 'welcome',                        label: 'Welcome',                      page: '1·Onboarding' },
      { key: 'create-account',                 label: 'Create Account',               page: '1·Onboarding' },
      { key: 'account-details',                label: 'Account Details',              page: '1·Onboarding' },
      { key: 'notification-preference',        label: 'Notification Preference',      page: '1·Onboarding' },
      { key: 'setup-complete',                 label: 'Setup Complete',               page: '1·Onboarding' },
      { key: 'coachmark-tutorial',             label: 'Coachmark Tutorial',           page: '1·Onboarding' },
    ],
  },
  {
    title: '2 · Home & Events',
    screens: [
      { key: 'home',                 label: 'Home',                 page: '2·Home & Events' },
      { key: 'home-returning-user',  label: 'Home (Returning)',     page: '2·Home & Events' },
      { key: 'event-detail', label: 'Event Detail', page: '2·Home & Events' },
    ],
  },
  {
    title: '3 · Shop & Payments',
    screens: [
      { key: 'shop',                 label: 'Shop',                  page: '3·Shop & Payments' },
      { key: 'product-detail',       label: 'Product Detail',        page: '3·Shop & Payments' },
      { key: 'cart',                 label: 'Cart',                  page: '3·Shop & Payments' },
      { key: 'checkout',             label: 'Checkout',              page: '3·Shop & Payments' },
      { key: 'purchase-confirmation',label: 'Purchase Confirmation', page: '3·Shop & Payments' },
      { key: 'donate',               label: 'Donate',                page: '3·Shop & Payments' },
      { key: 'donation-checkout',    label: 'Donation Checkout',     page: '3·Shop & Payments' },
      { key: 'donation-confirmation',label: 'Donation Confirmation', page: '3·Shop & Payments' },
    ],
  },
  {
    title: '4 · Session Tracking',
    screens: [
      { key: 'session-setup',           label: 'Session Setup',           page: '4·Session Tracking' },
      { key: 'permission-location',     label: 'Permission: Location',   page: '4·Session Tracking' },
      { key: 'permission-camera',       label: 'Permission: Camera',     page: '4·Session Tracking' },
      { key: 'live-session',            label: 'Live Session',            page: '4·Session Tracking' },
      { key: 'photo-checkpoint',        label: 'Photo Checkpoint',        page: '4·Session Tracking' },
      { key: 'photo-submitted',         label: 'Photo Submitted',         page: '4·Session Tracking' },
      { key: 'missed-checkpoint',       label: 'Missed Checkpoint',       page: '4·Session Tracking' },
      { key: 'submission-confirmation', label: 'Submission Confirmation', page: '4·Session Tracking' },
    ],
  },
  {
    title: '5 · Sessions History',
    screens: [
      { key: 'sessions-list',     label: 'Sessions List',     page: '5·Sessions History' },
      { key: 'sessions-calendar', label: 'Sessions Calendar', page: '5·Sessions History' },
      { key: 'session-detail',    label: 'Session Detail',    page: '5·Sessions History' },
    ],
  },
  {
    title: '6 · Account & Settings',
    screens: [
      { key: 'account',               label: 'Account',               page: '6·Account & Settings' },
      { key: 'settings',              label: 'Settings',              page: '6·Account & Settings' },
      { key: 'privacy-security',      label: 'Privacy & Security',    page: '6·Account & Settings' },
      { key: 'notification-settings', label: 'Notification Settings', page: '6·Account & Settings' },
      { key: 'order-history',         label: 'Order History',         page: '6·Account & Settings' },
      { key: 'donation-history',      label: 'Donation History',      page: '6·Account & Settings' },
      { key: 'export-service-record', label: 'Download Service Record', page: '6·Account & Settings' },
      { key: 'approval-history',      label: 'Approval History',      page: '6·Account & Settings' },
      { key: 'account-privacy',       label: 'Account Privacy',       page: '6·Account & Settings' },
      { key: 'privacy-permissions',   label: 'Privacy Permissions',   page: '6·Account & Settings' },
    ],
  },
  {
    title: '7 · Compliance & Legal',
    screens: [
      { key: 'age-gate',                 label: 'Age Gate',                  page: '7·Compliance & Legal' },
      { key: 'parental-consent-notice',  label: 'Parental Consent Notice',   page: '7·Compliance & Legal' },
      { key: 'parental-consent-verify',  label: 'Parental Consent Verify',   page: '7·Compliance & Legal' },
      { key: 'parental-consent-pending', label: 'Parental Consent Pending',  page: '7·Compliance & Legal' },
      { key: 'teen-privacy-notice',      label: 'Teen Privacy Notice',       page: '7·Compliance & Legal' },
      { key: 'privacy-policy',           label: 'Privacy Policy',            page: '7·Compliance & Legal' },
      { key: 'terms-of-service',         label: 'Terms of Service',          page: '7·Compliance & Legal' },
      { key: 'privacy-rights-request',   label: 'Privacy Rights Request',    page: '7·Compliance & Legal' },
      { key: 'delete-account-confirm',   label: 'Delete Account Confirm',    page: '7·Compliance & Legal' },
    ],
  },
];

const SCREEN_MAP: Record<string, ScreenEntry> = {};
for (const page of PAGES) {
  for (const s of page.screens) {
    SCREEN_MAP[s.key] = s;
  }
}

const FIRST_KEY = 'home';

// ─── Render ─────────────────────────────────────────────────────────────────
// Replace PlaceholderScreen with the real component once a screen is built.

function renderScreen(key: string): React.ReactNode {
  const entry = SCREEN_MAP[key];
  if (!entry) return null;

  // TODO: swap PlaceholderScreen for each real component as they are implemented.
  // Example:
  //   case 'welcome': return <WelcomeScreen />;
  switch (key) {
    case 'home':
      return <HomeScreen />;
    case 'home-returning-user':
      return <HomeScreenReturningUser />;
    case 'event-detail':
      return <EventDetailScreen />;
    case 'shop':
      return <ShopScreen />;
    case 'donate':
      return <DonateScreen />;
    case 'product-detail':
      return <ProductDetailScreen />;
    case 'cart':
      return <CartScreen />;
    case 'checkout':
      return <CheckoutScreen />;
    case 'purchase-confirmation':
      return <PurchaseConfirmationScreen />;
    case 'sessions-list':
      return <SessionsScreen />;
    case 'session-detail':
      return <SessionDetailScreen />;
    default:
      return <PlaceholderScreen routeKey={entry.key} figmaPage={entry.page} />;
  }
}

export function PreviewApp() {
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const [screen, setScreen] = useState(FIRST_KEY);

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <DevSwitcher current={screen} onSelect={setScreen} />
          <View style={styles.stage}>{renderScreen(screen)}</View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function DevSwitcher({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (key: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.switcher}
      contentContainerStyle={styles.switcherContent}
    >
      {PAGES.map((page) => (
        <Fragment key={page.title}>
          <Text style={styles.pageLabel}>{page.title}</Text>
          {page.screens.map((s) => (
            <Text
              key={s.key}
              onPress={() => onSelect(s.key)}
              style={[styles.chip, s.key === current && styles.chipActive]}
            >
              {s.label}
            </Text>
          ))}
        </Fragment>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgApp },
  loadingScreen: { flex: 1, backgroundColor: colors.bgApp },
  switcher: { flexGrow: 0, backgroundColor: colors.textPrimary },
  switcherContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, alignItems: 'center' },
  pageLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontFamily: 'IBMPlexSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
    marginHorizontal: 4,
  },
  chip: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: colors.primary, color: colors.textOnPrimary },
  stage: { flex: 1 },
});
