# VScor Database Setup Guide

## Overview
This guide explains how to set up the master cloud database tables in Supabase for the VScor application.

## Important Note
⚠️ **Database tables must be created manually through the Supabase Dashboard UI**. Figma Make does not support running migration scripts or DDL statements directly.

## Setup Instructions

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** or **Table Editor**

### Step 2: Create Tables

You'll need to create the following tables. Use the Table Editor for a visual interface, or paste the SQL below into the SQL Editor.

---

#### 1. **users** table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'scorer', 'audience')),
  avatar_url TEXT,
  phone_number TEXT
);
```

---

#### 2. **players** table
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  jersey_number TEXT NOT NULL,
  phone_number TEXT,
  image_url TEXT,
  date_of_birth DATE,
  team_id INTEGER,
  team_name TEXT
);

CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_sync_status ON players(sync_status);
```

---

#### 3. **teams** table
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  name TEXT UNIQUE NOT NULL,
  coach TEXT,
  home_venue TEXT,
  logo_url TEXT,
  founded_date DATE,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_sync_status ON teams(sync_status);
```

---

#### 4. **team_players** table (Junction table)
```sql
CREATE TABLE team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  jersey_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  joined_date DATE,
  UNIQUE(team_id, player_id)
);

CREATE INDEX idx_team_players_team ON team_players(team_id);
CREATE INDEX idx_team_players_player ON team_players(player_id);
```

---

#### 5. **tournaments** table
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  venue TEXT,
  description TEXT,
  format TEXT NOT NULL CHECK (format IN ('league', 'knockout', 'group_stage___knockout', 'round_robin')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed')),
  created_by UUID REFERENCES users(id),
  admins UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  format_config JSONB
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_dates ON tournaments(start_date, end_date);
```

---

#### 6. **tournament_teams** table
```sql
CREATE TABLE tournament_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  group_name TEXT,
  seed INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(tournament_id, team_id)
);

CREATE INDEX idx_tournament_teams_tournament ON tournament_teams(tournament_id);
CREATE INDEX idx_tournament_teams_team ON tournament_teams(team_id);
```

---

#### 7. **matches** table
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  team_a_id UUID REFERENCES teams(id),
  team_b_id UUID REFERENCES teams(id),
  team_a_score INTEGER DEFAULT 0,
  team_b_score INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  match_date DATE,
  match_time TIME,
  venue TEXT,
  round TEXT,
  match_number INTEGER,
  team_a_squad UUID[],
  team_b_squad UUID[],
  completed_at TIMESTAMPTZ,
  scorer_id UUID REFERENCES users(id)
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);
```

---

#### 8. **match_events** table
```sql
CREATE TABLE match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  player_id UUID REFERENCES players(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'shot_on_target', 'shot_off_target', 'save', 'foul', 'corner', 'penalty', 'own_goal')),
  minute INTEGER NOT NULL,
  description TEXT,
  assisted_by UUID REFERENCES players(id),
  substituted_for UUID REFERENCES players(id)
);

CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_match_events_player ON match_events(player_id);
CREATE INDEX idx_match_events_type ON match_events(event_type);
```

---

#### 9. **performance_ratings** table
```sql
CREATE TABLE performance_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  rating NUMERIC(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 10),
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  shots_off_target INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  offensive_rating NUMERIC(3,1),
  defensive_rating NUMERIC(3,1),
  discipline_rating NUMERIC(3,1),
  UNIQUE(match_id, player_id)
);

CREATE INDEX idx_performance_ratings_match ON performance_ratings(match_id);
CREATE INDEX idx_performance_ratings_player ON performance_ratings(player_id);
```

---

#### 10. **standings** table
```sql
CREATE TABLE standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  group_name TEXT,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  position INTEGER,
  UNIQUE(tournament_id, team_id, group_name)
);

CREATE INDEX idx_standings_tournament ON standings(tournament_id);
CREATE INDEX idx_standings_team ON standings(team_id);
```

---

#### 11. **fixtures** table
```sql
CREATE TABLE fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id),
  round TEXT NOT NULL,
  match_number INTEGER NOT NULL,
  team_a_id UUID REFERENCES teams(id),
  team_b_id UUID REFERENCES teams(id),
  team_a_placeholder TEXT,
  team_b_placeholder TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  venue TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  UNIQUE(tournament_id, match_number)
);

CREATE INDEX idx_fixtures_tournament ON fixtures(tournament_id);
CREATE INDEX idx_fixtures_match ON fixtures(match_id);
```

---

#### 12. **seeding_data** table
```sql
CREATE TABLE seeding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  seed_position INTEGER NOT NULL,
  criteria TEXT,
  UNIQUE(tournament_id, team_id)
);

CREATE INDEX idx_seeding_tournament ON seeding_data(tournament_id);
```

---

#### 13. **sync_metadata** table
```sql
CREATE TABLE sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  local_id TEXT NOT NULL,
  cloud_id UUID NOT NULL,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  conflict_resolution TEXT,
  UNIQUE(entity_type, local_id)
);

CREATE INDEX idx_sync_metadata_entity ON sync_metadata(entity_type);
CREATE INDEX idx_sync_metadata_cloud_id ON sync_metadata(cloud_id);
```

---

### Step 3: Enable Row Level Security (RLS)

For production use, enable RLS on all tables:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;
```

---

### Step 4: Create RLS Policies

Example policies for public read, authenticated write:

```sql
-- Players: Public read, authenticated write
CREATE POLICY "Players are viewable by everyone" 
  ON players FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert players" 
  ON players FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update players" 
  ON players FOR UPDATE 
  TO authenticated 
  USING (true);

-- Repeat similar patterns for other tables...
```

---

### Step 5: Enable Realtime (Optional)

For live updates, enable Realtime on key tables:

1. Go to Database → Replication in Supabase Dashboard
2. Enable replication for: `players`, `teams`, `matches`, `match_events`, `tournaments`, `standings`

---

## Verification

After setup, verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see all 13 tables listed.

---

## Next Steps

1. Run the migration script from the VScor app to populate the database with existing local data
2. Test sync functionality
3. Configure authentication for user management
4. Set up proper RLS policies for production use

---

## Troubleshooting

**Issue**: Tables not appearing  
**Solution**: Ensure you're running SQL in the correct schema (public)

**Issue**: Permission errors  
**Solution**: Check RLS policies and ensure service role key is used for backend operations

**Issue**: Sync not working  
**Solution**: Verify Supabase URL and anon key in the app configuration
