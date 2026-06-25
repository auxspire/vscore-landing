/**
 * Team Follow System for VScor
 * Manages follow/unfollow relationships between users and teams
 */

export interface TeamFollow {
  team_id: number;
  user_id: number;
  followed_at: string;
}

const STORAGE_KEY = 'vscor_team_follows';

/**
 * Get all team follows from localStorage
 */
export function getAllTeamFollows(): TeamFollow[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading team follows:', error);
  }
  return [];
}

/**
 * Save team follows to localStorage
 */
function saveTeamFollows(follows: TeamFollow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(follows));
  } catch (error) {
    console.error('Error saving team follows:', error);
  }
}

/**
 * Check if a user is following a team
 */
export function isFollowingTeam(teamId: number, userId: number | null): boolean {
  if (!userId) return false;
  const follows = getAllTeamFollows();
  return follows.some(
    f => f.team_id === teamId && f.user_id === userId
  );
}

/**
 * Follow a team
 */
export function followTeam(teamId: number, userId: number | null): boolean {
  if (!userId) {
    console.log('User ID is required to follow a team');
    return false;
  }
  
  // Check if already following
  if (isFollowingTeam(teamId, userId)) {
    console.log('User already follows this team');
    return false;
  }

  const follows = getAllTeamFollows();
  
  const newFollow: TeamFollow = {
    team_id: teamId,
    user_id: userId,
    followed_at: new Date().toISOString()
  };

  follows.push(newFollow);
  saveTeamFollows(follows);
  
  console.log('✅ Team followed:', { teamId, userId });
  return true;
}

/**
 * Unfollow a team
 */
export function unfollowTeam(teamId: number, userId: number | null): boolean {
  if (!userId) {
    console.log('User ID is required to unfollow a team');
    return false;
  }
  
  const follows = getAllTeamFollows();
  
  const filtered = follows.filter(
    f => !(f.team_id === teamId && f.user_id === userId)
  );

  if (filtered.length === follows.length) {
    console.log('User was not following this team');
    return false;
  }

  saveTeamFollows(filtered);
  
  console.log('✅ Team unfollowed:', { teamId, userId });
  return true;
}

/**
 * Get follower count for a team
 */
export function getTeamFollowerCount(teamId: number): number {
  const follows = getAllTeamFollows();
  return follows.filter(f => f.team_id === teamId).length;
}

/**
 * Get all user IDs following a team
 */
export function getTeamFollowerUserIds(teamId: number): number[] {
  const follows = getAllTeamFollows();
  return follows
    .filter(f => f.team_id === teamId)
    .map(f => f.user_id);
}

/**
 * Get all teams followed by a user
 */
export function getFollowedTeamIds(userId: number): number[] {
  const follows = getAllTeamFollows();
  return follows
    .filter(f => f.user_id === userId)
    .map(f => f.team_id);
}

/**
 * Toggle follow status (follow if not following, unfollow if following)
 */
export function toggleFollowTeam(teamId: number, userId: number | null): boolean {
  if (isFollowingTeam(teamId, userId)) {
    return unfollowTeam(teamId, userId);
  } else {
    return followTeam(teamId, userId);
  }
}
