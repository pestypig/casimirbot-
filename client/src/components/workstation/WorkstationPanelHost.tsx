import React, { Suspense, useMemo } from "react";
import { getPanelDef } from "@/lib/desktop/panelRegistry";
import { markInteraction } from "@/lib/workstation/performance/workstationInteractionScheduler";

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
    <div
      className="h-full min-h-0 overflow-auto overscroll-contain"
      data-workstation-panel-id={panelId}
      data-workstation-panel-heavy={def.heavy ? "true" : "false"}
      onScrollCapture={() => markInteraction("scrolling", `panel:${panelId}:scroll`)}
      onPointerMoveCapture={(event) => {
        if (event.buttons) markInteraction("dragging", `panel:${panelId}:pointer`);
      }}
      onKeyDownCapture={() => markInteraction("typing", `panel:${panelId}:keyboard`)}
      style={{
        contain: "layout paint style",
        contentVisibility: "auto",
        containIntrinsicSize: def.heavy ? "960px 720px" : "760px 560px",
      }}
    >
      <Suspense fallback={<div className="p-4 text-sm text-slate-400">Loading {def.title}...</div>}>
        <LazyPanel />
      </Suspense>
    </div>
  );
}
