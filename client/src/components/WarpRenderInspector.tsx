import React, {useEffect, useMemo, useRef, useState, startTransition} from "react";
import WarpRenderCheckpointsPanel from "./warp/WarpRenderCheckpointsPanel";
import { useEnergyPipeline, useSwitchMode } from "@/hooks/use-energy-pipeline";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeWU, buildRealPacket, buildShowPacket } from "@/lib/warp-uniforms";

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
import { thetaCanonical } from "@/lib/warp-theta";
import { getWarpEngineCtor } from "@/types/globals";

// --- FAST PATH HELPERS (drop-in) --------------------------------------------
// Helper to sanitize uniforms per pane - ensure ALL required fields are set
function paneSanitize(pane: 'REAL' | 'SHOW', patch: any) {
  const isREAL = pane === 'REAL';
  return {
    ...patch,
    physicsParityMode: isREAL,
    ridgeMode: isREAL ? 0 : 1,
    viewAvg: isREAL ? true : false,
    // Remove legacy parityMode to avoid conflicts
    parityMode: undefined,
    uPhysicsParity: undefined,
  };
}

// Batched update functions to prevent racing
let rafL = 0, rafR = 0;
function pushLeft(patch: any) {
  if (rafL) cancelAnimationFrame(rafL);
  rafL = requestAnimationFrame(() => {
    rafL = 0;
    leftEngine.current?.updateUniforms(paneSanitize('REAL', patch));
  });
}
function pushRight(patch: any) {
  if (rafR) cancelAnimationFrame(rafR);
  rafR = requestAnimationFrame(() => {
    rafR = 0;
    rightEngine.current?.updateUniforms(paneSanitize('SHOW', patch));
  });
}

// --- pane helpers -----------------------------------------------------------
// NOTE: Ensure there are no other definitions of paneSanitize/sanitizeUniforms below.
const sanitizeUniforms = (o: any) =>
  Object.fromEntries(Object.entries(o ?? {}).filter(([_, v]) => v !== undefined));

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
function makeUniformBatcher(engineRef: React.MutableRefObject<any>, pane: 'REAL'|'SHOW') {
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
      const toSend = paneSanitize(pane, pending); // <- ensure all updates go through sanitizer
      pending = null;
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

// Stable: REAL always shows a 1/sectorCount slice; SHOW is full bubble
function computeViewMassFractionStable(u: any): number {
  const sTotal = Math.max(1, Number(u?.sectorCount ?? 400));
  const parity = !!u?.physicsParityMode;
  return parity ? 1 / sTotal : 1.0;
}

// Locked view fraction calculation, accounting for different physics pane logic
function viewMassFractionLocked(u: any, pane: 'REAL' | 'SHOW'): number {
  const sTotal = Math.max(1, Number(u?.sectorCount ?? 400));
  const isREAL = pane === 'REAL';
  const parity = !!u?.physicsParityMode;

  // If the engine's parity state matches the pane's expectation, use the standard calculation
  if (isREAL && parity) return 1 / sTotal;
  if (!isREAL && !parity) return 1.0;

  // Fallback/warning: If the parity state is mismatched, default to 1.0, or calculate based on actual parity
  console.warn(`[viewMassFractionLocked] Mismatch for pane '${pane}': engine parity is ${parity}`);
  return parity ? 1 / sTotal : 1.0;
}


function thetaGainExpected(bound: any): number {
  try {
    const g  = Number(bound?.gammaGeo ?? bound?.gamma_geo ?? 26);
    const q  = Number(bound?.qSpoilingFactor ?? bound?.deltaAOverA ?? bound?.q ?? 1);
    // physics "mass pocket" gamma (not the big visual gamma); canonical clamps internally
    const vM = Number(
      bound?.gammaVanDenBroeck_mass ??
      bound?.gammaVanDenBroeck ??
      bound?.gammaVdB ??
      bound?.gamma_vdb ??
      38.3
    );

    const dutyLocal = Number(bound?.dutyLocal ?? bound?.dutyCycle ?? bound?.duty ?? 0.01);
    const sC = Math.max(1, Number(bound?.sectorsConcurrent ?? bound?.sectors ?? 1));
    const sT = Math.max(1, Number(bound?.sectorsTotal ?? bound?.sectorCount ?? 400));

    // REAL panels average by default; SHOW typically does not
    const viewAveraged =
      bound?.viewAveraged ??
      (bound?.physicsParityMode ?? bound?.parity ?? false) ? true : false;

    const mode = (bound?.mode ?? bound?.currentMode) || undefined;

    return thetaCanonical({
      gammaGeo: g,
      qSpoilingFactor: q,
      gammaVanDenBroeck_mass: vM,
      dutyLocal,
      sectorsConcurrent: sC,
      sectorsTotal: sT,
      viewAveraged,
      mode,
    });
  } catch (e) {
    console.warn("[WRI] thetaGainExpected error:", e);
    return NaN;
  }
}

// [deleted duplicate paneSanitize]



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

// Helper to format numbers for display
const formatNumber = (num: number | undefined) => {
  if (num === undefined || num === null || !Number.isFinite(num)) return 'N/A';
  if (Math.abs(num) < 1e-6) return num.toExponential(2);
  if (Math.abs(num) > 1e6) return num.toExponential(2);
  return num.toFixed(3);
};

// Helper to build shared base uniforms (prevents TDZ bug)
function makeSharedBase(parameters: any, live: any, baseShared: any = {}) {
  const sectorCount = Math.max(1, Number(parameters?.sectorCount ?? live?.sectorCount ?? 400));
  const sectors = Math.max(1, Number(parameters?.sectors ?? live?.sectors ?? 1));
  const dutyCycle = Number(parameters?.dutyCycle ?? live?.dutyCycle ?? 0.01);
  const dutyEffectiveFR = dutyCycle * (sectors / sectorCount);

  return {
    ...baseShared,
    // authoritative, engine-friendly fields:
    sectorCount,
    sectors,
    dutyCycle,
    dutyEffectiveFR,
    currentMode: live?.currentMode ?? parameters?.currentMode ?? "hover",

    // aliases the engine expects (present if you have them):
    axesScene: parameters?.axesScene ?? live?.axesScene,
    hullAxes: parameters?.hullAxes ?? live?.hullAxes,

    // θ chain raw inputs (prefer explicit names, then UI aliases):
    gammaGeo: parameters?.gammaGeo ?? parameters?.g_y ?? live?.gammaGeo,
    deltaAOverA: parameters?.deltaAOverA ?? parameters?.qSpoilingFactor ?? live?.deltaAOverA,
    gammaVanDenBroeck_mass:
      parameters?.gammaVanDenBroeck_mass ??
      parameters?.gammaVanDenBroeck ??
      live?.gammaVanDenBroeck_mass ??
      live?.gammaVanDenBroeck,
  };
}


// Push only after shaders are ready - now with enhanced gating and diagnostics
  function pushUniformsWhenReady(engine: any, patch: Record<string, any>, pane: 'REAL'|'SHOW', source: string = 'inspector') {
    if (!engine) {
      console.warn(`[${source}] Cannot push uniforms - engine is null`);
      return;
    }

    const push = () => {
      try {
        const sanitizedPatch = paneSanitize(pane, patch);
        gatedUpdateUniforms(engine, sanitizedPatch, 'client');
        if (DEBUG) console.log(`[${source}] Successfully pushed uniforms:`, Object.keys(sanitizedPatch));
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

      // --- Operational-mode aware θ calculations ---
      const parity = !!U.physicsParityMode;                     // REAL if true, SHOW otherwise
      const mode = String(U.currentMode ?? 'hover');            // 'standby'|'hover'|'cruise'|'emergency'
      const isREALStandby = parity && mode === 'standby';

      const thetaCanonical = Number(U.thetaScale_actual ?? U.thetaScale ?? NaN); // γ³·q·γVdB·√d_FR
      const vShip = Number.isFinite(U.vShip) ? Number(U.vShip) : (parity ? 0 : 1);

      // "θ (shader)" should reflect EFFECTIVE amplitude carried into the fragment math
      const thetaEffective = isREALStandby ? 0 : (Number.isFinite(thetaCanonical) ? thetaCanonical * vShip : NaN);

      // Presentational clamp: show 0 for REAL + standby regardless of internal calculations
      let thetaShader = Number(U.thetaScale_actual ?? U.thetaScale ?? NaN);
      const isREAL = !!U.physicsParityMode;
      const isStandby = (U.currentMode === 'standby');
      if (isREAL && isStandby) thetaShader = 0;  // presentational clamp
      const thetaCanon = thetaCanonical;
      const thetaPaper = Math.pow(26, 3) * 1 * 38.3 * Math.sqrt(2.5e-5);

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

      setSnap({ a,b,c,aH, w_m, V,S, Vshell, thetaShader, thetaCanon, thetaPaper, M_ship_kg, M_slice_kg,
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
  }, [engineRef, flavor, viewFraction, shipMassKg]);

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
          <div>θ (shader): <b>{Number.isFinite(s.thetaShader)? s.thetaShader.toExponential(2):'—'}</b></div>
          <div>θ (canonical): <b>{Number.isFinite(s.thetaCanon)? s.thetaCanon.toExponential(2):'—'}</b></div>
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
              <div>engine θ-scale (γ_geo³ · q · γ_VdB · √d_eff): <b>{Number.isFinite(s.thetaCanon)? s.thetaCanon.toExponential(2):'—'}</b></div>
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
  // ────────────────────────────────────────────────────────────────────────────
  // [WRI θ] INSTRUMENTATION & PARITY LOCK
  // ────────────────────────────────────────────────────────────────────────────
  const thetaShaderRef = useRef<number | null>(null);
  const thetaJSRef     = useRef<number | null>(null);
  const thetaCanonRef  = useRef<number | null>(null);
  const lastParityRef  = useRef<boolean | null>(null);
  const lastLogAtRef   = useRef<number>(0);
  const rafRef         = useRef<number | null>(null);
  const parityLockedRef= useRef<boolean>(false);

  // local canonical θ (no imports to avoid duplicate import crashes)
  function thetaCanonicalLocal(U: any): number {
    const isREAL = !!U.physicsParityMode;
    const mode = String(U.currentMode || 'hover').toLowerCase();
    if (isREAL && mode === 'standby') return 0;
    const g = Math.max(1, +U.gammaGeo || 26);
    const q = Math.max(1e-12, +U.deltaAOverA || 1);
    const v = Math.max(1, Math.min(1e2, +U.gammaVdB || 38.3)); // physics clamp
    const sLive = Math.max(1, (U.sectors|0) || 1);
    const sTot  = Math.max(1, (U.sectorCount|0) || 400);
    const dLocal = Number.isFinite(+U.dutyLocal) ? +U.dutyLocal
                  : Number.isFinite(+U.dutyCycle) ? +U.dutyCycle : 0;
    const dFR = Math.max(1e-12, Math.min(1, dLocal * (sLive / sTot)));
    const viewAvg = (U.viewAvg ?? true) ? true : false;
    const dutyFactor = viewAvg ? Math.sqrt(dFR) : 1;
    return (g*g*g) * q * v * dutyFactor;
  }

  // engine resolver: find left/right engines from registry or props
  function resolveEngines(): {left?: any, right?: any} {
    // prefer explicit refs if provided by parent
    // @ts-ignore
    const engProp = (props as any)?.engine || (props as any)?.engineRef?.current;
    if (engProp) return { left: engProp };
    // global registry (WarpEngine registers windows.__warp[id] = engine)
    // @ts-ignore
    const reg = (window as any).__warp;
    if (reg && typeof reg === 'object') {
      const keys = Object.keys(reg);
      if (keys.length === 1) return { left: reg[keys[0]] };
      if (keys.length >= 2)  return { left: reg[keys[0]], right: reg[keys[1]] };
    }
    // fallback: first canvas engine if attached
    const canv = document.querySelectorAll('canvas');
    for (const c of Array.from(canv) as any[]) {
      if (c.__warpEngine) return { left: c.__warpEngine };
    }
    return {};
  }

  // sticky parity wrapper: blocks legacy aliases & θ injections
  function lockParity(engine: any, forcedREAL: boolean) {
    if (!engine || engine.__wriParityLocked) return;
    engine.__wriParityLocked = true;
    const orig = typeof engine.updateUniforms === 'function' ? engine.updateUniforms.bind(engine) : null;
    engine.updateUniforms = function(u: any) {
      const U = { ...(u||{}) };
      // strip legacy alias writers that keep flipping parity / inflating θ
      delete U.parityMode;
      delete U.uPhysicsParity;
      delete U.u_ridgeMode;
      delete U.uThetaScale;
      delete U.u_thetaScale;
      delete U.thetaScale;
      // enforce sticky REAL/SHOW + pane-specific averaging
      U.physicsParityMode  = !!forcedREAL;
      U.ridgeMode          = forcedREAL ? 0 : 1;
      U.viewAvg            = !!forcedREAL;
      // pass through canonical fields; engine computes θ itself
      return orig ? orig(U) : undefined;
    };
  }

  // bootstrap parity locks + start θ sampler
  useEffect(() => {
    let alive = true;
    let armed = false;
    const start = () => {
      if (!alive) return;
      const { left, right } = resolveEngines();
      if (!left) return; // try again next tick

      // lock parity once (REAL on left, SHOW on right if present)
      if (!parityLockedRef.current) {
        lockParity(left, true);
        if (right) lockParity(right, false);
        parityLockedRef.current = true;
        console.log('[WRI θ] parity locks engaged: left=REAL, right=SHOW');
      }

      // RAF sampler
      const eng = left; // sample left (REAL). Duplicate block for right if needed.
      const sample = () => {
        if (!alive || !eng) return;
        try {
          const U = { ...(eng.uniforms||{}), ...(eng.currentParams||{}) };
          // JS θ the engine believes it set
          const thetaJS = (typeof U.thetaScale === 'number' && isFinite(U.thetaScale)) ? U.thetaScale : null;
          thetaJSRef.current = thetaJS;
          // GL-latched θ (shader)
          let thetaGL: number | null = null;
          try {
            const loc = eng.gridUniforms?.thetaScale || null;
            if (loc) {
              const val = eng.gl.getUniform(eng.gridProgram, loc);
              thetaGL = (typeof val === 'number') ? val
                     : (Array.isArray(val) && typeof val[0] === 'number') ? val[0]
                     : null;
            }
          } catch {}
          thetaShaderRef.current = thetaGL;
          // canonical reference
          const thetaCanon = thetaCanonicalLocal(U);
          thetaCanonRef.current = thetaCanon;

          const parity = !!U.physicsParityMode;
          const mode = String(U.currentMode || 'hover');
          const now = performance.now();
          const parityFlipped = (lastParityRef.current !== null && lastParityRef.current !== parity);
          if (parityFlipped || now - lastLogAtRef.current > 1000) {
            lastParityRef.current = parity;
            lastLogAtRef.current = now;
            console.log(
              `[WRI θ] ${parity ? 'REAL' : 'SHOW'} mode=${mode}` +
              ` | θ_gl=${fmt(thetaGL)} θ_js=${fmt(thetaJS)} θ_canon=${fmt(thetaCanon)}` +
              ` | g=${fmt(U.gammaGeo)} q=${fmt(U.deltaAOverA)} vdb=${fmt(U.gammaVdB)}` +
              ` | dLocal=${fmt(U.dutyLocal ?? U.dutyCycle)} S=${U.sectors}/${U.sectorCount}` +
              ` | viewAvg=${!!U.viewAvg}`
            );
          }
          if (parity && mode.toLowerCase() === 'standby') {
            const leakGL = (thetaGL ?? 0) > 0;
            const leakJS = (thetaJS ?? 0) > 0;
            if (leakGL || leakJS) {
              console.warn(
                `[WRI θ][LEAK] REAL standby shows non-zero θ` +
                ` | θ_gl=${fmt(thetaGL)} θ_js=${fmt(thetaJS)} θ_canon=${fmt(thetaCanon)}`
              );
            }
          }
        } catch (e) {
          console.error('[WRI θ] sampler error:', e);
        }
        rafRef.current = requestAnimationFrame(sample);
      };
      if (!armed) {
        armed = true;
        rafRef.current = requestAnimationFrame(sample);
      }
    };

    // try a few times while engines mount
    const kick = () => {
      start();
      if (!parityLockedRef.current) requestAnimationFrame(kick);
    };
    kick();

    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);
  // ────────────────────────────────────────────────────────────────────────────
  // end [WRI θ] INSTRUMENTATION
  // ────────────────────────────────────────────────────────────────────────────

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

      // WarpEngine should already be loaded globally from HTML script tag
      try {
        getWarpEngineCtor(); // Validate WarpEngine is available
        console.log("✅ Global WarpEngine constructor found");
      } catch (error) {
        console.error("❌ Global WarpEngine not found:", error);
        setLoadError("ENGINE_SCRIPT_MISSING: WarpEngine not loaded globally");
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

      // WarpEngine constructor with Grid3D fallback
      function createEngine(canvas: HTMLCanvasElement): any {
        try {
          const WarpEngine = getWarpEngineCtor();
          return getOrCreateEngine(WarpEngine, canvas);
        } catch (error) {
          console.warn("WarpEngine not found, falling back to Grid3D engine:", error);
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
      }

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

      // Build shared base first (prevents TDZ bug)
      const hull = props.baseShared?.hull ?? { a: 503.5, b: 132, c: 86.5 };
      const shared = {
        axesScene: deriveAxesClip(hull, 1)
      };

      // Bootstrap both engines once they are ready (engine computes theta)
      const realPayload = buildRealPacket(shared, { colorMode: 2 });
      const showPayload = buildShowPacket(shared, {
        exposure: 7.5,
        colorMode: 1,
        curvatureGainT: 0.70,
        curvatureBoostMax: 40,
        userGain: 1.25,
      });


      leftEngine.current?.bootstrap?.(realPayload);
      rightEngine.current?.bootstrap?.(showPayload);

      // Post-bootstrap theta debugging
      requestAnimationFrame(() => {
        try {
          const Le = leftEngine.current, Re = rightEngine.current;
          const Lθ = Number(Le?.uniforms?.thetaScale_actual ?? Le?.uniforms?.thetaScale);
          const Rθ = Number(Re?.uniforms?.thetaScale_actual ?? Re?.uniforms?.thetaScale);
          const parL = !!Le?.uniforms?.physicsParityMode, parR = !!Re?.uniforms?.physicsParityMode;
          console.log('[WRI θ] REAL: θ(shader)=', Lθ, 'parity=', parL,
            'dutyCycle=', Le?.uniforms?.dutyCycle, 'sectors=', Le?.uniforms?.sectors,
            'sectorCount=', Le?.uniforms?.sectorCount, 'γ_VdB(mass)=', Le?.uniforms?.gammaVanDenBroeck_mass);
          console.log('[WRI θ] SHOW: θ(shader)=', Rθ, 'parity=', parR,
            'dutyCycle=', Re?.uniforms?.dutyCycle, 'sectors=', Re?.uniforms?.sectors,
            'sectorCount=', Re?.uniforms?.sectorCount, 'γ_VdB(vis)=', Re?.uniforms?.gammaVanDenBroeck_vis);
        } catch (e) {
          console.warn('[WRI θ] Debug sampling failed:', e);
        }
      });

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
        const { thetaScale, u_thetaScale, thetaScale_actual, ...uSafe } = u || {};

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
          const leftUpdate = paneSanitize('REAL', sanitizeUniforms({
            ...uSafe, ...purple, ...metricU
          }));
          applyToEngine(leftEngine.current, leftUpdate);
        }
        if (rightEngine.current) {
          const rightUpdate = paneSanitize('SHOW', sanitizeUniforms({
            ...uSafe, ...purple, ...metricU
          }));
          applyToEngine(rightEngine.current, rightUpdate);
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

  // ---- FR duty derivation for payload/telemetry ----
  const u = (leftEngine.current as any)?.uniforms ?? {};                 // if you don't already have it
  const sLive      = Math.max(1, Number(u?.sectors ?? 1));          // concurrent sectors seen by this pane
  const sTotal     = Math.max(1, Number(u?.sectorCount ?? 400));    // total ship sectors
  const dutyLocal  = Math.max(0, Math.min(1, Number(u?.dutyCycle ?? 0.01))); // burst duty in [0,1]
  const dutyEffectiveFR = Math.max(1e-12, dutyLocal * (sLive / sTotal));     // Ford–Roman averaged

  // Build parameters object for the new packet builders
    const parameters = {
      ...props.parityPhys,
      ...props.showPhys,
      ...props.baseShared,
      currentMode: live?.currentMode,
      dutyEffectiveFR,
      dutyCycle: dutyLocal,
      sectorCount: sTotal,
      sectors: sLive,
      gammaVanDenBroeck_mass: live?.gammaVanDenBroeck_mass ?? live?.gammaVanDenBroeck ?? 38.3,
      gammaVanDenBroeck_vis: live?.gammaVanDenBroeck_vis ?? live?.gammaVanDenBroeck ?? 2.86e5,
    };

    // Build shared base first (prevents TDZ bug)
    const sharedBase = makeSharedBase(parameters, live, {
      hull: props.baseShared?.hull ?? { a: 503.5, b: 132, c: 86.5 },
      axesScene: deriveAxesClip(hull, 1),
      exposure: 5.0,
      zeroStop: 1e-7,
      lockFraming: true,
      useMetric: props.baseShared?.useMetric ?? false,
      metric: props.baseShared?.metric ?? metricDiag.g,
      metricInv: props.baseShared?.metricInv ?? metricDiag.inv,
      epsilonTilt: epsilonTilt,
      betaTiltVec: betaTiltVecN,
      ...props.baseShared
    });

    // Build REAL and SHOW payloads using the imported builders
    const realPayload = buildRealPacket(sharedBase, { colorMode: 2 });
    const showPayload = buildShowPacket(sharedBase, {
      exposure: 7.5,
      colorMode: 1,
      curvatureGainT: 0.70,
      curvatureBoostMax: 40,
      userGain: 1.25,
    });



  // Physics bound for theta calculations
    const bound = useMemo(() => ({
      gammaGeo: realPayload.gammaGeo || 26,
      qSpoilingFactor: realPayload.qSpoilingFactor || 1,
      gammaVdB: realPayload.gammaVanDenBroeck_mass || realPayload.gammaVanDenBroeck || 1,
      dutyEffectiveFR: realPayload.dutyEffectiveFR || 0.000025
    }), [realPayload]);

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

      // Use new packet builders with proper pane sanitization
      if (leftEngine.current) {
        const realUpdate = paneSanitize('REAL', sanitizeUniforms({
          ...payload,
          dutyEffectiveFR: dutyFR_REAL,
        }));
        gatedUpdateUniforms(leftEngine.current, realUpdate, 'client');
      }
      if (rightEngine.current) {
        const showUpdate = paneSanitize('SHOW', sanitizeUniforms({
          ...payload,
          dutyEffectiveFR: dutyUI_SHOW,
        }));
        gatedUpdateUniforms(rightEngine.current, showUpdate, 'client');
      }
    });
    return () => { try { off?.(); } catch {} };
  }, []);

  // Initialize batched push functions for performance optimization
  useEffect(() => {
    pushLeft.current = makeUniformBatcher(leftEngine, 'REAL');
    pushRight.current = makeUniformBatcher(rightEngine, 'SHOW');
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

  // --- Dev: dump current engines & θ to console --------------------------------
  const debugEngineStates = () => {
    try {
      // Find any WarpEngine instances attached to canvases
      const canvases = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
      const engines = canvases
        .map(c => ({ id: c.id || '(no id)', engine: (c as any).__warpEngine }))
        .filter(x => !!x.engine);

      const compact = engines.map(({ id, engine }: any) => ({
        id,
        isLoaded: !!engine.isLoaded,
        parity: !!engine.uniforms?.physicsParityMode,
        ridge: engine.uniforms?.ridgeMode,
        theta_uniform: engine.uniforms?.thetaScale,
        theta_actual: engine.uniforms?.thetaScale_actual,
        gammaGeo: engine.uniforms?.gammaGeo ?? engine.uniforms?.g_y,
        q: engine.uniforms?.deltaAOverA ?? engine.uniforms?.qSpoilingFactor,
        gammaVdB: engine.uniforms?.gammaVanDenBroeck_mass ?? engine.uniforms?.gammaVanDenBroeck,
        dutyLocal: engine.uniforms?.dutyCycle,
        sectors: engine.uniforms?.sectors,
        sectorCount: engine.uniforms?.sectorCount,
        dutyFR: engine.uniforms?.dutyEffectiveFR ?? engine.uniforms?.dutyUsed,
      }));

      console.group('[WRI] Engine snapshot');
      console.table(compact);
      console.log('Full engines:', engines);
      console.log('window.__warpEcho:', (window as any).__warpEcho);
      console.groupEnd();
    } catch (e) {
      console.warn('[WRI] debugEngineStates failed:', e);
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
  const realUniforms = useMemo(() => buildRealPacket(live || {}), [live]);
  const showUniforms = useMemo(() => buildShowPacket(live || {}), [live]);
  const grid3dRef = useRef<any>(null);

  // Define view mass fractions for checkpoint panels
  const uLeft  = leftEngine.current?.uniforms  ?? {};
  const uRight = rightEngine.current?.uniforms ?? {};

  const viewMassFracREAL = viewMassFractionLocked(uLeft, 'REAL');
  const viewMassFracSHOW = viewMassFractionLocked(uRight, 'SHOW');


  // Physics bound for theta calculations
  const bound = useMemo(() => ({
    gammaGeo: realPayload.gammaGeo || 26,
    qSpoilingFactor: realPayload.qSpoilingFactor || 1,
    gammaVdB: realPayload.gammaVanDenBroeck_mass || realPayload.gammaVanDenBroeck || 1,
    dutyEffectiveFR: realPayload.dutyEffectiveFR || 0.000025
  }), [realPayload]);


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
            <div className="text-yellow-600">
              γ_VdB bound: {(useMassGamma ? 1e2 : 1e11).toExponential(2)} {useMassGamma ? '(mass)' : '(visual)'}
            </div>
            <div>
              view mass fraction (REAL): {(viewMassFracREAL * 100).toFixed(3)}% (1/{Math.max(1, (live?.sectorCount ?? 400))})
            </div>
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

// (removed) local physics helper — we rely on thetaCanonical()