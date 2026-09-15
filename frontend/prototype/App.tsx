// PROTOTYPE ROOT — NOT FINAL.
// Lightweight mock navigator for reviewing all screens end-to-end.
// Not wired into expo-router. Run standalone for prototype review only.

import { registerRootComponent } from 'expo';
import '../global.css';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from './constants/Colors';
import { NavTab, BottomNav } from './components/ui/BottomNav';

// Auth flow
import { Welcome } from './screens/auth/Welcome';
import { CreateAccount } from './screens/auth/CreateAccount';
import { AccountDetails } from './screens/auth/AccountDetails';
import { NotificationPreference } from './screens/auth/NotificationPreference';
import { SetupComplete } from './screens/auth/SetupComplete';
import { Coachmark } from './screens/auth/Coachmark';
import { CoachmarkComplete } from './screens/auth/CoachmarkComplete';

// Main screens
import { Home } from './screens/home/Home';
import { EventDetail } from './screens/event/EventDetail';
import { ShopHome } from './screens/shop/ShopHome';
import { Donate } from './screens/shop/Donate';
import { ProductDetail } from './screens/shop/ProductDetail';
import { Cart } from './screens/shop/Cart';
import { Checkout } from './screens/shop/Checkout';
import { PurchaseConfirmation } from './screens/shop/PurchaseConfirmation';
import { SessionSetup } from './screens/session/SessionSetup';
import { Permissions } from './screens/session/Permissions';
import { LiveSession } from './screens/session/LiveSession';
import { PhotoCheckpoint } from './screens/session/PhotoCheckpoint';
import { MissedCheckpoint } from './screens/session/MissedCheckpoint';
import { SessionReview } from './screens/session/SessionReview';
import { SubmissionConfirmation } from './screens/session/SubmissionConfirmation';
import { SessionsList } from './screens/sessions/SessionsList';
import { SessionsCalendar } from './screens/sessions/SessionsCalendar';
import { SessionDetail } from './screens/sessions/SessionDetail';
import { Account } from './screens/account/Account';
import { NotificationSettings } from './screens/account/NotificationSettings';
import { PrivacyPermissions } from './screens/account/PrivacyPermissions';
import { OrderHistory } from './screens/account/OrderHistory';
import { DonationHistory } from './screens/account/DonationHistory';
import { ExportServiceRecord } from './screens/account/ExportServiceRecord';

export type Screen =
  | 'welcome' | 'create-account' | 'account-details' | 'notification-pref'
  | 'setup-complete' | 'coachmark' | 'coachmark-complete'
  | 'home' | 'event-detail'
  | 'shop' | 'donate' | 'product-detail' | 'cart' | 'checkout' | 'purchase-confirmation'
  | 'session-setup' | 'permissions' | 'live-session' | 'photo-checkpoint'
  | 'missed-checkpoint' | 'session-review' | 'submission-confirmation'
  | 'sessions-list' | 'sessions-calendar' | 'session-detail'
  | 'account' | 'notification-settings' | 'privacy-permissions'
  | 'order-history' | 'donation-history' | 'export-record';

const MAIN_TABS: Record<NavTab, Screen> = {
  home: 'home',
  shop: 'shop',
  track: 'session-setup',
  sessions: 'sessions-list',
  account: 'account',
};

const MAIN_SCREENS: Screen[] = [
  'home', 'event-detail', 'shop', 'donate', 'product-detail', 'cart', 'checkout',
  'purchase-confirmation', 'session-setup', 'permissions', 'live-session',
  'photo-checkpoint', 'missed-checkpoint', 'session-review', 'submission-confirmation',
  'sessions-list', 'sessions-calendar', 'session-detail', 'account',
  'notification-settings', 'privacy-permissions', 'order-history', 'donation-history',
  'export-record',
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  function go(s: Screen) {
    setScreen(s);
  }

  function handleTabPress(tab: NavTab) {
    setActiveTab(tab);
    go(MAIN_TABS[tab]);
  }

  const showNav = MAIN_SCREENS.includes(screen);

  const sharedProps = { go };

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        {screen === 'welcome' && <Welcome go={go} />}
        {screen === 'create-account' && <CreateAccount go={go} />}
        {screen === 'account-details' && <AccountDetails go={go} />}
        {screen === 'notification-pref' && <NotificationPreference go={go} />}
        {screen === 'setup-complete' && <SetupComplete go={go} />}
        {screen === 'coachmark' && <Coachmark go={go} />}
        {screen === 'coachmark-complete' && <CoachmarkComplete go={go} />}
        {screen === 'home' && <Home go={go} />}
        {screen === 'event-detail' && <EventDetail go={go} />}
        {screen === 'shop' && <ShopHome go={go} />}
        {screen === 'donate' && <Donate go={go} />}
        {screen === 'product-detail' && <ProductDetail go={go} />}
        {screen === 'cart' && <Cart go={go} />}
        {screen === 'checkout' && <Checkout go={go} />}
        {screen === 'purchase-confirmation' && <PurchaseConfirmation go={go} />}
        {screen === 'session-setup' && <SessionSetup go={go} />}
        {screen === 'permissions' && <Permissions go={go} />}
        {screen === 'live-session' && <LiveSession go={go} />}
        {screen === 'photo-checkpoint' && <PhotoCheckpoint go={go} />}
        {screen === 'missed-checkpoint' && <MissedCheckpoint go={go} />}
        {screen === 'session-review' && <SessionReview go={go} />}
        {screen === 'submission-confirmation' && <SubmissionConfirmation go={go} />}
        {screen === 'sessions-list' && <SessionsList go={go} />}
        {screen === 'sessions-calendar' && <SessionsCalendar go={go} />}
        {screen === 'session-detail' && <SessionDetail go={go} />}
        {screen === 'account' && <Account go={go} />}
        {screen === 'notification-settings' && <NotificationSettings go={go} />}
        {screen === 'privacy-permissions' && <PrivacyPermissions go={go} />}
        {screen === 'order-history' && <OrderHistory go={go} />}
        {screen === 'donation-history' && <DonationHistory go={go} />}
        {screen === 'export-record' && <ExportServiceRecord go={go} />}
      </View>
      {showNav && (
        <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screen: {
    flex: 1,
  },
});
