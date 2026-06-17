import { format, parseISO, isValid } from "date-fns";
import { Clock, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FootballSyncJobState } from "@/hooks/useFootballData";

const JOB_LABELS: Record<string, string> = {
  games: "Fixtures",
  groups: "Standings",
  teams: "Teams",
};

function formatSyncTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, "MMM d · HH:mm") : "—";
  } catch {
    return "—";
  }
}

function statusClass(status: string) {
  if (status === "success") return "text-primary";
  if (status === "running") return "text-amber-400";
  if (status === "error") return "text-destructive";
  return "text-muted-foreground";
}

interface SyncStatusFooterProps {
  jobs: FootballSyncJobState[];
  isLoading?: boolean;
  liveFetchedAt?: string | null;
  liveSource?: "api" | "supabase";
  liveApiError?: string | null;
}

export function SyncStatusFooter({
  jobs,
  isLoading,
  liveFetchedAt,
  liveSource = "supabase",
  liveApiError,
}: SyncStatusFooterProps) {
  const totalCalls = jobs.reduce((s, j) => s + (j.calls_used_today ?? 0), 0);
  const latest = jobs.length
    ? [...jobs].sort((a, b) => (b.last_synced_at ?? "").localeCompare(a.last_synced_at ?? ""))[0]
    : null;
  const hasError = jobs.some((j) => j.status === "error");
  const usingLiveApi = liveSource === "api" && liveFetchedAt;

  return (
    <footer className="border-t border-border/50 bg-secondary/10 px-4 py-3 space-y-3 text-xs text-muted-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {usingLiveApi ? (
            <>Live data · updated {formatSyncTime(liveFetchedAt)}</>
          ) : liveApiError ? (
            <>Cached data · live API failed ({liveApiError})</>
          ) : isLoading ? (
            "Loading sync status…"
          ) : latest?.last_synced_at ? (
            <>Cached · last sync {formatSyncTime(latest.last_synced_at)}</>
          ) : (
            "Waiting for live data…"
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          {usingLiveApi ? "Auto-refresh every 2 minutes" : "Auto-sync every 15 minutes"}
        </span>
      </div>

      {!usingLiveApi && !isLoading && jobs.length > 0 && (
        <div className="grid gap-1.5 sm:grid-cols-3">
          {jobs.map((job) => (
            <div
              key={job.job_name}
              className="rounded-lg border border-border/40 bg-card/40 px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">
                  {JOB_LABELS[job.job_name] ?? job.job_name}
                </span>
                <span className={cn("font-mono uppercase text-[10px]", statusClass(job.status))}>
                  {job.status}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-[10px]">
                {formatSyncTime(job.last_synced_at)}
                {job.next_sync_at && job.status === "success" && (
                  <span className="text-muted-foreground/70">
                    {" "}
                    · next {formatSyncTime(job.next_sync_at)}
                  </span>
                )}
              </div>
              {job.error_message && (
                <p className="mt-1 text-[10px] text-destructive line-clamp-2">{job.error_message}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        <span className="font-mono text-[10px]">
          {usingLiveApi && "Source: worldcup26.ir live API"}
          {!usingLiveApi && totalCalls > 0 && `${totalCalls} API call${totalCalls === 1 ? "" : "s"} today`}
          {!usingLiveApi && hasError && " · check failed jobs above"}
        </span>
        <a
          href="https://worldcup26.ir"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline shrink-0"
        >
          Data from worldcup26.ir
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </footer>
  );
}
