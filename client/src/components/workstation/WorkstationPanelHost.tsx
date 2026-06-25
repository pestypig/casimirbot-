import React, { Suspense, useMemo } from "react";
import { HelixLoadingMark } from "@/components/common/HelixLoadingMark";
import { useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import { getPanelDef } from "@/lib/desktop/panelRegistry";
import { getInterfaceLanguageOption } from "@/lib/i18n/interfaceLanguage";
import { useInterfaceText } from "@/lib/i18n/interfaceText";
import { getInterfacePanelTitle } from "@/lib/i18n/panelTitles";
import { markInteraction } from "@/lib/workstation/performance/workstationInteractionScheduler";

export function WorkstationPanelHost({ panelId }: { panelId: string }) {
  const def = getPanelDef(panelId);
  const { userSettings } = useHelixStartSettings();
  const interfaceLanguage = getInterfaceLanguageOption(userSettings.interfaceLanguage);
  const { t } = useInterfaceText(interfaceLanguage.code);
  const panelTitle = def ? getInterfacePanelTitle(t, panelId, def.title) : panelId;
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
      <Suspense
        fallback={
          <HelixLoadingMark
            title={t("workstation.panel.loadingTitle", { title: panelTitle })}
            detail="Preparing panel workspace"
            compact
          />
        }
      >
        <LazyPanel />
      </Suspense>
    </div>
  );
}
