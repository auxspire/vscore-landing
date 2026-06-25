/**
 * Player Follow System for VScor
 * Manages follow/unfollow relationships between users and players
 */

export interface PlayerFollow {
  player_id: number;
  user_id: number;
  followed_at: string;
}

const STORAGE_KEY = 'vscor_player_follows';

/**
 * Get all player follows from localStorage
 */
export function getAllPlayerFollows(): PlayerFollow[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading player follows:', error);
  }
  return [];
}

/**
 * Save player follows to localStorage
 */
function savePlayerFollows(follows: PlayerFollow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(follows));
  } catch (error) {
    console.error('Error saving player follows:', error);
  }
}

/**
 * Check if a user is following a player
 */
export function isFollowingPlayer(playerId: number, userId: number | null): boolean {
  if (!userId) return false;
  const follows = getAllPlayerFollows();
  return follows.some(
    f => f.player_id === playerId && f.user_id === userId
  );
}

/**
 * Follow a player
 */
export function followPlayer(playerId: number, userId: number | null): boolean {
  if (!userId) {
    console.log('User ID is required to follow a player');
    return false;
  }
  
  // Check if already following
  if (isFollowingPlayer(playerId, userId)) {
    console.log('User already follows this player');
    return false;
  }

  const follows = getAllPlayerFollows();
  
  const newFollow: PlayerFollow = {
    player_id: playerId,
    user_id: userId,
    followed_at: new Date().toISOString()
  };

  follows.push(newFollow);
  savePlayerFollows(follows);
  
  console.log('✅ Player followed:', { playerId, userId });
  return true;
}

/**
 * Unfollow a player
 */
export function unfollowPlayer(playerId: number, userId: number | null): boolean {
  if (!userId) {
    console.log('User ID is required to unfollow a player');
    return false;
  }
  
  const follows = getAllPlayerFollows();
  
  const filtered = follows.filter(
    f => !(f.player_id === playerId && f.user_id === userId)
  );

  if (filtered.length === follows.length) {
    console.log('User was not following this player');
    return false;
  }

  savePlayerFollows(filtered);
  
  console.log('✅ Player unfollowed:', { playerId, userId });
  return true;
}

/**
 * Get follower count for a player
 */
export function getPlayerFollowerCount(playerId: number): number {
  const follows = getAllPlayerFollows();
  return follows.filter(f => f.player_id === playerId).length;
}

/**
 * Get all user IDs following a player
 */
export function getPlayerFollowerUserIds(playerId: number): number[] {
  const follows = getAllPlayerFollows();
  return follows
    .filter(f => f.player_id === playerId)
    .map(f => f.user_id);
}

/**
 * Get all players followed by a user
 */
export function getFollowedPlayerIds(userId: number): number[] {
  const follows = getAllPlayerFollows();
  return follows
    .filter(f => f.user_id === userId)
    .map(f => f.player_id);
}

/**
 * Toggle follow status (follow if not following, unfollow if following)
 */
export function toggleFollowPlayer(playerId: number, userId: number | null): boolean {
  if (isFollowingPlayer(playerId, userId)) {
    return unfollowPlayer(playerId, userId);
  } else {
    return followPlayer(playerId, userId);
  }
}