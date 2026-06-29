import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";

/** Legacy matchup predictor URL — redirects to knockout bracket hub. */
export default function Matchup() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/", { replace: true });
  }, [setLocation]);

  return <LoadingAnimation message="Loading bracket…" />;
}
