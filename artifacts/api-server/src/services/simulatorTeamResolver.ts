import { TEAMS, type Team } from "../data/teams";

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

const BY_FIFA = new Map<string, Team>();
const BY_NAME = new Map<string, Team>();

for (const team of TEAMS) {
  BY_FIFA.set(team.flagCode.toUpperCase(), team);
  const base = team.flagCode.split("-")[0]?.toUpperCase();
  if (base && !BY_FIFA.has(base)) BY_FIFA.set(base, team);
  BY_NAME.set(normalizeName(team.name), team);
  BY_NAME.set(normalizeName(team.id.replace(/_/g, " ")), team);
}

const NAME_ALIASES: Record<string, string> = {
  unitedstates: "usa",
  usa: "usa",
  korearepublic: "southkorea",
  southkorea: "southkorea",
  koreasouth: "southkorea",
  cotedivoire: "ivorycoast",
  ivorycoast: "ivorycoast",
  turkiye: "turkey",
  turkey: "turkey",
  bosniaandherzegovina: "bosnia",
  bosniaherzegovina: "bosnia",
  curacao: "curacao",
  capeverde: "capeverde",
  saudiarabia: "saudiarabia",
  drcongo: "drcongo",
  democraticrepublicofthecongo: "drcongo",
  congo: "drcongo",
  czechrepublic: "czechia",
  czechia: "czechia",
};

function teamByNormalizedName(norm: string): Team | null {
  const idHint = NAME_ALIASES[norm];
  if (idHint) {
    const fromAlias = TEAMS.find((t) => normalizeName(t.id.replace(/_/g, "")) === idHint);
    if (fromAlias) return fromAlias;
  }
  return BY_NAME.get(norm) ?? null;
}

export function resolveSimulatorTeam(input: {
  fifaCode?: string | null;
  nameEn?: string | null;
}): Team | null {
  if (input.fifaCode) {
    const code = input.fifaCode.toUpperCase();
    const team = BY_FIFA.get(code) ?? BY_FIFA.get(code.split("-")[0] ?? "");
    if (team) return team;
  }
  if (input.nameEn) {
    return teamByNormalizedName(normalizeName(input.nameEn));
  }
  return null;
}
