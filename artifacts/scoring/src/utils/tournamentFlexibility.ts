/**
 * Tournament Flexibility Utilities
 * Provides comprehensive tournament management with complete flexibility
 * until the final match is completed.
 */

export interface TournamentState {
  state: 'draft' | 'published' | 'live' | 'completed';
  canEditStructure: boolean;
  canEditDetails: boolean;
  canEditTeams: boolean;
  canEditDates: boolean;
  completedMatchesCount: number;
  totalFixturesCount: number;
  hasAnyMatch: boolean;
}

export interface Match {
  id: string;
  tournamentId: string;
  status: 'scheduled' | 'live' | 'completed';
  teamAId?: string;
  teamBId?: string;
  teamA?: string;
  teamB?: string;
  scoreA?: number;
  scoreB?: number;
  fixtureId?: string;
}

export interface ImpactPreview {
  affectedMatches: {
    completed: Match[];
    upcoming: Match[];
    voided: Match[];
  };
  message: string;
  warnings: string[];
  canProceed: boolean;
}

/**
 * Get the current state of a tournament
 */
export const getTournamentState = (
  tournamentId: string,
  fixturesStatus: string,
  generatedFixtures: any[]
): TournamentState => {
  // Get matches for this tournament
  const allMatches = JSON.parse(localStorage.getItem('vscor_matches') || '[]');
  const tournamentMatches = allMatches.filter((m: Match) => m.tournamentId === tournamentId);
  
  const completedMatches = tournamentMatches.filter((m: Match) => m.status === 'completed');
  const hasAnyMatch = tournamentMatches.length > 0;
  const hasCompletedMatch = completedMatches.length > 0;
  const totalFixtures = generatedFixtures.length;
  
  // Determine if ALL matches are completed
  const allMatchesCompleted = totalFixtures > 0 && completedMatches.length === totalFixtures;
  
  let state: 'draft' | 'published' | 'live' | 'completed';
  
  if (allMatchesCompleted) {
    state = 'completed';
  } else if (hasCompletedMatch || hasAnyMatch) {
    state = 'live';
  } else if (fixturesStatus === 'published') {
    state = 'published';
  } else {
    state = 'draft';
  }
  
  // Determine editing permissions based on state
  // KEY CHANGE: Allow ALL edits until tournament is COMPLETED
  const canEditStructure = state !== 'completed';
  const canEditDetails = state !== 'completed';
  const canEditTeams = state !== 'completed';
  const canEditDates = state !== 'completed';
  
  return {
    state,
    canEditStructure,
    canEditDetails,
    canEditTeams,
    canEditDates,
    completedMatchesCount: completedMatches.length,
    totalFixturesCount: totalFixtures,
    hasAnyMatch
  };
};

/**
 * Get all matches for a tournament with their status
 */
export const getMatchesForTournament = (tournamentId: string): Match[] => {
  const allMatches = JSON.parse(localStorage.getItem('vscor_matches') || '[]');
  return allMatches.filter((m: Match) => m.tournamentId === tournamentId);
};

/**
 * Get completed matches for a tournament
 */
export const getCompletedMatches = (tournamentId: string): Match[] => {
  return getMatchesForTournament(tournamentId).filter(m => m.status === 'completed');
};

/**
 * Get upcoming (not yet started) matches for a tournament
 */
export const getUpcomingMatches = (tournamentId: string, fixtureIds?: string[]): Match[] => {
  const allMatches = getMatchesForTournament(tournamentId);
  return allMatches.filter(m => m.status !== 'completed' && m.status !== 'live');
};

/**
 * Preview the impact of removing a team
 */
export const previewTeamWithdrawal = (
  tournamentId: string,
  teamId: string,
  generatedFixtures: any[]
): ImpactPreview => {
  const allMatches = getMatchesForTournament(tournamentId);
  
  // Find matches involving this team
  const teamMatches = allMatches.filter(
    m => m.teamAId === teamId || m.teamBId === teamId
  );
  
  const completed = teamMatches.filter(m => m.status === 'completed');
  const upcoming = teamMatches.filter(m => m.status !== 'completed' && m.status !== 'live');
  const live = teamMatches.filter(m => m.status === 'live');
  
  const warnings: string[] = [];
  let canProceed = true;
  
  if (completed.length > 0) {
    warnings.push(`${completed.length} completed match(es) involving this team will be preserved.`);
  }
  
  if (live.length > 0) {
    warnings.push(`⚠️ ${live.length} match(es) are currently live. Please complete them first.`);
    canProceed = false;
  }
  
  if (upcoming.length > 0) {
    warnings.push(`${upcoming.length} upcoming match(es) will be voided/forfeited.`);
  }
  
  return {
    affectedMatches: {
      completed,
      upcoming,
      voided: upcoming
    },
    message: `Withdrawing this team will affect ${teamMatches.length} match(es).`,
    warnings,
    canProceed
  };
};

/**
 * Preview the impact of adding a team mid-tournament
 */
export const previewMidTournamentTeamAddition = (
  tournamentId: string,
  tournamentFormat: string,
  currentTeamsCount: number
): ImpactPreview => {
  const state = getTournamentState(tournamentId, 'published', []);
  
  const warnings: string[] = [];
  let message = '';
  let canProceed = true;
  
  if (state.state === 'draft') {
    message = 'Tournament is in draft mode. Team can be added freely.';
    canProceed = true;
  } else if (state.state === 'published') {
    message = 'Fixtures are published. Adding this team will require fixture regeneration.';
    warnings.push('You may need to regenerate fixtures to include this team.');
    canProceed = true;
  } else if (state.state === 'live') {
    message = 'Tournament is live. Team can be added but fixtures must be adjusted.';
    warnings.push(`${state.completedMatchesCount} completed match(es) will be preserved.`);
    warnings.push('Remaining fixtures can be regenerated or manually adjusted.');
    canProceed = true;
  } else if (state.state === 'completed') {
    message = 'Tournament is completed. Cannot add teams.';
    warnings.push('All matches have been completed. Adding teams is not allowed.');
    canProceed = false;
  }
  
  return {
    affectedMatches: {
      completed: [],
      upcoming: [],
      voided: []
    },
    message,
    warnings,
    canProceed
  };
};

/**
 * Preview the impact of structural changes
 */
export const previewStructuralChange = (
  tournamentId: string,
  changeType: string,
  generatedFixtures: any[]
): ImpactPreview => {
  const completedMatches = getCompletedMatches(tournamentId);
  const allMatches = getMatchesForTournament(tournamentId);
  const upcomingMatches = allMatches.filter(m => m.status !== 'completed');
  
  const warnings: string[] = [];
  
  if (completedMatches.length > 0) {
    warnings.push(`✅ ${completedMatches.length} completed match(es) will be preserved.`);
  }
  
  if (upcomingMatches.length > 0) {
    warnings.push(`⚠️ ${upcomingMatches.length} upcoming match(es) may need to be regenerated.`);
  }
  
  const message = `Changing tournament ${changeType} will affect fixtures.`;
  
  return {
    affectedMatches: {
      completed: completedMatches,
      upcoming: upcomingMatches,
      voided: []
    },
    message,
    warnings,
    canProceed: true
  };
};

/**
 * Withdraw a team from the tournament
 */
export const withdrawTeam = (
  tournamentId: string,
  teamId: string,
  generatedFixtures: any[]
): { success: boolean; voidedFixtures: string[] } => {
  const allMatches = JSON.parse(localStorage.getItem('vscor_matches') || '[]');
  
  // Find upcoming matches for this team
  const upcomingTeamMatches = allMatches.filter(
    (m: Match) => 
      m.tournamentId === tournamentId &&
      (m.teamAId === teamId || m.teamBId === teamId) &&
      m.status !== 'completed' &&
      m.status !== 'live'
  );
  
  // Mark these matches as voided (you could also delete them or mark with a special status)
  const voidedMatchIds = upcomingTeamMatches.map((m: Match) => m.id);
  
  // Update fixtures to mark matches as voided
  const updatedFixtures = generatedFixtures.map(fixture => {
    if ((fixture.teamAId === teamId || fixture.teamBId === teamId)) {
      // Check if this fixture has a completed match
      const matchForFixture = allMatches.find(
        (m: Match) => 
          m.fixtureId === fixture.id && m.status === 'completed'
      );
      
      if (!matchForFixture) {
        // Mark as voided
        return { ...fixture, status: 'voided', voidReason: 'Team withdrawn' };
      }
    }
    return fixture;
  });
  
  // Save updated fixtures
  const fixturesData = JSON.parse(
    localStorage.getItem(`fixtures_${tournamentId}`) || '{}'
  );
  fixturesData.fixtures = updatedFixtures;
  localStorage.setItem(`fixtures_${tournamentId}`, JSON.stringify(fixturesData));
  
  return {
    success: true,
    voidedFixtures: voidedMatchIds
  };
};

/**
 * Check if format change is structural
 */
export const isStructuralChange = (
  oldFormat: any,
  newFormat: any
): boolean => {
  return (
    oldFormat.tournamentFormat !== newFormat.tournamentFormat ||
    parseInt(oldFormat.maxNumberOfTeams) !== parseInt(newFormat.maxNumberOfTeams) ||
    parseInt(oldFormat.numberOfGroups || 0) !== parseInt(newFormat.numberOfGroups || 0) ||
    parseInt(oldFormat.teamsPerGroup || 0) !== parseInt(newFormat.teamsPerGroup || 0) ||
    parseInt(oldFormat.teamsProgressingPerGroup || 0) !== parseInt(newFormat.teamsProgressingPerGroup || 0) ||
    parseInt(oldFormat.roundRobinRounds || 1) !== parseInt(newFormat.roundRobinRounds || 1)
  );
};

/**
 * Get tournament state badge info
 */
export const getTournamentStateBadge = (state: string) => {
  switch (state) {
    case 'draft':
      return {
        label: 'Draft',
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: '📝'
      };
    case 'published':
      return {
        label: 'Published',
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: '📢'
      };
    case 'live':
      return {
        label: 'Live',
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: '🔴'
      };
    case 'completed':
      return {
        label: 'Completed',
        color: 'bg-purple-100 text-purple-700 border-purple-300',
        icon: '🏆'
      };
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-700',
        icon: '❓'
      };
  }
};
