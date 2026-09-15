import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { DropdownEnter } from '@/components/motion/DropdownEnter';
import { useChevronRotation } from '@/components/motion/hooks';
import { BottomNavBar, type BottomNavTab } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionBottomNavStack,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { SessionSetupToggle } from '@/components/session-setup/SessionSetupToggle';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { resolveVolunteerNotificationHref } from '@/features/notifications/notificationDestinations';
import { parseIncomingCreatedAt } from '@/features/notifications/incomingVolunteerNotification';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferenceMap,
} from '@/features/notifications/notificationPreferences';
import {
  presentationForVolunteerNotificationType,
  VOLUNTEER_NOTIFICATION_TYPES,
  type NotificationTypeTone,
  type VolunteerNotification,
  type VolunteerNotificationType,
} from '@/features/notifications/notificationRouting';
import {
  formatSessionUpdateBody,
  formatSessionUpdateTitle,
  sessionPlaceFromFields,
} from '@/features/notifications/sessionNotificationCopy';
import {
  clearVolunteerNotifications,
  hydrateVolunteerNotifications,
  markNotificationRead,
  removeVolunteerNotification,
  togglePinVolunteerNotification,
  useVolunteerNotifications,
} from '@/features/notifications/volunteerNotificationsStore';
import { listSessions } from '@/lib/sessionsApi';
import { durations, easing } from '@/motion';
import {
  isSessionNotificationPermissionGranted,
  requestSessionNotificationPermission,
} from '@/utils/notificationPermissions';

import { ChevronDownIcon } from '../components/HomeIcons';
import {
  defaultNotificationCategories,
  type NotificationCategory,
  type NotificationPreferenceKey,
} from '../mocks/notifications';
import { layout, colors, fontFamilies, primitives, radius, shadows, textStyles } from '../tokens';

function PinMessageIcon({ size = 24, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 3V5H17V11L19 14V16H13V23H11V16H5V14L7 11V5H6V3H18Z" fill={color} />
    </Svg>
  );
}

/** Filled pin with slash — same weight as `PinMessageIcon`. */
function UnpinMessageIcon({ size = 24, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.825 16L7 4.175V4q0-.825.588-1.413Q8.175 2 9 2h6q.825 0 1.413.587Q17 3.175 17 4v7.25L18.825 14Zm.95 6.6l-6.6-6.6H13v5l-1 1l-1-1v-5H5v-2l2-3V9.825l-5.6-5.6L2.8 2.8l18.375 18.4Z"
        fill={color}
      />
    </Svg>
  );
}

const TAB_STORAGE_KEY = '@cugb/notificationsActiveTab';

type InboxTab = 'messages' | 'preferences';
type MessageFilter = 'all' | VolunteerNotificationType;

const MESSAGE_FILTER_OPTIONS: { id: MessageFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...VOLUNTEER_NOTIFICATION_TYPES.map((type) => ({
    id: type,
    label: presentationForVolunteerNotificationType(type).label,
  })),
];

type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function NotificationToggleRow({ title, description, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={s.toggleRow}>
      <View style={s.toggleCopy}>
        <Text style={s.toggleTitle}>{title}</Text>
        <Text style={s.toggleDescription}>{description}</Text>
      </View>
      <SessionSetupToggle
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={`${title} notifications`}
      />
    </View>
  );
}

function NotificationCategoryCard({
  category,
  values,
  onToggle,
}: {
  category: NotificationCategory;
  values: Record<NotificationPreferenceKey, boolean>;
  onToggle: (key: NotificationPreferenceKey, value: boolean) => void;
}) {
  return (
    <View style={s.categoryCard}>
      <View style={s.categoryHeader}>
        <Text style={s.categoryTitle}>{category.title}</Text>
      </View>
      <View style={s.categoryBody}>
        {category.preferences.map((preference) => (
          <NotificationToggleRow
            key={preference.id}
            title={preference.title}
            description={preference.description}
            value={values[preference.id]}
            onValueChange={(next) => onToggle(preference.id, next)}
          />
        ))}
      </View>
    </View>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseInboxTab(value: string | undefined): InboxTab | null {
  if (value === 'messages' || value === 'preferences') {
    return value;
  }
  return null;
}

function formatNotificationTime(iso: string): string {
  const parsed = parseIncomingCreatedAt(iso);
  if (!parsed) {
    return '';
  }
  return new Date(parsed).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type TypePalette = { bg: string; text: string };

function paletteForTone(tone: NotificationTypeTone): TypePalette {
  switch (tone) {
    case 'approved':
      return { bg: colors.statusApprovedBg, text: colors.statusApprovedText };
    case 'declined':
      return { bg: colors.statusDeclinedBg, text: colors.statusDeclinedText };
    case 'hours':
      return { bg: colors.statusPendingBg, text: colors.statusPendingText };
    case 'notice':
      return { bg: colors.chipBg, text: colors.textTertiary };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function paletteForFilter(filter: MessageFilter): TypePalette {
  if (filter === 'all') {
    return { bg: colors.chipBg, text: colors.textPrimary };
  }
  return paletteForTone(presentationForVolunteerNotificationType(filter).tone);
}

function TypeChip({
  label,
  palette,
  nowrap = false,
  size = 'default',
}: {
  label: string;
  palette: TypePalette;
  nowrap?: boolean;
  size?: 'default' | 'large';
}) {
  const large = size === 'large';
  return (
    <View
      style={[
        s.typeChip,
        large && s.typeChipLarge,
        nowrap && s.typeChipNowrap,
        { backgroundColor: palette.bg },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          s.typeChipLabel,
          large && s.typeChipLabelLarge,
          nowrap && s.typeChipLabelNowrap,
          { color: palette.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const SEGMENT_INSET = 4;
const SEGMENT_TABS = ['messages', 'preferences'] as const;

const SEGMENT_LABELS: Record<InboxTab, string> = {
  messages: 'Messages',
  preferences: 'Preferences',
};

function parsePreferencesOnly(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

/** Messages | Preferences pill — Emil clip-path tab morph (duplicate labels + sliding clip). */
function SegmentedTabs({
  activeTab,
  onSelect,
}: {
  activeTab: InboxTab;
  onSelect: (tab: InboxTab) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const hasLaidOut = useRef(false);
  const translateX = useSharedValue(0);
  const innerTrackWidth = Math.max(0, trackWidth - SEGMENT_INSET * 2);
  const indicatorWidth = innerTrackWidth / 2;
  const targetX = activeTab === 'preferences' ? indicatorWidth : 0;

  useEffect(() => {
    if (indicatorWidth <= 0) {
      return;
    }
    if (!hasLaidOut.current || reducedMotion) {
      translateX.value = targetX;
      hasLaidOut.current = true;
      return;
    }
    translateX.value = withTiming(targetX, {
      duration: durations.dropdown,
      easing: easing.easeInOut,
    });
  }, [indicatorWidth, reducedMotion, targetX, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const clipMaskStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const selectedLabelRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -translateX.value }],
  }));

  const renderLabelRow = (variant: 'idle' | 'selected') => (
    <View style={[s.segmentLabelRow, innerTrackWidth > 0 && { width: innerTrackWidth }]}>
      {SEGMENT_TABS.map((tab) => (
        <View key={tab} style={s.segmentLabelCell}>
          <Text
            style={[
              s.segmentLabel,
              variant === 'selected' ? s.segmentLabelSelected : s.segmentLabelIdle,
            ]}
          >
            {SEGMENT_LABELS[tab]}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={s.segmentedWrap}>
      <View
        accessibilityRole="tablist"
        style={s.segmentedTrack}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        {indicatorWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[s.segmentIndicator, { width: indicatorWidth }, indicatorStyle]}
          />
        ) : null}

        <View pointerEvents="none" style={s.segmentLabelLayer}>
          {renderLabelRow('idle')}
        </View>

        {indicatorWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              s.segmentClipMask,
              { width: indicatorWidth, left: SEGMENT_INSET },
              clipMaskStyle,
            ]}
          >
            <Animated.View style={selectedLabelRowStyle}>
              {renderLabelRow('selected')}
            </Animated.View>
          </Animated.View>
        ) : null}

        <View style={s.segmentHitRow}>
          {SEGMENT_TABS.map((tab) => (
            <AnimatedPressable
              key={tab}
              onPress={() => onSelect(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
              accessibilityLabel={SEGMENT_LABELS[tab]}
              style={s.segmentHit}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function messageFilterLabel(filter: MessageFilter): string {
  if (filter === 'all') {
    return 'All';
  }
  return presentationForVolunteerNotificationType(filter).label;
}

function FilterMenuDropdown({
  filter,
  onSelectFilter,
}: {
  filter: MessageFilter;
  onSelectFilter: (next: MessageFilter) => void;
}) {
  return (
    <DropdownEnter style={s.filterMenu} accessibilityRole="menu">
      {MESSAGE_FILTER_OPTIONS.map((option, index) => {
        const selected = option.id === filter;
        const isFirst = index === 0;
        const isLast = index === MESSAGE_FILTER_OPTIONS.length - 1;
        return (
          <AnimatedPressable
            key={option.id}
            onPress={() => onSelectFilter(option.id)}
            accessibilityRole="menuitem"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[
              s.filterOption,
              selected && s.filterOptionSelected,
              selected && isFirst && s.filterOptionSelectedFirst,
              selected && isLast && s.filterOptionSelectedLast,
            ]}
          >
            <TypeChip
              nowrap
              size="large"
              label={option.label}
              palette={paletteForFilter(option.id)}
            />
          </AnimatedPressable>
        );
      })}
    </DropdownEnter>
  );
}

function MessagesToolbar({
  filter,
  filterOpen,
  canClear,
  onToggleFilter,
  onSelectFilter,
  onClear,
}: {
  filter: MessageFilter;
  filterOpen: boolean;
  canClear: boolean;
  onToggleFilter: () => void;
  onSelectFilter: (next: MessageFilter) => void;
  onClear: () => void;
}) {
  const chevronStyle = useChevronRotation(filterOpen);

  return (
    <View style={s.toolbar}>
      <View style={s.filterWrap}>
        <AnimatedPressable
          onPress={onToggleFilter}
          accessibilityRole="button"
          accessibilityLabel={`Filter messages, ${messageFilterLabel(filter)}`}
          accessibilityState={{ expanded: filterOpen }}
          style={s.filterControl}
        >
          <TypeChip
            nowrap
            size="large"
            label={messageFilterLabel(filter)}
            palette={paletteForFilter(filter)}
          />
          <Animated.View style={chevronStyle}>
            <ChevronDownIcon size={16} color={colors.textPrimary} />
          </Animated.View>
        </AnimatedPressable>
        {filterOpen ? (
          <FilterMenuDropdown filter={filter} onSelectFilter={onSelectFilter} />
        ) : null}
      </View>
      {canClear ? (
        <AnimatedPressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear all messages"
          style={s.clearButton}
        >
          <Text style={s.clearButtonLabel}>Clear all messages</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

function OsPermissionBanner({ granted }: { granted: boolean }) {
  if (granted) {
    return null;
  }

  return (
    <View style={s.messagesPad}>
      <View style={s.osBanner}>
        <Text style={s.osBannerTitle}>Notifications are off. Enable them in device Settings.</Text>
        <AnimatedPressable
          onPress={() => void Linking.openSettings()}
          accessibilityRole="button"
          accessibilityLabel="Open Settings"
          style={s.osBannerAction}
        >
          <Text style={s.osBannerActionLabel}>Open Settings</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const SESSION_UPDATE_TYPES = new Set([
  'session_approved',
  'session_declined',
  'hours_adjusted',
  'status_updated',
]);

function MessageRow({
  item,
  placeName,
  onPress,
  onDelete,
  onTogglePin,
}: {
  item: VolunteerNotification;
  placeName: string | null;
  onPress: (item: VolunteerNotification) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);
  const unread = item.readAt == null;
  const pinned = item.pinnedAt != null;
  const { label: typeLabel, tone } = presentationForVolunteerNotificationType(item.type);
  const palette = paletteForTone(tone);
  const timeLabel = formatNotificationTime(item.createdAt);
  const title = SESSION_UPDATE_TYPES.has(item.type)
    ? formatSessionUpdateTitle(item.title, placeName)
    : item.title;
  const body = SESSION_UPDATE_TYPES.has(item.type)
    ? formatSessionUpdateBody(item.body, placeName)
    : item.body;

  return (
    <Swipeable
      key={`${item.id}-${pinned ? 'pinned' : 'unpinned'}`}
      ref={swipeRef}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      renderLeftActions={() => (
        <Pressable
          onPress={() => {
            swipeRef.current?.close();
            onTogglePin(item.id);
          }}
          accessibilityRole="button"
          accessibilityLabel={pinned ? 'Unpin message' : 'Pin message'}
          style={pinned ? s.swipeUnpinAction : s.swipePinAction}
        >
          {pinned ? (
            <UnpinMessageIcon size={22} color={colors.white} />
          ) : (
            <PinMessageIcon size={22} color={colors.white} />
          )}
        </Pressable>
      )}
      renderRightActions={() => (
        <Pressable
          onPress={() => {
            swipeRef.current?.close();
            onDelete(item.id);
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete message"
          style={s.swipeDeleteAction}
        >
          <Ionicons name="trash-outline" size={22} color={colors.white} />
        </Pressable>
      )}
    >
      <AnimatedPressable
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${pinned ? 'Pinned. ' : ''}${typeLabel}. ${title}. ${body}`}
        style={s.messageCard}
      >
        <View style={s.messageHeader}>
          <TypeChip label={typeLabel} palette={palette} />
          <View style={s.headerMeta}>
            {pinned ? (
              <View accessibilityLabel="Pinned">
                <PinMessageIcon size={14} color={colors.statusPendingBorder} />
              </View>
            ) : unread ? (
              <View style={s.unreadDot} />
            ) : null}
            {timeLabel ? <Text style={s.messageTime}>{timeLabel}</Text> : null}
          </View>
        </View>
        <Text style={s.messageTitle}>{title}</Text>
        <Text style={s.messageBody}>{body}</Text>
      </AnimatedPressable>
    </Swipeable>
  );
}

/**
 * Notification inbox (Home bell) or preference toggles (Account → Notification Preferences).
 */
export function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string | string[]; preferencesOnly?: string | string[] }>();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const [inboxTab, setInboxTab] = useState<InboxTab>('messages');
  const [preferences, setPreferences] = useState<NotificationPreferenceMap>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [osNotificationsGranted, setOsNotificationsGranted] = useState(false);
  const [sessionPlaces, setSessionPlaces] = useState<Record<string, string>>({});
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const messages = useVolunteerNotifications();
  const visibleMessages =
    messageFilter === 'all'
      ? messages
      : messages.filter((item) => item.type === messageFilter);
  const pinnedMessages = visibleMessages.filter((item) => item.pinnedAt != null);
  const unpinnedMessages = visibleMessages.filter((item) => item.pinnedAt == null);

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 24;
  const routeTab = parseInboxTab(firstParam(params.tab));
  const preferencesOnly = parsePreferencesOnly(firstParam(params.preferencesOnly));
  const showInboxTabToggle = !preferencesOnly;
  const activeInboxTab: InboxTab = preferencesOnly ? 'preferences' : inboxTab;

  const persistInboxTab = useCallback((tab: InboxTab) => {
    setInboxTab(tab);
    void AsyncStorage.setItem(TAB_STORAGE_KEY, tab);
  }, []);

  useEffect(() => {
    if (preferencesOnly) {
      return;
    }
    if (routeTab) {
      persistInboxTab(routeTab);
      return;
    }
    let cancelled = false;
    void AsyncStorage.getItem(TAB_STORAGE_KEY).then((stored) => {
      const parsed = parseInboxTab(stored ?? undefined);
      if (!cancelled && parsed) {
        setInboxTab(parsed);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [persistInboxTab, preferencesOnly, routeTab]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      void isSessionNotificationPermissionGranted().then((granted) => {
        if (isMounted) setOsNotificationsGranted(granted);
      });
      void loadNotificationPreferences().then((loaded) => {
        if (isMounted) setPreferences(loaded);
      });
      void hydrateVolunteerNotifications();
      void listSessions()
        .then((sessions) => {
          if (!isMounted) {
            return;
          }
          const next: Record<string, string> = {};
          for (const session of sessions) {
            const place = sessionPlaceFromFields(session.description, session.activity);
            if (place) {
              next[session.id] = place;
            }
          }
          setSessionPlaces(next);
        })
        .catch((error) => {
          console.warn('[notifications] session place lookup failed:', error);
        });
      return () => {
        isMounted = false;
      };
    }, []),
  );

  function handleSelectTab(tab: InboxTab) {
    setFilterOpen(false);
    persistInboxTab(tab);
    router.setParams({ tab });
  }

  async function handleToggle(key: NotificationPreferenceKey, value: boolean) {
    if (value && !osNotificationsGranted) {
      const result = await requestSessionNotificationPermission();
      setOsNotificationsGranted(result.granted);
      if (!result.granted) {
        Alert.alert(
          'Notifications are off',
          'Enable Notifications for Expo Go in Settings to receive these alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
    }

    const next = { ...preferences, [key]: value };
    setPreferences(next);
    await saveNotificationPreferences(next);
  }

  async function handleMessagePress(item: VolunteerNotification) {
    await markNotificationRead(item.id);
    const href = await resolveVolunteerNotificationHref(item);
    router.push(href as Href);
  }

  function handleClearAllMessages() {
    if (messages.length === 0) {
      return;
    }
    Alert.alert(
      'Clear all messages?',
      'This removes every message from your inbox.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            void clearVolunteerNotifications();
          },
        },
      ],
    );
  }

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar
        title={preferencesOnly ? 'Notification Preferences' : 'Notifications'}
        onBack={() => router.back()}
      />
      {showInboxTabToggle ? (
        <SegmentedTabs activeTab={activeInboxTab} onSelect={handleSelectTab} />
      ) : null}
      {activeInboxTab === 'messages' ? (
        <>
          {filterOpen ? (
            <Pressable
              accessibilityLabel="Dismiss filter"
              onPress={() => setFilterOpen(false)}
              style={s.filterBackdrop}
            />
          ) : null}
          <MessagesToolbar
            filter={messageFilter}
            filterOpen={filterOpen}
            canClear={messages.length > 0}
            onToggleFilter={() => setFilterOpen((open) => !open)}
            onSelectFilter={(next) => {
              setMessageFilter(next);
              setFilterOpen(false);
            }}
            onClear={handleClearAllMessages}
          />
        </>
      ) : null}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {activeInboxTab === 'messages' ? (
          messages.length === 0 ? (
            <View style={s.messagesPad}>
              <EmptyState title="No messages yet" />
            </View>
          ) : visibleMessages.length === 0 ? (
            <View style={s.messagesPad}>
              <EmptyState title="No messages of this type" />
            </View>
          ) : (
            <View style={s.messagesList}>
              {pinnedMessages.length > 0 ? (
                <>
                  <Text style={s.sectionLabel}>Pinned</Text>
                  {pinnedMessages.map((item) => (
                    <MessageRow
                      key={item.id}
                      item={item}
                      placeName={item.sessionId ? sessionPlaces[item.sessionId] ?? null : null}
                      onPress={handleMessagePress}
                      onTogglePin={(id) => {
                        void togglePinVolunteerNotification(id);
                      }}
                      onDelete={(id) => {
                        void removeVolunteerNotification(id);
                      }}
                    />
                  ))}
                  <View style={s.pinnedDivider} />
                </>
              ) : null}
              {unpinnedMessages.map((item) => (
                <MessageRow
                  key={item.id}
                  item={item}
                  placeName={item.sessionId ? sessionPlaces[item.sessionId] ?? null : null}
                  onPress={handleMessagePress}
                  onTogglePin={(id) => {
                    void togglePinVolunteerNotification(id);
                  }}
                  onDelete={(id) => {
                    void removeVolunteerNotification(id);
                  }}
                />
              ))}
            </View>
          )
        ) : (
          <>
            <OsPermissionBanner granted={osNotificationsGranted} />
            <Text style={s.intro}>
              Turn on the alerts you want. You can change these anytime.
            </Text>
            <View style={s.categories}>
              {defaultNotificationCategories.map((category) => (
                <NotificationCategoryCard
                  key={category.id}
                  category={category}
                  values={preferences}
                  onToggle={handleToggle}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <LiveSessionBottomNavStack
        isActive={isActive}
        barStyle={barStyle}
        expandLiveSession={expandLiveSession}
        bottomInset={bottomInset}
      >
        <BottomNavBar
          activeTab={activeTab}
          onHomePress={() => {
            setActiveTab('home');
            router.replace('/');
          }}
          onShopPress={() => setActiveTab('shop')}
          onTrackPress={onTrackPress}
          onSessionsPress={() => {
            setActiveTab('sessions');
            router.push('/sessions-list' as Href);
          }}
          onProfilePress={() => {
            setActiveTab('profile');
            router.push('/account' as Href);
          }}
        />
      </LiveSessionBottomNavStack>
    </View>
  );
}

const CHIP_BORDER = '#e5e2e1';

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  segmentedWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  filterBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 9,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  filterWrap: {
    position: 'relative',
    flexShrink: 1,
  },
  filterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  filterMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    minWidth: 176,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    overflow: 'hidden',
    zIndex: 20,
    ...shadows.barTop,
  },
  filterOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  filterOptionSelected: {
    backgroundColor: colors.chipSelectedBg,
  },
  filterOptionSelectedFirst: {
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  filterOptionSelectedLast: {
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  segmentedTrack: {
    minHeight: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  segmentIndicator: {
    position: 'absolute',
    top: SEGMENT_INSET,
    bottom: SEGMENT_INSET,
    left: SEGMENT_INSET,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    zIndex: 1,
  },
  segmentLabelLayer: {
    padding: SEGMENT_INSET,
    zIndex: 2,
  },
  segmentLabelRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 40,
  },
  segmentLabelCell: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentClipMask: {
    position: 'absolute',
    top: SEGMENT_INSET,
    bottom: SEGMENT_INSET,
    overflow: 'hidden',
    borderRadius: radius.full,
    zIndex: 3,
  },
  segmentHitRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    padding: SEGMENT_INSET,
    zIndex: 4,
  },
  segmentHit: {
    flex: 1,
  },
  segmentLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
    textAlign: 'center',
  },
  segmentLabelSelected: {
    color: colors.primary,
  },
  segmentLabelIdle: {
    color: colors.textOnPrimary,
  },
  scroll: {
    flex: 1,
    zIndex: 0,
  },
  scrollContent: {
    paddingTop: 16,
    gap: 20,
  },
  intro: {
    paddingHorizontal: 24,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textNavInactive,
  },
  categories: {
    paddingHorizontal: 16,
    gap: 20,
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 25,
    gap: 16,
  },
  categoryHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: CHIP_BORDER,
  },
  categoryTitle: {
    paddingBottom: 9,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  categoryBody: {
    gap: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  toggleTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  toggleDescription: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  osBanner: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  osBannerTitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  osBannerAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
  },
  osBannerActionLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  messagesPad: {
    paddingHorizontal: 16,
  },
  messagesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textNavInactive,
    marginBottom: -4,
  },
  pinnedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
    marginTop: 4,
    marginBottom: 4,
  },
  messageCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  swipePinAction: {
    width: 72,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: colors.statusPendingBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Neutral gray — distinct from Pin amber and Delete red (not yellow). */
  swipeUnpinAction: {
    width: 72,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: primitives.gray500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDeleteAction: {
    width: 72,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: colors.statusDeclinedText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeChip: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 1,
  },
  typeChipLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 52,
    alignItems: 'center',
  },
  typeChipNowrap: {
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  typeChipLabel: {
    ...textStyles.labelStatus,
  },
  typeChipLabelLarge: {
    fontSize: 12,
  },
  typeChipLabelNowrap: {
    flexShrink: 0,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  messageTitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  messageBody: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  messageTime: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
});
