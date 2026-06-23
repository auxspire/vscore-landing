// Player Rating Calculation System for VScor
// Context-aware, time-normalized rating system with dynamic impact factors

export interface PlayerPoints {
  playerId: number;
  playerName: string;
  points: number;
  rating: number;
  breakdown: PointsBreakdown;
  minutesPlayed: number;
}

export interface PointsBreakdown {
  goals: { count: number; points: number; details: string[] };
  assists: { count: number; points: number };
  shotsOnTarget: { count: number; points: number };
  shotsOffTarget: { count: number; points: number; details: string[] };
  saves: { count: number; points: number };
  blocks: { count: number; points: number };
  interceptions: { count: number; points: number };
  yellowCards: { count: number; points: number };
  redCards: { count: number; points: number };
  fouls: { count: number; points: number };
  ownGoals: { count: number; points: number };
  missedPenalties: { count: number; points: number };
  playingTime: { minutes: number; points: number };
}

// Base rating and action point values
const BASE_RATING = 6.0;

const ACTION_POINTS = {
  SHOT_ON_TARGET: 0.15,
  SHOT_OFF_TARGET: -0.05,
  HIT_POST_BAR: 0.05,
  INTERCEPTION: 0.15,
  FOUL_NO_CARD: -0.05,
  YELLOW_CARD: -0.4,
  RED_CARD: -1.5,
  OWN_GOAL: -1.2,
  BLOCK: 0.1,
  // Special goal types (added to goal impact)
  LONG_SHOT: 0.2,
  SOLO_GOAL: 0.2,
  ACROBATIC: 0.2,
  CORNER_GOAL: 0.2,
  FREE_KICK: 0.1,
  HEADER: 0.1,
};

// Match result multipliers
const RESULT_MULTIPLIER = {
  WIN: 1.05,
  DRAW: 1.0,
  LOSS: 0.95,
};

// Rating limits
const MIN_RATING = 4.5;
const MAX_RATING = 9.8;
const RED_CARD_CAP = 5.5;

/**
 * Parse time string (e.g., "45:30" or "67'") to minutes
 */
const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  // Remove apostrophe if present
  timeStr = timeStr.replace("'", '');
  
  // Check if it contains ':'
  if (timeStr.includes(':')) {
    const [mins, secs] = timeStr.split(':').map(Number);
    return mins + (secs / 60);
  }
  
  // Otherwise it's just minutes
  return parseFloat(timeStr) || 0;
};

/**
 * Calculate minutes played for a player
 */
const calculateMinutesPlayed = (
  player: any,
  events: any[],
  matchDuration: number
): number => {
  let timePlayedMinutes = matchDuration; // Assume full match
  
  // Check if player was substituted out (check both 'substitute' and 'substitution' for compatibility)
  const subOutEvent = events.find((e: any) => 
    (e.type === 'substitute' || e.type === 'substitution') && e.playerOut?.id === player.id
  );
  
  // Check if player was substituted in (check both 'substitute' and 'substitution' for compatibility)
  const subInEvent = events.find((e: any) => 
    (e.type === 'substitute' || e.type === 'substitution') && e.playerIn?.id === player.id
  );
  
  if (subOutEvent && subInEvent) {
    // Player was both subbed in and out
    const timeIn = parseTimeToMinutes(subInEvent.time);
    const timeOut = parseTimeToMinutes(subOutEvent.time);
    timePlayedMinutes = timeOut - timeIn;
  } else if (subOutEvent) {
    // Player started but was subbed out
    timePlayedMinutes = parseTimeToMinutes(subOutEvent.time);
  } else if (subInEvent) {
    // Player was subbed in
    const timeIn = parseTimeToMinutes(subInEvent.time);
    timePlayedMinutes = matchDuration - timeIn;
  }
  
  return timePlayedMinutes;
};

/**
 * Get goal type bonus points
 */
const getGoalTypeBonus = (goalType: string): number => {
  const type = goalType?.toLowerCase() || '';
  
  if (type.includes('long') || type.includes('long shot')) return ACTION_POINTS.LONG_SHOT;
  if (type.includes('solo')) return ACTION_POINTS.SOLO_GOAL;
  if (type.includes('acrobatic')) return ACTION_POINTS.ACROBATIC;
  if (type.includes('corner')) return ACTION_POINTS.CORNER_GOAL;
  if (type.includes('free') || type.includes('freekick')) return ACTION_POINTS.FREE_KICK;
  if (type.includes('header')) return ACTION_POINTS.HEADER;
  
  return 0;
};

/**
 * Calculate context-aware player ratings
 */
export const calculatePlayerRatings = (
  match: any
): PlayerPoints[] => {
  const { 
    events = [], 
    penaltyEvents = [], 
    team1Squad = [], 
    team2Squad = [],
    duration = 90,
    scoreA = 0,
    scoreB = 0,
    teamA = '',
    teamB = ''
  } = match;
  
  // Combine all players from both squads
  const allPlayers = [...team1Squad, ...team2Squad];
  
  // Calculate team statistics needed for dynamic impacts
  let team1Goals = 0;
  let team2Goals = 0;
  let team1ShotsOnTarget = 0;
  let team2ShotsOnTarget = 0;
  
  events.forEach((event: any) => {
    if (event.type === 'goal' && !event.ownGoal) {
      if (event.team === 1) team1Goals++;
      else if (event.team === 2) team2Goals++;
    }
    if (event.type === 'shot_on_target') {
      if (event.team === 1) team1ShotsOnTarget++;
      else if (event.team === 2) team2ShotsOnTarget++;
    }
  });
  
  // Initialize points map for each player
  const playerPointsMap = new Map<number, {
    player: any;
    team: number;
    breakdown: PointsBreakdown;
    rawActionScore: number;
    minutesPlayed: number;
    hasRedCard: boolean;
  }>();
  
  // Initialize all players who played
  team1Squad.forEach(player => {
    playerPointsMap.set(player.id, {
      player,
      team: 1,
      breakdown: {
        goals: { count: 0, points: 0, details: [] },
        assists: { count: 0, points: 0 },
        shotsOnTarget: { count: 0, points: 0 },
        shotsOffTarget: { count: 0, points: 0, details: [] },
        saves: { count: 0, points: 0 },
        blocks: { count: 0, points: 0 },
        interceptions: { count: 0, points: 0 },
        yellowCards: { count: 0, points: 0 },
        redCards: { count: 0, points: 0 },
        fouls: { count: 0, points: 0 },
        ownGoals: { count: 0, points: 0 },
        missedPenalties: { count: 0, points: 0 },
        playingTime: { minutes: 0, points: 0 }
      },
      rawActionScore: 0,
      minutesPlayed: 0,
      hasRedCard: false
    });
  });
  
  team2Squad.forEach(player => {
    playerPointsMap.set(player.id, {
      player,
      team: 2,
      breakdown: {
        goals: { count: 0, points: 0, details: [] },
        assists: { count: 0, points: 0 },
        shotsOnTarget: { count: 0, points: 0 },
        shotsOffTarget: { count: 0, points: 0, details: [] },
        saves: { count: 0, points: 0 },
        blocks: { count: 0, points: 0 },
        interceptions: { count: 0, points: 0 },
        yellowCards: { count: 0, points: 0 },
        redCards: { count: 0, points: 0 },
        fouls: { count: 0, points: 0 },
        ownGoals: { count: 0, points: 0 },
        missedPenalties: { count: 0, points: 0 },
        playingTime: { minutes: 0, points: 0 }
      },
      rawActionScore: 0,
      minutesPlayed: 0,
      hasRedCard: false
    });
  });
  
  // Process regular match events
  events.forEach((event: any) => {
    const playerId = event.player?.id;
    if (!playerId || !playerPointsMap.has(playerId)) return;
    
    const playerData = playerPointsMap.get(playerId)!;
    const breakdown = playerData.breakdown;
    const playerTeam = playerData.team;
    
    // Determine team goals for dynamic impact
    const teamGoals = playerTeam === 1 ? team1Goals : team2Goals;
    
    switch (event.type) {
      case 'goal':
        if (!event.ownGoal) {
          // Goal Impact = 1.2 × (1 / TeamTotalGoals)
          const goalImpact = teamGoals > 0 ? 1.2 * (1 / teamGoals) : 1.2;
          const goalTypeBonus = getGoalTypeBonus(event.goalType);
          const totalGoalPoints = goalImpact + goalTypeBonus;
          
          breakdown.goals.count++;
          breakdown.goals.points += totalGoalPoints;
          breakdown.goals.details.push(event.goalType || 'Normal Goal');
        } else {
          // Own goal - negative points
          breakdown.ownGoals.count++;
          breakdown.ownGoals.points += ACTION_POINTS.OWN_GOAL;
        }
        
        // Process assist
        if (event.assist?.id && playerPointsMap.has(event.assist.id)) {
          const assistPlayerData = playerPointsMap.get(event.assist.id)!;
          const assistTeam = assistPlayerData.team;
          const assistTeamGoals = assistTeam === 1 ? team1Goals : team2Goals;
          
          // Assist Impact = 0.8 × (1 / TeamTotalGoals)
          const assistImpact = assistTeamGoals > 0 ? 0.8 * (1 / assistTeamGoals) : 0.8;
          
          assistPlayerData.breakdown.assists.count++;
          assistPlayerData.breakdown.assists.points += assistImpact;
        }
        break;
        
      case 'shot_on_target':
        breakdown.shotsOnTarget.count++;
        breakdown.shotsOnTarget.points += ACTION_POINTS.SHOT_ON_TARGET;
        
        // Check if shot was saved
        if (event.shotOnTargetOutcome === 'Saved' && event.savedBy?.id) {
          if (playerPointsMap.has(event.savedBy.id)) {
            const goalkeeperData = playerPointsMap.get(event.savedBy.id)!;
            const gkTeam = goalkeeperData.team;
            const opponentShotsOnTarget = gkTeam === 1 ? team2ShotsOnTarget : team1ShotsOnTarget;
            
            // Save Impact = 0.2 × (1 / OpponentTotalShotsOnGoal)
            const saveImpact = opponentShotsOnTarget > 0 ? 0.2 * (1 / opponentShotsOnTarget) : 0;
            
            goalkeeperData.breakdown.saves.count++;
            goalkeeperData.breakdown.saves.points += saveImpact;
          }
        }
        
        // Check if shot was blocked
        if (event.shotOnTargetOutcome === 'Blocked' && event.blockedBy?.id) {
          if (playerPointsMap.has(event.blockedBy.id)) {
            const blockerData = playerPointsMap.get(event.blockedBy.id)!;
            blockerData.breakdown.blocks.count++;
            blockerData.breakdown.blocks.points += ACTION_POINTS.BLOCK;
          }
        }
        break;
        
      case 'off_target':
        breakdown.shotsOffTarget.count++;
        const offTargetPoints = event.shotOffTargetOutcome === 'Post/Bar' 
          ? ACTION_POINTS.HIT_POST_BAR
          : ACTION_POINTS.SHOT_OFF_TARGET;
        breakdown.shotsOffTarget.points += offTargetPoints;
        breakdown.shotsOffTarget.details.push(event.shotOffTargetOutcome || 'Other');
        break;
      
      case 'interception':
        breakdown.interceptions.count++;
        breakdown.interceptions.points += ACTION_POINTS.INTERCEPTION;
        break;
        
      case 'foul':
        breakdown.fouls.count++;
        
        // Check for cards
        if (event.yellowCard) {
          breakdown.yellowCards.count++;
          breakdown.yellowCards.points += ACTION_POINTS.YELLOW_CARD;
        } else if (event.redCard) {
          breakdown.redCards.count++;
          breakdown.redCards.points += ACTION_POINTS.RED_CARD;
          playerData.hasRedCard = true;
        } else {
          // Foul with no card
          breakdown.fouls.points += ACTION_POINTS.FOUL_NO_CARD;
        }
        break;
        
      case 'penalty':
        // Only count missed penalties from regular time
        if (event.penaltyOutcome === 'Missed' || event.penaltyOutcome === 'Saved') {
          breakdown.missedPenalties.count++;
          breakdown.missedPenalties.points += ACTION_POINTS.SHOT_OFF_TARGET; // Using -0.05 for missed penalty
        }
        break;
    }
  });
  
  // Process penalty shootout events - ONLY count saves
  penaltyEvents?.forEach((event: any) => {
    if (event.outcome === 'Saved' && event.goalkeeper?.id) {
      if (playerPointsMap.has(event.goalkeeper.id)) {
        const goalkeeperData = playerPointsMap.get(event.goalkeeper.id)!;
        // In penalty shootout, we give a flat save impact of 0.2
        goalkeeperData.breakdown.saves.count++;
        goalkeeperData.breakdown.saves.points += 0.2;
      }
    }
  });
  
  // Calculate minutes played for each player
  allPlayers.forEach(player => {
    const playerData = playerPointsMap.get(player.id);
    if (!playerData) return;
    
    const minutesPlayed = calculateMinutesPlayed(player, events, duration);
    playerData.minutesPlayed = minutesPlayed;
    playerData.breakdown.playingTime.minutes = minutesPlayed;
  });
  
  // Calculate raw action score for each player
  playerPointsMap.forEach((playerData) => {
    const b = playerData.breakdown;
    playerData.rawActionScore = 
      b.goals.points +
      b.assists.points +
      b.shotsOnTarget.points +
      b.shotsOffTarget.points +
      b.saves.points +
      b.blocks.points +
      b.interceptions.points +
      b.yellowCards.points +
      b.redCards.points +
      b.fouls.points +
      b.ownGoals.points +
      b.missedPenalties.points;
  });
  
  // Calculate final ratings
  const playerRatings: PlayerPoints[] = [];
  const totalMatchMinutes = duration;
  
  playerPointsMap.forEach((playerData) => {
    const { player, team, rawActionScore, minutesPlayed, hasRedCard, breakdown } = playerData;
    
    // If MinutesPlayed = 0 → rating = null
    if (minutesPlayed === 0) {
      playerRatings.push({
        playerId: player.id,
        playerName: player.name,
        points: rawActionScore,
        rating: 0, // Will be displayed as N/A
        breakdown,
        minutesPlayed
      });
      return;
    }
    
    // PerMinuteImpact = RawActionScore / MinutesPlayed
    const perMinuteImpact = rawActionScore / minutesPlayed;
    
    // TimeAdjustedScore = PerMinuteImpact × TotalMatchMinutes
    let timeAdjustedScore = perMinuteImpact * totalMatchMinutes;
    
    // If MinutesPlayed < 20% of TotalMatchMinutes: TimeAdjustedScore × 0.85
    const twentyPercentOfMatch = totalMatchMinutes * 0.2;
    if (minutesPlayed < twentyPercentOfMatch) {
      timeAdjustedScore = timeAdjustedScore * 0.85;
    }
    
    // Add time-adjusted score to base rating
    let finalRating = BASE_RATING + timeAdjustedScore;
    
    // Apply match result multiplier
    let resultMultiplier = RESULT_MULTIPLIER.DRAW; // Default to draw
    
    if (team === 1) {
      if (scoreA > scoreB) resultMultiplier = RESULT_MULTIPLIER.WIN;
      else if (scoreA < scoreB) resultMultiplier = RESULT_MULTIPLIER.LOSS;
    } else if (team === 2) {
      if (scoreB > scoreA) resultMultiplier = RESULT_MULTIPLIER.WIN;
      else if (scoreB < scoreA) resultMultiplier = RESULT_MULTIPLIER.LOSS;
    }
    
    finalRating = finalRating * resultMultiplier;
    
    // Apply red card cap
    if (hasRedCard) {
      finalRating = Math.min(finalRating, RED_CARD_CAP);
    }
    
    // Apply min/max caps
    finalRating = Math.max(MIN_RATING, Math.min(MAX_RATING, finalRating));
    
    // Round to 1 decimal place
    finalRating = Math.round(finalRating * 10) / 10;
    
    playerRatings.push({
      playerId: player.id,
      playerName: player.name,
      points: rawActionScore,
      rating: finalRating,
      breakdown,
      minutesPlayed
    });
  });
  
  // Sort by rating (highest first)
  playerRatings.sort((a, b) => b.rating - a.rating);
  
  return playerRatings;
};

/**
 * Format points breakdown for display
 */
export const formatPointsBreakdown = (breakdown: PointsBreakdown): string[] => {
  const items: string[] = [];
  
  if (breakdown.goals.count > 0) {
    const goalDetails = breakdown.goals.details.join(', ');
    items.push(`${breakdown.goals.count} goal${breakdown.goals.count > 1 ? 's' : ''} (${goalDetails}): ${breakdown.goals.points > 0 ? '+' : ''}${breakdown.goals.points.toFixed(2)} pts`);
  }
  
  if (breakdown.assists.count > 0) {
    items.push(`${breakdown.assists.count} assist${breakdown.assists.count > 1 ? 's' : ''}: +${breakdown.assists.points.toFixed(2)} pts`);
  }
  
  if (breakdown.shotsOnTarget.count > 0) {
    items.push(`${breakdown.shotsOnTarget.count} shot${breakdown.shotsOnTarget.count > 1 ? 's' : ''} on target: +${breakdown.shotsOnTarget.points.toFixed(2)} pts`);
  }
  
  if (breakdown.shotsOffTarget.count > 0) {
    const sign = breakdown.shotsOffTarget.points >= 0 ? '+' : '';
    items.push(`${breakdown.shotsOffTarget.count} shot${breakdown.shotsOffTarget.count > 1 ? 's' : ''} off target: ${sign}${breakdown.shotsOffTarget.points.toFixed(2)} pts`);
  }
  
  if (breakdown.saves.count > 0) {
    items.push(`${breakdown.saves.count} save${breakdown.saves.count > 1 ? 's' : ''}: +${breakdown.saves.points.toFixed(2)} pts`);
  }
  
  if (breakdown.blocks.count > 0) {
    items.push(`${breakdown.blocks.count} block${breakdown.blocks.count > 1 ? 's' : ''}: +${breakdown.blocks.points.toFixed(2)} pts`);
  }
  
  if (breakdown.interceptions.count > 0) {
    items.push(`${breakdown.interceptions.count} interception${breakdown.interceptions.count > 1 ? 's' : ''}: +${breakdown.interceptions.points.toFixed(2)} pts`);
  }
  
  if (breakdown.yellowCards.count > 0) {
    items.push(`${breakdown.yellowCards.count} yellow card${breakdown.yellowCards.count > 1 ? 's' : ''}: ${breakdown.yellowCards.points.toFixed(2)} pts`);
  }
  
  if (breakdown.redCards.count > 0) {
    items.push(`${breakdown.redCards.count} red card${breakdown.redCards.count > 1 ? 's' : ''}: ${breakdown.redCards.points.toFixed(2)} pts`);
  }
  
  if (breakdown.fouls.count > 0) {
    const sign = breakdown.fouls.points >= 0 ? '+' : '';
    items.push(`${breakdown.fouls.count} foul${breakdown.fouls.count > 1 ? 's' : ''}: ${sign}${breakdown.fouls.points.toFixed(2)} pts`);
  }
  
  if (breakdown.ownGoals.count > 0) {
    items.push(`${breakdown.ownGoals.count} own goal${breakdown.ownGoals.count > 1 ? 's' : ''}: ${breakdown.ownGoals.points.toFixed(2)} pts`);
  }
  
  if (breakdown.missedPenalties.count > 0) {
    items.push(`${breakdown.missedPenalties.count} missed penalt${breakdown.missedPenalties.count > 1 ? 'ies' : 'y'}: ${breakdown.missedPenalties.points.toFixed(2)} pts`);
  }
  
  if (breakdown.playingTime.minutes > 0) {
    items.push(`Playing time: ${Math.round(breakdown.playingTime.minutes)}min`);
  }
  
  return items;
};