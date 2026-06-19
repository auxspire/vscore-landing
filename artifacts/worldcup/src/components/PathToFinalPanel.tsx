import { useGetTeams } from "@workspace/api-client-react";
import { TeamCombobox } from "@/components/TeamCombobox";
import { LiveMetricsToggle } from "@/components/LiveMetricsToggle";
import { BracketExplorerPanel } from "@/components/BracketExplorerPanel";
import { PowerRankingsPanel } from "@/components/PowerRankingsPanel";
import { useHomeTab, type PathSection } from "@/hooks/useHomeTab";
import { cn } from "@/lib/utils";
import { BarChart3, GitBranch } from "lucide-react";

const SECTIONS: { id: PathSection; label: string; icon: React.ReactNode }[] = [
  { id: "bracket", label: "Bracket Explorer", icon: <GitBranch className="w-3.5 h-3.5" /> },
  { id: "rankings", label: "Power Rankings", icon: <BarChart3 className="w-3.5 h-3.5" /> },
];

/** Hub Path tab — bracket explorer and power rankings without leaving the hub. */
export function PathToFinalPanel() {
  const { pathSection, pathTeam, setPathSection, setPathTeam, openBracketForTeam } = useHomeTab();
  const { data: teams = [], isLoading } = useGetTeams();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-background via-secondary/30 to-background p-6 md:p-8">
        <p className="text-sm text-muted-foreground max-w-2xl mb-6">
          Map each nation&apos;s route to the final — win odds, likely opponents, scenario locking, and
          full tournament power rankings. Everything stays in this tab.
        </p>

        <div className="grid md:grid-cols-[1fr,auto] gap-4 items-end max-w-2xl">
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Select team
            </label>
            <TeamCombobox
              teams={teams}
              value={pathTeam}
              onChange={setPathTeam}
              placeholder="Pick a nation…"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="mt-5 max-w-xl">
          <LiveMetricsToggle />
        </div>
      </div>

      {/* Mobile: switch between bracket and rankings */}
      <div
        className="flex gap-1.5 p-1 rounded-xl bg-secondary/50 border border-border/50 w-full sm:w-auto sm:inline-flex lg:hidden"
        role="tablist"
        aria-label="Path to final sections"
      >
        {SECTIONS.map((section) => {
          const isActive = pathSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setPathSection(section.id)}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                isActive
                  ? "bg-background text-primary shadow-sm border border-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60",
              )}
            >
              {section.icon}
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Single mount per panel — visibility toggled by breakpoint / section */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        <section
          className={cn(
            "min-w-0 space-y-3",
            pathSection !== "bracket" && "hidden lg:block",
          )}
        >
          <h3 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground px-1">
            <GitBranch className="w-3.5 h-3.5 text-primary" />
            Bracket Explorer
          </h3>
          <BracketExplorerPanel teamId={pathTeam} onTeamChange={setPathTeam} />
        </section>
        <section
          className={cn("min-w-0", pathSection !== "rankings" && "hidden lg:block")}
        >
          <PowerRankingsPanel
            key={`rankings-${pathSection}`}
            onTeamSelect={openBracketForTeam}
            defaultCollapsed={pathSection !== "rankings"}
          />
        </section>
      </div>
    </div>
  );
}
