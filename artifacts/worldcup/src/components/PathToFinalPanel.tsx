import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetTeams } from "@workspace/api-client-react";
import { TeamCombobox } from "@/components/TeamCombobox";
import { LiveMetricsToggle } from "@/components/LiveMetricsToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { publicAsset } from "@/lib/assets";
import { useLiveMetrics } from "@/hooks/useLiveMetrics";
import { cn } from "@/lib/utils";
import { ArrowRight, BarChart3, GitBranch, Target, Trophy, Zap } from "lucide-react";

/** Hub Path tab — pick a team here, open full explorer without losing hub context. */
export function PathToFinalPanel() {
  const [, setLocation] = useLocation();
  const [teamId, setTeamId] = useState("");
  const { data: teams = [], isLoading } = useGetTeams();
  const { queryFlag } = useLiveMetrics();

  const openExplorer = () => {
    if (!teamId) return;
    const live = queryFlag ? "&useLiveMetrics=1" : "";
    setLocation(`/bracket?team=${teamId}${live}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-background via-secondary/30 to-background p-6 md:p-8">
        <p className="text-sm text-muted-foreground max-w-2xl mb-6">
          Choose a nation to map its bracket journey — win odds, likely opponents, and scenario locking.
          The explorer opens below the hub tabs so you can switch sections anytime.
        </p>

        <div className="grid md:grid-cols-[1fr,auto] gap-4 items-end max-w-2xl">
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Select team
            </label>
            <TeamCombobox
              teams={teams}
              value={teamId}
              onChange={setTeamId}
              placeholder="Pick a nation…"
              disabled={isLoading}
            />
          </div>
          <Button
            size="lg"
            className="h-12 px-8 font-bold uppercase tracking-wide shrink-0"
            disabled={!teamId}
            onClick={openExplorer}
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Open explorer
          </Button>
        </div>

        <div className="mt-5 max-w-xl">
          <LiveMetricsToggle />
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { icon: <Trophy className="w-3 h-3" />, label: "Win probability" },
            { icon: <Target className="w-3 h-3" />, label: "Scenario lock" },
            { icon: <Zap className="w-3 h-3" />, label: "10k+ simulations" },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/60 text-xs font-mono text-muted-foreground"
            >
              {icon} {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/rankings">
          <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary border border-border/50">
                <BarChart3 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm group-hover:text-primary transition-colors">Power Rankings</p>
                <p className="text-xs text-muted-foreground">All 48 teams by win probability</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0" />
            </CardContent>
          </Card>
        </Link>
        <button
          type="button"
          disabled={!teamId}
          onClick={openExplorer}
          className={cn(
            "text-left rounded-xl border border-border bg-card p-4 flex items-center gap-3 transition-colors",
            teamId ? "hover:border-primary/40 cursor-pointer group" : "opacity-50 cursor-not-allowed",
          )}
        >
          <img
            src={publicAsset("wc26-sticker-path.png")}
            alt=""
            className="h-10 w-10 object-contain shrink-0"
            width={40}
            height={40}
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm group-hover:text-primary transition-colors">Full bracket explorer</p>
            <p className="text-xs text-muted-foreground">Stage-by-stage path with opponent scenarios</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0" />
        </button>
      </div>
    </div>
  );
}
