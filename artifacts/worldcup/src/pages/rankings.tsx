import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";

/** Legacy URL — rankings merged into bracket hub. */
export default function Rankings() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/", { replace: true });
  }, [setLocation]);

  return <LoadingAnimation message="Loading bracket…" />;
}
