import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { panelRegistry, getPanelDef } from "@/lib/desktop/panelRegistry";
import { useDesktopStore } from "@/store/useDesktopStore";
import { DesktopWindow } from "@/components/desktop/DesktopWindow";
import { DesktopTaskbar } from "@/components/desktop/DesktopTaskbar";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { HelixSettingsDialogContent } from "@/components/HelixSettingsDialogContent";
import SplashCursor from "@/components/SplashCursor";
import {
  PROFILE_STORAGE_KEY,
  useHelixStartSettings,
  type SettingsTab
} from "@/hooks/useHelixStartSettings";
import { decodeLayout, resolvePanelIds, type DesktopLayoutHash } from "@/lib/desktop/shareState";
import { useKnowledgeProjectsStore } from "@/store/useKnowledgeProjectsStore";
import { fetchUiPreferences, type EssenceEnvironmentContext, type UiPreference } from "@/lib/agi/preferences";
import { SurfaceStack } from "@/components/surface/SurfaceStack";
import { generateSurfaceRecipe } from "@/lib/surfacekit/generateSurface";

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
  const { userSettings, updateSettings } = useHelixStartSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("preferences");
  const { refresh: refreshProjects, selectProjects, projects } = useKnowledgeProjectsStore((state) => ({
    projects: state.projects,
    refresh: state.refresh,
    selectProjects: state.selectProjects,
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

  useEffect(() => {
    registerFromManifest(panelRegistry);
  }, [registerFromManifest]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const pending = window.localStorage.getItem(PENDING_PANEL_KEY);
      if (pending) {
        if (pending === NOISE_GENS_PANEL_ID) {
          autoOpenSuppressRef.current = NOISE_GENS_AUTO_OPEN_SUPPRESS;
        }
        open(pending);
        window.localStorage.removeItem(PENDING_PANEL_KEY);
      }
    } catch {
      // ignore storage read failures
    }
  }, [open]);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const custom = event as CustomEvent<{ id?: string }>;
      const id = custom?.detail?.id;
      if (!id) return;
      open(id);
    };
    window.addEventListener("open-helix-panel", handleOpen as EventListener);
    return () => {
      window.removeEventListener("open-helix-panel", handleOpen as EventListener);
    };
  }, [open]);

  useEffect(() => {
    const handleKnowledgeOpen = (event: Event) => {
      const custom = event as CustomEvent<{ projectId?: string }>;
      const projectId = custom?.detail?.projectId;
      if (projectId) {
        selectProjects([projectId]);
      }
      setSettingsTab("knowledge");
      setSettingsOpen(true);
    };
    window.addEventListener("open-knowledge-project", handleKnowledgeOpen as EventListener);
    return () => {
      window.removeEventListener("open-knowledge-project", handleKnowledgeOpen as EventListener);
    };
  }, [selectProjects]);

  useEffect(() => {
    const handleSettingsOpen = (event: Event) => {
      const custom = event as CustomEvent<{ tab?: SettingsTab }>;
      setSettingsTab(custom?.detail?.tab ?? "preferences");
      setSettingsOpen(true);
    };
    window.addEventListener("open-desktop-settings", handleSettingsOpen as EventListener);
    return () => {
      window.removeEventListener("open-desktop-settings", handleSettingsOpen as EventListener);
    };
  }, []);

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
      panels.forEach((id) => open(id));
    },
    [open, projects, selectProjects],
  );

  const applyEnvironment = useCallback(
    (context: EssenceEnvironmentContext | null | undefined) => {
      if (!context) return;
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
          open(panelId);
        }
      });
    },
    [open],
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
            open(panelId);
            seen.add(pref.key);
          }
        }
      });
    },
    [open],
  );

  useEffect(() => {
    let canceled = false;
    fetchUiPreferences()
      .then(({ preferences, environment }) => {
        if (canceled) return;
        if (preferences?.length) {
          applyUiPreferences(preferences);
        }
        if (environment && !environmentAppliedRef.current) {
          applyEnvironment(environment);
          environmentAppliedRef.current = true;
        }
      })
      .catch(() => undefined);
    return () => {
      canceled = true;
    };
  }, [applyEnvironment, applyUiPreferences]);

  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={(next) => {
        setSettingsOpen(next);
        if (!next) setSettingsTab("preferences");
      }}
    >
      {userSettings.enableSplashCursor && <SplashCursor />}
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100">
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

        <DesktopTaskbar />
      </div>

      <HelixSettingsDialogContent
        settingsTab={settingsTab}
        onSettingsTabChange={setSettingsTab}
        userSettings={userSettings}
        updateSettings={updateSettings}
        onClearSavedChoice={clearSavedChoice}
        onClose={() => setSettingsOpen(false)}
      />
    </Dialog>
  );
}
