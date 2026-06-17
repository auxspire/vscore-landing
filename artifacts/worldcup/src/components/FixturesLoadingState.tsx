import { useEffect, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function useDelayedVisible(active: boolean, delayMs = 180) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const id = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(id);
  }, [active, delayMs]);

  return visible;
}

function MatchRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 bg-secondary/20 p-3 flex items-center gap-3 overflow-hidden relative",
        className,
      )}
    >
      <div className="fixtures-shimmer absolute inset-0 pointer-events-none opacity-60" aria-hidden />
      <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3 w-2/5 max-w-[8rem] rounded bg-primary/10" />
        <div className="h-2.5 w-1/3 max-w-[6rem] rounded bg-primary/10" />
      </div>
      <div className="text-center px-2 shrink-0 space-y-1">
        <div className="h-4 w-8 mx-auto rounded bg-primary/10" />
        <div className="h-2 w-10 mx-auto rounded bg-primary/10" />
      </div>
      <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0" />
    </div>
  );
}

export function FixturesRefreshingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="h-0.5 w-full overflow-hidden bg-border/30"
      role="status"
      aria-label="Refreshing fixtures"
    >
      <div className="fixtures-progress h-full w-1/3 bg-primary/80" />
    </div>
  );
}

export function FixturesLoadingState({
  label = "Loading fixtures",
  compact = false,
  delayed = true,
}: {
  label?: string;
  compact?: boolean;
  /** Wait briefly before showing — avoids flash on fast cache hits. */
  delayed?: boolean;
}) {
  const show = useDelayedVisible(true, delayed ? 180 : 0);

  if (!show) {
    return (
      <div className="p-6" aria-busy="true" aria-label={label}>
        <div className="h-24 rounded-lg bg-secondary/15 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center justify-center text-center", compact ? "py-10 px-4" : "py-12 px-6")}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl scale-150 animate-pulse" aria-hidden />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-secondary/40 shadow-inner">
          <Calendar className="h-6 w-6 text-primary/80" aria-hidden />
          <Loader2 className="absolute -right-1 -bottom-1 h-5 w-5 text-primary animate-spin" aria-hidden />
        </div>
      </div>

      <p className="text-sm font-medium text-foreground">
        {label}
        <span className="fixtures-loading-dots" aria-hidden />
      </p>
      <p className="mt-1 text-xs text-muted-foreground max-w-xs">
        Fetching matches, standings, and team data
      </p>

      <div className={cn("mt-8 w-full space-y-2.5", compact ? "max-w-md" : "max-w-lg")}>
        <MatchRowSkeleton />
        <MatchRowSkeleton className="opacity-80" />
        <MatchRowSkeleton className="opacity-60" />
      </div>
    </div>
  );
}

export function ScorersLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center" aria-busy="true">
      <Loader2 className="h-6 w-6 text-primary animate-spin mb-3" aria-hidden />
      <p className="text-sm text-muted-foreground">
        Loading scorers
        <span className="fixtures-loading-dots" aria-hidden />
      </p>
    </div>
  );
}
