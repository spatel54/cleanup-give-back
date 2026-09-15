// PROTOTYPE — NOT FINAL. All data mocked. No business logic.

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LogoImages } from '../../constants/Assets';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

export function Welcome({ go }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-background relative overflow-hidden">
      {/* Background decorations matching Stitch layout */}
      <View className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary-fixed opacity-20 blur-3xl pointer-events-none" />
      <View className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-secondary-fixed opacity-30 blur-3xl pointer-events-none" />

      <View className="flex-1 w-full max-w-md px-6 py-12 flex-col items-center justify-center relative z-10 self-center">
        {/* ── Logo ─────────────────────────────────────────────────── */}
        <View className="w-32 h-32 bg-surface-container rounded-3xl flex items-center justify-center border border-outline-variant shadow-sm shrink-0 overflow-hidden mb-8">
          <Image
            source={LogoImages.main}
            className="w-full h-full object-cover p-4"
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Clean-Up Give Back logo"
          />
        </View>

        {/* ── Wordmark + tagline ────────────────────────────────────── */}
        <View className="items-center mb-8 gap-4">
          <Text className="font-headline text-[34px] leading-[40px] font-bold text-on-background tracking-tight text-center" accessibilityRole="header">
            Clean-Up Give Back
          </Text>
          <Text className="font-body text-[18px] leading-[28px] text-on-surface-variant font-normal text-center px-4">
            Track your service. Prove your impact.
          </Text>
        </View>

        {/* ── Auth buttons ─────────────────────────────────────────── */}
        <View className="w-full mt-8 flex-grow flex flex-col justify-end pb-8 gap-4">
          <TouchableOpacity
            className="w-full h-14 bg-surface-container-lowest text-on-surface border border-outline-variant rounded-lg flex flex-row items-center justify-center hover:bg-surface-container-low transition-colors active:scale-[0.98]"
            onPress={() => go('create-account')}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            activeOpacity={0.75}
          >
            <Text className="font-label text-[16px] font-semibold text-on-surface">Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full h-14 bg-surface-container-lowest text-on-surface border border-outline-variant rounded-lg flex flex-row items-center justify-center hover:bg-surface-container-low transition-colors active:scale-[0.98]"
            onPress={() => go('create-account')}
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
            activeOpacity={0.75}
          >
            <Text className="font-label text-[16px] font-semibold text-on-surface">Continue with Apple</Text>
          </TouchableOpacity>

          <PrimaryButton
            label="Sign up with Email"
            onPress={() => go('create-account')}
            accessibilityLabel="Sign up with Email"
            style={{ marginTop: 8 }}
          />

          {/* ── Log in link ───────────────────────────────────────────── */}
          <View className="mt-4 pt-6 border-t border-outline-variant/30 w-full flex-row justify-center items-center">
            <Text className="font-body text-sm text-on-surface-variant">Already have an account? </Text>
            <TouchableOpacity
              onPress={() => go('home')}
              accessibilityRole="button"
              accessibilityLabel="Log in to your existing account"
              activeOpacity={0.7}
            >
              <Text className="font-label font-semibold text-primary ml-1">Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
