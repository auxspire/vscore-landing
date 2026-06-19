import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const GROUP_STANDINGS_KEY = "vscor_use_group_standings";

function readGroupStandingsStored(): boolean {
  try {
    return localStorage.getItem(GROUP_STANDINGS_KEY) === "1";
  } catch {
    return false;
  }
}

interface LiveMetricsContextValue {
  /** Elo + recent form blending is always on for API simulations */
  eloEnabled: true;
  groupStandingsEnabled: boolean;
  setGroupStandings: (value: boolean) => void;
  groupStandingsQueryFlag: "1" | undefined;
  /** @deprecated Elo is always on — kept for share URL backward compat */
  enabled: boolean;
  /** @deprecated use setGroupStandings for Path standings toggle */
  setLiveMetrics: (value: boolean) => void;
  /** @deprecated Elo always on — no query flag needed */
  queryFlag: "1" | undefined;
}

const LiveMetricsContext = createContext<LiveMetricsContextValue | null>(null);

export function LiveMetricsProvider({ children }: { children: ReactNode }) {
  const [groupStandingsEnabled, setGroupStandingsEnabled] = useState(readGroupStandingsStored);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === GROUP_STANDINGS_KEY) setGroupStandingsEnabled(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setGroupStandings = useCallback((value: boolean) => {
    setGroupStandingsEnabled(value);
    try {
      localStorage.setItem(GROUP_STANDINGS_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      eloEnabled: true as const,
      groupStandingsEnabled,
      setGroupStandings,
      groupStandingsQueryFlag: groupStandingsEnabled ? ("1" as const) : undefined,
      enabled: true,
      setLiveMetrics: setGroupStandings,
      queryFlag: undefined,
    }),
    [groupStandingsEnabled, setGroupStandings],
  );

  return (
    <LiveMetricsContext.Provider value={value}>{children}</LiveMetricsContext.Provider>
  );
}

export function useLiveMetrics() {
  const ctx = useContext(LiveMetricsContext);
  if (!ctx) {
    throw new Error("useLiveMetrics must be used within LiveMetricsProvider");
  }
  return ctx;
}

/** Apply ?useGroupStandings=1 (and legacy ?useLiveMetrics=1) from shared URLs */
export function useLiveMetricsFromUrl(search: string) {
  const { setGroupStandings } = useLiveMetrics();
  useEffect(() => {
    const param = new URLSearchParams(search);
    if (
      param.get("useGroupStandings") === "1" ||
      param.get("useGroupStandings") === "true"
    ) {
      setGroupStandings(true);
    }
  }, [search, setGroupStandings]);

  return useLiveMetrics();
}
