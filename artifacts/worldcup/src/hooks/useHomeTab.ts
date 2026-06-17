import { useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";

export type HomeTab = "predictor" | "path" | "fixtures";

const VALID: HomeTab[] = ["predictor", "path", "fixtures"];

function parseTab(search: string): HomeTab {
  const qs = search.startsWith("?") ? search.slice(1) : search;
  const raw = new URLSearchParams(qs).get("tab");
  if (raw && VALID.includes(raw as HomeTab)) return raw as HomeTab;
  return "predictor";
}

export function useHomeTab() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  const tab = useMemo(() => parseTab(search), [search]);

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

  return { tab, setTab };
}

export function homeTabFromSearch(search: string): HomeTab {
  return parseTab(search);
}
