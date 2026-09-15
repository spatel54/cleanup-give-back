import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Provider, Session } from '@supabase/supabase-js';

import {
  AuthCanceledError,
  isAuthCanceledError,
  mapAuthErrorMessage,
  parseAuthCallbackParams,
} from '@/lib/authHelpers';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = 'apple' | 'google' | 'facebook';

export function getAuthRedirectUrl(): string {
  return Linking.createURL('auth/callback');
}

function requireClient() {
  if (!supabase) {
    throw new Error('Sign-in is unavailable until the app is connected.');
  }
  return supabase;
}

async function sessionFromAuthResponse(
  session: Session | null | undefined,
  error: { message: string } | null,
): Promise<Session> {
  if (error) {
    throw new Error(mapAuthErrorMessage(error));
  }
  if (session) {
    return session;
  }
  const { data } = await requireClient().auth.getSession();
  if (data.session) {
    return data.session;
  }
  throw new Error('Check your email to confirm your account, then log in.');
}

export async function signInWithEmail(email: string, password: string): Promise<Session> {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  return sessionFromAuthResponse(data.session, error);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
): Promise<Session> {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: fullName.trim() },
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  return sessionFromAuthResponse(data.session, error);
}

export async function resetPasswordForEmail(email: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: getAuthRedirectUrl(),
  });
  if (error) {
    throw new Error(mapAuthErrorMessage(error));
  }
}

export async function completeOAuthFromUrl(url: string): Promise<Session | null> {
  const client = requireClient();
  const params = parseAuthCallbackParams(url);
  if (params.error) {
    throw new Error(mapAuthErrorMessage(params.errorDescription ?? params.error));
  }
  if (params.accessToken && params.refreshToken) {
    const { data, error } = await client.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    return sessionFromAuthResponse(data.session, error);
  }
  if (params.code) {
    const { data, error } = await client.auth.exchangeCodeForSession(params.code);
    return sessionFromAuthResponse(data.session, error);
  }
  return null;
}

async function signInWithOAuth(provider: Provider): Promise<Session> {
  const client = requireClient();
  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) {
    throw new Error(mapAuthErrorMessage(error));
  }
  if (!data.url) {
    throw new Error('Could not start sign-in. Try again.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !('url' in result) || !result.url) {
    throw new AuthCanceledError();
  }
  const session = await completeOAuthFromUrl(result.url);
  if (!session) {
    throw new Error('Could not finish sign-in. Try again.');
  }
  return session;
}

function appleFullName(fullName: AppleAuthentication.AppleAuthenticationFullName | null): string {
  if (!fullName) {
    return '';
  }
  return [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ')
    .trim();
}

export async function signInWithApple(): Promise<Session> {
  if (Platform.OS !== 'ios') {
    return signInWithOAuth('apple');
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    return signInWithOAuth('apple');
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple did not return a sign-in token. Try again.');
    }
    const client = requireClient();
    const { data, error } = await client.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    const session = await sessionFromAuthResponse(data.session, error);
    const fullName = appleFullName(credential.fullName);
    if (fullName) {
      await client.auth.updateUser({ data: { full_name: fullName } });
    }
    return session;
  } catch (error) {
    if (isAuthCanceledError(error)) {
      throw new AuthCanceledError();
    }
    throw error instanceof Error ? error : new Error(mapAuthErrorMessage(error));
  }
}

export async function signInWithSocial(provider: SocialProvider): Promise<Session> {
  if (provider === 'apple') {
    return signInWithApple();
  }
  return signInWithOAuth(provider);
}
