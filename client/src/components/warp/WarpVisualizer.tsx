import { useEffect, useRef, useState } from 'react';

// Global WarpEngine interface defined in types/globals.d.ts
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { WarpDiagnostics } from './WarpDiagnostics';
import { zenLongToast } from '@/lib/zen-long-toasts';
import * as VIS from '@/constants/VIS';
import { driveWarpFromPipeline } from '@/lib/warp-pipeline-adapter';

// ---- Visualization & Physics-Bridge Constants (no hidden magic) ----
const VIS_LOCAL = {
  // Grid & mesh
  spanPaddingDesktop: VIS.spanPaddingDesktop,
  spanPaddingPhone: 1.45,
  minSpan: VIS.minSpan,
  baseDivMin: 160,
  divCap: 320,
  targetVertsAcrossWall: 12,
  yBase: -0.15,
  yVariation: 0.05,

  // Camera
  fovDesktopRad: VIS.fovDesktopRad,   // ~55°
  fovPortraitRad: VIS.fovPortraitRad,   // ~68°
  portraitAspectKnee: 1.2,
  portraitBlendWidth: 0.6,
  baseMargin: 1.22,
  portraitMarginMul: 1.12,
  nearFar: { near: 0.08, far: 100.0 },
  nearFarAlt: { near: 0.1, far: 200.0 },
  eyeYScale: 0.62,
  lookDownScale: -0.12,
  dprCapPhone: 1.5,
  dprCapDesktop: 2.0,

  // Shading & colors
  colorDiverge: {
    blue: [0.15, 0.45, 1.0],
    white: [1, 1, 1],
    red: [1.0, 0.45, 0.0],
  },
  interiorViolet: [0.70, 0.30, 1.00],
  alphaGrid: 0.85,
  alphaGridGL2: 0.9,

  // Temporal smoothing
  dispBlendAlpha: 0.25,

  // Physics→visual bridge
  defaultWallWidthRho: VIS.defaultWallWidthRho,      // ρ-units, used only if not computed
  gridGain: 0.12,                   // geometry push gain
  vizNorm: 1e-9,                    // amplitude normalizer
  vizGainDefault: VIS.vizGainDefault,
  vizGainEmergency: VIS.vizGainEmergency,
  vizGainCruise: VIS.vizGainCruise,
  exposureDefault: VIS.exposureDefault,
  zeroStopDefault: VIS.zeroStopDefault,
  // Legacy constants (no longer control visuals but kept for compatibility)
  logKnee: 1e10,                    // deprecated: engine handles compression internally
  logSlope: 1.0,                    // deprecated: unified log mapping in engine
  modeScale: { standby: 0.05, cruise: 0.25, hover: 0.60, emergency: 0.90 }, // deprecated: light seasoning in engine
  strobeBlendWidth: 1.5,
  frontBackSoftDiv: 0.15,
  maxPush: 0.22,                    // clamp ceiling (matches engine)
  interior: { minWindow: 0.02, widthMul: 3.0, tiltGain: 0.55, maxTilt: 0.05, tintViz: 8.0 },
};

// Safe formatters and parameter extractors (fixes accuracy/safety during mode switches)
const isFiniteNum = (v: any): v is number => typeof v === 'number' && Number.isFinite(v);
const safeFix = (v: any, d = 0, digits = 1) => isFiniteNum(v) ? v.toFixed(digits) : d.toFixed(digits);
const safeExp = (v: any, digits = 1, fallback = '—') => isFiniteNum(v) ? v.toExponential(digits) : fallback;
const num = (v: any, d = 0) => (isFiniteNum(v) ? v : d);
const vec3 = (v: any, d: [number, number, number] = [0, -1, 0]) =>
  Array.isArray(v) && v.length === 3 && v.every(isFiniteNum) ? (v as [number, number, number]) : d;

// Unified physics tilt calculation
const getUnifiedPhysicsTilt = (parameters: any, mode: string) => 
  num(parameters.shift?.epsilonTilt ?? parameters.epsilonTilt, mode === 'standby' ? 0.0 : 5e-7);

// Helper for clamping values to 0-1 range
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Light-crossing timing loop for synchronized strobing
type LightCrossing = {
  sectorIdx: number;
  sectorCount: number;
  phase: number;            // 0..1
  dwell_ms: number;
  tauLC_ms: number;
  burst_ms: number;
  duty: number;             // local window duty (burst_ms / dwell_ms)
  freqGHz: number;
  onWindow: boolean;        // physics gate
  cyclesPerBurst: number;
  onWindowDisplay: boolean; // display gate
};

// Shift/tilt parameters for gentle interior gravity
type ShiftParams = {
  epsilonTilt?: number;                    // dimensionless ε_tilt
  betaTiltVec?: [number, number, number];  // unit-ish direction for "down"
  gTarget?: number;
  R_geom?: number;
  gEff_check?: number;
};

interface LoadingState {
  type: 'loading' | 'compiling' | 'ready';
  message: string;
}

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
    // Visualization overrides
    viz?: {
      colorMode?: 'solid'|'theta'|'shear'|0|1|2;
      curvatureGainT?: number;       // 0..1
      curvatureBoostMax?: number;    // ≥1
      exposure?: number;             // ~3..12
      zeroStop?: number;             // ~1e-9..1e-5
      cosmeticLevel?: number;        // 1..10
    };
    /** Optional: ship-effective duty (Ford–Roman sampled). Prefer this over dutyCycle when present. */
    dutyEffectiveFR?: number;
    /** Optional: live light crossing loop for synchronized strobing */
    lightCrossing?: LightCrossing;
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
    // Grid scaling
    gridScale?: number;
    gridSpan?: number;
    axesScene?: [number, number, number];
    // NEW: Artificial gravity tilt parameters (legacy format)
    epsilonTilt?: number;
    betaTiltVec?: number[];
    wallWidth_m?: number;
    // Curvature gain controls (legacy and new approaches)
    curvatureGainT?: number;        // Legacy T blend mode (0-1)
    curvatureBoostMax?: number;     // Legacy boost maximum
    curvatureGainDec?: number;      // NEW: Direct decades gain (0-8)
    // NEW: Shift parameters (structured format)
    shift?: ShiftParams;
    // 🔬 Physics Parity Mode for debugging baseline
    physicsParityMode?: boolean;
  };
}

export function WarpVisualizer({ parameters }: WarpVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const animationRef = useRef<number>();
  const [isRunning, setIsRunning] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [diag, setDiag] = useState<any|null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({ type: 'loading', message: 'Initializing...' });
  const [initNonce, setInitNonce] = useState(0); // bump to retry

  // --- Simple per-mode defaults for interior tilt (demo-friendly) ---
  // You can later replace this with the exact value from the Shift Vector panel
  // (epsilonTilt = g_target * R_geom / c^2) and pass it via props.parameters.epsilonTilt.
  const modeEpsilonTilt = (mode: string | undefined) => {
    switch ((mode || 'hover').toLowerCase()) {
      case 'standby':   return 0.000; // perfectly flat
      case 'cruise':    return 0.012; // subtle
      case 'hover':     return 0.020; // noticeable
      case 'emergency': return 0.035; // stronger
      default:          return 0.015;
    }
  };

  // Default cabin "down" (can be overridden via props.parameters.betaTiltVec)
  const defaultBetaTilt: [number, number, number] = [0, -1, 0];

function installWarpPrelude(initialScale = 1.0) {
  if (typeof window === 'undefined') return;

  // Avoid double-injection on rerenders
  if ((window as any).__warpPreludeInstalled) return;

  // Create a <script> whose top-level runs in the global scope
  const prelude = document.createElement('script');
  prelude.id = 'warp-prelude';
  prelude.text = `
    // Ensure a real global variable (not just window.sceneScale)
    if (typeof sceneScale === 'undefined') { var sceneScale = ${Number.isFinite(initialScale) ? initialScale : 1.0}; }

    // Make setStrobingState a safe global, too (engine may call it)
    if (typeof setStrobingState === 'undefined') {
      function setStrobingState(_) { /* no-op until Helix wires it */ }
    }
  `;
  document.head.appendChild(prelude);
  (window as any).__warpPreludeInstalled = true;
}

useEffect(() => {
  let cancelled = false;
  let watchdog: number | undefined;

  const setLoaded = () => { if (!cancelled) setIsLoaded(true); };
  const setFailed = (msg: string) => { if (!cancelled) { setIsLoaded(false); setLoadError(msg); } };

  const makeEngine = (EngineCtor: any) => {
    if (!canvasRef.current) throw new Error("canvas missing");
    const engine = new EngineCtor(canvasRef.current);
    
    // Setup loading state callback for non-blocking shader compilation
    engine.onLoadingStateChange = (state: LoadingState) => {
      setLoadingState(state);
      if (state.type === 'ready') {
        setIsLoaded(true);
      }
    };

    // Build sanitized uniforms once
    const mode = (parameters.currentMode || 'hover').toLowerCase();
    
    // Resolve duty and sectors from pipeline (prefer dutyEffectiveFR > lightCrossing > dutyCycle)
    const lc = parameters.lightCrossing;
    
    // ⬇️ add this
    const dutyEffectiveFR = (() => {
      const burst = Number(lc?.burst_ms);
      const dwell = Number(lc?.dwell_ms);
      if (Number.isFinite(burst) && Number.isFinite(dwell) && dwell > 0) {
        return clamp01(burst / dwell);
      }
      return clamp01(isFiniteNum(parameters?.dutyCycle) ? parameters!.dutyCycle! : 0.14);
    })();
    
    const dutyResolved =
      isFiniteNum(parameters.dutyEffectiveFR) ? clamp01(parameters.dutyEffectiveFR!) :
      (lc && lc.dwell_ms > 0 ? clamp01(lc.burst_ms / lc.dwell_ms) :
       clamp01(num(parameters.dutyCycle, 0.14)));

    const sectorsResolved = Math.max(
      1,
      Math.floor(num(parameters.sectorStrobing, lc?.sectorCount ?? 1))
    );
    const splitResolved = Math.max(0, Math.min(sectorsResolved - 1, Math.floor(sectorsResolved / 2)));
    
    const hull = parameters.hull || { Lx_m: 1007, Ly_m: 264, Lz_m: 173, a: 503.5, b: 132, c: 86.5 };
    
    // Harden unit/finite guards for Q, γ, wall width (no hidden magic)
    const gammaGeo = Math.max(1, num(parameters.g_y, 26));
    const qCavity  = Math.max(1, num(parameters.cavityQ, 1e9));    // never ≤0
    const qSpoil   = Math.max(1e-6, num(parameters.qSpoilingFactor, 1));
    const wallNorm = Math.max(1e-5, num(parameters.wall?.w_norm, VIS_LOCAL.defaultWallWidthRho));

    // replace the mode-based tiltGain with a scaling of epsilonTilt magnitude
    const epsilonTiltResolved = num(
      parameters.shift?.epsilonTilt ?? parameters.epsilonTilt,
      mode === 'standby' ? 0.0 : 5e-7
    );
    const betaTiltResolved = vec3(parameters.shift?.betaTiltVec ?? parameters.betaTiltVec, [0, -1, 0]);
    
    // roughly normalize: 5e-7 → ~0.35, clamp at 0.65
    const tiltGainResolved = Math.max(0, Math.min(0.65, (epsilonTiltResolved / 5e-7) * 0.35));

    const parity = !!parameters.physicsParityMode; // hoist this near the top

    const uniforms = {
      // camera/exposure defaults moved into single bootstrap
      exposure: Math.max(1.0, VIS_LOCAL.exposureDefault),
      zeroStop: Math.max(1e-18, VIS_LOCAL.zeroStopDefault),
      curvatureGainDec: parity ? 0 : 3,
      curvatureBoostMax: parity ? 1 : (parameters.curvatureBoostMax ?? 40),
      curvatureGainT: parity ? 0 : (parameters.viz?.curvatureGainT ?? parameters.curvatureGainT ?? 0),

      dutyCycle: dutyResolved,
      gammaGeo,
      Qburst: qCavity,
      deltaAOverA: qSpoil,
      gammaVdB: num(parameters.gammaVanDenBroeck, 3.83e1),

      currentMode: mode,
      sectors: sectorsResolved, split: splitResolved,
      axesScene: parameters.axesScene,
      hullAxes: [num(hull.a), num(hull.b), num(hull.c)],
      wallWidth: wallNorm,

      gridSpan: parameters.gridSpan,
      physicsParityMode: !!parameters.physicsParityMode,

      epsilonTilt: epsilonTiltResolved,
      betaTiltVec: betaTiltResolved,
      tiltGain: tiltGainResolved,
    };

    // single bootstrap: fit + all uniforms in one shot
    engine.bootstrap(uniforms);
    
    // Apply viz overrides if provided
    engine.updateUniforms({
      colorMode: parameters.viz?.colorMode ?? 'theta',
      curvatureGainT: parity ? 0 : (parameters.viz?.curvatureGainT ?? parameters.curvatureGainT ?? 0),
      curvatureBoostMax: parity ? 1 : (parameters.viz?.curvatureBoostMax ?? parameters.curvatureBoostMax),
      exposure: parameters.viz?.exposure ?? undefined,
      zeroStop: parameters.viz?.zeroStop ?? undefined,
      cosmeticLevel: parameters.viz?.cosmeticLevel ?? undefined
    });

    // Pipeline-timed gating
    if (lc) {
      engine.updateUniforms({
        phase: lc.phase,                  // 0..1 sweep position
        onWindow: !!lc.onWindowDisplay,   // gate visuals to FR-compliant window
        sectorIdx: Math.max(0, lc.sectorIdx % sectorsResolved),
        tauLC_ms: lc.tauLC_ms,
        dwell_ms: lc.dwell_ms,
        burst_ms: lc.burst_ms,
      });
    }

    // visual knobs that aren't strictly physics
    engine.updateUniforms({
      vizGain: parity ? 1 : (
        mode === 'emergency' ? VIS_LOCAL.vizGainEmergency :
        mode === 'cruise'    ? VIS_LOCAL.vizGainCruise    :
                               VIS_LOCAL.vizGainDefault
      ),
      curvatureGainDec: parity ? 0 : Math.max(0, Math.min(8, parameters.curvatureGainDec ?? 0)),
      curvatureBoostMax: parity ? 1 : Math.max(1, parameters.curvatureBoostMax ?? 40),

      // legacy readouts (safe fallbacks)
      sagDepth_nm: parameters.sagDepth_nm || 16,
      powerAvg_MW: parameters.powerAvg_MW || VIS.powerAvgFallback,
      exoticMass_kg: parameters.exoticMass_kg || VIS.exoticMassFallback,
      tsRatio: parameters.tsRatio || VIS.tsRatioDefault
    });

    // start render explicitly so we get a first frame
    engine._startRenderLoop?.();

    // mark loaded on the next frame (ensures WebGL context is live)
    requestAnimationFrame(() => !cancelled && setLoaded());

    return engine;
  };

  // --- global strobing multiplexer (supports many viewers) ---
  const ensureStrobeMux = () => {
    const w = window as any;
    const prev = w.setStrobingState;                    // capture whatever is installed (engine or placeholder)
    if (!w.__strobeListeners) w.__strobeListeners = new Set();
    w.setStrobingState = (payload: { sectorCount:number; currentSector:number; split?:number }) => {
      try { typeof prev === 'function' && prev(payload); } catch {}
      for (const fn of w.__strobeListeners) {
        try { fn(payload); } catch {}
      }
    };
    w.__addStrobingListener = (fn:Function) => { w.__strobeListeners.add(fn); return () => w.__strobeListeners.delete(fn); };
  };

  const init = async () => {
    // derive an initial scale (fallback to your parameters.gridScale or 1.0)
    const initialScale = Number(parameters.gridScale ?? 1.0);
    installWarpPrelude(Number.isFinite(initialScale) ? initialScale : 1.0);
    

    setLoadError(null);
    setIsLoaded(false);

    // 6s watchdog to avoid infinite spinner
    watchdog = window.setTimeout(() => {
      setFailed("Timeout waiting for WarpEngine. Check /public/warp-engine-fixed.js and WebGL support.");
    }, 6000) as any;

    try {
      if ((window as any).WarpEngine) {
        engineRef.current = makeEngine((window as any).WarpEngine);
        ensureStrobeMux(); // wrap the engine's handler into the mux
        
        // Register with strobing multiplexer
        const off = (window as any).__addStrobingListener?.(({ sectorCount, currentSector, split }:{sectorCount:number;currentSector:number;split?:number;})=>{
          if (!engineRef.current) return;
          const s = Math.max(1, Math.floor(sectorCount||1));
          engineRef.current.updateUniforms({
            sectors: s,
            split: Math.max(0, Math.min(s-1, Number.isFinite(split)? (split as number|0) : Math.floor(s/2))),
            sectorIdx: Math.max(0, currentSector % s)
          });
          engineRef.current.requestRewarp?.();
        });
        // Store cleanup function for later
        (engineRef.current as any).__strobingCleanup = off;
        
        return;
      }

      // Try fixed bundle, then fall back
      const trySrcs = ['/warp-engine-fixed.js?v=tilt2', '/warp-engine.js?v=fallback'];
      for (const src of trySrcs) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        }).catch((e) => { console.warn(e.message); });

        if ((window as any).WarpEngine) {
          engineRef.current = makeEngine((window as any).WarpEngine);
          ensureStrobeMux(); // wrap the engine's handler into the mux
          
          // Register with strobing multiplexer
          const off = (window as any).__addStrobingListener?.(({ sectorCount, currentSector, split }:{sectorCount:number;currentSector:number;split?:number;})=>{
            if (!engineRef.current) return;
            const s = Math.max(1, Math.floor(sectorCount||1));
            engineRef.current.updateUniforms({
              sectors: s,
              split: Math.max(0, Math.min(s-1, Number.isFinite(split)? (split as number|0) : Math.floor(s/2))),
              sectorIdx: Math.max(0, currentSector % s)
            });
            engineRef.current.requestRewarp?.();
          });
          // Store cleanup function for later
          (engineRef.current as any).__strobingCleanup = off;
          
          return;
        }
      }

      throw new Error("WarpEngine not found on window after script load");
    } catch (err: any) {
      console.error('WarpEngine init error:', err);
      setFailed(err?.message || "Engine initialization failed");
    } finally {
      if (watchdog) clearTimeout(watchdog);
    }
  };

  const el = canvasRef.current;
  if (!el) return;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        init();
        io.disconnect();
      }
    }, { root: null, rootMargin: '200px 0px', threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }
  // Fallback for very old browsers
  init();

  return () => {
    cancelled = true;
    if (watchdog) clearTimeout(watchdog);
    
    // cleanup strobing listener
    try {
      (engineRef.current as any)?.__strobingCleanup?.();
    } catch {}
    
    try { engineRef.current?.destroy?.(); } catch {}
    engineRef.current = null;
  };
  // re-run on retry
}, [initNonce]);

  useEffect(() => {
    if (!isLoaded || !engineRef.current) return;
    const lc = parameters.lightCrossing;
    
    // ⬇️ add this
    const dutyEffectiveFR = (() => {
      const burst = Number(lc?.burst_ms);
      const dwell = Number(lc?.dwell_ms);
      if (Number.isFinite(burst) && Number.isFinite(dwell) && dwell > 0) {
        return clamp01(burst / dwell);
      }
      return clamp01(isFiniteNum(parameters?.dutyCycle) ? parameters!.dutyCycle! : 0.14);
    })();
    
    try {
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

      // === NEW: Use pipeline adapter for single source of truth ===
      // Resolve duty and sectors from pipeline (prefer dutyEffectiveFR > lightCrossing > dutyCycle)
      const dutyResolved =
        isFiniteNum(parameters.dutyEffectiveFR) ? clamp01(parameters.dutyEffectiveFR!) :
        (lc && lc.dwell_ms > 0 ? clamp01(lc.burst_ms / lc.dwell_ms) :
         clamp01(num(parameters.dutyCycle, 0.14)));

      const sectorsResolved = Math.max(
        1,
        Math.floor(num(parameters.sectorStrobing, lc?.sectorCount ?? 1))
      );

      // Harden unit/finite guards for Q, γ, wall width (no hidden magic)
      const gammaGeo = Math.max(1, num(parameters.g_y, 26));
      const qCavity  = Math.max(1, num(parameters.cavityQ, 1e9));    // never ≤0
      const qSpoil   = Math.max(1e-6, num(parameters.qSpoilingFactor, 1));
      const parity = !!parameters.physicsParityMode;

      const pipelineState = {
        currentMode: parameters.currentMode || 'hover',
        dutyCycle: parameters.dutyCycle,
        dutyShip: parameters.dutyEffectiveFR ?? parameters.dutyCycle,
        sectorCount: sectorsResolved,
        gammaGeo: gammaGeo,
        gammaVanDenBroeck: num(parameters.gammaVanDenBroeck, 3.83e1),
        qCavity: qCavity,
        qSpoilingFactor: qSpoil,
        sag_nm: num(parameters.sagDepth_nm, 16),
        hull: parameters.hull || { Lx_m: 1007, Ly_m: 264, Lz_m: 173 },
        shipRadius_m: parameters.hull?.c ?? 86.5,
        modelMode: parity ? 'raw' as const : 'calibrated' as const,
      };
      driveWarpFromPipeline(engineRef.current, pipelineState);

      // Immediately enforce REAL state if parity
      if (parity) {
        engineRef.current.updateUniforms?.({
          vizGain: 1,
          curvatureGainDec: 0,
          curvatureBoostMax: 1,
          curvatureGainT: 0,
          displayGain: 1
        });
        engineRef.current.setDisplayGain?.(1);
      }

      // Pipeline-timed gating (live sync)
      if (lc) {
        engineRef.current.updateUniforms({
          phase: lc.phase,
          onWindow: !!lc.onWindowDisplay,
          sectorIdx: Math.max(0, lc.sectorIdx % (parameters.sectorStrobing || lc.sectorCount || 1)),
          tauLC_ms: lc.tauLC_ms,
          dwell_ms: lc.dwell_ms,
          burst_ms: lc.burst_ms,
        });
      }

      // Add visual enhancements that aren't physics-driven
      const mode = parameters.currentMode || 'hover';
      
      // replace the mode-based tiltGain with a scaling of epsilonTilt magnitude
      const epsilonTiltResolved = num(
        parameters.shift?.epsilonTilt ?? parameters.epsilonTilt,
        mode === 'standby' ? 0.0 : 5e-7
      );
      const betaTiltVec = parameters.shift?.betaTiltVec ?? parameters.betaTiltVec ?? [0, -1, 0];
      
      // roughly normalize: 5e-7 → ~0.35, clamp at 0.65
      const tiltGainResolved = Math.max(0, Math.min(0.65, (epsilonTiltResolved / 5e-7) * 0.35));

      // Apply visual-only enhancements
      engineRef.current.updateUniforms({
        // Interior gravity visuals
        epsilonTilt: Number(epsilonTiltResolved || 0),
        betaTiltVec: betaTiltVec as [number, number, number],
        tiltGain: tiltGainResolved,
        
        // Visual scaling
        vizGain: parity ? 1 : (
          mode === 'emergency' ? VIS_LOCAL.vizGainEmergency : 
          mode === 'cruise' ? VIS_LOCAL.vizGainCruise : VIS_LOCAL.vizGainDefault
        ),
        
        // Curvature controls (with viz overrides)
        curvatureGainDec: parity ? 0 : Math.max(0, Math.min(8, parameters.curvatureGainDec ?? 0)),
        curvatureBoostMax: parity ? 1 : Math.max(1, parameters.viz?.curvatureBoostMax ?? parameters.curvatureBoostMax ?? 40),
        curvatureGainT: parity ? 0 : (parameters.viz?.curvatureGainT ?? parameters.curvatureGainT ?? 0),
        
        // Viz overrides
        colorMode: parameters.viz?.colorMode ?? 'theta',
        exposure: parameters.viz?.exposure ?? undefined,
        zeroStop: parameters.viz?.zeroStop ?? undefined,
        cosmeticLevel: parameters.viz?.cosmeticLevel ?? undefined,
        
        // Optional view settings
        viewAvg: true,
        _debugHUD: true,
        
        // Legacy compatibility
        sagDepth_nm: parameters.sagDepth_nm || 16,
        powerAvg_MW: parameters.powerAvg_MW || VIS.powerAvgFallback,
        exoticMass_kg: parameters.exoticMass_kg || VIS.exoticMassFallback,
        tsRatio: parameters.tsRatio || VIS.tsRatioDefault
      });

      engineRef.current.requestRewarp?.();
    } catch (e) {
      console.warn("WarpVisualizer live update failed:", e);
    }
  }, [parameters, parameters.lightCrossing, isLoaded]);

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

  // Keyboard controls for live tilt tuning
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      if (e.key === ']') {
        engineRef.current.uniforms.tiltGain = (engineRef.current.uniforms.tiltGain ?? 0.25) * 1.25;
        engineRef.current.requestRewarp?.();
      } else if (e.key === '[') {
        engineRef.current.uniforms.tiltGain = (engineRef.current.uniforms.tiltGain ?? 0.25) / 1.25;
        engineRef.current.requestRewarp?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLoaded]);

  // Compute the same display boost used by SliceViewer
  function computeDisplayBoost(curvatureGainDec: number, curvatureBoostMax = 40) {
    const t = Math.max(0, Math.min(1, curvatureGainDec / 8));
    return (1 - t) + t * curvatureBoostMax; // 1..curvatureBoostMax
  }

  // Display gain multiplier effect - respects physics parity mode
  useEffect(() => {
    if (!engineRef.current) return;

    if (parameters.physicsParityMode) {
      engineRef.current.setDisplayGain?.(1);              // userGain = 1
      engineRef.current.updateUniforms?.({ displayGain: 1 });
      return;
    }

    const boost = computeDisplayBoost(
      parameters.curvatureGainDec ?? 0,
      parameters.curvatureBoostMax ?? 40
    );
    engineRef.current.setDisplayGain?.(boost);            // userGain = boost (geometry + shader)
    engineRef.current.updateUniforms?.({ displayGain: 1 }); // keep shader's u_displayGain neutral
    console.log(`🎛️ EXAGGERATION (userGain): ×${boost.toFixed(2)}`);
  }, [
    parameters.physicsParityMode,
    parameters.curvatureGainDec,
    parameters.curvatureBoostMax,
    isLoaded
  ]);

  useEffect(() => {
    const s = Number(parameters.gridScale ?? 1.0);
    // Update both the property and (for engines that re-read) the var
    (window as any).sceneScale = Number.isFinite(s) ? s : 1.0;

    // Optional: also poke the engine if it exposes a setter
    if (engineRef.current?.setSceneScale) {
      engineRef.current.setSceneScale((window as any).sceneScale);
      engineRef.current.requestRewarp?.();
    }
  }, [parameters.gridScale, isLoaded]);

  // REMOVED: Global bridge - now using unified visual boost system passed via uniforms

  const toggleAnimation = () => {
    setIsRunning(prev => {
      const next = !prev;
      if (engineRef.current) {
        if (next) {
          engineRef.current._startRenderLoop?.();
        } else if (engineRef.current.animationId) {
          cancelAnimationFrame(engineRef.current.animationId);
          engineRef.current.animationId = null;
        }
      }
      return next;
    });
  };

  const resetView = () => {
    if (!engineRef.current) return;
    // Reapply the exact uniforms we computed in the last update, not the bare props.
    const u = engineRef.current.uniforms || {};
    engineRef.current.updateUniforms({ ...u });
    if (engineRef.current.requestRewarp) engineRef.current.requestRewarp();
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
                  zeta: VIS.zetaDefault,
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
        <div 
          className="relative w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700"
          style={{ height: 'min(56vh, 520px)' }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block transition-opacity duration-200"
            style={{ opacity: isLoaded ? 1 : 0 }}   // no "jump" while fitting
            width={VIS.canvasWidthDefault}
            height={VIS.canvasHeightDefault}
            data-testid="canvas-warp-bubble"
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2 mx-auto"></div>
                <div className="text-sm">{loadingState.message}</div>
                {loadingState.type === 'compiling' && (
                  <div className="text-xs text-yellow-400 mt-1">
                    ⚡ Non-blocking shader compilation in progress...
                  </div>
                )}
              </div>
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 grid place-items-center bg-black/60 text-red-200 px-4">
              <div className="max-w-md text-center space-y-3">
                <div className="font-mono text-sm">{loadError}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInitNonce(n => n + 1)}
                  className="mx-auto"
                >
                  Retry Load
                </Button>
              </div>
            </div>
          )}
          
          {/* Enhanced exaggeration HUD */}
          {isLoaded && (
            <div className="absolute top-2 left-2 bg-black/80 rounded px-2 py-1 text-xs font-mono space-y-0.5">
              <div className="text-cyan-400 font-semibold">
                {(parameters.currentMode?.toUpperCase() || 'HOVER')} MODE
                {" · "}
                {parameters.viz?.colorMode === 'shear' || parameters.viz?.colorMode===2 ? 'σ' : parameters.viz?.colorMode==='solid'||parameters.viz?.colorMode===0 ? 'solid' : 'θ'}
              </div>
              <div className="text-green-400">
                P: {safeFix(parameters.powerAvg_MW, VIS.powerAvgFallback, 1)}MW ·
                D: {safeFix(parameters.dutyCycle * 100, 14, 1)}%
              </div>
              <div className="text-amber-300">
                {(() => {
                  // reflect actual uniforms (after parity gating) when available
                  const u = engineRef.current?.uniforms ?? {};
                  const parity = !!u.physicsParityMode;
                  const curvT  = parity ? 0 : (u.curvatureGainT ?? 0);
                  const boostM = parity ? 1 : Math.max(1, u.curvatureBoostMax ?? 1);
                  const userG  = parity ? 1 : Math.max(1, u.userGain ?? 1);  // ← geometry + shader
                  const vizG   = parity ? 1 : (u.vizGain ?? 1);
                  const gain   = userG * vizG * (1 + curvT * (boostM - 1));
                  return (
                    <>
                      exaggeration: ×{gain.toFixed(2)} ·
                      {' '}exp:{(parameters.viz?.exposure ?? 6.0).toFixed(1)} ·
                      {' '}z₀:{(parameters.viz?.zeroStop ?? 1e-7).toExponential(1)}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duty Cycle:</span>
                <span className="text-cyan-400">{safeFix(parameters.dutyCycle * 100, 14, 1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">γ Geometric:</span>
                <span className="text-orange-400">{safeFix(parameters.g_y, 26, 1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Q Factor:</span>
                <span className="text-yellow-400">{safeExp(parameters.cavityQ, 1, '1.0e+9')}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sag Depth:</span>
                <span className="text-blue-400">{safeFix(parameters.sagDepth_nm, 16, 1)} nm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Power:</span>
                <span className="text-green-400">{safeFix(parameters.powerAvg_MW, VIS.powerAvgFallback, 1)} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exotic Mass:</span>
                <span className="text-purple-400">{safeFix(parameters.exoticMass_kg, VIS.exoticMassFallback, 0)} kg</span>
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
            <div>• <span className="text-purple-400">γ Van den Broeck</span>: {Number(parameters.gammaVanDenBroeck ?? 1).toExponential(2)} curvature amplifier</div>
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
                <div>θ(ρ) ∝ (n·d) · d/dρ {`{ exp(- (ρ-1)² / w²) }`}</div>
                <div className="text-cyan-500 text-xs">with ρ = ‖(x/a, y/b, z/c)‖</div>
                <div className="text-cyan-500 text-xs">(ellipsoidal ring at ρ≈1, width w = w_ρ ; visual scale uses γ_geo³ · ΔA/A · γ_VdB · √(duty/sectors))</div>
              </div>
              
              <div className="text-green-300">
                <div>β_chain (inst) = γ_geo³ · (ΔA/A) · γ_VdB</div>
                <div>β_chain (avg)  = β_chain(inst) · √(duty / sectors)</div>
              </div>
              
              <div className="text-blue-300">
                <div>View = {(num(parameters.sagDepth_nm, 16) * 4)}nm (4× zoom)</div>
                <div>s_max = {(2.0).toFixed(2)} | γᵢⱼ = δᵢⱼ (flat spatial metric)</div>
                {(() => {
                  const aH = parameters.hull?.a || 142.0;
                  const w_rho = parameters.wallWidth_m ?? 0.016;
                  const w_m = Number.isFinite(aH) ? w_rho * aH : NaN;
                  return (
                    <div>wall width: w = {w_rho.toFixed(4)} ρ-units{Number.isFinite(w_m) ? ` ≈ ${w_m.toFixed(3)} m` : ''}</div>
                  );
                })()}
              </div>
              
              <div className="text-yellow-300">
                <div>ρ = (|∇×β|² - |∇β|²)/(16π)</div>
                <div className="text-yellow-500 text-xs">[Authentic Natário Energy Density]</div>
              </div>
            </div>
            
            {/* Live β Sampling */}
            <div className="space-y-2">
              <div className="text-cyan-300 font-semibold">Live β Field Samples:</div>
              {(() => {
                // === resolve tilt exactly once (reuse the same numbers we push to the engine) ===
                const mode = parameters.currentMode ?? "hover";
                const epsFromPanel = Number(parameters.shift?.epsilonTilt ?? parameters.epsilonTilt ?? 0);
                const hasGoodPanelEps = Number.isFinite(epsFromPanel) && epsFromPanel > 1e-9;
                const modeTiltDefaults: Record<string, number> = { emergency: 0.035, hover: 0.020, cruise: 0.012, standby: 0.000 };
                const epsilonTilt = hasGoodPanelEps ? epsFromPanel : (modeTiltDefaults[mode] ?? 0.0);
                const betaTiltVec = Array.isArray(parameters.shift?.betaTiltVec || parameters.betaTiltVec)
                  ? (parameters.shift?.betaTiltVec || parameters.betaTiltVec) as [number, number, number]
                  : [0, -1, 0];  // default "down"

                return [
                  { name: 'Center', s: 0.00 },
                  { name: 'R/2',    s: 0.50 },
                  { name: 'R',      s: 1.00 },
                  { name: 'Edge',   s: 2.00 }
                ].map(point => {
                  // Canonical Natário bell
                  const beta0 = num(parameters.dutyCycle, 0.14) * num(parameters.g_y, 26);       // β0 = duty·γ_geo
                  const betaBell = beta0 * point.s * Math.exp(-(point.s ** 2));

                  // Interior tilt (small, interior-weighted)
                  const interiorEnv = Math.exp(-Math.pow(point.s / 1.0, 2)); // 1 at center → 0 near wall
                  const tiltMagnitude = epsilonTilt;                         // resolved above in your code
                  const tiltProj = Math.abs(betaTiltVec?.[1] ?? 1);          // project roughly on "down"
                  const betaTilt = tiltMagnitude * tiltProj * interiorEnv;

                  const betaTotal = betaBell + betaTilt;

                  // Color by sign for total: −β=blue, +β=orange
                  const totalClass = betaTotal >= 0 ? "text-orange-400" : "text-sky-400";

                  return (
                    <div key={point.name} className="font-mono space-y-0.5">
                      <div className={`flex justify-between ${totalClass}`}>
                        <span>{point.name} (s={safeFix(point.s, 0, 2)}):</span>
                        <span>β_total = {safeExp(betaTotal, 2)}</span>
                      </div>
                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>• β_bell</span>
                        <span className={betaBell >= 0 ? "text-orange-400" : "text-sky-400"}>
                          {safeExp(betaBell, 2)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>• β_tilt</span>
                        <span className="text-violet-400">
                          {safeExp(betaTilt, 2)}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
              
              {/* Live Parameters */}
              <div className="mt-4 pt-3 border-t border-cyan-500/20">
                <div className="text-cyan-300 font-semibold mb-2">Current Parameters:</div>
                <div className="text-green-300">Mode: {parameters.currentMode || 'hover'}</div>
                <div className="text-green-300">Power: {safeFix(parameters.powerAvg_MW, VIS.powerAvgFallback, 1)}MW</div>
                <div className="text-green-300">Duty: {safeFix(parameters.dutyCycle * 100, 14, 1)}%</div>
                {parameters.hull && (
                  <div className="text-blue-300 mt-2">
                    <div>Hull: {parameters.hull.Lx_m}×{parameters.hull.Ly_m}×{parameters.hull.Lz_m}m</div>
                    <div>Semi-axes: {safeFix(parameters.hull.a, 503.5, 1)}×{safeFix(parameters.hull.b, 132, 1)}×{safeFix(parameters.hull.c, 86.5, 1)}m</div>
                  </div>
                )}
                <div className="text-green-300">Q-Factor: {safeExp(parameters.cavityQ, 0, '1e+9')}</div>
                <div className="text-green-300">Exotic Mass: {safeFix(parameters.exoticMass_kg, VIS.exoticMassFallback, 0)}kg</div>
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
            tsRatio={parameters.tsRatio || VIS.tsRatioFallback}
            zeta={VIS.zetaDefault}
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
                <div>duty: {(100 * (diag.duty ?? 0)).toFixed(2)}%</div>
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