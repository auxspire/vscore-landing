import type { ReactNode } from "react";
import { useLocation, useSearch } from "wouter";
import { Navbar } from "@/components/Navbar";
import { WorldCupHubTabs, resolveHubTab, type HubTab } from "@/components/WorldCupHubTabs";
import { cn } from "@/lib/utils";

interface WorldCupLayoutProps {
  children: ReactNode;
  /** Override auto-detected hub tab; null = no pill highlighted */
  activeTab?: HubTab | null;
  hubMode?: "controlled" | "route";
  onHubTabChange?: (tab: HubTab) => void;
  wide?: boolean;
  showHubTabs?: boolean;
}

export function WorldCupLayout({
  children,
  activeTab,
  hubMode = "route",
  onHubTabChange,
  wide = false,
  showHubTabs = true,
}: WorldCupLayoutProps) {
  const [location] = useLocation();
  const search = useSearch();
  const tab = activeTab ?? resolveHubTab(location, search);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col">
      <Navbar />
      {showHubTabs && (
        <div className="sticky top-[4.75rem] z-40 border-b border-border/40 bg-background/90 backdrop-blur-md px-4 md:px-8 py-3">
          <div className={cn("mx-auto w-full", wide ? "max-w-6xl" : "max-w-5xl")}>
            <WorldCupHubTabs
              active={tab}
              mode={hubMode}
              onTabChange={onHubTabChange}
            />
          </div>
        </div>
      )}
      <div
        className={cn(
          "flex-1 pt-6 pb-24 px-4 md:px-8 mx-auto w-full relative z-10",
          wide ? "max-w-6xl" : "max-w-5xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}
