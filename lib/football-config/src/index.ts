export const WORLD_CUP26_CONFIG = {
  provider: "worldcup26" as const,
  competitionKey: "worldcup",
  baseUrl: process.env.WORLD_CUP26_BASE_URL ?? "https://worldcup26.ir",
  jwtToken: process.env.WORLD_CUP26_JWT_TOKEN,
  authEmail: process.env.WORLD_CUP26_AUTH_EMAIL,
  authPassword: process.env.WORLD_CUP26_AUTH_PASSWORD,
  /** Soft daily cap — upstream ~500/min; stay conservative (~48 games + 24 groups + 1 teams/day) */
  dailySoftLimit: Number(process.env.WORLD_CUP26_DAILY_SOFT_LIMIT ?? 200),
  syncIntervalsMs: {
    games: 15 * 60 * 1000,
    groups: 15 * 60 * 1000,
    teams: 24 * 60 * 60 * 1000,
  },
  endpoints: {
    games: "/get/games",
    groups: "/get/groups",
    teams: "/get/teams",
    authenticate: "/auth/authenticate",
  },
} as const;

export type SyncJobName = "games" | "groups" | "teams";

export const SYNC_JOBS: SyncJobName[] = ["games", "groups", "teams"];
