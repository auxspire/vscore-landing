import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";

/** Deep link compatibility — /fixtures opens the home hub on the Fixtures tab. */
export default function Fixtures() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/?tab=fixtures", { replace: true });
  }, [setLocation]);

  return <LoadingAnimation message="Loading fixtures…" />;
}
