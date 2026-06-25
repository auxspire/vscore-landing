import { getCurrentUserId } from './auth';

export interface OwnershipMetadata {
  created_by: string; // user_id who created
  updated_by: string; // user_id who last updated
  created_at: string;
  updated_at: string;
}

export interface PlayerOwnership extends OwnershipMetadata {
  owner_user_id: string; // Current owner (transferable on verification)
}

export interface TeamOwnership extends OwnershipMetadata {
  owner_user_id: string; // Team owner (can transfer ownership)
  coordinator_user_ids: string[]; // Up to 3 coordinators (must include owner)
}

export interface TournamentOwnership extends OwnershipMetadata {
  coordinator_user_ids: string[]; // Up to 3 coordinators (must include creator)
}

// Create ownership metadata for new entities
export const createOwnershipMetadata = (): OwnershipMetadata => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to create entities');
  }

  const now = new Date().toISOString();
  return {
    created_by: userId,
    updated_by: userId,
    created_at: now,
    updated_at: now,
  };
};

// Update ownership metadata on edit
export const updateOwnershipMetadata = (existing: OwnershipMetadata): OwnershipMetadata => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to update entities');
  }

  return {
    ...existing,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
};

// ============================================
// PLAYER OWNERSHIP
// ============================================

export const createPlayerOwnership = (): PlayerOwnership => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to create players');
  }

  const now = new Date().toISOString();
  return {
    created_by: userId,
    updated_by: userId,
    created_at: now,
    updated_at: now,
    owner_user_id: userId, // Creator is initial owner
  };
};

export const canEditPlayer = (player: PlayerOwnership): boolean => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  return player.owner_user_id === userId;
};

export const transferPlayerOwnership = (
  player: PlayerOwnership,
  newOwnerId: string
): PlayerOwnership => {
  return {
    ...player,
    owner_user_id: newOwnerId,
    updated_by: newOwnerId,
    updated_at: new Date().toISOString(),
  };
};

// ============================================
// TEAM OWNERSHIP
// ============================================

export const createTeamOwnership = (): TeamOwnership => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to create teams');
  }

  const now = new Date().toISOString();
  return {
    created_by: userId,
    updated_by: userId,
    created_at: now,
    updated_at: now,
    owner_user_id: userId, // Creator is first owner
    coordinator_user_ids: [userId], // Creator is first coordinator
  };
};

export const canEditTeam = (team: TeamOwnership): boolean => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  return team.coordinator_user_ids.includes(userId);
};

export const addTeamCoordinator = (
  team: TeamOwnership,
  coordinatorId: string
): { success: boolean; error?: string; team?: TeamOwnership } => {
  if (team.coordinator_user_ids.includes(coordinatorId)) {
    return { success: false, error: 'User is already a coordinator' };
  }

  if (team.coordinator_user_ids.length >= 3) {
    return { success: false, error: 'Maximum 3 coordinators allowed' };
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'User must be authenticated' };
  }

  return {
    success: true,
    team: {
      ...team,
      coordinator_user_ids: [...team.coordinator_user_ids, coordinatorId],
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
  };
};

export const removeTeamCoordinator = (
  team: TeamOwnership,
  coordinatorId: string
): { success: boolean; error?: string; team?: TeamOwnership } => {
  if (coordinatorId === team.created_by) {
    return { success: false, error: 'Cannot remove the original creator' };
  }

  if (!team.coordinator_user_ids.includes(coordinatorId)) {
    return { success: false, error: 'User is not a coordinator' };
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'User must be authenticated' };
  }

  return {
    success: true,
    team: {
      ...team,
      coordinator_user_ids: team.coordinator_user_ids.filter(id => id !== coordinatorId),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
  };
};

export const transferTeamOwnership = (
  team: TeamOwnership,
  newOwnerId: string
): { success: boolean; error?: string; team?: TeamOwnership } => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'User must be authenticated' };
  }

  // Only current owner can transfer ownership
  if (team.owner_user_id !== userId) {
    return { success: false, error: 'Only the current owner can transfer ownership' };
  }

  // New owner must be a registered user and a coordinator
  if (!team.coordinator_user_ids.includes(newOwnerId)) {
    return { success: false, error: 'New owner must be a coordinator first' };
  }

  return {
    success: true,
    team: {
      ...team,
      owner_user_id: newOwnerId,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
  };
};

// ============================================
// TOURNAMENT OWNERSHIP
// ============================================

export const createTournamentOwnership = (): TournamentOwnership => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to create tournaments');
  }

  const now = new Date().toISOString();
  return {
    created_by: userId,
    updated_by: userId,
    created_at: now,
    updated_at: now,
    coordinator_user_ids: [userId], // Creator is first coordinator
  };
};

export const canEditTournament = (tournament: TournamentOwnership): boolean => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  return tournament.coordinator_user_ids.includes(userId);
};

export const addTournamentCoordinator = (
  tournament: TournamentOwnership,
  coordinatorId: string
): { success: boolean; error?: string; tournament?: TournamentOwnership } => {
  if (tournament.coordinator_user_ids.includes(coordinatorId)) {
    return { success: false, error: 'User is already a coordinator' };
  }

  if (tournament.coordinator_user_ids.length >= 3) {
    return { success: false, error: 'Maximum 3 coordinators allowed' };
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'User must be authenticated' };
  }

  return {
    success: true,
    tournament: {
      ...tournament,
      coordinator_user_ids: [...tournament.coordinator_user_ids, coordinatorId],
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
  };
};

export const removeTournamentCoordinator = (
  tournament: TournamentOwnership,
  coordinatorId: string
): { success: boolean; error?: string; tournament?: TournamentOwnership } => {
  if (coordinatorId === tournament.created_by) {
    return { success: false, error: 'Cannot remove the original creator' };
  }

  if (!tournament.coordinator_user_ids.includes(coordinatorId)) {
    return { success: false, error: 'User is not a coordinator' };
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'User must be authenticated' };
  }

  return {
    success: true,
    tournament: {
      ...tournament,
      coordinator_user_ids: tournament.coordinator_user_ids.filter(id => id !== coordinatorId),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const isOwner = (entity: { created_by: string }): boolean => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  return entity.created_by === userId;
};

export const isCoordinator = (
  entity: { coordinator_user_ids: string[] }
): boolean => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  return entity.coordinator_user_ids.includes(userId);
};