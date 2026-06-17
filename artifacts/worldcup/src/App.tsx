import { lazy, Suspense, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { LiveMetricsProvider } from "@/hooks/useLiveMetrics";
import { prefetchFootballLiveCache, prefetchFootballLivePanel } from "@/hooks/useFootballData";

const Home = lazy(() => import("@/pages/home"));
const Matchup = lazy(() => import("@/pages/matchup"));
const Bracket = lazy(() => import("@/pages/bracket"));
const Rankings = lazy(() => import("@/pages/rankings"));
const Fixtures = lazy(() => import("@/pages/fixtures"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient();

function FixturesPrefetch() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") !== "fixtures") return;
    void prefetchFootballLiveCache(queryClient);
    void prefetchFootballLivePanel();
  }, []);
  return null;
}

function Router() {
  return (
    <Suspense fallback={<LoadingAnimation message="Loading page…" />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/matchup" component={Matchup} />
        <Route path="/bracket" component={Bracket} />
        <Route path="/rankings" component={Rankings} />
        <Route path="/fixtures" component={Fixtures} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FixturesPrefetch />
      <LiveMetricsProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <Analytics />
        </TooltipProvider>
      </LiveMetricsProvider>
    </QueryClientProvider>
  );
}

export default App;
