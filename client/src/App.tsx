import { Switch, Route } from "wouter";
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
import Why from "@/pages/why";
import StartPortal from "@/pages/start";
import StationPage from "@/pages/station";
import NotFound from "@/pages/not-found";
import PotatoThresholdLab from "@/pages/potato-threshold-lab";

function Router() {
  return (
    <Switch>
      <Route path="/" component={StartPortal} />
      <Route path="/bridge" component={Home} />
      <Route path="/simulation" component={Simulation} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/helix-core" component={HelixCore} />
      <Route path="/potato-threshold-lab" component={PotatoThresholdLab} />
      <Route path="/why" component={Why} />
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
