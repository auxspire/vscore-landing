export interface Team {
  id: string;
  name: string;
  group: string;
  fifaRanking: number;
  eloRating: number;
  confederation: string;
  flagCode: string;
}

export const TEAMS: Team[] = [
  // Group A
  { id: "usa", name: "United States", group: "A", fifaRanking: 16, eloRating: 1665, confederation: "CONCACAF", flagCode: "US" },
  { id: "portugal", name: "Portugal", group: "A", fifaRanking: 6, eloRating: 1785, confederation: "UEFA", flagCode: "PT" },
  { id: "ecuador", name: "Ecuador", group: "A", fifaRanking: 22, eloRating: 1600, confederation: "CONMEBOL", flagCode: "EC" },
  { id: "australia", name: "Australia", group: "A", fifaRanking: 23, eloRating: 1535, confederation: "AFC", flagCode: "AU" },

  // Group B
  { id: "mexico", name: "Mexico", group: "B", fifaRanking: 15, eloRating: 1630, confederation: "CONCACAF", flagCode: "MX" },
  { id: "france", name: "France", group: "B", fifaRanking: 2, eloRating: 1820, confederation: "UEFA", flagCode: "FR" },
  { id: "colombia", name: "Colombia", group: "B", fifaRanking: 11, eloRating: 1700, confederation: "CONMEBOL", flagCode: "CO" },
  { id: "japan", name: "Japan", group: "B", fifaRanking: 18, eloRating: 1610, confederation: "AFC", flagCode: "JP" },

  // Group C
  { id: "canada", name: "Canada", group: "C", fifaRanking: 38, eloRating: 1575, confederation: "CONCACAF", flagCode: "CA" },
  { id: "spain", name: "Spain", group: "C", fifaRanking: 3, eloRating: 1810, confederation: "UEFA", flagCode: "ES" },
  { id: "uruguay", name: "Uruguay", group: "C", fifaRanking: 12, eloRating: 1690, confederation: "CONMEBOL", flagCode: "UY" },
  { id: "morocco", name: "Morocco", group: "C", fifaRanking: 14, eloRating: 1670, confederation: "CAF", flagCode: "MA" },

  // Group D
  { id: "germany", name: "Germany", group: "D", fifaRanking: 13, eloRating: 1745, confederation: "UEFA", flagCode: "DE" },
  { id: "brazil", name: "Brazil", group: "D", fifaRanking: 5, eloRating: 1795, confederation: "CONMEBOL", flagCode: "BR" },
  { id: "south_korea", name: "South Korea", group: "D", fifaRanking: 24, eloRating: 1585, confederation: "AFC", flagCode: "KR" },
  { id: "senegal", name: "Senegal", group: "D", fifaRanking: 20, eloRating: 1615, confederation: "CAF", flagCode: "SN" },

  // Group E
  { id: "argentina", name: "Argentina", group: "E", fifaRanking: 1, eloRating: 1835, confederation: "CONMEBOL", flagCode: "AR" },
  { id: "england", name: "England", group: "E", fifaRanking: 4, eloRating: 1800, confederation: "UEFA", flagCode: "GB-ENG" },
  { id: "jordan", name: "Jordan", group: "E", fifaRanking: 43, eloRating: 1440, confederation: "AFC", flagCode: "JO" },
  { id: "nigeria", name: "Nigeria", group: "E", fifaRanking: 25, eloRating: 1530, confederation: "CAF", flagCode: "NG" },

  // Group F
  { id: "netherlands", name: "Netherlands", group: "F", fifaRanking: 7, eloRating: 1765, confederation: "UEFA", flagCode: "NL" },
  { id: "chile", name: "Chile", group: "F", fifaRanking: 26, eloRating: 1580, confederation: "CONMEBOL", flagCode: "CL" },
  { id: "saudi_arabia", name: "Saudi Arabia", group: "F", fifaRanking: 47, eloRating: 1480, confederation: "AFC", flagCode: "SA" },
  { id: "ivory_coast", name: "Ivory Coast", group: "F", fifaRanking: 30, eloRating: 1460, confederation: "CAF", flagCode: "CI" },

  // Group G
  { id: "belgium", name: "Belgium", group: "G", fifaRanking: 9, eloRating: 1750, confederation: "UEFA", flagCode: "BE" },
  { id: "italy", name: "Italy", group: "G", fifaRanking: 10, eloRating: 1725, confederation: "UEFA", flagCode: "IT" },
  { id: "iran", name: "Iran", group: "G", fifaRanking: 35, eloRating: 1465, confederation: "AFC", flagCode: "IR" },
  { id: "tunisia", name: "Tunisia", group: "G", fifaRanking: 37, eloRating: 1495, confederation: "CAF", flagCode: "TN" },

  // Group H
  { id: "croatia", name: "Croatia", group: "H", fifaRanking: 8, eloRating: 1645, confederation: "UEFA", flagCode: "HR" },
  { id: "switzerland", name: "Switzerland", group: "H", fifaRanking: 17, eloRating: 1635, confederation: "UEFA", flagCode: "CH" },
  { id: "qatar", name: "Qatar", group: "H", fifaRanking: 57, eloRating: 1415, confederation: "AFC", flagCode: "QA" },
  { id: "egypt", name: "Egypt", group: "H", fifaRanking: 32, eloRating: 1515, confederation: "CAF", flagCode: "EG" },

  // Group I
  { id: "scotland", name: "Scotland", group: "I", fifaRanking: 33, eloRating: 1510, confederation: "UEFA", flagCode: "GB-SCT" },
  { id: "turkey", name: "Turkey", group: "I", fifaRanking: 28, eloRating: 1545, confederation: "UEFA", flagCode: "TR" },
  { id: "panama", name: "Panama", group: "I", fifaRanking: 51, eloRating: 1425, confederation: "CONCACAF", flagCode: "PA" },
  { id: "dr_congo", name: "DR Congo", group: "I", fifaRanking: 46, eloRating: 1455, confederation: "CAF", flagCode: "CD" },

  // Group J
  { id: "poland", name: "Poland", group: "J", fifaRanking: 27, eloRating: 1550, confederation: "UEFA", flagCode: "PL" },
  { id: "denmark", name: "Denmark", group: "J", fifaRanking: 19, eloRating: 1625, confederation: "UEFA", flagCode: "DK" },
  { id: "honduras", name: "Honduras", group: "J", fifaRanking: 70, eloRating: 1405, confederation: "CONCACAF", flagCode: "HN" },
  { id: "cameroon", name: "Cameroon", group: "J", fifaRanking: 40, eloRating: 1450, confederation: "CAF", flagCode: "CM" },

  // Group K
  { id: "austria", name: "Austria", group: "K", fifaRanking: 21, eloRating: 1560, confederation: "UEFA", flagCode: "AT" },
  { id: "serbia", name: "Serbia", group: "K", fifaRanking: 29, eloRating: 1570, confederation: "UEFA", flagCode: "RS" },
  { id: "jamaica", name: "Jamaica", group: "K", fifaRanking: 62, eloRating: 1395, confederation: "CONCACAF", flagCode: "JM" },
  { id: "south_africa", name: "South Africa", group: "K", fifaRanking: 54, eloRating: 1435, confederation: "CAF", flagCode: "ZA" },

  // Group L
  { id: "new_zealand", name: "New Zealand", group: "L", fifaRanking: 92, eloRating: 1350, confederation: "OFC", flagCode: "NZ" },
  { id: "venezuela", name: "Venezuela", group: "L", fifaRanking: 59, eloRating: 1380, confederation: "IPC", flagCode: "VE" },
  { id: "indonesia", name: "Indonesia", group: "L", fifaRanking: 120, eloRating: 1320, confederation: "IPC", flagCode: "ID" },
  { id: "iraq", name: "Iraq", group: "L", fifaRanking: 58, eloRating: 1370, confederation: "AFC", flagCode: "IQ" },
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
