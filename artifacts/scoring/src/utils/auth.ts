// Import shared Supabase client to avoid multiple instances
import { supabase } from './database/supabaseClient';
import { appBaseUrl, publicAnonKey, scoringFunctionsUrl } from './supabase/info';
import { crashLog } from './crashLogger';
import { isTestOtpEnabled, TEST_OTP_CODE } from '../lib/testOtp';

// Re-export supabase for backward compatibility
export { supabase };

export interface VScorUser {
  user_id: string; // Internal UUID
  google_id?: string;
  email: string;
  mobile_number?: string;
  display_name: string;
  profile_photo?: string;
  created_at: string;
  is_verified: boolean;
}

// Cache and debouncing for getCurrentUser
let userCache: VScorUser | null = null;
let userCacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds
let pendingUserRequest: Promise<VScorUser | null> | null = null;

/**
 * Bust the in-memory and localStorage user cache.
 * Call this after any server-side profile mutation (e.g. after a profile merge)
 * so the next getCurrentUser() fetches fresh data instead of the pre-mutation snapshot.
 */
export const clearUserCache = () => {
  userCache = null;
  userCacheTimestamp = 0;
  pendingUserRequest = null;
  localStorage.removeItem('vscor_current_user');
  console.log('🗑️ [clearUserCache] User cache cleared — next call will fetch fresh profile.');
};

// Get current authenticated user with caching and debouncing
export const getCurrentUser = async (): Promise<VScorUser | null> => {
  // Return cached user if still valid
  const now = Date.now();
  if (userCache && (now - userCacheTimestamp) < CACHE_DURATION) {
    console.log('🔐 [getCurrentUser] Returning cached user');
    return userCache;
  }

  // If a request is already pending, return that promise
  if (pendingUserRequest) {
    console.log('🔐 [getCurrentUser] Returning pending request');
    return pendingUserRequest;
  }

  // Create new request
  pendingUserRequest = (async () => {
    try {
      console.log('🔐 [getCurrentUser] ========== START ==========');
      console.log('🔐 [getCurrentUser] Checking Supabase session...');
      
      // Check localStorage first for faster response
      const localUser = localStorage.getItem('vscor_current_user');
      if (localUser && (now - userCacheTimestamp) < CACHE_DURATION) {
        console.log('✅ [getCurrentUser] Found cached user in localStorage');
        const parsed = JSON.parse(localUser);
        userCache = parsed;
        userCacheTimestamp = now;
        return parsed;
      }
      
      // Check Supabase session - with proper error handling
      let session;
      let sessionError;
      
      try {
        const result = await supabase.auth.getSession();
        session = result.data?.session;
        sessionError = result.error;
      } catch (sessionException: any) {
        // Handle session errors gracefully (including AbortError)
        // AbortErrors from lock contention are expected and handled - don't log them
        if (sessionException?.name !== 'AbortError') {
          console.warn('⚠️ [getCurrentUser] Session check exception:', sessionException?.message);
        }
        
        if (localUser) {
          const parsed = JSON.parse(localUser);
          userCache = parsed;
          userCacheTimestamp = now;
          return parsed;
        }
        
        // If it's an AbortError, just return null quietly
        if (sessionException?.name === 'AbortError') {
          return null;
        }
        
        sessionError = sessionException;
      }
      
      console.log('🔐 [getCurrentUser] getSession completed');
      console.log('🔐 [getCurrentUser] Session exists:', !!session);
      
      if (sessionError) {
        console.error('❌ [getCurrentUser] Session error:', sessionError);
        
        // Check localStorage fallback
        if (localUser) {
          console.log('✅ [getCurrentUser] Found cached user in localStorage');
          const parsed = JSON.parse(localUser);
          userCache = parsed;
          userCacheTimestamp = now;
          return parsed;
        }
        return null;
      }
      
      if (!session) {
        console.log('⚠️ [getCurrentUser] No active session');
        // Check localStorage fallback
        if (localUser) {
          console.log('✅ [getCurrentUser] Found cached user in localStorage');
          const parsed = JSON.parse(localUser);
          userCache = parsed;
          userCacheTimestamp = now;
          return parsed;
        }
        return null;
      }

      console.log('✅ [getCurrentUser] Found session for user:', session.user.id);
      console.log('🔐 [getCurrentUser] User email:', session.user.email);

      // Get or create VScor user profile
      const user = session.user;
      const serverUrl = scoringFunctionsUrl;
      
      console.log('📝 [getCurrentUser] Calling /users/profile endpoint...');
      
      try {
        const response = await fetch(`${serverUrl}/users/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            access_token: session.access_token,
            google_id: user.id,
            email: user.email,
            display_name: user.user_metadata?.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
            profile_photo: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          }),
        });

        console.log('📝 [getCurrentUser] Server response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [getCurrentUser] Server error response:', errorText);
          
          // Don't fail completely - return basic user info
          const basicUser: VScorUser = {
            user_id: user.id,
            google_id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
            profile_photo: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            created_at: new Date().toISOString(),
            is_verified: true,
          };
          
          console.log('⚠️ [getCurrentUser] Using basic user info instead:', basicUser);
          localStorage.setItem('vscor_current_user', JSON.stringify(basicUser));
          userCache = basicUser;
          userCacheTimestamp = now;
          return basicUser;
        }

        const vscorUser = await response.json();
        console.log('✅ [getCurrentUser] User profile synced successfully');
        console.log('✅ [getCurrentUser] User email:', vscorUser.email);
        console.log('✅ [getCurrentUser] User ID:', vscorUser.user_id);
        
        // CRITICAL: Normalize user_id to ALWAYS be the Supabase auth UUID.
        // The server may have stored a legacy random UUID; we override it here
        // so getCurrentUserId() always returns session.user.id consistently.
        vscorUser.user_id = user.id;
        
        // Cache in localStorage and memory
        localStorage.setItem('vscor_current_user', JSON.stringify(vscorUser));
        userCache = vscorUser;
        userCacheTimestamp = now;
        
        console.log('🔐 [getCurrentUser] ========== SUCCESS ==========');
        return vscorUser;
      } catch (fetchError: any) {
        console.error('❌ [getCurrentUser] Fetch exception:', fetchError);
        
        // Return basic user info if server call fails
        const basicUser: VScorUser = {
          user_id: user.id,
          google_id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          profile_photo: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          created_at: new Date().toISOString(),
          is_verified: true,
        };
        
        console.log('⚠️ [getCurrentUser] Using basic user info due to fetch error:', basicUser);
        localStorage.setItem('vscor_current_user', JSON.stringify(basicUser));
        userCache = basicUser;
        userCacheTimestamp = now;
        return basicUser;
      }
    } catch (error: any) {
      // Handle AbortError gracefully (silently - it's expected from lock contention)
      if (error?.name === 'AbortError') {
        const localUser = localStorage.getItem('vscor_current_user');
        if (localUser) {
          const parsed = JSON.parse(localUser);
          userCache = parsed;
          userCacheTimestamp = now;
          return parsed;
        }
        return null;
      }
      
      console.error('❌ [getCurrentUser] Top-level exception:', error);
      console.error('❌ [getCurrentUser] Error type:', typeof error);
      console.error('❌ [getCurrentUser] Error message:', error?.message);
      console.log('🔐 [getCurrentUser] ========== FAILED ==========');
      return null;
    } finally {
      // Clear pending request
      pendingUserRequest = null;
    }
  })();

  return pendingUserRequest;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    crashLog.info('🔐 [signInWithGoogle] Starting Google OAuth flow...');
    crashLog.info('🔐 [signInWithGoogle] Window origin: ' + window.location.origin);
    crashLog.info('🔐 [signInWithGoogle] Detecting if running in iframe...');
    
    const isInIframe = window.self !== window.top;
    crashLog.info('🔐 [signInWithGoogle] Running in iframe: ' + isInIframe);
    
    // Check if supabase client is initialized
    if (!supabase) {
      crashLog.error('❌ [signInWithGoogle] Supabase client not initialized');
      return { success: false, error: 'Authentication service not available' };
    }
    
    // For iframe environments (like Figma), we need to open OAuth in a new window
    // Google blocks OAuth redirects in iframes for security
    if (isInIframe) {
      crashLog.info('🔐 [signInWithGoogle] Using popup window for iframe compatibility');
      
      // Open OAuth in a popup window
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: appBaseUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        crashLog.error('❌ [signInWithGoogle] OAuth error', {
          message: error.message,
          code: error.code,
        });
        return { success: false, error: error.message };
      }

      if (data?.url) {
        crashLog.info('✅ [signInWithGoogle] Opening OAuth popup');
        crashLog.info('📋 [signInWithGoogle] OAuth URL: ' + data.url);
        
        // Open popup
        const popup = window.open(
          data.url,
          'Google Sign In',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
        );

        if (!popup) {
          crashLog.error('❌ [signInWithGoogle] Popup blocked by browser');
          return { 
            success: false, 
            error: 'Popup blocked. Please allow popups for this site.' 
          };
        }

        // Listen for the OAuth callback
        crashLog.info('🔐 [signInWithGoogle] Waiting for OAuth callback...');
        
        return new Promise((resolve) => {
          let resolved = false;
          
          // Poll for session while popup is open
          const checkSession = setInterval(async () => {
            try {
              crashLog.info('🔐 [signInWithGoogle] Polling for session...');
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              
              if (session && !resolved) {
                resolved = true;
                clearInterval(checkSession);
                crashLog.info('✅ [signInWithGoogle] Session found during polling!');
                if (!popup.closed) {
                  popup.close();
                }
                resolve({ success: true });
              } else if (sessionError) {
                crashLog.error('❌ [signInWithGoogle] Session error during polling:', sessionError);
              }
            } catch (e) {
              crashLog.error('❌ [signInWithGoogle] Error polling session:', e);
            }
          }, 1000); // Check every second
          
          // Also check when popup closes
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              clearInterval(checkSession);
              
              if (!resolved) {
                crashLog.info('🔐 [signInWithGoogle] Popup closed, doing final session check...');
                
                // Wait a bit for session to sync, then check one more time
                setTimeout(async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session && !resolved) {
                    resolved = true;
                    crashLog.info('✅ [signInWithGoogle] Session found after popup closed!');
                    resolve({ success: true });
                  } else if (!resolved) {
                    resolved = true;
                    crashLog.error('❌ [signInWithGoogle] No session after popup closed');
                    resolve({ success: false, error: 'Authentication cancelled or failed' });
                  }
                }, 2000); // Wait 2 seconds for session to sync
              }
            }
          }, 500);

          // Timeout after 5 minutes
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              clearInterval(checkPopup);
              clearInterval(checkSession);
              if (!popup.closed) {
                popup.close();
              }
              crashLog.error('❌ [signInWithGoogle] OAuth timeout');
              resolve({ success: false, error: 'Authentication timeout' });
            }
          }, 5 * 60 * 1000);
        });
      }
      
      return { success: false, error: 'No OAuth URL returned' };
    }
    
    // Standard redirect flow for non-iframe environments
    crashLog.info('🔐 [signInWithGoogle] Using standard redirect flow');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: appBaseUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      crashLog.error('❌ [signInWithGoogle] OAuth error', {
        message: error.message,
        code: error.code,
      });
      return { success: false, error: error.message };
    }

    crashLog.info('✅ [signInWithGoogle] OAuth redirect initiated');
    crashLog.info('📋 [signInWithGoogle] About to redirect to Google...')
    return { success: true };
  } catch (error: any) {
    crashLog.error('❌ [signInWithGoogle] Exception caught', {
      message: error?.message,
      type: typeof error,
    });
    return { success: false, error: error?.message || String(error) };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string; existing_player_profiles?: any[] }> => {
  try {
    crashLog.info('🔐 [signUpWithEmail] Starting email signup...');
    crashLog.info('📧 [signUpWithEmail] Email: ' + email);
    crashLog.info('👤 [signUpWithEmail] Display Name: ' + displayName);
    
    // Call backend to create user with auto-confirmed email (Admin API)
    const response = await fetch(
      `${scoringFunctionsUrl}/auth/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      crashLog.error('❌ [signUpWithEmail] Signup failed:', result.error);
      return { success: false, error: result.error || 'Signup failed' };
    }

    crashLog.info('✅ [signUpWithEmail] User created on backend');
    crashLog.info('📋 [signUpWithEmail] User ID: ' + result.user.id);
    
    // Now sign in with the credentials
    crashLog.info('🔐 [signUpWithEmail] Auto-signing in...');
    const signInResult = await signInWithEmail(email, password);
    
    if (!signInResult.success) {
      crashLog.error('❌ [signUpWithEmail] Auto-signin failed:', signInResult.error);
      return { 
        success: false, 
        error: 'Account created but auto-signin failed. Please try signing in manually.' 
      };
    }
    
    crashLog.info('✅ [signUpWithEmail] Signup and signin complete!');

    // Pass existing_player_profiles back so the UI can prompt for merge
    const existingProfiles: any[] = result.existing_player_profiles || [];
    return { success: true, existing_player_profiles: existingProfiles };
  } catch (error: any) {
    crashLog.error('❌ [signUpWithEmail] Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
};

// Sign up with phone number and password
// The server synthesises a virtual email (<digits>@vscor.phone) for Supabase Auth
// and stores the real phone number in user/player metadata.
export const signUpWithPhone = async (phone: string, password: string, displayName: string): Promise<{ success: boolean; error?: string; existing_player_profiles?: any[] }> => {
  try {
    crashLog.info('🔐 [signUpWithPhone] Starting phone signup: ' + phone);

    const response = await fetch(
      `${scoringFunctionsUrl}/auth/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          phone,          // raw phone — server normalises and synthesises email
          password,
          display_name: displayName,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      crashLog.error('❌ [signUpWithPhone] Signup failed:', result.error);
      return { success: false, error: result.error || 'Signup failed' };
    }

    crashLog.info('✅ [signUpWithPhone] User created on backend: ' + result.user.id);

    // Auto sign-in using the synthesised email + password
    const normalizedPhone = phone.replace(/\D/g, '');
    const syntheticEmail = `${normalizedPhone}@vscor.phone`;
    const signInResult = await signInWithEmail(syntheticEmail, password);

    if (!signInResult.success) {
      crashLog.error('❌ [signUpWithPhone] Auto-signin failed:', signInResult.error);
      return {
        success: false,
        error: 'Account created but auto-signin failed. Please try signing in manually.',
      };
    }

    crashLog.info('✅ [signUpWithPhone] Signup and signin complete!');
    const existingProfiles: any[] = result.existing_player_profiles || [];
    return { success: true, existing_player_profiles: existingProfiles };
  } catch (error: any) {
    crashLog.error('❌ [signUpWithPhone] Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
};

// Sign in with phone number and password
// Reconstructs the synthetic email used during phone-based signup.
export const signInWithPhonePassword = async (phone: string, password: string): Promise<{ success: boolean; error?: string; existing_player_profiles?: any[]; display_name?: string }> => {
  try {
    crashLog.info('🔐 [signInWithPhonePassword] Starting phone signin: ' + phone);
    const normalizedPhone = phone.replace(/\D/g, '');
    const syntheticEmail = `${normalizedPhone}@vscor.phone`;
    // Pass the original phone so the unlinked-profile check can match by number
    return await signInWithEmail(syntheticEmail, password, phone);
  } catch (error: any) {
    crashLog.error('❌ [signInWithPhonePassword] Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
};

// Sign in with email and password
// Accepts an optional `originalPhone` which is forwarded to the server when
// the caller is a phone-based login (synthetic email).
export const signInWithEmail = async (
  email: string,
  password: string,
  originalPhone?: string,
): Promise<{ success: boolean; error?: string; existing_player_profiles?: any[]; display_name?: string }> => {
  try {
    crashLog.info('🔐 [signInWithEmail] Starting email signin...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      crashLog.error('❌ [signInWithEmail] Signin error:', error);
      return { success: false, error: error.message };
    }

    if (data.session) {
      crashLog.info('✅ [signInWithEmail] Signin successful');

      // ── Check for unclaimed player profiles that match this user ────────────
      // This runs on EVERY successful sign-in so that users who previously
      // skipped the merge dialog (or who had profiles added after their first
      // login) always get a chance to claim matching profiles.
      let existingPlayerProfiles: any[] = [];
      const displayName: string =
        data.session.user.user_metadata?.display_name ||
        data.session.user.user_metadata?.name ||
        email.split('@')[0] ||
        'User';

      try {
        const serverUrl = scoringFunctionsUrl;
        const checkRes = await fetch(`${serverUrl}/auth/check-unlinked-profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            access_token: data.session.access_token,
            phone: originalPhone || undefined,
          }),
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          existingPlayerProfiles = checkData.profiles || [];
          crashLog.info(`🔍 [signInWithEmail] Unlinked profiles found: ${existingPlayerProfiles.length}`);
        } else {
          crashLog.error('⚠️ [signInWithEmail] check-unlinked-profiles call failed (non-fatal)');
        }
      } catch (checkErr: any) {
        // Non-fatal — proceed with normal login if the check fails
        crashLog.error('⚠️ [signInWithEmail] check-unlinked-profiles exception (non-fatal):', checkErr?.message);
      }
      // ────────────────────────────────────────────────────────────────────────

      return { success: true, existing_player_profiles: existingPlayerProfiles, display_name: displayName };
    }

    return { success: false, error: 'Failed to sign in' };
  } catch (error: any) {
    crashLog.error('❌ [signInWithEmail] Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
};

// Sign in with phone (OTP)
export const signInWithPhone = async (phoneNumber: string): Promise<{ success: boolean; error?: string; testMode?: boolean }> => {
  try {
    const normalized = phoneNumber.replace(/\D/g, '');

    if (isTestOtpEnabled()) {
      crashLog.info(`🔐 [signInWithPhone] Test OTP mode — skip SMS for ${normalized}`);
      return { success: true, testMode: true };
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${normalized}`,
    });

    if (error) {
      console.error('Phone sign-in error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Phone sign-in error:', error);
    return { success: false, error: String(error) };
  }
};

async function verifyTestPhoneOtp(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  const normalized = phoneNumber.replace(/\D/g, '');
  try {
    const response = await fetch(`${scoringFunctionsUrl}/auth/test-phone-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ phone: normalized, otp: TEST_OTP_CODE }),
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || 'Test OTP sign-in failed' };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: result.token_hash,
      type: 'magiclink',
    });

    if (error) {
      crashLog.error('❌ [verifyTestPhoneOtp] Session error:', error);
      return { success: false, error: error.message };
    }

    if (data.session) {
      await getCurrentUser();
      return { success: true };
    }

    return { success: false, error: 'Could not start session' };
  } catch (error: any) {
    crashLog.error('❌ [verifyTestPhoneOtp] Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

// Verify OTP
export const verifyOtp = async (phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const normalized = phoneNumber.replace(/\D/g, '');

    if (isTestOtpEnabled() && otp.trim() === TEST_OTP_CODE) {
      return verifyTestPhoneOtp(normalized);
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${normalized}`,
      token: otp,
      type: 'sms',
    });

    if (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: error.message };
    }

    if (data.session) {
      // Create/update user profile
      await getCurrentUser();
      return { success: true };
    }

    return { success: false, error: 'Invalid OTP' };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, error: String(error) };
  }
};

// Request a password reset email (email accounts only)
export const requestPasswordReset = async (
  email: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const trimmed = email.trim();
    if (!trimmed) {
      return { success: false, error: 'Enter your email address' };
    }

    const redirectTo = appBaseUrl();
    crashLog.info('🔐 [requestPasswordReset] Sending reset email, redirect: ' + redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });

    if (error) {
      crashLog.error('❌ [requestPasswordReset] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    crashLog.error('❌ [requestPasswordReset] Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
};

// Set a new password after following the reset email link
export const updatePassword = async (
  newPassword: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      crashLog.error('❌ [updatePassword] Error:', error);
      return { success: false, error: error.message };
    }

    clearUserCache();
    return { success: true };
  } catch (error: any) {
    crashLog.error('❌ [updatePassword] Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
  localStorage.removeItem('vscor_current_user');
  // Clear memory cache
  userCache = null;
  userCacheTimestamp = 0;
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

// Get user ID (for ownership tracking)
export const getCurrentUserId = (): string | null => {
  const userStr = localStorage.getItem('vscor_current_user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    return user.user_id;
  } catch {
    return null;
  }
};