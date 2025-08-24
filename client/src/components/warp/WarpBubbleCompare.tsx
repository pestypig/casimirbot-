import React, { useEffect, useRef } from "react";

// Use the build token stamped at app boot
const APP_WARP_BUILD = (window as any).__APP_WARP_BUILD || Date.now().toString();

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
  const { requiredBuild = APP_WARP_BUILD, forceReload = false } = opts;
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
  const url = mk(`warp-engine.js?v=${encodeURIComponent(requiredBuild)}&t=${Date.now()}`);
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
      pushUniformsWhenReady(e, { cosmeticLevel: 0, exposure: 5.5, vizGain: 1.0 });
      e.setDisplayGain?.(1);
      console.warn('[SHOW] cosmetics disabled as safety fallback');
    } else if (ready && applied) {
      // re-apply SHOW once; use whatever you computed in applyShow
      pushUniformsWhenReady(e, payload);
      console.log('[SHOW] re-applied boosted settings after grid ready');
    }
  };
  requestAnimationFrame(recheck);
  setTimeout(recheck, 120); // belt & suspenders
}

/* ---------------- Physics scalar helpers ---------------- */
import { resolveThetaScale, type DutySource } from '@/lib/warp-theta';

function physicsPayload(p: any, dutySource: DutySource = 'fr') {
  return {
    // the scalar the engine/shader both expect
    thetaScale: resolveThetaScale(p, dutySource),

    // pieces (the CPU path in WarpEngine logs/uses these for diagnostics)
    dutyCycle: Number(p?.dutyCycle ?? 0.14),
    sectors: Math.max(1, Number(p?.sectorCount ?? p?.sectors ?? 400)), // total
    sectorCount: Math.max(1, Number(p?.sectorCount ?? 400)),
    viewAvg: p?.viewAvg ?? true,
    gammaGeo: Number(p?.gammaGeo ?? p?.g_y ?? 26),
    deltaAOverA: Number(p?.qSpoilingFactor ?? p?.deltaAOverA ?? 1),
    gammaVdB: Number(p?.gammaVdB ?? p?.gammaVanDenBroeck ?? 2.86e5),
  };
}

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

function pushUniformsWhenReady(engine: any, payload: any, retries = 24) {
  if (!engine || (engine._destroyed === true)) return;
  const bundle = compatifyUniforms(payload);

  const tryPush = () => {
    if (!engine || engine._destroyed) return;
    try { engine.updateUniforms?.(bundle); } catch {}
    try { engine.setParams?.(bundle); }      catch {}
  };

  // push immediately
  tryPush();

  // push again on a few frames (late init, async resize, etc.)
  if (retries > 0) {
    requestAnimationFrame(() => {
      if (!engine || engine._destroyed) return;
      pushUniformsWhenReady(engine, payload, retries - 1);
    });
  }
}

/* ---------------- Pane configurators ---------------- */
const primeOnce = (e: any, shared: ReturnType<typeof frameFromHull>, colorMode: 'theta'|'shear'|'solid') => {
  if (!e) return;
  const payload = { ...shared, colorMode, viewAvg: true };
  if (!e._bootstrapped) {
    e.bootstrap?.(payload);
    e._bootstrapped = true;
    setTimeout(() => pushUniformsWhenReady(e, payload), 0); // microtick delay
    return;
  }
  pushUniformsWhenReady(e, payload);
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

  pushUniformsWhenReady(e, {
    ...shared,
    cameraZ: camZ,
    lockFraming: true,
    physicsParityMode: true,
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

  pushUniformsWhenReady(e, {
    ...shared,
    cameraZ: camZ,
    lockFraming: true,
    physicsParityMode: false,   // enable amplification
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
  }, 60);

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
  // Explicitly construct separate payloads for airtight mode control
  const base = parameters ? JSON.parse(JSON.stringify(parameters)) : {};

  // Fingerprint of physics inputs that should re-push uniforms
  const physicsKey = JSON.stringify({
    duty: base.dutyEffectiveFR ?? base.dutyCycle,
    sectors: base.sectorStrobing ?? base.sectors ?? base.sectorCount,
    gammaGeo: base.gammaGeo ?? base.g_y,
    qSpoil: base.qSpoilingFactor ?? base.deltaAOverA,
    gammaVdB: base.gammaVanDenBroeck ?? base.gammaVdB,
    lc: base.lightCrossing ? {
      phase: base.lightCrossing.phase,
      sectorIdx: base.lightCrossing.sectorIdx,
      dwell_ms: base.lightCrossing.dwell_ms,
      burst_ms: base.lightCrossing.burst_ms,
      tauLC_ms: base.lightCrossing.tauLC_ms
    } : null
  });
  
  const parityParams = {
    ...base,
    physicsParityMode: true,
    viz: { ...(base.viz ?? {}), curvatureGainT: 0, curvatureBoostMax: 1 },
    curvatureGainDec: 0,
    curvatureBoostMax: 1,
  };

  const showParams = {
    ...base,
    physicsParityMode: false, // allow exaggeration & cosmetic boosts
  };

  // Optional: set per-pane display gain
  const parityX = parityExaggeration ?? 1;
  const heroX = heroExaggeration ?? 82;

  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const leftEngine = useRef<any>(null);
  const rightEngine = useRef<any>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const busyRef = useRef<boolean>(false);

  // bootstrap both engines once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!leftRef.current || !rightRef.current) return;
      try {
        // StrictMode/HMR guard
        if ((window as any).__warpCompareBusy) return;
        (window as any).__warpCompareBusy = true;
        
        const WarpCtor = await ensureWarpEngineCtor({ requiredBuild: APP_WARP_BUILD });
        if (cancelled) return;

        // StrictMode re-mount guard (prevents double constructor crashes in dev)
        if (busyRef.current) return;
        busyRef.current = true;

        try {
          console.log('[WARP ENGINE] Attempting to create engines with:', {
            constructor: typeof WarpCtor,
            leftCanvas: !!leftRef.current,
            rightCanvas: !!rightRef.current,
            leftCanvasSize: leftRef.current ? `${leftRef.current.width}x${leftRef.current.height}` : 'N/A',
            rightCanvasSize: rightRef.current ? `${rightRef.current.width}x${rightRef.current.height}` : 'N/A'
          });
          
          // Ensure canvas has pixels before engine creation
          ensureCanvasSize(leftRef.current!);
          ensureCanvasSize(rightRef.current!);
          
          leftEngine.current  = new WarpCtor(leftRef.current);
          rightEngine.current = new WarpCtor(rightRef.current);
          
          // Runtime proof it's the right file (commented out for production)
          // console.log('[WARP PROBE]', {
          //   scriptTags: Array.from(document.scripts).filter(s => /warp-engine\.js/.test(s.src)).map(s => s.src),
          //   hasCtor: !!(window as any).WarpEngine,
          //   build: (window as any).__WarpEngineBuild || (window as any).WarpEngine?.BUILD,
          //   ctorName: ((window as any).WarpEngine?.name)
          // });
          
          // Add WebGL context guards for resilience
          attachGLContextGuards(leftRef.current!,  () => leftEngine.current?._recreateGL?.());
          attachGLContextGuards(rightRef.current!, () => rightEngine.current?._recreateGL?.());
          
          leftEngine.current?._resize?.();
          rightEngine.current?._resize?.();
          
          // Force immediate initialization with bulletproof defaults (prevents first-frame NaNs)
          const initCamZ = safeCamZ(2.0);  // fallback to safe default
          const initColor = 1; // theta (engine expects 0=solid,1=theta,2=shear)
          const safeDefaults = { 
            thetaScale: 1.0,          // safe physics scale
            sectors: 400,             // reasonable sector count  
            cameraZ: initCamZ,        // bulletproof camera position
            colorMode: initColor, 
            colorModeIndex: initColor, 
            colorModeName: 'theta',
            exposure: 6.0,            // safe exposure level
            zeroStop: 1e-7,           // safe zero-stop threshold
            vizGain: 1.0,             // safe visualization gain
            cosmeticLevel: 1.0        // minimal but non-zero cosmetic level
          };
          leftEngine.current?.setParams?.(safeDefaults);
          rightEngine.current?.setParams?.(safeDefaults);
          
          // Verify uniforms actually exist (catch silent no-ops)
          dumpUniforms(leftEngine.current,  'REAL');
          dumpUniforms(rightEngine.current, 'SHOW');
          
        } catch (error) {
          console.error('[WARP ENGINE] Creation failed:', {
            error: error,
            message: (error as any)?.message,
            stack: (error as any)?.stack,
            constructor: typeof WarpCtor,
            leftCanvas: !!leftRef.current,
            rightCanvas: !!rightRef.current
          });
          return;
        } finally {
          busyRef.current = false;
        }
        
        ensureStrobeMux();

        // Keep both panes in lockstep with Helix strobing
        const off = (window as any).__addStrobingListener?.(
          ({ sectorCount, currentSector, split }:{sectorCount:number;currentSector:number;split?:number;}) => {
            const s = Math.max(1, Math.floor(sectorCount||1));   // concurrent sectors in the sweep loop
            const payload = {
              // ❌ sectors: s,  // Let physicsPayload own sectors for averaging
              sectorIdx: Math.max(0, currentSector % s),
              sectorSplit: Math.max(0, Math.min(s - 1, Number.isFinite(split) ? (split as number|0) : Math.floor(s/2))),
            };
            pushUniformsWhenReady(leftEngine.current,  payload);
            pushUniformsWhenReady(rightEngine.current, payload);
            leftEngine.current?.requestRewarp?.();
            rightEngine.current?.requestRewarp?.();
          }
        );
        (leftEngine.current  as any).__strobeOff = off;
        (rightEngine.current as any).__strobeOff = off;

        const shared = frameFromHull(base?.hull, base?.gridSpan);

        // REAL (parity): FR duty (conservative) - use base parameters with FR source
        const parityPhys = physicsPayload(base, 'fr');
        // SHOW (boosted): UI duty (visibly mode-dependent) - use base parameters with UI source
        const showPhys = physicsPayload(base, 'ui');
        
        // Debug: Track exact physics parameters being passed
        console.log('[WARP DEBUG] Base params:', {
          mode: base?.currentMode,
          dutyCycle: base?.dutyCycle, 
          dutyFR: base?.dutyEffectiveFR,
          sectors: base?.sectorCount,
          gammaGeo: base?.gammaGeo
        });
        console.log('[WARP DEBUG] REAL physics (FR):', {
          thetaScale: parityPhys?.thetaScale,
          sectors: parityPhys?.sectors
        });
        console.log('[WARP DEBUG] SHOW physics (UI):', {
          thetaScale: showPhys?.thetaScale,
          sectors: showPhys?.sectors
        });
        console.log('[WARP DEBUG] Engines ready?', !!leftEngine.current, !!rightEngine.current);
        
        // Log bad physics early to catch silent NaNs
        const warnIfBad = (tag:string, phys:any) => {
          if (!Number.isFinite(phys?.thetaScale) || phys.thetaScale <= 0) {
            console.warn(`[WARP DEBUG] ${tag} bad thetaScale:`, phys?.thetaScale, phys);
          }
        };
        warnIfBad('REAL', parityPhys);
        warnIfBad('SHOW', showPhys);
        
        pushUniformsWhenReady(leftEngine.current,  {
          ...parityPhys,
          physicsParityMode: true,
          ridgeMode: 0,          // ← physics double-lobe
        });

        pushUniformsWhenReady(rightEngine.current, {
          ...showPhys,
          physicsParityMode: false,
          ridgeMode: 1,          // ← single crest cosmetic
        });

        // normalize any global fallback the engine might use
        (window as any).sceneScale = 1 / Math.max(shared.hullAxes[0], shared.hullAxes[1], shared.hullAxes[2]);
        leftEngine.current?.setSceneScale?.((window as any).sceneScale);
        rightEngine.current?.setSceneScale?.((window as any).sceneScale);

        // ensure only the calibrated hull model draws
        const killMixingReal = {
          modelMode: 'calibrated',   // engine will prefer calibrated chain
          // defensively zero any demo weights if the engine exposes them:
          unitBubbleWeight: 0,
          demoBubbleWeight: 0,
          refHullAlpha: 0,
          onWindow: false,           // no instantaneous overlay
        };
        const killMixingShow = {
          modelMode: 'calibrated',   // engine will prefer calibrated chain
          unitBubbleWeight: 0,
          demoBubbleWeight: 0,
          refHullAlpha: 0,
          // no onWindow here - keep it enabled for SHOW
        };
        pushUniformsWhenReady(leftEngine.current,  killMixingReal);
        pushUniformsWhenReady(rightEngine.current, killMixingShow);

        // neutralize stray demo globals
        (window as any).__warp_setGainDec = () => {};
        (window as any).__warp_setCosmetic = () => {};

        const L = leftRef.current!,  R = rightRef.current!;
        
        // Debug: Shared parameters and canvas (commented out for production)
        // console.log('[SHOW] shared', shared);
        // console.log('[SHOW] axesScene', shared.axesScene);
        // console.log('[SHOW] canvas size', R.clientWidth, R.clientHeight);

        requestAnimationFrame(() => {
          applyReal(leftEngine.current, shared, L, (parityParams?.viz?.colorMode ?? colorMode) as any);
          leftEngine.current?.setDisplayGain?.(parityX ?? 1); // stays 1 by default
          scrubOverlays(leftEngine.current);

          // Use safety wrapper for SHOW pane to handle black screen issues
          const showPayload = {
            ...shared,
            colorMode: (showParams?.viz?.colorMode ?? colorMode) as any,
            T: showParams?.viz?.curvatureGainT ?? 0.70,
            boostMax: showParams?.viz?.curvatureBoostMax ?? heroX,
            decades: showParams?.curvatureGainDec ?? 3,
            vizGain: 1.25,
            exposure: showParams?.viz?.exposure ?? 7.5,
            zeroStop: showParams?.viz?.zeroStop ?? 1e-7,
          };
          
          // Apply show with cosmetic safety fallback
          applyShow(rightEngine.current, shared, R, showPayload.colorMode, showPayload);
          const colorModeIndex = ({ solid:0, theta:1, shear:2 } as const)[showPayload.colorMode as keyof { solid:0, theta:1, shear:2 }] ?? 1;
          applyShowSafe(rightEngine.current, {
            ...showPayload,
            colorMode: colorModeIndex,
            colorModeIndex,
            colorModeName: showPayload.colorMode,
          });
          scrubOverlays(rightEngine.current);
          
          // Verify final physics scalars (catch NaNs that yield black)
          check('REAL',  { thetaScale: 1.0, cameraZ: safeCamZ(compactCameraZ(L, shared.axesScene)) });
          check('SHOW',  { thetaScale: 1.0, cameraZ: safeCamZ(compactCameraZ(R, shared.axesScene)) });
        });

        // lock framing across resizes (prevents "camera pulled back")
        roRef.current = new ResizeObserver(() => {
          const fresh = frameFromHull(parameters?.hull, parameters?.gridSpan);
          const L = leftRef.current!, R = rightRef.current!;

          // 🔧 make sure canvases have pixels that match CSS box
          ensureCanvasSize(L);
          ensureCanvasSize(R);

          // rebind GL viewport to new pixel size before camera update
          leftEngine.current?._resize?.();
          rightEngine.current?._resize?.();

          const camL = safeCamZ(compactCameraZ(L, fresh.axesScene));
          const camR = safeCamZ(compactCameraZ(R, fresh.axesScene));

          pushUniformsWhenReady(leftEngine.current,  { ...fresh, cameraZ: camL, lockFraming: true });
          pushUniformsWhenReady(rightEngine.current, { ...fresh, cameraZ: camR, lockFraming: true });
        });
        roRef.current.observe(leftRef.current!);
        roRef.current.observe(rightRef.current!);

      } catch (e) {
        console.error('[WarpBubbleCompare] init failed:', e);
      }
    })();

    return () => {
      cancelled = true;
      try { roRef.current?.disconnect(); } catch {}
      try { (leftEngine.current  as any)?.__strobeOff?.(); } catch {}
      try { (rightEngine.current as any)?.__strobeOff?.(); } catch {}
      try { leftEngine.current?.destroy?.(); } catch {}
      try { rightEngine.current?.destroy?.(); } catch {}
      leftEngine.current = null;
      rightEngine.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live updates when parameters change (same framing both panes)
  useEffect(() => {
    if (!leftEngine.current || !rightEngine.current || !leftRef.current || !rightRef.current) return;
    
    // Fix D: Seed framing first to prevent transient nulls during mode flip
    const hull = parityParams?.hull || showParams?.hull;
    const num = (x: any, d: number) => (Number.isFinite(x) ? +x : d);
    const ah = num(hull?.a, 503.5), bh = num(hull?.b, 132), ch = num(hull?.c, 86.5);
    const sh = 1 / Math.max(ah, bh, ch, 1e-9);
    const axesSceneNow = [ah*sh, bh*sh, ch*sh] as [number,number,number];
    const spanNow = parityParams?.gridSpan || showParams?.gridSpan || 2.6;
    
    // Push framing first - prevents transient nulls
    const framingSeed = { 
      axesScene: axesSceneNow, 
      axesClip: axesSceneNow, 
      hullAxes: [ah,bh,ch], 
      gridSpan: spanNow 
    };
    pushUniformsWhenReady(leftEngine.current, framingSeed);
    pushUniformsWhenReady(rightEngine.current, framingSeed);
    
    // Then apply mode-specific physics
    const shared = frameFromHull(hull, spanNow);
    const parityPhys = physicsPayload(parityParams, 'fr');
    const showPhys = physicsPayload(showParams, 'ui');
    pushUniformsWhenReady(leftEngine.current,  {
      ...parityPhys,
      physicsParityMode: true,
      ridgeMode: 0,
    });
    pushUniformsWhenReady(rightEngine.current, {
      ...showPhys,
      physicsParityMode: false,
      ridgeMode: 1,
    });
    
    // Debug mode change
    if (parityParams?.currentMode || showParams?.currentMode) {
      const currentMode = parityParams?.currentMode || showParams?.currentMode;
      console.log('[WarpBubbleCompare] Mode update:', {
        mode: currentMode,
        leftEngine: !!leftEngine.current,
        rightEngine: !!rightEngine.current,
        parityPhys: parityPhys,
        showPhys: showPhys,
        shared: shared,
        leftCanvasVisible: leftRef.current?.style.display !== 'none',
        rightCanvasVisible: rightRef.current?.style.display !== 'none'
      });
      
      // Add currentMode to the physics payload for debugging
      if (currentMode) {
        (parityPhys as any).currentMode = currentMode;
        (showPhys as any).currentMode = currentMode;
      }
    }
    
    // Also push FR-window/light-crossing controls if present
    if (base.lightCrossing) {
      const lc = base.lightCrossing;
      const s = Math.max(1, Number(base.sectorStrobing ?? lc.sectorCount ?? showPhys.sectors ?? 1));
      const lcPayload = {
        phase: lc.phase,
        onWindow: !!lc.onWindowDisplay,
        sectorIdx: Math.max(0, lc.sectorIdx % s),
        tauLC_ms: lc.tauLC_ms,
        dwell_ms: lc.dwell_ms,
        burst_ms: lc.burst_ms,
        sectors: s
      };
      pushUniformsWhenReady(leftEngine.current,  lcPayload);
      pushUniformsWhenReady(rightEngine.current, lcPayload);
    }

    // normalize any global fallback the engine might use
    (window as any).sceneScale = 1 / Math.max(shared.hullAxes[0], shared.hullAxes[1], shared.hullAxes[2]);
    leftEngine.current?.setSceneScale?.((window as any).sceneScale);
    rightEngine.current?.setSceneScale?.((window as any).sceneScale);

    // ensure only the calibrated hull model draws
    const killMixingReal = {
      modelMode: 'calibrated',   // engine will prefer calibrated chain
      // defensively zero any demo weights if the engine exposes them:
      unitBubbleWeight: 0,
      demoBubbleWeight: 0,
      refHullAlpha: 0,
      onWindow: false,           // no instantaneous overlay
    };
    const killMixingShow = {
      modelMode: 'calibrated',   // engine will prefer calibrated chain
      unitBubbleWeight: 0,
      demoBubbleWeight: 0,
      refHullAlpha: 0,
      // no onWindow here - keep it enabled for SHOW
    };
    pushUniformsWhenReady(leftEngine.current,  killMixingReal);
    pushUniformsWhenReady(rightEngine.current, killMixingShow);

    applyReal(leftEngine.current,  shared, leftRef.current,  (parityParams?.viz?.colorMode ?? colorMode) as any);
    leftEngine.current?.setDisplayGain?.(parityX ?? 1); // stays 1 by default

    // Use safety wrapper for SHOW pane to handle black screen issues
    const showPayload = {
      ...shared,
      colorMode: (showParams?.viz?.colorMode ?? colorMode) as any,
      T: showParams?.viz?.curvatureGainT ?? 0.70,
      boostMax: showParams?.viz?.curvatureBoostMax ?? heroX,
      decades: showParams?.curvatureGainDec ?? 3,
      vizGain: 1.25,
      exposure: showParams?.viz?.exposure ?? 7.5,
      zeroStop: showParams?.viz?.zeroStop ?? 1e-7,
    };
    
    // Apply show with cosmetic safety fallback
    applyShow(rightEngine.current, shared, rightRef.current!, showPayload.colorMode, showPayload);
    const colorModeIndex = ({ solid:0, theta:1, shear:2 } as const)[showPayload.colorMode as keyof { solid:0, theta:1, shear:2 }] ?? 1;
    applyShowSafe(rightEngine.current, {
      ...showPayload,
      colorMode: colorModeIndex,
      colorModeIndex,
      colorModeName: showPayload.colorMode,
    });

    scrubOverlays(leftEngine.current);
    scrubOverlays(rightEngine.current);
    
    // Verify physics scalars on updates
    check('REAL-UPDATE', { thetaScale: 1.0, cameraZ: safeCamZ(compactCameraZ(leftRef.current!, shared.axesScene)) });
    check('SHOW-UPDATE', { thetaScale: 1.0, cameraZ: safeCamZ(compactCameraZ(rightRef.current!, shared.axesScene)) });
  }, [
    parityParams?.hull?.a, parityParams?.hull?.b, parityParams?.hull?.c,
    showParams?.hull?.a, showParams?.hull?.b, showParams?.hull?.c,
    parityParams?.gridSpan, showParams?.gridSpan,
    parityParams?.viz?.curvatureGainT, showParams?.viz?.curvatureGainT,
    parityParams?.viz?.curvatureBoostMax, showParams?.viz?.curvatureBoostMax,
    parityParams?.viz?.exposure, showParams?.viz?.exposure,
    parityParams?.viz?.zeroStop, showParams?.viz?.zeroStop,
    parityParams?.curvatureGainDec, showParams?.curvatureGainDec,
    colorMode, heroX, parityX,
    physicsKey                       // new: react to mode/duty/sectors/LC
  ]);

  // Fix black bands/duplicated rows after layout changes
  useEffect(() => {
    const onResize = () => {
      leftEngine.current?._resize?.();
      rightEngine.current?._resize?.();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
    
    const p = physicsPayload(parityParams, 'fr');
    console.log('[REAL] thetaScale=', p.thetaScale,
                'γ_geo=', p.gammaGeo,
                'qSpoil=', p.deltaAOverA,
                'γ_VdB=', p.gammaVdB,
                'dutyFR=', parityParams?.dutyEffectiveFR,
                'sectors=', p.sectors);
  }, [physicsKey]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-md overflow-hidden bg-black/40" style={{ aspectRatio: '16 / 10', minHeight: '320px' }}>
        <div className="px-2 py-1 text-xs font-mono text-slate-300">REAL (parity)</div>
        <canvas 
          ref={leftRef} 
          className="w-full h-[calc(100%-32px)] block" 
          style={{ background: '#111', display: 'block' }} 
        />
      </div>
      <div className="rounded-md overflow-hidden bg-black/40" style={{ aspectRatio: '16 / 10', minHeight: '320px' }}>
        <div className="px-2 py-1 text-xs font-mono text-slate-300">SHOW (boosted)</div>
        <canvas 
          ref={rightRef} 
          className="w-full h-[calc(100%-32px)] block" 
          style={{ background: '#111', display: 'block' }} 
        />
      </div>
    </div>
  );
}