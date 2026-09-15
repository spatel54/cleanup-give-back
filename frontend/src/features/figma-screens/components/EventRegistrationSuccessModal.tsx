import React from 'react';

import { SuccessConfirmationModal } from './SuccessConfirmationModal';

type Props = {
  visible: boolean;
  onGoHome: () => void;
};

/**
 * Registration confirmation overlay (Figma `events_registration_confirmation`, `787:406`).
 */
export function EventRegistrationSuccessModal({ visible, onGoHome }: Props) {
  return (
    <SuccessConfirmationModal
      visible={visible}
      message="You have successfully registered for this event!"
      buttonLabel="Go Home"
      onPress={onGoHome}
    />
  );
}
