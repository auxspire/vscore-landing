import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TableProperties } from "lucide-react";
import { useLiveMetrics } from "@/hooks/useLiveMetrics";

interface GroupStandingsToggleProps {
  className?: string;
}

/** Path tab only — pins R32 to current group table (Schedule). Elo/form always on. */
export function GroupStandingsToggle({ className }: GroupStandingsToggleProps) {
  const { groupStandingsEnabled, setGroupStandings } = useLiveMetrics();

  return (
    <div className={`flex items-start gap-3 rounded-xl border border-border bg-secondary/20 px-4 py-3 ${className ?? ""}`}>
      <TableProperties className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <Label htmlFor="group-standings" className="text-sm font-medium cursor-pointer">
          Use live group standings for Path
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          When on, Round of 32 uses your team&apos;s current table position (same as Schedule).
          Monte Carlo still powers reach odds and later rounds. Elo and recent form are always
          included in simulations.
        </p>
      </div>
      <Switch
        id="group-standings"
        checked={groupStandingsEnabled}
        onCheckedChange={setGroupStandings}
        aria-label="Use live group standings for Path"
      />
    </div>
  );
}

/** @deprecated use GroupStandingsToggle */
export const LiveMetricsToggle = GroupStandingsToggle;
