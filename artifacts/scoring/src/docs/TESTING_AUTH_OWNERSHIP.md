# Testing Guide: Authentication & Ownership System

## ✅ Quick Verification Checklist

### 1. **Test Google OAuth Login** 🔐

**Steps:**
1. Open the app - you should see the Splash Screen
2. After splash, you'll see the Login Screen
3. Click **"Continue with Google"**
4. You should be redirected to Google's OAuth consent screen
5. Sign in with your Google account
6. After successful login, you should be redirected back to the app
7. The app should load directly to the Live Scores tab

**Expected Result:**
- ✅ No errors in console
- ✅ User profile created in Supabase KV Store
- ✅ User cached in localStorage (`vscor_current_user`)
- ✅ Automatic migration runs for existing data

**Console Verification:**
```javascript
// Check current user
const user = JSON.parse(localStorage.getItem('vscor_current_user'));
console.log('Current User:', user);
// Should show: user_id, email, display_name, google_id, etc.
```

---

### 2. **Test Session Persistence** 🔄

**Steps:**
1. After logging in successfully
2. Refresh the page (F5 or Cmd+R)
3. App should load directly without showing login screen again

**Expected Result:**
- ✅ User stays logged in
- ✅ No login screen shown
- ✅ App loads to main screen immediately

---

### 3. **Test Player Creation with Ownership** 👤

**Steps:**
1. Navigate to **Scoring Tab** → Click **"Add Player"**
2. Fill in player details:
   - Name: "Test Player"
   - Position: "Striker"
   - Jersey Number: "10"
3. Click **Save**
4. Open browser console

**Expected Console Output:**
```
=== HANDLE ADD PLAYER ===
New player data: {name: "Test Player", ...}
Created by: <your-user-id>
Owner: <your-user-id>
=======================
```

**Verification:**
```javascript
// Check ownership metadata
const players = JSON.parse(localStorage.getItem('vscor_players'));
const testPlayer = players.find(p => p.name === 'Test Player');
console.log('Player Ownership:', {
  created_by: testPlayer.created_by,
  owner_user_id: testPlayer.owner_user_id,
  created_at: testPlayer.created_at
});
```

**Expected Result:**
- ✅ `created_by` matches your user ID
- ✅ `owner_user_id` matches your user ID
- ✅ `created_at` timestamp is present

---

### 4. **Test Team Creation with Ownership** 🏆

**Steps:**
1. Navigate to **Scoring Tab** → Click **"Add Team"**
2. Fill in team details:
   - Name: "Test FC"
   - Coach: "Test Coach"
   - Home Venue: "Test Stadium"
3. Click **Save**

**Verification:**
```javascript
// Check team ownership
const teams = JSON.parse(localStorage.getItem('vscor_teams'));
const testTeam = teams.find(t => t.name === 'Test FC');
console.log('Team Ownership:', {
  created_by: testTeam.created_by,
  coordinator_user_ids: testTeam.coordinator_user_ids,
  created_at: testTeam.created_at
});
```

**Expected Result:**
- ✅ `created_by` matches your user ID
- ✅ `coordinator_user_ids` contains your user ID (as first/only coordinator)
- ✅ `created_at` timestamp is present

---

### 5. **Test Tournament Creation with Ownership** 🏅

**Steps:**
1. Navigate to **Scoring Tab** → Click **"Add Tournament"**
2. Fill in tournament details:
   - Name: "Test Cup"
   - Start Date: Today's date
   - End Date: Future date
3. Add some teams
4. Click **Create Tournament**

**Verification:**
```javascript
// Check tournament ownership
const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments'));
const testTournament = tournaments.find(t => t.name === 'Test Cup');
console.log('Tournament Ownership:', {
  created_by: testTournament.created_by,
  coordinator_user_ids: testTournament.coordinator_user_ids,
  created_at: testTournament.created_at
});
```

**Expected Result:**
- ✅ `created_by` matches your user ID
- ✅ `coordinator_user_ids` contains your user ID (as first/only coordinator)
- ✅ `created_at` timestamp is present

---

### 6. **Test Data Migration** 🔄

**Steps:**
1. If you had existing data before implementing auth
2. Log in for the first time
3. Check browser console

**Expected Console Output:**
```
🔄 Starting ownership migration...
✅ Migrated X players
✅ Migrated Y teams
✅ Migrated Z tournaments
✅ Ownership migration complete!
```

**Verification:**
```javascript
// All existing entities should now have ownership metadata
const players = JSON.parse(localStorage.getItem('vscor_players'));
const teams = JSON.parse(localStorage.getItem('vscor_teams'));

console.log('Sample player:', players[0]);
// Should have: created_by, owner_user_id, created_at, updated_at

console.log('Sample team:', teams[0]);
// Should have: created_by, coordinator_user_ids, created_at, updated_at
```

---

### 7. **Test User Profile in Server** 🖥️

**Steps:**
1. Log in successfully
2. Open Network tab in browser DevTools
3. Find the request to `/users/profile`
4. Check the response

**Expected Response:**
```json
{
  "user_id": "uuid-string",
  "google_id": "google-oauth-id",
  "email": "your@email.com",
  "display_name": "Your Name",
  "profile_photo": "https://...",
  "created_at": "2026-02-28T...",
  "is_verified": true
}
```

**Manual Server Check:**
```javascript
// Call the server endpoint directly
fetch('https://zwavkgmumhlcmlvttosc.supabase.co/functions/v1/make-server-845a157a/users/YOUR_USER_ID', {
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(console.log);
```

---

### 8. **Test Match Scoring with Owner Tracking** ⚽

**Steps:**
1. Navigate to **Scoring Tab** → Click **"New Match"**
2. Select teams and start a match
3. Score some events
4. End the match

**Verification:**
```javascript
// Check completed match
const matches = JSON.parse(localStorage.getItem('vscor_completed_matches'));
const latestMatch = matches[0];
console.log('Match Scorer:', latestMatch.scoredBy);
// Should match your user.id (not user_id - legacy field)
```

**Expected Result:**
- ✅ `scoredBy` field populated with current user's ID

---

## 🔍 Advanced Testing

### Test Multiple Users (Ownership Isolation)

**Setup:**
1. Sign in with Google Account A
2. Create some players, teams, tournaments
3. Sign out
4. Sign in with Google Account B
5. Create some different players, teams, tournaments

**Expected Results:**
- ✅ Each user's creations have different `created_by` IDs
- ✅ User A owns their entities
- ✅ User B owns their entities
- ✅ Both users can **view** all entities (in Info tab)
- ✅ Only owners see **edit buttons** (to be implemented)

---

### Test Phone Authentication

**Steps:**
1. Log out (if logged in)
2. Click "Continue with Google" but this time use phone
3. Enter phone number (format: 10 digits)
4. Click arrow to send OTP
5. Enter 6-digit OTP
6. Submit

**Note:** This requires SMS provider configuration in Supabase. If not configured, you'll see an error. This is expected - Google OAuth is the primary auth method.

---

## 🐛 Common Issues & Solutions

### Issue: "User must be logged in to create players"

**Cause:** User session not found
**Solution:**
```javascript
// Check if user is in localStorage
const user = localStorage.getItem('vscor_current_user');
console.log('User session:', user);

// If null, re-login
```

### Issue: OAuth redirect not working

**Cause:** OAuth not configured in Supabase
**Solution:** Follow setup at https://supabase.com/docs/guides/auth/social-login/auth-google

### Issue: Ownership metadata missing on old data

**Cause:** Migration didn't run
**Solution:**
```javascript
// Run migration manually
window.VScorOwnershipMigration.migrateAll();
```

### Issue: "Provider is not enabled" error

**Cause:** Google OAuth provider not enabled in Supabase
**Solution:** 
1. Go to Supabase Dashboard
2. Authentication → Providers
3. Enable Google
4. Configure OAuth credentials

---

## 🎯 Success Criteria

Your implementation is working correctly if:

✅ **Authentication:**
- [ ] Google OAuth login works
- [ ] Session persists on page reload
- [ ] User profile stored in server
- [ ] User cached in localStorage

✅ **Ownership Tracking:**
- [ ] New players have `created_by` and `owner_user_id`
- [ ] New teams have `created_by` and `coordinator_user_ids`
- [ ] New tournaments have `created_by` and `coordinator_user_ids`
- [ ] Matches track `scoredBy`

✅ **Data Migration:**
- [ ] Existing data migrated successfully
- [ ] No console errors during migration
- [ ] All entities have ownership metadata

✅ **User Experience:**
- [ ] Login flow is smooth
- [ ] No errors in console
- [ ] App loads quickly after login
- [ ] Data persists across sessions

---

## 📊 Monitoring Tools

### Check All User Data
```javascript
// Current user
const user = JSON.parse(localStorage.getItem('vscor_current_user'));
console.table(user);

// Players with ownership
const players = JSON.parse(localStorage.getItem('vscor_players'));
console.table(players.map(p => ({
  name: p.name,
  created_by: p.created_by,
  owner: p.owner_user_id
})));

// Teams with ownership
const teams = JSON.parse(localStorage.getItem('vscor_teams'));
console.table(teams.map(t => ({
  name: t.name,
  created_by: t.created_by,
  coordinators: t.coordinator_user_ids?.length || 0
})));
```

### Clear All Data & Re-Test
```javascript
// ⚠️ WARNING: This will delete all local data
localStorage.clear();
location.reload();
```

---

## 🚀 Next Steps

Once all tests pass:

1. **Test on multiple devices** - Ensure cloud sync works
2. **Test with multiple Google accounts** - Verify ownership isolation
3. **Check network requests** - Ensure no sensitive data leaks
4. **Performance testing** - Verify app loads quickly with auth
5. **Production deployment** - Configure OAuth for production domain

Good luck! 🎉
