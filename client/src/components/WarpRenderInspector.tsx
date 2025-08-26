import React, {useEffect, useMemo, useRef, useState, startTransition} from "react";
import WarpRenderCheckpointsPanel from "./warp/WarpRenderCheckpointsPanel";
import { useEnergyPipeline, useSwitchMode } from "@/hooks/use-energy-pipeline";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeWU, buildREAL, buildSHOW } from "@/lib/warp-uniforms";
import Grid3DEngine, { Grid3DHandle } from "@/components/engines/Grid3DEngine";
import { SliceViewer } from "@/components/SliceViewer";
import { gatedUpdateUniforms } from "@/lib/warp-uniforms-gate";
import { subscribe, unsubscribe } from "@/lib/luma-bus";
import { applyToEngine } from "@/lib/warp-uniforms-gate";

/**
 * WarpRenderInspector
 *
 * A focused panel to verify that operational-mode + calculator payloads are
 * actually reaching WarpEngine, using the same dual-instance pattern as
 * WarpBubbleCompare. It mounts two canvases (REAL/SHOW), pushes calculator
 * outputs through the exact keys WarpEngine consumes, and exposes quick
 * controls to exaggerate differences so they are visually undeniable.
 *
 * Requirements: `warp-engine.js` must already be loaded and expose
 *   `window.WarpEngine`.
 */

// ---- Utility: type-light helpers -------------------------------------------
type Num = number | undefined | null;
const N = (x: Num, d = 0) => (Number.isFinite(x as number) ? Number(x) : d);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Push only after shaders are ready - now with gating
function pushUniformsWhenReady(engine: any, patch: Record<string, any>, source: string = 'inspector') {
  if (!engine) return;
  const push = () => gatedUpdateUniforms(engine, patch, source);
  if (engine.isLoaded && engine.gridProgram) {
    push();
  } else if (typeof engine.onceReady === "function") {
    engine.onceReady(push);
  } else {
    // Fallback for engines that load synchronously or lack onceReady
    queueMicrotask(() => { if (!engine._destroyed) push(); });
  }
}

// A safe camera helper (optional override)
function compactCameraZ(axesScene?: number[] | null) {
  const ax = axesScene || [1,1,1];
  const R = Math.max(ax[0], ax[1], ax[2]) || 1;
  return Math.max(1.2, 1.8 * R);
}

function deriveAxesClip(hull: {a:number;b:number;c:number}, span = 1) {
  const m = Math.max(hull.a, hull.b, hull.c) || 1;
  return [ (hull.a/m)*span, (hull.b/m)*span, (hull.c/m)*span ];
}

// Optional: estimate pixel density across wall band (debugging helper)
function estimatePxAcrossWall({
  canvasPxW,
  canvasPxH,
  gridSpan,
  hull,           // {a,b,c} in meters
  wallWidth_m,    // in meters
}: {
  canvasPxW: number; canvasPxH: number;
  gridSpan: number; hull: {a:number;b:number;c:number};
  wallWidth_m: number;
}) {
  const Rmax = Math.max(hull.a, hull.b, hull.c);
  const Rgeom = Math.cbrt(hull.a * hull.b * hull.c);
  const deltaRho = wallWidth_m / Rgeom;       // ≈ thickness in ρ
  // use the limiting axis (worst case)
  const pxPerMeter_X = canvasPxW / (2 * gridSpan * Rmax);
  const pxPerMeter_Y = canvasPxH / (2 * gridSpan * Rmax);
  const pxPerMeter = Math.min(pxPerMeter_X, pxPerMeter_Y);
  return deltaRho * Rgeom * pxPerMeter;       // pixels across wall
}

// Mode → visual seasoning presets (so changes are obvious)
type ModeKey = 'hover' | 'cruise' | 'emergency' | 'standby';
const MODE_PRESET: Record<ModeKey, {curvT:number; boost:number; displayGain:number}> = {
  hover:     { curvT: 0.25, boost: 20, displayGain: 1.0 },
  cruise:    { curvT: 0.45, boost: 30, displayGain: 2.0 },
  emergency: { curvT: 0.70, boost: 40, displayGain: 6.0 },
  standby:   { curvT: 0.00, boost:  1, displayGain: 1.0 },
};

// Locked display settings - modes only change physics, not visuals
const TONEMAP_LOCK = { 
  exp: 5.0, 
  zero: 1e-7, 
  ridgeMode: 0, 
  colorMode: 'theta' as const,
  viewAvg: true 
};

// ---- Component --------------------------------------------------------------
export default function WarpRenderInspector(props: {
  // Optional: calculator outputs. Pass exactly what your calculator returns
  // (REAL/FR vs SHOW/UI). Any missing fields fall back safely.
  parityPhys?: Record<string, any>;
  showPhys?: Record<string, any>;
  baseShared?: Record<string, any>; // e.g. hull, sectors/split, colorMode, etc.
  lightCrossing?: { burst_ms?: number; dwell_ms?: number };  // ⬅️ add
  realRenderer?: 'slice2d' | 'grid3d'; // REAL engine type (default: slice2d)
  showRenderer?: 'slice2d' | 'grid3d'; // SHOW engine type (default: grid3d)
}){
  const leftRef = useRef<HTMLCanvasElement>(null);   // REAL
  const rightRef = useRef<HTMLCanvasElement>(null);  // SHOW
  const leftEngine = useRef<any>(null);
  const rightEngine = useRef<any>(null);
  const grid3dRef = useRef<Grid3DHandle>(null);
  const leftOwnedRef = useRef(false);
  const rightOwnedRef = useRef(false);
  
  // Renderer type configuration
  const realRendererType = props.realRenderer || 'slice2d';
  const showRendererType = props.showRenderer || 'grid3d';
  const [haveUniforms, setHaveUniforms] = useState(false);

  // Live energy pipeline data for diagnostics
  const { data: live } = useEnergyPipeline({
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });
  const switchMode = useSwitchMode();
  const queryClient = useQueryClient();

  // Get current mode from global energy pipeline instead of local state
  const currentMode = ((live as any)?.currentMode as 'hover'|'cruise'|'emergency'|'standby') || 'hover';
  const [mode, setMode] = useState<'hover'|'cruise'|'emergency'|'standby'>(currentMode);

  // Sync local mode with global mode
  useEffect(() => {
    setMode(currentMode);
  }, [currentMode]);
  // Defaults for visual controls (no UI needed)
  const ridgeMode = 1; // single crest
  const colorMode = 'theta'; // diverging colors
  const userGain = 1;
  const decades = 0.6 * 8;

  // Debug toggles (React state)
  const [lockTone, setLockTone] = useState(true);
  const [lockRidge, setLockRidge] = useState(true);
  const [forceAvg, setForceAvg] = useState(true);
  const [useMassGamma, setUseMassGamma] = useState(false);

  const wu = useMemo(() => normalizeWU(
    (live as any)?.warpUniforms || (props as any)?.warpUniforms
  ), [live, props]);

  const realPayload = useMemo(() => buildREAL(wu), [wu]);
  const showPayload = useMemo(() => buildSHOW(wu, {
    T: (decades/8), boost: 40, userGain
  }), [wu, decades, userGain]);

  function emitDebug(level: 'info'|'warn'|'error', tag: string, msg: string, data?: any) {
    // ship to console
    const line = `[${tag}] ${msg}`;
    (console as any)[level]?.(line, data ?? '');
    // ship to UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('helix:debug', {
        detail: { level, tag, msg, data, ts: Date.now() }
      }));
    }
  }

  function findCaller(): string | undefined {
    try {
      const s = (new Error()).stack?.split('\n') ?? [];
      // skip 0:Error, 1:emit site, 2:updateUniforms wrapper, 3:caller
      return s[3]?.trim();
    } catch { return undefined; }
  }

  // Hard-lock parity and block direct thetaScale writes at the engine edge
  function hardLockUniforms(engine: any, {
    forceParity,
    allowThetaScaleDirect = false,
    tag = 'ENGINE'
  }: { forceParity: boolean; allowThetaScaleDirect?: boolean; tag?: string }) {
    if (!engine || engine.__locked) return;
    const orig = engine.updateUniforms?.bind(engine);
    engine.updateUniforms = (patch: any) => {
      const safe = { ...(patch || {}) };

      // parity writes are forbidden
      if ('physicsParityMode' in safe) {
        emitDebug('warn', tag, 'blocked physicsParityMode override', {
          value: (safe as any).physicsParityMode, from: findCaller()
        });
        delete (safe as any).physicsParityMode;
      }
      if ('parityMode' in safe) {
        emitDebug('warn', tag, 'blocked parityMode override', {
          value: (safe as any).parityMode, from: findCaller()
        });
        delete (safe as any).parityMode;
      }

      // thetaScale writes are forbidden (computed from FR duty internally)
      if (!allowThetaScaleDirect && 'thetaScale' in safe) {
        emitDebug('warn', tag, 'blocked thetaScale override', {
          value: (safe as any).thetaScale, from: findCaller()
        });
        delete (safe as any).thetaScale;
      }

      // force correct parity every call
      (safe as any).physicsParityMode = forceParity;
      (safe as any).parityMode        = forceParity;

      // Use gated uniforms instead of direct call
      return gatedUpdateUniforms({ updateUniforms: orig }, normalizeKeys(safe), `${tag.toLowerCase()}-locked`);
    };
    engine.__locked = true;
  }

  // Reuse-or-create guard so we never attach twice to the same canvas
  const ENGINE_KEY = '__warpEngine';

  function getOrCreateEngine<WarpType = any>(Ctor: new (c: HTMLCanvasElement) => WarpType, cv: HTMLCanvasElement): WarpType {
    const existing = (cv as any)[ENGINE_KEY];
    if (existing && !existing._destroyed) return existing as WarpType;
    let eng: any;
    try {
      eng = new Ctor(cv);
    } catch (err: any) {
      const msg = String(err?.message || err).toLowerCase();
      if (msg.includes('already attached')) {
        // Another owner (e.g., Grid3DEngine) already attached; reuse theirs
        return ((cv as any)[ENGINE_KEY] || (eng as any)) as WarpType;
      }
      throw err;
    }
    (cv as any)[ENGINE_KEY] = eng;
    return eng;
  }
  
  // Hard-lock parity & block late thetaScale writers at the engine edge
  function lockPane(engine: any, pane: 'REAL' | 'SHOW') {
    if (!engine || engine.__locked) return;
    const orig = engine.updateUniforms?.bind(engine);
    engine.updateUniforms = (patch: any) => {
      const safe = normalizeKeys({ ...(patch || {}) });
      if ('thetaScale' in safe) delete safe.thetaScale;
      safe.physicsParityMode = (pane === 'REAL');
      safe.parityMode = (pane === 'REAL');
      return gatedUpdateUniforms({ updateUniforms: orig }, safe, `${pane.toLowerCase()}-locked`);
    };
    engine.__locked = true;
  }

  // Helper to create engine with conditional selection and 3D fallback
  function createEngineWithFallback(rendererType: 'slice2d' | 'grid3d', canvas: HTMLCanvasElement) {
    const W: any = (window as any).WarpEngine;
    
    if (rendererType === 'grid3d') {
      // Try 3D engine first
      try {
        const engine3d = getOrCreateEngine(W, canvas);
        const ok = engine3d.init ? engine3d.init(canvas) : true;
        if (ok) {
          return engine3d;
        } else {
          // 3D context failed, dispose and fallback
          engine3d.dispose?.();
        }
      } catch (e) {
        console.warn('Grid3D engine failed, falling back to slice2d:', e);
      }
    }
    
    // Use slice2d (either requested or as fallback)
    return getOrCreateEngine(W, canvas);
  }

  // Engine creation & lifecycle
  useEffect(() => {
    const W: any = (window as any).WarpEngine;
    if (!W) { console.error("WarpEngine not found on window. Load warp-engine.js first."); return; }

    if (leftRef.current && !leftEngine.current)  {
      // DPR-safe size before GL init
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      leftRef.current.width  = Math.max(1, Math.floor((leftRef.current.clientWidth  || 800) * dpr));
      leftRef.current.height = Math.max(1, Math.floor((leftRef.current.clientHeight || 450) * dpr));
      leftEngine.current = createEngineWithFallback(realRendererType, leftRef.current);
      leftOwnedRef.current = true;
      // Mute engine until canonical uniforms arrive (prevents first-frame spike)
      gatedUpdateUniforms(leftEngine.current, normalizeKeys({ exposure: 5.0, zeroStop: 1e-7 }), 'mute');
      leftEngine.current?.setVisible?.(false);
      // Hard-lock REAL pane against parity flips and thetaScale writers
      lockPane(leftEngine.current, 'REAL');
    }
    if (showRendererType !== 'grid3d') {
      if (rightRef.current && !rightEngine.current) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        rightRef.current.width  = Math.max(1, Math.floor((rightRef.current.clientWidth  || 800) * dpr));
        rightRef.current.height = Math.max(1, Math.floor((rightRef.current.clientHeight || 450) * dpr));
        rightEngine.current = createEngineWithFallback('slice2d', rightRef.current);
        rightOwnedRef.current = true; // we own this engine
        // Mute engine until canonical uniforms arrive (prevents first-frame spike)
        gatedUpdateUniforms(rightEngine.current, normalizeKeys({ exposure: 5.0, zeroStop: 1e-7 }), 'mute');
        rightEngine.current?.setVisible?.(false);
        // Hard-lock SHOW pane against parity flips and thetaScale writers
        lockPane(rightEngine.current, 'SHOW');
      }
    }

    // Lock parity flags and block thetaScale to prevent late writers from flipping REAL back to SHOW
    if (leftEngine.current)  hardLockUniforms(leftEngine.current,  { forceParity: true,  tag: 'REAL' });
    if (rightEngine.current) hardLockUniforms(rightEngine.current, { forceParity: false, tag: 'SHOW' });

    // Bootstrap; fit camera after link using derived axes
    leftEngine.current?.bootstrap({ ...realPayload });
    rightEngine.current?.bootstrap({ ...showPayload });
    leftEngine.current?.onceReady?.(() => {
      const ax = leftEngine.current?.uniforms?.axesClip;
      const cz = compactCameraZ(ax);
      gatedUpdateUniforms(leftEngine.current, normalizeKeys({ cameraZ: cz, lockFraming: true }), 'inspector-left-init');
    });
    rightEngine.current?.onceReady?.(() => {
      const ax = rightEngine.current?.uniforms?.axesClip;
      const cz = compactCameraZ(ax);
      gatedUpdateUniforms(rightEngine.current, normalizeKeys({ cameraZ: cz, lockFraming: true }), 'inspector-right-init');
      // optional: mirror display gain through helper
      const dg = Math.max(1, (showPayload as any)?.displayGain || 1);
      rightEngine.current.setDisplayGain?.(dg);
    });

    // Diagnostics -> window for quick comparison
    leftEngine.current && (leftEngine.current.onDiagnostics  = (d: any) => ((window as any).__diagREAL = d));
    rightEngine.current && (rightEngine.current.onDiagnostics = (d: any) => ((window as any).__diagSHOW = d));
    
    // Wire lost/restored guards to both canvases
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL context lost, will attempt restore');
    };
    const handleContextRestored = () => {
      console.log('WebGL context restored, reinitializing engines');
      // Engines will auto-reinitialize on next render
    };
    
    if (leftRef.current) {
      leftRef.current.addEventListener('webglcontextlost', handleContextLost);
      leftRef.current.addEventListener('webglcontextrestored', handleContextRestored);
    }
    if (rightRef.current) {
      rightRef.current.addEventListener('webglcontextlost', handleContextLost);
      rightRef.current.addEventListener('webglcontextrestored', handleContextRestored);
    }

    // Subscribe to canonical server uniforms
    const unsubscribeHandler = subscribe('warp:uniforms', (u: any) => {
      setHaveUniforms(true); // Mark that we've received first uniforms
      if (leftEngine.current) {
        applyToEngine(leftEngine.current, u);          // REAL
      }
      if (rightEngine.current) {
        applyToEngine(rightEngine.current, { ...u, physicsParityMode: false, ridgeMode: 1 }); // SHOW
      }
      
      // Unmute engines when canonical uniforms arrive
      leftEngine.current?.setVisible?.(true);
      rightEngine.current?.setVisible?.(true);
      // Also unmute Grid3D engine if active
      if (showRendererType === 'grid3d') {
        grid3dRef.current?.getEngine()?.setVisible?.(true);
      }
    });

    // Keep engines muted until first canonical uniforms arrive
    if (!haveUniforms) {
      leftEngine.current?.setVisible?.(false);
      rightEngine.current?.setVisible?.(false);
      if (leftEngine.current) {
        leftEngine.current.updateUniforms?.({
          physicsParityMode: true, 
          ridgeMode: TONEMAP_LOCK.ridgeMode,
          exposure: TONEMAP_LOCK.exp,
          zeroStop: TONEMAP_LOCK.zero,
          colorMode: TONEMAP_LOCK.colorMode,
          viewAvg: TONEMAP_LOCK.viewAvg
        });
      }
      if (rightEngine.current) {
        rightEngine.current.updateUniforms?.({
          physicsParityMode: false, 
          ridgeMode: TONEMAP_LOCK.ridgeMode,
          exposure: TONEMAP_LOCK.exp,
          zeroStop: TONEMAP_LOCK.zero,
          colorMode: TONEMAP_LOCK.colorMode,
          viewAvg: TONEMAP_LOCK.viewAvg
        });
      }
    }

    return () => {
      // Unsubscribe from canonical uniforms
      unsubscribe(unsubscribeHandler);
      setHaveUniforms(false); // Reset on cleanup
      
      // Remove WebGL context event listeners
      if (leftRef.current) {
        leftRef.current.removeEventListener('webglcontextlost', handleContextLost);
        leftRef.current.removeEventListener('webglcontextrestored', handleContextRestored);
      }
      if (rightRef.current) {
        rightRef.current.removeEventListener('webglcontextlost', handleContextLost);
        rightRef.current.removeEventListener('webglcontextrestored', handleContextRestored);
      }
      
      try { if (leftOwnedRef.current)  leftEngine.current?.destroy(); } catch {}
      try { if (rightOwnedRef.current) rightEngine.current?.destroy(); } catch {}
      leftOwnedRef.current = false;
      rightOwnedRef.current = false;
      leftEngine.current = null as any;
      rightEngine.current = null as any;

      // Robust cleanup for HMR/StrictMode
      if (leftRef.current) {
        try {
          if ((leftRef.current as any)[ENGINE_KEY] && !(leftRef.current as any)[ENGINE_KEY]._destroyed) {
            (leftRef.current as any)[ENGINE_KEY].destroy?.();
          }
          delete (leftRef.current as any)[ENGINE_KEY];
        } catch {}
      }
      
      if (rightRef.current && rightOwnedRef.current) {
        try {
          if ((rightRef.current as any)[ENGINE_KEY] && !(rightRef.current as any)[ENGINE_KEY]._destroyed) {
            (rightRef.current as any)[ENGINE_KEY].destroy?.();
          }
          delete (rightRef.current as any)[ENGINE_KEY];
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ford-Roman duty computation (outside useEffect for prop access)
  const dutyLocal = (() => {
    const b = Number(props.lightCrossing?.burst_ms);
    const d = Number(props.lightCrossing?.dwell_ms);
    return Number.isFinite(b) && Number.isFinite(d) && d > 0 ? Math.max(1e-12, b / d) : 0.01;
  })();
  const sTotal = Math.max(1, +(live?.sectorCount ?? 400));
  const sConcurrent = Math.max(1, +(wu.sectors ?? 1));
  
  // Visual-only mass fraction scaling
  const total = Math.max(1, Number(live?.sectorCount) || 400);
  const viewFracREAL = 1 / total;
  
  // FR duty for both engines - let them derive thetaScale internally
  const dutyEffectiveFR = dutyLocal * (sConcurrent / sTotal); // 0.01 × (1/400) here

  // Debug toggle: choose between mass-calibrated vs visual-only γ_VdB (outside useEffect for display access)
  const gammaVdB_vis = N(live?.gammaVanDenBroeck_vis ?? live?.gammaVanDenBroeck, 1e11);
  const gammaVdB_mass = N(live?.gammaVanDenBroeck_mass ?? live?.gammaVanDenBroeck, 1e11);
  const gammaVdBBound = useMassGamma ? gammaVdB_mass : gammaVdB_vis;

  // Theta consistency helper functions
  function thetaGainExpected({
    gammaGeo, qSpoilingFactor, gammaVdB, dutyEffectiveFR
  }: {gammaGeo:number; qSpoilingFactor:number; gammaVdB:number; dutyEffectiveFR:number}) {
    return Math.pow(Number(gammaGeo)||0, 3)
         * (Number(qSpoilingFactor)||1)
         * (Number(gammaVdB)||1)
         * (Number(dutyEffectiveFR)||0);
  }

  function pctDelta(a:number, b:number){
    if (!isFinite(a) || !isFinite(b) || b === 0) return NaN;
    return (a/b - 1) * 100;
  }

  function normalizeKeys(u: any) {
    const x = { ...(u || {}) };
    if (typeof x.gammaVanDenBroeck === 'number' && typeof x.gammaVdB !== 'number') x.gammaVdB = x.gammaVanDenBroeck;
    if (typeof x.gammaVdB === 'number' && typeof x.gammaVanDenBroeck !== 'number') x.gammaVanDenBroeck = x.gammaVdB;
    if (typeof x.qSpoilingFactor === 'number' && typeof x.qSpoil !== 'number') x.qSpoil = x.qSpoilingFactor;
    if (typeof x.qSpoil === 'number' && typeof x.qSpoilingFactor !== 'number') x.qSpoilingFactor = x.qSpoil;
    return x;
  }

  function reportThetaConsistency(bound:{
    gammaGeo:number; qSpoilingFactor:number; gammaVdB:number; dutyEffectiveFR:number;
  }, viewMassFraction: number = 1.0, isShow: boolean = false) {
    // Expected: Pure pipeline physics (γ_geo³ × q × γ_VdB × d_FR)
    const expected = thetaGainExpected(bound);
    
    // Used: Same physics chain × viewMassFraction only (no display gains)
    const used = expected * viewMassFraction;
    
    const delta = pctDelta(used, expected);
    const range = Math.max(expected, used) || 1;
    
    const fmt = (v: number) => v.toExponential(2);
    const fmtPct = (v: number) => (v * 100).toFixed(1) + '%';
    
    console.log(`[HELIX][θ] θ-scale — ${fmt(expected)} • exp ${fmt(expected)} (${delta.toFixed(1)} off) • used≈${fmtPct(used / range)}`);
    console.log(`[HELIX][θ] view fraction: ${fmtPct(viewMassFraction)}`);
    console.log(`[HELIX][θ] renderer: ${isShow ? 'grid3d' : 'slice2d'}`);
    
    return { expected, used, delta };
  }

  // Transform uniforms with viewMassFraction support and name normalization
  const toUniforms = (src: any) => {
    const u = { ...(src || {}) };

    // Ensure both spellings exist for gamma VdB
    if (typeof u.gammaVanDenBroeck === 'number' && typeof u.gammaVdB !== 'number') {
      u.gammaVdB = u.gammaVanDenBroeck;
    }
    if (typeof u.gammaVdB === 'number' && typeof u.gammaVanDenBroeck !== 'number') {
      u.gammaVanDenBroeck = u.gammaVdB;
    }

    // Ensure both spellings exist for q spoiling
    if (typeof u.qSpoilingFactor === 'number' && typeof u.qSpoil !== 'number') {
      u.qSpoil = u.qSpoilingFactor;
    }
    if (typeof u.qSpoil === 'number' && typeof u.qSpoilingFactor !== 'number') {
      u.qSpoilingFactor = u.qSpoil;
    }

    // View fraction default
    if (typeof u.viewMassFraction !== 'number') u.viewMassFraction = 1.0;

    return u;
  };

  // Bound parameters for theta consistency check
  const bound = {
    gammaGeo: N(live?.gammaGeo, 26),
    qSpoilingFactor: N(live?.qSpoilingFactor, 1),
    gammaVdB: gammaVdBBound,
    dutyEffectiveFR: dutyEffectiveFR
  };
  // Extract view fractions for consistency check (SHOW renderer)
  const showViewMassFraction = showRendererType === 'grid3d' ? 1.0 : 1.0; // SHOW always uses full bubble
  const { expected, used, delta } = reportThetaConsistency(bound, showViewMassFraction, showRendererType === 'grid3d');

  // Bridge Grid3D engine to checkpoints panel
  useEffect(() => {
    if (showRendererType !== 'grid3d') return;
    const eng = grid3dRef.current?.getEngine();
    const cvs = grid3dRef.current?.getCanvas();
    if (!eng || !cvs) return;

    rightEngine.current = eng;
    (rightRef as any).current = cvs;      // so checkpoints see the real canvas
    rightOwnedRef.current = false;

    // Mute until uniforms arrive
    gatedUpdateUniforms(eng, normalizeKeys({ exposure: 5.0, zeroStop: 1e-7 }), 'grid3d-mute');
    eng.setVisible?.(false);

    // Seed axes/camera from REAL (or hull) immediately so buffers build
    const hull = props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 };
    const span = 1; // or live?.gridSpan ?? 1
    const ax = leftEngine.current?.uniforms?.axesClip ?? deriveAxesClip(hull, span);
    const cz = compactCameraZ(ax);

    pushUniformsWhenReady(eng, { axesClip: ax, cameraZ: cz, lockFraming: true }, 'fit-show');

    // Mirror REAL's DPR and enable optional SSAA
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    grid3dRef.current?.setPixelRatio?.(dpr);
    grid3dRef.current?.setSupersample?.(1.25); // 1.0 = off; 1.25-1.5 is a cheap sharpener

    // Match grid detail to available pixels
    const pxAcross = estimatePxAcrossWall({
      canvasPxW: cvs.width,
      canvasPxH: cvs.height,
      gridSpan: 1,
      hull,
      wallWidth_m: props.baseShared?.wallWidth_m ?? 6.0,
    });

    // Convert pixels into a sensible grid resolution
    const seg = Math.max(24, Math.min(256, Math.ceil(pxAcross * 2)));
    console.log(`[GRID] Canvas: ${cvs.width}×${cvs.height}, pxAcross: ${pxAcross.toFixed(1)}, gridRes: ${seg}`);
    grid3dRef.current?.setGridResolution?.({ radial: seg, angular: seg, axial: seg });

    // SHOW is always UI mode
    lockPane(rightEngine.current, 'SHOW');
  }, [showRendererType]);

  // Black-screen guard for SHOW - force redraw when Grid3D canvas gets real dimensions
  useEffect(() => {
    if (showRendererType !== 'grid3d') return;
    const cv = grid3dRef.current?.getCanvas?.();
    if (!cv) return;
    const ro = new ResizeObserver(() => {
      if (cv.width > 0 && cv.height > 0) {
        rightEngine.current?.forceRedraw?.();
      }
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, [showRendererType]);

  // Apply shared physics inputs any time calculator/shared/controls change
  useEffect(() => {
    if (!leftEngine.current || (!rightEngine.current && showRendererType !== 'grid3d')) return;

    // Gate first paint until canonical uniforms arrive (prevents averaging race)
    const ready = Boolean((live as any)?.thetaScaleExpected && props.lightCrossing?.dwell_ms);
    leftEngine.current.setVisible?.(ready);
    rightEngine.current.setVisible?.(ready);

    // Debug toggle calculations
    const autoExp = N(props.parityPhys?.exposure ?? live?.exposure, 5.0);
    const autoZero = N(props.parityPhys?.zeroStop ?? live?.zeroStop, 1e-7);
    const autoRidge = N(props.parityPhys?.ridgeMode ?? ridgeMode, 0);
    const autoAvg = props.parityPhys?.viewAvg ?? true;

    const tonemapExp = lockTone ? 5.0 : autoExp;
    const zeroStop = lockTone ? 1e-7 : autoZero;
    const ridgeModeUsed = lockRidge ? 0 : autoRidge;
    const viewAvgUsed = forceAvg ? true : autoAvg;

    // Shared physics parameters for both engines
    const shared = {
      gammaGeo: N(props.parityPhys?.gammaGeo ?? live?.gammaGeo, 26),
      qSpoilingFactor: N(props.parityPhys?.qSpoilingFactor ?? live?.qSpoilingFactor, 1),
      // Use debug-controlled γ_VdB to prove physics separation
      gammaVanDenBroeck: gammaVdBBound,
      dutyEffectiveFR,            // 0.01 × (1/400) here  
      dutyCycle: N(props.parityPhys?.dutyCycle ?? live?.dutyCycle, 0.14),                    // UI only (for labels)
      sectorCount: sTotal,                    // 400
      sectors: sConcurrent,                    // 1
      // Apply debug toggles to display controls
      viewAvg: viewAvgUsed,       // Use debug toggle
      ridgeMode: ridgeModeUsed,
      exposure: tonemapExp,
      zeroStop: zeroStop,
      // ✅ give the sweep window so duty_local can be computed
      lightCrossing: { burst_ms: props.lightCrossing?.burst_ms ?? 0.01, dwell_ms: props.lightCrossing?.dwell_ms ?? 1 },
      // Physical scaling
      hull: props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 },
      wallWidth_m: props.baseShared?.wallWidth_m ?? 6.0,
      driveDir: props.baseShared?.driveDir ?? [1,0,0],
      vShip: props.baseShared?.vShip ?? 0,
      colorMode: props.baseShared?.colorMode ?? 'theta',
      lockFraming: true,
      currentMode: props.baseShared?.currentMode ?? 'hover',
      // ❌ do NOT include thetaScale anywhere
    };

    // Just before first uniforms push - seed FR to avoid transition spike
    const seedFR = 0.01 * (1 / Math.max(1, sTotal)); // 1% × 1/400
    gatedUpdateUniforms(leftEngine.current,  { dutyEffectiveFR: seedFR }, 'seed-fr');
    gatedUpdateUniforms(rightEngine.current, { dutyEffectiveFR: seedFR }, 'seed-fr');
    
    // REAL engine - physics truth with per-width view fraction
    const realUniforms = toUniforms({
      ...shared, 
      physicsParityMode: true,
      viewMassFraction: viewFracREAL
    });
    gatedUpdateUniforms(leftEngine.current, normalizeKeys(realUniforms), 'inspector-real');
    
    // SHOW engine - enhanced visuals with full bubble
    const showUniforms = toUniforms({
      ...shared, 
      physicsParityMode: false,
      viewMassFraction: 1.0
    });
    gatedUpdateUniforms(rightEngine.current, normalizeKeys(showUniforms), 'inspector-show');
    
    // Unmute engines after first normalized payloads are pushed
    leftEngine.current?.setVisible?.(true);
    rightEngine.current?.setVisible?.(true);

    // Optional camera sweetener so both keep same framing
    const ax = wu.axesScene || leftEngine.current?.uniforms?.axesClip;
    const cz = compactCameraZ(ax);
    gatedUpdateUniforms(leftEngine.current, normalizeKeys({ cameraZ: cz }), 'inspector-camera');
    gatedUpdateUniforms(rightEngine.current, normalizeKeys({ cameraZ: cz }), 'inspector-camera');
    
    // Sanity check parity modes
    setTimeout(() => {
      console.log('REAL parity?', leftEngine.current?.uniforms?.physicsParityMode);
      console.log('SHOW parity?', rightEngine.current?.uniforms?.physicsParityMode);
      // Report theta consistency after engine updates (use SHOW view fraction for consistency)
      reportThetaConsistency(bound, showViewMassFraction);
    }, 100);
  }, [dutyEffectiveFR, sTotal, sConcurrent, props, live, lockTone, lockRidge, forceAvg, gammaVdBBound, props.lightCrossing?.dwell_ms]);

  // Dummy uniforms for render (updated via useEffect)
  const realUniforms = useMemo(() => toUniforms({
    gammaGeo: N(props.parityPhys?.gammaGeo ?? live?.gammaGeo, 26),
    qSpoilingFactor: N(props.parityPhys?.qSpoilingFactor ?? live?.qSpoilingFactor, 1),
    gammaVanDenBroeck: gammaVdBBound,
    dutyEffectiveFR,
    viewMassFraction: viewFracREAL,
    hull: props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 },
    wallWidth_m: props.baseShared?.wallWidth_m ?? 6.0,
    exposure: 5.0,
    zeroStop: 1e-7,
    physicsParityMode: true
  }), [props.parityPhys, live, gammaVdBBound, dutyEffectiveFR, props.baseShared, viewFracREAL]);
  
  const showUniforms = useMemo(() => toUniforms({
    gammaGeo: N(props.parityPhys?.gammaGeo ?? live?.gammaGeo, 26),
    qSpoilingFactor: N(props.parityPhys?.qSpoilingFactor ?? live?.qSpoilingFactor, 1),
    gammaVanDenBroeck: gammaVdBBound,
    dutyEffectiveFR,
    viewMassFraction: 1.0,
    hull: props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 },
    wallWidth_m: props.baseShared?.wallWidth_m ?? 6.0,
    exposure: 6.0,
    zeroStop: 1e-7,
    physicsParityMode: false
  }), [props.showPhys, live, gammaVdBBound, dutyEffectiveFR, props.baseShared]);

  // Keep canvases crisp on container resize
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [leftRef.current, rightRef.current]) {
        if (!c) continue;
        const w = Math.max(1, Math.floor((c.clientWidth  || 1) * dpr));
        const h = Math.max(1, Math.floor((c.clientHeight || 1) * dpr));
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      }
      leftEngine.current?._resize?.();
      rightEngine.current?._resize?.();
    });
    leftRef.current && ro.observe(leftRef.current);
    rightRef.current && ro.observe(rightRef.current);
    return () => ro.disconnect();
  }, []);

  // Wire strobing once; both engines receive the same stream
  useEffect(() => {
    const add = (window as any).__addStrobingListener as undefined | ((cb: any) => () => void);
    if (!add) return;
    const off = add(({ sectorCount, currentSector, split }: any) => {
      const s = Math.max(1, sectorCount|0);
      const sp = Number.isFinite(split) ? (split|0) : (currentSector|0);

      // Only broadcast TOTAL & split. Leave "sectors" (concurrent) alone.
      const payload = { sectorCount: s, split: Math.max(0, sp) };

      // Recompute FR using *current* concurrent sectors of each pane
      const sConcL = Math.max(1, leftEngine.current?.uniforms?.sectors ?? 1);
      const sConcR = Math.max(1, rightEngine.current?.uniforms?.sectors ?? 1);
      const dutyLocal = 0.01; // or from lightCrossing
      const dutyFR_REAL = dutyLocal * (sConcL / s);
      const dutyUI_SHOW = dutyLocal * (1 / s);

      pushUniformsWhenReady(leftEngine.current,  {
        ...payload,
        physicsParityMode: true,
        dutyEffectiveFR: dutyFR_REAL,
      });
      pushUniformsWhenReady(rightEngine.current, {
        ...payload,
        physicsParityMode: false,
        dutyEffectiveFR: dutyUI_SHOW,
      });
    });
    return () => { try { off?.(); } catch {} };
  }, []);

  // UI events - use global mode switching instead of local state
  const onMode = (m: 'hover'|'cruise'|'emergency'|'standby') => {
    startTransition(() => {
      switchMode.mutate(m as any, {
        onSuccess: () => {
          // Refresh both pipeline and metrics to keep everything in sync
          queryClient.invalidateQueries({ predicate: q =>
            Array.isArray(q.queryKey) &&
            (q.queryKey[0] === '/api/helix/pipeline' || q.queryKey[0] === '/api/helix/metrics')
          });
        }
      });
    });
  };

  return (
    <div className="w-full grid gap-4 p-4">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold">Operational Render Inspector</h2>
          <p className="text-sm text-neutral-500">REAL (Ford–Roman parity) vs SHOW (UI boosted) — uses the same render path as WarpBubbleCompare.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Mode</label>
          {(['hover','cruise','emergency','standby'] as const).map(m => (
            <button
              key={m}
              onClick={() => onMode(m)}
              className={`px-3 py-1 rounded-2xl text-sm border ${mode===m? 'bg-blue-600 text-white border-blue-600' : 'border-neutral-300 hover:bg-neutral-100'}`}
            >{m}</button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-neutral-200 bg-neutral-950/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">REAL — Parity (Ford–Roman) ({realRendererType})</h3>
            <div className="text-xs text-neutral-400">ridgeMode=0 • {colorMode}</div>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/90">
            {realRendererType === 'grid3d' ? (
              <Grid3DEngine 
                uniforms={realUniforms} 
                className="w-full h-full block" 
                style={{background: 'black'}} 
              />
            ) : (
              <canvas ref={leftRef} className="w-full h-full block"/>
            )}
          </div>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-neutral-950/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">SHOW — Boosted (UI) ({showRendererType})</h3>
            <div className="text-xs text-neutral-400">ridgeMode=1 • {colorMode}</div>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/90">
            {showRendererType === 'grid3d' ? (
              <Grid3DEngine 
                ref={grid3dRef}
                uniforms={showUniforms} 
                className="w-full h-full block" 
                style={{background: 'black'}} 
              />
            ) : (
              <canvas ref={rightRef} className="w-full h-full block"/>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h4 className="font-medium mb-3">Debug Toggles</h4>
          <fieldset className="flex gap-3 text-xs">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={lockTone} onChange={e=>setLockTone(e.target.checked)} />
              Lock tonemap
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={lockRidge} onChange={e=>setLockRidge(e.target.checked)} />
              Lock ridge
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={forceAvg} onChange={e=>setForceAvg(e.target.checked)} />
              Force FR-avg
            </label>
          </fieldset>
          <fieldset className="text-xs mt-2 pt-2 border-t border-red-300">
            <label className="flex items-center gap-2 text-red-400">
              <input type="checkbox" checked={useMassGamma} onChange={e=>setUseMassGamma(e.target.checked)} />
              use calibrated γ_VdB (for test)
            </label>
          </fieldset>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-4">
          <h4 className="font-medium mb-3">Live Engine Snapshot</h4>
          {/* θ-scale verification display */}
          <div className="text-xs text-neutral-600 mb-3 space-y-1">
            <div>θ-scale expected: {((live as any)?.thetaScaleExpected ?? 0).toExponential(2)}</div>
            <div>θ-scale (physics-only): {expected.toExponential(3)} • Δ vs used: {isFinite(delta) ? `${delta.toFixed(1)}%` : '—'}</div>
            <div>FR duty: {(dutyEffectiveFR * 100).toExponential(2)}%</div>
            <div className="text-yellow-600">γ_VdB bound: {gammaVdBBound.toExponential(2)} {useMassGamma ? '(mass)' : '(visual)'}</div>
            <div>view mass fraction (REAL): {(viewFracREAL * 100).toFixed(3)}% (1/{total})</div>
            <div>view mass fraction (SHOW): {(1.0 * 100).toFixed(3)}% (full bubble)</div>
          </div>
          <button
            className="px-3 py-1 rounded bg-neutral-900 text-white text-sm"
            onClick={() => {
              const L = leftEngine.current?.uniforms; const R = rightEngine.current?.uniforms;
              console.table({
                REAL_thetaScale: L?.thetaScale, SHOW_thetaScale: R?.thetaScale,
                REAL_gammaVdB: L?.gammaVdB, SHOW_gammaVdB: R?.gammaVdB,
                REAL_dutyFR: (leftEngine.current?.uniforms as any)?.dutyEffectiveFR,
                REAL_dutyCycle: L?.dutyCycle, SHOW_dutyCycle: R?.dutyCycle,
                sectors: L?.sectors, split: L?.split,
                REAL_parity: L?.physicsParityMode, SHOW_parity: R?.physicsParityMode,
              });
              console.log('REAL diag', (window as any).__diagREAL);
              console.log('SHOW diag', (window as any).__diagSHOW);
            }}
          >Dump uniforms + diagnostics</button>
          <p className="text-xs text-neutral-500 mt-2">Opens a concise table/diagnostics in DevTools.</p>
        </div>
      </section>

      {/* Comprehensive WebGL diagnostics panel */}
      <WarpRenderCheckpointsPanel
        leftLabel="REAL"
        rightLabel="SHOW"
        leftEngineRef={leftEngine}
        rightEngineRef={rightEngine}
        leftCanvasRef={leftRef}
        rightCanvasRef={rightRef}
        live={live}
        lightCrossing={{
          burst_ms: (live as any)?.burst_ms,
          dwell_ms: (live as any)?.dwell_ms,
        }}
      />

      {/* Visual controls removed - using hardcoded defaults */}
    </div>
  );
}