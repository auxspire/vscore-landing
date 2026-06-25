import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { timeout } from "npm:hono/timeout";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

// Suppress harmless connection closed errors at the global level
globalThis.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (error?.name === 'Http' || 
      error?.code === 'EPIPE' ||
      error?.message?.includes('broken pipe') ||
      error?.message?.includes('connection closed') || 
      error?.message?.includes('message completed')) {
    // Prevent default logging for these expected errors
    event.preventDefault();
  }
  
  // Also suppress 504 timeout errors from middleware
  if (error instanceof Response && error.status === 504) {
    event.preventDefault();
  }
  
  // Suppress Promise-wrapped 504 responses
  if (error instanceof Promise) {
    error.then((resolved) => {
      if (resolved instanceof Response && resolved.status === 504) {
        // This is expected, don't log
      }
    }).catch(() => {
      // Ignore
    });
    event.preventDefault();
  }
});

// Override console.error to filter out Deno runtime connection errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args.join(' ');
  
  // Filter out connection closed errors from Deno runtime
  if (
    message.includes('Http: connection closed') ||
    message.includes('Http: error writing') ||
    message.includes('broken pipe') ||
    message.includes('EPIPE') ||
    message.includes('connection closed before message completed') ||
    (args[0]?.name === 'Http' && (args[0]?.message?.includes('connection closed') || args[0]?.code === 'EPIPE'))
  ) {
    // Silently ignore these - they're normal when clients disconnect
    return;
  }
  
  // Log all other errors normally
  originalConsoleError.apply(console, args);
};

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Global error handler for connection closed errors
app.onError((err, c) => {
  // Silently ignore connection closed errors - these are expected with aggressive polling
  if (err.message?.includes('connection closed') || 
      err.name === 'Http' || 
      err.message?.includes('stream') ||
      err.message?.includes('closed') ||
      err.message?.includes('aborted')) {
    // Don't log these - they're normal when clients cancel requests
    return new Response('', { status: 499 }); // 499 Client Closed Request
  }
  
  console.error('[server] Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Enable logger
app.use('*', logger(console.log));

// Add timeout middleware with different timeouts for different routes
app.use('*', async (c, next) => {
  const path = c.req.path;
  
  // Bulk sync endpoint needs more time (fetches 7 data types)
  if (path.includes('/sync') && c.req.method === 'GET' && !path.includes('/sync/')) {
    const timeoutMs = 15000; // 15 seconds for bulk GET /sync
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.warn('[server] Request timeout - exceeded 15 seconds:', path);
        reject(c.json({ error: 'Request timeout' }, 504));
      }, timeoutMs);
    });
    
    return Promise.race([next(), timeoutPromise]) as Promise<Response>;
  }
  
  // Individual sync PUT/GET endpoints need moderate time (for large datasets)
  if (path.includes('/sync/') && (c.req.method === 'PUT' || c.req.method === 'GET')) {
    const timeoutMs = 12000; // 12 seconds for individual sync operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.warn('[server] Request timeout - exceeded 12 seconds:', path);
        reject(c.json({ error: 'Request timeout' }, 504));
      }, timeoutMs);
    });
    
    return Promise.race([next(), timeoutPromise]) as Promise<Response>;
  }
  
  // All other requests have 5 second timeout
  const timeoutMs = 5000;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      console.warn('[server] Request timeout - exceeded 5 seconds:', path);
      reject(c.json({ error: 'Request timeout' }, 504));
    }, timeoutMs);
  });
  
  return Promise.race([next(), timeoutPromise]) as Promise<Response>;
});

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-845a157a/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

// Sign up new user with auto-confirmation (Admin API)
app.post("/make-server-845a157a/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email: rawEmail, phone: rawPhone, password, display_name } = body;

    // Resolve the canonical email used for Supabase Auth.
    // If a phone number is provided instead of email we synthesise a
    // deterministic email so the rest of the signup logic stays unchanged.
    const isPhoneSignup = !rawEmail && !!rawPhone;
    const normalizedPhone = rawPhone ? rawPhone.replace(/\D/g, '') : null;
    const email: string = rawEmail || `${normalizedPhone}@vscor.phone`;

    console.log('🔐 [signup] Creating new user:', isPhoneSignup ? `phone:${normalizedPhone}` : email);

    // Check if user already exists in Supabase Auth
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === email);
      
      if (userExists) {
        console.log('⚠️ [signup] User already exists:', email);
        return c.json({ 
          error: isPhoneSignup
            ? 'This phone number is already registered. Please sign in instead.'
            : 'This email is already registered. Please sign in instead.'
        }, 400);
      }
    } catch (listError) {
      console.error('⚠️ [signup] Error checking existing users:', listError);
      // Continue anyway - the createUser will catch duplicates
    }

    // Use Admin API to create user with auto-confirmation
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: display_name,
        ...(isPhoneSignup ? { phone: normalizedPhone } : {}),
      },
    });

    if (error) {
      console.error('❌ [signup] Error creating user:', error);
      
      // Check for duplicate email error codes
      if (error.code === 'email_exists' || 
          error.status === 422 ||
          error.message.includes('already') || 
          error.message.includes('registered') ||
          error.message.includes('email address has already been registered')) {
        return c.json({ 
          error: isPhoneSignup
            ? 'This phone number is already registered. Please sign in instead.'
            : 'This email is already registered. Please sign in instead.'
        }, 400);
      }
      
      // Check for weak password
      if (error.message.includes('password') && error.message.includes('weak')) {
        return c.json({ 
          error: 'Password is too weak. Please use at least 6 characters.' 
        }, 400);
      }
      
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      console.error('❌ [signup] No user data returned');
      return c.json({ error: 'Failed to create user' }, 500);
    }

    console.log('✅ [signup] User created:', data.user.id);
    console.log('📧 [signup] Email confirmed:', data.user.email_confirmed_at);

    // Check if VScor profile already exists
    const existingProfiles = await kv.getByPrefix('user:');
    let vscorUser = existingProfiles.find(u => u.email === email || u.google_id === data.user.id);

    if (!vscorUser) {
      // Create VScor user profile
      const userId = crypto.randomUUID();
      vscorUser = {
        user_id: userId,
        google_id: data.user.id, // Store Supabase auth ID
        email: rawEmail || email, // store real email if provided; else synthetic
        phone: normalizedPhone || null,
        mobile_number: normalizedPhone || null,
        display_name: display_name,
        profile_photo: null,
        created_at: new Date().toISOString(),
        is_verified: true,
      };

      await kv.set(`user:${userId}`, vscorUser);
      console.log(`✅ [signup] Created VScor profile: ${userId}`);
    } else {
      console.log(`✅ [signup] Using existing VScor profile: ${vscorUser.user_id}`);
    }

    // ── Check for existing player profiles that match the sign-up email/phone ─
    // Instead of auto-creating a player profile unconditionally, we look for
    // any existing profiles (created from squad selection, team creation, etc.)
    // that share this email. These are returned to the client so the user can
    // decide whether to merge or keep them separate.
    const canonicalUserId = data.user.id;
    let existingPlayerProfiles: any[] = [];
    let alreadyOwned = false;

    try {
      const allPlayers: any[] = (await kv.get('app_data:players')) || [];

      // Profiles already claimed by this auth user (should be none at first signup)
      const alreadyOwnedProfiles = allPlayers.filter(
        (p: any) => p.owner_user_id === canonicalUserId
      );
      alreadyOwned = alreadyOwnedProfiles.length > 0;

      // ── Flexible phone matching ───────────────────────────────────────────────
      // Player profiles may be stored with or without a country code prefix.
      // e.g. AddPlayer stores "+919876543210" while a user might sign up with
      // just "9876543210".  Comparing the last 10 digits normalises both forms.
      const last10 = (phone: string) => phone.replace(/\D/g, '').slice(-10);
      const signupPhoneLast10 = normalizedPhone ? last10(normalizedPhone) : null;

      console.log(`🔍 [signup] Phone matching — signup digits: ${signupPhoneLast10}, email: ${rawEmail || '(none)'}`);

      // Unowned profiles (no owner_user_id) or profiles whose email/phone matches
      // — these are candidates for merge
      existingPlayerProfiles = allPlayers.filter(
        (p: any) => {
          // Email match — only for real (non-synthetic) email signups
          const emailMatch = rawEmail && p.email && p.email === rawEmail;

          // Phone match — compare last 10 digits to handle country-code variants
          const playerLast10 = p.phoneNumber ? last10(p.phoneNumber) : null;
          const phoneMatch = !!(
            signupPhoneLast10 &&
            playerLast10 &&
            playerLast10.length >= 8 &&         // sanity: ignore very short numbers
            playerLast10 === signupPhoneLast10
          );

          if (phoneMatch) {
            console.log(`📱 [signup] Phone match found — profile "${p.name}" (${p.phoneNumber}) matches ${normalizedPhone}`);
          }

          // Only surfaces unowned profiles OR profiles already claimed by this user
          const isClaimable = !p.owner_user_id || p.owner_user_id === canonicalUserId;
          return (emailMatch || phoneMatch) && isClaimable;
        }
      );

      if (!alreadyOwned && existingPlayerProfiles.length === 0) {
        // No existing profile at all — create a fresh owned one immediately
        const now = new Date().toISOString();
        const newPlayerProfile = {
          id: Date.now() * 1000 + Math.floor(Math.random() * 999),
          name: display_name,
          email: rawEmail || '',
          phoneNumber: normalizedPhone || '',
          jerseyNumber: '',
          position: '',
          teamId: null,
          teamName: null,
          teams: [],
          owner_user_id: canonicalUserId,
          created_by: canonicalUserId,
          updated_by: canonicalUserId,
          created_at: now,
          updated_at: now,
          auto_created: true,
        };
        const updatedPlayers = [...allPlayers, newPlayerProfile];
        await kv.set('app_data:players', updatedPlayers);
        console.log(`✅ [signup] Auto-created fresh player profile for: ${display_name} (${email})`);
      } else if (alreadyOwned) {
        console.log(`ℹ️ [signup] User already owns a player profile, skipping auto-create`);
        existingPlayerProfiles = []; // nothing to merge
      } else {
        console.log(`ℹ️ [signup] Found ${existingPlayerProfiles.length} unowned profile(s) matching email/phone — prompting user to merge`);
      }
    } catch (playerErr) {
      console.error('⚠️ [signup] Player profile check failed (non-fatal):', playerErr);
    }
    // ─────────────────────────────────────────────────────────────────────────

    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        display_name: display_name,
      },
      // Non-empty only when there are unowned profiles matching the email.
      // The client should show a merge dialog in this case.
      existing_player_profiles: existingPlayerProfiles,
    });
  } catch (error) {
    console.error('❌ [signup] Exception:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ── Link (merge) or separate a player profile after signup ───────────────────
// Called by the client after the user decides whether to claim an existing
// player profile or create a new separate one.
app.post("/make-server-845a157a/auth/link-player-profile", async (c) => {
  try {
    const body = await c.req.json();
    const { access_token, player_profile_id, action, display_name, email, phone } = body;
    // action: 'merge' | 'create_new'

    // Verify the caller is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(access_token);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const canonicalUserId = user.id;
    const allPlayers: any[] = (await kv.get('app_data:players')) || [];

    if (action === 'merge' && player_profile_id != null) {
      // Claim the existing profile — set owner_user_id
      const idx = allPlayers.findIndex((p: any) => String(p.id) === String(player_profile_id));
      if (idx === -1) {
        return c.json({ error: 'Player profile not found' }, 404);
      }
      // Guard: do not allow overwriting another user's ownership
      if (allPlayers[idx].owner_user_id && allPlayers[idx].owner_user_id !== canonicalUserId) {
        console.warn(`⛔ [link-player] Profile ${player_profile_id} already owned by ${allPlayers[idx].owner_user_id}, refusing claim by ${canonicalUserId}`);
        return c.json({
          error: 'This profile is already linked to another account. Please create a separate profile instead.',
        }, 409);
      }
      allPlayers[idx] = {
        ...allPlayers[idx],
        owner_user_id: canonicalUserId,
        updated_by: canonicalUserId,
        updated_at: new Date().toISOString(),
      };
      await kv.set('app_data:players', allPlayers);
      console.log(`✅ [link-player] Merged profile ${player_profile_id} → user ${canonicalUserId}`);
      return c.json({ success: true, action: 'merged', profile: allPlayers[idx] });
    }

    if (action === 'create_new') {
      const now = new Date().toISOString();
      // Normalize phone number if provided
      const normalizedPhone = phone ? phone.replace(/\D/g, '') : '';
      const newProfile = {
        id: Date.now() * 1000 + Math.floor(Math.random() * 999),
        name: display_name || user.user_metadata?.display_name || email?.split('@')[0] || 'Player',
        email: email || user.email || '',
        jerseyNumber: '',
        position: '',
        phoneNumber: normalizedPhone,
        teamId: null,
        teamName: null,
        teams: [],
        owner_user_id: canonicalUserId,
        created_by: canonicalUserId,
        updated_by: canonicalUserId,
        created_at: now,
        updated_at: now,
        auto_created: true,
      };
      const updatedPlayers = [...allPlayers, newProfile];
      await kv.set('app_data:players', updatedPlayers);
      console.log(`✅ [link-player] Created new separate profile for user ${canonicalUserId}`);
      return c.json({ success: true, action: 'created_new', profile: newProfile });
    }

    return c.json({ error: 'Invalid action. Use "merge" or "create_new".' }, 400);
  } catch (error) {
    console.error('❌ [link-player] Exception:', error);
    return c.json({ error: String(error) }, 500);
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// ── Check for unlinked player profiles at login time ─────────────────────────
// Called after every successful sign-in so that a user who logs in for the
// second (or later) time can still claim any unclaimed player profiles that
// share their email / phone number.
app.post("/make-server-845a157a/auth/check-unlinked-profiles", async (c) => {
  try {
    const body = await c.req.json();
    const { access_token, phone } = body;

    // Verify caller
    const { data: { user }, error: authError } = await supabase.auth.getUser(access_token);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const canonicalUserId = user.id;
    // email from Supabase Auth — for phone accounts this is the synthetic email
    const authEmail: string = user.email ?? '';
    const isPhoneAccount = authEmail.endsWith('@vscor.phone');

    // Helper: last 10 significant digits
    const last10 = (p: string) => p.replace(/\D/g, '').slice(-10);

    // Derive the real email (non-synthetic) and phone suffix to match against
    const realEmail = isPhoneAccount ? null : authEmail;
    // phone param takes priority; fall back to digits extracted from synthetic email
    const rawPhone = phone || (isPhoneAccount ? authEmail.replace('@vscor.phone', '') : null);
    const signupPhoneLast10 = rawPhone ? last10(rawPhone) : null;

    console.log(`🔍 [check-unlinked] user=${canonicalUserId} realEmail=${realEmail} phoneLast10=${signupPhoneLast10}`);

    const allPlayers: any[] = (await kv.get('app_data:players')) || [];

    // ── KEY FIX ─────────────────────────────────────────────────────────────
    // We must NOT exclude profiles owned by *other* users.
    // Only skip profiles that are already owned by THIS user (already merged).
    // Profiles owned by other users are included with is_claimed_by_other=true
    // so the dialog can show them (as non-selectable) and still offer
    // "Create Separate Profile" to the logging-in user.
    // ─────────────────────────────────────────────────────────────────────────
    const matched = allPlayers.filter((p: any) => {
      // Already merged by this exact user — no need to show again
      if (p.owner_user_id === canonicalUserId) return false;

      const emailMatch = realEmail && p.email && p.email === realEmail;

      const playerLast10 = p.phoneNumber ? last10(p.phoneNumber) : null;
      const phoneMatch = !!(
        signupPhoneLast10 &&
        playerLast10 &&
        playerLast10.length >= 8 &&
        playerLast10 === signupPhoneLast10
      );

      if (phoneMatch || emailMatch) {
        console.log(`📱 [check-unlinked] Match — profile "${p.name}" phone=${p.phoneNumber} owner=${p.owner_user_id || 'none'}`);
      }

      return emailMatch || phoneMatch;
    });

    // Annotate each profile so the client knows whether it's claimable or not
    const profiles = matched.map((p: any) => ({
      ...p,
      // true  → owned by a different user; the dialog should show it as locked
      // false → unowned; can be merged
      is_claimed_by_other: !!(p.owner_user_id && p.owner_user_id !== canonicalUserId),
    }));

    console.log(`📋 [check-unlinked] Returning ${profiles.length} profile(s) (${profiles.filter((p: any) => p.is_claimed_by_other).length} claimed by others)`);

    return c.json({ profiles });
  } catch (error) {
    console.error('❌ [check-unlinked] Exception:', error);
    return c.json({ error: String(error) }, 500);
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// Get or create user profile
app.post("/make-server-845a157a/users/profile", async (c) => {
  try {
    const body = await c.req.json();
    const { access_token, google_id, email, display_name, profile_photo, mobile_number } = body;

    // Verify access token if provided
    if (access_token) {
      const { data: { user }, error } = await supabase.auth.getUser(access_token);
      if (error || !user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
    }

    // The canonical user_id IS the Supabase auth UUID (google_id field).
    // This ensures user_id is always stable and matches session.user.id on the client.
    // Previous versions used crypto.randomUUID() which caused 3 different IDs for the same user.
    const canonicalUserId = google_id; // Supabase auth UUID — never changes for a given user

    // Check if user exists by canonical ID first, then by email as fallback
    const existingUsers = await kv.getByPrefix('user:');
    let vscorUser = null;

    // Priority 1: match by canonical user_id (= google_id = Supabase auth UUID)
    for (const userRecord of existingUsers) {
      if (userRecord.user_id === canonicalUserId || userRecord.google_id === canonicalUserId) {
        vscorUser = userRecord;
        break;
      }
    }
    // Priority 2: match by email (handles accounts created before this fix)
    if (!vscorUser) {
      for (const userRecord of existingUsers) {
        if (userRecord.email === email) {
          vscorUser = userRecord;
          break;
        }
      }
    }

    const now = new Date().toISOString();

    if (!vscorUser) {
      // Create new user — use Supabase auth UUID as user_id
      vscorUser = {
        user_id: canonicalUserId,
        google_id,
        email,
        mobile_number: mobile_number || null,
        display_name,
        profile_photo: profile_photo || null,
        created_at: now,
        is_verified: true,
      };

      await kv.set(`user:${canonicalUserId}`, vscorUser);
      console.log(`✅ Created new user: ${canonicalUserId} (${email})`);
    } else {
      // Update existing user — also migrate old random-UUID key to canonical key
      const oldId = vscorUser.user_id;
      vscorUser = {
        ...vscorUser,
        user_id: canonicalUserId, // Normalise to Supabase auth UUID
        google_id: google_id || vscorUser.google_id,
        display_name: display_name || vscorUser.display_name,
        profile_photo: profile_photo || vscorUser.profile_photo,
        mobile_number: mobile_number || vscorUser.mobile_number,
        is_verified: true,
      };

      await kv.set(`user:${canonicalUserId}`, vscorUser);
      // Remove old key if it was a different (legacy random) UUID
      if (oldId && oldId !== canonicalUserId) {
        await kv.del(`user:${oldId}`);
        console.log(`🔄 Migrated user key: ${oldId} → ${canonicalUserId} (${email})`);
      } else {
        console.log(`✅ Updated user: ${canonicalUserId} (${email})`);
      }
    }

    return c.json(vscorUser);
  } catch (error) {
    console.error('Error in /users/profile:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user by ID
app.get("/make-server-845a157a/users/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const user = await kv.get(`user:${userId}`);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error('Error in /users/:userId:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Verify user phone/email
app.post("/make-server-845a157a/users/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, verification_type, verification_value } = body;

    const user = await kv.get(`user:${user_id}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update verification status
    user.is_verified = true;
    if (verification_type === 'phone') {
      user.mobile_number = verification_value;
    }

    await kv.set(`user:${user_id}`, user);

    return c.json({ success: true, user });
  } catch (error) {
    console.error('Error in /users/verify:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============================================
// DATA SYNC ENDPOINTS
// ============================================

// Supported data types
const SYNC_DATA_TYPES = ['players', 'teams', 'tournaments', 'ongoing_matches', 'completed_matches', 'master_teams', 'tournament_teams'];

// GET - Retrieve synced data for a given type
app.get("/make-server-845a157a/sync/:type", async (c) => {
  try {
    const type = c.req.param('type');
    if (!SYNC_DATA_TYPES.includes(type)) {
      return c.json({ error: `Invalid data type: ${type}` }, 400);
    }
    
    // Check if client has disconnected
    if (c.req.raw.signal?.aborted) {
      return new Response('', { status: 499 });
    }
    
    const data = await kv.get(`app_data:${type}`);
    
    // Check again before responding
    if (c.req.raw.signal?.aborted) {
      return new Response('', { status: 499 });
    }
    
    return c.json({ data: data || [] });
  } catch (error) {
    console.error(`[sync GET] Error for type ${c.req.param('type')}:`, error);
    return c.json({ error: String(error) }, 500);
  }
});

// PUT - Save/overwrite synced data for a given type (requires auth)
app.put("/make-server-845a157a/sync/:type", async (c) => {
  try {
    const type = c.req.param('type');
    if (!SYNC_DATA_TYPES.includes(type)) {
      return c.json({ error: `Invalid data type: ${type}` }, 400);
    }

    // Check if client has disconnected early
    if (c.req.raw.signal?.aborted) {
      console.log(`[sync PUT] Client disconnected before processing ${type}`);
      return new Response('', { status: 499 });
    }

    // The Authorization header carries the publicAnonKey (validated by the Supabase Gateway).
    // The user's JWT is passed in X-User-Token for additional server-side identity verification.
    const authHeader = c.req.header('Authorization') ?? '';
    const userToken = c.req.header('X-User-Token');

    // Require at minimum a valid Authorization header (gateway already validated it)
    if (!authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - missing authorization' }, 401);
    }

    // If a user token is provided, validate it for identity.
    // If validation fails (e.g. transient Supabase Auth issue), fall through
    // to anon-key-only access since the gateway already authenticated the request.
    let userId: string | null = null;
    if (userToken) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
        if (authError) {
          console.log(`[sync PUT] getUser warning for ${type}: ${authError.message} — proceeding with anon-key auth`);
        } else if (user) {
          userId = user.id;
        }
      } catch (e) {
        console.log(`[sync PUT] getUser exception for ${type}: ${e} — proceeding with anon-key auth`);
      }
    }

    // Check again before reading body
    if (c.req.raw.signal?.aborted) {
      console.log(`[sync PUT] Client disconnected before reading body for ${type}`);
      return new Response('', { status: 499 });
    }

    // Try to read the body with error handling
    let body;
    try {
      body = await c.req.json();
    } catch (bodyError) {
      // More specific error message for body parsing issues
      console.error(`[sync PUT] Error parsing JSON body for ${type}:`, bodyError);
      
      // Check if it was an abort/disconnect
      if (c.req.raw.signal?.aborted) {
        console.log(`[sync PUT] Client disconnected while reading body for ${type}`);
        return new Response('', { status: 499 });
      }
      
      // Otherwise it's a malformed request
      return c.json({ 
        error: 'Failed to parse request body. Please ensure data is valid JSON.',
        details: String(bodyError)
      }, 400);
    }
    
    const { data } = body;

    if (!Array.isArray(data)) {
      return c.json({ error: 'Data must be an array' }, 400);
    }

    // Final check before saving
    if (c.req.raw.signal?.aborted) {
      console.log(`[sync PUT] Client disconnected before saving ${type}`);
      return new Response('', { status: 499 });
    }

    // Try to save with retry logic for transient database errors
    let saveAttempt = 0;
    const maxRetries = 2;
    let lastError = null;
    
    while (saveAttempt < maxRetries) {
      try {
        await kv.set(`app_data:${type}`, data);
        console.log(`[sync PUT] Saved ${data.length} ${type} records (userId: ${userId ?? 'anon'})${saveAttempt > 0 ? ` (retry ${saveAttempt})` : ''}`);
        return c.json({ success: true, count: data.length });
      } catch (kvError: any) {
        lastError = kvError;
        saveAttempt++;
        
        // Check if it's a database connectivity issue (502 Bad Gateway)
        const errorMsg = String(kvError);
        if (errorMsg.includes('502') || errorMsg.includes('Bad gateway') || errorMsg.includes('connection')) {
          if (saveAttempt < maxRetries) {
            console.warn(`[sync PUT] Database error for ${type} (attempt ${saveAttempt}/${maxRetries}), retrying...`);
            // Wait a bit before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 200 * saveAttempt));
            continue;
          } else {
            console.error(`[sync PUT] Database unavailable after ${maxRetries} attempts for ${type}. Data is safely stored on client.`);
            // Return success to client even though server save failed
            // Client has the data locally, this is just a sync failure
            return c.json({ 
              success: true, 
              count: data.length,
              warning: 'Server temporarily unavailable, data saved locally only'
            }, 202); // 202 Accepted
          }
        }
        
        // For other errors, throw immediately
        throw kvError;
      }
    }
    
    // If we get here, all retries failed
    throw lastError;
  } catch (error) {
    console.error(`[sync PUT] Error for type ${c.req.param('type')}:`, error);
    
    // Check if error is due to client disconnect
    if (error.name === 'Http' || error.message?.includes('end of file')) {
      return new Response('', { status: 499 });
    }
    
    // Log the full error for debugging
    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error(`[sync PUT] Full error details:`, errorDetails);
    
    return c.json({ 
      error: 'Database error occurred. Your data is safe locally.',
      details: errorDetails.substring(0, 200) // Limit error message size
    }, 503); // 503 Service Unavailable
  }
});

// GET all sync data at once (for initial load)
app.get("/make-server-845a157a/sync", async (c) => {
  try {
    // Early return if client disconnected
    if (c.req.raw.signal?.aborted) {
      return new Response('', { status: 499 });
    }
    
    console.log('[sync GET all] Starting bulk data fetch...');
    const startTime = Date.now();
    
    // Fetch all data types in parallel for better performance
    const fetchPromises = SYNC_DATA_TYPES.map(async (type) => {
      try {
        const data = await kv.get(`app_data:${type}`);
        return { type, data: data || [] };
      } catch (kvError: any) {
        // Handle 502/503 errors gracefully - return empty array for this type
        console.warn(`[sync GET] KV error for ${type}, returning empty array:`, kvError.message?.substring(0, 100));
        return { type, data: [] };
      }
    });
    
    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);
    
    // Check if client disconnected during fetch
    if (c.req.raw.signal?.aborted) {
      return new Response('', { status: 499 });
    }
    
    // Convert array of results to object
    const result: Record<string, any[]> = {};
    for (const { type, data } of results) {
      result[type] = data;
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`[sync GET all] ✅ Fetched all data in ${elapsed}ms`);
    
    return c.json(result);
  } catch (error) {
    console.error('[sync GET all] Error:', error);
    // Return 503 instead of 500 for temporary server issues
    return c.json({ 
      error: 'Server temporarily unavailable. Your app will continue working with local data.',
      retryAfter: 60 
    }, 503);
  }
});

// ============================================
// EVENT-LEVEL SYNC ENDPOINTS (for dual-scorer matches)
// ============================================

/**
 * POST /match-events/:matchId - Add a single event to a match
 * This enables event-level syncing without overwriting the entire match state
 */
app.post("/make-server-845a157a/match-events/:matchId", async (c) => {
  try {
    const matchId = c.req.param('matchId');
    
    // Check if client has disconnected
    if (c.req.raw.signal?.aborted) {
      return new Response('', { status: 499 });
    }
    
    // Verify user token
    const userToken = c.req.header('X-User-Token');
    if (!userToken) {
      return c.json({ error: 'Unauthorized - user token required' }, 401);
    }
    
    let userId: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
      if (authError || !user) {
        return c.json({ error: 'Invalid user token' }, 401);
      }
      userId = user.id;
    } catch (e) {
      return c.json({ error: 'Authentication failed' }, 401);
    }
    
    const body = await c.req.json();
    const { event } = body;
    
    if (!event) {
      return c.json({ error: 'Event data required' }, 400);
    }
    
    // Get the event table key for this match
    const eventsKey = `match_events:${matchId}`;
    let matchEvents: any[] = (await kv.get(eventsKey)) || [];
    
    // Add timestamp and recorded_by if not present
    const eventToStore = {
      ...event,
      recorded_by: event.recorded_by || userId,
      timestamp: event.timestamp || new Date().toISOString(),
      synced_at: new Date().toISOString(),
    };
    
    // Append the new event (events are prepended in the UI, but stored in append order)
    matchEvents.push(eventToStore);
    
    // Save back to KV store
    await kv.set(eventsKey, matchEvents);
    
    console.log(`[match-events] ✅ Added event ${event.id} to match ${matchId} by user ${userId}`);
    
    return c.json({ 
      success: true, 
      event: eventToStore,
      total_events: matchEvents.length 
    });
  } catch (error) {
    console.error(`[match-events POST] Error:`, error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * GET /match-events/:matchId - Get all events for a match
 */
app.get("/make-server-845a157a/match-events/:matchId", async (c) => {
  try {
    const matchId = c.req.param('matchId');
    
    // Check if client has disconnected
    if (c.req.raw.signal?.aborted) {
      return new Response('', { status: 499 });
    }
    
    const eventsKey = `match_events:${matchId}`;
    const events: any[] = (await kv.get(eventsKey)) || [];
    
    return c.json({ events, count: events.length });
  } catch (error) {
    console.error(`[match-events GET] Error:`, error);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * GET /match-events/:matchId/since/:timestamp - Get events added since a timestamp
 * This enables efficient polling for new events
 * NOTE: This endpoint does NOT require authentication for performance reasons
 */
app.get("/make-server-845a157a/match-events/:matchId/since/:timestamp", async (c) => {
  try {
    const matchId = c.req.param('matchId');
    const sinceTimestamp = c.req.param('timestamp');
    
    // Check if client has disconnected (early return for performance)
    if (c.req.raw.signal?.aborted) {
      return new Response('', { status: 499 });
    }
    
    const eventsKey = `match_events:${matchId}`;
    const allEvents: any[] = (await kv.get(eventsKey)) || [];
    
    // Check again before filtering
    if (c.req.raw.signal?.aborted) {
      return new Response('', { status: 499 });
    }
    
    // Filter events that were synced after the given timestamp
    const newEvents = allEvents.filter(event => {
      const eventSyncTime = event.synced_at || event.timestamp;
      return eventSyncTime > sinceTimestamp;
    });
    
    return c.json({ events: newEvents, count: newEvents.length });
  } catch (error) {
    // Don't log errors for aborted polling requests
    if (error?.name !== 'Http' && !error?.message?.includes('connection closed')) {
      console.error(`[match-events GET since] Error:`, error);
    }
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * DELETE /match-events/:matchId/:eventId - Remove an event (for undo functionality)
 */
app.delete("/make-server-845a157a/match-events/:matchId/:eventId", async (c) => {
  try {
    const matchId = c.req.param('matchId');
    const eventId = c.req.param('eventId');
    
    // Verify user token
    const userToken = c.req.header('X-User-Token');
    if (!userToken) {
      return c.json({ error: 'Unauthorized - user token required' }, 401);
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    if (authError || !user) {
      return c.json({ error: 'Invalid user token' }, 401);
    }
    
    const eventsKey = `match_events:${matchId}`;
    let matchEvents: any[] = (await kv.get(eventsKey)) || [];
    
    // Remove the event
    const initialLength = matchEvents.length;
    matchEvents = matchEvents.filter(e => e.id !== eventId);
    
    if (matchEvents.length === initialLength) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    // Save back
    await kv.set(eventsKey, matchEvents);
    
    console.log(`[match-events] ❌ Removed event ${eventId} from match ${matchId}`);
    
    return c.json({ success: true, remaining_events: matchEvents.length });
  } catch (error) {
    console.error(`[match-events DELETE] Error:`, error);
    return c.json({ error: String(error) }, 500);
  }
});

// Wrap the app.fetch handler to catch connection closed errors at the Deno level
const wrappedFetch = async (request: Request) => {
  try {
    return await app.fetch(request);
  } catch (error: any) {
    // Suppress connection closed errors - these are normal when clients cancel requests
    if (error?.name === 'Http' || error?.message?.includes('connection closed')) {
      // Return a minimal 499 response (Client Closed Request)
      return new Response('', { status: 499 });
    }
    
    // If the error is a Promise (from timeout middleware), await it first
    if (error instanceof Promise) {
      try {
        const resolvedError = await error;
        // If it's a Response with 504, return it silently
        if (resolvedError instanceof Response && resolvedError.status === 504) {
          return resolvedError;
        }
        // Log other response errors
        if (resolvedError instanceof Response) {
          console.error('[server] Unexpected Response error:', resolvedError.status, resolvedError.statusText);
          return resolvedError;
        }
      } catch (promiseError) {
        console.error('[server] Promise rejection error:', promiseError);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
    
    // If the error is directly a Response object (from timeout middleware), return it
    if (error instanceof Response) {
      // Don't log 504 Gateway Timeout - that's handled by timeout middleware
      if (error.status === 504) {
        return error;
      }
      console.error('[server] Unexpected Response error:', error.status, error.statusText);
      return error;
    }
    
    // For other errors, log and return 500
    console.error('[server] Unhandled fetch error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

Deno.serve(wrappedFetch);