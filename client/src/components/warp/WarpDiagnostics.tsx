// WarpFactory-inspired scalar diagnostics display
// Shows expansion θ, shear σ, vorticity ω scalars as sparklines
import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Eq } from "@/components/Eq";

interface DiagnosticsProps {
  beta0: number;
  mode: string;
  sagDepth: number;
  // Live physics values for equations display
  gapNm?: number;
  gammaGeo?: number;
  qFactor?: number;
  duty?: number;
  powerMW?: number;
  tsRatio?: number;
  zeta?: number;
}

interface ScalarData {
  r: number;
  theta: number; // expansion
  sigma: number; // shear
  omega: number; // vorticity
}

// --- small helpers (avoid ?.() which can break older transforms) ---
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const fmtFixed = (v: unknown, d = 2, fallback = "—") => (isNum(v) ? v.toFixed(d) : fallback);
const fmtExp = (v: unknown, d = 2, fallback = "—") => (isNum(v) ? v.toExponential(d) : fallback);
const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));

export function WarpDiagnostics({
  beta0,
  mode,
  sagDepth,
  gapNm = 1.0,
  gammaGeo = 26,
  qFactor = 1e6,
  duty = 0.14,
  powerMW = 83.3,
  tsRatio = 4102.7,
  zeta = 0.032,
}: DiagnosticsProps) {
  // WarpFactory-inspired: Compute scalar diagnostics
  const computeScalars = (): ScalarData[] => {
    const data: ScalarData[] = [];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const r = i / steps;
      const beta = beta0 * Math.exp(-(r * r) / 0.1); // Gaussian profile

      // Simplified GR scalars
      const theta = -beta * 0.1; // expansion (negative for contraction)
      const sigma = Math.abs(beta * 0.05); // shear magnitude
      const omega = 0; // vorticity (zero for spherically symmetric)

      data.push({ r, theta, sigma, omega });
    }

    return data;
  };

  const scalars = computeScalars();

  // sparkline builders (viewBox 0..100 to keep math simple)
  const xAt = (i: number, n: number) => (i / Math.max(1, n - 1)) * 100;
  const yTheta = (t: number) => clamp(50 + t * 200);
  const ySigma = (s: number) => clamp(50 - s * 200);

  return (
    <div className="bg-slate-900/80 rounded-lg p-4 border border-cyan-500/30">
      <h3 className="text-cyan-400 text-sm font-mono mb-3">WarpFactory Diagnostics</h3>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Energy Conditions */}
        <div className="space-y-1">
          <div className="text-slate-300">Energy Conditions (notes):</div>
          <div className={`font-mono text-xs ${zeta < 1 ? "text-green-400" : "text-yellow-400"}`}>
            • Ford–Roman QI margin ζ = {fmtFixed(zeta, 3)} {zeta < 1 ? "(PASS)" : "(WARN)"}
          </div>
          <div className="font-mono text-xs text-slate-400">
            • Classical WEC/NEC: violated for warp metrics (expected); monitor QI instead.
          </div>
        </div>

        {/* Scalar readout */}
        <div className="space-y-1">
          <div className="text-slate-300">GR Scalars:</div>
          <div className="font-mono text-cyan-400">θ: {fmtExp(scalars[10]?.theta, 2)}</div>
          <div className="font-mono text-purple-400">σ: {fmtExp(scalars[10]?.sigma, 2)}</div>
          <div className="font-mono text-yellow-400">ω: {fmtFixed(scalars[10]?.omega, 3)}</div>
        </div>
      </div>

      {/* Mini visualization */}
      <div className="mt-3 h-12 bg-slate-800 rounded border">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
          {/* Expansion sparkline */}
          <polyline
            points={scalars
              .map((d, i) => `${xAt(i, scalars.length)},${yTheta(d.theta)}`)
              .join(" ")}
            fill="none"
            stroke="rgb(34,211,238)"
            strokeWidth="1"
            className="opacity-70"
          />
          {/* Shear sparkline */}
          <polyline
            points={scalars
              .map((d, i) => `${xAt(i, scalars.length)},${ySigma(d.sigma)}`)
              .join(" ")}
            fill="none"
            stroke="rgb(168,85,247)"
            strokeWidth="1"
            className="opacity-70"
          />
        </svg>
      </div>

      <div className="mt-2 text-xs text-slate-400 font-mono">
        Mode: {mode} | β₀: {fmtExp(beta0, 2)} | sag: {fmtFixed(sagDepth, 0)} nm
      </div>

      {/* Equations & Invariants Section */}
      <h4 className="mt-4 mb-2 text-xs font-semibold tracking-wide text-cyan-400">Equations & Invariants</h4>

      <div className="space-y-3">
        {/* Casimir energy density */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="u_{\mathrm{Casimir}} = -\pi^2 \hbar c / (720 a^4)" className="text-cyan-300" />
                <span className="ml-2 text-slate-400">baseline energy density</span>
              </div>
              <div className="text-sm tabular-nums text-cyan-400">{fmtFixed(gapNm, 3)}&nbsp;nm gap</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong>
            <br />
            Plate separation <em>a</em> sets the baseline vacuum energy density that all later amplification leans on. Geometry and Q only scale
            what this term makes available.
            <br />
            <br />
            <em>Moving Zen:</em> Posture before movement—the quiet stance that makes later action clean.
          </TooltipContent>
        </Tooltip>

        {/* Geometry amplification */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="U_{\mathrm{geo}} = \gamma_{\mathrm{geo}} \times U_{\mathrm{static}}" className="text-purple-300" />
                <span className="ml-2 text-slate-400">curvature amplification</span>
              </div>
              <div className="text-sm tabular-nums text-purple-400">
                γ<sub>geo</sub>= {fmtFixed(gammaGeo, 2)}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong>
            <br />
            The geometric factor raises the static cavity energy to the field posture the hull actually presents to the solver and scheduler.
            <br />
            <br />
            <em>Moving Zen:</em> Set range before timing (maai); correct form makes outcomes quiet.
          </TooltipContent>
        </Tooltip>

        {/* Per-tile raw power */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="P_{\mathrm{raw,tile}} = |U_{\mathrm{geo}}|\ \omega / Q_{\mathrm{on}}" className="text-yellow-300" />
                <span className="ml-2 text-slate-400">dissipation at resonance</span>
              </div>
              <div className="text-sm tabular-nums text-yellow-400">Q = {fmtExp(qFactor, 2)}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong>
            <br />
            Intrinsic tile power before throttles; sensitive to both frequency and the “on” quality factor used in operation.
            <br />
            <br />
            <em>Moving Zen:</em> Accuracy is final—form before speed.
          </TooltipContent>
        </Tooltip>

        {/* Average throttled power */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="P_{\mathrm{avg}} = P_{\mathrm{raw}} \times f_{\mathrm{throttle}}" className="text-green-300" />
                <span className="ml-2 text-slate-400">operational budget</span>
              </div>
              <div className="text-sm tabular-nums text-green-400">
                {fmtFixed(powerMW, 1)}&nbsp;MW @ duty {fmtFixed((duty ?? 0) * 100, 2)}%
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong>
            <br />
            Duty, Q-spoiling, and sectoring set the real cadence the system can sustain without decohering or overheating.
            <br />
            <br />
            <em>Moving Zen:</em> Breath and step together—distance and timing are interdependent.
          </TooltipContent>
        </Tooltip>

        {/* Time-scale separation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="T_s/T_{\mathrm{LC}} \ge T_{\min}" className="text-blue-300" />
                <span className="ml-2 text-slate-400">homogenization ahead of drive</span>
              </div>
              <div className="text-sm tabular-nums text-blue-400">{fmtFixed(tsRatio, 2)}&nbsp;(min 100)</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong>
            <br />
            Keeping structural relaxation faster than drive change prevents spurious curvature growth—your stability margin in time.
            <br />
            <br />
            <em>Moving Zen:</em> Patience is speed in disguise; let structure settle, then move.
          </TooltipContent>
        </Tooltip>

        {/* Ford–Roman guard (ζ margin) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="\langle T_{00}\rangle_{\tau} \ge -\kappa/\tau^4 \Rightarrow \zeta\ \text{(margin)}" className="text-orange-300" />
                <span className="ml-2 text-slate-400">QI (FR) compliance</span>
              </div>
              <div className="text-sm tabular-nums text-orange-400">ζ = {fmtFixed(zeta, 3)}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong>
            <br />
            The quantum-inequality bound limits usable negative energy per sampling time. The scheduler throttles to keep ζ inside the safe
            manifold.
            <br />
            <br />
            <em>Moving Zen:</em> Compassion is part of skill—restraint protects crew and mission.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}