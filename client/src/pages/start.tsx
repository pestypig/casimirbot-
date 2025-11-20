import * as React from "react";
import { Settings } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { HelixSettingsDialogContent } from "@/components/HelixSettingsDialogContent";
import VizDiagnosticsPanel from "@/components/warp/VizDiagnosticsPanel";
import SplashCursor from "@/components/SplashCursor";
import {
  PROFILE_STORAGE_KEY,
  useHelixStartSettings,
  type SettingsTab
} from "@/hooks/useHelixStartSettings";
import { ThemeInstrumentDeck } from "@/components/start/ThemeInstrumentDeck";
import { useEssenceThemes } from "@/hooks/useEssenceThemes";
import { DOC_VIEWER_PANEL_ID, saveDocViewerIntent, type DocViewerIntent } from "@/lib/docs/docViewer";

const PENDING_PANEL_KEY = "helix:pending-panel";

type ProfileKey = "optimist" | "engineer" | "diplomat" | "strategist";

const PROFILES: Record<ProfileKey, {
  icon: string;
  name: string;
  zen: string;
  physics: string;
}> = {
  optimist: {
    icon: "🌞",
    name: "Radiant Optimist",
    zen: "\"The light we save today will shine for a billion tomorrows.\"",
    physics:
      "Energy-positivity balance; emphasizes Ford–Roman compliance as a guiding constraint.",
  },
  engineer: {
    icon: "⚙️",
    name: "The Engineer",
    zen: "\"Every equation is a bridge; every weld, a promise.\"",
    physics:
      "Sector strobing, γ_geo, γ_VdB, Q_cavity; trade-offs and tolerances explained.",
  },
  diplomat: {
    icon: "🐼",
    name: "The Diplomat",
    zen: "\"In harmony, the cosmos folds itself around us.\"",
    physics:
      "Time-scale separation (TS); environment & stability cues for the solar rescue.",
  },
  strategist: {
    icon: "🐒",
    name: "The Strategist",
    zen: "\"Even the smallest stone changes the course of the river.\"",
    physics:
      "Bubble placement, curvature max, sector optimization & routing visuals.",
  },
};

const isProfileKey = (value: unknown): value is ProfileKey =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(PROFILES, value);

export default function StartPortal() {
  const [selected, setSelected] = React.useState<ProfileKey | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState<SettingsTab>("preferences");
  const { userSettings, updateSettings } = useHelixStartSettings();
  const [, setLocation] = useLocation();
  const {
    data: themeDeck,
    isLoading: themeLoading,
    isError: themeIsError,
    error: themeError,
    refetch: refetchThemes
  } = useEssenceThemes();
  const themeErrorMessage =
    themeIsError && themeError instanceof Error
      ? themeError.message
      : themeIsError
        ? "Unable to load Essence themes."
        : null;

  const pick = (k: ProfileKey) => setSelected(k);
  const requestPanelWindow = React.useCallback(
    (panelId: string, options?: { docIntent?: DocViewerIntent }) => {
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(PENDING_PANEL_KEY, panelId);
          if (panelId === DOC_VIEWER_PANEL_ID && options?.docIntent) {
            saveDocViewerIntent(options.docIntent);
          }
        } catch {
          // Ignore storage failures; the desktop can still be opened manually.
        }
      }
      setLocation("/desktop");
    },
    [setLocation],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!userSettings.rememberChoice) {
        setSelected(null);
        return;
      }
      const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (
        storedProfile &&
        isProfileKey(storedProfile)
      ) {
        setSelected(storedProfile);
      }
    } catch {
      // ignore malformed localStorage entries
    }
  }, [userSettings.rememberChoice]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (userSettings.rememberChoice && selected) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, selected);
    } else {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, [selected, userSettings.rememberChoice]);

  const stationIsPrimary = !userSettings.preferDesktop;
  const desktopIsPrimary = userSettings.preferDesktop;

  const primaryButtonClass =
    "px-3.5 py-2 rounded-lg bg-sky-500/90 hover:bg-sky-500 text-white text-sm font-medium";
  const secondaryButtonClass =
    "px-3.5 py-2 rounded-lg border border-white/20 bg-transparent hover:bg-white/5 text-slate-100 text-sm";

  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={(next) => {
        setSettingsOpen(next);
        if (!next) setSettingsTab("preferences");
      }}
    >
      {userSettings.enableSplashCursor && <SplashCursor />}
      <div className="relative min-h-screen bg-[#0b1020] text-slate-100 grid place-items-center px-4">
        <div className="pointer-events-none absolute left-0 right-0 top-4 flex items-center justify-end gap-2">
          <p className="hidden text-xs uppercase tracking-[0.25em] text-slate-400 sm:block">
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
        {VizDiagnosticsPanel && (((import.meta as any).env?.VITE_DEBUG_VIZ_HUD ?? '1') !== '0') && (
          <div className="pointer-events-auto absolute left-4 top-4 w-[420px]">
            <VizDiagnosticsPanel />
          </div>
        )}
        <div className="w-full max-w-5xl py-16">
          <header className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Choose Your Mission View
            </h1>
            <p className="text-slate-300/80 text-sm mt-1">
              A quiet beginning. Same physics. Your preferred lens.
            </p>
          </header>

        {/* ICONS ONLY until a choice is made */}
        <section
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          role="list"
          aria-label="Profiles"
        >
          {(Object.keys(PROFILES) as ProfileKey[]).map((k) => {
            const p = PROFILES[k];
            const isSel = selected === k;
            return (
              <button
                key={k}
                role="listitem"
                className={[
                  "aspect-square rounded-2xl bg-white/5 hover:bg-white/7.5",
                  "border border-white/10 shadow-sm",
                  "flex flex-col items-center justify-center",
                  "transition-transform focus:outline-none focus:ring-2 focus:ring-sky-400/40",
                  isSel ? "scale-[1.04]" : "",
                ].join(" ")}
                onClick={() => pick(k)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(k);
                  }
                }}
              >
                <div className="text-5xl md:text-6xl mb-2">{p.icon}</div>
                <div className="text-sm md:text-base font-medium opacity-90">
                  {p.name}
                </div>
              </button>
            );
          })}
        </section>

        {/* Detail panel appears ONLY after selection */}
        {selected && (
          <section
            className="mt-6 md:mt-8"
            aria-live="polite"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="text-3xl md:text-4xl">{PROFILES[selected].icon}</div>
                <div className="flex-1">
                  <h2 className="text-base md:text-lg font-semibold">
                    {PROFILES[selected].name}
                  </h2>
                  {userSettings.showZen && (
                    <p className="text-slate-200/90 text-sm md:text-[15px] mt-1">
                      {PROFILES[selected].zen}
                    </p>
                  )}
                  <p className="text-slate-300/80 text-xs md:text-sm mt-2 leading-relaxed">
                    {PROFILES[selected].physics}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className={stationIsPrimary ? primaryButtonClass : secondaryButtonClass}
                      onClick={() => setLocation('/helix-core')}
                    >
                      Enter Station
                    </button>
                    <button
                      className="px-3.5 py-2 rounded-lg bg-white/7 hover:bg-white/10 text-slate-100 text-sm"
                      onClick={() => setSelected(null)}
                    >
                      Change choice
                    </button>
                    <button
                      className={desktopIsPrimary ? primaryButtonClass : secondaryButtonClass}
                      onClick={() => setLocation('/desktop')}
                    >
                      Open Desktop
                    </button>
                    <button
                      className="px-3.5 py-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 text-emerald-200 text-sm"
                      onClick={() => requestPanelWindow("energy-flux")}
                    >
                      Launch Energy Flux Panel
                    </button>
                    <button
                      className="px-3.5 py-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 text-sm"
                      onClick={() => requestPanelWindow("electron-orbital")}
                    >
                      Launch Electron Orbitals Panel
                    </button>
                    <button
                      className="px-3.5 py-2 rounded-lg border border-amber-400/50 bg-amber-400/10 text-amber-100 text-sm"
                      onClick={() => requestPanelWindow("star-hydrostatic")}
                    >
                      Launch Hydrostatic Panel
                    </button>
                    <button
                      className="px-3.5 py-2 rounded-lg border border-slate-400/40 bg-slate-800/30 text-slate-100 text-sm"
                      onClick={() =>
                        requestPanelWindow(DOC_VIEWER_PANEL_ID, { docIntent: { mode: "directory" } })
                      }
                    >
                      Browse Docs & Papers
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                No account is created. Your choice is for this visit only.
              </p>
            </div>
          </section>
        )}

        <ThemeInstrumentDeck
          deck={themeDeck}
          loading={themeLoading}
          error={themeErrorMessage}
          onRefresh={() => {
            void refetchThemes();
          }}
        />

        <section className="mt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300">New panel</p>
                <h3 className="text-lg font-semibold text-white">Energy Flux Stability Monitor</h3>
                <p className="text-sm leading-relaxed text-slate-300/80">
                  Real-time |T⁰⁰| and ∇·S slices with a stability histogram for
                  R = (∇·S)/(ε + |T⁰⁰|). Launch it whenever you need to inspect which sectors are steady
                  versus oscillatory before touching duty or strobe settings.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className="rounded-lg bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-500"
                  onClick={() => requestPanelWindow("energy-flux")}
                >
                  Open as Desktop Window
                </button>
                <p className="text-[11px] text-slate-400">
                  Takes you to the Desktop and auto-opens the panel as a window.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-purple-300">New panel</p>
                <h3 className="text-lg font-semibold text-white">Electron Orbital Simulator</h3>
                <p className="text-sm leading-relaxed text-slate-300/80">
                  Visualize orbital density clouds, sweep Coulomb probes, and watch toroidal spin packets stay tied to the live energy pipeline. Perfect for deriving k, q, and g inside the same telemetry loop you trust for duty changes.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className="rounded-lg bg-purple-500/80 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:bg-purple-500"
                  onClick={() => requestPanelWindow("electron-orbital")}
                >
                  Open Orbital Panel
                </button>
                <p className="text-[11px] text-slate-400">
                  Opens the Desktop with the orbital window already instrumented.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300">Docs & digests</p>
                <h3 className="text-lg font-semibold text-white">Docs & Papers Viewer</h3>
                <p className="text-sm leading-relaxed text-slate-300/80">
                  Browse every repo note, ethos memo, and Ford-Roman digest without leaving the Desktop.
                  The new panel includes a searchable directory plus anchor support for theory badges.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className="rounded-lg bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition hover:bg-slate-800"
                  onClick={() =>
                    requestPanelWindow(DOC_VIEWER_PANEL_ID, { docIntent: { mode: "directory" } })
                  }
                >
                  Open Docs Directory
                </button>
                <p className="text-[11px] text-slate-400">
                  Launches the Desktop with the docs viewer already focused on the directory.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-amber-200">Stellar ledger</p>
                <h3 className="text-lg font-semibold text-white">Hydrostatic Equilibrium — HR Map</h3>
                <p className="text-sm leading-relaxed text-slate-300/80">
                  Compare κ_drive to κ_body at stellar densities, watch the Gamow window light up, and keep the
                  potato threshold story intact from rubble piles to stars. HR presets plus polytrope solver are one
                  click away.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className="rounded-lg bg-amber-500/85 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-500"
                  onClick={() => requestPanelWindow("star-hydrostatic")}
                >
                  Open Hydrostatic Panel
                </button>
                <p className="text-[11px] text-slate-400">
                  Opens Desktop mode with the Hydrostatic Equilibrium window ready to explore.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
      <HelixSettingsDialogContent
        settingsTab={settingsTab}
        onSettingsTabChange={setSettingsTab}
        userSettings={userSettings}
        updateSettings={updateSettings}
        onClearSavedChoice={() => {
          setSelected(null);
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(PROFILE_STORAGE_KEY);
          }
        }}
        onClose={() => setSettingsOpen(false)}
      />
    </Dialog>
  );
}
