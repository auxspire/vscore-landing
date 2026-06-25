/** Client-side auth when the scoring edge function is unavailable. */

import { supabase } from './database/supabaseClient';
import { TEST_OTP_CODE } from '../lib/testOtp';
import { phoneSyntheticEmail } from './authEdgeUtils';

/** Shared password for test OTP phone accounts (client fallback only). */
export const TEST_PHONE_PASSWORD = `VscorTest${TEST_OTP_CODE}!`;

export { phoneSyntheticEmail, isEdgeFunctionUnavailable } from './authEdgeUtils';

export async function signUpWithSupabaseDirect(
  email: string,
  password: string,
  displayName: string,
  extraMetadata: Record<string, unknown> = {},
): Promise<{ success: boolean; error?: string; needsEmailConfirm?: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, ...extraMetadata },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.session) {
    return { success: true };
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInData?.session) {
    return { success: true };
  }

  if (signInError?.message?.toLowerCase().includes('email not confirmed')) {
    return {
      success: false,
      needsEmailConfirm: true,
      error: 'Account created — check your email to confirm, then sign in.',
    };
  }

  return {
    success: false,
    error: signInError?.message || 'Account may have been created. Try signing in.',
  };
}

export async function verifyTestPhoneOtpDirect(
  phoneNumber: string,
): Promise<{ success: boolean; error?: string }> {
  const normalized = phoneNumber.replace(/\D/g, '');
  const email = phoneSyntheticEmail(normalized);
  const displayName = `User ${normalized.slice(-4)}`;

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: TEST_PHONE_PASSWORD,
  });

  if (data?.session) {
    return { success: true };
  }

  const invalidLogin =
    error?.message?.toLowerCase().includes('invalid login') ||
    error?.message?.toLowerCase().includes('invalid credentials') ||
    error?.status === 400;

  if (invalidLogin) {
    const created = await signUpWithSupabaseDirect(email, TEST_PHONE_PASSWORD, displayName, {
      phone: normalized,
    });

    if (!created.success) {
      return { success: false, error: created.error };
    }

    ({ data, error } = await supabase.auth.signInWithPassword({
      email,
      password: TEST_PHONE_PASSWORD,
    }));

    if (data?.session) {
      return { success: true };
    }

    return { success: false, error: error?.message || 'Test login failed after signup' };
  }

  return { success: false, error: error?.message || 'Test OTP sign-in failed' };
}
