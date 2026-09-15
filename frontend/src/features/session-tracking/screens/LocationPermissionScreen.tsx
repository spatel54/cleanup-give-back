import { PermissionRequestScreen } from './PermissionRequestScreen';

type Props = {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
};

/** PRD §6.10 · Figma `location_permission` (728:639). */
export function LocationPermissionScreen({ onNext, onBack, onSkip }: Props) {
  return (
    <PermissionRequestScreen
      icon="locationPin"
      title="Allow location?"
      body="Location is used only during active cleanup sessions to verify your route."
      primaryLabel="Enable location"
      stepIndex={4}
      stepCount={6}
      onEnable={() => onNext?.()}
      onPrevious={() => onBack?.()}
      onNotNow={() => onSkip?.()}
    />
  );
}
