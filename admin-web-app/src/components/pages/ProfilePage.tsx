'use client';

import { useActionState, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from '@/components/ui/Icons';
import {
  updateAccountPassword,
  updateAccountProfile,
  type AccountActionState,
} from '@/actions/account';
import { ADMIN_PROFILE, initialsFromName } from '@/lib/admin-account';
import { createClient } from '@/lib/supabase/client';

const initialState: AccountActionState = {};

const FIELD =
  'w-full h-10 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus:outline-none focus:border-primary';
const PASSWORD_FIELD = `${FIELD} pr-11`;
const LABEL = 'font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-xs block';
const SUBMIT =
  'h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold tracking-wide disabled:opacity-60 disabled:cursor-not-allowed w-fit';

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  visible,
  onToggleVisible,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={PASSWORD_FIELD}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-sm text-text-tertiary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeIcon className="w-5 h-5" aria-hidden />
          ) : (
            <EyeOffIcon className="w-5 h-5" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

function Status({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p
        className="font-body text-[14px] text-[#ba1a1a] bg-[#ffd9de] border border-[#ba1a1a]/40 rounded-sm px-md py-sm"
        role="alert"
      >
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p
        className="font-body text-[14px] text-primary bg-[#f7fff1] border border-primary/40 rounded-sm px-md py-sm"
        role="status"
      >
        {success}
      </p>
    );
  }
  return null;
}

export function ProfilePage({
  initialName,
  initialEmail,
  readOnlyFields,
}: {
  initialName: string;
  initialEmail: string;
  readOnlyFields: { label: string; value: string }[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialName);
  const [profileState, profileAction, profilePending] = useActionState(
    updateAccountProfile,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updateAccountPassword,
    initialState,
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setDisplayName(initialName);
  }, [initialName]);

  useEffect(() => {
    if (profileState.success) {
      router.refresh();
    }
  }, [profileState.success, router]);

  useEffect(() => {
    if (passwordState.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [passwordState.success]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSigningOut(false);
        return;
      }
      router.push('/login');
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  function handleProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nextName = String(formData.get('name') ?? '').trim();
    if (nextName) setDisplayName(nextName);
    void profileAction(formData);
  }

  function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void passwordAction(new FormData(e.currentTarget));
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-lg">
      <header>
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Account</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          Your admin profile for the CleanUpGiveBack portal. Change your name, email, and password
          below.
        </p>
      </header>

      <section className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="px-lg py-lg flex items-center gap-md border-b border-border-outline">
          <span
            className="w-14 h-14 rounded-full bg-primary text-white font-data text-[18px] font-semibold inline-flex items-center justify-center shrink-0"
            aria-hidden
          >
            {initialsFromName(displayName)}
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-[22px] leading-[28px] text-text-primary truncate">
              {displayName}
            </h2>
            <p className="font-data text-[12px] text-text-tertiary">
              {ADMIN_PROFILE.title} · {ADMIN_PROFILE.role}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-border-outline">
          {readOnlyFields.map((field) => (
            <div
              key={field.label}
              className="px-lg py-md grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-xs sm:gap-md"
            >
              <dt className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary">
                {field.label}
              </dt>
              <dd className="font-body text-[14px] text-text-primary break-words">{field.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form
        onSubmit={handleProfileSubmit}
        className="bg-bg-surface border border-border-outline rounded-md overflow-hidden"
      >
        <div className="px-lg py-md border-b border-border-outline">
          <h2 className="font-heading text-[18px] leading-[24px] text-text-primary">Profile</h2>
          <p className="mt-xs font-body text-[13px] text-text-tertiary">
            Update the name and email you use to sign in to this portal.
          </p>
        </div>
        <div className="p-lg flex flex-col gap-md">
          <Status {...profileState} />
          <div>
            <label htmlFor="profile-name" className={LABEL}>
              Name
            </label>
            <input
              id="profile-name"
              name="name"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              defaultValue={initialName}
              key={`name-${initialName}`}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="profile-email" className={LABEL}>
              Email
            </label>
            <input
              id="profile-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={initialEmail}
              key={`email-${initialEmail}`}
              className={FIELD}
            />
          </div>
          <button type="submit" disabled={profilePending} className={SUBMIT}>
            {profilePending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="bg-bg-surface border border-border-outline rounded-md overflow-hidden"
      >
        <div className="px-lg py-md border-b border-border-outline">
          <h2 className="font-heading text-[18px] leading-[24px] text-text-primary">Password</h2>
          <p className="mt-xs font-body text-[13px] text-text-tertiary">
            Choose a new password (at least 8 characters).
          </p>
        </div>
        <div className="p-lg flex flex-col gap-md">
          <Status {...passwordState} />
          <PasswordField
            id="profile-current-password"
            name="currentPassword"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
            visible={showCurrentPassword}
            onToggleVisible={() => setShowCurrentPassword((v) => !v)}
          />
          <PasswordField
            id="profile-new-password"
            name="newPassword"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            required
            minLength={8}
            visible={showNewPassword}
            onToggleVisible={() => setShowNewPassword((v) => !v)}
          />
          <PasswordField
            id="profile-confirm-password"
            name="confirmPassword"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            minLength={8}
            visible={showConfirmPassword}
            onToggleVisible={() => setShowConfirmPassword((v) => !v)}
          />
          <button type="submit" disabled={passwordPending} className={SUBMIT}>
            {passwordPending ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>

      <div className="mt-0 flex flex-col gap-md">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="h-11 px-lg rounded-sm border border-border-outline bg-bg-surface font-data text-[13px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors w-fit disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
