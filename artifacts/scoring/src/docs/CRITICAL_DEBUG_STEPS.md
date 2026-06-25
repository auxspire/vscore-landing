# 🚨 CRITICAL: How to Debug the OAuth Crash

The app is crashing when you click "Continue with Google". Follow these EXACT steps:

## ✅ Step 1: Enable DevTools Persistence (MOST IMPORTANT!)

**Before clicking anything**, enable these settings in Chrome DevTools (F12):

### Console Tab:
1. Open Console tab
2. ✅ **CHECK "Preserve log"** checkbox at top
3. This prevents console from clearing on page navigation

### Network Tab:
1. Open Network tab
2. ✅ **CHECK "Preserve log"** checkbox  
3. ✅ **UNCHECK "Disable cache"** (optional but helpful)

---

## ✅ Step 2: Clear Everything and Refresh

In the Console tab, paste and run:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## ✅ Step 3: Watch the Logs CAREFULLY

With **"Preserve log" ENABLED**, click "Continue with Google" and watch for these messages:

### ✅ **Success Path (what should happen):**
```
🎯🎯🎯 [LoginScreen] ============ BUTTON CLICKED ============
🎯 [LoginScreen] handleGoogleLogin STARTED
🎯 [LoginScreen] Current URL: https://...
🎯 [LoginScreen] Calling signInWithGoogle...
🔐 [signInWithGoogle] Starting Google OAuth flow...
🔐 [signInWithGoogle] Calling supabase.auth.signInWithOAuth...
✅ [signInWithGoogle] OAuth redirect initiated
🎯 [LoginScreen] signInWithGoogle returned: { success: true }
🎯 [LoginScreen] Google sign-in initiated successfully - should redirect now
```

Then the page WILL redirect to Google (this is normal!).

### ❌ **Failure Path (if something is wrong):**
Look for any of these:
```
❌ [signInWithGoogle] OAuth error: ...
❌ [signInWithGoogle] Exception caught: ...
🎯 [LoginScreen] Google sign-in failed: ...
```

---

## ✅ Step 4: Check What You See

After clicking the button, tell me:

### A. **Does the button respond?**
- Does it turn into a spinner?
- Or does nothing happen?

### B. **What logs do you see?**
- Do you see "BUTTON CLICKED"?
- Do you see "OAuth redirect initiated"?
- Or do you see an error?

### C. **Does the page redirect?**
- Does it try to go to Google?
- Or does it just crash immediately?

### D. **Check Network Tab**
With "Preserve log" enabled:
- Do you see any FAILED requests (red status)?
- What are they?
- Click on the failed request and check the "Response" tab

---

## 🔍 Common Scenarios

### Scenario 1: Nothing Happens (Button doesn't respond)
**Symptoms:** No logs, no redirect, button just sits there
**Likely cause:** JavaScript error BEFORE the button click
**What to do:** Run `showErrors()` in console

### Scenario 2: Error Message Appears
**Symptoms:** You see an error in console or on screen
**What to do:** Copy the EXACT error message and share it

### Scenario 3: Page Redirects Then Crashes
**Symptoms:** Goes to Google, comes back, then crashes
**Likely cause:** OAuth callback handling issue
**What to do:** Check URL when it crashes - does it have `#access_token` or `?code=` in it?

### Scenario 4: "Couldn't load Make" Immediately
**Symptoms:** Page goes white and shows error immediately
**Likely cause:** Module import error or React crash
**What to do:** Check console for errors BEFORE clicking (with Preserve log)

---

##  📋 What to Share

If it still doesn't work, share these 4 things:

1. **Console logs** - Run `showLogs(50)` and copy the output
2. **Errors** - Run `showErrors()` and copy all errors
3. **Network failures** - Screenshot of Network tab showing any red/failed requests
4. **URL when it crashes** - Copy the full URL from address bar

---

## 🎯 Quick Test

Run this in the console to test if Supabase OAuth is configured:

```javascript
// Test if Supabase client exists
console.log('Supabase client:', typeof window.supabase);

// Test if auth is available
import { supabase } from './utils/auth.ts';
console.log('Auth client:', supabase.auth);

// Test configuration
console.log('Supabase URL:', import.meta.env.SUPABASE_URL || 'Not found');
```

---

## ⚠️ IMPORTANT

- **DO NOT** click the button without "Preserve log" enabled!
- **DO NOT** clear the console manually after clicking!
- **DO**  keep DevTools open the entire time!
- **DO** take screenshots if errors flash briefly!

---

## 🆘 If All Else Fails

If you can't capture the logs, record a screen recording of:
1. Opening DevTools (F12)
2. Enabling "Preserve log"
3. Clicking the Google button
4. Whatever happens next

This will help us see what's failing!
