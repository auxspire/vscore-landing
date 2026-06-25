# Tournament Flexibility System - Complete Guide

## Overview

The VScor tournament flexibility system allows complete editing freedom until the **final match is completed**, reflecting real-world local tournament scenarios where teams may withdraw, new teams may be added, and structural adjustments may be required mid-tournament.

---

## Key Principles

### 1️⃣ **Lock Point: Final Match Completion**

- **All tournament details remain editable until the final match status = "Completed"**
- Once all matches are completed, structural edits are locked
- This replaces the previous lock point (fixtures published)

### 2️⃣ **Completed Matches Are Sacred**

- Completed match results are **never deleted**
- All player statistics and match events are preserved
- Structural changes affect only **future fixtures**

### 3️⃣ **Real-World Flexibility**

- Teams can withdraw at any stage
- New teams can be added mid-tournament
- Format changes are allowed (with warnings)
- Dates can be adjusted throughout the tournament

---

## Tournament States

The system recognizes four tournament states:

### 📝 Draft
- Fixtures not yet generated or published
- Full editing freedom
- No warnings needed

### 📢 Published
- Fixtures published but no matches started
- Full editing freedom with confirmation dialogs
- Changes may require fixture regeneration

### 🔴 Live
- At least one match has been played
- Full editing freedom with impact previews
- Completed matches preserved, future fixtures adjustable

### 🏆 Completed
- All matches completed
- **Structural editing locked**
- View-only mode (except for match data corrections)

---

## What Can Be Edited (Until Completion)

### ✅ Always Editable (Until Final Match)

#### Tournament Details Section
- Tournament Name
- Place/Location
- Venue
- **Start Date** *(moved from Format section)*
- **End Date** *(moved from Format section)*
- Coordinator Name
- Coordinator Contact
- Registration Fee
- Tournament Image

#### Tournament Format & Structure
- Tournament Format (League, Knockout, Group+Knockout)
- Maximum Number of Teams
- Players Per Team
- Match Duration
- Round Robin Rounds (1-5)
- Number of Groups
- Teams Per Group
- Teams Progressing Per Group

#### Prize Configuration
- Cash Prize
- Trophy
- Certificates
- Other Prizes

#### Team Management
- Add Teams
- Remove Teams (with withdrawal support)
- Team Registration

---

## Team Management Features

### Adding Teams

#### During Draft Phase
- Teams added directly
- No warnings needed
- Can exceed max teams (with warning)

#### During Published/Live Phase
- **Impact Preview Dialog** shows:
  - Current tournament state
  - Whether fixture regeneration is needed
  - Suggested next steps
- Confirmation required
- Suggestion to regenerate fixtures appears after adding

### Removing Teams (Withdrawal Support)

#### During Draft Phase
- Team removed directly
- No fixture impact

#### During Published/Live Phase
- **Team Withdrawal Dialog** appears with:
  - Number of completed matches (preserved)
  - Number of upcoming matches (voided)
  - Cannot proceed if team has live matches
  - Clear impact summary

#### What Happens on Withdrawal
1. ✅ Completed matches **preserved**
2. ⚠️ Upcoming matches **voided/forfeited**
3. 📊 Standings **updated dynamically**
4. 🔄 Team **removed from tournament** (still in Master Teams)

---

## Format/Structure Change Handling

### When You Attempt a Structural Change

1. **Detection**: System detects if change is structural:
   - Format type change
   - Max teams change
   - Group configuration change
   - Round Robin rounds change

2. **Impact Preview**: Shows:
   - ✅ Completed matches to be preserved
   - ⚠️ Future fixtures to be regenerated
   - 📋 Warnings about affected matches

3. **Confirmation Required**: User must approve changes

4. **Preservation Logic**:
   - Completed matches remain in database
   - Fixture list filtered to preserve completed
   - User prompted to regenerate remaining fixtures
   - Tournament marked as "Draft" for fixture regeneration

### Example Scenarios

#### Scenario 1: Change from League to Knockout (Live Tournament)
```
State: Live (5 matches completed, 10 upcoming)
Action: Change format to Knockout
Result:
  ✅ 5 completed matches preserved
  ⚠️ 10 upcoming fixtures cleared
  🔄 User can regenerate knockout bracket
```

#### Scenario 2: Increase Team Count (Published)
```
State: Published (fixtures generated, no matches played)
Action: Increase max teams from 8 to 12
Result:
  ⚠️ Fixtures cleared
  🔄 User can regenerate with 12 teams
```

---

## User Experience Flow

### Team Withdrawal Flow

```
1. User clicks Remove button on team
   ↓
2. System checks tournament state
   ↓
3. If Live/Published:
   - Preview impact dialog appears
   - Shows completed/upcoming match counts
   - Shows warnings if live matches exist
   ↓
4. User confirms withdrawal
   ↓
5. System:
   - Preserves completed matches
   - Voids upcoming matches
   - Removes team from tournament
   - Updates localStorage
   ↓
6. Success confirmation
```

### Mid-Tournament Team Addition Flow

```
1. User adds team via Manage Teams
   ↓
2. System checks tournament state
   ↓
3. If Live/Published:
   - Impact preview appears
   - Suggests fixture regeneration
   ↓
4. User confirms addition
   ↓
5. Team added to tournament
   ↓
6. Suggestion: "Regenerate fixtures to include this team"
```

### Format Change Flow

```
1. User edits format/structure
   ↓
2. System detects structural change
   ↓
3. Impact Preview Dialog shows:
   - Completed matches (preserved)
   - Future fixtures (affected)
   - Warnings
   ↓
4. User confirms changes
   ↓
5. System:
   - Preserves completed matches
   - Clears/updates future fixtures
   - Marks tournament for regeneration
   ↓
6. User can regenerate fixtures
```

---

## Technical Implementation

### Files Modified

1. **`/utils/tournamentFlexibility.ts`** (NEW)
   - Tournament state detection
   - Impact preview generation
   - Team withdrawal logic
   - Structural change detection

2. **`/components/TournamentProfileScreenUpdated.tsx`**
   - Integrated new utility functions
   - Added withdrawal dialog
   - Added impact preview dialogs
   - Updated lock logic (completed vs published)
   - Added tournament state badges
   - Moved dates to Tournament Details section

### Key Functions

#### `getTournamentState()`
Returns tournament state and editing permissions based on match completion.

#### `previewTeamWithdrawal()`
Analyzes impact of removing a team, showing affected matches.

#### `previewMidTournamentTeamAddition()`
Shows impact of adding a team during live tournament.

#### `previewStructuralChange()`
Previews impact of format/structure changes on fixtures.

#### `withdrawTeam()`
Executes team withdrawal, voiding future matches while preserving completed ones.

#### `isStructuralChange()`
Detects if format changes are structural (require fixture regeneration).

---

## UI Components

### Tournament State Badge
Shows current state (Draft/Published/Live/Completed) with icon and color coding.

### Tournament State Info Cards
- **Live**: Blue card showing completed matches, explains flexibility
- **Completed**: Purple card explaining structural lock

### Team Withdrawal Dialog
- Shows impact preview
- Lists completed vs upcoming matches
- Clear warnings and confirmations
- Cannot proceed if live matches exist

### Structural Change Warning Dialog
- Updated to show impact preview
- Lists what will be preserved
- Lists what will be affected
- Clear action buttons

---

## Safety Layers

### 1. Live Match Protection
Cannot withdraw a team with live matches in progress.

### 2. Completed Match Preservation
Completed matches are **never deleted**, only filtered in fixture regeneration.

### 3. Confirmation Dialogs
All potentially destructive actions require user confirmation.

### 4. Impact Previews
Users always see what will happen before changes are applied.

### 5. State-Based Permissions
Edit buttons disabled only when tournament is completed.

---

## Date Management

### Previous Location
Start/End dates were in "Format & Structure" section

### Current Location
Start/End dates are now in **"Tournament Details"** section

### Reasoning
Dates are tournament metadata, not structural configuration.

### Validation
- End date cannot be earlier than start date
- Start date required for published tournaments

---

## Backwards Compatibility

### Existing Tournaments
- All existing tournaments continue to work
- New state detection applies automatically
- No migration needed

### Legacy Fixtures
- Existing fixtures preserved
- System adapts to current tournament state

---

## Testing Scenarios

### Test 1: Team Withdrawal (Live Tournament)
1. Create tournament with 4 teams
2. Generate and publish fixtures
3. Complete 2 matches
4. Remove a team
5. Verify: Completed matches preserved, upcoming matches voided

### Test 2: Mid-Tournament Team Addition
1. Create tournament with 6 teams
2. Publish fixtures
3. Complete 3 matches
4. Add new team
5. Verify: Impact preview shown, suggestion to regenerate

### Test 3: Format Change (Live)
1. Create league tournament
2. Play 5 matches
3. Change to knockout format
4. Verify: 5 matches preserved, fixtures cleared, can regenerate

### Test 4: Tournament Completion Lock
1. Create tournament
2. Complete all matches
3. Verify: All edit buttons disabled, state shows "Completed"

---

## Future Enhancements

### Potential Additions
1. **Partial Fixture Regeneration**: Regenerate only affected matches
2. **Manual Match Voiding**: Admin override for specific matches
3. **Team Replacement**: Replace withdrawn team with new team in fixtures
4. **Bracket Restructuring**: Dynamic knockout bracket updates
5. **Group Rebalancing**: Automatic group rebalancing when teams added/removed

---

## Summary

The Tournament Flexibility System provides:

✅ **Complete editing freedom until final match completion**  
✅ **Real-world team withdrawal support**  
✅ **Mid-tournament team addition**  
✅ **Structural change flexibility**  
✅ **Completed match preservation**  
✅ **Clear impact previews**  
✅ **Intuitive user experience**  
✅ **State-based permissions**  
✅ **Proper date placement**  
✅ **Safety layers and confirmations**  

The system maintains data integrity while providing the flexibility needed for real-world local tournaments.

---

*Last Updated: February 25, 2026*
