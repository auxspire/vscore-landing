# Debug OAuth "Couldn't Load Make" Issue

The console is clearing automatically, but we've now added a Debug Logger that preserves ALL logs!

## 🔍 How to See What's Happening

### Step 1: Open DevTools (F12)

### Step 2: In the Console tab, enable "Preserve log"
- **Chrome:** Check the "Preserve log" checkbox at the top of Console
- **Firefox:** Click the gear icon → Check "Persist Logs"
- **Safari:** Develop menu → Show JavaScript Console → Check "Preserve Log"

### Step 3: Click "Continue with Google"

### Step 4: Check Captured Logs

Even if the console clears, the logs are saved! Run this command in console:

```javascript
showLogs(100)
```

This will show the last 100 logs that were captured before the console cleared!

### Step 5: Show Only Errors

```javascript
showErrors()
```

This shows ONLY the error messages!

### Step 6: Download All Logs

```javascript
downloadLogs()
```

This downloads a JSON file with ALL logs including timestamps!

---

## 🎯 What to Look For

After running `showErrors()`, look for:

### ❌ **Error Type 1: User Profile Creation Failed**
```
❌ [getCurrentUser] Failed to get user profile: ...
```
**This means:** Server couldn't create your profile

### ❌ **Error Type 2: Network Error**
```
Failed to fetch...
TypeError: NetworkError when attempting to fetch resource
```
**This means:** Can't connect to the server

### ❌ **Error Type 3: CORS Error**
```
Access to fetch at '...' has been blocked by CORS policy
```
**This means:** Server not sending correct CORS headers

### ❌ **Error Type 4: OAuth Redirect Error**
```
redirect_uri_mismatch
```
**This means:** Google redirect URI not configured correctly

###Error Type 5: Session Error**
```
❌ [getCurrentUser] Session error: ...
```
**This means:** Problem with Supabase session

---

## 📋 Quick Diagnostic

Run this in console **after the error occurs**:

```javascript
// Show all errors
showErrors();

// Show recent logs
showLogs(50);

// Download everything for analysis
downloadLogs();
```

---

## 🔧 Common Fixes Based on Error Type

### If you see "Failed to get user profile":
**Problem:** Server endpoint not working
**Fix:**
1. Check Network tab for failed request to `/users/profile`
2. Look at the Response tab for error details
3. Server might be down or endpoint misconfigured

### If you see "redirect_uri_mismatch":
**Problem:** Google Cloud redirect URI not set
**Fix:**
1. Go to Google Cloud Console
2. Add: `https://zwavkgmumhlcmlvttosc.supabase.co/auth/v1/callback`
3. Wait 5 minutes
4. Try again

### If you see "CORS policy" error:
**Problem:** Server CORS not configured
**Fix:** Server code needs to send proper CORS headers (should already be configured)

### If you see "Session error":
**Problem:** Supabase session issue
**Fix:**
1. Run: `localStorage.clear()`
2. Refresh page
3. Try logging in again

---

## 🚨 Emergency Debugging

If the app keeps crashing and you can't see anything:

###1. Enable "Preserve log" in DevTools BEFORE clicking anything**

### 2. Open Network tab**
- Look for failed requests (red status codes)
- Click on failed request
- Check "Response" tab for error message

### 3. Check if server is responding:**

Run in console:
```javascript
fetch('https://zwavkgmumhlcmlvttosc.supabase.co/functions/v1/make-server-845a157a/users/profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ test: true })
})
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
```

If this fails, the server has an issue.

---

## 📊 What to Share for Help

If you still can't fix it, share:

1. **Output of `showErrors()`** - All error messages
2. **Output of `showLogs(100)`** - Last 100 logs
3. **Network tab screenshot** - Failed requests
4. **Downloaded logs file** - From `downloadLogs()`

This will show us exactly what's failing!

---

## ✅ Success Scenario

When everything works correctly, you should see:

```
🔐 [signInWithGoogle] Starting Google OAuth flow...
✅ [signInWithGoogle] OAuth redirect initiated
[After redirect back]
🔐 Auth state changed: SIGNED_IN
📋 Session: Present
✅ User signed in, getting profile...
🔐 [getCurrentUser] Checking Supabase session...
✅ [getCurrentUser] Found session for user: abc123...
📝 [getCurrentUser] Creating/updating user profile...
✅ [getCurrentUser] User profile synced: your@email.com
```

No red errors! 🎉
