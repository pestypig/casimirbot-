'use client';

import React, { useEffect, useRef, useCallback, useState } from "react";
import { normalizeWU, buildREAL, buildSHOW } from "@/lib/warp-uniforms";
import { gatedUpdateUniforms } from "@/lib/warp-uniforms-gate";
import { sizeCanvasSafe, clampMobileDPR } from '@/lib/gl/capabilities';
import { webglSupport } from '@/lib/gl/webgl-support';
import CanvasFallback from '@/components/CanvasFallback';

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
  engine: any; canvas: HTMLCanvasElement; sharedAxesScene: [number,number,number]; pane: 'REAL'|'SHOW';
}) {
  // wait for program + buffers
  await new Promise<void>(res => {
    const tick = () => (engine?.gridProgram && (engine?._vboBytes > 0)) ? res() : requestAnimationFrame(tick);
    tick();
  });

  // single deterministic camera for the first frame
  const cz = batcherSafeCamZ(batcherCalculateCameraZ(canvas, sharedAxesScene));
  const packet = paneSanitize(pane, { cameraZ: cz, lockFraming: true, viewAvg: true });

  gatedUpdateUniforms(engine, packet, 'client');
  engine.forceRedraw?.();
}

// Helper functions needed by firstCorrectFrame
function batcherSafeCamZ(z: number): number {
  return Number.isFinite(z) ? Math.max(-10, Math.min(-0.5, z)) : -2.0;
}

function batcherCalculateCameraZ(canvas: HTMLCanvasElement, axes: [number,number,number]): number {
  const w = canvas.clientWidth || canvas.width || 800;
  const h = canvas.clientHeight || canvas.height || 320;
  const aspect = w / h;
  const maxRadius = Math.max(...axes);
  return -maxRadius * (2.0 + 0.5 / Math.max(aspect, 0.5));
}

// Get App Build Version
const getAppBuild = () =>
  (typeof window !== 'undefined' && (window as any).__APP_WARP_BUILD) || 'dev';

// --- resilient uniform push helpers ---
const CM = { solid: 0, theta: 1, shear: 2 };
const finite = (x: any, d: number) => (Number.isFinite(+x) ? +x : d);

// Parameter validation and clamping helper
const validatePhysicsParams = (params: any, label: string) => {
  const validated = { ...params };

  // Clamp gamma values to reasonable ranges
  if ('gammaGeo' in validated) {
    validated.gammaGeo = Math.max(1, Math.min(1000, validated.gammaGeo || 26));
  }
  if ('gammaVdB' in validated || 'gammaVanDenBroeck' in validated) {
    const gamma = validated.gammaVdB || validated.gammaVanDenBroeck || 1;
    validated.gammaVdB = Math.max(1, Math.min(1000, gamma));
    validated.gammaVanDenBroeck = validated.gammaVdB;
  }

  // Clamp q-spoiling factor
  if ('qSpoilingFactor' in validated || 'deltaAOverA' in validated) {
    const q = validated.qSpoilingFactor || validated.deltaAOverA || 1;
    validated.qSpoilingFactor = Math.max(0.01, Math.min(10, q));
    validated.deltaAOverA = validated.qSpoilingFactor;
  }

  // Clamp theta scale
  if ('thetaScale' in validated) {
    validated.thetaScale = Math.max(0, Math.min(1e15, validated.thetaScale || 0));
  }

  // Clamp duty cycles
  if ('dutyEffectiveFR' in validated) {
    validated.dutyEffectiveFR = Math.max(1e-6, Math.min(1, validated.dutyEffectiveFR || 0.000025));
  }
  if ('dutyCycle' in validated) {
    validated.dutyCycle = Math.max(0, Math.min(1, validated.dutyCycle || 0.14));
  }

  // Clamp sectors
  if ('sectors' in validated) {
    validated.sectors = Math.max(1, Math.min(1000, validated.sectors || 400));
  }
  if ('sectorCount' in validated) {
    validated.sectorCount = Math.max(1, Math.min(1000, validated.sectorCount || 400));
  }

  console.log(`[${label}] Parameter validation:`, {
    gammaGeo: validated.gammaGeo,
    gammaVdB: validated.gammaVdB,
    qSpoil: validated.qSpoilingFactor,
    theta: validated.thetaScale,
    dutyFR: validated.dutyEffectiveFR,
    sectors: validated.sectors
  });

  return validated;
};

// Engine mounting helper functions
const getBuild = () =>
  (typeof window !== 'undefined' && (window as any).__APP_WARP_BUILD) || 'dev';

const ensureScript = () =>
  new Promise<void>(async (resolve, reject) => {
    const w: any = window;
    const required = getBuild();
    const current  = w.WarpEngine?.BUILD || w.__WarpEngineBuild;
    const mismatch = !!(current && required && current !== required);

    if (w.WarpEngine && !mismatch) return resolve();

    // Clean old script tags if we're upgrading
    Array.from(document.querySelectorAll('script[src*="warp-engine.js"]'))
      .forEach(n => n.parentNode?.removeChild(n));

    // Also clear "loaded" marker so the new file runs
    w.__WARP_ENGINE_LOADED__ = undefined;

    const src = `/warp-engine.js?v=${encodeURIComponent(required)}`;
    const s = document.createElement('script');
    s.src = src; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

// Dev utility: manual hard reload escape hatch
(window as any).__forceReloadWarpEngine = () => {
  const w: any = window;
  Array.from(document.querySelectorAll('script[src*="warp-engine.js"]'))
    .forEach(n => n.parentNode?.removeChild(n));
  w.__WARP_ENGINE_LOADED__ = undefined;
  w.WarpEngine = undefined;
  const stamp = (w.__APP_WARP_BUILD || 'dev');
  const s = document.createElement('script');
  s.src = `/warp-engine.js?v=${encodeURIComponent(stamp)}`;
  s.defer = true;
  s.onload = () => console.log('[force] WarpEngine reloaded');
  document.head.appendChild(s);
};

function sizeCanvas(cv: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = cv.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width  * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  cv.width = w; cv.height = h;
  return { w, h };
}

function paneSanitize(pane: 'REAL'|'SHOW', patch: any) {
  const p = { ...patch };

  // Force parity mode based on pane - this is critical for physics validation
  if (pane === 'REAL') {
    p.physicsParityMode = true;
    p.parityMode = true;  // Also set the fallback field
    p.ridgeMode = 0;
    if (DEBUG) console.log(`[${pane}] Parity lock: physicsParityMode=true, ridgeMode=0`);
  } else {
    p.physicsParityMode = false;
    p.parityMode = false; // Also set the fallback field
    p.ridgeMode = 1;
    if (DEBUG) console.log(`[${pane}] Parity lock: physicsParityMode=false, ridgeMode=1`);
  }
  return p;
}

function sanitizeUniforms(u: any = {}) {
  const s = { ...u };

  // numeric coercions + clamps
  if ('thetaScale' in s) {
    // allow 0 (standby), clamp negatives to 0
    s.thetaScale = Math.max(0, finite(s.thetaScale, 0));
  }
  s.exposure          = Math.min(12, Math.max(1, finite(s.exposure,  6)));
  s.zeroStop          = Math.max(1e-9,    finite(s.zeroStop,   1e-7));
  s.wallWidth         = Math.max(1e-4,    finite(s.wallWidth,  0.016));
  s.curvatureBoostMax = Math.max(1,       finite(s.curvatureBoostMax, 40));
  s.curvatureGainT    = Math.max(0, Math.min(1, finite(s.curvatureGainT, 0)));
  s.userGain          = Math.max(1,       finite(s.userGain,  1));
  s.displayGain       = Math.max(1,       finite(s.displayGain, 1));
  s.sectors           = Math.max(1, Math.floor(finite(s.sectors, 1)));
  s.split             = Math.max(0, Math.min(s.sectors - 1, Math.floor(finite(s.split, 0))));

  // map strings → ints
  if (typeof s.colorMode === 'string') s.colorMode = CM[s.colorMode as keyof typeof CM] ?? 1;
  s.ridgeMode = Math.max(0, Math.min(1, Math.floor(finite(s.ridgeMode, 0))));

  // hull normalization (drop invalid)
  if (s.hull) {
    const a = finite(s.hull.a, NaN), b = finite(s.hull.b, NaN), c = finite(s.hull.c, NaN);
    if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c)) s.hull = { a, b, c };
    else delete s.hull;
  }

  return s;
}


// Modes we expose in UI
type ModeKey = "hover" | "cruise" | "emergency" | "standby";

// Safe unit formatting for either live MW or config W
const formatPower = (P_MW?: number, P_W?: number) => {
  if (Number.isFinite(P_MW as number)) return `${(P_MW as number).toFixed(1)} MW`;
  if (Number.isFinite(P_W as number)) {
    const w = P_W as number;
    if (w >= 1e6) return `${(w / 1e6).toFixed(1)} MW`;
    if (w >= 1e3) return `${(w / 1e3).toFixed(1)} kW`;
    return `${w.toFixed(1)} W`;
  }
  return "—";
};


/* ---------------- Client-side physics calc identical to EnergyPipeline ---------------- */
type BaseInputs = {
  hull: { a: number; b: number; c: number };
  wallWidth_m?: number;
  driveDir?: [number, number, number];
  vShip?: number;

  // duties
  dutyCycle: number;          // UI duty (0..1)
  dutyEffectiveFR: number;    // ship-wide FR duty (0..1)

  // sectors
  sectorCount: number;        // total sectors (averaging)
  sectors: number;            // concurrent (strobing)

  // physics parameters
  gammaGeo: number;           // γ_geo
  qSpoilingFactor: number;    // ΔA/A
  gammaVanDenBroeck: number;  // γ_VdB

  colorMode?: 'theta'|'shear'|'solid';
  lockFraming?: boolean;
};

const clampValue = (x: number) => Math.max(0, Math.min(1, x));

function buildThetaScale(base: BaseInputs, flavor: 'fr'|'ui') {
  // canonical: θ-scale = γ^3 · (ΔA/A) · γ_VdB · √(duty / sectors_avg)
  const g3   = Math.pow(Math.max(1, base.gammaGeo), 3);
  const dAA  = Math.max(1e-12, base.qSpoilingFactor);
  const gVdB = Math.max(1, base.gammaVanDenBroeck);

  const duty = (flavor === 'fr')
    ? clampValue(base.dutyEffectiveFR)                     // ship-averaged FR duty
    : clampValue(base.dutyCycle / Math.max(1, base.sectorCount)); // UI duty averaged over all sectors

  const sectorsAvg = Math.max(1, base.sectorCount);
  const dutyTerm = Math.max(1e-12, duty);    // duty ; sectors already averaged in "duty" above

  return g3 * dAA * gVdB * dutyTerm;
}

function buildCommonUniforms(base: BaseInputs) {
  return {
    // geometry
    hullAxes: [base.hull.a, base.hull.b, base.hull.c] as [number,number,number],
    wallWidth_m: base.wallWidth_m ?? 6.0,
    driveDir: base.driveDir ?? [1,0,0],
    vShip: base.vShip ?? 1.0,

    // timing / averaging
    dutyCycle: base.dutyCycle,          // UI duty (for diagnostics)
    sectors: Math.max(1, base.sectors), // concurrent
    sectorCount: Math.max(1, base.sectorCount), // total
    viewAvg: TONEMAP_LOCK.viewAvg,      // Always true from first frame

    // physics parameters (these change by mode)
    gammaGeo: base.gammaGeo,
    qSpoilingFactor: base.qSpoilingFactor,
    gammaVanDenBroeck: base.gammaVanDenBroeck,

    // visual defaults (locked)
    colorMode: TONEMAP_LOCK.colorMode,
    lockFraming: base.lockFraming ?? true,
  };
}

// Locked display settings - modes only change visuals, not visuals
const TONEMAP_LOCK = {
  exp: 5.0,
  zero: 1e-7,
  ridgeMode: 0,
  colorMode: 'theta' as const,
  viewAvg: true
};

export function buildEngineUniforms(base: BaseInputs) {
  const common = buildCommonUniforms(base);
  const real = {
    ...common,
    thetaScale: buildThetaScale(base, 'fr'),
    physicsParityMode: true,
    ridgeMode: TONEMAP_LOCK.ridgeMode,
    exposure: TONEMAP_LOCK.exp,
    zeroStop: TONEMAP_LOCK.zero,
    colorMode: TONEMAP_LOCK.colorMode,
    viewAvg: TONEMAP_LOCK.viewAvg,
    cosmeticLevel: 1,
    curvatureGainT: 0,
    curvatureBoostMax: 1,
    userGain: 1,
  };
  const show = {
    ...common,
    thetaScale: buildThetaScale(base, 'ui'),
    physicsParityMode: false,
    ridgeMode: TONEMAP_LOCK.ridgeMode,
    exposure: TONEMAP_LOCK.exp,
    zeroStop: TONEMAP_LOCK.zero,
    colorMode: TONEMAP_LOCK.colorMode,
    viewAvg: TONEMAP_LOCK.viewAvg,
    cosmeticLevel: 1, // Lock cosmetic level too
    curvatureGainT: 0,
    curvatureBoostMax: 1,
    userGain: 1,
  };
  return { real, show };
}

/* ---------------- Script loader & strobe mux ---------------- */
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function removeOldWarpScripts() {
  Array.from(document.querySelectorAll('script[src*="warp-engine.js"]'))
    .forEach(n => n.parentNode?.removeChild(n));
}

// --- Robust asset base resolution (handles sub-path deploys, Next/Vite/CRA) ---
function resolveAssetBase() {
  const w: any = window;
  // explicit override wins
  if (w.__ASSET_BASE__) return String(w.__ASSET_BASE__);
  // Vite
  if ((import.meta as any)?.env?.BASE_URL) return (import.meta as any).env.BASE_URL as string;
  // Webpack public path
  if (typeof (w.__webpack_public_path__) === 'string') return w.__webpack_public_path__;
  // Next.js base path
  if (typeof (w.__NEXT_DATA__)?.assetPrefix === 'string') return w.__NEXT_DATA__.assetPrefix || '/';
  // <base href="..."> tag
  const baseEl = document.querySelector('base[href]');
  if (baseEl) return (baseEl as HTMLBaseElement).href;
  return '/';
}

function ensureStrobeMux() {
  const w = window as any;
  const prev = w.setStrobingState;
  if (!w.__strobeListeners) w.__strobeListeners = new Set();
  w.setStrobingState = (payload: any) => {
    try { typeof prev === 'function' && prev(payload); } catch {}
    for (const fn of w.__strobeListeners) { try { fn(payload); } catch {} }
  };
  w.__addStrobingListener = (fn: Function) => { w.__strobeListeners.add(fn); return () => w.__strobeListeners.delete(fn); };
}

/* ---------------- Uniform verification & physics validation ---------------- */
function dumpUniforms(e:any, tag:string) {
  const u = (e && e.uniforms) ? Object.keys(e.uniforms).sort() : [];
  console.log(`[${tag}] engine uniforms:`, u);
}

const check = (label:string, o:any) => {
  if (!Number.isFinite(o?.thetaScale) || o.thetaScale <= 0) {
    console.warn(`[${label}] BAD thetaScale`, o);
  }
  if (!Number.isFinite(o?.cameraZ) || Math.abs(o.cameraZ) < 1e-9) {
    console.warn(`[${label}] BAD cameraZ`, o);
  }
};

/* ---------------- Canvas & Safety helpers ---------------- */
function ensureCanvasSize(canvas: HTMLCanvasElement) {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const cw = (canvas.clientWidth  || 800) * dpr;
  const ch = (canvas.clientHeight || 320) * dpr;
  if (canvas.width !== cw)  canvas.width  = cw;
  if (canvas.height !== ch) canvas.height = ch;
}

const safeCamZ = (cv: number) => (Number.isFinite(cv) && Math.abs(cv) > 1e-9) ? cv : 2.0;

function attachGLContextGuards(canvas: HTMLCanvasElement, recreate: () => void) {
  canvas.addEventListener('webglcontextlost', (ev:any) => {
    ev.preventDefault?.();
    console.warn('[WARP] WebGL context lost — recreating…');
    recreate();
  }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    console.warn('[WARP] WebGL context restored');
    recreate();
  }, false);
}


// (removed unused import + helper; this component computes θ-scale inline)

/* ---------------- Framing helpers ---------------- */
type Hull = { a:number; b:number; c:number };

const clamp01 = (x:number)=>Math.max(0,Math.min(1,x));

const frameFromHull = (hull?: Partial<Hull>, gridSpan?: number) => {
  const a = Number.isFinite(hull?.a) ? Number(hull!.a) : 503.5;
  const b = Number.isFinite(hull?.b) ? Number(hull!.b) : 132.0;
  const c = Number.isFinite(hull?.c) ? Number(hull!.c) : 86.5;

  const s = 1 / Math.max(a, 1e-6);             // long semi-axis → 1.0
  const axesScene: [number,number,number] = [a*s, b*s, c*s];

  const span = Number.isFinite(gridSpan)
    ? (gridSpan as number)
    : Math.max(2.6, Math.max(...axesScene) * 1.35);

  return {
    hullAxes: [a,b,c] as [number,number,number],
    axesScene,
    axesClip: axesScene,                        // seed clip to avoid null paths
    gridSpan: span,
  };
};

const compactCameraZ = (canvas: HTMLCanvasElement, axesScene: [number,number,number]) => {
  const w = canvas.clientWidth  || canvas.width  || 800;
  const h = canvas.clientHeight || canvas.height || 320;
  const aspect = w / Math.max(1, h);
  const fovDesktop = Math.PI / 3.272;        // ~55°
  const fovPortrait = Math.PI / 2.65;        // ~68°
  const t = Math.min(1, Math.max(0, (1.2 - aspect) / 0.6));
  const fov = fovDesktop * (1 - t) + fovPortrait * t;
  const R = Math.max(...axesScene);
  const margin = 0.95;                       // tighter than engine default
  return (margin * R) / Math.tan(fov * 0.5);
};




/* ---------------- Pane configurators ---------------- */
const primeOnce = (e: any, shared: ReturnType<typeof frameFromHull>, colorMode: 'theta'|'shear'|'solid') => {
  if (!e) return;
  const payload = { ...shared, colorMode, viewAvg: true };
  if (!e._bootstrapped) {
    e.bootstrap?.(payload);
    e._bootstrapped = true;
    setTimeout(() => {
      const clean = sanitizeUniforms(payload);
      if (e.isLoaded && e.gridProgram) {
        gatedUpdateUniforms(e, clean, 'client');
      } else {
        e.onceReady?.(() => gatedUpdateUniforms(e, clean, 'client'));
      }
    }, 0); // microtick delay
    return;
  }
  const clean = sanitizeUniforms(payload);
  if (e.isLoaded && e.gridProgram) {
    e.updateUniforms(clean);
  } else {
    e.onceReady?.(() => e.updateUniforms(clean));
  }
};

const applyReal = (
  e: any,
  sharedIn: ReturnType<typeof frameFromHull>,
  canvas: HTMLCanvasElement,
  colorMode: 'theta'|'shear'|'solid'
) => {
  primeOnce(e, sharedIn, colorMode);

  let shared = sharedIn;
  const axesOK = shared?.axesScene?.every?.(n => Number.isFinite(n) && Math.abs(n) > 0);
  if (!axesOK) shared = { ...shared, axesScene: [1, 0.26, 0.17] as any };

  const camZ = safeCamZ(compactCameraZ(canvas, shared.axesScene));
  const colorModeIndex = ({ solid:0, theta:1, shear:2 } as const)[colorMode] ?? 1;

  const clean = sanitizeUniforms({
    ...shared,
    cameraZ: camZ,
    lockFraming: true,
    physicsParityMode: true,
    ridgeMode: 0,
    colorMode: colorModeIndex,
    colorModeIndex,
    colorModeName: colorMode,
    vizGain: 1,
    displayGain: 1,
    exposure: 4.2,      // slightly up from 3.8 but not blinding
    zeroStop: 1e-6,     // restore parity default
    cosmeticLevel: 0,
    curvatureGainDec: 0,
    curvatureGainT: 0,
    curvatureBoostMax: 1,
    // ⚠ don't override tilt here; let upstream params decide
  });
  if (e.isLoaded && e.gridProgram) {
    e.updateUniforms(clean);
  } else {
    e.onceReady?.(() => e.updateUniforms(clean));
  }
  e.setDisplayGain?.(1);
  e.requestRewarp?.();
};

const applyShow = (
  e: any,
  sharedIn: ReturnType<typeof frameFromHull>,
  canvas: HTMLCanvasElement,
  colorMode: 'theta'|'shear'|'solid',
  opts: { T?: number; boostMax?: number; decades?: number; vizGain?: number; exposure?: number; zeroStop?: number; }
) => {
  const { T=0.70, boostMax=40, decades=3, vizGain=1.25, exposure=7.5, zeroStop=1e-7 } = opts || {};
  primeOnce(e, sharedIn, colorMode);

  let shared = sharedIn;
  const axesOK = shared?.axesScene?.every?.((n:any)=>Number.isFinite(n)&&Math.abs(n)>0);
  if (!axesOK) {
    console.warn('[SHOW] invalid axesScene, fixing');
    shared = { ...shared, axesScene: [1, 0.26, 0.17] as any };
  }

  const camZ = safeCamZ(compactCameraZ(canvas, shared.axesScene));
  const t = clamp01(T);
  const b = Math.max(1, boostMax);

  // Use numeric color mode for engine compatibility (engine: 0=solid,1=theta,2=shear)
  const colorModeIndex = ({ solid:0, theta:1, shear:2 } as const)[colorMode] ?? 1;

  console.log('[SHOW] camZ', camZ, 't', t, 'b', b, 'colorMode', colorMode, 'colorModeIndex', colorModeIndex);

  const clean = sanitizeUniforms({
    ...shared,
    cameraZ: camZ,
    lockFraming: true,
    physicsParityMode: false,   // enable amplification
    ridgeMode: 1,
    // Force numeric color mode for engine compatibility (engine: 0=solid,1=theta,2=shear)
    colorMode: colorModeIndex,
    colorModeIndex,
    colorModeName: colorMode,
    curvatureGainT: t,
    curvatureBoostMax: b,
    curvatureGainDec: Math.max(0, Math.min(8, decades)),
    vizGain,
    exposure: Math.max(0.1, exposure),
    zeroStop,
    cosmeticLevel: 10,
  });
  if (e.isLoaded && e.gridProgram) {
    e.updateUniforms(clean);
  } else {
    e.onceReady?.(() => e.updateUniforms(clean));
  }

  const displayBoost = (1 - clamp01(decades/8)) + clamp01(decades/8) * b;
  e.setDisplayGain?.(Number.isFinite(displayBoost) ? displayBoost : 1);
  e.requestRewarp?.();

  if (e?.gl?.isContextLost?.()) {
    console.warn('[SHOW] context lost – attempting restore');
    e.gl.getExtension?.('WEBGL_lose_context')?.restoreContext?.();
  }

  // Debug uniforms that actually landed
  setTimeout(() => {
    console.log('[SHOW] engine uniforms:', e?.uniforms || e?.params || 'no uniforms found');
  }, 100);
};

/* ---------------- Component ---------------- */
type Props = {
  parameters: any;                   // compareParams from HelixCore
  parityExaggeration?: number;       // keep at 1 (userGain) for REAL
  heroExaggeration?: number;         // display gain cap (e.g., 40..120)
  colorMode?: "theta" | "shear" | "solid";
  lockFraming?: boolean;
};

export default function WarpBubbleCompare({
  parameters,
  parityExaggeration = 1,
  heroExaggeration = 82,
  colorMode = "theta",
  lockFraming = true, // reserved; we always lock from inside
}: Props) {
  // ✨ DEBUG: heroExaggeration variable tracing (normalize to a sane, finite number once)
  const heroBoost = Math.max(1, finite(heroExaggeration, 82));

  console.log(`[WarpBubbleCompare] 🎯 heroExaggeration DEBUG:`, {
    prop: heroExaggeration,
    normalized: heroBoost,
    type: typeof heroExaggeration,
    isFinite: Number.isFinite(+heroExaggeration),
    source: 'component props'
  });

  // Optional: set per-pane display gain (parity kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const parityX = parityExaggeration ?? 1;

  console.log(`[WarpBubbleCompare] 🎯 heroBoost calculated:`, {
    original: heroExaggeration,
    fallback: 82,
    result: heroBoost,
    willUse: heroBoost
  });

  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const leftEngine = useRef<any>(null);
  const rightEngine = useRef<any>(null);
  const reinitInFlight = useRef<Promise<void> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Batched push system for performance optimization
  const pushLeft = useRef<(p:any, tag?:string)=>void>(() => {});
  const pushRight = useRef<(p:any, tag?:string)=>void>(() => {});

  // current UI mode key from parameters only
  const currentModeKey = ((parameters?.currentMode as ModeKey) ?? "hover") as ModeKey;

  // optional: read UI configs if present on window; safe fallback to empty
  const modeCfgs: Record<string, { name?: string; powerTarget_W?: number }> =
    (typeof window !== "undefined" && (window as any).MODE_CONFIGS) || {};

  // Parameter-based subtitle formatter
  const subtitleFromParams = (p: any) => {
    const P = Number.isFinite(p?.powerAvg_MW) ? `${p.powerAvg_MW.toFixed(1)} MW` : '—';
    const M = Number.isFinite(p?.exoticMass_kg) ? `${Math.round(p.exoticMass_kg)} kg` : '— kg';
    const Z = Number.isFinite(p?.zeta) ? `ζ=${p.zeta.toFixed(3)}` : 'ζ=—';
    return `${P} • ${M} • ${Z}`;
  };

  // Titles for the two panels
  const realPanelTitle = `REAL • ${subtitleFromParams(parameters)}`;
  const showPanelTitle = `SHOW • ${subtitleFromParams(parameters)}`;

  const N = (x: any, d = 0) => (Number.isFinite(x) ? +x : d);

  // Reuse-or-create guard so we never attach twice to the same canvas
  const ENGINE_KEY = '__warpEngine';
  const ENGINE_PROMISE = '__warpEnginePromise';

  function hasLiveEngine(cv: HTMLCanvasElement) {
    const e: any = (cv as any)[ENGINE_KEY];
    return e && !e._destroyed;
  }

  const makeEngine = useCallback(async (canvasId: string, label: string): Promise<any> => {
    if (!window.WarpEngine) {
      console.warn(`[${label}] WarpEngine class not loaded, waiting...`);
      return null;
    }

    try {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) {
        console.error(`[${label}] Canvas ${canvasId} not found`);
        return null;
      }

      // Ensure canvas has proper dimensions before engine creation
      if (!canvas.clientWidth || !canvas.clientHeight) {
        console.warn(`[${label}] Canvas has no display size, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check canvas state before engine creation
      console.log(`[${label}] Canvas state:`, {
        id: canvas.id,
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        style: canvas.style.cssText,
        isConnected: canvas.isConnected,
        parentElement: !!canvas.parentElement
      });

      // Test WebGL availability before creating engine
      try {
        const testGl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
                       canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
        if (!testGl) {
          throw new Error('WebGL context test failed');
        }
        console.log(`[${label}] WebGL pre-test passed:`, {
          version: testGl.getParameter(testGl.VERSION),
          vendor: testGl.getParameter(testGl.VENDOR),
          renderer: testGl.getParameter(testGl.RENDERER)
        });
        // Clean up test context
        const loseContext = testGl.getExtension('WEBGL_lose_context');
        loseContext?.loseContext();
      } catch (webglError) {
        console.error(`[${label}] WebGL pre-test failed:`, webglError);
        throw new Error(`WebGL not available for ${label}: ${String(webglError)}`);
      }

      console.log(`[${label}] Creating engine for canvas:`, canvas);

      // Create engine instance with enhanced timeout and error handling
      const enginePromise = new Promise((resolve, reject) => {
        try {
          const engine = new window.WarpEngine(canvas);

          // Immediate validation
          if (!engine) {
            reject(new Error('Engine constructor returned null'));
            return;
          }

          if (!engine.gl) {
            reject(new Error('Engine has no WebGL context'));
            return;
          }

          if (engine.gl.isContextLost()) {
            reject(new Error('WebGL context was lost during engine creation'));
            return;
          }

          console.log(`[${label}] Engine instance created, validating...`);
          resolve(engine);
        } catch (error) {
          console.error(`[${label}] Engine constructor threw:`, error);
          reject(error);
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Engine creation timeout after 5000ms')), 5000);
      });

      const engine = await Promise.race([enginePromise, timeoutPromise]);

      // Additional post-creation validation
      if (engine && engine.gl && engine.gl.isContextLost()) {
        throw new Error('WebGL context lost immediately after engine creation');
      }

      console.log(`[${label}] Engine created and validated successfully`);
      return engine;
    } catch (error) {
      console.error(`[${label}] Engine creation failed:`, error);

      // Enhanced debugging for WebGL errors
      if (String(error).includes('WebGL')) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        console.error(`[${label}] WebGL-specific debugging:`, {
          webglSupported: !!window.WebGLRenderingContext,
          webgl2Supported: !!window.WebGL2RenderingContext,
          canvasSupported: !!window.HTMLCanvasElement,
          documentReady: document.readyState,
          canvasInDOM: canvas?.isConnected,
          canvasSize: canvas ? `${canvas.clientWidth}x${canvas.clientHeight}` : 'N/A'
        });

        // Try to get more WebGL debug info
        try {
          const debugCanvas = document.createElement('canvas');
          const debugGl = debugCanvas.getContext('webgl');
          if (debugGl) {
            console.error(`[${label}] WebGL debug context info:`, {
              maxTextureSize: debugGl.getParameter(debugGl.MAX_TEXTURE_SIZE),
              maxViewportDims: debugGl.getParameter(debugGl.MAX_VIEWPORT_DIMS),
              maxVertexAttribs: debugGl.getParameter(debugGl.MAX_VERTEX_ATTRIBS)
            });
          }
        } catch (debugError) {
          console.error(`[${label}] Could not create debug WebGL context:`, debugError);
        }
      }

      return null;
    }
  }, []);

  async function getOrCreateEngine<WarpType = any>(
    Ctor: new (c: HTMLCanvasElement) => WarpType,
    cv: HTMLCanvasElement
  ): Promise<WarpType> {
    // Reuse existing
    if (hasLiveEngine(cv)) return (cv as any)[ENGINE_KEY] as WarpType;

    // Someone else is attaching? wait for it
    if ((cv as any)[ENGINE_PROMISE]) return (cv as any)[ENGINE_PROMISE];

    // Single-flight lock
    (cv as any)[ENGINE_PROMISE] = (async () => {
      try {
        if (hasLiveEngine(cv)) return (cv as any)[ENGINE_KEY] as WarpType;

        // Ensure canvas has proper dimensions before creating engine
        ensureCanvasSize(cv);

        let eng: any;
        try {
          console.log(`[WarpBubbleCompare] Creating engine for canvas:`, cv.id, cv.width, cv.height);
          eng = new Ctor(cv);

          // Wait for engine to be fully ready
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Engine initialization timeout')), 5000);
            const checkReady = () => {
              if (eng.isLoaded && eng.gridProgram) {
                clearTimeout(timeout);
                resolve();
              } else {
                setTimeout(checkReady, 50);
              }
            };
            checkReady();
          });

        } catch (err: any) {
          const msg = String(err?.message || err).toLowerCase();
          if (msg.includes('already attached')) {
            // Another call won the race; reuse the survivor
            if (hasLiveEngine(cv)) return (cv as any)[ENGINE_KEY] as WarpType;
          }
          console.error(`[WarpBubbleCompare] Engine creation failed:`, err);
          throw err;
        }
        (cv as any)[ENGINE_KEY] = eng;
        console.log(`[WarpBubbleCompare] Engine created successfully for:`, cv.id);
        return eng as WarpType;
      } finally {
        delete (cv as any)[ENGINE_PROMISE];
      }
    })();

    return (cv as any)[ENGINE_PROMISE];
  }

  async function waitForCanvases(
    leftRef: React.RefObject<HTMLCanvasElement>,
    rightRef: React.RefObject<HTMLCanvasElement>,
    timeoutMs = 800
  ) {
    const t0 = performance.now();
    return new Promise<void>((resolve, reject) => {
      const tick = () => {
        if (leftRef.current && rightRef.current) return resolve();
        if (performance.now() - t0 > timeoutMs) return reject(new Error('canvas mount timeout'));
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  // Kill and detach an engine instance on a canvas
  function killEngine(ref: React.MutableRefObject<any>, cv?: HTMLCanvasElement | null) {
    const e = ref.current;
    try { e?.__ro?.disconnect?.(); } catch {}
    try { e?.stop?.(); } catch {}
    try { e?.dispose?.(); } catch {}
    ref.current = null;
    // also clear the per-canvas instance cache
    if (cv) (cv as any).__warpEngine = undefined;
  }

  // Build REAL/SHOW packets from parameters (your existing code)
  function buildPacketsFromParams(p: any) {
    const wu = normalizeWU(p?.warpUniforms || (p as any));
    const real = buildREAL(wu);
    const show = buildSHOW(wu, { T: 0.70, boost: 40, userGain: 4 });
    return { real, show };
  }

  // Full re-init using current parameters + camera + strobing
  async function reinitEnginesFromParams() {
    try {
      // Strong detection up-front (DOM-mounted probe for mobile webviews)
      const support = webglSupport(undefined, { mountProbeCanvas: true });
      if (!support.ok) {
        setLoadError(support.reason || 'WebGL not available');
        (window as any).__whyNoGL = support;
        return;
      }

      await ensureScript();
      const W = (window as any).WarpEngine;
      if (!W || !parameters) return;
      try { await waitForCanvases(leftRef, rightRef); } catch {}
      if (!leftRef.current || !rightRef.current) return;

      // 1) Cleanly kill any existing engines
      killEngine(leftEngine, leftRef.current);
      killEngine(rightEngine, rightRef.current);

      const initOne = async (cv: HTMLCanvasElement, uniforms: any) => {
        const eng: any = await getOrCreateEngine(W, cv);
        const { w, h } = sizeCanvas(cv);
        eng.gl.viewport(0, 0, w, h);
        try { eng._initializeGrid?.(); } catch {}
        try { eng._compileGridShaders?.(); } catch {}
        await new Promise<void>(res => {
          const tick = () => (eng.gridProgram && eng.gridVbo && eng._vboBytes > 0) ? res() : requestAnimationFrame(tick);
          tick();
        });
        // Only apply uniforms if they're provided
        if (uniforms && Object.keys(uniforms).length > 0) {
          gatedUpdateUniforms(eng, uniforms, 'client');
        }
        eng.isLoaded = true;
        if (!eng._raf && typeof eng._renderLoop === 'function') eng._renderLoop();
        eng.start?.();

        // Sizing handled by top-level ResizeObserver
        return eng;
      };

      // 3) Build uniforms from parameters (single source of truth)
      const shared = frameFromHull(parameters.hull, parameters.gridSpan || 2.6);
      const { real, show } = buildPacketsFromParams(parameters);

      // REAL packet
      const realPacket = {
        ...shared,
        ...real,
        currentMode: parameters.currentMode,
        physicsParityMode: true,
        vShip: 0,
        gammaVdB: real.gammaVanDenBroeck ?? real.gammaVdB,
        deltaAOverA: real.qSpoilingFactor,
        dutyEffectiveFR: real.dutyEffectiveFR ?? (real as any).dutyEff ?? (real as any).dutyFR ?? 0.000025,
        sectors: Math.max(1, parameters.sectors),
        ridgeMode: 0,
      };

      // SHOW packet
      const showTheta = parameters.currentMode === 'standby' ? 0 : Math.max(1e-6, show.thetaScale || 0);
      const showPacket = {
        ...shared,
        ...show,
        currentMode: parameters.currentMode,
        physicsParityMode: false,
        vShip: parameters.currentMode === 'standby' ? 0 : 1,
        thetaScale: showTheta,
        gammaVdB: show.gammaVanDenBroeck ?? show.gammaVdB,
        deltaAOverA: show.qSpoilingFactor,
        sectors: Math.max(1, parameters.sectors),
        ridgeMode: 1,
      };

      // 4) Init both engines without uniforms first
      leftEngine.current  = await initOne(leftRef.current,  {});
      rightEngine.current = await initOne(rightRef.current, {});

      // 5) After creating both engines and building `shared` once:
      await firstCorrectFrame({
        engine: leftEngine.current,
        canvas: leftRef.current!,
        sharedAxesScene: shared.axesScene as [number,number,number],
        pane: 'REAL'
      });
      await firstCorrectFrame({
        engine: rightEngine.current,
        canvas: rightRef.current!,
        sharedAxesScene: shared.axesScene as [number,number,number],
        pane: 'SHOW'
      });

      // Enable low-FPS mode for mobile after first correct frame
      enableLowFps(leftEngine.current, 12);
      enableLowFps(rightEngine.current, 12);

      // 6) Single combined uniforms write per pane using batchers
      const heroExaggeration = 82; // default visual boost

      // REAL — physics truth
      pushLeft.current(paneSanitize('REAL', sanitizeUniforms({
        ...shared,
        ...real,
        vShip: 0,
        curvatureGainT: 0,
        curvatureBoostMax: 1,
        userGain: 1,
        displayGain: 1,
        colorMode: 2, // shear for truth view
        physicsParityMode: true,
        ridgeMode: 0,
      })), 'REAL/combined');

      // SHOW — boosted visuals
      pushRight.current(paneSanitize('SHOW', sanitizeUniforms({
        ...shared,
        ...show,
        vShip: parameters.currentMode === 'standby' ? 0 : 1,
        curvatureGainT: 0.70,
        curvatureBoostMax: Math.max(1, +heroExaggeration || 82),
        userGain: 4,
        displayGain: 1,
        physicsParityMode: false,
        ridgeMode: 1,
      })), 'SHOW/combined');

      // 6) Ensure strobe mux exists, then re-broadcast strobing from the LC loop carried in parameters
      ensureStrobeMux();
      const lc = parameters.lightCrossing;
      if (lc) {
        const total = Math.max(1, Number(parameters.sectorCount) || 1);
        const live  = Math.max(1, Number(parameters.sectors) || total);
        const cur   = Math.max(0, Math.floor(lc.sectorIdx || 0) % live);
        (window as any).setStrobingState?.({ sectorCount: total, currentSector: cur, split: cur });
      }
    } catch (error) {
      console.error('[WarpBubbleCompare] Error in reinitEnginesFromParams:', error);
      setLoadError(String(error));
    }
  }

  const roRef = useRef<ResizeObserver | null>(null);
  const busyRef = useRef<boolean>(false);
  const lastModeRef = useRef<string | null>(null);
  const lastTokenRef = useRef<any>(null);

  // Mode change effect: hard renderer reset on each mode change or reload token
  useEffect(() => {
    const mode = String(parameters?.currentMode || '');
    const token = parameters?.reloadToken;
    if (!mode) return;
    if (lastModeRef.current === mode && lastTokenRef.current === token) return; // no-op if same
    lastModeRef.current = mode;
    lastTokenRef.current = token;

    if (!reinitInFlight.current) {
      reinitInFlight.current = (async () => {
        try { await reinitEnginesFromParams(); }
        finally { reinitInFlight.current = null; }
      })();
    }
  }, [parameters?.currentMode, parameters?.reloadToken]);

  // Mount-only effect: guarantee initial attach
  useEffect(() => {
    if (leftEngine.current || rightEngine.current) return;
    if (!parameters?.currentMode) return; // need at least the mode
    if (!reinitInFlight.current) {
      reinitInFlight.current = (async () => {
        try { await reinitEnginesFromParams(); } finally { reinitInFlight.current = null; }
      })();
    }
  }, []); // mount only

  // Use props.parameters directly instead of re-deriving from stale snapshots
  useEffect(() => {
    if (!leftEngine.current || !rightEngine.current || !parameters) return;

    // build both payloads from the SAME source of truth
    const wu = normalizeWU(parameters?.warpUniforms || (parameters as any));
    let real = buildREAL(wu);
    let show = buildSHOW(wu, { T: 0.70, boost: 40, userGain: 4 });

    // Validate and clamp physics parameters
    real = validatePhysicsParams(real, 'REAL');
    show = validatePhysicsParams(show, 'SHOW');

    // Build shared geometry data
    const shared = frameFromHull(parameters.hull, parameters.gridSpan || 2.6);

    // --- ⟵ REAL: draw to physical scale --- //
    const a = Number(parameters?.hull?.a) ?? 503.5;
    const b = Number(parameters?.hull?.b) ?? 132.0;
    const c = Number(parameters?.hull?.c) ?? 86.5;
    // effective radius: geometric mean maps meters → ρ-units
    const aEff = Math.cbrt(a * b * c);
    // convert meters to ρ (shader's wall pulse uses ρ)
    const wallWidth_m = Number(parameters?.wallWidth_m ?? 6.0);
    const wallWidth_rho = Math.max(1e-6, wallWidth_m / Math.max(1e-6, aEff));
    // compact camera exactly to hull scale
    const camZ = safeCamZ(compactCameraZ(leftRef.current!, shared.axesScene as [number,number,number]));
    // make the grid span just outside the hull so the ridge is readable
    const gridSpanReal = Math.max(2.2, Math.max(...(shared.axesScene as [number,number,number])) * 1.10);
    // -------------------------------------- //

    // Build physics payload for REAL engine with enforced parity
    const realPhysicsPayload = paneSanitize('REAL', {
      ...shared,
      gridSpan: gridSpanReal,            // tight framing around hull
      ...real,
      currentMode: parameters.currentMode,
      vShip: 0,                          // never "fly" in REAL
      // strictly physical: no boosts, no gains, wall to ρ-units
      userGain: Math.max(0.1, Math.min(10, parityExaggeration || 1)), // clamp exaggeration
      displayGain: 1,
      curvatureGainT: 0,
      curvatureBoostMax: 1,
      wallWidth_rho: wallWidth_rho,      // ⟵ key: ρ-units for shader pulse
      gammaVdB: Math.max(1, Math.min(1000, real.gammaVanDenBroeck ?? real.gammaVdB ?? 1)), // clamp γ_VdB
      deltaAOverA: Math.max(0.01, Math.min(10, real.qSpoilingFactor ?? 1)), // clamp q-spoiling
      dutyEffectiveFR: Math.max(1e-6, Math.min(1, real.dutyEffectiveFR ?? (real as any).dutyEff ?? (real as any).dutyFR ?? 0.000025)),
      sectors: Math.max(1, Math.min(1000, parameters.sectors || 400)),
      colorMode: 2,                      // shear proxy is a clear "truth" view
      cameraZ: camZ,                     // ⟵ key: to-scale camera
      // Force parity mode explicitly
      physicsParityMode: true,
      ridgeMode: 0,
    });

    // REAL (parity / Ford–Roman)
    pushLeft.current(paneSanitize('REAL', sanitizeUniforms(realPhysicsPayload)), 'REAL');

    // SHOW (UI) with heroExaggeration applied
    const showTheta = parameters.currentMode === 'standby'
      ? 0
      : Math.max(1e-6, show.thetaScale || 0);

    const showPhysicsPayload = paneSanitize('SHOW', {
      ...shared,
      ...show,
      currentMode: parameters.currentMode,
      vShip: parameters.currentMode === 'standby' ? 0 : 1,
      thetaScale: Math.max(0, Math.min(1e15, showTheta)), // clamp theta scale
      gammaVdB: Math.max(1, Math.min(1000, show.gammaVanDenBroeck ?? show.gammaVdB ?? 1)), // clamp γ_VdB
      deltaAOverA: Math.max(0.01, Math.min(10, show.qSpoilingFactor ?? 1)), // clamp q-spoiling
      sectors: Math.max(1, Math.min(1000, parameters.sectors || 400)),
      // SHOW camera can share the same camZ for easy side-by-side comparison
      cameraZ: camZ,
      // Apply heroExaggeration to visual amplification (normalized heroBoost)
      curvatureGainT: Math.max(0, Math.min(1, 0.70)), // clamp gain T
      curvatureBoostMax: Math.max(1, Math.min(1000, heroBoost)), // clamp boost max
      userGain: Math.max(1, Math.min(100, 4)), // clamp user gain
      displayGain: 1,
      // Force non-parity mode explicitly
      physicsParityMode: false,
      ridgeMode: 1,
    });

    console.log('Applying physics to engines:', {
      real: {
        parity: realPhysicsPayload.physicsParityMode,
        ridge: realPhysicsPayload.ridgeMode,
        theta: realPhysicsPayload.thetaScale,
        gammaVdB: realPhysicsPayload.gammaVdB,
        qSpoil: realPhysicsPayload.deltaAOverA
      },
      show: {
        parity: showPhysicsPayload.physicsParityMode,
        ridge: showPhysicsPayload.ridgeMode,
        theta: showPhysicsPayload.thetaScale,
        gammaVdB: showPhysicsPayload.gammaVdB,
        qSpoil: showPhysicsPayload.deltaAOverA
      }
    });

    pushRight.current(paneSanitize('SHOW', sanitizeUniforms(showPhysicsPayload)), 'SHOW');

    // Apply safe display gain for SHOW pane - purely visual, doesn't affect physics
    const displayGain = Math.max(1, 1 + 0.5 * Math.log10(Math.max(1, heroBoost)));
    console.log(`[SHOW] 🎯 Final displayGain calculation:`, {
      heroBoost,
      logCalc: Math.log10(Math.max(1, heroBoost)),
      finalGain: displayGain,
      appliedToEngine: !!rightEngine.current.setDisplayGain
    });
    rightEngine.current.setDisplayGain?.(displayGain);

    // Redundant parity verification removed - batched writer ensures correctness

    // Force a draw so the user sees the change immediately
    leftEngine.current.forceRedraw?.();
    rightEngine.current.forceRedraw?.();

    // optional: quick console check
    if (DEBUG) console.log('[WBC] uniforms applied', {
      real_thetaScale: real.thetaScale,
      show_thetaScale: show.thetaScale,
      sectors: real.sectors, sectorCount: real.sectorCount,
      dutyFR: parameters.dutyEffectiveFR,
      dutyUI: parameters.dutyCycle,
      heroExaggeration,
      heroBoost,
      parityExaggeration
    });

    // Also push FR-window/light-crossing controls if present
    if (parameters.lightCrossing) {
      const lc = parameters.lightCrossing;
      const s = Math.max(1, Number(parameters.sectorStrobing ?? lc.sectorCount ?? parameters.sectors ?? 1));
      const lcPayload = {
        phase: lc.phase,
        onWindow: !!lc.onWindowDisplay,
        split: Math.max(0, (lc.sectorIdx ?? 0) % s),
        tauLC_ms: lc.tauLC_ms,
        dwell_ms: lc.dwell_ms,
        burst_ms: lc.burst_ms,
        sectors: s
      };
      pushLeft.current(paneSanitize('REAL', sanitizeUniforms(lcPayload)), 'REAL');
      pushRight.current(paneSanitize('SHOW', sanitizeUniforms(lcPayload)), 'SHOW');
    }

    // REAL: cosmetics only (don't touch wallWidth/cameraZ/amp)
    pushLeft.current(paneSanitize('REAL', sanitizeUniforms({
      exposure: real.exposure,
      zeroStop: real.zeroStop,
      colorMode: 2,             // pin shear proxy permanently for REAL
      ridgeMode: 0              // pin double-lobe physics mode
    })), 'REAL');

    // SHOW: can have live camera and display adjustments
    if (leftRef.current && rightRef.current) {
      const fixedCamZ = 1.8; // Fixed camera for SHOW only
      pushRight.current(paneSanitize('SHOW', sanitizeUniforms({ cameraZ: fixedCamZ, lockFraming: true })), 'SHOW');
    }
  }, [parameters, colorMode, lockFraming, heroBoost]);

  // 7.4 — Mirror strobing state from parameters.lightCrossing
  useEffect(() => {
    const lc = parameters?.lightCrossing;
    const total = Math.max(1, Math.floor(Number(parameters?.sectorCount) || 1));
    const live  = Math.max(1, Math.floor(Number(parameters?.sectors) || total));
    const cur   = Number.isFinite(lc?.sectorIdx) ? Math.max(0, Math.floor(lc.sectorIdx) % live) : 0;

    (window as any).setStrobingState?.({
      sectorCount: total,     // TOTAL only
      currentSector: cur,     // live pointer
      split: cur              // keep split aligned with current sector
    });
  }, [
    parameters?.sectorCount,
    parameters?.sectors,
    parameters?.lightCrossing?.sectorIdx
  ]);

  // DPR-aware sizing + resize observer (keeps "WebGL context — alive / Render loop — active")
  useEffect(() => {
    const onDpr = () => {
      if (!leftRef.current || !rightRef.current) return;
      const L = leftEngine.current, R = rightEngine.current;
      const { w: wL, h: hL } = sizeCanvas(leftRef.current);
      L?.gl?.viewport(0, 0, wL, hL);
      const { w: wR, h: hR } = sizeCanvas(rightRef.current);
      R?.gl?.viewport(0, 0, wR, hR);

      // Use batched redraws instead of immediate forceRedraw
      pushLeft.current?.({}, 'dpr-change');
      pushRight.current?.({}, 'dpr-change');
    };
    const mql = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    mql.addEventListener?.('change', onDpr);
    window.addEventListener('resize', onDpr);
    return () => {
      // Cleanup low-FPS timers
      try { if (leftEngine.current?.__lowFpsTimer) clearInterval(leftEngine.current.__lowFpsTimer); } catch {}
      try { if (rightEngine.current?.__lowFpsTimer) clearInterval(rightEngine.current.__lowFpsTimer); } catch {}

      mql.removeEventListener?.('change', onDpr);
      window.removeEventListener('resize', onDpr);
    };
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

  // Debug probe to verify physics parameters are changing with mode switches
  useEffect(() => {
    if (!leftEngine.current) return;

    // Add diagnostic function to window for debugging
    (window as any).__debugWarpEngines = () => {
      const leftState = leftEngine.current ? {
        isLoaded: leftEngine.current.isLoaded,
        hasProgram: !!(leftEngine.current as any)?.gridProgram,
        uniforms: (leftEngine.current as any)?.uniforms,
        isRendering: (leftEngine.current as any)?._raf !== null,
        canvas: {
          width: leftRef.current?.width,
          height: leftRef.current?.height,
          display: leftRef.current?.style.display
        }
      } : null;

      const rightState = rightEngine.current ? {
        isLoaded: rightEngine.current.isLoaded,
        hasProgram: !!(rightEngine.current as any)?.gridProgram,
        uniforms: (rightEngine.current as any)?.uniforms,
        isRendering: (rightEngine.current as any)?._raf !== null,
        canvas: {
          width: rightRef.current?.width,
          height: rightRef.current?.height,
          display: rightRef.current?.style.display
        }
      } : null;

      console.log('=== WARP ENGINE DEBUG ===');
      console.log('LEFT (REAL/Parity):', leftState);
      console.log('RIGHT (SHOW/Boosted):', rightState);

      // Try to force a render
      console.log('Attempting force render...');
      leftEngine.current?._render?.();
      rightEngine.current?._render?.();

      return { left: leftState, right: rightState };
    };

    // Also add a force restart function
    (window as any).__restartWarpEngines = () => {
      console.log('Force restarting warp engines...');
      leftEngine.current?.stop?.();
      rightEngine.current?.stop?.();
      setTimeout(() => {
        leftEngine.current?.start?.();
        rightEngine.current?.start?.();
        console.log('Engines restarted');
      }, 100);
    };

    // Simple debug output using parameters directly
    if (parameters) {
      console.log('[REAL] Physics from parameters:', {
        dutyFR: parameters.dutyEffectiveFR,
        dutyUI: parameters.dutyCycle,
        sectors: parameters.sectors,
        sectorCount: parameters.sectorCount,
        gammaGeo: parameters.gammaGeo,
        qSpoil: parameters.qSpoilingFactor
      });
    }
  }, [
    // deps that actually matter to physics
    parameters?.hull?.a, parameters?.hull?.b, parameters?.hull?.c,
    parameters?.wallWidth_m,
    parameters?.dutyCycle,
    parameters?.dutyEffectiveFR,
    parameters?.sectorCount,
    parameters?.sectors,
    parameters?.gammaGeo,
    parameters?.qSpoilingFactor,
    parameters?.gammaVanDenBroeck,
    colorMode, lockFraming
  ]);

  return loadError ? (
    <div className="p-4">
      <CanvasFallback
        title="WebGL could not start"
        reason={String(loadError)}
        onRetry={() => {
          try { (window as any).__forceReloadWarpEngine?.(); } catch {}
          window.location.reload();
        }}
      />
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-md overflow-hidden bg-black/40 flex flex-col"
           style={{ aspectRatio: '16 / 10', minHeight: 420 }}>
        <div className="px-2 py-1 text-xs font-mono text-slate-300 shrink-0">{realPanelTitle}</div>
        <div className="relative flex-1">
          <canvas
            ref={leftRef}
            className="absolute inset-0 w-full h-full block touch-manipulation select-none"
            style={{ background: '#000' }}
          />
        </div>
      </div>
      <div className="rounded-md overflow-hidden bg-black/40 flex flex-col"
           style={{ aspectRatio: '16 / 10', minHeight: 420 }}>
        <div className="px-2 py-1 text-xs font-mono text-slate-300 shrink-0">{showPanelTitle}</div>
        <div className="relative flex-1">
          <canvas
            ref={rightRef}
            className="absolute inset-0 w-full h-full block touch-manipulation select-none"
            style={{ background: '#000' }}
          />
        </div>
      </div>={{ background: '#111' }}
          />
        </div>
      </div>
    </div>
  );
}