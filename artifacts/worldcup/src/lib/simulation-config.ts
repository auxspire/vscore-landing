/** Default Monte Carlo runs for matchup, bracket, and rankings. */
export const DEFAULT_SIMULATIONS = 10_000;

/** Runs when Elo/form blending is active (now the default for all sims). */
export const LIVE_METRICS_SIMULATIONS = 15_000;

/** Elo/form is always on — use 15k runs for stable blended probabilities. */
export function simulationCount(_useLiveMetrics?: boolean): number {
  return LIVE_METRICS_SIMULATIONS;
}
