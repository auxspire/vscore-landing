import { useEffect, useState, type ReactNode } from "react";
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
  const [hubCompact, setHubCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setHubCompact(window.scrollY > 72);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col">
      <Navbar />
      {showHubTabs && (
        <div
          className={cn(
            "sticky top-[4.75rem] z-40 border-b border-border/40 bg-background/90 backdrop-blur-md px-4 md:px-8 transition-all duration-200",
            hubCompact ? "py-1.5 md:py-3" : "py-3",
          )}
        >
          <div className={cn("mx-auto w-full", wide ? "max-w-6xl" : "max-w-5xl")}>
            <WorldCupHubTabs
              active={tab}
              mode={hubMode}
              onTabChange={onHubTabChange}
              compact={hubCompact}
            />
          </div>
        </div>
      )}
      <div
        className={cn(
          "flex-1 pb-20 md:pb-24 px-3 md:px-8 mx-auto w-full relative z-10 transition-[padding] duration-200",
          hubCompact ? "pt-2 md:pt-6" : "pt-4 md:pt-6",
          wide ? "max-w-6xl" : "max-w-5xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}
