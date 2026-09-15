import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamilies, textStyles } from '@/constants/tokens';

const GARBAGIO_VIDEO = require('@/assets/animations/garbagio.mp4');
const GARBAGIO_POSTER = require('@/assets/animations/garbagio-poster.jpg');
const GARBAGIO_END = require('@/assets/animations/garbagio-end.jpg');

/** Clip length — used only as a stuck-player fallback, not a forced hold. */
export const BRAND_LOADING_MIN_MS = 8000;

export const GARBAGIO_SAVING_MESSAGE =
  'Saving your session.\nMeet our mascot, Garbagio, in the meantime!';

/** Pause well before native EOS. Players still rewind to t=0 at true end. */
const STOP_BEFORE_END_S = 2;
const CLIP_DURATION_S = 8;

let garbagioPrefetchStarted = false;
let playthroughWaiters: Array<() => void> = [];
let playthroughComplete = false;

function resetGarbagioPlaythrough() {
  playthroughComplete = false;
  playthroughWaiters = [];
}

function notifyGarbagioPlaythrough() {
  if (playthroughComplete) {
    return;
  }
  playthroughComplete = true;
  const waiters = playthroughWaiters;
  playthroughWaiters = [];
  waiters.forEach((resolve) => resolve());
}

function waitForGarbagioPlaythrough(): Promise<void> {
  if (playthroughComplete) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    playthroughWaiters.push(resolve);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Warm the bundled clip + poster so the overlay paints the first frame immediately. */
export function preloadGarbagio(): void {
  if (garbagioPrefetchStarted || Platform.OS === 'web') {
    return;
  }
  garbagioPrefetchStarted = true;
  try {
    void Asset.fromModule(GARBAGIO_VIDEO).downloadAsync();
    for (const source of [GARBAGIO_POSTER, GARBAGIO_END]) {
      const uri = Asset.fromModule(source).uri;
      if (uri) {
        void Image.prefetch(uri, 'memory-disk').catch(() => undefined);
      }
    }
  } catch {
    // Bundled assets should already be local; ignore prefetch failures.
  }
}

/** Resolves after the first Garbagio playthrough (or timeout if the player stalls). */
export async function waitForBrandLoadingMinimum(
  _startedAtMs?: number,
  timeoutMs = BRAND_LOADING_MIN_MS + 2000,
): Promise<void> {
  await Promise.race([waitForGarbagioPlaythrough(), sleep(timeoutMs)]);
}

type Props = {
  /** True while the overlay should be on screen. */
  visible: boolean;
  /**
   * Keep the player mounted (hidden) so the first frame is decoded before
   * save starts. Use on session-end photo capture.
   */
  warm?: boolean;
  /**
   * When true, replay the clip if it ends before save finishes.
   * When false (save already done), the overlay can dismiss at early-stop.
   */
  loopWhileBusy?: boolean;
  message?: string;
  minDurationMs?: number;
  style?: StyleProp<ViewStyle>;
};

/** Mirrors `loading` — overlay hide is owned by the caller after playthrough. */
export function useBrandLoadingGate(loading: boolean, _minMs = BRAND_LOADING_MIN_MS) {
  return loading;
}

function GarbagioClip({
  playing,
  loopWhileBusy,
}: {
  playing: boolean;
  loopWhileBusy: boolean;
}) {
  const [frozen, setFrozen] = useState(false);
  const loopWhileBusyRef = useRef(loopWhileBusy);
  loopWhileBusyRef.current = loopWhileBusy;
  const stoppedRef = useRef(false);
  const finishRef = useRef<() => void>(() => undefined);

  const player = useVideoPlayer(GARBAGIO_VIDEO, (instance) => {
    instance.loop = false;
    instance.muted = true;
    instance.audioMixingMode = 'mixWithOthers';
    instance.timeUpdateEventInterval = 0.05;
  });

  finishRef.current = () => {
    if (stoppedRef.current) {
      return;
    }
    stoppedRef.current = true;
    player.loop = false;
    player.pause();
    notifyGarbagioPlaythrough();
    if (loopWhileBusyRef.current) {
      stoppedRef.current = false;
      player.replay();
    } else {
      // Unmount VideoView by setting frozen — only when not looping.
      setFrozen(true);
    }
  };

  useEffect(() => {
    const shouldStop = (currentTime: number) => {
      const duration = player.duration > 0 ? player.duration : CLIP_DURATION_S;
      return currentTime >= duration - STOP_BEFORE_END_S;
    };
    const onTick = player.addListener('timeUpdate', ({ currentTime }) => {
      if (shouldStop(currentTime)) {
        finishRef.current();
      }
    });
    const onEnd = player.addListener('playToEnd', () => {
      finishRef.current();
    });
    return () => {
      onTick.remove();
      onEnd.remove();
    };
  }, [player]);

  useEffect(() => {
    if (!playing) {
      player.loop = false;
      player.pause();
      return;
    }
    stoppedRef.current = false;
    setFrozen(false);
    resetGarbagioPlaythrough();
    player.loop = false;
    player.replay();
    const wall = setTimeout(
      () => finishRef.current(),
      (CLIP_DURATION_S - STOP_BEFORE_END_S) * 1000,
    );
    const poll = setInterval(() => {
      if (player.currentTime >= CLIP_DURATION_S - STOP_BEFORE_END_S) {
        finishRef.current();
      }
    }, 50);
    return () => {
      clearTimeout(wall);
      clearInterval(poll);
    };
  }, [playing, player]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {!frozen && (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          pointerEvents="none"
        />
      )}
      {frozen && (
        <Image
          source={GARBAGIO_END}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no"
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

/** Full-screen Garbagio overlay for session finalize only. */
export function BrandLoadingView({
  visible,
  warm = false,
  loopWhileBusy = false,
  message = GARBAGIO_SAVING_MESSAGE,
  style,
}: Props) {
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const show = visible;
  const keepMounted = warm || show;

  useEffect(() => {
    preloadGarbagio();
  }, []);

  useEffect(() => {
    if (show && reducedMotion) {
      notifyGarbagioPlaythrough();
    }
  }, [show, reducedMotion]);

  if (!keepMounted) {
    return null;
  }

  return (
    <View
      style={[s.fullScreen, !show && s.hidden, style]}
      accessible={show}
      accessibilityRole="progressbar"
      accessibilityLabel={message.replace(/\n/g, ' ')}
      pointerEvents={show ? 'auto' : 'none'}
    >
      <View style={s.videoPane}>
        <Image
          source={GARBAGIO_POSTER}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          accessibilityIgnoresInvertColors
        />
        {!reducedMotion ? (
          <GarbagioClip playing={show} loopWhileBusy={loopWhileBusy} />
        ) : null}
        <LinearGradient
          colors={[
            'rgba(0,149,64,0)',
            'rgba(0,149,64,0.12)',
            'rgba(0,149,64,0.55)',
            'rgba(0,149,64,1)',
          ]}
          locations={[0, 0.28, 0.62, 1]}
          style={s.videoBlend}
          pointerEvents="none"
        />
      </View>
      <View style={[s.messagePane, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={s.fullScreenLabel}>{message}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: colors.primary,
  },
  hidden: {
    opacity: 0,
    zIndex: -1,
  },
  videoPane: {
    height: '75%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  videoBlend: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  holdHidden: {
    opacity: 0,
  },
  holdVisible: {
    opacity: 1,
  },
  messagePane: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  fullScreenLabel: {
    ...textStyles.headlinePage,
    textAlign: 'center',
    color: colors.textOnPrimarySoft,
    fontFamily: fontFamilies.sanchezRegular,
  },
});
