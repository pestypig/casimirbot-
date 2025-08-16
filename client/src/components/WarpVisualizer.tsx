import { useEffect, useRef, useState } from 'react';

// Extend Window interface for 3D WarpEngine
declare global {
  interface Window {
    WarpEngine: any;
  }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { WarpDiagnostics } from './WarpDiagnostics';
import { zenLongToast } from '@/lib/zen-long-toasts';

interface WarpVisualizerProps {
  parameters: {
    dutyCycle: number;
    g_y: number;
    cavityQ: number;
    sagDepth_nm: number;
    tsRatio: number;
    powerAvg_MW: number;
    exoticMass_kg: number;
    // Operational mode data
    currentMode?: string;
    sectorStrobing?: number;
    qSpoilingFactor?: number;
    gammaVanDenBroeck?: number;
    // Hull geometry data
    hull?: {
      Lx_m: number;
      Ly_m: number;
      Lz_m: number;
      a: number;
      b: number;
      c: number;
    };
    wall?: {
      w_norm: number;
    };
  };
}

export function WarpVisualizer({ parameters }: WarpVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const animationRef = useRef<number>();
  const [isRunning, setIsRunning] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [diag, setDiag] = useState<any|null>(null);

  useEffect(() => {
    const initializeEngine = async () => {
      if (!canvasRef.current) return;

      try {
        // Check if WarpEngine is already loaded  
        if (window.WarpEngine) {
          try {
            engineRef.current = new window.WarpEngine(canvasRef.current);
            setIsLoaded(true);
          } catch (error) {
            console.error('Failed to initialize existing WarpEngine:', error);
          }
          return;
        }

        // Load the 3D WebGL WarpEngine with enhanced 3D ellipsoidal shell physics
        const script = document.createElement('script');
        script.src = '/warp-engine-fixed.js?v=8'; // Physics chain fix
        console.log('Loading 3D WarpEngine from:', script.src);
        script.onload = () => {
          console.log('WarpEngine loaded, window.WarpEngine available:', !!window.WarpEngine);
          if (window.WarpEngine) {
            try {
              console.log('Creating WarpEngine instance...');
              engineRef.current = new window.WarpEngine(canvasRef.current);
              console.log('WarpEngine instance created successfully - checking mode:', engineRef.current.isWebGLFallback ? 'FALLBACK' : 'WEBGL');
              setIsLoaded(true);
            } catch (error) {
              console.error('Failed to initialize WarpEngine:', error);
              setIsLoaded(false);
            }
          } else {
            console.error('WarpEngine not found on window after script load');
          }
        };
        script.onerror = () => {
          console.error('Failed to load WarpEngine');
          setIsLoaded(false);
        };
        document.head.appendChild(script);

        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (error) {
        console.error('Failed to initialize WarpEngine:', error);
        setIsLoaded(false);
      }
    };

    initializeEngine();

    return () => {
      // Clean up engine resources
      if (engineRef.current?.destroy) {
        engineRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current && isLoaded) {
      console.log('🔄 Live operational mode update:', {
        mode: parameters.currentMode || 'hover',
        dutyCycle: parameters.dutyCycle,
        g_y: parameters.g_y,
        cavityQ: parameters.cavityQ,
        sagDepth_nm: parameters.sagDepth_nm,
        powerAvg_MW: parameters.powerAvg_MW,
        exoticMass_kg: parameters.exoticMass_kg,
        sectorStrobing: parameters.sectorStrobing,
        qSpoilingFactor: parameters.qSpoilingFactor,
        gammaVanDenBroeck: parameters.gammaVanDenBroeck
      });

      // === RECONNECT: push all mode-related uniforms ===
      const mode = parameters.currentMode ?? "hover";
      
      // Helper to ensure numeric values
      const num = (v: any, def = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : def;
      };

      // Duty as fraction [0..1]
      const dutyFrac = Math.max(0, Math.min(1, num(parameters.dutyCycle, 0.14)));
      
      // Sector count (hover=1, cruise=400, etc.)
      const sectors = Math.max(1, Math.floor(num(parameters.sectorStrobing, 1)));
      
      // Optional view selection (avg vs instantaneous)
      const viewAvg = true; // Default to averaged view
      
      // Smooth strobe split phase
      const phaseSplit = Math.max(0, Math.min(sectors - 1, Math.floor(sectors / 2)));
      
      // DEBUG
      console.log("🎛️ uniforms-to-engine", {
        mode,
        dutyFrac,
        sectors,
        phaseSplit,
        g_y: parameters.g_y,
        cavityQ: parameters.cavityQ,
        qSpoil: parameters.qSpoilingFactor,
        gammaVdB: parameters.gammaVanDenBroeck,
        viewAvg
      });

      // Hull geometry from parameters or use needle hull defaults
      const hull = parameters.hull || {
        Lx_m: 1007, Ly_m: 264, Lz_m: 173,
        a: 503.5, b: 132, c: 86.5
      };
      const wallWidth = num(parameters.wall?.w_norm, 16e-9); // 16 nm in meters

      // Mode reconnection: push all mode-related uniforms
      engineRef.current.updateUniforms({
        // Mode knobs
        currentMode: mode,
        dutyCycle: dutyFrac,
        sectors,
        split: phaseSplit,
        viewAvg,

        // Amplification chain
        gammaGeo: num(parameters.g_y, 26),
        Qburst: num(parameters.cavityQ, 1e9),
        deltaAOverA: num(parameters.qSpoilingFactor, 1),
        gammaVdB: num(parameters.gammaVanDenBroeck, 2.86e5),

        // Hull / wall
        hullAxes: [num(hull.a), num(hull.b), num(hull.c)],
        wallWidth,
        
        // Visual scaling
        betaGain: 0.15,                                  // Reduced to avoid clamp saturation
        
        // Legacy parameters for backward compatibility
        sagDepth_nm: num(parameters.sagDepth_nm),
        powerAvg_MW: num(parameters.powerAvg_MW),
        exoticMass_kg: num(parameters.exoticMass_kg),
        tsRatio: num(parameters.tsRatio, 4100)
      });

      // Debug output to console
      console.table(engineRef.current.uniforms);
    }
  }, [parameters, isLoaded]);

  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        // The optimized engine handles its own resizing automatically
        // through the _resize() method bound to window resize events
        if (engineRef.current._resize) {
          engineRef.current._resize();
        }
      }
    };

    // Manual resize trigger for component changes
    if (isLoaded && engineRef.current) {
      handleResize();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded]);

  // Wire up diagnostics callback
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.onDiagnostics = (d: any) => setDiag(d);
    return () => { if (engineRef.current) engineRef.current.onDiagnostics = null; };
  }, [isLoaded]);

  const toggleAnimation = () => {
    setIsRunning(!isRunning);
    if (engineRef.current) {
      if (!isRunning) {
        // Resume animation loop
        engineRef.current._startRenderLoop();
      } else {
        // Pause animation loop
        if (engineRef.current.animationId) {
          cancelAnimationFrame(engineRef.current.animationId);
          engineRef.current.animationId = null;
        }
      }
    }
  };

  const resetView = () => {
    if (engineRef.current) {
      // Reset any view parameters if needed
      engineRef.current.updateUniforms(parameters);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Natário Warp Bubble</CardTitle>
            <CardDescription>
              {parameters.currentMode ? 
                `${parameters.currentMode.toUpperCase()} Mode - Real-time spacetime curvature` : 
                'Real-time spacetime curvature visualization'
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toggleAnimation();
                zenLongToast("helix:pulse", {
                  duty: parameters.dutyCycle,
                  freqGHz: 15.0, // Based on 15 GHz from TS ratio
                  sectors: parameters.sectorStrobing || 1,
                  frOk: true, // Assume good state for demo
                  natarioOk: true,
                  curvatureOk: true
                });
              }}
              data-testid="button-toggle-animation"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetView();
                zenLongToast("helix:diagnostics", {
                  zeta: 0.032,
                  tsRatio: parameters.tsRatio,
                  frOk: true,
                  natarioOk: true,
                  curvatureOk: true
                });
              }}
              data-testid="button-reset-view"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            width={512}
            height={256}
            data-testid="canvas-warp-bubble"
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2 mx-auto"></div>
                <div className="text-sm">Loading Warp Engine...</div>
              </div>
            </div>
          )}
          
          {/* Live operational mode HUD (inspired by GPT's suggestion) */}
          {isLoaded && (
            <div className="absolute top-2 left-2 bg-black/80 rounded px-2 py-1 text-xs font-mono">
              <div className="text-cyan-400 font-semibold">
                {parameters.currentMode?.toUpperCase() || 'HOVER'} MODE
              </div>
              <div className="text-green-400">
                P: {parameters.powerAvg_MW.toFixed(1)}MW | 
                D: {(parameters.dutyCycle * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duty Cycle:</span>
                <span className="text-cyan-400">{(parameters.dutyCycle * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">γ Geometric:</span>
                <span className="text-orange-400">{parameters.g_y.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Q Factor:</span>
                <span className="text-yellow-400">{parameters.cavityQ.toExponential(1)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sag Depth:</span>
                <span className="text-blue-400">{parameters.sagDepth_nm.toFixed(1)} nm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Power:</span>
                <span className="text-green-400">{parameters.powerAvg_MW.toFixed(1)} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exotic Mass:</span>
                <span className="text-purple-400">{parameters.exoticMass_kg.toFixed(0)} kg</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Operational Mode Physics:</div>
            <div className="mb-2 text-cyan-300">
              <strong>{parameters.currentMode?.toUpperCase() || 'HOVER'} MODE</strong> - 
              {parameters.currentMode === 'hover' && ' gentle bulge, slow ripple'}
              {parameters.currentMode === 'cruise' && ' field nearly flat, faint ripple'}
              {parameters.currentMode === 'emergency' && ' strong bulge, fast shimmer'}
              {parameters.currentMode === 'standby' && ' grid perfectly flat, background calm'}
            </div>
            <div>• <span className="text-orange-400">Sector Strobing</span>: {parameters.sectorStrobing || 1}× spatial coherence</div>
            <div>• <span className="text-yellow-400">Q Spoiling</span>: {((parameters.qSpoilingFactor || 1) * 100).toFixed(0)}% cavity efficiency</div>
            <div>• <span className="text-purple-400">γ Van den Broeck</span>: {(parameters.gammaVanDenBroeck || 6.57e7).toExponential(1)} curvature amplifier</div>
            <div className="mt-2 text-slate-500">
              <span className="font-semibold">3D Grid:</span> Live Natário spacetime curvature with mode-specific deformation scaling
            </div>
          </div>
        </div>
        
        {/* Real-time β Calculations Panel - Moved outside visualization canvas */}
        <div className="mt-4 bg-slate-800/50 border border-cyan-500/20 rounded-lg p-4">
          <h3 className="text-cyan-400 font-mono text-sm mb-3">Real-Time Natário β Field Calculations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Physics Equations */}
            <div className="space-y-2">
              <div className="text-cyan-300">
                <div>β(r) = β₀ × (r/R) × exp(-r²/R²)</div>
                <div className="text-cyan-500 text-xs">[Natário 2002 Canonical Bell Profile]</div>
              </div>
              
              <div className="text-green-300">
                <div>β₀ = duty × γ_geo = {parameters.dutyCycle.toFixed(3)} × {parameters.g_y} = {(parameters.dutyCycle * parameters.g_y).toFixed(3)}</div>
              </div>
              
              <div className="text-blue-300">
                <div>R = {parameters.sagDepth_nm}nm | View = {(parameters.sagDepth_nm * 4)}nm (4× zoom)</div>
                <div>s_max = {(2.0).toFixed(2)} | γᵢⱼ = δᵢⱼ (flat spatial metric)</div>
              </div>
              
              <div className="text-yellow-300">
                <div>ρ = (|∇×β|² - |∇β|²)/(16π)</div>
                <div className="text-yellow-500 text-xs">[Authentic Natário Energy Density]</div>
              </div>
            </div>
            
            {/* Live β Sampling */}
            <div className="space-y-2">
              <div className="text-cyan-300 font-semibold">Live β Field Samples:</div>
              {[
                { name: 'Center', s: 0, color: 'text-white' },
                { name: 'R/2', s: 0.5, color: 'text-green-300' },
                { name: 'R', s: 1.0, color: 'text-yellow-300' },
                { name: 'Edge', s: 2.0, color: 'text-red-300' }
              ].map(point => {
                const beta0 = parameters.dutyCycle * parameters.g_y;
                const betaValue = beta0 * point.s * Math.exp(-point.s * point.s);
                return (
                  <div key={point.name} className={`${point.color} flex justify-between`}>
                    <span>{point.name} (s={point.s.toFixed(2)}):</span>
                    <span>β = {betaValue.toExponential(2)}</span>
                  </div>
                );
              })}
              
              {/* Live Parameters */}
              <div className="mt-4 pt-3 border-t border-cyan-500/20">
                <div className="text-cyan-300 font-semibold mb-2">Current Parameters:</div>
                <div className="text-green-300">Mode: {parameters.currentMode || 'hover'}</div>
                <div className="text-green-300">Power: {parameters.powerAvg_MW.toFixed(1)}MW</div>
                <div className="text-green-300">Duty: {(parameters.dutyCycle * 100).toFixed(1)}%</div>
                {parameters.hull && (
                  <div className="text-blue-300 mt-2">
                    <div>Hull: {parameters.hull.Lx_m}×{parameters.hull.Ly_m}×{parameters.hull.Lz_m}m</div>
                    <div>Semi-axes: {parameters.hull.a.toFixed(1)}×{parameters.hull.b.toFixed(1)}×{parameters.hull.c.toFixed(1)}m</div>
                  </div>
                )}
                <div className="text-green-300">Q-Factor: {parameters.cavityQ.toExponential(0)}</div>
                <div className="text-green-300">Exotic Mass: {parameters.exoticMass_kg}kg</div>
              </div>
              
              {/* Debug Controls */}
              <div className="mt-3 pt-3 border-t border-cyan-500/20">
                <div className="text-purple-300 text-xs">
                  Press 'W' to toggle warp effects on/off for debugging
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* WarpFactory-inspired diagnostics panel */}
        <div className="mt-4">
          <WarpDiagnostics 
            beta0={parameters.dutyCycle * parameters.g_y}
            mode={parameters.currentMode || 'unknown'}
            sagDepth={parameters.sagDepth_nm}
            gapNm={1.0} // Standard Casimir gap
            gammaGeo={parameters.g_y}
            qFactor={parameters.cavityQ}
            duty={parameters.dutyCycle}
            powerMW={parameters.powerAvg_MW}
            tsRatio={parameters.tsRatio || 4102.7}
            zeta={0.032}
          />
        </div>
        
        {/* Natário Proof Panel */}
        {diag && (
          <div className="mt-4 bg-slate-900/60 border border-cyan-500/20 rounded-lg p-4 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-cyan-400">Natário Proof Panel</h3>
              <div className="flex gap-3">
                <span className={diag.york_sign_ok ? "text-green-400" : "text-red-400"}>
                  York sign {diag.york_sign_ok ? "PASS" : "FAIL"}
                </span>
                <span className={diag.hover_sym_ok ? "text-green-400" : "text-yellow-400"}>
                  Hover symmetry {diag.hover_sym_ok ? "PASS" : "WARN"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div>mode: {diag.mode}</div>
                <div>sectors: {diag.sectors}</div>
                <div>phase: {diag.phase?.toFixed?.(2) ?? '—'}</div>
                <div>duty: {diag.duty != null ? (diag.duty*100).toFixed(2)+'%' : '—'}</div>
              </div>
              <div>
                <div>β_inst: {diag.beta_inst?.toExponential?.(2) ?? '—'}</div>
                <div>β_avg:  {diag.beta_avg?.toExponential?.(2) ?? '—'}</div>
                <div>β_net:  {diag.beta_net?.toExponential?.(2) ?? '—'}</div>
              </div>
              <div>
                <div>θ_front: [{diag.theta_front_min?.toExponential?.(2) ?? '—'}, {diag.theta_front_max?.toExponential?.(2) ?? '—'}]</div>
                <div>θ_rear : [{diag.theta_rear_min?.toExponential?.(2) ?? '—'}, {diag.theta_rear_max?.toExponential?.(2) ?? '—'}]</div>
                <div>T00̄ (proxy): {diag.T00_avg_proxy?.toExponential?.(2) ?? '—'}  |  σ_eff≈{diag.sigma_eff?.toFixed?.(1) ?? '—'}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

declare global {
  interface Window {
    WarpEngine: any;
  }
}