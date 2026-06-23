# VScor - Database Schema

## Overview

VScor uses a dual-storage architecture:
1. **Primary Storage**: Browser `localStorage` (offline-first)
2. **Cloud Storage**: Supabase KV Store (PostgreSQL-backed key-value table)

This document describes the logical data schema used by both storage layers.

---

## Table of Contents
1. [Storage Architecture](#storage-architecture)
2. [Core Tables](#core-tables)
3. [Relationship Diagrams](#relationship-diagrams)
4. [Indexes and Constraints](#indexes-and-constraints)
5. [Sample Data](#sample-data)

---

## Storage Architecture

### localStorage Schema (Frontend)
```javascript
// Storage Keys
localStorage['vscor_current_user']     // Current authenticated user
localStorage['vscor_players']          // Array of all players
localStorage['vscor_teams']            // Array of teams (legacy)
localStorage['vscor_master_teams']     // Master team table
localStorage['vscor_tournaments']      // Array of tournaments
localStorage['vscor_matches']          // Array of matches
```

### Cloud Schema (Supabase)
```sql
-- KV Store Table
CREATE TABLE kv_store_845a157a (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Key Patterns:
-- user_{user_id}
-- player_{player_id}
-- team_{team_id}
-- tournament_{tournament_id}
-- match_{match_id}
```

---

## Core Tables

### 1. Users

**Purpose**: Store authenticated user accounts

**Schema**:
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  profile_photo TEXT,
  auth_provider VARCHAR(50) DEFAULT 'email',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| user_id | UUID | PRIMARY KEY | Unique user identifier (from Supabase Auth) |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| name | VARCHAR(255) | NOT NULL | Full name |
| phone_number | VARCHAR(20) | - | Optional phone number |
| profile_photo | TEXT | - | URL to profile photo |
| auth_provider | VARCHAR(50) | DEFAULT 'email' | Authentication method (email, google, facebook) |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| last_login | TIMESTAMP | - | Last successful login |

**Relationships**:
- One-to-One with Players (via owner_user_id)
- One-to-Many with Teams (as coordinator)
- One-to-Many with Tournaments (as coordinator)
- One-to-Many with Matches (as owner or scorer)

**Indexes**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

---

### 2. Players

**Purpose**: Store player profiles and statistics

**Schema**:
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  position VARCHAR(50),
  jersey_number VARCHAR(5),
  image_url TEXT,
  date_of_birth DATE,
  height DECIMAL(5,2),  -- in cm
  weight DECIMAL(5,2),  -- in kg
  preferred_foot VARCHAR(10),  -- 'Left', 'Right', 'Both'
  
  -- Ownership
  owner_user_id UUID REFERENCES users(user_id),
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Statistics (auto-calculated)
  stats JSONB DEFAULT '{
    "matches": 0,
    "goals": 0,
    "assists": 0,
    "yellowCards": 0,
    "redCards": 0,
    "shotsOnTarget": 0,
    "shotsOffTarget": 0,
    "fouls": 0,
    "cleanSheets": 0,
    "interceptions": 0,
    "offsides": 0
  }'::jsonb
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique player identifier |
| name | VARCHAR(255) | NOT NULL | Player name |
| email | VARCHAR(255) | - | Contact email |
| phone_number | VARCHAR(20) | - | Contact phone |
| position | VARCHAR(50) | - | Playing position (Forward, Midfielder, etc.) |
| jersey_number | VARCHAR(5) | - | Squad number |
| image_url | TEXT | - | URL to player photo |
| date_of_birth | DATE | - | Player DOB |
| height | DECIMAL(5,2) | - | Height in centimeters |
| weight | DECIMAL(5,2) | - | Weight in kilograms |
| preferred_foot | VARCHAR(10) | - | Left, Right, or Both |
| owner_user_id | UUID | FK to users | Linked user account (if claimed) |
| created_by | UUID | FK to users | User who created profile |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_by | UUID | FK to users | User who last updated |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| stats | JSONB | - | Auto-calculated statistics |

**Relationships**:
- Many-to-One: User (owner)
- Many-to-Many: Teams (via team_players junction)
- One-to-Many: Match Events (as player involved)

**Indexes**:
```sql
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_owner ON players(owner_user_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_stats_goals ON players((stats->>'goals'));
```

**Triggers**:
```sql
-- Update updated_at on changes
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 3. Teams

**Purpose**: Store team profiles and rosters

**Schema**:
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  coach VARCHAR(255),
  home_venue VARCHAR(255),
  description TEXT,
  image_url TEXT,  -- Team logo
  founded VARCHAR(4),  -- Year
  
  -- Roster (embedded as JSONB array)
  players JSONB DEFAULT '[]'::jsonb,
  
  -- Coordinators (embedded as JSONB array)
  coordinators JSONB DEFAULT '[]'::jsonb,
  
  -- Ownership
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Statistics (auto-calculated)
  stats JSONB DEFAULT '{
    "matchesPlayed": 0,
    "wins": 0,
    "draws": 0,
    "losses": 0,
    "goalsFor": 0,
    "goalsAgainst": 0,
    "goalDifference": 0
  }'::jsonb
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique team identifier |
| name | VARCHAR(255) | NOT NULL | Team name |
| coach | VARCHAR(255) | - | Coach name |
| home_venue | VARCHAR(255) | - | Home ground |
| description | TEXT | - | Team bio |
| image_url | TEXT | - | URL to team logo |
| founded | VARCHAR(4) | - | Foundation year |
| players | JSONB | - | Array of player objects (roster) |
| coordinators | JSONB | - | Array of coordinator objects |
| created_by | UUID | FK to users | User who created team |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_by | UUID | FK to users | User who last updated |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| stats | JSONB | - | Auto-calculated statistics |

**JSONB Structure Examples**:
```json
// players field
[
  {
    "id": "player-uuid-1",
    "name": "John Doe",
    "position": "Forward",
    "jerseyNumber": "9"
  },
  {
    "id": "player-uuid-2",
    "name": "Jane Smith",
    "position": "Midfielder",
    "jerseyNumber": "10"
  }
]

// coordinators field
[
  {
    "user_id": "user-uuid-1",
    "name": "Coach Name",
    "email": "coach@email.com"
  }
]
```

**Relationships**:
- Many-to-Many: Players (embedded in players array)
- Many-to-Many: Users (coordinators)
- Many-to-Many: Tournaments (via tournament_teams)
- One-to-Many: Matches (as team1 or team2)

**Indexes**:
```sql
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_teams_stats_wins ON teams((stats->>'wins'));
```

---

### 4. Tournaments

**Purpose**: Store tournament configuration, fixtures, and standings

**Schema**:
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  venue VARCHAR(255),
  image_url TEXT,  -- Tournament logo
  
  -- Format
  format VARCHAR(50) NOT NULL,  -- 'knockout', 'round-robin', 'group-knockout'
  match_duration INTEGER,  -- in minutes
  players_per_team INTEGER,
  
  -- Points system
  points_system JSONB DEFAULT '{
    "win": 3,
    "draw": 1,
    "loss": 0
  }'::jsonb,
  
  -- Teams
  participating_teams JSONB DEFAULT '[]'::jsonb,
  
  -- Groups (for group-knockout format)
  groups JSONB,
  
  -- Fixtures
  fixtures JSONB DEFAULT '[]'::jsonb,
  fixtures_published BOOLEAN DEFAULT FALSE,
  
  -- Coordinators
  coordinators JSONB DEFAULT '[]'::jsonb,
  
  -- Ownership
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique tournament identifier |
| name | VARCHAR(255) | NOT NULL | Tournament name |
| description | TEXT | - | Tournament details |
| start_date | DATE | - | Start date |
| end_date | DATE | - | End date |
| venue | VARCHAR(255) | - | Primary venue |
| image_url | TEXT | - | URL to tournament logo |
| format | VARCHAR(50) | NOT NULL | Tournament format |
| match_duration | INTEGER | - | Default match duration (minutes) |
| players_per_team | INTEGER | - | Default players per team |
| points_system | JSONB | - | Points allocation rules |
| participating_teams | JSONB | - | Array of team objects |
| groups | JSONB | - | Group configuration (if applicable) |
| fixtures | JSONB | - | Array of fixture objects |
| fixtures_published | BOOLEAN | DEFAULT FALSE | Fixture visibility status |
| coordinators | JSONB | - | Array of coordinator objects |
| created_by | UUID | FK to users | User who created tournament |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_by | UUID | FK to users | User who last updated |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**JSONB Structure Examples**:
```json
// participating_teams field
[
  {
    "id": "team-uuid-1",
    "name": "Arsenal FC"
  },
  {
    "id": "team-uuid-2",
    "name": "Chelsea FC"
  }
]

// groups field (for group-knockout format)
[
  {
    "name": "Group A",
    "teams": [
      {"id": "team-uuid-1", "name": "Arsenal FC"},
      {"id": "team-uuid-2", "name": "Chelsea FC"}
    ]
  },
  {
    "name": "Group B",
    "teams": [
      {"id": "team-uuid-3", "name": "Liverpool FC"},
      {"id": "team-uuid-4", "name": "Man City FC"}
    ]
  }
]

// fixtures field
[
  {
    "id": "fixture-uuid-1",
    "round": "Group Stage",
    "matchNumber": 1,
    "team1": {"id": "team-uuid-1", "name": "Arsenal FC"},
    "team2": {"id": "team-uuid-2", "name": "Chelsea FC"},
    "scheduledDate": "2026-03-10",
    "scheduledTime": "10:00",
    "venue": "Stadium A",
    "match_id": null,  // Linked when match created
    "status": "scheduled"  // or "in-progress", "completed"
  }
]
```

**Relationships**:
- Many-to-Many: Teams (embedded in participating_teams)
- Many-to-Many: Users (coordinators)
- One-to-Many: Matches (via tournamentId)

**Indexes**:
```sql
CREATE INDEX idx_tournaments_name ON tournaments(name);
CREATE INDEX idx_tournaments_format ON tournaments(format);
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX idx_tournaments_fixtures_published ON tournaments(fixtures_published);
```

---

### 5. Matches

**Purpose**: Store match configuration, events, scores, and metadata

**Schema**:
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Teams
  team1 VARCHAR(255) NOT NULL,
  team2 VARCHAR(255) NOT NULL,
  team1_id UUID REFERENCES teams(id),
  team2_id UUID REFERENCES teams(id),
  
  -- Match configuration
  match_format VARCHAR(20) NOT NULL,  -- 'single', 'halves'
  duration INTEGER NOT NULL,  -- in minutes
  venue VARCHAR(255),
  players_per_team INTEGER NOT NULL,
  
  -- Tournament association
  tournament VARCHAR(255),  -- Tournament name or 'Friendly Match'
  tournament_id UUID REFERENCES tournaments(id),
  tournament_stage VARCHAR(50),  -- 'group-stage', 'final', etc.
  
  -- Scoring configuration
  scoring_level VARCHAR(50) NOT NULL,  -- 'basic', 'intermediate-detailed', etc.
  
  -- Ownership and scorers
  owner_user_id UUID REFERENCES users(user_id) NOT NULL,
  scored_by UUID REFERENCES users(user_id),  -- Legacy field
  
  primary_scorer JSONB NOT NULL,  -- {user_id, name}
  secondary_scorer JSONB,  -- {user_id, name} (Advanced only)
  
  responsibility_type VARCHAR(20),  -- 'team', 'event', null
  team_scorer_mapping JSONB,  -- {team1: user_id, team2: user_id}
  event_scorer_mapping JSONB,  -- {user_id: [event_types]}
  
  -- Scores
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  
  -- Match state
  status VARCHAR(20) DEFAULT 'upcoming',  -- 'upcoming', 'live', 'completed'
  start_time TIMESTAMP,
  match_date DATE,  -- Auto-set when scoring starts
  match_time TIME,  -- Auto-set when scoring starts
  end_time TIMESTAMP,
  
  -- Squads
  squad1 JSONB DEFAULT '[]'::jsonb,
  squad2 JSONB DEFAULT '[]'::jsonb,
  
  -- Events
  events JSONB DEFAULT '[]'::jsonb,
  
  -- Payment information
  payment_per_player DECIMAL(10,2),
  treasurer JSONB,  -- {id, name}
  player_payments JSONB DEFAULT '[]'::jsonb,
  
  -- Ownership tracking
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Sharing
  shared BOOLEAN DEFAULT FALSE,
  shared_at TIMESTAMP
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique match identifier |
| team1 | VARCHAR(255) | NOT NULL | Team 1 name |
| team2 | VARCHAR(255) | NOT NULL | Team 2 name |
| team1_id | UUID | FK to teams | Team 1 reference (optional) |
| team2_id | UUID | FK to teams | Team 2 reference (optional) |
| match_format | VARCHAR(20) | NOT NULL | Single or two halves |
| duration | INTEGER | NOT NULL | Total duration in minutes |
| venue | VARCHAR(255) | - | Match location |
| players_per_team | INTEGER | NOT NULL | Squad size |
| tournament | VARCHAR(255) | - | Tournament name |
| tournament_id | UUID | FK to tournaments | Tournament reference |
| tournament_stage | VARCHAR(50) | - | Stage (group, knockout, etc.) |
| scoring_level | VARCHAR(50) | NOT NULL | Scoring complexity level |
| owner_user_id | UUID | FK to users, NOT NULL | Match owner |
| scored_by | UUID | FK to users | Legacy scorer field |
| primary_scorer | JSONB | NOT NULL | Primary scorer details |
| secondary_scorer | JSONB | - | Secondary scorer (Advanced only) |
| responsibility_type | VARCHAR(20) | - | Division type (team/event) |
| team_scorer_mapping | JSONB | - | Team-based scorer assignment |
| event_scorer_mapping | JSONB | - | Event-based scorer assignment |
| score_a | INTEGER | DEFAULT 0 | Team 1 score |
| score_b | INTEGER | DEFAULT 0 | Team 2 score |
| status | VARCHAR(20) | DEFAULT 'upcoming' | Match status |
| start_time | TIMESTAMP | - | When match created |
| match_date | DATE | - | Actual match date (auto-set) |
| match_time | TIME | - | Actual match time (auto-set) |
| end_time | TIMESTAMP | - | When match ended |
| squad1 | JSONB | - | Team 1 squad array |
| squad2 | JSONB | - | Team 2 squad array |
| events | JSONB | - | Match events array |
| payment_per_player | DECIMAL(10,2) | - | Payment amount per player |
| treasurer | JSONB | - | Treasurer details |
| player_payments | JSONB | - | Payment tracking array |
| created_by | UUID | FK to users | Match creator |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_by | UUID | FK to users | Last updater |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| shared | BOOLEAN | DEFAULT FALSE | Result shared publicly |
| shared_at | TIMESTAMP | - | When shared |

**JSONB Structure Examples**:
```json
// primary_scorer field
{
  "user_id": "user-uuid-1",
  "name": "John Doe"
}

// team_scorer_mapping field (team-based division)
{
  "team1": "user-uuid-1",
  "team2": "user-uuid-2"
}

// event_scorer_mapping field (event-based division)
{
  "user-uuid-1": ["goal", "shot_on_target", "shot_off_target", "foul"],
  "user-uuid-2": ["interception", "offside", "substitute", "corner"]
}

// squad1 field
[
  {
    "id": "player-uuid-1",
    "name": "John Doe",
    "position": "Forward",
    "jerseyNumber": "9",
    "imageUrl": "...",
    "status": "starting"  // or "substitute", "substituted-out"
  },
  {
    "id": "player-uuid-2",
    "name": "Jane Smith",
    "position": "Midfielder",
    "jerseyNumber": "10",
    "status": "starting"
  }
]

// events field
[
  {
    "id": "event-uuid-1",
    "type": "goal",
    "team": "team1",
    "player": {
      "id": "player-uuid-1",
      "name": "John Doe"
    },
    "minute": 45,
    "timestamp": "2026-03-08T14:30:00Z",
    "recorded_by": "user-uuid-1",
    "details": {
      "goalType": "open-play",
      "assistedBy": {
        "id": "player-uuid-2",
        "name": "Jane Smith"
      }
    }
  }
]

// player_payments field
[
  {
    "playerId": "player-uuid-1",
    "playerName": "John Doe",
    "teamName": "Arsenal FC",
    "amount": 100,
    "paid": true,
    "paidAt": "2026-03-08T15:00:00Z"
  },
  {
    "playerId": "player-uuid-2",
    "playerName": "Jane Smith",
    "teamName": "Arsenal FC",
    "amount": 100,
    "paid": false,
    "paidAt": null
  }
]
```

**Relationships**:
- Many-to-One: Tournament
- Many-to-One: User (owner)
- Many-to-One: User (primary scorer)
- Many-to-One: User (secondary scorer)
- Many-to-Many: Teams
- Many-to-Many: Players (via squads)

**Indexes**:
```sql
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_owner ON matches(owner_user_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_match_date ON matches(match_date);
CREATE INDEX idx_matches_primary_scorer ON matches((primary_scorer->>'user_id'));
CREATE INDEX idx_matches_team1 ON matches(team1);
CREATE INDEX idx_matches_team2 ON matches(team2);
```

---

### 6. Match Events (Embedded)

**Purpose**: Track individual events during a match

**Note**: Events are stored as JSONB array within the `matches.events` field, not as a separate table.

**Event Schema**:
```json
{
  "id": "event-uuid",
  "type": "goal",  // Event type
  "team": "team1",  // "team1" or "team2"
  "player": {
    "id": "player-uuid",
    "name": "Player Name"
  },
  "minute": 45,  // Match minute
  "timestamp": "2026-03-08T14:30:00Z",  // When recorded
  "recorded_by": "user-uuid",  // Scorer who recorded
  "details": {
    // Event-specific attributes
  }
}
```

**Event Types and Details**:

**Goal**:
```json
{
  "type": "goal",
  "details": {
    "goalType": "open-play",  // or "penalty", "free-kick", "header", "own-goal"
    "assistedBy": {
      "id": "player-uuid",
      "name": "Player Name"
    },
    "isPenalty": false
  }
}
```

**Shot**:
```json
{
  "type": "shot_on_target",  // or "shot_off_target"
  "details": {
    "shotLocation": "inside-box"  // or "outside-box"
  }
}
```

**Foul**:
```json
{
  "type": "foul",
  "details": {
    "cardType": "yellow",  // or "red", null
    "foulType": "dangerous",  // or "regular"
    "isPenalty": false
  }
}
```

**Substitution**:
```json
{
  "type": "substitute",
  "details": {
    "playerOut": {
      "id": "player-uuid",
      "name": "Player Out Name"
    },
    "playerIn": {
      "id": "player-uuid",
      "name": "Player In Name"
    }
  }
}
```

**Interception**:
```json
{
  "type": "interception",
  "details": {}
}
```

**Offside**:
```json
{
  "type": "offside",
  "details": {}
}
```

**Corner**:
```json
{
  "type": "corner",
  "details": {}
}
```

---

## Relationship Diagrams

### Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   USERS     │
└──────┬──────┘
       │
       │ 1
       │
       ├──────────────┐
       │              │
       │ 1:1          │ 1:N
       │              │
       ▼              ▼
┌──────────┐   ┌──────────────┐
│ PLAYERS  │   │ TEAMS        │
│          │   │ (coordinator)│
└────┬─────┘   └──────┬───────┘
     │                │
     │ M:N            │ M:N
     │                │
     │    ┌───────────┴─────────┐
     │    │                     │
     │    │                     │ 1:N
     │    ▼                     ▼
     │ ┌──────────────┐   ┌──────────┐
     │ │ TOURNAMENTS  │   │ MATCHES  │
     │ │              │   │          │
     │ └──────┬───────┘   └────┬─────┘
     │        │                │
     │        │ 1:N            │ 1:N
     │        └────────┬───────┘
     │                 │
     │                 ▼
     │         ┌───────────────┐
     │         │ MATCH EVENTS  │
     │         │  (embedded)   │
     └────────►└───────────────┘
       M:N


DETAILED RELATIONSHIPS:

User ──[owns]──► Player (1:1)
  └──[coordinates]──► Team (M:N)
  └──[coordinates]──► Tournament (M:N)
  └──[owns]──► Match (1:N)
  └──[scores as primary]──► Match (1:N)
  └──[scores as secondary]──► Match (1:N)

Player ──[belongs to]──► Team (M:N)
  └──[participates in]──► Match Squad (M:N)
  └──[records]──► Match Event (1:N)

Team ──[participates in]──► Tournament (M:N)
  └──[plays in]──► Match (1:N as team1 or team2)

Tournament ──[contains]──► Match (1:N)
  └──[generates]──► Fixtures (1:N, embedded)

Match ──[contains]──► Match Event (1:N, embedded)
  └──[has squads from]──► Player (M:N)
```

### Ownership Model Diagram

```
┌────────────────────────────────────────┐
│         OWNERSHIP HIERARCHY            │
└────────────────────────────────────────┘

User Account (user_id)
    │
    ├─ owns ──► Player Profile (owner_user_id)
    │             └─ Permissions: Edit, Delete, Transfer
    │
    ├─ coordinates ──► Team
    │   │               └─ Multiple coordinators allowed
    │   │               └─ Permissions: Edit team, Manage squad
    │   └─ coordinators[] array
    │
    ├─ coordinates ──► Tournament
    │   │               └─ Multiple coordinators allowed
    │   │               └─ Permissions: Edit, Manage teams, Fixtures
    │   └─ coordinators[] array
    │
    └─ owns ──► Match (owner_user_id)
        │       └─ Permissions: Edit config, Assign scorers, Payments
        │
        ├─ assigns ──► Primary Scorer (primary_scorer.user_id)
        │              └─ Permissions: Record events
        │
        └─ assigns ──► Secondary Scorer (secondary_scorer.user_id)
                       └─ Permissions: Record assigned events
```

---

## Indexes and Constraints

### Primary Keys
```sql
-- All tables use UUID primary keys
ALTER TABLE users ADD PRIMARY KEY (user_id);
ALTER TABLE players ADD PRIMARY KEY (id);
ALTER TABLE teams ADD PRIMARY KEY (id);
ALTER TABLE tournaments ADD PRIMARY KEY (id);
ALTER TABLE matches ADD PRIMARY KEY (id);
```

### Foreign Keys
```sql
-- Players
ALTER TABLE players
  ADD FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  ADD FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Teams
ALTER TABLE teams
  ADD FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Tournaments
ALTER TABLE tournaments
  ADD FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Matches
ALTER TABLE matches
  ADD FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;
```

### Unique Constraints
```sql
-- Users
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

-- Teams (name should be unique per context, but not globally)
-- No unique constraint on team name to allow same-named teams in different contexts
```

### Check Constraints
```sql
-- Matches
ALTER TABLE matches
  ADD CONSTRAINT check_teams_different CHECK (team1 <> team2),
  ADD CONSTRAINT check_duration_range CHECK (duration >= 5 AND duration <= 90),
  ADD CONSTRAINT check_players_range CHECK (players_per_team >= 1 AND players_per_team <= 11),
  ADD CONSTRAINT check_scores_non_negative CHECK (score_a >= 0 AND score_b >= 0);

-- Players
ALTER TABLE players
  ADD CONSTRAINT check_height_positive CHECK (height > 0 OR height IS NULL),
  ADD CONSTRAINT check_weight_positive CHECK (weight > 0 OR weight IS NULL);
```

### Performance Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Players
CREATE INDEX idx_players_name ON players USING gin(to_tsvector('english', name));
CREATE INDEX idx_players_owner ON players(owner_user_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_stats_goals ON players((stats->>'goals')::int DESC);
CREATE INDEX idx_players_stats_matches ON players((stats->>'matches')::int DESC);

-- Teams
CREATE INDEX idx_teams_name ON teams USING gin(to_tsvector('english', name));
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_teams_stats_wins ON teams((stats->>'wins')::int DESC);

-- Tournaments
CREATE INDEX idx_tournaments_name ON tournaments USING gin(to_tsvector('english', name));
CREATE INDEX idx_tournaments_format ON tournaments(format);
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date DESC);
CREATE INDEX idx_tournaments_fixtures_published ON tournaments(fixtures_published);

-- Matches
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_owner ON matches(owner_user_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_match_date ON matches(match_date DESC);
CREATE INDEX idx_matches_primary_scorer ON matches((primary_scorer->>'user_id'));
CREATE INDEX idx_matches_team1 ON matches(team1);
CREATE INDEX idx_matches_team2 ON matches(team2);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);

-- JSONB GIN indexes for embedded arrays
CREATE INDEX idx_teams_players ON teams USING gin(players);
CREATE INDEX idx_tournaments_teams ON tournaments USING gin(participating_teams);
CREATE INDEX idx_matches_events ON matches USING gin(events);
```

---

## Sample Data

### Sample User
```sql
INSERT INTO users (user_id, email, name, phone_number, auth_provider)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'john.doe@example.com',
  'John Doe',
  '+919876543210',
  'email'
);
```

### Sample Player
```sql
INSERT INTO players (
  id, name, position, jersey_number, owner_user_id, created_by, stats
)
VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  'John Doe',
  'Forward',
  '9',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  '{"matches": 25, "goals": 18, "assists": 10, "yellowCards": 2, "redCards": 0}'::jsonb
);
```

### Sample Team
```sql
INSERT INTO teams (
  id, name, coach, home_venue, created_by, players, coordinators, stats
)
VALUES (
  '770e8400-e29b-41d4-a716-446655440002',
  'Arsenal FC',
  'Coach Name',
  'Emirates Stadium',
  '550e8400-e29b-41d4-a716-446655440000',
  '[
    {"id": "660e8400-e29b-41d4-a716-446655440001", "name": "John Doe", "position": "Forward", "jerseyNumber": "9"}
  ]'::jsonb,
  '[
    {"user_id": "550e8400-e29b-41d4-a716-446655440000", "name": "John Doe", "email": "john.doe@example.com"}
  ]'::jsonb,
  '{"matchesPlayed": 20, "wins": 15, "draws": 3, "losses": 2, "goalsFor": 45, "goalsAgainst": 20, "goalDifference": 25}'::jsonb
);
```

### Sample Tournament
```sql
INSERT INTO tournaments (
  id, name, format, start_date, end_date, created_by,
  match_duration, players_per_team, participating_teams, coordinators, fixtures_published
)
VALUES (
  '880e8400-e29b-41d4-a716-446655440003',
  'Spring Cup 2026',
  'round-robin',
  '2026-03-01',
  '2026-03-31',
  '550e8400-e29b-41d4-a716-446655440000',
  45,
  7,
  '[
    {"id": "770e8400-e29b-41d4-a716-446655440002", "name": "Arsenal FC"},
    {"id": "770e8400-e29b-41d4-a716-446655440003", "name": "Chelsea FC"}
  ]'::jsonb,
  '[
    {"user_id": "550e8400-e29b-41d4-a716-446655440000", "name": "John Doe", "email": "john.doe@example.com"}
  ]'::jsonb,
  true
);
```

### Sample Match
```sql
INSERT INTO matches (
  id, team1, team2, team1_id, team2_id,
  match_format, duration, venue, players_per_team,
  tournament, tournament_id, tournament_stage,
  scoring_level, owner_user_id, scored_by,
  primary_scorer, secondary_scorer,
  responsibility_type, score_a, score_b,
  status, match_date, match_time,
  squad1, squad2, events, shared
)
VALUES (
  '990e8400-e29b-41d4-a716-446655440004',
  'Arsenal FC',
  'Chelsea FC',
  '770e8400-e29b-41d4-a716-446655440002',
  '770e8400-e29b-41d4-a716-446655440003',
  'single',
  45,
  'Emirates Stadium',
  7,
  'Spring Cup 2026',
  '880e8400-e29b-41d4-a716-446655440003',
  'round-robin',
  'advanced',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  '{"user_id": "550e8400-e29b-41d4-a716-446655440000", "name": "John Doe"}'::jsonb,
  null,
  null,
  2,
  1,
  'completed',
  '2026-03-08',
  '14:00',
  '[
    {"id": "660e8400-e29b-41d4-a716-446655440001", "name": "John Doe", "position": "Forward", "jerseyNumber": "9", "status": "starting"}
  ]'::jsonb,
  '[]'::jsonb,
  '[
    {
      "id": "event-1",
      "type": "goal",
      "team": "team1",
      "player": {"id": "660e8400-e29b-41d4-a716-446655440001", "name": "John Doe"},
      "minute": 23,
      "timestamp": "2026-03-08T14:23:00Z",
      "recorded_by": "550e8400-e29b-41d4-a716-446655440000",
      "details": {"goalType": "open-play", "assistedBy": null}
    }
  ]'::jsonb,
  true
);
```

---

## Data Validation Rules

### Application-Level Validation
```javascript
// Match validation
const validateMatch = (match) => {
  const errors = [];
  
  if (match.team1 === match.team2) {
    errors.push('Teams must be different');
  }
  
  if (match.duration < 5 || match.duration > 90) {
    errors.push('Duration must be between 5 and 90 minutes');
  }
  
  if (!match.primaryScorer) {
    errors.push('Primary scorer is required');
  }
  
  if (match.secondaryScorer && match.scoringLevel !== 'advanced') {
    errors.push('Secondary scorer only allowed in Advanced mode');
  }
  
  if (match.secondaryScorer && !match.responsibilityType) {
    errors.push('Responsibility division required for dual scorers');
  }
  
  return errors;
};
```

---

**End of Database Schema Document**
