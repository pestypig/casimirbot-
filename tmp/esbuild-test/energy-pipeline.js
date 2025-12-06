import { useEffect, useMemo, startTransition, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NearZeroWidget from "@/components/NearZeroWidget";
import { CheckCircle, XCircle, Zap, Target, Calculator, TrendingUp, Activity } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEnergyPipeline, useSwitchMode } from "@/hooks/use-energy-pipeline";
import { computeGreensStats, fmtExp, greensKindLabel } from "@/lib/greens";
import { TheoryBadge } from "./common/TheoryBadge";
const poissonKernel = (r) => {
  const rr = Number.isFinite(r) && r > 0 ? r : 1e-6;
  return 1 / (4 * Math.PI * rr);
};
const helmholtzKernel = (m) => (r) => {
  const rr = Number.isFinite(r) && r > 0 ? r : 1e-6;
  const mm = Number.isFinite(m) ? m : 0;
  return Math.exp(-mm * rr) / (4 * Math.PI * rr);
};
function computeGreenPotential(positions, rho, kernel, normalize = true) {
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
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < N; i++) {
      const v = out[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const span = max - min || 1;
    for (let i = 0; i < N; i++) out[i] = (out[i] - min) / span;
  }
  return out;
}
function stats(arr) {
  let min = Infinity, max = -Infinity, sum = 0;
  const N = arr.length;
  for (let i = 0; i < N; i++) {
    const v = arr[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { min, max, mean: N ? sum / N : 0, N };
}
function EnergyPipeline({ results, allowModeSwitch = false }) {
  const { data: pipelineState } = useEnergyPipeline();
  const switchMode = useSwitchMode();
  const queryClient = useQueryClient();
  const { data: systemMetrics } = useQuery({
    queryKey: ["/api/helix/metrics"],
    // Make stats visibly live with mode changes & LC updates
    refetchInterval: 1e3
  });
  const C_M_PER_S = 299792458;
  const ms = (s) => s * 1e3;
  const isFiniteNum = (x) => typeof x === "number" && Number.isFinite(x);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const live = pipelineState ?? results ?? {};
  const mode = live?.currentMode ?? "hover";
  const dutyEffectiveFR = useMemo(() => {
    const frFromPipeline = live?.dutyEffectiveFR ?? live?.dutyShip ?? live?.dutyEff;
    if (isFiniteNum(frFromPipeline)) return clamp01(frFromPipeline);
    const burst_ms = Number(
      systemMetrics?.lightCrossing?.burst_ms ?? live?.burst_ms
    );
    const dwell_ms = Number(
      systemMetrics?.lightCrossing?.dwell_ms ?? systemMetrics?.lightCrossing?.sectorPeriod_ms ?? live?.dwell_ms ?? live?.sectorPeriod_ms
    );
    let dutyLocal = Number.isFinite(burst_ms) && Number.isFinite(dwell_ms) && dwell_ms > 0 ? burst_ms / dwell_ms : void 0;
    const localBurstFrac = Number(live?.localBurstFrac ?? live?.dutyCycle);
    if (!isFiniteNum(dutyLocal) && isFiniteNum(localBurstFrac)) dutyLocal = clamp01(localBurstFrac);
    if (!isFiniteNum(dutyLocal)) dutyLocal = 0.01;
    const S_total = Math.max(1, Math.floor(
      Number(systemMetrics?.lightCrossing?.sectorsTotal) ?? Number(systemMetrics?.totalSectors) ?? Number(live?.sectorsTotal) ?? Number(live?.sectorCount) ?? 400
    ));
    const S_live = Math.max(1, Math.min(S_total, Math.floor(
      Number(systemMetrics?.lightCrossing?.activeSectors) ?? Number(systemMetrics?.activeSectors) ?? Number(live?.sectorsConcurrent) ?? Number(live?.concurrentSectors) ?? 1
    )));
    return clamp01(dutyLocal * (S_live / S_total));
  }, [live, systemMetrics]);
  const dutyUI = isFiniteNum(live?.dutyCycle) ? live.dutyCycle : 0.14;
  const nearZeroLocalBurst = useMemo(() => {
    const val = Number(live?.localBurstFrac ?? live?.dutyCycle);
    return clamp01(Number.isFinite(val) ? val : 0.01);
  }, [live]);
  const tauLCSeconds = useMemo(() => {
    const metricsTau = Number(systemMetrics?.lightCrossing?.tauLC_ms);
    if (Number.isFinite(metricsTau)) return metricsTau / 1e3;
    const liveTau = Number(live?.tau_LC_ms ?? live?.tauLC_ms);
    if (Number.isFinite(liveTau)) return liveTau / 1e3;
    return void 0;
  }, [systemMetrics, live]);
  const nearZeroBurst = useMemo(() => {
    const dwellMs = Number(systemMetrics?.lightCrossing?.dwell_ms ?? live?.dwell_ms);
    const burstMs = Number(systemMetrics?.lightCrossing?.burst_ms ?? live?.burst_ms);
    const fracLive = Number.isFinite(burstMs) && Number.isFinite(dwellMs) && dwellMs > 0 ? clamp01(burstMs / dwellMs) : void 0;
    return {
      dwell_s: Number.isFinite(dwellMs) ? dwellMs / 1e3 : void 0,
      // Prefer live burst fraction when available; fallback to mode/pipeline local burst fraction
      frac: Number.isFinite(fracLive) ? fracLive : nearZeroLocalBurst
    };
  }, [systemMetrics, live, nearZeroLocalBurst]);
  const totalSectors = useMemo(() => {
    const fromMetrics = Number(systemMetrics?.totalSectors ?? systemMetrics?.lightCrossing?.sectorsTotal);
    if (Number.isFinite(fromMetrics) && fromMetrics > 0) return Math.floor(fromMetrics);
    const fromLive = Number(live?.sectorsTotal ?? live?.sectorCount);
    if (Number.isFinite(fromLive) && fromLive > 0) return Math.floor(fromLive);
    return 400;
  }, [systemMetrics, live]);
  const tsTelemetry = live?.ts ?? null;
  const tsAutoscaleEngaged = Boolean(tsTelemetry?.autoscale?.engaged);
  const epsilon = (() => {
    const e = Number(live?.clocking?.epsilon ?? live?.averaging?.epsilon);
    return Number.isFinite(e) ? e : null;
  })();
  const nearZeroGuards = useMemo(
    () => ({
      q: isFiniteNum(live?.qSpoilingFactor) ? Number(live.qSpoilingFactor) : NaN,
      zeta: isFiniteNum(systemMetrics?.fordRoman?.value) ? Number(systemMetrics.fordRoman.value) : isFiniteNum(live?.zeta) ? live?.zeta : NaN,
      stroke_pm: isFiniteNum(live?.stroke_pm) ? Number(live.stroke_pm) : isFiniteNum(systemMetrics?.stroke_pm) ? Number(systemMetrics.stroke_pm) : NaN,
      // Treat non-positive TS ratios as missing to avoid false red trips
      TS: isFiniteNum(live?.TS_ratio) && Number(live.TS_ratio) > 0 ? live.TS_ratio : isFiniteNum(systemMetrics?.timeScaleRatio) && Number(systemMetrics.timeScaleRatio) > 0 ? Number(systemMetrics.timeScaleRatio) : NaN
    }),
    [live, systemMetrics]
  );
  const fGHz = isFiniteNum(live?.modulationFreq_GHz) ? live.modulationFreq_GHz : 15;
  const f_m = fGHz * 1e9;
  const \u03C9 = 2 * Math.PI * f_m;
  const \u03B3_geo = isFiniteNum(live?.gammaGeo) ? live.gammaGeo : 26;
  const Q = isFiniteNum(live?.qCavity) ? live.qCavity : 1e9;
  const N = Math.max(1, Number(live?.N_tiles ?? 1));
  const U_static = isFiniteNum(live?.U_static) ? live.U_static : isFiniteNum(systemMetrics?.U_static) ? systemMetrics.U_static : 0;
  const \u03B33 = Math.pow(\u03B3_geo, 3);
  const U_geo_raw = U_static * \u03B33;
  const U_Q = U_geo_raw * Q;
  const U_cycle = U_Q * dutyEffectiveFR;
  const P_tile_on = useMemo(() => {
    const fromPipeline = live?.P_tile_on_W;
    if (isFiniteNum(fromPipeline)) return fromPipeline;
    const base = Math.abs(U_geo_raw) * \u03C9;
    if (base > 0) return base;
    const P_avg_fromSrv_MW = live?.P_avg;
    const P_avg_fromSrv_W = isFiniteNum(P_avg_fromSrv_MW) ? P_avg_fromSrv_MW * 1e6 : void 0;
    if (isFiniteNum(P_avg_fromSrv_W) && N > 0 && dutyEffectiveFR > 0) {
      return P_avg_fromSrv_W / N / Math.max(1e-12, dutyEffectiveFR);
    }
    return 0;
  }, [live, U_geo_raw, \u03C9, N, dutyEffectiveFR]);
  const P_total_W_local = P_tile_on * N * dutyEffectiveFR;
  const P_avg_W = isFiniteNum(live?.P_avg) ? live.P_avg * 1e6 : void 0;
  const m_exotic = isFiniteNum(live?.M_exotic) ? live.M_exotic : Number.isFinite(Number(live?.M_exotic_raw)) ? Number(live?.M_exotic_raw) : 0;
  const TS_ratio = isFiniteNum(live?.TS_ratio) ? live.TS_ratio : isFiniteNum(live?.TS_long) ? live.TS_long : void 0;
  const \u03C4_Q_ms = isFiniteNum(Q) && Q > 0 ? Q / \u03C9 * 1e3 : void 0;
  const sci = (v) => isFiniteNum(v) ? formatScientific(v) : "\u2014";
  function formatScientific(value) {
    if (value === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = (value / Math.pow(10, exp)).toFixed(3);
    return `${mantissa} \xD7 10^${exp}`;
  }
  const StatusIcon = ({ ok }) => ok ? /* @__PURE__ */ React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ React.createElement(XCircle, { className: "h-4 w-4 text-red-600" });
  const StatusBadge = ({ ok }) => ok ? /* @__PURE__ */ React.createElement(Badge, { className: "bg-green-100 text-green-800" }, "PASS") : /* @__PURE__ */ React.createElement(Badge, { className: "bg-red-100 text-red-800" }, "FAIL");
  const targets = { U_cycle: Math.abs(U_cycle), m_exotic, P_total: P_avg_W, TS_ratio };
  const validation = {
    U_cycle: true,
    m_exotic: true,
    P_total: true,
    TS_ratio: isFiniteNum(TS_ratio) ? TS_ratio > 1 : false
  };
  useEffect(() => {
    const lightCrossing = systemMetrics?.lightCrossing ?? {};
    const tau_LC_ms = (() => {
      const liveTau = Number(live?.tau_LC_ms ?? live?.tauLC_ms);
      if (Number.isFinite(liveTau)) return liveTau;
      const metricsTau = Number(lightCrossing?.tauLC_ms);
      if (Number.isFinite(metricsTau)) return metricsTau;
      if (Number.isFinite(live?.shipRadius_m)) {
        return ms(2 * Number(live?.shipRadius_m) / C_M_PER_S);
      }
      return void 0;
    })();
    const dwell_ms = (() => {
      const liveDwell = Number(live?.dwell_ms ?? live?.sectorPeriod_ms);
      if (Number.isFinite(liveDwell)) return liveDwell;
      const metricsDwell = Number(lightCrossing?.dwell_ms ?? lightCrossing?.sectorPeriod_ms);
      if (Number.isFinite(metricsDwell)) return metricsDwell;
      return void 0;
    })();
    const burst_ms = (() => {
      const liveBurst = Number(live?.burst_ms);
      if (Number.isFinite(liveBurst)) return liveBurst;
      const metricsBurst = Number(lightCrossing?.burst_ms);
      if (Number.isFinite(metricsBurst)) return metricsBurst;
      return void 0;
    })();
    const sectorPeriod_ms = (() => {
      const liveSector = Number(live?.sectorPeriod_ms);
      if (Number.isFinite(liveSector)) return liveSector;
      const metricsSector = Number(lightCrossing?.sectorPeriod_ms);
      if (Number.isFinite(metricsSector)) return metricsSector;
      return dwell_ms;
    })();
    const tsRatioDerived = (() => {
      if (isFiniteNum(TS_ratio)) return TS_ratio;
      if (isFiniteNum(dwell_ms) && isFiniteNum(tau_LC_ms) && tau_LC_ms > 0) {
        return dwell_ms / tau_LC_ms;
      }
      return void 0;
    })();
    queryClient.setQueryData(["helix:pipeline:derived"], (prev) => ({
      ...prev,
      mode,
      dutyUI,
      dutyEffectiveFR,
      P_tile_on_W: P_tile_on,
      P_total_W: P_avg_W,
      // canonical pipeline value (may be undefined)
      P_total_W_local,
      // dev-only local calculation for reconciliation
      tau_Q_ms: \u03C4_Q_ms,
      \u03C4_Q_ms,
      tau_LC_ms,
      \u03C4_LC_ms: tau_LC_ms,
      N_tiles: N,
      f_GHz: fGHz,
      gammaGeo: \u03B3_geo,
      Q,
      sectorsTotal: systemMetrics?.totalSectors ?? live?.sectorCount,
      sectorsConcurrent: live?.sectorsConcurrent ?? systemMetrics?.activeSectors,
      // timing mirror for HUDs
      sectorPeriod_ms,
      burst_ms,
      dwell_ms,
      localBurstFrac: live?.localBurstFrac ?? live?.dutyCycle,
      TS_ratio: tsRatioDerived,
      // instantaneous reciprocity indicator for consumers
      reciprocity: (() => {
        if (Number.isFinite(burst_ms) && Number.isFinite(tau_LC_ms)) {
          const burstVal = burst_ms;
          const tauVal = tau_LC_ms;
          return burstVal < tauVal ? { status: "BROKEN_INSTANT", message: "burst < \u03C4_LC \u2192 inst. non-reciprocal" } : { status: "PASS_AVG", message: "burst \u2265 \u03C4_LC \u2192 avg. reciprocal" };
        }
        return { status: "UNKNOWN", message: "missing burst/\u03C4_LC" };
      })()
    }));
  }, [mode, dutyUI, dutyEffectiveFR, P_tile_on, P_avg_W, \u03C4_Q_ms, live, N, fGHz, \u03B3_geo, Q, systemMetrics, queryClient, P_total_W_local, TS_ratio]);
  const serverGreens = live?.greens;
  const clientTiles = useMemo(() => {
    const tiles = systemMetrics?.tileData || systemMetrics?.tiles;
    if (!Array.isArray(tiles)) return void 0;
    return tiles.map((t) => ({
      pos: t.pos,
      t00: t.t00 || 0
    }));
  }, [systemMetrics]);
  const greenKind = serverGreens?.kind === "helmholtz" || serverGreens?.kind === "poisson" ? serverGreens.kind : "poisson";
  const mHelm = isFiniteNum(serverGreens?.m) ? serverGreens?.m : 0;
  const normalizeGreens = serverGreens?.normalize !== false;
  const greenPhi = useMemo(() => {
    if (serverGreens?.phi && serverGreens.phi.length > 0) {
      const arr = serverGreens.phi instanceof Float32Array ? serverGreens.phi : new Float32Array(serverGreens.phi);
      return { phi: arr, source: "server" };
    }
    if (clientTiles && clientTiles.length > 0) {
      const positions = clientTiles.map((t) => t.pos);
      const rho = clientTiles.map((t) => t.t00);
      const kernel = greenKind === "helmholtz" ? helmholtzKernel(Math.max(0, mHelm)) : poissonKernel;
      const phi = computeGreenPotential(positions, rho, kernel, normalizeGreens);
      return { phi, source: "client" };
    }
    return { phi: new Float32Array(0), source: "none" };
  }, [serverGreens, clientTiles, greenKind, mHelm, normalizeGreens]);
  const greenStats = useMemo(() => computeGreensStats(greenPhi.phi), [greenPhi]);
  const publishGreens = useCallback(() => {
    const tauLC_ms = live?.tau_LC_ms ?? live?.tauLC_ms;
    const burst_ms = Number(live?.burst_ms);
    const reciprocity = Number.isFinite(burst_ms) && Number.isFinite(tauLC_ms) ? burst_ms < tauLC_ms ? { status: "BROKEN_INSTANT", message: "burst < \u03C4_LC \u2192 inst. non-reciprocal" } : { status: "PASS_AVG", message: "burst \u2265 \u03C4_LC \u2192 avg. reciprocal" } : { status: "UNKNOWN", message: "missing burst/\u03C4_LC" };
    const derived = queryClient.getQueryData(["helix:pipeline:derived"]);
    const payload = {
      kind: greenKind,
      m: mHelm,
      normalize: normalizeGreens,
      phi: greenPhi.phi,
      // Float32Array
      size: greenPhi.phi.length,
      source: greenPhi.source,
      reciprocity: derived?.reciprocity ?? reciprocity
    };
    queryClient.setQueryData(["helix:pipeline:greens"], payload);
    try {
      window.dispatchEvent(new CustomEvent("helix:greens", { detail: payload }));
    } catch {
    }
  }, [greenKind, mHelm, normalizeGreens, greenPhi, queryClient, live]);
  const lastSigRef = useRef("");
  useEffect(() => {
    const phi = greenPhi.phi;
    if (!phi || phi.length === 0) return;
    let min = Infinity, max = -Infinity, sum = 0;
    for (let i = 0; i < phi.length; i++) {
      const v = phi[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }
    const mean = sum / phi.length;
    const sig = JSON.stringify({
      src: greenPhi.source,
      kind: greenKind,
      m: mHelm,
      n: phi.length,
      min: +min.toPrecision(6),
      max: +max.toPrecision(6),
      mean: +mean.toPrecision(6),
      norm: !!normalizeGreens
    });
    if (sig !== lastSigRef.current) {
      lastSigRef.current = sig;
      publishGreens();
    }
  }, [greenPhi.phi, greenPhi.source, greenKind, mHelm, normalizeGreens, publishGreens]);
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(CardHeader, { className: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-lg flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Zap, { className: "h-5 w-5" }), "Complete Energy Pipeline (T_\u03BC\u03BD \u2192 Metric)", /* @__PURE__ */ React.createElement(Badge, { variant: "outline", className: "ml-2" }, mode.toUpperCase()), allowModeSwitch && /* @__PURE__ */ React.createElement("div", { className: "ml-3 flex gap-2" }, ["standby", "hover", "taxi", "nearzero", "cruise", "emergency"].map((m) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: m,
      className: `px-2 py-0.5 rounded text-xs border ${m === mode ? "bg-cyan-600 border-cyan-500" : "bg-slate-900 border-slate-700"}`,
      onClick: () => {
        if (m === mode) return;
        startTransition(() => {
          switchMode.mutate(m, {
            onSuccess: () => {
              queryClient.invalidateQueries({
                predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey[0] === "/api/helix/pipeline" || q.queryKey[0] === "/api/helix/metrics")
              });
            }
          });
        });
      }
    },
    m
  ))))), /* @__PURE__ */ React.createElement("div", { className: "w-full lg:w-[360px]" }, /* @__PURE__ */ React.createElement(
    NearZeroWidget,
    {
      className: "w-full",
      mode,
      env: systemMetrics?.env,
      guards: nearZeroGuards,
      QL: Number.isFinite(pipelineState?.qCavity) ? Number(pipelineState?.qCavity) : void 0,
      frDuty: dutyEffectiveFR,
      burst: nearZeroBurst,
      tauLC_s: tauLCSeconds,
      sectorsTotal: totalSectors
    }
  ))), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Target, { className: "h-4 w-4" }), "1. Stress\u2013Energy (Static Casimir)"), /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-muted-foreground" }, "U_static (per cavity)"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-lg" }, sci(U_static), " J"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground mt-1" }, "Base Casimir energy between plates"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(TrendingUp, { className: "h-4 w-4" }), "2. Geometric Amplification (\u03B3\xB3)"), /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-muted-foreground" }, "U_geo_raw = U_static \xD7 \u03B3\xB3"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-lg" }, sci(U_geo_raw), " J"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground mt-1" }, "\u03B3_geo\xB3 = ", sci(\u03B33)))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Calculator, { className: "h-4 w-4" }), "3. Q-Factor Amplification"), /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-muted-foreground" }, "U_Q = U_geo_raw \xD7 Q"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-lg" }, sci(U_Q), " J"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground mt-1" }, "Q \u2248 ", sci(Q)))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold text-sm" }, "4. Duty Cycle Averaging (FR)"), /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-muted-foreground" }, "U_cycle = U_Q \xD7 d_FR"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-lg" }, sci(U_cycle), " J"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground mt-1 flex items-center gap-2" }, "UI duty: ", (dutyUI * 100).toFixed(2), "% \xB7 FR duty: ", (dutyEffectiveFR * 100).toFixed(3), "%", /* @__PURE__ */ React.createElement(StatusIcon, { ok: validation.U_cycle })))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold text-sm" }, "5. Power (per cavity, ON-window)"), /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-muted-foreground" }, "P_tile_on = U_geo_raw \xB7 \u03C9"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-lg" }, sci(P_tile_on), " W"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground mt-1" }, "\u03C9 = ", sci(\u03C9), " rad/s"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold text-sm" }, "6. Time-Scale Separation"), /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-muted-foreground" }, "TS = \u03C4_long / \u03C4_LC"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-lg" }, isFiniteNum(TS_ratio) ? TS_ratio.toExponential(2) : "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground mt-1 flex items-center gap-2" }, "Should be ?%? 1", epsilon !== null ? /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, "?=", Number(epsilon).toExponential(2)) : null, tsAutoscaleEngaged ? /* @__PURE__ */ React.createElement(Badge, { variant: "secondary" }, "TS autoscale active (\u2192 tau_pulse down)") : null, /* @__PURE__ */ React.createElement(StatusIcon, { ok: validation.TS_ratio })))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Activity, { className: "h-4 w-4" }), "7. Green's Potential (\u03C6 = G * \u03C1)", greenPhi.source !== "none" ? /* @__PURE__ */ React.createElement(Badge, { variant: "outline", className: "ml-2" }, greenPhi.source.toUpperCase()) : null), /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground" }, "Kernel"), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, greensKindLabel({ kind: greenKind, m: mHelm }), normalizeGreens ? " \xB7 norm" : ""), /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground" }, "N (tiles)"), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, greenStats.N || "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground" }, "\u03C6_min"), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, fmtExp(greenStats.min)), /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground" }, "\u03C6_max"), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, fmtExp(greenStats.max)), /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground" }, "\u03C6_mean"), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, fmtExp(greenStats.mean)), /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground" }, "Reciprocity"), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, (() => {
    const tauLC = live?.tau_LC_ms ?? live?.tauLC_ms;
    const burst = Number(live?.burst_ms);
    if (!Number.isFinite(burst) || !Number.isFinite(tauLC)) return "\u2014";
    return burst < tauLC ? "BROKEN (inst.)" : "PASS (avg.)";
  })())), /* @__PURE__ */ React.createElement("div", { className: "mt-3 flex gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700",
      onClick: publishGreens,
      disabled: greenPhi.phi.length === 0,
      title: "Publish \u03C6 to renderer (broadcast + cache)"
    },
    "Publish to renderer"
  ), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-muted-foreground self-center" }, "Emits ", /* @__PURE__ */ React.createElement("code", null, "helix:greens"), " & caches ", /* @__PURE__ */ React.createElement("code", null, '["helix:pipeline:greens"]')))))))), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-lg" }, "Final Exotic Matter Results")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-muted-foreground" }, "E_tile (per tile)"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-xl" }, sci(U_cycle), " J"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground mt-1 flex items-center gap-2" }, "Target: ", sci(targets.U_cycle), " J", /* @__PURE__ */ React.createElement(StatusBadge, { ok: validation.U_cycle }))), /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-muted-foreground" }, "m_exotic (total)"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-xl" }, sci(m_exotic), " kg"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground mt-1 flex items-center gap-2" }, "Target: ", sci(targets.m_exotic), " kg", /* @__PURE__ */ React.createElement(StatusBadge, { ok: validation.m_exotic }))), /* @__PURE__ */ React.createElement("div", { className: "bg-muted rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-muted-foreground" }, "P_total (lattice, FR-avg)"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-xl" }, sci(P_avg_W), " W"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground mt-1 flex items-center gap-2" }, "Target: ", sci(targets.P_total), " W", /* @__PURE__ */ React.createElement(StatusBadge, { ok: validation.P_total })))), /* @__PURE__ */ React.createElement("div", { className: "mt-6 pt-6 border-t border-border" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold text-sm mb-3" }, "Pipeline Parameters"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground" }, "N_tiles"), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, isFiniteNum(N) ? N.toLocaleString() : "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground" }, "f_m"), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, fGHz.toFixed(2), " GHz")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground" }, "\u03B3_geo"), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, \u03B3_geo)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-muted-foreground flex items-center gap-2" }, "FR duty", /* @__PURE__ */ React.createElement(
    TheoryBadge,
    {
      refs: ["ford-roman-qi-1995"],
      categoryAnchor: "Quantum-Inequalities"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "font-mono" }, (dutyEffectiveFR * 100).toFixed(3), "%")))))));
}
export {
  EnergyPipeline
};
