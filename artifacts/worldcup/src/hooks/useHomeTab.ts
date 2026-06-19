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

export interface BracketLockParams {
  lockStage: string | null;
  lockOpp: string | null;
  lockFinish: string | null;
}

function parseBracketLock(search: string): BracketLockParams {
  const sp = parseSearch(search);
  return {
    lockStage: sp.get("lockStage"),
    lockOpp: sp.get("lockOpp"),
    lockFinish: sp.get("lockFinish"),
  };
}

function buildLocation(sp: URLSearchParams): string {
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

export function useHomeTab() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  const tab = useMemo(() => parseTab(search), [search]);
  const pathSection = useMemo(() => parsePathSection(search), [search]);
  const pathTeam = useMemo(() => parsePathTeam(search), [search]);
  const bracketLock = useMemo(() => parseBracketLock(search), [search]);

  const setTab = useCallback(
    (next: HomeTab) => {
      const sp = parseSearch(search);
      if (next === "predictor") {
        sp.delete("tab");
      } else {
        sp.set("tab", next);
      }
      setLocation(buildLocation(sp));
    },
    [search, setLocation],
  );

  const setPathSection = useCallback(
    (section: PathSection) => {
      const sp = parseSearch(search);
      sp.set("tab", "path");
      sp.set("section", section);
      setLocation(buildLocation(sp));
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
      sp.delete("lockStage");
      sp.delete("lockOpp");
      sp.delete("lockFinish");
      setLocation(buildLocation(sp));
    },
    [search, setLocation],
  );

  const setBracketLock = useCallback(
    (lock: BracketLockParams) => {
      const sp = parseSearch(search);
      sp.set("tab", "path");
      if (!sp.get("section")) sp.set("section", "bracket");

      if (lock.lockStage && lock.lockOpp) {
        sp.set("lockStage", lock.lockStage);
        sp.set("lockOpp", lock.lockOpp);
        if (lock.lockFinish) sp.set("lockFinish", lock.lockFinish);
        else sp.delete("lockFinish");
      } else {
        sp.delete("lockStage");
        sp.delete("lockOpp");
        sp.delete("lockFinish");
      }

      setLocation(buildLocation(sp));
    },
    [search, setLocation],
  );

  const openBracketForTeam = useCallback(
    (teamId: string) => {
      const sp = parseSearch(search);
      sp.set("tab", "path");
      sp.set("section", "bracket");
      sp.set("team", teamId);
      setLocation(buildLocation(sp));
    },
    [search, setLocation],
  );

  return {
    tab,
    setTab,
    pathSection,
    pathTeam,
    bracketLock,
    setPathSection,
    setPathTeam,
    setBracketLock,
    openBracketForTeam,
  };
}

export function homeTabFromSearch(search: string): HomeTab {
  return parseTab(search);
}

/** Merge target tab into an existing query string (preserves team, lock, etc.). */
export function hubTabHref(currentSearch: string, tab: HomeTab): string {
  const sp = parseSearch(currentSearch);
  if (tab === "predictor") {
    sp.delete("tab");
  } else {
    sp.set("tab", tab);
  }
  return buildLocation(sp);
}

export function rankingsHrefPreservingTeam(currentSearch: string): string {
  const sp = parseSearch(currentSearch);
  sp.set("tab", "path");
  sp.set("section", "rankings");
  return buildLocation(sp);
}
