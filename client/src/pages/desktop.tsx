import { useCallback, useEffect, useMemo, useRef } from "react";
import { Settings } from "lucide-react";
import { panelRegistry, getPanelDef, type PanelDefinition } from "@/lib/desktop/panelRegistry";
import { useDesktopStore } from "@/store/useDesktopStore";
import { DesktopWindow } from "@/components/desktop/DesktopWindow";
import { DesktopTaskbar } from "@/components/desktop/DesktopTaskbar";
import { HelixWorkstationShell } from "@/components/workstation/HelixWorkstationShell";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { HelixSettingsDialogContent } from "@/components/HelixSettingsDialogContent";
import SplashCursor from "@/components/SplashCursor";
import { HelixAskPill } from "@/components/helix/HelixAskPill";
import {
  PROFILE_STORAGE_KEY,
  useHelixStartSettings,
} from "@/hooks/useHelixStartSettings";
import { useHelixSettingsDialog } from "@/hooks/useHelixSettingsDialog";
import { decodeLayout, resolvePanelIds, type DesktopLayoutHash } from "@/lib/desktop/shareState";
import { useKnowledgeProjectsStore } from "@/store/useKnowledgeProjectsStore";
import { fetchUiPreferences, type EssenceEnvironmentContext, type UiPreference } from "@/lib/agi/preferences";
import { SurfaceStack } from "@/components/surface/SurfaceStack";
import { generateSurfaceRecipe } from "@/lib/surfacekit/generateSurface";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import {
  HELIX_WORKSTATION_ACTION_EVENT,
  coerceHelixWorkstationActions,
  type HelixWorkstationAction,
} from "@/lib/workstation/workstationActionContract";
import { executeHelixPanelAction } from "@/lib/workstation/panelActionAdapters";
import { runWorkstationJob } from "@/lib/workstation/jobExecutor";
import { emitHelixWorkstationProceduralStep } from "@/lib/workstation/proceduralPlaybackContract";
import { startWorkstationClipboardCapture } from "@/lib/workstation/workstationClipboard";
import { startWorkstationTimelineCapture } from "@/lib/workstation/workstationTimelineCapture";
import {
  createWorkstationActionTraceId,
  emitWorkstationActionLiveEvent,
} from "@/lib/workstation/workstationActionLiveEvents";

const LAYOUT_COLLECTION_KEYS = ["panels", "windows", "openPanels", "items", "children", "columns", "stack", "slots"];
const MAX_LAYOUT_DEPTH = 5;
const PENDING_PANEL_KEY = "helix:pending-panel";
const NOISE_GENS_PANEL_ID = "helix-noise-gens";
const ESSENCE_CONSOLE_PANEL_ID = "agi-essence-console";
const NOISE_GENS_AUTO_OPEN_SUPPRESS = new Set([ESSENCE_CONSOLE_PANEL_ID]);
const WORKSTATION_PROCEDURAL_STEP_DELAY_MS = 220;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, Math.max(0, ms));
  });
}
function collectPanelIdsFromStructure(
  input: unknown,
  target: Set<string>,
  depth = 0,
  allowLeaf = false
): void {
  if (input === null || input === undefined || depth > MAX_LAYOUT_DEPTH) {
    return;
  }
  if (typeof input === "string") {
    if (allowLeaf) {
      const trimmed = input.trim();
      if (trimmed) {
        target.add(trimmed);
      }
    }
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((entry) => collectPanelIdsFromStructure(entry, target, depth + 1, true));
    return;
  }
  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (allowLeaf) {
      const candidate =
        typeof record.panelId === "string"
          ? record.panelId
          : typeof record["panel_id"] === "string"
            ? (record["panel_id"] as string)
            : typeof record.panel === "string"
              ? record.panel
              : typeof record.id === "string"
                ? record.id
                : null;
      if (candidate) {
        const trimmed = candidate.trim();
        if (trimmed) {
          target.add(trimmed);
        }
      }
    }
    for (const key of LAYOUT_COLLECTION_KEYS) {
      if (key in record) {
        collectPanelIdsFromStructure(record[key], target, depth + 1, true);
      }
    }
  }
}

export default function DesktopPage() {
  const { windows, registerFromManifest, open } = useDesktopStore();
  const workstationMode = useWorkstationLayoutStore((state) => state.mode);
  const { userSettings, updateSettings } = useHelixStartSettings();
  const {
    settingsOpen,
    settingsTab,
    setSettingsTab,
    openSettings,
    handleSettingsOpenChange,
  } = useHelixSettingsDialog("preferences");
  const { refresh: refreshProjects, selectProjects, projects } = useKnowledgeProjectsStore((state) => ({
    projects: state.projects,
    refresh: state.refresh,
    selectProjects: state.selectProjects,
  }));
  const { exportActiveContext } = useKnowledgeProjectsStore((state) => ({
    exportActiveContext: state.exportActiveContext,
  }));
  const hashAppliedRef = useRef(false);
  const environmentAppliedRef = useRef(false);
  const autoOpenSuppressRef = useRef<Set<string> | null>(null);
  const wallpaperRecipe = useMemo(
    () =>
      generateSurfaceRecipe({
        seed: "helix-wallpaper-v1",
        context: "desktop-wallpaper",
        density: "medium",
      }),
    [],
  );
  const allowAutoOpen = false;
  const workstationEnabledFlag =
    String((import.meta as any)?.env?.VITE_HELIX_WORKSTATION_SHELL ?? "1") !== "0";
  const workstationEnabled = workstationEnabledFlag && workstationMode === "workstation";

  const openPanelUniversal = useCallback(
    (panelId: string) => {
      if (!panelId) return;
      if (!getPanelDef(panelId)) return;
      if (workstationEnabled) {
        useWorkstationLayoutStore.getState().openPanelInActiveGroup(panelId);
        return;
      }
      open(panelId);
    },
    [open, workstationEnabled],
  );

  useEffect(() => {
    registerFromManifest(panelRegistry, { allowDefaultOpen: false });
  }, [registerFromManifest]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const pending = window.localStorage.getItem(PENDING_PANEL_KEY);
      if (pending) {
        if (pending === NOISE_GENS_PANEL_ID) {
          autoOpenSuppressRef.current = NOISE_GENS_AUTO_OPEN_SUPPRESS;
        }
        openPanelUniversal(pending);
        window.localStorage.removeItem(PENDING_PANEL_KEY);
      }
    } catch {
      // ignore storage read failures
    }
  }, [openPanelUniversal]);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const custom = event as CustomEvent<{ id?: string }>;
      const id = custom?.detail?.id;
      if (!id) return;
      openPanelUniversal(id);
    };
    window.addEventListener("open-helix-panel", handleOpen as EventListener);
    return () => {
      window.removeEventListener("open-helix-panel", handleOpen as EventListener);
    };
  }, [openPanelUniversal]);

  useEffect(() => {
    const handleKnowledgeOpen = (event: Event) => {
      const custom = event as CustomEvent<{ projectId?: string }>;
      const projectId = custom?.detail?.projectId;
      if (projectId) {
        selectProjects([projectId]);
      }
      openSettings("knowledge");
    };
    window.addEventListener("open-knowledge-project", handleKnowledgeOpen as EventListener);
    return () => {
      window.removeEventListener("open-knowledge-project", handleKnowledgeOpen as EventListener);
    };
  }, [openSettings, selectProjects]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stopClipboardCapture = startWorkstationClipboardCapture();
    const stopTimelineCapture = startWorkstationTimelineCapture();
    const handleWorkstationAction = (event: Event) => {
      const detail = (event as CustomEvent<unknown>)?.detail;
      const actions = coerceHelixWorkstationActions(detail);
      if (actions.length === 0) return;
      const store = useWorkstationLayoutStore.getState();
      const runAction = async (action: HelixWorkstationAction) => {
        const traceId = createWorkstationActionTraceId(action.action);
        const startedAtMs = Date.now();
        const publish = (args: {
          ok: boolean;
          kind?: "workstation_action_receipt" | "workstation_procedural_step";
          message?: string;
          artifact?: Record<string, unknown> | null;
        }) => {
          emitWorkstationActionLiveEvent({
            contextId: HELIX_ASK_CONTEXT_ID.desktop,
            traceId,
            action,
            ok: args.ok,
            kind: args.kind,
            message: args.message,
            artifact: args.artifact ?? null,
            durationMs: Math.max(0, Date.now() - startedAtMs),
          });
        };
        switch (action.action) {
          case "open_panel":
            if (!getPanelDef(action.panel_id)) {
              publish({ ok: false, message: `Unknown panel: ${action.panel_id}` });
              return;
            }
            openPanelUniversal(action.panel_id);
            publish({ ok: true });
            return;
          case "focus_panel": {
            if (!getPanelDef(action.panel_id)) {
              publish({ ok: false, message: `Unknown panel: ${action.panel_id}` });
              return;
            }
            if (!workstationEnabled) {
              openPanelUniversal(action.panel_id);
              publish({ ok: true, message: "Focused via freeform mode." });
              return;
            }
            const groupId =
              action.group_id ??
              Object.values(store.groups).find((group) => group.panelIds.includes(action.panel_id))
                ?.id;
            if (groupId) {
              store.setActivePanel(groupId, action.panel_id);
              store.focusGroup(groupId);
              publish({ ok: true });
              return;
            }
            openPanelUniversal(action.panel_id);
            publish({ ok: true, message: "Panel opened because no existing group owned it." });
            return;
          }
          case "close_panel": {
            if (!workstationEnabled) {
              publish({ ok: false, message: "Close panel ignored outside workstation mode." });
              return;
            }
            if (action.group_id) {
              store.closePanelFromGroup(action.group_id, action.panel_id);
              publish({ ok: true });
              return;
            }
            Object.values(store.groups).forEach((group) => {
              if (group.panelIds.includes(action.panel_id)) {
                store.closePanelFromGroup(group.id, action.panel_id);
              }
            });
            publish({ ok: true });
            return;
          }
          case "close_active_panel": {
            if (!workstationEnabled) {
              publish({ ok: false, message: "Close active panel ignored outside workstation mode." });
              return;
            }
            const closed = store.closeActivePanel();
            if (!closed) {
              publish({ ok: false, message: "No active panel to close." });
              return;
            }
            publish({ ok: true, message: `Closed active panel ${closed.panelId}.` });
            return;
          }
          case "focus_next_panel": {
            if (!workstationEnabled) {
              publish({ ok: false, message: "Focus next panel ignored outside workstation mode." });
              return;
            }
            const focused = store.focusAdjacentPanel("next");
            if (!focused) {
              publish({ ok: false, message: "No panel available to focus next." });
              return;
            }
            publish({ ok: true, message: `Focused ${focused.panelId}.` });
            return;
          }
          case "focus_previous_panel": {
            if (!workstationEnabled) {
              publish({ ok: false, message: "Focus previous panel ignored outside workstation mode." });
              return;
            }
            const focused = store.focusAdjacentPanel("previous");
            if (!focused) {
              publish({ ok: false, message: "No panel available to focus previous." });
              return;
            }
            publish({ ok: true, message: `Focused ${focused.panelId}.` });
            return;
          }
          case "reopen_last_closed_panel": {
            if (!workstationEnabled) {
              publish({ ok: false, message: "Reopen panel ignored outside workstation mode." });
              return;
            }
            const reopened = store.reopenLastClosedPanel();
            if (!reopened) {
              publish({ ok: false, message: "No recently closed panel to reopen." });
              return;
            }
            publish({ ok: true, message: `Reopened ${reopened.panelId}.` });
            return;
          }
          case "split_active_group":
            if (workstationEnabled) {
              store.splitActiveGroup(action.direction);
              publish({ ok: true });
              return;
            }
            publish({ ok: false, message: "Split active group ignored outside workstation mode." });
            return;
          case "open_settings":
            openSettings(action.tab ?? "preferences");
            publish({ ok: true });
            return;
          case "set_chat_dock":
            if (!workstationEnabled) {
              publish({ ok: false, message: "Set chat dock ignored outside workstation mode." });
              return;
            }
            if (typeof action.width_px === "number") {
              store.setChatDockWidth(action.width_px);
            }
            if (
              typeof action.collapsed === "boolean" &&
              action.collapsed !== store.chatDock.collapsed
            ) {
              store.toggleChatDock();
            }
            publish({ ok: true });
            return;
          case "run_panel_action": {
            const actionId = action.action_id.trim().toLowerCase();
            const isProceduralDocsAction =
              workstationEnabled &&
              action.panel_id === "docs-viewer" &&
              (actionId === "open_doc" || actionId === "open_doc_and_read");
            const targetGroupId =
              store.activeGroupId ??
              Object.values(store.groups).find((group) => group.panelIds.includes("docs-viewer"))?.id;
            if (isProceduralDocsAction) {
              emitHelixWorkstationProceduralStep({
                traceId,
                step: "highlight_plus",
                groupId: targetGroupId,
                panelId: "docs-viewer",
              });
              publish({
                ok: true,
                kind: "workstation_procedural_step",
                message: "Step: focusing panel picker (+).",
                artifact: { phase: "highlight_plus" },
              });
              await sleep(WORKSTATION_PROCEDURAL_STEP_DELAY_MS);

              emitHelixWorkstationProceduralStep({
                traceId,
                step: "open_picker",
                groupId: targetGroupId,
                panelId: "docs-viewer",
              });
              publish({
                ok: true,
                kind: "workstation_procedural_step",
                message: "Step: opening panel picker.",
                artifact: { phase: "open_picker" },
              });
              await sleep(WORKSTATION_PROCEDURAL_STEP_DELAY_MS);

              emitHelixWorkstationProceduralStep({
                traceId,
                step: "target_panel",
                groupId: targetGroupId,
                panelId: "docs-viewer",
              });
              publish({
                ok: true,
                kind: "workstation_procedural_step",
                message: "Step: targeting Docs panel.",
                artifact: { phase: "target_panel", panel_id: "docs-viewer" },
              });
              await sleep(WORKSTATION_PROCEDURAL_STEP_DELAY_MS + 80);
            }

            const result = executeHelixPanelAction(
              {
                panel_id: action.panel_id,
                action_id: action.action_id,
                args: action.args,
              },
              {
                openPanel: (panelId, groupId) => {
                  if (groupId && workstationEnabled) {
                    store.openPanelInGroup(groupId, panelId);
                    return;
                  }
                  openPanelUniversal(panelId);
                },
                focusPanel: (panelId, groupId) => {
                  if (groupId && workstationEnabled) {
                    store.setActivePanel(groupId, panelId);
                    store.focusGroup(groupId);
                    return;
                  }
                  if (workstationEnabled) {
                    const hit = Object.values(store.groups).find((group) =>
                      group.panelIds.includes(panelId),
                    );
                    if (hit) {
                      store.setActivePanel(hit.id, panelId);
                      store.focusGroup(hit.id);
                      return;
                    }
                  }
                  openPanelUniversal(panelId);
                },
                closePanel: (panelId, groupId) => {
                  if (!workstationEnabled) return;
                  if (groupId) {
                    store.closePanelFromGroup(groupId, panelId);
                    return;
                  }
                  Object.values(store.groups).forEach((group) => {
                    if (group.panelIds.includes(panelId)) {
                      store.closePanelFromGroup(group.id, panelId);
                    }
                  });
                },
                openSettings: (tab) => openSettings(tab ?? "preferences"),
              },
            );
            if (result.ok && isProceduralDocsAction) {
              const path =
                result.artifact && typeof result.artifact.path === "string"
                  ? result.artifact.path
                  : undefined;
              emitHelixWorkstationProceduralStep({
                traceId,
                step: "open_doc",
                groupId: targetGroupId,
                panelId: "docs-viewer",
                docPath: path,
              });
              publish({
                ok: true,
                message: "Step: opening selected document in Docs panel.",
                artifact: { phase: "open_doc", path: path ?? null },
              });
              if (actionId === "open_doc_and_read") {
                emitHelixWorkstationProceduralStep({
                  traceId,
                  step: "read_start",
                  groupId: targetGroupId,
                  panelId: "docs-viewer",
                  docPath: path,
                });
                publish({
                  ok: true,
                  message: "Step: starting read-aloud.",
                  artifact: { phase: "read_start", path: path ?? null },
                });
              }
              emitHelixWorkstationProceduralStep({
                traceId,
                step: "close_picker",
                groupId: targetGroupId,
                panelId: "docs-viewer",
                docPath: path,
              });
              publish({
                ok: true,
                kind: "workstation_procedural_step",
                message: "Step: closing panel picker.",
                artifact: { phase: "close_picker", path: path ?? null },
              });
            }
            publish({
              ok: result.ok,
              message: result.message,
              artifact: result.artifact ?? null,
            });
            return;
          }
          case "run_job":
            publish({ ok: true, message: "Delegated to workstation job executor." });
            const payloadWithJobId = action.payload.job_id
              ? action.payload
              : { ...action.payload, job_id: traceId };
            void runWorkstationJob({
              contextId: HELIX_ASK_CONTEXT_ID.desktop,
              payload: payloadWithJobId,
              executionContext: {
                openPanel: (panelId, groupId) => {
                  if (groupId && workstationEnabled) {
                    store.openPanelInGroup(groupId, panelId);
                    return;
                  }
                  openPanelUniversal(panelId);
                },
                focusPanel: (panelId, groupId) => {
                  if (groupId && workstationEnabled) {
                    store.setActivePanel(groupId, panelId);
                    store.focusGroup(groupId);
                    return;
                  }
                  if (workstationEnabled) {
                    const hit = Object.values(store.groups).find((group) =>
                      group.panelIds.includes(panelId),
                    );
                    if (hit) {
                      store.setActivePanel(hit.id, panelId);
                      store.focusGroup(hit.id);
                      return;
                    }
                  }
                  openPanelUniversal(panelId);
                },
                closePanel: (panelId, groupId) => {
                  if (!workstationEnabled) return;
                  if (groupId) {
                    store.closePanelFromGroup(groupId, panelId);
                    return;
                  }
                  Object.values(store.groups).forEach((group) => {
                    if (group.panelIds.includes(panelId)) {
                      store.closePanelFromGroup(group.id, panelId);
                    }
                  });
                },
                openSettings: (tab) => openSettings(tab ?? "preferences"),
              },
            });
            return;
          case "toggle_mobile_drawer":
            publish({ ok: false, message: "Toggle mobile drawer is not supported on desktop." });
            return;
          default:
            publish({ ok: false, message: "Unhandled workstation action." });
            return;
        }
      };
      for (const action of actions) {
        void runAction(action);
      }
    };
    window.addEventListener(HELIX_WORKSTATION_ACTION_EVENT, handleWorkstationAction as EventListener);
    return () => {
      window.removeEventListener(
        HELIX_WORKSTATION_ACTION_EVENT,
        handleWorkstationAction as EventListener,
      );
      stopClipboardCapture();
      stopTimelineCapture();
    };
  }, [openPanelUniversal, openSettings, workstationEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) return;
      if (event.key !== ",") return;
      event.preventDefault();
      openSettings("preferences");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSettings]);

  const applyLayout = useCallback(
    (layout: DesktopLayoutHash) => {
      if (layout.projectSlug) {
        const match = projects.find((project) => project.hashSlug === layout.projectSlug);
        if (match) {
          selectProjects([match.id]);
        }
      }
      const panels = resolvePanelIds(layout.panels);
      if (panels.includes(NOISE_GENS_PANEL_ID)) {
        autoOpenSuppressRef.current = NOISE_GENS_AUTO_OPEN_SUPPRESS;
      }
      panels.forEach((id) => openPanelUniversal(id));
    },
    [openPanelUniversal, projects, selectProjects],
  );

  const applyEnvironment = useCallback(
    (context: EssenceEnvironmentContext | null | undefined) => {
      if (!context || !allowAutoOpen) return;
      const panelIds = new Set<string>();
      collectPanelIdsFromStructure(context.template.defaultPanels ?? [], panelIds, 0, true);
      collectPanelIdsFromStructure(context.template.defaultDesktopLayout, panelIds);
      collectPanelIdsFromStructure(context.environment.userOverrides?.layout, panelIds);
      collectPanelIdsFromStructure(context.environment.userOverrides?.widgets, panelIds);
      panelIds.forEach((panelId) => {
        if (panelId && getPanelDef(panelId)) {
          if (autoOpenSuppressRef.current?.has(panelId)) {
            return;
          }
          openPanelUniversal(panelId);
        }
      });
    },
    [allowAutoOpen, openPanelUniversal],
  );

  useEffect(() => {
    if (hashAppliedRef.current) return;
    if (typeof window === "undefined") return;
    const layout = decodeLayout(window.location.hash ?? "");
    if (!layout.projectSlug && (!layout.panels || layout.panels.length === 0)) {
      return;
    }
    if (layout.projectSlug) {
      const match = projects.find((project) => project.hashSlug === layout.projectSlug);
      if (!match) {
        return;
      }
    }
    applyLayout(layout);
    hashAppliedRef.current = true;
  }, [applyLayout, projects]);

  useEffect(() => {
    const handleApplyLayout = (event: Event) => {
      const detail = (event as CustomEvent<DesktopLayoutHash>).detail;
      if (!detail) return;
      applyLayout(detail);
    };
    window.addEventListener("apply-desktop-layout", handleApplyLayout as EventListener);
    return () => window.removeEventListener("apply-desktop-layout", handleApplyLayout as EventListener);
  }, [applyLayout]);

  const clearSavedChoice = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, []);

  const applyUiPreferences = useCallback(
    (preferences: UiPreference[]) => {
      if (!allowAutoOpen) return;
      if (!Array.isArray(preferences) || preferences.length === 0) {
        return;
      }
      const seen = new Set<string>();
      preferences.forEach((pref) => {
        if (!pref?.key || seen.has(pref.key)) {
          return;
        }
        if (pref.key.startsWith("panel:")) {
          const panelId = pref.key.slice("panel:".length);
          if (panelId) {
            if (autoOpenSuppressRef.current?.has(panelId)) {
              return;
            }
            openPanelUniversal(panelId);
            seen.add(pref.key);
          }
        }
      });
    },
    [allowAutoOpen, openPanelUniversal],
  );

  useEffect(() => {
    let canceled = false;
    fetchUiPreferences()
      .then(({ preferences, environment }) => {
        if (canceled) return;
        if (preferences?.length && allowAutoOpen) {
          applyUiPreferences(preferences);
        }
        if (environment && !environmentAppliedRef.current && allowAutoOpen) {
          applyEnvironment(environment);
          environmentAppliedRef.current = true;
        }
      })
      .catch(() => undefined);
    return () => {
      canceled = true;
    };
  }, [allowAutoOpen, applyEnvironment, applyUiPreferences]);

  const openPanelById = useCallback(
    (panelId: PanelDefinition["id"]) => {
      if (!panelId) return;
      if (!getPanelDef(panelId)) return;
      openPanelUniversal(panelId);
    },
    [openPanelUniversal],
  );
  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={handleSettingsOpenChange}
    >
      {userSettings.enableSplashCursor && <SplashCursor />}
      <div
        className="mood-transition-scope relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100"
      >
        <SurfaceStack recipe={wallpaperRecipe} />
        <div className="pointer-events-none absolute left-0 right-0 top-4 flex items-center justify-end gap-2 pr-4">
          <p className="hidden text-xs uppercase tracking-[0.25em] text-slate-400 md:block">
            Helix Controls
          </p>
          <DialogTrigger asChild>
            <button
              aria-label="Open Helix Start settings"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </DialogTrigger>
        </div>

        {workstationEnabled ? (
          <HelixWorkstationShell onOpenPanel={openPanelUniversal} />
        ) : (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-[18%] z-10 flex flex-col items-center px-6">
              <HelixAskPill
                className="pointer-events-auto w-full"
                contextId={HELIX_ASK_CONTEXT_ID.desktop}
                maxWidthClassName="max-w-4xl mx-auto"
                onOpenPanel={openPanelById}
                onOpenConversation={() => {
                  openPanelUniversal(ESSENCE_CONSOLE_PANEL_ID);
                }}
              />
            </div>
            {Object.values(windows)
              .filter((w) => w.isOpen)
              .sort((a, b) => a.z - b.z)
              .map((w) => {
                const def = getPanelDef(w.id);
                if (!def) return null;
                return (
                  <DesktopWindow
                    key={w.id}
                    id={w.id}
                    title={def.title}
                    Loader={def.loader}
                  />
                );
              })}
          </>
        )}

        <DesktopTaskbar
          onOpenPanel={openPanelUniversal}
          showStart={!workstationEnabled}
        />
      </div>

      <HelixSettingsDialogContent
        settingsTab={settingsTab}
        onSettingsTabChange={setSettingsTab}
        userSettings={userSettings}
        updateSettings={updateSettings}
        onClearSavedChoice={clearSavedChoice}
        onClose={() => handleSettingsOpenChange(false)}
      />
    </Dialog>
  );
}


