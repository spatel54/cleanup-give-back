'use client';

import { useActionState, useEffect, useRef } from 'react';
import {
  updateAccountProfile,
  updateAccountPassword,
  type AccountActionState,
} from '@/actions/account';
import { FIELD, LABEL } from '@/components/events/formStyles';

const initialState: AccountActionState = {};

const SUBMIT =
  'interactive h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold tracking-wide transition-transform active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed w-fit';

function StatusBanner({ state }: { state: AccountActionState }) {
  if (state.error) {
    return (
      <p
        className="font-body text-[14px] text-[#ba1a1a] bg-[#ffd9de] border border-[#ba1a1a]/40 rounded-sm px-md py-sm"
        role="alert"
      >
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p
        className="font-body text-[14px] text-primary bg-[#f7fff1] border border-primary/40 rounded-sm px-md py-sm"
        role="status"
      >
        {state.success}
      </p>
    );
  }
  return null;
}

function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction, pending] = useActionState(updateAccountProfile, initialState);

  return (
    <form
      action={formAction}
      className="bg-bg-surface border border-border-outline rounded-md overflow-hidden"
      aria-labelledby="account-edit-profile-heading"
    >
      <div className="px-lg py-md border-b border-border-outline">
        <h2
          id="account-edit-profile-heading"
          className="font-heading text-[18px] leading-[24px] text-text-primary"
        >
          Profile
        </h2>
        <p className="mt-xs font-body text-[13px] text-text-tertiary">
          Update the name and email you use to sign in to this portal.
        </p>
      </div>

      <div className="p-lg flex flex-col gap-md">
        <StatusBanner state={state} />

        <div>
          <label htmlFor="account-name" className={LABEL}>
            Name
          </label>
          <input
            id="account-name"
            name="name"
            type="text"
            required
            minLength={2}
            autoComplete="name"
            defaultValue={name}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="account-email" className={LABEL}>
            Email
          </label>
          <input
            id="account-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email}
            className={FIELD}
          />
        </div>

        <button type="submit" disabled={pending} className={SUBMIT}>
          {pending ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [state, formAction, pending] = useActionState(updateAccountPassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-bg-surface border border-border-outline rounded-md overflow-hidden"
      aria-labelledby="account-edit-password-heading"
    >
      <div className="px-lg py-md border-b border-border-outline">
        <h2
          id="account-edit-password-heading"
          className="font-heading text-[18px] leading-[24px] text-text-primary"
        >
          Password
        </h2>
        <p className="mt-xs font-body text-[13px] text-text-tertiary">
          Choose a new password (at least 8 characters).
        </p>
      </div>

      <div className="p-lg flex flex-col gap-md">
        <StatusBanner state={state} />

        <div>
          <label htmlFor="account-current-password" className={LABEL}>
            Current password
          </label>
          <input
            id="account-current-password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="account-new-password" className={LABEL}>
            New password
          </label>
          <input
            id="account-new-password"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="account-confirm-password" className={LABEL}>
            Confirm new password
          </label>
          <input
            id="account-confirm-password"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={FIELD}
          />
        </div>

        <button type="submit" disabled={pending} className={SUBMIT}>
          {pending ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  );
}

export function AccountSettingsForms({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <div className="flex flex-col gap-lg">
      <ProfileForm name={name} email={email} />
      <PasswordForm />
    </div>
  );
}
