// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.9 — Session Setup

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Screen } from '../../App';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { Input } from '../../components/ui/Input';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

interface Props {
  go: (screen: Screen) => void;
}

export function SessionSetup({ go }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courtOrdered, setCourtOrdered] = useState<'yes' | 'no' | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const canStart = courtOrdered !== null && title.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        variant="detail"
        title="Session Setup"
        onBack={() => go('home')}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSigning}
      >
        {/* Headline */}
        <Text
          style={styles.headline}
          accessibilityRole="header"
        >
          Start tracking
        </Text>

        {/* Subhead */}
        <Text style={styles.subhead}>
          Fill in the details below to begin your session.
        </Text>

        <View style={styles.gap24} />

        {/* Session Title */}
        <Input
          label="Session Title"
          required
          placeholder="River Trail Cleanup"
          value={title}
          onChangeText={setTitle}
          accessibilityLabel="Session Title, required"
          returnKeyType="next"
        />

        <View style={styles.gap16} />

        {/* Date (read-only) */}
        <Input
          label="Date"
          value="Jun 5, 2026"
          editable={false}
          accessibilityLabel="Date, Jun 5, 2026"
        />

        <View style={styles.gap16} />

        {/* Court Ordered Status */}
        <Text style={styles.fieldLabel}>Court Ordered Status</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              courtOrdered === 'yes' && styles.toggleBtnActive,
            ]}
            onPress={() => setCourtOrdered('yes')}
            accessibilityRole="button"
            accessibilityLabel="Court ordered: Yes"
            accessibilityState={{ selected: courtOrdered === 'yes' }}
          >
            <Text
              style={[
                styles.toggleLabel,
                courtOrdered === 'yes' && styles.toggleLabelActive,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              courtOrdered === 'no' && styles.toggleBtnActive,
            ]}
            onPress={() => setCourtOrdered('no')}
            accessibilityRole="button"
            accessibilityLabel="Court ordered: No"
            accessibilityState={{ selected: courtOrdered === 'no' }}
          >
            <Text
              style={[
                styles.toggleLabel,
                courtOrdered === 'no' && styles.toggleLabelActive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gap16} />

        {/* Digital Signature */}
        <Text style={styles.fieldLabel}>Digital Signature</Text>
        <View
          style={styles.signatureArea}
          accessibilityRole="none"
          accessibilityLabel="Signature area, tap to sign"
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => setIsSigning(true)}
          onResponderRelease={() => setIsSigning(false)}
          onResponderTerminate={() => setIsSigning(false)}
        >
          <Text style={styles.signatureHint}>Sign here</Text>
        </View>

        <View style={styles.gap16} />

        {/* Description */}
        <Input
          label="Description"
          placeholder="Describe what you are doing..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          accessibilityLabel="Session description"
          style={styles.descriptionInput}
        />

        <View style={styles.gap32} />

        {/* CTA */}
        <PrimaryButton
          label="Start Session"
          onPress={() => go('permissions')}
          disabled={!canStart}
          accessibilityLabel="Start Session"
        />

        <View style={styles.gap24} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  } as ViewStyle,
  headline: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.black,
    marginBottom: 8,
  },
  subhead: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  },
  gap24: {
    height: 24,
  } as ViewStyle,
  gap16: {
    height: 16,
  } as ViewStyle,
  gap32: {
    height: 32,
  } as ViewStyle,
  fieldLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  } as ViewStyle,
  toggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  } as ViewStyle,
  toggleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  } as ViewStyle,
  toggleLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
  },
  toggleLabelActive: {
    color: Colors.white,
  } as TextStyle,
  signatureArea: {
    height: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  signatureHint: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
  },
  descriptionInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  } as TextStyle,
});
