import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Activity, Zap, Sigma, Atom, Gauge, RadioReceiver, Thermometer, CircuitBoard, ScanSearch, ShieldCheck } from "lucide-react";
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

const HBAR_C = 1.98644586e-25; // J·m
const PI = Math.PI;
const C = 299_792_458;
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

function usePolling<T>(url: string, ms = 1500, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        if (!alive) return;
        setData(json);
        setErr(null);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "fetch failed");
      }
    }
    tick();
    const id = setInterval(tick, ms);
    return () => { alive = false; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, err } as const;
}

// ------------------------- Heatmap (displacement) -------------------------

type FieldSample = { p: [number, number, number]; bell: number; sgn: number; disp: number };

type FieldResponse = {
  count: number;
  data: FieldSample[];
  physics: { gammaGeo: number; qSpoiling: number; sectorStrobing: number };
};

function DisplacementHeatmap({ endpoint }: { endpoint: string }) {
  const [params, setParams] = useState({ nTheta: 128, nPhi: 64, sectors: 400, split: 200 });
  const q = new URLSearchParams({
    nTheta: String(params.nTheta),
    nPhi: String(params.nPhi),
    sectors: String(params.sectors),
    split: String(params.split)
  }).toString();
  const { data } = usePolling<FieldResponse>(`${endpoint}?${q}`, 2500, [endpoint, q]);
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

    // Compute min/max of disp for scaling
    let min = Infinity, max = -Infinity;
    for (const s of data.data) { min = Math.min(min, s.disp); max = Math.max(max, s.disp); }
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
        const s = data.data[idx++];
        ctx.fillStyle = colormap(s.disp);
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
    <Card className="bg-slate-900/40 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-slate-100"><ScanSearch className="w-5 h-5"/> Displacement Field (Natário bell)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
        <p className="text-xs text-slate-400">Heatmap shows signed displacement amplitude on the ellipsoidal shell; white line marks the +/− sector split. Colormap is blue (−) → red (+).</p>
      </CardContent>
    </Card>
  );
}

// -------------------------- Amplification ladders -------------------------

type LadderDatum = { stage: string; value: number };

function LadderChart({ title, unit, data }: { title: string; unit: string; data: LadderDatum[] }) {
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

function EquationChip({ eq }: { eq: string }) {
  return <code className="px-2 py-1 rounded-md bg-slate-800/70 text-slate-200 text-xs font-mono border border-slate-700">{eq}</code>;
}

// ------------------------------- Main UI ----------------------------------

export default function HelixCasimirAmplifier({
  metricsEndpoint = "/api/helix/metrics",
  stateEndpoint = "/api/helix/state",
  fieldEndpoint = "/api/helix/displacement",
  modeEndpoint = "/api/helix/mode",
  lightCrossing
}: {
  metricsEndpoint?: string;
  stateEndpoint?: string;
  fieldEndpoint?: string;
  modeEndpoint?: string;
  lightCrossing?: LightCrossing;
}) {
  const { data: metrics } = usePolling<HelixMetrics>(metricsEndpoint, 1500, [metricsEndpoint]);
  const { data: state }   = usePolling<EnergyPipelineState>(stateEndpoint, 3000, [stateEndpoint]);

  // Time-evolving cavity energy system using shared light-crossing loop
  const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  
  const qCav = isFiniteNumber(state?.qCavity) ? state.qCavity : 1e9;
  // Single authoritative frequency source
  const fGHz = isFiniteNumber(state?.modulationFreq_GHz) ? state!.modulationFreq_GHz : 
               (lightCrossing?.freqGHz ?? 15);
  const f = fGHz * 1e9;
  const omega = 2 * Math.PI * f;
  const tauQ_s = qCav / (2 * Math.PI * f); // cavity time constant: τ = Q/(2πf)

  // derived quantities (robust to partial data)
  const derived = useMemo(() => {
    if (!state || !metrics) return null;

    const U_static = state.U_static;                 // J per tile (signed)
    const gammaGeo = state.gammaGeo;
    const qMech    = state.qMechanical ?? 1;         // mechanical gain/Q-factor (consider renaming to mechGain)
    const d_eff    = metrics.dutyEffectiveFR ?? 0;   // authoritative duty for FR & ship averaging
    const N_tiles  = state.N_tiles ?? metrics.totalTiles;

    // Power chain (per tile → ship)
    const U_geo    = U_static * gammaGeo;            // note: power chain uses γ^1 (as in backend)
    const U_Q      = U_geo * qMech;                  // per tile (ON-window stored energy proxy)
    const U_cycle  = U_Q * d_eff;                    // per tile average contribution

    const P_tile_on = (omega * Math.abs(U_Q)) / qCav;  // W per tile during ON (P = ωU/Q)
    const P_ship_avg_calc_MW = (P_tile_on * N_tiles * d_eff) / 1e6;
    const P_ship_avg_report_MW = state.P_avg;           // authoritative from backend calibration

    // Mass chain (per tile energy that maps to exotic mass via E/c^2)
    const geo3    = Math.pow(gammaGeo, 3);
    const E_tile_mass = Math.abs(U_static) * geo3 * qCav * (state.gammaVanDenBroeck ?? metrics.gammaVanDenBroeck) * d_eff;
    const M_tile = E_tile_mass / (C * C);               // kg per tile
    const M_total_calc = M_tile * N_tiles;
    const M_total_report = state.M_exotic ?? metrics.exoticMass;

    // Casimir foundation
    const gap_m = (state.gap_nm ?? 16) * 1e-9;
    const tileA_m2 = (state.tileArea_cm2 ?? 25) * 1e-4;
    const casimir_theory = -(PI * PI / 720) * HBAR_C / Math.pow(gap_m, 4);  // theory prediction J/m³
    const casimir_per_tile = casimir_theory * tileA_m2 * gap_m;            // J per tile

    return {
      U_static, gammaGeo, qMech, d_eff, N_tiles, omega,
      U_geo, U_Q, U_cycle,
      P_tile_on, P_ship_avg_calc_MW, P_ship_avg_report_MW,
      geo3, E_tile_mass, M_tile, M_total_calc, M_total_report,
      gap_m, tileA_m2, casimir_theory, casimir_per_tile
    };
  }, [state, metrics, omega, qCav]);

  // Normalized steady-state target energy from pipeline (or fallback)
  const U_inf = (state?.U_cycle ?? 1) * 1; // arbitrary scale -> keep consistent

  const [U, setU] = useState(0);  // cavity "stored" energy (relative units)
  const lastT = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const step = (t: number) => {
      if (!lightCrossing) { raf = requestAnimationFrame(step); return; }
      const on = lightCrossing.onWindow;          // τLC-safe ON window
      const now = t / 1000;                       // s
      const prev = lastT.current ?? now;
      const dt = Math.min(0.05, Math.max(0, now - prev)); // clamp dt for stability
      lastT.current = now;

      setU((U0) => {
        if (tauQ_s <= 0) return U0;
        const alpha = dt / tauQ_s;
        if (on) {
          // ring-up toward U_inf
          return U0 + (U_inf - U0) * (1 - Math.exp(-alpha));
        } else {
          // ring-down toward 0
          return U0 * Math.exp(-alpha);
        }
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [lightCrossing?.onWindow, tauQ_s, U_inf]);

  // Use U to drive visuals / numbers
  const pInstant = U / Math.max(1e-9, lightCrossing?.dwell_ms ?? 1); // arbitrary proportional readout

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

  // build ladder data
  const powerLadder: LadderDatum[] = [
    { stage: "|U_static|", value: Math.abs(derived.U_static) },
    { stage: "×γ_geo", value: Math.abs(derived.U_geo) },
    { stage: "×q_mech", value: Math.abs(derived.U_Q) },
    { stage: "×d_eff", value: Math.abs(derived.U_cycle) }
  ];

  const massLadder: LadderDatum[] = [
    { stage: "|U_static|", value: Math.abs(derived.U_static) },
    { stage: "×γ_geo³", value: Math.abs(derived.U_static) * derived.geo3 },
    { stage: "×Q_cav", value: Math.abs(derived.U_static) * derived.geo3 * qCav },
    { stage: "×γ_VdB", value: derived.E_tile_mass },
    { stage: "×d_eff", value: derived.E_tile_mass } // (×d_eff happens in E_tile_mass calc)
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6">
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
                    variant={switchingMode ? "outline" : "default"}
                    onClick={() => switchMode(mode)}
                    disabled={switchingMode}
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
              <Badge variant="secondary" className="justify-center">ζ = {fmtNum(metrics.fordRoman.value, "", 3)}</Badge>
              <Badge variant={metrics.timeScaleRatio > 1 ? "default" : "destructive"} className="justify-center">TS = {fmtNum(metrics.timeScaleRatio, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">γ_geo = {fmtNum(derived.gammaGeo, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">q_mech = {fmtNum(derived.qMech, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">γ_VdB = {fmtNum(state.gammaVanDenBroeck, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">N = {fmtNum(derived.N_tiles, "", 0)}</Badge>
              <Badge variant="outline" className="justify-center">P = {fmtNum(derived.P_ship_avg_report_MW, "MW", 2)}</Badge>
              <Badge variant="outline" className="justify-center">M = {fmtNum(derived.M_total_report, "kg", 0)}</Badge>
            </div>

            {/* Time-Evolving Cavity Physics Display */}
            {lightCrossing && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="mb-2 text-xs text-slate-400 font-mono uppercase tracking-wide">Cavity Dynamics (Phase-Locked)</div>
                <div className="grid grid-cols-3 gap-3 text-[10px] font-mono">
                  <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                    <div className="text-slate-400 mb-0.5">τ_LC</div>
                    <div className="text-slate-200">{(lightCrossing.tauLC_ms).toFixed(3)} ms</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                    <div className="text-slate-400 mb-0.5">τ_Q</div>
                    <div className="text-slate-200">{(tauQ_s * 1e3).toFixed(1)} ms</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                    <div className="text-slate-400 mb-0.5">U(t)/U∞</div>
                    <div className="text-slate-200">{(U / Math.max(1e-12, U_inf)).toFixed(3)}</div>
                  </div>
                </div>
                
                {/* Visual cavity energy bar with ON/OFF indication */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-100 ${
                        lightCrossing.onWindow ? 'bg-cyan-400' : 'bg-slate-600'
                      }`}
                      style={{ width: `${Math.min(100, (U / Math.max(1e-12, U_inf)) * 100)}%` }}
                    />
                  </div>
                  <Badge 
                    variant={lightCrossing.onWindow ? "default" : "secondary"} 
                    className={`text-xs ${
                      lightCrossing.onWindow ? 'bg-cyan-500 text-white' : 'bg-slate-600 text-slate-200'
                    }`}
                  >
                    {lightCrossing.onWindow ? 'ON' : 'OFF'}
                  </Badge>
                </div>
              </div>
            )}
            
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

        {/* Amplification Ladders */}
        <div className="grid lg:grid-cols-2 gap-6">
          <LadderChart title="Power Chain (Per Tile → Ship)" unit="J or W" data={powerLadder} />
          <LadderChart title="Mass Chain (Per Tile Energy)" unit="J or kg" data={massLadder} />
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
                  <div>P_tile (ON): {fmtNum(derived.P_tile_on, "W", 2)}</div>
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

        {/* Displacement Field Heatmap */}
        <DisplacementHeatmap endpoint={fieldEndpoint} />
        
      </div>
    </div>
  );
}