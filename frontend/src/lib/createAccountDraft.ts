/** Pre-auth signup draft (memory only). Cleared on under-13 or after successful signUp. */
export type CreateAccountDraft = {
  name: string;
  email: string;
  password: string;
};

export type PendingSocialProvider = 'apple' | 'google' | 'facebook';

let pendingDraft: CreateAccountDraft | null = null;
/** Social OAuth deferred until after personal details + age gate. */
let pendingSocialProvider: PendingSocialProvider | null = null;

/** Welcome → Create Account email/password handoff (no name yet). */
export function setPendingCreateAccountDraft(email: string, password: string): void {
  pendingDraft = {
    name: pendingDraft?.name ?? '',
    email: email.trim(),
    password,
  };
}

export function setCreateAccountDraft(draft: CreateAccountDraft): void {
  pendingDraft = {
    name: draft.name.trim(),
    email: draft.email.trim().toLowerCase(),
    password: draft.password,
  };
  pendingSocialProvider = null;
}

export function peekCreateAccountDraft(): CreateAccountDraft | null {
  return pendingDraft;
}

/**
 * One-shot Welcome → Create Account field handoff.
 * Does not clear a full draft already set via `setCreateAccountDraft`.
 */
export function takePendingCreateAccountDraft(): { email: string; password: string } | null {
  if (!pendingDraft) {
    return null;
  }
  const { email, password, name } = pendingDraft;
  // Welcome handoff has no name yet — consume so the form owns the fields.
  if (!name) {
    pendingDraft = null;
  }
  return { email, password };
}

export function setPendingSocialProvider(provider: PendingSocialProvider): void {
  pendingSocialProvider = provider;
  pendingDraft = null;
}

export function peekPendingSocialProvider(): PendingSocialProvider | null {
  return pendingSocialProvider;
}

export function clearCreateAccountDraft(): void {
  pendingDraft = null;
  pendingSocialProvider = null;
}
