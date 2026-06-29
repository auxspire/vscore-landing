import { useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";

export type HomeTab = "bracket" | "fixtures";

const VALID: HomeTab[] = ["bracket", "fixtures"];

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

  return {
    tab,
    setTab,
    openStandingsForGroup,
  };
}

export function homeTabFromSearch(search: string): HomeTab {
  return parseTab(search);
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
