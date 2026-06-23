# VScor - Football Scoring App

A real-time football scoring application with cloud sync capabilities, comprehensive stats tracking, and VMIR (VScor Match Influence Ratings) player rating system.

## 🎯 Current Status

✅ **Local Storage Mode Active**  
The app is currently running in **local-only mode** using browser localStorage. All your existing data is safe and the app works exactly as before.

⚠️ **Cloud Sync Available (Setup Required)**  
To enable cloud synchronization and multi-device access, you need to create database tables in Supabase.

## 🚀 Quick Start

### Option 1: Continue with Local Storage (No Setup)

The app works perfectly without any setup:
- ✅ All features available
- ✅ Data saved in browser
- ✅ Works offline
- ❌ Single device only
- ❌ No cloud backup

Just continue using the app normally!

### Option 2: Enable Cloud Sync (One-Time Setup)

To enable cloud backup and multi-device access:

1. **See the Setup Wizard**
   - The app shows a setup wizard on first launch
   - If you clicked "Skip", you can re-enable it:
   ```javascript
   // In browser console:
   localStorage.removeItem('vscor_skip_cloud_sync');
   location.reload();
   ```

2. **Create Database Tables**
   - Follow the wizard's step-by-step instructions
   - Copy the SQL script
   - Paste it into Supabase SQL Editor
   - Click "Run"

3. **Verify Setup**
   - Return to VScor
   - Click "Check Setup"
   - Your data will automatically sync to the cloud!

## 📚 Documentation

- **Full Implementation Guide**: [CLOUD_SYNC_IMPLEMENTATION.md](CLOUD_SYNC_IMPLEMENTATION.md)
- **Setup Instructions**: [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
- **Database Setup Guide**: [utils/database/setup.md](utils/database/setup.md)

## 🎨 Features

### Core Features
- ✅ Live match scoring with two-tap event recording
- ✅ Real-time score display for audience
- ✅ Comprehensive stats tracking
- ✅ Player, Team, and Tournament profiles
- ✅ Searchable leaderboards
- ✅ Automatic points table calculation

### VMIR Rating System
- ✅ Auto-generated player ratings (1-10 scale)
- ✅ Transparent calculation display
- ✅ Match performance breakdowns
- ✅ Offensive, defensive, and discipline components

### Tournament Management
- ✅ Dynamic format configuration (League, Knockout, Group Stage)
- ✅ Fixture generation with seeding support
- ✅ Live standings and points tables
- ✅ Manual fixture editing

### Cloud Sync (When Enabled)
- ✅ Automatic cloud backup
- ✅ Multi-device access
- ✅ Offline-first architecture
- ✅ Real-time synchronization
- ✅ Conflict resolution

## 🔧 Troubleshooting

### "Tables not found" errors in console

**This is normal!** The app is running in local-only mode. These errors are harmless and the app continues to work perfectly.

**To fix**: Enable cloud sync by following Option 2 above.

### Data not syncing across devices

Cloud sync must be enabled first (see Option 2 above). In local-only mode, data only exists in the current browser.

### Want to reset everything

```javascript
// In browser console - WARNING: Deletes all data
Object.keys(localStorage)
  .filter(key => key.startsWith('vscor_'))
  .forEach(key => localStorage.removeItem(key));
location.reload();
```

## 🏗️ Architecture

```
┌──────────────┐
│  React App   │
│  (Frontend)  │
└──────┬───────┘
       │
       ├─────────┐
       │         │
       ▼         ▼
┌─────────┐  ┌──────────┐
│ Local   │  │ Supabase │
│ Storage │  │ (Cloud)  │
│ (Active)│  │(Optional)│
└─────────┘  └──────────┘
```

## 📱 Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS v4
- **State**: React Hooks
- **Storage**: localStorage (primary)
- **Cloud**: Supabase (optional)
- **Sync**: Custom offline-first engine
- **IDs**: UUID v4

## 🎯 Next Steps

1. **Try the app** - Everything works in local mode
2. **Explore features** - VMIR ratings, tournament management, etc.
3. **Enable cloud sync** (optional) - Follow setup wizard when ready
4. **Scale up** - Cloud sync enables multi-device tournaments

## 📄 License

VScor Football Scoring App  
Built with React, TypeScript, and Tailwind CSS

---

**Current Mode**: Local Storage Only  
**Cloud Sync**: Available (Setup Required)  
**Data Integrity**: Auto-healing enabled ✅  
**Status**: Fully Functional ✅

## 🔧 Recent Fixes

- **Feb 27, 2026**: Fixed data sync errors and duplicate team warnings. The app now automatically validates and repairs data integrity on startup. See [DATA_SYNC_ERROR_FIX.md](DATA_SYNC_ERROR_FIX.md) for details.
