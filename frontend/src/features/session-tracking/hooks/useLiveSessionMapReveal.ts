import { useCallback, useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { durations, easing } from '@/motion';

import { consumeLiveSessionExpandFromHome } from '../liveSessionExpandIntent';

/** Map layer wipes up from the bottom nav; chrome fades in after expand-from-home. */
export function useLiveSessionMapReveal() {
  const fromHome = useMemo(() => consumeLiveSessionExpandFromHome(), []);
  const reducedMotion = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const reveal = useSharedValue(!fromHome || reducedMotion ? 1 : 0);
  const chromeOpacity = useSharedValue(!fromHome || reducedMotion ? 1 : 0);

  useEffect(() => {
    if (!fromHome || reducedMotion) {
      return;
    }

    reveal.value = withTiming(1, {
      duration: durations.mapRevealWipe,
      easing: easing.drawer,
    });
    chromeOpacity.value = withDelay(
      140,
      withTiming(1, { duration: durations.screenEnter, easing: easing.easeOut }),
    );
  }, [chromeOpacity, fromHome, reducedMotion, reveal]);

  /** Reverse of the expand: chrome fades out, map slides back down, then calls onDone. */
  const collapse = useCallback(
    (onDone: () => void) => {
      if (reducedMotion) {
        onDone();
        return;
      }

      let settled = false;
      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        onDone();
      };

      chromeOpacity.value = withTiming(0, {
        duration: durations.modalExit,
        easing: easing.easeOut,
      });
      reveal.value = withTiming(
        0,
        { duration: durations.sheetDismiss, easing: easing.drawer },
        () => {
          // Always navigate — interrupted animations still must minimize to Home.
          runOnJS(finish)();
        },
      );
    },
    [chromeOpacity, reducedMotion, reveal],
  );

  const mapRevealStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - reveal.value) * windowHeight }],
  }));

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: chromeOpacity.value,
  }));

  return { mapRevealStyle, chromeStyle, fromHome, collapse };
}
