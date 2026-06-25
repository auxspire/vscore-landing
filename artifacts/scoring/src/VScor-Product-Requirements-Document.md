# VScor - Product Requirements Document

**Version:** 1.0  
**Last Updated:** March 8, 2026  
**Status:** Active Development

---

## 1. Product Vision

### 1.1 What VScor Is

VScor is a mobile-first, offline-capable football match scoring and tournament management platform designed for grassroots football communities. It enables real-time digitization of match events through an intuitive two-tap scoring interface, automatic statistics generation, and comprehensive tournament management capabilities.

### 1.2 Target Users

**Primary Users:**
- **Match Scorers**: Individuals recording live match events in real-time
- **Tournament Organizers**: Coordinators managing local football tournaments
- **Team Coordinators**: Managers overseeing team profiles and rosters
- **Players**: Athletes tracking their performance statistics
- **Spectators**: Fans viewing live scores and tournament standings

**User Personas:**
1. **Rajesh** - Tournament organizer managing a 16-team local league
2. **Priya** - Player tracking her goal-scoring record across seasons
3. **Amit** - Match scorer recording detailed statistics during matches
4. **Sara** - Team coordinator managing squad assignments
5. **Vikram** - Spectator following live scores of multiple matches

### 1.3 Core Problems It Solves

1. **Manual Score Tracking**: Eliminates paper-based scorekeeping with real-time digital recording
2. **Data Loss**: Prevents loss of match statistics through offline-first architecture
3. **Tournament Management Complexity**: Simplifies fixture generation, standings calculation, and tournament administration
4. **Statistics Fragmentation**: Centralizes player, team, and tournament data in one platform
5. **Limited Transparency**: Provides public access to live scores, standings, and statistics
6. **Payment Coordination**: Streamlines match-based payment tracking and collection

### 1.4 Long-Term Vision

**Phase 1 (Current)**: Local match scoring and tournament management with offline-first architecture

**Phase 2 (6-12 months)**:
- Multi-device collaborative scoring
- Advanced analytics and insights
- Video highlight integration
- Push notifications for live events

**Phase 3 (12-24 months)**:
- Federation-level tournament ecosystems
- Cross-platform league management
- Sponsor integration and monetization
- AI-powered referee assistance

**Phase 4 (24+ months)**:
- Professional league integration
- Broadcasting capabilities
- Performance tracking wearables
- Global football community network

---

## 2. Design Philosophy

### 2.1 Guiding Principles

#### Offline-First Architecture
- **Primary Principle**: All core functionality works without internet connectivity
- **Local Storage Priority**: localStorage serves as the source of truth
- **Selective Sync**: Cloud sync happens in the background without blocking user actions
- **Graceful Degradation**: Features degrade elegantly when offline

#### Simplicity for Grassroots Football
- **Zero Training Required**: Interface intuitive enough for first-time users
- **Mobile-Optimized**: Designed for smartphones, not desktop browsers
- **Minimal Configuration**: Sensible defaults reduce setup friction
- **Progressive Disclosure**: Advanced features hidden until needed

#### Real-Time Match Digitization
- **Two-Tap Scoring**: Record any event in maximum two taps
- **Sub-Second Response**: Event recording completes in <500ms
- **Immediate Feedback**: Visual confirmation of every action
- **Error Recovery**: Easy undo/edit for incorrect entries

#### Minimal Friction for Scorers
- **Single-Hand Operation**: All controls reachable with thumb
- **Large Touch Targets**: Minimum 44px touch zones
- **High Contrast**: Clear visibility in outdoor sunlight
- **Persistent State**: Never lose progress on accidental navigation

#### Transparency and Ownership of Data
- **Clear Ownership Model**: Every entity has an identifiable owner
- **Public Visibility**: All match data viewable by anyone
- **Edit Permissions**: Only owners can modify their data
- **Data Portability**: Export functionality for all user data

#### Flexible Tournament Management
- **Multiple Formats**: Support for knockout, round-robin, group stages
- **Mid-Tournament Changes**: Allow team additions/withdrawals with fixture regeneration
- **Custom Rules**: Configurable points systems and tiebreakers
- **Fixture Control**: Publish/unpublish fixtures as needed

### 2.2 Design System

**Color Palette:**
- Primary: Purple (#7C3AED / purple-600)
- Accent: Blue (#3B82F6 / blue-500)
- Success: Green (#10B981 / green-500)
- Warning: Orange (#F59E0B / orange-500)
- Error: Red (#EF4444 / red-500)
- Neutral: Gray scale (#F9FAFB to #111827)

**Typography:**
- Font Family: System default sans-serif
- Headings: 24px (h1), 20px (h2), 16px (h3)
- Body: 14px (regular), 12px (small)
- Weight: 400 (regular), 500 (medium), 600 (semibold)

**Layout Principles:**
- Card-based design with rounded corners (8px-16px)
- Consistent spacing (4px, 8px, 12px, 16px, 24px)
- Bottom tab navigation for primary sections
- Sticky headers for context retention
- Pull-to-refresh for data updates

**Component Standards:**
- Buttons: Rounded-lg (8px), minimum height 44px
- Inputs: Border, rounded-lg, clear focus states
- Cards: White background, subtle shadow, border-gray-200
- Lists: Divided items with hover states
- Modals: Centered, backdrop blur, smooth animations

---

## 3. User Roles and Permissions

### 3.1 Role Definitions

#### App User (Viewer)
**Definition**: Any person using the VScor app, registered or guest

**Permissions:**
- ✅ View all public match scores
- ✅ View tournament standings
- ✅ View player profiles (public data)
- ✅ View team profiles (public data)
- ✅ Search for matches, teams, players
- ❌ Create or edit any content

#### Registered User
**Definition**: User who has completed email/password authentication

**Permissions:**
- ✅ All App User permissions
- ✅ Create player profile (linked to their user_id)
- ✅ Create teams (becomes Team Coordinator)
- ✅ Create tournaments (becomes Tournament Coordinator)
- ✅ Create matches (becomes Match Owner)
- ✅ Edit their own player profile
- ✅ Transfer ownership of entities they own

#### Profile Owner
**Definition**: User who created or was assigned ownership of a player profile

**Permissions:**
- ✅ Edit player profile details (name, photo, position, etc.)
- ✅ Update player statistics manually
- ✅ Delete player profile
- ✅ Transfer profile ownership to another registered user
- ❌ Edit profiles owned by others

**Ownership Rules:**
- One user can own only ONE player profile (identified by owner_user_id)
- Legacy profiles without owner_user_id are editable by anyone (migration case)
- Ownership can be transferred but not duplicated

#### Team Coordinator
**Definition**: User who created a team or was assigned coordinator role

**Permissions:**
- ✅ Edit team details (name, coach, home venue, logo)
- ✅ Add/remove players from team roster
- ✅ Assign team to tournaments
- ✅ Add co-coordinators
- ✅ Transfer team ownership
- ❌ Edit other teams

**Coordinator Assignment:**
- Multiple coordinators allowed per team
- Coordinators stored in `team.coordinators[]` array
- Primary coordinator is the creator (team.created_by)

#### Tournament Coordinator
**Definition**: User who created a tournament or was assigned coordinator role

**Permissions:**
- ✅ Edit tournament details (name, dates, format, rules)
- ✅ Add/remove participating teams
- ✅ Generate and regenerate fixtures
- ✅ Publish/unpublish fixtures
- ✅ Modify tournament stages
- ✅ Add co-coordinators
- ✅ Transfer tournament ownership
- ❌ Edit matches they don't own
- ❌ Edit other tournaments

**Coordinator Assignment:**
- Multiple coordinators allowed per tournament
- Coordinators stored in `tournament.coordinators[]` array
- Primary coordinator is the creator (tournament.created_by)

#### Match Owner
**Definition**: User who created the match (automatically set to match creator)

**Permissions:**
- ✅ Edit match details (venue, duration, teams)
- ✅ Modify match configuration
- ✅ Assign or change scorers (primary and secondary)
- ✅ Edit match settings
- ✅ Calculate and manage match payments
- ✅ Transfer match ownership to another registered user
- ✅ Delete match (before scoring starts)
- ❌ Edit matches owned by others

**Ownership Rules:**
- Match owner stored in `match.owner_user_id`
- Owner can transfer ownership only to registered users
- Preferably transfer to assigned scorers or coordinators

#### Primary Scorer
**Definition**: User assigned as the primary scorer for a match

**Permissions:**
- ✅ Record all match events (if sole scorer)
- ✅ Record assigned events (if dual-scorer mode)
- ✅ Edit/delete events they recorded
- ✅ Start/pause/end match
- ✅ View real-time statistics
- ❌ Change match configuration (only owner can)
- ❌ Assign other scorers (only owner can)

**Assignment Rules:**
- Defaults to match creator
- Can be changed by match owner before match starts
- Must be a registered user in the app

#### Secondary Scorer (Advanced Mode Only)
**Definition**: Optional second scorer assigned for parallel event recording

**Permissions:**
- ✅ Record assigned events based on responsibility division
- ✅ Edit/delete events they recorded
- ✅ View real-time statistics
- ❌ Record events outside their assigned scope
- ❌ Change match configuration
- ❌ Assign other scorers

**Assignment Rules:**
- Only available in "Advanced" scoring level
- Must be a different user from primary scorer
- Requires responsibility division configuration (by team or event type)

**Responsibility Division:**

**Option A - Divide by Teams:**
- Each scorer assigned to one team
- Records ALL events for their assigned team
- Example: Scorer 1 → Team A, Scorer 2 → Team B

**Option B - Divide by Event Types:**
- Primary Scorer: Goals, Shots on Target, Shots off Target, Fouls
- Secondary Scorer: Interceptions, Offside, Substitutions, Corners

### 3.2 Permission Matrix

| Action | App User | Registered User | Profile Owner | Team Coord | Tournament Coord | Match Owner | Primary Scorer | Secondary Scorer |
|--------|----------|----------------|---------------|------------|------------------|-------------|----------------|------------------|
| View matches | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View standings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create player profile | ❌ | ✅ | - | - | - | - | - | - |
| Edit own profile | ❌ | ❌ | ✅ | - | - | - | - | - |
| Create team | ❌ | ✅ | - | - | - | - | - | - |
| Edit team | ❌ | ❌ | - | ✅ | - | - | - | - |
| Create tournament | ❌ | ✅ | - | - | - | - | - | - |
| Edit tournament | ❌ | ❌ | - | - | ✅ | - | - | - |
| Create match | ❌ | ✅ | - | - | - | - | - | - |
| Edit match config | ❌ | ❌ | - | - | - | ✅ | - | - |
| Record events | ❌ | ❌ | - | - | - | - | ✅ | ✅ |
| Assign scorers | ❌ | ❌ | - | - | - | ✅ | - | - |
| Manage payments | ❌ | ❌ | - | - | - | ✅ | - | - |

### 3.3 Ownership Transfer Rules

**Player Profile Transfer:**
- Only current owner can initiate transfer
- Target must be a registered user
- Transfer is immediate and irreversible
- All linked data (stats, matches) remains intact

**Team Ownership Transfer:**
- Only primary coordinator can transfer
- Target must be a registered user
- Can add co-coordinators without full transfer
- Co-coordinators have equal edit permissions

**Tournament Ownership Transfer:**
- Only primary coordinator can transfer
- Target must be a registered user
- Recommended to transfer to active coordinator
- All fixtures and matches remain linked

**Match Ownership Transfer:**
- Only current owner can transfer
- Target should preferably be one of the assigned scorers
- Transfer allowed only before match completion
- Payment responsibility transfers with ownership

---

## 4. Authentication System

### 4.1 Authentication Method

**Current Implementation**: Email/Password Authentication via Supabase Auth

**Previous Implementation**: Google OAuth (migrated to email/password)

### 4.2 User Registration Flow

**Step 1: Sign Up Screen**
- Input fields: Name, Email, Password, Phone Number (optional)
- Password requirements: Minimum 6 characters
- Email validation: Must be valid email format
- Create account via Supabase Auth API

**Step 2: Account Creation**
```javascript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password123',
  user_metadata: { 
    name: 'John Doe',
    phoneNumber: '+919876543210'
  },
  email_confirm: true // Auto-confirm since email server not configured
})
```

**Step 3: User Profile Creation**
- Extract user_id from Supabase response
- Store user profile in localStorage: `vscor_current_user`
- User object structure:
```javascript
{
  user_id: "unique-user-id",
  email: "user@example.com",
  name: "John Doe",
  phoneNumber: "+919876543210",
  profile_photo: null,
  created_at: "2026-03-08T10:30:00Z"
}
```

**Step 4: Optional Player Profile**
- Prompt user to create linked player profile
- Player profile gets `owner_user_id = user.user_id`
- This links their account to on-field statistics

### 4.3 User Login Flow

**Step 1: Login Screen**
- Input fields: Email, Password
- "Forgot Password" link (future implementation)
- Sign in via Supabase Auth

**Step 2: Authentication**
```javascript
const { data: { session }, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

**Step 3: Session Management**
- Extract access_token from session
- Store in memory for API calls
- Check for existing session on app load:
```javascript
const { data: { session }, error } = await supabase.auth.getSession()
```

**Step 4: User Data Retrieval**
- Load user profile from localStorage
- Sync user data from cloud if available
- Redirect to home screen

### 4.4 User ID Generation

**Structure**: Supabase generates UUID v4 format
- Example: `a3f2c8e1-4b5d-6789-0123-456789abcdef`
- Globally unique across all users
- Used as `owner_user_id` in owned entities

### 4.5 Action Tracking

**Metadata Fields** (stored with each entity):
- `created_by`: user_id of creator
- `created_at`: ISO 8601 timestamp
- `updated_by`: user_id of last editor (future)
- `updated_at`: ISO 8601 timestamp (future)
- `owner_user_id`: primary owner identifier

**Example (Match Object):**
```javascript
{
  id: "match-123",
  team1: "Arsenal FC",
  team2: "Chelsea FC",
  owner_user_id: "a3f2c8e1-4b5d-6789-0123-456789abcdef",
  created_by: "a3f2c8e1-4b5d-6789-0123-456789abcdef",
  created_at: "2026-03-08T14:30:00Z",
  scoredBy: "a3f2c8e1-4b5d-6789-0123-456789abcdef", // Legacy field
  primaryScorer: {
    user_id: "a3f2c8e1-4b5d-6789-0123-456789abcdef",
    name: "John Doe"
  }
}
```

### 4.6 Social Login (Future Implementation)

**Supported Providers** (requires additional setup):
- Google OAuth
- Facebook Login
- GitHub OAuth
- Phone Number OTP

**Implementation Note:**
User must complete provider setup at: https://supabase.com/docs/guides/auth/social-login/auth-google

---

## 5. Data Architecture

### 5.1 Core Data Entities

#### 5.1.1 User
**Storage**: localStorage key `vscor_current_user`, Cloud KV store

**Schema:**
```javascript
{
  user_id: string,              // Unique identifier from Supabase
  email: string,                // User email
  name: string,                 // Display name
  phoneNumber: string | null,   // Optional phone
  profile_photo: string | null, // Profile image URL
  created_at: string,           // ISO timestamp
  auth_provider: string         // "email" | "google" | "facebook"
}
```

**Indexes**: user_id (primary key)

**Relationships**:
- One-to-One: Player (via owner_user_id)
- One-to-Many: Teams (as coordinator)
- One-to-Many: Tournaments (as coordinator)
- One-to-Many: Matches (as owner or scorer)

#### 5.1.2 Player
**Storage**: localStorage key `vscor_players`, Cloud KV store

**Schema:**
```javascript
{
  id: string,                   // Unique player ID (UUID or incremental)
  name: string,                 // Player name
  email: string | null,         // Contact email
  phoneNumber: string | null,   // Contact phone
  position: string | null,      // "Forward" | "Midfielder" | "Defender" | "Goalkeeper"
  jerseyNumber: string | null,  // Squad number
  imageUrl: string | null,      // Profile photo URL
  dateOfBirth: string | null,   // ISO date
  height: string | null,        // In cm
  weight: string | null,        // In kg
  preferredFoot: string | null, // "Left" | "Right" | "Both"
  owner_user_id: string | null, // Link to registered user
  created_at: string,           // ISO timestamp
  
  // Statistics (auto-calculated)
  stats: {
    matches: number,
    goals: number,
    assists: number,
    yellowCards: number,
    redCards: number,
    shotsOnTarget: number,
    shotsOffTarget: number,
    fouls: number,
    // ... other stats
  }
}
```

**Indexes**: id (primary key), owner_user_id

**Relationships**:
- Many-to-One: User (owner)
- Many-to-Many: Teams (via team.players[])
- One-to-Many: Match Events (as player involved)

#### 5.1.3 Team
**Storage**: localStorage keys `vscor_teams` (legacy), `vscor_master_teams` (master table), Cloud KV store

**Schema:**
```javascript
{
  id: string,                    // Unique team ID
  name: string,                  // Team name
  coach: string | null,          // Coach name
  homeVenue: string | null,      // Home ground
  description: string | null,    // Team bio
  imageUrl: string | null,       // Team logo URL
  founded: string | null,        // Foundation year
  
  players: Array<{               // Team roster
    id: string,                  // Player ID
    name: string,                // Player name
    position: string | null,
    jerseyNumber: string | null
  }>,
  
  coordinators: Array<{          // Team coordinators
    user_id: string,
    name: string,
    email: string
  }>,
  
  created_by: string,            // Creator user_id
  created_at: string,            // ISO timestamp
  
  // Statistics (auto-calculated)
  stats: {
    matchesPlayed: number,
    wins: number,
    draws: number,
    losses: number,
    goalsFor: number,
    goalsAgainst: number,
    goalDifference: number
  }
}
```

**Indexes**: id (primary key), name (unique)

**Relationships**:
- Many-to-Many: Players (roster)
- Many-to-One: User (creator)
- Many-to-Many: Users (coordinators)
- Many-to-Many: Tournaments (participating teams)
- One-to-Many: Matches (as team1 or team2)

#### 5.1.4 Tournament
**Storage**: localStorage key `vscor_tournaments`, Cloud KV store

**Schema:**
```javascript
{
  id: string,                    // Unique tournament ID
  name: string,                  // Tournament name
  description: string | null,    // Tournament details
  startDate: string | null,      // ISO date
  endDate: string | null,        // ISO date
  venue: string | null,          // Primary venue
  imageUrl: string | null,       // Tournament logo
  
  format: string,                // "knockout" | "round-robin" | "group-knockout"
  matchDuration: number | null,  // Minutes per match
  playersPerTeam: number | null, // Squad size
  
  participatingTeams: Array<{    // Registered teams
    id: string,
    name: string
  }>,
  
  groups: Array<{                // For group-based tournaments
    name: string,                // "Group A", "Group B"
    teams: Array<{
      id: string,
      name: string
    }>
  }> | null,
  
  pointsSystem: {                // Points allocation rules
    win: number,                 // Default: 3
    draw: number,                // Default: 1
    loss: number                 // Default: 0
  },
  
  fixturesPublished: boolean,    // Fixture visibility
  
  coordinators: Array<{          // Tournament coordinators
    user_id: string,
    name: string,
    email: string
  }>,
  
  created_by: string,            // Creator user_id
  created_at: string             // ISO timestamp
}
```

**Indexes**: id (primary key), name

**Relationships**:
- Many-to-Many: Teams (participating)
- Many-to-One: User (creator)
- Many-to-Many: Users (coordinators)
- One-to-Many: Matches (tournament matches)
- One-to-Many: Fixtures (generated fixtures)

#### 5.1.5 Match
**Storage**: localStorage key `vscor_matches`, Cloud KV store

**Schema:**
```javascript
{
  id: string,                      // Unique match ID
  
  // Teams
  team1: string,                   // Team 1 name
  team2: string,                   // Team 2 name
  
  // Match Configuration
  matchFormat: string,             // "single" | "halves"
  duration: number,                // Total minutes
  venue: string | null,            // Match location
  playersPerTeam: number,          // Squad size
  
  // Tournament Association
  tournament: string | null,       // Tournament name or "Friendly Match"
  tournamentId: string | null,     // Tournament ID
  tournamentStage: string | null,  // "group-stage" | "final" | etc.
  
  // Scoring Configuration
  scoringLevel: string,            // "basic" | "intermediate-detailed" | "intermediate-all" | "advanced"
  
  // Match Ownership & Scorers
  owner_user_id: string,           // Match creator
  primaryScorer: {
    user_id: string,
    name: string
  },
  secondaryScorer: {               // Optional (Advanced mode only)
    user_id: string,
    name: string
  } | null,
  responsibilityType: string | null, // "team" | "event" (when dual-scorer)
  teamScorerMapping: {             // When responsibilityType = "team"
    team1: string,                 // user_id
    team2: string                  // user_id
  } | null,
  eventScorerMapping: {            // When responsibilityType = "event"
    [user_id]: string[]            // Array of event types
  } | null,
  
  // Scores
  scoreA: number,                  // Team 1 score
  scoreB: number,                  // Team 2 score
  
  // Match State
  status: string,                  // "upcoming" | "live" | "completed"
  startTime: string,               // ISO timestamp of creation
  matchDate: string | null,        // ISO date (YYYY-MM-DD) - set when scoring starts
  matchTime: string | null,        // Time (HH:mm) - set when scoring starts
  endTime: string | null,          // ISO timestamp when completed
  
  // Squads
  squad1: Array<{                  // Team 1 lineup
    id: string,
    name: string,
    position: string,
    jerseyNumber: string,
    status: string                 // "starting" | "substitute" | "substituted-out"
  }>,
  squad2: Array<{                  // Team 2 lineup
    id: string,
    name: string,
    position: string,
    jerseyNumber: string,
    status: string
  }>,
  
  // Events
  events: Array<{                  // Match events
    id: string,
    type: string,                  // Event type (see Event Types section)
    team: string,                  // Team name
    player: {
      id: string,
      name: string
    },
    minute: number,                // Match minute
    timestamp: string,             // ISO timestamp
    recorded_by: string,           // user_id of scorer
    details: object                // Event-specific details
  }>,
  
  // Payment Information
  paymentPerPlayer: number | null,
  treasurer: {
    id: string,
    name: string
  } | null,
  playerPayments: Array<{          // Payment tracking
    playerId: string,
    playerName: string,
    teamName: string,
    amount: number,
    paid: boolean,
    paidAt: string | null
  }>,
  
  created_by: string,              // Creator user_id
  created_at: string,              // ISO timestamp
  scoredBy: string                 // Legacy field (same as primaryScorer.user_id)
}
```

**Indexes**: id (primary key), tournamentId, owner_user_id

**Relationships**:
- Many-to-One: Tournament
- Many-to-One: User (owner)
- Many-to-Many: Players (squads)
- One-to-Many: Events

#### 5.1.6 Match Event
**Storage**: Embedded in Match object as `events[]` array

**Schema:**
```javascript
{
  id: string,                      // Unique event ID
  type: string,                    // Event type
  team: string,                    // Team name
  player: {
    id: string,
    name: string
  },
  minute: number,                  // Match minute
  timestamp: string,               // ISO timestamp
  recorded_by: string,             // user_id of scorer
  
  // Event-specific details
  details: {
    // For Goals
    goalType?: string,             // "open-play" | "penalty" | "free-kick" | "header" | "own-goal"
    assistedBy?: {
      id: string,
      name: string
    },
    
    // For Cards
    cardType?: string,             // "yellow" | "red"
    reason?: string,
    
    // For Substitutions
    playerOut?: {
      id: string,
      name: string
    },
    playerIn?: {
      id: string,
      name: string
    },
    
    // For Fouls
    foulType?: string,             // "regular" | "dangerous"
    
    // For Shots
    shotLocation?: string,         // "inside-box" | "outside-box"
    
    // Common
    isPenalty?: boolean,           // Penalty flag
    notes?: string                 // Additional notes
  }
}
```

**Event Types** (varies by scoring level):

**Basic:**
- goal
- shot_on_target
- shot_off_target
- foul
- substitute
- corner

**Intermediate (All):**
- All Basic events +
- interception
- offside

**Advanced:**
- All Intermediate events +
- Detailed attributes for each event type

#### 5.1.7 Fixture
**Storage**: Embedded in Tournament object or separate localStorage key

**Schema:**
```javascript
{
  id: string,                      // Unique fixture ID
  tournament_id: string,           // Parent tournament
  
  round: string,                   // "Group Stage" | "Quarter Final" | "Match 1"
  matchNumber: number,             // Sequential match number
  
  team1: {
    id: string,
    name: string
  },
  team2: {
    id: string,
    name: string
  },
  
  scheduledDate: string | null,    // ISO date
  scheduledTime: string | null,    // Time string
  venue: string | null,
  
  match_id: string | null,         // Link to actual match when created
  status: string,                  // "scheduled" | "in-progress" | "completed"
  
  created_at: string
}
```

#### 5.1.8 Tournament Standings
**Storage**: Calculated dynamically from matches, optionally cached

**Schema:**
```javascript
{
  tournament_id: string,
  group: string | null,            // Group name if applicable
  
  standings: Array<{
    position: number,
    team: {
      id: string,
      name: string
    },
    played: number,
    won: number,
    drawn: number,
    lost: number,
    goalsFor: number,
    goalsAgainst: number,
    goalDifference: number,
    points: number
  }>,
  
  last_updated: string             // ISO timestamp
}
```

### 5.2 Data Relationships Diagram

```
User
 ├─ owns → Player (1:1 via owner_user_id)
 ├─ coordinates → Team (M:N via coordinators[])
 ├─ coordinates → Tournament (M:N via coordinators[])
 ├─ owns → Match (1:M via owner_user_id)
 └─ scores → Match (M:N via primaryScorer/secondaryScorer)

Player
 ├─ belongs to → Team (M:N via team.players[])
 ├─ participates in → Match (M:N via squad1/squad2)
 └─ records → Event (1:M via event.player)

Team
 ├─ has → Player (M:N roster)
 ├─ participates in → Tournament (M:N via participatingTeams[])
 └─ plays in → Match (1:M as team1/team2)

Tournament
 ├─ includes → Team (M:N participating)
 ├─ generates → Fixture (1:M)
 └─ contains → Match (1:M)

Match
 ├─ belongs to → Tournament (M:1)
 ├─ is owned by → User (M:1)
 ├─ has → Player (M:N in squads)
 └─ contains → Event (1:M)
```

---

## 6. Offline-First Data Storage and Sync

### 6.1 Storage Architecture

**Primary Storage**: Browser localStorage
- **Capacity**: ~5-10MB per origin
- **Persistence**: Permanent until manually cleared
- **Speed**: Synchronous, instant access
- **Reliability**: No network dependency

**Secondary Storage**: Supabase Cloud (KV Store)
- **Purpose**: Backup, sync, multi-device access
- **Structure**: Key-value pairs via REST API
- **Endpoints**: `/functions/v1/make-server-845a157a/*`

### 6.2 Local Storage Structure

**Storage Keys:**
```javascript
// User Data
vscor_current_user          // Logged-in user object

// Core Entities
vscor_players               // Array of all players
vscor_teams                 // Array of teams (legacy)
vscor_master_teams          // Master team table
vscor_tournaments           // Array of tournaments
vscor_matches               // Array of matches

// Relationships
vscor_team_tournament_links // Team-tournament associations

// App State
vscor_app_state             // Active match, current view, etc.
```

**Data Format**: JSON stringified objects

**Example:**
```javascript
// localStorage.getItem('vscor_matches')
[
  {
    id: "match-1",
    team1: "Arsenal",
    team2: "Chelsea",
    scoreA: 2,
    scoreB: 1,
    // ... full match object
  },
  {
    id: "match-2",
    // ...
  }
]
```

### 6.3 Cloud Sync Mechanism

#### 6.3.1 Sync Strategy

**Approach**: Selective Background Sync
- User actions always write to localStorage first
- Cloud sync happens asynchronously in background
- No blocking or waiting for network responses
- Graceful degradation if sync fails

#### 6.3.2 Sync Triggers

**Automatic Triggers:**
1. **App Launch**: Pull latest data from cloud
2. **User Login**: Sync user-specific data
3. **Match Completion**: Push match results to cloud
4. **Profile Edit**: Push updated profile immediately
5. **Periodic**: Every 5 minutes (if active)

**Manual Triggers:**
1. **Pull-to-Refresh**: User-initiated data refresh
2. **Sync Button**: Explicit sync request
3. **Share Action**: Before sharing, ensure data is synced

#### 6.3.3 Sync Flow

**Pull Sync (Cloud → Local):**
```javascript
async function pullFromCloud() {
  try {
    // Fetch all matches from cloud
    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-845a157a/matches`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );
    
    const cloudMatches = await response.json();
    
    // Merge with local data
    const localMatches = JSON.parse(localStorage.getItem('vscor_matches') || '[]');
    const mergedMatches = mergeMatchData(localMatches, cloudMatches);
    
    // Update local storage
    localStorage.setItem('vscor_matches', JSON.stringify(mergedMatches));
    
    console.log('✅ Sync complete: pulled', cloudMatches.length, 'matches');
  } catch (error) {
    console.warn('⚠️ Cloud sync failed, using local data:', error);
  }
}
```

**Push Sync (Local → Cloud):**
```javascript
async function pushToCloud(matchId) {
  try {
    const matches = JSON.parse(localStorage.getItem('vscor_matches') || '[]');
    const match = matches.find(m => m.id === matchId);
    
    if (!match) return;
    
    // Push to cloud
    await fetch(
      `${supabaseUrl}/functions/v1/make-server-845a157a/matches/${matchId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(match)
      }
    );
    
    console.log('✅ Match synced to cloud:', matchId);
  } catch (error) {
    console.warn('⚠️ Failed to push to cloud:', error);
    // Queue for retry later
    queueForRetry('match', matchId);
  }
}
```

### 6.4 Conflict Resolution

**Conflict Scenarios:**
1. Same match edited on two devices
2. Team roster updated simultaneously
3. Tournament fixture regenerated elsewhere

**Resolution Strategy: Last-Write-Wins with Merge**

**Rules:**
1. **Timestamp Comparison**: Most recent `updated_at` wins
2. **Event Log Append**: Never delete events, only append
3. **User Notification**: Alert on significant conflicts
4. **Manual Override**: Allow user to choose version

**Example Conflict Resolution:**
```javascript
function mergeMatchData(localMatch, cloudMatch) {
  // No conflict if one doesn't exist
  if (!localMatch) return cloudMatch;
  if (!cloudMatch) return localMatch;
  
  // Compare timestamps
  const localTime = new Date(localMatch.updated_at || localMatch.created_at);
  const cloudTime = new Date(cloudMatch.updated_at || cloudMatch.created_at);
  
  // Use most recent as base
  const baseMatch = cloudTime > localTime ? cloudMatch : localMatch;
  const otherMatch = cloudTime > localTime ? localMatch : cloudMatch;
  
  // Merge event arrays (append-only)
  const mergedEvents = [
    ...baseMatch.events,
    ...otherMatch.events.filter(e => 
      !baseMatch.events.some(be => be.id === e.id)
    )
  ].sort((a, b) => a.minute - b.minute);
  
  return {
    ...baseMatch,
    events: mergedEvents,
    scoreA: calculateScore(mergedEvents, baseMatch.team1),
    scoreB: calculateScore(mergedEvents, baseMatch.team2)
  };
}
```

### 6.5 Data Integrity Rules

**Validation on Write:**
1. **Required Fields**: Ensure all mandatory fields present
2. **Type Checking**: Validate data types match schema
3. **Referential Integrity**: Verify foreign keys exist
4. **Duplicate Prevention**: Check for duplicate IDs

**Example Validation:**
```javascript
function validateMatch(match) {
  const errors = [];
  
  // Required fields
  if (!match.id) errors.push('Match ID required');
  if (!match.team1) errors.push('Team 1 required');
  if (!match.team2) errors.push('Team 2 required');
  if (!match.owner_user_id) errors.push('Owner required');
  
  // Type checking
  if (typeof match.scoreA !== 'number') errors.push('scoreA must be number');
  if (typeof match.scoreB !== 'number') errors.push('scoreB must be number');
  
  // Business rules
  if (match.team1 === match.team2) errors.push('Teams must be different');
  if (match.duration < 5 || match.duration > 90) {
    errors.push('Duration must be 5-90 minutes');
  }
  
  // Scorer validation
  if (!match.primaryScorer) errors.push('Primary scorer required');
  if (match.secondaryScorer && match.scoringLevel !== 'advanced') {
    errors.push('Secondary scorer only allowed in Advanced mode');
  }
  if (match.secondaryScorer && !match.responsibilityType) {
    errors.push('Responsibility division required for dual scorers');
  }
  
  return errors;
}
```

### 6.6 Sync Status Indicators

**Visual Feedback:**
- 🟢 **Green Dot**: Data synced to cloud
- 🟡 **Yellow Dot**: Sync in progress
- 🔴 **Red Dot**: Sync failed, using local data
- ⚪ **Gray Dot**: Offline mode, no sync attempted

**Displayed Locations:**
- Match cards in Live Scores tab
- Profile headers
- Tournament detail screens

---

## 7. Core Modules of the App

### 7.1 Login & Onboarding

#### 7.1.1 Login Screen

**Layout:**
- VScor logo at top
- Email input field
- Password input field (with show/hide toggle)
- "Sign In" button
- "Don't have an account? Sign Up" link
- "Forgot Password?" link (future)

**Validation:**
- Email format validation
- Password minimum length (6 characters)
- Show error messages inline

**Success Flow:**
1. Authenticate via Supabase
2. Store session token
3. Load user profile
4. Navigate to Home Dashboard

**Error Handling:**
- Invalid credentials: "Incorrect email or password"
- Network error: "No internet connection. Using offline mode."
- Generic error: "Login failed. Please try again."

#### 7.1.2 Sign Up Screen

**Layout:**
- Name input
- Email input
- Password input (with strength indicator)
- Phone number input (optional)
- "Create Account" button
- "Already have an account? Sign In" link

**Validation:**
- All required fields filled
- Email not already registered
- Password meets requirements
- Phone number format (if provided)

**Success Flow:**
1. Create Supabase user account
2. Auto-confirm email
3. Store user profile locally
4. Prompt: "Create your player profile?"
5. If yes → Player Profile Creation
6. If no → Home Dashboard

#### 7.1.3 Onboarding Flow

**Step 1: Welcome Screen**
- App introduction
- Key features overview
- "Get Started" button

**Step 2: Create Player Profile (Optional)**
- "Link your account to a player profile to track your stats"
- Name (pre-filled from user account)
- Position dropdown
- Jersey number
- Upload photo
- "Create Profile" / "Skip for Now"

**Step 3: First-Time Tutorial (Optional)**
- Swipeable cards explaining:
  - How to score a match
  - How to create tournaments
  - How to view live scores
- "Got it!" button

### 7.2 Home Dashboard

**Navigation**: Three-tab bottom navigation
1. **Live Scores** (🏆 icon)
2. **Scoring** (➕ icon)
3. **Info** (ℹ️ icon)

**Header** (Persistent across tabs):
- VScor logo
- Notification icon (future)
- Profile photo (tappable → Profile Menu)

**Profile Menu Dropdown:**
- My Profile
- My Matches
- Settings
- Logout

### 7.3 Module: Player Profiles

#### 7.3.1 Player Profile Creation

**Access**: 
- During onboarding
- Via "Add Player" in team management
- Via "Create Profile" in profile menu

**Form Fields:**
- Name* (required)
- Email
- Phone Number
- Position dropdown: Forward, Midfielder, Defender, Goalkeeper
- Jersey Number (1-99)
- Date of Birth (date picker)
- Height (cm)
- Weight (kg)
- Preferred Foot: Left, Right, Both
- Profile Photo (upload or camera)

**Validation:**
- Name required and unique
- Jersey number numeric
- DOB not in future
- Height/Weight positive numbers

**Submit:**
```javascript
const newPlayer = {
  id: generateUniqueId(),
  name: formData.name,
  email: formData.email,
  phoneNumber: formData.phoneNumber,
  position: formData.position,
  jerseyNumber: formData.jerseyNumber,
  dateOfBirth: formData.dob,
  height: formData.height,
  weight: formData.weight,
  preferredFoot: formData.foot,
  imageUrl: uploadedImageUrl,
  owner_user_id: currentUser.user_id,
  created_at: new Date().toISOString(),
  stats: initializeStats()
};

// Save to localStorage
const players = JSON.parse(localStorage.getItem('vscor_players') || '[]');
players.push(newPlayer);
localStorage.setItem('vscor_players', JSON.stringify(players));

// Sync to cloud
await syncPlayerToCloud(newPlayer);
```

#### 7.3.2 Player Profile View

**Header:**
- Profile photo (large, circular)
- Player name
- Position badge
- Jersey number badge
- Edit button (if owner)

**Statistics Section:**
- Matches Played
- Goals
- Assists
- Yellow Cards
- Red Cards
- Shots on Target
- Shots off Target
- Clean Sheets (for goalkeepers)

**Recent Matches Section:**
- List of last 10 matches
- Each showing: Date, Teams, Score, Personal stats

**Career History Section:**
- Teams played for
- Tournaments participated in

**Actions (Owner Only):**
- Edit Profile
- Delete Profile

#### 7.3.3 Player Profile Edit

**Editable Fields:**
- All fields from creation form
- Cannot change: owner_user_id

**Validation:**
- Same as creation
- Prevent name duplication

**Save:**
- Update localStorage
- Push to cloud
- Show success toast

#### 7.3.4 Player Statistics Calculation

**Auto-calculated from match events:**
```javascript
function calculatePlayerStats(playerId) {
  const matches = JSON.parse(localStorage.getItem('vscor_matches') || '[]');
  
  const stats = {
    matches: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    shotsOnTarget: 0,
    shotsOffTarget: 0,
    fouls: 0,
    interceptions: 0,
    offsides: 0
  };
  
  matches.forEach(match => {
    // Check if player was in squad
    const inSquad = [...match.squad1, ...match.squad2].find(p => p.id === playerId);
    if (!inSquad) return;
    
    stats.matches++;
    
    // Count events
    match.events.forEach(event => {
      if (event.player.id !== playerId) return;
      
      switch(event.type) {
        case 'goal':
          stats.goals++;
          break;
        case 'yellow_card':
          stats.yellowCards++;
          break;
        case 'red_card':
          stats.redCards++;
          break;
        case 'shot_on_target':
          stats.shotsOnTarget++;
          break;
        case 'shot_off_target':
          stats.shotsOffTarget++;
          break;
        case 'foul':
          stats.fouls++;
          break;
        // ... other event types
      }
      
      // Count assists
      if (event.details?.assistedBy?.id === playerId) {
        stats.assists++;
      }
    });
  });
  
  return stats;
}
```

### 7.4 Module: Team Profiles

#### 7.4.1 Team Creation

**Access**:
- Via "Add Team" in New Match flow
- Via "Create Team" in Info tab

**Form Fields:**
- Team Name* (required)
- Coach Name
- Home Venue
- Description
- Team Logo (upload)
- Founded Year

**Validation:**
- Team name required and unique
- Founded year not in future

**Submit:**
```javascript
const newTeam = {
  id: generateUniqueId(),
  name: formData.name,
  coach: formData.coach,
  homeVenue: formData.venue,
  description: formData.description,
  imageUrl: uploadedLogoUrl,
  founded: formData.founded,
  players: [],
  coordinators: [{
    user_id: currentUser.user_id,
    name: currentUser.name,
    email: currentUser.email
  }],
  created_by: currentUser.user_id,
  created_at: new Date().toISOString(),
  stats: initializeTeamStats()
};

// Add to Master Teams Table
localStorage.setItem(`vscor_team_${newTeam.id}`, JSON.stringify(newTeam));

// Also add to legacy teams array
const teams = JSON.parse(localStorage.getItem('vscor_teams') || '[]');
teams.push(newTeam);
localStorage.setItem('vscor_teams', JSON.stringify(teams));

// Sync to cloud
await syncTeamToCloud(newTeam);
```

#### 7.4.2 Team Profile View

**Header:**
- Team logo (large)
- Team name
- Coach name
- Home venue
- Edit button (if coordinator)

**Squad Section:**
- Grid of player cards
- Each card: Photo, Name, Position, Jersey #
- "Add Player" button (if coordinator)

**Statistics Section:**
- Matches Played
- Wins / Draws / Losses
- Goals For
- Goals Against
- Goal Difference
- Win Rate

**Recent Matches Section:**
- List of last 10 matches
- Each showing: Date, Opponent, Score, Result

**Tournament History:**
- List of tournaments participated in
- Performance in each tournament

**Actions (Coordinator Only):**
- Edit Team Details
- Manage Squad
- Add Co-Coordinators
- Delete Team

#### 7.4.3 Squad Management

**Add Player to Squad:**
1. Search existing players by name
2. Or create new player
3. Assign position (dropdown)
4. Assign jersey number (input)
5. Confirm

**Remove Player from Squad:**
1. Select player from squad list
2. Confirm removal
3. Update team roster

**Reorder Squad:**
- Drag-and-drop to change order
- Save new order

#### 7.4.4 Team Statistics Calculation

**Auto-calculated from matches:**
```javascript
function calculateTeamStats(teamName) {
  const matches = JSON.parse(localStorage.getItem('vscor_matches') || '[]');
  const teamMatches = matches.filter(m => 
    m.team1 === teamName || m.team2 === teamName
  );
  
  const stats = {
    matchesPlayed: teamMatches.length,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0
  };
  
  teamMatches.forEach(match => {
    const isTeam1 = match.team1 === teamName;
    const teamScore = isTeam1 ? match.scoreA : match.scoreB;
    const opponentScore = isTeam1 ? match.scoreB : match.scoreA;
    
    stats.goalsFor += teamScore;
    stats.goalsAgainst += opponentScore;
    
    if (teamScore > opponentScore) stats.wins++;
    else if (teamScore < opponentScore) stats.losses++;
    else stats.draws++;
  });
  
  stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
  
  return stats;
}
```

### 7.5 Module: Tournament Management

#### 7.5.1 Tournament Creation

**Access**: Via "Create Tournament" in Info tab

**Step 1: Basic Details**
- Tournament Name* (required)
- Description
- Start Date (date picker)
- End Date (date picker)
- Primary Venue
- Tournament Logo (upload)

**Step 2: Format Selection**
- Radio buttons:
  - ⚽ Knockout
  - 🔄 Round Robin
  - 🏆 Group Stage + Knockout

**Step 3: Match Configuration**
- Match Duration (minutes): 5-90
- Players per Team: 1-11
- Points System:
  - Win: (default 3)
  - Draw: (default 1)
  - Loss: (default 0)

**Step 4: Teams** (handled later via team management)

**Submit:**
```javascript
const newTournament = {
  id: generateUniqueId(),
  name: formData.name,
  description: formData.description,
  startDate: formData.startDate,
  endDate: formData.endDate,
  venue: formData.venue,
  imageUrl: uploadedLogoUrl,
  format: formData.format,
  matchDuration: formData.duration,
  playersPerTeam: formData.playersPerTeam,
  pointsSystem: {
    win: formData.winPoints || 3,
    draw: formData.drawPoints || 1,
    loss: formData.lossPoints || 0
  },
  participatingTeams: [],
  groups: null,
  fixturesPublished: false,
  coordinators: [{
    user_id: currentUser.user_id,
    name: currentUser.name,
    email: currentUser.email
  }],
  created_by: currentUser.user_id,
  created_at: new Date().toISOString()
};

// Save to localStorage
const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
tournaments.push(newTournament);
localStorage.setItem('vscor_tournaments', JSON.stringify(tournaments));

// Sync to cloud
await syncTournamentToCloud(newTournament);
```

#### 7.5.2 Tournament Profile View

**Header:**
- Tournament logo
- Tournament name
- Date range
- Venue
- Format badge
- Edit button (if coordinator)

**Tabs:**
1. **Overview**
   - Description
   - Key information
   - Participating teams count
   - Matches count

2. **Teams**
   - Grid of participating team cards
   - "Add Team" button (if coordinator)

3. **Fixtures**
   - Grouped by round/stage
   - Each fixture: Teams, Date/Time, Status
   - "Generate Fixtures" button (if coordinator && not published)

4. **Standings**
   - Points table
   - Position, Team, P, W, D, L, GF, GA, GD, Pts
   - Group tabs (if group format)

5. **Matches**
   - List of completed matches
   - Results and statistics

**Actions (Coordinator Only):**
- Edit Tournament Details
- Manage Teams
- Generate Fixtures
- Publish/Unpublish Fixtures
- Add Co-Coordinators
- Delete Tournament

#### 7.5.3 Team Management in Tournament

**Add Team:**
1. Click "Add Team" in Teams tab
2. Search existing teams OR
3. Create new team
4. Confirm addition

**Remove Team:**
- Only allowed before fixtures are published
- Click "X" on team card
- Confirm removal

**Assign to Groups** (for group format):
1. Select "Manage Groups"
2. Create groups (A, B, C, etc.)
3. Drag teams into groups
4. Ensure balanced distribution
5. Save

#### 7.5.4 Fixture Generation

**Knockout Format:**
```javascript
function generateKnockoutFixtures(teams) {
  const fixtures = [];
  const rounds = Math.ceil(Math.log2(teams.length));
  
  // First round pairings
  const shuffled = shuffleArray([...teams]);
  for (let i = 0; i < shuffled.length; i += 2) {
    if (shuffled[i + 1]) {
      fixtures.push({
        id: generateUniqueId(),
        round: 'Round of ' + shuffled.length,
        matchNumber: (i / 2) + 1,
        team1: shuffled[i],
        team2: shuffled[i + 1],
        status: 'scheduled'
      });
    }
  }
  
  // Placeholder fixtures for subsequent rounds
  // (teams determined by match results)
  
  return fixtures;
}
```

**Round Robin Format:**
```javascript
function generateRoundRobinFixtures(teams) {
  const fixtures = [];
  const n = teams.length;
  
  // Each team plays every other team once
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      fixtures.push({
        id: generateUniqueId(),
        round: 'Round Robin',
        matchNumber: fixtures.length + 1,
        team1: teams[i],
        team2: teams[j],
        status: 'scheduled'
      });
    }
  }
  
  return fixtures;
}
```

**Group Stage + Knockout:**
- Generate round-robin fixtures within each group
- Generate knockout bracket for group winners/runners-up

**Save Fixtures:**
```javascript
// Store fixtures with tournament
tournament.fixtures = generatedFixtures;
tournament.fixturesGenerated = true;

// Update localStorage
updateTournament(tournament);

// Optionally publish immediately or later
```

#### 7.5.5 Fixture Publishing

**Draft State** (fixturesPublished = false):
- Fixtures visible only to coordinators
- Can regenerate or edit
- Teams can be added/removed

**Published State** (fixturesPublished = true):
- Fixtures visible to all users
- Cannot regenerate without unpublishing first
- Team changes require fixture regeneration

**Publish Action:**
```javascript
function publishFixtures(tournamentId) {
  const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
  const tournament = tournaments.find(t => t.id === tournamentId);
  
  if (!tournament.fixtures || tournament.fixtures.length === 0) {
    alert('No fixtures to publish. Generate fixtures first.');
    return;
  }
  
  tournament.fixturesPublished = true;
  updateTournament(tournament);
  
  showToast('Fixtures published successfully!');
}
```

#### 7.5.6 Tournament Standings Calculation

**Algorithm:**
```javascript
function calculateStandings(tournamentId) {
  const tournament = getTournamentById(tournamentId);
  const matches = getMatchesByTournament(tournamentId);
  const teams = tournament.participatingTeams;
  
  const standings = teams.map(team => ({
    team: team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }));
  
  // Process completed matches
  matches.filter(m => m.status === 'completed').forEach(match => {
    const team1Standing = standings.find(s => s.team.name === match.team1);
    const team2Standing = standings.find(s => s.team.name === match.team2);
    
    if (!team1Standing || !team2Standing) return;
    
    // Update played
    team1Standing.played++;
    team2Standing.played++;
    
    // Update goals
    team1Standing.goalsFor += match.scoreA;
    team1Standing.goalsAgainst += match.scoreB;
    team2Standing.goalsFor += match.scoreB;
    team2Standing.goalsAgainst += match.scoreA;
    
    // Determine result
    if (match.scoreA > match.scoreB) {
      team1Standing.won++;
      team2Standing.lost++;
      team1Standing.points += tournament.pointsSystem.win;
      team2Standing.points += tournament.pointsSystem.loss;
    } else if (match.scoreA < match.scoreB) {
      team1Standing.lost++;
      team2Standing.won++;
      team1Standing.points += tournament.pointsSystem.loss;
      team2Standing.points += tournament.pointsSystem.win;
    } else {
      team1Standing.drawn++;
      team2Standing.drawn++;
      team1Standing.points += tournament.pointsSystem.draw;
      team2Standing.points += tournament.pointsSystem.draw;
    }
    
    // Calculate goal difference
    team1Standing.goalDifference = team1Standing.goalsFor - team1Standing.goalsAgainst;
    team2Standing.goalDifference = team2Standing.goalsFor - team2Standing.goalsAgainst;
  });
  
  // Sort standings
  standings.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name);
  });
  
  // Assign positions
  standings.forEach((s, index) => {
    s.position = index + 1;
  });
  
  return standings;
}
```

### 7.6 Module: Match Creation

#### 7.6.1 New Match Flow

**Access**: Via "+" button in Scoring tab

**Step 1: Tournament Selection**
- Dropdown: List of tournaments + "Friendly Match"
- If tournament selected:
  - Auto-fill: Match duration, Players per team
  - Show: Tournament stage dropdown
  - Show: Participating teams only

**Step 2: Team Selection**
- Team 1: Searchable dropdown
- Team 2: Searchable dropdown
- Validation: Teams cannot be the same
- "Add Team" option (if friendly match)

**Step 3: Match Configuration**
- Match Format: Single / Two Halves
- Duration: 5-90 minutes (pre-filled if tournament)
- Venue: Text input with search
- Players per Team: 1-11 (pre-filled if tournament)

**Step 4: Scoring Level**
- Radio buttons:
  - ⚽ Basic - Simple events only
  - 📊 Intermediate (Detailed) - Basic events + detailed attributes
  - 📊 Intermediate (All) - All events without attributes
  - 🎯 Advanced - All events + detailed attributes

**Step 5: Scorer Assignment** (NEW)
- **Primary Scorer**:
  - User autocomplete search
  - Defaults to current user
  - Shows registered users with email/phone
  - Required field
  
- **Second Scorer** (Advanced mode only):
  - Optional field
  - User autocomplete search (excludes primary scorer)
  - Only appears when scoring level = Advanced
  
- **Responsibility Division** (when two scorers):
  - Required selection:
    - **Option A - Divide by Teams**:
      - Assign Team 1 to Scorer (dropdown)
      - Assign Team 2 to Scorer (dropdown)
    - **Option B - Divide by Event Types**:
      - Primary: Goals, Shots, Fouls
      - Secondary: Interceptions, Offsides, Substitutions, Corners

**Validation:**
- All required fields filled
- Teams are different
- Duration 5-90 minutes
- Primary scorer assigned
- If dual-scorer: Responsibility division selected
- If team-based division: Both teams assigned

**Submit:**
```javascript
const newMatch = {
  id: generateUniqueId(),
  team1: formData.team1,
  team2: formData.team2,
  matchFormat: formData.format,
  duration: parseInt(formData.duration),
  venue: formData.venue,
  playersPerTeam: parseInt(formData.playersPerTeam),
  tournament: tournament?.name || 'Friendly Match',
  tournamentId: tournament?.id || null,
  tournamentStage: formData.tournamentStage || null,
  scoringLevel: formData.scoringLevel,
  
  // Ownership & Scorers
  owner_user_id: currentUser.user_id,
  primaryScorer: formData.primaryScorer,
  secondaryScorer: formData.secondaryScorer || null,
  responsibilityType: formData.responsibilityType || null,
  teamScorerMapping: formData.teamScorerMapping || null,
  eventScorerMapping: formData.eventScorerMapping || null,
  
  // Initial state
  scoreA: 0,
  scoreB: 0,
  status: 'upcoming',
  startTime: new Date().toISOString(),
  matchDate: null,  // Set when scoring starts
  matchTime: null,  // Set when scoring starts
  endTime: null,
  squad1: [],
  squad2: [],
  events: [],
  paymentPerPlayer: null,
  treasurer: null,
  playerPayments: [],
  
  created_by: currentUser.user_id,
  created_at: new Date().toISOString(),
  scoredBy: formData.primaryScorer.user_id  // Legacy compatibility
};

// Save to localStorage
const matches = JSON.parse(localStorage.getItem('vscor_matches') || '[]');
matches.push(newMatch);
localStorage.setItem('vscor_matches', JSON.stringify(matches));

// Navigate to Squad Selection
navigateToSquadSelection(newMatch);
```

#### 7.6.2 Squad Selection

**Purpose**: Select playing XI and substitutes for both teams

**Team 1 Squad Selection:**
- Search bar: Filter players by name
- Player list: All players from Team 1
- Each player row:
  - Photo, Name, Position, Jersey #
  - Checkbox to select
  - "Starting" / "Substitute" toggle
- Selected count: "5 / 11 selected"

**Team 2 Squad Selection:**
- Same as Team 1

**Validation:**
- Minimum 1 player per team
- Maximum = playersPerTeam value
- At least 1 starting player per team

**Actions:**
- "Start Match" button (when valid)
- "Back" to edit match details

**Submit:**
```javascript
match.squad1 = selectedTeam1Players.map(p => ({
  ...p,
  status: p.isStarting ? 'starting' : 'substitute'
}));

match.squad2 = selectedTeam2Players.map(p => ({
  ...p,
  status: p.isStarting ? 'starting' : 'substitute'
}));

// Set match date and time when starting
match.matchDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
match.matchTime = new Date().toTimeString().slice(0, 5);  // HH:mm

match.status = 'live';

updateMatch(match);

// Navigate to Live Scoring
navigateToLiveScoring(match);
```

### 7.7 Module: Match Scoring System

#### 7.7.1 Live Scoring Interface

**Layout:**
- **Top Bar**: Score display
  - Team 1 name | Score A - Score B | Team 2 name
  - Match timer (minutes elapsed)
- **Team Toggle**: Switch between Team 1 and Team 2
- **Event Buttons Grid**: Quick-tap event recording
- **Bottom Controls**: Pause, End Match, More Options

**Event Buttons** (varies by scoring level):

**Basic Level:**
- ⚽ Goal
- 🎯 Shot on Target
- ❌ Shot off Target
- 🟨 Foul
- 🔄 Substitute
- ⛳ Corner

**Intermediate (Detailed):**
- All Basic events +
- Detailed attributes for each event

**Intermediate (All):**
- All Basic events +
- 🛡️ Interception
- 🚩 Offside

**Advanced:**
- All events +
- Detailed attributes for all

**Event Recording Flow:**

**Single-Scorer Mode:**
1. Tap team toggle (if needed)
2. Tap event button
3. If event requires details → Detail modal
4. Select player from dropdown
5. Add optional details (assist, card type, etc.)
6. Tap "Record" → Event saved

**Dual-Scorer Mode (Team-Based Division):**
1. Scorer can only record events for their assigned team
2. Team toggle disabled for non-assigned team
3. Same flow as single-scorer for their team

**Dual-Scorer Mode (Event-Based Division):**
1. Scorer can only see their assigned event buttons
2. Event buttons for other scorer are grayed out
3. Same flow for their assigned events

**Event Recording Implementation:**
```javascript
function recordEvent(eventType, team, playerId, details = {}) {
  const match = getCurrentMatch();
  
  // Check scorer permissions
  if (!canRecordEvent(currentUser.user_id, match, eventType, team)) {
    showError('You are not authorized to record this event');
    return;
  }
  
  const newEvent = {
    id: generateUniqueId(),
    type: eventType,
    team: team,
    player: getPlayerById(playerId),
    minute: getCurrentMatchMinute(),
    timestamp: new Date().toISOString(),
    recorded_by: currentUser.user_id,
    details: details
  };
  
  // Add event to match
  match.events.push(newEvent);
  
  // Update score if goal
  if (eventType === 'goal') {
    if (team === match.team1) match.scoreA++;
    else match.scoreB++;
  }
  
  // Save match
  updateMatch(match);
  
  // Sync to cloud in background
  syncMatchToCloud(match.id);
  
  // Show confirmation
  showEventConfirmation(newEvent);
}

function canRecordEvent(userId, match, eventType, team) {
  // Primary scorer can always record (if no responsibility division)
  if (userId === match.primaryScorer.user_id && !match.responsibilityType) {
    return true;
  }
  
  // Team-based division
  if (match.responsibilityType === 'team') {
    if (team === match.team1 && match.teamScorerMapping.team1 === userId) return true;
    if (team === match.team2 && match.teamScorerMapping.team2 === userId) return true;
    return false;
  }
  
  // Event-based division
  if (match.responsibilityType === 'event') {
    const allowedEvents = match.eventScorerMapping[userId] || [];
    return allowedEvents.includes(eventType);
  }
  
  return false;
}
```

#### 7.7.2 Event Detail Modals

**Goal Modal:**
- Player: Dropdown (required)
- Goal Type: Open Play / Penalty / Free Kick / Header / Own Goal
- Assisted By: Player dropdown (optional)
- Notes: Text area

**Foul Modal:**
- Player: Dropdown (required)
- Card: None / Yellow / Red
- Foul Type: Regular / Dangerous
- Notes: Text area

**Substitution Modal:**
- Player Out: Dropdown (required, only starting/on-field players)
- Player In: Dropdown (required, only substitutes)
- Notes: Text area

**Update Squad Status:**
```javascript
function handleSubstitution(playerOutId, playerInId, team) {
  const match = getCurrentMatch();
  const squad = team === match.team1 ? match.squad1 : match.squad2;
  
  // Update player statuses
  const playerOut = squad.find(p => p.id === playerOutId);
  const playerIn = squad.find(p => p.id === playerInId);
  
  if (playerOut) playerOut.status = 'substituted-out';
  if (playerIn) playerIn.status = 'starting';
  
  updateMatch(match);
}
```

#### 7.7.3 Match Timer

**Implementation:**
```javascript
let matchStartTime = null;
let isPaused = false;
let pausedDuration = 0;

function startMatchTimer() {
  matchStartTime = Date.now();
  
  setInterval(() => {
    if (!isPaused) {
      const elapsed = Math.floor((Date.now() - matchStartTime - pausedDuration) / 1000 / 60);
      updateTimerDisplay(elapsed);
    }
  }, 1000);
}

function pauseMatch() {
  isPaused = true;
  pausedDuration += Date.now() - matchStartTime;
}

function resumeMatch() {
  isPaused = false;
  matchStartTime = Date.now();
}

function getCurrentMatchMinute() {
  if (isPaused) return Math.floor(pausedDuration / 1000 / 60);
  return Math.floor((Date.now() - matchStartTime - pausedDuration) / 1000 / 60);
}
```

#### 7.7.4 End Match

**End Match Flow:**
1. Tap "End Match" button
2. Confirmation modal: "Are you sure you want to end the match?"
3. If confirmed:
   - Set match.status = 'completed'
   - Set match.endTime = current timestamp
   - Sync to cloud
   - Navigate to Match Summary

**Match Summary Screen:**
- Final score (large)
- Match statistics
- Event timeline
- Player statistics
- "Share Match" button
- "View Full Details" button

### 7.8 Module: Info Tab (Public Viewing)

#### 7.8.1 Info Tab Overview

**Purpose**: Public-facing view of all matches, tournaments, teams, and players

**Layout:**
- Search bar at top
- Category tabs:
  - 🏆 Tournaments
  - ⚽ Matches
  - 👥 Teams
  - 👤 Players

#### 7.8.2 Tournaments View

**Display:**
- Grid of tournament cards
- Each card:
  - Tournament logo
  - Tournament name
  - Date range
  - Teams count
  - Matches count
- Tap to open Tournament Profile

**Filtering:**
- All / Ongoing / Upcoming / Completed
- Search by name

#### 7.8.3 Matches View

**Display:**
- List of match cards
- Each card:
  - Team 1 vs Team 2
  - Score (if completed)
  - Date/Time
  - Tournament badge
  - Status badge (Live / Upcoming / Completed)
- Tap to open Match Details

**Filtering:**
- All / Live / Upcoming / Completed
- Filter by tournament
- Search by team name

#### 7.8.4 Teams View

**Display:**
- Grid of team cards
- Each card:
  - Team logo
  - Team name
  - Matches played
  - Win rate
- Tap to open Team Profile

**Filtering:**
- Search by team name
- Sort by: Name / Win Rate / Matches Played

#### 7.8.5 Players View

**Display:**
- List of player cards
- Each card:
  - Player photo
  - Player name
  - Position
  - Stats summary (Goals, Assists, etc.)
- Tap to open Player Profile

**Filtering:**
- Search by name
- Filter by position
- Sort by: Name / Goals / Matches Played

#### 7.8.6 Leaderboards

**Top Scorers:**
- Rank, Player Name, Goals
- Filterable by tournament

**Top Assisters:**
- Rank, Player Name, Assists

**Most Matches:**
- Rank, Player Name, Matches

**Clean Sheets** (Goalkeepers):
- Rank, Player Name, Clean Sheets

---

## 8. Match Payment System

### 8.1 Payment Configuration

**Access**: Match owner only, via Match Options → "Calculate Payment"

**Configuration Screen:**
- Payment per Player: Numeric input (e.g., ₹100, $10)
- Select Treasurer: User autocomplete (defaults to match creator)
- "Calculate" button

**Calculation:**
```javascript
function calculateMatchPayments(match, paymentPerPlayer, treasurerId) {
  const allPlayers = [...match.squad1, ...match.squad2];
  
  const playerPayments = allPlayers.map(player => ({
    playerId: player.id,
    playerName: player.name,
    teamName: match.squad1.includes(player) ? match.team1 : match.team2,
    amount: paymentPerPlayer,
    paid: false,
    paidAt: null
  }));
  
  match.paymentPerPlayer = paymentPerPlayer;
  match.treasurer = {
    id: treasurerId,
    name: getTreasurerName(treasurerId)
  };
  match.playerPayments = playerPayments;
  
  updateMatch(match);
  
  return playerPayments;
}
```

### 8.2 Calculate Payment Screen

**Layout:**
- Header: Match info, Total amount, Treasurer
- Compact player list:
  - Player name | Team | Amount | Status icon | Quick actions
- Status icons:
  - ✅ Paid (green)
  - ⏳ Pending (gray)
- Quick actions:
  - 💰 Mark Paid (icon button)
  - ↩️ Mark Unpaid (icon button)

**Auto-save**: Changes save immediately to localStorage and sync to cloud

**Implementation:**
```javascript
function markAsPaid(matchId, playerId) {
  const match = getMatchById(matchId);
  const payment = match.playerPayments.find(p => p.playerId === playerId);
  
  if (payment) {
    payment.paid = true;
    payment.paidAt = new Date().toISOString();
    
    updateMatch(match);
    syncMatchToCloud(matchId);
    
    // Update parent screen counts
    updatePaymentCounts(match);
  }
}
```

### 8.3 Match Payments Overview

**Access**: Match details → "Payments" tab

**Display:**
- Total Amount: ₹1000
- Received: ₹600 (60%)
- Pending: ₹400 (40%)
- Progress bar
- Tab navigation: All / Paid / Pending
- Detailed player list with payment status

**Actions (Owner Only):**
- "Calculate Payment" (if not configured)
- "Edit Payment Settings"
- Individual "Mark Paid" / "Mark Unpaid" toggles

---

## 9. Ownership Model

### 9.1 Ownership Principles

1. **Creator Ownership**: Entity creator automatically becomes owner
2. **Explicit Transfer**: Ownership can only be transferred explicitly
3. **Verifiable Ownership**: owner_user_id field on every owned entity
4. **Edit Restrictions**: Only owners can edit their entities
5. **Public Visibility**: All entities are publicly viewable

### 9.2 Player Profile Ownership

**Ownership Rule**: One user → One player profile

**Creation:**
- User creates player profile → owner_user_id = user.user_id
- Legacy profiles (no owner_user_id) → Editable by anyone (migration)

**Permissions:**
- Owner can: Edit, Delete, Transfer ownership
- Others can: View only

**Transfer:**
- Owner initiates transfer
- Target must be registered user
- Target cannot already own a player profile
- Transfer is immediate and irreversible

**Implementation:**
```javascript
function transferPlayerOwnership(playerId, newOwnerId) {
  const player = getPlayerById(playerId);
  const currentUser = getCurrentUser();
  
  // Verify current ownership
  if (player.owner_user_id !== currentUser.user_id) {
    throw new Error('Only the owner can transfer ownership');
  }
  
  // Check if new owner already has a profile
  const players = getAllPlayers();
  const existingProfile = players.find(p => p.owner_user_id === newOwnerId);
  if (existingProfile) {
    throw new Error('Target user already owns a player profile');
  }
  
  // Transfer ownership
  player.owner_user_id = newOwnerId;
  player.updated_at = new Date().toISOString();
  
  updatePlayer(player);
  syncPlayerToCloud(player.id);
  
  return player;
}
```

### 9.3 Team Ownership

**Ownership Rule**: Multiple coordinators allowed

**Creation:**
- User creates team → Added to coordinators[] array
- created_by field stores original creator

**Coordinators:**
- Stored in team.coordinators[] array
- Each coordinator: { user_id, name, email }
- All coordinators have equal edit permissions

**Permissions:**
- Any coordinator can: Edit team, Manage squad, Add co-coordinators
- Only primary coordinator (created_by) can: Transfer ownership, Delete team
- Others can: View only

**Add Coordinator:**
```javascript
function addTeamCoordinator(teamId, userId) {
  const team = getTeamById(teamId);
  const currentUser = getCurrentUser();
  
  // Verify current user is a coordinator
  if (!team.coordinators.some(c => c.user_id === currentUser.user_id)) {
    throw new Error('Only coordinators can add co-coordinators');
  }
  
  // Check if already a coordinator
  if (team.coordinators.some(c => c.user_id === userId)) {
    throw new Error('User is already a coordinator');
  }
  
  const newCoordinator = getUserById(userId);
  team.coordinators.push({
    user_id: newCoordinator.user_id,
    name: newCoordinator.name,
    email: newCoordinator.email
  });
  
  updateTeam(team);
  syncTeamToCloud(team.id);
}
```

### 9.4 Tournament Ownership

**Ownership Rule**: Multiple coordinators allowed

**Creation:**
- User creates tournament → Added to coordinators[] array
- created_by field stores original creator

**Coordinators:**
- Same structure as Team coordinators
- All coordinators have equal permissions

**Permissions:**
- Any coordinator can: Edit tournament, Manage teams, Generate fixtures, Publish fixtures
- Only primary coordinator can: Transfer ownership, Delete tournament
- Others can: View only

### 9.5 Match Ownership

**Ownership Rule**: Single owner (transferable)

**Creation:**
- User creates match → owner_user_id = user.user_id
- Match creator is automatically primary scorer (default)

**Permissions:**
- Owner can:
  - Edit match details (venue, duration, etc.)
  - Assign/change scorers
  - Calculate payments
  - Transfer ownership
  - Delete match (before completion)
- Assigned scorers can:
  - Record events (within their scope)
  - View match details
- Others can:
  - View match details only

**Transfer Ownership:**
```javascript
function transferMatchOwnership(matchId, newOwnerId) {
  const match = getMatchById(matchId);
  const currentUser = getCurrentUser();
  
  // Verify current ownership
  if (match.owner_user_id !== currentUser.user_id) {
    throw new Error('Only the owner can transfer ownership');
  }
  
  // Preferably transfer to assigned scorer
  const isScorer = 
    match.primaryScorer.user_id === newOwnerId ||
    (match.secondaryScorer && match.secondaryScorer.user_id === newOwnerId);
  
  if (!isScorer) {
    const confirmed = confirm(
      'It is recommended to transfer ownership to one of the assigned scorers. Continue anyway?'
    );
    if (!confirmed) return;
  }
  
  // Transfer ownership
  match.owner_user_id = newOwnerId;
  match.updated_at = new Date().toISOString();
  
  updateMatch(match);
  syncMatchToCloud(match.id);
  
  showToast('Match ownership transferred successfully');
}
```

---

## 10. UI Architecture

### 10.1 Screen Hierarchy

```
App Root
├── Auth
│   ├── Login Screen
│   ├── Sign Up Screen
│   └── Onboarding Flow
│
├── Main App (after auth)
│   ├── Header (persistent)
│   │   ├── VScor Logo
│   │   ├── Notifications
│   │   └── Profile Menu
│   │
│   ├── Tab Navigation (bottom)
│   │   ├── Live Scores Tab
│   │   ├── Scoring Tab
│   │   └── Info Tab
│   │
│   └── Modals/Overlays
│       ├── New Match Flow
│       ├── Squad Selection
│       ├── Event Recording
│       └── Profile Editors
│
├── Live Scores Tab
│   ├── Match List View
│   ├── Match Detail Screen
│   │   ├── Overview
│   │   ├── Events Timeline
│   │   ├── Statistics
│   │   ├── Squads
│   │   └── Payments (if owner)
│   └── Filter/Search
│
├── Scoring Tab
│   ├── Active Match View (if match in progress)
│   │   └── Live Scoring Interface
│   ├── My Matches List
│   ├── New Match Button
│   └── Match History
│
├── Info Tab
│   ├── Search Bar
│   ├── Category Tabs
│   │   ├── Tournaments
│   │   ├── Matches
│   │   ├── Teams
│   │   └── Players
│   ├── Tournament Profile
│   │   ├── Overview
│   │   ├── Teams
│   │   ├── Fixtures
│   │   ├── Standings
│   │   └── Matches
│   ├── Team Profile
│   │   ├── Overview
│   │   ├── Squad
│   │   ├── Statistics
│   │   └── Match History
│   └── Player Profile
│       ├── Overview
│       ├── Statistics
│       ├── Career History
│       └── Recent Matches
│
└── Settings & Profile
    ├── My Profile
    ├── My Matches
    ├── Account Settings
    └── Logout
```

### 10.2 Component Library

**Core Components:**
1. `Button`: Primary, secondary, outline variants
2. `Input`: Text, number, search, date inputs
3. `Select`: Dropdown selects with search
4. `Card`: Container with shadow and border
5. `Modal`: Centered overlay with backdrop
6. `Tabs`: Horizontal tab navigation
7. `Badge`: Small status indicators
8. `Avatar`: Circular user/team photos
9. `List`: Scrollable item lists
10. `Toast`: Temporary notifications

**Custom Components:**
1. `MatchCard`: Match summary display
2. `PlayerCard`: Player info card
3. `TeamCard`: Team info card
4. `TournamentCard`: Tournament summary
5. `EventButton`: Quick-tap event recording
6. `StandingsTable`: Tournament standings
7. `EventTimeline`: Match event list
8. `StatisticsGrid`: Stat display grid
9. `UserAutocompleteInput`: User search and select
10. `TeamAutocomplete`: Team search and select

### 10.3 Responsive Design

**Breakpoints:**
- Mobile: < 640px (primary target)
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile-First Approach:**
- Design for mobile first
- Progressive enhancement for larger screens
- Touch-optimized controls (min 44px)
- Single-column layouts on mobile
- Bottom navigation for primary actions

**Tablet Adaptations:**
- Two-column layouts where appropriate
- Larger modal widths
- Side navigation option

**Desktop Adaptations:**
- Max-width container (1280px)
- Three-column layouts
- Hover states on interactive elements
- Keyboard shortcuts

### 10.4 Animation & Transitions

**Principles:**
- Smooth, natural animations
- 200-300ms duration for most transitions
- Ease-in-out timing functions
- Animate opacity, transform (not width/height)

**Key Animations:**
- Tab switching: Slide transition
- Modal appearance: Fade + scale
- Button press: Scale down
- List items: Stagger fade-in
- Score update: Bounce effect
- Event confirmation: Success pulse

---

## 11. Edge Case Handling

### 11.1 Team Withdrawal from Tournament

**Scenario**: Team withdraws mid-tournament

**Handling:**
1. Mark team as withdrawn (status field)
2. Show confirmation: "This will affect fixtures and standings. Continue?"
3. If fixtures published:
   - Option 1: Mark affected fixtures as "Walkover"
   - Option 2: Unpublish fixtures and regenerate
4. Update standings:
   - Remove team from table
   - Award walkovers to opponents (3-0 wins)
5. Notify coordinators of affected matches

**Implementation:**
```javascript
function withdrawTeam(tournamentId, teamId) {
  const tournament = getTournamentById(tournamentId);
  
  // Mark team as withdrawn
  const team = tournament.participatingTeams.find(t => t.id === teamId);
  team.status = 'withdrawn';
  
  // Find affected fixtures
  const affectedFixtures = tournament.fixtures.filter(f =>
    f.team1.id === teamId || f.team2.id === teamId
  );
  
  if (tournament.fixturesPublished) {
    // Award walkovers
    affectedFixtures.forEach(fixture => {
      if (fixture.status === 'scheduled') {
        fixture.status = 'walkover';
        fixture.winner = fixture.team1.id === teamId ? fixture.team2 : fixture.team1;
      }
    });
  } else {
    // Remove team and regenerate fixtures
    tournament.participatingTeams = tournament.participatingTeams.filter(t => t.id !== teamId);
    tournament.fixtures = generateFixtures(tournament);
  }
  
  updateTournament(tournament);
  showToast('Team withdrawn successfully');
}
```

### 11.2 Team Addition Mid-Tournament

**Scenario**: New team joins after fixtures generated

**Handling:**
1. Add team to participatingTeams[]
2. If fixtures not published:
   - Regenerate fixtures automatically
3. If fixtures published:
   - Show warning: "Fixtures are already published. Adding team requires regeneration."
   - Options:
     - Cancel addition
     - Unpublish fixtures → Add team → Regenerate → Republish
4. Update groups if applicable

### 11.3 Duplicate Team IDs

**Prevention:**
- Use UUID v4 for all team IDs
- Check for duplicates before saving
- Validate during import/sync

**Detection:**
```javascript
function ensureUniqueTeamId(teamId) {
  const teams = getAllTeams();
  const exists = teams.some(t => t.id === teamId);
  
  if (exists) {
    // Generate new ID
    return generateUniqueId();
  }
  
  return teamId;
}
```

### 11.4 Fixture Regeneration

**Triggers:**
- Team added/removed
- Tournament format changed
- Group structure modified

**Process:**
1. Check if fixtures published
2. If published: Require unpublish first
3. Confirm regeneration: "This will delete existing fixtures. Continue?"
4. Generate new fixtures
5. Optionally republish

**Preserve Completed Matches:**
```javascript
function regenerateFixtures(tournamentId) {
  const tournament = getTournamentById(tournamentId);
  
  // Preserve completed match results
  const completedMatches = tournament.fixtures
    .filter(f => f.status === 'completed')
    .map(f => f.match_id);
  
  // Generate new fixtures
  const newFixtures = generateFixtures(tournament);
  
  // Link completed matches back
  newFixtures.forEach(fixture => {
    const existingMatch = completedMatches.find(m =>
      (m.team1 === fixture.team1.name && m.team2 === fixture.team2.name) ||
      (m.team1 === fixture.team2.name && m.team2 === fixture.team1.name)
    );
    if (existingMatch) {
      fixture.match_id = existingMatch;
      fixture.status = 'completed';
    }
  });
  
  tournament.fixtures = newFixtures;
  updateTournament(tournament);
}
```

### 11.5 Data Sync Conflicts

**Scenario**: Same match edited on two devices

**Detection:**
- Compare `updated_at` timestamps
- Check for divergent event counts

**Resolution:**
1. If local is newer → Keep local, push to cloud
2. If cloud is newer → Show merge dialog
3. If events differ → Merge event arrays (append-only)
4. If scores differ → Recalculate from merged events

**User Notification:**
```javascript
if (hasConflict(localMatch, cloudMatch)) {
  showConflictDialog({
    title: 'Sync Conflict Detected',
    message: 'This match was edited on another device.',
    options: [
      { label: 'Keep Local Version', action: () => useLocal() },
      { label: 'Use Cloud Version', action: () => useCloud() },
      { label: 'Merge Changes', action: () => mergeVersions() }
    ]
  });
}
```

### 11.6 Offline Event Recording

**Scenario**: Scorer records events while offline

**Handling:**
1. All events save to localStorage immediately
2. Queue events for cloud sync
3. Show offline indicator
4. When online:
   - Batch sync all pending events
   - Resolve conflicts if any
   - Update sync status

**Implementation:**
```javascript
const syncQueue = {
  matches: [],
  events: []
};

function queueForSync(type, id) {
  if (!syncQueue[type].includes(id)) {
    syncQueue[type].push(id);
  }
  
  // Save queue to localStorage
  localStorage.setItem('vscor_sync_queue', JSON.stringify(syncQueue));
  
  // Attempt sync if online
  if (navigator.onLine) {
    processSyncQueue();
  }
}

async function processSyncQueue() {
  const queue = JSON.parse(localStorage.getItem('vscor_sync_queue') || '{"matches":[],"events":[]}');
  
  for (const matchId of queue.matches) {
    try {
      await syncMatchToCloud(matchId);
      queue.matches = queue.matches.filter(id => id !== matchId);
    } catch (error) {
      console.error('Sync failed for match', matchId, error);
    }
  }
  
  localStorage.setItem('vscor_sync_queue', JSON.stringify(queue));
}

// Listen for online event
window.addEventListener('online', processSyncQueue);
```

### 11.7 Incomplete Squad Selection

**Scenario**: User starts match with incomplete squads

**Prevention:**
- Require minimum 1 player per team
- Show warning if < recommended count
- Allow override with confirmation

**Warning Message:**
```javascript
if (squad1.length < match.playersPerTeam / 2) {
  showWarning({
    title: 'Incomplete Squad',
    message: `You have selected only ${squad1.length} players for Team 1. Recommended: ${match.playersPerTeam}. Continue anyway?`,
    actions: [
      { label: 'Add More Players', action: () => returnToSelection() },
      { label: 'Start Anyway', action: () => startMatch() }
    ]
  });
}
```

### 11.8 Simultaneous Dual-Scorer Recording

**Scenario**: Two scorers record events at the same time

**Handling:**
1. Both events save locally first
2. Each syncs to cloud with timestamp
3. Cloud merges based on timestamp order
4. Both devices pull merged version on next sync
5. No data loss, chronological order preserved

**Event Merge:**
```javascript
function mergeEvents(localEvents, cloudEvents) {
  const allEvents = [...localEvents, ...cloudEvents];
  
  // Remove duplicates by ID
  const uniqueEvents = allEvents.reduce((acc, event) => {
    if (!acc.find(e => e.id === event.id)) {
      acc.push(event);
    }
    return acc;
  }, []);
  
  // Sort by timestamp, then by minute
  uniqueEvents.sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  return uniqueEvents;
}
```

---

## 12. Validation Rules

### 12.1 Match Validation

**Required Fields:**
- team1, team2 (non-empty, different)
- matchFormat (single or halves)
- duration (5-90 minutes)
- playersPerTeam (1-11)
- scoringLevel
- primaryScorer

**Business Rules:**
- team1 !== team2
- duration >= 5 && duration <= 90
- playersPerTeam >= 1 && playersPerTeam <= 11
- primaryScorer must be registered user
- If secondaryScorer: scoringLevel === 'advanced'
- If secondaryScorer: responsibilityType required
- If responsibilityType === 'team': teamScorerMapping complete

**Implementation:**
```javascript
const matchValidationSchema = {
  team1: { required: true, minLength: 1 },
  team2: { required: true, minLength: 1, differentFrom: 'team1' },
  matchFormat: { required: true, enum: ['single', 'halves'] },
  duration: { required: true, min: 5, max: 90, type: 'number' },
  playersPerTeam: { required: true, min: 1, max: 11, type: 'number' },
  scoringLevel: { required: true, enum: ['basic', 'intermediate-detailed', 'intermediate-all', 'advanced'] },
  primaryScorer: { required: true, type: 'object' },
  secondaryScorer: {
    requiredIf: { scoringLevel: 'advanced' },
    type: 'object'
  },
  responsibilityType: {
    requiredIf: { secondaryScorer: 'exists' },
    enum: ['team', 'event']
  }
};

function validateMatch(match) {
  const errors = [];
  
  // Run validation against schema
  Object.keys(matchValidationSchema).forEach(field => {
    const rules = matchValidationSchema[field];
    const value = match[field];
    
    if (rules.required && !value) {
      errors.push(`${field} is required`);
    }
    
    if (rules.differentFrom && value === match[rules.differentFrom]) {
      errors.push(`${field} must be different from ${rules.differentFrom}`);
    }
    
    // ... other validations
  });
  
  return errors;
}
```

### 12.2 Tournament Validation

**Required Fields:**
- name (unique)
- format (knockout, round-robin, group-knockout)
- participatingTeams (minimum 2 for knockout, 3 for round-robin)

**Business Rules:**
- Knockout: Teams count should be power of 2 (or allow byes)
- Round Robin: Minimum 3 teams
- Group Stage: Minimum 2 groups, minimum 2 teams per group
- Match duration: 5-90 minutes
- Players per team: 1-11

**Fixture Generation Validation:**
```javascript
function validateFixtureGeneration(tournament) {
  const errors = [];
  
  if (tournament.participatingTeams.length < 2) {
    errors.push('Minimum 2 teams required');
  }
  
  if (tournament.format === 'knockout') {
    const teamCount = tournament.participatingTeams.length;
    if (!isPowerOfTwo(teamCount)) {
      errors.push('Knockout requires power of 2 teams (2, 4, 8, 16, etc.)');
    }
  }
  
  if (tournament.format === 'round-robin' && tournament.participatingTeams.length < 3) {
    errors.push('Round robin requires minimum 3 teams');
  }
  
  if (tournament.format === 'group-knockout') {
    if (!tournament.groups || tournament.groups.length < 2) {
      errors.push('Group knockout requires minimum 2 groups');
    }
    
    tournament.groups.forEach(group => {
      if (group.teams.length < 2) {
        errors.push(`Group ${group.name} has less than 2 teams`);
      }
    });
  }
  
  return errors;
}
```

### 12.3 Player Validation

**Required Fields:**
- name (unique within app)

**Optional with Validation:**
- email (valid email format)
- phoneNumber (valid phone format)
- jerseyNumber (1-99)
- height (positive number)
- weight (positive number)
- dateOfBirth (not in future)

**Uniqueness Check:**
```javascript
function validatePlayerUniqueness(playerName, excludePlayerId = null) {
  const players = getAllPlayers();
  const duplicate = players.find(p => 
    p.name.toLowerCase() === playerName.toLowerCase() &&
    p.id !== excludePlayerId
  );
  
  if (duplicate) {
    return {
      valid: false,
      message: 'A player with this name already exists'
    };
  }
  
  return { valid: true };
}
```

### 12.4 Team Validation

**Required Fields:**
- name (unique)

**Business Rules:**
- Team name must be unique across all teams
- Cannot remove team from tournament if fixtures published
- Cannot delete team if participating in active tournaments

**Validation:**
```javascript
function validateTeamDeletion(teamId) {
  const tournaments = getAllTournaments();
  const activeParticipation = tournaments.filter(t => 
    t.participatingTeams.some(pt => pt.id === teamId) &&
    (t.fixturesPublished || hasActiveMatches(t))
  );
  
  if (activeParticipation.length > 0) {
    return {
      valid: false,
      message: `Cannot delete team. Currently participating in ${activeParticipation.length} active tournament(s)`
    };
  }
  
  return { valid: true };
}
```

### 12.5 Event Validation

**Required Fields:**
- type (valid event type)
- team (must be team1 or team2)
- player (must be in squad)
- minute (non-negative)

**Business Rules:**
- Player must be in squad for selected team
- Substitution: playerOut must be on field, playerIn must be on bench
- Card: Cannot give card to substituted-out player
- Scorer must have permission to record this event

**Validation:**
```javascript
function validateEvent(match, event) {
  const errors = [];
  
  // Check team
  if (event.team !== match.team1 && event.team !== match.team2) {
    errors.push('Invalid team');
  }
  
  // Check player in squad
  const squad = event.team === match.team1 ? match.squad1 : match.squad2;
  const playerInSquad = squad.find(p => p.id === event.player.id);
  
  if (!playerInSquad) {
    errors.push('Player not in squad');
  }
  
  // Substitution validation
  if (event.type === 'substitute') {
    const playerOut = squad.find(p => p.id === event.details.playerOut.id);
    const playerIn = squad.find(p => p.id === event.details.playerIn.id);
    
    if (!playerOut || playerOut.status === 'substitute') {
      errors.push('Player to substitute must be on field');
    }
    
    if (!playerIn || playerIn.status !== 'substitute') {
      errors.push('Substitute player must be on bench');
    }
  }
  
  // Scorer permission
  if (!canRecordEvent(currentUser.user_id, match, event.type, event.team)) {
    errors.push('You do not have permission to record this event');
  }
  
  return errors;
}
```

---

## 13. Future Scalability

### 13.1 Multi-Device Collaborative Scoring

**Vision**: Multiple scorers on different devices recording same match simultaneously

**Implementation Approach:**
- WebSocket-based real-time sync
- Operational Transformation (OT) for conflict resolution
- Live cursor indicators showing other scorers' activity
- Event locking to prevent duplicate recordings

**Architecture:**
```
Device 1 (Scorer 1)  ──┐
                       ├──> WebSocket Server ──> Supabase Realtime
Device 2 (Scorer 2)  ──┘       ↓
                           Broadcast events
                               ↓
                         All connected devices
```

### 13.2 Live Match Tracking & Notifications

**Features:**
- Push notifications for key events (goals, cards, final score)
- Live match feed with auto-refresh
- Webhook integrations for external platforms
- Social media auto-posting

**Notification Types:**
- ⚽ Goal scored
- 🟨 Card issued
- 🔄 Substitution made
- ⏱️ Half-time / Full-time
- 🏆 Tournament milestone (semifinal start, etc.)

**Implementation:**
- Firebase Cloud Messaging (FCM) for push notifications
- Supabase Realtime for live feed updates
- User preferences for notification settings

### 13.3 Advanced Analytics

**Player Analytics:**
- Heat maps (where player spent time on field)
- Pass completion rates
- Shot accuracy percentages
- Defensive actions breakdown
- Performance trends over time

**Team Analytics:**
- Formation analysis
- Possession statistics
- Attack vs defense balance
- Win probability models
- Head-to-head comparisons

**Tournament Analytics:**
- Top performers leaderboards
- Fair play rankings
- Attendance statistics
- Predictive modeling for knockout stages

**Visualization:**
- Chart.js / D3.js for interactive charts
- Field position heat maps
- Timeline-based event visualization
- Comparative radar charts

### 13.4 League Ecosystems

**Vision**: Interconnected multi-tournament ecosystem

**Features:**
- Division-based leagues (Div 1, Div 2, etc.)
- Promotion/relegation between divisions
- All-time league statistics
- Historical records and archives
- Season-based data segregation

**Data Model:**
```javascript
{
  league: {
    id: string,
    name: string,
    divisions: [
      {
        id: string,
        level: number,
        tournaments: [tournamentId1, tournamentId2],
        promotionSpots: number,
        relegationSpots: number
      }
    ],
    seasons: [
      {
        id: string,
        year: string,
        status: 'active' | 'completed'
      }
    ]
  }
}
```

### 13.5 Federation-Level Tournaments

**Vision**: Support for state/national level competitions

**Features:**
- Multi-tier tournament structure
- Qualification rounds
- Inter-zone competitions
- Official federation branding
- Certification and verification badges

**Permissions:**
- Federation admin role
- Verified tournament coordinators
- Referee assignments
- Official result ratification

**Integration:**
- Federation databases
- Player registration systems
- Disciplinary tracking
- Transfer windows

### 13.6 Video Highlight Integration

**Features:**
- Link video clips to specific events
- Auto-generate highlight reels
- Upload match recordings
- Timestamp synchronization

**Implementation:**
- Video storage: Supabase Storage or AWS S3
- Video player: Video.js or Plyr
- Clip trimming: FFmpeg.js
- Timestamp linking: Event ID → Video timestamp mapping

### 13.7 Performance Tracking Wearables

**Vision**: Integration with fitness trackers and smart devices

**Supported Devices:**
- GPS trackers (distance, speed, heat maps)
- Heart rate monitors
- Smart soccer balls (shot power, spin)

**Data Collection:**
- Bluetooth/WiFi sync during or after match
- Automatic event correlation (e.g., GPS spike → Sprint detected)
- Player fitness reports

**Privacy:**
- Opt-in data sharing
- Player consent required
- Anonymized aggregate data for team insights

### 13.8 AI-Powered Features

**Automated Event Detection:**
- Camera feed analysis (goal detection, card detection)
- Audio analysis (whistle detection, crowd reactions)
- Suggested event corrections

**Referee Assistance:**
- Offside detection
- Foul severity classification
- VAR-like review suggestions

**Predictive Analytics:**
- Match outcome predictions
- Player performance forecasts
- Injury risk assessments

**Implementation:**
- TensorFlow.js for client-side ML
- Cloud-based model training
- Real-time inference during matches

---

## 14. Technical Architecture Summary

### 14.1 Technology Stack

**Frontend:**
- React 18.x (functional components, hooks)
- React Router (data mode) for navigation
- Tailwind CSS v4 for styling
- Lucide React for icons
- Recharts for data visualization

**Backend:**
- Supabase (Postgres database, Auth, Storage)
- Deno-based Edge Functions (Hono web server)
- KV Store for simple key-value persistence

**Authentication:**
- Supabase Auth (email/password)
- Session management via access tokens

**Storage:**
- Primary: Browser localStorage
- Backup/Sync: Supabase KV Store
- Media: Supabase Storage (future)

**Deployment:**
- Frontend: Figma Make platform
- Backend: Supabase Edge Functions

### 14.2 File Structure

```
/
├── App.tsx                          # Main app component
├── routes.ts                        # React Router configuration (if needed)
│
├── components/
│   ├── ui/                          # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── label.tsx
│   │   ├── radio-group.tsx
│   │   └── ...
│   │
│   ├── AddPlayer.tsx                # Add player form
│   ├── AddTeam.tsx                  # Add team form
│   ├── AddTournament.tsx            # Add tournament form
│   ├── NewMatch.tsx                 # New match flow
│   ├── SelectSquad.tsx              # Squad selection
│   ├── LiveScoring.tsx              # Live scoring interface
│   ├── MatchDetails.tsx             # Match detail view
│   ├── MatchPayments.tsx            # Payment overview
│   ├── CalculatePayment.tsx         # Payment calculation screen
│   ├── PlayerProfile.tsx            # Player profile view/edit
│   ├── TeamProfile.tsx              # Team profile view/edit
│   ├── TournamentProfile.tsx        # Tournament profile view/edit
│   ├── TournamentStandings.tsx      # Standings table
│   ├── MyMatches.tsx                # User's matches list
│   ├── UserAutocompleteInput.tsx    # User search component
│   └── ...
│
├── utils/
│   ├── teamManagement.ts            # Team CRUD operations
│   ├── playerManagement.ts          # Player CRUD operations
│   ├── matchManagement.ts           # Match CRUD operations
│   ├── tournamentManagement.ts      # Tournament CRUD operations
│   ├── statsCalculation.ts          # Statistics calculation
│   ├── fixtureGeneration.ts         # Fixture generation algorithms
│   ├── validation.ts                # Validation functions
│   └── supabase/
│       ├── client.ts                # Supabase client setup
│       └── info.tsx                 # Project ID and keys
│
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx            # Hono server entry point
│           ├── kv_store.tsx         # KV operations (protected)
│           ├── matches.ts           # Match endpoints
│           ├── players.ts           # Player endpoints
│           ├── teams.ts             # Team endpoints
│           └── tournaments.ts       # Tournament endpoints
│
├── styles/
│   └── globals.css                  # Global styles and Tailwind config
│
└── imports/                         # Imported assets/docs
    ├── match-scoring-enhancements.md
    └── vscor-product-requirements-doc.md
```

### 14.3 Data Flow Diagram

```
User Action
    ↓
UI Component
    ↓
Local State Update
    ↓
localStorage Write ────────┐
    ↓                      │
UI Re-render               │
    ↓                      │
Background Sync Queue ←────┘
    ↓
(when online)
    ↓
API Call to Supabase Edge Function
    ↓
KV Store Write
    ↓
Response (success/error)
    ↓
Update Sync Status Indicator
```

**Read Flow:**
```
App Load / Pull-to-Refresh
    ↓
Check Network Status
    ↓
If Online:
    ├─> Fetch from Supabase KV Store
    ├─> Merge with localStorage
    └─> Update localStorage
    
If Offline:
    └─> Load from localStorage only
    
    ↓
Render UI with Data
```

---

## 15. Success Metrics & KPIs

### 15.1 Product Adoption

- **Active Users**: Monthly active users (MAU)
- **User Retention**: % users returning after 7 days, 30 days
- **Onboarding Completion**: % users completing profile creation
- **Feature Adoption**: % users creating tournaments, scoring matches

### 15.2 Engagement Metrics

- **Matches Scored**: Total matches recorded per week/month
- **Events Recorded**: Average events per match
- **Tournament Creation**: Number of active tournaments
- **Session Duration**: Average time spent in app per session
- **Scoring Speed**: Average time to record an event (<2 seconds target)

### 15.3 Data Quality

- **Sync Success Rate**: % of successful cloud syncs
- **Data Conflict Rate**: Number of merge conflicts per 1000 operations
- **Error Rate**: % of failed actions (validation errors, crashes)
- **Offline Usage**: % of actions performed while offline

### 15.4 User Satisfaction

- **Net Promoter Score (NPS)**: User recommendation likelihood
- **Feature Requests**: Volume and trends of feature suggestions
- **Bug Reports**: Number and severity of reported issues
- **Support Tickets**: Volume and resolution time

---

## 16. Development Roadmap

### 16.1 Phase 1: Core MVP ✅ (Complete)

**Status**: Implemented
- ✅ Email/password authentication
- ✅ Player, team, tournament profiles
- ✅ Match creation and squad selection
- ✅ Three-tier scoring system (Basic, Intermediate, Advanced)
- ✅ Event recording with two-tap interface
- ✅ Tournament fixtures and standings
- ✅ Match payment tracking
- ✅ Offline-first localStorage architecture
- ✅ Cloud sync via Supabase KV Store
- ✅ **Scorer assignment system with dual-scorer support**
- ✅ **Automatic match date/time setting**

### 16.2 Phase 2: Enhanced Experience (Next 3 months)

**Priorities:**
1. **Social Login**: Google, Facebook OAuth
2. **Enhanced Search**: Fuzzy search across all entities
3. **Export Functionality**: Download match reports, tournament summaries
4. **Rich Text Notes**: Add detailed notes to matches, players
5. **Photo Gallery**: Match photos, team photos
6. **Push Notifications**: Goal alerts, match reminders
7. **Data Visualization**: Charts and graphs for statistics
8. **Bulk Operations**: Batch player imports, mass team assignments

### 16.3 Phase 3: Community & Collaboration (Months 4-6)

1. **Multi-Device Scoring**: Real-time collaborative scoring
2. **Social Features**: Follow teams, share highlights
3. **Comments & Reactions**: Engage with match results
4. **Leaderboards**: Global and regional rankings
5. **Achievements & Badges**: Gamification elements
6. **Tournament Templates**: Pre-built tournament formats
7. **Schedule Calendar**: Integrated match calendar

### 16.4 Phase 4: Advanced Analytics (Months 7-9)

1. **Player Heat Maps**: Visual field position data
2. **Team Formation Analysis**: Tactical insights
3. **Performance Trends**: Statistical trend analysis
4. **Comparative Analytics**: Head-to-head comparisons
5. **Video Integration**: Link video clips to events
6. **AI Event Detection**: Automated event suggestions
7. **Predictive Modeling**: Match outcome predictions

### 16.5 Phase 5: Ecosystem & Monetization (Months 10-12)

1. **League Management**: Multi-tournament ecosystems
2. **Federation Integration**: Official tournament support
3. **Sponsor Integration**: Branded tournaments
4. **Premium Features**: Advanced analytics, priority support
5. **Marketplace**: Team merchandise, tournament tickets
6. **API for Third Parties**: Developer access to data
7. **Broadcasting Tools**: Live streaming integration

---

## 17. Glossary

**Terms:**

- **Scorer**: User assigned to record match events
- **Primary Scorer**: Main person responsible for recording events
- **Secondary Scorer**: Optional second person for dual-scorer mode (Advanced only)
- **Match Owner**: User who created the match and has full control
- **Coordinator**: User with edit permissions for team or tournament
- **Responsibility Division**: How event recording is split between dual scorers
- **Scoring Level**: Complexity tier (Basic, Intermediate, Advanced)
- **Squad**: Set of players selected for a specific match
- **Fixture**: Scheduled match in a tournament
- **Participating Team**: Team enrolled in a tournament
- **Tournament Stage**: Phase of tournament (group, knockout, final, etc.)
- **Points System**: Rules for awarding points (win/draw/loss)
- **Walkover**: Match awarded due to opponent withdrawal/absence
- **KV Store**: Key-value storage system (Supabase)
- **Offline-First**: Architecture prioritizing local storage over network
- **Sync Queue**: List of pending cloud sync operations
- **Master Teams Table**: Centralized team database
- **Legacy Data**: Older data structures maintained for compatibility
- **Event Type**: Category of match event (goal, foul, etc.)
- **Treasurer**: Person responsible for collecting match payments

---

## 18. Appendix

### 18.1 Event Type Reference

**All Event Types:**

1. **goal**: Goal scored
2. **shot_on_target**: Shot on target (saved or blocked)
3. **shot_off_target**: Shot missing the goal
4. **foul**: Foul committed
5. **yellow_card**: Yellow card issued
6. **red_card**: Red card issued
7. **substitute**: Player substitution
8. **corner**: Corner kick
9. **interception**: Ball interception (Intermediate+)
10. **offside**: Offside call (Intermediate+)

### 18.2 Scoring Level Comparison

| Feature | Basic | Intermediate (Detailed) | Intermediate (All) | Advanced |
|---------|-------|------------------------|-------------------|----------|
| Goals | ✅ | ✅ | ✅ | ✅ |
| Shots | ✅ | ✅ | ✅ | ✅ |
| Fouls | ✅ | ✅ | ✅ | ✅ |
| Substitutions | ✅ | ✅ | ✅ | ✅ |
| Corners | ✅ | ✅ | ✅ | ✅ |
| Detailed Attributes | ❌ | ✅ | ❌ | ✅ |
| Interceptions | ❌ | ❌ | ✅ | ✅ |
| Offsides | ❌ | ❌ | ✅ | ✅ |
| Dual Scorers | ❌ | ❌ | ❌ | ✅ |

### 18.3 Tournament Format Comparison

| Format | Min Teams | Fixture Type | Complexity | Best For |
|--------|-----------|--------------|------------|----------|
| Knockout | 4 (2^n) | Single elimination | Low | Quick tournaments |
| Round Robin | 3 | All vs all | Medium | Fair league play |
| Group + Knockout | 8 | Hybrid | High | Major tournaments |

### 18.4 API Endpoint Reference

**Base URL**: `https://{projectId}.supabase.co/functions/v1/make-server-845a157a`

**Endpoints:**

- `GET /matches` - List all matches
- `GET /matches/:id` - Get match details
- `POST /matches` - Create match
- `PUT /matches/:id` - Update match
- `DELETE /matches/:id` - Delete match

- `GET /players` - List all players
- `GET /players/:id` - Get player details
- `POST /players` - Create player
- `PUT /players/:id` - Update player

- `GET /teams` - List all teams
- `GET /teams/:id` - Get team details
- `POST /teams` - Create team
- `PUT /teams/:id` - Update team

- `GET /tournaments` - List all tournaments
- `GET /tournaments/:id` - Get tournament details
- `POST /tournaments` - Create tournament
- `PUT /tournaments/:id` - Update tournament

**Authentication**: All requests require `Authorization: Bearer {publicAnonKey}` header

**Protected Routes** (require user access token):
- POST/PUT/DELETE operations
- User-specific data retrieval

---

## 19. Conclusion

This Product Requirements Document provides a comprehensive blueprint for the VScor application as currently implemented, including the recent scorer assignment enhancements. The document serves as both a technical specification and a product vision guide, enabling:

1. **Engineering Teams** to understand architecture and implementation details
2. **Product Managers** to track features and plan roadmap
3. **Designers** to maintain consistent UX patterns
4. **QA Teams** to validate functionality and edge cases
5. **Stakeholders** to understand product scope and vision

**Current Status**: VScor has achieved a robust MVP with full offline-first capabilities, comprehensive tournament management, flexible scoring system, and a scalable ownership model. The recent addition of dual-scorer support with responsibility division demonstrates the platform's evolution toward professional-grade match scoring.

**Next Steps**:
- Gather user feedback from beta testing
- Implement Phase 2 enhancements (social login, exports, notifications)
- Monitor performance and optimize sync architecture
- Expand to multi-device collaborative features

**Maintained By**: VScor Product Team  
**Last Review**: March 8, 2026  
**Next Review**: April 8, 2026

---

*End of Product Requirements Document*
