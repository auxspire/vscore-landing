# Troubleshooting: "Couldn't load Make" Error

## 🔍 What's Happening

When you click "Continue with Google", the app:
1. Initiates Google OAuth flow
2. Redirects to Google sign-in page
3. Google redirects back to your app with auth code
4. **Something fails during callback processing** ← This is where the error occurs

---

## 🛠️ Debugging Steps

### Step 1: Open Browser DevTools

Before clicking "Continue with Google":
1. Press **F12** (or Cmd+Option+I on Mac)
2. Go to **Console** tab
3. Clear any existing logs (click trash icon)
4. Keep DevTools open

### Step 2: Try Google Login Again

1. Click **"Continue with Google"**
2. Sign in with your Google account
3. **Watch the Console** for error messages

---

## 📋 What to Look For in Console

### ✅ **Expected Logs (Success):**

```
🔐 [signInWithGoogle] Starting Google OAuth flow...
✅ [signInWithGoogle] OAuth redirect initiated

[After redirect back]

🔐 Auth state changed: SIGNED_IN
✅ User signed in, getting profile...
🔐 [getCurrentUser] Checking Supabase session...
✅ [getCurrentUser] Found session for user: ...
📝 [getCurrentUser] Creating/updating user profile...
✅ [getCurrentUser] User profile synced: your@email.com
```

### ❌ **Error Scenarios:**

#### Scenario 1: `redirect_uri_mismatch`

**Console shows:**
```
Error: redirect_uri_mismatch
The redirect URI in the request does not match...
```

**Cause:** Google Cloud Console redirect URI is missing or incorrect

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://zwavkgmumhlcmlvttosc.supabase.co/auth/v1/callback
   ```
4. Click **Save**
5. Wait 5 minutes for changes to propagate
6. Try again

---

#### Scenario 2: `Provider not enabled`

**Console shows:**
```
❌ [signInWithGoogle] OAuth error: Provider not enabled
```

**Cause:** Google provider not enabled in Supabase

**Fix:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/zwavkgmumhlcmlvttosc
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle it **ON**
5. Enter your Client ID and Client Secret
6. Click **Save**
7. Try again

---

#### Scenario 3: Network Error (User Profile Creation Failed)

**Console shows:**
```
✅ [getCurrentUser] Found session for user: ...
📝 [getCurrentUser] Creating/updating user profile...
❌ [getCurrentUser] Failed to get user profile: [error details]
```

**Possible Causes:**

**A. Server endpoint not responding**
- Check Network tab in DevTools
- Look for request to `/functions/v1/make-server-845a157a/users/profile`
- Check if request failed (red status code)

**Fix:**
- Verify server is running
- Check Supabase Edge Functions logs
- Check browser console for CORS errors

**B. Database error**
- Server might be failing to write to KV store

**Fix:**
```javascript
// Check if KV store is accessible
// Open browser console and run:
fetch('https://zwavkgmumhlcmlvttosc.supabase.co/functions/v1/make-server-845a157a/health')
  .then(r => r.json())
  .then(console.log);
```

---

#### Scenario 4: Session Exists but Login Loop

**Console shows:**
```
✅ [getCurrentUser] Found session for user: ...
✅ [getCurrentUser] User profile synced: ...
🔐 Auth state changed: SIGNED_IN
✅ User signed in, getting profile...
[Repeats...]
```

**Cause:** Auth state listener triggering repeatedly

**Fix:** This is now handled in the updated code, but if it still occurs:
1. Clear all localStorage: `localStorage.clear()`
2. Clear browser cache
3. Refresh the page
4. Try logging in again

---

#### Scenario 5: CORS Error

**Console shows:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Cause:** Server not sending CORS headers properly

**Fix:** The server should already have CORS configured, but verify:
1. Check Network tab → Request headers
2. Verify `Access-Control-Allow-Origin: *` in response headers
3. If missing, server code needs to be updated

---

## 🧪 Quick Diagnostic Test

Run this in your browser console **after the error occurs**:

```javascript
// Check current auth state
const { supabase } = await import('./utils/auth.ts');
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Check if user is cached
const cachedUser = localStorage.getItem('vscor_current_user');
console.log('Cached user:', cachedUser);

// Try to get current user
const { getCurrentUser } = await import('./utils/auth.ts');
const user = await getCurrentUser();
console.log('Current user:', user);
```

---

## 🔧 Common Fixes

### Fix 1: Clear Everything and Start Fresh

```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then try logging in again.

---

### Fix 2: Verify Google Cloud Configuration

1. **Authorized JavaScript origins:**
   - `http://localhost:5173` (for local dev)
   - Your production URL

2. **Authorized redirect URIs:**
   - `https://zwavkgmumhlcmlvttosc.supabase.co/auth/v1/callback`

3. **OAuth consent screen:**
   - App name: "VScor"
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: `email`, `profile`, `openid`

---

### Fix 3: Verify Supabase Configuration

1. **Authentication → Providers → Google:**
   - Enabled: ✅ ON
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)

2. **Authentication → URL Configuration:**
   - Site URL: Your app URL (e.g., `https://your-app.com`)
   - Redirect URLs: Your app URL

---

### Fix 4: Check Browser Compatibility

Some browsers block third-party cookies, which can break OAuth:

1. **Disable tracking protection** (temporarily for testing):
   - Chrome: Settings → Privacy → Cookies → "Allow all cookies"
   - Firefox: Shield icon in address bar → Turn off "Enhanced Tracking Protection"
   - Safari: Preferences → Privacy → Uncheck "Prevent cross-site tracking"

2. **Try in Incognito/Private mode** to rule out extensions

3. **Try a different browser** to isolate the issue

---

## 📊 Detailed Error Investigation

### Check Network Tab

1. Open DevTools → **Network** tab
2. Click "Continue with Google"
3. Watch for these requests:

**Request 1: OAuth initiation**
- URL: `https://accounts.google.com/o/oauth2/v2/auth?...`
- Status: 302 (redirect)
- ✅ This should succeed

**Request 2: OAuth callback**
- URL: `https://zwavkgmumhlcmlvttosc.supabase.co/auth/v1/callback?code=...`
- Status: 302 (redirect back to app)
- ✅ This should succeed

**Request 3: User profile creation**
- URL: `https://zwavkgmumhlcmlvttosc.supabase.co/functions/v1/make-server-845a157a/users/profile`
- Method: POST
- Status: 200 or 201
- ✅ This should succeed

**❌ If any of these fail:**
- Click the failed request
- Go to **Response** tab
- Copy the error message
- Check the fix for that specific error above

---

## 🚨 Still Not Working?

If you've tried everything above and it's still failing:

### Collect Debug Information

1. **Console logs:**
   - Copy all logs from Console tab
   - Look for any red errors

2. **Network errors:**
   - Go to Network tab
   - Filter by "Errors only"
   - Screenshot any failed requests

3. **Current configuration:**
   ```javascript
   // Run in console
   console.log('Project ID:', 'zwavkgmumhlcmlvttosc');
   console.log('Supabase URL:', 'https://zwavkgmumhlcmlvttosc.supabase.co');
   console.log('Current URL:', window.location.href);
   ```

### Test Without OAuth

If Google OAuth continues to fail, you can temporarily test with a mock user:

```javascript
// Run in browser console (TEMPORARY WORKAROUND)
const mockUser = {
  user_id: 'test-user-' + Date.now(),
  email: 'test@vscor.app',
  display_name: 'Test User',
  created_at: new Date().toISOString(),
  is_verified: false
};

localStorage.setItem('vscor_current_user', JSON.stringify(mockUser));
location.reload();
```

**Note:** This bypasses authentication and should **only** be used for testing!

---

## ✅ Success Criteria

OAuth is working correctly when:

1. ✅ Click "Continue with Google" → Redirects to Google
2. ✅ Sign in with Google → Redirects back to VScor
3. ✅ Console shows: `✅ User signed in, getting profile...`
4. ✅ Console shows: `✅ [getCurrentUser] User profile synced: your@email.com`
5. ✅ App loads to Live Scores tab
6. ✅ No "Couldn't load Make" error
7. ✅ Refresh page → Stays logged in

---

## 📞 Need More Help?

Share these details:

1. **Exact error message** from console
2. **Failed network request** details (from Network tab)
3. **Steps you've already tried** from this guide
4. **Browser and version** you're using
5. **Screenshot** of the error

This will help diagnose the specific issue! 🔍
