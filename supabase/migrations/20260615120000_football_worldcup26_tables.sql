-- World Cup 2026 live data (worldcup26.ir provider)
-- Apply via Supabase Studio SQL editor or VPS psql

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.football_api_sync_state (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'worldcup26',
  competition_key TEXT NOT NULL DEFAULT 'worldcup',
  api_league_id BIGINT,
  api_season INTEGER,
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  calls_used_today INTEGER NOT NULL DEFAULT 0,
  sync_date DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'UTC'),
  status TEXT NOT NULL DEFAULT 'idle',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT football_api_sync_state_job_unique UNIQUE (job_name, competition_key)
);

CREATE TABLE IF NOT EXISTS public.football_teams (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'worldcup26',
  competition_key TEXT NOT NULL DEFAULT 'worldcup',
  api_team_id TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_fa TEXT,
  fifa_code TEXT,
  group_name TEXT,
  flag_url TEXT,
  raw_payload JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT football_teams_api_team_id_unique UNIQUE (api_team_id),
  CONSTRAINT football_teams_competition_team_unique UNIQUE (competition_key, api_team_id)
);

CREATE TABLE IF NOT EXISTS public.football_fixtures (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'worldcup26',
  api_fixture_id TEXT NOT NULL,
  competition_key TEXT NOT NULL DEFAULT 'worldcup',
  api_league_id BIGINT,
  api_season INTEGER,
  group_name TEXT,
  round TEXT,
  status_short TEXT,
  status_long TEXT,
  kickoff_at TIMESTAMPTZ,
  home_team_id TEXT,
  home_team_name TEXT,
  home_team_logo TEXT,
  away_team_id TEXT,
  away_team_name TEXT,
  away_team_logo TEXT,
  home_goals INTEGER,
  away_goals INTEGER,
  home_scorers JSONB,
  away_scorers JSONB,
  match_type TEXT,
  matchday TEXT,
  time_elapsed TEXT,
  is_finished BOOLEAN NOT NULL DEFAULT FALSE,
  stadium_id TEXT,
  home_team_label TEXT,
  away_team_label TEXT,
  raw_payload JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT football_fixtures_api_fixture_id_unique UNIQUE (api_fixture_id),
  CONSTRAINT football_fixtures_competition_fixture_unique UNIQUE (competition_key, api_fixture_id)
);

CREATE TABLE IF NOT EXISTS public.football_standings (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'worldcup26',
  competition_key TEXT NOT NULL DEFAULT 'worldcup',
  api_league_id BIGINT,
  api_season INTEGER,
  group_name TEXT NOT NULL,
  rank INTEGER,
  team_id TEXT NOT NULL,
  team_name TEXT,
  team_logo TEXT,
  played INTEGER,
  won INTEGER,
  drawn INTEGER,
  lost INTEGER,
  goals_for INTEGER,
  goals_against INTEGER,
  goal_difference INTEGER,
  points INTEGER,
  form TEXT,
  raw_payload JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT football_standings_unique UNIQUE (competition_key, group_name, team_id)
);

CREATE INDEX IF NOT EXISTS idx_football_fixtures_competition_key ON public.football_fixtures (competition_key);
CREATE INDEX IF NOT EXISTS idx_football_fixtures_kickoff_at ON public.football_fixtures (kickoff_at);
CREATE INDEX IF NOT EXISTS idx_football_fixtures_group_name ON public.football_fixtures (group_name);
CREATE INDEX IF NOT EXISTS idx_football_fixtures_api_fixture_id ON public.football_fixtures (api_fixture_id);
CREATE INDEX IF NOT EXISTS idx_football_fixtures_home_team_id ON public.football_fixtures (home_team_id);
CREATE INDEX IF NOT EXISTS idx_football_fixtures_away_team_id ON public.football_fixtures (away_team_id);
CREATE INDEX IF NOT EXISTS idx_football_standings_competition_key ON public.football_standings (competition_key);
CREATE INDEX IF NOT EXISTS idx_football_standings_group_name ON public.football_standings (group_name);
CREATE INDEX IF NOT EXISTS idx_football_teams_fifa_code ON public.football_teams (fifa_code);

DROP TRIGGER IF EXISTS tr_football_api_sync_state_updated_at ON public.football_api_sync_state;
CREATE TRIGGER tr_football_api_sync_state_updated_at
  BEFORE UPDATE ON public.football_api_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_football_teams_updated_at ON public.football_teams;
CREATE TRIGGER tr_football_teams_updated_at
  BEFORE UPDATE ON public.football_teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_football_fixtures_updated_at ON public.football_fixtures;
CREATE TRIGGER tr_football_fixtures_updated_at
  BEFORE UPDATE ON public.football_fixtures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_football_standings_updated_at ON public.football_standings;
CREATE TRIGGER tr_football_standings_updated_at
  BEFORE UPDATE ON public.football_standings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.football_api_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.football_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.football_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.football_standings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS football_api_sync_state_public_read ON public.football_api_sync_state;
CREATE POLICY football_api_sync_state_public_read ON public.football_api_sync_state
  FOR SELECT TO anon, authenticated USING (competition_key = 'worldcup');

DROP POLICY IF EXISTS football_teams_public_read ON public.football_teams;
CREATE POLICY football_teams_public_read ON public.football_teams
  FOR SELECT TO anon, authenticated USING (competition_key = 'worldcup');

DROP POLICY IF EXISTS football_fixtures_public_read ON public.football_fixtures;
CREATE POLICY football_fixtures_public_read ON public.football_fixtures
  FOR SELECT TO anon, authenticated USING (competition_key = 'worldcup');

DROP POLICY IF EXISTS football_standings_public_read ON public.football_standings;
CREATE POLICY football_standings_public_read ON public.football_standings
  FOR SELECT TO anon, authenticated USING (competition_key = 'worldcup');
