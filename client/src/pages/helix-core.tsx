// client/src/pages/helix-core.tsx
import React, { useState, useEffect, useRef, useMemo, Suspense, lazy, startTransition } from "react";
import { Link } from "wouter";
import { Home, Activity, Gauge, Brain, Terminal, Atom, Cpu, Send, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEnergyPipeline, useSwitchMode, MODE_CONFIGS, fmtPowerUnitFromW, ModeKey } from "@/hooks/use-energy-pipeline";

// Utils for live mode descriptions

const formatPower = (P_MW?: number, P_W?: number) => {
  if (Number.isFinite(P_MW as number)) return `${(P_MW as number).toFixed(1)} MW`;
  if (Number.isFinite(P_W as number)) {
    const w = P_W as number;
    if (w >= 1e6) return `${(w / 1e6).toFixed(1)} MW`;
    if (w >= 1e3) return `${(w / 1e3).toFixed(1)} kW`;
    return `${w.toFixed(1)} W`;
  }
  return "—";
};

const buildLiveDesc = (
  snap?: { P_avg_MW?: number; M_exotic_kg?: number; zeta?: number },
  cfg?: { powerTarget_W?: number },
  pipelineTargetW?: number
) => {
  const targetW = pipelineTargetW ?? cfg?.powerTarget_W;
  const P = formatPower(snap?.P_avg_MW, targetW);
  const M = Number.isFinite(snap?.M_exotic_kg) ? `${snap!.M_exotic_kg!.toFixed(0)} kg` : "— kg";
  const Z = Number.isFinite(snap?.zeta) ? `ζ=${snap!.zeta!.toFixed(3)}` : "ζ=—";
  return `${P} • ${M} • ${Z}`;
};

// Mode select items built outside component to prevent re-renders
const buildModeSelectItems = (pipeline: any) => {
  return Object.entries(MODE_CONFIGS).map(([key, cfg]) => {
    const k = key as ModeKey;
    // For current mode, use live values; for others, use config fallback
    const isCurrentMode = k === pipeline?.currentMode;
    const snap = isCurrentMode
      ? { P_avg_MW: pipeline?.P_avg, M_exotic_kg: pipeline?.M_exotic, zeta: pipeline?.zeta }
      : undefined;
    return { key, cfg, snap, k };
  });
};

import { useMetrics } from "@/hooks/use-metrics";
const WarpBubbleCompare = lazy(() =>
  import("@/components/warp/WarpBubbleCompare").then((m) => ({ default: m.default || m.WarpBubbleCompare }))
);
const WarpRenderInspector = lazy(() => import("@/components/WarpRenderInspector"));
import { SliceViewer } from "@/components/SliceViewer";
import { FuelGauge, computeEffectiveLyPerHour } from "@/components/FuelGauge";

import { TripPlayer } from "@/components/TripPlayer";
import { GalaxyMapPanZoom } from "@/components/GalaxyMapPanZoom";
import { GalaxyDeepZoom } from "@/components/GalaxyDeepZoom";
import { GalaxyOverlays } from "@/components/GalaxyOverlays";
import { SolarMap } from "@/components/SolarMap";
import { RouteSteps } from "@/components/RouteSteps";
import { BODIES } from "@/lib/galaxy-catalog";
import { HelixPerf } from "@/lib/galaxy-schema";
// draw-lines background helper (ensure this exists on your side)
import { computeSolarXY, solarToBodies, getSolarBodiesAsPc, computeBarycenterPolylineAU } from "@/lib/solar-adapter";
import { Switch } from "@/components/ui/switch";
import { calibrateToImage, SVG_CALIB } from "@/lib/galaxy-calibration";

import { publish, subscribe, unsubscribe } from "@/lib/luma-bus";

// Optional: local fallback counter if seq is missing
let __busSeq = 0;

const toNumber = (x: any, d = 0) => (Number.isFinite(+x) ? +x : d);

function sanitizeServerUniforms(raw: any, version: number) {
  const gammaVdB_vis = toNumber(raw.gammaVanDenBroeck_vis ?? raw.gammaVanDenBroeck ?? raw.gammaVdB, 1.4e5);
  const gammaVdB_mass = toNumber(raw.gammaVanDenBroeck_mass ?? raw.gammaVanDenBroeck ?? raw.gammaVdB, gammaVdB_vis);
  const gammaGeo = Math.max(1, toNumber(raw.gammaGeo, 26));
  const q = Math.max(1e-12, toNumber(raw.qSpoilingFactor ?? raw.deltaAOverA, 1));
  const dFR = Math.max(1e-12, toNumber(raw.dutyEffectiveFR, 0.01 / Math.max(1, toNumber(raw.sectorCount, 400))));
  const viewAvg = (raw.viewAvg ?? true) ? true : false;

  // Canonical expected θ (renderer flavor: uses γ_VdB_vis and √d_FR when viewAvg=true)
  const thetaScaleExpected = Math.pow(gammaGeo, 3) * q * gammaVdB_vis * (viewAvg ? Math.sqrt(dFR) : 1);

  // Keep only physics + scheduling + geometry + timing
  const out = {
    // physics
    gammaGeo,
    qSpoilingFactor: q,
    gammaVanDenBroeck_vis: gammaVdB_vis,
    gammaVanDenBroeck_mass: gammaVdB_mass,
    gammaVdB: gammaVdB_vis, // alias for consumers

    // scheduling
    sectorCount: Math.max(1, toNumber(raw.sectorCount, 400)),
    sectors: Math.max(1, toNumber(raw.sectors, 1)),
    dutyCycle: Math.max(0, toNumber(raw.dutyCycle, 0.01)),
    dutyEffectiveFR: dFR,
    currentMode: String(raw.currentMode ?? "hover").toLowerCase() as "hover" | "cruise" | "emergency" | "standby",

    // timing (for FR derivations / panels)
    lightCrossing:
      raw.lightCrossing && {
        burst_ms: toNumber(raw.lightCrossing.burst_ms, 0.01),
        dwell_ms: toNumber(raw.lightCrossing.dwell_ms, 1.0),
      },

    // geometry passthrough (if present)
    hull: raw.hull,

    // averaging flag the renderer actually honors
    viewAvg,

    // helpful derived for checkpoint UIs
    thetaScaleExpected,

    // bus meta
    __src: "server" as const,
    __version: version,
  };

  return out;
}

import { CasimirTileGridPanel } from "@/components/CasimirTileGridPanel";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import AmplificationPanel from "@/components/AmplificationPanel";
import { checkpoint } from "@/lib/checkpoints";
import { thetaScaleExpected, thetaScaleUsed } from "@/lib/expectations";
import { PhysicsFieldSampler } from "@/components/PhysicsFieldSampler";
import { ShiftVectorPanel } from "@/components/ShiftVectorPanel";
import { CurvatureKey } from "@/components/CurvatureKey";
import { ShellOutlineVisualizer } from "@/components/ShellOutlineVisualizer";
import LightSpeedStrobeScale from "@/components/LightSpeedStrobeScale";
import HelixCasimirAmplifier from "@/components/HelixCasimirAmplifier";
import CurvatureSlicePanel from "@/components/CurvatureSlicePanel";
import { useResonatorAutoDuty } from "@/hooks/useResonatorAutoDuty";
import ResonanceSchedulerTile from "@/components/ResonanceSchedulerTile";
import { useLightCrossingLoop } from "@/hooks/useLightCrossingLoop";
import { useActiveTiles } from "@/hooks/use-active-tiles";

// Mode-specific RF burst fractions now sourced from MODE_CONFIGS

const DEV = process.env.NODE_ENV !== "production";

declare global {
  interface Window {
    setStrobingState?: (args: { sectorCount: number; currentSector: number; split?: number }) => void;
  }
}

// Install a safe wrapper once so any internal visualizer bug can't crash the page
if (typeof window !== "undefined") {
  const w = window as any;
  if (!w.__strobePatched) {
    const orig = w.setStrobingState;
    if (typeof orig !== "function") {
      w.setStrobingState = () => {}; // no-op until a visualizer mounts
    } else {
      w.setStrobingState = (args: any) => {
        try {
          orig(args);
        } catch (err) {
          console.warn("[HELIX] setStrobingState wrapper swallowed error:", err);
        }
      };
    }
    w.__strobePatched = true;
  }
}

// --- Safe numeric formatters ---
const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const fmt = (v: unknown, digits = 3, fallback = "—") => (isFiniteNumber(v) ? v.toFixed(digits) : fallback);

const fexp = (v: unknown, digits = 1, fallback = "—") => (isFiniteNumber(v) ? v.toExponential(digits) : fallback);

const fint = (v: unknown, fallback = "0") => (isFiniteNumber(v) ? Math.round(v).toLocaleString() : fallback);

const fmtPowerUnit = (mw?: number) => {
  const x = Number(mw);
  if (!Number.isFinite(x)) return "—";
  if (x >= 1) return `${x.toFixed(1)} MW`;
  if (x >= 1e-3) return `${(x * 1e3).toFixed(1)} kW`;
  return `${(x * 1e6).toFixed(1)} W`;
};

// add with your other small utils
const npos = (x: unknown, d = 0) => {
  const v = Number(x);
  return Number.isFinite(v) && v > 0 ? v : d;
};
const nnonneg = (x: unknown, d = 0) => {
  const v = Number(x);
  return Number.isFinite(v) && v >= 0 ? v : d;
};

// Mainframe zones configuration
const MAINFRAME_ZONES = {
  TILE_GRID: "Casimir Tile Grid",
  ENERGY_PANEL: "Energy Control Panel",
  COMPLIANCE_HUD: "Metric Compliance HUD",
  PHASE_DIAGRAM: "Phase Diagram AI",
  RESONANCE_SCHEDULER: "Resonance Scheduler",
  LOG_TERMINAL: "Log + Document Terminal",
  WARP_VISUALIZER: "Natário Warp Bubble",
};

interface EnergyPipelineState {
  currentMode?: string;
  dutyCycle?: number;
  sectorStrobing?: number;
  gammaGeo?: number;
  qSpoilingFactor?: number;
  qCavity?: number;
  P_avg?: number;
  zeta?: number;
  TS_ratio?: number;
  fordRomanCompliance?: boolean; // was string
  natarioConstraint?: boolean; // was string
  curvatureLimit?: boolean; // was string
  U_cycle?: number;
  U_static?: number;
  U_geo?: number;
  U_Q?: number;
  P_loss_raw?: number;
  N_tiles?: number;
  modulationFreq_GHz?: number;
  M_exotic?: number;
  gammaVanDenBroeck?: number;
  qMechanical?: number; // used in ShellOutlineVisualizer + HUD calc
  sagDepth_nm?: number; // used in WarpVisualizer parameters
  overallStatus?: string; // used in "System Status"
}

interface SystemMetrics {
  activeSectors: number; // NEW: active sectors (1, 400, etc.)
  totalSectors: number; // NEW: total sectors (400)
  activeTiles: number; // Updated: actual tile count
  totalTiles: number;
  tilesPerSector: number; // NEW: tiles per sector
  sectorStrobing: number; // Added for strobing display
  currentSector: number; // NEW: physics-timed sweep index
  strobeHz: number; // NEW: sector sweep frequency
  sectorPeriod_ms: number; // NEW: time per sector
  energyOutput: number;
  exoticMass: number;
  fordRoman: {
    value: number;
    limit: number;
    status: string;
  };
  natario: {
    value: number;
    status: string;
  };
  curvatureMax: number;
  timeScaleRatio: number;
  overallStatus: string;
  shiftVector?: {
    epsilonTilt: number;
    betaTiltVec: [number, number, number];
  };
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    result: any;
  };
}

export default function HelixCore() {
  // Preload lazy bundles to avoid suspending during user input
  useEffect(() => {
    const preload = () => {
      import("@/components/warp/WarpBubbleCompare");
      import("@/components/WarpRenderInspector");
    };
    const id = "requestIdleCallback" in window ? (window as any).requestIdleCallback(preload) : setTimeout(preload, 50);
    return () => {
      if ("cancelIdleCallback" in window) (window as any).cancelIdleCallback?.(id);
      else clearTimeout(id);
    };
  }, []);

  // Generate logical sector list (no physics here)
  const SECTORS = useMemo(() => Array.from({ length: 400 }, (_, i) => ({ id: `S${i + 1}` })), []);

  const queryClient = useQueryClient();

  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [mainframeLog, setMainframeLog] = useState<string[]>([
    "[HELIX-CORE] System initialized",
    "[HELIX-CORE] Needle Hull mainframe ready",
    "[HELIX-CORE] Awaiting commands...",
  ]);
  const [commandInput, setCommandInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content: "HELIX-CORE mainframe initialized. Ready for commands.",
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const commandAbortRef = useRef<AbortController | null>(null);
  const [activeMode, setActiveMode] = useState<"auto" | "manual" | "diagnostics" | "theory">("auto");
  const [modulationFrequency, setModulationFrequency] = useState(15); // Default 15 GHz
  const [visualizersInitialized, setVisualizersInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mode change signal system
  const [renderNonce, setRenderNonce] = useState(0);
  const [modeNonce, setModeNonce] = useState(0 as number);

  // Re-mount viz engines whenever the server says "reload"
  useEffect(() => {
    const off = subscribe("warp:reload", () => setRenderNonce((n) => n + 1));
    return () => (off ? unsubscribe(off) : undefined);
  }, []);

  const [optimisticMode, setOptimisticMode] = useState<ModeKey | null>(null);
  const [route, setRoute] = useState<string[]>(["SOL", "ORI_OB1", "VEL_OB2", "SOL"]);

  // Fade memory for trailing glow (per-sector intensity 0..1)
  const [trail, setTrail] = useState<number[]>(() => Array(400).fill(0));
  const [useDeepZoom, setUseDeepZoom] = useState(false);
  const [cosmeticLevel, setCosmeticLevel] = useState(10); // 1..10 (10 = current look)
  const [mapMode, setMapMode] = useState<"galactic" | "solar">(() => {
    const stored = localStorage.getItem("helix-mapMode");
    return stored === "galactic" ? "galactic" : "solar";
  });
  const [solarBodies, setSolarBodies] = useState(() => solarToBodies(computeSolarXY()));

  // Live solar positions for route planning (updates every 5 seconds)
  const [solarTick, setSolarTick] = useState(0);
  const solarBodiesForRoutes = useMemo(() => getSolarBodiesAsPc(), [solarTick]);

  // 🔗 NEW: compute barycenter wobble path once (AU polyline with per-vertex alpha)
  const baryPath = React.useMemo(
    () => computeBarycenterPolylineAU({ daysPast: 3650, daysFuture: 3650, stepDays: 20, fade: true }),
    []
  );

  const [deepZoomViewer, setDeepZoomViewer] = useState<any>(null);
  const [galaxyCalibration, setGalaxyCalibration] = useState<{ originPx: { x: number; y: number }; pxPerPc: number } | null>(
    null
  );

  // Load galaxy map and compute calibration
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const { originPx, pxPerPc } = calibrateToImage(img.naturalWidth, img.naturalHeight, SVG_CALIB);
      setGalaxyCalibration({ originPx, pxPerPc });
      if (DEV)
        console.log("🗺️ Galaxy calibration:", {
          imageSize: { w: img.naturalWidth, h: img.naturalHeight },
          sunPixel: originPx,
          scale: `${pxPerPc.toFixed(4)} px/pc`,
        });
    };
    img.src = "/galaxymap.png";
  }, []);

  // Get metrics data for hull geometry (reduced polling for performance)
  const { metrics: hullMetrics } = useMetrics(20000); // 20s vs 2s default

  // Update solar system positions periodically
  useEffect(() => {
    if (mapMode === "solar") {
      const updateSolarPositions = () => {
        setSolarBodies(solarToBodies(computeSolarXY()));
      };

      const interval = setInterval(updateSolarPositions, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [mapMode]);

  // Update route calculation positions every 5 seconds and test Luma whisper
  useEffect(() => {
    const interval = setInterval(() => setSolarTick((t) => t + 1), 5000);

    // Test Luma whisper on first load
    const timer = setTimeout(() => {
      publish("luma:whisper", { text: "HELIX-CORE initialized. Welcome to the cosmic bridge." });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // Use centralized energy pipeline
  const { data: pipelineState } = useEnergyPipeline({
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
  const switchMode = useSwitchMode();

  // Type-safe access to pipeline state
  const pipeline = pipelineState as EnergyPipelineState;

  // Optional: expose for quick console checks
  useEffect(() => {
    (window as any).__energyLive = pipeline;
  }, [pipeline]);

  // Listen for debug events from hardLockUniforms and push into debug panel
  useEffect(() => {
    function onDebug(ev: Event) {
      const e = ev as CustomEvent<{
        level: "info" | "warn" | "error";
        tag: string;
        msg: string;
        data?: any;
        ts: number;
      }>;
      const d = e.detail || { level: "info", tag: "DEBUG", msg: "unknown", ts: Date.now() };
      const from = d.data?.from ? ` ← ${String(d.data.from).replace(/^at\s+/, "")}` : "";
      const val = d.data?.value !== undefined ? ` value=${JSON.stringify(d.data.value)}` : "";
      const line = `[LOCK] ${d.tag}: ${d.msg}${val}${from}`;
      // keep last 200 lines
      setMainframeLog((prev) => [...prev, line].slice(-200));
    }
    window.addEventListener("helix:debug", onDebug as any);
    return () => window.removeEventListener("helix:debug", onDebug as any);
  }, []);

  // Fetch system metrics
  const { data: systemMetrics, refetch: refetchMetrics } = useQuery<SystemMetrics>({
    queryKey: ["/api/helix/metrics"],
    refetchInterval: 5000,
    staleTime: 4_500,
    refetchOnWindowFocus: false,
  });

  // Show theta audit in logs
  useEffect(() => {
    const a = (systemMetrics as any)?.thetaAudit;
    if (!a) return;
    const pct = a.expected ? ((a.used / a.expected) * 100).toFixed(1) : "—";
    setMainframeLog((prev) =>
      [...prev, `[AUDIT] θ-scale expected=${a.expected.toExponential(2)} used=${a.used.toExponential(2)} (${pct}%)`].slice(
        -200
      )
    );
  }, [(systemMetrics as any)?.thetaAudit]);

  // Publish canonical uniforms from server metrics
  useEffect(() => {
    const wu = (systemMetrics as any)?.warpUniforms;
    if (!wu) return;

    const seq = Number((systemMetrics as any)?.seq);
    const version = Number.isFinite(seq) ? seq : ++__busSeq;

    publish("warp:uniforms", sanitizeServerUniforms(wu, version));
  }, [systemMetrics]);

  // Auto-duty controller - automatically runs resonance scheduler on mode changes
  useResonatorAutoDuty({
    mode: (pipeline?.currentMode ?? "hover") as "standby" | "hover" | "cruise" | "emergency",
    duty: pipeline?.dutyCycle ?? 0.14,
    sectors: systemMetrics?.activeSectors ?? 1,
    freqGHz: pipeline?.modulationFreq_GHz ?? 15,
    onLog: (line) => {
      setMainframeLog((prev) => [...prev, line].slice(-50)); // Keep last 50 lines
    },
    onAfterRun: () => {
      refetchMetrics(); // Refresh metrics after auto-duty run
    },
    enabled: true, // Enable auto-duty controller
  });

  // Unified, defensive mode fallback for the whole page
  const serverMode = (pipeline?.currentMode ?? (systemMetrics as any)?.currentMode ?? "hover") as ModeKey;
  const effectiveMode = (optimisticMode ?? serverMode) as "standby" | "hover" | "cruise" | "emergency";

  // Watch for server mode actually changing; bump nonce so children can re-init
  const prevServerModeRef = useRef<string>(serverMode);
  useEffect(() => {
    if (prevServerModeRef.current !== serverMode) {
      prevServerModeRef.current = serverMode;
      setModeNonce((n) => n + 1);
      setOptimisticMode(null); // clear optimism once server confirms
    }
  }, [serverMode]);

  // --- Derived mode knobs for UI (always reflect the selected mode)
  const modeCfg = MODE_CONFIGS[pipeline?.currentMode || effectiveMode] || MODE_CONFIGS.hover;

  // Prefer live pipeline values if present; otherwise fall back to the mode config
  const dutyUI = isFiniteNumber(pipeline?.dutyCycle) ? pipeline!.dutyCycle! : modeCfg.dutyCycle ?? 0.14;

  // Split sector handling: total sectors (400) for averaging vs concurrent sectors (1-2) for strobing
  const totalSectors = useMemo(() => {
    const fromMetrics = Number(systemMetrics?.totalSectors);
    if (Number.isFinite(fromMetrics) && fromMetrics! > 0) return Math.floor(fromMetrics!);
    const fromPipeline = Number((pipeline as any)?.sectorsTotal);
    if (Number.isFinite(fromPipeline) && fromPipeline! > 0) return Math.floor(fromPipeline!);
    return modeCfg.sectorsTotal;
  }, [systemMetrics?.totalSectors, (pipeline as any)?.sectorsTotal, modeCfg.sectorsTotal]);

  const concurrentSectors = useMemo(() => {
    const fromMetrics = Number(systemMetrics?.sectorStrobing);
    if (Number.isFinite(fromMetrics) && fromMetrics! > 0) return Math.floor(fromMetrics!);
    const fromPipeline = Number((pipeline as any)?.sectorsConcurrent ?? pipeline?.sectorStrobing);
    if (Number.isFinite(fromPipeline) && fromPipeline! > 0) return Math.floor(fromPipeline!);
    return modeCfg.sectorsConcurrent;
  }, [systemMetrics?.sectorStrobing, (pipeline as any)?.sectorsConcurrent, pipeline?.sectorStrobing, modeCfg.sectorsConcurrent]);

  // keep for legacy display text if needed
  const sectorsUI = concurrentSectors;

  // Keep the trail array sized to totalSectors
  useEffect(() => {
    setTrail((prev) => (prev.length === totalSectors ? prev : Array(totalSectors).fill(0)));
  }, [totalSectors]);

  // Calculate hull geometry before using it
  const hull =
    hullMetrics && hullMetrics.hull
      ? {
          ...hullMetrics.hull,
          a: hullMetrics.hull.a ?? hullMetrics.hull.Lx_m / 2,
          b: hullMetrics.hull.b ?? hullMetrics.hull.Ly_m / 2,
          c: hullMetrics.hull.c ?? hullMetrics.hull.Lz_m / 2,
        }
      : { Lx_m: 1007, Ly_m: 264, Lz_m: 173, a: 503.5, b: 132, c: 86.5 };

  // Shared light-crossing loop for synchronized strobing across all visual components
  const lc = useLightCrossingLoop({
    // NOTE: passes TOTAL sectors (averaging), not live/concurrent.
    sectorStrobing: totalSectors,
    currentSector: systemMetrics?.currentSector ?? 0,
    sectorPeriod_ms: systemMetrics?.sectorPeriod_ms ?? 1.0,
    duty: dutyUI,
    freqGHz: pipeline?.modulationFreq_GHz ?? 15,
    hull: { a: hull.a, b: hull.b, c: hull.c }, // use live hull geometry
    wallWidth_m: 6.0,
    localBurstFrac: MODE_CONFIGS[effectiveMode as ModeKey]?.localBurstFrac ?? 0.01, // mode-aware burst duty
  });

  const qSpoilUI = isFiniteNumber(pipeline?.qSpoilingFactor) ? pipeline!.qSpoilingFactor! : modeCfg.qSpoilingFactor ?? 1;

  const dutyEffectiveFR = useMemo(() => {
    const frFromPipeline =
      (pipelineState as any)?.dutyEffectiveFR ?? (pipelineState as any)?.dutyShip ?? (pipelineState as any)?.dutyEff;

    if (isFiniteNumber(frFromPipeline)) return clamp01(frFromPipeline);

    const burst = Number(lc?.burst_ms);
    const dwell = Number(lc?.dwell_ms);
    const burstLocal = Number.isFinite(burst) && Number.isFinite(dwell) && dwell > 0 ? burst / dwell : 0.01;

    const S_live = Math.max(0, Math.floor(concurrentSectors ?? 1));
    const S_total = Math.max(1, Math.floor(totalSectors ?? 400));

    return clamp01(burstLocal * (S_live / S_total));
  }, [pipelineState, lc?.burst_ms, lc?.dwell_ms, concurrentSectors, totalSectors]);

  const isStandby = String(effectiveMode).toLowerCase() === "standby";
  const dutyEffectiveFR_safe = isStandby ? 0 : dutyEffectiveFR;
  const dutyUI_safe = isStandby ? 0 : dutyUI;

  console.table({
    mode: effectiveMode,
    totalSectors,
    concurrentSectors,
    dwell_ms: lc.dwell_ms,
    burst_ms: lc.burst_ms,
    localBurstFrac: MODE_CONFIGS[effectiveMode as ModeKey]?.localBurstFrac,
    dutyFR: dutyEffectiveFR_safe,
  });

  // --- Active tiles: robust fallback calc
  const TOTAL_SECTORS_FALLBACK = 400;
  const TOTAL_TILES_FALLBACK = 2_800_000;
  const LOCAL_BURST_DEFAULT = 0.01;

  const totalSectorsSafe = Number.isFinite(totalSectors) ? Math.max(1, Number(totalSectors)) : TOTAL_SECTORS_FALLBACK;

  const concurrentSectorsSafe = isStandby ? 0 : Math.max(1, Number(concurrentSectors) || 1);

  const totalTilesSafe = (() => {
    const a = Number(systemMetrics?.totalTiles);
    const b = Number(pipeline?.N_tiles);
    if (Number.isFinite(a) && a > 0) return Math.floor(a);
    if (Number.isFinite(b) && b > 0) return Math.floor(b);
    return TOTAL_TILES_FALLBACK;
  })();

  const tilesPerSectorSafe = (() => {
    const tps = Number(systemMetrics?.tilesPerSector);
    if (Number.isFinite(tps) && tps > 0) return Math.floor(tps);
    return Math.max(1, Math.floor(totalTilesSafe / totalSectorsSafe));
  })();

  // Calculate view mass fraction for REAL renderer (one sector's worth vs full hull)
  const viewMassFracReal = tilesPerSectorSafe / totalTilesSafe; // ≈ 1/400 for single sector

  const burstLocal = (() => {
    const b = Number(lc?.burst_ms),
      d = Number(lc?.dwell_ms);
    if (Number.isFinite(b) && Number.isFinite(d) && d > 0) {
      return Math.max(0, Math.min(1, b / d));
    }
    return LOCAL_BURST_DEFAULT;
  })();

  const dutyFRSafe = (() => {
    if (isStandby) return 0;
    const fr = Number((pipelineState as any)?.dutyEffectiveFR) ?? Number((pipelineState as any)?.dutyEff) ?? NaN;
    if (Number.isFinite(fr)) return Math.max(0, Math.min(1, fr));
    return Math.max(0, Math.min(1, burstLocal * (concurrentSectorsSafe / totalSectorsSafe)));
  })();

  const computedAvgTiles = Math.round(totalTilesSafe * dutyFRSafe);
  const computedInstantTiles = Math.round(tilesPerSectorSafe * concurrentSectorsSafe * burstLocal);

  // If server emitted 0 but we're not in Standby, prefer computed
  const serverAvgTiles = Number(systemMetrics?.activeTiles);
  const avgTilesSafe =
    !isStandby && Number.isFinite(serverAvgTiles) && serverAvgTiles > 0 ? Math.floor(serverAvgTiles) : computedAvgTiles;

  const activeTiles = {
    avgTiles: avgTilesSafe,
    instantTilesSmooth: isStandby ? 0 : computedInstantTiles,
    burstLocal,
  };

  // 🎛️ RAF gating for smooth transitions
  const rafGateRef = useRef<number | null>(null);

  // SliceViewer responsive sizing (single source of truth — fixes duplicate ref crash)
  const sliceHostRef = useRef<HTMLDivElement>(null);
  const [sliceSize, setSliceSize] = useState({ w: 480, h: 240 });

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.floor((e.contentBoxSize?.[0]?.inlineSize ?? e.contentRect.width) || 480);
        const clampedW = Math.max(360, Math.min(w, 800));
        setSliceSize({ w: clampedW, h: Math.round(clampedW / 2) });
      }
    });
    const el = sliceHostRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Calculate epsilonTilt after pipeline is available
  const G = 9.80665,
    c = 299792458;
  const gTargets: Record<string, number> = {
    hover: 0.1 * G,
    cruise: 0.05 * G,
    emergency: 0.3 * G,
    standby: 0,
  };
  const currentMode = effectiveMode.toLowerCase();
  const gTarget = gTargets[currentMode] ?? 0;
  const R_geom = Math.cbrt(hull.a * hull.b * hull.c);
  const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (c * c)));

  const compareParams = useMemo(() => {
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

    return {
      currentMode: effectiveMode,

      // geometry
      hull,

      // --- UI duty (FR duty computed separately and added at call-site) ---
      dutyCycle: dutyUI_safe,

      // --- BOTH sector numbers ---
      sectorCount: totalSectors, // TOTAL (averaging)
      sectors: concurrentSectors, // concurrent (sweep)
      sectorStrobing: sectorsUI, // legacy compatibility

      // physics amps
      gammaGeo: num(pipeline?.gammaGeo) ?? 26,
      qSpoilingFactor: num(pipeline?.qSpoilingFactor) ?? 1,
      gammaVanDenBroeck: isStandby ? 1 : Number(pipeline?.gammaVanDenBroeck_vis ?? pipeline?.gammaVanDenBroeck ?? 1) ?? 0,

      // viewer niceties
      viewAvg: true,
      colorMode: "theta" as const,
      lockFraming: true,
    };
  }, [
    effectiveMode,
    hull,
    systemMetrics?.currentSector,
    totalSectors,
    concurrentSectors,
    pipeline?.modulationFreq_GHz,
    pipeline?.hull?.wallThickness_m,
    pipeline?.dutyCycle,
    pipeline?.sectorCount,
    pipeline?.sectorStrobing,
    pipeline?.gammaGeo,
    pipeline?.qSpoilingFactor,
    pipeline?.gammaVanDenBroeck,
    sectorsUI,
    isStandby,
    dutyEffectiveFR_safe,
    dutyUI_safe,
  ]);

  // Also rebind when core FR/sector knobs actually change (local safety net)
  useEffect(() => {
    setRenderNonce((n) => n + 1);
  }, [pipeline?.currentMode, dutyUI_safe, dutyEffectiveFR_safe, totalSectors, concurrentSectors]);

  // Create truly separate payloads (no shared nested refs)
  const heroParams = useMemo(() => {
    const p: any = structuredClone(compareParams);
    p.physicsParityMode = false;
    return p;
  }, [compareParams]);

  const realParams = useMemo(() => {
    const p: any = structuredClone(compareParams);
    p.physicsParityMode = true;
    p.viz = { ...(p.viz ?? {}), curvatureGainT: 0, curvatureBoostMax: 1, colorMode: "theta" };
    p.curvatureGainDec = 0;
    p.curvatureBoostMax = 1;
    return p;
  }, [compareParams]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Send command to HELIX-CORE
  const sendCommand = React.useCallback(async () => {
    if (!commandInput.trim() || isProcessing) return;

    // Abort any previous command
    if (commandAbortRef.current) {
      commandAbortRef.current.abort();
    }
    commandAbortRef.current = new AbortController();

    const userMessage: ChatMessage = {
      role: "user",
      content: commandInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCommandInput("");
    setIsProcessing(true);

    try {
      const response = await apiRequest(
        "POST",
        "/api/helix/command",
        {
          messages: chatMessages
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            }))
            .concat([
              {
                role: "user" as const,
                content: commandInput,
                timestamp: new Date(),
              },
            ]),
        },
        commandAbortRef.current.signal
      );

      const responseData = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: responseData.message.content,
        timestamp: new Date(),
      };

      if (responseData.functionResult) {
        assistantMessage.functionCall = {
          name: responseData.message.function_call.name,
          result: responseData.functionResult,
        };

        // Log function calls
        setMainframeLog((prev) =>
          [
            ...prev,
            (() => {
              let args = responseData.message.function_call.arguments;
              try {
                args = JSON.stringify(JSON.parse(args));
              } catch {
                /* already a string or malformed */
              }
              return `[FUNCTION] ${responseData.message.function_call.name}(${args})`;
            })(),
            `[RESULT] ${JSON.stringify(responseData.functionResult)}`,
          ].slice(-200)
        );

        // Refresh metrics if a pulse was executed
        if (responseData.message.function_call.name === "pulse_sector") {
          refetchMetrics();
        }
      }

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Command Error",
        description: error instanceof Error ? error.message : "Failed to process command",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandInput, isProcessing, chatMessages, refetchMetrics]);

  // Physics-timed sector sweep for UI animation
  useEffect(() => {
    if (!systemMetrics && !Number.isFinite(lc?.sectorIdx)) return;

    const total = totalSectors; // e.g., 400
    const live = Math.max(1, Math.min(total, Math.floor(concurrentSectors ?? 1))); // Safe clamp
    const baseIdxSrc = Number.isFinite(systemMetrics?.currentSector)
      ? Number(systemMetrics!.currentSector)
      : Number(lc?.sectorIdx ?? 0); // fallback to physics loop
    const base = Math.max(0, Math.floor(baseIdxSrc)) % total;

    setTrail((prev) => {
      // decay
      const next = (prev.length === total ? prev : Array(total).fill(0)).map((v) => Math.max(0, v * 0.9));
      // energize `live` consecutive sectors
      for (let k = 0; k < live; k++) next[(base + k) % total] = 1;
      return next;
    });
  }, [totalSectors, concurrentSectors, systemMetrics?.currentSector, systemMetrics?.sectorStrobing, lc?.sectorIdx]);

  // Sync 3D engine with strobing state (defensive + sanitized)
  useEffect(() => {
    const total = Number.isFinite(totalSectors) ? Math.max(1, Math.floor(totalSectors)) : undefined;
    const cs = Number.isFinite(systemMetrics?.currentSector)
      ? Number(systemMetrics!.currentSector)
      : Number(lc?.sectorIdx ?? NaN);
    const fn = (window as any).setStrobingState;

    if (!total || !Number.isFinite(cs)) return;
    if (typeof fn !== "function") return;

    try {
      const cur = Math.max(0, Math.floor(cs)) % total;
      fn({ sectorCount: total, currentSector: cur, split: cur });
    } catch (err) {
      console.warn("setStrobingState threw; skipped this tick:", err);
    }
  }, [totalSectors, systemMetrics?.currentSector, lc?.sectorIdx]);

  // Color mapper (blue→active; red if ζ breach)
  const sectorColor = React.useCallback(
    (i: number) => {
      const ζ = systemMetrics?.fordRoman?.value ?? 0.0;
      const limitBreach = ζ >= 1.0;
      const v = trail[i] ?? 0;
      if (limitBreach) {
        return `rgba(239, 68, 68, ${0.2 + 0.8 * v})`; // red
      }
      return `rgba(34, 197, 94, ${0.2 + 0.8 * v})`; // green
    },
    [systemMetrics?.fordRoman?.value, trail]
  );

  // Handle tile click
  const handleTileClick = React.useCallback(
    async (sectorId: string) => {
      setSelectedSector(sectorId);
      const sectorIndex = parseInt(sectorId.replace("S", "")) - 1;

      setMainframeLog((prev) =>
        [...prev, `[TILE] Selected ${sectorId}`, `[DATA] Sector Index: ${sectorIndex}, Fade: ${trail[sectorIndex]?.toFixed(3) || "0.000"}`].slice(-200)
      );

      // In manual mode, pulse the sector
      if (activeMode === "manual") {
        setIsProcessing(true);
        try {
          const command = `Pulse sector ${sectorId} with 1 nm gap`;
          const userMessage: ChatMessage = {
            role: "user",
            content: command,
            timestamp: new Date(),
          };
          setChatMessages((prev) => [...prev, userMessage]);

          // Abort any previous command
          if (commandAbortRef.current) {
            commandAbortRef.current.abort();
          }
          commandAbortRef.current = new AbortController();

          const response = await apiRequest(
            "POST",
            "/api/helix/command",
            {
              messages: chatMessages.concat({ role: "user", content: command }),
            },
            commandAbortRef.current.signal
          );

          const responseData = await response.json();
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: responseData.message.content,
            timestamp: new Date(),
          };

          if (responseData.functionResult) {
            assistantMessage.functionCall = {
              name: responseData.message.function_call.name,
              result: responseData.functionResult,
            };
            setMainframeLog((prev) => [...prev, `[MANUAL] ${sectorId} pulsed: Energy=${responseData.functionResult.energy?.toExponential(2)} J`].slice(-200));
            refetchMetrics();
          }

          setChatMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
          toast({
            title: "Manual Pulse Error",
            description: error instanceof Error ? error.message : "Failed to pulse sector",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [activeMode, chatMessages, refetchMetrics, trail]
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 relative z-10">
        <div className="container mx-auto p-4 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Cpu className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">HELIX-CORE</h1>
                <p className="text-sm text-slate-400">Needle Hull Mainframe System</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/why">
                <Badge
                  variant="outline"
                  className="cursor-pointer border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Why
                </Badge>
              </Link>
              <Link href="/bridge">
                <Button variant="outline" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Bridge
                </Button>
              </Link>
            </div>
          </div>

          {/* === Quick Operational Mode Switch (global) === */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
              {([
                { key: "standby", label: "Standby", hint: "Field idle" },
                { key: "hover", label: "Hover", hint: "Gentle bulge" },
                { key: "cruise", label: "Cruise", hint: "Coherent 400× strobe" },
                { key: "emergency", label: "Emergency", hint: "Max response" },
              ] as const).map((m) => {
                const isActive = effectiveMode === m.key;
                return (
                  <Button
                    key={m.key}
                    variant={isActive ? "default" : "outline"}
                    className={`font-mono ${isActive ? "bg-cyan-600 text-white" : "bg-slate-900"}`}
                    onClick={() => {
                      if (!isActive) {
                        startTransition(() => {
                          setOptimisticMode(m.key as ModeKey);
                          setModeNonce((n) => n + 1);
                          switchMode.mutate(m.key as any, {
                            onSuccess: () => {
                              // make both sides refresh
                              queryClient.invalidateQueries({
                                predicate: (q) =>
                                  Array.isArray(q.queryKey) &&
                                  (q.queryKey[0] === "/api/helix/pipeline" || q.queryKey[0] === "/api/helix/metrics"),
                              });
                            },
                          });
                        });
                        refetchMetrics();
                        setMainframeLog((prev) => [...prev, `[MODE] Quick switch → ${m.key}`]);
                      }
                    }}
                  >
                    {m.label}
                    <span className="ml-2 text-xs opacity-70">{m.hint}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {false && (
            <>
              {/* ====== HERO: Natário Warp Bubble (full width) ====== */}
              <Card className="bg-slate-900/50 border-slate-800 mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Atom className="w-5 h-5 text-cyan-400" />
                    {MAINFRAME_ZONES.WARP_VISUALIZER}
                  </CardTitle>
                  <CardDescription>3D spacetime curvature + equatorial slice viewer — live, mode-aware, and physically grounded</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {(() => {
                    const hullAxes: [number, number, number] =
                      hullMetrics && hullMetrics.hull
                        ? [
                            hullMetrics.hull.a ?? hullMetrics.hull.Lx_m / 2,
                            hullMetrics.hull.b ?? hullMetrics.hull.Ly_m / 2,
                            hullMetrics.hull.c ?? hullMetrics.hull.Lz_m / 2,
                          ]
                        : [503.5, 132, 86.5];

                    return (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="rounded-lg overflow-hidden bg-slate-950">
                            <Suspense
                              fallback={<div className="h-64 grid place-items-center text-slate-400">Loading visualizers…</div>}
                            >
                              <WarpBubbleCompare
                                key={`hero-${renderNonce}`}
                                parameters={{
                                  ...compareParams,
                                  currentMode: effectiveMode,
                                  reloadToken: modeNonce,
                                  lightCrossing: lc,
                                  sectorCount: totalSectors,
                                  sectors: concurrentSectors,
                                  dutyEffectiveFR: dutyEffectiveFR_safe,
                                  dutyCycle: dutyUI_safe,
                                  viewAvg: true,
                                  colorMode: "theta",
                                  lockFraming: true,
                                  gammaVanDenBroeck: isStandby
                                    ? 1
                                    : Number(pipeline?.gammaVanDenBroeck_vis ?? pipeline?.gammaVanDenBroeck ?? 1),
                                  powerAvg_MW: Number(pipeline?.P_avg ?? 83.3),
                                  exoticMass_kg: Number(pipeline?.M_exotic ?? 1405),
                                }}
                                parityExaggeration={1}
                                heroExaggeration={82}
                                colorMode="theta"
                                lockFraming={true}
                              />
                            </Suspense>
                          </div>
                        </div>

                        <div className="space-y-4" ref={sliceHostRef}>
                          <SliceViewer
                            hullAxes={[
                              Number(hullAxes[0]) || 503.5,
                              Number(hullAxes[1]) || 132.0,
                              Number(hullAxes[2]) || 86.5,
                            ]}
                            wallWidth_m={6.0}
                            driveDir={[1, 0, 0]}
                            vShip={1.0}
                            gammaGeo={pipeline?.gammaGeo ?? 26}
                            qSpoilingFactor={qSpoilUI}
                            gammaVdB={(() => {
                              const gammaVdB_vis = Number(pipeline?.gammaVanDenBroeck_vis ?? pipeline?.gammaVanDenBroeck ?? 1);
                              return isFiniteNumber(gammaVdB_vis) ? gammaVdB_vis : 0;
                            })()}
                            dutyCycle={dutyUI_safe}
                            dutyEffectiveFR={dutyEffectiveFR_safe}
                            sectors={totalSectors}
                            viewAvg={true}
                            diffMode={false}
                            refParams={{
                              gammaGeo: 26,
                              qSpoilingFactor: 1,
                              gammaVdB: 0,
                              dutyCycle: 0.14,
                              sectors: 1,
                              viewAvg: true,
                            }}
                            sigmaRange={6}
                            exposure={6}
                            zeroStop={1e-7}
                            showContours={true}
                            curvatureBoostMax={40}
                            width={sliceSize.w}
                            height={sliceSize.h}
                            className="xl:sticky xl:top-4"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </>
          )}

          {/* ====== SHELL OUTLINE VIEWER (wireframe surfaces) ====== */}
          <Card className="bg-slate-900/50 border-slate-800 mb-4">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Warp Bubble • Shell Outline (ρ=1±Δ)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                    <p className="mb-2">
                      Three ρ-surfaces (inner/center/outer) bound the wall thickness set by the Natário bell. Inner curves skew
                      toward compression (orange), outer toward expansion (blue). Violet denotes interior tilt direction.
                    </p>
                    <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                    <p className="text-xs italic">Contours show where space would lean—enough to guide, never to tear.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>Wireframe of inner/center/outer Natário wall (ellipsoidal), with interior shift vector.</CardDescription>
            </CardHeader>
            <CardContent>
              <ShellOutlineVisualizer
                parameters={{
                  hull:
                    hullMetrics && hullMetrics.hull
                      ? {
                          a: hullMetrics.hull.a ?? hullMetrics.hull.Lx_m / 2,
                          b: hullMetrics.hull.b ?? hullMetrics.hull.Ly_m / 2,
                          c: hullMetrics.hull.c ?? hullMetrics.hull.Lz_m / 2,
                        }
                      : {
                          a: 0.42,
                          b: 0.11,
                          c: 0.09, // normalized scene units
                        },
                  wallWidth: 0.06,
                  epsilonTilt: systemMetrics?.shiftVector?.epsilonTilt ?? epsilonTilt,
                  betaTiltVec: (systemMetrics?.shiftVector?.betaTiltVec ?? [0, -1, 0]) as [number, number, number],
                  // Mode coupling from live pipeline data
                  mode: effectiveMode,
                  dutyCycle: dutyUI_safe,
                  sectors: totalSectors,
                  gammaGeo: pipeline?.gammaGeo ?? 26,
                  qSpoil: qSpoilUI,
                  qCavity: pipeline?.qCavity ?? 1e9,
                  // 🔽 NEW: mechanical chain
                  qMechanical: pipeline?.qMechanical ?? 1,
                  modulationHz: (pipeline?.modulationFreq_GHz ?? 15) * 1e9,
                  mech: {
                    mechResonance_Hz: undefined, // default = modulation (centered)
                    mechZeta: undefined, // infer from qMechanical if omitted
                    mechCoupling: 0.65, // tweak visual strength 0..1
                  },
                  // 🔽 Ford-Roman window + light-crossing data
                  dutyEffectiveFR: dutyEffectiveFR_safe,
                  lightCrossing: lc,
                  zeta: pipeline?.zeta,
                }}
              />

              {/* Mechanical Physics HUD */}
              {(() => {
                const qMech = pipeline?.qMechanical ?? 1;
                const zeta = 1 / (2 * qMech);
                const f_mod = (pipeline?.modulationFreq_GHz ?? 15) * 1e9;
                const f0 = f_mod;
                const omega = f_mod / f0;
                const denomSq = (1 - omega * omega) ** 2 + (2 * zeta * omega) ** 2;
                const Arel = 1 / Math.sqrt(denomSq);

                return (
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-300 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">Q_mech = {qMech.toFixed(3)}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">ζ ≈ {zeta.toExponential(2)}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">f₀ = {(f0 / 1e9).toFixed(2)} GHz</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">A_rel = {Arel.toFixed(2)}</span>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* ====== Warp Render Inspector • Physics Debug ====== */}
          <Card className="bg-slate-900/50 border-slate-800 mb-4">
            <CardHeader>
              <CardTitle>Warp Render Inspector • Physics Debug</CardTitle>
              <CardDescription>Single source of truth for REAL vs SHOW with live pipeline</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Suspense fallback={<div className="h-40 grid place-items-center text-slate-400">Loading inspector…</div>}>
                <WarpRenderInspector
                  key={`inspector-${modeNonce}-${totalSectors}-${concurrentSectors}`}
                  parityPhys={(() => {
                    const realPhys = {
                      gammaGeo: pipeline?.gammaGeo ?? 26,
                      q: qSpoilUI,
                      gammaVdB: isStandby ? 1 : Number(pipeline?.gammaVanDenBroeck_vis ?? pipeline?.gammaVanDenBroeck ?? 1),
                      dFR: dutyEffectiveFR_safe,
                    };

                    const expREAL = thetaScaleExpected(realPhys);
                    const usedREAL = thetaScaleUsed(expREAL, {
                      concurrent: 1,
                      total: 400,
                      dutyLocal: 0.01,
                      viewFraction: 0.0025,
                      viewAveraging: true,
                    });

                    checkpoint({
                      id: "θ-expected",
                      side: "REAL",
                      stage: "expect",
                      pass: true,
                      msg: `θ_expected=${expREAL.toExponential()}`,
                      expect: expREAL,
                    });

                    checkpoint({
                      id: "θ-used",
                      side: "REAL",
                      stage: "expect",
                      pass: true,
                      msg: `θ_used=${usedREAL.toExponential()}`,
                      expect: usedREAL,
                    });

                    return {
                      gammaGeo: pipeline?.gammaGeo ?? 26,
                      qSpoilingFactor: qSpoilUI,
                      gammaVanDenBroeck_vis: isStandby
                        ? 1
                        : Number(pipeline?.gammaVanDenBroeck_vis ?? pipeline?.gammaVanDenBroeck ?? 1),
                      dutyEffectiveFR: dutyEffectiveFR_safe,
                      dutyCycle: dutyUI_safe,
                      viewMassFraction: viewMassFracReal,
                    };
                  })()}
                  showPhys={{
                    gammaGeo: pipeline?.gammaGeo ?? 26,
                    qSpoilingFactor: qSpoilUI,
                    gammaVanDenBroeck_vis: isStandby ? 1 : Number(pipeline?.gammaVanDenBroeck_vis ?? pipeline?.gammaVanDenBroeck ?? 1),
                    dutyEffectiveFR: dutyEffectiveFR_safe,
                    dutyCycle: dutyUI_safe,
                    viewMassFraction: 1.0,
                  }}
                  baseShared={{
                    hull: {
                      a: Number(hull.a) || 503.5,
                      b: Number(hull.b) || 132.0,
                      c: Number(hull.c) || 86.5,
                    },
                    wallWidth_m: 6.0,
                    driveDir: [1, 0, 0],
                    vShip: 0,
                    sectorCount: totalSectors,
                    sectors: concurrentSectors,
                    colorMode: "theta",
                    lockFraming: true,
                    currentMode: effectiveMode,
                  }}
                  lightCrossing={{ burst_ms: lc.burst_ms, dwell_ms: lc.dwell_ms }}
                  realRenderer="slice2d"
                  showRenderer="grid3d"
                />
              </Suspense>
            </CardContent>
          </Card>

          {/* ====== Light Speed vs Strobing Scale ====== */}
          <Card className="bg-slate-900/50 border-slate-800 mb-4">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                c vs Strobing Timeline
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                    <p className="mb-2">
                      The sweep rate across sectors is chosen so no disturbance outruns the grid's τ_LC. This timeline compares
                      modulation (Hz), sector period, and light-crossing to ensure the "average" shell is GR-valid.
                    </p>
                    <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                    <p className="text-xs italic">Go slowly enough to remain whole; move steadily enough to arrive.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>Visual comparison of light-crossing time vs modulation frequencies and sector dwell times.</CardDescription>
            </CardHeader>
            <CardContent>
              <LightSpeedStrobeScale
                dwellMs={Number.isFinite(lc.dwell_ms) ? lc.dwell_ms : 0}
                tauLcMs={Number.isFinite(lc.tauLC_ms) ? lc.tauLC_ms : 0}
                sectorIdx={lc.sectorIdx}
                sectorCount={lc.sectorCount}
                phase={lc.phase}
                burstMs={Number.isFinite(lc.burst_ms) ? lc.burst_ms : 0}
              />
            </CardContent>
          </Card>

          {/* ====== REAL Equatorial Slice (to-scale) ====== */}
          <CurvatureSlicePanel />

          {/* ====== OPERATIONAL MODES / ENERGY CONTROL (below hero) ====== */}
          <Card className="bg-slate-900/50 border-slate-800 mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-yellow-400" />
                {MAINFRAME_ZONES.ENERGY_PANEL}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                    <p className="mb-2">
                      Core operational mode controls power output, exotic matter generation, and sector strobing patterns. Each mode
                      balances performance with Ford-Roman compliance and energy efficiency.
                    </p>
                    <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                    <p className="text-xs italic">Power serves purpose. Choose the mode that serves the moment.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>Live mode switch + power, mass & status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Operational Mode Selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-200">Operational Mode</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm">
                        <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                        <p className="mb-2">
                          Each mode represents a different balance of power output, sector strobing frequency, and exotic matter
                          requirements based on mission requirements.
                        </p>
                        <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                        <p className="text-xs italic">The wise captain chooses not the fastest path, but the path that arrives intact.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={pipeline?.currentMode || "hover"}
                    onValueChange={(mode) => {
                      startTransition(() => {
                        setOptimisticMode(mode as ModeKey);
                        setModeNonce((n) => n + 1);
                        switchMode.mutate(mode as any, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({
                              predicate: (q) =>
                                Array.isArray(q.queryKey) &&
                                (q.queryKey[0] === "/api/helix/pipeline" || q.queryKey[0] === "/api/helix/metrics"),
                            });
                          },
                        });
                      });
                      setMainframeLog((prev) => [
                        ...prev,
                        `[MODE] Switching to ${mode} (duty=${(MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS].dutyCycle * 100).toFixed(
                          1
                        )}%, live=${MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS].sectorsConcurrent})...`,
                      ]);
                    }}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-700">
                      <SelectValue placeholder="Select mode">
                        {(() => {
                          const currentModeKey: ModeKey = (pipeline?.currentMode as ModeKey) || "hover";
                          const currentCfg = MODE_CONFIGS[currentModeKey];
                          const currentSnap = {
                            P_avg_MW: pipeline?.P_avg,
                            M_exotic_kg: pipeline?.M_exotic,
                            zeta: pipeline?.zeta,
                          };
                          const currentTitle = buildLiveDesc(currentSnap, currentCfg, pipeline?.P_target_W);
                          return (
                            <div className="flex flex-col">
                              <span className="font-medium">{currentCfg?.name ?? currentModeKey}</span>
                              <span className="text-xs text-muted-foreground">{currentTitle}</span>
                            </div>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {buildModeSelectItems(pipeline).map(({ key, cfg, snap }) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span className={`font-medium ${cfg.color}`}>{cfg?.name ?? key}</span>
                            <span className="text-xs text-muted-foreground">{buildLiveDesc(snap, cfg, pipeline?.P_target_W)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pipeline && <p className="text-xs text-slate-400">{MODE_CONFIGS[pipeline.currentMode]?.description}</p>}
                </div>

                {/* Active Tiles Panel with helper strings */}
                {(() => {
                  const frPctLabel = Number.isFinite(dutyEffectiveFR_safe) ? ` (${(dutyEffectiveFR_safe * 100).toFixed(3)}%)` : "";
                  const localOnLabel = Number.isFinite(activeTiles?.burstLocal) ? `${(activeTiles.burstLocal * 100).toFixed(2)}%` : "—";

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-400">Active Tiles (Energized)</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <div className="font-medium text-yellow-300 mb-1">🧠 Basis</div>
                              <p className="mb-2">
                                <strong>FR-avg</strong> uses ship-wide Ford–Roman duty across {totalSectors} sectors;{" "}
                                <strong>Instant</strong> shows tiles energized in the current live sector window (
                                {Math.max(1, Math.floor(concurrentSectors))}/{totalSectors}, local ON {localOnLabel}).
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* FR-averaged count */}
                        <p className="text-lg font-mono text-cyan-400">
                          {Number.isFinite(activeTiles?.avgTiles) ? Math.round(activeTiles!.avgTiles!).toLocaleString() : "2,800,000"}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-2 text-xs text-slate-400 underline decoration-dotted cursor-help">FR-avg{frPctLabel}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">Ship-averaged (Ford–Roman) duty used by the energy pipeline.</TooltipContent>
                          </Tooltip>
                        </p>

                        {/* Instantaneous energized tiles */}
                        <p className="text-sm font-mono text-emerald-400 mt-1">
                          {Number.isFinite(activeTiles?.instantTilesSmooth) ? Math.round(activeTiles!.instantTilesSmooth!).toLocaleString() : "—"}
                          <span className="ml-2 text-xs text-slate-400">instant</span>
                        </p>

                        <p className="text-xs text-slate-500">
                          {`${Math.max(1, Math.floor(concurrentSectors))} live • ${totalSectors} total • ${localOnLabel} local ON`}
                        </p>
                      </div>

                      {/* Energy Output */}
                      <div className="p-3 bg-slate-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-400">Energy Output</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                              <p className="mb-2">Average electrical power (ship-wide) from pipeline FR duty.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-lg font-mono text-yellow-400">{fmtPowerUnit(pipeline?.P_avg ?? systemMetrics?.energyOutput)}</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400">Exotic Mass</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                          <p className="mb-2">
                            Negative energy density required to curve spacetime according to the Alcubierre metric. Lower values
                            indicate more feasible warp drives.
                          </p>
                          <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                          <p className="text-xs italic">The mountain that appears impossible to move requires only the gentlest persistent pressure.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-mono text-purple-400">{fmt(pipeline?.M_exotic ?? systemMetrics?.exoticMass, 0, "1405")} kg</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <p className="text-xs text-slate-400">System Status</p>
                    <p className="text-lg font-mono text-green-400">{pipeline?.overallStatus || systemMetrics?.overallStatus || "NOMINAL"}</p>
                  </div>
                </div>

                {/* Show current pipeline parameters */}
                {pipeline && (
                  <div className="p-3 bg-slate-950 rounded-lg text-xs font-mono">
                    <p className="text-slate-400 mb-1">Pipeline Parameters:</p>
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                      <div>Duty (UI): {fmt(dutyUI_safe * 100, 1, "0")}%</div>
                      <div>Duty (FR): {fmt(dutyEffectiveFR_safe * 100, 3, "0.0025")}%</div>
                      <div>
                        Sectors: {fint(totalSectors, "0")} ({fint(concurrentSectors, "0")} live)
                      </div>
                      <div>Q-Spoil: {fmt(qSpoilUI, 3, "1.000")}</div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted">
                            γ<sub>VdB</sub>:{" "}
                            {fexp(
                              (pipelineState as any)?.gammaVanDenBroeck_vis ??
                                pipeline?.gammaVanDenBroeck_vis ??
                                (pipelineState as any)?.gammaVanDenBroeck ??
                                pipeline?.gammaVanDenBroeck,
                              1,
                              "1.00e+11"
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <div className="space-y-1">
                            <div className="font-semibold">
                              γ<sub>VdB</sub> (Van den Broeck pocket amplification)
                            </div>
                            <p>
                              From Alcubierre's metric modified by Van den Broeck — the "folded pocket" lets a meter-scale cabin sit
                              inside a kilometer-scale effective bubble without paying the bubble's full energy cost.
                            </p>
                            <p className="opacity-80">
                              This is a geometry selection, not an operational setting. It doesn't vary with duty cycle or strobing
                              sectors.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="modulation" className="text-slate-200">
                      Modulation Frequency
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm">
                        <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                        <p className="mb-2">
                          The fundamental frequency at which Casimir tiles oscillate. Higher frequencies increase power output but
                          require more precise timing control.
                        </p>
                        <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                        <p className="text-xs italic">Resonance is not about power—it's about timing.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="modulation"
                      type="number"
                      value={modulationFrequency}
                      onChange={(e) => setModulationFrequency(Number(e.target.value))}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                    <span className="flex items-center text-sm text-slate-400">GHz</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600"
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      const command = `Simulate a full pulse cycle at ${modulationFrequency} GHz`;
                      const userMessage: ChatMessage = {
                        role: "user",
                        content: command,
                        timestamp: new Date(),
                      };
                      setChatMessages((prev) => [...prev, userMessage]);

                      if (commandAbortRef.current) {
                        commandAbortRef.current.abort();
                      }
                      commandAbortRef.current = new AbortController();

                      const response = await apiRequest(
                        "POST",
                        "/api/helix/command",
                        {
                          messages: chatMessages.concat({ role: "user", content: command }),
                        },
                        commandAbortRef.current.signal
                      );

                      const responseData = await response.json();
                      const assistantMessage: ChatMessage = {
                        role: "assistant",
                        content: responseData.message.content,
                        timestamp: new Date(),
                      };

                      if (responseData.functionResult) {
                        assistantMessage.functionCall = {
                          name: responseData.message.function_call.name,
                          result: responseData.functionResult,
                        };
                        setMainframeLog((prev) => [...prev, `[PULSE] ${responseData.functionResult.log || "Cycle complete"}`].slice(-200));
                        refetchMetrics();
                      }

                      setChatMessages((prev) => [...prev, assistantMessage]);
                    } catch (error) {
                      toast({
                        title: "Pulse Sequence Error",
                        description: error instanceof Error ? error.message : "Failed to execute",
                        variant: "destructive",
                      });
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                >
                  Execute Pulse Sequence
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ====== SECONDARY GRID (rest of the panels) ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left column: Compliance, Amplification, Shift Vector */}
            <div className="space-y-4">
              {/* Metric Compliance HUD */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-green-400" />
                    {MAINFRAME_ZONES.COMPLIANCE_HUD}
                  </CardTitle>
                  <CardDescription>GR condition monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                      <span className="text-sm">Ford-Roman Inequality</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">ζ = {fmt(pipelineState?.zeta ?? systemMetrics?.fordRoman?.value, 3, "0.032")}</span>
                        <Badge
                          className={`${
                            pipelineState?.fordRomanCompliance ?? (systemMetrics?.fordRoman?.status === "PASS")
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {pipelineState?.fordRomanCompliance ?? (systemMetrics?.fordRoman?.status === "PASS") ? "PASS" : "FAIL"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                      <span className="text-sm">Natário Zero-Expansion</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">∇·ξ = {fmt(systemMetrics?.natario?.value, 3, "0")}</span>
                        <Badge
                          className={`${
                            pipelineState?.natarioConstraint ?? (systemMetrics?.natario?.status === "VALID")
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {pipelineState?.natarioConstraint ?? (systemMetrics?.natario?.status === "VALID") ? "VALID" : "INVALID"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                      <span className="text-sm">Curvature Threshold</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          R {"<"}{" "}
                          {(() => {
                            const R_est = isFiniteNumber(pipelineState?.U_cycle)
                              ? Math.abs(pipelineState.U_cycle) / 9e16
                              : systemMetrics?.curvatureMax;
                            return fexp(R_est, 0, "1e-21");
                          })()}
                        </span>
                        <Badge className={`${pipelineState?.curvatureLimit ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {pipelineState?.curvatureLimit ? "SAFE" : "WARN"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                      <span className="text-sm">Time-Scale Separation</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">TS = {fmt(pipelineState?.TS_ratio ?? systemMetrics?.timeScaleRatio, 1, "5.03e4")}</span>
                        <Badge
                          className={`${
                            (pipelineState?.TS_ratio ?? systemMetrics?.timeScaleRatio ?? 0) > 1
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {(pipelineState?.TS_ratio ?? systemMetrics?.timeScaleRatio ?? 0) > 1 ? "SAFE" : "CHECK"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Show pipeline calculation details */}
                  {pipelineState && (
                    <div className="mt-4 p-3 bg-slate-950 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">Energy Pipeline Values:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                        <div>U_static: {fexp(pipelineState?.U_static, 2, "—")} J</div>
                        <div>U_geo: {fexp(pipelineState?.U_geo, 2, "—")} J</div>
                        <div>U_Q: {fexp(pipelineState?.U_Q, 2, "—")} J</div>
                        <div>U_cycle: {fexp(pipelineState?.U_cycle, 2, "—")} J</div>
                        <div>P_loss: {fmt(pipelineState?.P_loss_raw, 3, "—")} W/tile</div>
                        <div>N_tiles: {fexp(pipelineState?.N_tiles, 2, "—")}</div>
                        <div className="col-span-2 text-yellow-300 border-t border-slate-700 pt-2 mt-1">
                          γ_VdB (visual): {fexp(pipelineState?.gammaVanDenBroeck_vis ?? pipelineState?.gammaVanDenBroeck, 2, "—")} (Van den
                          Broeck)
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Amplification Panel */}
              <AmplificationPanel readOnly />

              {/* Curvature Key */}
              <CurvatureKey />

              {/* Shift Vector • Interior Gravity */}
              <ShiftVectorPanel mode={pipelineState?.currentMode || "hover"} shift={systemMetrics?.shiftVector} />
            </div>

            {/* Middle Column - Casimir Tile Grid & Physics Field */}
            <div className="space-y-4">
              {/* Casimir Tile Grid - Canvas Component */}
              {systemMetrics && (
                <CasimirTileGridPanel
                  metrics={{
                    totalTiles: systemMetrics.totalTiles,
                    sectorStrobing: systemMetrics.sectorStrobing,
                    totalSectors: systemMetrics.totalSectors,
                    tilesPerSector: systemMetrics.tilesPerSector,
                    currentSector: systemMetrics.currentSector,
                    strobeHz: systemMetrics.strobeHz,
                    sectorPeriod_ms: systemMetrics.sectorPeriod_ms,
                    overallStatus: systemMetrics.overallStatus as any,
                  }}
                  width={320}
                  height={170}
                />
              )}

              {/* Physics Field Sampler for Validation */}
              <PhysicsFieldSampler />

              {/* Resonance Scheduler (auto, mode-coupled) */}
              <ResonanceSchedulerTile
                mode={effectiveMode}
                duty={dutyUI_safe}
                sectors={concurrentSectors}
                freqGHz={pipeline?.modulationFreq_GHz ?? 15}
                sectorPeriod_ms={systemMetrics?.sectorPeriod_ms}
                currentSector={systemMetrics?.currentSector}
                hull={hull}
                wallWidth_m={6.0}
              />
            </div>

            {/* Right Column - Terminal & Inspector */}
            <div className="space-y-4">
              {/* Log + Document Terminal */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-orange-400" />
                    {MAINFRAME_ZONES.LOG_TERMINAL}
                  </CardTitle>
                  <CardDescription>Mainframe command interface</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="chat">AI Chat</TabsTrigger>
                      <TabsTrigger value="logs">System Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="space-y-3">
                      <ScrollArea className="h-64 bg-slate-950 rounded-lg p-3" ref={scrollRef}>
                        <div className="space-y-3">
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`space-y-1 ${msg.role === "user" ? "text-right" : ""}`}>
                              <div
                                className={`inline-block max-w-[80%] p-3 rounded-lg text-sm ${
                                  msg.role === "user"
                                    ? "bg-cyan-600/20 text-cyan-100"
                                    : msg.role === "system"
                                    ? "bg-purple-600/20 text-purple-100"
                                    : "bg-slate-800 text-slate-100"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                {msg.functionCall && (
                                  <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
                                    <p className="text-yellow-400">Function: {msg.functionCall.name}</p>
                                    <pre className="mt-1 text-slate-300">{JSON.stringify(msg.functionCall.result, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{msg.timestamp.toLocaleTimeString()}</div>
                            </div>
                          ))}
                          {isProcessing && (
                            <div className="text-center">
                              <Badge variant="outline" className="animate-pulse">
                                <Cpu className="w-3 h-3 mr-1" />
                                Processing...
                              </Badge>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <div className="flex gap-2">
                        <Input
                          value={commandInput}
                          onChange={(e) => setCommandInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendCommand()}
                          placeholder="Ask HELIX-CORE..."
                          className="bg-slate-950 border-slate-700 text-slate-100"
                          disabled={isProcessing}
                        />
                        <Button onClick={sendCommand} disabled={isProcessing || !commandInput.trim()} className="bg-cyan-600 hover:bg-cyan-700">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="logs" className="space-y-3">
                      <ScrollArea className="h-64 bg-slate-950 rounded-lg p-3">
                        <div className="font-mono text-xs space-y-1">
                          {mainframeLog.map((log, i) => (
                            <div
                              key={i}
                              className={
                                log.includes("[FUNCTION]")
                                  ? "text-yellow-400"
                                  : log.includes("[RESULT]")
                                  ? "text-purple-400"
                                  : log.includes("[TILE]")
                                  ? "text-cyan-400"
                                  : log.includes("[DATA]")
                                  ? "text-blue-400"
                                  : log.includes("[LOCK]")
                                  ? "text-rose-400"
                                  : log.includes("[ENGINE]")
                                  ? "text-amber-400"
                                  : "text-green-400"
                              }
                            >
                              {log}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Operations Toolbar (moved here) */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-cyan-400" />
                    Operations Toolbar
                  </CardTitle>
                  <CardDescription>Quick actions: auto-duty sequence, diagnostics sweep, and theory playback.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {/* Auto-Duty Mode */}
                    <Button
                      variant={activeMode === "auto" ? "default" : "outline"}
                      onClick={async () => {
                        setActiveMode("auto");
                        setIsProcessing(true);
                        try {
                          const command = "Execute auto-duty pulse sequence across all 400 sectors";
                          const userMessage: ChatMessage = {
                            role: "user",
                            content: command,
                            timestamp: new Date(),
                          };
                          setChatMessages((prev) => [...prev, userMessage]);

                          if (commandAbortRef.current) {
                            commandAbortRef.current.abort();
                          }
                          commandAbortRef.current = new AbortController();

                          const response = await apiRequest(
                            "POST",
                            "/api/helix/command",
                            {
                              messages: chatMessages.concat({ role: "user", content: command }),
                            },
                            commandAbortRef.current.signal
                          );
                          const responseData = await response.json();

                          const assistantMessage: ChatMessage = {
                            role: "assistant",
                            content: responseData.message.content,
                            timestamp: new Date(),
                          };

                          if (responseData.functionResult) {
                            assistantMessage.functionCall = {
                              name: responseData.message.function_call?.name ?? "auto_duty",
                              result: responseData.functionResult,
                            };
                            setMainframeLog((prev) => [...prev, `[AUTO-DUTY] ${responseData.functionResult.log || "Sequence initiated"}`].slice(-200));
                            refetchMetrics();
                          }

                          setChatMessages((prev) => [...prev, assistantMessage]);
                        } catch (error) {
                          toast({
                            title: "Auto-Duty Error",
                            description: error instanceof Error ? error.message : "Failed to execute",
                            variant: "destructive",
                          });
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="flex items-center gap-2"
                      disabled={isProcessing}
                    >
                      <Brain className="w-4 h-4" />
                      Auto-Duty Mode
                    </Button>

                    {/* Diagnostics Mode */}
                    <Button
                      variant={activeMode === "diagnostics" ? "default" : "outline"}
                      onClick={async () => {
                        setActiveMode("diagnostics");
                        setIsProcessing(true);
                        try {
                          const command = "Run comprehensive diagnostics scan on all tile sectors";
                          const userMessage: ChatMessage = {
                            role: "user",
                            content: command,
                            timestamp: new Date(),
                          };
                          setChatMessages((prev) => [...prev, userMessage]);

                          if (commandAbortRef.current) {
                            commandAbortRef.current.abort();
                          }
                          commandAbortRef.current = new AbortController();

                          const response = await apiRequest(
                            "POST",
                            "/api/helix/command",
                            {
                              messages: chatMessages.concat({ role: "user", content: command }),
                            },
                            commandAbortRef.current.signal
                          );
                          const responseData = await response.json();

                          const assistantMessage: ChatMessage = {
                            role: "assistant",
                            content: responseData.message.content,
                            timestamp: new Date(),
                          };

                          if (responseData.functionResult) {
                            assistantMessage.functionCall = {
                              name: responseData.message.function_call?.name ?? "diagnostics",
                              result: responseData.functionResult,
                            };
                            setMainframeLog((prev) => [...prev, `[DIAGNOSTICS] System Health: ${responseData.functionResult.systemHealth ?? "OK"}`].slice(-200));
                            refetchMetrics();
                          }

                          setChatMessages((prev) => [...prev, assistantMessage]);
                        } catch (error) {
                          toast({
                            title: "Diagnostics Error",
                            description: error instanceof Error ? error.message : "Failed to run scan",
                            variant: "destructive",
                          });
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="flex items-center gap-2"
                      disabled={isProcessing}
                    >
                      <Gauge className="w-4 h-4" />
                      Diagnostics
                    </Button>

                    {/* Theory Playback */}
                    <Button
                      variant={activeMode === "theory" ? "default" : "outline"}
                      onClick={() => {
                        setActiveMode("theory");
                        setMainframeLog((prev) => [...prev, "[THEORY] Loading Needle Hull Mark 1 documentation..."]);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Atom className="w-4 h-4" />
                      Theory Playback
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Mission Fuel / Range Gauge */}
              <FuelGauge
                mode={(pipelineState?.currentMode || "hover").replace(/^./, (c) => c.toUpperCase())}
                powerMW={pipelineState?.P_avg || 83.3}
                zeta={pipelineState?.zeta}
                tsRatio={pipelineState?.TS_ratio || 5.03e4}
                frOk={pipelineState?.fordRomanCompliance || true}
                natarioOk={pipelineState?.natarioConstraint || true}
                curvatureOk={pipelineState?.curvatureLimit || true}
                freqGHz={15.0}
                duty={dutyUI}
                gammaGeo={pipelineState?.gammaGeo || 26}
                qFactor={pipelineState?.qCavity || 1e9}
                pMaxMW={120}
              />

              {/* Trip Player */}
              <TripPlayer
                plan={{ distanceLy: 0.5, cruiseDuty: 0.14, cruiseMode: "Cruise", hoverMode: "Hover", stationKeepHours: 2 }}
                getState={() => ({
                  zeta: pipelineState?.zeta,
                  tsRatio: pipelineState?.TS_ratio || 5.03e4,
                  powerMW: pipelineState?.P_avg || 83.3,
                  freqGHz: 15.0,
                })}
                setMode={(mode) => {
                  if (switchMode) {
                    startTransition(() => {
                      setOptimisticMode(mode as ModeKey);
                      setModeNonce((n) => n + 1);
                      switchMode.mutate(mode as any, {
                        onSuccess: () => {
                          queryClient.invalidateQueries({
                            predicate: (q) =>
                              Array.isArray(q.queryKey) &&
                              (q.queryKey[0] === "/api/helix/pipeline" || q.queryKey[0] === "/api/helix/metrics"),
                          });
                        },
                      });
                    });
                    const whispers = {
                      Hover: "Form first. Speed follows.",
                      Cruise: "Timing matched. Take the interval; apply thrust.",
                      Emergency: "Breathe once. Choose the useful distance.",
                      Standby: "Meet change with correct posture. The rest aligns.",
                    } as const;
                    publish("luma:whisper", { text: (whispers as any)[mode] || "Configuration updated." });
                  }
                }}
                setDuty={(duty) => {
                  console.log("Setting duty:", duty);
                }}
                onTick={(phase, t) => {
                  if (DEV) console.log(`Trip phase: ${phase}, time: ${t}s`);
                }}
              />

              {/* Mission Planner - Galactic Maps */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold">Mission Planner</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                        <p className="mb-2">
                          Interactive navigation system supporting both galactic-scale (parsec) and solar system (AU) mission planning.
                          Routes calculate energy requirements and travel time based on current warp bubble parameters.
                        </p>
                        <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                        <p className="text-xs italic">The path reveals itself to those who take the first step.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select
                      value={mapMode}
                      onValueChange={(v: "galactic" | "solar") => {
                        setMapMode(v);
                        localStorage.setItem("helix-mapMode", v); // Persist preference
                        // Reset route when switching modes
                        if (v === "solar") {
                          setRoute(["EARTH", "SATURN", "SUN"]);
                          publish("luma:whisper", { text: "Solar navigation initialized. Near-space trajectory computed." });
                        } else {
                          setRoute(["SOL", "ORI_OB1", "VEL_OB2", "SOL"]);
                          publish("luma:whisper", { text: "Galactic coordinates engaged. Interstellar passage mapped." });
                        }
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="View" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="galactic">Galactic (pc)</SelectItem>
                        <SelectItem value="solar">Solar (AU)</SelectItem>
                      </SelectContent>
                    </Select>
                    {mapMode === "galactic" && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="deep-zoom-toggle" className="text-xs">
                          High-Res
                        </Label>
                        <Switch
                          id="deep-zoom-toggle"
                          checked={useDeepZoom}
                          onCheckedChange={(checked) => {
                            startTransition(() => {
                              setUseDeepZoom(checked);
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mapMode === "solar" ? (
                    <div className="w-full overflow-hidden rounded-md bg-slate-950 border border-slate-800">
                      <div className="mx-auto max-w-[720px]">
                        <SolarMap
                          key={`solar-${720}x${360}`}
                          width={720}
                          height={360}
                          routeIds={route}
                          fitToIds={["EARTH", "SATURN"]}
                          fitMarginPx={28}
                          centerOnId={undefined}
                          centerBetweenIds={undefined}
                          onPickBody={(id) => {
                            setRoute((r) => (r.length ? [...r.slice(0, -1), id, r[r.length - 1]] : [id]));
                            publish("luma:whisper", { text: "Waypoint selected. Route updated." });
                          }}
                          /* NEW: barycenter wobble background */
                          backgroundPolylineAU={baryPath}
                          backgroundPolylineStyle={{
                            stroke: "rgba(137,180,255,0.25)",
                            width: 1.25,
                            dash: [2, 3],
                            composite: "screen",
                          }}
                          backgroundPolylineGain={50} // ~0.005 AU wobble → ~0.25 AU visual; visible even when zoomed out
                        />
                      </div>
                    </div>
                  ) : !galaxyCalibration ? (
                    <div className="h-40 grid place-items-center text-xs text-slate-400">Loading galactic coordinate system…</div>
                  ) : useDeepZoom ? (
                    <div className="relative">
                      <GalaxyDeepZoom dziUrl="/galaxy_tiles.dzi" width={800} height={400} onViewerReady={setDeepZoomViewer} />
                      {deepZoomViewer && (
                        <GalaxyOverlays
                          viewer={deepZoomViewer}
                          labels={[]}
                          bodies={BODIES}
                          routeIds={route}
                          originPx={galaxyCalibration.originPx}
                          pxPerPc={galaxyCalibration.pxPerPc}
                          onBodyClick={(id) => {
                            setRoute((r) => (r.length ? [...r.slice(0, -1), id, r[r.length - 1]] : [id]));
                            publish("luma:whisper", { text: "Stellar target acquired. Course adjusted." });
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <GalaxyMapPanZoom
                      imageUrl="/galaxymap.png"
                      bodies={BODIES}
                      routeIds={route}
                      onPickBody={(id) => {
                        setRoute((r) => (r.length ? [...r.slice(0, -1), id, r[r.length - 1]] : [id]));
                        publish("luma:whisper", { text: "Galactic destination set. Navigation computed." });
                      }}
                      originPx={{ x: 10123.142, y: 9480.491 }}
                      scalePxPerPc={1.6666667}
                      debug
                      width={800}
                      height={400}
                    />
                  )}

                  {/* Removable route chips */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {route.map((id, idx) => (
                      <span key={`${id}-${idx}`} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-800 text-slate-100 text-xs">
                        {id}
                        <button
                          className="ml-1 rounded px-1 text-slate-300 hover:text-red-300 hover:bg-slate-700"
                          onClick={() => {
                            setRoute((r) => {
                              const copy = r.slice();
                              copy.splice(idx, 1);
                              if (copy.length === 0) return ["SUN"];
                              return copy;
                            });
                            publish("luma:whisper", { text: `Removed waypoint: ${id}` });
                          }}
                          aria-label={`Remove ${id}`}
                          title={`Remove ${id}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {route.length === 0 && <span className="text-xs text-slate-500">No waypoints yet — tap bodies on the map to add them.</span>}
                  </div>

                  <RouteSteps
                    bodies={mapMode === "solar" ? solarBodiesForRoutes : BODIES}
                    plan={{ waypoints: route }}
                    mode={mapMode}
                    perf={
                      {
                        mode: (pipelineState?.currentMode || "hover").replace(/^./, (c) => c.toUpperCase()),
                        powerMW: pipelineState?.P_avg || 83.3,
                        duty: pipelineState?.dutyCycle || 0.14,
                        gammaGeo: pipelineState?.gammaGeo || 26,
                        qFactor: pipelineState?.qCavity || 1e9,
                        zeta: pipelineState?.zeta,
                        tsRatio: pipelineState?.TS_ratio || 5.03e4,
                        freqGHz: 15.0,
                        energyPerLyMWh: (() => {
                          const vLyPerHour = computeEffectiveLyPerHour(
                            pipelineState?.currentMode || "Hover",
                            pipelineState?.dutyCycle || 0.14,
                            pipelineState?.gammaGeo || 26,
                            pipelineState?.qCavity || 1e9,
                            pipelineState?.zeta,
                            pipelineState?.TS_ratio || 5.03e4
                          );
                          const hoursPerLy = vLyPerHour > 0 ? 1 / vLyPerHour : Infinity;
                          return isFinite(hoursPerLy) ? (pipelineState?.P_avg || 83.3) * hoursPerLy : Infinity;
                        })(),
                        energyPerCycleJ: (() => {
                          const cyclesPerSec = 15.0 * 1e9;
                          return cyclesPerSec > 0 ? ((pipelineState?.P_avg || 83.3) * 1e6) / cyclesPerSec : Infinity;
                        })(),
                        vEffLyPerHour: (mode, duty) =>
                          computeEffectiveLyPerHour(
                            mode,
                            duty,
                            pipelineState?.gammaGeo || 26,
                            pipelineState?.qCavity || 1e9,
                            pipelineState?.zeta,
                            pipelineState?.TS_ratio || 5.03e4
                          ),
                      } as HelixPerf
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ====== CASIMIR AMPLIFIER: Complete Physics Pipeline Visualization ====== */}
          <div className="mt-8">
            <HelixCasimirAmplifier
              readOnly
              metricsEndpoint="/api/helix/metrics"
              stateEndpoint="/api/helix/pipeline"
              fieldEndpoint="/api/helix/displacement"
              modeEndpoint="/api/helix/mode"
              lightCrossing={lc}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
