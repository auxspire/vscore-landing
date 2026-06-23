/**
 * VScor Data Migration Utilities
 * Migrate existing localStorage data to UUID-based cloud sync system
 */

import { v4 as uuidv4 } from 'uuid';
import { Player, Team, Tournament, Match, TeamPlayer } from './schema';
import { EntitySyncManager } from './syncEngine';
import { TABLE_NAMES } from './schema';

// ==================== LEGACY TO NEW FORMAT MAPPING ====================
interface LegacyPlayer {
  id: number;
  name: string;
  teams?: Array<{ teamId: number; teamName: string; jerseyNumber?: string }>;
  teamId?: number | null;
  teamName?: string | null;
  jerseyNumber: string;
  position: string;
  phoneNumber?: string;
  imageUrl?: string;
}

interface LegacyTeam {
  id: number;
  name: string;
  coach: string;
  homeVenue: string;
  players: any[];
}

interface LegacyTournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  teams: string[];
  format?: string;
  status?: string;
  formatConfig?: any;
  participatingTeams?: any[];
  fixtures?: any[];
  standings?: any[];
}

interface LegacyMatch {
  id: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
  time?: string;
  venue?: string;
  tournamentId?: number;
  selectedSquadA?: any[];
  selectedSquadB?: any[];
  events?: any[];
}

// ==================== ID MAPPING REGISTRY ====================
class IDMappingRegistry {
  private static readonly MAPPING_KEY = 'vscor_id_mappings';

  static saveMapping(entityType: string, legacyId: number, newId: string): void {
    const mappings = this.getAllMappings();
    if (!mappings[entityType]) {
      mappings[entityType] = {};
    }
    mappings[entityType][legacyId] = newId;
    localStorage.setItem(this.MAPPING_KEY, JSON.stringify(mappings));
  }

  static getMapping(entityType: string, legacyId: number): string | undefined {
    const mappings = this.getAllMappings();
    return mappings[entityType]?.[legacyId];
  }

  static getAllMappings(): Record<string, Record<number, string>> {
    try {
      const stored = localStorage.getItem(this.MAPPING_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[ID Mapping] Error reading mappings:', error);
      return {};
    }
  }

  static clear(): void {
    localStorage.removeItem(this.MAPPING_KEY);
  }
}

// ==================== MIGRATION UTILITIES ====================
export class DataMigration {
  /**
   * Check if migration is needed
   */
  static isMigrationNeeded(): boolean {
    const migrationFlag = localStorage.getItem('vscor_migration_complete');
    return migrationFlag !== 'true';
  }

  /**
   * Mark migration as complete
   */
  static markMigrationComplete(): void {
    localStorage.setItem('vscor_migration_complete', 'true');
    console.log('[Migration] Migration marked as complete');
  }

  /**
   * Migrate Players
   */
  static migratePlayers(legacyPlayers: LegacyPlayer[]): Player[] {
    console.log(`[Migration] Migrating ${legacyPlayers.length} players`);
    const now = new Date().toISOString();
    
    return legacyPlayers.map(legacy => {
      // Check if already migrated
      let newId = IDMappingRegistry.getMapping('player', legacy.id);
      if (!newId) {
        newId = uuidv4();
        IDMappingRegistry.saveMapping('player', legacy.id, newId);
      }

      const migrated: Player = {
        id: newId,
        name: legacy.name,
        position: legacy.position,
        jersey_number: legacy.jerseyNumber,
        phone_number: legacy.phoneNumber,
        image_url: legacy.imageUrl,
        created_at: now,
        updated_at: now,
        sync_status: 'pending',
        // Keep legacy fields for backward compatibility
        team_id: legacy.teamId,
        team_name: legacy.teamName,
      };

      return migrated;
    });
  }

  /**
   * Migrate Teams
   */
  static migrateTeams(legacyTeams: LegacyTeam[]): Team[] {
    console.log(`[Migration] Migrating ${legacyTeams.length} teams`);
    const now = new Date().toISOString();
    
    return legacyTeams.map(legacy => {
      // Check if already migrated
      let newId = IDMappingRegistry.getMapping('team', legacy.id);
      if (!newId) {
        newId = uuidv4();
        IDMappingRegistry.saveMapping('team', legacy.id, newId);
      }

      const migrated: Team = {
        id: newId,
        name: legacy.name,
        coach: legacy.coach,
        home_venue: legacy.homeVenue,
        created_at: now,
        updated_at: now,
        sync_status: 'pending',
      };

      return migrated;
    });
  }

  /**
   * Migrate Team-Player relationships
   */
  static migrateTeamPlayers(legacyTeams: LegacyTeam[], legacyPlayers: LegacyPlayer[]): TeamPlayer[] {
    console.log('[Migration] Migrating team-player relationships');
    const now = new Date().toISOString();
    const teamPlayers: TeamPlayer[] = [];

    // Process team rosters
    legacyTeams.forEach(team => {
      const teamId = IDMappingRegistry.getMapping('team', team.id);
      if (!teamId) return;

      team.players.forEach((player: any) => {
        // Find player ID from legacy ID or name
        let playerId: string | undefined;
        
        if (player.id) {
          playerId = IDMappingRegistry.getMapping('player', player.id);
        }

        if (!playerId) {
          // Try to find by name
          const matchingLegacyPlayer = legacyPlayers.find(p => p.name === player.name);
          if (matchingLegacyPlayer) {
            playerId = IDMappingRegistry.getMapping('player', matchingLegacyPlayer.id);
          }
        }

        if (playerId) {
          teamPlayers.push({
            id: uuidv4(),
            team_id: teamId,
            player_id: playerId,
            jersey_number: player.jerseyNumber || player.jersey_number,
            is_active: true,
            created_at: now,
            updated_at: now,
            sync_status: 'pending',
          });
        }
      });
    });

    // Process player team memberships (from new multi-team support)
    legacyPlayers.forEach(player => {
      if (player.teams && Array.isArray(player.teams)) {
        const playerId = IDMappingRegistry.getMapping('player', player.id);
        if (!playerId) return;

        player.teams.forEach(teamMembership => {
          const teamId = IDMappingRegistry.getMapping('team', teamMembership.teamId);
          if (teamId) {
            // Avoid duplicates
            const exists = teamPlayers.some(
              tp => tp.team_id === teamId && tp.player_id === playerId
            );
            
            if (!exists) {
              teamPlayers.push({
                id: uuidv4(),
                team_id: teamId,
                player_id: playerId,
                jersey_number: teamMembership.jerseyNumber,
                is_active: true,
                created_at: now,
                updated_at: now,
                sync_status: 'pending',
              });
            }
          }
        });
      }
    });

    console.log(`[Migration] Created ${teamPlayers.length} team-player relationships`);
    return teamPlayers;
  }

  /**
   * Migrate Tournaments
   */
  static migrateTournaments(legacyTournaments: LegacyTournament[]): Tournament[] {
    console.log(`[Migration] Migrating ${legacyTournaments.length} tournaments`);
    const now = new Date().toISOString();
    
    return legacyTournaments.map(legacy => {
      // Check if already migrated
      let newId = IDMappingRegistry.getMapping('tournament', legacy.id);
      if (!newId) {
        newId = uuidv4();
        IDMappingRegistry.saveMapping('tournament', legacy.id, newId);
      }

      const migrated: Tournament = {
        id: newId,
        name: legacy.name,
        start_date: legacy.startDate,
        end_date: legacy.endDate,
        format: (legacy.format as any) || 'league',
        status: (legacy.status as any) || 'upcoming',
        created_by: 'migrated', // Placeholder - will be updated with auth
        admins: ['migrated'],
        is_public: false,
        format_config: legacy.formatConfig,
        created_at: now,
        updated_at: now,
        sync_status: 'pending',
      };

      return migrated;
    });
  }

  /**
   * Full Migration Process
   */
  static async performFullMigration(): Promise<void> {
    if (!this.isMigrationNeeded()) {
      console.log('[Migration] Migration already completed');
      return;
    }

    console.log('[Migration] Starting full data migration...');

    try {
      // Load legacy data
      const legacyPlayers: LegacyPlayer[] = JSON.parse(
        localStorage.getItem('vscor_players') || '[]'
      );
      const legacyTeams: LegacyTeam[] = JSON.parse(
        localStorage.getItem('vscor_teams') || '[]'
      );
      const legacyTournaments: LegacyTournament[] = JSON.parse(
        localStorage.getItem('vscor_tournaments') || '[]'
      );
      const legacyMatches: LegacyMatch[] = JSON.parse(
        localStorage.getItem('vscor_completed_matches') || '[]'
      );

      // Migrate entities
      const players = this.migratePlayers(legacyPlayers);
      const teams = this.migrateTeams(legacyTeams);
      const teamPlayers = this.migrateTeamPlayers(legacyTeams, legacyPlayers);
      const tournaments = this.migrateTournaments(legacyTournaments);

      // Save migrated data to new storage keys
      localStorage.setItem('vscor_players_v2', JSON.stringify(players));
      localStorage.setItem('vscor_teams_v2', JSON.stringify(teams));
      localStorage.setItem('vscor_team_players_v2', JSON.stringify(teamPlayers));
      localStorage.setItem('vscor_tournaments_v2', JSON.stringify(tournaments));

      console.log('[Migration] Local migration complete - data saved to _v2 storage keys');
      console.log(`  - Migrated ${players.length} players`);
      console.log(`  - Migrated ${teams.length} teams`);
      console.log(`  - Migrated ${teamPlayers.length} team-player relationships`);
      console.log(`  - Migrated ${tournaments.length} tournaments`);

      // Upload to cloud (if available)
      console.log('[Migration] Attempting cloud upload...');
      
      try {
        for (const player of players) {
          await EntitySyncManager.uploadEntity(TABLE_NAMES.PLAYERS, player);
        }

        for (const team of teams) {
          await EntitySyncManager.uploadEntity(TABLE_NAMES.TEAMS, team);
        }

        for (const teamPlayer of teamPlayers) {
          await EntitySyncManager.uploadEntity(TABLE_NAMES.TEAM_PLAYERS, teamPlayer);
        }

        for (const tournament of tournaments) {
          await EntitySyncManager.uploadEntity(TABLE_NAMES.TOURNAMENTS, tournament);
        }

        console.log('[Migration] Cloud upload successful!');
      } catch (uploadError) {
        console.warn('[Migration] Cloud upload failed - data saved locally:', uploadError);
        console.log('[Migration] Data will sync to cloud when database is available');
      }

      this.markMigrationComplete();
      console.log('[Migration] Migration complete!');
    } catch (error) {
      console.error('[Migration] Error during migration:', error);
      throw error;
    }
  }

  /**
   * Get ID mapping for backward compatibility
   */
  static getNewId(entityType: string, legacyId: number): string | undefined {
    return IDMappingRegistry.getMapping(entityType, legacyId);
  }

  /**
   * Reset migration (for testing)
   */
  static resetMigration(): void {
    localStorage.removeItem('vscor_migration_complete');
    IDMappingRegistry.clear();
    console.log('[Migration] Migration reset');
  }
}

export { IDMappingRegistry };