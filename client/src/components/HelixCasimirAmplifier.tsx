import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Activity,
  Zap,
  Sigma,
  Atom,
  Gauge,
  RadioReceiver,
  Thermometer,
  CircuitBoard,
  ScanSearch,
  ShieldCheck,
  FileDown,
  Play,
  Table,
} from "lucide-react";
import { toHUDModel, si, zetaStatusColor } from "@/lib/hud-adapter";
import CavitySideView from "./CavitySideView"; // legacy single canvas view
import CavityFrameView from "./CavityFrameView"; // frame-of-view cavity visualization
import ResultViewer from "./ResultViewer";
import InfoDot from "./InfoDot";
import StatusBanner from "./StatusBanner";
import { usePollingSmart } from "@/lib/usePollingSmart";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useDriveSyncStore } from "@/store/useDriveSyncStore";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { downloadCSV } from "@/utils/csv";
import { apiRequest } from "@/lib/queryClient";
import VacuumGapHeatmap from "./VacuumGapHeatmap";
import SweepReplayControls from "./SweepReplayControls";
import VacuumGapSweepHUD from "@/components/VacuumGapSweepHUD";
import VacuumContractBadge from "@/components/VacuumContractBadge";
import { useVacuumContract } from "@/hooks/useVacuumContract";
import type { VacuumGapSweepRow, DynamicConfig, RidgePreset, SweepRuntime } from "@shared/schema";

const HEATMAP_MAX_ROWS = 1500;

// Helper functions
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

// Exponential ON/OFF envelope for visuals (independent of U integration)
function useDriveEnvelope({ on, tauRise_s, tauFall_s }: {
  on: boolean; tauRise_s: number; tauFall_s: number;
}) {
  const [env, setEnv] = useState(0);
  const last = useRef<number | null>(null);
  useEffect(() => {
    let raf: number;
    const step = (t: number) => {
      const now = t / 1000;
      const prev = last.current ?? now;
      const dt = Math.min(0.05, Math.max(0, now - prev));
      last.current = now;

      const tau = on ? tauRise_s : tauFall_s;
      const target = on ? 1 : 0;
  const tauNum = Number(tau);
  const k = dt / (Number.isFinite(tauNum) && tauNum > 0 ? tauNum : 1e-6);
      setEnv(e => e + (target - e) * (1 - Math.exp(-k)));

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, tauRise_s, tauFall_s]);
  return env; // 0..1
}

/**
 * HelixCasimirAmplifier.tsx
 *
 * A physics-first visualizer for the Needle Hull energy pipeline showing how the Casimir effect
 * is amplified in the cavity chain. It pulls true values from HELIX-CORE endpoints and renders:
 *  - Cavity equation card (E/A = -π² ħc / (720 a³))
 *  - Amplification Ladder (power chain): U_static → γ_geo → q_mech → duty (d_eff)
 *  - Mass Ladder (mass chain): |U_static| → γ_geo^3 → Q_BURST → γ_VdB → duty (d_eff) → M_total
 *  - Live displacement field heatmap from /api/helix/displacement
 *  - Mode switcher (hover / cruise / emergency / standby)
 *  - GR compliance chips (Ford–Roman ζ, time-scale TS, Natário)
 *
 * Assumed routes (adjust if your server mounts differently):
 *  - GET    /api/helix/metrics         -> getHelixMetrics
 *  - GET    /api/helix/state           -> getPipelineState
 *  - GET    /api/helix/displacement    -> getDisplacementField
 *  - POST   /api/helix/mode            -> switchOperationalMode { mode }
 */

// ------------------------- Types from your backend -------------------------

// Optional typing for WarpEngine integration
declare global {
  interface Window {
    setStrobingState?: (args: { sectorCount: number; currentSector: number; split?: number }) => void;
  }
}

type LightCrossing = {
  sectorIdx: number; 
  sectorCount: number; 
  phase: number;
  dwell_ms: number; 
  tauLC_ms: number; 
  burst_ms: number;
  duty: number; 
  freqGHz: number; 
  onWindow: boolean;
  cyclesPerBurst: number;
  onWindowDisplay: boolean;
};

type EnergyPipelineState = {
  // inputs / config
  tileArea_cm2: number;
  gap_nm: number;
  sag_nm: number;
  temperature_K: number;
  modulationFreq_GHz: number;
  dutyCycle: number;
  sectorStrobing: number;
  qSpoilingFactor: number;
  gammaGeo: number;
  qMechanical: number;
  qCavity: number;
  gammaVanDenBroeck: number;
  exoticMassTarget_kg: number;
  N_tiles: number;
  modelMode?: "calibrated" | "raw";
  dynamicConfig?: DynamicConfig | null;
  vacuumGapSweepResults?: VacuumGapSweepRow[];

  // calculated (authoritative)
  U_static: number;
  U_geo: number;
  U_Q: number;
  U_cycle: number;
  P_loss_raw: number; // per tile during ON [W]
  P_avg: number;      // ship average [MW]
  M_exotic: number;   // mass [kg]
  M_exotic_raw: number;
  dutyBurst?: number; // local burst duty (0.01)
  dutyEffective_FR?: number; // effective duty used for FR sampling

  hull?: { Lx_m: number; Ly_m: number; Lz_m: number };
};

type HelixMetrics = {
  energyOutput: number;     // MW
  exoticMass: number;       // kg
  exoticMassRaw: number;    // kg
  totalTiles: number;
  tilesPerSector: number;
  totalSectors: number;
  activeSectors: number;
  activeFraction: number;
  // Optional helpers used by the UI; may be missing on some endpoints
  activeTiles?: number;
  lightCrossing?: Partial<LightCrossing>;
  gammaVanDenBroeck: number;
  gammaGeo: number;
  qCavity: number;
  dutyGlobal: number;
  dutyInstant: number;
  dutyEffectiveFR: number;  // authoritative d_eff
  fordRoman: { value: number; limit: number; status: "PASS" | "FAIL" };
  natario:    { value: number; status: "VALID" | "WARN" };
  curvatureMax: number;
  timeScaleRatio: number;
  modelMode?: "calibrated" | "raw";
};

// --------------------------- Constants (UI only) ---------------------------
import { HBAR, C, PI } from '@/lib/physics-const';

const HBAR_C = HBAR * C; // ħc J·m for Casimir calculations
const KB = 1.380_649e-23; // J/K (Boltzmann)
const H  = 6.626_070_15e-34; // J·s (Planck)
// Q_BURST removed - using cavity Q directly in physics calculations

// ---------------------------- Helper utilities ----------------------------

function sci(n: number | undefined | null, digits = 3) {
  if (n == null || !isFinite(n)) return "—";
  const e = n === 0 ? 0 : Math.floor(Math.log10(Math.abs(n)));
  const m = n / Math.pow(10, e);
  return `${m.toFixed(digits)}e${e}`;
}

function fmtNum(n: number | undefined | null, unit = "", digits = 3) {
  if (n == null || !isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs === 0) return `0${unit ? " " + unit : ""}`;
  if (abs >= 1e6 || abs <= 1e-3) return `${sci(n, digits)}${unit ? " " + unit : ""}`;
  return `${n.toFixed(digits)}${unit ? " " + unit : ""}`;
}

function fmtExp(n: number | undefined | null, digits = 3) {
  return Number.isFinite(n as number) ? (n as number).toExponential(digits) : "—";
}

function fmtFixed(n: number | undefined | null, digits = 2) {
  return Number.isFinite(n as number) ? (n as number).toFixed(digits) : "—";
}

// ------------------------- Heatmap (displacement) -------------------------

type FieldResponse = {
  count: number;
  data: FieldSampleBuffer;
  physics: { gammaGeo: number; qSpoiling: number; sectorStrobing: number };
};

type FieldSampleBuffer = {
  length: number;
  x: number[];
  y: number[];
  z: number[];
  nx: number[];
  ny: number[];
  nz: number[];
  rho: number[];
  bell: number[];
  sgn: number[];
  disp: number[];
  dA: number[];
};

function DisplacementHeatmap({ endpoint, metrics, state }: { 
  endpoint: string;
  metrics?: HelixMetrics;
  state?: EnergyPipelineState;
}) {
  const [params, setParams] = useState({ nTheta: 128, nPhi: 64, sectors: 400, split: 200 });
  const [data, setData] = useState<FieldResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Observe visibility of the card
  const cardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!cardRef.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e.isIntersecting), { threshold: 0.1 });
    io.observe(cardRef.current);
    return () => io.disconnect();
  }, []);

  // Update params when sectors/split change
  useEffect(() => {
    const sectors = metrics?.totalSectors 
                 ?? state?.sectorStrobing
                 ?? 400;
    const split = Math.round(sectors * 0.5);

    setParams(prevParams => ({
      ...prevParams,
      sectors,
      split
    }));
  }, [metrics?.totalSectors, state?.sectorStrobing]);

  // Debounced fetch on param change & when visible
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let started = false;

    if (!visible) {
      // Nothing to do when hidden; still return a safe cleanup.
      return () => {
        if (timer) clearTimeout(timer);
        if (!controller.signal.aborted) {
          controller.abort(new DOMException('hidden/cleanup', 'AbortError'));
        }
      };
    }

    timer = setTimeout(async () => {
      started = true;
      try {
        const q = new URLSearchParams({
          nTheta: String(params.nTheta),
          nPhi: String(params.nPhi),
          sectors: String(params.sectors),
          split: String(params.split)
        }).toString();
        const res = await fetch(`${endpoint}?${q}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        setData(json);
        setErr(null);
      } catch (err: any) {
        // Swallow effect teardown aborts
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        // surface real errors
        setErr(err?.message ?? "fetch failed");
      }
    }, 300);

    return () => {
      if (timer) clearTimeout(timer);
      // Only abort if we actually kicked off the request
      if (started && !controller.signal.aborted) {
        controller.abort(new DOMException('effect cleanup', 'AbortError'));
      }
    };
  }, [endpoint, params, visible]);

  // Optional: light keep-alive every ~45s while visible
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setParams(p => ({ ...p })); // retrigger effect w/ same params
    }, 45000);
    return () => clearInterval(id);
  }, [visible]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const cvs = canvasRef.current;
    const W = cvs.width;
    const H = cvs.height;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    // draw background
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, W, H);

    // data is in scanline order: theta-major then phi.
    const nTh = params.nTheta;
    const nPh = params.nPhi;
    const cellW = W / nTh;
    const cellH = H / nPh;

    const buffer = data.data;
    const dispBuffer = buffer?.disp;
    if (!dispBuffer || typeof (dispBuffer as { length?: number }).length !== "number") {
      console.warn("HelixCasimirAmplifier: displacement buffer missing or invalid", data);
      return;
    }
    const sampleCount =
      typeof buffer.length === "number"
        ? Math.min(buffer.length, dispBuffer.length)
        : dispBuffer.length;
    if (sampleCount <= 0) return;

    // Compute min/max of disp for scaling
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < sampleCount; i++) {
      const value = dispBuffer[i];
      if (!Number.isFinite(value)) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }
    if (min === Infinity || max === -Infinity) {
      min = -1;
      max = 1;
    }
    const span = Math.max(1e-12, max - min);

    function colormap(v: number) {
      // v in [min,max] → 0..1
      const t = (v - min) / span;
      // blue → black → red diverging
      const r = t;
      const b = 1 - t;
      const g = 0.08 + 0.2 * (1 - Math.abs(t - 0.5) * 2);
      return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }

    // Paint
    let idx = 0;
    for (let i = 0; i < nTh; i++) {
      for (let j = 0; j < nPh; j++) {
        const disp = idx < sampleCount ? dispBuffer[idx] : 0;
        idx += 1;
        ctx.fillStyle = colormap(disp);
        ctx.fillRect(i * cellW, (nPh - 1 - j) * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }

    // sector split line
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    const splitX = (params.split / params.sectors) * W;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, H);
    ctx.stroke();
  }, [data, params]);

  return (
    <Card ref={cardRef} className="bg-slate-900/40 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-slate-100"><ScanSearch className="w-5 h-5"/> Displacement Field (Natário bell)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {err && (
          <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-800">
            Error: {err}
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <Label htmlFor="th">θ samples</Label>
            <Input id="th" type="number" min={32} max={512} value={params.nTheta}
              onChange={e=>setParams(p=>({...p, nTheta: Number(e.target.value)||128}))}/>
          </div>
          <div>
            <Label htmlFor="ph">φ samples</Label>
            <Input id="ph" type="number" min={16} max={256} value={params.nPhi}
              onChange={e=>setParams(p=>({...p, nPhi: Number(e.target.value)||64}))}/>
          </div>
          <div>
            <Label htmlFor="sec">Sectors</Label>
            <Input id="sec" type="number" min={1} max={400} value={params.sectors}
              onChange={e=>setParams(p=>({...p, sectors: Math.max(1,Math.min(400, Number(e.target.value)||400))}))}/>
          </div>
          <div>
            <Label htmlFor="split">Split</Label>
            <Input id="split" type="number" min={1} max={params.sectors-1} value={params.split}
              onChange={e=>setParams(p=>({...p, split: Math.max(1, Math.min(p.sectors-1, Number(e.target.value)||200))}))}/>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden ring-1 ring-slate-800 shadow-inner">
          <canvas ref={canvasRef} width={960} height={360} className="w-full h-[240px]"/>
        </div>
        <p className="text-xs text-slate-400">
          Heatmap shows signed displacement amplitude on the ellipsoidal shell; white line marks the +/− sector split. Colormap is blue (−) → red (+).
          {!visible && <span className="text-yellow-400 ml-2">(Paused - not visible)</span>}
        </p>
      </CardContent>
    </Card>
  );
}

// -------------------------- Amplification ladders -------------------------

type LadderDatum = { stage: string; value: number };

function LadderChart({ title, unit, data }: { title: React.ReactNode; unit: string; data: LadderDatum[] }) {
  return (
    <Card className="bg-slate-900/40 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-slate-100"><Atom className="w-5 h-5"/> {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="stage" tick={{ fill: "#94a3b8" }} interval={0} angle={-15} textAnchor="end" height={50}/>
              <YAxis tick={{ fill: "#94a3b8" }} tickFormatter={(v)=>fmtNum(v, "", 2)} domain={[0, "auto"]}/>
              <Tooltip formatter={(v:number)=>fmtNum(v, unit)} contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }}/>
              <Bar dataKey="value" fill="#60a5fa" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced EquationChip: backward compatible (eq) OR structured (label/value/tooltip)
type EquationChipProps = (
  | { eq: string; label?: undefined; value?: undefined; tooltip?: string }
  | { eq?: undefined; label: string; value: any; tooltip?: string }
);
function EquationChip(props: EquationChipProps) {
  if ('eq' in props && props.eq) {
    return <code title={props.tooltip} className="px-2 py-1 rounded-md bg-slate-800/70 text-slate-200 text-xs font-mono border border-slate-700">{props.eq}</code>;
  }
  const { label, value, tooltip } = props as any;
  const val = (value === null || value === undefined || (typeof value === 'number' && !isFinite(value))) ? '—' : (typeof value === 'number' ? (Math.abs(value) >= 1e4 || Math.abs(value) < 1e-2 ? value.toExponential(2) : value.toString()) : String(value));
  return (
    <div title={tooltip} className="flex flex-col items-start px-2 py-1 rounded-md bg-slate-800/60 text-[10px] leading-tight font-mono border border-slate-700 min-w-[64px]">
      <span className="text-[9px] uppercase tracking-wide opacity-60">{label}</span>
      <span className="text-slate-200">{val}</span>
    </div>
  );
}

// ------------------------------- Checkpoint UI -----------------------------

type CheckRow = {
  label: string;
  state: "ok" | "warn" | "fail";
  detail?: string;
};

function rowStyle(state: CheckRow["state"]) {
  if (state === "ok") return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
  if (state === "warn") return "text-amber-300 bg-amber-500/10 border-amber-500/30";
  return "text-rose-300 bg-rose-500/10 border-rose-500/30";
}

function CheckpointCard({ title, rows, equations }: {
  title: string;
  rows: CheckRow[];
  equations?: React.ReactNode;
}) {
  return (
    <Card className="bg-slate-900/60 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <ShieldCheck className="w-5 h-5"/>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid md:grid-cols-2 gap-2">
          {rows.map((r, i) => (
            <div key={i} className={`px-3 py-2 rounded-lg border ${rowStyle(r.state)} flex items-center justify-between`}>
              <span className="text-xs md:text-sm">{r.label}</span>
              <span className="text-[11px] opacity-90">{r.detail || (r.state === "ok" ? "OK" : r.state === "warn" ? "Check" : "Fail")}</span>
            </div>
          ))}
        </div>
        {equations && (
          <details className="mt-2">
            <summary className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer">equations & filled values</summary>
            <div className="mt-2 text-[11px] leading-5 text-slate-300 space-y-2">{equations}</div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// ------------------------------- Main UI ----------------------------------

export default function HelixCasimirAmplifier({
  metricsEndpoint = "/api/helix/metrics",
  stateEndpoint = "/api/helix/state",
  fieldEndpoint = "/api/helix/displacement",
  modeEndpoint = "/api/helix/mode",
  lightCrossing,
  cohesive = true,
  readOnly = false
}: {
  metricsEndpoint?: string;
  stateEndpoint?: string;
  fieldEndpoint?: string;
  modeEndpoint?: string;
  lightCrossing?: LightCrossing;
  cohesive?: boolean; // new flag to toggle unified layout
  readOnly?: boolean;
}) {
  const ds = useDriveSyncStore();
  const { data: metrics } = usePollingSmart<HelixMetrics>(metricsEndpoint, {
    minMs: 10000, maxMs: 30000, dedupeKey: "helix:metrics"
  });

  const { data: state } = usePollingSmart<EnergyPipelineState>(stateEndpoint, {
    minMs: 10000, maxMs: 30000, dedupeKey: "helix:state"
  });
  const {
    data: pipelineSnapshot,
    sweepResults,
    sweepResultsTotal,
    sweepResultsDropped,
    sweepResultsLimit,
    sweepResultsOverLimit,
    publishSweepControls,
  } = useEnergyPipeline({
    refetchInterval: 1000,
    refetchOnWindowFocus: false,
    staleTime: 1000,
  });
  const sweepRuntime = (pipelineSnapshot as any)?.sweep as SweepRuntime | undefined;
  const sweepActive = !!sweepRuntime?.active;
  const sweepCancelRequested = !!sweepRuntime?.cancelRequested;
  const vacuumContract = useVacuumContract({
    id: "helix-casimir",
    label: "Helix Casimir Vacuum",
  });

  // Use HUD adapter for drift-proof field access (cast to any for flexible server shapes)
  const _metricsAny: any = metrics;
  const _stateAny: any = state;
  const [selectedSweepRow, setSelectedSweepRow] = useState<VacuumGapSweepRow | null>(null);
  const [topN, setTopN] = useState(8);
  const ridgePresets = ds.ridgePresets ?? [];
  const sweepRowsVisible = sweepResults.length;
  const sweepRowsTotal =
    typeof sweepResultsTotal === "number" ? sweepResultsTotal : sweepRowsVisible;
  const sweepRowsDroppedComputed =
    typeof sweepResultsDropped === "number"
      ? Math.max(0, sweepResultsDropped)
      : Math.max(0, sweepRowsTotal - sweepRowsVisible);
  const sweepRowLimit =
    typeof sweepResultsLimit === "number" ? sweepResultsLimit : undefined;
  const sweepGuardActive =
    !!sweepResultsOverLimit ||
    sweepRowsDroppedComputed > 0 ||
    (sweepRowLimit != null &&
      sweepRowsTotal > sweepRowsVisible &&
      sweepRowsVisible >= sweepRowLimit);
  const heatmapGuard = useMemo(() => {
    if (sweepResults.length === 0) {
      return { rows: sweepResults, downsampled: false };
    }
    const unique: VacuumGapSweepRow[] = [];
    const seen = new Set<string>();
    for (let idx = sweepResults.length - 1; idx >= 0; idx--) {
      const row = sweepResults[idx];
      const key = `${row.d_nm}|${row.Omega_GHz}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(row);
    }
    unique.reverse();
    if (unique.length <= HEATMAP_MAX_ROWS) {
      return {
        rows: unique,
        downsampled: unique.length < sweepResults.length,
      };
    }
    const stride = Math.ceil(unique.length / HEATMAP_MAX_ROWS);
    const sampled: VacuumGapSweepRow[] = [];
    for (let idx = 0; idx < unique.length; idx += stride) {
      sampled.push(unique[idx]);
    }
    const finalRow = unique[unique.length - 1];
    if (finalRow && sampled[sampled.length - 1] !== finalRow) {
      sampled.push(finalRow);
    }
    return { rows: sampled, downsampled: true };
  }, [sweepResults]);
  const heatmapRows = heatmapGuard.rows;
  const heatmapDownsampled = heatmapGuard.downsampled;
  const formatCount = (value: number) => value.toLocaleString(undefined);
  const guardSummary = sweepGuardActive
    ? `Guard: last ${formatCount(sweepRowsVisible)} / ${formatCount(sweepRowsTotal)}${
        sweepRowLimit ? ` (cap ${formatCount(sweepRowLimit)})` : ""
      }`
    : undefined;
  const downsampleSummary = heatmapDownsampled
    ? `Heatmap sampled to ${formatCount(heatmapRows.length)} unique points`
    : undefined;
  const replayRows = sweepGuardActive ? heatmapRows : sweepResults;
  const sweepRowsDropped = sweepRowsDroppedComputed;
  const displayedSweepRows = useMemo(() => sweepResults.slice(0, 200), [sweepResults]);
  const bestPerGap = useMemo(() => {
    const map = new Map<number, VacuumGapSweepRow>();
    for (const row of sweepResults) {
      const prev = map.get(row.d_nm);
      if (!prev || row.G > prev.G) map.set(row.d_nm, row);
    }
    return Array.from(map.values()).sort((a, b) => a.d_nm - b.d_nm);
  }, [sweepResults]);
  const topByGain = useMemo(() => {
    if (!sweepResults.length) return [];
    return [...sweepResults]
      .sort((a, b) => b.G - a.G)
      .slice(0, Math.max(1, topN));
  }, [sweepResults, topN]);

  useEffect(() => {
    if (!sweepResults.length) {
      setSelectedSweepRow(null);
      return;
    }
    if (!selectedSweepRow) {
      setSelectedSweepRow(sweepResults[0]);
      return;
    }
    const stillPresent = sweepResults.find(
      (row) =>
        row.d_nm === selectedSweepRow.d_nm &&
        row.m === selectedSweepRow.m &&
        row.Omega_GHz === selectedSweepRow.Omega_GHz &&
        row.phi_deg === selectedSweepRow.phi_deg,
    );
    if (!stillPresent) {
      setSelectedSweepRow(sweepResults[0]);
    }
  }, [sweepResults, selectedSweepRow]);

  const handleCaptureRidge = React.useCallback(() => {
    if (!sweepResults.length) {
      ds.setRidgePresets([]);
      return;
    }
    const base = bestPerGap.length ? bestPerGap : topByGain;
    const chosen = base.slice(0, Math.max(1, topN));
    const presets: RidgePreset[] = chosen.map((row) => {
      const qlLabel = Number.isFinite(row.QL) ? row.QL!.toExponential(2) : "—";
      return {
        d_nm: row.d_nm,
        Omega_GHz: row.Omega_GHz,
        phi_deg: row.phi_deg,
        m_pct: row.m * 100,
        note: `G=${row.G.toFixed(2)} dB, QL=${qlLabel}`,
      };
    });
    ds.setRidgePresets(presets);
  }, [bestPerGap, topByGain, topN, sweepResults, ds]);

  const handleExportCSV = React.useCallback(() => {
    downloadCSV(sweepResults);
  }, [sweepResults]);

  const handleHeatmapCellClick = React.useCallback(
    (cell: { d_nm: number; Omega_GHz: number }) => {
      const row = sweepResults
        .filter((r) => r.d_nm === cell.d_nm && r.Omega_GHz === cell.Omega_GHz)
        .sort((a, b) => b.G - a.G)[0];
      if (row) setSelectedSweepRow(row);
    },
    [sweepResults],
  );

  const handleReplayStep = React.useCallback((row: VacuumGapSweepRow) => {
    setSelectedSweepRow(row);
  }, []);

  const handleHardwareSlew = React.useCallback(() => {
    const payload = { sweep: { activeSlew: true } } as Partial<DynamicConfig>;
    publishSweepControls(payload);
  }, [publishSweepControls]);
  const handleCancelSlew = React.useCallback(async () => {
    try {
      await apiRequest("POST", "/api/helix/pipeline/cancel-sweep", {});
    } catch (err) {
      console.error("[AMPLIFIER] Failed to cancel sweep:", err);
    }
  }, []);
  const wu  = _metricsAny?.warpUniforms ?? _stateAny?.warpUniforms ?? null;
  const hud = toHUDModel({
    warpUniforms: wu || {},
    viewerHints: _metricsAny?.viewerHints || {},
    lightCrossing: _metricsAny?.lightCrossing || {},
    // keep any *explicit* HUD inputs you need; do NOT spread raw metrics
  } as any);

  // ✅ Unified light-crossing packet for gating/labels
  const lc = useMemo(
    () => metrics?.lightCrossing ?? lightCrossing,
    [metrics?.lightCrossing, lightCrossing]
  );

  // Time-evolving cavity energy system using shared light-crossing loop
  const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

  // Prefer state → metrics → default
  const qCav =
    Number.isFinite(state?.qCavity) ? Number(state!.qCavity) :
    Number.isFinite(metrics?.qCavity) ? Number(metrics!.qCavity) :
    1e9;

  // SAFE frequency selection - positive-only guard
  const fGHz_state = Number(state?.modulationFreq_GHz);
  const fGHz =
    Number.isFinite(fGHz_state) && fGHz_state > 0
      ? fGHz_state
      : (lc && Number.isFinite((lc as any).freqGHz) && (lc as any).freqGHz > 0
          ? (lc as any).freqGHz
          : 15);

  const f = fGHz * 1e9;
  const omega = 2 * Math.PI * f;
  const tauQ_s = qCav / (2 * Math.PI * f); // cavity time constant: τ = Q/(2πf)

  // ---- DISPLAY gating consistency fix ----
  const MIN_CYCLES_PER_BURST = 10;
  const isBurstMeaningful = lc && Number.isFinite((lc as any).cyclesPerBurst) ? ((lc as any).cyclesPerBurst >= MIN_CYCLES_PER_BURST) : false;

  // Use display gating consistently
  const onDisplay = !!(lc && (lc as any).onWindowDisplay);
  const gateOn = onDisplay && isBurstMeaningful;

  // effective duty for ship-averaged quantities:
  // prefer authoritative metrics.dutyEffectiveFR, else derive from loop
  const d_eff = (() => {
    const fromMetrics = metrics?.dutyEffectiveFR;
    if (Number.isFinite(fromMetrics)) return Math.max(0, Math.min(1, Number(fromMetrics)));
    if (lc && Number.isFinite((lc as any).dwell_ms) && Number.isFinite((lc as any).burst_ms) && (lc as any).dwell_ms > 0) {
      const val = (lc as any).burst_ms / (lc as any).dwell_ms;
      return Math.max(0, Math.min(1, val));
    }
    return state?.dutyCycle ?? metrics?.dutyGlobal ?? 0; // last resort
  })();

  const derived = useMemo(() => {
    if (!state || !metrics) {
      console.debug("[HelixCasimirAmplifier] Missing state or metrics", { state: !!state, metrics: !!metrics });
      return null;
    }

    // inputs
    const U_static = state.U_static;                 // J per tile (signed)

    // Debug: log all input values
    console.debug("[HelixCasimirAmplifier] Input values:", {
      U_static: state.U_static,
      gammaGeo: state.gammaGeo,
      qMechanical: state.qMechanical,
      N_tiles: state.N_tiles,
      qCavity: state.qCavity,
      omega,
      qCav,
      gateOn
    });
    const gammaGeo = hud.gammaGeo || state.gammaGeo || 26; // fallback to pipeline or default
    // HUD → state → safe fallback (avoid silent zeros)
    const qMech = (
      Number.isFinite((hud as any)?.qMech) && (hud as any).qMech! > 0 ? (hud as any).qMech :
      Number.isFinite(state?.qMechanical)   && state!.qMechanical!   > 0 ? state!.qMechanical :
      1
    ) as number;
    // Use the unified robust N resolution logic (computed later) by peeking at immediate sources.
    // We cannot reference outer N_tiles variable here (declared below), so replicate minimal logic
    // but WITHOUT returning 0 if a later fallback would produce >0. We'll post-patch below to override with sticky.
    let N_tiles_internal = hud.tilesTotal ?? state.N_tiles ?? metrics?.totalTiles ?? 0;
    if ((!Number.isFinite(N_tiles_internal) || N_tiles_internal === 0) && Number.isFinite(metrics?.activeTiles) && Number.isFinite(metrics?.activeFraction) && metrics!.activeFraction! > 0) {
      const est = Math.round(metrics!.activeTiles! / metrics!.activeFraction!);
      if (est > 0) N_tiles_internal = est;
    }

    // Prefer mass-calibrated γ_VdB when available (used only in mass chain)
    const gammaVdB =
      (hud as any)?.gammaVdB_mass ??
      (state as any)?.gammaVanDenBroeck_mass ??
      (metrics as any)?.gammaVanDenBroeck_mass ??
      hud.gammaVdB ??
      (state as any)?.gammaVanDenBroeck ??
      (metrics as any)?.gammaVanDenBroeck ??
      1;

    // power chain (per tile → ship)
    const U_geo     = U_static * gammaGeo;             // backend uses γ^1 for power
    const U_Q       = U_geo * qMech;                   // per-tile stored energy proxy during ON
    const P_tile_on = (omega * Math.abs(U_Q)) / qCav;  // physics
    const P_tile_instant_W = gateOn ? P_tile_on : 0;   // display-gated
    const P_ship_avg_calc_MW = (P_tile_on * N_tiles_internal * d_eff) / 1e6; // ship-avg with effective duty
    const P_ship_avg_report_MW = hud.powerMW;          // authoritative calibration (if provided)

    // Debug: badge ON but 0 W
    if (gateOn && (!Number.isFinite(P_tile_on) || P_tile_on === 0)) {
      // eslint-disable-next-line no-console
      console.debug("Zero-W instant power debug", {
        U_static, gammaGeo, qMech, omega, qCav, gateOn, onDisplay: gateOn
      });
    }

    // mass chain (no Q in energy; Q is for power)
    const geo3        = Math.pow(gammaGeo, 3);
    const E_tile_geo3 = Math.abs(U_static) * geo3;             // step: ×γ_geo^3
    const E_tile_VdB  = E_tile_geo3 * gammaVdB;                // step: ×γ_VdB
    const E_tile_mass = E_tile_VdB * d_eff;                    // step: ×d_eff (averaging)
    const M_tile      = E_tile_mass / (C * C);                 // kg per tile
    const M_total_calc   = M_tile * N_tiles_internal;
    const M_total_report = hud.exoticMassKg;

    // Debug: log all derived calculations (after all variables are calculated)
    if (Math.random() < 0.1) { // Log 10% of the time for debugging
      console.debug("[HelixCasimirAmplifier] Fixed derived calculations:", {
        U_geo: U_geo,
        U_Q: U_Q,
        P_tile_on: P_tile_on,
        P_ship_avg_calc_MW: P_ship_avg_calc_MW,
        M_total_calc: M_total_calc,
        d_eff: d_eff,
        N_tiles_internal: N_tiles_internal
      });
    }

    // casimir foundation (unchanged)
    const gap_m       = Math.max(1e-12, (state.gap_nm ?? 16) * 1e-9);
    const tileA_m2    = (state.tileArea_cm2 ?? 25) * 1e-4;
    const casimir_theory   = -(PI * PI / 720) * HBAR_C / Math.pow(gap_m, 4);
    const casimir_per_tile = casimir_theory * tileA_m2 * gap_m;

    // ── Add cohesive pipeline augmentations ─────────────────────────────
    const tauLC_ms = (metrics as any)?.lightCrossing?.tauLC_ms ?? (lc as any)?.tauLC_ms;
    const burst_ms = (metrics as any)?.lightCrossing?.burst_ms ?? (lc as any)?.burst_ms;
    const dwell_ms = (metrics as any)?.lightCrossing?.dwell_ms ?? (lc as any)?.dwell_ms;
    const T_mod_ms = (f > 0) ? (1000 / f) : undefined;
    const R1 = (T_mod_ms !== undefined && tauLC_ms) ? (T_mod_ms / tauLC_ms) : undefined; // modulation vs LC
    // Curvature response time τ_curv_ms sources (backend → radius → geometry → wall)
  const tauCurvBackend = (state as any)?.tauCurv_ms as number | undefined;
    const R_curv_backend_m = (state as any)?.curvatureRadius_m as number | undefined;
    // Geometry estimate from diaphragm aperture (µm) and sag (nm)
  const D_geom_um = (state as any)?.pocketDiameter_um ?? 2000; // match visual default for geometry estimate
    const h_nm = (state as any)?.sag_nm ?? 2.9;
  const D_m = D_geom_um * 1e-6;
    const h_m = h_nm * 1e-9;
    const R_geom_m = h_m > 0 ? (((D_m / 2) ** 2 + h_m ** 2) / (2 * h_m)) : undefined;
    const natarioWall_m = (state as any)?.natarioWall_m as number | undefined;
    const hullL_m = (metrics as any)?.hull?.Lz_m as number | undefined;
    const tauCurv_ms = (
      tauCurvBackend ??
      (R_curv_backend_m ? (R_curv_backend_m / C) * 1e3 : undefined) ??
      (hullL_m ? (hullL_m / C) * 1e3 : undefined) ??
      (R_geom_m ? (R_geom_m / C) * 1e3 : undefined) ??
      (natarioWall_m ? (natarioWall_m / C) * 1e3 : undefined)
    );
    // Symmetric scale separation (always <= 1): smaller is better
    const R2 = (tauLC_ms && tauCurv_ms) ? (Math.min(tauLC_ms, tauCurv_ms) / Math.max(tauLC_ms, tauCurv_ms)) : undefined;
    const reciprocity = (() => {
      if (burst_ms == null || tauLC_ms == null) return { status: 'UNKNOWN' as const };
      if (burst_ms >= tauLC_ms) return { status: 'PASS_AVG' as const };
      return { status: 'BROKEN_INSTANT' as const };
    })();
  // Materials window helpers (derive Rs from geometry factor G if missing)
    const G_geom_Ohm = (state as any)?.geometryFactor_Ohm ?? 100;
    const Rs_nOhm = (state as any)?.surfaceResistance_nOhm ?? (qCav ? (G_geom_Ohm / qCav) * 1e9 : undefined);
    // Dynamic Casimir stroke & modulation index (fitted from specs/phase)
    // Phase targets and caps (override via backend fields if present)
    const mechCap_pm = (state as any)?.mechanicalStrokeLimit_pm ?? 50; // pm
    const MOD_OK = (state as any)?.modThreshold_ok ?? 0.10;   // green target δa/a
    const MOD_WARN = (state as any)?.modThreshold_warn ?? 0.30; // amber threshold
    const opPhase: "hover"|"cruise"|"emergency"|"standby" = ((state as any)?.mode ?? (state as any)?.phase ?? 'cruise');
    const phaseTargets = {
      hover:     (state as any)?.phaseTargetModIndex?.hover     ?? 0.05,
      cruise:    (state as any)?.phaseTargetModIndex?.cruise    ?? 0.02,
      emergency: (state as any)?.phaseTargetModIndex?.emergency ?? 0.10,
      standby:   (state as any)?.phaseTargetModIndex?.standby   ?? 0.00,
    } as const;
    const targetModIndex_phase = phaseTargets[opPhase];
    // respect q_mech efficiency: don't target beyond effectively deliverable
    const q_mech_eff = (state as any)?.qMechanical ?? (state as any)?.q_mech ?? qMech ?? 1;
    const targetModIndex_eff = Math.min(targetModIndex_phase, MOD_WARN, Math.max(0, Number(q_mech_eff) || 0));
    // Cap stroke by mech limit and effective phase target (in pm)
    const gap_pm = gap_m * 1e12;
    const strokeTarget_pm = targetModIndex_eff * gap_pm;
    const strokeCap_pm = Math.min(mechCap_pm, strokeTarget_pm);
    // Accept operator inputs but fit to cap/target if excessive
    const stroke_pm_in = (state as any)?.stroke_pm
      ?? (state as any)?.strokeAmplitude_pm
      ?? (state as any)?.strokeAmplitudePm as number | undefined;
    const modIndex_in = (state as any)?.modIndex
      ?? (state as any)?.deltaA_over_a
      ?? (state as any)?.deltaAOverA as number | undefined;
    const stroke_pm_req = Number.isFinite(stroke_pm_in)
      ? Number(stroke_pm_in)
      : (Number.isFinite(modIndex_in) ? Number(modIndex_in) * gap_pm : undefined);
    const stroke_pm_fitted = (stroke_pm_req == null)
      ? strokeCap_pm
      : Math.min(stroke_pm_req, strokeCap_pm);
    const dceOverdriveRaw = stroke_pm_req != null && stroke_pm_req > strokeCap_pm;
    const deltaA_m = stroke_pm_fitted * 1e-12;
    const modIndex_val = deltaA_m / gap_m; // δa/a after fit
    const stroke_pm = stroke_pm_fitted;    // pm after fit
    const suggestedStroke_pm = Math.min(mechCap_pm, gap_pm * MOD_OK);
    const materials = {
      Rs_nOhm,
      stroke_pm,
      Q_cav: qCav,
      f_mod_Hz: f,
    };

  // ───────────────── Experiment-readiness derived values ─────────────────
  // Aperture geometry (bench) — default to 40 µm if not provided, mark as estimate
  const D_um_raw = (state as any)?.pocketDiameter_um;
  const D_um = Number.isFinite(D_um_raw) ? Number(D_um_raw) : 40; // µm (est default)
  const A_ap_m2 = Math.PI * Math.pow((D_um*1e-6)/2, 2);
  const A_ap_is_est = !Number.isFinite(D_um_raw);
  const A_tile_m2 = tileA_m2;
  const A_ratio = (A_ap_m2 && A_tile_m2) ? (A_ap_m2 / A_tile_m2) : undefined;

  // Temperature & thermal occupancy at f
  // Use a superconducting operating point for Nb3Sn: clamp to ≤ 4.2 K for the card.
  const T_raw_K = Number.isFinite(state.temperature_K) ? Number(state.temperature_K) : NaN;
  const T_K = Number.isFinite(T_raw_K) ? Math.min(T_raw_K, 4.2) : 4.2;
  const hf_J  = H * f;
  const hf_over_kT = (T_K > 0) ? (hf_J / (KB * T_K)) : undefined;
  const n_th = (hf_over_kT && isFinite(hf_over_kT)) ? (1 / (Math.exp(hf_over_kT) - 1)) : undefined;

  // Environment defaults (so the card never blanks)
  const vacuum_Pa_raw = (state as any)?.vacuum_Pa;
  const shield_dB_raw = (state as any)?.magShield_dB;
  const vacuum_Pa = Number.isFinite(vacuum_Pa_raw) ? vacuum_Pa_raw : 1e-7; // Pa (default)
  const shield_dB = Number.isFinite(shield_dB_raw) ? shield_dB_raw : 80;   // dB (default)
  const envUsedDefaults = !Number.isFinite(vacuum_Pa_raw) && !Number.isFinite(shield_dB_raw);
  const envNeedsConfig = false; // show defaults instead of "configure"

  // Coupling: resolve any two of Q0, Qext, QL; otherwise estimate Q0≈G/Rs and back-solve Qext
  const Q_ext_in_raw = (state as any)?.qExternal ?? (metrics as any)?.qExternal;
  const Q_ext_in = Number.isFinite(Q_ext_in_raw) ? Number(Q_ext_in_raw) : qCav; // default to critical coupling if missing
    const Q_L_in   = qCav; // current displayed cavity Q is treated as loaded Q_L
    let Q0_resolved: number | undefined;
    let Qext_resolved: number | undefined;
    let QL_resolved: number | undefined;
    let Q0_is_est = false;
    let Qext_is_est = false;
    if (Number.isFinite(Q_L_in) && Number.isFinite(Q_ext_in)) {
      QL_resolved = Number(Q_L_in);
      Qext_resolved = Number(Q_ext_in);
      const invQ0 = (1/QL_resolved) - (1/Qext_resolved);
      Q0_resolved = invQ0 > 0 ? 1/invQ0 : undefined;
    } else if (Number.isFinite((state as any)?.qIntrinsic)) {
      Q0_resolved = Number((state as any).qIntrinsic);
      if (Number.isFinite(Q_L_in)) {
        QL_resolved = Number(Q_L_in);
        const invQext = (1/QL_resolved) - (1/Q0_resolved);
        Qext_resolved = invQext > 0 ? 1/invQext : undefined;
      }
    } else {
      if (Number.isFinite(Q_L_in)) QL_resolved = Number(Q_L_in);
      if (Number.isFinite(Q_ext_in)) Qext_resolved = Number(Q_ext_in);
      // If Q0 still unknown, estimate from geometry factor and Rs: Q0 ≈ G/Rs
      if (!Number.isFinite(Q0_resolved) && Number.isFinite(Rs_nOhm)) {
        const Rs_Ohm = (Rs_nOhm as number) * 1e-9;
        if (Rs_Ohm > 0 && Number.isFinite(G_geom_Ohm)) {
          Q0_resolved = (G_geom_Ohm as number) / Rs_Ohm; // estimate
          Q0_is_est = true;
        }
      }
      // If we now have QL and Q0, back-solve Qext
      if (Number.isFinite(QL_resolved) && Number.isFinite(Q0_resolved) && !Number.isFinite(Qext_resolved)) {
        const invQext = (1/QL_resolved!) - (1/Q0_resolved!);
        if (invQext > 0) {
          Qext_resolved = 1/invQext;
          Qext_is_est = true;
        } else {
          Qext_resolved = Infinity; // critical coupling limit
          Qext_is_est = true;
        }
      }
    }
    let beta: number | undefined;
    if (Number.isFinite(Q0_resolved) && Number.isFinite(Qext_resolved)) {
      beta = (Q0_resolved as number) / (Qext_resolved as number);
    } else if (Number.isFinite(QL_resolved) && Number.isFinite(Qext_resolved)) {
      const denom = (Qext_resolved as number) - (QL_resolved as number);
      // Guard: when Qext ≈ QL, treat as critical (β≈1) instead of ∞
      const rel = Math.abs(denom) / Math.max(1, Math.abs(Qext_resolved as number));
      if (rel < 1e-6) {
        beta = 1;
      } else {
        beta = (QL_resolved as number) / denom;
      }
    } else if (Qext_resolved === Infinity) {
      beta = 0; // ideal under-coupled limit
    }
    const couplingRegime = (beta == null) ? "—" : (beta < 1 ? "under" : beta > 1 ? "over" : "critical");

    // Drive limits vs gap fraction
    const mechCap_pm2 = mechCap_pm;
    const modTarget_ok = (state as any)?.modThreshold_ok ?? 0.10;
    const target_pm = Math.min(mechCap_pm2, modTarget_ok * (gap_m * 1e12));
    const driveOk = (Number.isFinite(stroke_pm) && Number.isFinite(target_pm)) ? (stroke_pm! <= target_pm + 1e-9) : undefined;
    const V_rms = (state as any)?.piezo_Vrms_max;
    const I_rms = (state as any)?.piezo_Irms_max;

  // τ_curv: lock to geometry by default so Timing pill is self-consistent locally
  const D_um_geo = (state as any)?.pocketDiameter_um ?? 2000;
  // Use 2.9 nm by default for τ_curv geometry so R ≈ 173 m when D = 2000 µm,
  // regardless of upstream sag; this keeps the timing pill anchored to the target
  const h_nm_geo = 2.9;
  const D_m_geo  = D_um_geo * 1e-6;
  const h_m_geo  = h_nm_geo * 1e-9;
  const R_geom_local_m = h_m_geo > 0 ? (((D_m_geo/2)**2 + h_m_geo**2) / (2*h_m_geo)) : undefined;
  const tauCurv_ms_out = R_geom_local_m ? (R_geom_local_m / C) * 1e3 : tauCurv_ms;
  // Always compute from the tau we intend to display to avoid mismatches
  const L_curv_m = (tauCurv_ms_out != null && isFinite(tauCurv_ms_out) && tauCurv_ms_out > 0)
    ? (C * (tauCurv_ms_out/1000))
    : undefined;
  const tauCurvSource = "geometry";
  // Targets and helpers for operator guidance
  const curvRadiusTarget_m = Number.isFinite((state as any)?.curvRadiusTarget_m)
    ? Number((state as any).curvRadiusTarget_m)
    : 173;
  // Given D and target R, exact spherical-cap sag: h = R - sqrt(R^2 - (D/2)^2)
  let h_target_nm_for_D: number | undefined = undefined;
  if (Number.isFinite(curvRadiusTarget_m) && Number.isFinite(D_um_geo)) {
    const Rtar = curvRadiusTarget_m as number;
    const a = (D_um_geo as number) * 1e-6 / 2;
    if (Rtar > 0 && Rtar*Rtar > a*a) {
      const h_m_t = Rtar - Math.sqrt(Rtar*Rtar - a*a);
      if (h_m_t > 0) h_target_nm_for_D = h_m_t * 1e9;
    }
  }
  // Given h and target R, required D: D = 2*sqrt(2Rh - h^2)
  let D_target_um_for_h: number | undefined = undefined;
  if (Number.isFinite(curvRadiusTarget_m) && Number.isFinite(h_m_geo)) {
    const Rtar = curvRadiusTarget_m as number;
    const h = h_m_geo as number;
    const val = 2*Rtar*h - h*h;
    if (Rtar > 0 && val > 0) {
      const a_t = Math.sqrt(val);
      D_target_um_for_h = 2 * a_t * 1e6;
    }
  }
  // Locally consistent R1/R2 using the displayed times
  const R1_local = (T_mod_ms != null && tauLC_ms != null && tauLC_ms > 0) ? (T_mod_ms / tauLC_ms) : undefined;
  const R2_local = (tauLC_ms != null && tauCurv_ms_out != null && tauCurv_ms_out > 0) ? (tauLC_ms / tauCurv_ms_out) : undefined;

    return {
  U_static, gammaGeo, qMech, d_eff, N_tiles_internal, omega, qCav, gammaVdB,
      U_geo, U_Q,
      P_tile_on, P_tile_instant_W, P_ship_avg_calc_MW, P_ship_avg_report_MW,
      geo3, E_tile_geo3, E_tile_VdB, E_tile_mass, M_tile, M_total_calc, M_total_report,
      gap_m, tileA_m2, casimir_theory, casimir_per_tile,
      isBurstMeaningful,
  // cohesive additions
  tauLC_ms, burst_ms, dwell_ms, T_mod_ms, R1, R2, reciprocity, materials, tauCurv_ms: tauCurv_ms_out,
      // extras for UI pills
      G_geom_Ohm,
      // DCE (fitted)
      stroke_pm,
      modIndex: modIndex_val,
      MOD_OK, MOD_WARN, mechCap_pm, suggestedStroke_pm,
      dceOverdriveRaw,
      targetModIndex_phase, targetModIndex_eff,
      // experiment readiness block
      A_ap_m2, A_tile_m2, A_ratio,
      T_K, hf_over_kT, n_th,
      vacuum_Pa, shield_dB, envUsedDefaults,
      Q0_resolved, Qext_resolved, QL_resolved, beta, couplingRegime, Q0_is_est, Qext_is_est,
      target_pm, driveOk, V_rms, I_rms,
  L_curv_m, tauCurvSource,
      R1_local, R2_local,
      // expose geometry used for τ_curv and targets for UI transparency
      geomD_um: D_um_geo,
      geomSag_nm: h_nm_geo,
      tauCurvGeom_D_um: D_um_geo,
      tauCurvGeom_sag_nm: h_nm_geo,
      curvRadiusTarget_m, h_target_nm_for_D, D_target_um_for_h,
      A_ap_is_est, envNeedsConfig, D_um
    };
    // include lc-derived values in the deps so gating/duty react to the loop
  }, [state, metrics, omega, qCav, gateOn, d_eff]);

  const ampBaseCandidate = useMemo(() => {
    const candidates = [
      derived?.U_static,
      (state as any)?.U_static,
      (metrics as any)?.U_static,
    ];
    for (const value of candidates) {
      if (Number.isFinite(value)) {
        return Math.abs(value as number);
      }
    }
    return 0;
  }, [derived?.U_static, (state as any)?.U_static, (metrics as any)?.U_static]);

  useEffect(() => {
    if (!Number.isFinite(ampBaseCandidate)) return;
    if (Math.abs((ds.ampBase ?? 0) - ampBaseCandidate) < 1e-9) return;
    if (typeof ds.setAmpBase === "function") {
      ds.setAmpBase(ampBaseCandidate);
    }
  }, [ampBaseCandidate, ds]);

  // Robust N_tiles accessible throughout component with multiple fallbacks
  const provenance: Record<string, any> = {};
  // Sticky last-known-good tile count so transient zeros (init race) don't collapse KPIs
  const lastNRef = useRef<number>(0);
  const N_tiles = (() => {
    if (Number.isFinite(hud.tilesTotal) && hud.tilesTotal! > 0) { provenance.N_tiles_source = 'hud.tilesTotal'; return hud.tilesTotal!; }
    if (Number.isFinite(state?.N_tiles) && state!.N_tiles! > 0) { provenance.N_tiles_source = 'state.N_tiles'; return state!.N_tiles!; }
    if (Number.isFinite(metrics?.totalTiles) && metrics!.totalTiles! > 0) { provenance.N_tiles_source = 'metrics.totalTiles'; return metrics!.totalTiles!; }
    if (Number.isFinite(metrics?.activeTiles) && Number.isFinite(metrics?.activeFraction) && metrics!.activeFraction! > 0) {
      const total = Math.round(metrics!.activeTiles! / metrics!.activeFraction!);
      if (total > 0) { provenance.N_tiles_source = 'metrics.activeTiles/activeFraction'; return total; }
    }
    const sectors = metrics?.totalSectors ?? state?.sectorStrobing;
    if (sectors && sectors > 0) {
      const tilesPerSector = Math.floor(sectors / 4);
      if (tilesPerSector > 0) { provenance.N_tiles_source = 'sectors heuristic'; return sectors * tilesPerSector; }
    }
    provenance.N_tiles_source = 'fallback:0';
    return 0;
  })();
  if (N_tiles > 0) lastNRef.current = N_tiles;
  const N_tiles_sticky = N_tiles === 0 ? lastNRef.current : N_tiles;

  // Post-derive sync: if derived exists and its internal N differs from sticky resolved N, patch it for UI consistency
  useEffect(() => {
    if (derived && Number.isFinite(N_tiles_sticky) && N_tiles_sticky > 0 && (derived as any).N_tiles_internal !== N_tiles_sticky) {
      (derived as any).N_tiles_internal = N_tiles_sticky;
    }
  }, [derived, N_tiles_sticky]);

  // Capture other parameter provenance
  provenance.gammaVdB_source = (() => {
    // Mass-specific sources first
    if (Number.isFinite((hud as any)?.gammaVdB_mass)) return 'hud.gammaVdB_mass';
    if (Number.isFinite((state as any)?.gammaVanDenBroeck_mass)) return 'state.gammaVanDenBroeck_mass';
    if (Number.isFinite((metrics as any)?.gammaVanDenBroeck_mass)) return 'metrics.gammaVanDenBroeck_mass';
    // Visual/legacy fallbacks
    if (Number.isFinite(hud.gammaVdB)) return 'hud.gammaVdB';
    if (Number.isFinite((state as any)?.gammaVanDenBroeck)) return 'state.gammaVanDenBroeck';
    if (Number.isFinite((metrics as any)?.gammaVanDenBroeck)) return 'metrics.gammaVanDenBroeck';
    return 'default(1 or 0)';
  })();
  provenance.qCav_source = (() => {
    if (Number.isFinite(state?.qCavity)) return 'state.qCavity';
    if (Number.isFinite(metrics?.qCavity)) return 'metrics.qCavity';
    return 'default(1e9)';
  })();
  provenance.d_eff_source = (() => {
    if (Number.isFinite(metrics?.dutyEffectiveFR)) return 'metrics.dutyEffectiveFR';
    if (lc && Number.isFinite((lc as any)?.burst_ms) && Number.isFinite((lc as any)?.dwell_ms)) return 'lc.burst_ms/dwell_ms';
    if (Number.isFinite(state?.dutyCycle)) return 'state.dutyCycle';
    if (Number.isFinite(metrics?.dutyGlobal)) return 'metrics.dutyGlobal';
    return 'fallback(0)';
  })();
  // Refinement B: duty decomposition for baseline classification
  provenance.dutyDecomp = (() => {
    const localBurst = (state as any)?.dutyBurst ?? 0.01; // baseline 1% ON window
    const totalSectors = (state as any)?.sectorCount ?? (metrics as any)?.totalSectors ?? 400;
    const baseline = localBurst / Math.max(1, totalSectors);
    return { localBurst, totalSectors, baseline };
  })();
  provenance.R1_inputs = (() => {
    const tauLC_ms = (metrics as any)?.lightCrossing?.tauLC_ms ?? (lc as any)?.tauLC_ms;
    return { tauLC_source: (metrics as any)?.lightCrossing?.tauLC_ms ? 'metrics.lightCrossing' : ((lc as any)?.tauLC_ms ? 'lc' : 'missing'), fGHz_source: Number.isFinite(Number(state?.modulationFreq_GHz)) ? 'state.modulationFreq_GHz' : ( (lc as any)?.freqGHz ? 'lc.freqGHz' : 'fallback(15GHz)') };
  })();
  provenance.R2_inputs = (() => {
    return { tauCurv_present: Boolean((state as any)?.tauCurv_ms), natarioWall_used: Boolean((state as any)?.natarioWall_m) };
  })();
  if (Math.random() < 0.05) {
    // eslint-disable-next-line no-console
    console.debug('[HelixCasimirAmplifier provenance]', provenance);
  }

  // Robust power badge with multiple fallbacks
  const P_MW_badge = (() => {
    const sources = {
      hud: hud.powerMW,
      metrics: metrics?.energyOutput,
      derivedReport: derived?.P_ship_avg_report_MW,
      derivedCalc: derived?.P_ship_avg_calc_MW,
      stateAvg: state?.P_avg
    };

    console.debug("[HelixCasimirAmplifier] Power fallback sources:", sources);

    // Try HUD first (most authoritative)
    if (Number.isFinite(hud.powerMW) && hud.powerMW! > 0) return hud.powerMW!;

    // Try metrics direct power
    if (Number.isFinite(metrics?.energyOutput) && metrics!.energyOutput! > 0) return metrics!.energyOutput!;

    // Try derived report (backend calculated)
    if (Number.isFinite(derived?.P_ship_avg_report_MW) && derived?.P_ship_avg_report_MW! > 0) return derived?.P_ship_avg_report_MW!;

    // Try derived calculation
    if (Number.isFinite(derived?.P_ship_avg_calc_MW) && derived?.P_ship_avg_calc_MW! > 0) return derived?.P_ship_avg_calc_MW!;

    // Try state pipeline average
    if (Number.isFinite(state?.P_avg) && state!.P_avg! > 0) return state!.P_avg!;

    return 0;
  })();

  // Robust mass badge with multiple fallbacks
  const M_kg_badge = (() => {
    const sources = {
      hud: hud.exoticMassKg,
      metrics: metrics?.exoticMass,
      derivedReport: derived?.M_total_report,
      derivedCalc: derived?.M_total_calc,
      stateExotic: state?.M_exotic,
      metricsRaw: metrics?.exoticMassRaw
    };

    console.debug("[HelixCasimirAmplifier] Mass fallback sources:", sources);

    // Try HUD first (most authoritative)
    if (Number.isFinite(hud.exoticMassKg) && hud.exoticMassKg! > 0) return hud.exoticMassKg!;

    // Try metrics direct mass
    if (Number.isFinite(metrics?.exoticMass) && metrics!.exoticMass! > 0) return metrics!.exoticMass!;

    // Try derived report (backend calculated)
    if (Number.isFinite(derived?.M_total_report) && derived?.M_total_report! > 0) return derived?.M_total_report!;

    // Try derived calculation
    if (Number.isFinite(derived?.M_total_calc) && derived?.M_total_calc! > 0) return derived?.M_total_calc!;

    // Try state pipeline
    if (Number.isFinite(state?.M_exotic) && state!.M_exotic! > 0) return state!.M_exotic!;

    // Try raw metrics fields
    if (Number.isFinite(metrics?.exoticMassRaw) && metrics!.exoticMassRaw! > 0) return metrics!.exoticMassRaw!;

    return 0;
  })();

  // ---- CAVITY ENERGY INTEGRATION ----

  // A gentle visual envelope (rise ~ two τ_Q, fall ~ one τ_Q)
  const driveEnv = useDriveEnvelope({
    on: onDisplay,
    tauRise_s: 2 * tauQ_s,
    tauFall_s: 1 * tauQ_s
  });

  // Compute mechanical stroke from pipeline values
  const gap_nm = (state?.gap_nm ?? 16);
  const qMechStroke = state?.qMechanical ?? 1;

  // Reference small actuation nm per unit q_mech (pipeline may send a better number later)
  const ref_nm_per_q = 0.25; // small; purely visual, bounded below
  const stroke_nm_peak = Math.min(
    gap_nm * 0.25,                 // never exceed 25% of gap visually
    Math.max(0, qMechStroke * ref_nm_per_q)
  );

  // Visual instantaneous stroke (modulated by envelope)
  const stroke_nm_instant = stroke_nm_peak * driveEnv;

  // Wire pipeline strobing to drive the WarpEngine (if present) for phase synchronization
  useEffect(() => {
    // Early return if readOnly - prevent engine interference
    if (readOnly) return;

    const sectorCount =
      metrics?.totalSectors ??
      state?.sectorStrobing ??
      lightCrossing?.sectorCount ?? 1;

    const currentSector =
      lightCrossing?.sectorIdx ??
      metrics?.activeSectors ?? 0;

    if (typeof window !== "undefined" && typeof window.setStrobingState === "function") {
      try {
  const sc = Math.max(1, Number.isFinite(Number(sectorCount)) ? Number(sectorCount) : 1);
  const cs = Math.max(0, Number.isFinite(Number(currentSector)) ? Number(currentSector) : 0) % sc;
        window.setStrobingState({ sectorCount: sc, currentSector: cs });
      } catch (err) {
        // Prevent panel crash if the visualizer's handler references undefined globals (e.g., sceneScale)
        console.warn("setStrobingState failed (visualizer will ignore this tick):", err);
      }
    }
  }, [readOnly, metrics?.totalSectors, metrics?.activeSectors, state?.sectorStrobing, lightCrossing?.sectorIdx, lightCrossing?.sectorCount]);

  // Safe U_inf target - use physics-driven value with robust fallback
  const U_inf = (() => {
    const cand = Number.isFinite(state?.U_cycle) && state!.U_cycle !== 0
      ? Math.abs(state!.U_cycle)
      : (Number.isFinite(derived?.U_Q) && derived!.U_Q !== 0
          ? Math.abs(derived!.U_Q)
          : 1e-6);
    return Math.max(cand, 1e-12);
  })();

  const [U, setU] = useState(0);  // cavity "stored" energy (relative units)
  const lastT = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const step = (t: number) => {
      if (!lc) { raf = requestAnimationFrame(step); return; }
      const on = gateOn; // one source of truth
      const now = t / 1000;
      const prev = lastT.current ?? now;
      const dt = Math.min(0.05, Math.max(0, now - prev));
      lastT.current = now;

      setU((U0) => {
        if (tauQ_s <= 0) return U0;
        const alpha = dt / tauQ_s;
        return on
          ? U0 + ((Number.isFinite(U_inf) ? U_inf : 1e-6) - U0) * (1 - Math.exp(-alpha))   // ring-up
          : U0 * Math.exp(-alpha);                       // ring-down
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [gateOn, tauQ_s, U_inf, lc]);

  // Use U to drive visuals / numbers
  const pInstant = U / Math.max(1e-9, lc?.dwell_ms ?? 1); // arbitrary proportional readout

  // Mode switch
  const [switchingMode, setSwitchingMode] = useState(false);
  const switchMode = async (mode: string) => {
    setSwitchingMode(true);
    try {
      const res = await fetch(modeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    } catch (e: any) {
      console.error("Mode switch failed:", e);
    } finally {
      setSwitchingMode(false);
    }
  };

  // Gentle banner delay: avoid first-frame flicker of fail/warn during init & after mode switches
  const [bannersReady, setBannersReady] = useState(false);
  // Initial mount delay
  useEffect(() => {
    const t = setTimeout(() => setBannersReady(true), 900);
    return () => clearTimeout(t);
  }, []);
  // Re-arm delay after mode transitions
  useEffect(() => {
    if (switchingMode) {
      setBannersReady(false);
      return;
    }
    const t = setTimeout(() => setBannersReady(true), 900);
    return () => clearTimeout(t);
  }, [switchingMode]);

  // Histories for KPI sparklines (must be declared unconditionally to preserve hook order)
  const [hist, setHist] = useState<{Ptile:number[];Pship:number[];Mtot:number[];Uq:number[]}>({
    Ptile: [], Pship: [], Mtot: [], Uq: []
  });
  useEffect(() => {
    if (!cohesive || !derived) return; // only collect when cohesive view active and data ready
    setHist(h => ({
      Ptile: [...h.Ptile, derived.P_tile_on].slice(-120),
      Pship: [...h.Pship, derived.P_ship_avg_calc_MW].slice(-120),
      Mtot:  [...h.Mtot,  derived.M_total_calc].slice(-120),
      Uq:    [...h.Uq,    Math.abs(derived.U_Q)].slice(-120),
    }));
  }, [cohesive, derived?.P_tile_on, derived?.P_ship_avg_calc_MW, derived?.M_total_calc, derived?.U_Q]);

  if (!metrics || !state || !derived) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <Card className="bg-slate-900/60 border-slate-700">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 text-slate-300">
              <Activity className="w-5 h-5 animate-spin"/>
              <span>Connecting to HELIX-CORE pipeline...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ───────────────── Cohesive Replacement Path ───────────────────────────
  if (cohesive) {
    // Build ordered equations (1→7)
    const eqList = (
      <ol className="space-y-4 text-xs leading-5">
        <li>
          <b>1) Casimir density</b> u = -π²ħc/(720 a⁴) → {fmtNum(derived.casimir_theory, 'J/m³', 2)}; U_tile(theory)=u·A·a → {fmtNum(derived.casimir_per_tile,'J',3)}
        </li>
        <li>
          <b>2) Geometry shift</b> U_geo = U_static·γ_geo → {fmtNum(derived.U_geo,'J',3)}
        </li>
        <li>
          <b>3) Mechanical modulation</b> U_Q = U_geo·q_mech → {fmtNum(derived.U_Q,'J',3)}
        </li>
        <li>
          <b>4) Cavity ON power</b> P_tile,on = ω|U_Q|/Q_cav → {fmtNum(derived.P_tile_on,'W',2)}
        </li>
        <li>
          <b>5) Ship average</b> P_ship,avg = P_tile,on·N·d_eff → {fmtNum(derived.P_ship_avg_calc_MW,'MW',2)}
        </li>
        <li>
          <b>6) VdB mass path</b> E_tile,avg = |U_static|γ_geo³γ_VdB d_eff → {fmtNum(derived.E_tile_mass,'J',3)}; M_total = N·E/c² → {fmtNum(derived.M_total_calc,'kg',3)}
        </li>
        <li>
          <b>7) GR gates</b> R1=T_mod/τ_LC → {derived.R1?.toFixed?.(3) ?? '—'}; R2=τ_LC/τ_curv → {derived.R2?.toFixed?.(3) ?? '—'}; Reciprocity: {derived.reciprocity.status}
        </li>
      </ol>
    );

    // Local ladder data (avoid referencing earlier legacy declarations order)
    const powerLadder: LadderDatum[] = [
      { stage: "|U_static|", value: Math.abs(derived.U_static) },
      { stage: "×γ_geo", value: Math.abs(derived.U_geo) },
      { stage: "×q_mech", value: Math.abs(derived.U_Q) },
      { stage: "→P_tile_on (ωU/Q_cav)", value: derived.P_tile_on },
      { stage: "×N_tiles × d_eff", value: derived.P_ship_avg_calc_MW * 1e6 }
    ];
    const massLadder: LadderDatum[] = [
      { stage: "|U_static|", value: Math.abs(derived.U_static) },
      { stage: "×γ_geo³", value: Math.abs(derived.U_static) * Math.pow(derived.gammaGeo,3) },
      { stage: "×γ_VdB", value: derived.E_tile_mass / Math.max(derived.d_eff, 1e-12) },
      { stage: "×d_eff", value: derived.E_tile_mass },
      { stage: "→(÷c²)×N", value: derived.M_total_calc }
    ];


  // Cohesive checkpoint mapping
    const rel = (a:number, b:number) => Math.abs(a-b)/Math.max(Math.abs(b),1e-12);
    const casimirPass = rel(derived.U_static, derived.casimir_per_tile) <= 0.05;
    const powerDrift = (Number.isFinite(derived.P_ship_avg_report_MW) && derived.P_ship_avg_report_MW!>0)
      ? rel(derived.P_ship_avg_calc_MW, derived.P_ship_avg_report_MW!) : 0;
    const massDrift = (Number.isFinite(derived.M_total_report) && derived.M_total_report!>0)
      ? rel(derived.M_total_calc, derived.M_total_report!) : 0;
    const checkpointRowsCohesive: CheckRow[] = [
      { label: 'Casimir theory vs backend', state: casimirPass ? 'ok':'warn', detail: casimirPass? '≤5%':'>5%' },
      { label: 'Scale separation R1', state: derived.R1!=null ? (derived.R1 < 0.1 ? 'ok' : derived.R1 < 0.5 ? 'warn':'fail') : 'warn', detail: derived.R1!=null? derived.R1.toFixed(3):'NA' },
      { label: 'Scale separation R2', state: derived.R2!=null ? (derived.R2 < 0.1 ? 'ok' : derived.R2 < 0.5 ? 'warn':'fail') : 'warn', detail: derived.R2!=null? derived.R2.toFixed(3):'NA' },
      { label: 'Reciprocity window', state: derived.reciprocity.status === 'PASS_AVG' ? 'ok' : derived.reciprocity.status === 'UNKNOWN' ? 'warn':'fail', detail: derived.reciprocity.status },
      { label: 'Power drift', state: powerDrift <= 0.03 ? 'ok' : powerDrift <= 0.1 ? 'warn':'fail', detail: (powerDrift*100).toFixed(2)+'%' },
      { label: 'Mass drift', state: massDrift <= 0.03 ? 'ok' : massDrift <= 0.1 ? 'warn':'fail', detail: (massDrift*100).toFixed(2)+'%' },
      { label: 'Materials window', state: (():CheckRow['state']=>{
          const qOK = derived.qCav > 1e8;
          const fOK = (fGHz > 1 && fGHz < 40);
          return (qOK && fOK) ? 'ok':'warn';
        })(), detail: `Q=${fmtNum(derived.qCav,'',0)} f=${fGHz.toFixed(2)}GHz` }
    ];

    // Focus + bottlenecks & statuses (moved outside return for new viewers)
  const zeroNRaw = (N_tiles_sticky ?? 0) === 0;
  const initializing = zeroNRaw && (state?.U_static === 0) && (provenance.N_tiles_source === 'state.N_tiles' || provenance.N_tiles_source === 'fallback:0');
  const zeroN = zeroNRaw && !initializing;
    const zeroVdB = (derived.gammaVdB ?? 0) === 0;
    const userMassTarget = (state as any)?.exoticMassTarget_kg ?? (hud as any)?.exoticMassTarget_kg;
    const massTargetDisabled = !userMassTarget || userMassTarget <= 0;
    const baselineDuty = provenance.dutyDecomp?.baseline ?? 0;
    const dutyRatio = baselineDuty > 0 ? (derived.d_eff / baselineDuty) : 0;
    const dutySeverity = (() => {
      if (!Number.isFinite(derived.d_eff) || derived.d_eff === 0) return 'fail';
      if (baselineDuty === 0) return 'info';
      if (dutyRatio < 0.5) return 'warn';
      if (dutyRatio > 5) return 'info';
      return 'baseline';
    })();
    const qLow = (derived.qCav ?? 0) < 1e8;
    const okR1 = derived.R1 !== undefined && derived.R1 < 0.1;
  const okR2 = derived.R2 !== undefined && derived.R2 < 0.1;
  const bannerItems = [
  initializing ? {kind:"info", text:`Tile census pending… (current N=0 via ${provenance.N_tiles_source}). Await first pipeline cycle.`} : null,
  zeroN ? {kind:"fail", text:`N = 0 (source ${provenance.N_tiles_source}) → ship power & mass collapse. Provide tilesTotal or N_tiles.`} : null,
      zeroVdB ? (
        massTargetDisabled
          ? {kind:"info", text:`γ_VdB = 0 (mass target ≤ 0) → mass calibration intentionally disabled.`}
          : {kind:"fail", text:`γ_VdB = 0 (source ${provenance.gammaVdB_source}) but mass target > 0 → mass path collapsed.`}
      ) : null,
      dutySeverity === 'fail' ? {kind:"fail", text:`d_eff = 0 → no average output.`} : null,
      dutySeverity === 'warn' ? {kind:"warn", text:`d_eff = ${fmtSci(derived.d_eff)} (<50% baseline ${fmtSci(baselineDuty)}) → averages suppressed.`} : null,
      dutySeverity === 'baseline' ? {kind:"ok", text:`d_eff = ${fmtSci(derived.d_eff)} (baseline).`} : null,
      dutySeverity === 'info' ? {kind:"info", text:`d_eff = ${fmtSci(derived.d_eff)} (elevated vs baseline ${fmtSci(baselineDuty)}).`} : null,
      qLow ? {kind:"warn", text:`Q_cav = ${derived.qCav?.toExponential?.(2)} (source ${provenance.qCav_source}) → ON power throttled.`} : null,
      derived.R1 !== undefined ? (okR1 ? {kind:"ok", text:`R1 = ${derived.R1.toFixed(3)} (T_mod/τ_LC ok).`} : {kind:"warn", text:`R1 = ${derived.R1.toFixed(3)} high → modulation slow vs τ_LC.`}) : {kind:"info", text:"R1 unavailable (missing tauLC_ms)."},
      (() => {
        if (derived.R2 === undefined) return {kind:"info", text:`R2 estimated (no tauCurv_ms; using hull/natário fallback).`};
        const val = derived.R2;
        if (val < 0.1) return {kind:"ok", text:`R2 = ${val.toFixed(3)} (scale separation strong).`};
        if (val < 0.5) return {kind:"warn", text:`R2 = ${val.toFixed(3)} moderate → consider τ_curv_ms (wall/geometry).`};
        return {kind:"fail", text:`R2 = ${val.toFixed(3)} high → recheck τ_curv_ms or wall length.`};
      })(),
      derived.dceOverdriveRaw ? {kind:"info", text:`DCE input stroke was reduced to fit specs: δa/a = ${derived.modIndex?.toExponential?.(2)}; cap ≤ ${derived.MOD_OK}·a and ≤ ${derived.mechCap_pm} pm.`} : null,
    ].filter(Boolean) as {kind:"fail"|"warn"|"info"|"ok"; text:string}[];

      // Simple scientific formatter used in new duty baseline messages
      function fmtSci(v?: number) {
        if (!Number.isFinite(v)) return '—';
        const a = Math.abs(v!);
        if (a === 0) return '0';
        if (a >= 1e-3 && a < 1e3) return v!.toExponential(2); // uniform style
        return v!.toExponential(2);
      }

    return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 select-text">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          {/* Header */}
          <Card className="bg-slate-900/60 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CircuitBoard className="w-6 h-6 text-blue-400"/>
                  <span className="text-slate-100">HELIX-CORE Casimir Amplifier (Cohesive)</span>
                  <InfoDot text="silence → shape → breath → note → many → weight → wisdom (1→7)" />
                  <Badge variant="outline" className="text-xs">Chronological Pipeline</Badge>
                </div>
                <div className="flex gap-2">
                  {['hover','cruise','emergency','standby'].map(mode => (
                    <Button key={mode} size="sm" variant={switchingMode || readOnly ? 'outline':'default'} disabled={switchingMode || readOnly} onClick={()=>switchMode(mode)} className="capitalize">{mode}</Button>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VacuumContractBadge contract={vacuumContract} className="mb-3" />
              <div className="flex flex-wrap gap-2 text-[10px]">
                <EquationChip label="γ_geo" value={derived.gammaGeo} />
                <EquationChip label="q_mech" value={derived.qMech} />
                <EquationChip label="γ_VdB" value={derived.gammaVdB} tooltip={`source: ${provenance.gammaVdB_source}`} />
                <EquationChip label="Q_cav" value={derived.qCav} />
                <EquationChip label="N" value={derived.N_tiles_internal} />
                <EquationChip label="d_eff" value={derived.d_eff} />
                <EquationChip label="R1" value={derived.R1} tooltip="T_mod / τ_LC" />
                <EquationChip label="R2" value={derived.R2} tooltip="τ_LC / τ_curv" />
                <EquationChip label="P_ship MW" value={derived.P_ship_avg_calc_MW} />
                <EquationChip label="M_total kg" value={derived.M_total_calc} />
              </div>
              {lc && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="mb-2 text-xs text-slate-400 font-mono uppercase tracking-wide">Cavity Dynamics</div>
                  <div className="grid grid-cols-3 gap-3 text-[10px] font-mono">
                    <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-0.5">τ_LC</div>
                      <div className="text-slate-200">{fmtNum(derived.tauLC_ms,'ms',3)}</div>
                    </div>
                    <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-0.5">τ_Q</div>
                      <div className="text-slate-200">{(tauQ_s*1e3).toFixed(1)} ms</div>
                    </div>
                    <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-0.5">d_eff</div>
                      <div className="text-slate-200">{fmtNum(derived.d_eff,'',5)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drive Sync Controls (phase/split/σ/floor/q/ζ) */}
          <Card className="bg-slate-900/60 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <RadioReceiver className="w-5 h-5"/>
                Drive Sync
                <Badge variant="outline" className="ml-2 text-[10px]">phase, split, σ, floor, q, ζ</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {(() => {
                const phasePct = Math.round(((ds.phase01 ?? 0) % 1) * 100);
                const splitPct = Math.round((ds.splitFrac ?? 0.5) * 100);
                return (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-slate-300">Follow Mode Presets</div>
                        <div className="flex items-center gap-2">
                          <span className="opacity-70">Off</span>
                          <Switch
                            checked={!!ds.locks?.followMode}
                            onCheckedChange={(v)=>ds.setFollowMode?.(!!v)}
                            disabled={readOnly}
                          />
                          <span className="opacity-70">On</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-slate-300">Phase Source</div>
                        <div className="flex items-center gap-2">
                          <span className={ds.phaseMode === 'manual' ? 'text-slate-400' : 'text-slate-200'}>Scheduler</span>
                           <Switch
                             checked={ds.phaseMode === 'manual'}
                             onCheckedChange={(v)=>ds.setPhaseMode?.(v ? 'manual' : 'scheduler')}
                             disabled={readOnly}
                           />
                          <span className={ds.phaseMode === 'manual' ? 'text-slate-200' : 'text-slate-400'}>Manual</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1"><div className="text-slate-300">Phase</div><div className="text-slate-400">{phasePct}%</div></div>
                         <Slider
                           value={[ds.phase01]}
                           min={0}
                           max={1}
                           step={0.001}
                           onValueChange={(v)=>{ ds.setPhaseMode?.('manual'); ds.setPhase?.(v[0] ?? 0); }}
                           disabled={ds.phaseMode !== 'manual' || readOnly}
                         />
                        {ds.phaseMode !== 'manual' && <div className="mt-1 text-[10px] text-slate-400">following scheduler sector sweep</div>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-slate-300">Split lobes</div>
                        <div className="flex items-center gap-2">
                          <span className="opacity-70">Off</span>
                           <Switch
                             checked={!!ds.splitEnabled}
                             onCheckedChange={(v)=>ds.setSplit?.(!!v, ds.splitFrac)}
                             disabled={readOnly}
                           />
                          <span className="opacity-70">On</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1"><div className="text-slate-300">Split weight</div><div className="text-slate-400">{splitPct}% / {100-splitPct}%</div></div>
                         <Slider
                           value={[ds.splitFrac]}
                           min={0}
                           max={1}
                           step={0.01}
                           onValueChange={(v)=>ds.setSplit?.(true, v[0] ?? 0.5)}
                           disabled={!ds.splitEnabled || readOnly}
                         />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1"><div className="text-slate-300">σ (sectors)</div><div className="text-slate-400">{(ds.sigmaSectors ?? 0).toFixed(2)}</div></div>
                         <Slider
                           value={[Math.min(1, Math.max(0.01, ds.sigmaSectors))]}
                           min={0.01}
                           max={1}
                           step={0.01}
                           onValueChange={(v)=>ds.setSigma?.(v[0] ?? ds.sigmaSectors)}
                           disabled={readOnly}
                         />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1"><div className="text-slate-300">Floor</div><div className="text-slate-400">{(ds.sectorFloor ?? 0).toFixed(2)}</div></div>
                         <Slider
                           value={[ds.sectorFloor]}
                           min={0}
                           max={0.5}
                           step={0.01}
                           onValueChange={(v)=>ds.setFloor?.(v[0] ?? ds.sectorFloor)}
                           disabled={readOnly}
                         />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1"><div className="text-slate-300">q (spoiling)</div><div className="text-slate-400">{(ds.q ?? 1).toFixed(2)}</div></div>
                         <Slider
                           value={[Math.min(2, Math.max(0, ds.q))]}
                           min={0}
                           max={2}
                           step={0.01}
                           onValueChange={(v)=>ds.setQ?.(v[0] ?? ds.q)}
                           disabled={readOnly}
                         />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1"><div className="text-slate-300">ζ (coupling)</div><div className="text-slate-400">{(ds.zeta ?? 0.84).toFixed(2)}</div></div>
                         <Slider
                           value={[ds.zeta]}
                           min={0}
                           max={1}
                           step={0.01}
                           onValueChange={(v)=>ds.setZeta?.(v[0] ?? ds.zeta)}
                           disabled={readOnly}
                         />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <StatusBanner items={bannersReady ? bannerItems : bannerItems.filter(i => i.kind === 'info' || i.kind === 'ok')} />
          {/* Result viewers 1→7 + materials */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <ResultViewer
              title="(1) Casimir per tile (theory)"
              equation="U_tile = (-π² ħc / (720 a⁴)) · A · a"
              value={fmtNum(derived.casimir_per_tile, "J", 3)}
              status="ok"
              details={[{label:"gap a", value: fmtNum(derived.gap_m*1e9,"nm",2)},{label:"area A", value: fmtNum(derived.tileA_m2,"m²",3)}]}
            />
            <ResultViewer
              title="Backend U_static"
              equation="authoritative U_static"
              value={fmtNum(derived.U_static, "J", 3)}
              status={Math.abs((derived.U_static - derived.casimir_per_tile)/Math.max(1e-12,derived.casimir_per_tile))<=0.05 ? "ok":"warn"}
              details={[{label:"match ±5%", value: (Math.abs((derived.U_static - derived.casimir_per_tile)/Math.max(1e-12,derived.casimir_per_tile))<=0.05 ? "✓" : "⚠︎")}]} />
            <ResultViewer
              title="(2) Geometry shift"
              equation="U_geo = U_static · γ_geo"
              value={fmtNum(derived.U_geo, "J", 3)}
              status="ok"
              badges={[`γ_geo=${fmtNum(derived.gammaGeo,'',2)}`]}
              details={[{label:"γ_geo", value: fmtNum(derived.gammaGeo,"",2)}]}
            />
            <ResultViewer
              title="(3) Mechanical modulation"
              equation="U_Q = U_geo · q_mech"
              value={fmtNum(derived.U_Q, "J", 3)}
              history={hist.Uq}
              status="ok"
              badges={[`q_mech=${fmtNum(derived.qMech,'',2)}`]}
              details={[{label:"q_mech", value: fmtNum(derived.qMech,"",2)}]}
            />
            <ResultViewer
              title="(4) Per-tile ON power"
              equation="P_on = ω|U_Q| / Q_cav"
              value={fmtNum(derived.P_tile_on, "W", 2)}
              history={hist.Ptile}
              status={qLow ? "warn" : "ok"}
              details={[{label:"ω", value: fmtNum(derived.omega,"rad/s",0)},{label:"Q_cav", value: fmtNum(derived.qCav,"",0)}]}
            />
            <ResultViewer
              title="(5) Ship avg power"
              equation="P_ship = P_on · N · d_eff"
              value={fmtNum(derived.P_ship_avg_calc_MW, "MW", 3)}
              history={hist.Pship}
              status={(derived.N_tiles_internal===0) ? "fail" : (dutySeverity==='warn' ? 'warn' : 'ok')}
              badges={[`N=${derived.N_tiles_internal}`, `d=${fmtNum(derived.d_eff,'',4)}`]}
              details={[{label:"N", value: String(derived.N_tiles_internal)},{label:"d_eff", value: fmtNum(derived.d_eff,"",4)}]}
            />
            <ResultViewer
              title="(6) Exotic mass total"
              equation="M = N(|U_s|γ_geo³γ_VdB d_eff)/c²"
              value={fmtNum(derived.M_total_calc, "kg", 3)}
              history={hist.Mtot}
              status={(derived.N_tiles_internal===0) ? "fail" : ((derived.gammaVdB===0 && !massTargetDisabled) ? "warn" : "ok")}
              badges={[`γ_VdB=${fmtNum(derived.gammaVdB,'',2)}`]}
              details={[{label:"γ_geo³", value: fmtNum(Math.pow(derived.gammaGeo,3),"",2)},{label:"γ_VdB", value: fmtNum(derived.gammaVdB,"",2)}]}
            />
            <ResultViewer
              title="(7) GR gates"
              equation="R1=T_mod/τ_LC  R2=τ_LC/τ_curv"
              value={`${derived.R1!=null?derived.R1.toFixed(3):'—'} / ${derived.R2!=null?derived.R2.toFixed(3):'—'}`}
              status={(okR1 && okR2) ? "ok" : ((okR1 || okR2) ? "warn" : "fail")}
              details={[{label:"Reciprocity", value: String(derived.reciprocity.status)},{label:"τ_LC", value: fmtNum(derived.tauLC_ms,"ms",3)}]}
            />
            <ResultViewer
              title="Materials window"
              equation="Nb₃Sn SRF + AlN drive"
              value={(derived.qCav>1e8 && fGHz>1 && fGHz<40) ? "OK" : "Check"}
              status={(derived.qCav>1e8 && fGHz>1 && fGHz<40) ? "ok" : "warn"}
              details={[{label:"Q_cav", value: fmtNum(derived.qCav,"",0)},{label:"f_mod", value: `${fGHz.toFixed(2)} GHz`}]}
            />
          </div>

          {/* Pipeline Equations Full Width */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-slate-100 text-sm flex items-center">Pipeline (Steps 1→7) <InfoDot text="Start from silence. Follow geometry (γ_geo). Breathe (δa). Commit (Q). Many hands & timing (N·d). Carry weight wisely (GR gates)." /></CardTitle></CardHeader>
            <CardContent className="text-xs">{eqList}</CardContent>
          </Card>

          {/* ───────────────────── Experiment Readiness (derived from page vars) ───────────────────── */}
          <div className="grid xl:grid-cols-3 gap-4 mt-4">
            <ResultViewer
              title="Aperture (bench) vs Tile"
              equation="A_ap = π(D/2)^2; ratio = A_ap / A_tile"
              value={fmtNum(derived.A_ap_m2, "m²", 3)}
              status={derived.A_ap_m2 ? "ok" : "warn"}
              badges={[
                `A_tile=${fmtNum(derived.A_tile_m2, "m²", 3)}`,
                `ratio=${derived.A_ratio!=null ? derived.A_ratio.toExponential(2) : "—"}`,
                derived.A_ap_is_est ? "D≈40 µm (est)" : (derived.D_um!=null ? `D=${derived.D_um.toFixed?.(0)} µm` : undefined)
              ].filter(Boolean) as string[]}
              details={[
                { label: "D (bench)", value: derived.D_um!=null ? `${derived.D_um.toFixed?.(0)} µm` : "—" },
                { label: "tile area", value: fmtNum(derived.A_tile_m2, "m²", 3) }
              ]}
            />
            <ResultViewer
              title="Cavity Coupling"
              equation="1/QL = 1/Q0 + 1/Qext; β = Q0/Qext"
              value={derived.beta!=null ? (isFinite(derived.beta) ? derived.beta.toFixed(3) : "∞") : "—"}
              badges={[
                `regime=${derived.couplingRegime}`,
                `QL=${fmtNum(derived.QL_resolved, "", 2)}`,
                `Q0=${fmtNum(derived.Q0_resolved, "", 2)}${(derived as any).Q0_is_est?" (est)":""}`,
                `Qext=${(isFinite(derived.Qext_resolved as any) ? fmtNum(derived.Qext_resolved, "", 2) : "∞")}${(derived as any).Qext_is_est?" (est)":""}`
              ]}
              status={derived.beta==null ? "warn" : (derived.couplingRegime==="critical" ? "ok" : "warn")}
              details={[
                { label: "f", value: `${fGHz.toFixed(2)} GHz` },
                { label: "τ_Q", value: `${(qCav/(2*Math.PI*f)/1e-3).toFixed(3)} ms` }
              ]}
            />
            <ResultViewer
              title="Thermal Occupancy @ f"
              equation="n_th = 1/(e^{hf/kT} - 1)"
              value={derived.n_th!=null ? derived.n_th.toExponential(2) : "—"}
              status={derived.n_th!=null && derived.n_th < 1e-3 ? "ok" : "warn"}
              badges={[
                `T=${derived.T_K!=null ? `${derived.T_K.toFixed?.(1)} K` : "—"}`,
                `hf/kT=${derived.hf_over_kT!=null ? derived.hf_over_kT.toFixed?.(2) : "—"}`
              ]}
              details={[
                { label: "h·f", value: fmtNum(H*f, "J", 3) },
                { label: "k·T", value: derived.T_K!=null ? fmtNum(KB*derived.T_K, "J", 3) : "—" }
              ]}
            />
            <ResultViewer
              title="Environment (Targets)"
              equation="vacuum & magnetic shielding goals"
              value="configured"
              status="ok"
              details={[
                { label: "vacuum", value: `${derived.vacuum_Pa.toExponential?.(2)} Pa${derived.envUsedDefaults?' (default)':''}` },
                { label: "shield", value: `${derived.shield_dB.toFixed?.(0)} dB${derived.envUsedDefaults?' (default)':''}` }
              ]}
            />
            <ResultViewer
              title="Drive Limits (Piezo)"
              equation="δa ≤ min(mechCap, α·a)"
              value={derived.stroke_pm!=null ? `${derived.stroke_pm.toFixed?.(0)} pm` : "—"}
              status={derived.driveOk===false ? "fail" : derived.driveOk===true ? "ok" : "warn"}
              badges={[
                `cap=${(derived.target_pm!=null)?`${Math.round(derived.target_pm)} pm`:"—"}`,
                `mech=${derived.mechCap_pm} pm`,
              ].concat(
                (derived.V_rms!=null||derived.I_rms!=null)
                  ? [`V_rms≤${derived.V_rms??"—"}`, `I_rms≤${derived.I_rms??"—"}`]
                  : []
              )}
              details={[
                { label: "gap a", value: `${(state.gap_nm??0).toFixed?.(2)} nm` },
                { label: "α (ok)", value: `${(((state as any)?.modThreshold_ok ?? 0.10)*100).toFixed?.(0)}%` }
              ]}
            />
            <ResultViewer
              title="τ_curv Source"
              equation="L = c·τ_curv"
              value={derived.tauCurv_ms!=null ? `${derived.tauCurv_ms.toExponential?.(2)} ms` : "—"}
              status={derived.tauCurv_ms!=null ? "ok" : "warn"}
              badges={[
                `L=${(derived.L_curv_m!=null && isFinite(derived.L_curv_m))
                      ? (derived.L_curv_m>=1e3
                          ? (derived.L_curv_m/1e3).toFixed(2)+' km'
                          : (derived.L_curv_m>=1
                              ? derived.L_curv_m.toFixed(1)+' m'
                              : derived.L_curv_m.toFixed(3)+' m'))
                      : "—"}`,
                `source=${String(derived.tauCurvSource)}`
              ]}
              details={[
                { label: "τ_LC", value: (derived.tauLC_ms!=null) ? `${derived.tauLC_ms.toExponential?.(2)} ms` : "—" },
                { label: "R2 (from shown)", value: (derived.tauCurv_ms!=null && derived.tauLC_ms!=null) ? (derived.tauLC_ms/derived.tauCurv_ms).toFixed(3) : "—" },
                { label: "geom D", value: (derived as any).geomD_um!=null ? `${(derived as any).geomD_um.toFixed?.(0)} µm` : "—" },
                { label: "geom sag", value: (derived as any).geomSag_nm!=null ? `${(derived as any).geomSag_nm.toFixed?.(2)} nm` : "—" },
                { label: "L (raw)", value: (derived.L_curv_m!=null && isFinite(derived.L_curv_m))
                    ? (derived.L_curv_m>=1e3 ? (derived.L_curv_m/1e3).toFixed(6)+' km' : derived.L_curv_m.toFixed(9)+' m')
                    : "—" },
                { label: "τ_curv (ms)", value: (derived.tauCurv_ms!=null && isFinite(derived.tauCurv_ms)) ? `${(derived.tauCurv_ms as number).toPrecision?.(6)}` : "—" }
              ]}
            />
          </div>

          {/* Ladders Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <LadderChart title={<span>Power Chain (Per Tile → Ship)<InfoDot text="follow the heart (geometry) → upper hand; then commit and the note defines itself (Q)" /></span>} unit="W" data={powerLadder} />
            <LadderChart title={<span>Energy Chain (Per Tile → Ship Avg)<InfoDot text="indirectness opens possibilities—pocket + duty move great weight with a gentle touch" /></span>} unit="J" data={massLadder} />
          </div>

          {/* Checkpoints + Materials side by side */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CheckpointCard title="Casimir → Amplifier Checkpoints" rows={checkpointRowsCohesive} equations={null} />
            </div>
            <Card className="bg-slate-900/40 border-slate-800 h-full">
              <CardHeader className="pb-2"><CardTitle className="text-slate-100 text-sm">Materials Window</CardTitle></CardHeader>
              <CardContent className="text-xs grid grid-cols-2 sm:grid-cols-2 gap-3 font-mono">
                <div>Q_cav: {fmtNum(derived.qCav,'',0)}</div>
                <div>f_mod: {fGHz.toFixed(2)} GHz</div>
                <div>Rs: {derived.materials.Rs_nOhm ?? '—'} nΩ</div>
                <div>stroke: {derived.materials.stroke_pm ?? '—'} pm</div>
              </CardContent>
            </Card>
          </div>
          {/* Cavity Cross Section */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-slate-100"><ScanSearch className="w-4 h-4"/> Pipeline-Driven Cavity Cross-Section</CardTitle></CardHeader>
            <CardContent>
              <CavityFrameView
                pocketDiameter_um={2000}
                sag_nm={state.sag_nm ?? 2.9}
                gap_nm={state.gap_nm ?? 1}
                topMirror_thick_um={1.5}
                botMirror_thick_um={1.5}
                alnRim_width_um={20}
                tileWidth_mm={Math.max(1, Math.sqrt(Math.max(0, (state.tileArea_cm2 ?? 25))) * 10)}
                onWindow={!!lc?.onWindow}
                verticalExaggeration={6000}
                gapTargetPxFor1nm={10}
                mirrorCompression={0.03}
                animateSag
                modulationFreq_Hz={f}
                autoHeight={false}
                height={220}
                showChrome={false}
                sagPhaseSource="modulation"
                diaphragm_thick_um={(state as any)?.diaphragm_thick_um ?? 1.0}
                showRelationsLegend={true}
                // Physics overlays for explanatory panels
                gammaGeo={derived.gammaGeo}
                qCav={derived.qCav}
                f_Hz={f}
                omega_rad_s={omega}
                surfaceResistance_nOhm={derived.materials.Rs_nOhm}
                stroke_pm={(derived as any).stroke_pm}
                modIndex={(derived as any).modIndex}
                tauCurv_ms={derived.tauCurv_ms}
                geometryFactor_Ohm={(derived as any).G_geom_Ohm}
                // Prefer passed timing values for display
                tauLC_ms={derived.tauLC_ms}
                tmod_ms={derived.T_mod_ms}
                R1={derived.R1_local ?? derived.R1}
                R2={derived.R2_local ?? derived.R2}
                // Upstream for deviation note (viewer computes local itself)
                upstreamR1={derived.R1}
                upstreamR2={derived.R2}
                suppressDriftHint
                targetModIndex_phase={(derived as any).targetModIndex_phase}
              />
            </CardContent>
          </Card>

          {/* Displacement Heatmap */}
          <DisplacementHeatmap endpoint={fieldEndpoint} metrics={metrics} state={state} />
        </div>
      </div>
    );
  }

  // ----- Ladders (show the actual steps you compute) -----

  const powerLadder: LadderDatum[] = [
    { stage: "|U_static|", value: Math.abs(derived.U_static) },
    { stage: "×γ_geo",     value: Math.abs(derived.U_geo) },
    { stage: "×q_mech",    value: Math.abs(derived.U_Q) },
    // instantaneous power when ON: P = ωU/Q (display per tile)
    { stage: "→P_tile_on (ωU/Q_cav)", value: derived.P_tile_on },
    // ship-averaged power using d_eff
    { stage: "×N_tiles × d_eff", value: derived.P_ship_avg_calc_MW * 1e6 } // back in watts for consistency
  ];

  const massLadder: LadderDatum[] = [
    { stage: "|U_static|", value: Math.abs(derived.U_static) },
    { stage: "×γ_geo³",    value: derived.E_tile_geo3 },
    { stage: "×γ_VdB",     value: derived.E_tile_VdB },
    { stage: "×d_eff",     value: derived.E_tile_mass } // duty applied here (no Q_cav in mass)
  ];

  // ---------- Checkpoint logic ----------
  const within = (a: number, b: number, rel = 0.05, abs = 1e-9) => {
    if (!isFinite(a) || !isFinite(b)) return false;
    const d = Math.abs(a - b);
    const m = Math.max(Math.abs(a), Math.abs(b));
    return d <= Math.max(abs, rel * m);
  };

  // Theoretical Casimir per tile (already in derived)
  const casimirMatches = within(derived.U_static, derived.casimir_per_tile, 0.05, 1e-12);

  // Amplification steps vs backend-provided fields (if present)
  const geoStepOK  = within(state.U_geo ?? derived.U_geo, derived.U_geo, 0.01, 1e-12);
  const qStepOK    = within(state.U_Q   ?? derived.U_Q,   derived.U_Q,   0.01, 1e-12);

  // Duty presence & consistency (prefer authoritative metrics)
  const dutyPipeline = Number.isFinite(state.dutyEffective_FR ?? NaN) ? Number(state.dutyEffective_FR) : undefined;
  const dutyMetric   = Number.isFinite(_metricsAny?.dutyEffectiveFR ?? NaN) ? Number(_metricsAny.dutyEffectiveFR) : undefined;
  const dRef = Number.isFinite(d_eff) ? d_eff : dutyMetric ?? dutyPipeline ?? 0;
  const dutyOK = within(dRef, (dutyMetric ?? dRef), 0.001, 0) && within(dRef, (dutyPipeline ?? dRef), 0.001, 0);

  // Power & mass cross-checks against reported values
  const powerOK = (derived.P_ship_avg_report_MW > 0)
    ? within(derived.P_ship_avg_calc_MW, derived.P_ship_avg_report_MW, 0.10, 1e-6)
    : true; // if no report, don't fail

  const massOK = (derived.M_total_report > 0)
    ? within(derived.M_total_calc, derived.M_total_report, 0.10, 1e-9)
    : true;

  // Sectoring sanity
  const sectorTotal = (_metricsAny?.totalSectors ?? state.sectorStrobing ?? 0);
  const sectorOK = sectorTotal > 0 && Number.isFinite(sectorTotal);

  const checkpointRows: CheckRow[] = [
    { label: "Casimir per tile (theory vs backend)", state: casimirMatches ? "ok" : "fail",
      detail: casimirMatches ? "match ≤5%" : "mismatch >5%" },
    { label: "Amplification step ×γ_geo (power)", state: geoStepOK ? "ok" : "warn",
      detail: geoStepOK ? "backend matches" : "drift vs computed" },
    { label: "Amplification step ×q_mech (stored U)", state: qStepOK ? "ok" : "warn",
      detail: qStepOK ? "backend matches" : "drift vs computed" },
    { label: "Effective duty d_eff (Ford–Roman)", state: dutyOK ? "ok" : "fail",
      detail: dutyOK ? fmtNum(dRef, "", 5) : "mismatch/missing" },
    { label: "Ship power (calc vs report)", state: powerOK ? "ok" : "warn",
      detail: powerOK ? "≤10% drift" : "check calibration" },
    { label: "Exotic mass (calc vs report)", state: massOK ? "ok" : "warn",
      detail: massOK ? "≤10% drift" : "check γ_VdB calibration" },
    { label: "Sectoring in sync", state: sectorOK ? "ok" : "warn",
      detail: sectorOK ? `${sectorTotal} sectors` : "sector count unknown" },
  ];

  const equationsBlock = (
    <>
      <div>
        <div className="opacity-80">Casimir foundation</div>
        <div><EquationChip eq="u = -π² ħc / (720 a⁴)" /></div>
        <div className="mt-1">
          a = {fmtNum(derived.gap_m * 1e9, "nm", 2)}, ħc = {fmtNum(HBAR_C, "J·m", 2)} <br/>
          u = {fmtNum(derived.casimir_theory, "J/m³", 2)}, A = {fmtNum((state.tileArea_cm2 ?? 25) * 1e-4, "m²", 3)} <br/>
          U<sub>tile</sub> (theory) = u · A · a = {fmtNum(derived.casimir_per_tile, "J", 3)}
        </div>
      </div>
      <div>
        <div className="opacity-80">Power chain (per tile → ship)</div>
        <div><EquationChip eq="U_geo = U_static × γ_geo" /> <EquationChip eq="U_Q = U_geo × q_mech" /></div>
        <div><EquationChip eq="P_tile,on = ω · |U_Q| / Q_cav" /> <EquationChip eq="P_ship,avg = P_tile,on · N_tiles · d_eff" /></div>
        <div className="mt-1">
          ω = {fmtNum(omega, "rad/s", 2)}, Q<sub>cav</sub> = {fmtNum(qCav, "", 0)}, N = {fmtNum(derived?.N_tiles_internal ?? 0, "", 0)}, d<sub>eff</sub> = {fmtNum(dRef, "", 5)}
        </div>
      </div>
      <div>
        <div className="opacity-80">Mass chain (per tile → ship)</div>
        <div><EquationChip eq="E_tile = |U_static| × γ_geo³ × γ_VdB × d_eff" /></div>
        <div><EquationChip eq="M_total = (E_tile / c²) × N_tiles" /></div>
        <div className="mt-1">
          γ<sub>geo</sub> = {fmtNum(derived.gammaGeo, "", 2)}, γ<sub>VdB</sub> = {fmtNum(derived.gammaVdB, "", 2)}, c = {fmtNum(C, "m/s", 0)}
        </div>
      </div>
    </>
  );

  // --- Presentation-fit cavity specs synced with warp-bubble/pipeline (no hooks here) ---
  const tileArea_cm2 = Number.isFinite(state?.tileArea_cm2) ? Number(state!.tileArea_cm2) : 25;
  const gap_nm_display = Number.isFinite(state?.gap_nm) ? Number(state!.gap_nm) : 1;
  const sag_nm_display = Number.isFinite(state?.sag_nm) ? Number(state!.sag_nm) : 2.9;
  // Square tile: width(mm) = sqrt(cm²) * 10
  const tileWidthMM = Math.max(1, Math.sqrt(Math.max(0, tileArea_cm2)) * 10);

  // ───────────────── Legacy Layout (fallback if cohesive=false) ───────────
  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 select-text">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header & Mode Controls */}
        <Card className="bg-slate-900/60 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CircuitBoard className="w-6 h-6 text-blue-400"/>
                <span className="text-slate-100">HELIX-CORE Casimir Amplifier</span>
                <Badge variant="outline" className="text-xs">Pipeline-Driven Physics</Badge>
              </div>
              <div className="flex gap-2">
                {["hover", "cruise", "emergency", "standby"].map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={switchingMode || readOnly ? "outline" : "default"}
                    onClick={() => switchMode(mode)}
                    disabled={switchingMode || readOnly}
                    className="capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <Badge variant="secondary" className="justify-center">ζ = {fmtNum(_metricsAny?.fordRoman?.value, "", 3)}</Badge>
              <Badge variant={Number(_metricsAny?.timeScaleRatio ?? metrics?.timeScaleRatio ?? 0) > 1 ? "default" : "destructive"} className="justify-center">TS = {fmtNum(_metricsAny?.timeScaleRatio ?? metrics?.timeScaleRatio, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">γ_geo = {fmtNum(derived.gammaGeo, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">q_mech = {fmtNum(derived.qMech, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center" title={`source: ${provenance.gammaVdB_source}`}>γ_VdB = {fmtNum(derived.gammaVdB, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">Q_cav = {fmtNum(qCav, "", 0)}</Badge>
              <Badge variant="outline" className="justify-center">N = {fmtNum(derived?.N_tiles_internal ?? 0, "", 0)}</Badge>
              <Badge variant="outline" className="justify-center">P = {fmtNum(P_MW_badge, "MW", 2)}</Badge>
              <Badge variant="outline" className="justify-center">M = {fmtNum(M_kg_badge, "kg", 0)}</Badge>
            </div>

            {/* Debug info for troubleshooting N=0, P=0, M=0 issues */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2 text-xs">
                <summary className="text-slate-400 cursor-pointer">Debug Data Sources</summary>
                <div className="mt-1 p-2 bg-slate-800/20 rounded text-slate-300 font-mono">
                  <div>N_tiles: {N_tiles} (hud:{hud.tilesTotal}, state:{state?.N_tiles}, metrics:{metrics?.totalTiles})</div>
                  <div>P_MW: {P_MW_badge.toFixed(3)} (hud:{hud.powerMW}, metrics:{metrics?.energyOutput}, state:{state?.P_avg})</div>
                  <div>M_kg: {M_kg_badge.toFixed(0)} (hud:{hud.exoticMassKg}, metrics:{metrics?.exoticMass}, state:{state?.M_exotic})</div>
                </div>
              </details>
            )}

            {/* Time-Evolving Cavity Physics Display */}
            {lc && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="mb-2 text-xs text-slate-400 font-mono uppercase tracking-wide">Cavity Dynamics (Phase-Locked)</div>
                <div className="grid grid-cols-3 gap-3 text-[10px] font-mono">
                  <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                    <div className="text-slate-400 mb-0.5">τ_LC</div>
                    <div className="text-slate-200">{fmtNum(lc?.tauLC_ms, "", 3)} ms</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                    <div className="text-slate-400 mb-0.5">τ_Q</div>
                    <div className="text-slate-200">{(tauQ_s * 1e3).toFixed(1)} ms</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                    <div className="text-slate-400 mb-0.5">U(t)/U∞</div>
                    <div className="text-slate-200">{(U / Math.max(1e-12, Number.isFinite(U_inf) ? U_inf : 1e-6)).toFixed(3)}</div>
                  </div>
                </div>

                {/* Energy bar driven by U(t)/U∞ so it matches the number */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        onDisplay ? 'bg-cyan-400' : 'bg-slate-600'
                      }`}
                      style={{ width: `${Math.min(100, (U / Math.max(1e-12, Number.isFinite(U_inf) ? U_inf : 1e-6)) * 100)}%` }}
                    />
                  </div>
                  <Badge 
                    variant={lc.onWindowDisplay ? "default" : "secondary"} 
                    className={`text-xs ${
                      lc.onWindowDisplay ? 'bg-cyan-500 text-white' : 'bg-slate-600 text-slate-200'
                    }`}
                  >
                    {lc.onWindowDisplay ? 'ON' : 'OFF'}
                  </Badge>
                </div>

                {/* Instantaneous per-tile power display */}
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="mb-2 text-xs text-slate-400 font-mono uppercase tracking-wide">Per-Tile Instantaneous Power</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      lc?.onWindowDisplay ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/40 text-slate-300"
                    }`}>
                      {lc?.onWindowDisplay ? "ON" : "OFF"}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {derived?.isBurstMeaningful ? `${fmtNum(derived.P_tile_instant_W, "W")}` : "insufficient cycles"}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* NEW: Casimir → Amplifier Checkpoints */}
        <CheckpointCard
          title="Casimir → Amplifier Checkpoints"
          rows={checkpointRows}
          equations={equationsBlock}
        />

        {/* Casimir Foundation */}
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Sigma className="w-5 h-5"/>
              Casimir Energy Density Foundation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <EquationChip eq="u = -π² ħc / (720 a⁴)" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>Gap (a): <span className="text-slate-300">{fmtNum(derived.gap_m * 1e9, "nm", 1)}</span></div>
                  <div>Tile Area: <span className="text-slate-300">{fmtNum(state.tileArea_cm2, "cm²", 1)}</span></div>
                  <div>Theory u: <span className="text-slate-300">{fmtNum(derived.casimir_theory, "J/m³", 2)}</span></div>
                  <div>Per Tile: <span className="text-slate-300">{fmtNum(derived.casimir_per_tile, "J", 2)}</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-slate-300">Backend U_static/tile: <span className="font-mono">{fmtNum(derived.U_static, "J", 3)}</span></div>
                <div className="text-xs text-slate-400">
                  Theory match: {Math.abs((derived.U_static - derived.casimir_per_tile) / derived.casimir_per_tile * 100) < 5 ? "✓ Good" : "⚠ Check units"}
                </div>
              </div>
            </div>

            {/* Legacy single-view cavity removed in favor of split layout */}
          </CardContent>
        </Card>

        {/* Amplification Ladders */}
        <div className="grid lg:grid-cols-2 gap-6">
          <LadderChart title="Power Chain (Per Tile → Ship)" unit="W" data={powerLadder} />
          <LadderChart title="Energy Chain (Per Tile → Ship Avg)" unit="J" data={massLadder} />
        </div>

        {/* Pipeline Cross-checks */}
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <ShieldCheck className="w-5 h-5"/>
              Pipeline Cross-checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-slate-200">Power Verification</h4>
                <div className="space-y-1 text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>P_tile (instantaneous):</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      lc?.onWindowDisplay ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/40 text-slate-300"
                    }`}>
                      {lc?.onWindowDisplay ? "ON" : "OFF"}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {derived?.isBurstMeaningful
                        ? `${fmtNum(derived.P_tile_instant_W, "W")}`
                        : "OFF · insufficient cycles"}
                    </span>
                  </div>
                  <div>P_ship (calc): {fmtNum(derived.P_ship_avg_calc_MW, "MW", 2)}</div>
                  <div>P_ship (report): {fmtNum(derived.P_ship_avg_report_MW, "MW", 2)}</div>
                  <div className="text-xs text-slate-400">
                    Match: {Math.abs((derived.P_ship_avg_calc_MW - derived.P_ship_avg_report_MW) / derived.P_ship_avg_report_MW * 100) < 10 ? "✓ Good" : "⚠ Check calibration"}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-slate-200">Mass Verification</h4>
                <div className="space-y-1 text-slate-300">
                  <div>M_tile: {fmtNum(derived.M_tile, "kg", 6)}</div>
                  <div>M_total (calc): {fmtNum(derived.M_total_calc, "kg", 0)}</div>
                  <div>M_total (report): {fmtNum(derived.M_total_report, "kg", 0)}</div>
                  <div className="text-xs text-slate-400">
                    Match: {Math.abs((derived.M_total_calc - derived.M_total_report) / derived.M_total_report * 100) < 10 ? "✓ Good" : "⚠ Check calibration"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacuum-gap sweep results */}
        <Card className="bg-slate-900/60 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <RadioReceiver className="w-5 h-5 text-emerald-300" />
                Vacuum-Gap Sweep (Nb3Sn Pump Bias)
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-3">
              <section className="xl:col-span-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-300" />
                    Gain Heatmap
                  </h3>
                  <div className="flex flex-col items-end gap-1 text-[11px] text-slate-400">
                    <span className="uppercase tracking-wide">
                      Click a cell to focus top gain
                    </span>
                    {guardSummary ? (
                      <span className="text-amber-300 normal-case">{guardSummary}</span>
                    ) : null}
                    {downsampleSummary ? (
                      <span className="text-amber-300 normal-case">{downsampleSummary}</span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Each tile shows the strongest gain observed at the selected gap and pump frequency.
                </p>
                <div className="mt-4">
                  <VacuumGapHeatmap rows={heatmapRows} onCellClick={handleHeatmapCellClick} />
                </div>
                {!sweepRowsVisible && (
                  <div className="mt-3 text-xs text-slate-500">
                    Sweep data will appear here after the next run completes.
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <ScanSearch className="w-4 h-4 text-sky-300" />
                    Ridge Capture
                  </h3>
                  {ridgePresets.length > 0 && (
                    <span className="text-[11px] text-emerald-300">
                      {ridgePresets.length} staged
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Stage the highest-gain rows to share with drive sync. Adjust the window and capture top performers.
                </p>
                <label className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="uppercase tracking-wide text-slate-400">Top-N Window</span>
                  <Input
                    type="number"
                    min={1}
                    max={64}
                    value={topN}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      const next = Number.isFinite(value) ? value : 1;
                      setTopN(Math.min(64, Math.max(1, Math.round(next))));
                    }}
                    className="h-8 w-20 bg-slate-900/60 border-slate-700 text-xs"
                  />
                </label>
                <Button size="sm" onClick={handleCaptureRidge} disabled={!sweepResults.length}>
                  Capture Ridge Presets
                </Button>
                {sweepRowsDropped > 0 && (
                  <p className="text-xs text-amber-300">
                    Guard active: presets consider the last {formatCount(sweepRowsVisible)} rows from{" "}
                    {formatCount(sweepRowsTotal)} total.
                  </p>
                )}
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <section className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-slate-300" />
                  CSV Export
                </h3>
                <p className="text-xs text-slate-400">
                  Download every sweep row for offline analysis or archival. The export mirrors the on-screen dataset.
                </p>
                <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={!sweepResults.length}>
                  Download Gain Sweep CSV
                </Button>
                {sweepRowsDropped > 0 && (
                  <p className="text-xs text-amber-300">
                    Guard active: export includes the last {formatCount(sweepRowsVisible)} rows of{" "}
                    {formatCount(sweepRowsTotal)}.
                  </p>
                )}
              </section>

              <section className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-3 xl:col-span-1">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-300" />
                  Sweep Replay
                </h3>
                <p className="text-xs text-slate-400">
                  Step through the recorded sweep to revisit each measurement in order.
                </p>
                <SweepReplayControls rows={replayRows} onStep={handleReplayStep} />
                {replayRows !== sweepResults && replayRows.length > 0 && (
                  <div className="text-xs text-amber-300">
                    Replay trimmed to {formatCount(replayRows.length)} samples for stability.
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-rose-300" />
                  Hardware Sweep
                </h3>
                <p className="text-xs text-slate-400">
                  Execute the sweep against the configured pump driver. Replace the server adapter to wire real hardware.
                </p>
                <Button
                  size="sm"
                  className={`w-full ${
                    sweepActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                  onClick={sweepActive ? handleCancelSlew : handleHardwareSlew}
                  disabled={(readOnly && !sweepActive) || sweepCancelRequested}
                >
                  {sweepActive
                    ? sweepCancelRequested
                      ? "Stopping..."
                      : "Stop Sweep"
                    : "Run Sweep with Hardware Slew"}
                </Button>
                <VacuumGapSweepHUD className="pt-2 border-t border-slate-800/60" />
              </section>
            </div>

            {selectedSweepRow && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/10 px-4 py-3 text-xs text-emerald-200 space-y-0.5">
                <span className="font-semibold mr-2 text-emerald-300 uppercase tracking-wide">Focused Row</span>
                <div className="font-mono">
                  d={selectedSweepRow.d_nm.toFixed(1)} nm |
                  {" "}m={(selectedSweepRow.m * 100).toFixed(2)}% |
                  {" "}Omega={selectedSweepRow.Omega_GHz.toFixed(3)} GHz |
                  {" "}phi={selectedSweepRow.phi_deg.toFixed(2)} deg |
                  {" "}G={selectedSweepRow.G.toFixed(2)} dB |
                  {" "}QL={(Number.isFinite(selectedSweepRow.QL) ? selectedSweepRow.QL! : selectedSweepRow.QL_base ?? 0).toExponential(2)} |
                  {" "}S={selectedSweepRow.dB_squeeze != null ? selectedSweepRow.dB_squeeze.toFixed(2) : "—"} dB |
                  {" "}ΔU={selectedSweepRow.deltaU_cycle_J != null ? selectedSweepRow.deltaU_cycle_J.toExponential(2) : "—"} J |
                  {" "}Noise={selectedSweepRow.noiseTemp_K != null ? selectedSweepRow.noiseTemp_K.toExponential(2) : "—"} K |
                  {" "}Plateau Width={selectedSweepRow.plateau?.width_deg != null ? selectedSweepRow.plateau.width_deg.toFixed(2) : "—"} deg |
                  {" "}{selectedSweepRow.crest ? "CREST" : selectedSweepRow.plateau ? "PLATEAU" : selectedSweepRow.stable ? "stable" : "warning"}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-700/60 bg-slate-900/40">
              <div className="flex items-center justify-between border-b border-slate-700/70 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Table className="w-4 h-4 text-slate-300" />
                  Sweep Result Set
                </h3>
                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                  Showing {formatCount(displayedSweepRows.length)} of {formatCount(sweepRowsVisible)} rows
                  {sweepRowsTotal > sweepRowsVisible
                    ? ` (guard keeps last ${formatCount(sweepRowsVisible)} of ${formatCount(sweepRowsTotal)})`
                    : ""}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left text-slate-300">
                  <thead className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="py-2 pr-4">Gap (nm)</th>
                      <th className="py-2 pr-4">m (%)</th>
                      <th className="py-2 pr-4">Pump (GHz)</th>
                      <th className="py-2 pr-4">Phase (deg)</th>
                      <th className="py-2 pr-4">Gain (dB)</th>
                      <th className="py-2 pr-4">Q<sub>L</sub></th>
                      <th className="py-2 pr-4">Stable</th>
                      <th className="py-2 pr-4">Squeezing (dB)</th>
                      <th className="py-2 pr-4">DeltaU/cycle (J)</th>
                      <th className="py-2 pr-4">Noise Temp (K)</th>
                      <th className="py-2 pr-4">Plateau Width (deg)</th>
                      <th className="py-2 pr-4">Bias phi* (deg)</th>
                      <th className="py-2 pr-4">Neg-E Proxy</th>
                      <th className="py-2 pr-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSweepRows.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-slate-500" colSpan={14}>
                          No sweep data available yet.
                        </td>
                      </tr>
                    ) : (
                      displayedSweepRows.map((row, idx) => {
                        const isSelected =
                          !!selectedSweepRow &&
                          row.d_nm === selectedSweepRow.d_nm &&
                          row.m === selectedSweepRow.m &&
                          row.Omega_GHz === selectedSweepRow.Omega_GHz &&
                          row.phi_deg === selectedSweepRow.phi_deg;
                        const crestRow = row.crest;
                        const plateau = row.plateau;
                        const qDisplay = Number.isFinite(row.QL) ? row.QL! : row.QL_base ?? null;
                        const rowTone = isSelected
                          ? "bg-emerald-900/40"
                          : crestRow
                          ? "bg-emerald-900/15 hover:bg-emerald-900/25"
                          : plateau
                          ? "bg-indigo-900/10 hover:bg-indigo-900/20"
                          : "hover:bg-slate-800/40";
                        return (
                          <tr
                            key={`${row.d_nm}-${row.Omega_GHz}-${row.phi_deg}-${idx}`}
                            className={`border-b border-slate-800/60 transition-colors ${rowTone}`}
                            onClick={() => setSelectedSweepRow(row)}
                          >
                            <td className="py-1.5 pr-4 font-mono">{row.d_nm.toFixed(1)}</td>
                            <td className="py-1.5 pr-4 font-mono">{(row.m * 100).toFixed(2)}</td>
                            <td className="py-1.5 pr-4 font-mono">{row.Omega_GHz.toFixed(3)}</td>
                            <td className="py-1.5 pr-4 font-mono">{row.phi_deg.toFixed(2)}</td>
                            <td className={`py-1.5 pr-4 font-mono ${row.G > 0 ? "text-emerald-300" : "text-slate-300"}`}>
                              {row.G.toFixed(2)}
                            </td>
                            <td className="py-1.5 pr-4 font-mono">
                              {fmtExp(qDisplay)}
                            </td>
                            <td className="py-1.5 pr-4">
                              <span className={row.stable ? "text-emerald-400" : "text-amber-400"}>
                                {row.stable ? "PASS" : "WARN"}
                              </span>
                            </td>
                            <td className="py-1.5 pr-4 font-mono">
                              {fmtFixed(row.dB_squeeze, 2)}
                            </td>
                            <td className="py-1.5 pr-4 font-mono">
                              {fmtExp(row.deltaU_cycle_J)}
                            </td>
                            <td className="py-1.5 pr-4 font-mono">
                              {fmtExp(row.noiseTemp_K)}
                            </td>
                            <td className="py-1.5 pr-4 font-mono">
                              {fmtFixed(plateau?.width_deg, 2)}
                            </td>
                            <td className="py-1.5 pr-4 font-mono">
                              {fmtFixed(crestRow ? row.phi_deg : null, 2)}
                            </td>
                            <td className="py-1.5 pr-4 font-mono">
                              {fmtFixed(row.negEnergyProxy, 3)}
                            </td>
                            <td className="py-1.5 pr-4 text-slate-400">
                              {row.notes?.length ? row.notes.join("; ") : "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
          </Card>

        {/* Displacement Field Heatmap */}
        <DisplacementHeatmap endpoint={fieldEndpoint} metrics={metrics} state={state} />

      </div>
    </div>
  );
}






