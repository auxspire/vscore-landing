import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";

/** Deep link compatibility — /bracket opens the home hub on the Bracket Explorer section. */
export default function Bracket() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  useEffect(() => {
    const qs = search.startsWith("?") ? search.slice(1) : search;
    const sp = new URLSearchParams(qs);
    const next = new URLSearchParams({ tab: "path", section: "bracket" });
    const team = sp.get("team");
    const live = sp.get("useLiveMetrics");
    if (team) next.set("team", team);
    if (live) next.set("useLiveMetrics", live);
    setLocation(`/?${next.toString()}`, { replace: true });
  }, [search, setLocation]);

  return <LoadingAnimation message="Loading bracket…" />;
}
