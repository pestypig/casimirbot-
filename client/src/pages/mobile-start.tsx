import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  Home,
  LayoutGrid,
  MessageCircle,
  PanelsTopLeft,
  Pin,
  Settings,
  X,
  XCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { getPanelDef, panelRegistry } from "@/lib/desktop/panelRegistry";
import { useMobileAppStore } from "@/store/useMobileAppStore";
import { MobilePanelHost } from "@/components/mobile/MobilePanelHost";
import { recordPanelActivity } from "@/lib/essence/activityReporter";
import { SurfaceStack } from "@/components/surface/SurfaceStack";
import { generateSurfaceRecipe } from "@/lib/surfacekit/generateSurface";
import { HelixAskPill } from "@/components/helix/HelixAskPill";
import { useLumaMoodTheme } from "@/lib/luma-mood-theme";
import { Dialog } from "@/components/ui/dialog";
import { HelixSettingsDialogContent } from "@/components/HelixSettingsDialogContent";
import { PROFILE_STORAGE_KEY, useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import { useHelixSettingsDialog } from "@/hooks/useHelixSettingsDialog";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import { MobileHelixAskDrawer } from "@/components/workstation/mobile/MobileHelixAskDrawer";
import {
  HELIX_WORKSTATION_ACTION_EVENT,
  coerceHelixWorkstationActions,
  type HelixWorkstationAction,
} from "@/lib/workstation/workstationActionContract";
import { executeHelixPanelAction } from "@/lib/workstation/panelActionAdapters";
import { runWorkstationJob } from "@/lib/workstation/jobExecutor";
import {
  createWorkstationActionTraceId,
  emitWorkstationActionLiveEvent,
} from "@/lib/workstation/workstationActionLiveEvents";
import { isUserLaunchPanel } from "@/lib/workstation/launchPanelPolicy";

const LONG_PRESS_MS = 650;
const MAX_WARN_STACK = 4;
const PENDING_PANEL_KEY = "helix:pending-panel";

export default function MobileStartPage() {
  const [, setLocation] = useLocation();
  const { stack, activeId, open, activate, close, closeAll, goHome } = useMobileAppStore();
  const toggleMobileDrawer = useWorkstationLayoutStore((state) => state.toggleMobileDrawer);
  const { userSettings, updateSettings } = useHelixStartSettings();
  const {
    settingsOpen,
    settingsTab,
    setSettingsTab,
    openSettings,
    handleSettingsOpenChange,
  } = useHelixSettingsDialog("preferences");
  const mobileWorkstationEnabled =
    String((import.meta as any)?.env?.VITE_HELIX_WORKSTATION_MOBILE_SHELL ?? "1") !== "0";
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [appViewerOpen, setAppViewerOpen] = useState(mobileWorkstationEnabled);
  const pressTimer = useRef<ReturnType<typeof setTimeout>>();
  const pressTriggered = useRef(false);

  const activeEntry = useMemo(
    () => stack.find((entry) => entry.panelId === activeId),
    [stack, activeId]
  );

  const panelOrder = useMemo(
    () => new Map(panelRegistry.map((panel, index) => [panel.id, index])),
    []
  );
  const pinnedPanels = useMemo(() => {
    const pinned = panelRegistry.filter(
      (panel) => panel.pinned || panel.id === "helix-noise-gens"
    );
    const unique = new Map<string, (typeof panelRegistry)[number]>();
    pinned.forEach((panel) => unique.set(panel.id, panel));
    return Array.from(unique.values()).sort((a, b) => {
      if (a.id === "helix-noise-gens") return -1;
      if (b.id === "helix-noise-gens") return 1;
      return (panelOrder.get(a.id) ?? 0) - (panelOrder.get(b.id) ?? 0);
    });
  }, [panelOrder]);
  const pinnedIds = useMemo(
    () => new Set(pinnedPanels.map((panel) => panel.id)),
    [pinnedPanels]
  );
  const gridPanels = useMemo(
    () => panelRegistry.filter((panel) => !pinnedIds.has(panel.id)),
    [pinnedIds]
  );
  const launcherPanels = useMemo(
    () =>
      panelRegistry
        .filter((panel) => !panel.startHidden && isUserLaunchPanel(String(panel.id)))
        .sort((a, b) => {
          const aReady = a.workstationCapabilities?.v1_job_ready ? 1 : 0;
          const bReady = b.workstationCapabilities?.v1_job_ready ? 1 : 0;
          if (aReady !== bReady) return bReady - aReady;
          return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
        }),
    [],
  );

  const recents = useMemo(
    () => [...stack].sort((a, b) => b.openedAt - a.openedAt),
    [stack]
  );
  useLumaMoodTheme({ randomize: true });

  const navButtonClass =
    "min-h-[44px] items-center gap-1.5 rounded-full border border-primary/35 bg-card/72 px-3 py-1 text-[13px] font-medium text-foreground transition hover:border-primary/55 hover:bg-card/86 hover:text-primary active:scale-[0.99] active:border-primary/65 active:bg-primary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-3.5 sm:py-1.5";
  const navPrimaryButtonClass =
    "min-h-[44px] items-center gap-1.5 rounded-full border border-primary/45 bg-primary/18 px-3 py-1 text-[13px] font-semibold text-primary shadow-[0_0_18px_hsl(var(--primary)/0.28)] transition hover:bg-primary/26 active:scale-[0.99] active:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/75 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-3.5 sm:py-1.5";
  const sectionCardClass =
    "rounded-2xl border border-primary/25 bg-card/74 p-4 text-foreground shadow-[0_35px_110px_hsl(var(--primary)/0.18)]";
  const tileButtonClass =
    "group flex flex-col justify-between rounded-2xl border border-primary/25 bg-card/72 p-3 text-left text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-card/86 hover:text-primary active:scale-[0.99] active:border-primary/65 active:bg-primary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/65 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const tileIconClass =
    "flex items-center justify-center rounded-2xl border border-primary/25 bg-primary/16 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.26)]";
  const pinnedBadgeClass =
    "rounded-full border border-primary/35 bg-card/72 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85";
  const recentButtonClass =
    "flex w-full min-h-[48px] items-center justify-between rounded-xl border border-primary/25 bg-card/72 px-4 py-3 text-left text-foreground transition hover:border-primary/60 hover:bg-card/86 hover:text-primary active:scale-[0.99] active:border-primary/65 active:bg-primary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/65 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const wallpaperRecipe = useMemo(
    () =>
      generateSurfaceRecipe({
        seed: "helix-wallpaper-v1",
        context: "desktop-wallpaper",
        density: "medium",
      }),
    []
  );

  const openAppViewer = useCallback(() => {
    setAppViewerOpen(true);
    setShowSwitcher(false);
  }, []);

  const closeAppViewer = useCallback(() => {
    if (!mobileWorkstationEnabled) {
      setAppViewerOpen(false);
    }
    setShowSwitcher(false);
    goHome();
  }, [goHome, mobileWorkstationEnabled]);

  const startLongPress = () => {
    pressTriggered.current = false;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      pressTriggered.current = true;
      setShowSwitcher(true);
    }, LONG_PRESS_MS);
  };

  const endLongPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!pressTriggered.current) {
      goHome();
    }
    pressTriggered.current = false;
  };

  const cancelLongPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTriggered.current = false;
  };

  const openPanelUniversal = useCallback(
    (panelId: string) => {
      if (!panelId) return;
      if (!getPanelDef(panelId)) return;
      open(panelId);
      setAppViewerOpen(true);
      setShowSwitcher(false);
    },
    [open],
  );

  const handleTilePress = (panelId: string) => {
    const panel = panelRegistry.find((p) => p.id === panelId);
    if (!panel) return;
    if (panel.heavy && typeof window !== "undefined") {
      const proceed = window.confirm(
        `${panel.title} is a heavier panel and may be slower on mobile. Open anyway?`
      );
      if (!proceed) return;
    }
    if (typeof window !== "undefined" && window.innerWidth <= 520 && stack.length >= MAX_WARN_STACK) {
      window.alert("Closing older panels to keep performance steady on this device.");
    }
    recordPanelActivity(panel.id, "openMobile");
    openPanelUniversal(panelId);
  };

  const handleOpenPanel = useCallback(
    (panelId: string) => {
      openPanelUniversal(panelId);
    },
    [openPanelUniversal]
  );

  const handleOpenConversation = useCallback(
    (_sessionId: string) => {
      openPanelUniversal("agi-essence-console");
    },
    [openPanelUniversal]
  );

  useEffect(() => {
    recordPanelActivity("mobile-shell", "enter");
    return cancelLongPress;
  }, []);

  useEffect(() => {
    if (!mobileWorkstationEnabled) {
      goHome();
      setShowSwitcher(false);
    }
  }, [goHome, mobileWorkstationEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const pending = window.localStorage.getItem(PENDING_PANEL_KEY);
      if (pending) {
        openPanelUniversal(pending);
        window.localStorage.removeItem(PENDING_PANEL_KEY);
      }
    } catch {
      // ignore storage failures
    }
    const handleOpen = (event: Event) => {
      const custom = event as CustomEvent<{ id?: string }>;
      const id = custom?.detail?.id;
      if (!id) return;
      openPanelUniversal(id);
    };
    window.addEventListener("open-helix-panel", handleOpen as EventListener);
    const handleWorkstationAction = (event: Event) => {
      const detail = (event as CustomEvent<unknown>)?.detail;
      const actions = coerceHelixWorkstationActions(detail);
      if (actions.length === 0) return;
      const store = useWorkstationLayoutStore.getState();
      const runAction = (action: HelixWorkstationAction) => {
        const traceId = createWorkstationActionTraceId(action.action);
        const startedAtMs = Date.now();
        const publish = (args: {
          ok: boolean;
          message?: string;
          artifact?: Record<string, unknown> | null;
        }) => {
          emitWorkstationActionLiveEvent({
            contextId: HELIX_ASK_CONTEXT_ID.mobile,
            traceId,
            action,
            ok: args.ok,
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
          case "focus_panel":
            if (!getPanelDef(action.panel_id)) {
              publish({ ok: false, message: `Unknown panel: ${action.panel_id}` });
              return;
            }
            openPanelUniversal(action.panel_id);
            publish({ ok: true });
            return;
          case "close_panel":
            close(action.panel_id);
            publish({ ok: true });
            return;
          case "close_active_panel": {
            const mobileState = useMobileAppStore.getState();
            if (!mobileState.activeId) {
              publish({ ok: false, message: "No active panel to close." });
              return;
            }
            close(mobileState.activeId);
            publish({ ok: true, message: `Closed active panel ${mobileState.activeId}.` });
            return;
          }
          case "focus_next_panel":
          case "focus_previous_panel": {
            const mobileState = useMobileAppStore.getState();
            const panelIds = mobileState.stack.map((entry) => entry.panelId);
            if (panelIds.length === 0) {
              publish({ ok: false, message: "No open panels to focus." });
              return;
            }
            const currentIndex = Math.max(0, mobileState.activeId ? panelIds.indexOf(mobileState.activeId) : 0);
            const delta = action.action === "focus_previous_panel" ? -1 : 1;
            const nextIndex = (currentIndex + delta + panelIds.length) % panelIds.length;
            const panelId = panelIds[nextIndex] ?? panelIds[0];
            if (!panelId) {
              publish({ ok: false, message: "No open panels to focus." });
              return;
            }
            activate(panelId);
            publish({ ok: true, message: `Focused ${panelId}.` });
            return;
          }
          case "open_settings":
            openSettings(action.tab ?? "preferences");
            publish({ ok: true });
            return;
          case "toggle_mobile_drawer":
            if (typeof action.open === "boolean") {
              store.setMobileDrawerOpen(action.open);
            } else {
              store.toggleMobileDrawer();
            }
            if (action.snap) {
              store.setMobileDrawerSnap(action.snap);
            }
            publish({ ok: true });
            return;
          case "run_panel_action": {
            const result = executeHelixPanelAction(
              {
                panel_id: action.panel_id,
                action_id: action.action_id,
                args: action.args,
              },
              {
                openPanel: (panelId) => openPanelUniversal(panelId),
                focusPanel: (panelId) => {
                  openPanelUniversal(panelId);
                  activate(panelId);
                },
                closePanel: (panelId) => close(panelId),
                openSettings: (tab) => openSettings(tab ?? "preferences"),
              },
            );
            publish({
              ok: result.ok,
              message: result.message,
              artifact: result.artifact ?? null,
            });
            return;
          }
          case "run_job":
            publish({ ok: true, message: "Delegated to workstation job executor." });
            void runWorkstationJob({
              contextId: HELIX_ASK_CONTEXT_ID.mobile,
              payload: action.payload,
              executionContext: {
                openPanel: (panelId) => openPanelUniversal(panelId),
                focusPanel: (panelId) => {
                  openPanelUniversal(panelId);
                  activate(panelId);
                },
                closePanel: (panelId) => close(panelId),
                openSettings: (tab) => openSettings(tab ?? "preferences"),
              },
            });
            return;
          case "set_chat_dock":
          case "split_active_group":
          case "reopen_last_closed_panel":
            publish({ ok: false, message: `${action.action} is not supported on mobile.` });
            return;
          default:
            publish({ ok: false, message: "Unhandled workstation action." });
            return;
        }
      };
      actions.forEach(runAction);
    };
    window.addEventListener(
      HELIX_WORKSTATION_ACTION_EVENT,
      handleWorkstationAction as EventListener,
    );
    return () => {
      window.removeEventListener("open-helix-panel", handleOpen as EventListener);
      window.removeEventListener(
        HELIX_WORKSTATION_ACTION_EVENT,
        handleWorkstationAction as EventListener,
      );
    };
  }, [activate, close, openPanelUniversal, openSettings]);

  const clearSavedChoice = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, []);

  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={handleSettingsOpenChange}
    >
      <div
        className="mood-transition-scope relative min-h-screen bg-background text-foreground"
        style={{ minHeight: "max(100dvh, 100vh)" }}
      >
        <SurfaceStack recipe={wallpaperRecipe} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "var(--surface-laminate)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(140%_200%_at_8%_12%,hsl(var(--primary)/0.24)_0%,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(150%_210%_at_96%_10%,hsl(var(--primary)/0.18)_0%,transparent_72%)]"
        />
        {appViewerOpen ? (
          <div
            className="relative z-10 mx-auto flex min-h-screen max-w-screen-lg flex-col"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)"
            }}
          >
          <header
            className="sticky top-0 z-20 flex items-center justify-between border-b border-primary/25 bg-background/85 px-4 pb-3 backdrop-blur sm:px-5 sm:pb-4"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <button
              className={`inline-flex ${navButtonClass}`}
              onPointerDown={startLongPress}
              onPointerUp={endLongPress}
              onPointerLeave={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onClick={() => {
                if (!pressTriggered.current) {
                  goHome();
                }
              }}
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <div className="flex items-center gap-2">
              {mobileWorkstationEnabled ? (
                <button
                  type="button"
                  className={`inline-flex ${navButtonClass}`}
                  onClick={() => setShowSwitcher(true)}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Panels
                </button>
              ) : null}
              <button
                type="button"
                className={`inline-flex ${navButtonClass}`}
                onClick={() => openSettings("preferences")}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                className={`inline-flex ${navPrimaryButtonClass}`}
                onClick={() => {
                  if (mobileWorkstationEnabled) {
                    toggleMobileDrawer();
                    return;
                  }
                  closeAppViewer();
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Ask
              </button>
            </div>
          </header>

          <main className="relative flex-1 overflow-hidden">
            {activeEntry ? (
              <MobilePanelHost
                key={activeEntry.panelId}
                panelId={activeEntry.panelId}
                title={activeEntry.title}
                loader={activeEntry.loader}
                onHome={() => {
                  goHome();
                  setShowSwitcher(false);
                }}
                onShowSwitcher={() => setShowSwitcher(true)}
              />
            ) : (
              <div className="space-y-6 px-5 pb-8">
              {pinnedPanels.length ? (
                <section className={sectionCardClass}>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground/80">
                    <Pin className="h-4 w-4 text-primary" />
                    Pinned
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {pinnedPanels.map((panel) => {
                      const Icon = panel.icon ?? PanelsTopLeft;
                      return (
                        <button
                          key={panel.id}
                          className={`${tileButtonClass} h-28`}
                          onClick={() => handleTilePress(panel.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className={`${tileIconClass} h-11 w-11`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={pinnedBadgeClass}>
                              Pin
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="line-clamp-2 text-sm font-semibold text-foreground">
                              {panel.title}
                            </p>
                            {panel.keywords && panel.keywords.length > 0 && (
                              <p className="line-clamp-1 text-[11px] text-muted-foreground/80">
                                {panel.keywords.slice(0, 2).join(" / ")}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}
              <section className={sectionCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Pick a panel</h2>
                    <p className="text-sm text-muted-foreground/85">
                      {mobileWorkstationEnabled
                        ? "Tap a tile to open it while keeping Helix Ask available in the drawer."
                        : "Tap a tile to open it full-screen. Long-press Home to jump between open panels."}
                    </p>
                  </div>
                  <button
                    className={`hidden md:inline-flex ${navButtonClass}`}
                    onClick={() => setLocation("/desktop?desktop=1")}
                  >
                    Desktop
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {gridPanels.map((panel) => {
                    const Icon = panel.icon ?? PanelsTopLeft;
                  return (
                    <button
                      key={panel.id}
                      className={`${tileButtonClass} h-32`}
                      onClick={() => handleTilePress(panel.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`${tileIconClass} h-12 w-12`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {panel.heavy && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/45 bg-primary/18 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              Heavy
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">{panel.title}</p>
                        {panel.keywords && panel.keywords.length > 0 && (
                          <p className="line-clamp-1 text-[11px] text-muted-foreground/80">
                            {panel.keywords.slice(0, 2).join(" / ")}
                          </p>
                        )}
                      </div>
                    </button>
                    );
                  })}
                </div>
              </section>

              {!stack.length && (
                <section className={sectionCardClass}>
                  <p className="text-sm text-muted-foreground/90">
                    {mobileWorkstationEnabled
                      ? "No panels are open yet. Tap any tile above or use Panels in the header to launch one."
                      : "No panels are open yet. Tap any tile above to launch it. Short-tap Home to return here; hold Home to open the task switcher."}
                  </p>
                </section>
              )}

              {stack.length > 0 && (
                <section className={sectionCardClass}>
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/80">Recent</p>
                  </div>
                  <div className="mt-3 space-y-3">
                    {recents.map((entry) => (
                      <button
                        key={entry.panelId}
                        className={recentButtonClass}
                        onClick={() => handleTilePress(entry.panelId)}
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                          <p className="text-[11px] text-muted-foreground/80">
                            Opened {new Date(entry.openedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <PanelsTopLeft className="h-4 w-4 text-muted-foreground/80" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
        </div>
        ) : (
          <div
            className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
            }}
          >
            <HelixAskPill
              className="w-full max-w-md"
              contextId={HELIX_ASK_CONTEXT_ID.mobile}
              maxWidthClassName="max-w-md"
              onOpenPanel={handleOpenPanel}
              onOpenConversation={handleOpenConversation}
            />
          </div>
        )}

        {mobileWorkstationEnabled ? (
          <MobileHelixAskDrawer
            onOpenPanel={handleOpenPanel}
            onOpenConversation={handleOpenConversation}
          />
        ) : null}

        <button
          type="button"
          className="pointer-events-auto fixed right-5 top-4 z-30 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-primary/45 bg-card/74 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-primary/60 hover:bg-card/86 hover:text-primary active:scale-[0.99] active:border-primary/65 active:bg-primary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/75 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => openSettings("preferences")}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>

        {!mobileWorkstationEnabled && !appViewerOpen && (
          <button
            className="pointer-events-auto fixed bottom-6 left-5 z-20 flex min-h-[48px] items-center gap-2 rounded-full border border-primary/45 bg-primary/18 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary shadow-[0_0_26px_hsl(var(--primary)/0.32)] transition hover:bg-primary/26 active:scale-[0.99] active:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/75 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={openAppViewer}
            type="button"
          >
            <PanelsTopLeft className="h-4 w-4" />
            Start
          </button>
        )}

        {appViewerOpen && showSwitcher && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm">
          <div
            className="mx-auto mt-12 w-full max-w-screen-md px-5"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)"
            }}
          >
            <div className="flex items-center justify-between rounded-2xl border border-primary/35 bg-card/86 px-4 py-3 text-foreground shadow-[0_30px_90px_hsl(var(--primary)/0.2)]">
              <div className="flex items-center gap-2">
                <PanelsTopLeft className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {mobileWorkstationEnabled ? "Panels" : "Task switcher"}
                </p>
              </div>
              <button
                className="rounded-full p-1 text-foreground/85 transition hover:bg-primary/18 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => setShowSwitcher(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {mobileWorkstationEnabled ? (
                <div className="rounded-xl border border-primary/25 bg-card/74 p-3 text-foreground shadow-[0_20px_60px_hsl(var(--primary)/0.14)]">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                    Launch panel
                  </p>
                  <button
                    type="button"
                    className="mb-2 flex w-full min-h-[38px] items-center justify-between rounded-lg border border-sky-300/30 bg-sky-500/10 px-3 py-2 text-left text-xs text-sky-100 transition hover:bg-sky-500/20"
                    onClick={() => {
                      openSettings("preferences");
                      setShowSwitcher(false);
                    }}
                  >
                    <span>Helix Start Settings</span>
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {launcherPanels.map((panel) => (
                      <button
                        key={`launch-${panel.id}`}
                        className="flex w-full min-h-[38px] items-center justify-between rounded-lg border border-primary/25 bg-card/68 px-3 py-2 text-left text-xs text-foreground transition hover:border-primary/60 hover:bg-card/86 hover:text-primary"
                        onClick={() => {
                          handleTilePress(panel.id);
                          setShowSwitcher(false);
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="line-clamp-1">{panel.title}</span>
                          {panel.workstationCapabilities?.v1_job_ready ? (
                            <span className="rounded border border-emerald-300/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-emerald-200">
                              Job-ready
                            </span>
                          ) : null}
                        </span>
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground/80">Open</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {stack.length === 0 && (
                <div className="rounded-xl border border-primary/25 bg-card/74 px-4 py-3 text-sm text-muted-foreground/85 shadow-[inset_0_0_24px_hsl(var(--primary)/0.08)]">
                  No panels open. Tap a tile to launch one.
                </div>
              )}

              {stack.map((entry) => {
                const isActive = entry.panelId === activeId;
                const panelDef = panelRegistry.find((panel) => panel.id === entry.panelId);
                const Icon = panelDef?.icon ?? PanelsTopLeft;
                return (
                  <div
                    key={entry.panelId}
                    className="flex items-center gap-3 rounded-xl border border-primary/25 bg-card/74 px-4 py-3 text-foreground shadow-[0_24px_80px_hsl(var(--primary)/0.18)]"
                  >
                    <div className={`${tileIconClass} h-10 w-10`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">{entry.title}</p>
                      <p className="text-[11px] text-muted-foreground/80">
                        Opened {new Date(entry.openedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] ${
                        isActive
                          ? "border border-primary/60 bg-primary/88 text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.32)]"
                          : "border border-primary/35 bg-card/74 text-foreground hover:border-primary/60 hover:bg-card/86 hover:text-primary active:border-primary/65 active:bg-primary/18"
                      }`}
                      onClick={() => {
                        activate(entry.panelId);
                        setShowSwitcher(false);
                      }}
                    >
                      {isActive ? "Active" : "Activate"}
                    </button>
                    <button
                      className="min-h-[44px] rounded-full p-2 text-foreground/85 transition hover:bg-primary/18 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => {
                        recordPanelActivity(entry.panelId, "closeMobile");
                        close(entry.panelId);
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {stack.length > 0 && (
              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  className="min-h-[44px] rounded-lg border border-primary/35 bg-card/74 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:bg-card/86 hover:text-primary active:scale-[0.99] active:border-primary/65 active:bg-primary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => {
                    recordPanelActivity("mobile-shell", "close-all");
                    closeAll();
                    goHome();
                    setShowSwitcher(false);
                  }}
                >
                  Close all
                </button>
                <button
                  className="min-h-[44px] rounded-lg border border-primary/60 bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition hover:bg-primary active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => setShowSwitcher(false)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
        )}
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
