import React, { useEffect, useRef } from "react";

// at top-level, set a build token (replace with your commit/ts)
const APP_WARP_BUILD = (window as any).__APP_WARP_BUILD || "dev-" + Date.now();

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

async function ensureWarpEngineCtor(opts: { requiredBuild?: string; forceReload?: boolean } = {}): Promise<any> {
  const { requiredBuild = APP_WARP_BUILD, forceReload = false } = opts;
  const w = window as any;

  // If an engine is already present, verify its build token
  let Ctor = w.WarpEngine?.default || w.WarpEngine;
  const currentBuild = w.WarpEngine?.BUILD || w.__WarpEngineBuild;
  if (Ctor && !forceReload) {
    if (!requiredBuild || currentBuild === requiredBuild) {
      console.log('[WARP LOADER] Reusing WarpEngine', { build: currentBuild });
      return Ctor;
    }
    console.warn('[WARP LOADER] Build mismatch; reloading engine', { currentBuild, requiredBuild });
  }

  // Nuke caching that can pin the old engine
  if (forceReload || (Ctor && currentBuild !== requiredBuild)) {
    console.log('[WARP LOADER] Nuking Service Worker cache');
    try {
      // Service Worker / PWA: unregister & prepare for hard-reload
      const registrations = await navigator.serviceWorker?.getRegistrations?.();
      if (registrations?.length) {
        await Promise.all(registrations.map(r => r.unregister()));
        console.log('[WARP LOADER] Unregistered', registrations.length, 'service workers');
      }
    } catch (e) {
      console.warn('[WARP LOADER] Service worker cleanup failed (normal if none active):', e);
    }
  }

  // Remove any old <script> tags and load a fresh one with cache-bust
  removeOldWarpScripts();
  const url = `/warp-engine.js?v=${encodeURIComponent(requiredBuild)}&t=${Date.now()}`;
  await loadScript(url);

  // Re-check
  Ctor = w.WarpEngine?.default || w.WarpEngine;
  if (Ctor) {
    // Stamp a build token so we can verify later even if the engine lacks BUILD
    w.__WarpEngineBuild = w.WarpEngine?.BUILD || requiredBuild;
    console.log('[WARP LOADER] Loaded WarpEngine', { src: url, build: w.__WarpEngineBuild });
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

let showSafeFallbackDone = false;

function applyShowSafe(e:any, payload:any) {
  pushUniformsWhenReady(e, payload);
  requestAnimationFrame(() => {
    const anyVerts = (e?.gridVertices?.length || 0) + (e?.originalGridVertices?.length || 0);
    const anyReady = anyVerts > 0 && Number.isFinite(e?.uniforms?.cameraZ);
    if (!anyReady && !showSafeFallbackDone) {
      showSafeFallbackDone = true;
      pushUniformsWhenReady(e, { cosmeticLevel: 0, exposure: 5.5, vizGain: 1.0 });
      e.setDisplayGain?.(1);
      e.requestRewarp?.();
      console.warn('[SHOW] cosmetics disabled as safety fallback');
    }
  });
}

/* ---------------- Physics scalar helpers ---------------- */
type DutySource = 'fr' | 'ui';

function resolveThetaScale(p: any, dutySource: DutySource = 'fr') {
  if (Number.isFinite(p?.thetaScale)) return Number(p.thetaScale);

  const gammaGeo = Number(p?.gammaGeo ?? p?.g_y ?? 26);
  const qSpoil   = Number(p?.qSpoilingFactor ?? p?.deltaAOverA ?? 1);
  const gammaVdB = Number(p?.gammaVdB ?? p?.gammaVanDenBroeck ?? 2.86e5);

  // choose duty based on source
  let duty = Number(p?.dutyCycle ?? 0.14);            // UI duty (visible)
  if (dutySource === 'fr') {
    if (Number.isFinite(p?.dutyEffectiveFR)) duty = Number(p.dutyEffectiveFR);
    else if (Number.isFinite(p?.dutyEffective_FR)) duty = Number(p.dutyEffective_FR);
    else if (p?.lightCrossing && Number.isFinite(p.lightCrossing.burst_ms) &&
             Number.isFinite(p.lightCrossing.dwell_ms) && p.lightCrossing.dwell_ms > 0) {
      duty = p.lightCrossing.burst_ms / p.lightCrossing.dwell_ms / Math.max(1, (p.sectorCount ?? p.sectors ?? 1));
    }
  }

  // IMPORTANT: use total sectors for averaging, not concurrent strobing
  const sectors  = Math.max(1, Number(p?.sectorCount ?? p?.sectors ?? 400));
  const viewAvg  = (p?.viewAvg ?? true) ? 1 : 0;     // if you ever allow per-view toggles
  const A_geo    = Math.pow(Math.max(1, gammaGeo), 3);
  const dutyTerm = viewAvg ? Math.sqrt(Math.max(1e-12, duty / sectors)) : 1;
  const result = A_geo * Math.max(1e-12, qSpoil) * Math.max(1, gammaVdB) * dutyTerm;
  
  // Debug: Track exact thetaScale calculation
  console.log(`[${dutySource.toUpperCase()}] thetaScale=` + result.toExponential(2) + 
    ` (γGeo=${gammaGeo}, qSpoil=${qSpoil}, γVdB=${gammaVdB.toExponential(2)}, duty=${duty}, sectors=${sectors})`);
  
  return result;
}

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

  // Kill common demo/unit/ref/instant paths (defensive — only if present)
  for (const k of Object.keys(u)) {
    if (/(^|_)unit(|_)?(bubble|ring|blend|weight)?/i.test(k)) patch[k] = 0;
    if (/demo(|Mix|Blend|Weight|Ring|Layer)/i.test(k))        patch[k] = 0;
    if (/(ref|reference).*(hull|ring|layer|alpha)/i.test(k))  patch[k] = 0;
    // Keep average view on, but don't kill FR window gating.
    if (/avg|showAvg|viewAvg/i.test(k))                        patch[k] = 1;
  }

  // Make sure we don't accidentally switch cameras by reusing hull
  if ('hullAxes' in u && !patch.hullAxes) patch.hullAxes = u.hullAxes;
  if ('axesScene' in u && !patch.axesScene) patch.axesScene = u.axesScene;

  e.updateUniforms(patch);
}

/* ---------------- Safe uniform push (fixes null.length) ---------------- */
function pushUniformsWhenReady(e: any, payload: any, retries = 60) {
  if (!e) return;
  const ready = !!(e.gridVertices && e.originalGridVertices);
  if (ready) {
    try { e.updateUniforms?.(payload); return; } catch (err) { console.warn('[pushUniforms] update failed', err); }
  }
  if (retries > 0) requestAnimationFrame(() => pushUniformsWhenReady(e, payload, retries - 1));
  else console.warn('[pushUniforms] gave up pushing uniforms');
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
  shared: ReturnType<typeof frameFromHull>,
  canvas: HTMLCanvasElement,
  colorMode: 'theta'|'shear'|'solid'
) => {
  primeOnce(e, shared, colorMode);

  const axesOK = shared?.axesScene?.every?.(n => Number.isFinite(n) && Math.abs(n) > 0);
  if (!axesOK) shared = { ...shared, axesScene: [1, 0.26, 0.17] as any };

  const camZ = safeCamZ(compactCameraZ(canvas, shared.axesScene));
  // parity: absolutely neutral
  pushUniformsWhenReady(e, {
    ...shared,
    cameraZ: camZ,
    lockFraming: true,
    physicsParityMode: true,
    colorMode,
    vizGain: 1,
    displayGain: 1,
    exposure: 5.0,         // was 3.8 - temporary debug visibility boost
    zeroStop: 1e-7,        // was 1e-6 - capture smaller values
    cosmeticLevel: 0,
    curvatureGainDec: 0,
    curvatureGainT: 0,
    curvatureBoostMax: 1,
    epsilonTilt: 0,
    betaTiltVec: [0,0,0],
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

  console.log('[SHOW] camZ', camZ, 't', t, 'b', b, 'dec', decades, 'viz', vizGain, 'exp', exposure, 'zstop', zeroStop);

  pushUniformsWhenReady(e, {
    ...shared,
    cameraZ: camZ,
    lockFraming: true,
    physicsParityMode: false,
    colorMode,
    curvatureGainT: t,
    curvatureBoostMax: b,
    curvatureGainDec: Math.max(0, Math.min(8, decades)),
    vizGain,
    exposure,
    zeroStop,
    cosmeticLevel: 10,
  }, 60);

  const displayBoost = (1 - clamp01(decades/8)) + clamp01(decades/8) * b;
  e.setDisplayGain?.(Number.isFinite(displayBoost) ? displayBoost : 1);
  e.requestRewarp?.();

  // context check
  if (e?.gl?.isContextLost?.()) {
    console.warn('[SHOW] context lost – attempting restore');
    e.gl.getExtension('WEBGL_lose_context')?.restoreContext?.();
  }
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
          
          // Runtime proof it's the right file
          console.log('[WARP PROBE]', {
            scriptTags: [...document.scripts].filter(s => /warp-engine\.js/.test(s.src)).map(s => s.src),
            hasCtor: !!(window as any).WarpEngine,
            build: (window as any).__WarpEngineBuild || (window as any).WarpEngine?.BUILD,
            ctorName: ((window as any).WarpEngine?.name)
          });
          
          // Add WebGL context guards for resilience
          attachGLContextGuards(leftRef.current!,  () => leftEngine.current?._resize?.());
          attachGLContextGuards(rightRef.current!, () => rightEngine.current?._resize?.());
          
          console.log('[WARP ENGINE] Engines created, triggering resize');
          leftEngine.current?._resize?.();
          rightEngine.current?._resize?.();
          
          // Force immediate initialization
          leftEngine.current?.setParams?.({thetaScale: 1.0, sectors: 400, cameraZ: 2.0});
          rightEngine.current?.setParams?.({thetaScale: 1.0, sectors: 400, cameraZ: 2.0});
          
          console.log('[WARP ENGINE] Initialization complete, both engines ready');
          
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
              // these are for the animation/sweep, not for averaging
              sectors: s,
              split: Math.max(0, Math.min(s-1, Number.isFinite(split) ? (split as number|0) : Math.floor(s/2))),
              sectorIdx: Math.max(0, currentSector % s)
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
        
        pushUniformsWhenReady(leftEngine.current,  parityPhys);
        pushUniformsWhenReady(rightEngine.current, showPhys);

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
        
        // Debug: Shared parameters and canvas
        console.log('[SHOW] shared', shared);
        console.log('[SHOW] axesScene', shared.axesScene);
        console.log('[SHOW] canvas size', R.clientWidth, R.clientHeight);

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
          applyShowSafe(rightEngine.current, showPayload);
          scrubOverlays(rightEngine.current);
          
          // Verify final physics scalars (catch NaNs that yield black)
          check('REAL',  { thetaScale: shared?.thetaScale || 1.0, cameraZ: safeCamZ(compactCameraZ(L, shared.axesScene)) });
          check('SHOW',  { thetaScale: shared?.thetaScale || 1.0, cameraZ: safeCamZ(compactCameraZ(R, shared.axesScene)) });
        });

        // lock framing across resizes (prevents "camera pulled back")
        roRef.current = new ResizeObserver(() => {
          const fresh = frameFromHull(parameters?.hull, parameters?.gridSpan);
          const L = leftRef.current!, R = rightRef.current!;
          const camL = safeCamZ(compactCameraZ(L, fresh.axesScene));
          const camR = safeCamZ(compactCameraZ(R, fresh.axesScene));

          // make the GL viewport match CSS before re-locking framing
          leftEngine.current?._resize?.();
          rightEngine.current?._resize?.();

          pushUniformsWhenReady(leftEngine.current,  { ...fresh, cameraZ: camL, lockFraming: true });
          pushUniformsWhenReady(rightEngine.current, { ...fresh, cameraZ: camR, lockFraming: true });
        });
        roRef.current.observe(L); roRef.current.observe(R);

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
    const shared = frameFromHull(parityParams?.hull || showParams?.hull, parityParams?.gridSpan || showParams?.gridSpan);

    const parityPhys = physicsPayload(parityParams, 'fr');
    const showPhys = physicsPayload(showParams, 'ui');
    pushUniformsWhenReady(leftEngine.current,  parityPhys);
    pushUniformsWhenReady(rightEngine.current, showPhys);
    
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
    applyShowSafe(rightEngine.current, showPayload);

    scrubOverlays(leftEngine.current);
    scrubOverlays(rightEngine.current);
    
    // Verify physics scalars on updates
    check('REAL-UPDATE', { thetaScale: shared?.thetaScale || 1.0, cameraZ: safeCamZ(compactCameraZ(leftRef.current!, shared.axesScene)) });
    check('SHOW-UPDATE', { thetaScale: shared?.thetaScale || 1.0, cameraZ: safeCamZ(compactCameraZ(rightRef.current!, shared.axesScene)) });
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
      <div className="rounded-md overflow-hidden bg-black/40">
        <div className="px-2 py-1 text-xs font-mono text-slate-300">REAL (parity)</div>
        <canvas ref={leftRef} className="w-full h-[320px]" />
      </div>
      <div className="rounded-md overflow-hidden bg-black/40">
        <div className="px-2 py-1 text-xs font-mono text-slate-300">SHOW (boosted)</div>
        <canvas ref={rightRef} className="w-full h-[320px]" />
      </div>
    </div>
  );
}