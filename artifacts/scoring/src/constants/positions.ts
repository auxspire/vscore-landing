// Unified list of player positions used across the app
export const POSITIONS = [
  'Goalkeeper',
  'Right Back',
  'Left Back',
  'Centre Back',
  'Defensive Midfielder',
  'Central Midfielder',
  'Attacking Midfielder',
  'Right Winger',
  'Left Winger',
  'Striker',
  'Centre Forward'
] as const;

export type Position = typeof POSITIONS[number];
