import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "vscor_use_live_metrics";

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface LiveMetricsContextValue {
  enabled: boolean;
  setLiveMetrics: (value: boolean) => void;
  queryFlag: "1" | undefined;
}

const LiveMetricsContext = createContext<LiveMetricsContextValue | null>(null);

export function LiveMetricsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(readStored);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEnabled(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLiveMetrics = useCallback((value: boolean) => {
    setEnabled(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      setLiveMetrics,
      queryFlag: enabled ? ("1" as const) : undefined,
    }),
    [enabled, setLiveMetrics],
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

/** Apply ?useLiveMetrics=1 from shared URLs */
export function useLiveMetricsFromUrl(search: string) {
  const { enabled, setLiveMetrics } = useLiveMetrics();
  useEffect(() => {
    const param = new URLSearchParams(search).get("useLiveMetrics");
    if (param === "1" || param === "true") {
      setLiveMetrics(true);
    }
  }, [search, setLiveMetrics]);

  return { enabled, queryFlag: enabled ? ("1" as const) : undefined };
}
