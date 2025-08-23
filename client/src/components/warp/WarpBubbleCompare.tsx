import React, { useEffect, useRef } from "react";

/* ---------------- Script loader & strobe mux ---------------- */
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}
async function ensureWarpEngineCtor(): Promise<any> {
  const w = window as any;
  let Ctor = w.WarpEngine?.default || w.WarpEngine;
  if (typeof Ctor === 'function') return Ctor;

  const candidates = [
    '/warp-engine.js?v=canonical',
    '/warp-engine.js',
    '/WarpEngine.js',
    '/Warp_engine.js',
    '/warp_engine.js',
    '/assets/warp-engine.js',
    '/static/warp-engine.js'
  ];

  for (const src of candidates) {
    try {
      console.log('[WarpLoader] trying', src);
      await loadScript(src);
      Ctor = w.WarpEngine?.default || w.WarpEngine;
      if (typeof Ctor === 'function') return Ctor;
    } catch (e) {
      console.warn('[WarpLoader] failed', src, e);
    }
  }
  throw new Error('WarpEngine constructor not found (check filename/path/CSP/MIME type)');
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

/* ---------------- Physics scalar helpers ---------------- */
function resolveThetaScale(p: any) {
  if (Number.isFinite(p?.thetaScale)) return Number(p.thetaScale);

  const gammaGeo = Number(p?.gammaGeo ?? p?.g_y ?? 26);
  const qSpoil   = Number(p?.qSpoilingFactor ?? p?.deltaAOverA ?? 1);
  const gammaVdB = Number(p?.gammaVdB ?? p?.gammaVanDenBroeck ?? 2.86e5);
  const sectors  = Math.max(1, Number(p?.sectors ?? p?.sectorCount ?? p?.sectorStrobing ?? 1));
  
  // Prefer FR-sampled duty if available
  let duty = Number(p?.dutyCycle ?? 0.14);
  if (Number.isFinite(p?.dutyEffectiveFR)) {
    duty = Number(p.dutyEffectiveFR);
  } else if (p?.lightCrossing &&
             Number.isFinite(p.lightCrossing.burst_ms) &&
             Number.isFinite(p.lightCrossing.dwell_ms) &&
             p.lightCrossing.dwell_ms > 0) {
    duty = p.lightCrossing.burst_ms / p.lightCrossing.dwell_ms;
  }
  const viewAvg  = (p?.viewAvg ?? true) ? 1 : 0;     // if you ever allow per-view toggles
  const A_geo    = Math.pow(Math.max(1, gammaGeo), 3);
  const dutyTerm = viewAvg ? Math.sqrt(Math.max(1e-12, duty / sectors)) : 1;
  return A_geo * Math.max(1e-12, qSpoil) * Math.max(1, gammaVdB) * dutyTerm;
}

function physicsPayload(p: any) {
  return {
    // the scalar the engine/shader both expect
    thetaScale: resolveThetaScale(p),

    // pieces (the CPU path in WarpEngine logs/uses these for diagnostics)
    dutyCycle: Number(p?.dutyCycle ?? 0.14),
    sectors: Math.max(1, Number(p?.sectors ?? p?.sectorCount ?? 1)),
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
  const camZ = compactCameraZ(canvas, shared.axesScene);
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
  shared: ReturnType<typeof frameFromHull>,
  canvas: HTMLCanvasElement,
  colorMode: 'theta'|'shear'|'solid',
  opts: { T?: number; boostMax?: number; decades?: number; vizGain?: number; exposure?: number; zeroStop?: number; }
) => {
  const { T=0.70, boostMax=40, decades=3, vizGain=1.25, exposure=7.5, zeroStop=1e-7 } = opts || {};
  primeOnce(e, shared, colorMode);
  const camZ = compactCameraZ(canvas, shared.axesScene);
  
  // Debug: Track applyShow parameters
  console.log('[SHOW] camZ=', camZ, 'T/b/dec/viz/exposure/zeroStop', T, boostMax, decades, vizGain, exposure, zeroStop);

  // shader-side exaggeration
  const t = clamp01(T);
  const b = Math.max(1, boostMax);

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
  });
  
  // Debug: Check if uniforms were pushed successfully
  console.log('[SHOW] uniforms pushed?', !!e?.uniforms, e?.uniforms?.cameraZ);
  // Quick GL sanity check
  console.log('[SHOW] ctx lost?', e?.gl?.isContextLost?.());

  // geometry/display gain if available (matches SliceViewer feel)
  const displayBoost = (1 - clamp01(decades/8)) + clamp01(decades/8) * b; // 1..b
  e.setDisplayGain?.(displayBoost);
  e.requestRewarp?.();
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

  // bootstrap both engines once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!leftRef.current || !rightRef.current) return;
      try {
        const WarpCtor = await ensureWarpEngineCtor();
        if (cancelled) return;

        leftEngine.current  = new WarpCtor(leftRef.current);
        rightEngine.current = new WarpCtor(rightRef.current);
        
        // Debug: Constructor and engine creation
        console.log('[SHOW] Ctor?', typeof WarpCtor, 'engine?', !!rightEngine.current);
        console.log('[SHOW] script present?', !!(window as any).WarpEngine);
        ensureStrobeMux();

        // Keep both panes in lockstep with Helix strobing
        const off = (window as any).__addStrobingListener?.(
          ({ sectorCount, currentSector, split }:{sectorCount:number;currentSector:number;split?:number;}) => {
            const s = Math.max(1, Math.floor(sectorCount||1));
            const payload = {
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

        const shared = frameFromHull(parityParams?.hull || showParams?.hull, parityParams?.gridSpan || showParams?.gridSpan);

        const parityPhys = physicsPayload(parityParams);
        const showPhys = physicsPayload(showParams);
        pushUniformsWhenReady(leftEngine.current,  parityPhys);
        pushUniformsWhenReady(rightEngine.current, showPhys);

        // normalize any global fallback the engine might use
        (window as any).sceneScale = 1 / Math.max(shared.hullAxes[0], shared.hullAxes[1], shared.hullAxes[2]);
        leftEngine.current?.setSceneScale?.((window as any).sceneScale);
        rightEngine.current?.setSceneScale?.((window as any).sceneScale);

        // ensure only the calibrated hull model draws
        const killMixing = {
          modelMode: 'calibrated',   // engine will prefer calibrated chain
          // defensively zero any demo weights if the engine exposes them:
          unitBubbleWeight: 0,
          demoBubbleWeight: 0,
          refHullAlpha: 0,
          onWindow: false,           // no instantaneous overlay
        };
        pushUniformsWhenReady(leftEngine.current,  killMixing);
        pushUniformsWhenReady(rightEngine.current, killMixing);

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

          applyShow(
            rightEngine.current,
            shared,
            R,
            (showParams?.viz?.colorMode ?? colorMode) as any,
            {
              T: showParams?.viz?.curvatureGainT ?? 0.70,
              boostMax: showParams?.viz?.curvatureBoostMax ?? heroX,
              decades: showParams?.curvatureGainDec ?? 3,
              vizGain: 1.25,
              exposure: showParams?.viz?.exposure ?? 7.5,
              zeroStop: showParams?.viz?.zeroStop ?? 1e-7,
            }
          );
          scrubOverlays(rightEngine.current);
        });

        // lock framing across resizes (prevents "camera pulled back")
        roRef.current = new ResizeObserver(() => {
          const fresh = frameFromHull(parameters?.hull, parameters?.gridSpan);
          const L = leftRef.current!, R = rightRef.current!;
          const camL = compactCameraZ(L, fresh.axesScene);
          const camR = compactCameraZ(R, fresh.axesScene);

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

    const parityPhys = physicsPayload(parityParams);
    const showPhys = physicsPayload(showParams);
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
    const killMixing = {
      modelMode: 'calibrated',   // engine will prefer calibrated chain
      // defensively zero any demo weights if the engine exposes them:
      unitBubbleWeight: 0,
      demoBubbleWeight: 0,
      refHullAlpha: 0,
      onWindow: false,           // no instantaneous overlay
    };
    pushUniformsWhenReady(leftEngine.current,  killMixing);
    pushUniformsWhenReady(rightEngine.current, killMixing);

    applyReal(leftEngine.current,  shared, leftRef.current,  (parityParams?.viz?.colorMode ?? colorMode) as any);
    leftEngine.current?.setDisplayGain?.(parityX ?? 1); // stays 1 by default

    applyShow(
      rightEngine.current,
      shared,
      rightRef.current,
      (showParams?.viz?.colorMode ?? colorMode) as any,
      {
        T: showParams?.viz?.curvatureGainT ?? 0.70,
        boostMax: showParams?.viz?.curvatureBoostMax ?? heroX,
        decades: showParams?.curvatureGainDec ?? 3,
        vizGain: 1.25,
        exposure: showParams?.viz?.exposure ?? 7.5,
        zeroStop: showParams?.viz?.zeroStop ?? 1e-7,
      }
    );

    scrubOverlays(leftEngine.current);
    scrubOverlays(rightEngine.current);
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
    const p = physicsPayload(parityParams);
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