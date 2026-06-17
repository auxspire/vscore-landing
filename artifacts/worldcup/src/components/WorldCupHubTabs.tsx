import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { publicAsset } from "@/lib/assets";
import type { HomeTab } from "@/hooks/useHomeTab";
import { Swords, Calendar } from "lucide-react";

export type HubTab = HomeTab;

const TABS: {
  id: HubTab;
  label: string;
  shortLabel: string;
  href: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "predictor",
    label: "Match Predictor",
    shortLabel: "Predictor",
    href: "/",
    icon: <Swords className="w-4 h-4 shrink-0" />,
  },
  {
    id: "path",
    label: "Path to Final",
    shortLabel: "Path",
    href: "/?tab=path",
    icon: (
      <img
        src={publicAsset("wc26-sticker-path.png")}
        alt=""
        className="h-4 w-4 object-contain shrink-0"
        width={16}
        height={16}
      />
    ),
  },
  {
    id: "fixtures",
    label: "Live Schedule",
    shortLabel: "Schedule",
    href: "/?tab=fixtures",
    icon: <Calendar className="w-4 h-4 shrink-0" />,
  },
];

interface WorldCupHubTabsProps {
  active: HubTab | null;
  /** controlled = home hub switches content in-place; route = navigates to hub URLs */
  mode?: "controlled" | "route";
  onTabChange?: (tab: HubTab) => void;
  className?: string;
}

export function resolveHubTab(pathname: string, search: string): HubTab | null {
  if (pathname.startsWith("/matchup")) return "predictor";
  const qs = search.startsWith("?") ? search.slice(1) : search;
  const raw = new URLSearchParams(qs).get("tab");
  if (raw === "path" || raw === "fixtures") return raw;
  if (pathname.startsWith("/bracket") || pathname.startsWith("/rankings")) return "path";
  return "predictor";
}

export function WorldCupHubTabs({
  active,
  mode = "route",
  onTabChange,
  className,
}: WorldCupHubTabsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-secondary/50 border border-border/50",
        className,
      )}
      role="tablist"
      aria-label="World Cup hub sections"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const pillClass = cn(
          "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
          "py-2.5 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all",
          isActive
            ? "bg-background text-primary shadow-sm border border-primary/25"
            : "text-muted-foreground hover:text-foreground hover:bg-background/60",
        );

        if (mode === "controlled") {
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={pillClass}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.icon}
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        }

        // Route mode — deep links redirect into hub tabs
        const href = tab.href;

        return (
          <Link key={tab.id} href={href} role="tab" aria-selected={isActive} className={pillClass}>
            {tab.icon}
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
