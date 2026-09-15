// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.30 — Export Service Record

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Input } from '../../components/ui/Input';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

type Format = 'PDF' | 'CSV';

export function ExportServiceRecord({ go }: Props) {
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [underReview, setUnderReview] = useState(false);
  const [notApproved, setNotApproved] = useState(false);
  const [format, setFormat] = useState<Format>('PDF');
  const [exportSuccess, setExportSuccess] = useState(false);

  function handleExport() {
    setExportSuccess(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Export Record"
        onBack={() => go('account')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={styles.title}
          accessibilityRole="header"
        >
          Export Service Record
        </Text>
        <Text style={styles.subtitle}>Export verified service hours.</Text>

        {/* ── Date Range ── */}
        <Text style={styles.fieldLabel}>Date Range</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateInputFlex}>
            <Input
              label="Start Date"
              placeholder="Jan 1, 2026"
              value=""
              onChangeText={() => {}}
              accessibilityLabel="Start date for export"
            />
          </View>
          <View style={styles.dateInputFlex}>
            <Input
              label="End Date"
              placeholder="Jun 5, 2026"
              value=""
              onChangeText={() => {}}
              accessibilityLabel="End date for export"
            />
          </View>
        </View>

        {/* ── Include ── */}
        <Text style={styles.fieldLabel}>Include</Text>
        <View style={styles.checkboxGroup}>
          <CheckboxRow
            label="Approved sessions"
            checked={approvedOnly}
            onPress={() => setApprovedOnly((v) => !v)}
          />
          <CheckboxRow
            label="Under review sessions"
            checked={underReview}
            onPress={() => setUnderReview((v) => !v)}
          />
          <CheckboxRow
            label="Not approved sessions"
            checked={notApproved}
            onPress={() => setNotApproved((v) => !v)}
          />
        </View>

        {/* ── Format ── */}
        <Text style={styles.fieldLabel}>Format</Text>
        <View style={styles.formatToggle}>
          {(['PDF', 'CSV'] as Format[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFormat(f)}
              style={[
                styles.formatOption,
                format === f ? styles.formatOptionActive : styles.formatOptionInactive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Export as ${f}`}
              accessibilityState={{ selected: format === f }}
            >
              <Text
                style={[
                  styles.formatOptionLabel,
                  format === f
                    ? styles.formatOptionLabelActive
                    : styles.formatOptionLabelInactive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.gap32} />

        {exportSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              Record exported successfully. Check your email.
            </Text>
          </View>
        )}

        <PrimaryButton
          label="Export Record"
          onPress={handleExport}
          accessibilityLabel="Export service record"
        />

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onPress: () => void;
}

function CheckboxRow({ label, checked, onPress }: CheckboxRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.checkboxRow}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
    >
      <View
        style={[
          styles.checkbox,
          checked ? styles.checkboxChecked : styles.checkboxUnchecked,
        ]}
      >
        {checked && <Text style={styles.checkboxMark}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
  } as ViewStyle,

  title: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 6,
  } as TextStyle,
  subtitle: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textSecondary,
    marginBottom: 24,
  } as TextStyle,

  fieldLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 10,
    marginTop: 4,
  } as TextStyle,

  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  } as ViewStyle,
  dateInputFlex: {
    flex: 1,
  } as ViewStyle,

  // Checkboxes
  checkboxGroup: {
    gap: 12,
    marginBottom: 24,
  } as ViewStyle,
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  checkboxChecked: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  checkboxUnchecked: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  } as ViewStyle,
  checkboxMark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  } as TextStyle,
  checkboxLabel: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,

  // Format toggle
  formatToggle: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 8,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  } as ViewStyle,
  formatOption: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  } as ViewStyle,
  formatOptionActive: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  formatOptionInactive: {
    backgroundColor: Colors.surface,
  } as ViewStyle,
  formatOptionLabel: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
  } as TextStyle,
  formatOptionLabelActive: {
    color: Colors.white,
  } as TextStyle,
  formatOptionLabelInactive: {
    color: Colors.textSecondary,
  } as TextStyle,

  // Success banner
  successBanner: {
    backgroundColor: Colors.approvedContainer,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 16,
  } as ViewStyle,
  successText: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.primaryDeep,
    textAlign: 'center',
  } as TextStyle,

  gap32: {
    height: 32,
  } as ViewStyle,
  bottomPad: {
    height: 40,
  } as ViewStyle,
});
