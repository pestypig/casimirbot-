import * as React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LumaDock } from "@/components/LumaDock";
import { LumaPanel } from "@/components/LumaPanel";
import { LumaWhisper } from "@/components/LumaWhisper";
import { LumaOverlayHost } from "@/components/LumaOverlayHost";
import Home from "@/pages/home";
import Simulation from "@/pages/simulation";
import Documentation from "@/pages/documentation";
import HelixCore from "@/pages/helix-core";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/simulation" component={Simulation} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/helix-core" component={HelixCore} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [lumaOpen, setLumaOpen] = React.useState(false);
  const [whisperMsg, setWhisperMsg] = React.useState<string[] | null>(null);

  // Subscribe to luma whispers
  React.useEffect(() => {
    const handleWhisper = (event: CustomEvent) => {
      const data = event.detail;
      // Handle both old format {text} and new format {lines}
      const lines = data.lines || (data.text ? [data.text] : ["Breathe once."]);
      setWhisperMsg(lines);
    };

    document.addEventListener("luma:whisper", handleWhisper as EventListener);
    return () => document.removeEventListener("luma:whisper", handleWhisper as EventListener);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Your entire app (router, pages, etc.) */}
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <Toaster />
          <Router />
        </div>

        {/* Luma system - asset-free */}
        <LumaDock onOpen={() => setLumaOpen(true)} />
        <LumaPanel isOpen={lumaOpen} onClose={() => setLumaOpen(false)} />
        
        {/* Whispers */}
        {whisperMsg && (
          <LumaWhisper
            lines={whisperMsg}
            onDone={() => setWhisperMsg(null)}
          />
        )}

        {/* Legacy whispers host */}
        <LumaOverlayHost />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
