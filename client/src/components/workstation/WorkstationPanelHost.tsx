import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { resolveHelixAccountPanelAccess } from "@shared/helix-account-session";
import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { HelixLoadingMark } from "@/components/common/HelixLoadingMark";
import { useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import { getPanelDef } from "@/lib/desktop/panelRegistry";
import { getInterfaceLanguageOption } from "@/lib/i18n/interfaceLanguage";
import { useInterfaceText } from "@/lib/i18n/interfaceText";
import { getInterfacePanelTitle } from "@/lib/i18n/panelTitles";
import {
  HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT,
  fetchAccountCapabilityPolicy,
  readCachedAccountCapabilityPolicy,
} from "@/lib/workstation/accountCapabilityPolicy";
import { markInteraction } from "@/lib/workstation/performance/workstationInteractionScheduler";

export function WorkstationPanelHost({ panelId }: { panelId: string }) {
  const def = getPanelDef(panelId);
  const [accountPolicy, setAccountPolicy] = useState<HelixAccountCapabilityPolicy | null>(() =>
    readCachedAccountCapabilityPolicy(),
  );
  const { userSettings } = useHelixStartSettings();
  const interfaceLanguage = getInterfaceLanguageOption(userSettings.interfaceLanguage);
  const { t } = useInterfaceText(interfaceLanguage.code);
  const panelTitle = def ? getInterfacePanelTitle(t, panelId, def.title) : panelId;
  const LazyPanel = useMemo(() => {
    if (!def) return null;
    return React.lazy(def.loader);
  }, [def]);
  const panelAccess = resolveHelixAccountPanelAccess(accountPolicy, panelId);

  useEffect(() => {
    let active = true;
    const handlePolicyChange = (event: Event) => {
      const policy = (event as CustomEvent<{ account_policy?: HelixAccountCapabilityPolicy | null }>).detail
        ?.account_policy;
      setAccountPolicy(policy ?? readCachedAccountCapabilityPolicy());
    };
    if (typeof window !== "undefined") {
      window.addEventListener(HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT, handlePolicyChange as EventListener);
    }
    fetchAccountCapabilityPolicy()
      .then((policy) => {
        if (active) setAccountPolicy(policy);
      })
      .catch(() => {
        if (active) setAccountPolicy(readCachedAccountCapabilityPolicy());
      });
    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener(HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT, handlePolicyChange as EventListener);
      }
    };
  }, []);

  if (!def || !LazyPanel) {
    return (
      <div className="p-4 text-sm text-slate-400">
        Panel not found: {panelId}
      </div>
    );
  }

  if (panelAccess.state === "locked") {
    return (
      <div
        className="flex h-full min-h-0 items-center justify-center overflow-auto bg-slate-950 p-6"
        data-workstation-panel-id={panelId}
        data-workstation-panel-locked="true"
      >
        <div className="max-w-md rounded-lg border border-amber-300/30 bg-amber-500/10 p-5 text-amber-50 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-md border border-amber-300/40 bg-amber-300/10 p-2 text-amber-200">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-amber-50">{panelTitle} is locked</h2>
              <p className="mt-2 text-sm leading-6 text-amber-100/80">
                This workstation feature is reserved for developer mode or is still under construction for user profiles.
              </p>
              {panelAccess.reason ? (
                <p className="mt-3 text-xs text-amber-100/60">{panelAccess.reason}</p>
              ) : null}
            </div>
          </div>
        </div>
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
