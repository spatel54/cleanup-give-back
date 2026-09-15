import type { ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../components/Icon';
import { LiveSessionMap } from '../components/LiveSessionMap';
import { SessionButton } from '../components/SessionButton';
import { mockReviewedSession } from '../mocks/session';
import { colors, radius, screenPaddingHorizontal, spacing, textStyles } from '../tokens';

type Props = {
  onBack?: () => void;
  /** "Submit for Approval" — advances to SubmissionConfirmationScreen. */
  onSubmit?: () => void;
};

/**
 * PRD §6.14 · Figma `session-review` — no dedicated frame (per
 * figma-to-native-handoff.md, generated screen); rebuilt from
 * `prototype/screens/session/SessionReview.tsx`'s copy and read-only
 * layout using the current design tokens/components. Read-only per the
 * PRD's "Important Rule" — no field on this screen is editable.
 */
export function SessionReviewScreen({ onBack, onSubmit }: Props) {
  const s = mockReviewedSession;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Icon name="chevronLeft" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[textStyles.labelOverline, styles.eyebrow]}>Review session</Text>
        <Text style={textStyles.headlinePage}>{s.durationLabel} completed</Text>

        <View style={styles.titleBlock}>
          <Text style={textStyles.bodyStrong}>{s.title}</Text>
          <Text style={[textStyles.bodyDefault, styles.mutedText]}>
            {s.photosSubmittedTotal} photos submitted · {s.distanceMilesTracked} miles tracked
          </Text>
        </View>

        <LiveSessionMap style={styles.mapPreview} />

        <Section title="Details">
          <DetailRow label="Date" value={s.dateLabel} />
          <DetailRow label="Time" value={`${s.startTimeLabel} – ${s.endTimeLabel}`} />
          <DetailRow label="Court Ordered" value={s.courtOrdered === 'yes' ? 'Yes' : 'No'} />
          <DetailRow label="Signature" value={s.signatureComplete ? 'Completed' : 'Incomplete'} />
        </Section>

        <Section title="Description">
          <Text style={[textStyles.bodyDefault, styles.mutedText]}>{s.description}</Text>
        </Section>

        <Text style={[textStyles.bodySmall, styles.readOnlyNotice]}>
          Session records are read-only. No editing allowed.
        </Text>

        <SessionButton label="Submit for Approval" onPress={onSubmit} style={styles.submitButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[textStyles.headlineDetail, styles.sectionTitle]}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[textStyles.bodyDefault, styles.mutedText]}>{label}</Text>
      <Text style={textStyles.bodyEmphasis}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.textTertiary,
  },
  titleBlock: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  mutedText: {
    color: colors.textTertiary,
  },
  mapPreview: {
    height: 180,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readOnlyNotice: {
    color: colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  submitButton: {
    marginBottom: spacing.lg,
  },
});
