/**
 * Team Management Utility
 * Handles Master Teams Table operations and tournament-team relationships
 */

import { STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

// CRITICAL: Counter to prevent ID collisions when Date.now() is called rapidly
// This ensures unique IDs even if multiple teams are created in the same millisecond
let idCounter = 0;

/**
 * Generate a unique team ID
 * Uses timestamp + counter to guarantee uniqueness even for rapid operations
 */
const generateUniqueTeamId = (): number => {
  const timestamp = Date.now();
  const counter = idCounter++;
  
  // Reset counter after 999 to prevent overflow
  if (idCounter > 999) {
    idCounter = 0;
  }
  
  // Combine timestamp with counter: timestamp * 1000 + counter
  // This ensures uniqueness even if called multiple times in the same millisecond
  const uniqueId = timestamp * 1000 + counter;
  
  return uniqueId;
};

export interface MasterTeam {
  id: number;
  name: string;
  coach?: string;
  homeVenue?: string;
  description?: string;
  imageUrl?: string;
  players?: any[];
  coordinators?: Array<{ name: string; phone: string; email: string; user_id?: number }>;
  // Ownership metadata
  created_by?: string;
  owner_user_id?: number;
  coordinator_user_ids?: number[];
  created_at?: string;
  updated_at?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentTeamLink {
  tournamentId: number;
  teamId: number;
  addedAt: Date;
}

/**
 * Get all teams from Master Teams Table
 */
export const getAllMasterTeams = (): MasterTeam[] => {
  return loadFromStorage(STORAGE_KEYS.MASTER_TEAMS, []);
};

/**
 * Get a single team from Master Teams Table by ID
 */
export const getMasterTeamById = (teamId: number): MasterTeam | null => {
  const teams = getAllMasterTeams();
  return teams.find(t => t.id === teamId) || null;
};

/**
 * Check if a team with the same name already exists (case-insensitive)
 */
export const findTeamByName = (teamName: string): MasterTeam | null => {
  const teams = getAllMasterTeams();
  const normalizedName = teamName.trim().toLowerCase();
  return teams.find(t => t.name.toLowerCase() === normalizedName) || null;
};

/**
 * Add a new team to Master Teams Table
 * Returns the team ID
 */
export const addTeamToMasterTable = (teamData: Omit<MasterTeam, 'id' | 'createdAt' | 'updatedAt'>): number => {
  const teams = getAllMasterTeams();
  const newTeam: MasterTeam = {
    id: generateUniqueTeamId(),
    ...teamData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  teams.push(newTeam);
  saveToStorage(STORAGE_KEYS.MASTER_TEAMS, teams);
  
  console.log('✅ Team added to Master Teams Table:', newTeam);
  return newTeam.id;
};

/**
 * Update an existing team in Master Teams Table
 */
export const updateMasterTeam = (teamId: number, updates: Partial<MasterTeam>): boolean => {
  const teams = getAllMasterTeams();
  const index = teams.findIndex(t => t.id === teamId);
  
  if (index === -1) {
    console.error('❌ Team not found in Master Teams Table:', teamId);
    return false;
  }
  
  teams[index] = {
    ...teams[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  saveToStorage(STORAGE_KEYS.MASTER_TEAMS, teams);
  console.log('✅ Team updated in Master Teams Table:', teams[index]);
  return true;
};

/**
 * Link a team to a tournament
 * Enhanced with duplicate prevention and validation
 */
export const linkTeamToTournament = (tournamentId: number, teamId: number): boolean => {
  const links = loadFromStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, []) as TournamentTeamLink[];
  
  // CRITICAL: Check if link already exists (prevent duplicates)
  const existingLinks = links.filter(
    l => l.tournamentId === tournamentId && l.teamId === teamId
  );
  
  if (existingLinks.length > 0) {
    // Silent duplicate prevention - link already exists
    
    // If somehow there are multiple duplicates, clean them up
    if (existingLinks.length > 1) {
      console.error(`⚠️ CRITICAL: Found ${existingLinks.length} duplicate links! Cleaning up...`);
      const cleanedLinks = links.filter(
        l => !(l.tournamentId === tournamentId && l.teamId === teamId)
      );
      // Keep only one link
      cleanedLinks.push(existingLinks[0]);
      saveToStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, cleanedLinks);
      console.log('✅ Cleaned up duplicate links, kept earliest one');
    }
    
    return false;
  }
  
  // Verify team exists in master table
  const team = getMasterTeamById(teamId);
  if (!team) {
    console.error('❌ Team not found in Master Teams Table:', teamId);
    return false;
  }
  
  const newLink: TournamentTeamLink = {
    tournamentId,
    teamId,
    addedAt: new Date(),
  };
  
  links.push(newLink);
  saveToStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, links);
  
  console.log('✅ Team linked to tournament:', newLink);
  return true;
};

/**
 * Unlink a team from a tournament (does NOT delete from Master Teams Table)
 * Removes ALL instances if duplicates exist
 */
export const unlinkTeamFromTournament = (tournamentId: number, teamId: number): boolean => {
  const links = loadFromStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, []) as TournamentTeamLink[];
  const matchingLinks = links.filter(
    l => l.tournamentId === tournamentId && l.teamId === teamId
  );
  
  if (matchingLinks.length === 0) {
    console.warn('⚠️ No link found between tournament and team');
    return false;
  }
  
  // Remove all matching links (handles duplicates)
  const filteredLinks = links.filter(
    l => !(l.tournamentId === tournamentId && l.teamId === teamId)
  );
  
  saveToStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, filteredLinks);
  
  if (matchingLinks.length > 1) {
    console.log(`✅ Removed ${matchingLinks.length} duplicate links for team ${teamId} from tournament ${tournamentId}`);
  } else {
    console.log('✅ Team unlinked from tournament:', { tournamentId, teamId });
  }
  
  return true;
};

/**
 * Get all teams for a specific tournament
 */
export const getTeamsForTournament = (tournamentId: number): MasterTeam[] => {
  const links = loadFromStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, []) as TournamentTeamLink[];
  const teamIds = links
    .filter(l => l.tournamentId === tournamentId)
    .map(l => l.teamId);
  
  const allTeams = getAllMasterTeams();
  return allTeams.filter(t => teamIds.includes(t.id));
};

/**
 * Get all tournaments that a team is linked to
 */
export const getTournamentsForTeam = (teamId: number): number[] => {
  const links = loadFromStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, []) as TournamentTeamLink[];
  return links
    .filter(l => l.teamId === teamId)
    .map(l => l.tournamentId);
};

/**
 * Check if a team can be deleted from Master Teams Table
 * Returns { canDelete: boolean, reason?: string, linkedTournamentCount?: number }
 */
export const canDeleteMasterTeam = (teamId: number): { 
  canDelete: boolean; 
  reason?: string; 
  linkedTournamentCount?: number;
  linkedTournamentIds?: number[];
} => {
  const linkedTournaments = getTournamentsForTeam(teamId);
  
  if (linkedTournaments.length > 0) {
    return {
      canDelete: false,
      reason: `Team is linked to ${linkedTournaments.length} tournament(s)`,
      linkedTournamentCount: linkedTournaments.length,
      linkedTournamentIds: linkedTournaments,
    };
  }
  
  // TODO: Add check for match history if needed
  
  return { canDelete: true };
};

/**
 * Delete a team from Master Teams Table
 * Only allowed if team is not linked to any tournaments
 */
export const deleteMasterTeam = (teamId: number): { 
  success: boolean; 
  message: string 
} => {
  const deleteCheck = canDeleteMasterTeam(teamId);
  
  if (!deleteCheck.canDelete) {
    return {
      success: false,
      message: deleteCheck.reason || 'Cannot delete team',
    };
  }
  
  const teams = getAllMasterTeams();
  const filteredTeams = teams.filter(t => t.id !== teamId);
  
  if (filteredTeams.length === teams.length) {
    return {
      success: false,
      message: 'Team not found in Master Teams Table',
    };
  }
  
  saveToStorage(STORAGE_KEYS.MASTER_TEAMS, filteredTeams);
  
  console.log('✅ Team deleted from Master Teams Table:', teamId);
  return {
    success: true,
    message: 'Team deleted successfully',
  };
};

/**
 * Sync legacy teams to Master Teams Table
 * This is a one-time migration function
 */
export const migrateLegacyTeamsToMasterTable = (): { 
  migrated: number; 
  skipped: number 
} => {
  const legacyTeams = loadFromStorage(STORAGE_KEYS.TEAMS, []);
  const masterTeams = getAllMasterTeams();
  
  let migrated = 0;
  let skipped = 0;
  
  legacyTeams.forEach((team: any) => {
    // Check if team already exists in master table
    const existingTeam = findTeamByName(team.name);
    
    if (!existingTeam) {
      const teamId = addTeamToMasterTable({
        name: team.name,
        coach: team.coach,
        homeVenue: team.homeVenue,
        description: team.description,
        imageUrl: team.imageUrl,
        players: team.players || [],
      });
      migrated++;
      console.log(`✅ Migrated team: ${team.name} (ID: ${teamId})`);
    } else {
      skipped++;
      console.log(`⏭️ Skipped duplicate team: ${team.name}`);
    }
  });
  
  console.log(`📊 Migration complete: ${migrated} migrated, ${skipped} skipped`);
  return { migrated, skipped };
};

/**
 * Get teams that are NOT linked to a specific tournament
 */
export const getUnlinkedTeamsForTournament = (tournamentId: number): MasterTeam[] => {
  const linkedTeams = getTeamsForTournament(tournamentId);
  const linkedTeamIds = linkedTeams.map(t => t.id);
  const allTeams = getAllMasterTeams();
  
  const links = loadFromStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, []) as TournamentTeamLink[];
  console.log('🔍 Debug - Team Links:', {
    tournamentId,
    allTeamsCount: allTeams.length,
    allTeamNames: allTeams.map(t => t.name),
    linkedTeamsCount: linkedTeams.length,
    linkedTeamIds,
    linkedTeamNames: linkedTeams.map(t => t.name),
    allLinks: links.filter(l => l.tournamentId === tournamentId)
  });
  
  return allTeams.filter(t => !linkedTeamIds.includes(t.id));
};

/**
 * Remove duplicate team links for a tournament
 * Keeps the earliest link, removes subsequent duplicates
 */
export const removeDuplicateTeamLinks = (tournamentId: number): {
  success: boolean;
  removedCount: number;
  message: string;
} => {
  const links = loadFromStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, []) as TournamentTeamLink[];
  const tournamentLinks = links.filter(l => l.tournamentId === tournamentId);
  
  // Track seen team IDs for this tournament
  const seenTeamIds = new Set<number>();
  const duplicateIndices: number[] = [];
  
  // Find duplicates
  links.forEach((link, index) => {
    if (link.tournamentId === tournamentId) {
      if (seenTeamIds.has(link.teamId)) {
        duplicateIndices.push(index);
      } else {
        seenTeamIds.add(link.teamId);
      }
    }
  });
  
  if (duplicateIndices.length === 0) {
    return {
      success: true,
      removedCount: 0,
      message: 'No duplicates found'
    };
  }
  
  // Remove duplicates (iterate backwards to maintain indices)
  const cleanedLinks = links.filter((_, index) => !duplicateIndices.includes(index));
  
  saveToStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, cleanedLinks);
  
  console.log(`✅ Removed ${duplicateIndices.length} duplicate team links for tournament ${tournamentId}`);
  
  return {
    success: true,
    removedCount: duplicateIndices.length,
    message: `Removed ${duplicateIndices.length} duplicate link(s)`
  };
};

/**
 * Clean up all duplicate team links across all tournaments
 */
export const cleanupAllDuplicateTeamLinks = (): {
  success: boolean;
  totalRemoved: number;
  tournamentsCleaned: number[];
} => {
  const links = loadFromStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, []) as TournamentTeamLink[];
  
  // Group by tournament
  const tournamentMap = new Map<number, number[]>();
  links.forEach(link => {
    if (!tournamentMap.has(link.tournamentId)) {
      tournamentMap.set(link.tournamentId, []);
    }
    tournamentMap.get(link.tournamentId)!.push(link.teamId);
  });
  
  // Find duplicates per tournament
  const seenLinks = new Set<string>();
  const indicesToRemove = new Set<number>();
  
  links.forEach((link, index) => {
    const linkKey = `${link.tournamentId}-${link.teamId}`;
    if (seenLinks.has(linkKey)) {
      indicesToRemove.add(index);
    } else {
      seenLinks.add(linkKey);
    }
  });
  
  if (indicesToRemove.size === 0) {
    console.log('✅ No duplicates found in junction table');
    return {
      success: true,
      totalRemoved: 0,
      tournamentsCleaned: []
    };
  }
  
  // Remove duplicates
  const cleanedLinks = links.filter((_, index) => !indicesToRemove.has(index));
  saveToStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, cleanedLinks);
  
  // Get list of affected tournaments
  const affectedTournaments = Array.from(new Set(
    links.filter((_, index) => indicesToRemove.has(index)).map(l => l.tournamentId)
  ));
  
  console.log(`✅ Cleaned up ${indicesToRemove.size} duplicate links across ${affectedTournaments.length} tournament(s)`);
  
  return {
    success: true,
    totalRemoved: indicesToRemove.size,
    tournamentsCleaned: affectedTournaments
  };
};

/**
 * Validate junction table integrity
 * Returns diagnostics about potential issues
 */
export const validateJunctionTableIntegrity = (): {
  isValid: boolean;
  duplicateLinks: number;
  orphanedLinks: number;
  issues: string[];
} => {
  const links = loadFromStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, []) as TournamentTeamLink[];
  const masterTeams = getAllMasterTeams();
  const masterTeamIds = new Set(masterTeams.map(t => t.id));
  
  const issues: string[] = [];
  let duplicateCount = 0;
  let orphanedCount = 0;
  
  // Check for duplicates
  const seenLinks = new Set<string>();
  links.forEach(link => {
    const linkKey = `${link.tournamentId}-${link.teamId}`;
    if (seenLinks.has(linkKey)) {
      duplicateCount++;
    } else {
      seenLinks.add(linkKey);
    }
  });
  
  if (duplicateCount > 0) {
    issues.push(`Found ${duplicateCount} duplicate team link(s)`);
  }
  
  // Check for orphaned links (team no longer exists in master table)
  links.forEach(link => {
    if (!masterTeamIds.has(link.teamId)) {
      orphanedCount++;
    }
  });
  
  if (orphanedCount > 0) {
    issues.push(`Found ${orphanedCount} orphaned link(s) to deleted teams`);
  }
  
  return {
    isValid: duplicateCount === 0 && orphanedCount === 0,
    duplicateLinks: duplicateCount,
    orphanedLinks: orphanedCount,
    issues
  };
};

/**
 * Sync all tournaments' participatingTeams arrays with junction table
 * This is the comprehensive fix for dual-state inconsistencies
 */
export const syncAllTournamentsWithJunctionTable = (): {
  success: boolean;
  tournamentsFixed: number;
  details: Array<{
    tournamentId: number;
    tournamentName: string;
    before: number;
    after: number;
  }>;
} => {
  const tournaments = loadFromStorage('vscor_tournaments', []);
  const details: Array<{
    tournamentId: number;
    tournamentName: string;
    before: number;
    after: number;
  }> = [];
  let tournamentsFixed = 0;
  
  const updatedTournaments = tournaments.map((tournament: any) => {
    const junctionTeams = getTeamsForTournament(tournament.id);
    const arrayTeams = tournament.participatingTeams || [];
    
    // Check if sync is needed
    if (junctionTeams.length !== arrayTeams.length) {
      console.log(`🔧 Syncing tournament "${tournament.name}" (ID: ${tournament.id})`);
      console.log(`   Before: ${arrayTeams.length} teams in array`);
      console.log(`   After: ${junctionTeams.length} teams from junction table`);
      
      tournamentsFixed++;
      details.push({
        tournamentId: tournament.id,
        tournamentName: tournament.name || tournament.tournamentName || 'Unknown',
        before: arrayTeams.length,
        after: junctionTeams.length
      });
      
      return {
        ...tournament,
        participatingTeams: junctionTeams.map(team => ({ id: team.id, name: team.name }))
      };
    }
    
    return tournament;
  });
  
  if (tournamentsFixed > 0) {
    saveToStorage('vscor_tournaments', updatedTournaments);
    console.log(`✅ Fixed ${tournamentsFixed} tournament(s)`);
  } else {
    console.log('✅ All tournaments are already in sync');
  }
  
  return {
    success: true,
    tournamentsFixed,
    details
  };
};

/**
 * Detect and fix duplicate team IDs in Master Teams Table
 * This runs automatically on app startup to prevent ID collision issues
 */
export const detectAndFixDuplicateTeamIds = (): {
  success: boolean;
  duplicatesFound: number;
  teamsFixed: number;
  details: Array<{
    oldId: number;
    newId: number;
    teamName: string;
  }>;
} => {
  const teams = getAllMasterTeams();
  
  // Track IDs and find duplicates
  const idMap = new Map<number, MasterTeam[]>();
  
  teams.forEach((team) => {
    if (!idMap.has(team.id)) {
      idMap.set(team.id, []);
    }
    idMap.get(team.id)!.push(team);
  });
  
  // Find duplicate IDs
  const duplicateIds: number[] = [];
  idMap.forEach((teams, id) => {
    if (teams.length > 1) {
      duplicateIds.push(id);
    }
  });
  
  if (duplicateIds.length === 0) {
    return {
      success: true,
      duplicatesFound: 0,
      teamsFixed: 0,
      details: []
    };
  }
  
  console.log(`⚠️ CRITICAL: Found ${duplicateIds.length} duplicate team ID(s) in Master Teams Table`);
  
  const details: Array<{ oldId: number; newId: number; teamName: string }> = [];
  let counter = 0;
  
  // Fix duplicates by regenerating IDs for all but the first occurrence
  const updatedTeams = teams.map((team) => {
    const duplicateGroup = idMap.get(team.id);
    
    if (duplicateGroup && duplicateGroup.length > 1) {
      // Keep the first team's ID, reassign others
      const isFirst = duplicateGroup[0] === team;
      
      if (!isFirst) {
        // Generate new unique ID for this duplicate
        const newId = generateUniqueTeamId();
        
        console.log(`  🔧 Reassigning "${team.name}" from ID ${team.id} → ${newId}`);
        
        details.push({
          oldId: team.id,
          newId: newId,
          teamName: team.name
        });
        
        counter++;
        
        return {
          ...team,
          id: newId,
          updatedAt: new Date()
        };
      }
    }
    
    return team;
  });
  
  // Save updated teams
  saveToStorage(STORAGE_KEYS.MASTER_TEAMS, updatedTeams);
  
  // Update junction table links
  if (details.length > 0) {
    const links = loadFromStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, []) as TournamentTeamLink[];
    const tournaments = loadFromStorage('vscor_tournaments', []);
    
    // Create a map of team names to their new IDs
    const teamNameToNewId = new Map<string, number>();
    details.forEach(detail => {
      const team = updatedTeams.find(t => t.id === detail.newId);
      if (team) {
        teamNameToNewId.set(team.name.toLowerCase(), detail.newId);
      }
    });
    
    // Update junction table
    const updatedLinks = links.map(link => {
      const detail = details.find(d => d.oldId === link.teamId);
      if (detail) {
        console.log(`  🔗 Updating junction link: Team ID ${detail.oldId} → ${detail.newId}`);
        return {
          ...link,
          teamId: detail.newId
        };
      }
      return link;
    });
    
    saveToStorage(STORAGE_KEYS.TOURNAMENT_TEAMS, updatedLinks);
    
    // Update tournament participatingTeams arrays
    const updatedTournaments = tournaments.map((tournament: any) => {
      const participatingTeams = (tournament.participatingTeams || []).map((pt: any) => {
        const detail = details.find(d => d.oldId === pt.id);
        if (detail) {
          console.log(`  📋 Updating tournament "${tournament.name}": Team "${pt.name}" ID ${detail.oldId} → ${detail.newId}`);
          return { ...pt, id: detail.newId };
        }
        return pt;
      });
      
      return {
        ...tournament,
        participatingTeams
      };
    });
    
    saveToStorage('vscor_tournaments', updatedTournaments);
    
    console.log(`✅ Fixed ${counter} duplicate team ID(s) and updated all references`);
  }
  
  return {
    success: true,
    duplicatesFound: duplicateIds.length,
    teamsFixed: counter,
    details
  };
};