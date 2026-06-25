/**
 * Debug Helpers for VScor Cloud Sync and Team Management
 * Useful console commands for troubleshooting
 */

import { 
  validateJunctionTableIntegrity, 
  cleanupAllDuplicateTeamLinks, 
  syncAllTournamentsWithJunctionTable,
  getTeamsForTournament,
  detectAndFixDuplicateTeamIds
} from '../teamManagement';

/**
 * Clear all sync-related data
 * Use in browser console: window.VScorDebug.clearAllSyncData()
 */
export function clearAllSyncData(): void {
  const keys = [
    'vscor_sync_queue',
    'vscor_sync_status',
    'vscor_migration_complete',
    'vscor_skip_cloud_sync',
  ];

  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`[Debug] Cleared: ${key}`);
  });

  console.log('[Debug] ✅ All sync data cleared. Refresh the page to restart.');
}

/**
 * Check sync queue status
 * Use in browser console: window.VScorDebug.checkSyncQueue()
 */
export function checkSyncQueue(): void {
  const queue = localStorage.getItem('vscor_sync_queue');
  const status = localStorage.getItem('vscor_sync_status');

  console.log('[Debug] Sync Queue Status:');
  console.log('  Queue:', queue ? JSON.parse(queue) : 'Empty');
  console.log('  Status:', status ? JSON.parse(status) : 'Not set');
  console.log('  Skip Cloud Sync:', localStorage.getItem('vscor_skip_cloud_sync'));
  console.log('  Migration Complete:', localStorage.getItem('vscor_migration_complete'));
}

/**
 * Enable cloud sync (if previously skipped)
 * Use in browser console: window.VScorDebug.enableCloudSync()
 */
export function enableCloudSync(): void {
  localStorage.removeItem('vscor_skip_cloud_sync');
  console.log('[Debug] ✅ Cloud sync enabled. Refresh the page to see setup wizard.');
}

/**
 * Disable cloud sync (switch to local-only mode)
 * Use in browser console: window.VScorDebug.disableCloudSync()
 */
export function disableCloudSync(): void {
  localStorage.setItem('vscor_skip_cloud_sync', 'true');
  localStorage.removeItem('vscor_sync_queue');
  localStorage.removeItem('vscor_sync_status');
  console.log('[Debug] ✅ Cloud sync disabled. Refresh the page to use local-only mode.');
}

/**
 * View all VScor data in localStorage
 * Use in browser console: window.VScorDebug.viewAllData()
 */
export function viewAllData(): void {
  const vscorKeys = Object.keys(localStorage).filter(key => key.startsWith('vscor_'));
  
  console.log('[Debug] All VScor Data:');
  vscorKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      const parsed = value ? JSON.parse(value) : null;
      console.log(`\n  ${key}:`, parsed);
    } catch (error) {
      const value = localStorage.getItem(key);
      console.log(`\n  ${key}:`, value);
    }
  });
}

/**
 * Reset everything (DANGER: Deletes all app data)
 * Use in browser console: window.VScorDebug.resetEverything()
 */
export function resetEverything(): void {
  const confirm = window.confirm(
    '⚠️ WARNING: This will delete ALL VScor data including players, teams, tournaments, and matches. This cannot be undone. Are you sure?'
  );

  if (!confirm) {
    console.log('[Debug] Reset cancelled');
    return;
  }

  const vscorKeys = Object.keys(localStorage).filter(key => key.startsWith('vscor_'));
  
  vscorKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`[Debug] Deleted: ${key}`);
  });

  console.log('[Debug] ⚠️ All VScor data deleted. Refresh the page to start fresh.');
}

/**
 * Check team management integrity
 * Use in browser console: window.VScorDebug.checkTeamIntegrity()
 */
export function checkTeamIntegrity(): void {
  console.log('[Debug] Checking team management integrity...');
  
  const integrity = validateJunctionTableIntegrity();
  console.log('\n📊 Junction Table Integrity:');
  console.log('  Valid:', integrity.isValid ? '✅' : '❌');
  console.log('  Duplicate Links:', integrity.duplicateLinks);
  console.log('  Orphaned Links:', integrity.orphanedLinks);
  
  if (integrity.issues.length > 0) {
    console.log('\n⚠️ Issues Found:');
    integrity.issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n��� No issues found!');
  }
}

/**
 * Fix duplicate team links
 * Use in browser console: window.VScorDebug.fixDuplicateTeams()
 */
export function fixDuplicateTeams(): void {
  console.log('[Debug] Fixing duplicate team links...');
  
  const result = cleanupAllDuplicateTeamLinks();
  console.log('\n✅ Cleanup Result:');
  console.log('  Total Removed:', result.totalRemoved);
  console.log('  Tournaments Cleaned:', result.tournamentsCleaned);
  
  if (result.totalRemoved > 0) {
    console.log('\n✅ Fixed! Refresh the page to see changes.');
  } else {
    console.log('\n✅ No duplicates found.');
  }
}

/**
 * Sync all tournaments with junction table
 * Use in browser console: window.VScorDebug.syncTournaments()
 */
export function syncTournaments(): void {
  console.log('[Debug] Syncing all tournaments with junction table...');
  
  const result = syncAllTournamentsWithJunctionTable();
  console.log('\n✅ Sync Result:');
  console.log('  Tournaments Fixed:', result.tournamentsFixed);
  
  if (result.details.length > 0) {
    console.log('\n📝 Details:');
    result.details.forEach(detail => {
      console.log(`  Tournament: ${detail.tournamentName} (ID: ${detail.tournamentId})`);
      console.log(`    Before: ${detail.before} teams | After: ${detail.after} teams`);
    });
    console.log('\n✅ Synced! Refresh the page to see changes.');
  } else {
    console.log('\n✅ All tournaments already in sync.');
  }
}

/**
 * View tournament team counts
 * Use in browser console: window.VScorDebug.viewTeamCounts()
 */
export function viewTeamCounts(): void {
  const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
  
  console.log('[Debug] Tournament Team Counts:');
  console.log('\n📊 Comparison (Junction Table vs Array):');
  console.log('='.repeat(60));
  
  tournaments.forEach((tournament: any) => {
    const junctionCount = getTeamsForTournament(tournament.id).length;
    const arrayCount = (tournament.participatingTeams || []).length;
    const status = junctionCount === arrayCount ? '✅' : '❌';
    
    console.log(`\n${status} ${tournament.name || tournament.tournamentName}`);
    console.log(`   ID: ${tournament.id}`);
    console.log(`   Junction Table: ${junctionCount} teams`);
    console.log(`   Array: ${arrayCount} teams`);
    
    if (junctionCount !== arrayCount) {
      console.log(`   ⚠️ MISMATCH: Difference of ${Math.abs(junctionCount - arrayCount)} team(s)`);
    }
  });
}

/**
 * Fix all team-related issues (comprehensive fix)
 * Use in browser console: window.VScorDebug.fixAllTeamIssues()
 */
export function fixAllTeamIssues(): void {
  console.log('[Debug] Running comprehensive team fix...');
  console.log('='.repeat(60));
  
  // Step 1: Check integrity
  console.log('\n1️⃣ Checking junction table integrity...');
  const integrity = validateJunctionTableIntegrity();
  console.log(`   Duplicates: ${integrity.duplicateLinks} | Orphaned: ${integrity.orphanedLinks}`);
  
  // Step 2: Fix duplicates
  if (integrity.duplicateLinks > 0) {
    console.log('\n2️⃣ Fixing duplicate team links...');
    const cleanupResult = cleanupAllDuplicateTeamLinks();
    console.log(`   ✅ Removed ${cleanupResult.totalRemoved} duplicate link(s)`);
  } else {
    console.log('\n2️⃣ No duplicates to fix');
  }
  
  // Step 3: Sync tournaments
  console.log('\n3️⃣ Syncing tournaments with junction table...');
  const syncResult = syncAllTournamentsWithJunctionTable();
  console.log(`   ✅ Fixed ${syncResult.tournamentsFixed} tournament(s)`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ COMPLETE! Refresh the page to see changes.');
}

/**
 * Silent startup check - runs automatically to fix any data issues
 * Returns true if any fixes were applied
 */
export function silentStartupCheck(): boolean {
  let fixesApplied = false;
  
  // STEP 1: Check and fix duplicate team IDs in Master Teams Table
  const teamIdFix = detectAndFixDuplicateTeamIds();
  if (teamIdFix.teamsFixed > 0) {
    console.log(`🔧 VScor: Fixed ${teamIdFix.teamsFixed} duplicate team ID(s) automatically`);
    fixesApplied = true;
  }
  
  // STEP 2: Check junction table integrity
  const integrity = validateJunctionTableIntegrity();
  
  // Fix duplicate links silently
  if (integrity.duplicateLinks > 0) {
    cleanupAllDuplicateTeamLinks();
    fixesApplied = true;
  }
  
  // STEP 3: Sync tournaments silently
  const syncResult = syncAllTournamentsWithJunctionTable();
  if (syncResult.tournamentsFixed > 0) {
    fixesApplied = true;
  }
  
  if (fixesApplied) {
    console.log('✅ VScor: Data integrity issues auto-fixed');
  }
  
  return fixesApplied;
}

/**
 * Check for duplicate team IDs in Master Teams Table
 * Use in browser console: window.VScorDebug.checkDuplicateTeamIds()
 */
export function checkDuplicateTeamIds(): void {
  const teams = JSON.parse(localStorage.getItem('vscor_master_teams') || '[]');
  
  console.log('[Debug] Checking for duplicate team IDs in Master Teams Table...');
  console.log(`Total teams: ${teams.length}`);
  
  // Track IDs and find duplicates
  const idMap = new Map<number, any[]>();
  
  teams.forEach((team: any) => {
    if (!idMap.has(team.id)) {
      idMap.set(team.id, []);
    }
    idMap.get(team.id)!.push(team);
  });
  
  // Find duplicates
  const duplicates: Array<{ id: number; teams: any[] }> = [];
  idMap.forEach((teams, id) => {
    if (teams.length > 1) {
      duplicates.push({ id, teams });
    }
  });
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate team IDs found!');
    return;
  }
  
  console.log(`\n❌ CRITICAL: Found ${duplicates.length} duplicate team ID(s):\n`);
  console.log('='.repeat(60));
  
  duplicates.forEach(({ id, teams }) => {
    console.log(`\n🔴 Team ID: ${id} (used by ${teams.length} different teams)`);
    teams.forEach((team, index) => {
      console.log(`   ${index + 1}. "${team.name}"`);
      console.log(`      Coach: ${team.coach || 'N/A'}`);
      console.log(`      Players: ${(team.players || []).length}`);
      console.log(`      Created: ${team.createdAt || 'Unknown'}`);
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  This is a CRITICAL issue that needs to be fixed!');
  console.log('💡 Run window.VScorDebug.fixDuplicateTeamIds() to repair automatically.');
}

/**
 * Fix duplicate team IDs by regenerating unique IDs
 * Use in browser console: window.VScorDebug.fixDuplicateTeamIds()
 */
export function fixDuplicateTeamIds(): void {
  const teams = JSON.parse(localStorage.getItem('vscor_master_teams') || '[]');
  
  console.log('[Debug] Fixing duplicate team IDs...');
  
  // Track IDs and find duplicates
  const idMap = new Map<number, any[]>();
  
  teams.forEach((team: any) => {
    if (!idMap.has(team.id)) {
      idMap.set(team.id, []);
    }
    idMap.get(team.id)!.push(team);
  });
  
  // Find duplicates
  const duplicates: Array<{ id: number; teams: any[] }> = [];
  idMap.forEach((teams, id) => {
    if (teams.length > 1) {
      duplicates.push({ id, teams });
    }
  });
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate team IDs to fix!');
    return;
  }
  
  console.log(`Found ${duplicates.length} duplicate ID(s). Regenerating unique IDs...`);
  
  let counter = 0;
  const updatedTeams = teams.map((team: any) => {
    // Check if this team's ID is a duplicate
    const isDuplicate = duplicates.some(dup => dup.id === team.id);
    
    if (isDuplicate) {
      // Generate new unique ID
      const newId = Date.now() * 1000 + counter++;
      console.log(`  Reassigning "${team.name}" from ID ${team.id} → ${newId}`);
      
      return {
        ...team,
        id: newId,
        updatedAt: new Date()
      };
    }
    
    return team;
  });
  
  // Save updated teams
  localStorage.setItem('vscor_master_teams', JSON.stringify(updatedTeams));
  
  console.log(`\n✅ Fixed ${counter} team(s) with duplicate IDs`);
  console.log('⚠️  IMPORTANT: You must now update tournament links!');
  console.log('💡 Run window.VScorDebug.repairTournamentLinks() to complete the fix.');
}

/**
 * Repair tournament links after fixing duplicate team IDs
 * Use in browser console: window.VScorDebug.repairTournamentLinks()
 */
export function repairTournamentLinks(): void {
  console.log('[Debug] Repairing tournament links after team ID fix...');
  
  // Get all data
  const teams = JSON.parse(localStorage.getItem('vscor_master_teams') || '[]');
  const tournaments = JSON.parse(localStorage.getItem('vscor_tournaments') || '[]');
  const links = JSON.parse(localStorage.getItem('vscor_tournament_teams_junction') || '[]');
  
  console.log(`Found ${teams.length} teams, ${tournaments.length} tournaments, ${links.length} links`);
  
  // Create a map of old team names to new IDs
  const teamNameToId = new Map<string, number>();
  teams.forEach((team: any) => {
    teamNameToId.set(team.name.toLowerCase(), team.id);
  });
  
  // Update tournament participatingTeams arrays
  const updatedTournaments = tournaments.map((tournament: any) => {
    const participatingTeams = (tournament.participatingTeams || []).map((pt: any) => {
      const correctId = teamNameToId.get(pt.name.toLowerCase());
      if (correctId && correctId !== pt.id) {
        console.log(`  Fixed team "${pt.name}" ID in tournament "${tournament.name}": ${pt.id} → ${correctId}`);
        return { ...pt, id: correctId };
      }
      return pt;
    });
    
    return {
      ...tournament,
      participatingTeams
    };
  });
  
  // Update junction table links
  const updatedLinks = links.map((link: any) => {
    // Find the team by checking if any team name matches (need to cross-reference)
    const tournament = tournaments.find((t: any) => t.id === link.tournamentId);
    if (tournament) {
      const teamInTournament = (tournament.participatingTeams || []).find((pt: any) => pt.id === link.teamId);
      if (teamInTournament) {
        const correctId = teamNameToId.get(teamInTournament.name.toLowerCase());
        if (correctId && correctId !== link.teamId) {
          console.log(`  Fixed junction link for team ID: ${link.teamId} → ${correctId}`);
          return { ...link, teamId: correctId };
        }
      }
    }
    return link;
  });
  
  // Save updates
  localStorage.setItem('vscor_tournaments', JSON.stringify(updatedTournaments));
  localStorage.setItem('vscor_tournament_teams_junction', JSON.stringify(updatedLinks));
  
  console.log('\n✅ Tournament links repaired!');
  console.log('🔄 Refresh the page to see changes.');
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).VScorDebug = {
    clearAllSyncData,
    checkSyncQueue,
    enableCloudSync,
    disableCloudSync,
    viewAllData,
    resetEverything,
    checkTeamIntegrity,
    fixDuplicateTeams,
    syncTournaments,
    viewTeamCounts,
    fixAllTeamIssues,
    checkDuplicateTeamIds,
    fixDuplicateTeamIds,
    repairTournamentLinks,
    help: () => {
      console.log(`
VScor Debug Helpers
===================

Available commands (run in browser console):

📊 SYNC COMMANDS:
   window.VScorDebug.clearAllSyncData()       - Clear sync data only
   window.VScorDebug.checkSyncQueue()         - Check sync queue status
   window.VScorDebug.enableCloudSync()        - Enable cloud sync
   window.VScorDebug.disableCloudSync()       - Disable cloud sync (local-only)

👥 TEAM MANAGEMENT COMMANDS:
   window.VScorDebug.checkTeamIntegrity()     - Check for duplicate/orphaned teams
   window.VScorDebug.checkDuplicateTeamIds()  - Check for duplicate team IDs (NEW!)
   window.VScorDebug.fixDuplicateTeamIds()    - Fix duplicate team IDs (NEW!)
   window.VScorDebug.fixDuplicateTeams()      - Remove duplicate team links
   window.VScorDebug.syncTournaments()        - Sync tournament arrays with junction table
   window.VScorDebug.viewTeamCounts()         - View team count comparison
   window.VScorDebug.repairTournamentLinks()  - Repair links after ID fix (NEW!)
   window.VScorDebug.fixAllTeamIssues()       - Fix all team issues (RECOMMENDED)

🔧 GENERAL COMMANDS:
   window.VScorDebug.viewAllData()            - View all localStorage data
   window.VScorDebug.resetEverything()        - Reset everything (DANGER)
   window.VScorDebug.help()                   - Show this help

💡 TIP: If teams are getting the same ID, run:
   1. window.VScorDebug.checkDuplicateTeamIds()
   2. window.VScorDebug.fixDuplicateTeamIds()
   3. window.VScorDebug.repairTournamentLinks()
   4. Refresh the page

💡 TIP: If you're experiencing team count issues, run:
   window.VScorDebug.fixAllTeamIssues()
      `);
    },
  };

  console.log('[VScor] Debug helpers loaded. Run window.VScorDebug.help() for commands.');
}