import React, {useEffect, useMemo, useRef, useState, startTransition} from "react";
import WarpRenderCheckpointsPanel from "./warp/WarpRenderCheckpointsPanel";
import { useEnergyPipeline, useSwitchMode } from "@/hooks/use-energy-pipeline";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeWU, buildREAL, buildSHOW, type WarpUniforms } from "@/lib/warp-uniforms";
import Grid3DEngine, { Grid3DHandle } from "@/components/engines/Grid3DEngine";
import { SliceViewer } from "@/components/SliceViewer";
import { gatedUpdateUniforms, applyToEngine } from "@/lib/warp-uniforms-gate";
import { subscribe, unsubscribe } from "@/lib/luma-bus";
import MarginHunterPanel from "./MarginHunterPanel";
import { checkpoint, within } from "@/lib/checkpoints";
import { thetaScaleExpected, thetaScaleUsed } from "@/lib/expectations";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Missing utility functions implementation
function normalizeKeys(obj: any): any {
  // Simple key normalization - just return the object as-is for now
  return obj || {};
}

function toUniforms(data: any): any {
  // Convert data to uniform format using existing normalizeWU
  return normalizeWU(data);
}

function bindShowCheckpoints(engine: any, canvas: HTMLCanvasElement) {
  // Placeholder for checkpoint binding - implement basic engine validation
  if (!engine) return;

  // Setup basic checkpoint validation for the SHOW engine
  setTimeout(() => {
    if (engine.uniforms) {
      console.debug('[bindShowCheckpoints] SHOW engine uniforms ready:', Object.keys(engine.uniforms));
    }
  }, 100);
}

function reportThetaConsistency(bound: any, viewFraction: number, isGrid3d: boolean = false) {
  // Enhanced theta consistency reporting with proper return value
  if (!bound || typeof bound.gammaGeo !== 'number') {
    console.debug('[reportThetaConsistency] Invalid bound parameters');
    return { expected: 0, used: 0, delta: 0 };
  }

  const expected = thetaGainExpected(bound);
  const used = expected * viewFraction;
  const delta = expected > 0 ? ((used - expected) / expected) * 100 : 0;

  const fmt = (n: number) => Number.isFinite(n) ? n.toExponential(2) : '—';
  const range = Math.max(expected, used) || 1;

  console.log(`[HELIX][θ] θ-scale — ${fmt(used)} • exp ${fmt(expected)} (${delta.toFixed(1)} off) • used≈${((used / range) * 100).toFixed(1)}%`);
  console.log(`[HELIX][θ] view fraction: ${(viewFraction * 100).toFixed(1)}%`);
  console.log(`[HELIX][θ] renderer: ${isGrid3d ? 'grid3d' : 'slice2d'}`);

  return { expected, used, delta };
}

// Push only after shaders are ready - now with enhanced gating and diagnostics
  function pushUniformsWhenReady(engine: any, patch: Record<string, any>, source: string = 'inspector') {
    if (!engine) {
      console.warn(`[${source}] Cannot push uniforms - engine is null`);
      return;
    }

    const push = () => {
      try {
        gatedUpdateUniforms(engine, patch, source);
        console.log(`[${source}] Successfully pushed uniforms:`, Object.keys(patch));
      } catch (error) {
        console.error(`[${source}] Failed to push uniforms:`, error);
      }
    };

    // Check if engine is ready
    const isReady = engine.isLoaded && engine.gridProgram;
    if (isReady) {
      push();
    } else {
      console.log(`[${source}] Engine not ready (isLoaded: ${!!engine.isLoaded}, gridProgram: ${!!engine.gridProgram}), waiting...`);

      if (typeof engine.onceReady === "function") {
        engine.onceReady(() => {
          console.log(`[${source}] Engine ready callback triggered`);
          push();
        });
      } else {
        // Enhanced fallback with timeout
        let attempts = 0;
        const maxAttempts = 50; // 2.5 seconds max wait

        const checkReady = () => {
          attempts++;
          if (engine._destroyed) {
            console.warn(`[${source}] Engine destroyed while waiting`);
            return;
          }

          if (engine.isLoaded && engine.gridProgram) {
            console.log(`[${source}] Engine became ready after ${attempts * 50}ms`);
            push();
          } else if (attempts < maxAttempts) {
            setTimeout(checkReady, 50);
          } else {
            console.error(`[${source}] Timeout waiting for engine readiness after ${attempts * 50}ms`);
            // Try pushing anyway as a last resort
            push();
          }
        };

        queueMicrotask(checkReady);
      }
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

// B) Setup engine checkpoints (wire-in point)
function setupEngineCheckpoints(engine: any, side: 'REAL' | 'SHOW', payload: any) {
  if (!engine) return;

  // Get expected values from payload
  const realPhys = {
    gammaGeo: payload?.gammaGeo ?? 26,
    q: payload?.qSpoilingFactor ?? 1,
    gammaVdB: payload?.gammaVanDenBroeck_vis ?? 1,
    dFR: payload?.dutyEffectiveFR ?? 0.000025
  };

  const expREAL = thetaScaleExpected(realPhys);

  // Setup RAF-based validation
  const validateUniforms = () => {
    const U = engine.uniforms || {};
    const θu = U.thetaScale as number;

    checkpoint({
      id:'uniforms/θ', side, stage:'uniforms',
      pass: within(θu, expREAL, 0.05),
      sev: within(θu, expREAL, 0.2) ? 'warn' : 'error',
      msg:`uniform θ=${θu?.toExponential()} vs expected=${expREAL.toExponential()}`,
      expect: expREAL, actual: θu
    });

    checkpoint({
      id:'modes', side, stage:'uniforms',
      pass: (U.ridgeMode===0 || U.ridgeMode===1) && U.physicsParityMode!=null,
      sev:'warn',
      msg:`ridge=${U.ridgeMode} parity=${U.physicsParityMode}`
    });

    // GPU health with enhanced diagnostics support
    function getLinkStatus(engine: any) {
      const gl   = engine?.gl as WebGLRenderingContext | WebGL2RenderingContext | undefined;
      const prog = engine?.gridProgram || engine?.program || engine?._program || null;
      const ext  = (engine?.parallelShaderExt || null) as any;

      if (!gl || !prog) return { stage: engine?.loadingState || 'idle', ok: false, reason: 'no GL or program' };

      // Enhanced diagnostics temporarily disabled for debugging
      // if (typeof engine.getShaderDiagnostics === 'function') {
      //   const diag = engine.getShaderDiagnostics();
      //   const ok = diag.status === 'linked';
      //   return {
      //     stage: diag.status,
      //     ok: ok,
      //     reason: diag.message || '',
      //     profile: diag.profile || 'auto'
      //   };
      // }

      // Fallback to original method for compatibility
      if (engine?.loadingState === 'compiling') {
        return { stage: 'compiling', ok: false, reason: '⏳ compiling shaders…' };
      }
      if (engine?.loadingState === 'failed') {
        const log = (gl.getProgramInfoLog(prog) || 'link failed').trim();
        return { stage: 'failed', ok: false, reason: log };
      }
      if (engine?.loadingState === 'linked') {
        return { stage: 'linked', ok: true, reason: '' };
      }

      // Infer via KHR if state not provided
      if (ext && gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR) === false) {
        return { stage: 'compiling', ok: false, reason: '⏳ compiling shaders…' };
      }

      // Final truth from LINK_STATUS
      const ok = !!gl.getProgramParameter(prog, gl.LINK_STATUS);
      const reason = ok ? '' : (gl.getProgramInfoLog(prog) || 'link failed (no log)').trim();
      return { stage: ok ? 'linked' : 'failed', ok, reason };
    }

    const { stage, ok: linked, reason } = getLinkStatus(engine);

    checkpoint({
      id: 'gpu/link', side, stage: 'gpu',
      pass: linked, // keeps ✅ / ✗ semantics
      sev: linked ? 'info' : (stage === 'compiling' ? 'warn' : 'error'),
      msg: linked
        ? 'shader linked'
        : (stage === 'compiling'
            ? '⏳ compiling shaders…'
            : `link error: ${reason || 'unknown'}`)
    });

    // CameraZ
    const camSet = !!engine.cameraZ && Number.isFinite(engine.cameraZ);
    checkpoint({ id:'cameraZ', side, stage:'uniforms', pass: camSet, sev: camSet?'info':'error',
      msg: camSet ? `cameraZ=${engine.cameraZ.toFixed(3)}` : 'CameraZ unset' });
  };

  // Hook into RAF if available
  if (engine._render) {
    const originalRender = engine._render.bind(engine);
    engine._render = function(...args: any[]) {
      if (!engine?.gridProgram) return originalRender(...args);
      validateUniforms();
      return originalRender(...args);
    };
  }

  // when wiring validateUniforms
  if (engine?.onceReady) {
    engine.onceReady(validateUniforms);
  } else {
    // fallback: wait a tick so linking can happen
    setTimeout(validateUniforms, 0);
  }
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

// --- Ellipsoid + wall math ---------------------------------------------------
function volEllipsoid(a:number,b:number,c:number){ return (4/3)*Math.PI*a*b*c; }
// Knud Thomsen surface area approximation (p≈1.6075)
function areaEllipsoid(a:number,b:number,c:number){
  const p = 1.6075;
  const t = (Math.pow(a,p)*Math.pow(b,p) + Math.pow(a,p)*Math.pow(c,p) + Math.pow(b,p)*Math.pow(c,p))/3;
  return 4*Math.PI*Math.pow(t, 1/p);
}
function harmonicMean3(a:number,b:number,c:number){
  const d = (1/Math.max(a,1e-12) + 1/Math.max(b,1e-12) + 1/Math.max(c,1e-12));
  return 3/Math.max(d,1e-12);
}
function fmtSI(x:number, unit:string){
  if (!Number.isFinite(x)) return `— ${unit}`;
  const abs = Math.abs(x);
  if (abs >= 1e3) {
    // Insert a dot before m²/m³ so it can't be read as km²/km³
    const needsDot = unit.includes('m²') || unit.includes('m³');
    const label = needsDot ? `k·${unit}` : `k${unit}`;
    return `${(x/1e3).toFixed(2)} ${label}`;
  }
  if (abs >= 1)   return `${x.toFixed(3)} ${unit}`;
  if (abs >= 1e-3)return `${(x*1e3).toFixed(2)} m${unit}`;
  if (abs >= 1e-6)return `${(x*1e6).toFixed(2)} µ${unit}`;
  if (abs >= 1e-9)return `${(x*1e9).toFixed(1)} n${unit}`;
  return x.toExponential(2) + ' ' + unit;
}

// Exotic mass proxy: M* ~ θ^2 · V_shell · viewFraction   (arb units; display-only)
function massProxy(theta:number, shellVol_m3:number, viewFraction:number){
  const th = Math.max(0, theta||0);
  return th*th * Math.max(0, shellVol_m3||0) * Math.max(0, viewFraction||0);
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
  // no ridgeMode here — ridge is enforced per-pane in the lock
  colorMode: 'theta' as const,
  viewAvg: true
};

// ---- PaneOverlay Component --------------------------------------------------
function PaneOverlay(props:{
  title: string;
  flavor: 'REAL'|'SHOW';
  engineRef: React.MutableRefObject<any>;
  viewFraction: number; // REAL uses 1/sectorCount, SHOW uses 1.0
}){
  const { engineRef, flavor, viewFraction, title } = props;
  const [snap, setSnap] = useState<any>(null);

  // live pull from the engine every frame
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const e = engineRef.current;
      const U = e?.uniforms || {};
      const H = U.hullAxes || [503.5,132,86.5];
      const a = +H[0]||503.5, b = +H[1]||132.0, c = +H[2]||86.5;
      const aH = harmonicMean3(a,b,c);

      // prefer explicit meters if present, else convert ρ→m using aH
      const w_m = (U.hullDimensions?.wallWidth_m != null)
        ? +U.hullDimensions.wallWidth_m
        : (Number.isFinite(U.wallWidth) ? (+U.wallWidth) * aH : 0.016*aH);

      const V  = volEllipsoid(a,b,c);
      const S  = areaEllipsoid(a,b,c);
      const Vshell = Math.max(0, w_m) * Math.max(0, S); // thin-shell approx

      const theta = Number.isFinite(U.thetaScale) ? +U.thetaScale : 0;
      const mStar = massProxy(theta, Vshell, flavor==='REAL' ? viewFraction : 1.0);

      // pull contraction/expansion from diagnostics if available
      const diag = (e?.computeDiagnostics?.() || {}) as any;
      const frontRaw  = diag.theta_front_max;
      const rearRaw   = diag.theta_rear_min;
      const f = (flavor === 'REAL') ? Math.max(1e-12, viewFraction) : 1;
      const frontMax  = diag.theta_front_max_viewed ?? (Number.isFinite(frontRaw) ? frontRaw * Math.sqrt(f) : frontRaw);
      const rearMin   = diag.theta_rear_min_viewed  ?? (Number.isFinite(rearRaw)  ? rearRaw  * Math.sqrt(f) : rearRaw);

      setSnap({
        a,b,c,aH, w_m, V,S, Vshell, theta, mStar, frontMax, rearMin,
        sectors: Math.max(1,(U.sectorCount|0)||1),
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engineRef, flavor, viewFraction]);

  const s = snap || {};
  const widthNm = Number.isFinite(s.w_m) ? s.w_m*1e9 : NaN;

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-[5]">
      <div className="pointer-events-auto rounded-xl bg-black/65 border border-white/10 text-white px-3 py-2 shadow-lg max-w-[92%]">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-blue-600/80">
            {title}
          </span>
          <span className="text-xs text-white/80">
            wall width: <b>{fmtSI(s.w_m,'m')}</b> {Number.isFinite(widthNm) ? `(${widthNm.toFixed(0)} nm)` : ''}
          </span>
        </div>

        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-white/85">
          <div>θ-scale: <b>{Number.isFinite(s.theta)? s.theta.toExponential(2) : '—'}</b></div>
          <div>view fraction: <b>{(flavor==='REAL'? props.viewFraction : 1).toFixed(4)}</b></div>
          <div>shell volume: <b>{fmtSI(s.Vshell,'m³')}</b></div>
          <div>exotic mass* : <b>{Number.isFinite(s.mStar)? s.mStar.toExponential(3) : '—'} arb</b></div>
          <div>front(+): <b>{Number.isFinite(s.frontMax)? s.frontMax.toExponential(2):'—'}</b></div>
          <div>rear(−): <b>{Number.isFinite(s.rearMin)? s.rearMin.toExponential(2):'—'}</b></div>
        </div>

        {/* dropdown with filled equations */}
        <details className="mt-2">
          <summary className="text-xs text-white/70 hover:text-white cursor-pointer">equations & filled values</summary>
          <div className="mt-2 text-[11px] leading-5 text-white/85 space-y-2">
            <div>
              <div className="opacity-80">Ellipsoid geometry</div>
              <div><code>V = 4/3 · π · a · b · c</code> = <b>{Number.isFinite(s.V)? fmtSI(s.V,'m³') : '—'}</b></div>
              <div><code>S ≈ 4π · ((a^p b^p + a^p c^p + b^p c^p)/3)^(1/p)</code>, <i>p</i>=1.6075 → <b>{Number.isFinite(s.S)? fmtSI(s.S,'m²'):'—'}</b></div>
              <div><code>a_H = 3 / (1/a + 1/b + 1/c)</code> = <b>{Number.isFinite(s.aH)? fmtSI(s.aH,'m'):'—'}</b></div>
              <div><code>w_m = wallWidth_m ⟂</code> (or <code>w_ρ · a_H</code>) → <b>{fmtSI(s.w_m,'m')}</b></div>
              <div><code>V_shell ≈ S · w_m</code> → <b>{Number.isFinite(s.Vshell)? fmtSI(s.Vshell,'m³'):'—'}</b></div>
            </div>
            <div>
              <div className="opacity-80">Curvature (York-time proxy)</div>
              <div><code>θ ∝ v_ship · (x_s/r_s) · (−2(rs−1)/w²) · exp(−((rs−1)/w)²)</code></div>
              <div>engine θ-scale (γ_geo³ · q · γ_VdB · √d_FR): <b>{Number.isFinite(s.theta)? s.theta.toExponential(2):'—'}</b></div>
            </div>
            <div>
              <div className="opacity-80">Exotic mass proxy (display-only)</div>
              <div>
                <code>M* = θ² · V_shell · {flavor==='REAL' ? 'viewFraction' : '1'}</code>
                {' '}→ <b>{Number.isFinite(s.mStar)? s.mStar.toExponential(3):'—'} arb</b>
              </div>
              <div className="text-white/60">(* proportional units for visualization; not a calibrated mass)</div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

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
  const [loadError, setLoadError] = useState<string | null>(null);

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

  // Curvature control
  const [curvT, setCurvT] = useState(0.45);


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

  // NOTE: removed hardLockUniforms — having two wrappers races fields.

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
    
    // Store the forced parity settings for this pane
    const forcedParity = (pane === 'REAL');
    const forcedRidge = (pane === 'REAL') ? 0 : 1;
    
    // Enhanced parity enforcement with multiple layers
    engine.updateUniforms = (patch: any) => {
      const safe = normalizeKeys({ ...(patch || {}) });
      
      // Never accept direct θ writes; renderer derives θ from physics.
      if ('thetaScale' in safe) delete safe.thetaScale;

      // ABSOLUTE FORCE parity mode settings - these cannot be overridden
      safe.physicsParityMode = forcedParity;
      safe.parityMode = forcedParity;
      safe.ridgeMode = forcedRidge;

      // Debug logging to verify parity is being set
      console.log(`[${pane}] Parity lock: physicsParityMode=${safe.physicsParityMode}, ridgeMode=${safe.ridgeMode}`);

      // Call original updateUniforms
      let result = false;
      if (orig) {
        try {
          result = orig(safe);
        } catch (error) {
          console.error(`[${pane}] updateUniforms failed:`, error);
        }
      }

      // IMMEDIATE enforcement after original call
      if (engine.uniforms) {
        engine.uniforms.physicsParityMode = forcedParity;
        engine.uniforms.parityMode = forcedParity;
        engine.uniforms.ridgeMode = forcedRidge;
      }

      // Delayed verification and correction
      setTimeout(() => {
        if (engine.uniforms) {
          const actualParity = engine.uniforms.physicsParityMode;
          const actualRidge = engine.uniforms.ridgeMode;
          
          if (actualParity !== forcedParity || actualRidge !== forcedRidge) {
            console.error(`[${pane}] PARITY ENFORCEMENT FAILURE: expected parity=${forcedParity}, actual=${actualParity}, expected ridge=${forcedRidge}, actual=${actualRidge}`);
            
            // Force correction with multiple attempts
            engine.uniforms.physicsParityMode = forcedParity;
            engine.uniforms.parityMode = forcedParity;
            engine.uniforms.ridgeMode = forcedRidge;
            
            // Try engine-specific enforcement methods if available
            if (engine.setParityMode) {
              engine.setParityMode(forcedParity);
            }
            if (engine.setRidgeMode) {
              engine.setRidgeMode(forcedRidge);
            }
            
            console.log(`[${pane}] Forced correction applied`);
          } else {
            console.log(`[${pane}] Post-update verification: parity=${actualParity}, ridge=${actualRidge} ✓`);
          }
        }
      }, 10);
      
      return result;
    };

    // Mark as locked
    engine.__locked = true;
    
    // Override any preset methods that might interfere
    if (engine.setPresetParity) {
      const originalPresetParity = engine.setPresetParity.bind(engine);
      engine.setPresetParity = () => {
        originalPresetParity();
        // Immediately re-enforce our settings
        if (engine.uniforms) {
          engine.uniforms.physicsParityMode = forcedParity;
          engine.uniforms.parityMode = forcedParity;
          engine.uniforms.ridgeMode = forcedRidge;
        }
      };
    }

    if (engine.setPresetShowcase) {
      const originalPresetShowcase = engine.setPresetShowcase.bind(engine);
      engine.setPresetShowcase = () => {
        originalPresetShowcase();
        // Immediately re-enforce our settings
        if (engine.uniforms) {
          engine.uniforms.physicsParityMode = forcedParity;
          engine.uniforms.parityMode = forcedParity;
          engine.uniforms.ridgeMode = forcedRidge;
        }
      };
    }

    // Immediately set the parity mode to ensure it's applied
    const initialParity = {
      physicsParityMode: forcedParity,
      parityMode: forcedParity,
      ridgeMode: forcedRidge
    };
    
    console.log(`[${pane}] Setting initial parity:`, initialParity);
    engine.updateUniforms(initialParity);
    
    // Periodic enforcement to catch any drift
    const enforceInterval = setInterval(() => {
      if (engine._destroyed) {
        clearInterval(enforceInterval);
        return;
      }
      
      if (engine.uniforms && 
          (engine.uniforms.physicsParityMode !== forcedParity || 
           engine.uniforms.ridgeMode !== forcedRidge)) {
        console.warn(`[${pane}] Parity drift detected, re-enforcing`);
        engine.uniforms.physicsParityMode = forcedParity;
        engine.uniforms.parityMode = forcedParity;
        engine.uniforms.ridgeMode = forcedRidge;
      }
    }, 1000);
    
    // Store cleanup reference
    engine.__enforceInterval = enforceInterval;
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

  // WebGL detection helper (soft): presence of APIs is enough.
  // Some mobile browsers/webviews return null for off-DOM test canvases even though
  // real canvases will create a context just fine.
  const isWebGLAvailable = () => {
    if (typeof window === 'undefined') return false;
    const hasAPI =
      !!(window as any).WebGL2RenderingContext ||
      !!(window as any).WebGLRenderingContext;
    if (!hasAPI) return false;
    // Try a context, but don't treat failure here as fatal.
    try {
      const canvas = document.createElement('canvas');
      const attrs: WebGLContextAttributes = {
        alpha: false, antialias: false, depth: false, stencil: false,
        preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: false,
      };
      const gl =
        (canvas.getContext('webgl2', attrs) as any) ||
        (canvas.getContext('webgl', attrs) as any) ||
        (canvas.getContext('experimental-webgl' as any, attrs as any) as any);
      return !!gl || hasAPI;
    } catch {
      return hasAPI;
    }
  };

  // Engine creation & lifecycle
  useEffect(() => {
    const W: any = (window as any).WarpEngine;
    if (!W) {
      console.error("WarpEngine not found on window. Load warp-engine.js first.");
      setLoadError("WarpEngine not loaded");
      return;
    }

    // Only hard-fail if the APIs are genuinely absent.
    // Otherwise let the engine try to create a real context on real canvases.
    if (!isWebGLAvailable()) {
      setLoadError("WebGL not supported in this browser");
      return;
    }

    // Prevent double initialization
    if (leftEngine.current || rightEngine.current) {
      console.log("Engines already initialized, skipping...");
      return;
    }

    console.log("Initializing WarpRenderInspector engines...");

    // REAL engine
    if (leftRef.current && !leftEngine.current) {
      try {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        leftRef.current.width  = Math.max(1, Math.floor((leftRef.current.clientWidth  || 800) * dpr));
        leftRef.current.height = Math.max(1, Math.floor((leftRef.current.clientHeight || 450) * dpr));

        // Clear any existing engine on this canvas
        delete (leftRef.current as any).__warpEngine;

        leftEngine.current = new W(leftRef.current);
        leftOwnedRef.current = true;
        console.log("REAL engine created successfully");

        // Initialize with safe defaults
        gatedUpdateUniforms(leftEngine.current, {
          exposure: 5.0,
          zeroStop: 1e-7,
          physicsParityMode: true,
          ridgeMode: 0
        }, 'real-init');

        leftEngine.current?.setVisible?.(false);
        lockPane(leftEngine.current, 'REAL');

      } catch (error) {
        console.error("Failed to create REAL engine:", error);
        setLoadError("Failed to initialize REAL WebGL engine");
        return;
      }
    }

    // SHOW engine
    if (rightRef.current && !rightEngine.current) {
      try {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        rightRef.current.width  = Math.max(1, Math.floor((rightRef.current.clientWidth  || 800) * dpr));
        rightRef.current.height = Math.max(1, Math.floor((rightRef.current.clientHeight || 450) * dpr));

        // Clear any existing engine on this canvas
        delete (rightRef.current as any).__warpEngine;

        rightEngine.current = createEngineWithFallback(showRendererType, rightRef.current);
        rightOwnedRef.current = true;
        console.log("SHOW engine created successfully");

        // Initialize with safe defaults
        gatedUpdateUniforms(rightEngine.current, {
          exposure: 5.0,
          zeroStop: 1e-7,
          physicsParityMode: false,
          ridgeMode: 1
        }, 'show-init');

        rightEngine.current?.setVisible?.(false);
        lockPane(rightEngine.current, 'SHOW');

        // attach SHOW checkpoints so the panel/devtools get live data
        bindShowCheckpoints(rightEngine.current, rightRef.current);

      } catch (error) {
        console.error("Failed to create SHOW engine:", error);
        setLoadError("Failed to initialize SHOW WebGL engine");
        return;
      }
    }

    // No extra hard lock — lockPane is the single authority now.

    // bootstrap both
    leftEngine.current?.bootstrap({ ...realPayload });
    rightEngine.current?.bootstrap({ ...showPayload });

    leftEngine.current?.onceReady?.(() => {
      // Ensure axesClip exists for a reliable cameraZ
      let ax = leftEngine.current?.uniforms?.axesClip;
      if (!ax) {
        const hull = props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 };
        ax = deriveAxesClip(hull, 1);
        gatedUpdateUniforms(leftEngine.current, { axesClip: ax }, 'inspector-left-axes');
      }
      const cz = compactCameraZ(ax);
      gatedUpdateUniforms(leftEngine.current, { cameraZ: cz, lockFraming: true }, 'inspector-left-init');
      // B) WarpRenderInspector.tsx wire-in: Engine ready + RAF checkpoints
      setupEngineCheckpoints(leftEngine.current, 'REAL', realPayload);
    });

    rightEngine.current?.onceReady?.(() => {
      // seed axes/camera immediately so buffers build and checkpoints flip to "set"
      const hull = props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 };
      const ax = deriveAxesClip(hull, 1);
      const cz = compactCameraZ(ax);
      gatedUpdateUniforms(rightEngine.current, { axesClip: ax, cameraZ: cz, lockFraming: true, ridgeMode: 1 }, 'inspector-right-init');

      // (Nice-to-have) instant grid buffers for the "0/0 floats" row
      rightEngine.current?.updateUniforms?.({
        hull: props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 },
        wallWidth_m: props.baseShared?.wallWidth_m ?? 0.6,
        physicsParityMode: false,
        ridgeMode: 1, colorMode: 'theta',
      });
      rightEngine.current?.forceRedraw?.();

      // B) WarpRenderInspector.tsx wire-in: Engine ready + RAF checkpoints
      setupEngineCheckpoints(rightEngine.current, 'SHOW', showPayload);
    });

    // Additional guard to ensure cameraZ is set after onceReady
    setTimeout(() => {
      // After onceReady has fired and axes are known:
      const cz = compactCameraZ(leftEngine.current?.uniforms?.axesClip);
      leftEngine.current?.updateUniforms?.({ cameraZ: cz, lockFraming: true });
      const czR = compactCameraZ(rightEngine.current?.uniforms?.axesClip);
      rightEngine.current?.updateUniforms?.({ cameraZ: czR, lockFraming: true });
    }, 100);

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
        applyToEngine(leftEngine.current,  { ...u, physicsParityMode: true,  ridgeMode: 0 });
      }
      if (rightEngine.current) {
        applyToEngine(rightEngine.current, { ...u, physicsParityMode: false, ridgeMode: 1 });
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
          exposure: TONEMAP_LOCK.exp,
          zeroStop: TONEMAP_LOCK.zero,
          colorMode: TONEMAP_LOCK.colorMode,
          viewAvg: TONEMAP_LOCK.viewAvg
        });
      }
      if (rightEngine.current) {
        rightEngine.current.updateUniforms?.({
          physicsParityMode: false,
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

      // Clean up parity enforcement intervals
      try { 
        if (leftEngine.current?.__enforceInterval) {
          clearInterval(leftEngine.current.__enforceInterval);
        }
        if (leftOwnedRef.current) leftEngine.current?.destroy(); 
      } catch {}
      
      try { 
        if (rightEngine.current?.__enforceInterval) {
          clearInterval(rightEngine.current.__enforceInterval);
        }
        if (rightOwnedRef.current) rightEngine.current?.destroy(); 
      } catch {}
      
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

  // after you compute sTotal etc.
  const wallWidth_m      = N(props.baseShared?.wallWidth_m ?? live?.hull?.wallThickness_m, 1.0);
  // let callers optionally provide a thinner analytical slice (else assume full wall)
  const sliceThickness_m = N(props.baseShared?.sliceThickness_m, wallWidth_m);

  // 0..1 of the wall band covered by the slice grid
  const bandCover = Math.max(0, Math.min(1, sliceThickness_m / Math.max(1e-9, wallWidth_m)));

  // sector (azimuthal) fraction already represented by REAL's "one pane"
  const sectorFrac = 1 / Math.max(1, sTotal);

  // final view mass fraction for REAL's diagnostics & proxies
  const viewMassFracREAL = sectorFrac * bandCover;

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
         * Math.sqrt(Math.max(1e-12, Number(dutyEffectiveFR)||0));
  }

  function pctDelta(a:number, b:number){
    if (!isFinite(a) || !isFinite(b) || b === 0) return NaN;
    return (a/b - 1) * 100;
  }

  // -- SHOW checkpoints binder: exports a full snapshot every frame
  function bindShowCheckpoints(engine: any, canvas: HTMLCanvasElement) {
    const publish = () => {
      const u = engine?.uniforms || {};
      const floats = (engine?.gridVertices?.length || 0);
      const snap = {
        // canvas / GL
        canvasW: canvas?.width || 0,
        canvasH: canvas?.height || 0,
        hasGL: !!engine?.gl,

        // readiness
        programReady: !!engine?.gridProgram,
        isLoaded: !!engine?.isLoaded,

        // critical fields the panel cares about
        cameraZSet: Number.isFinite(u?.cameraZ || null),
        axesClipSet: Array.isArray(u?.axesClip) && u.axesClip.length === 3,
        thetaValid: Number.isFinite(u?.thetaScale) && (u.thetaScale as number) > 0,

        // runtime viz
        parity: !!u?.physicsParityMode,
        ridgeMode: (u?.ridgeMode ?? undefined),
        toneExp: u?.exposure ?? 0,
        toneZero: u?.zeroStop ?? 0,

        // grid + sectoring
        gridFloats: floats,                       // total vertex floats
        sectors: Math.max(1, (u?.sectors|0) || 1),
        sectorTotal: Math.max(1, (u?.sectorCount|0) || (u?.sectors|0) || 1),
        split: Math.max(0, (u?.split|0) || 0),

        // loop
        running: !!engine?._raf,
        ts: Date.now(),
      };

      // Expose to devtools and a UI listener (if the panel listens)
      (window as any).__chkSHOW = snap;
      try {
        window.dispatchEvent(new CustomEvent('helix:show-checkpoints', { detail: snap }));
      } catch {}
      // Also ship full diagnostics if available
      try {
        (window as any).__diagSHOW = engine?.computeDiagnostics?.() || null;
      } catch {}
    };

    // fire on every diagnostics beat & on loading state changes
    engine.onDiagnostics = () => publish();
    engine.onLoadingStateChange = () => publish();
    publish(); // kick once now
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

    console.log(`[HELIX][θ] θ-scale — ${fmt(used)} • exp ${fmt(expected)} (${delta.toFixed(1)} off) • used≈${fmtPct(used / range)}`);
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
    dutyEffectiveFR,
  };
  // Calculate theta scale properly for both engines
  const realViewMassFraction = viewMassFracREAL;
  const showViewMassFraction = 1.0; // SHOW always uses full bubble

  // Don't push thetaScale directly - let engines compute it from physics parameters
  // The theta scale should be computed internally from the physics parameters

  // --- BRIDGE Grid3D wrapper → inspector refs (engine + canvas)
  useEffect(() => {
    if (showRendererType !== 'grid3d') return;

    let raf = 0, tries = 0;
    const attach = () => {
      const g  = grid3dRef.current?.getEngine?.();
      const cv = grid3dRef.current?.getCanvas?.();

      if (g && cv) {
        // Hand the real objects to the inspector/checkpoints
        rightEngine.current = g;
        (rightRef as any).current = cv;
        rightOwnedRef.current = false;

        // Seed framing so buffers build promptly
        const hull = props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 };
        const ax = deriveAxesClip(hull, 1);
        const cz = compactCameraZ(ax);
        pushUniformsWhenReady(g, { axesClip: ax, cameraZ: cz, lockFraming: true }, 'grid3d-bridge');

        // Sensible render quality
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        grid3dRef.current?.setPixelRatio?.(dpr);
        grid3dRef.current?.setSupersample?.(1.25);

        // Nudge grid density once the canvas has real dimensions
        const W = cv.width, H = cv.height;
        const pxAcross = estimatePxAcrossWall({
          canvasPxW: W, canvasPxH: H,
          gridSpan: 1, hull,
          wallWidth_m: props.baseShared?.wallWidth_m ?? 0.6,
        });
        const seg = Math.max(24, Math.min(256, Math.ceil(pxAcross * 2)));
        grid3dRef.current?.setGridResolution?.({ radial: seg, angular: seg, axial: seg });

        // Match visibility gate
        g.setVisible?.(haveUniforms);
        return; // stop loop
      }

      if (tries++ < 90) raf = requestAnimationFrame(attach);
    };

    attach();
    return () => cancelAnimationFrame(raf);
  }, [showRendererType, haveUniforms]);

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
    if (!leftEngine.current) return;
    if (!rightEngine.current) return; // ⬅️ add this when SHOW uses JS engine

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

    // Create base physics parameters (no display overrides here)
    const basePhysics = {
      gammaGeo: N(props.parityPhys?.gammaGeo ?? live?.gammaGeo, 26),
      qSpoilingFactor: N(props.parityPhys?.qSpoilingFactor ?? live?.qSpoilingFactor, 1),
      gammaVanDenBroeck: gammaVdBBound,
      dutyEffectiveFR,
      dutyCycle: N(props.parityPhys?.dutyCycle ?? live?.dutyCycle, 0.14),
      sectorCount: sTotal,
      sectors: sConcurrent,
      lightCrossing: {
        burst_ms: props.lightCrossing?.burst_ms ?? 0.01,
        dwell_ms: props.lightCrossing?.dwell_ms ?? 1
      },
      hull: props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 },
      wallWidth_m: props.baseShared?.wallWidth_m ?? 0.6,
      driveDir: props.baseShared?.driveDir ?? [1,0,0],
      vShip: props.baseShared?.vShip ?? 0,
      lockFraming: true,
      currentMode: props.baseShared?.currentMode ?? 'hover'
    };

    // REAL engine - exact physics truth
    const realUniforms = {
      ...basePhysics,
      physicsParityMode: true,
      ridgeMode: 0,
      colorMode: 'theta',
      viewAvg: true,
      exposure: 5.0,
      zeroStop: 1e-7,
      viewMassFraction: realViewMassFraction
    };

    // SHOW engine - same physics but enhanced visuals
    const showUniforms = {
      ...basePhysics,
      physicsParityMode: false,
      ridgeMode: 1,
      colorMode: 'theta',
      viewAvg: true,
      displayGain: 4.0,
      curvatureGainT: 0.6,
      curvatureBoostMax: 40,
      exposure: 6.0,
      zeroStop: 1e-7,
      viewMassFraction: 1.0
    };

    console.log("Applying physics to engines:", {
      real: { parity: realUniforms.physicsParityMode, ridge: realUniforms.ridgeMode },
      show: { parity: showUniforms.physicsParityMode, ridge: showUniforms.ridgeMode }
    });

    // Apply to engines - the lock functions will enforce parity settings
    gatedUpdateUniforms(leftEngine.current, realUniforms, 'inspector-real-physics');
    gatedUpdateUniforms(rightEngine.current, showUniforms, 'inspector-show-physics');

    // Unmute engines after first normalized payloads are pushed
    leftEngine.current?.setVisible?.(true);
    rightEngine.current?.setVisible?.(true);

    // Optional camera sweetener so both keep same framing
    const ax = wu.axesScene || leftEngine.current?.uniforms?.axesClip;
    const cz = compactCameraZ(ax);
    gatedUpdateUniforms(leftEngine.current, normalizeKeys({ cameraZ: cz }), 'inspector-camera');
    gatedUpdateUniforms(rightEngine.current, normalizeKeys({ cameraZ: cz }), 'inspector-camera');

    // Enhanced parity verification with detailed logging and correction
    setTimeout(() => {
      const realParity = leftEngine.current?.uniforms?.physicsParityMode;
      const showParity = rightEngine.current?.uniforms?.physicsParityMode;
      const realRidge = leftEngine.current?.uniforms?.ridgeMode;
      const showRidge = rightEngine.current?.uniforms?.ridgeMode;

      console.log('=== PARITY VERIFICATION ===');
      console.log('REAL parity?', realParity, '(should be true)');
      console.log('SHOW parity?', showParity, '(should be false)');
      console.log('REAL ridge?', realRidge, '(should be 0)');
      console.log('SHOW ridge?', showRidge, '(should be 1)');

      // Check if parity enforcement failed and attempt correction
      if (realParity !== true) {
        console.error('❌ REAL engine parity enforcement FAILED - should be true, got:', realParity);
        console.log('REAL uniforms.physicsParityMode:', leftEngine.current?.uniforms?.physicsParityMode);
        console.log('REAL uniforms.parityMode:', leftEngine.current?.uniforms?.parityMode);
        console.log('REAL expected parity:', true);
        
        // Attempt direct correction
        if (leftEngine.current?.uniforms) {
          leftEngine.current.uniforms.physicsParityMode = true;
          leftEngine.current.uniforms.parityMode = true;
          leftEngine.current.uniforms.ridgeMode = 0;
          console.log('🔧 REAL parity corrected via direct assignment');
        }
      }
      
      if (showParity !== false) {
        console.error('❌ SHOW engine parity enforcement FAILED - should be false, got:', showParity);
        
        // Attempt direct correction
        if (rightEngine.current?.uniforms) {
          rightEngine.current.uniforms.physicsParityMode = false;
          rightEngine.current.uniforms.parityMode = false;
          rightEngine.current.uniforms.ridgeMode = 1;
          console.log('🔧 SHOW parity corrected via direct assignment');
        }
      }

      // Report theta consistency after engine updates
      const realTheta = leftEngine.current?.uniforms?.thetaScale;
      const showTheta = rightEngine.current?.uniforms?.thetaScale;
      console.log('Theta scales - REAL:', realTheta?.toExponential?.(2), 'SHOW:', showTheta?.toExponential?.(2));

      reportThetaConsistency(bound, realViewMassFraction, false);
      
      // Final verification after corrections
      setTimeout(() => {
        const finalRealParity = leftEngine.current?.uniforms?.physicsParityMode;
        const finalShowParity = rightEngine.current?.uniforms?.physicsParityMode;
        
        if (finalRealParity === true && finalShowParity === false) {
          console.log('✅ Parity enforcement corrected successfully');
        } else {
          console.error('❌ Parity enforcement still failing after correction attempts');
          console.log('Final REAL parity:', finalRealParity);
          console.log('Final SHOW parity:', finalShowParity);
        }
      }, 100);
    }, 200);
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

  // Keep canvases crisp on container resize with mobile optimizations
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      // Mobile-optimized device pixel ratio (avoid excessive resolution on mobile)
      const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
      const dpr = isMobile ? Math.min(1.5, window.devicePixelRatio || 1) : Math.min(2, window.devicePixelRatio || 1);
      
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

  // Show error state if WebGL is not supported
  if (loadError) {
    return (
      <div className="w-full grid gap-4 p-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h3 className="text-lg font-semibold text-red-800">WebGL Not Supported</h3>
          <p className="text-red-600 mt-2">{loadError}</p>
          <p className="text-sm text-red-500 mt-2">
            The Warp Render Inspector requires WebGL support. This may occur in:
          </p>
          <ul className="text-sm text-red-500 mt-1 ml-4 list-disc">
            <li>Headless environments or CI/CD systems</li>
            <li>Browsers with WebGL disabled</li>
            <li>Virtual machines without GPU acceleration</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full grid gap-4 p-2 sm:p-4">
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Operational Render Inspector</h2>
          <p className="text-xs sm:text-sm text-neutral-500">REAL (Ford–Roman parity) vs SHOW (UI boosted) — uses the same render path as WarpBubbleCompare.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="text-xs sm:text-sm font-medium">Mode</label>
          {(['hover','cruise','emergency','standby'] as const).map(m => (
            <button
              key={m}
              onClick={() => onMode(m)}
              className={`px-2 sm:px-3 py-1 rounded-2xl text-xs sm:text-sm border touch-manipulation ${mode===m? 'bg-blue-600 text-white border-blue-600' : 'border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200'}`}
            >{m}</button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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
              <canvas ref={leftRef} className="w-full h-full block touch-manipulation select-none"/>
            )}
            {/* ⬇️ live badge */}
            <PaneOverlay title="REAL · per-pane slice" flavor="REAL" engineRef={leftEngine} viewFraction={viewMassFracREAL}/>
          </div>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-neutral-950/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">SHOW — Boosted (UI) ({showRendererType})</h3>
            <div className="text-xs text-neutral-400">ridgeMode=1 • {colorMode}</div>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/90">
            <canvas ref={rightRef} className="w-full h-full block touch-manipulation select-none"/>
            {/* ⬇️ live badge */}
            <PaneOverlay title="SHOW · whole ship" flavor="SHOW" engineRef={rightEngine} viewFraction={1}/>
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
          <h4 className="font-medium mb-3">Curvature</h4>
          <select
            className="px-2 py-1 text-sm border rounded"
            value={curvT}
            onChange={e => {
              const v = Number(e.target.value);
              setCurvT(v);
              pushUniformsWhenReady(leftEngine.current,  { curvT: v }, 'ui-curvature');
              pushUniformsWhenReady(rightEngine.current, { curvT: v }, 'ui-curvature');
            }}
          >
            <option value={0.00}>Flat</option>
            <option value={0.25}>Mild</option>
            <option value={0.45}>Cruise</option>
            <option value={0.70}>Steep</option>
          </select>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-4">
          <h4 className="font-medium mb-3">Live Engine Snapshot</h4>
          {/* θ-scale verification display */}
          <div className="text-xs text-neutral-600 mb-3 space-y-1">
            <div>θ-scale expected: {((live as any)?.thetaScaleExpected ?? 0).toExponential(2)}</div>
            <div>θ-scale (physics-only): {(bound?.gammaGeo ? thetaGainExpected(bound) : 0).toExponential(3)} • Current status: READY</div>
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

      {/* Margin Hunter Panel */}
      <MarginHunterPanel
        getShowEngine={() => rightEngine.current}
        initial={{
          thetaBudget: 8.79e12,
          dutyFR_max: 0.02,
          sectorCap: 64,
          bounds: {
            q: [0.2, 3],
            gScale: [0.5, 2.5],
            sectors: [1, 32],
            dutyLocal: [1e-4, 0.1],
          }
        }}
      />

      {/* Comprehensive WebGL diagnostics panel */}
      <WarpRenderCheckpointsPanel
        leftLabel="REAL"
        rightLabel="SHOW"
        leftEngineRef={leftEngine}
        rightEngineRef={rightEngine}   // ⬅️ this is now the JS WarpEngine
        leftCanvasRef={leftRef}
        rightCanvasRef={rightRef}      // ⬅️ same canvas the engine draws into
        live={live}
        lightCrossing={{ burst_ms: (live as any)?.burst_ms, dwell_ms: (live as any)?.dwell_ms }}
      />

      {/* Visual controls removed - using hardcoded defaults */}
    </div>
  );
}