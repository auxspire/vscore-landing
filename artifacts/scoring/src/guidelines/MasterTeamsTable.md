# Master Teams Table System - Implementation Guide

## Overview

The VScor app now implements a **Master Teams Table** system that ensures all teams created within the app are permanently stored and reusable across tournaments, friendly matches, and leagues. This provides data consistency, prevents duplication, and enables scalability.

## Architecture

### Data Storage Structure

```
┌─────────────────────────┐
│  Master Teams Table     │  ← Permanent storage of all teams
│  (vscor_master_teams)   │
└────────────┬────────────┘
             │
             │ References
             │
┌────────────▼────────────┐
│ Tournament-Teams Table  │  ← Junction table linking teams to tournaments
│(vscor_tournament_teams) │
└─────────────────────────┘
```

### Key Components

#### 1. **Master Teams Table** (`vscor_master_teams`)
Stores all teams permanently with the following structure:
- `id`: Unique team identifier
- `name`: Team name (must be unique, case-insensitive)
- `coach`: Coach/manager name
- `homeVenue`: Home venue
- `description`: Team description
- `imageUrl`: Team logo/image
- `players`: Array of player data
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

#### 2. **Tournament-Teams Junction Table** (`vscor_tournament_teams`)
Links teams to tournaments:
- `tournamentId`: Tournament ID
- `teamId`: Team ID (references Master Teams)
- `addedAt`: Timestamp when team was added to tournament

## Core Features

### ✅ 1. Duplicate Prevention

When creating a new team, the system:
1. Checks if a team with the same name already exists (case-insensitive)
2. If duplicate found, shows a dialog with two options:
   - **Use Existing Team**: Links the existing team to the current tournament
   - **Modify Name**: User can change the team name to create a unique team

**Locations:**
- **AddTeam Component**: Shows dialog when creating a standalone team
- **Tournament Profile → Manage Teams**: Shows dialog when creating a team from within a tournament

### ✅ 2. Global Team Reusability

Teams in the Master Teams Table are available:
- ✓ In all future tournaments
- ✓ For friendly matches
- ✓ In league creation
- ✓ In global team listings
- ✓ In search results

### ✅ 3. Data Integrity Safeguards

#### Deleting Teams from Tournaments
- Removing a team from a tournament **does NOT delete** it from the Master Teams Table
- Team remains available for other tournaments and matches
- Only the tournament-team link is removed

#### Deleting Master Teams
The system prevents deletion if:
- Team is linked to any active tournaments
- Team has historical match data (future implementation)

#### Checking Deletion Status
```javascript
import { canDeleteMasterTeam } from './utils/teamManagement';

const deleteCheck = canDeleteMasterTeam(teamId);
if (deleteCheck.canDelete) {
  // Safe to delete
} else {
  // Show warning: deleteCheck.reason
  // Lists: deleteCheck.linkedTournamentIds
}
```

## Usage Examples

### Adding a Team to a Tournament

**From Tournament Profile → Manage Teams:**

```javascript
// 1. User clicks "Add New Team"
// 2. Enters team name: "Arsenal FC"
// 3. System checks for duplicates using findTeamByName()
// 4. If duplicate found, shows dialog
// 5. If not duplicate, calls addTeamToMasterTable()
// 6. Creates tournament-team link using linkTeamToTournament()
```

### Searching for Teams

**From Tournament Profile → Manage Teams → Search:**

```javascript
// Shows all teams from Master Teams Table
// that are NOT already linked to this tournament
const availableTeams = getUnlinkedTeamsForTournament(tournamentId);
```

### Legacy Data Migration

On app initialization, the system automatically:
1. Checks if Master Teams Table is empty
2. If empty but legacy teams exist, migrates them
3. Prevents duplicate migrations
4. Logs migration progress to console

```javascript
useEffect(() => {
  // Auto-migration runs on app load
  // Check console for migration logs
}, []);
```

## API Reference

### Team Management Utilities (`/utils/teamManagement.ts`)

#### Core Functions

**`getAllMasterTeams()`**
Returns all teams from Master Teams Table.

**`getMasterTeamById(teamId)`**
Retrieves a single team by ID.

**`findTeamByName(teamName)`**
Checks if a team with the given name exists (case-insensitive).
Returns the team object or null.

**`addTeamToMasterTable(teamData)`**
Adds a new team to Master Teams Table.
Returns the new team ID.

```javascript
const teamId = addTeamToMasterTable({
  name: 'Manchester United',
  coach: 'Erik ten Hag',
  homeVenue: 'Old Trafford',
  description: 'Premier League club',
  imageUrl: 'base64...',
  players: []
});
```

**`updateMasterTeam(teamId, updates)`**
Updates an existing team in Master Teams Table.

**`linkTeamToTournament(tournamentId, teamId)`**
Creates a tournament-team link.
Returns boolean indicating success.

**`unlinkTeamFromTournament(tournamentId, teamId)`**
Removes tournament-team link without deleting team.

**`getTeamsForTournament(tournamentId)`**
Returns all teams linked to a specific tournament.

**`getTournamentsForTeam(teamId)`**
Returns all tournament IDs where a team is participating.

**`getUnlinkedTeamsForTournament(tournamentId)`**
Returns teams NOT linked to the specified tournament.

**`canDeleteMasterTeam(teamId)`**
Checks if a team can be safely deleted.
Returns: `{ canDelete: boolean, reason?: string, linkedTournamentIds?: number[] }`

**`deleteMasterTeam(teamId)`**
Deletes a team from Master Teams Table (if allowed).
Returns: `{ success: boolean, message: string }`

## Console Logs

The system provides detailed console logging for debugging:

### Team Creation
```
=== ADD TEAM TO MASTER TABLE ===
Team data received: { name: "Arsenal FC", coach: "Mikel Arteta", ... }
✅ Team added to Master Teams Table with ID: 1234567890
Updated teams (legacy): 5
=================================
```

### Tournament Team Linking
```
✅ Team linked to tournament: { tournamentId: 123, teamId: 456 }
```

### Team Removal from Tournament
```
✅ Team removed from tournament (still in Master Teams): { teamId: 456, tournamentId: 123 }
```

### Migration
```
🔄 Starting migration of legacy teams to Master Teams Table...
✅ Migrated team: Arsenal FC (ID: 1234567890)
✅ Migration complete: 10 teams in Master Teams Table
```

## User Experience Flow

### Creating a Team in Tournament Context

1. **User navigates to Tournament Profile**
2. **Clicks "Manage Teams" button**
3. **Clicks "Add New Team"**
4. **Enters team details:**
   - Team Name: "Barcelona FC"
   - Coach: "Xavi Hernandez"
   - Home Venue: "Camp Nou"
5. **Clicks "Create & Add to Tournament"**
6. **System checks for duplicates**
   - **If duplicate found:**
     - Shows dialog with existing team details
     - Offers to use existing team or change name
   - **If not duplicate:**
     - Saves to Master Teams Table
     - Links to current tournament
     - Shows success feedback
7. **Team appears in tournament's participating teams list**
8. **Team is now available for all future tournaments**

### Adding Existing Team to Tournament

1. **User navigates to Tournament Profile**
2. **Clicks "Manage Teams" button**
3. **Uses search box to find existing team**
4. **System shows teams from Master Teams Table**
   - Only shows teams NOT already in this tournament
5. **Clicks "Add" button next to desired team**
6. **Team is linked to tournament immediately**

## Backward Compatibility

The system maintains backward compatibility with legacy team storage:
- Legacy teams in `vscor_teams` are automatically migrated
- New teams are saved to both Master Teams Table and legacy storage
- Existing code continues to work with `registeredTeams` state

## Future Enhancements

Potential improvements for a production database system:
- Match history tracking for teams
- Enhanced deletion restrictions based on match data
- Team statistics aggregation across tournaments
- Team ownership and access control
- Multi-tournament team performance analytics

## Testing Checklist

✅ Test creating a new team from "Add Team" page
✅ Test creating a new team from tournament "Manage Teams"
✅ Test duplicate team detection and dialog
✅ Test using existing team when duplicate found
✅ Test adding existing team to tournament from search
✅ Test removing team from tournament (verify it stays in Master Teams)
✅ Test that removed team is available for other tournaments
✅ Test searching for teams in "Manage Teams" dialog
✅ Test migration of legacy teams on app initialization
✅ Test max teams limit in tournaments
✅ Verify console logs for all operations

## Troubleshooting

### "Team not found in Master Teams Table"
- Check if team was properly created
- Verify Master Teams Table is populated: `localStorage.getItem('vscor_master_teams')`

### "Team already linked to this tournament"
- Team-tournament link already exists
- Check `vscor_tournament_teams` for existing link

### Duplicate teams being created
- Ensure `findTeamByName()` is called before creating team
- Check case-insensitive comparison is working

### Migration not running
- Check console logs on app initialization
- Verify legacy teams exist in `vscor_teams`
- Check if Master Teams Table is already populated

## Support

For issues or questions about the Master Teams Table system:
1. Check console logs for detailed error messages
2. Verify localStorage contains expected data structures
3. Review the team management utility functions in `/utils/teamManagement.ts`
4. Check the TournamentProfileScreenUpdated component for duplicate prevention dialogs
