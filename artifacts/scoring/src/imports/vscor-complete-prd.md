# VScor - Complete Product Requirements Document

## Document Information
- **Version**: 2.0
- **Last Updated**: March 8, 2026
- **Status**: Current Implementation State
- **Document Type**: Engineering Blueprint

---

## 1. Product Vision

### 1.1 What VScor Is

VScor is a mobile-first, offline-capable football (soccer) match scoring and tournament management application designed for grassroots and amateur football communities. It digitizes real-time match events, maintains comprehensive player and team statistics, automates tournament standings, and provides transparent match payment tracking.

### 1.2 Target Users

**Primary Users:**
- **Match Scorers**: Individuals responsible for recording live match events
- **Tournament Coordinators**: Organizers managing tournaments, fixtures, and participating teams
- **Team Coordinators**: Team managers handling team profiles, player rosters, and match payments
- **Players**: Football players who want to track their personal statistics and performance
- **Audience/Spectators**: Users viewing live scores, match results, and tournament standings

**Geographic Focus:**
- Grassroots football communities in regions with unreliable internet connectivity
- Amateur leagues and pickup game organizers
- Community sports centers and local tournaments

### 1.3 Core Problems Solved

1. **Real-Time Match Digitization**: Replaces paper-based scoring with digital event tracking
2. **Statistical Accuracy**: Eliminates manual calculation errors in player and team statistics
3. **Tournament Management Complexity**: Automates fixture generation, standings calculation, and tournament progression
4. **Data Ownership & Transparency**: Provides clear ownership model with user-controlled data
5. **Internet Dependency**: Functions fully offline with background cloud synchronization
6. **Match Payment Tracking**: Transparent payment calculation and collection management for pay-to-play matches
7. **Scorer Accountability**: Clear assignment and division of scoring responsibilities with dual-scorer support

### 1.4 Long-Term Vision

VScor aims to become the comprehensive digital infrastructure for amateur football ecosystems, enabling:
- Multi-league federation management
- Advanced analytics and player scouting
- Live match streaming integration
- Cross-tournament player transfer tracking
- Automated referee assignment and management
- Sponsorship and revenue management tools
- Mobile app ecosystem for scorers, players, and spectators

---

## 2. Design Philosophy

### 2.1 Offline-First Architecture

**Principle**: The application must function completely without internet connectivity.

**Implementation**:
- LocalStorage as the primary data store
- All CRUD operations execute locally first
- Cloud sync happens asynchronously in the background
- User never experiences loading states due to network requests
- Sync conflicts resolved through timestamp-based resolution with user notification

### 2.2 Simplicity for Grassroots Football

**Principle**: Minimize complexity while maximizing utility.

**Implementation**:
- Three-tab bottom navigation (Live Scores, Scoring, Info)
- Two-tap event recording for common actions
- Progressive disclosure of advanced features
- Clear visual hierarchy with card-based layouts
- Minimal text input requirements with autocomplete suggestions

### 2.3 Real-Time Match Digitization

**Principle**: Match events must be recordable as they happen.

**Implementation**:
- Live scoring screen remains open throughout match
- Event recording completes in under 2 seconds
- Automatic score calculation and display
- Real-time event timeline with edit/delete capabilities
- Automatic date and time capture when scoring begins

### 2.4 Minimal Friction for Scorers

**Principle**: Scoring should require minimal cognitive load.

**Implementation**:
- Three scoring complexity levels (Basic, Intermediate, Advanced)
- Smart defaults for common scenarios
- Event type buttons prominently displayed
- Player selection with visual squad layout
- One-screen event capture without navigation
- Optional dual-scorer mode for parallel event recording

### 2.5 Transparency and Ownership of Data

**Principle**: Users maintain control and visibility of their data.

**Implementation**:
- Clear ownership attribution (created_by, owner_user_id)
- Editing permissions tied to ownership
- Ownership transfer capability
- Public viewing with edit restrictions
- Transparent match payment calculations

### 2.6 Flexible Tournament Management

**Principle**: Support diverse tournament formats without rigid constraints.

**Implementation**:
- Multiple tournament formats (Round Robin, Groups + Knockout, Pure Knockout)
- Mid-tournament team addition/removal
- Manual fixture editing and regeneration
- Tournament stage labeling (Group Stage, Quarter Final, etc.)
- Friendly match support outside tournament context

---

## 3. User Roles and Permissions

### 3.1 Role Definitions

#### 3.1.1 App User (Unauthenticated)
**Capabilities:**
- View Info tab content (players, teams, tournaments, match results)
- Browse player statistics
- View team profiles
- View tournament standings
- Cannot create, edit, or score matches

#### 3.1.2 Registered User (Authenticated)
**Capabilities:**
- All App User capabilities
- Create and edit their own player profile
- Create teams and tournaments
- Create and score matches
- Transfer ownership of entities they own
- Claim and link their profile to their user account

#### 3.1.3 Profile Owner
**Ownership Scope**: Player profile

**Capabilities:**
- Edit personal player profile (name, position, jersey number, photo)
- View detailed statistics
- Link player profile to user account (owner_user_id)
- Control profile visibility settings

**Restrictions:**
- Cannot delete profiles that are linked to match history
- Cannot transfer ownership to non-registered users

#### 3.1.4 Team Coordinator
**Ownership Scope**: Team profile

**Capabilities:**
- Edit team details (name, coach, home venue, description, logo)
- Add/remove players from team roster
- View team statistics
- Transfer team ownership
- Manage team-level payment settings

**Restrictions:**
- Cannot delete teams that are linked to tournament history
- Cannot remove players from teams after matches have been played

#### 3.1.5 Tournament Coordinator
**Ownership Scope**: Tournament profile

**Capabilities:**
- Edit tournament details (name, format, dates, rules)
- Add/remove participating teams
- Generate and publish fixtures
- Regenerate fixtures with confirmation
- Set match-level rules (duration, players per team)
- Transfer tournament ownership
- Manage tournament stages

**Restrictions:**
- Cannot delete tournaments with recorded match results
- Cannot change tournament format after fixtures are generated (requires regeneration)

#### 3.1.6 Match Owner
**Ownership Scope**: Individual match

**Capabilities:**
- Edit match details (venue, teams, date, time)
- Assign primary and secondary scorers
- Transfer match ownership
- Calculate and manage match payments
- Delete match (if no events recorded)
- Edit scorer assignments and responsibility divisions

**Restrictions:**
- Cannot delete matches with recorded events without confirmation
- Cannot transfer ownership to non-registered users

#### 3.1.7 Primary Scorer
**Assignment**: Assigned by Match Owner (defaults to match creator)

**Capabilities:**
- Record match events according to assigned responsibilities
- Edit/delete events during live scoring
- Finalize and share match results
- View real-time match statistics

**Restrictions:**
- Cannot edit match configuration
- Cannot calculate payments (only Match Owner can)
- Can only record events for assigned team (if team-based division)
- Can only record assigned event types (if event-based division)

#### 3.1.8 Secondary Scorer (Advanced Mode Only)
**Assignment**: Assigned by Match Owner (optional)

**Capabilities:**
- Record match events according to assigned responsibilities
- Parallel event recording with Primary Scorer
- View real-time match statistics

**Restrictions:**
- Same as Primary Scorer
- Only available when scoring level is "Advanced"
- Must have distinct responsibilities from Primary Scorer

### 3.2 Ownership Transfer Rules

**General Rules:**
1. Only current owner can initiate ownership transfer
2. New owner must be a registered user in the system
3. Transfer is immediate upon confirmation
4. System logs transfer with timestamp and previous owner

**Entity-Specific Transfer:**
- **Player Profile**: Can transfer to any registered user
- **Team**: Can transfer to team coordinators or registered users
- **Tournament**: Can transfer to tournament coordinators or registered users
- **Match**: Can transfer to assigned scorers or registered users

### 3.3 Viewing Permissions

**Public Viewing (All Users):**
- Info tab content (players, teams, tournaments)
- Match results and statistics
- Tournament standings
- Player leaderboards
- Team profiles

**Authenticated Viewing:**
- Personal match history ("My Matches" screen)
- Matches they created or scored
- Draft/pending matches

**Owner-Only Viewing:**
- Edit controls for owned entities
- Payment calculation details
- Ownership transfer options

---

## 4. Authentication System

### 4.1 Authentication Method

**Current Implementation**: Email/Password Authentication via Supabase Auth

**Previous Implementation**: Google OAuth (deprecated, replaced with email/password)

### 4.2 User Registration Flow

1. **Account Creation**:
   - User navigates to signup screen
   - Enters email, password, and full name
   - Backend validates email format and password strength
   - Supabase creates user account with `email_confirm: true` (auto-confirmation)
   - User ID (`user_id`) generated by Supabase

2. **Profile Creation**:
   - Upon first login, system checks for existing player profile
   - If no profile exists, prompts user to create or claim profile
   - User can link to existing player profile or create new one
   - Player profile linked via `owner_user_id` field

3. **Session Management**:
   - Access token stored in localStorage
   - Session checked on app load
   - Auto-refresh token mechanism
   - Logout clears local session and tokens

### 4.3 User ID Generation

**Format**: UUID generated by Supabase Auth

**Storage**:
- Primary: Supabase Auth system
- Local: Cached in localStorage as `vscor_currentUser`
- Cloud: Synced to KV store with key `user_{user_id}`

**Usage**:
- `owner_user_id`: Links entities to creating user
- `created_by`: Audit trail for entity creation
- `scoredBy`: Tracks match scorer (legacy, mapped to primaryScorer.user_id)

### 4.4 User Profile Structure

```javascript
{
  user_id: string,           // Supabase auth UUID
  email: string,             // User email
  name: string,              // Full name
  profile_photo: string,     // Profile image URL
  phone_number: string,      // Optional phone
  created_at: timestamp,     // Account creation
  last_login: timestamp      // Last successful login
}
```

### 4.5 Action Tracking

**Audit Fields on All Entities:**
- `created_by`: User ID who created the entity
- `created_at`: Timestamp of creation
- `updated_by`: User ID of last editor
- `updated_at`: Timestamp of last edit
- `owner_user_id`: Current owner's user ID

### 4.6 Social Login Support (Future)

**Planned Providers:**
- Google OAuth
- Facebook Login
- GitHub OAuth
- Phone number authentication

**Note**: Social login requires provider setup in Supabase dashboard (not yet configured)

---

## 5. Data Architecture

### 5.1 Core Entities

#### 5.1.1 User
```javascript
{
  user_id: string,              // Primary key (UUID)
  email: string,                // Unique
  name: string,
  phone_number: string,
  profile_photo: string,
  created_at: timestamp,
  last_login: timestamp
}
```

**Storage**: 
- Local: `localStorage['vscor_currentUser']`
- Cloud: `kv_store_845a157a` with key `user_{user_id}`

#### 5.1.2 Player Profile
```javascript
{
  id: string,                   // Primary key (UUID)
  name: string,                 // Required
  email: string,                // Optional
  phoneNumber: string,          // Optional
  position: string,             // e.g., "Forward", "Midfielder"
  jerseyNumber: string,         // Optional
  imageUrl: string,             // Profile photo
  owner_user_id: string,        // FK to User (null for unclaimed profiles)
  created_by: string,           // FK to User
  created_at: timestamp,
  updated_by: string,           // FK to User
  updated_at: timestamp,
  
  // Computed statistics (calculated from match events)
  matchesPlayed: number,
  goals: number,
  assists: number,
  shotsOnTarget: number,
  shotsOffTarget: number,
  fouls: number,
  yellowCards: number,
  redCards: number,
  cleanSheets: number,
  interceptions: number,
  offsides: number
}
```

**Storage**: 
- Local: `localStorage['vscor_players']` (array)
- Cloud: `kv_store_845a157a` with key `player_{player_id}`

**Relationships**:
- One-to-one with User (via owner_user_id)
- Many-to-many with Teams (via team rosters)
- One-to-many with Match Events (as player involved)

#### 5.1.3 Team
```javascript
{
  id: string,                   // Primary key (UUID)
  name: string,                 // Required, unique per context
  coach: string,                // Optional
  homeVenue: string,            // Optional
  description: string,          // Optional
  imageUrl: string,             // Team logo
  players: [                    // Embedded player roster
    {
      id: string,               // FK to Player
      name: string,
      position: string,
      jerseyNumber: string
    }
  ],
  owner_user_id: string,        // FK to User
  created_by: string,
  created_at: timestamp,
  updated_by: string,
  updated_at: timestamp,
  
  // Computed statistics
  matchesPlayed: number,
  wins: number,
  draws: number,
  losses: number,
  goalsScored: number,
  goalsConceded: number,
  goalDifference: number,
  points: number
}
```

**Storage**: 
- Local: `localStorage['vscor_teams']` (array)
- Cloud: `kv_store_845a157a` with key `team_{team_id}`

**Relationships**:
- Many-to-many with Players (embedded in players array)
- Many-to-many with Tournaments (via tournament_teams)
- One-to-many with Matches (as team1 or team2)

#### 5.1.4 Tournament
```javascript
{
  id: string,                   // Primary key (UUID)
  name: string,                 // Required
  format: string,               // "round-robin" | "groups-knockout" | "knockout"
  startDate: string,            // ISO date
  endDate: string,              // ISO date
  venue: string,                // Optional
  description: string,          // Optional
  imageUrl: string,             // Tournament logo
  
  // Tournament rules
  matchDuration: number,        // Minutes
  playersPerTeam: number,       // 5, 7, 11, etc.
  pointsForWin: number,         // Default: 3
  pointsForDraw: number,        // Default: 1
  pointsForLoss: number,        // Default: 0
  
  // Format-specific configuration
  groups: [                     // For groups-knockout format
    {
      name: string,             // "Group A", "Group B"
      teamIds: [string]         // Array of team IDs
    }
  ],
  knockoutTeams: number,        // Number of teams in knockout stage
  teamsPerGroup: number,        // For group stage
  
  // Teams
  participatingTeams: [         // All teams in tournament
    {
      id: string,               // FK to Team
      name: string
    }
  ],
  
  // Fixtures
  fixtures: [                   // Generated or manual
    {
      id: string,
      team1: string,            // Team name
      team2: string,            // Team name
      team1Id: string,          // FK to Team
      team2Id: string,          // FK to Team
      stage: string,            // "group-stage", "quarter-final", etc.
      group: string,            // "Group A" (for group stage)
      round: number,            // Round number
      matchDate: string,        // ISO date
      matchTime: string,        // "HH:mm"
      venue: string,
      status: string,           // "scheduled", "live", "completed"
      result: {                 // Populated after match
        team1Score: number,
        team2Score: number,
        matchId: string         // FK to Match
      }
    }
  ],
  
  owner_user_id: string,        // FK to User
  created_by: string,
  created_at: timestamp,
  updated_by: string,
  updated_at: timestamp
}
```

**Storage**: 
- Local: `localStorage['vscor_tournaments']` (array)
- Cloud: `kv_store_845a157a` with key `tournament_{tournament_id}`

**Relationships**:
- Many-to-many with Teams (via participatingTeams)
- One-to-many with Matches (via fixtures)

#### 5.1.5 Match
```javascript
{
  id: string,                   // Primary key (UUID)
  
  // Basic match info
  team1: string,                // Team name
  team2: string,                // Team name
  team1Id: string,              // FK to Team (optional)
  team2Id: string,              // FK to Team (optional)
  
  // Match details
  matchFormat: string,          // "single" | "halves"
  duration: number,             // Total duration in minutes
  venue: string,
  playersPerTeam: number,
  
  // Scores
  scoreA: number,               // Team 1 score
  scoreB: number,               // Team 2 score
  
  // Tournament context
  tournament: string,           // Tournament name or "Friendly Match"
  tournamentId: string,         // FK to Tournament (null for friendly)
  tournamentStage: string,      // "group-stage", "semi-final", etc.
  
  // Timing
  startTime: timestamp,         // When match created
  matchDate: string,            // ISO date (auto-set on scoring start)
  matchTime: string,            // "HH:mm" (auto-set on scoring start)
  
  // Scoring level
  scoringLevel: string,         // "basic" | "intermediate-detailed" | "intermediate-all" | "advanced"
  
  // Ownership and scorer assignment (NEW)
  owner_user_id: string,        // FK to User (match creator)
  scoredBy: string,             // Legacy: primary scorer user_id
  primaryScorer: {              // Primary scorer details
    user_id: string,            // FK to User
    name: string
  },
  secondaryScorer: {            // Secondary scorer (Advanced only)
    user_id: string,            // FK to User
    name: string
  } | null,
  
  // Responsibility division (NEW)
  responsibilityType: string,   // "team" | "event" | null
  teamScorerMapping: {          // If responsibilityType === "team"
    team1: string,              // user_id of scorer for team1
    team2: string               // user_id of scorer for team2
  } | null,
  eventScorerMapping: {         // If responsibilityType === "event"
    [user_id]: [string]         // Array of event types per scorer
  } | null,
  
  // Squads
  squad1: [                     // Team 1 squad
    {
      id: string,               // FK to Player
      name: string,
      position: string,
      jerseyNumber: string,
      imageUrl: string
    }
  ],
  squad2: [                     // Team 2 squad
    {
      id: string,
      name: string,
      position: string,
      jerseyNumber: string,
      imageUrl: string
    }
  ],
  
  // Match events
  events: [
    {
      id: string,               // Event UUID
      type: string,             // Event type (see Event Types)
      team: string,             // "team1" | "team2"
      player: string,           // Player name
      playerId: string,         // FK to Player
      minute: number,           // Match minute
      attributes: object,       // Event-specific attributes
      recorded_by: string,      // User ID of scorer who recorded
      timestamp: timestamp      // When event was recorded
    }
  ],
  
  // Match payments
  payment: {
    perPersonAmount: number,
    team1Players: [              // Players who played
      {
        id: string,
        name: string,
        amountDue: number,
        status: string,          // "pending" | "paid"
        paidAt: timestamp
      }
    ],
    team2Players: [/* same structure */],
    treasurer: {
      id: string,
      name: string
    },
    totalAmount: number,
    totalPaid: number,
    totalPending: number
  },
  
  // Metadata
  created_by: string,
  created_at: timestamp,
  updated_by: string,
  updated_at: timestamp,
  shared: boolean,              // True after "Share Result"
  sharedAt: timestamp
}
```

**Storage**: 
- Local: `localStorage['vscor_matches']` (array)
- Cloud: `kv_store_845a157a` with key `match_{match_id}`

**Relationships**:
- Many-to-one with Tournament (via tournamentId)
- Many-to-one with Team (team1Id, team2Id)
- One-to-many with Match Events (embedded in events array)
- Many-to-many with Players (via squad1, squad2)

#### 5.1.6 Match Event
```javascript
// Embedded within Match.events array
{
  id: string,                   // Event UUID
  type: string,                 // Event type code
  team: string,                 // "team1" | "team2"
  player: string,               // Player name
  playerId: string,             // FK to Player
  minute: number,               // Match minute (0-duration)
  
  // Event-specific attributes
  attributes: {
    // For goals
    goalType: string,           // "open_play" | "penalty" | "free_kick" | "own_goal"
    assistPlayer: string,       // Player name
    assistPlayerId: string,     // FK to Player
    
    // For fouls
    cardType: string,           // "yellow" | "red" | "none"
    
    // For shots
    shotType: string,           // "on_target" | "off_target"
    
    // For substitutions
    outPlayer: string,          // Player name coming off
    outPlayerId: string,        // FK to Player
    inPlayer: string,           // Player name coming on
    inPlayerId: string          // FK to Player
  },
  
  // Audit
  recorded_by: string,          // User ID of scorer
  timestamp: timestamp,         // When recorded
  edited: boolean,              // If edited after recording
  edited_at: timestamp
}
```

### 5.2 Event Types by Scoring Level

#### 5.2.1 Basic Scoring Level
- `goal` - Goal scored
- `shot_on_target` - Shot on target
- `shot_off_target` - Shot off target
- `foul` - Foul committed
- `substitute` - Player substitution
- `corner` - Corner kick

**Attributes Available**:
- `isPenalty` (boolean) - For goals and fouls
- `cardType` (string) - For fouls: "yellow", "red", or none

#### 5.2.2 Intermediate Detailed Level
Same events as Basic, but with enhanced attributes:
- **Goals**: `goalType`, `assistPlayer`
- **Fouls**: `cardType` (full range)
- **Shots**: Separate tracking of on/off target

#### 5.2.3 Intermediate All Events Level
Adds additional event types:
- `interception` - Ball interception
- `offside` - Offside call

**Attributes**: Basic only (penalty, cards)

#### 5.2.4 Advanced Scoring Level
All events + all detailed attributes:
- Full goal type classification
- Detailed foul attributes
- Shot placement tracking
- All event types available

### 5.3 Tournament Team Linkage

**Purpose**: Track which teams are participating in which tournaments

**Implementation**: Embedded in Tournament.participatingTeams array

**Structure**:
```javascript
Tournament.participatingTeams: [
  {
    id: string,      // Team ID
    name: string     // Team name (denormalized for performance)
  }
]
```

**Sync Logic**:
- When team added to tournament: Add to participatingTeams array
- When team removed: Filter out from array
- Team name updates: Background sync updates tournament records

### 5.4 Entity Relationships Diagram

```
User (1) ←→ (0..1) Player Profile [owner_user_id]
User (1) ←→ (0..*) Teams [owner_user_id]
User (1) ←→ (0..*) Tournaments [owner_user_id]
User (1) ←→ (0..*) Matches [owner_user_id]
User (1) ←→ (0..*) Matches [primaryScorer.user_id]
User (1) ←→ (0..*) Matches [secondaryScorer.user_id]

Player (1) ←→ (0..*) Teams [embedded in team.players]
Team (1) ←→ (0..*) Tournaments [via participatingTeams]
Team (1) ←→ (0..*) Matches [as team1 or team2]

Tournament (1) ←→ (0..*) Matches [via tournamentId]
Tournament (1) ←→ (0..*) Fixtures [embedded in fixtures array]

Match (1) ←→ (0..*) Events [embedded in events array]
Match (1) ←→ (0..*) Players [via squad1, squad2]
```

---

## 6. Offline-First Data Storage and Sync

### 6.1 Local Storage Strategy

**Primary Storage**: Browser `localStorage` API

**Storage Keys**:
```javascript
// User session
'vscor_currentUser'           // Current authenticated user object
'vscor_accessToken'           // Supabase access token

// Core entities (arrays)
'vscor_players'               // All player profiles
'vscor_teams'                 // All teams
'vscor_tournaments'           // All tournaments
'vscor_matches'               // All matches

// Sync metadata
'vscor_lastSync'              // Last sync timestamp
'vscor_pendingSync'           // Entities awaiting sync
```

**Data Format**: JSON serialized

**Size Considerations**:
- LocalStorage limit: ~5-10MB per origin
- Implement data pruning for old matches (archive after 6 months)
- Image URLs stored as references, not base64

### 6.2 Master Cloud Database

**Technology**: Supabase PostgreSQL + KV Store

**Storage Method**: Key-Value Store via `kv_store_845a157a` table

**Table Structure**:
```sql
CREATE TABLE kv_store_845a157a (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Patterns**:
```
user_{user_id}
player_{player_id}
team_{team_id}
tournament_{tournament_id}
match_{match_id}
```

**Access**: Via Supabase Edge Functions at `/functions/v1/make-server-845a157a/*`

### 6.3 Sync Mechanism

#### 6.3.1 Sync Triggers

**Automatic Sync**:
1. After user creates/updates any entity
2. On app startup (if online)
3. On user login
4. On "Share Result" action for matches
5. Every 5 minutes (background interval) if online

**Manual Sync**:
- User can trigger via "Sync Now" button in settings (future feature)

#### 6.3.2 Sync Direction

**Bidirectional Sync**:
- Local → Cloud: Push local changes
- Cloud → Local: Pull remote updates

**Sync Priority**:
1. User profile (highest)
2. Player profiles
3. Teams
4. Tournaments
5. Matches

#### 6.3.3 Sync Process Flow

```javascript
// Simplified sync algorithm
async function syncEntity(entityType, entityId) {
  const localEntity = getLocalEntity(entityType, entityId);
  const cloudEntity = await fetchCloudEntity(entityType, entityId);
  
  if (!cloudEntity) {
    // Entity doesn't exist in cloud - push local
    await pushToCloud(entityType, localEntity);
    return;
  }
  
  if (!localEntity) {
    // Entity doesn't exist locally - pull from cloud
    saveLocal(entityType, cloudEntity);
    return;
  }
  
  // Both exist - check timestamps
  if (localEntity.updated_at > cloudEntity.updated_at) {
    // Local is newer - push to cloud
    await pushToCloud(entityType, localEntity);
  } else if (cloudEntity.updated_at > localEntity.updated_at) {
    // Cloud is newer - pull to local
    saveLocal(entityType, cloudEntity);
  }
  // If equal, no action needed
}
```

#### 6.3.4 Batch Sync

**Process**:
1. Collect all entities with `needsSync` flag
2. Group by entity type
3. Send batch request to cloud
4. Handle success/failure per entity
5. Clear `needsSync` flag on success
6. Log errors for failed syncs

**Endpoint**: `POST /functions/v1/make-server-845a157a/sync/batch`

### 6.4 Conflict Resolution

#### 6.4.1 Conflict Detection

**Conflict Occurs When**:
- Same entity modified on multiple devices
- Local updated_at < Cloud updated_at
- Local changes haven't been synced

#### 6.4.2 Resolution Strategy

**Timestamp-Based (Default)**:
- Most recent `updated_at` wins
- Overwrite older version
- Log conflict in sync history

**User Notification**:
- If conflict affects user's owned entities, show notification
- "Your changes to [entity] were overwritten by newer changes"
- Option to "View Details" (shows both versions)

**Manual Resolution** (Future):
- Present both versions side-by-side
- User selects which to keep
- Merge option for non-conflicting fields

#### 6.4.3 Conflict-Free Scenarios

**Append-Only Data**:
- Match events (always append, never overwrite)
- Event IDs ensure uniqueness
- Duplicate events filtered by ID

**Ownership-Based Protection**:
- Only owner can modify entity
- Non-owners pull updates without conflict
- Reduces conflict probability

### 6.5 Data Integrity Rules

#### 6.5.1 Referential Integrity

**Challenge**: No foreign key constraints in localStorage

**Solution**:
1. **ID-Based References**: Store only entity IDs, not full objects
2. **Denormalized Names**: Store names alongside IDs for display
3. **Orphan Detection**: Background process identifies orphaned references
4. **Soft Deletes**: Mark entities as deleted rather than removing

#### 6.5.2 Validation Rules

**Pre-Sync Validation**:
```javascript
function validateEntity(entityType, entity) {
  // Required fields
  if (!entity.id || !entity.created_at) return false;
  
  // Owner must exist
  if (entity.owner_user_id) {
    const ownerExists = checkUserExists(entity.owner_user_id);
    if (!ownerExists) return false;
  }
  
  // Type-specific validation
  switch (entityType) {
    case 'match':
      return entity.team1 && entity.team2 && entity.team1 !== entity.team2;
    case 'tournament':
      return entity.participatingTeams.length >= 2;
    case 'player':
      return entity.name && entity.name.trim().length > 0;
    default:
      return true;
  }
}
```

#### 6.5.3 Transaction-Like Behavior

**Problem**: No ACID transactions in localStorage

**Workaround**:
1. **Copy-on-Write**: Clone entity before modification
2. **Rollback Support**: Keep previous version in memory
3. **Atomic Writes**: Single `localStorage.setItem()` call
4. **Error Handling**: Try-catch with rollback on failure

```javascript
function updateEntity(entityType, entityId, updates) {
  const entities = JSON.parse(localStorage.getItem(entityType));
  const index = entities.findIndex(e => e.id === entityId);
  
  if (index === -1) throw new Error('Entity not found');
  
  // Keep backup
  const backup = [...entities];
  
  try {
    // Apply updates
    entities[index] = { ...entities[index], ...updates, updated_at: Date.now() };
    
    // Write atomically
    localStorage.setItem(entityType, JSON.stringify(entities));
    
    return entities[index];
  } catch (error) {
    // Rollback on error
    localStorage.setItem(entityType, JSON.stringify(backup));
    throw error;
  }
}
```

### 6.6 Sync Status Indicators

**UI Indicators**:
- ✅ Green dot: All synced
- 🔄 Yellow spinner: Sync in progress
- ⚠️ Orange warning: Pending sync (offline)
- ❌ Red error: Sync failed

**Per-Entity Status**:
- Show sync status on entity cards
- "Last synced: 2 minutes ago"
- "Pending sync" badge for modified entities

---

## 7. Core Modules of the App

### 7.1 Login & Onboarding

#### 7.1.1 Login Screen

**UI Components**:
- App logo and name "VScor"
- Email input field
- Password input field (with show/hide toggle)
- "Log In" button (primary)
- "Sign Up" link (secondary)
- "Forgot Password" link (future)

**Validation**:
- Email format validation
- Password minimum length (6 characters)
- Error messages inline below fields

**Flow**:
1. User enters credentials
2. System calls Supabase `signInWithPassword()`
3. On success:
   - Store access token in localStorage
   - Store user object in localStorage
   - Check for linked player profile
   - Navigate to Home screen
4. On failure:
   - Display error message
   - Keep user on login screen

#### 7.1.2 Signup Screen

**UI Components**:
- Full name input
- Email input
- Password input (with strength indicator)
- Confirm password input
- "Create Account" button
- "Already have an account? Log in" link

**Validation**:
- All fields required
- Email uniqueness check
- Password match confirmation
- Password strength requirements

**Flow**:
1. User fills signup form
2. System calls backend `/make-server-845a157a/signup`
3. Backend creates user with `email_confirm: true`
4. Returns user object and access token
5. Auto-login and navigate to Profile Setup

#### 7.1.3 Profile Setup (First-Time)

**Two Options**:

**Option A: Claim Existing Profile**
- Search for player profiles by name
- Filter results (show only unclaimed profiles)
- Select profile to claim
- Confirm and link via `owner_user_id`

**Option B: Create New Profile**
- Enter player details (name, position, jersey number)
- Upload photo (optional)
- Auto-link to user account
- Navigate to Home

### 7.2 Home Dashboard

#### 7.2.1 Header

**Components**:
- App logo
- User profile avatar (top-right)
- Sync status indicator
- Notification bell icon (future)

**Profile Menu** (on avatar click):
- View My Profile
- Edit My Profile
- My Matches
- Settings
- Logout

#### 7.2.2 Tab Navigation

**Three Tabs** (bottom navigation bar):
1. **Live Scores**: Active and recent matches
2. **Scoring**: Create new match, view my matches
3. **Info**: Browse players, teams, tournaments

**Visual Design**:
- Purple active state
- Gray inactive state
- Icon + label for each tab
- Smooth transition animations

### 7.3 Player Profiles Module

#### 7.3.1 Player Profile View

**Header Section**:
- Player photo (circular avatar)
- Player name (large heading)
- Position badge
- Jersey number badge
- "Registered" badge (if owner_user_id exists)

**Statistics Section**:
- Total matches played
- Goals scored
- Assists
- Shots on target / off target
- Fouls committed
- Yellow/red cards
- Clean sheets (for goalkeepers)

**Recent Matches**:
- List of last 10 matches
- Match date, opponent, score
- Player's contribution (goals, assists)
- Link to full match details

**Edit Controls** (if user is profile owner):
- Edit profile button (top-right)
- Transfer ownership option in menu

#### 7.3.2 Player Profile Edit

**Editable Fields**:
- Name
- Email (optional)
- Phone number (optional)
- Position (dropdown)
- Jersey number (text input)
- Profile photo (upload)

**Save Button**:
- Validates all fields
- Updates localStorage immediately
- Triggers sync to cloud
- Shows success message
- Returns to view mode

#### 7.3.3 Player Search & List

**Search Features**:
- Search by name (fuzzy matching)
- Filter by position
- Filter by team
- Sort by: Most goals, Most matches, Name (A-Z)

**List Display**:
- Player card with avatar, name, stats summary
- Tap to view full profile
- "Registered" badge for claimed profiles

### 7.4 Team Profiles Module

#### 7.4.1 Team Profile View

**Header Section**:
- Team logo (large)
- Team name (heading)
- Coach name
- Home venue
- Description (collapsible)

**Team Statistics**:
- Total matches played
- Wins / Draws / Losses
- Goals scored / conceded
- Goal difference
- Current form (last 5 matches)

**Squad Roster**:
- List of all players with:
  - Avatar
  - Name
  - Position
  - Jersey number
- Tap player to view their profile

**Recent Matches**:
- Last 10 matches
- Date, opponent, score, result
- Link to match details

**Edit Controls** (if user is team owner):
- Edit team button
- Manage squad button
- Transfer ownership option

#### 7.4.2 Team Profile Edit

**Editable Fields**:
- Team name
- Coach name
- Home venue
- Description
- Team logo (upload)

**Squad Management**:
- Add players (search from player database)
- Remove players from roster
- Assign jersey numbers
- Reorder players (drag-and-drop, future)

#### 7.4.3 Team Search & List

**Search Features**:
- Search by team name
- Filter by tournament participation
- Sort by: Most wins, Best goal difference, Name

**List Display**:
- Team card with logo, name, stats
- Tap to view full profile

### 7.5 Tournament Management Module

#### 7.5.1 Tournament Profile View

**Header Section**:
- Tournament logo
- Tournament name
- Format badge ("Round Robin", "Knockout", etc.)
- Dates (start - end)
- Venue

**Participating Teams**:
- Grid or list of team cards
- Team name, logo
- Tap to view team profile

**Fixtures Section**:
- List of all fixtures grouped by:
  - Stage (Group Stage, Quarter Finals, etc.)
  - Round
  - Date
- Each fixture shows:
  - Team 1 vs Team 2
  - Date and time
  - Venue
  - Status (Scheduled / Live / Completed)
  - Score (if completed)

**Standings/Points Table**:
- For Round Robin or Group stages
- Columns: Position, Team, Played, Won, Drawn, Lost, GF, GA, GD, Points
- Sortable by any column
- Color-coded rows (e.g., top teams in green)

**Edit Controls** (if user is tournament owner):
- Edit tournament button
- Manage teams button
- Generate/regenerate fixtures button
- Publish fixtures button

#### 7.5.2 Tournament Creation

**Step 1: Basic Details**
- Tournament name (required)
- Format selection (dropdown)
- Start date (date picker)
- End date (date picker)
- Venue (text input)
- Description (textarea)
- Upload logo (optional)

**Step 2: Rules & Configuration**
- Match duration (minutes)
- Players per team
- Points for win (default: 3)
- Points for draw (default: 1)
- Points for loss (default: 0)

**Step 3: Format-Specific Setup**

**If Round Robin**:
- No additional setup
- Proceed to team selection

**If Groups + Knockout**:
- Number of groups (2-8)
- Teams per group (2-6)
- Teams advancing from each group (1-4)

**If Pure Knockout**:
- Total teams (must be power of 2: 4, 8, 16, 32)
- Seeding option (manual or random)

**Step 4: Add Participating Teams**
- Search and add teams from team database
- Or create new teams inline
- Minimum 2 teams required
- Visual list of added teams
- Remove team option

**Step 5: Review & Create**
- Summary of all settings
- "Create Tournament" button
- Creates tournament entity
- Navigates to tournament profile

#### 7.5.3 Fixture Generation

**Automatic Generation**:

**Round Robin Algorithm**:
```
For N teams:
  Generate N-1 rounds
  Each team plays every other team once
  Use round-robin rotation algorithm
  Assign sequential match dates
```

**Groups + Knockout Algorithm**:
```
Phase 1: Group Stage
  Divide teams into groups
  Generate round-robin within each group
  
Phase 2: Knockout Stage
  Determine advancing teams (top N from each group)
  Generate knockout bracket
  Assign stage labels (Round of 16, Quarters, etc.)
```

**Pure Knockout Algorithm**:
```
Create single-elimination bracket
Match teams in pairs (1 vs 16, 2 vs 15, etc. if seeded)
Generate rounds: R1, R2, Quarters, Semis, Final
```

**Manual Editing**:
- Edit any fixture (teams, date, time, venue)
- Add custom fixtures
- Delete fixtures
- Regenerate with confirmation warning

**Publish Fixtures**:
- Sets fixtures to "scheduled" status
- Makes fixtures visible to all users
- Enables match creation from fixtures

#### 7.5.4 Tournament Standings Calculation

**Auto-Calculation Trigger**:
- After any match in tournament is shared/completed
- Recalculates entire standings table

**Calculation Logic**:
```javascript
for each team in tournament:
  matchesPlayed = count of completed matches for team
  wins = matches where team scored more goals
  draws = matches where scores are equal
  losses = matches where team scored fewer goals
  goalsFor = sum of team's scores
  goalsAgainst = sum of opponent's scores
  goalDifference = goalsFor - goalsAgainst
  points = (wins * pointsForWin) + (draws * pointsForDraw) + (losses * pointsForLoss)

Sort teams by:
  1. Points (descending)
  2. Goal difference (descending)
  3. Goals for (descending)
  4. Head-to-head result (if tied)
  5. Alphabetical by name
```

**Display**:
- Color-coded position changes (green = up, red = down)
- Highlight current leader with gold badge
- Show qualified teams for knockout stage (if applicable)

### 7.6 Match Creation Module

#### 7.6.1 New Match Screen

**Tournament/Match Type Selection**:
- Dropdown with options:
  - "Friendly Match"
  - List of active tournaments
- If tournament selected:
  - Load tournament settings (duration, players per team)
  - Load participating teams
  - Show tournament stage dropdown

**Tournament Stage** (if tournament):
- Group Stage
- Round Robin League
- Round of 32/16
- Quarter Final
- Semi Final
- Final
- Loser's Final

**Participating Teams Management** (if tournament):
- List of current tournament teams
- Add team button (search existing or create new)
- Remove team button
- Teams instantly added to tournament record

**Team Selection**:
- Team 1 (autocomplete with search)
- Team 2 (autocomplete with search)
- Validation: Teams cannot be the same
- For friendly: Option to "Add Team" if not in system

**Match Details**:
- Match format (single / two halves)
- Duration (5-90 minutes, validation inline)
- Venue (text input with search icon)
- Players per team (1-11, number input)

**Scoring Level**:
- Basic - Simple events only
- Intermediate Detailed - Basic events + detailed attributes
- Intermediate All - All events without attributes
- Advanced - All events + detailed attributes
- Description shown for each level

**Scorer Assignment Section** (NEW):
- **Primary Scorer**:
  - UserAutocompleteInput (searches registered users)
  - Defaults to current user
  - Shows selected scorer with avatar, name, "Primary Scorer" label
  - Remove button to clear selection
  - Warning if not assigned

- **Second Scorer** (Advanced mode only):
  - Optional field
  - Only shown if scoring level is "Advanced"
  - Cannot select same user as primary
  - Shows selected scorer with avatar, name, "Secondary Scorer" label
  - Disabled until primary scorer selected

- **Division of Responsibilities** (if two scorers):
  - Radio options:
    - **Divide by Teams**: Each scorer records all events for one team
      - Team 1 → Assign scorer dropdown (Primary / Secondary)
      - Team 2 → Assign scorer dropdown (Primary / Secondary)
    - **Divide by Event Types**: Split event types between scorers
      - Primary: Goals, Shots on Target, Shots off Target, Fouls
      - Secondary: Interceptions, Offside, Substitutions, Corners
  - Validation: Must select division type before proceeding

**Submit Button**:
- Label: "Select Squad"
- Enabled when all required fields valid
- Disabled states shown with visual feedback

**Validation Rules**:
- All fields except venue are required
- Duration must be 5-90 minutes
- Teams must be different
- Primary scorer must be assigned
- If secondary scorer assigned, responsibility division required
- If team-based division, both teams must be assigned scorers

#### 7.6.2 Squad Selection Screen

**Purpose**: Select which players from team rosters will play in this match

**UI Layout**:
- Split screen (Team 1 left, Team 2 right)
- Team name headers with team colors/badges
- Player list for each team

**Player Selection**:
- Checkboxes next to each player
- Shows: Avatar, Name, Position, Jersey Number
- Selected players highlighted
- Counter: "5 / 7 selected" (based on playersPerTeam)

**Add Players** (if player not in roster):
- "Add New Player" button
- Quick add modal:
  - Name (required)
  - Position
  - Jersey number
- Adds to player database
- Adds to team roster
- Auto-selects for match

**Start Match Button**:
- Enabled when both squads have correct number of players
- Label: "Start Match"
- Navigates to Live Scoring screen

### 7.7 Match Scoring Module

#### 7.7.1 Live Scoring Screen

**Header**:
- Team 1 name | Score A - Score B | Team 2 name
- Large, bold scores (auto-update on goals)
- Match timer (counts up from 00:00)
- Pause/Resume button
- Match minute indicator

**Team Tabs**:
- Two tabs: Team 1 | Team 2
- Switch active team for event recording
- Active team highlighted in team color

**Squad Display** (Active Team):
- Grid layout of player cards
- Each card shows:
  - Jersey number (large)
  - Player name
  - Small avatar
- Playing players: Full color
- Substituted OUT players: Grayed out, crossed
- Tap player to select for event

**Event Type Buttons**:
- Displayed based on scoring level
- Large, touch-friendly buttons
- Icons + labels
- Color-coded by event severity
- Disabled if no player selected

**Event Types by Level**:
- **Basic**: Goal, Shot On, Shot Off, Foul, Substitute, Corner
- **Intermediate Detailed**: Same as basic + attributes modal
- **Intermediate All**: + Interception, Offside
- **Advanced**: All events + full attributes

**Event Recording Flow**:
1. Select player from squad grid
2. Tap event type button
3. If basic level: Event recorded immediately
4. If detailed attributes:
   - Modal opens with attribute options
   - Select attributes (goal type, card type, etc.)
   - "Confirm" button to record
5. Event appears in timeline
6. Score auto-updates (for goals)

**Event Restrictions** (Dual-Scorer Mode):
- If team-based division:
  - Scorer can only record for assigned team
  - Other team tab disabled
- If event-based division:
  - Event buttons disabled if not in scorer's responsibility
  - Tooltip: "This event is assigned to [Other Scorer]"

**Event Timeline** (Bottom Sheet):
- Scrollable list of all recorded events
- Most recent at top
- Each event shows:
  - Match minute
  - Team badge
  - Event icon
  - Player name
  - Event description
  - Edit/Delete buttons
- Expandable to full screen
- Swipe to collapse

**Edit Event**:
- Tap edit icon on event
- Opens same modal as creation
- All fields editable
- "Update Event" button
- Marks event as edited

**Delete Event**:
- Tap delete icon
- Confirmation modal: "Delete this event?"
- If goal: Warns score will be reduced
- Confirm to delete

**End Match**:
- "End Match" button (top-right menu)
- Confirmation modal
- Shows final score
- Option to "Share Result" immediately
- Or "Save as Draft"

#### 7.7.2 Match Result Screen

**Displayed After**: "End Match" action

**Content**:
- Final score (large display)
- Match summary:
  - Total events recorded
  - Top scorer (player with most goals)
  - Top assister
  - Most fouls
- Team statistics comparison
- Player performance table (both teams)

**Actions**:
- "Share Result" (primary button)
  - Sets match status to "completed"
  - Syncs to cloud
  - Updates tournament standings (if applicable)
  - Shows success message
  - Navigates to Info tab (match visible to all)
- "Calculate Payment" (secondary button)
  - Navigates to payment calculation screen
- "View Full Details"
  - Navigates to match profile view
- "Edit Match"
  - Returns to live scoring screen

#### 7.7.3 Match Profile View (Public)

**Accessible From**: Info tab → Matches list → Select match

**Header**:
- Team 1 vs Team 2
- Final score
- Match date and time
- Venue
- Tournament context (if applicable)
- Match format and duration

**Match Statistics**:
- Side-by-side comparison:
  - Goals
  - Shots on target / off target
  - Fouls
  - Corners
  - Possession % (future)
  - Cards (yellow/red)

**Event Timeline**:
- Chronological list of all events
- Filterable by team
- Filterable by event type
- Each event shows minute, player, event type

**Squad Lists**:
- Team 1 squad (left column)
- Team 2 squad (right column)
- Each player shows:
  - Name, position, jersey number
  - Goals/assists in this match
  - Cards received
  - Substitution status

**Scorer Information** (NEW):
- "Scored by: [Primary Scorer Name]"
- If secondary scorer: "with [Secondary Scorer Name]"
- Shows match owner
- If dual-scorer: Shows responsibility division method

**Match Payment Info** (if calculated):
- Total amount
- Per person amount
- Payment status summary
- Link to "View Payment Details" (owner only)

**Actions** (if user is match owner):
- Edit match
- Delete match (if no events or with confirmation)
- Recalculate payments
- Transfer ownership

### 7.8 Match Payments Module

#### 7.8.1 Calculate Payment Screen

**Access**: From match result screen or match profile (owner only)

**Header**:
- Match context (Team 1 vs Team 2)
- Date and venue

**Configuration Section**:
- **Per Person Amount**: Number input (with currency symbol)
- **Treasurer**: UserAutocompleteInput
  - Defaults to match creator
  - Can select any player from playerDatabase
  - Shows selected treasurer with avatar

**Payment Calculation**:
- **Team 1 Players**:
  - List of squad members who played
  - Each shows: Avatar, Name, Amount Due, Pay button
  - "Mark as Paid" button (icon-only, compact)
  - Status indicator: "Paid" (green) or "Pending" (orange)
  - Paid players show timestamp: "Paid at [time]"
- **Team 2 Players**: Same structure

**Summary Cards**:
- Total Amount: Sum of all players
- Total Paid: Sum of paid amounts
- Total Pending: Sum of pending amounts
- Auto-updates as payments marked

**Auto-Save** (NEW):
- When player marked as paid, auto-saves to match record
- Updates Match Payments screen in real-time
- No manual "Save" button needed for payment status changes

**Save Button**:
- Saves initial configuration (amount, treasurer)
- Shows success message
- Updates match record with payment data

#### 7.8.2 Match Payments Tab

**Access**: From match profile via tab navigation

**Tabs**:
1. **Upcoming**: Scheduled matches with no payment info
2. **Pending**: Matches with payment calculated but not fully paid
3. **Completed**: Matches with all payments received

**Match Card Display**:
- Team 1 vs Team 2
- Match date
- Venue
- Payment summary:
  - Amount per person
  - Total received / Total amount
  - Progress bar showing payment completion %
  - Number of players paid/pending
- Tap to view full payment details or calculate

**Filter & Search**:
- Filter by team
- Filter by date range
- Search by team name or venue

### 7.9 Info Tab Module

#### 7.9.1 Info Tab Home

**Tab Segments** (horizontal scrollable tabs):
1. Live Scores
2. Results
3. Players
4. Teams
5. Tournaments

**Default View**: Live Scores

#### 7.9.2 Live Scores View

**Content**:
- List of matches currently in "live" status
- Real-time score updates (via sync)
- Each match card shows:
  - Team 1 vs Team 2
  - Current score (large)
  - Match minute (e.g., "67'")
  - Last event (e.g., "⚽ John Doe - Goal")
  - Tap to view live match details
- Empty state: "No live matches at the moment"

#### 7.9.3 Results View

**Content**:
- List of completed matches
- Sorted by most recent first
- Each match card shows:
  - Date
  - Team 1 vs Team 2
  - Final score
  - Tournament badge (if applicable)
  - Top scorer from match
  - Tap to view full match profile
- Pagination or infinite scroll

**Filters**:
- Filter by tournament
- Filter by team
- Filter by date range
- Filter by match format

#### 7.9.4 Players View

**Content**:
- Search bar at top
- Grid or list of player cards
- Each card shows:
  - Avatar
  - Name
  - Position
  - Total goals (or other key stat)
  - Tap to view full player profile
- Infinite scroll

**Sort Options**:
- Most goals
- Most assists
- Most matches
- Name (A-Z)

**Search**:
- Real-time search as user types
- Matches name (partial/fuzzy)

#### 7.9.5 Teams View

**Content**:
- Grid of team cards
- Each card shows:
  - Team logo
  - Team name
  - Win/Draw/Loss record
  - Current form (last 5 matches)
  - Tap to view team profile

**Sort Options**:
- Most wins
- Best goal difference
- Name (A-Z)

**Search**:
- Real-time search by team name

#### 7.9.6 Tournaments View

**Content**:
- List of tournament cards
- Each card shows:
  - Tournament logo
  - Tournament name
  - Format badge
  - Dates (start - end)
  - Status: "Upcoming", "In Progress", "Completed"
  - Number of participating teams
  - Tap to view tournament profile

**Filters**:
- Active tournaments
- Completed tournaments
- By format (Round Robin, Knockout, etc.)

**Search**:
- Real-time search by tournament name

### 7.10 My Matches Module

#### 7.10.1 My Matches Screen

**Access**: From profile menu or Scoring tab

**Purpose**: View all matches user created, owns, or scored

**Tabs**:
1. **As Owner**: Matches where user is match owner
2. **As Scorer**: Matches where user is assigned as scorer (primary or secondary)
3. **Draft Matches**: Matches not yet shared/completed

**Match Card Display**:
- Same as Results view
- Additional badges:
  - "Owner" badge
  - "Primary Scorer" badge
  - "Secondary Scorer" badge
  - "Draft" badge
- Tap to view/edit match

**Actions**:
- Continue scoring (for draft matches)
- View details (for completed matches)
- Edit match (if owner)
- Delete match (if owner, with confirmation)

---

## 8. Match Scoring System

### 8.1 Scoring Architecture Overview

**Design Principle**: Minimize taps and cognitive load for real-time event recording.

**Flow**:
1. Select team (via tab)
2. Select player (via squad grid)
3. Select event type (via button)
4. Add attributes (if required by level)
5. Event recorded, timeline updated, scores recalculated

**Automatic Actions**:
- Score increments on goal events
- Player substitution status updates (grayed out)
- Match minute auto-increments based on elapsed time
- Events timestamped for chronological ordering

### 8.2 Scoring Levels

#### 8.2.1 Basic Scoring Level

**Purpose**: Fast scoring with minimal detail

**Events Available**:
- Goal
- Shot on Target
- Shot off Target
- Foul
- Substitution
- Corner

**Attributes Available**:
- **Goals**: Penalty checkbox
- **Fouls**: Yellow card / Red card checkbox
- **Substitutions**: Out player + In player selection

**Recording Speed**: 1-2 seconds per event (no modal, inline attributes)

**Use Cases**:
- Fast-paced amateur matches
- Single scorer with high event frequency
- Pickup games

#### 8.2.2 Intermediate Detailed Scoring Level

**Purpose**: Basic events with enhanced attributes

**Events Available**: Same as Basic

**Attributes Available**:
- **Goals**:
  - Goal type: Open Play, Penalty, Free Kick, Own Goal
  - Assist player (optional)
- **Fouls**:
  - Card type: None, Yellow, Red
  - Foul description (optional, future)
- **Shots**:
  - Shot placement (optional, future)
- **Substitutions**: Same as Basic

**Recording Speed**: 3-4 seconds per event (modal with dropdown selections)

**Use Cases**:
- Semi-serious league matches
- When coaches want tactical insights
- Matches with statisticians

#### 8.2.3 Intermediate All Events Scoring Level

**Purpose**: Track all event types with basic attributes

**Events Available**:
- All Basic events
- Interception
- Offside

**Attributes Available**: Basic only (penalty, cards)

**Recording Speed**: 1-2 seconds per event (inline)

**Use Cases**:
- Comprehensive event tracking
- Defensive statistics needed
- Tactical analysis

#### 8.2.4 Advanced Scoring Level

**Purpose**: Complete event tracking with full attributes

**Events Available**:
- All events (Basic + Intermediate All)
- Future: Pass, Tackle, Save (goalkeeper)

**Attributes Available**:
- Full attribute set for all events
- Goal types, assist tracking
- Card types and foul severity
- Shot placement
- Substitution reasons (injury, tactical)

**Recording Speed**: 4-5 seconds per event (detailed modal)

**Dual-Scorer Support**:
- Only available in Advanced mode
- Enables responsibility division
- Reduces per-scorer workload
- Enables parallel event recording

**Use Cases**:
- Professional academy matches
- High-stakes tournaments
- Matches requiring broadcast-quality data
- Dual-scorer setups

### 8.3 Event Recording Process

#### 8.3.1 Player Selection

**Squad Grid Display**:
- Visual grid (3 or 4 columns)
- Jersey number prominent
- Player name below
- Small avatar
- Color-coded by playing status:
  - Active players: Full color
  - Substituted out: Grayed, strikethrough
  - Substituted in: Highlighted border (green)

**Selection State**:
- Tap player card → Highlights with blue border
- Selected player name shown at top
- Tap again to deselect
- Auto-deselect after event recorded

#### 8.3.2 Event Type Selection

**Button Layout**:
- Grid or list below squad
- Large touch targets (min 48x48px)
- Icon + label for each event
- Color-coded:
  - Goal: Green
  - Shot: Blue
  - Foul: Yellow/Red
  - Substitution: Purple
  - Other: Gray

**Disabled States**:
- No player selected: All buttons disabled
- Player substituted out: Certain events disabled
- Dual-scorer mode: Unassigned events disabled with tooltip

#### 8.3.3 Attribute Capture

**Basic Level** (inline):
- Checkboxes appear below event buttons
- "Penalty" checkbox for goals
- "Yellow" / "Red" card checkboxes for fouls
- No modal interruption

**Detailed Levels** (modal):
- Modal slides up from bottom
- Event type header (with icon)
- Selected player name shown
- Dropdown or radio options for attributes
- "Confirm" button to record
- "Cancel" button to abort

**Smart Defaults**:
- Most common option pre-selected
- "Open Play" for goals
- "No Card" for fouls
- Reduces taps for common scenarios

#### 8.3.4 Event Confirmation

**Visual Feedback**:
- Success animation (green checkmark)
- Brief toast message: "Goal recorded"
- Score updates immediately (for goals)
- Event appears at top of timeline

**Audio Feedback** (future):
- Sound effect on event record
- Different sounds for different event types

### 8.4 Dual-Scorer Mode (Advanced Only)

#### 8.4.1 Activation

**Requirements**:
- Scoring level must be "Advanced"
- Match owner assigns secondary scorer during match creation
- Both scorers must be registered users
- Responsibility division must be configured

**Access**:
- Both primary and secondary scorers can open live scoring screen
- Each sees full match context
- Restrictions applied based on responsibility division

#### 8.4.2 Team-Based Division

**Configuration**:
- Team 1 assigned to Scorer A
- Team 2 assigned to Scorer B

**Restrictions**:
- Scorer A can only switch to Team 1 tab
- Team 2 tab disabled for Scorer A
- Tooltip: "This team is assigned to [Other Scorer]"
- Scorer B sees opposite restrictions

**Use Case**:
- Each scorer focuses on one team
- Reduces confusion during fast play
- Clear separation of duties

**Event Sync**:
- Events recorded by both scorers merge in timeline
- Chronological ordering by match minute
- No conflicts (different teams)

#### 8.4.3 Event-Based Division

**Configuration**:
- Primary Scorer: Goal, Shot On, Shot Off, Foul
- Secondary Scorer: Interception, Offside, Substitution, Corner

**Restrictions**:
- Primary scorer sees only assigned event buttons enabled
- Secondary scorer sees their assigned buttons enabled
- Disabled buttons show tooltip: "Assigned to [Other Scorer]"
- Both scorers can switch between teams

**Use Case**:
- Parallel recording of simultaneous events
- Primary scorer focuses on attacking events
- Secondary scorer tracks defensive/tactical events

**Event Sync**:
- Events from both scorers merge in timeline
- Potential for same-minute events from different perspectives
- No conflicts (different event types)

#### 8.4.4 Conflict Prevention

**Duplicate Event Detection**:
- If same event (type + player + minute) recorded by both scorers
- System flags as potential duplicate
- Shows warning to both scorers
- Option to resolve: Keep one, merge, or keep both

**Real-Time Sync** (future):
- WebSocket connection between scorers
- Live event updates as they're recorded
- Visual indicator: "Other scorer just recorded [event]"
- Prevents immediate duplicates

### 8.5 Match Ownership and Permissions

#### 8.5.1 Match Owner

**Who**: User who created the match (stored in `owner_user_id`)

**Capabilities**:
- Edit match configuration (teams, venue, duration)
- Assign/change primary scorer
- Assign/change secondary scorer (Advanced only)
- Configure responsibility division
- Calculate match payments
- Transfer match ownership
- Delete match (with confirmation if events exist)
- View all match details

**UI Indicators**:
- "Owner" badge on match card
- Edit button visible in match profile
- Access to "Match Options" menu

#### 8.5.2 Assigned Scorer

**Who**: User assigned as primary or secondary scorer

**Capabilities**:
- Start live scoring
- Record match events (according to assigned responsibilities)
- Edit/delete events during live scoring
- End match and save result
- View match details
- Cannot edit match configuration
- Cannot calculate payments
- Cannot assign/change scorers

**UI Indicators**:
- "Primary Scorer" or "Secondary Scorer" badge
- "Start Scoring" button visible
- Edit controls disabled in match profile

#### 8.5.3 Other Users (Viewers)

**Capabilities**:
- View match details in Info tab
- View live score updates
- View match statistics and event timeline
- Cannot edit anything
- Cannot access live scoring screen

**UI Indicators**:
- No badges
- No action buttons
- Read-only view

#### 8.5.4 Ownership Transfer

**Trigger**: Match owner selects "Transfer Ownership" from Match Options

**Flow**:
1. Search registered users
2. Select new owner (must be registered user)
3. Confirmation modal: "Transfer match ownership to [User]?"
4. On confirm:
   - Update `owner_user_id` to new user
   - Log transfer in match audit
   - Sync to cloud
   - Show success message
5. New owner gains full ownership capabilities
6. Previous owner becomes viewer (unless also scorer)

**Validation**:
- Cannot transfer to non-registered users
- Cannot transfer to same user
- Ownership transfer is permanent (no undo, but can transfer back)

---

## 9. Tournament System

### 9.1 Tournament Creation

#### 9.1.1 Tournament Formats

**Format 1: Round Robin**
- Every team plays every other team once (or twice for home/away)
- Standings based on points, goal difference, etc.
- No knockout phase
- Winner: Team with most points

**Format 2: Groups + Knockout**
- Phase 1: Teams divided into groups
- Each group plays round robin
- Phase 2: Top N teams from each group advance to knockout
- Knockout is single elimination
- Winner: Team winning final match

**Format 3: Pure Knockout**
- Single elimination bracket
- No group stage
- Losers eliminated immediately
- Winner: Team winning final match

#### 9.1.2 Tournament Configuration

**Basic Info**:
- Name (required, text input)
- Format (required, dropdown selection)
- Start date (date picker)
- End date (date picker)
- Venue (text input)
- Description (textarea, optional)
- Logo (image upload, optional)

**Match Rules**:
- Match duration (minutes, number input)
- Players per team (number input)
- Points for win (default: 3)
- Points for draw (default: 1)
- Points for loss (default: 0)

**Format-Specific Config**:

**If Round Robin**:
- Option: Single round robin or Double (home & away)
- No additional config

**If Groups + Knockout**:
- Number of groups (2-8)
- Teams per group (2-6)
- Teams advancing per group (1-4)
- Knockout format: Single elimination
- Third-place match option (yes/no)

**If Pure Knockout**:
- Total teams (must be 4, 8, 16, or 32)
- Seeding method:
  - Random
  - Manual (order of team addition determines seed)
  - Imported (from previous tournament standings)
- Third-place match option (yes/no)

### 9.2 Fixture Generation

#### 9.2.1 Round Robin Algorithm

```javascript
function generateRoundRobinFixtures(teams, matchDuration) {
  const fixtures = [];
  const n = teams.length;
  const rounds = n % 2 === 0 ? n - 1 : n;
  
  // Add dummy team if odd number
  const teamsArray = n % 2 === 0 ? teams : [...teams, 'BYE'];
  
  for (let round = 0; round < rounds; round++) {
    const roundFixtures = [];
    
    for (let i = 0; i < teamsArray.length / 2; i++) {
      const home = teamsArray[i];
      const away = teamsArray[teamsArray.length - 1 - i];
      
      if (home !== 'BYE' && away !== 'BYE') {
        roundFixtures.push({
          id: generateId(),
          team1: home,
          team2: away,
          round: round + 1,
          stage: 'round-robin',
          status: 'scheduled'
        });
      }
    }
    
    fixtures.push(...roundFixtures);
    
    // Rotate teams (keep first team fixed)
    teamsArray.splice(1, 0, teamsArray.pop());
  }
  
  return fixtures;
}
```

#### 9.2.2 Groups + Knockout Algorithm

**Phase 1: Group Stage**
```javascript
function generateGroupStageFixtures(groups, matchDuration) {
  const fixtures = [];
  
  groups.forEach(group => {
    const groupFixtures = generateRoundRobinFixtures(group.teams, matchDuration);
    
    // Add group label to each fixture
    groupFixtures.forEach(fixture => {
      fixture.group = group.name;
      fixture.stage = 'group-stage';
    });
    
    fixtures.push(...groupFixtures);
  });
  
  return fixtures;
}
```

**Phase 2: Knockout Stage**
```javascript
function generateKnockoutFixtures(qualifiedTeams, startDate) {
  const fixtures = [];
  const totalTeams = qualifiedTeams.length;
  
  // Determine number of rounds
  const rounds = Math.log2(totalTeams);
  
  let currentRound = qualifiedTeams;
  
  for (let r = 0; r < rounds; r++) {
    const roundFixtures = [];
    const stageName = getKnockoutStageName(totalTeams, r);
    
    for (let i = 0; i < currentRound.length; i += 2) {
      roundFixtures.push({
        id: generateId(),
        team1: currentRound[i],
        team2: currentRound[i + 1],
        stage: stageName,
        round: r + 1,
        status: 'scheduled'
      });
    }
    
    fixtures.push(...roundFixtures);
    
    // Next round has half the teams (winners TBD)
    currentRound = roundFixtures.map(() => 'TBD');
  }
  
  return fixtures;
}

function getKnockoutStageName(totalTeams, roundIndex) {
  const teamsInRound = totalTeams / Math.pow(2, roundIndex);
  
  if (teamsInRound === 32) return 'round-of-32';
  if (teamsInRound === 16) return 'round-of-16';
  if (teamsInRound === 8) return 'quarter-final';
  if (teamsInRound === 4) return 'semi-final';
  if (teamsInRound === 2) return 'final';
}
```

#### 9.2.3 Pure Knockout Algorithm

```javascript
function generateKnockoutBracket(teams, seeded = false) {
  if (!isPowerOfTwo(teams.length)) {
    throw new Error('Knockout requires power of 2 teams');
  }
  
  const orderedTeams = seeded ? seedTeams(teams) : shuffleTeams(teams);
  
  return generateKnockoutFixtures(orderedTeams);
}

function seedTeams(teams) {
  // Seeding pattern for 8 teams: 1v8, 2v7, 3v6, 4v5
  const n = teams.length;
  const seeded = [];
  
  for (let i = 0; i < n / 2; i++) {
    seeded.push(teams[i]);
    seeded.push(teams[n - 1 - i]);
  }
  
  return seeded;
}
```

#### 9.2.4 Date and Time Assignment

**Automated Scheduling**:
```javascript
function assignMatchDates(fixtures, startDate, matchDuration, breaksPerDay = 3) {
  const matchesPerDay = 3; // Default
  let currentDate = new Date(startDate);
  let matchesScheduledToday = 0;
  
  fixtures.forEach(fixture => {
    // Assign date
    fixture.matchDate = currentDate.toISOString().split('T')[0];
    
    // Assign time (e.g., 10:00 AM, 2:00 PM, 6:00 PM)
    const timeSlots = ['10:00', '14:00', '18:00'];
    fixture.matchTime = timeSlots[matchesScheduledToday % timeSlots.length];
    
    matchesScheduledToday++;
    
    // Move to next day after matchesPerDay
    if (matchesScheduledToday >= matchesPerDay) {
      currentDate.setDate(currentDate.getDate() + 1);
      matchesScheduledToday = 0;
    }
  });
  
  return fixtures;
}
```

### 9.3 Fixture Publishing

**Purpose**: Make fixtures visible to all users

**Flow**:
1. Tournament owner clicks "Publish Fixtures"
2. System validates:
   - All teams assigned to fixtures
   - No duplicate fixtures
   - All fixtures have dates and times
3. Confirmation modal: "Publish [N] fixtures? This will make them visible to all users."
4. On confirm:
   - Set fixture status to "scheduled"
   - Set tournament status to "in_progress"
   - Sync to cloud
   - Show success message

**After Publishing**:
- Fixtures appear in tournament profile (public)
- Users can create matches from fixtures
- Editing fixtures requires regeneration

### 9.4 Standings Calculation

#### 9.4.1 Points Table Logic

**Calculation Trigger**:
- After any match in tournament is completed and shared
- Recalculates entire standings

**Algorithm**:
```javascript
function calculateStandings(tournamentId) {
  const tournament = getTournamentById(tournamentId);
  const matches = getCompletedMatchesByTournament(tournamentId);
  const teams = tournament.participatingTeams;
  
  const standings = teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }));
  
  matches.forEach(match => {
    const team1 = standings.find(s => s.teamName === match.team1);
    const team2 = standings.find(s => s.teamName === match.team2);
    
    // Update match counts
    team1.played++;
    team2.played++;
    
    // Update goals
    team1.goalsFor += match.scoreA;
    team1.goalsAgainst += match.scoreB;
    team2.goalsFor += match.scoreB;
    team2.goalsAgainst += match.scoreA;
    
    // Determine result
    if (match.scoreA > match.scoreB) {
      team1.won++;
      team2.lost++;
      team1.points += tournament.pointsForWin;
      team2.points += tournament.pointsForLoss;
    } else if (match.scoreA < match.scoreB) {
      team2.won++;
      team1.lost++;
      team2.points += tournament.pointsForWin;
      team1.points += tournament.pointsForLoss;
    } else {
      team1.drawn++;
      team2.drawn++;
      team1.points += tournament.pointsForDraw;
      team2.points += tournament.pointsForDraw;
    }
  });
  
  // Calculate goal difference
  standings.forEach(team => {
    team.goalDifference = team.goalsFor - team.goalsAgainst;
  });
  
  // Sort standings
  standings.sort((a, b) => {
    // Primary: Points
    if (b.points !== a.points) return b.points - a.points;
    
    // Secondary: Goal difference
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    
    // Tertiary: Goals for
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    
    // Quaternary: Head-to-head (future)
    // For now: Alphabetical
    return a.teamName.localeCompare(b.teamName);
  });
  
  return standings;
}
```

#### 9.4.2 Group Standings

**For Groups + Knockout Format**:
- Calculate standings separately for each group
- Display multiple tables (one per group)
- Highlight top N teams who advance to knockout

**Advancement Logic**:
```javascript
function determineAdvancingTeams(groupStandings, teamsToAdvance) {
  return groupStandings.slice(0, teamsToAdvance);
}
```

#### 9.4.3 Knockout Bracket Updates

**After Each Knockout Match**:
1. Winner advances to next round fixture
2. Update next fixture with winner's name (replaces "TBD")
3. Loser eliminated (or moves to third-place match)
4. Sync updated fixtures to cloud

**Example**:
```javascript
function updateKnockoutBracket(matchId, winnerId) {
  const match = getMatchById(matchId);
  const fixture = getFixtureByMatchId(matchId);
  const nextRoundFixture = getNextRoundFixture(fixture);
  
  if (nextRoundFixture) {
    // Determine which slot (team1 or team2) to fill
    const slotIndex = fixture.slotIndex;
    
    if (slotIndex % 2 === 0) {
      nextRoundFixture.team1 = winnerId;
    } else {
      nextRoundFixture.team2 = winnerId;
    }
    
    saveFixture(nextRoundFixture);
  }
}
```

### 9.5 Tournament Editing

#### 9.5.1 Before Fixtures Generated

**Editable**:
- All tournament details (name, dates, venue, etc.)
- Tournament format
- Match rules (duration, points system)
- Participating teams (add/remove freely)

**Process**:
- Direct edit via tournament edit screen
- Save updates to localStorage and sync

#### 9.5.2 After Fixtures Generated

**Restricted Edits**:
- Cannot change tournament format
- Cannot remove teams with scheduled fixtures
- Adding teams requires fixture regeneration

**Warning Modal**:
- "This tournament has generated fixtures. Some changes will require regenerating all fixtures. Continue?"

**Regeneration Process**:
1. User confirms regeneration
2. System marks old fixtures as "archived"
3. Generates new fixtures with updated configuration
4. Assigns new dates and times
5. Prompts to publish new fixtures

#### 9.5.3 After Matches Started

**Highly Restricted**:
- Cannot change format
- Cannot remove teams
- Cannot regenerate fixtures without losing match data
- Can only edit: Name, dates, venue, description

**Manual Fixture Editing**:
- Edit individual fixtures (date, time, venue)
- Add custom fixtures
- Cancel fixtures (sets status to "cancelled")

---

## 10. Ownership Model

### 10.1 General Ownership Principles

1. **Creator Owns**: User who creates an entity becomes the owner
2. **Owner Controls**: Only owner can edit or delete entity
3. **Transferable**: Ownership can be transferred to registered users
4. **Audited**: All ownership changes logged with timestamps
5. **Public Viewing**: All users can view entities, editing is restricted

### 10.2 Player Profile Ownership

#### 10.2.1 Ownership Assignment

**Creation**:
- When user creates player profile: `owner_user_id` = creating user's ID
- When profile created without user (legacy): `owner_user_id` = null

**Claiming**:
- Unowned profiles can be claimed by users
- User searches for their name
- Selects profile and clicks "Claim"
- Profile linked via `owner_user_id`

**Rules**:
- One user can own only one player profile (their own)
- Cannot claim profile already owned
- Cannot create duplicate profiles with same name (validation)

#### 10.2.2 Owner Capabilities

- Edit all profile fields (name, position, jersey number, photo)
- View detailed statistics
- Control privacy settings (future)
- Transfer ownership (to another registered user)
- Cannot delete profile if linked to match history

#### 10.2.3 Non-Owner Capabilities

- View profile and statistics (read-only)
- Cannot edit any fields
- Cannot transfer ownership

### 10.3 Team Profile Ownership

#### 10.3.1 Ownership Assignment

**Creation**:
- User who creates team becomes owner
- `owner_user_id` = creating user's ID

**Transfer**:
- Current owner can transfer to:
  - Another registered user
  - Preferably team coordinator or player in roster

**Rules**:
- One team can have only one owner
- Owner must be registered user
- Transfer is permanent (but can transfer back)

#### 10.3.2 Owner Capabilities (Team Coordinator)

- Edit team details (name, coach, venue, description, logo)
- Add/remove players from roster
- Manage team in tournaments
- View team statistics
- Calculate and manage team-level payments (future)
- Transfer ownership
- Cannot delete team if linked to tournament or match history

#### 10.3.3 Non-Owner Capabilities

- View team profile and statistics (read-only)
- View roster
- Cannot edit anything
- Cannot add/remove players

### 10.4 Tournament Profile Ownership

#### 10.4.1 Ownership Assignment

**Creation**:
- User who creates tournament becomes coordinator/owner
- `owner_user_id` = creating user's ID

**Transfer**:
- Current coordinator can transfer to another registered user
- New owner gains full coordinator capabilities

**Rules**:
- One tournament can have only one owner/coordinator
- Owner must be registered user
- Transfer requires confirmation

#### 10.4.2 Coordinator Capabilities

- Edit tournament details (name, dates, venue, etc.)
- Add/remove participating teams
- Generate and publish fixtures
- Regenerate fixtures (with confirmation)
- Edit match rules (duration, points system)
- Manage tournament stages
- Transfer ownership
- Cannot delete tournament with match history

#### 10.4.3 Non-Coordinator Capabilities

- View tournament details (read-only)
- View fixtures and standings
- View participating teams
- Cannot edit anything
- Cannot manage fixtures

### 10.5 Match Ownership (NEW)

#### 10.5.1 Ownership Assignment

**Creation**:
- User who creates match becomes owner
- `owner_user_id` = creating user's ID
- By default, creator also assigned as primary scorer

**Transfer**:
- Match owner can transfer ownership to:
  - Assigned scorers (primary or secondary)
  - Other registered users
- Transfer gives new owner full control

**Rules**:
- One match can have only one owner
- Owner must be registered user
- Owner and scorers can be different users

#### 10.5.2 Match Owner Capabilities

- Edit match configuration (teams, venue, date, time)
- Assign primary scorer
- Assign secondary scorer (Advanced mode only)
- Configure responsibility division (if dual-scorer)
- Calculate and manage match payments
- View all match details and events
- Transfer match ownership
- Delete match (with confirmation if events exist)

**Restrictions**:
- Cannot modify events recorded by scorers (must edit via scorer)
- Cannot delete completed matches without confirmation

#### 10.5.3 Scorer vs. Owner Separation

**Scenario**: User A creates match, assigns User B as scorer

**User A (Owner)**:
- Can edit match details
- Cannot record events (not assigned as scorer)
- Can calculate payments
- Can transfer ownership

**User B (Scorer)**:
- Can record match events
- Cannot edit match configuration
- Cannot calculate payments
- Cannot transfer ownership

**Both**:
- Can view full match details
- Can share match result

### 10.6 Coordinator Logic

**Team Coordinator**:
- Role: Owner of team profile
- Identified by: `team.owner_user_id`
- Capabilities: Full team management

**Tournament Coordinator**:
- Role: Owner of tournament profile
- Identified by: `tournament.owner_user_id`
- Capabilities: Full tournament management

**Match Coordinator**:
- Role: Match owner
- Identified by: `match.owner_user_id`
- Capabilities: Match configuration and payment management

**Delegation**:
- Coordinators can transfer ownership to delegate responsibilities
- Transfer does not affect historical attribution (`created_by` remains unchanged)

---

## 11. UI Architecture

### 11.1 Screen Hierarchy

```
App Root
├── Authentication
│   ├── Login Screen
│   ├── Signup Screen
│   └── Profile Setup Screen
│
├── Main App (Post-Login)
│   ├── Header (Global)
│   │   ├── Logo
│   │   ├── Sync Status
│   │   └── Profile Menu
│   │
│   ├── Tab Navigation (Bottom)
│   │   ├── Live Scores Tab
│   │   ├── Scoring Tab
│   │   └── Info Tab
│   │
│   └── Content Area
│       ├── Live Scores Tab Content
│       │   ├── Live Matches List
│       │   └── Match Profile View (Modal/Screen)
│       │
│       ├── Scoring Tab Content
│       │   ├── New Match Screen
│       │   ├── Select Squad Screen
│       │   ├── Live Scoring Screen
│       │   ├── Match Result Screen
│       │   ├── Calculate Payment Screen
│       │   ├── Match Payments Screen (Tabbed)
│       │   └── My Matches Screen
│       │
│       └── Info Tab Content
│           ├── Info Home (Tabbed)
│           │   ├── Live Scores View
│           │   ├── Results View
│           │   ├── Players View
│           │   ├── Teams View
│           │   └── Tournaments View
│           │
│           ├── Player Profile View
│           ├── Player Profile Edit
│           ├── Team Profile View
│           ├── Team Profile Edit
│           ├── Tournament Profile View
│           └── Tournament Edit/Create
```

### 11.2 Component Structure

#### 11.2.1 Core Layout Components

**App.tsx**
- Root component
- Manages global state (currentUser, matches, players, teams, tournaments)
- Handles routing/view switching
- Loads data from localStorage on mount
- Triggers sync operations

**Header.tsx**
- Displays app logo
- Shows user profile avatar
- Sync status indicator
- Profile menu dropdown

**TabNavigation.tsx**
- Three-tab bottom bar
- Active state management
- Navigation icons and labels

#### 11.2.2 Reusable Components

**UserAutocompleteInput.tsx**
- Autocomplete input for user selection
- Shows suggestions with avatars, names, email/phone
- "Registered" badge for users with accounts
- Used in: Scorer assignment, payment treasurer selection

**TeamAutocomplete.tsx**
- Autocomplete input for team selection
- Shows team names with filter
- "Add Team" option inline
- Used in: Match creation, tournament teams

**PlayerCard.tsx**
- Displays player info (avatar, name, position, jersey number)
- Used in: Squad grid, roster lists, player search

**MatchCard.tsx**
- Displays match summary (teams, score, date, venue)
- Used in: Match lists, live scores, results

**EventTimeline.tsx**
- Scrollable list of match events
- Event cards with icons, player names, minute
- Edit/delete actions
- Used in: Live scoring, match profile

**StandingsTable.tsx**
- Points table display
- Sortable columns
- Color-coded positions
- Used in: Tournament profile

#### 11.2.3 Screen-Level Components

**NewMatch.tsx**
- Match creation form
- Tournament/team selection
- Scoring level selection
- Scorer assignment interface (NEW)
- Responsibility division (NEW)

**SelectSquad.tsx**
- Squad selection for both teams
- Player checkboxes
- Add player inline
- Player count validation

**LiveScoring.tsx**
- Live match scoring interface
- Squad grid display
- Event type buttons
- Event timeline
- Score display and timer

**MatchResult.tsx**
- Final score display
- Match summary statistics
- Action buttons (Share, Calculate Payment)

**CalculatePayment.tsx**
- Payment configuration
- Player payment list with status
- Auto-save on payment status change (NEW)
- Treasurer selection

**MatchPayments.tsx**
- Tabbed view (Upcoming, Pending, Completed)
- Match cards with payment summaries
- Filter and search

**PlayerProfile.tsx**
- Player details and statistics
- Recent matches list
- Edit controls (if owner)

**TeamProfile.tsx**
- Team details and statistics
- Squad roster
- Recent matches
- Edit controls (if owner)

**TournamentProfile.tsx**
- Tournament details
- Fixtures list (grouped by stage)
- Standings table
- Edit controls (if coordinator)

### 11.3 Routing and Navigation

#### 11.3.1 View State Management

**Approach**: Single-page application with view state

**State Variable**: `currentView`

**Possible Values**:
- `login` (default if not authenticated)
- `home` (after login, shows active tab content)
- `newMatch`
- `selectSquad`
- `liveScoring`
- `matchResult`
- `calculatePayment`
- `matchPayments`
- `myMatches`
- `playerProfile`
- `teamProfile`
- `tournamentProfile`
- etc.

**Navigation Functions**:
```javascript
function navigateTo(view, data = null) {
  setCurrentView(view);
  if (data) setViewData(data);
}

function goBack() {
  // Pop from navigation stack or default to home
  setCurrentView(previousView || 'home');
}
```

#### 11.3.2 Tab Switching

**Within Home View**:
- `activeTab` state: `liveScores`, `scoring`, `info`
- Tab click updates activeTab
- Content area renders based on activeTab

**Deep Linking** (future):
- Use URL fragments: `#/match/123`, `#/player/456`
- On load, parse URL and set currentView + viewData

### 11.4 State Management

#### 11.4.1 Global State

**Stored in App.tsx**:
- `currentUser`: Authenticated user object
- `playerDatabase`: Array of all players
- `registeredTeams`: Array of all teams
- `tournaments`: Array of all tournaments
- `matches`: Array of all matches
- `currentView`: Active screen
- `activeTab`: Active tab (if in home view)
- `viewData`: Data passed to current view (e.g., selected match)

**State Updates**:
- Functions defined in App.tsx
- Passed down as props to child components
- Child components call these functions to update state
- State changes trigger re-render

**Example**:
```javascript
const handleAddPlayer = (playerData) => {
  const newPlayer = {
    id: generateId(),
    ...playerData,
    created_by: currentUser.user_id,
    owner_user_id: currentUser.user_id,
    created_at: Date.now()
  };
  
  setPlayerDatabase([...playerDatabase, newPlayer]);
  localStorage.setItem('vscor_players', JSON.stringify([...playerDatabase, newPlayer]));
  triggerSync('player', newPlayer.id);
};
```

#### 11.4.2 Local Component State

**Used for**:
- Form inputs (controlled components)
- UI state (modals open/closed, dropdowns expanded)
- Temporary data (before saving to global state)

**Example in NewMatch.tsx**:
```javascript
const [team1, setTeam1] = useState('');
const [team2, setTeam2] = useState('');
const [primaryScorer, setPrimaryScorer] = useState(null);
```

### 11.5 Responsive Design

#### 11.5.1 Mobile-First Approach

**Target**: Smartphones (320px - 480px width)

**Design Principles**:
- Single column layouts
- Touch-friendly buttons (min 48x48px)
- Bottom navigation bar (reachable with thumb)
- Minimal text input (use selections and autocomplete)
- Large, readable fonts (minimum 14px)

#### 11.5.2 Tablet & Desktop (Future)

**Tablet (768px+)**:
- Two-column layouts where appropriate
- Side-by-side squad selection
- Larger modal dialogs
- Tab navigation remains bottom (familiar)

**Desktop (1024px+)**:
- Three-column layouts (e.g., team list + match list + details)
- Sidebar navigation (instead of bottom tabs)
- Hover states for interactive elements
- Keyboard shortcuts

---

## 12. Edge Case Handling

### 12.1 Team Withdrawal

**Scenario**: Team withdraws from tournament after fixtures generated

**Handling**:
1. Tournament coordinator selects team and clicks "Withdraw Team"
2. Confirmation modal:
   - "This team has [N] scheduled fixtures. Withdrawing will affect these matches."
   - Options:
     - "Cancel all fixtures" (sets status to "cancelled")
     - "Replace team" (search for replacement team)
3. On confirm:
   - Update fixtures:
     - If cancelling: Set status to "cancelled"
     - If replacing: Update team1/team2 in fixtures
   - Update standings (recalculate without withdrawn team)
   - Notify users (future: push notification)
   - Sync to cloud

**Validation**:
- Cannot withdraw team if matches already played
- Option to forfeit remaining matches (counted as losses)

### 12.2 Team Addition Mid-Tournament

**Scenario**: Coordinator wants to add team after fixtures generated

**Handling**:
1. Add team to participatingTeams array
2. Show warning:
   - "Fixtures are already generated. Adding this team will not create fixtures automatically."
   - Options:
     - "Add team only" (manual fixture creation required)
     - "Regenerate all fixtures" (warning: will affect existing schedule)
3. If regenerate:
   - Archive old fixtures
   - Generate new fixtures with added team
   - Prompt to re-publish
4. If manual:
   - Team added to list
   - Coordinator creates custom fixtures for new team

**Validation**:
- Cannot regenerate if matches already played (unless explicitly confirmed)
- Warn about impact on standings

### 12.3 Editing Tournament Structure

**Scenario**: Coordinator wants to change format or configuration after fixtures generated

**Handling**:
1. Detect that fixtures exist
2. Show blocking modal:
   - "This tournament has generated fixtures. Changing the format will require regenerating all fixtures."
   - "Existing fixtures will be archived."
   - Continue? (Yes/No)
3. On Yes:
   - Archive fixtures (mark as "archived", keep for history)
   - Allow format change
   - After save, prompt to generate new fixtures
4. On No:
   - Abort edit, return to view mode

**Validation**:
- Cannot change format if matches already played (without explicit confirmation and archival)

### 12.4 Duplicate Team IDs

**Scenario**: Same team added multiple times to tournament (should not happen, but handle gracefully)

**Prevention**:
- Check for duplicate before adding:
  ```javascript
  if (tournament.participatingTeams.some(t => t.id === teamId)) {
    alert('This team is already in the tournament');
    return;
  }
  ```

**Detection** (background):
- On sync, check for duplicates
- If found, deduplicate:
  - Keep first occurrence
  - Remove subsequent duplicates
  - Log warning

### 12.5 Fixture Regeneration

**Scenario**: Coordinator regenerates fixtures after matches played

**Handling**:
1. Detect completed matches linked to fixtures
2. Show critical warning:
   - "This tournament has [N] completed matches."
   - "Regenerating fixtures will disconnect these matches from the tournament."
   - "Match results will remain, but will not appear in tournament standings."
   - Continue? (Yes/No)
3. On Yes:
   - Mark old fixtures as "archived"
   - Set match.tournamentId to null for disconnected matches (or move to "archived_tournament")
   - Generate new fixtures
   - Recalculate standings (will be empty)
   - Sync to cloud

**Validation**:
- Require explicit text confirmation: Type "REGENERATE" to confirm

### 12.6 Data Conflicts

**Scenario**: Same entity modified on two devices, conflicting updates

**Detection**:
```javascript
function detectConflict(localEntity, cloudEntity) {
  return localEntity.updated_at < cloudEntity.updated_at && localEntity.updated_at !== localEntity.synced_at;
}
```

**Resolution**:
1. Timestamp-based: Cloud wins (most recent updated_at)
2. Notify user:
   - "Your changes to [entity] were overwritten by more recent changes."
   - Option to "View Details" (shows both versions)
3. Future: Manual conflict resolution screen

**Logging**:
- Log all conflicts to `sync_log` for debugging
- Include: entity type, entity ID, local updated_at, cloud updated_at, resolution

---

## 13. Validation Rules

### 13.1 Match Creation Validation

**Required Fields**:
- Team 1 (must not be empty)
- Team 2 (must not be empty)
- Match format (single or halves)
- Duration (5-90 minutes)
- Players per team (1-11)
- Scoring level (basic, intermediate, advanced)
- Primary scorer (must be registered user)

**Business Rules**:
- Team 1 ≠ Team 2 (same team cannot play itself)
- Duration must be numeric and within range
- If tournament selected, must select tournament stage
- If secondary scorer assigned (Advanced mode):
  - Must be different from primary scorer
  - Must select responsibility division type
  - If team-based: Both teams must be assigned scorers
  - If event-based: Auto-assign event types (no user input)

**UI Validation**:
- Inline error messages (red text below field)
- Submit button disabled until all validations pass
- Visual feedback (red border on invalid fields)

### 13.2 Tournament Creation Validation

**Required Fields**:
- Tournament name (not empty)
- Format (must select one)
- Start date (valid date)
- Match duration (numeric, 5-90)
- Players per team (numeric, 1-11)
- Minimum 2 participating teams

**Format-Specific Validation**:
- **Groups + Knockout**:
  - Number of groups ≥ 2
  - Teams per group ≥ 2
  - Total teams must be evenly divisible into groups
  - Teams advancing ≤ teams per group
- **Pure Knockout**:
  - Total teams must be power of 2 (4, 8, 16, 32)
  - If not, show error: "Knockout requires 4, 8, 16, or 32 teams. You have [N]."

**Business Rules**:
- Start date ≤ End date
- Cannot create tournament with duplicate name (warning, not blocking)
- Participating teams must have unique IDs

### 13.3 Player Profile Validation

**Required Fields**:
- Name (not empty, min 2 characters)

**Optional Fields**:
- Email (if provided, must be valid format)
- Phone number (if provided, must be numeric)
- Position (free text)
- Jersey number (free text)

**Business Rules**:
- Cannot create duplicate player profiles with same name and same owner_user_id
- Cannot claim profile already owned by another user
- One user can own only one player profile

### 13.4 Team Profile Validation

**Required Fields**:
- Team name (not empty, min 2 characters)

**Optional Fields**:
- Coach, venue, description (free text)
- Logo (image upload)

**Business Rules**:
- Cannot create duplicate teams with same name in same tournament (warning)
- Team name must be unique within tournament context
- Cannot remove players from team if they have played matches for this team (warning, not blocking)

### 13.5 Event Recording Validation

**Required**:
- Player must be selected (except for team-level events like corners)
- Event type must be selected
- Match minute must be valid (0 ≤ minute ≤ match duration)

**Business Rules**:
- Cannot record events for substituted OUT players (button disabled)
- Cannot record goal for own team as "Own Goal" (must switch teams)
- If dual-scorer mode with team-based division:
  - Can only record for assigned team
- If dual-scorer mode with event-based division:
  - Can only record assigned event types

**Attribute Validation**:
- Assist player must be different from scoring player
- Substitution: Out player must be in starting lineup or previously subbed in
- Substitution: In player must not already be on field

### 13.6 Fixture Integrity

**After Generation**:
- All fixtures must have team1 and team2 assigned
- No duplicate fixtures (same teams, same round)
- All fixtures have unique IDs
- Match dates are sequential

**After Publishing**:
- All fixtures have status "scheduled"
- Dates and times assigned
- No conflicts (same team playing two matches at same time)

**Conflict Detection**:
```javascript
function detectFixtureConflicts(fixtures) {
  const conflicts = [];
  
  fixtures.forEach((fixture, i) => {
    fixtures.slice(i + 1).forEach((other) => {
      // Same team playing at overlapping times
      const sameTeam = fixture.team1 === other.team1 || fixture.team1 === other.team2 || 
                       fixture.team2 === other.team1 || fixture.team2 === other.team2;
      const sameDate = fixture.matchDate === other.matchDate;
      const overlappingTime = Math.abs(timeToMinutes(fixture.matchTime) - timeToMinutes(other.matchTime)) < fixture.duration;
      
      if (sameTeam && sameDate && overlappingTime) {
        conflicts.push({ fixture1: fixture.id, fixture2: other.id });
      }
    });
  });
  
  return conflicts;
}
```

**Resolution**:
- If conflicts detected, show warning before publishing
- Option to auto-adjust times
- Or manually edit fixtures

---

## 14. Design System

### 14.1 UI Consistency

#### 14.1.1 Color Palette

**Primary Colors**:
- Purple (Primary): `#8B5CF6` (purple-600)
  - Hover: `#7C3AED` (purple-700)
  - Light: `#EDE9FE` (purple-50)
  - Used for: Primary buttons, active states, branding

**Secondary Colors**:
- Blue (Information): `#3B82F6` (blue-600)
  - Used for: Scorer assignment section, informational elements
- Green (Success): `#10B981` (green-500)
  - Used for: Confirmation actions, positive indicators
- Red (Danger): `#EF4444` (red-500)
  - Used for: Delete actions, errors, warnings
- Orange (Warning): `#F59E0B` (orange-500)
  - Used for: Pending states, warnings
- Yellow (Fouls): `#FBBF24` (yellow-500)
  - Used for: Yellow cards, foul events

**Neutral Colors**:
- Gray scale: `#F9FAFB` (gray-50) to `#111827` (gray-900)
- White: `#FFFFFF`
- Black: `#000000`

**Semantic Colors**:
- Goal: Green (`#10B981`)
- Shot: Blue (`#3B82F6`)
- Foul: Yellow/Red (`#FBBF24` / `#EF4444`)
- Substitution: Purple (`#8B5CF6`)
- Card: Yellow/Red (`#FBBF24` / `#EF4444`)

#### 14.1.2 Typography

**Font Family**: System fonts for performance
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Font Sizes**:
- Headings:
  - H1: 24px (1.5rem) - Page titles
  - H2: 20px (1.25rem) - Section titles
  - H3: 18px (1.125rem) - Subsection titles
- Body:
  - Base: 16px (1rem)
  - Small: 14px (0.875rem)
  - Extra small: 12px (0.75rem)

**Font Weights**:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

#### 14.1.3 Spacing

**Base Unit**: 4px

**Spacing Scale**:
- xs: 4px (0.25rem)
- sm: 8px (0.5rem)
- md: 16px (1rem)
- lg: 24px (1.5rem)
- xl: 32px (2rem)
- 2xl: 48px (3rem)

**Padding**:
- Cards: 16px (md)
- Buttons: 12px 16px
- Screen edges: 24px (lg)

**Margins**:
- Between sections: 24px (lg)
- Between elements: 16px (md)

#### 14.1.4 Border Radius

- Small: 8px (0.5rem) - Buttons, inputs
- Medium: 12px (0.75rem) - Cards
- Large: 16px (1rem) - Modals, large cards
- Full: 9999px - Circular elements (avatars, badges)

#### 14.1.5 Shadows

**Elevation Levels**:
- Level 1 (Subtle): `0 1px 3px rgba(0,0,0,0.1)`
- Level 2 (Cards): `0 4px 6px rgba(0,0,0,0.1)`
- Level 3 (Modals): `0 10px 25px rgba(0,0,0,0.15)`
- Level 4 (Dropdowns): `0 20px 40px rgba(0,0,0,0.2)`

### 14.2 Minimalistic Scoring Interface

**Goals**:
- Fast event recording (< 2 seconds)
- Minimal distractions
- Clear visual hierarchy
- Touch-optimized

**Design Decisions**:
- **Large touch targets**: Min 48x48px for all interactive elements
- **Single-screen design**: No nested modals or complex navigation during scoring
- **Auto-save**: No "Save" button required, events save immediately
- **Visual feedback**: Instant updates to score and timeline
- **Color coding**: Event types have distinct colors for quick recognition

**Layout**:
```
┌─────────────────────────────────────┐
│  Header: Team 1  [2-1]  Team 2      │ ← Large, bold scores
│  Timer: 45'        [Pause]          │
├─────────────────────────────────────┤
│  [Team 1] | [Team 2]                │ ← Team tabs
├─────────────────────────────────────┤
│  Squad Grid (3x3)                   │ ← Player cards
│  ┌───┐ ┌───┐ ┌───┐                  │
│  │ 7 │ │ 9 │ │10 │                  │
│  │JD │ │SK │ │MT │                  │
│  └───┘ └───┘ └───┘                  │
│  ┌───┐ ┌───┐ ┌───┐                  │
│  │...│ │...│ │...│                  │
├─────────────────────────────────────┤
│  Event Buttons (2 columns)          │ ← Large, color-coded
│  [⚽ Goal]    [🎯 Shot On]          │
│  [❌ Shot Off] [🚫 Foul]            │
│  [🔄 Sub]      [⚪ Corner]          │
├─────────────────────────────────────┤
│  Event Timeline (bottom sheet)      │ ← Swipe to expand
│  45' - ⚽ John Doe - Goal            │
│  43' - 🎯 Sam K - Shot on Target    │
│  ...                                 │
└─────────────────────────────────────┘
```

### 14.3 Mobile-First Design

**Target Devices**:
- iPhone SE (320px width) - minimum
- iPhone 12/13/14 (390px width) - primary
- Android mid-range (360px-414px width) - primary
- iPad (768px width) - secondary

**Responsive Breakpoints**:
```css
/* Mobile (default) */
@media (max-width: 767px) { ... }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }
```

**Mobile Optimizations**:
- Single column layouts
- Bottom navigation (reachable with thumb)
- Sticky headers and footers
- Swipe gestures for navigation
- Touch-friendly form inputs (date pickers, dropdowns)
- Minimal keyboard input (autocomplete, selections)

**Performance**:
- Images lazy-loaded
- Virtualized lists for long data sets
- Debounced search inputs
- Optimistic UI updates (don't wait for sync)

### 14.4 High-Speed Event Entry

**Speed Targets**:
- Basic event: 1-2 seconds
- Detailed event: 3-4 seconds
- Substitution: 3-5 seconds

**Optimizations**:
1. **Pre-selection**: Last selected player remains selected
2. **Smart defaults**: Most common attributes pre-selected
3. **Keyboard shortcuts** (desktop): Numbers for players, letters for events
4. **Gesture support** (future): Swipe player card for quick goal
5. **Voice input** (future): "Goal, number 9"

**Event Recording Flow** (Basic):
```
Tap player (1 sec) → Tap Goal (0.5 sec) → Event recorded
Total: 1.5 seconds
```

**Event Recording Flow** (Detailed):
```
Tap player (1 sec) → Tap Goal (0.5 sec) → Modal opens (instant) → 
Select goal type (1 sec) → Select assist (1 sec) → Tap Confirm (0.5 sec)
Total: 4 seconds
```

**UI Enhancements**:
- Button press animations (scale down 95%)
- Success toast messages (brief, non-blocking)
- Haptic feedback on touch (mobile)
- Audio cues (optional, configurable)

---

## 15. Future Scalability

### 15.1 Multi-Device Scoring

**Vision**: Multiple scorers on different devices scoring the same match in real-time

**Requirements**:
1. **WebSocket Connection**: Real-time sync between devices
2. **Operational Transformation**: Resolve concurrent edits
3. **Conflict-Free Replicated Data Types (CRDTs)**: For event list consistency
4. **Lock Mechanism**: Prevent simultaneous edits of same event

**Implementation Approach**:
- Use Supabase Realtime for WebSocket connections
- Subscribe both scorers to same match channel
- Broadcast events immediately upon recording
- Merge incoming events into local timeline
- Detect duplicates by event ID and timestamp

**UX Enhancements**:
- Show "Other scorer is online" indicator
- Live cursor/selection indicator (which player other scorer has selected)
- Event attribution: "Recorded by [Scorer Name]"

### 15.2 Live Match Tracking

**Vision**: Spectators can follow matches in real-time from Info tab

**Features**:
1. **Live Score Updates**: Auto-refresh every 5 seconds
2. **Event Notifications**: Push notifications for goals, cards
3. **Live Commentary** (auto-generated): "45' - John Doe scores! Team A leads 2-1"
4. **Match Timeline Graph**: Visualize when goals were scored
5. **Live Statistics**: Updating stats (shots, possession, etc.)

**Implementation**:
- Supabase Realtime channels per match
- Public read-only subscriptions for non-scorers
- Server-side event aggregation for statistics
- Push notifications via service workers (PWA)

### 15.3 Advanced Analytics

**Vision**: Detailed performance insights for players, teams, and tournaments

**Metrics**:
1. **Player Analytics**:
   - Goals per 90 minutes
   - Shot accuracy %
   - Pass completion % (future)
   - Heat maps (future)
   - xG (expected goals, future)
2. **Team Analytics**:
   - Formation analysis
   - Possession %
   - Attacking efficiency
   - Defensive strength
3. **Tournament Analytics**:
   - Top scorers, assisters
   - Most disciplined team (fewest cards)
   - Average goals per match
   - Goal time distribution

**Visualization**:
- Charts (line, bar, pie) using Recharts library
- Interactive dashboards
- Export reports as PDF

### 15.4 League Ecosystems

**Vision**: Multiple tournaments grouped into leagues with promotion/relegation

**Structure**:
```
League (Federation)
├── Division 1 (Tournament)
│   ├── Team A
│   ├── Team B
│   └── ...
├── Division 2 (Tournament)
│   ├── Team X
│   └── ...
└── Promotion/Relegation Rules
```

**Features**:
- Automatic promotion/relegation based on standings
- Cross-division fixtures (cup competitions)
- League-wide statistics and leaderboards
- Multi-season tracking
- Historical records

**Implementation**:
- New entity: `League`
- Tournament links to League via `leagueId`
- Promotion rules: Top N teams from lower division swap with bottom N from higher division
- Season management: Archive previous seasons

### 15.5 Federation-Level Tournaments

**Vision**: Large-scale tournaments with hundreds of teams across regions

**Features**:
1. **Multi-Stage Tournaments**:
   - Regional qualifiers → National groups → Final knockout
2. **Regional Grouping**:
   - North, South, East, West regions
   - Region-specific fixtures
3. **Referee Management**:
   - Assign referees to matches
   - Track referee assignments
4. **Venue Management**:
   - Multiple venues with capacity
   - Automatic venue assignment based on availability
5. **Ticketing** (future):
   - Sell tickets for matches
   - QR code entry

**Scalability Considerations**:
- Database optimization (indexing, partitioning)
- Cloud-first approach (less reliance on localStorage for large data)
- Pagination for large lists
- Caching strategies
- CDN for assets (logos, photos)

**Data Structure**:
```javascript
Federation {
  id: string,
  name: string,
  regions: [
    {
      id: string,
      name: string,
      tournaments: [Tournament]
    }
  ],
  officials: [
    {
      id: string,
      name: string,
      role: "referee" | "coordinator"
    }
  ]
}
```

### 15.6 Additional Future Features

1. **Player Transfers**:
   - Transfer players between teams
   - Track transfer history
   - Transfer windows and deadlines

2. **Sponsorships**:
   - Link sponsors to teams/tournaments
   - Display sponsor logos
   - Track sponsorship revenue

3. **Broadcasting Integration**:
   - Live stream integration
   - Overlay match statistics on video
   - Sync video with event timeline

4. **Social Features**:
   - Follow players, teams, tournaments
   - Share match results on social media
   - Comment on matches

5. **Gamification**:
   - Achievements and badges
   - Player rankings
   - Fantasy leagues

6. **Scouting Tools**:
   - Player comparison
   - Talent identification
   - Export scouting reports

7. **Mobile Apps**:
   - Native iOS app
   - Native Android app
   - Offline-first architecture maintained

8. **API for Third-Party Integration**:
   - Public API for accessing match data
   - Webhooks for real-time events
   - OAuth for third-party apps

---

## 16. Technical Implementation Notes

### 16.1 Technology Stack

**Frontend**:
- React 18 (functional components, hooks)
- Tailwind CSS v4 (utility-first styling)
- Lucide React (icons)
- Recharts (charts and graphs, future)

**Backend**:
- Supabase (PostgreSQL database)
- Supabase Auth (email/password authentication)
- Supabase Edge Functions (Hono web server)
- Supabase Storage (future: for images/videos)

**Storage**:
- Browser `localStorage` (primary, offline-first)
- Supabase KV Store (`kv_store_845a157a` table)

**Deployment**:
- Frontend: Figma Make (hosted)
- Backend: Supabase Cloud

### 16.2 Code Organization

**File Structure**:
```
/
├── App.tsx                    # Root component, global state
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── NewMatch.tsx           # Match creation
│   ├── SelectSquad.tsx        # Squad selection
│   ├── LiveScoring.tsx        # Live scoring interface
│   ├── MatchResult.tsx        # Match result display
│   ├── CalculatePayment.tsx   # Payment calculation
│   ├── MatchPayments.tsx      # Payment tracking
│   ├── PlayerProfile.tsx      # Player profile view
│   ├── TeamProfile.tsx        # Team profile view
│   ├── TournamentProfile.tsx  # Tournament profile view
│   ├── UserAutocompleteInput.tsx # User search component
│   └── ...
├── utils/
│   ├── teamManagement.ts      # Team CRUD operations
│   ├── matchHelpers.ts        # Match-related utilities
│   ├── syncManager.ts         # Cloud sync logic
│   └── ...
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx      # Hono server entry point
│           └── kv_store.tsx   # KV store utilities
├── styles/
│   └── globals.css            # Global styles, Tailwind config
└── imports/                   # Import files (attachments)
```

### 16.3 Performance Considerations

**Optimization Strategies**:
1. **Lazy Loading**: Load components only when needed
2. **Memoization**: Use `React.memo` for expensive components
3. **Virtualization**: For long lists (react-window or similar)
4. **Debouncing**: For search inputs (300ms delay)
5. **Throttling**: For scroll handlers
6. **Image Optimization**: Compress and lazy-load images
7. **Local Caching**: Cache API responses in memory
8. **Batch Updates**: Batch multiple state updates

**Metrics to Monitor**:
- Time to Interactive (TTI): < 3 seconds
- First Contentful Paint (FCP): < 1.5 seconds
- Event recording latency: < 100ms (local)
- Sync latency: < 500ms (network-dependent)

### 16.4 Security Considerations

**Authentication**:
- Passwords hashed by Supabase Auth (bcrypt)
- Access tokens stored securely in localStorage (not cookies to avoid CSRF)
- Token expiration and refresh mechanism

**Authorization**:
- Row-level security (future) in Supabase
- Frontend validation (not security boundary, UX only)
- Backend validates ownership before writes

**Data Protection**:
- HTTPS only (enforced by Supabase)
- No sensitive data stored in localStorage (no payment card details)
- User IDs are UUIDs (not sequential, harder to guess)

**Input Validation**:
- Sanitize all user inputs (prevent XSS)
- Validate data types and ranges
- Use parameterized queries (Supabase handles)

### 16.5 Error Handling

**Strategy**:
1. **Try-Catch**: Wrap async operations
2. **Error Boundaries**: Catch React rendering errors
3. **User-Friendly Messages**: Don't show stack traces
4. **Logging**: Console.log errors for debugging
5. **Fallback UI**: Show error state, not blank screen

**Example**:
```javascript
try {
  await syncMatchToCloud(matchId);
  showSuccessToast('Match synced successfully');
} catch (error) {
  console.error('Sync error:', error);
  showErrorToast('Failed to sync match. Will retry later.');
  addToSyncQueue(matchId); // Retry mechanism
}
```

### 16.6 Testing Strategy (Future)

**Unit Tests**:
- Test utility functions (scoring calculations, fixture generation)
- Use Jest and React Testing Library
- Target coverage: > 80%

**Integration Tests**:
- Test complete flows (create match → score events → share result)
- Use Playwright or Cypress
- Test offline-to-online sync

**End-to-End Tests**:
- Test critical user journeys (onboarding, creating tournament, scoring match)
- Run on real devices (BrowserStack)

**Performance Tests**:
- Load testing (simulate 100+ concurrent users)
- Stress testing (large tournaments with 1000+ matches)

---

## 17. Glossary

**Terms**:
- **Owner**: User who created and controls an entity
- **Coordinator**: Owner of a team or tournament
- **Scorer**: User assigned to record match events
- **Primary Scorer**: Main scorer assigned to a match
- **Secondary Scorer**: Optional second scorer (Advanced mode only)
- **Responsibility Division**: How scoring duties are split between two scorers
- **Fixture**: A scheduled match in a tournament
- **Squad**: Selected players for a match
- **Roster**: All players in a team
- **Event**: A recorded action during a match (goal, shot, foul, etc.)
- **Scoring Level**: Level of detail in match event tracking
- **Match Format**: Single continuous or two halves
- **Tournament Format**: Round robin, groups + knockout, or pure knockout
- **Standings**: Points table showing team rankings
- **Sync**: Process of synchronizing local data with cloud database

---

## 18. Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | [Date] | Initial PRD draft | AI Assistant |
| 2.0 | March 8, 2026 | Added Scorer Assignment System, Match Ownership, Dual-Scorer Support, Responsibility Division, Match Payments Auto-Save, Auto Date/Time Setting | AI Assistant |

---

## 19. Appendices

### Appendix A: API Endpoints

**Authentication**:
- `POST /functions/v1/make-server-845a157a/signup` - Create user account
- `POST /functions/v1/make-server-845a157a/login` - (Deprecated, use Supabase Auth)

**Sync**:
- `POST /functions/v1/make-server-845a157a/sync/batch` - Batch sync entities
- `GET /functions/v1/make-server-845a157a/sync/status` - Get sync status

**Entities**:
- `GET /functions/v1/make-server-845a157a/player/:id` - Get player
- `POST /functions/v1/make-server-845a157a/player` - Create/update player
- `GET /functions/v1/make-server-845a157a/team/:id` - Get team
- `POST /functions/v1/make-server-845a157a/team` - Create/update team
- `GET /functions/v1/make-server-845a157a/tournament/:id` - Get tournament
- `POST /functions/v1/make-server-845a157a/tournament` - Create/update tournament
- `GET /functions/v1/make-server-845a157a/match/:id` - Get match
- `POST /functions/v1/make-server-845a157a/match` - Create/update match

### Appendix B: LocalStorage Keys

```javascript
// User session
'vscor_currentUser'           // { user_id, email, name, profile_photo, ... }
'vscor_accessToken'           // Supabase JWT token

// Entities
'vscor_players'               // Array of player profiles
'vscor_teams'                 // Array of teams
'vscor_tournaments'           // Array of tournaments
'vscor_matches'               // Array of matches

// Sync
'vscor_lastSync'              // Timestamp of last sync
'vscor_pendingSync'           // Array of entity IDs pending sync
'vscor_syncErrors'            // Array of sync errors
```

### Appendix C: Event Type Codes

```javascript
const EVENT_TYPES = {
  GOAL: 'goal',
  SHOT_ON_TARGET: 'shot_on_target',
  SHOT_OFF_TARGET: 'shot_off_target',
  FOUL: 'foul',
  SUBSTITUTE: 'substitute',
  CORNER: 'corner',
  INTERCEPTION: 'interception',
  OFFSIDE: 'offside',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card'
};
```

### Appendix D: Responsibility Division Mappings

**Event-Based Division** (Advanced Mode):
```javascript
const EVENT_RESPONSIBILITY_MAPPING = {
  PRIMARY_SCORER: [
    'goal',
    'shot_on_target',
    'shot_off_target',
    'foul'
  ],
  SECONDARY_SCORER: [
    'interception',
    'offside',
    'substitute',
    'corner'
  ]
};
```

**Team-Based Division** (Advanced Mode):
- Configured dynamically during match creation
- Stored in `match.teamScorerMapping`:
  ```javascript
  {
    team1: "user_id_1",  // Primary or secondary scorer
    team2: "user_id_2"   // Primary or secondary scorer
  }
  ```

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**

**Total Word Count**: ~30,000 words
**Total Sections**: 19
**Last Updated**: March 8, 2026

This PRD represents the complete current state of the VScor application and serves as a comprehensive blueprint for engineering implementation and future development.
