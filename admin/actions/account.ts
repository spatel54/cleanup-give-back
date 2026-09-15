'use server';

import { revalidatePath } from 'next/cache';
import { createClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';

export type AccountActionState = {
  error?: string;
  success?: string;
};

async function getLiveAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return { supabase, user };
}

export async function updateAccountProfile(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (name.length < 2) {
    return { error: 'Name must be at least 2 characters.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid email address.' };
  }

  let live;
  try {
    live = await getLiveAdminUser();
  } catch {
    return { error: 'Unauthorized.' };
  }

  if (!live) {
    return {
      error: 'Turn off BYPASS_AUTH and sign in to update name or email.',
    };
  }

  const { supabase, user } = live;
  const emailChanged = Boolean(user.email && email !== user.email.toLowerCase());

  const { error } = await supabase.auth.updateUser({
    ...(emailChanged ? { email } : {}),
    data: {
      ...user.user_metadata,
      full_name: name,
      role: 'admin',
    },
  });

  if (error) {
    return { error: error.message };
  }

  try {
    const service = await tryCreateServiceClient();
    if (service) {
      await writeAuditLog(service, {
        adminUserId: user.id,
        action: 'account.profile_updated',
        targetTable: 'auth.users',
        targetId: user.id,
        beforeValue: {
          full_name: user.user_metadata?.full_name ?? null,
          email: user.email ?? null,
        },
        afterValue: {
          full_name: name,
          email,
          email_change_pending: emailChanged,
        },
      });
    }
  } catch {
    // Audit is best-effort; profile update already succeeded.
  }

  revalidatePath('/account');
  revalidatePath('/');

  return {
    success: emailChanged
      ? 'Profile saved. Confirm the new email from your inbox if Supabase asks you to.'
      : 'Profile saved.',
  };
}

export async function updateAccountPassword(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!currentPassword) {
    return { error: 'Enter your current password.' };
  }
  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New password and confirmation do not match.' };
  }
  if (currentPassword === newPassword) {
    return { error: 'New password must be different from your current password.' };
  }

  let live;
  try {
    live = await getLiveAdminUser();
  } catch {
    return { error: 'Unauthorized.' };
  }

  if (!live) {
    return {
      error: 'Turn off BYPASS_AUTH and sign in to change your password.',
    };
  }

  const { supabase, user } = live;
  if (!user.email) {
    return { error: 'Your account has no email on file.' };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { error: 'Current password is incorrect.' };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: error.message };
  }

  try {
    const service = await tryCreateServiceClient();
    if (service) {
      await writeAuditLog(service, {
        adminUserId: user.id,
        action: 'account.password_updated',
        targetTable: 'auth.users',
        targetId: user.id,
        afterValue: { password_changed: true },
      });
    }
  } catch {
    // Audit is best-effort.
  }

  revalidatePath('/account');

  return { success: 'Password updated.' };
}
