import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";

/** Deep link compatibility — /bracket opens the home hub on the knockout bracket tab. */
export default function Bracket() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/", { replace: true });
  }, [setLocation]);

  return <LoadingAnimation message="Loading bracket…" />;
}
