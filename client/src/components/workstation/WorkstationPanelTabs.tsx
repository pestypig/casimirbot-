import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { resolveHelixAccountPanelAccess } from "@shared/helix-account-session";
import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import { panelRegistry } from "@/lib/desktop/panelRegistry";
import { getInterfaceLanguageOption } from "@/lib/i18n/interfaceLanguage";
import { useInterfaceText } from "@/lib/i18n/interfaceText";
import { getInterfacePanelTitle } from "@/lib/i18n/panelTitles";
import { isDiscoverableLaunchPanel } from "@/lib/workstation/launchPanelPolicy";
import {
  HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT,
  fetchAccountCapabilityPolicy,
  readCachedAccountCapabilityPolicy,
} from "@/lib/workstation/accountCapabilityPolicy";
import {
  HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT,
  type HelixWorkstationProceduralStepPayload,
} from "@/lib/workstation/proceduralPlaybackContract";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";

export function WorkstationPanelTabs({ groupId }: { groupId: string }) {
  const group = useWorkstationLayoutStore((state) => state.groups[groupId]);
  const activeGroupId = useWorkstationLayoutStore((state) => state.activeGroupId);
  const setActivePanel = useWorkstationLayoutStore((state) => state.setActivePanel);
  const closePanelFromGroup = useWorkstationLayoutStore((state) => state.closePanelFromGroup);
  const openPanelInGroup = useWorkstationLayoutStore((state) => state.openPanelInGroup);
  const focusGroup = useWorkstationLayoutStore((state) => state.focusGroup);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [plusPulseActive, setPlusPulseActive] = useState(false);
  const [plusPulseTick, setPlusPulseTick] = useState(0);
  const [targetPanelId, setTargetPanelId] = useState<string | null>(null);
  const [accountPolicy, setAccountPolicy] = useState<HelixAccountCapabilityPolicy | null>(() =>
    readCachedAccountCapabilityPolicy(),
  );
  const { userSettings } = useHelixStartSettings();
  const interfaceLanguage = getInterfaceLanguageOption(userSettings.interfaceLanguage);
  const { t } = useInterfaceText(interfaceLanguage.code);

  const availablePanels = useMemo(
    () =>
      panelRegistry
        .filter((panel) => !panel.startHidden && isDiscoverableLaunchPanel(String(panel.id)))
        .sort((a, b) => {
          const aReady = a.workstationCapabilities?.v1_job_ready ? 1 : 0;
          const bReady = b.workstationCapabilities?.v1_job_ready ? 1 : 0;
          if (aReady !== bReady) return bReady - aReady;
          const aTitle = getInterfacePanelTitle(t, String(a.id), a.title);
          const bTitle = getInterfacePanelTitle(t, String(b.id), b.title);
          return aTitle.localeCompare(bTitle, undefined, { sensitivity: "base" });
        }),
    [t],
  );

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStep = (event: Event) => {
      const detail = (event as CustomEvent<HelixWorkstationProceduralStepPayload | null>)?.detail;
      if (!detail) return;
      const targetedGroup = detail.groupId?.trim();
      const isThisGroup = targetedGroup ? targetedGroup === groupId : activeGroupId === groupId;
      if (!isThisGroup) return;
      if (detail.step === "highlight_plus") {
        setPlusPulseActive(true);
        setPlusPulseTick(Date.now());
        return;
      }
      if (detail.step === "open_picker") {
        setPlusPulseActive(true);
        setPlusPulseTick(Date.now());
        setPickerOpen(true);
        focusGroup(groupId);
        return;
      }
      if (detail.step === "target_panel") {
        if (detail.panelId) {
          setTargetPanelId(detail.panelId);
        }
        setPickerOpen(true);
        focusGroup(groupId);
        return;
      }
      if (detail.step === "close_picker" || detail.step === "open_doc" || detail.step === "read_start") {
        setPickerOpen(false);
      }
    };
    window.addEventListener(HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT, handleStep as EventListener);
    return () => {
      window.removeEventListener(HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT, handleStep as EventListener);
    };
  }, [activeGroupId, focusGroup, groupId]);

  useEffect(() => {
    if (plusPulseTick <= 0) return;
    const timer = window.setTimeout(() => setPlusPulseActive(false), 1200);
    return () => window.clearTimeout(timer);
  }, [plusPulseTick]);

  useEffect(() => {
    if (!targetPanelId) return;
    const clearTargetTimer = window.setTimeout(() => setTargetPanelId(null), 1800);
    const closePickerTimer = window.setTimeout(() => setPickerOpen(false), 700);
    return () => {
      window.clearTimeout(clearTargetTimer);
      window.clearTimeout(closePickerTimer);
    };
  }, [targetPanelId]);

  if (!group) return null;

  return (
    <div
      className={`flex items-center gap-2 border-b px-2 py-2 ${
        activeGroupId === groupId ? "border-white/20 bg-slate-900/60" : "border-white/10 bg-slate-900/35"
      }`}
      onMouseDown={() => focusGroup(groupId)}
      onFocusCapture={() => focusGroup(groupId)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {group.panelIds.map((panelId) => {
            const panelDef = panelRegistry.find((panel) => panel.id === panelId);
            const isActive = panelId === group.activePanelId;
            const panelTitle = getInterfacePanelTitle(t, panelId, panelDef?.title ?? panelId);
            return (
              <button
                key={panelId}
                type="button"
                onClick={() => setActivePanel(groupId, panelId)}
                className={`group inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs whitespace-nowrap ${
                  isActive
                    ? "border-sky-300/50 bg-sky-500/20 text-sky-100"
                    : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/10"
                }`}
              >
                <span>{panelTitle}</span>
                <span
                  className="rounded px-1 text-[10px] text-slate-400 hover:bg-white/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    closePanelFromGroup(groupId, panelId);
                  }}
                >
                  x
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-1">
        <button
          type="button"
          className={`rounded border px-2 py-1 text-xs text-slate-200 hover:bg-white/10 ${
            plusPulseActive
              ? "border-cyan-300/80 bg-cyan-500/20 shadow-[0_0_16px_rgba(34,211,238,0.55)]"
              : "border-white/15 bg-black/25"
          }`}
          onClick={() => setPickerOpen((current) => !current)}
          aria-expanded={pickerOpen}
          aria-label={t("workstation.panelPicker.open")}
        >
          +
        </button>
        {pickerOpen ? (
          <div className="absolute right-0 top-8 z-[90] w-72 rounded-lg border border-white/20 bg-slate-950/95 p-2 shadow-xl">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">
              {t("workstation.panelPicker.title")}
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {availablePanels.map((panel) => {
                const panelTitle = getInterfacePanelTitle(t, String(panel.id), panel.title);
                const panelAccess = resolveHelixAccountPanelAccess(accountPolicy, String(panel.id));
                const locked = panelAccess.state === "locked";
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => {
                      openPanelInGroup(groupId, panel.id);
                      focusGroup(groupId);
                      setPickerOpen(false);
                    }}
                    className={`block w-full rounded px-2 py-1 text-left text-xs text-slate-200 hover:bg-white/10 ${
                      targetPanelId === panel.id
                        ? "bg-cyan-500/20 ring-1 ring-cyan-300/70 shadow-[0_0_14px_rgba(34,211,238,0.45)]"
                        : ""
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {locked ? <Lock className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" /> : null}
                      <span>{panelTitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
