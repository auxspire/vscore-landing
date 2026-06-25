-- Scoring app relational tables (setup wizard / syncEngine)

CREATE TABLE IF NOT EXISTS public.players (
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

CREATE INDEX IF NOT EXISTS idx_players_name ON public.players(name);
CREATE INDEX IF NOT EXISTS idx_players_sync_status ON public.players(sync_status);

CREATE TABLE IF NOT EXISTS public.teams (
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

CREATE INDEX IF NOT EXISTS idx_teams_name ON public.teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_sync_status ON public.teams(sync_status);

CREATE TABLE IF NOT EXISTS public.team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  jersey_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  joined_date DATE,
  UNIQUE(team_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_team_players_team ON public.team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player ON public.team_players(player_id);

CREATE TABLE IF NOT EXISTS public.tournaments (
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

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON public.tournaments(start_date, end_date);

CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  group_name TEXT,
  seed INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(tournament_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament ON public.tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_team ON public.tournament_teams(team_id);

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  team_a_id UUID REFERENCES public.teams(id),
  team_b_id UUID REFERENCES public.teams(id),
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

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);

CREATE TABLE IF NOT EXISTS public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id),
  player_id UUID REFERENCES public.players(id),
  event_type TEXT NOT NULL,
  minute INTEGER NOT NULL,
  description TEXT,
  assisted_by UUID REFERENCES public.players(id),
  substituted_for UUID REFERENCES public.players(id)
);

CREATE INDEX IF NOT EXISTS idx_match_events_match ON public.match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON public.match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_match_events_type ON public.match_events(event_type);

CREATE TABLE IF NOT EXISTS public.performance_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id),
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

CREATE INDEX IF NOT EXISTS idx_performance_ratings_match ON public.performance_ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_performance_ratings_player ON public.performance_ratings(player_id);

CREATE TABLE IF NOT EXISTS public.standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_standings_tournament ON public.standings(tournament_id);
CREATE INDEX IF NOT EXISTS idx_standings_team ON public.standings(team_id);

CREATE TABLE IF NOT EXISTS public.fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id),
  round TEXT NOT NULL,
  match_number INTEGER NOT NULL,
  team_a_id UUID REFERENCES public.teams(id),
  team_b_id UUID REFERENCES public.teams(id),
  team_a_placeholder TEXT,
  team_b_placeholder TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  venue TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  UNIQUE(tournament_id, match_number)
);

CREATE INDEX IF NOT EXISTS idx_fixtures_tournament ON public.fixtures(tournament_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_match ON public.fixtures(match_id);

CREATE TABLE IF NOT EXISTS public.seeding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  seed_position INTEGER NOT NULL,
  criteria TEXT,
  UNIQUE(tournament_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_seeding_tournament ON public.seeding_data(tournament_id);

-- RLS: authenticated users only (no anonymous direct table access)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeding_data ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'players', 'teams', 'team_players', 'tournaments', 'tournament_teams',
    'matches', 'match_events', 'performance_ratings', 'standings', 'fixtures', 'seeding_data'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)',
      'scoring_auth_select_' || t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
      'scoring_auth_insert_' || t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      'scoring_auth_update_' || t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)',
      'scoring_auth_delete_' || t, t
    );
  END LOOP;
END $$;
