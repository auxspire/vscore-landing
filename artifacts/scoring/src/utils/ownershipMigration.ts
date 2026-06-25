/**
 * Ownership Migration Utility
 * 
 * This utility migrates existing data (players, teams, tournaments)
 * to include ownership metadata. Run this once after implementing
 * the ownership system.
 */

import { getCurrentUserId } from './auth';

interface LegacyEntity {
  id: string | number;
  [key: string]: any;
}

export const migratePlayersToOwnership = (providedUserId?: string) => {
  const userId = providedUserId || getCurrentUserId();
  if (!userId) {
    console.warn('⚠️ [migratePlayersToOwnership] No user ID available, skipping migration');
    return;
  }

  const now = new Date().toISOString();
  
  // Migrate Master Players
  const masterPlayers = JSON.parse(localStorage.getItem('vscor_master_players') || '[]');
  const migratedPlayers = masterPlayers.map((player: LegacyEntity) => {
    if (!player.owner_user_id) {
      return {
        ...player,
        created_by: userId,
        updated_by: userId,
        created_at: now,
        updated_at: now,
        owner_user_id: userId,
      };
    }
    return player;
  });
  localStorage.setItem('vscor_master_players', JSON.stringify(migratedPlayers));
  console.log(`✅ Migrated ${migratedPlayers.length} players`);
};

export const migrateTeamsToOwnership = (providedUserId?: string) => {
  const userId = providedUserId || getCurrentUserId();
  if (!userId) {
    console.warn('⚠️ [migrateTeamsToOwnership] No user ID available, skipping migration');
    return;
  }

  const now = new Date().toISOString();
  
  // Migrate Master Teams (vscor_master_teams)
  // Helper: a team needs migration if coordinator_user_ids is absent, null, or an empty array
  const needsOwnership = (team: LegacyEntity) =>
    !team.coordinator_user_ids || (Array.isArray(team.coordinator_user_ids) && team.coordinator_user_ids.length === 0);

  const masterTeams = JSON.parse(localStorage.getItem('vscor_master_teams') || '[]');
  const migratedMasterTeams = masterTeams.map((team: LegacyEntity) => {
    if (needsOwnership(team)) {
      return {
        ...team,
        created_by: team.created_by || userId,
        updated_by: userId,
        created_at: team.created_at || now,
        updated_at: now,
        coordinator_user_ids: [userId],
      };
    }
    return team;
  });
  localStorage.setItem('vscor_master_teams', JSON.stringify(migratedMasterTeams));
  console.log(`✅ Migrated ${migratedMasterTeams.length} master teams`);

  // ALSO migrate registered teams (vscor_teams) — this is what registeredTeams state reads from.
  // Without this, TeamProfile receives team objects with no coordinator_user_ids and no created_by,
  // meaning canEdit is false for everyone on legacy teams.
  const registeredTeams = JSON.parse(localStorage.getItem('vscor_teams') || '[]');
  const migratedRegisteredTeams = registeredTeams.map((team: LegacyEntity) => {
    if (needsOwnership(team)) {
      return {
        ...team,
        created_by: team.created_by || userId,
        updated_by: userId,
        created_at: team.created_at || now,
        updated_at: now,
        coordinator_user_ids: [userId],
      };
    }
    return team;
  });
  localStorage.setItem('vscor_teams', JSON.stringify(migratedRegisteredTeams));
  console.log(`✅ Migrated ${migratedRegisteredTeams.length} registered teams`);
};

export const migrateTournamentsToOwnership = (providedUserId?: string) => {
  const userId = providedUserId || getCurrentUserId();
  if (!userId) {
    console.warn('⚠️ [migrateTournamentsToOwnership] No user ID available, skipping migration');
    return;
  }

  const now = new Date().toISOString();
  
  // Migrate Tournaments
  const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
  const migratedTournaments = tournaments.map((tournament: LegacyEntity) => {
    if (!tournament.coordinator_user_ids) {
      return {
        ...tournament,
        created_by: userId,
        updated_by: userId,
        created_at: now,
        updated_at: now,
        coordinator_user_ids: [userId],
      };
    }
    return tournament;
  });
  localStorage.setItem('vscor_tournaments', JSON.stringify(migratedTournaments));
  console.log(`✅ Migrated ${migratedTournaments.length} tournaments`);
};

export const migrateAllToOwnership = (providedUserId?: string) => {
  console.log('🔄 Starting ownership migration...');
  
  const userId = providedUserId || getCurrentUserId();
  if (!userId) {
    console.warn('⚠️ [migrateAllToOwnership] No user ID available, skipping all migrations');
    return;
  }
  
  migratePlayersToOwnership(userId);
  migrateTeamsToOwnership(userId);
  migrateTournamentsToOwnership(userId);
  
  console.log('✅ Ownership migration complete!');
};

/**
 * Force re-migration (v2): clears ALL coordinator_user_ids and created_by fields
 * and re-stamps them with the current user's ID.
 *
 * This is needed after the fix that normalises user_id to the Supabase auth UUID,
 * because previous migrations may have stamped random VScor UUIDs that no longer
 * match what getCurrentUserId() returns.
 *
 * Guarded by a localStorage version flag so it only runs once per browser.
 */
export const forceReMigrateOwnership = (providedUserId?: string) => {
  const MIGRATION_V2_KEY = 'vscor_ownership_migration_v2_done';
  if (localStorage.getItem(MIGRATION_V2_KEY)) {
    // Already ran for this browser — skip
    return;
  }

  const userId = providedUserId || getCurrentUserId();
  if (!userId) {
    console.warn('⚠️ [forceReMigrateOwnership] No user ID — skipping');
    return;
  }

  console.log(`🔄 [forceReMigrateOwnership] Re-stamping all teams with correct user ID: ${userId}`);
  const now = new Date().toISOString();

  // Re-stamp vscor_teams
  try {
    const teams = JSON.parse(localStorage.getItem('vscor_teams') || '[]');
    const fixed = teams.map((team: any) => ({
      ...team,
      created_by: userId,
      updated_by: userId,
      created_at: team.created_at || now,
      updated_at: now,
      coordinator_user_ids: [userId],
    }));
    localStorage.setItem('vscor_teams', JSON.stringify(fixed));
    console.log(`✅ [forceReMigrateOwnership] Fixed ${fixed.length} registered teams`);
  } catch (e) {
    console.error('❌ [forceReMigrateOwnership] Error fixing teams:', e);
  }

  // Re-stamp vscor_master_teams
  try {
    const masterTeams = JSON.parse(localStorage.getItem('vscor_master_teams') || '[]');
    const fixed = masterTeams.map((team: any) => ({
      ...team,
      created_by: userId,
      updated_by: userId,
      created_at: team.created_at || now,
      updated_at: now,
      coordinator_user_ids: [userId],
    }));
    localStorage.setItem('vscor_master_teams', JSON.stringify(fixed));
    console.log(`✅ [forceReMigrateOwnership] Fixed ${fixed.length} master teams`);
  } catch (e) {
    console.error('❌ [forceReMigrateOwnership] Error fixing master teams:', e);
  }

  // Mark as done so it doesn't run again
  localStorage.setItem(MIGRATION_V2_KEY, '1');
  console.log('✅ [forceReMigrateOwnership] Done — version flag set');
};

// Expose migration to window for manual execution
if (typeof window !== 'undefined') {
  (window as any).VScorOwnershipMigration = {
    migrateAll: migrateAllToOwnership,
    migratePlayers: migratePlayersToOwnership,
    migrateTeams: migrateTeamsToOwnership,
    migrateTournaments: migrateTournamentsToOwnership,
    forceReMigrate: forceReMigrateOwnership,
  };
}