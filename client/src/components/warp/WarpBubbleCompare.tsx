'use client';

import React, { useEffect, useRef } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

// Build token: read lazily so SSR never touches `window`
const getAppBuild = () =>
  (typeof window !== 'undefined' && (window as any).__APP_WARP_BUILD) || 'dev';

// --- resilient uniform push helpers ---
const CM = { solid: 0, theta: 1, shear: 2 };
const finite = (x: any, d: number) => (Number.isFinite(+x) ? +x : d);

// Engine mounting helper functions
const ensureScript = () =>
  new Promise<void>((resolve, reject) => {
    if ((window as any).WarpEngine) return resolve();
    const s = document.createElement('script');
    s.src = '/warp-engine.js'; s.defer = true; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });

function sizeCanvas(cv: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = cv.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width  * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  cv.width = w; cv.height = h;
  return { w, h };
}

function sanitizeUniforms(u: any = {}) {
  const s = { ...u };

  // numeric coercions + clamps
  s.thetaScale        = Math.max(1e-12,  finite(s.thetaScale,        1));
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
  if (typeof s.colorMode === 'string') s.colorMode = CM[s.colorMode] ?? 1;
  s.ridgeMode = Math.max(0, Math.min(1, Math.floor(finite(s.ridgeMode, 0))));

  // hull normalization (drop invalid)
  if (s.hull) {
    const a = finite(s.hull.a, NaN), b = finite(s.hull.b, NaN), c = finite(s.hull.c, NaN);
    if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c)) s.hull = { a, b, c };
    else delete s.hull;
  }

  return s;
}

function pushSafe(engineRef: React.MutableRefObject<any>, patch: any) {
  const e = engineRef?.current;
  if (!e) return;
  const clean = sanitizeUniforms(patch);
  if (!e.isLoaded || !e.gridProgram) {
    e.onceReady(() => { e.updateUniforms(clean); e.forceRedraw?.(); });
  } else {
    e.updateUniforms(clean);
    e.forceRedraw?.();
  }
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

// Build a live subtitle for a mode (power • mass • zeta)
const buildLiveDesc = (
  snap?: { P_avg_MW?: number; M_exotic_kg?: number; zeta?: number },
  cfg?: { powerTarget_W?: number }
) => {
  const P = formatPower(snap?.P_avg_MW, cfg?.powerTarget_W);
  const M = Number.isFinite(snap?.M_exotic_kg) ? `${snap!.M_exotic_kg!.toFixed(0)} kg` : "— kg";
  const Z = Number.isFinite(snap?.zeta) ? `ζ=${snap!.zeta!.toFixed(3)}` : "ζ=—";
  return `${P} • ${M} • ${Z}`;
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

  // physics chain
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
  const dutySqrt = Math.sqrt(Math.max(1e-12, duty));    // √(duty) ; sectors already averaged in "duty" above

  return g3 * dAA * gVdB * dutySqrt;
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
    viewAvg: true,

    // visual defaults
    colorMode: base.colorMode ?? 'theta',
    lockFraming: base.lockFraming ?? true,
  };
}

export function buildEngineUniforms(base: BaseInputs) {
  const common = buildCommonUniforms(base);
  const real = {
    ...common,
    thetaScale: buildThetaScale(base, 'fr'),
    physicsParityMode: true,
    ridgeMode: 0,          // ⚠ physics double-lobe (real)
    exposure: 4.2,
    zeroStop: 1e-6,
    cosmeticLevel: 1,
    curvatureGainT: 0,
    curvatureBoostMax: 1,
    userGain: 1,
  };
  const show = {
    ...common,
    thetaScale: buildThetaScale(base, 'ui'),
    physicsParityMode: false,
    ridgeMode: 1,          // single crest at ρ=1 (show)
    exposure: 7.5,
    zeroStop: 1e-7,
    cosmeticLevel: 10,
    // these two can be driven by your "heroExaggeration"/slider
    curvatureGainT: 0.70,
    curvatureBoostMax: 40,
    userGain: 4.0,
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

async function ensureWarpEngineCtor(opts: { requiredBuild?: string; forceReload?: boolean } = {}): Promise<any> {
  const { requiredBuild = getAppBuild(), forceReload = false } = opts;
  const w = window as any;
  const currentBuild = w.WarpEngine?.BUILD || w.__WarpEngineBuild;
  const mismatch = currentBuild && requiredBuild && currentBuild !== requiredBuild;

  if (w.WarpEngine && !forceReload && !mismatch && requiredBuild !== 'dev') {
    console.log('[WARP LOADER] Reusing WarpEngine', { build: currentBuild });
    return w.WarpEngine.default || w.WarpEngine;
  }

  console.log('[WARP LOADER] Loading WarpEngine', { requiredBuild, forceReload });

  // 👉 blow away old script + SW caches when needed
  if (mismatch || forceReload) {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((regs || []).map(r => r.unregister()));
      console.log('[WARP LOADER] Unregistered service workers:', (regs || []).length);
    } catch (e) {
      console.warn('[WARP LOADER] Service worker cleanup failed:', e);
    }
    // remove existing script tags so the new one executes
    Array.from(document.querySelectorAll('script[src*="warp-engine.js"]')).forEach(n => n.remove());
  }

  // Load script with proper asset path resolution
  const assetBase = resolveAssetBase();
  const mk = (p: string) => {
    try { return new URL(p, assetBase).toString(); } catch { return p; }
  };
  const devBust = requiredBuild === 'dev' ? `&t=${Date.now()}` : '';
  const url = mk(`warp-engine.js?v=${encodeURIComponent(requiredBuild)}${devBust}`);
  await loadScript(url);

  const Ctor = w.WarpEngine?.default || w.WarpEngine;
  if (Ctor) {
    w.__WarpEngineBuild = w.WarpEngine?.BUILD || requiredBuild;
    console.log('[WARP LOADER] Loaded WarpEngine', { build: w.__WarpEngineBuild });
    return Ctor;
  }
  throw new Error('WarpEngine constructor not found after reload');
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

function applyShowSafe(e:any, payload:any) {
  if (!e) return;
  let applied = false;
  const recheck = () => {
    const anyVerts = (e?.gridVertices?.length || 0) + (e?.originalGridVertices?.length || 0);
    const ready = anyVerts > 0 && Number.isFinite(e?.uniforms?.cameraZ);
    if (!ready && !applied) {
      applied = true;
      const clean = sanitizeUniforms({ cosmeticLevel: 0, exposure: 5.5, vizGain: 1.0 });
      if (e.isLoaded && e.gridProgram) {
        e.updateUniforms(clean);
      } else {
        e.onceReady?.(() => e.updateUniforms(clean));
      }
      e.setDisplayGain?.(1);
      console.warn('[SHOW] cosmetics disabled as safety fallback');
    } else if (ready && applied) {
      // re-apply SHOW once; use whatever you computed in applyShow
      const clean = sanitizeUniforms(payload);
      if (e.isLoaded && e.gridProgram) {
        e.updateUniforms(clean);
      } else {
        e.onceReady?.(() => e.updateUniforms(clean));
      }
      console.log('[SHOW] re-applied boosted settings after grid ready');
    }
  };
  requestAnimationFrame(recheck);
  setTimeout(recheck, 120); // belt & suspenders
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

/* ---------------- Overlay scrub (kills demo/ref/instant paths) ---------------- */
function scrubOverlays(e: any) {
  if (!e?.uniforms || !e.updateUniforms) return;
  const u = e.uniforms;
  const patch: any = {};

  // Prefer calibrated geometry only
  if ('modelMode' in u) patch.modelMode = 'calibrated';

  for (const k of Object.keys(u)) {
    // Only nuke obvious "reference overlays"
    if (/(ref|reference).*(hull|ring|layer|alpha)/i.test(k)) patch[k] = 0;
    // Keep average view on, but don't touch displacement gates
    if (/avg|showAvg|viewAvg/i.test(k)) patch[k] = 1;
  }

  // Make sure we don't accidentally switch cameras by reusing hull
  if ('hullAxes' in u && !patch.hullAxes) patch.hullAxes = u.hullAxes;
  if ('axesScene' in u && !patch.axesScene) patch.axesScene = u.axesScene;

  e.updateUniforms(patch);
}

/* ---------------- Safe uniform push with compatibility shim ---------------- */
function compatifyUniforms(raw: any) {
  const p = { ...(raw || {}) };

  // Enhanced color mode compatibility - normalize to numeric
  const map: any = { solid: 0, theta: 1, shear: 2 };
  if (typeof p.colorMode === 'string') p.colorMode = map[p.colorMode] ?? 0;
  if (!Number.isFinite(p.colorMode) && Number.isFinite(p.colorModeIndex)) p.colorMode = p.colorModeIndex;
  if (p.colorModeName == null && typeof raw?.colorMode === 'string') p.colorModeName = raw.colorMode;
  if (p.colorModeIndex == null && Number.isFinite(p.colorMode)) p.colorModeIndex = p.colorMode;

  // Sector/strobe synonyms
  if (Number.isFinite(p.sectors)) {
    p.sectorCount = p.sectorCount ?? p.sectors;
  }
  if (Number.isFinite(p.sectorIdx)) {
    p.currentSector = p.currentSector ?? p.sectorIdx;
    p.sectorIndex   = p.sectorIndex   ?? p.sectorIdx;
  }
  if (Number.isFinite(p.split)) {
    p.sectorSplit = p.sectorSplit ?? p.split;
  }

  // Gain/boost synonyms
  if (p.curvatureGainT != null) {
    p.gainT      = p.gainT      ?? p.curvatureGainT;
    p.thetaGainT = p.thetaGainT ?? p.curvatureGainT;
  }
  if (p.curvatureBoostMax != null) {
    p.boostMax = p.boostMax ?? p.curvatureBoostMax;
  }
  if (p.curvatureGainDec != null) {
    p.gainDec   = p.gainDec   ?? p.curvatureGainDec;
    p.gainDecs  = p.gainDecs  ?? p.curvatureGainDec;
    p.gainDecades = p.gainDecades ?? p.curvatureGainDec;
  }

  // Exposure synonyms
  if (p.exposure != null) {
    p.exposureEV = p.exposureEV ?? p.exposure;
  }

  // Camera synonyms
  if (p.cameraZ != null) {
    p.camZ = p.camZ ?? p.cameraZ;
  }

  // Parity synonyms
  if (p.physicsParityMode != null) {
    p.parityMode = p.parityMode ?? p.physicsParityMode;
    p.isParity   = p.isParity   ?? p.physicsParityMode;
  }

  return p;
}


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
        e.updateUniforms(clean);
      } else {
        e.onceReady?.(() => e.updateUniforms(clean));
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
    // Force numeric (engine canonical) + provide synonyms
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
  // Physics parameters are now handled directly from props.parameters in useEffect

  // Optional: set per-pane display gain
  const parityX = parityExaggeration ?? 1;
  const heroX = heroExaggeration ?? 82;

  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const leftEngine = useRef<any>(null);
  const rightEngine = useRef<any>(null);

  // Live pipeline snapshot (same hook used by Energy Control panel)
  const { data: live } = useEnergyPipeline();

  // tolerant extraction – supports live.byMode, live.modes, or flat legacy shapes
  const liveForMode = (key: ModeKey) =>
    (live?.byMode && live.byMode[key]) ||
    (live?.modes && live.modes[key]) ||
    (live && (live as any)[key]) || null;

  // current UI mode key (fallback to 'hover')
  const currentModeKey = ((live?.currentMode as ModeKey) || "hover") as ModeKey;

  // optional: read UI configs if present on window; safe fallback to empty
  const modeCfgs: Record<string, { name?: string; powerTarget_W?: number }> =
    (typeof window !== "undefined" && (window as any).MODE_CONFIGS) || {};

  const currentSnap = liveForMode(currentModeKey);
  const currentCfg = modeCfgs[currentModeKey];
  const currentSubtitle = buildLiveDesc(currentSnap, currentCfg);

  // Titles for the two panels
  const realPanelTitle = `REAL • ${currentSubtitle}`;   // parity/FR view
  const showPanelTitle = `SHOW • ${currentSubtitle}`;   // boosted/UI view

  // 7.1 — Live → Uniforms mapping helpers
  type LiveSnap = Partial<{
    // physics / timing
    dutyCycle: number;
    sectorCount: number; sectorStrobing: number; sectors: number;
    sectorSplit: number; split: number; currentSector: number;
    gammaGeo: number; g_y: number;
    deltaAOverA: number; qSpoilingFactor: number;
    gammaVdB: number; gammaVanDenBroeck: number;
    viewAvg: boolean;

    // geometry
    hullAxes: [number, number, number];
    hull: { a: number; b: number; c: number };
    wallWidth_m: number; wallWidth_rho: number;
    driveDir: [number, number, number];

    // viz
    curvatureGainT: number; curvatureBoostMax: number;
    exposure: number; zeroStop: number; cosmeticLevel: number;
    ridgeMode: number; colorMode: number | "theta" | "shear" | "solid";
    userGain: number; displayGain: number; lockFraming: boolean; cameraZ: number;
  }>;

  const N = (x: any, d = 0) => (Number.isFinite(x) ? +x : d);
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  // Reuse-or-create guard so we never attach twice to the same canvas
  const ENGINE_KEY = '__warpEngine';

  function getOrCreateEngine<WarpType = any>(Ctor: new (c: HTMLCanvasElement) => WarpType, cv: HTMLCanvasElement): WarpType {
    const existing = (cv as any)[ENGINE_KEY];
    if (existing && !existing._destroyed) return existing as WarpType;
    const eng = new Ctor(cv);
    (cv as any)[ENGINE_KEY] = eng;
    return eng;
  }

  // Compute θ-scale (γ^3 · ΔA/A · γ_VdB · √(duty/sectors)) if not provided
  const computeThetaScale = (v: LiveSnap) => {
    const gammaGeo = N(v.gammaGeo ?? (v as any).g_y, 26);
    const dAa = N(v.deltaAOverA ?? (v as any).qSpoilingFactor, 1);
    const gammaVdB = N(v.gammaVdB ?? (v as any).gammaVanDenBroeck, 2.86e5);
    const sectors = Math.max(1, Math.floor(N(v.sectorCount ?? v.sectorStrobing ?? v.sectors, 1)));
    const duty = Math.max(0, N(v.dutyCycle, 0));
    const viewAvg = (v.viewAvg ?? true) ? 1 : 0;
    const betaInst = Math.pow(Math.max(1, gammaGeo), 3) * Math.max(1e-12, dAa) * Math.max(1, gammaVdB);
    const effDuty = Math.max(1e-12, duty / sectors);
    return viewAvg ? betaInst * Math.sqrt(effDuty) : betaInst;
  };

  const toSharedUniforms = (snap: LiveSnap) => {
    // hull → axesClip is computed in engine, but we pass meters for authority
    const a = N(snap.hull?.a ?? snap.hullAxes?.[0], 503.5);
    const b = N(snap.hull?.b ?? snap.hullAxes?.[1], 132.0);
    const c = N(snap.hull?.c ?? snap.hullAxes?.[2], 86.5);
    return {
      hullAxes: [a, b, c] as [number, number, number],
      wallWidth_m: Number.isFinite(snap.wallWidth_m) ? snap.wallWidth_m : undefined,
      wallWidth_rho: Number.isFinite(snap.wallWidth_rho) ? snap.wallWidth_rho : undefined,
      driveDir: (Array.isArray(snap.driveDir) && snap.driveDir.length === 3) ? snap.driveDir : [1, 0, 0],

      // strobing/sectoring values (also mirrored to the global strobe mux below)
      dutyCycle: N(snap.dutyCycle, 0.14),
      sectors: Math.max(1, Math.floor(N(snap.sectorStrobing ?? snap.sectors, 1))),
      sectorCount: Math.max(1, Math.floor(N(snap.sectorCount ?? 1, 1))),
      split: Math.max(0, Math.floor(N(snap.sectorSplit ?? snap.split ?? snap.currentSector, 0))),
      viewAvg: !!(snap.viewAvg ?? true),

      // physics chain
      gammaGeo: N(snap.gammaGeo ?? (snap as any).g_y, 26),
      deltaAOverA: N(snap.deltaAOverA ?? (snap as any).qSpoilingFactor, 1),
      gammaVdB: N(snap.gammaVdB ?? (snap as any).gammaVanDenBroeck, 2.86e5),

      // θ-scale (engine will compute if omitted; we compute explicitly for parity)
      thetaScale: computeThetaScale(snap),

      // camera/framing passthroughs if present
      lockFraming: snap.lockFraming ?? true,
      cameraZ: Number.isFinite(snap.cameraZ) ? snap.cameraZ : undefined,
    };
  };

  const toRealUniforms = (snap: LiveSnap) => ({
    ...toSharedUniforms(snap),
    physicsParityMode: true,
    ridgeMode: 0,
    colorMode: 2,          // shear is a nice truth default; change if you prefer
    exposure: 3.5,
    zeroStop: 1e-5,
    curvatureGainT: 0.0,
    curvatureBoostMax: 1.0,
    userGain: 1.0,
    vizGain: 1.0,
    vShip: 0.0,                       // REAL: never "fly"
  });

  const toShowUniforms = (snap: LiveSnap) => {
    const T = clamp01(N(snap.curvatureGainT, 0.6));
    const B = Math.max(1, N(snap.curvatureBoostMax, 40));
    const isStandby = String(snap.currentMode || '').toLowerCase() === 'standby';
    return {
      ...toSharedUniforms(snap),
      physicsParityMode: false,
      ridgeMode: 1,
      colorMode: 1,       // theta diverging palette
      exposure: N(snap.exposure, 6.0),
      zeroStop: N(snap.zeroStop, 1e-7),
      curvatureGainT: isStandby ? 0 : T,
      curvatureBoostMax: isStandby ? 1 : B,
      userGain: isStandby ? 1 : N(snap.userGain, 4.0),
      vizGain: isStandby ? 1 : 1.0,
      vShip: isStandby ? 0.0 : N((snap as any).vShip, 1.0),  // SHOW can "fly", but not in standby
      displayGain: isStandby ? 1 : (1 + T * (B - 1)),
    };
  };

  // 7.2 — Choose the live snapshot for the current mode (byMode or flat)
  const snapAll = live?.byMode ?? live?.modes ?? null;
  const snapForMode: LiveSnap = (snapAll && (snapAll as any)[currentModeKey]) || (live as any) || {};

  const roRef = useRef<ResizeObserver | null>(null);
  const busyRef = useRef<boolean>(false);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;

    if (!left || !right) return;

    let cancelled = false;
    const kill = (ref: any) => {
      const e = ref.current;
      if (!e) return;
      e.__ro?.disconnect?.();
      e.stop?.();
      e.dispose?.();
      ref.current = null;
    };

    (async () => {
      await ensureScript();
      const W = (window as any).WarpEngine;
      if (!W) { console.error('[Warp] engine script not available'); return; }

      // idempotent (React StrictMode)
      kill(leftEngine); kill(rightEngine);

      const initOne = async (cv: HTMLCanvasElement, uniforms: any) => {
        const eng = getOrCreateEngine(W, cv);           // reuse existing or create new engine
        const { w, h } = sizeCanvas(cv);
        eng.gl.viewport(0, 0, w, h);

        // Fallback init if constructor didn't prepare grid/shaders
        try { eng._initializeGrid?.(); } catch {}
        try { eng._compileGridShaders?.(); } catch {}

        // Wait until program + VBO exist (handles async shader path)
        await new Promise<void>((resolve) => {
          const tick = () => {
            if (eng.gridProgram && eng.gridVbo && eng._vboBytes > 0) return resolve();
            requestAnimationFrame(tick);
          };
          tick();
        });

        // Push initial uniforms (parity/cosmetics set in toReal/toShow)
        eng.updateUniforms?.(uniforms);
        eng.isLoaded = true;             // satisfies checkpoints' "Engine ready"

        // Start render loop if engine doesn't auto-run
        if (!eng._raf && typeof eng._renderLoop === 'function') eng._renderLoop();
        eng.start?.(); // if you added start()

        // Keep canvas sized
        const ro = new ResizeObserver(() => {
          const { w, h } = sizeCanvas(cv);
          eng.gl.viewport(0, 0, w, h);
          eng.resize?.(w, h);
        });
        ro.observe(cv);
        eng.__ro = ro;
        return eng;
      };

      if (cancelled) return;

      // Build initial uniform packets for each side
      const baseSnap = snapForMode ?? {};
      const realU = toRealUniforms(baseSnap);
      const showU = toShowUniforms(baseSnap);

      leftEngine.current  = await initOne(left,  realU);
      rightEngine.current = await initOne(right, showU);
    })();

    return () => {
      cancelled = true;
      kill(leftEngine);
      kill(rightEngine);

      // Robust cleanup for HMR/StrictMode
      try {
        if ((left as any)[ENGINE_KEY] && !(left as any)[ENGINE_KEY]._destroyed) {
          (left as any)[ENGINE_KEY].destroy?.();
        }
        delete (left as any)[ENGINE_KEY];
      } catch {}

      try {
        if ((right as any)[ENGINE_KEY] && !(right as any)[ENGINE_KEY]._destroyed) {
          (right as any)[ENGINE_KEY].destroy?.();
        }
        delete (right as any)[ENGINE_KEY];
      } catch {}
    };
    // IMPORTANT: keep deps minimal; do not include uniforms objects that change every tick
  }, [leftRef.current, rightRef.current]);

  // Use props.parameters directly instead of re-deriving from stale snapshots
  useEffect(() => {
    if (!leftEngine.current || !rightEngine.current || !parameters) return;

    // build both payloads from the SAME source of truth
    const { real, show } = buildEngineUniforms({
      hull: parameters.hull,
      wallWidth_m: parameters.wallWidth_m ?? 6.0,
      driveDir: parameters.driveDir ?? [1,0,0],
      vShip: parameters.vShip ?? 1.0,

      dutyCycle: parameters.dutyCycle,
      dutyEffectiveFR: parameters.dutyEffectiveFR, // ship-wide FR duty from parent (lc loop)

      sectorCount: Math.max(1, parameters.sectorCount),
      sectors: Math.max(1, parameters.sectors),

      gammaGeo: parameters.gammaGeo,
      qSpoilingFactor: parameters.qSpoilingFactor ?? 1,
      gammaVanDenBroeck: parameters.gammaVanDenBroeck ?? 2.86e5,

      colorMode: colorMode ?? 'theta',
      lockFraming: lockFraming ?? true,
    });

    // Build shared geometry data
    const shared = frameFromHull(parameters.hull, parameters.gridSpan || 2.6);

    // REAL (parity / Ford–Roman)
    pushSafe(leftEngine, {
      ...shared,
      ...real,
      physicsParityMode: true,
      gammaVdB: real.gammaVanDenBroeck ?? real.gammaVdB,
      deltaAOverA: real.qSpoilingFactor,
      dutyEffectiveFR: real.dutyEffectiveFR ?? real.dutyEff ?? real.dutyFR,
      sectors: Math.max(1, parameters.sectors),
      ridgeMode: 0,
    });

    // SHOW (UI)
    pushSafe(rightEngine, {
      ...shared,
      ...show,
      physicsParityMode: false,
      gammaVdB: show.gammaVanDenBroeck ?? show.gammaVdB,
      deltaAOverA: show.qSpoilingFactor,
      sectors: Math.max(1, parameters.sectors),
      ridgeMode: 1,
    });

    // Force a draw so the user sees the change immediately
    leftEngine.current.forceRedraw?.();
    rightEngine.current.forceRedraw?.();

    // optional: quick console check
    console.log('[WBC] uniforms applied', {
      real_thetaScale: real.thetaScale,
      show_thetaScale: show.thetaScale,
      sectors: real.sectors, sectorCount: real.sectorCount,
      dutyFR: parameters.dutyEffectiveFR,
      dutyUI: parameters.dutyCycle
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
      pushSafe(leftEngine,  lcPayload);
      pushSafe(rightEngine, lcPayload);
    }

    // Apply safe display gain for SHOW pane - purely visual, doesn't affect physics
    const displayGain = Math.max(1, (1) * (heroX ? 1 + 0.5*Math.log10(Math.max(1, heroX)) : 1));
    rightEngine.current.setDisplayGain?.(displayGain);
  }, [parameters, colorMode, lockFraming, heroX]);

  // 7.3 — Push uniforms into both engines whenever live values change
  useEffect(() => {
    if (!leftEngine.current || !rightEngine.current) return;

    const realU = toRealUniforms(snapForMode);
    const showU = toShowUniforms(snapForMode);

    // REAL (parity)
    pushSafe(leftEngine, realU);

    // SHOW (boosted)
    pushSafe(rightEngine, showU);
    // Optional: also set display gain explicitly on the instance
    rightEngine.current.setDisplayGain?.(N(showU.displayGain, 1));

    // Camera nudge: if you track a shared axesScene span, you can enforce a safe cameraZ
    // (kept conservative by default; uncomment if you have helpers like compactCameraZ/safeCamZ)
    // const axesScene = leftEngine.current?.uniforms?.axesClip || rightEngine.current?.uniforms?.axesClip;
    // const z = safeCamZ(compactCameraZ(leftRef.current!, axesScene));
    // pushSafe(leftEngine,  { cameraZ: z });
    // pushSafe(rightEngine, { cameraZ: z });
  }, [
    leftEngine.current, rightEngine.current,
    // physics chain
    snapForMode?.gammaGeo, snapForMode?.gammaVdB, (snapForMode as any)?.g_y,
    snapForMode?.deltaAOverA, (snapForMode as any)?.qSpoilingFactor,
    snapForMode?.dutyCycle, snapForMode?.sectorCount, snapForMode?.sectorStrobing,
    snapForMode?.sectors, snapForMode?.sectorSplit, snapForMode?.split, snapForMode?.currentSector,
    snapForMode?.viewAvg,
    // geometry
    snapForMode?.hullAxes?.[0], snapForMode?.hullAxes?.[1], snapForMode?.hullAxes?.[2],
    snapForMode?.hull?.a, snapForMode?.hull?.b, snapForMode?.hull?.c,
    snapForMode?.wallWidth_m, snapForMode?.wallWidth_rho,
    // viz
    snapForMode?.curvatureGainT, snapForMode?.curvatureBoostMax,
    snapForMode?.exposure, snapForMode?.zeroStop, snapForMode?.userGain,
    snapForMode?.displayGain,
    live?.currentMode
  ]);

  // 7.4 — Mirror strobing (sectoring) to the global mux that WarpEngine listens to
  useEffect(() => {
    const sTotal = Math.max(1, Math.floor(N(snapForMode?.sectorCount ?? 1, 1)));
    const sLive  = Math.max(1, Math.floor(N(snapForMode?.sectorStrobing ?? snapForMode?.sectors ?? sTotal, sTotal)));
    const cur    = Math.max(0, Math.floor(N(snapForMode?.currentSector ?? 0, 0)) % sLive);
    const split  = Math.max(0, Math.min(sLive - 1, Math.floor(N(snapForMode?.sectorSplit ?? snapForMode?.split ?? cur, cur))));
    (window as any).setStrobingState?.({ sectorCount: sTotal, currentSector: cur, split });
  }, [snapForMode?.sectorCount, snapForMode?.sectorStrobing, snapForMode?.sectors, snapForMode?.currentSector, snapForMode?.sectorSplit, snapForMode?.split]);

  // DPR-aware sizing + resize observer (keeps "WebGL context — alive / Render loop — active")
  useEffect(() => {
    const onDpr = () => {
      if (!leftRef.current || !rightRef.current) return;
      const L = leftEngine.current, R = rightEngine.current;
      const { w: wL, h: hL } = sizeCanvas(leftRef.current);
      L?.gl?.viewport(0, 0, wL, hL); L?.forceRedraw?.();
      const { w: wR, h: hR } = sizeCanvas(rightRef.current);
      R?.gl?.viewport(0, 0, wR, hR); R?.forceRedraw?.();
    };
    const mql = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    mql.addEventListener?.('change', onDpr);
    window.addEventListener('resize', onDpr);
    return () => {
      mql.removeEventListener?.('change', onDpr);
      window.removeEventListener('resize', onDpr);
    };
  }, []);

  // Debug probe to verify physics parameters are changing with mode switches
  useEffect(() => {
    if (!leftEngine.current) return;
    
    // Add diagnostic function to window for debugging
    (window as any).__debugWarpEngines = () => {
      const leftState = leftEngine.current ? {
        isLoaded: leftEngine.current.isLoaded,
        hasProgram: !!leftEngine.current.gridProgram,
        uniforms: leftEngine.current.uniforms,
        isRendering: leftEngine.current._raf !== null,
        canvas: {
          width: leftRef.current?.width,
          height: leftRef.current?.height,
          display: leftRef.current?.style.display
        }
      } : null;
      
      const rightState = rightEngine.current ? {
        isLoaded: rightEngine.current.isLoaded,
        hasProgram: !!rightEngine.current.gridProgram,
        uniforms: rightEngine.current.uniforms,
        isRendering: rightEngine.current._raf !== null,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-md overflow-hidden bg-black/40" style={{ aspectRatio: '16 / 10', minHeight: '320px' }}>
        <div className="px-2 py-1 text-xs font-mono text-slate-300">{realPanelTitle}</div>
        <canvas 
          ref={leftRef} 
          className="w-full h-[calc(100%-32px)] block" 
          style={{ background: '#111', display: 'block' }} 
        />
      </div>
      <div className="rounded-md overflow-hidden bg-black/40" style={{ aspectRatio: '16 / 10', minHeight: '320px' }}>
        <div className="px-2 py-1 text-xs font-mono text-slate-300">{showPanelTitle}</div>
        <canvas 
          ref={rightRef} 
          className="w-full h-[calc(100%-32px)] block" 
          style={{ background: '#111', display: 'block' }} 
        />
      </div>
    </div>
  );
}