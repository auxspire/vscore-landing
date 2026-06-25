import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Loader2, Mail, Lock, User, Phone, Eye, EyeOff,
} from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signUpWithPhone,
  signInWithPhonePassword,
  signInWithPhone,
  verifyOtp,
  getCurrentUser,
  requestPasswordReset,
  updatePassword,
} from '../utils/auth';
import { ProfileMergeDialog } from './ProfileMergeDialog';

interface LoginScreenProps {
  onLoginComplete: () => void;
  /** Called with true when the merge dialog opens, false when it resolves. */
  onMergeDialogActive?: (active: boolean) => void;
  /** User followed a password-reset email link — show set-new-password form. */
  passwordRecoveryMode?: boolean;
  onPasswordResetComplete?: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
/** Returns true if the string looks like a phone number (starts with digit or +) */
const looksLikePhone = (value: string) =>
  /^[+\d]/.test(value.trim()) && !/[@.]/.test(value);

/** Minimal validation */
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPhone = (v: string) => v.replace(/\D/g, '').length >= 7;
// ───────────────────────��────────────────────────────────────────────────────

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginComplete,
  onMergeDialogActive,
  passwordRecoveryMode = false,
  onPasswordResetComplete,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>(
    passwordRecoveryMode ? 'reset' : 'signin',
  );
  // 'auto' means we detect from what the user types; 'email' / 'phone' are explicit
  const [identifierType, setIdentifierType] = useState<'auto' | 'email' | 'phone'>('auto');
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [signInMethod, setSignInMethod] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const identifierRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);

  useEffect(() => {
    if (passwordRecoveryMode) setMode('reset');
  }, [passwordRecoveryMode]);

  // Keep a stable ref so effects that should run only on mount can still
  // call the latest version of onLoginComplete without it being a dependency
  // that causes the effect to re-fire on every parent re-render.
  const onLoginCompleteRef = useRef(onLoginComplete);
  useEffect(() => { onLoginCompleteRef.current = onLoginComplete; });

  // Merge dialog state
  const [pendingMergeProfiles, setPendingMergeProfiles] = useState<any[]>([]);
  const [pendingMergeEmail, setPendingMergeEmail] = useState('');
  const [pendingMergePhone, setPendingMergePhone] = useState('');
  const [pendingMergeDisplayName, setPendingMergeDisplayName] = useState('');

  // Derive whether we're treating the identifier as phone
  // Only auto-detect when the field is NOT focused, to prevent cursor jumping
  const resolvedType: 'email' | 'phone' =
    mode === 'signin' && signInMethod === 'otp'
      ? 'phone'
      : mode === 'forgot'
      ? 'email'
      : identifierType === 'auto'
      ? (isIdentifierFocused 
          ? 'email' // Keep as email while typing to prevent cursor jump
          : looksLikePhone(identifier) ? 'phone' : 'email')
      : identifierType;

  // Restore cursor position after re-render when input type changes
  useEffect(() => {
    if (cursorPositionRef.current !== null && identifierRef.current) {
      // setSelectionRange only works on input types: text, search, URL, tel, password
      // It does NOT work on email inputs, so we need to check the type first
      try {
        if (resolvedType === 'phone') {
          identifierRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
        }
      } catch (error) {
        // Silently ignore - email inputs don't support setSelectionRange
      }
      cursorPositionRef.current = null;
    }
  }, [resolvedType]);

  // Check for existing session on mount ONLY.
  // Deliberately NOT including onLoginComplete in the dep array — it's an inline
  // arrow from App.tsx that changes on every parent render. Putting it here would
  // re-fire checkSession() on every App re-render, which auto-dismisses the merge
  // dialog the moment the user is already authenticated (which they are after login).
  useEffect(() => {
    const checkSession = async () => {
      try {
        const hasOAuthCallback =
          window.location.hash.includes('access_token') ||
          window.location.search.includes('code=');

        const user = await getCurrentUser();
        if (user) {
          onLoginCompleteRef.current();
          return;
        }

        if (hasOAuthCallback) {
          setError('OAuth sign-in failed. Please try again.');
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          const localUser = localStorage.getItem('vscor_current_user');
          if (localUser) { onLoginCompleteRef.current(); return; }
        } else {
          console.error('❌ [LoginScreen] Session check error:', err);
        }
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — see comment above

  // ── submit handlers ─────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!identifier || !password) return;
    setLoading(true);
    setError(null);

    // ⚠️  Set the guard BEFORE any Supabase auth call.
    // Supabase fires the SIGNED_IN onAuthStateChange event as soon as
    // signInWithPassword resolves — which is BEFORE signInWithPhonePassword /
    // signInWithEmail returns to us with the check-unlinked-profiles result.
    // If the guard is not already up, App.tsx will call setIsLoggedIn(true)
    // and unmount LoginScreen while the merge dialog still needs to show.
    onMergeDialogActive?.(true);

    let result: { success: boolean; error?: string; existing_player_profiles?: any[]; display_name?: string };
    if (resolvedType === 'phone') {
      result = await signInWithPhonePassword(identifier, password);
    } else {
      result = await signInWithEmail(identifier, password);
    }

    if (result.success) {
      // Check if any unclaimed player profiles need to be merged
      if (result.existing_player_profiles && result.existing_player_profiles.length > 0) {
        console.log('🔄 [LoginScreen] Sign-in: showing merge dialog with', result.existing_player_profiles.length, 'profile(s)');
        // Guard was already set at the top of this handler — just fill in the state.
        setPendingMergeEmail(resolvedType === 'email' ? identifier : '');
        setPendingMergePhone(resolvedType === 'phone' ? identifier : '');
        setPendingMergeDisplayName(result.display_name || identifier);
        setPendingMergeProfiles(result.existing_player_profiles);
        setLoading(false);
        return;
      }
      // No merge needed — release the guard then complete login.
      onMergeDialogActive?.(false);
      onLoginCompleteRef.current();
    } else {
      // Sign-in failed — always release the guard so the next attempt works.
      onMergeDialogActive?.(false);

      // Check if the error indicates user doesn't exist
      const errorMsg = result.error || '';
      const isUserNotFound =
        errorMsg.toLowerCase().includes('invalid login credentials') ||
        errorMsg.toLowerCase().includes('user not found') ||
        errorMsg.toLowerCase().includes('email not confirmed');

      if (isUserNotFound) {
        // Show message and automatically switch to sign up
        setError(
          resolvedType === 'phone'
            ? `No account found with this phone number. Let's create one for you!`
            : `No account found with this email. Let's create one for you!`
        );

        // Switch to sign up mode after a brief delay, keeping the data
        setTimeout(() => {
          setMode('signup');
          setError(null);
          // identifier and password are already filled - user just needs to add display name
          setTimeout(() => {
            // Focus on the display name field
            const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (nameInput) nameInput.focus();
          }, 100);
        }, 1800);
      } else {
        setError(result.error || 'Failed to sign in. Please check your credentials.');
      }
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!identifier || !password || !displayName) return;
    setLoading(true);
    setError(null);

    // Basic validation
    if (resolvedType === 'email' && !isValidEmail(identifier)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (resolvedType === 'phone' && !isValidPhone(identifier)) {
      setError('Please enter a valid phone number (at least 7 digits).');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    // ⚠️  Set the guard BEFORE the sign-up/sign-in call for the same reason
    // as in handleSignIn — the Supabase SIGNED_IN event fires during signUpWith*
    // (which internally calls signInWithEmail), before we have the profile list.
    onMergeDialogActive?.(true);

    let result: { success: boolean; error?: string; existing_player_profiles?: any[] };
    if (resolvedType === 'phone') {
      result = await signUpWithPhone(identifier, password, displayName);
    } else {
      result = await signUpWithEmail(identifier, password, displayName);
    }

    if (result.success) {
      if (result.existing_player_profiles && result.existing_player_profiles.length > 0) {
        // Show merge dialog — guard is already set.
        console.log('🔄 [LoginScreen] Showing merge dialog with profiles:', result.existing_player_profiles.length);
        console.log('📋 [LoginScreen] Profiles:', result.existing_player_profiles);
        setPendingMergeEmail(resolvedType === 'email' ? identifier : '');
        setPendingMergePhone(resolvedType === 'phone' ? identifier : '');
        setPendingMergeDisplayName(displayName);
        setPendingMergeProfiles(result.existing_player_profiles);
        setLoading(false);
        return;
      }
      // No merge needed — release guard then complete.
      console.log('✅ [LoginScreen] No existing profiles to merge, proceeding to login complete');
      onMergeDialogActive?.(false);
      onLoginCompleteRef.current();
    } else {
      // Sign-up failed — release guard.
      onMergeDialogActive?.(false);
      setError(result.error || 'Failed to sign up. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error || 'Failed to sign in with Google. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier.trim()) {
      setError('Enter the email address for your account');
      return;
    }
    if (resolvedType === 'phone') {
      setError('Password reset is available for email accounts. Sign in with phone or use the email linked to your account.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const result = await requestPasswordReset(identifier);
    setLoading(false);
    if (result.success) {
      setSuccessMessage('Check your email for a password reset link.');
    } else {
      setError(result.error || 'Could not send reset email');
    }
  };

  const handleSendOtp = async () => {
    if (!identifier.trim() || !isValidPhone(identifier)) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await signInWithPhone(identifier.replace(/\D/g, ''));
    setLoading(false);
    if (result.success) {
      setOtpSent(true);
      setSuccessMessage('OTP sent to your phone');
    } else {
      setError(result.error || 'Could not send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError('Enter the OTP from your SMS');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await verifyOtp(identifier.replace(/\D/g, ''), otpCode.trim());
    setLoading(false);
    if (result.success) {
      onLoginCompleteRef.current();
    } else {
      setError(result.error || 'Invalid OTP');
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await updatePassword(password);
    setLoading(false);
    if (result.success) {
      setSuccessMessage('Password updated. Signing you in…');
      onPasswordResetComplete?.();
      setTimeout(() => onLoginCompleteRef.current(), 600);
    } else {
      setError(result.error || 'Could not update password');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      if (mode === 'signin' && identifier && password) handleSignIn();
      else if (mode === 'signup' && identifier && password && displayName) handleSignUp();
      else if (mode === 'forgot' && identifier) handleForgotPassword();
      else if (mode === 'reset' && password && confirmPassword) handleResetPassword();
    }
  };

  const switchMode = (clearFields: boolean = true) => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setSuccessMessage(null);
    if (clearFields) {
      setIdentifier('');
      setPassword('');
      setDisplayName('');
      setIdentifierType('auto');
      setTimeout(() => identifierRef.current?.focus(), 50);
    }
  };

  // ── guard: checking auth ────────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 flex items-center justify-center max-w-md mx-auto border-x border-purple-900">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  // ── guard: merge dialog ─────────────────────────────────────────────────────
  if (pendingMergeProfiles && pendingMergeProfiles.length > 0) {
    console.log('🎨 [LoginScreen] Rendering merge dialog with profiles:', pendingMergeProfiles.length);
    return (
      <div className="h-screen bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 flex flex-col max-w-md mx-auto border-x border-purple-900 relative">
        <ProfileMergeDialog
          existingProfiles={pendingMergeProfiles}
          displayName={pendingMergeDisplayName}
          email={pendingMergeEmail}
          phone={pendingMergePhone}
          onResolved={() => {
            console.log('✅ [LoginScreen] Merge dialog resolved, clearing profiles');
            onMergeDialogActive?.(false); // release the guard before completing login
            setPendingMergeProfiles([]);
            setPendingMergeEmail('');
            setPendingMergePhone('');
            onLoginCompleteRef.current();
          }}
        />
      </div>
    );
  }

  // ── canSubmit ──────────────────────────────────────────────────────────────
  const canSubmit =
    !loading &&
    (mode === 'signin' && signInMethod === 'otp'
      ? otpSent
        ? otpCode.trim().length >= 4
        : identifier.trim().length > 0
      : mode === 'forgot'
      ? identifier.trim().length > 0 && resolvedType === 'email'
      : mode === 'reset'
        ? password.length >= 6 && confirmPassword.length >= 6
        : identifier.trim().length > 0 &&
          password.length > 0 &&
          (mode === 'signin' || displayName.trim().length > 0));

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 flex flex-col max-w-md mx-auto border-x border-purple-900 overflow-hidden">
      {/* Status bar mock */}
      <div className="flex justify-between items-center px-6 pt-3 pb-1 text-white/60 text-xs flex-shrink-0">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2.5 border border-white/60 rounded-sm">
            <div className="w-2.5 h-1.5 bg-white/60 rounded-sm m-px" />
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 pt-6 pb-10 flex flex-col min-h-full">

          {/* Logo */}
          <div className="mb-10 text-center">
            <h1 className="text-5xl font-bold tracking-tight">
              <span className="text-white">V</span>
              <span className="text-purple-200">Scor</span>
            </h1>
            <p className="text-white/60 text-sm mt-1">Every match matters</p>
          </div>

          {/* Mode tabs */}
          {(mode === 'signin' || mode === 'signup') && (
          <div className="flex bg-white/10 rounded-2xl p-1 mb-4">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { if (m !== mode) switchMode(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-white text-purple-700 shadow'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
          )}

          {mode === 'signin' && (
            <div className="flex bg-white/10 rounded-2xl p-1 mb-8">
              <button
                type="button"
                onClick={() => { setSignInMethod('password'); setOtpSent(false); setOtpCode(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold ${signInMethod === 'password' ? 'bg-white text-purple-700' : 'text-white/70'}`}
              >
                Email / Phone
              </button>
              <button
                type="button"
                onClick={() => { setSignInMethod('otp'); setPassword(''); setIdentifierType('phone'); setOtpSent(false); setOtpCode(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold ${signInMethod === 'otp' ? 'bg-white text-purple-700' : 'text-white/70'}`}
              >
                Phone OTP
              </button>
            </div>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="mb-6 text-sm text-white/70 hover:text-white flex items-center gap-1"
            >
              ← Back to sign in
            </button>
          )}

          {mode === 'reset' && (
            <p className="text-white/80 text-sm mb-4">Choose a new password for your account.</p>
          )}
          {mode === 'forgot' && (
            <p className="text-white/80 text-sm mb-4">Enter your email and we&apos;ll send a reset link.</p>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 text-white text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-500/20 border border-green-400/40 rounded-xl px-4 py-3 text-white text-sm">
              {successMessage}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">

            {/* Display name (signup only) */}
            {mode === 'signup' && (
              <FieldRow icon={<User className="w-4.5 h-4.5" />} label="Full name">
                <input
                  type="text"
                  value={displayName}
                  onChange={e => { setDisplayName(e.target.value); setError(null); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Your name"
                  disabled={loading}
                  autoFocus
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm py-3.5"
                />
              </FieldRow>
            )}

            {/* Identifier — email or phone (not on reset) */}
            {mode !== 'reset' && (
            <div>
              {/* Toggle pill — sign-in/signup only */}
              {mode !== 'forgot' && !(mode === 'signin' && signInMethod === 'otp') && (
              <div className="flex gap-1.5 mb-1.5">
                {(['email', 'phone'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setIdentifierType(t);
                      setIdentifier('');
                      setError(null);
                      setTimeout(() => identifierRef.current?.focus(), 30);
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      resolvedType === t
                        ? 'bg-white text-purple-700'
                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {t === 'email' ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                    {t === 'email' ? 'Email' : 'Phone'}
                  </button>
                ))}
                {/* auto-detect hint */}
                {identifierType === 'auto' && identifier.length > 0 && (
                  <span className="ml-auto text-xs text-white/40 self-center">
                    detected: {resolvedType}
                  </span>
                )}
              </div>
              )}

              <FieldRow
                icon={resolvedType === 'phone'
                  ? <Phone className="w-4.5 h-4.5" />
                  : <Mail className="w-4.5 h-4.5" />}
                label={resolvedType === 'phone' ? 'Phone number' : 'Email address'}
              >
                <input
                  ref={identifierRef}
                  type={resolvedType === 'phone' ? 'tel' : 'email'}
                  inputMode={resolvedType === 'phone' ? 'tel' : 'email'}
                  value={identifier}
                  onChange={e => {
                    // Save cursor position before state update
                    const cursorPos = e.target.selectionStart || 0;
                    cursorPositionRef.current = cursorPos;
                    
                    setIdentifier(e.target.value);
                    setError(null);
                    // Reset to auto when user types so detection can adapt
                    if (identifierType !== 'auto' && e.target.value === '') setIdentifierType('auto');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={resolvedType === 'phone' ? '+91 98765 43210' : 'you@example.com'}
                  disabled={loading}
                  autoFocus={mode === 'signin'}
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm py-3.5"
                  onFocus={() => setIsIdentifierFocused(true)}
                  onBlur={() => setIsIdentifierFocused(false)}
                />
              </FieldRow>
            </div>
            )}

            {/* Password */}
            {mode !== 'forgot' && !(mode === 'signin' && signInMethod === 'otp') && (
            <FieldRow icon={<Lock className="w-4.5 h-4.5" />} label={mode === 'reset' ? 'New password' : 'Password'}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                disabled={loading}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm py-3.5"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="pr-4 text-white/40 hover:text-white/80 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </FieldRow>
            )}

            {mode === 'signin' && signInMethod === 'otp' && otpSent && (
              <FieldRow icon={<Lock className="w-4.5 h-4.5" />} label="OTP code">
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value); setError(null); }}
                  placeholder="6-digit code"
                  disabled={loading}
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm py-3.5"
                />
              </FieldRow>
            )}

            {mode === 'reset' && (
            <FieldRow icon={<Lock className="w-4.5 h-4.5" />} label="Confirm password">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                placeholder="Repeat new password"
                disabled={loading}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm py-3.5"
              />
            </FieldRow>
            )}

            {mode === 'signin' && resolvedType === 'email' && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                  setSuccessMessage(null);
                  setPassword('');
                }}
                className="text-sm text-white/60 hover:text-white text-right w-full -mt-1"
              >
                Forgot password?
              </button>
            )}

            {/* Submit */}
            <button
              onClick={
                mode === 'signin' && signInMethod === 'otp'
                  ? (otpSent ? handleVerifyOtp : handleSendOtp)
                  : mode === 'signin' ? handleSignIn
                  : mode === 'signup' ? handleSignUp
                  : mode === 'forgot' ? handleForgotPassword
                  : handleResetPassword
              }
              disabled={!canSubmit}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                canSubmit
                  ? 'bg-white text-purple-700 hover:bg-white/90 shadow-lg shadow-purple-900/30'
                  : 'bg-white/20 text-white/40 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signin' && signInMethod === 'otp'
                      ? (otpSent ? 'Verify OTP' : 'Send OTP')
                      : mode === 'signin' ? 'Sign In'
                      : mode === 'signup' ? 'Create Account'
                      : mode === 'forgot' ? 'Send reset link'
                      : 'Update password'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Google divider — sign-in only */}
          {mode === 'signin' && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-white/40 text-xs">or continue with</span>
                <div className="flex-1 h-px bg-white/15" />
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-white/95 text-gray-800 rounded-2xl py-3.5 px-6 flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="font-medium text-sm">Continue with Google</span>
                  </>
                )}
              </button>

              <p className="text-white/30 text-xs mt-3 text-center">
                Google sign-in may not work in embedded preview mode.
              </p>
            </>
          )}

          {/* Footer */}
          <p className="text-white/30 text-xs text-center mt-8">
            By continuing you agree to our{' '}
            <a href="#" className="text-white/60 underline">Terms</a> &amp;{' '}
            <a href="#" className="text-white/60 underline">Privacy Policy</a>
          </p>

        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface FieldRowProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}
const FieldRow: React.FC<FieldRowProps> = ({ icon, children }) => (
  <div className="flex items-center bg-white/10 border border-white/15 rounded-2xl px-4 gap-3 focus-within:border-white/40 transition-colors">
    <span className="text-white/50 flex-shrink-0">{icon}</span>
    {children}
  </div>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M19.8055 10.2292C19.8055 9.55156 19.7501 8.86719 19.6323 8.19922H10.2002V12.0489H15.6014C15.3773 13.291 14.6571 14.3898 13.6025 15.0875V17.5866H16.8254C18.7172 15.8449 19.8055 13.2728 19.8055 10.2292Z" fill="#4285F4"/>
    <path d="M10.2002 20.0006C12.9515 20.0006 15.2664 19.1151 16.8294 17.5865L13.6065 15.0874C12.7029 15.6971 11.5493 16.0433 10.2042 16.0433C7.54353 16.0433 5.29193 14.2832 4.50179 11.9141H1.18359V14.4927C2.7884 17.6793 6.31114 20.0006 10.2002 20.0006Z" fill="#34A853"/>
    <path d="M4.49776 11.9141C4.07818 10.6719 4.07818 9.33246 4.49776 8.09027V5.51172H1.18358C-0.210526 8.26984-0.210526 11.7345 1.18358 14.4926L4.49776 11.9141Z" fill="#FBBC04"/>
    <path d="M10.2002 3.95805C11.6241 3.936 13.0001 4.47247 14.0356 5.45722L16.8897 2.60305C15.1777 0.990508 12.9276 0.0808642 10.2002 0.104297C6.31114 0.104297 2.7884 2.42555 1.18359 5.51185L4.49777 8.0904C5.28391 5.71735 7.53951 3.95805 10.2002 3.95805Z" fill="#EA4335"/>
  </svg>
);

export default LoginScreen;