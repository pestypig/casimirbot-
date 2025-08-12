import * as React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Your entire app (router, pages, etc.) */}
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
