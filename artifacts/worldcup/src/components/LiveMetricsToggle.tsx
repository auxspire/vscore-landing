import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Activity } from "lucide-react";
import { useLiveMetrics } from "@/hooks/useLiveMetrics";

interface LiveMetricsToggleProps {
  className?: string;
}

export function LiveMetricsToggle({ className }: LiveMetricsToggleProps) {
  const { enabled, setLiveMetrics } = useLiveMetrics();

  return (
    <div className={`flex items-start gap-3 rounded-xl border border-border bg-secondary/20 px-4 py-3 ${className ?? ""}`}>
      <Activity className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <Label htmlFor="live-metrics" className="text-sm font-medium cursor-pointer">
          Factor in live tournament form
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          When on, probabilities blend synced group standings and recent match results (default: pure Elo).
        </p>
      </div>
      <Switch
        id="live-metrics"
        checked={enabled}
        onCheckedChange={setLiveMetrics}
        aria-label="Factor in live tournament form"
      />
    </div>
  );
}
