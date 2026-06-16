import { Navbar } from "@/components/Navbar";
import { WorldCupFixturesStandingsPanel } from "@/components/WorldCupFixturesStandingsPanel";
import { usePageSeo, PAGE_SEO } from "@/lib/seo";
import { Calendar } from "lucide-react";

export default function Fixtures() {
  usePageSeo(PAGE_SEO.fixtures);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col">
      <Navbar />
      <div className="flex-1 pt-8 pb-24 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              World Cup 2026 Fixtures &amp; Standings
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Live match schedule, results, and group tables for all 48 teams — synced every 15 minutes from official
            World Cup data.
          </p>
        </header>

        <WorldCupFixturesStandingsPanel variant="full" />
      </div>
    </div>
  );
}
