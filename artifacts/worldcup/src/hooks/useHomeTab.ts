import { useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";

export type HomeTab = "bracket" | "fixtures";

export type FixturesSection = "matches" | "tables" | "scorers";
export type ScheduleViewParam = "today" | "upcoming" | "results" | "team";

const VALID: HomeTab[] = ["bracket", "fixtures"];
const VALID_SECTIONS: FixturesSection[] = ["matches", "tables", "scorers"];
const VALID_VIEWS: ScheduleViewParam[] = ["today", "upcoming", "results", "team"];

function parseSearch(search: string) {
  const qs = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(qs);
}

function parseTab(search: string): HomeTab {
  const raw = parseSearch(search).get("tab");
  // Legacy URLs: predictor, path → bracket
  if (raw === "fixtures") return "fixtures";
  if (raw === "predictor" || raw === "path" || raw === "bracket") return "bracket";
  if (raw && VALID.includes(raw as HomeTab)) return raw as HomeTab;
  return "bracket";
}

function buildLocation(sp: URLSearchParams): string {
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

export function useHomeTab() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  const tab = useMemo(() => parseTab(search), [search]);

  const setTab = useCallback(
    (next: HomeTab) => {
      const sp = parseSearch(search);
      if (next === "bracket") {
        sp.delete("tab");
        sp.delete("section");
        sp.delete("view");
        sp.delete("team");
        sp.delete("lockStage");
        sp.delete("lockOpp");
        sp.delete("lockFinish");
      } else {
        sp.set("tab", next);
      }
      setLocation(buildLocation(sp));
    },
    [search, setLocation],
  );

  /** Open Schedule tab on group tables, focused on one group letter. */
  const openStandingsForGroup = useCallback(
    (group: string) => {
      const sp = parseSearch(search);
      sp.set("tab", "fixtures");
      sp.set("section", "tables");
      sp.set("group", group.toUpperCase());
      setLocation(buildLocation(sp));
    },
    [search, setLocation],
  );

  /** Switch to bracket tab and highlight a team's knockout slot or match. */
  const openTeamInBracket = useCallback(
    (teamId: string) => {
      const sp = parseSearch(search);
      sp.delete("tab");
      sp.delete("section");
      sp.delete("group");
      sp.delete("view");
      sp.set("team", teamId);
      setLocation(buildLocation(sp));
    },
    [search, setLocation],
  );

  /** Keep fixtures tab URL in sync with in-panel navigation (shareable deep links). */
  const syncFixturesUrl = useCallback(
    (params: {
      section?: FixturesSection;
      view?: ScheduleViewParam;
      group?: string | null;
    }) => {
      const sp = parseSearch(search);
      sp.set("tab", "fixtures");
      sp.delete("team");

      if (params.section !== undefined) {
        if (params.section === "matches") sp.delete("section");
        else sp.set("section", params.section);
      }

      if (params.view !== undefined) {
        if (params.view === "today") sp.delete("view");
        else sp.set("view", params.view);
      }

      if (params.group !== undefined) {
        if (params.group) sp.set("group", params.group.toUpperCase());
        else sp.delete("group");
      }

      setLocation(buildLocation(sp));
    },
    [search, setLocation],
  );

  return {
    tab,
    setTab,
    openStandingsForGroup,
    openTeamInBracket,
    syncFixturesUrl,
  };
}

export function homeTabFromSearch(search: string): HomeTab {
  return parseTab(search);
}

export function fixturesSectionFromSearch(search: string): FixturesSection {
  const raw = parseSearch(search).get("section");
  if (raw && VALID_SECTIONS.includes(raw as FixturesSection)) return raw as FixturesSection;
  return "matches";
}

export function scheduleViewFromSearch(search: string): ScheduleViewParam {
  const raw = parseSearch(search).get("view");
  if (raw && VALID_VIEWS.includes(raw as ScheduleViewParam)) return raw as ScheduleViewParam;
  return "today";
}

/** Merge target tab into an existing query string. */
export function hubTabHref(currentSearch: string, tab: HomeTab): string {
  const sp = parseSearch(currentSearch);
  if (tab === "bracket") {
    sp.delete("tab");
    sp.delete("section");
    sp.delete("team");
  } else {
    sp.set("tab", tab);
  }
  return buildLocation(sp);
}
