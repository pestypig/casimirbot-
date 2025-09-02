import React, {useEffect, useMemo, useRef, useState, startTransition} from "react";
import WarpRenderCheckpointsPanel from "./warp/WarpRenderCheckpointsPanel";
import { useEnergyPipeline, useSwitchMode } from "@/hooks/use-energy-pipeline";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeWU, buildREAL, buildSHOW } from "@/lib/warp-uniforms";

import { gatedUpdateUniforms, applyToEngine } from "@/lib/warp-uniforms-gate";
import { subscribe, unsubscribe, publish } from "@/lib/luma-bus";
import MarginHunterPanel from "./MarginHunterPanel";
import { checkpoint, within } from "@/lib/checkpoints";
import { thetaScaleExpected, thetaScaleUsed } from "@/lib/expectations";
import { useIsMobile } from "@/hooks/use-mobile";
import { sizeCanvasSafe, clampMobileDPR } from '@/lib/gl/capabilities';
import { webglSupport } from '@/lib/gl/webgl-support';
import CanvasFallback from '@/components/CanvasFallback';
import Grid3DEngine from '@/components/engines/Grid3DEngine';

// --- FAST PATH HELPERS (drop-in) --------------------------------------------

// Add near other helpers
async function waitForNonZeroSize(cv: HTMLCanvasElement, timeoutMs = 3000) {
  const t0 = performance.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      const w = cv.clientWidth || cv.getBoundingClientRect().width;
      const h = cv.clientHeight || cv.getBoundingClientRect().height;
      if (w > 8 && h > 8) return resolve();
      if (performance.now() - t0 > timeoutMs) return reject(new Error('canvas size timeout (0×0)'));
      requestAnimationFrame(tick);
    };
    tick();
  });
}

const DEBUG = false;
const IS_COARSE =
  typeof window !== 'undefined' &&
  (matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ''));

// Batches many uniform patches into ONE engine write + ONE forceRedraw per rAF
function makeUniformBatcher(engineRef: React.MutableRefObject<any>) {
  let pending: any = null;
  let scheduled = false;
  return (patch: any, tag = 'batched') => {
    pending = { ...(pending || {}), ...(patch || {}) };
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const e = engineRef.current;
      if (!e || !pending) return;
      const toSend = pending; pending = null;
      try {
        if (e.isLoaded && e.gridProgram) {
          gatedUpdateUniforms(e, toSend, 'client');
          e.forceRedraw?.();
        } else if (typeof e.onceReady === 'function') {
          e.onceReady(() => { gatedUpdateUniforms(e, toSend, 'client'); e.forceRedraw?.(); });
        }
      } catch (err) {
        if (DEBUG) console.error('[batchPush] failed:', err);
      }
    });
  };
}

// Low-FPS mode for coarse/phone: stop the engine's RAF, render at ~12fps
function enableLowFps(engine: any, fps = 12) {
  if (!IS_COARSE) return;
  try { engine.stop?.(); } catch {}
  if (engine.__lowFpsTimer) clearInterval(engine.__lowFpsTimer);
  engine.__lowFpsTimer = setInterval(() => {
    // draw only if there were uniform changes or a resize; batched push already redraws
    engine._render ? engine._render() : engine.forceRedraw?.();
  }, Math.max(30, Math.floor(1000 / Math.max(1, fps))));
}

// Wait until the engine is really ready, then compute camera once and draw once
async function firstCorrectFrame({
  engine, canvas, sharedAxesScene, pane
}: {
  engine: any; canvas: HTMLCanvasElement | null; sharedAxesScene: [number,number,number]; pane: 'REAL'|'SHOW';
}) {
  // wait for program + buffers
  await new Promise<void>(res => {
    const tick = () => (engine?.gridProgram && (engine?._vboBytes > 0)) ? res() : requestAnimationFrame(tick);
    tick();
  });

  // single deterministic camera for the first frame
  const cz = safeCamZ(calculateCameraZ(canvas, sharedAxesScene));
  const packet = paneSanitize(pane, { cameraZ: cz, lockFraming: true, viewAvg: true });

  gatedUpdateUniforms(engine, packet, 'client');
  engine.forceRedraw?.();
}

// Helper functions needed by firstCorrectFrame
function safeCamZ(z: number): number {
  return Number.isFinite(z) ? Math.max(-10, Math.min(-0.1, z)) : -2.0;
}

function calculateCameraZ(canvas: HTMLCanvasElement | null, axes: [number,number,number]): number {
  if (!canvas) return -2.0; // safe fallback when canvas is null
  const w = canvas.clientWidth || canvas.width || 800;
  const h = canvas.clientHeight || canvas.height || 320;
  const aspect = w / h;
  const maxRadius = Math.max(...axes);
  return -maxRadius * (2.0 + 0.5 / Math.max(aspect, 0.5));
}

function paneSanitize(pane: 'REAL'|'SHOW', patch: any) {
  return {
    ...patch,
    physicsParityMode: pane === 'REAL',
    parityMode: pane === 'REAL',
    ridgeMode: pane === 'REAL' ? 0 : 1
  };
}

// Sanitize uniform values for safe WebGL consumption
function sanitizeUniforms(u: any = {}) {
  const s = { ...u };

  // Numeric coercions + clamps
  if ('cameraZ' in s) s.cameraZ = Number.isFinite(s.cameraZ) ? Math.max(-10, Math.min(-0.1, s.cameraZ)) : -2.0;
  if ('exposure' in s) s.exposure = Number.isFinite(s.exposure) ? Math.max(0.1, Math.min(20, s.exposure)) : 6.0;
  if ('gammaGeo' in s) s.gammaGeo = Number.isFinite(s.gammaGeo) ? Math.max(1, s.gammaGeo) : 26;
  if ('qSpoilingFactor' in s) s.qSpoilingFactor = Number.isFinite(s.qSpoilingFactor) ? Math.max(0.1, s.qSpoilingFactor) : 1;
  // preserve separate mass vs visual pocket amplifications
  if ('gammaVanDenBroeck_mass' in s) {
    s.gammaVanDenBroeck_mass = Number.isFinite(s.gammaVanDenBroeck_mass)
      ? Math.max(1, s.gammaVanDenBroeck_mass)
      : 1.35e5;
  }
  if ('gammaVanDenBroeck_vis' in s) {
    s.gammaVanDenBroeck_vis = Number.isFinite(s.gammaVanDenBroeck_vis)
      ? Math.max(1, s.gammaVanDenBroeck_vis)
      : 1.35e5;
  }
  if ('dutyEffectiveFR' in s) s.dutyEffectiveFR = Number.isFinite(s.dutyEffectiveFR) ? Math.max(1e-9, Math.min(1, s.dutyEffectiveFR)) : 0.01;

  // Boolean sanitization
  if ('physicsParityMode' in s) s.physicsParityMode = !!s.physicsParityMode;
  if ('parityMode' in s) s.parityMode = !!s.parityMode;
  if ('lockFraming' in s) s.lockFraming = !!s.lockFraming;
  if ('viewAvg' in s) s.viewAvg = !!s.viewAvg;

  // Integer sanitization
  if ('ridgeMode' in s) s.ridgeMode = Math.max(0, Math.min(1, Math.floor(s.ridgeMode || 0)));
  if ('sectorCount' in s) s.sectorCount = Math.max(1, Math.floor(s.sectorCount || 400));
  if ('split' in s) s.split = Math.max(0, Math.floor(s.split || 0));

  // Purple shift vector sanitization
  if ('epsilonTilt' in s) {
    const v = +s.epsilonTilt;
    s.epsilonTilt = Number.isFinite(v) ? Math.max(0, Math.min(5e-7, v)) : 0;
  }
  if ('betaTiltVec' in s && Array.isArray(s.betaTiltVec)) {
    const v = s.betaTiltVec.map(Number);
    const L = Math.hypot(v[0]||0,v[1]||0,v[2]||0) || 1;
    s.betaTiltVec = [v[0]/L, v[1]/L, v[2]/L];
  }

  // Metric uniforms: defaults = identity and off
  if (!('useMetric' in s)) s.useMetric = false;
  s.useMetric = !!s.useMetric;
  const I = [1,0,0, 0,1,0, 0,0,1];
  const isMat3 = (m:any)=> Array.isArray(m) && m.length===9 && m.every((x:any)=>Number.isFinite(+x));
  s.metric    = isMat3(s.metric)    ? s.metric.map(Number)    : I;
  s.metricInv = isMat3(s.metricInv) ? s.metricInv.map(Number) : I;

  // Also provide u_* aliases explicitly to match shader names
  s.u_useMetric   = s.useMetric;
  s.u_metric      = s.metric;
  s.u_metricInv   = s.metricInv;
  s.u_epsilonTilt = s.epsilonTilt ?? 0;
  s.u_betaTiltVec = s.betaTiltVec ?? [0,-1,0];

  return s;
}

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


// Push only after shaders are ready - now with enhanced gating and diagnostics
  function pushUniformsWhenReady(engine: any, patch: Record<string, any>, source: string = 'inspector') {
    if (!engine) {
      console.warn(`[${source}] Cannot push uniforms - engine is null`);
      return;
    }

    const push = () => {
      try {
        gatedUpdateUniforms(engine, patch, 'client');
        if (DEBUG) console.log(`[${source}] Successfully pushed uniforms:`, Object.keys(patch));
      } catch (error) {
        console.error(`[${source}] Failed to push uniforms:`, error);
      }
    };

    // Check if engine is ready
    const isReady = engine.isLoaded && engine.gridProgram;
    if (isReady) {
      push();
    } else {
      if (DEBUG) console.log(`[${source}] Engine not ready (isLoaded: ${!!engine.isLoaded}, gridProgram: ${!!engine.gridProgram}), waiting...`);

      if (typeof engine.onceReady === "function") {
        engine.onceReady(() => {
          if (DEBUG) console.log(`[${source}] Engine ready callback triggered`);
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
            if (DEBUG) console.log(`[${source}] Engine became ready after ${attempts * 50}ms`);
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

  // Get expected values from payload with correct gamma channel per pane
  const expected = thetaScaleExpected({
    gammaGeo: payload?.gammaGeo ?? 26,
    q: payload?.qSpoilingFactor ?? 1,
    gammaVdB: side === 'REAL'
      ? (payload?.gammaVanDenBroeck_mass ?? payload?.gammaVanDenBroeck ?? 1)
      : (payload?.gammaVanDenBroeck_vis  ?? payload?.gammaVanDenBroeck ?? 1),
    dFR: payload?.dutyEffectiveFR ?? 2.5e-5
  });

  // Setup RAF-based validation
  const validateUniforms = () => {
    const U = engine.uniforms || {};
    const θu = U.thetaScale as number;

    checkpoint({
      id:'uniforms/θ', side, stage:'uniforms',
      pass: within(θu, expected, 0.05),
      sev: within(θu, expected, 0.2) ? 'warn' : 'error',
      msg:`uniform θ=${θu?.toExponential()} vs expected=${expected.toExponential()}`,
      expect: expected, actual: θu
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

// ---- Ellipsoid + wall math ---------------------------------------------------
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

// nice formatting for arbitrary units
// (Removed) arbitrary-unit helpers and mass proxy; we now display pipeline kg.

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
  colorMode: 'theta',
  viewAvg: true
};

// ---- PaneOverlay Component --------------------------------------------------
function PaneOverlay(props:{
  title: string;
  flavor: 'REAL'|'SHOW';
  engineRef: React.MutableRefObject<any>;
  viewFraction: number; // fraction of ship total mass visually represented in this pane
  shipMassKg?: number;  // ship-wide exotic mass from pipeline (kg)
}){
  const { engineRef, flavor, viewFraction, title, shipMassKg } = props;
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

      // Make the overlay honest: show the two θ's explicitly
      const thetaUniform = +U.thetaScale || NaN;          // what the shader is using
      const thetaPhys    = thetaPhysicsFromUniforms(U);    // γ_geo³·q·γ_VdB_mass·√d_eff
      // optional: keep your paper clamp, but show it as "θ_paper"
      const thetaPaper   = Math.pow(26, 3) * 1 * 38.3 * Math.sqrt(2.5e-5); // ≈ 3.366e3

      // Use pipeline exotic mass directly (kg). Slice mass = ship mass × viewFraction.
      const M_ship_kg  = Number.isFinite(shipMassKg as number) ? Number(shipMassKg) : NaN;
      const M_slice_kg = Number.isFinite(M_ship_kg) ? M_ship_kg * (flavor === 'REAL' ? viewFraction : 1.0) : NaN;

      // pull contraction/expansion from diagnostics if available
      const diag = (e?.computeDiagnostics?.() || {}) as any;
      const frontRaw  = diag.theta_front_max;
      const rearRaw   = diag.theta_rear_min;
      const f = (flavor === 'REAL') ? Math.max(1e-12, viewFraction) : 1;
      const frontMax  = diag.theta_front_max_viewed ?? (Number.isFinite(frontRaw) ? frontRaw * Math.sqrt(f) : frontRaw);
      const rearMin   = diag.theta_rear_min_viewed  ?? (Number.isFinite(rearRaw)  ? rearRaw  * Math.sqrt(f) : rearRaw);

      setSnap({
        a,b,c,aH, w_m, V,S, Vshell,
        thetaUniform, thetaPhys, thetaPaper,
        M_ship_kg, M_slice_kg,
        frontMax, rearMin,
        sectors: Math.max(1,(U.sectorCount|0)||1),
        mDisplayText: (flavor === 'REAL')
          ? `${Number.isFinite(M_slice_kg)? fmtSI(M_slice_kg,'kg'):'— kg'} (slice) · ${Number.isFinite(M_ship_kg)? fmtSI(M_ship_kg,'kg'):'— kg'} total`
          : `${Number.isFinite(M_ship_kg)? fmtSI(M_ship_kg,'kg'):'— kg'} total`
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
          <div>θ (uniform): <b>{Number.isFinite(s.thetaUniform)? s.thetaUniform.toExponential(2):'—'}</b></div>
          <div>θ (phys): <b>{Number.isFinite(s.thetaPhys)? s.thetaPhys.toExponential(2):'—'}</b></div>
          <div className="text-white/60">θ (paper): <b>{Number.isFinite(s.thetaPaper)? s.thetaPaper.toExponential(2):'—'}</b></div>
          {/* keep slot if you later expose a metric-curvature scalar */}
          <div>θ (metric): <b>—</b></div>
          <div>view fraction: <b>{(flavor==='REAL'? props.viewFraction : 1).toFixed(4)}</b></div>
          <div>shell volume: <b>{fmtSI(s.Vshell,'m³')}</b></div>
          {/* Show kilograms sourced from pipeline */}
          <div>
            exotic mass: <b>{s.mDisplayText}</b>
          </div>
          <div>front(+): <b>{Number.isFinite(s.frontMax)? s.frontMax.toExponential(2):'—'}</b></div>
          <div>rear(−): <b>{Number.isFinite(s.rearMin)? s.rearMin.toExponential(2):'—'}</b></div>
        </div>

        {/* dropdown with filled equations */}
        <details className="mt-2">
          <summary className="text-xs text-white/70 hover:text-white cursor-pointer">equations & filled values</summary>
          <div className="mt-2 text-[11px] leading-5 text-white/85 space-y-2">
            <div>
              <div className="opacity-80">Ellipsoid geometry</div>
              <div><code>V = 4/3 · π · a · b · c</code> = <b>{Number.isFinite(s.V)? fmtSI(s.V,'m³'):'—'}</b></div>
              <div><code>S ≈ 4π · ((a^p b^p + a^p c^p + b^p c^p)/3)^(1/p)</code>, <i>p</i>=1.6075 → <b>{Number.isFinite(s.S)? fmtSI(s.S,'m²'):'—'}</b></div>
              <div><code>a_H = 3 / (1/a + 1/b + 1/c)</code> = <b>{Number.isFinite(s.aH)? fmtSI(s.aH,'m'):'—'}</b></div>
              <div><code>w_m = wallWidth_m ⟂</code> (or <code>w_ρ · a_H</code>) → <b>{fmtSI(s.w_m,'m')}</b></div>
              <div><code>V_shell ≈ S · w_m</code> → <b>{Number.isFinite(s.Vshell)? fmtSI(s.Vshell,'m³'):'—'}</b></div>
            </div>
            <div>
              <div className="opacity-80">Curvature (York-time proxy</div>
              <div><code>θ ∝ v_ship · (x_s/r_s) · (−2(rs−1)/w²) · exp(−((rs−1)/w)²)</code></div>
              <div>engine θ-scale (γ_geo³ · q · γ_VdB · √d_eff): <b>{Number.isFinite(s.thetaPhys)? s.thetaPhys.toExponential(2):'—'}</b></div>
            </div>
            <div>
              <div className="opacity-80">Exotic mass proxy (display-only</div>
              <div className="space-y-1">
                <div>
                  <code>M<sub>ship</sub> (kg)</code> → <b>{Number.isFinite(s.M_ship_kg)? fmtSI(s.M_ship_kg,'kg'):'— kg'}</b>
                </div>
                <div>
                  <code>M<sub>slice</sub> = M<sub>ship</sub> · viewFraction</code> →{' '}
                  <b>{Number.isFinite(s.M_slice_kg)? fmtSI(s.M_slice_kg,'kg'):'— kg'}</b>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

// ---- Component --------------------------------------------------------------
// Stable uniform hashing to reduce bus spam
const stableWU = (x: any) => {
  // strip purely-meta/bump fields so signature is stable
  const { __version, __src, thetaScaleExpected, ...rest } = x || {};
  return rest;
};

export default function WarpRenderInspector(props: {
  // Optional: calculator outputs. Pass exactly what your calculator returns
  // (REAL/FR vs SHOW/UI). Any missing fields fall back safely.
  parityPhys?: Record<string, any>;
  showPhys?: Record<string, any>;
  baseShared?: Record<string, any>; // e.g. hull, sectors/split, colorMode, etc.
  lightCrossing?: { burst_ms?: number; dwell_ms?: number };  // ⬅️ add
  debugTag?: string; // Debug tag for console logging
}) {
  // Error boundary wrapper
  const [componentError, setComponentError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.filename?.includes('WarpRenderInspector') ||
          event.message?.includes('WarpRenderInspector')) {
        setComponentError(event.message);
        console.error('[WarpRenderInspector] Runtime error:', event);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (componentError) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
        <h3 className="text-red-400 font-medium mb-2">WarpRenderInspector Error</h3>
        <p className="text-sm text-red-300">{componentError}</p>
        <button
          onClick={() => setComponentError(null)}
          className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
        >
          Retry
        </button>
      </div>
    );
  }
  const leftRef = useRef<HTMLCanvasElement>(null);   // REAL
  const rightRef = useRef<HTMLCanvasElement>(null);  // SHOW
  const leftEngine = useRef<any>(null);
  const rightEngine = useRef<any>(null);

  // Batched push system for performance optimization
  const pushLeft = useRef<(p:any, tag?:string)=>void>(() => {});
  const pushRight = useRef<(p:any, tag?:string)=>void>(() => {});
  const leftOwnedRef = useRef(false);
  const rightOwnedRef = useRef(false);
  const lastWUHashRef = useRef<string>("");

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
  const currentMode = (live?.currentMode) || 'hover';
  const [mode, setMode] = useState(currentMode);
  const effectiveMode = currentMode;
  const systemMetrics = live;

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
  const [useMetric, setUseMetric] = useState(!!props.baseShared?.useMetric);

  // Curvature control
  const [curvT, setCurvT] = useState(0.45);


  const wu = useMemo(() => normalizeWU(
    (live as any)?.warpUniforms || (props as any)?.warpUniforms
  ), [live, props]);

  // Hull geometry for epsilon calculations
  const hull = props.baseShared?.hull ?? { a: 503.5, b: 132, c: 86.5 };
  // Simple diagonal metric in world units (inverse-square scaling in each axis)
  const metricDiag = useMemo(() => {
    const ax = Math.max(1e-9, +hull.a||503.5);
    const by = Math.max(1e-9, +hull.b||132.0);
    const cz = Math.max(1e-9, +hull.c||86.5);
    // g_ij = diag(1/a^2, 1/b^2, 1/c^2), so geodesic "radius" ~ ellipsoidal radius
    const g = [1/(ax*ax),0,0,  0,1/(by*by),0,  0,0,1/(cz*cz)];
    const inv = [ax*ax,0,0, 0,by*by,0, 0,0,cz*cz]; // inverse for future use
    return { g, inv };
  }, [hull.a, hull.b, hull.c]);

  // Calculate Purple shift parameters early for use in initial uniforms
  const gTargets: Record<string, number> = {
    hover: 0.980665,     cruise: 0.980665,
    emergency: 0.980665, standby: 0.980665
  };
  const modeKey = (effectiveMode || 'hover').toLowerCase();
  const gTarget = gTargets[modeKey] ?? 0;
  const R_geom = Math.cbrt(hull.a * hull.b * hull.c);
  const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (299792458 * 299792458)));
  const betaTiltVecRaw = [0, -1, 0]; // canonical "nose down"
  const betaNorm = Math.hypot(betaTiltVecRaw[0], betaTiltVecRaw[1], betaTiltVecRaw[2]) || 1;
  const betaTiltVecN: [number, number, number] = [
    betaTiltVecRaw[0] / betaNorm,
    betaTiltVecRaw[1] / betaNorm,
    betaTiltVecRaw[2] / betaNorm
  ];

  /**
   * Compute θ using exactly the physics pipeline formula
   * θ = γ_geo³ · q · γ_VdB_mass · √(dutyEffectiveFR)
   * (always uses the mass pocket-factor and Ford–Roman duty)
   */
  function computeThetaScale(phys: any) {
    const g    = +phys.gammaGeo || 26;
    const q    = +phys.qSpoilingFactor || 1;
    const v    = +phys.gammaVanDenBroeck_mass || +phys.gammaVanDenBroeck || 1;
    const duty = Math.max(
      1e-12,
      Math.min(1, Number(phys.dutyEffectiveFR ?? live?.dutyEffectiveFR ?? 0))
    );
    return Math.pow(g, 3) * q * v * Math.sqrt(duty);
  }


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
        const engine = (cv as any)[ENGINE_KEY] || eng;
        return engine as WarpType;
      }
      throw err;
    }
    (cv as any)[ENGINE_KEY] = eng;
    return eng;
  }

  // Create engine instance using the JS WarpEngine with Grid3D fallback
  function createEngine(canvas: HTMLCanvasElement): any {
    const W: any = (window as any).WarpEngine;
    if (!W) {
      console.warn("WarpEngine not found, falling back to Grid3D engine");
      // Return a Grid3D engine wrapper with WebGL compatibility
      const grid3DWrapper = {
        canvas,
        isLoaded: true,
        gridProgram: true,
        gridUniforms: true,
        gridAttribs: true,
        gl: { isContextLost: () => false },
        uniforms: {
          physicsParityMode: true,
          parityMode: true,
          ridgeMode: 0
        },
        updateUniforms: (patch: any) => {
          Object.assign(grid3DWrapper.uniforms, patch);
        },
        bootstrap: (payload: any) => {
          Object.assign(grid3DWrapper.uniforms, payload);
        },
        setDebugTag: (tag: string) => {
          console.log(`[${tag}] Grid3D fallback engine initialized`);
        },
        setVisible: (visible: boolean) => {
          canvas.style.visibility = visible ? 'visible' : 'hidden';
        },
        forceRedraw: () => {
          // Grid3D handles its own rendering
        },
        destroy: () => {
          // Grid3D cleanup handled elsewhere
        }
      };

      (canvas as any)[ENGINE_KEY] = grid3DWrapper;
      return grid3DWrapper;
    }
    return getOrCreateEngine(W, canvas);
  }

  // Minimal parity lock function to prevent duplicate shader rebuilds
  function lockPane(engine: any, pane: 'REAL' | 'SHOW') {
    if (!engine || engine.__locked) return;
    engine.__locked = true;

    // enforce at uniform *values* only – no source rebuilds:
    const forcedParity = (pane === 'REAL');
    const forcedRidge  = (pane === 'REAL') ? 0 : 1;

    const enforce = (patch: any = {}) => ({
      ...patch,
      physicsParityMode: forcedParity,
      uPhysicsParity: forcedParity,
      uRidgeMode: forcedRidge,
      ridgeMode: forcedRidge
    });

    const origUpdate = engine.updateUniforms?.bind(engine);
    engine.updateUniforms = (p: any) => origUpdate?.(enforce(p));
    // also set once immediately
    origUpdate?.(enforce());

    console.log(`[${pane}] Parity locked: parity=${forcedParity}, ridge=${forcedRidge}`);
  }

  // Initialize engines with enhanced error handling and validation
  useEffect(() => {
    let mounted = true;

    const initEngines = async () => {
      if (!mounted) return;

      // Force explicit script source to fix ENGINE_SCRIPT_MISSING
      (window as any).__WARP_ENGINE_SRC__ = "/warp-engine.js?v=build123";

      // Strong detection (with DOM-mounted probe to avoid false negatives on mobile webviews)
      const support = webglSupport(undefined);
      if (!support.ok) {
        setLoadError(support.reason || 'WebGL not available');
        (window as any).__whyNoGL = support;
        return;
      }

      // Ensure WarpEngine script is loaded
      if (!(window as any).WarpEngine) {
        console.log("WarpEngine not found, loading script...");
        try {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = (window as any).__WARP_ENGINE_SRC__;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${script.src}`));
            document.head.appendChild(script);
          });
        } catch (error) {
          console.error("Failed to load WarpEngine script:", error);
          setLoadError("ENGINE_SCRIPT_MISSING: Failed to load warp-engine.js");
          return;
        }
      }

      const W = (window as any).WarpEngine;
      if (!W) {
        console.error("WarpEngine not found on window after script load.");
        setLoadError("ENGINE_SCRIPT_MISSING: WarpEngine not loaded");
        return;
      }

      // Ensure canvases are visibly sized before any measurement
      const ensureDisplaySize = (cv: HTMLCanvasElement | null) => {
        if (!cv) return;
        if ((cv.clientWidth|0) === 0 || (cv.clientHeight|0) === 0) {
          cv.style.minHeight = '240px';
          cv.style.display = 'block';
        }
      };
      ensureDisplaySize(leftRef.current);
      ensureDisplaySize(rightRef.current);

      // Prevent double initialization
      if (leftEngine.current || rightEngine.current) {
        console.log("Engines already initialized, skipping...");
        return;
      }

      console.log("Initializing WarpRenderInspector engines...");

      // Enhanced readiness check function with fallback support
      const waitForEngineReady = async (engine: any, label: string, timeoutMs = 2000) => {
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn(`[${label}] Engine readiness timeout after ${timeoutMs}ms, assuming ready for fallback engines`);
            // Don't reject for Grid3D fallback engines - just assume ready
            if (engine?.isLoaded !== undefined) {
              resolve(); // Grid3D fallback
            } else {
              reject(new Error(`${label} engine init timeout after ${timeoutMs}ms`));
            }
          }, timeoutMs);

          let attempts = 0;
          const checkReady = () => {
            attempts++;
            console.log(`[${label}] Readiness check #${attempts}: isLoaded=${engine?.isLoaded}, hasProgram=${!!engine?.gridProgram}, hasGL=${!!engine?.gl}`);

            if (engine?._destroyed) {
              clearTimeout(timeout);
              reject(new Error(`${label} engine was destroyed during initialization`));
              return;
            }

            // For Grid3D fallback engines, just check basic properties
            const isGridReady = engine?.isLoaded && engine?.gridProgram;
            // For WebGL engines, check full WebGL context
            const isWebGLReady = engine?.isLoaded &&
                                engine?.gridProgram &&
                                engine?.gl &&
                                !engine?.gl?.isContextLost?.();

            if (isGridReady || isWebGLReady) {
              clearTimeout(timeout);
              console.log(`[${label}] Engine ready after ${attempts} attempts`);
              resolve();
            } else {
              setTimeout(checkReady, 50);
            }
          };

          checkReady();
        });
      };

      // REAL engine
      if (leftRef.current && !leftEngine.current && mounted) {
        try {
          sizeCanvasSafe(leftRef.current);
          if ((leftRef.current.clientWidth|0) === 0 || (leftRef.current.clientHeight|0) === 0) {
            // Final guard: set a default pixel size if layout still not ready
            leftRef.current.width = 800; leftRef.current.height = 450;
          }

          // Clear any existing engine on this canvas
          delete (leftRef.current as any)[ENGINE_KEY];

          // ensure the DOM has given the canvas a real size
          await waitForNonZeroSize(leftRef.current);

          const realTag = props.debugTag ? `${props.debugTag}/REAL` : "REAL";
          console.log(`Creating ${realTag} engine...`);
          leftEngine.current = createEngine(leftRef.current);
          if (leftEngine.current && typeof leftEngine.current.setDebugTag === 'function') {
            leftEngine.current.setDebugTag(realTag);
          }
          leftOwnedRef.current = true;
          console.log(`${realTag} engine instance created`);

          // Wait for engine to be fully ready
          await waitForEngineReady(leftEngine.current, 'REAL');

          if (!mounted) return;

          // Set metric first before any uniforms
          if (props.baseShared?.useMetric) {
            leftEngine.current.setMetric(
              props.baseShared?.metric ?? metricDiag.g,
              props.baseShared?.metricInv ?? metricDiag.inv,
              true
            );
          }

          // Initialize with ENFORCED parity mode for REAL
          const realInitUniforms = {
            exposure: 5.0,
            zeroStop: 1e-7,
            physicsParityMode: true,
            parityMode: true, // Explicit fallback
            ridgeMode: 0,
            colorMode: 2, // shear/"truth"
            lockFraming: true,
            epsilonTilt: epsilonTilt,
            betaTiltVec: betaTiltVecN,
          };

          console.log("Applying REAL initial uniforms:", realInitUniforms);
          gatedUpdateUniforms(leftEngine.current, realInitUniforms, 'client');

          // CRITICAL: Force parity directly on uniforms object as backup
          if (leftEngine.current.uniforms) {
            leftEngine.current.uniforms.physicsParityMode = true;
            leftEngine.current.uniforms.parityMode = true;
            leftEngine.current.uniforms.ridgeMode = 0;
          }

          // Verify parity was set
          console.log("REAL engine parity after init:", leftEngine.current.uniforms?.physicsParityMode);

          // Add gentle parity correction with debouncing
          let lastParityCheck = 0;
          const enforceParityREAL = () => {
            const now = Date.now();
            if (now - lastParityCheck < 1000) return; // Check max once per second
            lastParityCheck = now;
            
            const U = leftEngine.current?.uniforms;
            if (U && U.physicsParityMode !== true) {
              console.warn("🔧 REAL parity drift detected - applying gentle correction");
              U.physicsParityMode = true;
              U.parityMode = true;
              U.ridgeMode = 0;
            }
          };

          // Hook into render loop for gentle enforcement
          if (leftEngine.current._render) {
            const originalRender = leftEngine.current._render.bind(leftEngine.current);
            leftEngine.current._render = function(...args: any[]) {
              enforceParityREAL();
              return originalRender(...args);
            };
          }

          leftEngine.current?.setVisible?.(true);
          // Apply parity lock immediately after engine creation
          lockPane(leftEngine.current, 'REAL');

          console.log("REAL engine fully initialized");

        } catch (error) {
          console.error("Failed to create REAL engine:", error);
          setLoadError(`Failed to initialize REAL WebGL engine: ${error}`);
          return; // Stop initialization if REAL engine fails
        }
      }

      // SHOW engine
      if (rightRef.current && !rightEngine.current && mounted) {
        try {
          sizeCanvasSafe(rightRef.current);
          if ((rightRef.current.clientWidth|0) === 0 || (rightRef.current.clientHeight|0) === 0) {
            rightRef.current.width = 800; rightRef.current.height = 450;
          }

          // Clear any existing engine on this canvas
          delete (rightRef.current as any)[ENGINE_KEY];

          // ensure the DOM has given the canvas a real size
          await waitForNonZeroSize(rightRef.current);

          const showTag = props.debugTag ? `${props.debugTag}/SHOW` : "SHOW";
          console.log(`Creating ${showTag} engine...`);
          rightEngine.current = createEngine(rightRef.current);
          if (rightEngine.current && typeof rightEngine.current.setDebugTag === 'function') {
            rightEngine.current.setDebugTag(showTag);
          }
          rightOwnedRef.current = true;
          console.log(`${showTag} engine instance created`);

          // Wait for engine to be fully ready
          await waitForEngineReady(rightEngine.current, 'SHOW');

          if (!mounted) return;

          // Set metric first before any uniforms
          if (props.baseShared?.useMetric) {
            rightEngine.current.setMetric(
              props.baseShared?.metric ?? metricDiag.g,
              props.baseShared?.metricInv ?? metricDiag.inv,
              true
            );
          }

          // Initialize with ENFORCED non-parity mode for SHOW
          const showInitUniforms = {
            exposure: 7.5,
            zeroStop: 1e-7,
            physicsParityMode: false,
            parityMode: false, // Explicit fallback
            ridgeMode: 1,
            curvatureGainT: 0.70,
            curvatureBoostMax: 40,
            userGain: 1.25,
            colorMode: 1, // theta/cosmetic
            lockFraming: true,
            epsilonTilt: epsilonTilt,
            betaTiltVec: betaTiltVecN,
          };

          console.log("Applying SHOW initial uniforms:", showInitUniforms);
          gatedUpdateUniforms(rightEngine.current, showInitUniforms, 'client');

          // Verify parity was set
          console.log("SHOW engine parity after init:", rightEngine.current.uniforms?.physicsParityMode);

          rightEngine.current?.setVisible?.(true);
          // Apply parity lock immediately after engine creation
          lockPane(rightEngine.current, 'SHOW');

          console.log("SHOW engine fully initialized");

        } catch (error) {
          console.error("Failed to create SHOW engine:", error);
          setLoadError(`Failed to initialize SHOW WebGL engine: ${error}`);
          return; // Stop initialization if SHOW engine fails
        }
      }

      // Bootstrap both engines once they are ready
      leftEngine.current?.bootstrap?.({ ...realPayload });
      rightEngine.current?.bootstrap?.({ ...showPayload });

      // Build shared frame data once
      const hull = props.baseShared?.hull ?? { a:503.5, b:132, c:86.5 };
      const shared = {
        axesScene: deriveAxesClip(hull, 1)
      };

      // After creating both engines and building `shared` once:
      (async () => {
        await firstCorrectFrame({
          engine: leftEngine.current,
          canvas: leftRef.current!,
          sharedAxesScene: shared.axesScene,
          pane: 'REAL'
        });
        await firstCorrectFrame({
          engine: rightEngine.current,
          canvas: rightRef.current!,
          sharedAxesScene: shared.axesScene,
          pane: 'SHOW'
        });

        // Enable low-FPS mode for mobile after first correct frame
        enableLowFps(leftEngine.current, 12);
        enableLowFps(rightEngine.current, 12);
      })();

      // Setup engine checkpoints after first frame is guaranteed correct
      setupEngineCheckpoints(leftEngine.current, 'REAL', realPayload);
      setupEngineCheckpoints(rightEngine.current, 'SHOW', showPayload);

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

      // Subscribe to canonical uniforms
      const unsubscribeHandler = subscribe('warp:uniforms', (u: any) => {
        setHaveUniforms(true);
        // strip any external theta (engine computes it)
        const { thetaScale, u_thetaScale, ...uSafe } = u || {};

        // bring purple back from props/baseShared (or last known engine value)
        const purple = {
          epsilonTilt: props.baseShared?.epsilonTilt ?? leftEngine.current?.uniforms?.epsilonTilt ?? 0,
          betaTiltVec: props.baseShared?.betaTiltVec ?? leftEngine.current?.uniforms?.betaTiltVec ?? [0,-1,0],
        };
        const metricU = {
          useMetric:  props.baseShared?.useMetric  ?? uSafe?.useMetric  ?? leftEngine.current?.uniforms?.useMetric  ?? false,
          metric:     props.baseShared?.metric     ?? uSafe?.metric     ?? leftEngine.current?.uniforms?.metric     ?? metricDiag.g,
          metricInv:  props.baseShared?.metricInv  ?? uSafe?.metricInv  ?? leftEngine.current?.uniforms?.metricInv  ?? metricDiag.inv,
        };

        if (leftEngine.current) {
          applyToEngine(leftEngine.current, { ...uSafe, ...purple, ...metricU, physicsParityMode: true,  ridgeMode: 0 });
        }
        if (rightEngine.current) {
          applyToEngine(rightEngine.current, { ...uSafe, ...purple, ...metricU, physicsParityMode: false, ridgeMode: 1 });
        }
      });

      // De-spam the bus: publish only on real changes
      const publishStableUniforms = () => {
        const wu = (systemMetrics as any)?.warpUniforms;
        if (!wu) return;

        const version = Number.isFinite(systemMetrics?.seq) ? systemMetrics.seq : Date.now();

        const sanitized = sanitizeUniforms(wu);
        const sig = JSON.stringify(stableWU(sanitized));
        if (sig === lastWUHashRef.current) return;   // 🔇 nothing meaningful changed

        lastWUHashRef.current = sig;
        publish("warp:uniforms", { ...sanitized, __version: version });
      };

      // Initial publish
      publishStableUniforms();

      // Let engines render immediately; canonical uniforms will override later.
      leftEngine.current?.setVisible?.(true);
      rightEngine.current?.setVisible?.(true);
      if (!haveUniforms) {
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
        // Cleanup low-FPS timers
        try { if (leftEngine.current?.__lowFpsTimer) clearInterval(leftEngine.current.__lowFpsTimer); } catch {}
        try { if (rightEngine.current?.__lowFpsTimer) clearInterval(rightEngine.current.__lowFpsTimer); } catch {}

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

        // Clean up parity enforcement
        try {
          if (leftEngine.current?.__cleanupEnforcement) {
            leftEngine.current.__cleanupEnforcement();
          }
          if (leftOwnedRef.current) leftEngine.current?.destroy();
        } catch {}

        try {
          if (rightEngine.current?.__cleanupEnforcement) {
            rightEngine.current.__cleanupEnforcement();
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
    };

    initEngines();
  }, []); // Empty dependency array ensures this runs only once on mount

  // De-spam the bus: publish only on real changes
  useEffect(() => {
    const wu = (systemMetrics as any)?.warpUniforms;
    if (!wu) return;

    const version = Number.isFinite(systemMetrics?.seq) ? systemMetrics.seq : Date.now();

    const sanitized = sanitizeUniforms(wu);
    const sig = JSON.stringify(stableWU(sanitized));
    if (sig === lastWUHashRef.current) return;   // 🔇 nothing meaningful changed

    lastWUHashRef.current = sig;
    publish("warp:uniforms", { ...sanitized, __version: version });
  }, [systemMetrics]);

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
    const emitSnap = () => {
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
    engine.onDiagnostics = () => emitSnap();
    engine.onLoadingStateChange = () => emitSnap();
    emitSnap(); // kick once now
  }

  // Helper to dump uniforms and diagnostics for debugging
  const dumpUniforms = (engine: any, label: string) => {
    console.log(`--- Uniforms & Diagnostics for ${label} ---`);
    if (!engine) {
      console.log("Engine not available.");
      return;
    }
    const u = engine.uniforms || {};
    console.log("Uniforms:", Object.fromEntries(Object.entries(u).filter(([k]) => !k.startsWith('_')))); // Filter internal properties
    try {
      console.log("Diagnostics:", engine.computeDiagnostics?.() || "N/A");
    } catch (e) {
      console.log("Diagnostics error:", e);
    }
    console.log("---------------------------------------------");
  };

  // Debug button handler
  const debugEngineStates = () => {
    console.log("--- Debugging Inspector State ---");
    console.log("REAL Engine:", leftEngine.current);
    console.log("SHOW Engine:", rightEngine.current);
    console.log("Grid3D Ref:", grid3dRef.current);
    console.log("Have Uniforms:", haveUniforms);
    console.log("Load Error:", loadError);
    console.log("Current Mode:", mode);
    console.log("---------------------------------");
  };

  // Apply physics from props with comprehensive validation
    const realPhys = props.parityPhys || {};
    const showPhys = props.showPhys || {};
    const baseShared = props.baseShared || {};

    // Enhanced theta scale calculation with debugging
    // const computeThetaWithDebug = (phys: any, source: 'fr' | 'ui', label: string) => {
    //   const gammaGeo = +phys.gammaGeo || 26;
    //   const qSpoil   = +phys.qSpoilingFactor || 1;
    //   // use explicit pocket factors
    //   const gammaVdB_mass = +phys.gammaVanDenBroeck_mass || 1;
    //   const gammaVdB_vis  = +phys.gammaVanDenBroeck_vis  || 1;
    //   const gammaVdB      = source === 'fr' ? gammaVdB_mass : gammaVdB_vis;
    //   const dutyFR = phys.dutyEffectiveFR || phys.d_FR || 0.000025;

    //   const calculated = computeThetaScale(phys);
    //   const actualTheta = source === 'fr'
    //     ? leftEngine.current?.uniforms?.thetaScale
    //     : rightEngine.current?.uniforms?.thetaScale;

    //   console.log(`[${label}] Theta calculation debug:`, {
    //     gammaGeo,
    //     qSpoil,
    //     gammaVdB,
    //     dutyFR,
    //     viewAvg: true,
    //     calculated,
    //     actualTheta
    //   });

    //   return calculated;
    // };

    // Build REAL payload (Ford–Roman parity) - DO NOT include thetaScale here
    const realPayload = {
      ...baseShared,
      physicsParityMode: true,
      ridgeMode: 0,
      ...realPhys,
      exposure: 5.0,
      zeroStop: 1e-7,
      colorMode: 2, // Shear proxy for truth view
      lockFraming: true
    };

    // Attach metric defaults to both panes (you can turn them off via useMetric=false)
    (realPayload as any).useMetric   = props.baseShared?.useMetric ?? false;
    (realPayload as any).metric      = props.baseShared?.metric    ?? metricDiag.g;
    (realPayload as any).metricInv   = props.baseShared?.metricInv ?? metricDiag.inv;

    // Build SHOW payload (UI boosted) - DO NOT include thetaScale here
    const showPayload = {
      ...baseShared,
      physicsParityMode: false,
      ridgeMode: 1,
      ...showPhys,
      exposure: 7.5,
      zeroStop: 1e-7,
      curvatureGainT: 0.70,
      curvatureBoostMax: 40,
      userGain: 1.25,
      colorMode: 1, // Theta mode for visual enhancement
      lockFraming: true
    };
    (showPayload as any).useMetric   = props.baseShared?.useMetric ?? false;
    (showPayload as any).metric      = props.baseShared?.metric    ?? metricDiag.g;
    (showPayload as any).metricInv   = props.baseShared?.metricInv ?? metricDiag.inv;



  // Physics bound for theta calculations
    const bound = useMemo(() => ({
      gammaGeo: realPhys.gammaGeo || 26,
      qSpoilingFactor: realPhys.qSpoilingFactor || 1,
      gammaVdB: realPhys.gammaVanDenBroeck || realPhys.gammaVdB || 1,
      dutyEffectiveFR: realPhys.dutyEffectiveFR || 0.000025
    }), [realPhys]);

  // Keep canvases crisp on container resize with mobile optimizations
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const cvs = [leftRef.current, rightRef.current];
      for (const c of cvs) {
        if (!c) continue;
        const rect = c.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) continue; // ignore transient 0×0
        sizeCanvasSafe(c);
      }
      leftEngine.current?.gl?.viewport?.(0, 0, leftRef.current?.width || 1, leftRef.current?.height || 1);
      rightEngine.current?.gl?.viewport?.(0, 0, rightRef.current?.width || 1, rightRef.current?.height || 1);
      pushLeft.current?.({}, 'resize');
      pushRight.current?.({}, 'resize');
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

      // Temporarily use direct updates to debug syntax error
      if (leftEngine.current) {
        gatedUpdateUniforms(leftEngine.current, sanitizeUniforms({
          ...payload,
          dutyEffectiveFR: dutyFR_REAL,
        }), 'client');
      }
      if (rightEngine.current) {
        gatedUpdateUniforms(rightEngine.current, sanitizeUniforms({
          ...payload,
          dutyEffectiveFR: dutyUI_SHOW,
        }), 'client');
      }
    });
    return () => { try { off?.(); } catch {} };
  }, []);

  // Initialize batched push functions for performance optimization
  useEffect(() => {
    pushLeft.current = makeUniformBatcher(leftEngine);
    pushRight.current = makeUniformBatcher(rightEngine);
  }, []);

  // Mobile DPR clamping and canvas sizing
  useEffect(() => {
    if (!IS_COARSE) return;
    try { sizeCanvasSafe(leftRef.current!); sizeCanvasSafe(rightRef.current!); } catch {}
    // DPR is already handled by sizeCanvasSafe; on phones, keep it at ~1
    if (typeof clampMobileDPR === 'function') clampMobileDPR(1);
  }, []);

  // Debug verification function
  const verifyEngineStates = () => {
    const leftState = leftEngine.current;
    const rightState = rightEngine.current;

    console.log('=== PARITY VERIFICATION ===');
    console.log('REAL parity?', leftState?.uniforms?.physicsParityMode, '(should be true)');
    console.log('SHOW parity?', rightState?.uniforms?.physicsParityMode, '(should be false)');
    console.log('REAL ridge?', leftState?.uniforms?.ridgeMode, '(should be 0)');
    console.log('SHOW ridge?', rightState?.uniforms?.ridgeMode, '(should be 1)');
    const thL = leftState?.uniforms?.thetaScale;
    const thR = rightState?.uniforms?.thetaScale;
    const thLact = leftState?.uniforms?.thetaScale_actual;
    const thRact = rightState?.uniforms?.thetaScale_actual;
    console.log(
      'Theta scales - REAL:', thL?.toExponential?.(2),
      'SHOW:', thR?.toExponential?.(2),
      ' [engine actual]', thLact?.toExponential?.(2), thRact?.toExponential?.(2)
    );

    // Check for parity violations and attempt gentle correction
    if (leftState?.uniforms && leftState.uniforms.physicsParityMode !== true) {
      console.warn('🔧 REAL parity drift detected in verification - applying correction');
      leftState.uniforms.physicsParityMode = true;
      leftState.uniforms.parityMode = true;
      leftState.uniforms.ridgeMode = 0;

      // Also push through update system gently
      gatedUpdateUniforms(leftEngine.current, {
        physicsParityMode: true,
        parityMode: true,
        ridgeMode: 0
      }, 'client');
    }

    if (rightState?.uniforms && rightState.uniforms.physicsParityMode !== false) {
      console.error('SHOW parity violation detected - attempting correction');
      rightState.uniforms.physicsParityMode = false;
      rightState.uniforms.parityMode = false;
      rightState.uniforms.ridgeMode = 1;

      // Also push through update system
      gatedUpdateUniforms(rightEngine.current, {
        physicsParityMode: false,
        parityMode: false,
        ridgeMode: 1
      }, 'client');
    }
  };

  // Run verification less frequently and expose to window for debugging
  useEffect(() => {
    const interval = setInterval(verifyEngineStates, 5000); // Reduce from 2s to 5s
    (window as any).__verifyWarpParity = verifyEngineStates;
    return () => {
      clearInterval(interval);
      delete (window as any).__verifyWarpParity;
    };
  }, []);

  // Missing variables for new layout
  const realRendererType: 'canvas' | 'grid3d' = 'canvas'; // Default to canvas for now
  const showRendererType: 'canvas' | 'grid3d' = 'canvas'; // Default to canvas for now
  const realUniforms = useMemo(() => buildREAL(live || {}), [live]);
  const showUniforms = useMemo(() => buildSHOW(live || {}), [live]);
  const grid3dRef = useRef<any>(null);

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

  // Show friendly fallback if WebGL is unavailable
  if (loadError) {
    return (
      <div className="w-full p-4">
        <CanvasFallback
          title="Renderer could not start"
          reason={String(loadError)}
          onRetry={() => {
            try { (window as any).__forceReloadWarpEngine?.(); } catch {}
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full grid gap-4 p-2 sm:p-4">
      {(() => {
        try {
          const qs = new URLSearchParams(location.search || '');
          if (!qs.has('debug-gl')) return null;
          const report = webglSupport(undefined);
          return (
            <pre className="text-xs p-2 rounded bg-black/70 text-green-200 overflow-auto">
              GL Debug: {JSON.stringify(report, null, 2)}
            </pre>
          );
        } catch { return null; }
      })()}
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Operational Render Inspector</h2>
          <p className="text-xs sm:text-sm text-neutral-500">REAL (Ford–Roman parity) vs SHOW (UI boosted) — uses the same render path as WarpBubbleCompare.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="text-xs sm:text-sm font-medium">Mode</label>
          {(['hover','cruise','emergency','standby']).map(m => (
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
            <h3 className="text-sm font-semibold">REAL — Parity (Ford–Roman) (canvas)</h3>
            <div className="text-xs text-neutral-400">ridgeMode=0 • {colorMode}</div>
          </div>
          <div className="rounded-xl overflow-hidden bg-black/90 flex flex-col"
               style={{ aspectRatio: '16 / 10', minHeight: 420 }}>
            <div className="relative flex-1">
              {realRendererType === 'grid3d' && false ? (
                <Grid3DEngine
                  ref={grid3dRef}
                  uniforms={realUniforms}
                  className="absolute inset-0 w-full h-full block"
                  style={{ background: '#000' }}
                />
              ) : (
                <canvas
                  ref={leftRef}
                  className="absolute inset-0 w-full h-full block touch-manipulation select-none"
                  style={{ background: '#000' }}
                />
              )}
              {!IS_COARSE && (
                <PaneOverlay
                  title="REAL · per-pane slice"
                  flavor="REAL"
                  engineRef={leftEngine}
                  viewFraction={viewMassFracREAL}
                  shipMassKg={live?.M_exotic}
                />
              )}
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-neutral-950/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">SHOW — Cosmetic (θ-diverging) (canvas)</h3>
            <div className="text-xs text-neutral-400">ridgeMode=1 • {colorMode}</div>
          </div>
          <div className="rounded-xl overflow-hidden bg-black/90 flex flex-col"
               style={{ aspectRatio: '16 / 10', minHeight: 420 }}>
            <div className="relative flex-1">
              {!IS_COARSE && showRendererType === 'grid3d' && false ? (
                <Grid3DEngine
                  ref={grid3dRef}
                  uniforms={showUniforms}
                  className="absolute inset-0 w-full h-full block"
                  style={{ background: 'black' }}
                />
              ) : (
                <canvas ref={rightRef} className="absolute inset-0 w-full h-full block touch-manipulation select-none"/>
              )}
              {!IS_COARSE && (
                <PaneOverlay
                  title="SHOW · cosmetic ampl"
                  flavor="SHOW"
                  engineRef={rightEngine}
                  viewFraction={1.0}
                  shipMassKg={live?.M_exotic}
                />
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h4 className="font-medium mb-3">Debug Toggles</h4>
          <fieldset className="flex flex-wrap gap-3 text-xs">
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
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={useMetric}
                onChange={e=>{
                  const v = e.target.checked;
                  setUseMetric(v);
                  const patch = sanitizeUniforms({ useMetric: v, metric: metricDiag.g, metricInv: metricDiag.inv });
                  pushLeft.current(paneSanitize('REAL', patch), 'REAL');
                  pushRight.current(paneSanitize('SHOW', patch), 'SHOW');
                }}
              />
              Metric on
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
              pushLeft.current(paneSanitize('REAL', sanitizeUniforms({ curvT: v })), 'REAL');
              pushRight.current(paneSanitize('SHOW', sanitizeUniforms({ curvT: v })), 'SHOW');
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
            <div>θ-scale expected: {(live?.thetaScaleExpected ?? 0).toExponential(2)}</div>
            <div>θ-scale (physics-only): {(bound?.gammaGeo ? thetaGainExpected(bound) : 0).toExponential(3)} • Current status: READY</div>
            <div>FR duty: {(dutyEffectiveFR * 100).toExponential(2)}%</div>
            <div className="text-yellow-600">γ_VdB bound: {gammaVdBBound.toExponential(2)} {useMassGamma ? '(mass)' : '(visual)'}</div>
            <div>view mass fraction (REAL): {(viewMassFracREAL * 100).toFixed(3)}% (1/{total})</div>
            <div>view mass fraction (SHOW): {(1.0 * 100).toFixed(3)}% (full bubble)</div>
          </div>
          <button
            onClick={() => {
              dumpUniforms(leftEngine.current, 'REAL');
              dumpUniforms(rightEngine.current, 'SHOW');
            }}
            className="px-3 py-1 rounded bg-neutral-900 text-white text-sm"
          >Dump uniforms + diagnostics</button>
          <button
            onClick={()=>{
              pushLeft.current({ colorMode: 6 }, 'REAL');
              pushRight.current({ colorMode: 6 }, 'SHOW');
            }}
            className="ml-2 px-3 py-1 rounded bg-indigo-700 text-white text-sm"
          >Curvature Debug</button>
          <p className="text-xs text-neutral-500 mt-2">Opens a concise table/diagnostics in DevTools.</p>
          <button
            onClick={debugEngineStates}
            className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white text-sm mt-2"
          >Debug Inspector State</button>
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
        rightEngineRef={rightEngine}   // this is now the JS WarpEngine
        leftCanvasRef={leftRef}
        rightCanvasRef={rightRef}      // same canvas the engine draws into
        live={live}
        lightCrossing={{ burst_ms: live?.burst_ms, dwell_ms: live?.dwell_ms }}
      />

      {/* Visual controls removed - using hardcoded defaults */}
    </div>
  );
}

// physics θ helper (no SHOW boosts)
function thetaPhysicsFromUniforms(U: any) {
  const gammaGeo = +U.gammaGeo || 26;
  const q        = +U.qSpoilingFactor || 1;
  // Use Ford-Roman mass gamma, not visual gamma for physics calculations
  const vdb_raw  = +U.gammaVanDenBroeck_mass || +U.gammaVanDenBroeck || 38.3; // Use paper value as fallback
  const vdb      = Math.min(vdb_raw, 1e6); // Clamp to reasonable physics range
  const dRaw     = Number(U.dutyEffectiveFR);
  const dFR      = Number.isFinite(dRaw) ? Math.max(0, dRaw) : 0.000025; // Use Ford-Roman duty as fallback
  return Math.pow(gammaGeo, 3) * q * vdb * Math.sqrt(dFR);
}