export interface Team {
  id: string;
  name: string;
  group: string;
  fifaRanking: number;
  eloRating: number;
  confederation: string;
  flagCode: string;
}

// Sources: FIFA World Cup 2026 official draw (December 5, 2025, JFK Center, Washington D.C.)
// FIFA World Rankings — April 1, 2026 official update
export const TEAMS: Team[] = [
  // ── Group A ────────────────────────────────────────────────────────────────
  { id: "mexico",       name: "Mexico",              group: "A", fifaRanking: 15, eloRating: 1650, confederation: "CONCACAF", flagCode: "MX" },
  { id: "south_africa", name: "South Africa",        group: "A", fifaRanking: 60, eloRating: 1295, confederation: "CAF",      flagCode: "ZA" },
  { id: "south_korea",  name: "South Korea",         group: "A", fifaRanking: 25, eloRating: 1510, confederation: "AFC",      flagCode: "KR" },
  { id: "czechia",      name: "Czechia",             group: "A", fifaRanking: 26, eloRating: 1495, confederation: "UEFA",     flagCode: "CZ" },

  // ── Group B ────────────────────────────────────────────────────────────────
  { id: "canada",       name: "Canada",              group: "B", fifaRanking: 30, eloRating: 1440, confederation: "CONCACAF", flagCode: "CA" },
  { id: "bosnia",       name: "Bosnia & Herzegovina",group: "B", fifaRanking: 65, eloRating: 1280, confederation: "UEFA",     flagCode: "BA" },
  { id: "qatar",        name: "Qatar",               group: "B", fifaRanking: 55, eloRating: 1310, confederation: "AFC",      flagCode: "QA" },
  { id: "switzerland",  name: "Switzerland",         group: "B", fifaRanking: 18, eloRating: 1610, confederation: "UEFA",     flagCode: "CH" },

  // ── Group C ────────────────────────────────────────────────────────────────
  { id: "brazil",       name: "Brazil",              group: "C", fifaRanking: 6,  eloRating: 1795, confederation: "CONMEBOL", flagCode: "BR" },
  { id: "morocco",      name: "Morocco",             group: "C", fifaRanking: 14, eloRating: 1665, confederation: "CAF",      flagCode: "MA" },
  { id: "haiti",        name: "Haiti",               group: "C", fifaRanking: 85, eloRating: 1240, confederation: "CONCACAF", flagCode: "HT" },
  { id: "scotland",     name: "Scotland",            group: "C", fifaRanking: 43, eloRating: 1355, confederation: "UEFA",     flagCode: "GB-SCT" },

  // ── Group D ────────────────────────────────────────────────────────────────
  { id: "usa",          name: "United States",       group: "D", fifaRanking: 16, eloRating: 1635, confederation: "CONCACAF", flagCode: "US" },
  { id: "paraguay",     name: "Paraguay",            group: "D", fifaRanking: 40, eloRating: 1375, confederation: "CONMEBOL", flagCode: "PY" },
  { id: "australia",    name: "Australia",           group: "D", fifaRanking: 27, eloRating: 1480, confederation: "AFC",      flagCode: "AU" },
  { id: "turkey",       name: "Türkiye",             group: "D", fifaRanking: 21, eloRating: 1565, confederation: "UEFA",     flagCode: "TR" },

  // ── Group E ────────────────────────────────────────────────────────────────
  { id: "germany",      name: "Germany",             group: "E", fifaRanking: 9,  eloRating: 1745, confederation: "UEFA",     flagCode: "DE" },
  { id: "ivory_coast",  name: "Ivory Coast",         group: "E", fifaRanking: 34, eloRating: 1400, confederation: "CAF",      flagCode: "CI" },
  { id: "ecuador",      name: "Ecuador",             group: "E", fifaRanking: 23, eloRating: 1545, confederation: "CONMEBOL", flagCode: "EC" },
  { id: "curacao",      name: "Curaçao",             group: "E", fifaRanking: 100,eloRating: 1220, confederation: "CONCACAF", flagCode: "CW" },

  // ── Group F ────────────────────────────────────────────────────────────────
  { id: "netherlands",  name: "Netherlands",         group: "F", fifaRanking: 8,  eloRating: 1760, confederation: "UEFA",     flagCode: "NL" },
  { id: "sweden",       name: "Sweden",              group: "F", fifaRanking: 17, eloRating: 1620, confederation: "UEFA",     flagCode: "SE" },
  { id: "japan",        name: "Japan",               group: "F", fifaRanking: 21, eloRating: 1560, confederation: "AFC",      flagCode: "JP" },
  { id: "tunisia",      name: "Tunisia",             group: "F", fifaRanking: 44, eloRating: 1350, confederation: "CAF",      flagCode: "TN" },

  // ── Group G ────────────────────────────────────────────────────────────────
  { id: "belgium",      name: "Belgium",             group: "G", fifaRanking: 7,  eloRating: 1775, confederation: "UEFA",     flagCode: "BE" },
  { id: "egypt",        name: "Egypt",               group: "G", fifaRanking: 28, eloRating: 1465, confederation: "CAF",      flagCode: "EG" },
  { id: "iran",         name: "Iran",                group: "G", fifaRanking: 48, eloRating: 1335, confederation: "AFC",      flagCode: "IR" },
  { id: "new_zealand",  name: "New Zealand",         group: "G", fifaRanking: 95, eloRating: 1230, confederation: "OFC",      flagCode: "NZ" },

  // ── Group H ────────────────────────────────────────────────────────────────
  { id: "spain",        name: "Spain",               group: "H", fifaRanking: 2,  eloRating: 1876, confederation: "UEFA",     flagCode: "ES" },
  { id: "cape_verde",   name: "Cape Verde",          group: "H", fifaRanking: 73, eloRating: 1265, confederation: "CAF",      flagCode: "CV" },
  { id: "saudi_arabia", name: "Saudi Arabia",        group: "H", fifaRanking: 50, eloRating: 1330, confederation: "AFC",      flagCode: "SA" },
  { id: "uruguay",      name: "Uruguay",             group: "H", fifaRanking: 13, eloRating: 1680, confederation: "CONMEBOL", flagCode: "UY" },

  // ── Group I ────────────────────────────────────────────────────────────────
  { id: "france",       name: "France",              group: "I", fifaRanking: 1,  eloRating: 1877, confederation: "UEFA",     flagCode: "FR" },
  { id: "senegal",      name: "Senegal",             group: "I", fifaRanking: 19, eloRating: 1590, confederation: "CAF",      flagCode: "SN" },
  { id: "iraq",         name: "Iraq",                group: "I", fifaRanking: 67, eloRating: 1280, confederation: "AFC",      flagCode: "IQ" },
  { id: "norway",       name: "Norway",              group: "I", fifaRanking: 31, eloRating: 1425, confederation: "UEFA",     flagCode: "NO" },

  // ── Group J ────────────────────────────────────────────────────────────────
  { id: "argentina",    name: "Argentina",           group: "J", fifaRanking: 3,  eloRating: 1855, confederation: "CONMEBOL", flagCode: "AR" },
  { id: "algeria",      name: "Algeria",             group: "J", fifaRanking: 28, eloRating: 1470, confederation: "CAF",      flagCode: "DZ" },
  { id: "austria",      name: "Austria",             group: "J", fifaRanking: 20, eloRating: 1575, confederation: "UEFA",     flagCode: "AT" },
  { id: "jordan",       name: "Jordan",              group: "J", fifaRanking: 65, eloRating: 1285, confederation: "AFC",      flagCode: "JO" },

  // ── Group K ────────────────────────────────────────────────────────────────
  { id: "portugal",     name: "Portugal",            group: "K", fifaRanking: 5,  eloRating: 1805, confederation: "UEFA",     flagCode: "PT" },
  { id: "dr_congo",     name: "DR Congo",            group: "K", fifaRanking: 55, eloRating: 1310, confederation: "CAF",      flagCode: "CD" },
  { id: "uzbekistan",   name: "Uzbekistan",          group: "K", fifaRanking: 78, eloRating: 1255, confederation: "AFC",      flagCode: "UZ" },
  { id: "colombia",     name: "Colombia",            group: "K", fifaRanking: 12, eloRating: 1695, confederation: "CONMEBOL", flagCode: "CO" },

  // ── Group L ────────────────────────────────────────────────────────────────
  { id: "england",      name: "England",             group: "L", fifaRanking: 4,  eloRating: 1820, confederation: "UEFA",     flagCode: "GB-ENG" },
  { id: "croatia",      name: "Croatia",             group: "L", fifaRanking: 10, eloRating: 1720, confederation: "UEFA",     flagCode: "HR" },
  { id: "ghana",        name: "Ghana",               group: "L", fifaRanking: 53, eloRating: 1320, confederation: "CAF",      flagCode: "GH" },
  { id: "panama",       name: "Panama",              group: "L", fifaRanking: 68, eloRating: 1278, confederation: "CONCACAF", flagCode: "PA" },
];

export const TEAMS_BY_ID: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t])
);

export const GROUPS: Record<string, Team[]> = TEAMS.reduce<Record<string, Team[]>>(
  (acc, team) => {
    if (!acc[team.group]) acc[team.group] = [];
    acc[team.group].push(team);
    return acc;
  },
  {}
);
