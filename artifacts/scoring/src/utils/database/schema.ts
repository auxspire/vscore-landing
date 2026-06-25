/**
 * VScor Master Database Schema
 * Centralized cloud database structure with UUID-based identifiers
 * Supports two-way sync between local storage and Supabase
 */

export interface BaseEntity {
  id: string; // UUID
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  sync_status: 'synced' | 'pending' | 'failed';
  last_synced_at?: string; // ISO timestamp
}

// ==================== USERS ====================
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: 'admin' | 'scorer' | 'audience';
  avatar_url?: string;
  phone_number?: string;
}

// ==================== PLAYERS ====================
export interface Player extends BaseEntity {
  name: string;
  position: string;
  jersey_number: string; // Default jersey number
  phone_number?: string;
  image_url?: string;
  date_of_birth?: string;
  // Legacy support - will be migrated
  team_id?: number | null;
  team_name?: string | null;
}

// ==================== TEAMS ====================
export interface Team extends BaseEntity {
  name: string;
  coach?: string;
  home_venue?: string;
  logo_url?: string;
  founded_date?: string;
  created_by?: string; // User ID
}

// ==================== TEAM PLAYERS ====================
// Junction table for many-to-many relationship
export interface TeamPlayer extends BaseEntity {
  team_id: string; // FK to teams.id
  player_id: string; // FK to players.id
  jersey_number?: string; // Team-specific jersey number
  is_active: boolean;
  joined_date?: string;
}

// ==================== TOURNAMENTS ====================
export interface Tournament extends BaseEntity {
  name: string;
  start_date: string;
  end_date: string;
  venue?: string;
  description?: string;
  format: 'league' | 'knockout' | 'group_stage___knockout' | 'round_robin';
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed';
  created_by: string; // User ID
  admins: string[]; // Array of user IDs who can manage this tournament
  is_public: boolean;
  // Format-specific configuration
  format_config?: {
    groups?: number;
    teamsPerGroup?: number;
    knockoutRounds?: number;
    pointsForWin?: number;
    pointsForDraw?: number;
    pointsForLoss?: number;
  };
}

// ==================== TOURNAMENT TEAMS ====================
export interface TournamentTeam extends BaseEntity {
  tournament_id: string; // FK to tournaments.id
  team_id: string; // FK to teams.id
  group_name?: string; // For group stage formats (e.g., "Group A")
  seed?: number; // Seeding position
  is_active: boolean;
}

// ==================== MATCHES ====================
export interface Match extends BaseEntity {
  tournament_id?: string; // FK to tournaments.id (nullable for friendly matches)
  team_a_id: string; // FK to teams.id
  team_b_id: string; // FK to teams.id
  team_a_score: number;
  team_b_score: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  match_date?: string;
  match_time?: string;
  venue?: string;
  round?: string; // e.g., "Group Stage", "Semi-Final", "Final"
  match_number?: number;
  // Squad selections
  team_a_squad?: string[]; // Array of player IDs
  team_b_squad?: string[]; // Array of player IDs
  // Result details
  completed_at?: string;
  scorer_id?: string; // User ID who scored this match
}

// ==================== MATCH EVENTS ====================
export interface MatchEvent extends BaseEntity {
  match_id: string; // FK to matches.id
  team_id: string; // FK to teams.id
  player_id?: string; // FK to players.id (nullable for team events)
  event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'shot_on_target' | 'shot_off_target' | 'save' | 'foul' | 'corner' | 'penalty' | 'own_goal';
  minute: number;
  description?: string;
  // Additional metadata
  assisted_by?: string; // Player ID for assists on goals
  substituted_for?: string; // Player ID for substitutions
}

// ==================== PERFORMANCE RATINGS (VMIR) ====================
export interface PerformanceRating extends BaseEntity {
  match_id: string; // FK to matches.id
  player_id: string; // FK to players.id
  team_id: string; // FK to teams.id
  rating: number; // 1-10 scale
  // Breakdown
  goals: number;
  assists: number;
  shots_on_target: number;
  shots_off_target: number;
  saves: number;
  fouls: number;
  yellow_cards: number;
  red_cards: number;
  // Calculated components
  offensive_rating: number;
  defensive_rating: number;
  discipline_rating: number;
}

// ==================== STANDINGS ====================
export interface Standing extends BaseEntity {
  tournament_id: string; // FK to tournaments.id
  team_id: string; // FK to teams.id
  group_name?: string; // For group stage formats
  // Stats
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  position: number;
}

// ==================== FIXTURES ====================
export interface Fixture extends BaseEntity {
  tournament_id: string; // FK to tournaments.id
  match_id?: string; // FK to matches.id (populated when match is created)
  round: string; // e.g., "Group Stage - Round 1", "Quarter Final"
  match_number: number;
  team_a_id?: string; // FK to teams.id (may be TBD initially)
  team_b_id?: string; // FK to teams.id (may be TBD initially)
  team_a_placeholder?: string; // e.g., "Winner of Match 3"
  team_b_placeholder?: string; // e.g., "Runner-up Group B"
  scheduled_date?: string;
  scheduled_time?: string;
  venue?: string;
  is_published: boolean;
}

// ==================== SEEDING DATA ====================
export interface SeedingData extends BaseEntity {
  tournament_id: string; // FK to tournaments.id
  team_id: string; // FK to teams.id
  seed_position: number;
  criteria?: string; // e.g., "Previous tournament winner", "Manual selection"
}

// ==================== SYNC METADATA ====================
export interface SyncMetadata {
  entity_type: string;
  local_id: number | string; // Legacy local ID
  cloud_id: string; // UUID
  last_sync: string;
  sync_status: 'synced' | 'pending' | 'failed';
  conflict_resolution?: 'local_wins' | 'cloud_wins' | 'merged';
}

// ==================== TABLE NAMES ====================
export const TABLE_NAMES = {
  USERS: 'users',
  PLAYERS: 'players',
  TEAMS: 'teams',
  TEAM_PLAYERS: 'team_players',
  TOURNAMENTS: 'tournaments',
  TOURNAMENT_TEAMS: 'tournament_teams',
  MATCHES: 'matches',
  MATCH_EVENTS: 'match_events',
  PERFORMANCE_RATINGS: 'performance_ratings',
  STANDINGS: 'standings',
  FIXTURES: 'fixtures',
  SEEDING_DATA: 'seeding_data',
  SYNC_METADATA: 'sync_metadata',
} as const;
