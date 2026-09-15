import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PermissionToggleRow } from '../components/PermissionToggleRow';
import { ProgressPills } from '../components/ProgressPills';
import { SessionButton } from '../components/SessionButton';
import { mockSession } from '../mocks/session';
import { colors, primitives, radius, screenPaddingHorizontal, spacing, textStyles } from '../tokens';

const STEP_COUNT = 6; // intro, activity+date, court-ordered+description, signature, location perm, camera perm
const LOCAL_STEP_COUNT = 4; // steps owned by this screen; steps 4-5 are the Permission screens

type Props = {
  /** Called after the signature step — hands off to LocationPermissionScreen. */
  onComplete?: () => void;
  onExit?: () => void;
};

/**
 * PRD §6.9 · Figma `session_setup_guide` step frames (8 frames covering the
 * intro + 4 field groups below; ProgressPills totals 6 across this screen's
 * 4 local steps + the two Permission screens that follow).
 */
export function SessionSetupScreen({ onComplete, onExit }: Props) {
  const [step, setStep] = useState(0);
  const [locationGranted, setLocationGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [title, setTitle] = useState(mockSession.title);
  const [description, setDescription] = useState('');
  const [courtOrdered, setCourtOrdered] = useState<'yes' | 'no' | null>(null);
  const [signed, setSigned] = useState(false);

  const goNext = () => {
    if (step === LOCAL_STEP_COUNT - 1) {
      onComplete?.();
      return;
    }
    setStep((s) => Math.min(s + 1, LOCAL_STEP_COUNT - 1));
  };

  const goPrevious = () => {
    if (step === 0) {
      onExit?.();
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.progressWrap}>
        <ProgressPills total={STEP_COUNT} currentIndex={step} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <IntroStep
            locationGranted={locationGranted}
            cameraGranted={cameraGranted}
            onToggleLocation={() => setLocationGranted((v) => !v)}
            onToggleCamera={() => setCameraGranted((v) => !v)}
          />
        )}
        {step === 1 && (
          <ActivityDateStep title={title} onTitleChange={setTitle} dateLabel={mockSession.dateLabel} />
        )}
        {step === 2 && (
          <CourtOrderedDescriptionStep
            courtOrdered={courtOrdered}
            onSelectCourtOrdered={setCourtOrdered}
            description={description}
            onDescriptionChange={setDescription}
          />
        )}
        {step === 3 && <SignatureStep signed={signed} onSign={() => setSigned(true)} />}
      </ScrollView>
      <View style={styles.actions}>
        <SessionButton
          label={step === LOCAL_STEP_COUNT - 1 ? 'Start Session' : 'Continue'}
          onPress={goNext}
          disabled={step === 3 && !signed}
        />
        <SessionButton label="Previous" variant="secondary" onPress={goPrevious} />
      </View>
    </SafeAreaView>
  );
}

function StepHeading({ title }: { title: string }) {
  return <Text style={[textStyles.headlinePage, styles.stepHeading]}>{title}</Text>;
}

function IntroStep({
  locationGranted,
  cameraGranted,
  onToggleLocation,
  onToggleCamera,
}: {
  locationGranted: boolean;
  cameraGranted: boolean;
  onToggleLocation: () => void;
  onToggleCamera: () => void;
}) {
  return (
    <View style={styles.stepGap}>
      <StepHeading title="Start tracking" />
      <Text style={[textStyles.bodyDefault, styles.helperText]}>
        We'll verify your walking path and require a quick photo every 30 minutes to keep your
        session valid.
      </Text>
      <View style={styles.card}>
        <PermissionToggleRow
          icon="locationPin"
          title="Location access"
          description="Verifies your walking path"
          granted={locationGranted}
          onToggle={onToggleLocation}
        />
        <View style={styles.rowDivider} />
        <PermissionToggleRow
          icon="camera"
          title="Camera access"
          description="Required for photo checkpoints"
          granted={cameraGranted}
          onToggle={onToggleCamera}
        />
      </View>
    </View>
  );
}

function ActivityDateStep({
  title,
  onTitleChange,
  dateLabel,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  dateLabel: string;
}) {
  return (
    <View style={styles.stepGap}>
      <StepHeading title="What activity is this?" />
      <FieldLabel label="Activity" />
      <TextInput
        value={title}
        onChangeText={onTitleChange}
        style={styles.input}
        placeholder="River Trail Cleanup"
        placeholderTextColor={colors.borderOutline}
      />
      <FieldLabel label="Date" />
      <View style={styles.input}>
        <Text style={textStyles.bodyDefault}>{dateLabel}</Text>
      </View>
    </View>
  );
}

function CourtOrderedDescriptionStep({
  courtOrdered,
  onSelectCourtOrdered,
  description,
  onDescriptionChange,
}: {
  courtOrdered: 'yes' | 'no' | null;
  onSelectCourtOrdered: (v: 'yes' | 'no') => void;
  description: string;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <View style={styles.stepGap}>
      <StepHeading title="A few more details" />
      <FieldLabel label="Court Ordered Status" />
      <View style={styles.toggleRow}>
        <SessionButton
          label="Yes"
          variant={courtOrdered === 'yes' ? 'primary' : 'secondary'}
          onPress={() => onSelectCourtOrdered('yes')}
          style={styles.toggleButton}
        />
        <SessionButton
          label="No"
          variant={courtOrdered === 'no' ? 'primary' : 'secondary'}
          onPress={() => onSelectCourtOrdered('no')}
          style={styles.toggleButton}
        />
      </View>
      <FieldLabel label="Description" />
      <TextInput
        value={description}
        onChangeText={onDescriptionChange}
        style={[styles.input, styles.textarea]}
        placeholder="Describe what you are doing..."
        placeholderTextColor={colors.borderOutline}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

function SignatureStep({ signed, onSign }: { signed: boolean; onSign: () => void }) {
  return (
    <View style={styles.stepGap}>
      <StepHeading title="Digital Signature" />
      <Text style={[textStyles.bodyDefault, styles.helperText]}>
        Sign to confirm the details above are accurate.
      </Text>
      <SessionButton
        label={signed ? 'Signed ✓' : 'Sign here'}
        variant={signed ? 'primary' : 'secondary'}
        onPress={onSign}
        style={styles.signatureBox}
      />
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={[textStyles.bodyEmphasis, styles.fieldLabel]}>{label}</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  progressWrap: {
    paddingHorizontal: screenPaddingHorizontal,
    marginTop: spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  actions: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  stepGap: {
    gap: spacing.sm,
  },
  stepHeading: {
    marginBottom: spacing.xs,
  },
  helperText: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  rowDivider: {
    height: 1,
    backgroundColor: primitives.gray200,
  },
  fieldLabel: {
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    color: colors.textPrimary,
    ...textStyles.bodyDefault,
  },
  textarea: {
    minHeight: 96,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleButton: {
    flex: 1,
  },
  signatureBox: {
    minHeight: 96,
  },
});
