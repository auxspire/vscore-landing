/**
 * Database Setup Checker
 * Verifies if Supabase tables are properly configured
 */

import { supabase } from './supabaseClient';

export interface SetupStatus {
  isComplete: boolean;
  missingTables: string[];
  errors: string[];
  message: string;
}

/**
 * Check if all required tables exist in Supabase
 */
export async function checkDatabaseSetup(): Promise<SetupStatus> {
  const requiredTables = [
    'players',
    'teams',
    'team_players',
    'tournaments',
    'tournament_teams',
    'matches',
    'match_events',
    'performance_ratings',
    'standings',
    'fixtures',
    'seeding_data',
  ];

  const missingTables: string[] = [];
  const errors: string[] = [];

  // Test each table with a simple count query
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST205') {
          // Table doesn't exist
          missingTables.push(table);
        } else {
          // Other error (e.g., RLS policy blocking)
          errors.push(`${table}: ${error.message}`);
        }
      }
    } catch (err) {
      errors.push(`${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  const isComplete = missingTables.length === 0 && errors.length === 0;

  let message = '';
  if (isComplete) {
    message = 'Database setup is complete!';
  } else if (missingTables.length > 0) {
    message = `Missing ${missingTables.length} tables. Please create them in Supabase Dashboard.`;
  } else if (errors.length > 0) {
    message = 'Tables exist but there are configuration errors (possibly RLS policies).';
  }

  return {
    isComplete,
    missingTables,
    errors,
    message,
  };
}

/**
 * Check if we should skip cloud sync
 */
export function shouldSkipCloudSync(): boolean {
  // Check if user explicitly opted out
  const skipFlag = localStorage.getItem('vscor_skip_cloud_sync');
  return skipFlag === 'true';
}

/**
 * Set skip cloud sync flag
 */
export function setSkipCloudSync(skip: boolean): void {
  localStorage.setItem('vscor_skip_cloud_sync', skip ? 'true' : 'false');
}

/**
 * Get SQL for creating tables (for copy-paste convenience)
 */
export function getTableCreationSQL(): string {
  return `
-- VScor Database Tables
-- Copy and paste this into Supabase SQL Editor

-- 1. Players Table
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

-- 2. Teams Table
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
  created_by UUID
);

CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_sync_status ON teams(sync_status);

-- 3. Team Players Junction Table
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

-- 4. Tournaments Table
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
  format TEXT NOT NULL,
  status TEXT NOT NULL,
  created_by UUID,
  admins UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  format_config JSONB
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_dates ON tournaments(start_date, end_date);

-- 5. Tournament Teams Table
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

-- 6. Matches Table
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
  status TEXT NOT NULL,
  match_date DATE,
  match_time TIME,
  venue TEXT,
  round TEXT,
  match_number INTEGER,
  team_a_squad UUID[],
  team_b_squad UUID[],
  completed_at TIMESTAMPTZ,
  scorer_id UUID
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);

-- 7. Match Events Table
CREATE TABLE match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  player_id UUID REFERENCES players(id),
  event_type TEXT NOT NULL,
  minute INTEGER NOT NULL,
  description TEXT,
  assisted_by UUID REFERENCES players(id),
  substituted_for UUID REFERENCES players(id)
);

CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_match_events_player ON match_events(player_id);
CREATE INDEX idx_match_events_type ON match_events(event_type);

-- 8. Performance Ratings Table
CREATE TABLE performance_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  rating NUMERIC(3,1) NOT NULL,
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

-- 9. Standings Table
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

-- 10. Fixtures Table
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

-- 11. Seeding Data Table
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

-- Enable Row Level Security (Optional but recommended)
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

-- Basic RLS Policies (Allow all for now - customize as needed)
CREATE POLICY "Enable all access for players" ON players FOR ALL USING (true);
CREATE POLICY "Enable all access for teams" ON teams FOR ALL USING (true);
CREATE POLICY "Enable all access for team_players" ON team_players FOR ALL USING (true);
CREATE POLICY "Enable all access for tournaments" ON tournaments FOR ALL USING (true);
CREATE POLICY "Enable all access for tournament_teams" ON tournament_teams FOR ALL USING (true);
CREATE POLICY "Enable all access for matches" ON matches FOR ALL USING (true);
CREATE POLICY "Enable all access for match_events" ON match_events FOR ALL USING (true);
CREATE POLICY "Enable all access for performance_ratings" ON performance_ratings FOR ALL USING (true);
CREATE POLICY "Enable all access for standings" ON standings FOR ALL USING (true);
CREATE POLICY "Enable all access for fixtures" ON fixtures FOR ALL USING (true);
CREATE POLICY "Enable all access for seeding_data" ON seeding_data FOR ALL USING (true);
`;
}
