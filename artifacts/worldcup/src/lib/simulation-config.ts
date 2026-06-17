/** Default Monte Carlo runs for matchup, bracket, and rankings. */
export const DEFAULT_SIMULATIONS = 10_000;

/** Extra runs when live standings & form adjust Elo — stabilizes blended probabilities. */
export const LIVE_METRICS_SIMULATIONS = 15_000;

export function simulationCount(useLiveMetrics?: boolean): number {
  return useLiveMetrics ? LIVE_METRICS_SIMULATIONS : DEFAULT_SIMULATIONS;
}
