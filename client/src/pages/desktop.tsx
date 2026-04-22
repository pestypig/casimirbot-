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

const LAYOUT_COLLECTION_KEYS = ["panels", "windows", "openPanels", "items", "children", "columns", "stack", "slots"];
const MAX_LAYOUT_DEPTH = 5;
const PENDING_PANEL_KEY = "helix:pending-panel";
const NOISE_GENS_PANEL_ID = "helix-noise-gens";
const ESSENCE_CONSOLE_PANEL_ID = "agi-essence-console";
const NOISE_GENS_AUTO_OPEN_SUPPRESS = new Set([ESSENCE_CONSOLE_PANEL_ID]);
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
    const handleWorkstationAction = (event: Event) => {
      const detail = (event as CustomEvent<unknown>)?.detail;
      const actions = coerceHelixWorkstationActions(detail);
      if (actions.length === 0) return;
      const store = useWorkstationLayoutStore.getState();
      const runAction = (action: HelixWorkstationAction) => {
        switch (action.action) {
          case "open_panel":
            openPanelUniversal(action.panel_id);
            return;
          case "focus_panel": {
            if (!workstationEnabled) {
              openPanelUniversal(action.panel_id);
              return;
            }
            const groupId =
              action.group_id ??
              Object.values(store.groups).find((group) => group.panelIds.includes(action.panel_id))
                ?.id;
            if (groupId) {
              store.setActivePanel(groupId, action.panel_id);
              store.focusGroup(groupId);
              return;
            }
            openPanelUniversal(action.panel_id);
            return;
          }
          case "close_panel": {
            if (!workstationEnabled) return;
            if (action.group_id) {
              store.closePanelFromGroup(action.group_id, action.panel_id);
              return;
            }
            Object.values(store.groups).forEach((group) => {
              if (group.panelIds.includes(action.panel_id)) {
                store.closePanelFromGroup(group.id, action.panel_id);
              }
            });
            return;
          }
          case "split_active_group":
            if (workstationEnabled) {
              store.splitActiveGroup(action.direction);
            }
            return;
          case "open_settings":
            openSettings(action.tab ?? "preferences");
            return;
          case "set_chat_dock":
            if (!workstationEnabled) return;
            if (typeof action.width_px === "number") {
              store.setChatDockWidth(action.width_px);
            }
            if (
              typeof action.collapsed === "boolean" &&
              action.collapsed !== store.chatDock.collapsed
            ) {
              store.toggleChatDock();
            }
            return;
          case "run_panel_action":
            executeHelixPanelAction(
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
            return;
          case "run_job":
            void runWorkstationJob({
              contextId: HELIX_ASK_CONTEXT_ID.desktop,
              payload: action.payload,
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
            return;
          default:
            return;
        }
      };
      actions.forEach(runAction);
    };
    window.addEventListener(HELIX_WORKSTATION_ACTION_EVENT, handleWorkstationAction as EventListener);
    return () => {
      window.removeEventListener(
        HELIX_WORKSTATION_ACTION_EVENT,
        handleWorkstationAction as EventListener,
      );
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


