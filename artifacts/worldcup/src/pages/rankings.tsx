import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";

/** Deep link compatibility — /rankings opens the home hub on the Power Rankings section. */
export default function Rankings() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  useEffect(() => {
    const qs = search.startsWith("?") ? search.slice(1) : search;
    const sp = new URLSearchParams(qs);
    const next = new URLSearchParams({ tab: "path", section: "rankings" });
    const live = sp.get("useLiveMetrics");
    if (live) next.set("useLiveMetrics", live);
    setLocation(`/?${next.toString()}`, { replace: true });
  }, [search, setLocation]);

  return <LoadingAnimation message="Loading rankings…" />;
}
