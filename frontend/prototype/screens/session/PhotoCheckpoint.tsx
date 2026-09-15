// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.12 — Photo Checkpoint (bottom-sheet modal)

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PanResponder,
} from 'react-native';
import { Screen } from '../../App';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

interface Props {
  go: (screen: Screen) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function PhotoCheckpoint({ go }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => go('live-session'));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.1);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 1) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  return (
    <View
      style={styles.root}
      accessibilityRole="none"
    >
      {/* Dimmed overlay */}
      <View style={styles.overlay} />

      {/* Bottom sheet card */}
      <Animated.View
        style={[styles.card, { transform: [{ translateY }] }]}
        accessibilityRole="none"
        accessibilityViewIsModal
        accessibilityLabel="Photo checkpoint required dialog"
        {...panResponder.panHandlers}
      >
        {/* Handle pill */}
        <View style={styles.handle} />

        <Text
          style={styles.headline}
          accessibilityRole="header"
        >
          Photo required
        </Text>

        <View style={styles.gap8} />

        <Text style={styles.body}>
          Submit a photo to verify your cleanup progress.
        </Text>

        <View style={styles.gap8} />

        <Text style={styles.caption}>
          Required every 30 minutes during active tracking.
        </Text>

        <View style={styles.gap32} />

        <PrimaryButton
          label="Take Photo"
          onPress={() => go('live-session')}
          accessibilityLabel="Take a photo checkpoint"
        />

        <View style={styles.gap24} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.overlay,
  } as ViewStyle,
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: 28,
    paddingTop: 12,
  } as ViewStyle,
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  } as ViewStyle,
  gap8: {
    height: 8,
  } as ViewStyle,
  gap32: {
    height: 32,
  } as ViewStyle,
  gap24: {
    height: 24,
  } as ViewStyle,
  headline: {
    ...(Typography.headlineSmall as TextStyle),
    color: Colors.black,
  },
  body: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textPrimary,
  },
  caption: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
  },
});
