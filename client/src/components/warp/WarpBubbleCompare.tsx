'use client';

import React, { useEffect, useRef } from "react";

// Build token: read lazily so SSR never touches `window`
const getAppBuild = () =>
  (typeof window !== 'undefined' && (window as any).__APP_WARP_BUILD) || 'dev';

// --- resilient uniform push helpers ---
const CM = { solid: 0, theta: 1, shear: 2 };
const finite = (x: any, d: number) => (Number.isFinite(+x) ? +x : d);

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
  const reinitInFlight = useRef<Promise<void> | null>(null);

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

        let eng: any;
        try {
          eng = new Ctor(cv);
        } catch (err: any) {
          const msg = String(err?.message || err).toLowerCase();
          if (msg.includes('already attached')) {
            // Another call won the race; reuse the survivor
            if (hasLiveEngine(cv)) return (cv as any)[ENGINE_KEY] as WarpType;
          }
          throw err;
        }
        (cv as any)[ENGINE_KEY] = eng;
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
    const { real, show } = buildEngineUniforms({
      hull: p.hull,
      wallWidth_m: p.wallWidth_m ?? 6.0,
      driveDir: p.driveDir ?? [1,0,0],
      vShip: p.vShip ?? 1.0,
      dutyCycle: p.dutyCycle,
      dutyEffectiveFR: p.dutyEffectiveFR,
      sectorCount: Math.max(1, p.sectorCount),
      sectors: Math.max(1, p.sectors),
      gammaGeo: p.gammaGeo,
      qSpoilingFactor: p.qSpoilingFactor ?? 1,
      gammaVanDenBroeck: p.gammaVanDenBroeck ?? 2.86e5,
      colorMode: 'theta',
      lockFraming: true,
    });
    return { real, show };
  }

  // Full re-init using current parameters + camera + strobing
  async function reinitEnginesFromParams() {
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
      eng.updateUniforms?.(uniforms);
      eng.isLoaded = true;
      if (!eng._raf && typeof eng._renderLoop === 'function') eng._renderLoop();
      eng.start?.();

      // keep sized
      const ro = new ResizeObserver(() => {
        const { w: w2, h: h2 } = sizeCanvas(cv);
        eng.gl.viewport(0, 0, w2, h2);
        eng.resize?.(w2, h2);
      });
      ro.observe(cv);
      eng.__ro = ro;
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
      dutyEffectiveFR: real.dutyEffectiveFR ?? real.dutyEff ?? real.dutyFR,
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

    // 4) Init both engines with fresh packets
    leftEngine.current  = await initOne(leftRef.current,  realPacket);
    rightEngine.current = await initOne(rightRef.current, showPacket);

    // 5) Deterministic camera for both panes
    const camZ = safeCamZ(compactCameraZ(leftRef.current!, shared.axesScene as [number,number,number]));
    pushSafe(leftEngine,  { cameraZ: camZ, lockFraming: true });
    pushSafe(rightEngine, { cameraZ: camZ, lockFraming: true });

    // 6) Ensure strobe mux exists, then re-broadcast strobing from the LC loop carried in parameters
    ensureStrobeMux();
    const lc = parameters.lightCrossing;
    if (lc) {
      const total = Math.max(1, Number(parameters.sectorCount) || 1);
      const live  = Math.max(1, Number(parameters.sectors) || total);
      const cur   = Math.max(0, Math.floor(lc.sectorIdx || 0) % live);
      (window as any).setStrobingState?.({ sectorCount: total, currentSector: cur, split: cur });
    }

    leftEngine.current?.forceRedraw?.();
    rightEngine.current?.forceRedraw?.();
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

    // REAL (parity / Ford–Roman)
    pushSafe(leftEngine, {
      ...shared,
      gridSpan: gridSpanReal,            // tight framing around hull
      ...real,
      currentMode: parameters.currentMode,
      physicsParityMode: true,
      ridgeMode: 0,
      vShip: 0,                          // never "fly" in REAL
      // strictly physical: no boosts, no gains, wall to ρ-units
      userGain: 1,
      displayGain: 1,
      curvatureGainT: 0,
      curvatureBoostMax: 1,
      wallWidth_rho: wallWidth_rho,      // ⟵ key: ρ-units for shader pulse
      gammaVdB: real.gammaVanDenBroeck ?? real.gammaVdB,
      deltaAOverA: real.qSpoilingFactor,
      dutyEffectiveFR: real.dutyEffectiveFR ?? real.dutyEff ?? real.dutyFR,
      sectors: Math.max(1, parameters.sectors),
      colorMode: 2,                      // shear proxy is a clear "truth" view
      cameraZ: camZ,                     // ⟵ key: to-scale camera
    });

    // SHOW (UI)
    const showTheta = parameters.currentMode === 'standby'
      ? 0
      : Math.max(1e-6, show.thetaScale || 0);

    pushSafe(rightEngine, {
      ...shared,
      ...show,
      currentMode: parameters.currentMode,
      physicsParityMode: false,
      ridgeMode: 1,
      vShip: parameters.currentMode === 'standby' ? 0 : 1,
      thetaScale: showTheta,
      gammaVdB: show.gammaVanDenBroeck ?? show.gammaVdB,
      deltaAOverA: show.qSpoilingFactor,
      sectors: Math.max(1, parameters.sectors),
      // SHOW camera can share the same camZ for easy side-by-side comparison
      cameraZ: camZ
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

    // REAL: cosmetics only (don't touch wallWidth/cameraZ/amp)
    pushSafe(leftEngine, {
      exposure: real.exposure,
      zeroStop: real.zeroStop,
      colorMode: 2,             // pin shear proxy permanently for REAL
      ridgeMode: 0              // pin double-lobe physics mode
    });

    // SHOW: can have live camera and display adjustments
    if (leftRef.current && rightRef.current) {
      const fixedCamZ = 1.8; // Fixed camera for SHOW only
      pushSafe(rightEngine, { cameraZ: fixedCamZ, lockFraming: true });
    }

    // Apply safe display gain for SHOW pane - purely visual, doesn't affect physics
    const displayGain = Math.max(1, (1) * (heroX ? 1 + 0.5*Math.log10(Math.max(1, heroX)) : 1));
    rightEngine.current.setDisplayGain?.(displayGain);
  }, [parameters, colorMode, lockFraming, heroX]);

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