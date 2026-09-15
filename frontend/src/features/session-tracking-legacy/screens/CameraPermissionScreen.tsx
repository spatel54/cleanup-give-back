import { PermissionRequestScreen } from './PermissionRequestScreen';

type Props = {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
};

/** PRD §6.10 · Figma `camera_permission` (728:658). */
export function CameraPermissionScreen({ onNext, onBack, onSkip }: Props) {
  return (
    <PermissionRequestScreen
      icon="camera"
      title="Allow camera?"
      body="Camera access is required for photo checkpoints during sessions."
      primaryLabel="Enable camera"
      stepIndex={5}
      stepCount={6}
      onEnable={() => onNext?.()}
      onPrevious={() => onBack?.()}
      onNotNow={() => onSkip?.()}
    />
  );
}
