import { fetchLatestFixtures, fetchLatestFootballLive } from "../services/football-live";

export { mapGameToFixtureDto } from "../services/football-live";
export type { FootballFixtureDto } from "../services/football-live";

// Re-export for any legacy imports
export { fetchLatestFixtures } from "../services/football-live";
