# VScor Cloud Sync - Setup Instructions

## 🎯 Quick Start

The app will automatically detect that database tables are missing and show you a **setup wizard** with step-by-step instructions.

## 📋 Setup Process

### Option 1: Follow the In-App Wizard (Recommended)

1. **Launch the app** - You'll see the "Database Setup Required" screen
2. **Click "Copy SQL Script"** - This copies all table creation SQL to your clipboard
3. **Open Supabase Dashboard** - Click the "Open Supabase" button or go to https://supabase.com/dashboard
4. **Navigate to SQL Editor** - In your project, find the SQL Editor in the left sidebar
5. **Paste and Run** - Paste the SQL script and click "Run" to create all tables
6. **Return to VScor** - Click "Check Setup" to verify tables were created
7. **Done!** - The app will automatically migrate your local data and start syncing

### Option 2: Skip Cloud Sync (Local Only)

If you want to continue using only local storage:

1. **Click "Skip (Local Only)"** in the setup wizard
2. The app will work exactly as before, using only localStorage
3. You can enable cloud sync later by:
   - Clearing `vscor_skip_cloud_sync` from localStorage
   - Refreshing the app

## 🗄️ SQL Script Location

The SQL script is available in:
- **In-app wizard** - Click "Copy SQL Script" or "Preview SQL"
- **File system** - `/utils/database/setup.md` (full documentation)
- **Code** - `/utils/database/setupChecker.ts` (via `getTableCreationSQL()`)

## ✅ Verification

After running the SQL in Supabase:

1. **Check Tables** - In Supabase, go to Table Editor - you should see 11 tables:
   - `players`
   - `teams`
   - `team_players`
   - `tournaments`
   - `tournament_teams`
   - `matches`
   - `match_events`
   - `performance_ratings`
   - `standings`
   - `fixtures`
   - `seeding_data`

2. **Test Sync** - Return to VScor and click "Check Setup"
   - If successful: App will proceed with data migration
   - If failed: Check console for specific errors

## 🔧 Troubleshooting

### "Table not found" errors after setup

**Cause**: Tables weren't created properly or wrong schema  
**Fix**:
1. Open Supabase SQL Editor
2. Run: `DROP TABLE IF EXISTS players, teams, team_players, tournaments, tournament_teams, matches, match_events, performance_ratings, standings, fixtures, seeding_data CASCADE;`
3. Re-run the creation SQL
4. Click "Check Setup" in VScor

### "Permission denied" errors

**Cause**: Row Level Security (RLS) policies blocking access  
**Fix**:
1. In Supabase, go to Authentication → Policies
2. Ensure the "Enable all access" policies were created
3. Or temporarily disable RLS: `ALTER TABLE players DISABLE ROW LEVEL SECURITY;` (repeat for each table)

### App stuck on "Checking database setup..."

**Cause**: Network issue or Supabase credentials problem  
**Fix**:
1. Check browser console for errors
2. Verify internet connection
3. Ensure Supabase project is active
4. Try refreshing the app

### Want to reset and start over

**Fix**:
```javascript
// In browser console:
localStorage.removeItem('vscor_migration_complete');
localStorage.removeItem('vscor_skip_cloud_sync');
localStorage.removeItem('vscor_sync_queue');
localStorage.removeItem('vscor_sync_status');
location.reload();
```

### Stuck sync queue errors

If you see "Max retries reached" errors flooding the console:

**Fix**:
```javascript
// In browser console - Clear sync queue:
window.VScorDebug.clearAllSyncData();
location.reload();

// Or manually:
localStorage.removeItem('vscor_sync_queue');
localStorage.removeItem('vscor_sync_status');
location.reload();
```

## 🛠️ Debug Console Commands

VScor includes helpful debug commands you can run in the browser console:

```javascript
// Show all available commands
window.VScorDebug.help()

// Clear sync data only (keeps app data)
window.VScorDebug.clearAllSyncData()

// Check sync queue status
window.VScorDebug.checkSyncQueue()

// Enable cloud sync (if previously skipped)
window.VScorDebug.enableCloudSync()

// Disable cloud sync (local-only mode)
window.VScorDebug.disableCloudSync()

// View all VScor data
window.VScorDebug.viewAllData()

// Reset everything (WARNING: Deletes all data)
window.VScorDebug.resetEverything()
```

## 🎨 What Happens After Setup

### First-Time Migration
1. **Data Detection** - App scans existing localStorage data
2. **UUID Generation** - Converts numeric IDs to globally unique UUIDs
3. **ID Mapping** - Creates mapping between old and new IDs
4. **Cloud Upload** - Uploads all players, teams, tournaments to Supabase
5. **Verification** - Confirms successful sync
6. **Ready!** - App proceeds normally with cloud sync enabled

### Ongoing Operation
- **Automatic Sync** - All changes sync to cloud automatically
- **Offline Support** - Works offline, syncs when connection restores
- **Status Indicator** - Top-right badge shows sync status
- **Multi-Device** - Data accessible from any device with same Supabase project

## 📱 User Experience

### Cloud Sync Enabled
- ✅ Data backed up to cloud
- ✅ Access from multiple devices
- ✅ Real-time collaboration ready
- ✅ Automatic sync on changes
- ⚠️ Requires internet (first time only)

### Local-Only Mode
- ✅ Works completely offline
- ✅ No setup required
- ✅ Fast and simple
- ❌ No cloud backup
- ❌ Single device only
- ❌ No multi-user support

## 🔄 Enabling Cloud Sync Later

If you initially skipped setup:

1. **Clear skip flag**:
   ```javascript
   localStorage.removeItem('vscor_skip_cloud_sync');
   ```

2. **Refresh app** - Setup wizard will appear again

3. **Complete setup** - Follow steps above

4. **Migration runs** - Existing local data uploads to cloud

## 🔐 Security Notes

- **Figma Make Environment**: This is a development/prototype environment
- **RLS Policies**: Basic "allow all" policies are created for easy testing
- **Production Use**: For real deployment:
  1. Use your own Supabase project
  2. Implement proper authentication
  3. Configure strict RLS policies
  4. Add data validation
  5. Enable audit logging

## 📚 Additional Resources

- **Full Documentation**: `/CLOUD_SYNC_IMPLEMENTATION.md`
- **Database Schema**: `/utils/database/schema.ts`
- **Setup Guide**: `/utils/database/setup.md`
- **Supabase Docs**: https://supabase.com/docs

## ❓ FAQ

**Q: Will my existing data be lost?**  
A: No! Migration preserves all local data. Both old and new formats coexist.

**Q: Can I undo the migration?**  
A: Yes, clear `vscor_migration_complete` from localStorage and refresh.

**Q: What happens if I'm offline?**  
A: App works normally. Changes queue and sync when you're back online.

**Q: Do I need to create tables every time?**  
A: No, this is a one-time setup per Supabase project.

**Q: Can multiple people use the same database?**  
A: Yes! Once tables are created, anyone with the Supabase credentials can sync.

---

**Need Help?** Check browser console for detailed logs or review error messages in the setup wizard.