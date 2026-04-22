import React, { Suspense, useMemo } from "react";
import { getPanelDef } from "@/lib/desktop/panelRegistry";

export function WorkstationPanelHost({ panelId }: { panelId: string }) {
  const def = getPanelDef(panelId);
  const LazyPanel = useMemo(() => {
    if (!def) return null;
    return React.lazy(def.loader);
  }, [def]);

  if (!def || !LazyPanel) {
    return (
      <div className="p-4 text-sm text-slate-400">
        Panel not found: {panelId}
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-auto">
      <Suspense fallback={<div className="p-4 text-sm text-slate-400">Loading {def.title}...</div>}>
        <LazyPanel />
      </Suspense>
    </div>
  );
}
