/**
 * Tournament Follow System for VScor
 * Manages follow/unfollow relationships between users and tournaments
 */

export interface TournamentFollow {
  tournament_id: number;
  user_id: number;
  followed_at: string;
}

const STORAGE_KEY = 'vscor_tournament_follows';

/**
 * Get all tournament follows from localStorage
 */
export function getAllTournamentFollows(): TournamentFollow[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading tournament follows:', error);
  }
  return [];
}

/**
 * Save tournament follows to localStorage
 */
function saveTournamentFollows(follows: TournamentFollow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(follows));
  } catch (error) {
    console.error('Error saving tournament follows:', error);
  }
}

/**
 * Check if a user is following a tournament
 */
export function isFollowingTournament(tournamentId: number, userId: number | null): boolean {
  if (!userId) return false;
  const follows = getAllTournamentFollows();
  return follows.some(
    f => f.tournament_id === tournamentId && f.user_id === userId
  );
}

/**
 * Follow a tournament
 */
export function followTournament(tournamentId: number, userId: number | null): boolean {
  if (!userId) {
    console.log('User ID is required to follow a tournament');
    return false;
  }
  
  // Check if already following
  if (isFollowingTournament(tournamentId, userId)) {
    console.log('User already follows this tournament');
    return false;
  }

  const follows = getAllTournamentFollows();
  
  const newFollow: TournamentFollow = {
    tournament_id: tournamentId,
    user_id: userId,
    followed_at: new Date().toISOString()
  };

  follows.push(newFollow);
  saveTournamentFollows(follows);
  
  console.log('✅ Tournament followed:', { tournamentId, userId });
  return true;
}

/**
 * Unfollow a tournament
 */
export function unfollowTournament(tournamentId: number, userId: number | null): boolean {
  if (!userId) {
    console.log('User ID is required to unfollow a tournament');
    return false;
  }
  
  const follows = getAllTournamentFollows();
  
  const filtered = follows.filter(
    f => !(f.tournament_id === tournamentId && f.user_id === userId)
  );

  if (filtered.length === follows.length) {
    console.log('User was not following this tournament');
    return false;
  }

  saveTournamentFollows(filtered);
  
  console.log('✅ Tournament unfollowed:', { tournamentId, userId });
  return true;
}

/**
 * Get follower count for a tournament
 */
export function getTournamentFollowerCount(tournamentId: number): number {
  const follows = getAllTournamentFollows();
  return follows.filter(f => f.tournament_id === tournamentId).length;
}

/**
 * Get all user IDs following a tournament
 */
export function getTournamentFollowerUserIds(tournamentId: number): number[] {
  const follows = getAllTournamentFollows();
  return follows
    .filter(f => f.tournament_id === tournamentId)
    .map(f => f.user_id);
}

/**
 * Get all tournaments followed by a user
 */
export function getFollowedTournamentIds(userId: number): number[] {
  const follows = getAllTournamentFollows();
  return follows
    .filter(f => f.user_id === userId)
    .map(f => f.tournament_id);
}

/**
 * Toggle follow status (follow if not following, unfollow if following)
 */
export function toggleFollowTournament(tournamentId: number, userId: number | null): boolean {
  if (isFollowingTournament(tournamentId, userId)) {
    return unfollowTournament(tournamentId, userId);
  } else {
    return followTournament(tournamentId, userId);
  }
}
