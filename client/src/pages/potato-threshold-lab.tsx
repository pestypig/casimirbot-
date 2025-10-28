import React, { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  Label,
} from "recharts";
import { useMetrics } from "@/hooks/use-metrics";

/**
 * Warp Ledger vs Potato Threshold — Interactive
 * ---------------------------------------------------------
 * An interactive playground to compare the cycle-averaged curvature proxy
 * of a strobed Casimir-tile hull with the natural ("lazy mass") curvature scale
 * of solar-system bodies across the irregular→round ("potato") transition.
 *
 * Core ideas implemented:
 *  - Green-zone scaling playbook around Needle baseline
 *    (A0, P_avg, Q_L bounds, duty limit, q_mech ≤ 1, γ_VdB band)
 *  - Potato threshold Π ≡ ρ g R / σ_y (≈ (4πG/3) ρ^2 R^2 / σ_y)
 *  - Curvature proxy for the drive κ_drive ≈ (8πG/c^5) (P/A) d_eff 𝓖
 *  - Lazy-mass curvature κ_body = (8πG/3c^2) ρ
 *  - Efficiency ratio 𝓔_potato = κ_drive / κ_body
 *  - Timescale separation TS ≡ t_macro / τ_LC(hull) using A→L_char mapping
 *
 * Notes:
 *  - All constants and baseline numbers are in SI.
 *  - Body data are approximate and for design intuition.
 */

// Physical constants
const G = 6.67430e-11; // m^3 kg^-1 s^-2
const c = 2.99792458e8; // m/s

// Baseline (Needle Hull)
const A0 = 4.92e6; // m^2 (given baseline total tile area)
const P_AVG = 83.3e6; // W
const d0 = 2.5e-5; // baseline effective duty
const D_EFF_MAX = 3.0e-5; // ζ-limit corresponds to 1.0
const QL_MIN = 5e8;
const QL_MAX = 1e9;

// Solver constants from user's green-zone playbook
const A_STAR = 8.81e16; // W (effective normalization for q_mech)
const C_STAR = 1.35e14; // (normalization for γ_VdB)

// Macro timing (for TS)
const T_MACRO = 1e-3; // 1 ms sector cadence

// Helper: clamp
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Body catalog (approximate values)
// radius: mean radius (m); rho: bulk density (kg/m^3)
// category: "potato" | "moon" | "dwarf" | "planet" | "giant" | "star"
const BODIES = [
  { name: "Ryugu", radius: 4.5e2, rho: 1190, category: "potato" },
  { name: "Eros", radius: 8.4e3, rho: 2670, category: "potato" },
  { name: "Phobos", radius: 1.1266e4, rho: 1876, category: "potato" },
  { name: "Deimos", radius: 6.2e3, rho: 1470, category: "potato" },
  { name: "Mimas", radius: 1.982e5, rho: 1150, category: "moon" },
  { name: "Enceladus", radius: 2.521e5, rho: 1610, category: "moon" },
  { name: "Vesta", radius: 2.627e5, rho: 3450, category: "potato" },
  { name: "Ceres", radius: 4.73e5, rho: 2160, category: "dwarf" },
  { name: "Europa", radius: 1.5608e6, rho: 3013, category: "moon" },
  { name: "Io", radius: 1.8216e6, rho: 3528, category: "moon" },
  { name: "Moon", radius: 1.7374e6, rho: 3340, category: "moon" },
  { name: "Titan", radius: 2.575e6, rho: 1880, category: "moon" },
  { name: "Ganymede", radius: 2.6341e6, rho: 1942, category: "moon" },
  { name: "Mercury", radius: 2.4397e6, rho: 5427, category: "planet" },
  { name: "Mars", radius: 3.3895e6, rho: 3933, category: "planet" },
  { name: "Venus", radius: 6.0518e6, rho: 5243, category: "planet" },
  { name: "Earth", radius: 6.371e6, rho: 5515, category: "planet" },
  { name: "Uranus", radius: 2.5362e7, rho: 1271, category: "giant" },
  { name: "Neptune", radius: 2.4622e7, rho: 1638, category: "giant" },
  { name: "Saturn", radius: 5.8232e7, rho: 687, category: "giant" },
  { name: "Jupiter", radius: 6.9911e7, rho: 1326, category: "giant" },
  { name: "Sun", radius: 6.9634e8, rho: 1408, category: "star" },
];

type Category = "potato" | "moon" | "dwarf" | "planet" | "giant" | "star";

const CATEGORY_COLORS: Record<Category, string> = {
  potato: "#c084fc", // purple-300
  moon: "#60a5fa", // blue-400
  dwarf: "#34d399", // emerald-400
  planet: "#f59e0b", // amber-500
  giant: "#ef4444", // red-500
  star: "#f97316", // orange-500
};

// === Physics helpers ===
function qMech(s: number, QL: number, dEff: number) {
  return (P_AVG * QL) / (A_STAR * s) * (d0 / dEff);
}

function gammaVdB(s: number, QL: number, dEff: number, Mminus: number) {
  return (C_STAR / (QL * s)) * (d0 / dEff) * (Mminus / 1405);
}

function areaFromScale(s: number) {
  return A0 * s;
}

function kappaDrive(s: number, dEff: number, geomGain: number) {
  const A = areaFromScale(s);
  const flux = P_AVG / A; // W/m^2
  // κ_drive ≈ (8πG/c^5) * flux * d_eff * 𝓖 (units 1/m^2)
  return ((8 * Math.PI * G) / Math.pow(c, 5)) * flux * dEff * geomGain;
}

function kappaBody(rho: number) {
  return ((8 * Math.PI * G) / (3 * c * c)) * rho; // 1/m^2
}

function efficiencyPotato(rho: number, s: number, dEff: number, geomGain: number) {
  const kd = kappaDrive(s, dEff, geomGain);
  const kb = kappaBody(rho);
  return kd / kb;
}

function potatoPi(R: number, rho: number, sigmaY: number) {
  // Π ≡ ρ g R / σ_y with g ≈ (4πG/3) ρ R
  return ((4 * Math.PI * G) / 3) * (rho * rho * R * R) / sigmaY;
}

function gSurface(R: number, rho: number) {
  return (4 * Math.PI * G * rho * R) / 3; // m/s^2
}

function chiPerKm(g: number) {
  return (g * 1000) / (c * c);
}

function timescaleSeparation(s: number) {
  // map area → effective diameter via sphere of area A: A = 4πr^2 → r = √(A/4π); L_char ≈ 2r
  const A = areaFromScale(s);
  const r = Math.sqrt(A / (4 * Math.PI));
  const Lchar = 2 * r;
  const tauLC = Lchar / c;
  return T_MACRO / tauLC; // TS ≫ 1 desired
}

function zeta(dEff: number) {
  return dEff / D_EFF_MAX; // ≤1 desired
}

function formatSci(x: number, digits = 2) {
  if (!isFinite(x)) return "—";
  const e = Math.floor(Math.log10(Math.abs(x)));
  const m = x / Math.pow(10, e);
  if (!isFinite(e)) return x.toFixed(digits);
  return `${m.toFixed(digits)}e${e}`;
}

function pretty(x: number, digits = 3) {
  return Number.isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";
}

function pickTelemetryGeomGain(data: any): number | undefined {
  if (!data) return undefined;
  const payload = data.pipeline ?? data;
  const candidates = [
    payload?.geometryGain,
    payload?.geomGain,
    payload?.gammaVanDenBroeck,
    payload?.gammaVanDenBroeck_mass,
    payload?.gammaVanDenBroeck_vis,
    data?.gammaVanDenBroeck,
    data?.gammaVanDenBroeck_mass,
    data?.gammaVanDenBroeck_vis,
  ];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return undefined;
}

// === UI ===
export default function PotatoThresholdLab() {
  const [s, setS] = useState(1.0);
  const [QL, setQL] = useState(1e9);
  const [dEff, setDEff] = useState(2.5e-5);
  const [Mminus, setMminus] = useState(1405);
  const [geomGainManual, setGeomGainManual] = useState(1);
  const [sigmaY, setSigmaY] = useState(5e7); // Pa (rock default). Ice ~5e6…1e7
  const [filterCats, setFilterCats] = useState<Record<Category, boolean>>({
    potato: true,
    moon: true,
    dwarf: true,
    planet: true,
    giant: true,
    star: true,
  });
  const [selectedBody, setSelectedBody] = useState<string>("Ceres");
  const [useHelixTelemetry, setUseHelixTelemetry] = useState(true);

  const { data: metricsData } = useMetrics(2000);
  const telemetryGeomGain = useMemo(
    () => pickTelemetryGeomGain(metricsData ?? null),
    [metricsData],
  );
  const telemetryAvailable = Number.isFinite(telemetryGeomGain);
  const geomGain = telemetryAvailable && useHelixTelemetry ? (telemetryGeomGain as number) : geomGainManual;

  // Derived metrics
  const A = useMemo(() => areaFromScale(s), [s]);
  const q = useMemo(() => qMech(s, QL, dEff), [s, QL, dEff]);
  const gamma = useMemo(() => gammaVdB(s, QL, dEff, Mminus), [s, QL, dEff, Mminus]);
  const TS = useMemo(() => timescaleSeparation(s), [s]);
  const z = useMemo(() => zeta(dEff), [dEff]);
  const kd = useMemo(() => kappaDrive(s, dEff, geomGain), [s, dEff, geomGain]);

  const body = useMemo(() => BODIES.find((b) => b.name === selectedBody)!, [selectedBody]);
  const kb = useMemo(() => kappaBody(body.rho), [body]);
  const eff = useMemo(() => efficiencyPotato(body.rho, s, dEff, geomGain), [body, s, dEff, geomGain]);
  const gSel = useMemo(() => gSurface(body.radius, body.rho), [body]);
  const chi1km = useMemo(() => chiPerKm(gSel), [gSel]);
  const PiSel = useMemo(() => potatoPi(body.radius, body.rho, sigmaY), [body, sigmaY]);

  const greenOK = q <= 1 && QL >= QL_MIN && QL <= QL_MAX && dEff <= D_EFF_MAX && gamma >= 1e5 && gamma <= 1e6 && z <= 1 && TS > 10;

  const sSweep = useMemo(() => {
    const N = 80;
    const out: Array<{ s: number; q: number; gamma: number; pass: boolean }> = [];
    for (let i = 0; i < N; i++) {
      const si = 0.5 + (2.5 - 0.5) * (i / (N - 1));
      const qi = qMech(si, QL, dEff);
      const gi = gammaVdB(si, QL, dEff, Mminus);
      out.push({ s: si, q: qi, gamma: gi, pass: qi <= 1 && gi >= 1e5 && gi <= 1e6 });
    }
    return out;
  }, [QL, dEff, Mminus]);

  const bodyPoints = useMemo(() => {
    return BODIES.filter((b) => filterCats[b.category as Category]).map((b) => ({
      x: b.radius / 1000, // km
      y: potatoPi(b.radius, b.rho, sigmaY),
      name: b.name,
      category: b.category as Category,
    }));
  }, [sigmaY, filterCats]);

  function autoTuneToGreen() {
    let newDEff = dEff;
    let newQL = QL;

    // Step A: if q>1, raise duty up to limit
    const qNow = qMech(s, newQL, newDEff);
    if (qNow > 1) {
      newDEff = D_EFF_MAX;
    }
    // Step B: if still q>1, reduce QL but stay ≥QL_MIN
    let qAfter = qMech(s, newQL, newDEff);
    if (qAfter > 1) {
      const targetQL = (A_STAR * s * newDEff) / (P_AVG * d0); // makes q≈1
      newQL = clamp(targetQL, QL_MIN, QL_MAX);
    }

    // Step C: nudge QL for γ band if needed
    let gA = gammaVdB(s, newQL, newDEff, Mminus);
    if (gA < 1e5) {
      // decrease QL or increase M- (we keep M- fixed here)
      const targetQL = clamp((C_STAR / (1e5 * s)) * (d0 / newDEff) * (Mminus / 1405), QL_MIN, QL_MAX);
      newQL = targetQL;
    } else if (gA > 1e6) {
      const targetQL = clamp((C_STAR / (1e6 * s)) * (d0 / newDEff) * (Mminus / 1405), QL_MIN, QL_MAX);
      newQL = targetQL;
    }

    setDEff(newDEff);
    setQL(newQL);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">KM-Scale Warp Ledger × Potato Threshold</h1>
            <p className="text-slate-400 mt-1">
              Scale the Casimir-tile area <span className="font-mono">s = A/A₀</span>, keep <span className="font-mono">P_avg</span> realistic, enforce{" "}
              <span className="font-mono">ζ ≤ 1</span> and <span className="font-mono">TS ≫ 1</span>, and compare cycle-averaged curvature to lazy mass across the irregular→round transition.
            </p>
          </div>
          <button
            onClick={autoTuneToGreen}
            className="px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30"
            title="Adjust d_eff and Q_L to try to bring q ≤ 1 and γ into band"
          >
            Auto-tune to Green
          </button>
        </header>

        {/* Controls */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5 bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold">Drive knobs &amp; scaling</h2>

            <div className="space-y-3">
              <div>
                <label className="flex justify-between text-sm text-slate-300">
                  <span>Area scale s = A/A₀</span>
                  <span className="font-mono">{s.toFixed(2)}</span>
                </label>
                <input type="range" min={0.5} max={2.5} step={0.01} value={s} onChange={(e) => setS(parseFloat(e.target.value))} className="w-full" />
                <p className="text-xs text-slate-400">
                  A₀ = {pretty(A0)} m² → A = {pretty(A)} m²
                </p>
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-300">
                  <span>Loaded Q<sub>L</sub></span>
                  <span className="font-mono">{QL.toExponential(2)}</span>
                </label>
                <input type="range" min={5e8} max={1e9} step={1e7} value={QL} onChange={(e) => setQL(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-300">
                  <span>Effective duty d<sub>eff</sub></span>
                  <span className="font-mono">{dEff.toExponential(2)}</span>
                </label>
                <input type="range" min={1.5e-5} max={3.0e-5} step={1e-7} value={dEff} onChange={(e) => setDEff(parseFloat(e.target.value))} className="w-full" />
                <p className="text-xs text-slate-400">
                  ζ = d<sub>eff</sub> / (3e−5) = {z.toFixed(3)} (≤ 1)
                </p>
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-300">
                  <span>Payload M<sub>−</sub> (kg)</span>
                  <span className="font-mono">{pretty(Mminus)}</span>
                </label>
                <input type="range" min={1000} max={10000} step={5} value={Mminus} onChange={(e) => setMminus(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-300">
                  <span>Geometry/storage gain 𝓖</span>
                  <span className="font-mono">{formatSci(geomGain)}</span>
                </label>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-emerald-400"
                      checked={useHelixTelemetry}
                      onChange={(e) => setUseHelixTelemetry(e.target.checked)}
                    />
                    <span>Use live Helix telemetry</span>
                  </label>
                  {useHelixTelemetry && (
                    <span className={telemetryAvailable ? "text-emerald-300" : "text-amber-300"}>
                      {telemetryAvailable ? "streaming" : "awaiting signal"}
                    </span>
                  )}
                </div>
                <input
                  type="range"
                  min={1}
                  max={1e12}
                  step={1}
                  value={Math.min(Math.max(geomGainManual, 1), 1e12)}
                  onChange={(e) => setGeomGainManual(parseFloat(e.target.value))}
                  disabled={useHelixTelemetry && telemetryAvailable}
                  className={`w-full ${useHelixTelemetry && telemetryAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                />
                <p className="text-xs text-slate-400">
                  Proxy for field concentration (Q, modal volume, VdB).{" "}
                  {useHelixTelemetry && telemetryAvailable
                    ? "Driven from Helix γ_VdB."
                    : "Move slider when telemetry is off or unavailable."}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-slate-400">
                  q<sub>mech</sub>
                </div>
                <div className={`text-xl font-mono ${q <= 1 ? "text-emerald-300" : "text-rose-300"}`}>{q.toFixed(3)}</div>
                <div className="text-xs text-slate-400">≤ 1</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-slate-400">
                  γ<sub>VdB</sub>
                </div>
                <div className={`text-xl font-mono ${gamma >= 1e5 && gamma <= 1e6 ? "text-emerald-300" : "text-rose-300"}`}>{gamma.toExponential(2)}</div>
                <div className="text-xs text-slate-400">[1e5, 1e6]</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-slate-400">TS</div>
                <div className={`text-xl font-mono ${TS > 10 ? "text-emerald-300" : "text-rose-300"}`}>{TS.toFixed(1)}</div>
                <div className="text-xs text-slate-400">
                  ≫ 1 (t<sub>macro</sub> / τ<sub>LC</sub>)
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-slate-400">
                  κ<sub>drive</sub> (1/m²)
                </div>
                <div className="text-lg font-mono">{formatSci(kd, 2)}</div>
                <div className="text-xs text-slate-400">
                  (8πG/c⁵)(P/A)d<sub>eff</sub>𝓖
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-400">
              <p>AUTO RULES: keep P_avg fixed, enforce q ≤ 1 by nudging d_eff or Q_L; hold γ in band; ζ ≤ 1; TS ≫ 1.</p>
            </div>
          </div>

          {/* Lazy mass comparison */}
          <div className="rounded-2xl p-5 bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold">Lazy-mass benchmark (select a body)</h2>

            <div className="grid sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-sm text-slate-300">Body</label>
                <select
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2"
                  value={selectedBody}
                  onChange={(e) => setSelectedBody(e.target.value)}
                >
                  {BODIES.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} — {b.category}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  R = {pretty(body.radius)} m, ρ = {pretty(body.rho)} kg/m³
                </p>
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-300">
                  <span>Yield strength σ<sub>y</sub> (Pa)</span>
                  <span className="font-mono">{sigmaY.toExponential(2)}</span>
                </label>
                <input type="range" min={5e6} max={1e8} step={1e6} value={sigmaY} onChange={(e) => setSigmaY(parseFloat(e.target.value))} className="w-full" />
                <p className="text-xs text-slate-500 mt-1">Ice ≈ 1e6–1e7; Rock ≈ 1e7–1e8 (temperature-dependent)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mt-2">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-slate-400">Π (potato threshold)</div>
                <div className={`text-xl font-mono ${PiSel >= 1 ? "text-emerald-300" : "text-amber-300"}`}>{PiSel.toFixed(2)}</div>
                <div className="text-xs text-slate-400">≥ 1 ⇒ round (hydrostatic)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-slate-400">
                  κ<sub>body</sub> (1/m²)
                </div>
                <div className="text-lg font-mono">{formatSci(kb)}</div>
                <div className="text-xs text-slate-400">(8πG/3c²)ρ</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-slate-400">g (m/s²)</div>
                <div className="text-xl font-mono">{gSel.toFixed(3)}</div>
                <div className="text-xs text-slate-400">surface gravity (uniform sphere)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-slate-400">
                  χ<sub>1km</sub>
                </div>
                <div className="text-xl font-mono">{formatSci(chi1km)}</div>
                <div className="text-xs text-slate-400">g · 1 km / c²</div>
              </div>
              <div className="col-span-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-slate-400">
                  Efficiency 𝓔<sub>potato</sub> (κ_drive / κ_body)
                </div>
                <div className="text-xl font-mono">{formatSci(eff)}</div>
                <div className="text-xs text-slate-400">&gt; 1 ⇒ drive’s cycle-average curvature density exceeds lazy-mass benchmark of same ρ</div>
              </div>
            </div>

            <div className="mt-2 text-sm">
              <div
                className={`inline-block px-3 py-1 rounded-full border ${
                  greenOK ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-300" : "border-rose-400/50 bg-rose-500/10 text-rose-300"
                }`}
              >
                {greenOK ? "GREEN: constraints satisfied" : "OUT OF BAND: adjust knobs or s"}
              </div>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5 bg-slate-900/60 border border-slate-800">
            <h3 className="font-semibold mb-2">Feasible band vs area scale s</h3>
            <p className="text-xs text-slate-400 mb-2">
              Shaded band: γ ∈ [1e5, 1e6]; line: q ≤ 1. Points are <span className="text-emerald-300">pass</span> if both hold.
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sSweep} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis type="number" dataKey="s" domain={[0.5, 2.5]} tick={{ fill: "#94a3b8" }}>
                    <Label value="s = A/A₀" offset={-5} position="insideBottom" fill="#9ca3af" />
                  </XAxis>
                  <YAxis yAxisId="left" tick={{ fill: "#94a3b8" }} domain={[0, 1.5]}>
                    <Label value="q_mech" angle={-90} position="insideLeft" fill="#9ca3af" />
                  </YAxis>
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => v.toExponential(1)} tick={{ fill: "#94a3b8" }}>
                    <Label value="γ_VdB" angle={90} position="insideRight" fill="#9ca3af" />
                  </YAxis>
                  <ReferenceArea yAxisId="right" y1={1e5} y2={1e6} fill="#10b98122" stroke="#10b98155" />
                  <ReferenceLine yAxisId="left" y={1} stroke="#f472b6" strokeDasharray="4 4" />
                  <Line yAxisId="left" type="monotone" dataKey="q" stroke="#93c5fd" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="gamma" stroke="#34d399" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-slate-900/60 border border-slate-800">
            <h3 className="font-semibold mb-2">Potato threshold Π across bodies</h3>
            <p className="text-xs text-slate-400 mb-2">
              Adjust σ<sub>y</sub>. Π ≥ 1 ⇒ hydrostatic equilibrium (spherical). X-axis: radius (km). Y-axis: Π.
            </p>
            <div className="flex gap-3 flex-wrap text-xs mb-2">
              {(Object.keys(CATEGORY_COLORS) as Category[]).map((key) => {
                const on = filterCats[key];
                return (
                  <button
                    key={key}
                    onClick={() => setFilterCats({ ...filterCats, [key]: !on })}
                    className={`px-2 py-1 rounded-full border ${on ? "bg-slate-800/70" : "opacity-50"}`}
                    style={{ borderColor: CATEGORY_COLORS[key], color: CATEGORY_COLORS[key] }}
                  >
                    {on ? "●" : "○"} {key}
                  </button>
                );
              })}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis type="number" dataKey="x" name="radius (km)" tick={{ fill: "#94a3b8" }} />
                  <YAxis type="number" dataKey="y" name="Π" tick={{ fill: "#94a3b8" }} />
                  <ReTooltip cursor={{ stroke: "#94a3b8" }} formatter={(v: any, name: string) => [typeof v === "number" ? v.toPrecision(3) : v, name]} />
                  <Legend />
                  {(Object.keys(CATEGORY_COLORS) as Category[]).map((key) => {
                    const pts = bodyPoints.filter((p) => p.category === key);
                    if (!pts.length) return null;
                    return (
                      <Scatter
                        key={key}
                        name={key}
                        data={pts}
                        fill={CATEGORY_COLORS[key]}
                        onClick={(p: any) => setSelectedBody(p.payload.name)}
                      />
                    );
                  })}
                  <ReferenceLine y={1} stroke="#fbbf24" strokeDasharray="6 4" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Equations & provenance */}
        <section className="rounded-2xl p-5 bg-slate-900/60 border border-slate-800">
          <h3 className="font-semibold mb-2">Equations applied</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  q<sub>mech</sub> = (P_avg·Q_L)/(A_*·s) · (d₀/d_eff)
                </li>
                <li>
                  γ_VdB = (C_* /(Q_L·s)) · (d₀/d_eff) · (M_−/1405)
                </li>
                <li>
                  κ<sub>drive</sub> ≈ (8πG/c⁵) · (P_avg/A) · d_eff · 𝓖
                </li>
                <li>
                  κ<sub>body</sub> = (8πG/3c²) · ρ
                </li>
                <li>Π = ρ g R / σ_y ≈ (4πG/3) ρ² R² / σ_y</li>
                <li>
                  χ<sub>1km</sub> = g · (1 km)/c²;   g ≈ (4πG/3) ρ R
                </li>
                <li>
                  TS = t_macro / ((2√(A/4π))/c) = t_macro · c / √(A/π)
                </li>
                <li>ζ = d_eff / (3×10⁻⁵)</li>
              </ul>
            </div>
            <div className="text-slate-400 space-y-2">
              <p>
                Green-zone constraints: q ≤ 1; Q_L ∈ [5e8, 1e9]; γ ∈ [1e5, 1e6]; d_eff ≤ 3e−5 (ζ ≤ 1); TS ≫ 1. Baseline: A₀ ≈ 4.92×10⁶ m², P_avg = 83.3 MW, d₀ = 2.5×10⁻⁵.
              </p>
              <p>
                Use <em>Auto-tune to Green</em> to nudge d_eff and Q_L. Set σ_y to explore where bodies cross Π ≈ 1 (potato → sphere). Then compare κ_drive vs κ_body through 𝓔_potato.
              </p>
              <p className="text-xs text-slate-500">
                Helix telemetry feeds 𝓖 when available (prefers γ_VdB); disable streaming above to experiment manually.
              </p>
            </div>
          </div>
        </section>

        <footer className="text-xs text-slate-500 text-center pb-4">
          Built for the Needle Hull scaling study. Values for solar-system bodies are approximate; adjust as needed.
        </footer>
      </div>
    </div>
  );
}
