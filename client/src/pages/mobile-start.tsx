import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  Home,
  MessageCircle,
  PanelsTopLeft,
  Pin,
  X,
  XCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { panelRegistry } from "@/lib/desktop/panelRegistry";
import { useMobileAppStore } from "@/store/useMobileAppStore";
import { MobilePanelHost } from "@/components/mobile/MobilePanelHost";
import { recordPanelActivity } from "@/lib/essence/activityReporter";
import { SurfaceStack } from "@/components/surface/SurfaceStack";
import { generateSurfaceRecipe } from "@/lib/surfacekit/generateSurface";
import { HelixAskPill } from "@/components/helix/HelixAskPill";
import { useLumaMoodTheme } from "@/lib/luma-mood-theme";

const LONG_PRESS_MS = 650;
const MAX_WARN_STACK = 4;

export default function MobileStartPage() {
  const [, setLocation] = useLocation();
  const { stack, activeId, open, activate, close, closeAll, goHome } = useMobileAppStore();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [appViewerOpen, setAppViewerOpen] = useState(false);
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
    setAppViewerOpen(false);
    setShowSwitcher(false);
    goHome();
  }, [goHome]);

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
    open(panelId);
    setAppViewerOpen(true);
    setShowSwitcher(false);
  };

  const handleOpenPanel = useCallback(
    (panelId: string) => {
      if (!panelId) return;
      open(panelId);
      setAppViewerOpen(true);
      setShowSwitcher(false);
    },
    [open]
  );

  const handleOpenConversation = useCallback(
    (_sessionId: string) => {
      open("agi-essence-console");
      setAppViewerOpen(true);
      setShowSwitcher(false);
    },
    [open]
  );

  useEffect(() => {
    recordPanelActivity("mobile-shell", "enter");
    return cancelLongPress;
  }, []);

  useEffect(() => {
    goHome();
    setShowSwitcher(false);
  }, [goHome]);

  return (
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
            <button
              className={`inline-flex ${navPrimaryButtonClass}`}
              onClick={closeAppViewer}
            >
              <MessageCircle className="h-4 w-4" />
              Ask
            </button>
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
                      Tap a tile to open it full-screen. Long-press Home to jump between open panels.
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
                    No panels are open yet. Tap any tile above to launch it. Short-tap Home to return here; hold Home to
                    open the task switcher.
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
            contextId="helix-ask-mobile"
            maxWidthClassName="max-w-md"
            onOpenPanel={handleOpenPanel}
            onOpenConversation={handleOpenConversation}
          />
        </div>
      )}

      {!appViewerOpen && (
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
                <p className="text-sm font-semibold text-foreground">Task switcher</p>
              </div>
              <button
                className="rounded-full p-1 text-foreground/85 transition hover:bg-primary/18 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => setShowSwitcher(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
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
  );
}
