import { IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useChevronRotation } from '@/components/motion/hooks';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass } from '@/components/ui/Compass';
import { BrandLoadingView } from '@/components/ui/BrandLoadingView';
import { PhotoEnlargeModal } from '@/components/ui/PhotoEnlargeModal';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';
import { LiveSessionMap } from '@/features/session-tracking/components/LiveSessionMap';
import { MapTypesSheet } from '@/features/session-tracking/components/MapTypesSheet';
import { TrackerActionButton } from '@/features/session-tracking/components/TrackerActionButton';
import { LocationPinIcon } from '@/features/session-tracking/components/icons/LocationPinIcon';
import { TrackerEndSessionIcon } from '@/features/session-tracking/components/icons/TrackerEndSessionIcon';
import { TrackerSubmitPhotoIcon } from '@/features/session-tracking/components/icons/TrackerSubmitPhotoIcon';
import { TrackerLayersIcon } from '@/features/session-tracking/components/icons/TrackerLayersIcon';
import { TrackerMapDarkIcon, TrackerMapLightIcon } from '@/features/session-tracking/components/icons/TrackerMapThemeIcons';
import { TrackerMyLocationIcon } from '@/features/session-tracking/components/icons/TrackerMyLocationIcon';
import { WeatherConditionIcon } from '@/features/session-tracking/components/icons/WeatherConditionIcon';
import {
  formatElapsed,
  formatCheckpointDue,
  formatCountdown,
} from '@/features/session-tracking/mocks/session';
import type { PhotoCheckpointSubmission } from '@/features/session-tracking/liveSessionStore';
import { finalizeAndLeaveSession } from '@/features/session-tracking/finalizeAndLeaveSession';
import {
  ensureLocationWatching,
  ensureLiveSessionTicking,
  getCheckpointProgress,
  requestLiveSessionMapRecenter,
  setLiveSessionMapFollow,
  setLiveSessionMapLayer,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import { status as statusColors, textStyles } from '@/constants/tokens';
import {
  toggleManualMapTheme,
  useEffectiveMapTheme,
} from '@/features/session-tracking/mapThemeStore';
import { useLiveWeather } from '@/features/session-tracking/hooks/useLiveWeather';
import { useLiveSessionMapReveal } from '@/features/session-tracking/hooks/useLiveSessionMapReveal';
import { radius } from '@/features/session-tracking/tokens';
import {
  getTrackerChromeColors,
  type TrackerChromeColors,
} from '@/features/session-tracking/utils/trackerChromeTheme';
import {
  countSubmittedCheckpointPhotos,
  formatPhotoTimeLabel,
  formatSessionDateLabel,
  formatSubmittedCheckpointCount,
  shouldShowCheckpointSubmissionCount,
} from '@/features/session-tracking/utils/sessionFormat';
import {
  TIMER_CARD_STROKE_WIDTH,
  buildTimerCardNotchPath,
} from '@/utils/timerCardNotchPath';

const AnimatedTimerPath = Animated.createAnimatedComponent(Path);

const TIMER_BORDER_PULSE_MS = 2400;
const CHECKPOINT_THUMB_SIZE = 44;
const CHECKPOINT_THUMB_OVERLAP = 16;

// Navbar row geometry (back button, centered location pill, compass size).
const NAVBAR_BACK_BTN_SIZE = 44;
const NAVBAR_LOCATION_PILL_WIDTH = 188;
const NAVBAR_COMPASS_SIZE = 48;

type CheckpointViewerPhoto = {
  key: string;
  uri: string;
  label: string;
  capturedAt: number;
};

function buildCheckpointViewerPhotos(
  checkpoints: PhotoCheckpointSubmission[],
): CheckpointViewerPhoto[] {
  const photos: CheckpointViewerPhoto[] = [];
  for (const checkpoint of checkpoints) {
    if (checkpoint.selfieUri) {
      photos.push({
        key: `${checkpoint.id}-selfie`,
        uri: checkpoint.selfieUri,
        label: 'Selfie',
        capturedAt: checkpoint.capturedAt,
      });
    }
    if (checkpoint.progressUri) {
      photos.push({
        key: `${checkpoint.id}-progress`,
        uri: checkpoint.progressUri,
        label: 'Progress',
        capturedAt: checkpoint.capturedAt,
      });
    }
  }
  return photos;
}

function formatDistanceMiles(miles: number): string {
  if (!Number.isFinite(miles) || miles <= 0) {
    return '0.0';
  }
  // One decimal rounds short walks to "0.0" (e.g. 0.04 mi). Show hundredths
  // until the trail is long enough for tenths to be meaningful.
  if (miles < 0.1) {
    return miles.toFixed(2);
  }
  return miles.toFixed(1);
}

function PulsingTimerCard({
  children,
  chrome,
  styles,
}: {
  children: React.ReactNode;
  chrome: TrackerChromeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const borderOpacity = useSharedValue(1);

  useEffect(() => {
    borderOpacity.value = withRepeat(
      withTiming(0.4, {
        duration: TIMER_BORDER_PULSE_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [borderOpacity]);

  const outlinePath = useMemo(
    () => buildTimerCardNotchPath({ ...cardSize, notchWidth: 0 }),
    [cardSize],
  );

  const outlineProps = useAnimatedProps(() => ({
    stroke: `rgba(194, 216, 50, ${borderOpacity.value})`,
  }));

  return (
    <View style={styles.timerCardWrap}>
      {outlinePath ? (
        <Svg
          pointerEvents="none"
          style={styles.timerCardOutline}
          width={cardSize.width}
          height={cardSize.height}
        >
          <AnimatedTimerPath
            d={outlinePath}
            fill={chrome.surface}
            strokeWidth={TIMER_CARD_STROKE_WIDTH}
            animatedProps={outlineProps}
          />
        </Svg>
      ) : null}
      <View
        style={[
          styles.timerCard,
          { backgroundColor: outlinePath ? 'transparent' : chrome.surface },
        ]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCardSize((current) =>
            current.width === width && current.height === height
              ? current
              : { width, height },
          );
        }}
      >
        {children}
      </View>
    </View>
  );
}

function CardExpandChevron({
  expanded,
  color,
  styles,
  style,
  glyphWidth = 8,
  glyphHeight = 13,
  inverted = false,
}: {
  expanded: boolean;
  color: string;
  styles: ReturnType<typeof createStyles>;
  style?: StyleProp<ViewStyle>;
  glyphWidth?: number;
  glyphHeight?: number;
  /** Timer notch: collapsed points up, expanded points down. */
  inverted?: boolean;
}) {
  const chevronStyle = useChevronRotation(expanded, inverted);

  return (
    <Animated.View style={[styles.cardChevron, style, chevronStyle]} pointerEvents="none">
      <View style={styles.cardChevronGlyph}>
        <SessionSetupBackChevronIcon color={color} width={glyphWidth} height={glyphHeight} />
      </View>
    </Animated.View>
  );
}

function TrackerBackButton({
  onPress,
  chrome,
  styles,
}: {
  onPress: () => void;
  chrome: TrackerChromeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <AnimatedPressable
      style={[
        styles.backBtn,
        {
          borderColor: chrome.borderOutline,
          backgroundColor: chrome.surface,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Minimize tracker"
    >
      <View style={[styles.backBtnIconWrap, { transform: [{ rotate: '-90deg' }] }]} pointerEvents="none">
        <SessionSetupBackChevronIcon color={chrome.textTertiary} width={8.485} height={14.142} />
      </View>
    </AnimatedPressable>
  );
}

function TrackerCompassControl({
  chrome,
  styles,
}: {
  chrome: TrackerChromeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const { currentHeading } = useLiveSession();

  return (
    <View style={styles.navbarCompassWrap}>
      <Compass
        size={NAVBAR_COMPASS_SIZE}
        borderColor={chrome.borderOutline}
        backgroundColor={chrome.surface}
        mutedColor={chrome.textTertiary}
        headingDegrees={currentHeading}
      />
    </View>
  );
}

function MapToolButton({
  children,
  onPress,
  accessibilityLabel,
  chrome,
  styles,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  chrome: TrackerChromeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <AnimatedPressable
      style={[
        styles.mapToolBtn,
        {
          borderColor: chrome.borderStrong,
          backgroundColor: chrome.surfaceMuted,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </AnimatedPressable>
  );
}

/** PRD §6.11 · Figma `session_setup_guide` live tracker (`251:439`). */
export function LiveSessionScreen() {
  const router = useRouter();
  const {
    elapsedSeconds,
    checkpointSecondsRemaining,
    checkpointDueOrGrace,
    checkpointOverdueSeconds,
    distanceMiles,
    submittedCheckpoints,
    mapLayer,
    mapFollowEnabled,
    checkpointWindowStartedAt,
    sessionSyncWarning,
    photosEnabled,
  } = useLiveSession();
  const [mapLayerPickerVisible, setMapLayerPickerVisible] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [checkpointExpanded, setCheckpointExpanded] = useState(false);
  const mapTheme = useEffectiveMapTheme();
  const chrome = useMemo(() => getTrackerChromeColors(mapTheme), [mapTheme]);
  const s = useMemo(() => createStyles(chrome), [chrome]);
  const { mapRevealStyle, chromeStyle } = useLiveSessionMapReveal();
  const dismissing = useRef(false);

  const handleDismiss = useCallback(() => {
    if (dismissing.current) return;
    dismissing.current = true;
    // Navigate immediately — a collapse wipe slides the map off and flashes a
    // blank tint before Home mounts. Session stays active; tab screens show the pill.
    try {
      router.dismissTo('/');
    } catch {
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleDismiss();
      return true;
    });
    return () => sub.remove();
  }, [handleDismiss]);

  const handleMyLocationPress = useCallback(() => {
    if (mapFollowEnabled) {
      setLiveSessionMapFollow(false);
    } else {
      setLiveSessionMapFollow(true);
      requestLiveSessionMapRecenter();
    }
  }, [mapFollowEnabled]);
  const submittedCheckpointCount = submittedCheckpoints.length;
  const submittedPhotoCount = countSubmittedCheckpointPhotos(submittedCheckpoints);
  const showSubmissionCount = shouldShowCheckpointSubmissionCount(submittedCheckpoints);
  const hasSubmittedCheckpoints = submittedCheckpointCount > 0;
  const submittedCheckpointLabel = formatSubmittedCheckpointCount(submittedPhotoCount);
  const viewerPhotos = useMemo(
    () => buildCheckpointViewerPhotos(submittedCheckpoints),
    [submittedCheckpoints],
  );
  const selectedPhoto =
    selectedPhotoIndex !== null ? viewerPhotos[selectedPhotoIndex] ?? null : null;
  const {
    placeLabel,
    temperatureLabel,
    weatherIcon,
    isLoading: isWeatherLoading,
  } = useLiveWeather();
  const openCheckpointPhoto = (photoKey: string) => {
    const startIndex = viewerPhotos.findIndex((photo) => photo.key === photoKey);
    if (startIndex >= 0) {
      setSelectedPhotoIndex(startIndex);
    }
  };

  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const checkpointProgress = getCheckpointProgress(checkpointSecondsRemaining);
  // Card flips to an urgent/red state showing time elapsed (counting up) the
  // instant a checkpoint is due — not gated behind dismissing the prompt.
  const checkpointIgnored = checkpointDueOrGrace;
  const showTakePhotoCta = photosEnabled && checkpointDueOrGrace;

  const handleEndSession = () => {
    if (savingSession) {
      return;
    }
    if (!photosEnabled) {
      setSavingSession(true);
      void (async () => {
        try {
          await finalizeAndLeaveSession(router);
        } catch {
          setSavingSession(false);
        }
      })();
      return;
    }
    router.push('/photo-capture?mode=session-end' as Href);
  };
  const nextPhotoDueLabel = checkpointDueOrGrace ? 'Time elapsed:' : 'Next photo due in:';
  const nextPhotoDueTime = checkpointDueOrGrace
    ? formatCountdown(checkpointOverdueSeconds)
    : formatCheckpointDue(checkpointSecondsRemaining);
  const nextPhotoDueColor = checkpointIgnored ? statusColors.declined.text : chrome.textPrimary;
  const nextPhotoDueTimeColor = checkpointIgnored ? statusColors.declined.text : chrome.primary;

  useEffect(() => {
    void ensureLocationWatching();
    ensureLiveSessionTicking();
  }, []);

  if (!fontsLoaded) {
    return <View style={[s.root, { backgroundColor: chrome.mapTint }]} />;
  }

  return (
    <View style={[s.root, { backgroundColor: chrome.mapTint }]}>
      <Animated.View
        style={[s.mapLayer, { backgroundColor: chrome.mapTint }, mapRevealStyle]}
      >
        <LiveSessionMap style={s.map} />
      </Animated.View>

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <Animated.View style={[s.main, chromeStyle]} pointerEvents="box-none">
          {sessionSyncWarning ? (
            <View
              style={[
                s.syncWarningBanner,
                {
                  backgroundColor: chrome.surface,
                  borderColor: chrome.borderStrong,
                },
              ]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <Text style={[s.syncWarningText, { color: chrome.textPrimary }]}>
                {sessionSyncWarning}
              </Text>
            </View>
          ) : null}
          <View style={s.navbar}>
            <TrackerBackButton
              onPress={handleDismiss}
              chrome={chrome}
              styles={s}
            />

            <View style={s.navbarPillCenter} pointerEvents="box-none">
              <View
                style={[
                  s.locationPill,
                  {
                    borderColor: chrome.borderOutline,
                    backgroundColor: chrome.surface,
                  },
                ]}
              >
                <View style={s.locationRow}>
                  <LocationPinIcon color={chrome.textTertiary} size={18} strokeWidth={1.5} />
                  <Text
                    style={[s.locationText, s.locationLabel, { color: chrome.textTertiary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {isWeatherLoading && !placeLabel ? '…' : (placeLabel ?? 'Location off')}
                  </Text>
                </View>
                <View style={[s.pillDivider, { backgroundColor: chrome.borderOutline }]} />
                <View style={s.temperatureRow}>
                  <WeatherConditionIcon
                    condition={weatherIcon}
                    color={chrome.textTertiary}
                    size={18}
                  />
                  <Text style={[s.locationText, { color: chrome.textTertiary }]}>
                    {isWeatherLoading ? '…' : temperatureLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right-aligned to main's content edge — same boundary the map
                layers icon (mapTools, alignSelf:'flex-end') hugs below. */}
            <TrackerCompassControl chrome={chrome} styles={s} />
          </View>

          <View style={s.inProgressSection} pointerEvents="box-none">
            <View style={s.timerBlock} pointerEvents="box-none">
              <View style={s.timerPressable}>
                <PulsingTimerCard chrome={chrome} styles={s}>
                  <View style={s.cardHeaderRow}>
                    <Text
                      style={[s.timerText, { color: chrome.textPrimary }]}
                      accessibilityLabel={`Elapsed time ${formatElapsed(elapsedSeconds)}`}
                    >
                      {formatElapsed(elapsedSeconds)}
                    </Text>
                  </View>
                  <View style={s.distanceRow}>
                    <Text style={[s.distanceLabel, { color: chrome.textTertiary }]}>Distance:</Text>
                    <Text style={[s.distanceValue, { color: chrome.textTertiary }]}>
                      {formatDistanceMiles(distanceMiles)} miles
                    </Text>
                  </View>
                </PulsingTimerCard>
              </View>
            </View>

            <View style={s.bottomSection} pointerEvents="box-none">
              <View style={s.checkpointSection} pointerEvents="box-none">
                <View style={s.mapTools}>
                  <View style={s.mapLayerControl}>
                    <MapToolButton
                      accessibilityLabel="Map layers"
                      onPress={() => setMapLayerPickerVisible((visible) => !visible)}
                      chrome={chrome}
                      styles={s}
                    >
                      <TrackerLayersIcon color={chrome.textTertiary} />
                    </MapToolButton>
                  </View>
                  <MapToolButton
                    accessibilityLabel={
                      mapFollowEnabled
                        ? 'Stop following my location'
                        : 'Center on my location, face my heading, and follow'
                    }
                    onPress={handleMyLocationPress}
                    chrome={chrome}
                    styles={s}
                  >
                    <TrackerMyLocationIcon
                      color={mapFollowEnabled ? chrome.primary : chrome.textTertiary}
                    />
                  </MapToolButton>
                  <MapToolButton
                    accessibilityLabel={mapTheme === 'dark' ? 'Switch to light map' : 'Switch to dark map'}
                    onPress={toggleManualMapTheme}
                    chrome={chrome}
                    styles={s}
                  >
                    {mapTheme === 'dark'
                      ? <TrackerMapDarkIcon color={chrome.textTertiary} />
                      : <TrackerMapLightIcon color={chrome.textTertiary} />}
                  </MapToolButton>
                </View>

                {photosEnabled ? (
                <AnimatedPressable
                  onPress={() => setCheckpointExpanded((expanded) => !expanded)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: checkpointExpanded }}
                  accessibilityLabel={
                    checkpointExpanded
                      ? 'Collapse checkpoint photos'
                      : 'Expand checkpoint photos'
                  }
                  style={[
                    s.checkpointCard,
                    checkpointIgnored
                      ? {
                          backgroundColor: statusColors.declined.bg,
                          borderColor: statusColors.declined.border,
                        }
                      : {
                          backgroundColor: chrome.surface,
                          borderColor: chrome.borderOutline,
                        },
                  ]}
                >
                  <View style={s.checkpointHeader}>
                    <Text
                      style={[
                        s.checkpointTitle,
                        { color: checkpointIgnored ? statusColors.declined.text : chrome.textPrimary },
                      ]}
                    >
                      Checkpoint photos
                    </Text>
                    <View style={s.checkpointHeaderTrailing}>
                      {showSubmissionCount ? (
                        <Text style={[s.checkpointSubmittedCount, { color: chrome.primary }]}>
                          {submittedCheckpointLabel}
                        </Text>
                      ) : null}
                      <CardExpandChevron
                        expanded={checkpointExpanded}
                        color={checkpointIgnored ? statusColors.declined.text : chrome.textTertiary}
                        styles={s}
                      />
                    </View>
                  </View>
                  {checkpointExpanded ? (
                    <>
                      {hasSubmittedCheckpoints ? (
                        <View
                          style={s.checkpointThumbs}
                          accessibilityLabel={`${submittedPhotoCount} checkpoint photos submitted`}
                        >
                          {submittedCheckpoints.flatMap((checkpoint, index) => {
                            const thumbs: { key: string; uri: string; label: string }[] = [];
                            if (checkpoint.selfieUri) {
                              thumbs.push({
                                key: `${checkpoint.id}-selfie`,
                                uri: checkpoint.selfieUri,
                                label: `Checkpoint ${index + 1} selfie`,
                              });
                            }
                            if (checkpoint.progressUri) {
                              thumbs.push({
                                key: `${checkpoint.id}-progress`,
                                uri: checkpoint.progressUri,
                                label: `Checkpoint ${index + 1} rear photo`,
                              });
                            }
                            return thumbs.map((thumb, thumbIndex) => (
                              <AnimatedPressable
                                key={thumb.key}
                                onPress={() => openCheckpointPhoto(thumb.key)}
                                accessibilityRole="imagebutton"
                                accessibilityLabel={`View ${thumb.label}`}
                                style={[
                                  index > 0 || thumbIndex > 0
                                    ? { marginLeft: -CHECKPOINT_THUMB_OVERLAP }
                                    : null,
                                  { zIndex: index * 2 + thumbIndex + 1 },
                                ]}
                              >
                                <ExpoImage
                                  source={{ uri: thumb.uri }}
                                  style={[
                                    s.checkpointThumb,
                                    { backgroundColor: chrome.borderOutline },
                                  ]}
                                  contentFit="cover"
                                  cachePolicy="memory-disk"
                                  transition={0}
                                />
                              </AnimatedPressable>
                            ));
                          })}
                        </View>
                      ) : null}
                      <View style={s.nextPhotoBlock}>
                        <View style={s.nextPhotoRow}>
                          <Text style={[s.nextPhotoLabel, { color: nextPhotoDueColor }]}>
                            {nextPhotoDueLabel}
                          </Text>
                          <Text style={[s.nextPhotoTime, { color: nextPhotoDueTimeColor }]}>
                            {nextPhotoDueTime}
                          </Text>
                        </View>
                        <View
                          style={[
                            s.progressTrack,
                            { backgroundColor: chrome.borderOutline },
                          ]}
                        >
                          <View
                            style={[
                              s.progressFill,
                              {
                                width: `${checkpointProgress * 100}%`,
                                backgroundColor: checkpointIgnored
                                  ? statusColors.declined.border
                                  : chrome.statusPending,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </>
                  ) : (
                    <View
                      style={s.nextPhotoBlockCompact}
                      accessibilityRole="text"
                      accessibilityLabel={`${nextPhotoDueLabel} ${nextPhotoDueTime}`}
                    >
                      <View style={s.nextPhotoRowCompact}>
                        <Text style={[s.nextPhotoLabelCompact, { color: nextPhotoDueColor }]}>
                          {nextPhotoDueLabel}
                        </Text>
                        <Text style={[s.nextPhotoTimeCompact, { color: nextPhotoDueTimeColor }]}>
                          {nextPhotoDueTime}
                        </Text>
                      </View>
                      <View
                        style={[
                          s.progressTrack,
                          { backgroundColor: chrome.borderOutline },
                        ]}
                      >
                        <View
                          style={[
                            s.progressFill,
                            {
                              width: `${checkpointProgress * 100}%`,
                              backgroundColor: checkpointIgnored
                                ? statusColors.declined.border
                                : chrome.statusPending,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </AnimatedPressable>
                ) : null}
              </View>

              <View style={s.actions}>
                {showTakePhotoCta ? (
                  <TrackerActionButton
                    label="Take Photo"
                    variant="primary"
                    chrome={chrome}
                    onPress={() => router.push('/photo-capture' as Href)}
                    icon={
                      <TrackerSubmitPhotoIcon
                        color={chrome.textOnPrimary}
                        size={24}
                      />
                    }
                  />
                ) : null}
                <TrackerActionButton
                  label="End Session"
                  variant="secondary"
                  chrome={chrome}
                  onPress={handleEndSession}
                  icon={<TrackerEndSessionIcon color={chrome.textTertiary} size={24} />}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>

      <MapTypesSheet
        visible={mapLayerPickerVisible}
        selectedType={mapLayer}
        onSelect={setLiveSessionMapLayer}
        onClose={() => setMapLayerPickerVisible(false)}
        mapTheme={mapTheme}
      />

      <PhotoEnlargeModal
        visible={selectedPhotoIndex !== null && selectedPhoto !== null}
        uri={selectedPhoto?.uri ?? null}
        caption={selectedPhoto?.label}
        dateLabel={
          selectedPhoto ? formatSessionDateLabel(selectedPhoto.capturedAt) : undefined
        }
        timeLabel={
          selectedPhoto ? formatPhotoTimeLabel(selectedPhoto.capturedAt) : undefined
        }
        counterLabel={
          selectedPhotoIndex !== null && viewerPhotos.length > 0
            ? `${selectedPhotoIndex + 1}/${viewerPhotos.length}`
            : undefined
        }
        onClose={() => setSelectedPhotoIndex(null)}
        hasPrevious={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
        hasNext={
          selectedPhotoIndex !== null && selectedPhotoIndex < viewerPhotos.length - 1
        }
        onPrevious={() =>
          setSelectedPhotoIndex((index) =>
            index !== null && index > 0 ? index - 1 : index,
          )
        }
        onNext={() =>
          setSelectedPhotoIndex((index) =>
            index !== null && index < viewerPhotos.length - 1 ? index + 1 : index,
          )
        }
      />
      <BrandLoadingView visible={savingSession} />
    </View>
  );
}

function createStyles(_chrome: TrackerChromeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      overflow: 'hidden',
    },
    mapLayer: {
      ...StyleSheet.absoluteFill,
    },
    map: {
      flex: 1,
      borderRadius: 0,
    },
    overlay: {
      flex: 1,
    },
    main: {
      flex: 1,
      paddingHorizontal: 16,
      gap: 10,
    },
    syncWarningBanner: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    syncWarningText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      lineHeight: 16,
    },
    navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      position: 'relative',
    },
    navbarPillCenter: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 0,
    },
    navbarCompassWrap: {
      zIndex: 1,
    },
    backBtn: {
      width: NAVBAR_BACK_BTN_SIZE,
      height: NAVBAR_BACK_BTN_SIZE,
      borderRadius: radius.full,
      borderWidth: 1,
      overflow: 'hidden',
      zIndex: 1,
    },
    backBtnIconWrap: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationPill: {
      width: NAVBAR_LOCATION_PILL_WIDTH,
      height: 44,
      borderRadius: radius.full,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      overflow: 'hidden',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 1,
      minWidth: 0,
    },
    temperatureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
    },
    locationText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      lineHeight: 16,
    },
    locationLabel: {
      flexShrink: 1,
    },
    pillDivider: {
      width: 1,
      height: 13,
      marginHorizontal: 10,
      flexShrink: 0,
    },
    inProgressSection: {
      flex: 1,
      gap: 16,
    },
    timerBlock: {
      alignItems: 'center',
      gap: 10,
    },
    timerPressable: {
      width: '100%',
    },
    timerCardWrap: {
      width: '100%',
      position: 'relative',
    },
    timerCardOutline: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    timerCard: {
      // 100% of `main`'s content width — same right boundary the compass
      // (space-between in navbar) and mapTools (alignSelf:'flex-end') hug.
      width: '100%',
      position: 'relative',
      borderRadius: radius.md,
      paddingHorizontal: 24,
      paddingVertical: 14,
      alignItems: 'center',
      gap: 4,
    },
    timerText: {
      ...textStyles.dataTimer,
      letterSpacing: 4,
      textAlign: 'center',
      flex: 1,
    },
    distanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    distanceLabel: {
      fontFamily: 'IBMPlexSans_500Medium',
      fontSize: 16,
    },
    distanceValue: {
      fontFamily: 'IBMPlexSans_500Medium',
      fontSize: 16,
    },
    bottomSection: {
      flex: 1,
      justifyContent: 'flex-end',
      gap: 22,
      paddingBottom: 8,
    },
    checkpointSection: {
      gap: 25,
    },
    mapTools: {
      alignSelf: 'flex-end',
      gap: 10,
      width: 44,
    },
    mapLayerControl: {
      position: 'relative',
      width: 44,
    },
    mapToolBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkpointCard: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 23,
      paddingVertical: 14,
      gap: 12,
      minHeight: 0,
    },
    checkpointHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    checkpointHeaderTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 0,
    },
    cardHeaderRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardChevron: {
      width: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardChevronGlyph: {
      transform: [{ rotate: '90deg' }],
    },
    checkpointTitle: {
      fontFamily: 'NotoSans_400Regular',
      fontSize: 12,
      flexShrink: 1,
    },
    checkpointSubmittedCount: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      textAlign: 'right',
    },
    checkpointThumbs: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 2,
    },
    checkpointThumb: {
      width: CHECKPOINT_THUMB_SIZE,
      height: CHECKPOINT_THUMB_SIZE,
      borderRadius: radius.sm,
    },
    nextPhotoBlock: {
      gap: 10,
    },
    nextPhotoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    nextPhotoBlockCompact: {
      gap: 6,
    },
    nextPhotoRowCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    nextPhotoLabel: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 16,
    },
    nextPhotoTime: {
      fontFamily: 'IBMPlexSans_600SemiBold',
      fontSize: 16,
    },
    nextPhotoLabelCompact: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 14,
      lineHeight: 18,
    },
    nextPhotoTimeCompact: {
      fontFamily: 'IBMPlexSans_600SemiBold',
      fontSize: 14,
      lineHeight: 18,
    },
    progressTrack: {
      height: 4,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: 4,
      borderRadius: radius.full,
    },
    actions: {
      gap: 10,
    },
  });
}
