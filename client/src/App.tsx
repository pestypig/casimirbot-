import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LumaBackgroundPortal from "@/components/LumaBackgroundPortal";
import { BackgroundLuma } from "@/components/BackgroundLuma";
import { LumaOverlayHost } from "@/components/LumaOverlayHost";
import Home from "@/pages/home";
import Simulation from "@/pages/simulation";
import Documentation from "@/pages/documentation";
import HelixCore from "@/pages/helix-core";
import NoiseGenAlias from "@/pages/noisegen";
import Why from "@/pages/why";
import StartPortal from "@/pages/start";
import StationPage from "@/pages/station";
import NotFound from "@/pages/not-found";
import PotatoThresholdLab from "@/pages/potato-threshold-lab";
import LumaPage from "@/pages/luma";
import HelixObservablesPage from "@/pages/helix-observables";
import IngestPage from "@/pages/ingest";
import RagAdminPage from "@/pages/rag-admin";
import CodeAdminPage from "@/pages/code-admin";
import DesktopPage from "@/pages/desktop";
import SignInPage from "@/pages/sign-in";
import StarHydrostaticPanel from "@/pages/star-hydrostatic-panel";
import { useQiStream } from "@/hooks/useQiStream";

function DesktopRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/desktop", { replace: true });
  }, [setLocation]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DesktopRedirect} />
      <Route path="/start" component={StartPortal} />
      <Route path="/bridge" component={Home} />
      <Route path="/simulation" component={Simulation} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/helix-core" component={HelixCore} />
      <Route path="/helix-observables" component={HelixObservablesPage} />
      <Route path="/helix/noise-gens" component={NoiseGenAlias} />
      <Route path="/helix-noise-gens" component={NoiseGenAlias} />
      <Route path="/noisegen" component={NoiseGenAlias} />
      <Route path="/potato-threshold-lab" component={PotatoThresholdLab} />
      <Route path="/luma" component={LumaPage} />
      <Route path="/rag/ingest" component={IngestPage} />
      <Route path="/rag/admin" component={RagAdminPage} />
      <Route path="/code-admin" component={CodeAdminPage} />
      <Route path="/desktop" component={DesktopPage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/why" component={Why} />
      <Route path="/star-hydrostatic" component={StarHydrostaticPanel} />
      <Route path="/station/:role" component={StationPage} />
      <Route path="/optimist-station" component={StationPage} />
      <Route path="/engineer-station" component={StationPage} />
      <Route path="/diplomat-station" component={StationPage} />
      <Route path="/strategist-station" component={StationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useQiStream(true, { hz: 10 });
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Background behind everything, once */}
        <LumaBackgroundPortal>
          <BackgroundLuma opacity={0.12} blurPx={8} />
        </LumaBackgroundPortal>

        {/* Your entire app (router, pages, etc.) */}
        <div className="relative z-10 min-h-screen">
          <Toaster />
          <Router />
        </div>

        {/* Whispers host once, on top */}
        <LumaOverlayHost />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
