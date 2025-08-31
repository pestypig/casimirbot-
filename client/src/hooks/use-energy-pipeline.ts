// Hook for accessing the centralized HELIX-CORE energy pipeline
import { startTransition } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { publish } from "@/lib/luma-bus";
import { getModeWisdom } from "@/lib/luma-whispers";

// Greens function types
export type GreensKind = "poisson" | "helmholtz";
export type GreensSource = "server" | "client" | "none";

export interface GreensPayload {
  kind: GreensKind;
  m: number;                 // mass parameter for Helmholtz (0 ⇒ Poisson limit)
  normalize: boolean;
  phi: Float32Array;         // normalized or raw potential samples (per-tile order)
  size: number;              // phi.length
  source: GreensSource;      // who computed it
}

export interface EnergyPipelineState {
  // Input parameters
  tileArea_cm2: number;
  shipRadius_m: number;
  gap_nm: number;
  sag_nm?: number;
  temperature_K: number;
  modulationFreq_GHz: number;
  
  // Mode parameters
  currentMode: 'hover' | 'cruise' | 'emergency' | 'standby';
  dutyCycle: number;
  sectorStrobing: number;
  qSpoilingFactor: number;
  
  // Additional mode knobs (explicit to drive FR duty & timing)
  localBurstFrac?: number;     // sector-local burst fraction (0..1); defaults to dutyCycle
  sectorsTotal?: number;       // total sectors in sweep
  sectorsConcurrent?: number;  // how many sectors fire simultaneously

  // Light-crossing & cycle timing (server may emit, else client derives)
  tau_LC_ms?: number;          // light-crossing time across hull/bubble (ms)
  sectorPeriod_ms?: number;    // dwell period per sector (ms)
  burst_ms?: number;           // instantaneous burst window (ms)
  dwell_ms?: number;           // gap between bursts (ms)
  
  // Scheduling truth
  sectorCount?: number;
  concurrentSectors?: number;
  sectorsTotal?: number;
  sectorsConcurrent?: number;
  
  // FR duty direct
  dutyEffectiveFR?: number;
  
  // Physics parameters
  gammaGeo: number;
  qMechanical: number;
  qCavity: number;
  gammaVanDenBroeck: number;
  exoticMassTarget_kg: number;
  
  // Visual vs mass split (server emits both)
  gammaVanDenBroeck_vis?: number;
  gammaVanDenBroeck_mass?: number;
  
  // Optional: targets if you want to show them
  P_target_W?: number;
  
  // Calculated values
  U_static: number;
  U_geo: number;
  U_Q: number;
  U_cycle: number;
  P_loss_raw: number;
  P_avg: number;
  M_exotic: number;
  M_exotic_raw: number;     // Raw physics exotic mass (before calibration)
  massCalibration: number;  // Mass calibration factor
  TS_ratio: number;
  zeta: number;
  N_tiles: number;
  
  // System status
  fordRomanCompliance: boolean;
  natarioConstraint: boolean;
  curvatureLimit: boolean;
  overallStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

// Server emits per-tile stress–energy samples for φ = G · ρ
export type TileDatum = {
  pos: [number, number, number];
  t00: number;
};

// Chat message interface for HELIX-CORE
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// System metrics interface (add tile arrays for φ compute back-compat)
export interface SystemMetrics {
  totalTiles: number;
  activeTiles: number;
  currentMode?: string;
  tileData?: TileDatum[]; // current server shape
  tiles?: TileDatum[];    // legacy shape
  // Optional LC/timing structure from backend metrics, if available
  lightCrossing?: {
    tauLC_ms?: number;        // preferred
    tau_ms?: number;          // alias
    tauLC_s?: number;         // alt units
    sectorPeriod_ms?: number; // dwell per sector
    burst_ms?: number;
    dwell_ms?: number;
    sectorsTotal?: number;
    activeSectors?: number;
  };
}

// Helix metrics interface (some callers read directly from here)
export interface HelixMetrics {
  totalTiles: number;
  activeTiles: number;
  data?: any;
  tileData?: TileDatum[];
  tiles?: TileDatum[];
  lightCrossing?: SystemMetrics['lightCrossing'];
}

// Shared physics constants from pipeline backend
export const PIPE_CONST = {
  TOTAL_SECTORS: 400,
  BURST_DUTY_LOCAL: 0.01,  // 1% local burst window
  Q_BURST: 1e9
};

// Shared smart formatter (W→kW→MW) for UI labels
export const fmtPowerUnitFromW = (watts?: number) => {
  const x = Number(watts);
  if (!Number.isFinite(x)) return '—';
  if (x >= 1e6) return `${(x/1e6).toFixed(1)} MW`;
  if (x >= 1e3) return `${(x/1e3).toFixed(1)} kW`;
  return `${x.toFixed(1)} W`;
};

// Optional: inline compute helper (Poisson kernel) for emergency fallback
const poissonKernel = (r: number) => 1/(4*Math.PI*Math.max(r,1e-6));

/**
 * Publish Greens payload to the canonical cache key and broadcast the window event.
 * Call this from the Energy Pipeline page after compute, or from a worker/other panel.
 */
export function publishGreens(payload: GreensPayload) {
  queryClient.setQueryData(["helix:pipeline:greens"], payload);
  try { window.dispatchEvent(new CustomEvent("helix:greens", { detail: payload })); } catch {}
}

/**
 * Subscribe to Greens payload no matter who publishes it.
 * - Reads from React-Query cache key ["helix:pipeline:greens"]
 * - Listens to `helix:greens` window events
 * Returns latest payload (or undefined if none yet).
 */
export function useGreens() {
  const [greens, setGreens] = React.useState<GreensPayload | undefined>(() =>
    queryClient.getQueryData(["helix:pipeline:greens"]) as GreensPayload | undefined
  );

  // react-query cache poll (cheap; avoids event-order races)
  React.useEffect(() => {
    let raf = 0, lastSig = "";
    const tick = () => {
      const cached = queryClient.getQueryData(["helix:pipeline:greens"]) as GreensPayload | undefined;
      const sig = cached ? `${cached.kind}|${cached.size}|${cached.source}` : "";
      if (sig && sig !== lastSig) {
        lastSig = sig;
        setGreens(cached);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // window event listener
  React.useEffect(() => {
    const onGreens = (e: any) => {
      const payload = e?.detail as GreensPayload | undefined;
      if (payload?.phi && payload.size > 0) setGreens(payload);
    };
    window.addEventListener("helix:greens" as any, onGreens as any);
    return () => window.removeEventListener("helix:greens" as any, onGreens as any);
  }, []);

  return greens;
}

/**
 * Optional emergency helper:
 * Build a Poisson φ on the client if you just have tiles but no publisher mounted.
 * (You can keep this or omit it if the Energy Pipeline page will always publish.)
 */
export function buildGreensFromTiles(
  tiles?: { pos: [number,number,number]; t00: number }[],
  normalize = true
): GreensPayload | undefined {
  if (!Array.isArray(tiles) || tiles.length === 0) return undefined;
  const N = tiles.length;
  const phi = new Float32Array(N);
  for (let i=0;i<N;i++){
    let s=0; const [xi,yi,zi] = tiles[i].pos;
    for (let j=0;j<N;j++){
      const [xj,yj,zj] = tiles[j].pos;
      const r = Math.hypot(xi-xj, yi-yj, zi-zj) + 1e-6;
      s += poissonKernel(r) * tiles[j].t00;
    }
    phi[i] = s;
  }
  if (normalize) {
    let min=Infinity, max=-Infinity;
    for (let i=0;i<N;i++){ const v=phi[i]; if(v<min)min=v; if(v>max)max=v; }
    const span = (max-min) || 1;
    for (let i=0;i<N;i++) phi[i] = (phi[i]-min)/span;
  }
  return { kind:"poisson", m:0, normalize, phi, size:N, source:"client" };
}

// Hook to get current pipeline state
export function useEnergyPipeline(options?: {
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: ['/api/helix/pipeline'],
    queryFn: async () =>
      (await apiRequest('GET', '/api/helix/pipeline')).json(),
    refetchInterval: options?.refetchInterval ?? 1000, // Refresh every second
    staleTime: options?.staleTime,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
    suspense: false,
  });
}

// Hook to update pipeline parameters
export function useUpdatePipeline() {
  return useMutation({
    mutationFn: async (params: Partial<EnergyPipelineState>) => {
      const response = await apiRequest('POST', '/api/helix/pipeline/update', params);
      return response.json();
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ predicate: q =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === '/api/helix/pipeline' || q.queryKey[0] === '/api/helix/metrics')
        });
      });
    }
  });
}

// Hook to switch operational mode
export function useSwitchMode() {
  return useMutation({
    mutationFn: async (mode: EnergyPipelineState['currentMode']) => {
      // 1) switch server mode
      const resMode = await apiRequest('POST', '/api/helix/pipeline/mode', { mode });
      const data = await resMode.json();

      // 2) immediately push mode-specific knobs so duty/strobing/qSpoil are in sync
      const cfg = MODE_CONFIGS[mode];
      if (cfg) {
        await apiRequest('POST', '/api/helix/pipeline/update', {
          dutyCycle: cfg.dutyCycle,
          sectorStrobing: cfg.sectorStrobing,
          qSpoilingFactor: cfg.qSpoilingFactor,
          sectorsConcurrent: (cfg as any).sectorsConcurrent ?? (cfg as any).concurrentSectors,
          localBurstFrac: (cfg as any).localBurstFrac ?? cfg.dutyCycle,
          sectorsTotal: (cfg as any).sectorsTotal,
        });
      }
      publish("warp:reload", { reason: "mode-switch-local", mode, ts: Date.now() });
      return data;
    },
    onSuccess: (data, mode) => {
      startTransition(() => {
        queryClient.invalidateQueries({ predicate: q =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === '/api/helix/pipeline' || q.queryKey[0] === '/api/helix/metrics')
        });
      });
      
      // Let visualizers/inspectors hard-refresh
      publish("helix:pipeline:updated", { mode });
      
      // Trigger Luma whisper for mode changes
      const wisdom = getModeWisdom(mode);
      publish("luma:whisper", { text: wisdom });
    }
  });
}

// --- Types
export type ModeKey = "standby" | "hover" | "cruise" | "emergency";

export type ModeConfig = {
  name: string;
  color: string;
  description?: string;

  // UI duty knob (not FR-averaged)
  dutyCycle: number;

  // 🔁 NEW: how many sectors exist vs. are live at once
  sectorsTotal: number;        // e.g., 400 (grid partitions across the hull)
  sectorsConcurrent: number;   // e.g., 1 in Hover/Cruise, maybe 4–8 in Emergency

  // 🔦 NEW: per-sector ON window (fraction of dwell, 0..1)
  localBurstFrac: number;      // e.g., 0.01 in Hover/Cruise; 0.50 in Emergency; 0 in Standby

  // 🎯 Optional: what the mode is aiming to produce (display only)
  powerTarget_W?: number;

  // 🧹 Legacy back-compat (many places still reference this)
  // Keep it equal to sectorsConcurrent so older code "just works".
  sectorStrobing?: number;

  // Legacy fields for backward compatibility
  qSpoilingFactor?: number;
};

// Mode configurations for UI display (synchronized with backend)
export const MODE_CONFIGS: Record<ModeKey, ModeConfig> = {
  standby: {
    name: "Standby",
    color: "text-slate-300",
    description: "Field idle / safed",
    dutyCycle: 0.0,
    sectorsTotal: 400,
    sectorsConcurrent: 1,        // harmless placeholder; FR duty will be 0 because burst=0
    localBurstFrac: 0.0,         // no RF
    powerTarget_W: 0,
    sectorStrobing: 1,
    qSpoilingFactor: 0.1,
  },
  hover: {
    name: "Hover",
    color: "text-sky-300",
    description: "Gentle bulge / training profile",
    dutyCycle: 0.14,
    sectorsTotal: 400,
    sectorsConcurrent: 1,        // one live sector at a time (classic sweep)
    localBurstFrac: 0.01,        // 1% local ON inside dwell
    powerTarget_W: 83.3e6,       // match your display target
    sectorStrobing: 1,
    qSpoilingFactor: 1,
  },
  cruise: {
    name: "Cruise",
    color: "text-cyan-300",
    description: "Coherent 400× sweep; FR duty mostly from averaging",
    dutyCycle: 0.005,
    sectorsTotal: 400,
    sectorsConcurrent: 1,        // keep 1 unless you want faster pass speed
    localBurstFrac: 0.01,        // keep 1% local ON; FR change comes from S_live/S_total
    powerTarget_W: 40e6,
    sectorStrobing: 1,
    qSpoilingFactor: 0.625,
  },
  emergency: {
    name: "Emergency",
    color: "text-rose-300",
    description: "Max response window; fewer averages",
    dutyCycle: 0.50,
    sectorsTotal: 400,
    sectorsConcurrent: 8,        // widen the live window (try 4, 8, or 16)
    localBurstFrac: 0.50,        // big local ON fraction
    powerTarget_W: 120e6,
    sectorStrobing: 8,
    qSpoilingFactor: 1,
  },
};

// Optional: helper if other components want to apply mode knobs explicitly
export const modeKnobsFor = (mode: EnergyPipelineState['currentMode']) => {
  const m = MODE_CONFIGS[mode];
  return m ? {
    dutyCycle: m.dutyCycle,
    sectorStrobing: m.sectorStrobing,
    qSpoilingFactor: m.qSpoilingFactor,
  } : undefined;
};