// WarpFactory-inspired scalar diagnostics display
// Shows expansion θ, shear σ, vorticity ω scalars as sparklines
import React from 'react';
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
  theta: number;   // expansion
  sigma: number;   // shear  
  omega: number;   // vorticity
}

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
  zeta = 0.032
}: DiagnosticsProps) {
  // WarpFactory-inspired: Compute scalar diagnostics
  const computeScalars = (): ScalarData[] => {
    const data: ScalarData[] = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const r = i / steps;
      const beta = beta0 * Math.exp(-(r * r) / 0.1);  // Gaussian profile
      
      // Simplified GR scalars (real WarpFactory would use full Einstein equations)
      const theta = -beta * 0.1;  // expansion (negative for contraction)
      const sigma = Math.abs(beta * 0.05);  // shear magnitude
      const omega = 0;  // vorticity (zero for spherically symmetric)
      
      data.push({ r, theta, sigma, omega });
    }
    
    return data;
  };

  const scalars = computeScalars();
  
  // Energy condition check (WarpFactory-style)
  const wecViolated = beta0 > 100000;
  const necViolated = beta0 > 50000;
  
  return (
    <div className="bg-slate-900/80 rounded-lg p-4 border border-cyan-500/30">
      <h3 className="text-cyan-400 text-sm font-mono mb-3">
        WarpFactory Diagnostics
      </h3>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Energy Conditions */}
        <div className="space-y-1">
          <div className="text-slate-300">Energy Conditions:</div>
          <div className={`font-mono ${wecViolated ? 'text-red-400' : 'text-green-400'}`}>
            WEC: {wecViolated ? 'VIOLATED' : 'SATISFIED'}
          </div>
          <div className={`font-mono ${necViolated ? 'text-red-400' : 'text-green-400'}`}>
            NEC: {necViolated ? 'VIOLATED' : 'SATISFIED'}
          </div>
        </div>
        
        {/* Scalar Sparklines */}
        <div className="space-y-1">
          <div className="text-slate-300">GR Scalars:</div>
          <div className="font-mono text-cyan-400">
            θ: {scalars[10]?.theta.toExponential(2)}
          </div>
          <div className="font-mono text-purple-400">
            σ: {scalars[10]?.sigma.toExponential(2)}
          </div>
          <div className="font-mono text-yellow-400">
            ω: {scalars[10]?.omega.toFixed(3)}
          </div>
        </div>
      </div>
      
      {/* Mini visualization */}
      <div className="mt-3 h-12 bg-slate-800 rounded border">
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Expansion sparkline */}
          <polyline
            points={scalars.map((d, i) => 
              `${(i / scalars.length) * 100}%,${50 + d.theta * 200}%`
            ).join(' ')}
            fill="none"
            stroke="rgb(34 211 238)"
            strokeWidth="1"
            className="opacity-70"
          />
          
          {/* Shear sparkline */}
          <polyline
            points={scalars.map((d, i) => 
              `${(i / scalars.length) * 100}%,${50 - d.sigma * 200}%`
            ).join(' ')}
            fill="none"
            stroke="rgb(168 85 247)"
            strokeWidth="1"
            className="opacity-70"
          />
        </svg>
      </div>
      
      <div className="mt-2 text-xs text-slate-400 font-mono">
        Mode: {mode} | β₀: {beta0.toExponential(2)} | R: {sagDepth}nm
      </div>

      {/* Equations & Invariants Section */}
      <h4 className="mt-4 mb-2 text-xs font-semibold tracking-wide text-cyan-400">
        Equations & Invariants
      </h4>
      
      <div className="space-y-3">
        {/* Casimir energy density */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="u_Casimir = -π²ℏc/(720a⁴)" className="text-cyan-300" /> 
                <span className="ml-2 text-slate-400">baseline energy density</span>
              </div>
              <div className="text-sm tabular-nums text-cyan-400">{gapNm?.toFixed?.(3)}&nbsp;nm gap</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong><br/>
            Plate separation <em>a</em> sets the baseline vacuum energy density that all later amplification leans on. Geometry and Q only scale what this term makes available.<br/><br/>
            <em>Moving Zen:</em> Posture before movement—the quiet stance that makes later action clean.
          </TooltipContent>
        </Tooltip>

        {/* Geometry amplification */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="U_geo = γ_geo × U_static" className="text-purple-300" />
                <span className="ml-2 text-slate-400">curvature amplification</span>
              </div>
              <div className="text-sm tabular-nums text-purple-400">γ<sub>geo</sub>= {gammaGeo?.toFixed?.(2)}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong><br/>
            The geometric factor raises the static cavity energy to the field posture the hull actually presents to the solver and scheduler.<br/><br/>
            <em>Moving Zen:</em> Set range before timing (maai); correct form makes outcomes quiet.
          </TooltipContent>
        </Tooltip>

        {/* Per-tile raw power */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="P_raw,tile = |U_geo| × ω / Q_on" className="text-yellow-300" />
                <span className="ml-2 text-slate-400">dissipation at resonance</span>
              </div>
              <div className="text-sm tabular-nums text-yellow-400">Q= {qFactor?.toExponential?.(2)}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong><br/>
            Intrinsic tile power before throttles; sensitive to both frequency and the "on" quality factor used in operation.<br/><br/>
            <em>Moving Zen:</em> Accuracy is final—form before speed.
          </TooltipContent>
        </Tooltip>

        {/* Average throttled power */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="P_avg = P_raw × f_throttle" className="text-green-300" />
                <span className="ml-2 text-slate-400">operational budget</span>
              </div>
              <div className="text-sm tabular-nums text-green-400">{powerMW?.toFixed?.(1)}&nbsp;MW @ duty {((duty??0)*100).toFixed(2)}%</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong><br/>
            Duty, Q-spoiling, and sectoring set the real cadence the system can sustain without decohering or overheating.<br/><br/>
            <em>Moving Zen:</em> Breath and step together—distance and timing are interdependent.
          </TooltipContent>
        </Tooltip>

        {/* Time-scale separation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="T_s/T_LC ≥ T_min" className="text-blue-300" /> 
                <span className="ml-2 text-slate-400">homogenization ahead of drive</span>
              </div>
              <div className="text-sm tabular-nums text-blue-400">{tsRatio?.toFixed?.(2)}&nbsp;(min 100)</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong><br/>
            Keeping structural relaxation faster than drive change prevents spurious curvature growth—your stability margin in time.<br/><br/>
            <em>Moving Zen:</em> Patience is speed in disguise; let structure settle, then move.
          </TooltipContent>
        </Tooltip>

        {/* Ford–Roman guard (ζ margin) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-baseline justify-between cursor-help">
              <div className="text-xs text-slate-300">
                <Eq tex="⟨T_00⟩_τ ≥ -κ/τ⁴ ⇒ ζ (margin)" className="text-orange-300" />
                <span className="ml-2 text-slate-400">QI (FR) compliance</span>
              </div>
              <div className="text-sm tabular-nums text-orange-400">ζ = {zeta?.toFixed?.(3)}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong><br/>
            The quantum-inequality bound limits usable negative energy per sampling time. The scheduler throttles to keep ζ inside the safe manifold.<br/><br/>
            <em>Moving Zen:</em> Compassion is part of skill—restraint protects crew and mission.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}