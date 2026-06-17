import { useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";

export type HomeTab = "predictor" | "path" | "fixtures";
export type PathSection = "bracket" | "rankings";

const VALID: HomeTab[] = ["predictor", "path", "fixtures"];

function parseSearch(search: string) {
  const qs = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(qs);
}

function parseTab(search: string): HomeTab {
  const raw = parseSearch(search).get("tab");
  if (raw && VALID.includes(raw as HomeTab)) return raw as HomeTab;
  return "predictor";
}

function parsePathSection(search: string): PathSection {
  const raw = parseSearch(search).get("section");
  return raw === "rankings" ? "rankings" : "bracket";
}

function parsePathTeam(search: string): string {
  return parseSearch(search).get("team") ?? "";
}

export function useHomeTab() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  const tab = useMemo(() => parseTab(search), [search]);
  const pathSection = useMemo(() => parsePathSection(search), [search]);
  const pathTeam = useMemo(() => parsePathTeam(search), [search]);

  const setTab = useCallback(
    (next: HomeTab) => {
      if (next === "predictor") {
        setLocation("/");
        return;
      }
      setLocation(`/?tab=${next}`);
    },
    [setLocation],
  );

  const setPathSection = useCallback(
    (section: PathSection) => {
      const sp = parseSearch(search);
      sp.set("tab", "path");
      sp.set("section", section);
      setLocation(`/?${sp.toString()}`);
    },
    [search, setLocation],
  );

  const setPathTeam = useCallback(
    (teamId: string) => {
      const sp = parseSearch(search);
      sp.set("tab", "path");
      if (!sp.get("section")) sp.set("section", "bracket");
      if (teamId) sp.set("team", teamId);
      else sp.delete("team");
      setLocation(`/?${sp.toString()}`);
    },
    [search, setLocation],
  );

  const openBracketForTeam = useCallback(
    (teamId: string) => {
      const sp = parseSearch(search);
      sp.set("tab", "path");
      sp.set("section", "bracket");
      sp.set("team", teamId);
      setLocation(`/?${sp.toString()}`);
    },
    [search, setLocation],
  );

  return { tab, setTab, pathSection, pathTeam, setPathSection, setPathTeam, openBracketForTeam };
}

export function homeTabFromSearch(search: string): HomeTab {
  return parseTab(search);
}
