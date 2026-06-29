import { lazy, Suspense, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WorldCupLayout } from "@/components/WorldCupLayout";
import { KnockoutBracketPanel } from "@/components/KnockoutBracketPanel";
import { FaqSection, HOME_FAQ } from "@/components/FaqSection";
import { useHomeTab, type HomeTab } from "@/hooks/useHomeTab";
import { prefetchFootballLiveCache, prefetchFootballLivePanel } from "@/hooks/useFootballData";
import { publicAsset } from "@/lib/assets";
import { usePageSeo, PAGE_SEO } from "@/lib/seo";
import { FixturesLoadingState } from "@/components/FixturesLoadingState";
import { Calendar } from "lucide-react";

const WorldCupFixturesStandingsPanel = lazy(() =>
  import("@/components/WorldCupFixturesStandingsPanel").then((m) => ({
    default: m.WorldCupFixturesStandingsPanel,
  })),
);

export default function Home() {
  const queryClient = useQueryClient();
  const { tab, setTab } = useHomeTab();

  usePageSeo(PAGE_SEO.home);

  useEffect(() => {
    void prefetchFootballLiveCache(queryClient);
    if (tab === "fixtures") {
      void prefetchFootballLivePanel();
    }
  }, [tab, queryClient]);

  return (
    <WorldCupLayout
      activeTab={tab}
      hubMode="controlled"
      onHubTabChange={(t) => setTab(t as HomeTab)}
      wide={tab === "fixtures" || tab === "bracket"}
      showHubTabs
    >
      <header className="mb-4 md:mb-8 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3.5 mb-4">
          <img
            src={publicAsset("wc26-sticker-path.png")}
            alt="VScor World Cup 2026"
            className="h-12 w-12 shrink-0 object-contain"
            width={48}
            height={48}
          />
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
              VScor World Cup 2026
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-0.5">
              {tab === "bracket" && "Knockout bracket from live standings and results"}
              {tab === "fixtures" && "Today's matches, results, and group tables"}
            </p>
          </div>
        </div>
      </header>

      {tab === "bracket" && (
        <div className="animate-in fade-in duration-300">
          <KnockoutBracketPanel />
        </div>
      )}

      {tab === "fixtures" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span>Matches in your timezone · fixtures, tables &amp; scorers live from API</span>
          </div>
          <Suspense fallback={<FixturesLoadingState compact delayed={false} />}>
            <WorldCupFixturesStandingsPanel variant="full" />
          </Suspense>
        </div>
      )}

      <FaqSection items={HOME_FAQ} className="mt-10 md:mt-16 mb-4" />
    </WorldCupLayout>
  );
}
