import type { Session } from '@supabase/supabase-js';
import type { ImperativeRouter as Router } from 'expo-router';

import {
  getBirthday,
  getE164Phone,
  getEmail,
  getPreferredName,
  getServiceType,
} from '@/features/onboarding/onboardingStore';
import { signInWithSocial, signUpWithEmail } from '@/lib/auth';
import { isAuthCanceledError, isRegisteredSession, mapAuthErrorMessage } from '@/lib/authHelpers';
import {
  clearCreateAccountDraft,
  peekCreateAccountDraft,
  peekPendingSocialProvider,
} from '@/lib/createAccountDraft';
import { getCurrentSession, syncVolunteerProfile } from '@/lib/supabase';
import { applyVolunteerProfileFromUser } from '@/lib/volunteerAuthNavigation';

export type CreateAccountResult =
  | { ok: true; session: Session }
  | { ok: false; canceled: true }
  | { ok: false; canceled: false; error: string };

/**
 * Creates the Supabase account only after personal details + age ≥ 13.
 * Social OAuth may already have a session (Welcome / Create Account).
 * Always continues to `/creating-account` after a successful write.
 */
export async function createAccountAfterPersonalDetails(
  router: Pick<Router, 'replace'>,
): Promise<CreateAccountResult> {
  const social = peekPendingSocialProvider();
  const draft = peekCreateAccountDraft();

  try {
    const existing = await getCurrentSession();
    let session: Session;
    if (isRegisteredSession(existing) && existing) {
      session = existing;
    } else if (social) {
      session = await signInWithSocial(social);
    } else if (draft?.email && draft.password) {
      session = await signUpWithEmail(draft.email, draft.password, draft.name);
    } else {
      return {
        ok: false,
        canceled: false,
        error: 'Account details are missing. Go back and create your account.',
      };
    }

    await syncVolunteerProfile({
      preferredName: getPreferredName(),
      email: getEmail() || session.user.email,
      phone: getE164Phone(),
      serviceType: getServiceType() ?? undefined,
      birthday: getBirthday(),
    });
    applyVolunteerProfileFromUser(session.user);
    clearCreateAccountDraft();
    router.replace('/creating-account');
    return { ok: true, session };
  } catch (caught) {
    if (isAuthCanceledError(caught)) {
      return { ok: false, canceled: true };
    }
    return {
      ok: false,
      canceled: false,
      error: mapAuthErrorMessage(caught),
    };
  }
}
