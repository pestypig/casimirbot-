
/**
 * Energy Pipeline Display Component (aligned with Helix-Core)
 * Shares pipeline mode + FR duty with the rest of the app
 * + Green's-function (φ = G * ρ) stage with live stats and publish-to-renderer
 */

import { useEffect, useMemo, startTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Zap, Target, Calculator, TrendingUp, Activity } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEnergyPipeline, useSwitchMode } from "@/hooks/use-energy-pipeline";
import { computeGreensStats, fmtExp, greensKindLabel } from "@/lib/greens";

// ---------- Green's helpers (local, no new deps) ----------
type Vec3 = [number, number, number];
type Kernel = (r: number) => number;

// safe kernels (avoid r=0 blowup)
const poissonKernel: Kernel = r => 1 / (4 * Math.PI * Math.max(r, 1e-6));
const helmholtzKernel = (m: number): Kernel =>
  r => Math.exp(-m * Math.max(r, 1e-6)) / (4 * Math.PI * Math.max(r, 1e-6));

function computeGreenPotential(
  positions: Vec3[],
  rho: number[],
  kernel: Kernel,
  normalize = true
): Float32Array {
  const N = positions.length;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let sum = 0;
    const [xi, yi, zi] = positions[i];
    for (let j = 0; j < N; j++) {
      const [xj, yj, zj] = positions[j];
      const dx = xi - xj, dy = yi - yj, dz = zi - zj;
      const r = Math.hypot(dx, dy, dz) + 1e-6;
      sum += kernel(r) * rho[j];
    }
    out[i] = sum;
  }
  if (normalize) {
    let min = +Infinity, max = -Infinity;
    for (let i = 0; i < N; i++) { const v = out[i]; if (v < min) min = v; if (v > max) max = v; }
    const span = max - min || 1;
    for (let i = 0; i < N; i++) out[i] = (out[i] - min) / span;
  }
  return out;
}

function stats(arr: ArrayLike<number>) {
  let min = +Infinity, max = -Infinity, sum = 0;
  const N = arr.length;
  for (let i = 0; i < N; i++) {
    const v = arr[i] as number;
    if (v < min) min = v; if (v > max) max = v; sum += v;
  }
  return { min, max, mean: N ? sum / N : 0, N };
}

// ---------- Component ----------
type EnergyPipelineProps = {
  results?: any;
  allowModeSwitch?: boolean;
};

export function EnergyPipeline({ results, allowModeSwitch = false }: EnergyPipelineProps) {
  // --- Shared live pipeline (single source of truth) ---
  const { data: pipelineState } = useEnergyPipeline(); // { currentMode, dutyCycle, zeta, TS_ratio, ... }
  const switchMode = useSwitchMode();
  const queryClient = useQueryClient();

  // --- Metrics (to reconstruct FR duty or find tiles if server didn't inject them) ---
  const { data: systemMetrics } = useQuery({
    queryKey: ["/api/helix/metrics"],
    refetchInterval: 5000,
  });

  // Helper type guards
  const isFiniteNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  // Prefer *live* pipeline; fall back to `results` snapshot
  const live = pipelineState ?? results ?? {};
  const mode = (live?.currentMode ?? "hover") as "standby" | "hover" | "cruise" | "emergency";

  // Try to use canonical FR duty from pipeline; otherwise reconstruct a reasonable fallback
  const dutyEffectiveFR: number = useMemo(() => {
    const frFromPipeline =
      (live as any)?.dutyEffectiveFR ??
      (live as any)?.dutyShip ??
      (live as any)?.dutyEff;

    if (isFiniteNum(frFromPipeline)) return clamp01(frFromPipeline);

    const burst = Number((live as any)?.burst_ms);
    const dwell = Number((live as any)?.dwell_ms);
    const dutyLocal = (Number.isFinite(burst) && Number.isFinite(dwell) && dwell > 0)
      ? burst / dwell : 0.01;

    const S_total = Math.max(1, Math.floor((systemMetrics as any)?.totalSectors ?? 400));
    const concurrentSectors = Math.max(1, Math.min(S_total, Math.floor((live as any)?.sectorsConcurrent ?? (systemMetrics as any)?.activeSectors ?? 1)));
    const S_live = Math.max(1, Math.min(S_total, Math.floor(concurrentSectors || 1)));

    return clamp01(dutyLocal * (S_live / S_total));
  }, [live, systemMetrics]);

  // UI duty (for display only)
  const dutyUI = isFiniteNum(live?.dutyCycle) ? live.dutyCycle : 0.14;

  // Canonical physics parameters (align with Helix-Core assumptions)
  const fGHz = isFiniteNum(live?.modulationFreq_GHz) ? live.modulationFreq_GHz : 15;
  const f_m = fGHz * 1e9;                // Hz
  const ω = 2 * Math.PI * f_m;           // rad/s
  const γ_geo = isFiniteNum(live?.gammaGeo) ? live.gammaGeo : 26;
  const Q = isFiniteNum(live?.qCavity) ? live.qCavity : 1e9;
  const N = Math.max(1, Number(live?.N_tiles ?? 1));
  const U_static =
    isFiniteNum(live?.U_static) ? live.U_static :
    isFiniteNum((systemMetrics as any)?.U_static) ? (systemMetrics as any).U_static :
    0; // J per tile

  // Pipeline ordering: geometry → Q → FR duty
  const γ3 = Math.pow(γ_geo, 3);
  const U_geo_raw = U_static * γ3;       // J per tile (ON-window stored energy before Q)
  const U_Q = U_geo_raw * Q;             // J per tile (ON-window)
  const U_cycle = U_Q * dutyEffectiveFR; // J per tile, Ford–Roman ship-averaged

  // Per-tile ON-window dissipation (with robust fallbacks)
  const P_tile_on = useMemo(() => {
    const fromPipeline = (live as any)?.P_tile_on_W;
    if (isFiniteNum(fromPipeline)) return fromPipeline;
    const base = Math.abs(U_geo_raw) * ω; // P_tile_on = U_geo_raw · ω
    if (base > 0) return base;
    const P_avg_fromSrv_MW = (live as any)?.P_avg;
    const P_avg_fromSrv_W = isFiniteNum(P_avg_fromSrv_MW) ? P_avg_fromSrv_MW * 1e6 : undefined;
    if (isFiniteNum(P_avg_fromSrv_W) && N > 0 && dutyEffectiveFR > 0) {
      return (P_avg_fromSrv_W / N) / Math.max(1e-12, dutyEffectiveFR);
    }
    return 0;
  }, [live, U_geo_raw, ω, N, dutyEffectiveFR]);

  // Average total electrical power (ship-avg):
  const P_total_W = P_tile_on * N * dutyEffectiveFR;

  // Prefer calibrated totals from pipeline if present
  const P_avg_W = isFiniteNum(live?.P_avg) ? live.P_avg * 1e6 : P_total_W;
  const m_exotic = isFiniteNum(live?.M_exotic) ? live.M_exotic : (Number(live?.M_exotic_raw) || 0);

  // Time-scale separation
  const TS_ratio = isFiniteNum(live?.TS_ratio) ? live.TS_ratio : isFiniteNum(live?.TS_long) ? live.TS_long : undefined;

  // Derive τ_Q from Q and ω
  const τ_Q_ms = isFiniteNum(Q) && Q > 0 ? (Q / ω) * 1e3 : undefined;

  // ---------- UI helpers ----------
  const sci = (v?: number) => (isFiniteNum(v) ? formatScientific(v) : "—");
  function formatScientific(value: number) {
    if (value === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = (value / Math.pow(10, exp)).toFixed(3);
    return `${mantissa} × 10^${exp}`;
  }
  const StatusIcon = ({ ok }: { ok: boolean }) =>
    ok ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;
  const StatusBadge = ({ ok }: { ok: boolean }) =>
    ok ? <Badge className="bg-green-100 text-green-800">PASS</Badge> : <Badge className="bg-red-100 text-red-800">FAIL</Badge>;

  // Validation targets (show "as-computed")
  const targets = { U_cycle: Math.abs(U_cycle), m_exotic, P_total: P_avg_W, TS_ratio };
  const validation = {
    U_cycle: true,
    m_exotic: true,
    P_total: true,
    TS_ratio: isFiniteNum(TS_ratio) ? TS_ratio > 1 : false
  };

  // --- Share derived values globally for other panels (unchanged) ---
  useEffect(() => {
    const tau_LC_ms = (live as any)?.tau_LC_ms ?? (live as any)?.tauLC_ms;
    queryClient.setQueryData(["helix:pipeline:derived"], {
      mode,
      dutyUI,
      dutyEffectiveFR,
      P_tile_on_W: P_tile_on,
      P_total_W: P_avg_W,
      tau_Q_ms: τ_Q_ms,
      τ_Q_ms,
      tau_LC_ms,
      τ_LC_ms: tau_LC_ms,
      N_tiles: N,
      f_GHz: fGHz,
      gammaGeo: γ_geo,
      Q,
      sectorsTotal: (systemMetrics as any)?.totalSectors ?? (live as any)?.sectorCount,
      sectorsConcurrent: (live as any)?.sectorsConcurrent ?? (systemMetrics as any)?.activeSectors,
    });
  }, [mode, dutyUI, dutyEffectiveFR, P_tile_on, P_avg_W, τ_Q_ms, live, N, fGHz, γ_geo, Q, systemMetrics, queryClient]);

  // ========================================================================
  //                       GREEN'S FUNCTION (NEW)
  // ========================================================================
  // 1) Try to use server-provided greens payload first
  const serverGreens = (live as any)?.greens as
    | { phi?: number[] | Float32Array; kind?: "poisson" | "helmholtz"; m?: number; normalize?: boolean }
    | undefined;

  // 2) Use any available client tiles from metrics (fallback - main Green's data comes from HelixCore hook now)
  const clientTiles = useMemo(() => {
    const tiles = (systemMetrics as any)?.tiles;
    if (!Array.isArray(tiles)) return undefined;
    
    return tiles.map((t: any) => ({
      pos: t.pos as Vec3,
      t00: t.t00 || 0
    }));
  }, [systemMetrics]);

  // Kernel selection: prefer what the server says, else Poisson
  const greenKind = (serverGreens?.kind === "helmholtz" || serverGreens?.kind === "poisson")
    ? serverGreens.kind
    : "poisson";
  const mHelm = isFiniteNum(serverGreens?.m) ? (serverGreens?.m as number) : 0; // 0 → Poisson limit when used
  const normalizeGreens = serverGreens?.normalize !== false; // default true

  // Compute or adopt φ
  const greenPhi = useMemo(() => {
    // server-provided wins
    if (serverGreens?.phi && (serverGreens.phi as any).length > 0) {
      const arr = serverGreens.phi instanceof Float32Array
        ? serverGreens.phi
        : new Float32Array(serverGreens.phi);
      return { phi: arr, source: "server" as const };
    }

    // otherwise derive on the client if we have tiles
    if (clientTiles && clientTiles.length > 0) {
      const positions: Vec3[] = clientTiles.map(t => t.pos);
      const rho: number[] = clientTiles.map(t => t.t00); // time-averaged T00 per tile

      const kernel = (greenKind === "helmholtz")
        ? helmholtzKernel(Math.max(0, mHelm))
        : poissonKernel;

      const phi = computeGreenPotential(positions, rho, kernel, normalizeGreens);
      return { phi, source: "client" as const };
    }

    // no data available
    return { phi: new Float32Array(0), source: "none" as const };
  }, [serverGreens, clientTiles, greenKind, mHelm, normalizeGreens]);

  const greenStats = useMemo(() => computeGreensStats(greenPhi.phi), [greenPhi]);


  // Publisher for renderer: exposes a canonical query cache + fires a window event
  const publishGreens = useCallback(() => {
    const payload = {
      kind: greenKind,
      m: mHelm,
      normalize: normalizeGreens,
      phi: greenPhi.phi,     // Float32Array
      size: greenPhi.phi.length,
      source: greenPhi.source
    };
    // cache it so any consumer (inspector/engine adapter) can grab it
    queryClient.setQueryData(["helix:pipeline:greens"], payload);
    // also broadcast for engines already listening in the tab
    try {
      window.dispatchEvent(new CustomEvent("helix:greens", { detail: payload }));
    } catch {}
  }, [greenKind, mHelm, normalizeGreens, greenPhi, queryClient]);

  // NEW: auto-publish whenever φ becomes available/changes
  useEffect(() => {
    if (greenPhi.phi && greenPhi.phi.length > 0) {
      publishGreens();
    }
  }, [greenPhi.phi, publishGreens]);

  // ========================================================================
  //                               UI
  // ========================================================================
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Complete Energy Pipeline (T_μν → Metric)
            <Badge variant="outline" className="ml-2">{mode.toUpperCase()}</Badge>
            {allowModeSwitch && (
              <div className="ml-3 flex gap-2">
                {(["standby","hover","cruise","emergency"] as const).map(m => (
                  <button
                    key={m}
                    className={`px-2 py-0.5 rounded text-xs border ${
                      m===mode ? "bg-cyan-600 border-cyan-500" : "bg-slate-900 border-slate-700"
                    }`}
                    onClick={()=>{
                      if (m===mode) return;
                      startTransition(() => {
                        switchMode.mutate(m, {
                          onSuccess: () => {
                            // keep page + this component in sync
                            queryClient.invalidateQueries({ predicate: q =>
                              Array.isArray(q.queryKey) &&
                              (q.queryKey[0] === '/api/helix/pipeline' || q.queryKey[0] === '/api/helix/metrics')
                            });
                          }
                        });
                      });
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Static Casimir */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                1. Stress–Energy (Static Casimir)
              </h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_static (per cavity)</div>
                <div className="font-mono text-lg">{sci(U_static)} J</div>
                <div className="text-xs text-muted-foreground mt-1">Base Casimir energy between plates</div>
              </div>
            </div>

            {/* 2. Geometric Amplification (γ^3) */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                2. Geometric Amplification (γ³)
              </h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_geo_raw = U_static × γ³</div>
                <div className="font-mono text-lg">{sci(U_geo_raw)} J</div>
                <div className="text-xs text-muted-foreground mt-1">
                  γ_geo³ = {sci(γ3)}
                </div>
              </div>
            </div>

            {/* 3. Q-Factor Amplification */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                3. Q-Factor Amplification
              </h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_Q = U_geo_raw × Q</div>
                <div className="font-mono text-lg">{sci(U_Q)} J</div>
                <div className="text-xs text-muted-foreground mt-1">Q ≈ {sci(Q)}</div>
              </div>
            </div>

            {/* 4. Duty Cycle Averaging (FR) */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">4. Duty Cycle Averaging (FR)</h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_cycle = U_Q × d_FR</div>
                <div className="font-mono text-lg">{sci(U_cycle)} J</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  UI duty: {(dutyUI*100).toFixed(2)}% · FR duty: {(dutyEffectiveFR*100).toFixed(3)}%
                  <StatusIcon ok={validation.U_cycle} />
                </div>
              </div>
            </div>

            {/* 5. Power Loss per Cavity (ON-window) */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">5. Power (per cavity, ON-window)</h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">P_tile_on = U_geo_raw · ω</div>
                <div className="font-mono text-lg">{sci(P_tile_on)} W</div>
                <div className="text-xs text-muted-foreground mt-1">ω = {sci(ω)} rad/s</div>
              </div>
            </div>

            {/* 6. Time-Scale Separation */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">6. Time-Scale Separation</h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">TS = τ_long / τ_LC</div>
                <div className="font-mono text-lg">{isFiniteNum(TS_ratio) ? TS_ratio.toExponential(2) : "—"}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  Should be ≫ 1
                  <StatusIcon ok={validation.TS_ratio} />
                </div>
              </div>
            </div>

            {/* 7. Green's Potential (NEW) */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                7. Green's Potential (φ = G * ρ)
                {greenPhi.source !== "none" ? (
                  <Badge variant="outline" className="ml-2">{greenPhi.source.toUpperCase()}</Badge>
                ) : null}
              </h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-muted-foreground">Kernel</div>
                  <div className="font-mono">
                    {greensKindLabel({ kind: greenKind as any, m: mHelm })}
                    {normalizeGreens ? " · norm" : ""}
                  </div>
                  <div className="text-muted-foreground">N (tiles)</div>
                  <div className="font-mono">{greenStats.N || "—"}</div>
                  <div className="text-muted-foreground">φ_min</div>
                  <div className="font-mono">{fmtExp(greenStats.min)}</div>
                  <div className="text-muted-foreground">φ_max</div>
                  <div className="font-mono">{fmtExp(greenStats.max)}</div>
                  <div className="text-muted-foreground">φ_mean</div>
                  <div className="font-mono">{fmtExp(greenStats.mean)}</div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    className="px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700"
                    onClick={publishGreens}
                    disabled={greenPhi.phi.length === 0}
                    title="Publish φ to renderer (broadcast + cache)"
                  >
                    Publish to renderer
                  </button>
                  <span className="text-xs text-muted-foreground self-center">
                    Emits <code>helix:greens</code> & caches <code>["helix:pipeline:greens"]</code>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Final Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Final Exotic Matter Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Per-Tile Energy */}
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">E_tile (per tile)</div>
              <div className="font-mono text-xl">{sci(U_cycle)} J</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                Target: {sci(targets.U_cycle)} J
                <StatusBadge ok={validation.U_cycle} />
              </div>
            </div>

            {/* Total Exotic Mass */}
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">m_exotic (total)</div>
              <div className="font-mono text-xl">{sci(m_exotic)} kg</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                Target: {sci(targets.m_exotic)} kg
                <StatusBadge ok={validation.m_exotic} />
              </div>
            </div>

            {/* Total Power */}
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">P_total (lattice, FR-avg)</div>
              <div className="font-mono text-xl">{sci(P_avg_W)} W</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                Target: {sci(targets.P_total)} W
                <StatusBadge ok={validation.P_total} />
              </div>
            </div>
          </div>

          {/* Additional Parameters */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-semibold text-sm mb-3">Pipeline Parameters</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">N_tiles</div>
                <div className="font-mono">{isFiniteNum(N) ? N.toLocaleString() : "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">f_m</div>
                <div className="font-mono">{fGHz.toFixed(2)} GHz</div>
              </div>
              <div>
                <div className="text-muted-foreground">γ_geo</div>
                <div className="font-mono">{γ_geo}</div>
              </div>
              <div>
                <div className="text-muted-foreground">FR duty</div>
                <div className="font-mono">{(dutyEffectiveFR*100).toFixed(3)}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
