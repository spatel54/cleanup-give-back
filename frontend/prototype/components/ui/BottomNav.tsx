import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export type NavTab = 'home' | 'shop' | 'track' | 'sessions' | 'account';

interface BottomNavProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
}

const TABS: { key: NavTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'shop', label: 'Shop', icon: '◻' },
  { key: 'track', label: 'Track', icon: '●' },
  { key: 'sessions', label: 'Sessions', icon: '≡' },
  { key: 'account', label: 'Account', icon: '○' },
];

export function BottomNav({ activeTab, onTabPress }: BottomNavProps) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const isTrack = tab.key === 'track';
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={[styles.tab, isTrack && styles.trackTab]}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            {isTrack ? (
              <View style={styles.trackButton}>
                <Text style={styles.trackIcon} accessibilityElementsHidden>▶</Text>
              </View>
            ) : (
              <>
                <Text
                  style={[styles.icon, isActive && styles.activeIcon]}
                  accessibilityElementsHidden
                >
                  {tab.icon}
                </Text>
                <Text style={[styles.label, isActive && styles.activeLabel]}>
                  {tab.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 4,
  } as ViewStyle,
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 4,
    gap: 2,
  } as ViewStyle,
  trackTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  } as ViewStyle,
  trackButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  trackIcon: {
    fontSize: 20,
    color: Colors.white,
  },
  icon: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  activeIcon: {
    color: Colors.primary,
  },
  label: {
    ...(Typography.labelSmall as any),
    color: Colors.textSecondary,
  },
  activeLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
