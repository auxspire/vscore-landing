# VScor Authentication & Ownership System

## Overview

This document describes the comprehensive User Identity + Ownership Control System implemented across VScor's players, teams, and tournaments.

## 🔐 Authentication System

### Google OAuth Integration

VScor uses **real Google OAuth authentication** via Supabase Auth.

**Setup Required:**
To enable Google login, you must configure OAuth at your Supabase project:
1. Go to: https://supabase.com/docs/guides/auth/social-login/auth-google
2. Follow the setup instructions
3. Configure Google OAuth credentials in your Supabase project settings

### Phone Number Authentication  

Users can also authenticate using phone number + OTP verification.

**Note:** SMS provider must be configured in Supabase for OTP to work properly.

### Login Flow

1. **Splash Screen** → Shows app branding
2. **Login Screen** → User can choose:
   - Google OAuth (one-click sign-in)
   - Phone + OTP (6-digit code)
3. **Session Check** → On subsequent visits, existing sessions are restored automatically
4. **Main App** → User accesses the full application

---

## 👤 User Identity System

### User Profile Structure

Every user has a profile stored in both:
- **Supabase KV Store** (server-side, persistent)
- **LocalStorage** (client-side, cached for performance)

```typescript
interface VScorUser {
  user_id: string;          // Internal UUID (unique identifier)
  google_id?: string;       // Google OAuth ID (if signed in via Google)
  email: string;            // Email address
  mobile_number?: string;   // Phone number (optional, verifiable)
  display_name: string;     // Display name
  profile_photo?: string;   // Profile picture URL
  created_at: string;       // Account creation timestamp
  is_verified: boolean;     // Verification status (email/phone)
}
```

### User Creation Flow

1. User signs in via Google or Phone
2. System checks if user already exists (by `google_id` or `email`)
3. If new user:
   - Generate unique `user_id` (UUID)
   - Create profile in server database
   - Cache in localStorage
4. If existing user:
   - Update profile with latest info
   - Refresh cache

---

## 📊 Ownership & Permission System

### Action Tracking

**Every entity** created in VScor includes:

```typescript
{
  created_by: string;     // user_id of creator
  updated_by: string;     // user_id of last editor
  created_at: string;     // Creation timestamp
  updated_at: string;     // Last update timestamp
}
```

This applies to:
- **Players**
- **Teams**
- **Tournaments**
- **Matches**

**Benefits:**
- Full audit trail
- Ownership validation
- Foundation for future moderation features

---

### Player Ownership

#### Initial Ownership
- The user who creates the player profile becomes the **temporary owner**

#### Permanent Ownership (After Verification)
- If a player's mobile number or email is verified
- The **verified user** becomes the permanent owner
- Ownership can transfer when verification occurs

#### Ownership Structure
```typescript
interface PlayerOwnership {
  created_by: string;        // Original creator
  updated_by: string;        // Last editor
  created_at: string;
  updated_at: string;
  owner_user_id: string;     // Current owner (transferable)
}
```

#### Edit Permissions
✅ **CAN EDIT:** Profile owner only
- Edit player details
- Update stats (manual)
- Modify profile information

👀 **CAN VIEW:** All authenticated users
- View player profile via Info Tab

---

### Team Ownership

#### Multi-Admin System
Teams support **up to 3 coordinators**:
- One coordinator **must** be the original creator
- Coordinators have equal editing rights
- Creator cannot be removed

#### Ownership Structure
```typescript
interface TeamOwnership {
  created_by: string;             // Original creator
  updated_by: string;             // Last editor
  created_at: string;
  updated_at: string;
  coordinator_user_ids: string[]; // Up to 3 coordinators (includes creator)
}
```

#### Edit Permissions
✅ **CAN EDIT:** Coordinators (owners) only
- Edit team details
- Add/remove players
- Update team information
- Manage coordinators (except creator)

👀 **CAN VIEW:** All authenticated users
- View team profile

#### Coordinator Management

**Add Coordinator:**
```typescript
addTeamCoordinator(team, newCoordinatorId)
```
- Maximum 3 coordinators allowed
- Cannot add duplicate coordinator

**Remove Coordinator:**
```typescript
removeTeamCoordinator(team, coordinatorId)
```
- ❌ Cannot remove the original creator
- Can remove other coordinators

---

### Tournament Ownership

#### Multi-Admin System
Tournaments support **up to 3 coordinators**:
- One coordinator **must** be the original creator
- Coordinators have equal editing rights
- Creator cannot be removed

#### Ownership Structure
```typescript
interface TournamentOwnership {
  created_by: string;             // Original creator
  updated_by: string;             // Last editor
  created_at: string;
  updated_at: string;
  coordinator_user_ids: string[]; // Up to 3 coordinators (includes creator)
}
```

#### Edit Permissions
✅ **CAN EDIT:** Coordinators (owners) only
- Edit tournament details
- Add/remove teams
- Update tournament information
- Manage fixtures
- Manage coordinators (except creator)

👀 **CAN VIEW:** All authenticated users
- View tournament via Info tab

#### Coordinator Management

**Add Coordinator:**
```typescript
addTournamentCoordinator(tournament, newCoordinatorId)
```
- Maximum 3 coordinators allowed
- Cannot add duplicate coordinator

**Remove Coordinator:**
```typescript
removeTournamentCoordinator(tournament, coordinatorId)
```
- ❌ Cannot remove the original creator
- Can remove other coordinators

---

## 🔒 Permission Enforcement

### UI-Level Protection
- Edit buttons hidden for non-owners
- Forms display read-only mode for non-owners
- Clear visual indicators of ownership status

### Backend Validation (Coming Soon)
Currently, permissions are enforced at the UI level. For production:
- ✅ Add backend validation on all update/delete operations
- ✅ Verify ownership before allowing modifications
- ✅ Prevent manual API manipulation

**Recommendation:** Add ownership checks in server endpoints:
```typescript
// Example server-side validation
const canEdit = tournament.coordinator_user_ids.includes(requestUserId);
if (!canEdit) {
  return c.json({ error: 'Unauthorized' }, 403);
}
```

---

## 🔄 Ownership Transfer Logic

### Player Ownership Transfer

When a player verifies their account:
1. System checks if verified email/phone matches existing player profile
2. Transfer ownership to verified user
3. Preserve historical `created_by` data
4. Update `owner_user_id` field

```typescript
transferPlayerOwnership(player, newOwnerId)
```

**Important:**
- Does NOT delete historical data
- Only updates `owner_user_id`
- Prevents duplicate ownership conflicts

---

## 📦 Data Migration

### Automatic Migration

On first login after implementing the ownership system:
- Existing players, teams, and tournaments are automatically migrated
- `created_by` and `owner_user_id` set to current user
- `coordinator_user_ids` initialized with current user
- All timestamps set to migration time

### Manual Migration

You can also run migration manually via console:
```javascript
window.VScorOwnershipMigration.migrateAll()

// Or migrate specific entities:
window.VScorOwnershipMigration.migratePlayers()
window.VScorOwnershipMigration.migrateTeams()
window.VScorOwnershipMigration.migrateTournaments()
```

---

## 🛠️ Developer Guide

### Creating New Entities

**Example: Creating a Player**
```typescript
import { createPlayerOwnership } from './utils/ownership';

const newPlayer = {
  name: 'John Doe',
  position: 'Striker',
  ...createPlayerOwnership(), // Adds ownership metadata
};
```

**Example: Creating a Team**
```typescript
import { createTeamOwnership } from './utils/ownership';

const newTeam = {
  name: 'Example FC',
  coach: 'Jane Smith',
  ...createTeamOwnership(), // Adds ownership metadata
};
```

### Checking Permissions

**Example: Check if User Can Edit Player**
```typescript
import { canEditPlayer } from './utils/ownership';

if (canEditPlayer(player)) {
  // Show edit button
} else {
  // Show read-only view
}
```

**Example: Check if User Can Edit Team**
```typescript
import { canEditTeam } from './utils/ownership';

if (canEditTeam(team)) {
  // Enable editing
} else {
  // Disable editing
}
```

### Updating Entities

When updating an entity, always update the `updated_by` field:
```typescript
import { updateOwnershipMetadata } from './utils/ownership';

const updatedPlayer = {
  ...player,
  name: 'New Name',
  ...updateOwnershipMetadata(player), // Updates updated_by and updated_at
};
```

---

## 🎯 Future Enhancements

### Planned Features

1. **Email Verification**
   - Send verification emails
   - Transfer ownership on verification

2. **Phone Verification**
   - SMS verification codes
   - Transfer ownership on verification

3. **Role-Based Access Control**
   - Fine-grained permissions
   - Custom roles (admin, moderator, viewer)

4. **Club Hierarchies**
   - Organization-level permissions
   - Multi-tier ownership

5. **Public Leaderboards**
   - Verified players only
   - Trust badges for verified users

6. **Audit Logs**
   - Full history of changes
   - "Who changed what when"
   - Rollback capabilities

---

## ⚠️ Important Notes

### Google OAuth Setup
**Google login will NOT work until you complete OAuth setup!**

Follow instructions at:
https://supabase.com/docs/guides/auth/social-login/auth-google

Without this setup, users will see: `"provider is not enabled"` error

### Phone Authentication Setup
**Phone/OTP login requires SMS provider configuration!**

Configure in Supabase Dashboard:
- Authentication → Providers → Phone

### Security Considerations

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend**
2. **Always validate ownership on server-side** (for production)
3. **Use HTTPS in production** to protect auth tokens
4. **Implement rate limiting** to prevent abuse

---

## 📝 API Reference

### Authentication Functions

**File:** `/utils/auth.ts`

| Function | Description | Returns |
|----------|-------------|---------|
| `signInWithGoogle()` | Initiates Google OAuth flow | `Promise<{success, error?}>` |
| `signInWithPhone(phoneNumber)` | Sends OTP to phone number | `Promise<{success, error?}>` |
| `verifyOtp(phoneNumber, otp)` | Verifies OTP code | `Promise<{success, error?}>` |
| `getCurrentUser()` | Gets current user profile | `Promise<VScorUser \| null>` |
| `getCurrentUserId()` | Gets current user ID | `string \| null` |
| `signOut()` | Signs out current user | `Promise<void>` |
| `isAuthenticated()` | Checks if user is logged in | `Promise<boolean>` |

### Ownership Functions

**File:** `/utils/ownership.ts`

| Function | Description |
|----------|-------------|
| `createPlayerOwnership()` | Creates ownership metadata for new player |
| `createTeamOwnership()` | Creates ownership metadata for new team |
| `createTournamentOwnership()` | Creates ownership metadata for new tournament |
| `canEditPlayer(player)` | Checks if current user can edit player |
| `canEditTeam(team)` | Checks if current user can edit team |
| `canEditTournament(tournament)` | Checks if current user can edit tournament |
| `transferPlayerOwnership(player, newOwnerId)` | Transfers player ownership |
| `addTeamCoordinator(team, coordinatorId)` | Adds coordinator to team |
| `removeTeamCoordinator(team, coordinatorId)` | Removes coordinator from team |
| `addTournamentCoordinator(tournament, coordinatorId)` | Adds coordinator to tournament |
| `removeTournamentCoordinator(tournament, coordinatorId)` | Removes coordinator from tournament |

---

## 🎉 Summary

VScor now has a complete authentication and ownership system that:

✅ Tracks user identity with Google OAuth and Phone auth
✅ Records all actions with `created_by` and `updated_by`
✅ Enforces profile-level ownership permissions
✅ Supports multi-admin access for teams and tournaments
✅ Provides public viewing with restricted editing
✅ Lays foundation for verified players, leaderboards, and advanced features

**Remember to complete OAuth setup before deploying!** 🚀
