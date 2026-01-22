import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search, Settings } from "lucide-react";
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
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { execute, plan } from "@/lib/agi/api";
import { fetchUiPreferences, type EssenceEnvironmentContext, type UiPreference } from "@/lib/agi/preferences";
import { SurfaceStack } from "@/components/surface/SurfaceStack";
import { generateSurfaceRecipe } from "@/lib/surfacekit/generateSurface";
import type { KnowledgeProjectExport } from "@shared/knowledge";

const LAYOUT_COLLECTION_KEYS = ["panels", "windows", "openPanels", "items", "children", "columns", "stack", "slots"];
const MAX_LAYOUT_DEPTH = 5;
const PENDING_PANEL_KEY = "helix:pending-panel";
const NOISE_GENS_PANEL_ID = "helix-noise-gens";
const ESSENCE_CONSOLE_PANEL_ID = "agi-essence-console";
const NOISE_GENS_AUTO_OPEN_SUPPRESS = new Set([ESSENCE_CONSOLE_PANEL_ID]);
const HELIX_ASK_CONTEXT_ID = "helix-ask-desktop";

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
  const { exportActiveContext } = useKnowledgeProjectsStore((state) => ({
    exportActiveContext: state.exportActiveContext,
  }));
  const { ensureContextSession, addMessage, setActive } = useAgiChatStore();
  const helixAskSessionRef = useRef<string | null>(null);
  const [askInput, setAskInput] = useState("");
  const [askBusy, setAskBusy] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askReplies, setAskReplies] = useState<
    Array<{ id: string; content: string; traceId?: string }>
  >([]);
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

  const getHelixAskSessionId = useCallback(() => {
    if (helixAskSessionRef.current) return helixAskSessionRef.current;
    const sessionId = ensureContextSession(HELIX_ASK_CONTEXT_ID, "Helix Ask");
    helixAskSessionRef.current = sessionId || null;
    return helixAskSessionRef.current;
  }, [ensureContextSession]);

  const handleOpenConversationPanel = useCallback(() => {
    const sessionId = getHelixAskSessionId();
    if (!sessionId) return;
    setActive(sessionId);
    open(ESSENCE_CONSOLE_PANEL_ID);
  }, [getHelixAskSessionId, open, setActive]);

  const handleAskSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (askBusy) return;
      const trimmed = askInput.trim();
      if (!trimmed) return;
      setAskBusy(true);
      setAskError(null);
      setAskInput("");
      const sessionId = getHelixAskSessionId();
      if (sessionId) {
        setActive(sessionId);
        addMessage(sessionId, { role: "user", content: trimmed });
      }
      try {
        let knowledgeContext: KnowledgeProjectExport[] = [];
        try {
          knowledgeContext = await exportActiveContext();
        } catch {
          // best-effort knowledge context
        }
        const planResponse = await plan(
          trimmed,
          "default",
          knowledgeContext,
          undefined,
          {
            essenceConsole: true,
            sessionId: sessionId ?? undefined,
          },
        );
        const executeResponse = await execute(planResponse.traceId);
        const responseText =
          executeResponse.result_summary?.trim() ||
          "Task completed. Open the conversation panel for full details.";
        const replyId = crypto.randomUUID();
        setAskReplies((prev) =>
          [
            { id: replyId, content: responseText, traceId: planResponse.traceId },
            ...prev,
          ].slice(0, 3),
        );
        if (sessionId) {
          addMessage(sessionId, { role: "assistant", content: responseText });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Request failed";
        setAskError(message);
        if (sessionId) {
          addMessage(sessionId, { role: "assistant", content: `Error: ${message}` });
        }
      } finally {
        setAskBusy(false);
      }
    },
    [
      addMessage,
      askBusy,
      askInput,
      exportActiveContext,
      getHelixAskSessionId,
      setActive,
    ],
  );

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

        <div className="pointer-events-none absolute inset-x-0 top-[18%] z-10 flex flex-col items-center px-6">
          <form
            className="pointer-events-auto w-full max-w-2xl"
            onSubmit={handleAskSubmit}
          >
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-200">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
              </div>
              <input
                aria-label="Ask Helix"
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                disabled={askBusy}
                onChange={(event) => setAskInput(event.target.value)}
                placeholder={askBusy ? "Working..." : "Ask anything about this system"}
                type="text"
                value={askInput}
              />
              <button
                aria-label="Submit prompt"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-60"
                disabled={askBusy}
                type="submit"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
          {askError ? (
            <p className="pointer-events-auto mt-3 text-xs text-rose-200">
              {askError}
            </p>
          ) : null}
          {askReplies.length > 0 ? (
            <div className="pointer-events-auto mt-4 w-full max-w-2xl space-y-3">
              {askReplies.map((reply) => (
                <div
                  key={reply.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur"
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Saved in Helix Console</span>
                    <button
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
                      onClick={handleOpenConversationPanel}
                      type="button"
                    >
                      Open conversation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
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
