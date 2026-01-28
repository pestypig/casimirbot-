import * as React from "react";
import { Settings } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { HelixSettingsDialogContent } from "@/components/HelixSettingsDialogContent";
import VizDiagnosticsPanel from "@/components/warp/VizDiagnosticsPanel";
import SplashCursor from "@/components/SplashCursor";
import TimeDilationLatticePanel from "@/components/TimeDilationLatticePanel";
import {
  PROFILE_STORAGE_KEY,
  useHelixStartSettings,
  type SettingsTab
} from "@/hooks/useHelixStartSettings";
import { ThemeInstrumentDeck } from "@/components/start/ThemeInstrumentDeck";
import { useEssenceThemes } from "@/hooks/useEssenceThemes";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { DOC_VIEWER_PANEL_ID, saveDocViewerIntent, type DocViewerIntent } from "@/lib/docs/docViewer";
import { useLumaMoodTheme } from "@/lib/luma-mood-theme";

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
      "Energy-positivity balance; emphasizes Ford-Roman compliance as a guiding constraint.",
  },
  engineer: {
    icon: "⚙️",
    name: "The Engineer",
    zen: "\"Every equation is a bridge; every weld, a promise.\"",
    physics:
      "Sector strobing, gamma_geo, gamma_VdB, Q_cavity; trade-offs and tolerances explained.",
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
  useLumaMoodTheme({ randomize: true });
  const {
    data: themeDeck,
    isLoading: themeLoading,
    isError: themeIsError,
    error: themeError,
    refetch: refetchThemes
  } = useEssenceThemes();
  const { data: pipelineSnapshot } = useEnergyPipeline({
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });
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
    "rounded-lg bg-primary/92 px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.32)] transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const secondaryButtonClass =
    "rounded-lg border border-primary/35 bg-card/70 px-3.5 py-2 text-sm font-medium text-foreground/92 shadow-[inset_0_0_20px_hsl(var(--primary)/0.08)] transition hover:border-primary/55 hover:bg-card/85 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/65 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const launchButtonClass =
    "rounded-lg border border-primary/45 bg-primary/16 px-3.5 py-2 text-sm font-medium text-primary shadow-[0_0_18px_hsl(var(--primary)/0.22)] transition hover:border-primary/70 hover:bg-primary/24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const surfaceCardClass =
    "relative overflow-hidden rounded-2xl border border-primary/25 bg-card/72 p-5 md:p-6 text-foreground shadow-[0_35px_110px_hsl(var(--primary)/0.18)]";
  const surfaceCardTintClass =
    "pointer-events-none absolute inset-0 opacity-85 bg-[radial-gradient(160%_220%_at_6%_12%,hsl(var(--primary)/0.2)_0%,transparent_72%)]";
  const surfaceCardHaloClass =
    "pointer-events-none absolute inset-0 opacity-75 bg-[radial-gradient(140%_190%_at_94%_18%,hsl(var(--primary)/0.14)_0%,transparent_74%)]";

  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={(next) => {
        setSettingsOpen(next);
        if (!next) setSettingsTab("preferences");
      }}
    >
      {userSettings.enableSplashCursor && <SplashCursor />}
      <div className="mood-transition-scope relative min-h-screen bg-background text-foreground grid place-items-center px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "var(--surface-laminate)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(140%_200%_at_8%_12%,hsl(var(--primary)/0.26)_0%,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(150%_210%_at_96%_10%,hsl(var(--primary)/0.18)_0%,transparent_72%)]"
        />
        <div className="pointer-events-none absolute left-0 right-0 top-4 flex items-center justify-end gap-2">
          <p className="hidden text-xs uppercase tracking-[0.25em] text-muted-foreground/80 sm:block">
            Helix Controls
          </p>
          <button
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary/45 bg-primary/18 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary shadow-[0_0_20px_hsl(var(--primary)/0.28)] transition hover:bg-primary/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => requestPanelWindow("helix-phoenix")}
          >
            Phoenix Panel
          </button>
          <DialogTrigger asChild>
            <button
              aria-label="Open Helix Start settings"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/65 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-primary/45 hover:bg-card/82 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/65 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            <p className="text-muted-foreground/85 text-sm mt-1">
              A quiet beginning. Same physics. Your preferred lens.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                className={primaryButtonClass}
                onClick={() => requestPanelWindow("helix-phoenix")}
              >
                Open Phoenix Averaging Panel
              </button>
              <p className="text-[11px] text-muted-foreground">
                Opens the Desktop with the Phoenix averaging window already staged.
              </p>
            </div>
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
                  "aspect-square rounded-2xl border border-primary/25 bg-card/65 text-foreground",
                  "flex flex-col items-center justify-center shadow-[0_20px_60px_hsl(var(--primary)/0.16)]",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/55 hover:bg-card/85 hover:text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/65 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99]",
                  isSel
                    ? "scale-[1.04] border-primary/70 bg-primary/18 text-primary shadow-[0_0_28px_hsl(var(--primary)/0.34)]"
                    : "",
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
                <div className="text-sm md:text-base font-medium text-foreground/90">
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
            <div className={`${surfaceCardClass} p-4 md:p-5`}>
              <div aria-hidden className={surfaceCardTintClass} />
              <div aria-hidden className={surfaceCardHaloClass} />
              <div className="relative z-[1] flex items-start gap-3">
                <div className="text-3xl md:text-4xl">{PROFILES[selected].icon}</div>
                <div className="flex-1">
                  <h2 className="text-base md:text-lg font-semibold text-foreground">
                    {PROFILES[selected].name}
                  </h2>
                  {userSettings.showZen && (
                    <p className="mt-1 text-sm text-foreground/92 md:text-[15px]">
                      {PROFILES[selected].zen}
                    </p>
                  )}
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground/85 md:text-sm">
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
                      className="rounded-lg bg-card/78 px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-card/92 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/65 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                      className={launchButtonClass}
                      onClick={() => requestPanelWindow("energy-flux")}
                    >
                      Launch Energy Flux Panel
                    </button>
                    <button
                      className={launchButtonClass}
                      onClick={() => requestPanelWindow("pipeline-proof")}
                    >
                      Pipeline Proof Panel
                    </button>
                    <button
                      className={launchButtonClass}
                      onClick={() => requestPanelWindow("electron-orbital")}
                    >
                      Launch Electron Orbitals Panel
                    </button>
                    <button
                      className={launchButtonClass}
                      onClick={() => requestPanelWindow("star-hydrostatic")}
                    >
                      Launch Hydrostatic Panel
                    </button>
                    <button
                      className={launchButtonClass}
                      onClick={() => requestPanelWindow("star-watcher")}
                    >
                      Open Star Watcher
                    </button>
                    <button
                      className={launchButtonClass}
                      onClick={() => requestPanelWindow("star-coherence")}
                    >
                      Star Coherence Governor
                    </button>
                    <button
                      className={launchButtonClass}
                      onClick={() => requestPanelWindow("collapse-monitor")}
                    >
                      Collapse Watch Panel
                    </button>
                    <button
                      className={launchButtonClass}
                      onClick={() => requestPanelWindow("helix-phoenix")}
                    >
                      Phoenix Averaging Panel
                    </button>
                    <button
                      className={launchButtonClass}
                      onClick={() =>
                        requestPanelWindow(DOC_VIEWER_PANEL_ID, { docIntent: { mode: "directory" } })
                      }
                    >
                      Browse Docs & Papers
                    </button>
                  </div>
                </div>
              </div>
              <p className="relative z-[1] mt-4 text-[11px] text-muted-foreground">
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
          <div className={surfaceCardClass}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="space-y-2 lg:max-w-sm">
                <p className="text-[11px] uppercase tracking-[0.35em] text-primary/80">Time dilation</p>
                <h3 className="text-lg font-semibold text-foreground">Spacetime lattice preview</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/85">
                  Visualize a 3D lattice warped by a shared potential field. Local clock pulses slow near mass while the
                  grid deformation remains a visual cue, keeping space and time meanings separate.
                </p>
              </div>
              <div className="flex-1">
                <TimeDilationLatticePanel pipeline={pipelineSnapshot ?? null} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className={surfaceCardClass}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-primary/80">New panel</p>
                <h3 className="text-lg font-semibold text-foreground">Phoenix Averaging - Needle Hull</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/85">
                  Shows GR-proxy curvature built from Casimir tile power, Hann-averaged over local light-crossing
                  windows in the ship frame. Includes a worldline strip, spacetime tile band, and the always-on Phoenix
                  badge so operators remember this is a control foliation, not an outside simultaneity view.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className={primaryButtonClass}
                  onClick={() => requestPanelWindow("helix-phoenix")}
                >
                  Open Phoenix Panel
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Opens the Desktop and auto-starts the Phoenix Averaging window.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className={surfaceCardClass}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-primary/80">New panel</p>
                <h3 className="text-lg font-semibold text-foreground">Fleet Hull Cards</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/85">
                  Pick a ship hull card (Needle, Clipper, Courier, Heavy Lancer) and apply its dimensions directly into
                  the pipeline. Mirrors the Helix Start card flow so hull swaps stay simple and falsifiable.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className={primaryButtonClass}
                  onClick={() => setLocation("/helix-core#hull-cards")}
                >
                  Open Hull Cards in Station
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Jumps to Helix Core with the hull card panel in view; applying a card updates pipeline.hull.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className={surfaceCardClass}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-primary/80">New panel</p>
                <h3 className="text-lg font-semibold text-foreground">Energy Flux Stability Monitor</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/85">
                  Real-time |T00| and div(S) slices with a stability histogram for
                  R = (div(S))/(epsilon + |T00|). Launch it whenever you need to inspect which sectors are steady
                  versus oscillatory before touching duty or strobe settings.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className={primaryButtonClass}
                  onClick={() => requestPanelWindow("energy-flux")}
                >
                  Open as Desktop Window
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Takes you to the Desktop and auto-opens the panel as a window.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className={surfaceCardClass}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-primary/80">New panel</p>
                <h3 className="text-lg font-semibold text-foreground">Electron Orbital Simulator</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/85">
                  Visualize orbital density clouds, sweep Coulomb probes, and watch toroidal spin packets stay tied to the live energy pipeline. Perfect for deriving k, q, and g inside the same telemetry loop you trust for duty changes.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className={primaryButtonClass}
                  onClick={() => requestPanelWindow("electron-orbital")}
                >
                  Open Orbital Panel
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Opens the Desktop with the orbital window already instrumented.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className={surfaceCardClass}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-primary/80">Docs & digests</p>
                <h3 className="text-lg font-semibold text-foreground">Docs & Papers Viewer</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/85">
                  Browse every repo note, ethos memo, and Ford-Roman digest without leaving the Desktop.
                  The new panel includes a searchable directory plus anchor support for theory badges.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className={secondaryButtonClass}
                  onClick={() =>
                    requestPanelWindow(DOC_VIEWER_PANEL_ID, { docIntent: { mode: "directory" } })
                  }
                >
                  Open Docs Directory
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Launches the Desktop with the docs viewer already focused on the directory.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className={surfaceCardClass}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-primary/80">Stellar ledger</p>
                <h3 className="text-lg font-semibold text-foreground">Hydrostatic Equilibrium - HR Map</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/85">
                  Compare kappa_drive to kappa_body at stellar densities, watch the Gamow window light up, and keep the
                  potato threshold story intact from rubble piles to stars. HR presets plus polytrope solver are one
                  click away.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <button
                  className={primaryButtonClass}
                  onClick={() => requestPanelWindow("star-hydrostatic")}
                >
                  Open Hydrostatic Panel
                </button>
                <p className="text-[11px] text-muted-foreground">
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
