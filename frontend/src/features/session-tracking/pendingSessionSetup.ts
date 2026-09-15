/**
 * Stashes session setup form details and first dual-checkpoint photos
 * between form → capture → live session. GPS / timer start only after
 * photos are submitted.
 */

export type PendingSessionStartPhotos = {
  selfieUri: string;
  progressUri: string;
  capturedAt: number;
};

export type PendingSessionSetupForm = {
  activity: string;
  dateIso: string;
  courtOrdered: boolean;
  description: string;
};

let pendingStartPhotos: PendingSessionStartPhotos | null = null;
let pendingSetupForm: PendingSessionSetupForm | null = null;

export function setPendingSessionStartPhotos(photos: PendingSessionStartPhotos): void {
  pendingStartPhotos = photos;
}

export function getPendingSessionStartPhotos(): PendingSessionStartPhotos | null {
  return pendingStartPhotos;
}

export function consumePendingSessionStartPhotos(): PendingSessionStartPhotos | null {
  const photos = pendingStartPhotos;
  pendingStartPhotos = null;
  return photos;
}

export function clearPendingSessionStartPhotos(): void {
  pendingStartPhotos = null;
}

export function hasPendingSessionStartPhotos(): boolean {
  return pendingStartPhotos != null;
}

export function setPendingSessionSetupForm(form: PendingSessionSetupForm): void {
  pendingSetupForm = form;
}

export function getPendingSessionSetupForm(): PendingSessionSetupForm | null {
  return pendingSetupForm;
}

export function consumePendingSessionSetupForm(): PendingSessionSetupForm | null {
  const form = pendingSetupForm;
  pendingSetupForm = null;
  return form;
}

export function clearPendingSessionSetupForm(): void {
  pendingSetupForm = null;
}

export function hasPendingSessionSetupForm(): boolean {
  return pendingSetupForm != null;
}

export function clearPendingSessionSetup(): void {
  pendingStartPhotos = null;
  pendingSetupForm = null;
}
