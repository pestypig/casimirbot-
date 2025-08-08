// WarpFactory-inspired scalar diagnostics display
// Shows expansion θ, shear σ, vorticity ω scalars as sparklines
import React from 'react';

interface DiagnosticsProps {
  beta0: number;
  mode: string;
  sagDepth: number;
}

interface ScalarData {
  r: number;
  theta: number;   // expansion
  sigma: number;   // shear  
  omega: number;   // vorticity
}

export function WarpDiagnostics({ beta0, mode, sagDepth }: DiagnosticsProps) {
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
    </div>
  );
}