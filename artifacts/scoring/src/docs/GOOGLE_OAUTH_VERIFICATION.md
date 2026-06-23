# Google OAuth Verification Guide

## ✅ You've Completed:
1. ✅ Added Google as Auth provider in Supabase
2. ✅ Configured Client ID and Client Secret from Google Cloud
3. ✅ Warning message removed from app

---

## 🔍 Critical Configuration Checklist

### 1. **Verify Authorized Redirect URIs in Google Cloud Console**

Your Supabase OAuth requires a specific redirect URI. Here's what to check:

**Go to Google Cloud Console:**
1. Navigate to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Click to edit it
4. Under **"Authorized redirect URIs"**, you MUST have:

```
https://zwavkgmumhlcmlvttosc.supabase.co/auth/v1/callback
```

**Explanation:**
- `zwavkgmumhlcmlvttosc` is your Supabase project ID
- The URI format is: `https://{PROJECT_ID}.supabase.co/auth/v1/callback`

**❗ IMPORTANT:** If this redirect URI is missing or incorrect, OAuth will fail with an error like:
- "redirect_uri_mismatch"
- "Error 400: redirect_uri_mismatch"

---

### 2. **Verify Google Provider is Enabled in Supabase**

**Go to Supabase Dashboard:**
1. Navigate to: https://supabase.com/dashboard/project/zwavkgmumhlcmlvttosc
2. Go to **Authentication** → **Providers**
3. Find **Google** in the list
4. Ensure it shows as **"Enabled"** (toggle should be ON)
5. Verify the Client ID and Client Secret are filled in

---

### 3. **Check Supabase Site URL Configuration**

**In Supabase Dashboard:**
1. Go to **Authentication** → **URL Configuration**
2. Verify **Site URL** is set to one of:
   - Your production domain (e.g., `https://your-app.com`)
   - Or for testing: `http://localhost:5173` (or your dev server port)

**For Figma Make Preview:**
The Site URL should match your current preview URL. You can find it in the browser address bar.

---

## 🧪 Testing the OAuth Flow

### Test 1: Click "Continue with Google"

**Steps:**
1. Refresh your VScor app
2. You should see the Login screen (no warning message now!)
3. Click **"Continue with Google"**

**Expected Behavior:**
✅ You're redirected to Google's sign-in page
✅ You can select or sign in with your Google account
✅ After signing in, you're redirected back to VScor
✅ VScor loads directly to the Live Scores tab

**❌ If you see an error:**

#### Error: "redirect_uri_mismatch"
**Cause:** Redirect URI not configured in Google Cloud Console
**Fix:** Add the redirect URI from step 1 above

#### Error: "Error 400: invalid_request"
**Cause:** Client ID or Secret mismatch
**Fix:** Double-check credentials in both Supabase and Google Cloud

#### Error: "Provider not enabled"
**Cause:** Google provider not enabled in Supabase
**Fix:** Enable Google in Supabase Dashboard → Authentication → Providers

---

## 🔧 Common Issues & Solutions

### Issue 1: OAuth redirects to wrong URL after login

**Symptom:** After Google login, you're redirected to a blank page or error page

**Solution:**
1. Check Supabase **Site URL** matches your app URL
2. Check **Redirect URLs** in Authentication → URL Configuration
3. Add your current preview URL to **Allowed Redirect URLs**

---

### Issue 2: "Access Denied" error from Google

**Symptom:** Google shows "This app is blocked" or "Access Denied"

**Solution:**
This happens if the OAuth app is in "Testing" mode in Google Cloud Console.

**Option A - Add Test Users:**
1. Go to Google Cloud Console → OAuth consent screen
2. Add your email to "Test users"
3. Try logging in again

**Option B - Publish App (for production):**
1. Go to OAuth consent screen
2. Click "Publish App"
3. Submit for verification (if required)

---

### Issue 3: OAuth works but user not logged in

**Symptom:** Google login succeeds, but app still shows login screen

**Solution:**
1. Open browser DevTools → Console
2. Look for errors related to:
   - User profile creation
   - Supabase client errors
   - Network errors to server endpoints
3. Check Network tab for failed requests to `/users/profile`

**Debug Commands:**
```javascript
// Check if session exists
import { getCurrentUser } from './utils/auth';
const user = await getCurrentUser();
console.log('Current user:', user);

// Check localStorage
console.log('Cached user:', localStorage.getItem('vscor_current_user'));

// Check Supabase session
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://zwavkgmumhlcmlvttosc.supabase.co',
  'YOUR_ANON_KEY'
);
const { data } = await supabase.auth.getSession();
console.log('Supabase session:', data);
```

---

## 📋 Quick Verification Checklist

Before testing, verify ALL of these:

- [ ] Google Cloud Console:
  - [ ] OAuth 2.0 Client ID created
  - [ ] Redirect URI added: `https://zwavkgmumhlcmlvttosc.supabase.co/auth/v1/callback`
  - [ ] Your email added to Test Users (if app in testing mode)

- [ ] Supabase Dashboard:
  - [ ] Google provider enabled
  - [ ] Client ID entered (from Google Cloud)
  - [ ] Client Secret entered (from Google Cloud)
  - [ ] Site URL configured
  - [ ] Your app URL added to Allowed Redirect URLs

- [ ] VScor App:
  - [ ] No warning message showing
  - [ ] "Continue with Google" button visible
  - [ ] Button clickable (not disabled)

---

## 🎯 Expected Console Output (Successful Login)

When OAuth works correctly, you should see these logs in browser console:

```
🔐 [signInWithGoogle] Starting Google OAuth flow...
✅ [signInWithGoogle] OAuth redirect initiated

[After redirect back to app]

🔐 [getCurrentUser] Checking Supabase session...
✅ [getCurrentUser] Found session for user: user-id-here
📝 [getCurrentUser] Creating/updating user profile...
✅ [getCurrentUser] User profile synced
✅ Existing session found: {user_id: "...", email: "...", ...}
```

---

## 🚀 Next Steps After Successful OAuth

Once Google OAuth is working:

1. **Test session persistence:**
   - Log in with Google
   - Refresh the page
   - Should stay logged in (no login screen)

2. **Test entity creation:**
   - Create a player → Check ownership metadata in console
   - Create a team → Check coordinator assignment
   - Create a tournament → Check coordinator assignment

3. **Test on multiple devices:**
   - Log in on different browsers
   - Verify cloud sync works
   - Check data isolation between users

4. **Production preparation:**
   - Update Site URL to production domain
   - Publish OAuth app in Google Cloud Console
   - Add production redirect URI
   - Test end-to-end flow

---

## 📞 Still Having Issues?

If you're still seeing errors after following this guide:

1. **Copy the exact error message** from browser console
2. **Take a screenshot** of the error
3. **Check the Network tab** in DevTools for failed requests
4. **Verify all configuration** matches the checklist above

Common places to double-check:
- Redirect URI spelling (must be exact)
- Client ID and Secret (no extra spaces)
- Provider toggle is ON in Supabase
- Your email is in Test Users list

---

## ✨ Success!

If everything is configured correctly, clicking "Continue with Google" should:

1. ✅ Redirect to Google sign-in
2. ✅ Allow you to select/sign in with Google account
3. ✅ Redirect back to VScor
4. ✅ Show Live Scores tab (logged in)
5. ✅ Create user profile in Supabase KV Store
6. ✅ Cache user in localStorage
7. ✅ Stay logged in on page refresh

Your VScor app is now ready with full Google OAuth authentication! 🎉
