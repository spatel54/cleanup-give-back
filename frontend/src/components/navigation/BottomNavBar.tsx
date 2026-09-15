import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { colors, shadows, textStyles } from '@/features/figma-screens/tokens';

import { NavHomeIcon } from './icons/NavHomeIcon';
import { NavProfileIcon } from './icons/NavProfileIcon';
import { NavSessionsIcon } from './icons/NavSessionsIcon';
import { NavShopIcon } from './icons/NavShopIcon';
import { NavTrackIcon } from './icons/NavTrackIcon';

export type BottomNavTab = 'home' | 'shop' | 'track' | 'sessions' | 'profile';

type Props = {
  activeTab: BottomNavTab;
  onHomePress?: () => void;
  onShopPress?: () => void;
  onTrackPress?: () => void;
  onSessionsPress?: () => void;
  onProfilePress?: () => void;
};

/**
 * 5-tab Home dashboard navbar (Figma node `566:376`, file
 * DrDcQH14n7ntDQ80F7au9S): Home · Shop · Track · Sessions · Profile.
 * Distinct from `session-tracking/components/BottomNavBar` (3-tab, FAB
 * pattern) — that one is scoped to the Session Tracking prototype flow.
 */
export function BottomNavBar({
  activeTab,
  onHomePress,
  onShopPress,
  onTrackPress,
  onSessionsPress,
  onProfilePress,
}: Props) {
  return (
    <View style={[styles.bar, shadows.navBottom]}>
      <View style={styles.row}>
        <NavTabButton label="Home" active={activeTab === 'home'} onPress={onHomePress} style={styles.tabHome}>
          <NavHomeIcon color={activeTab === 'home' ? colors.primary : colors.textTertiary} />
        </NavTabButton>
        <NavTabButton label="Shop" active={activeTab === 'shop'} onPress={onShopPress} style={styles.tabShop}>
          <NavShopIcon color={activeTab === 'shop' ? colors.primary : colors.textTertiary} />
        </NavTabButton>
        <NavTabButton label="Track" active={activeTab === 'track'} onPress={onTrackPress} style={styles.tabTrack}>
          <NavTrackIcon color={activeTab === 'track' ? colors.primary : colors.textTertiary} />
        </NavTabButton>
        <NavTabButton label="Sessions" active={activeTab === 'sessions'} onPress={onSessionsPress} style={styles.tabSessions}>
          <NavSessionsIcon color={activeTab === 'sessions' ? colors.primary : colors.textTertiary} />
        </NavTabButton>
        <NavTabButton label="Profile" active={activeTab === 'profile'} onPress={onProfilePress} style={styles.tabProfile}>
          <NavProfileIcon color={activeTab === 'profile' ? colors.primary : colors.textTertiary} />
        </NavTabButton>
      </View>
    </View>
  );
}

function NavTabButton({
  label,
  active,
  onPress,
  style,
  children,
}: {
  label: string;
  active: boolean;
  onPress?: () => void;
  style: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[styles.tab, style]}
    >
      <View style={styles.iconSlot}>{children}</View>
      <Text style={[styles.label, { color: active ? colors.primary : colors.textTertiary }]}>{label}</Text>
    </AnimatedPressable>
  );
}

/** Tallest nav glyph is 24 (Sessions / Profile); slot keeps every label on one baseline. */
const NAV_ICON_SLOT = 24;

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.textOnPrimary,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'flex-end',
    gap: 37,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    minHeight: 44,
  },
  iconSlot: {
    height: NAV_ICON_SLOT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tabHome: { width: 43 },
  tabShop: { width: 34 },
  tabTrack: { width: 35 },
  tabSessions: { width: 57 },
  tabProfile: { width: 43 },
  label: {
    ...textStyles.navTab,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
