import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LumaBackgroundPortal from "@/components/LumaBackgroundPortal";
import { BackgroundLuma } from "@/components/BackgroundLuma";
import { LumaOverlayHost } from "@/components/LumaOverlayHost";
import { useQiStream } from "@/hooks/useQiStream";
import { LumaWhispersProvider } from "@/lib/luma-whispers";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import RouteBootSplash from "@/components/RouteBootSplash";

const Home = lazy(() => import("@/pages/home"));
const Simulation = lazy(() => import("@/pages/simulation"));
const Documentation = lazy(() => import("@/pages/documentation"));
const NoiseGenAlias = lazy(() => import("@/pages/noisegen"));
const Why = lazy(() => import("@/pages/why"));
const StartPortal = lazy(() => import("@/pages/start"));
const StationPage = lazy(() => import("@/pages/station"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PotatoThresholdLab = lazy(() => import("@/pages/potato-threshold-lab"));
const LumaPage = lazy(() => import("@/pages/luma"));
const HelixObservablesPage = lazy(() => import("@/pages/helix-observables"));
const IngestPage = lazy(() => import("@/pages/ingest"));
const RagAdminPage = lazy(() => import("@/pages/rag-admin"));
const CodeAdminPage = lazy(() => import("@/pages/code-admin"));
const DesktopPage = lazy(() => import("@/pages/desktop"));
const SignInPage = lazy(() => import("@/pages/sign-in"));
const AccountResetPasswordPage = lazy(() => import("@/pages/account-reset-password"));
const StarHydrostaticPanel = lazy(() => import("@/pages/star-hydrostatic-panel"));
const IdeologyRenderPage = lazy(() => import("@/pages/ideology-render"));
const EssenceRenderPage = lazy(() => import("@/pages/essence-render"));
const AgiRefineryDashboard = lazy(() => import("@/pages/agi-refinery"));

const hasDesktopOverride = () => {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("desktop") === "1";
  } catch {
    return false;
  }
};

const hasMobileOverride = () => {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("mobile") === "1";
  } catch {
    return false;
  }
};

function DesktopRedirect() {
  const [, setLocation] = useLocation();
  const { isMobile, isReady } = useIsMobileViewport();
  const desktopOverride = hasDesktopOverride();
  const mobileOverride = hasMobileOverride();

  useEffect(() => {
    if (mobileOverride) {
      setLocation("/mobile", { replace: true });
      return;
    }

    if (desktopOverride) {
      setLocation("/desktop", { replace: true });
      return;
    }

    if (!isReady) return;

    if (isMobile) {
      setLocation("/mobile", { replace: true });
      return;
    }

    setLocation("/desktop", { replace: true });
  }, [desktopOverride, isMobile, isReady, mobileOverride, setLocation]);

  return (
    <RouteBootSplash
      message="Preparing your Helix workspace..."
      detail="Selecting desktop or mobile mode"
    />
  );
}

function StartRoute() {
  const [, setLocation] = useLocation();
  const { isMobile, isReady } = useIsMobileViewport();
  const desktopOverride = hasDesktopOverride();
  const mobileOverride = hasMobileOverride();

  useEffect(() => {
    if (mobileOverride) {
      setLocation("/mobile", { replace: true });
      return;
    }

    if (desktopOverride) return;

    if (!isReady) return;
    if (isMobile) {
      setLocation("/mobile", { replace: true });
    }
  }, [desktopOverride, isMobile, isReady, mobileOverride, setLocation]);

  if (mobileOverride || (!desktopOverride && (!isReady || isMobile))) {
    return (
      <RouteBootSplash
        message="Preparing your Helix workspace..."
        detail="Routing to mobile workstation"
      />
    );
  }

  return <StartPortal />;
}

function HelixCoreRoute() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search ?? "" : "";
    const hash = typeof window !== "undefined" ? window.location.hash ?? "" : "";
    setLocation(`/desktop${search}${hash}`, { replace: true });
  }, [setLocation]);

  return (
    <RouteBootSplash
      message="Opening desktop..."
      detail="Applying Helix route handoff"
    />
  );
}

function DesktopRoute() {
  return (
    <LumaWhispersProvider>
      <DesktopPage />
    </LumaWhispersProvider>
  );
}

function MobileRoute() {
  return (
    <LumaWhispersProvider>
      <DesktopPage layoutVariant="mobile" />
    </LumaWhispersProvider>
  );
}

function Router() {
  return (
    <Suspense
      fallback={
        <RouteBootSplash
          message="Loading Helix..."
          detail="Preparing the requested workspace"
        />
      }
    >
      <Switch>
        <Route path="/" component={DesktopRedirect} />
        <Route path="/start" component={StartRoute} />
        <Route path="/mobile" component={MobileRoute} />
        <Route path="/bridge" component={Home} />
        <Route path="/simulation" component={Simulation} />
        <Route path="/documentation" component={Documentation} />
        <Route path="/helix-core" component={HelixCoreRoute} />
        <Route path="/helix-observables" component={HelixObservablesPage} />
        <Route path="/helix/noise-gens" component={NoiseGenAlias} />
        <Route path="/helix-noise-gens" component={NoiseGenAlias} />
        <Route path="/noisegen" component={NoiseGenAlias} />
        <Route path="/potato-threshold-lab" component={PotatoThresholdLab} />
        <Route path="/luma" component={LumaPage} />
        <Route path="/rag/ingest" component={IngestPage} />
        <Route path="/rag/admin" component={RagAdminPage} />
        <Route path="/code-admin" component={CodeAdminPage} />
        <Route path="/desktop" component={DesktopRoute} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/account/reset-password" component={AccountResetPasswordPage} />
        <Route path="/ideology-render" component={IdeologyRenderPage} />
        <Route path="/essence-render" component={EssenceRenderPage} />
        <Route path="/agi-refinery" component={AgiRefineryDashboard} />
        <Route path="/why" component={Why} />
        <Route path="/star-hydrostatic" component={StarHydrostaticPanel} />
        <Route path="/station/:role" component={StationPage} />
        <Route path="/optimist-station" component={StationPage} />
        <Route path="/engineer-station" component={StationPage} />
        <Route path="/diplomat-station" component={StationPage} />
        <Route path="/strategist-station" component={StationPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
