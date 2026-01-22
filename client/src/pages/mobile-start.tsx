import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock3, Home, PanelsTopLeft, Pin, X, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { panelRegistry } from "@/lib/desktop/panelRegistry";
import { useMobileAppStore } from "@/store/useMobileAppStore";
import { MobilePanelHost } from "@/components/mobile/MobilePanelHost";
import { recordPanelActivity } from "@/lib/essence/activityReporter";

const LONG_PRESS_MS = 650;
const MAX_WARN_STACK = 4;

export default function MobileStartPage() {
  const [, setLocation] = useLocation();
  const { stack, activeId, open, activate, close, closeAll, goHome } = useMobileAppStore();
  const [showSwitcher, setShowSwitcher] = useState(false);
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
    setShowSwitcher(false);
  };

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
      className="relative min-h-screen bg-slate-950 text-slate-100"
      style={{ minHeight: "max(100dvh, 100vh)" }}
    >
      <div
        className="mx-auto flex min-h-screen max-w-screen-lg flex-col"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)"
        }}
      >
        <header
          className="sticky top-0 z-20 flex items-center justify-start bg-slate-950/85 px-4 pb-3 backdrop-blur sm:px-5 sm:pb-4"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[13px] font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 sm:px-3.5 sm:py-1.5 min-h-[44px]"
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
                <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-sky-900/30">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                    <Pin className="h-4 w-4 text-sky-300" />
                    Pinned
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {pinnedPanels.map((panel) => {
                      const Icon = panel.icon ?? PanelsTopLeft;
                      return (
                        <button
                          key={panel.id}
                          className="group flex h-28 flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
                          onClick={() => handleTilePress(panel.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200 shadow-inner shadow-sky-900/50">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
                              Pin
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-white line-clamp-2">
                              {panel.title}
                            </p>
                            {panel.keywords && panel.keywords.length > 0 && (
                              <p className="text-[11px] text-slate-400 line-clamp-1">
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
              <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-sky-900/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-white">Pick a panel</h2>
                    <p className="text-sm text-slate-300/85">
                      Tap a tile to open it full-screen. Long-press Home to jump between open panels.
                    </p>
                  </div>
                  <button
                    className="hidden rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 min-h-[44px] md:inline-block"
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
                        className="group flex h-32 flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
                        onClick={() => handleTilePress(panel.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200 shadow-inner shadow-sky-900/50">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {panel.heavy && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-100">
                                Heavy
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white line-clamp-2">{panel.title}</p>
                          {panel.keywords && panel.keywords.length > 0 && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">
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
                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300/90">
                    No panels are open yet. Tap any tile above to launch it. Short-tap Home to return here; hold Home to
                    open the task switcher.
                  </p>
                </section>
              )}

              {stack.length > 0 && (
                <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-slate-300" />
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Recent</p>
                  </div>
                  <div className="mt-3 space-y-3">
                    {recents.map((entry) => (
                      <button
                        key={entry.panelId}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-sky-400/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 min-h-[48px]"
                        onClick={() => handleTilePress(entry.panelId)}
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{entry.title}</p>
                          <p className="text-[11px] text-slate-400">
                            Opened {new Date(entry.openedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <PanelsTopLeft className="h-4 w-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {showSwitcher && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm">
          <div
            className="mx-auto mt-12 w-full max-w-screen-md px-5"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)"
            }}
          >
            <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3">
              <div className="flex items-center gap-2">
                <PanelsTopLeft className="h-4 w-4 text-sky-300" />
                <p className="text-sm font-semibold text-white">Task switcher</p>
              </div>
              <button
                className="rounded-full p-1 text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
                onClick={() => setShowSwitcher(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {stack.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
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
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white line-clamp-1">{entry.title}</p>
                      <p className="text-[11px] text-slate-400">
                        Opened {new Date(entry.openedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 min-h-[44px] ${
                        isActive
                          ? "bg-sky-500/80 text-white"
                          : "border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                      }`}
                      onClick={() => {
                        activate(entry.panelId);
                        setShowSwitcher(false);
                      }}
                    >
                      {isActive ? "Active" : "Activate"}
                    </button>
                    <button
                      className="rounded-full p-2 text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 min-h-[44px]"
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
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 min-h-[44px]"
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
                  className="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 min-h-[44px]"
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
