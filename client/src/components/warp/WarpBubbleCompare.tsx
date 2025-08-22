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
  for (const src of ['/warp-engine-fixed.js?v=tilt2','/warp-engine.js?v=fallback']) {
    try { await loadScript(src); } catch {}
    Ctor = w.WarpEngine?.default || w.WarpEngine;
    if (typeof Ctor === 'function') return Ctor;
  }
  throw new Error('WarpEngine constructor not found');
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

/* ---------------- Safe uniform push (fixes null.length) ---------------- */
function pushUniformsWhenReady(e: any, payload: any, retries = 16) {
  if (!e) return;
  const ready = !!(e.gridVertices && e.originalGridVertices);
  if (ready) {
    try { e.updateUniforms?.(payload); return; } catch {}
  }
  if (retries > 0) requestAnimationFrame(() => pushUniformsWhenReady(e, payload, retries - 1));
}

/* ---------------- Pane configurators ---------------- */
const primeOnce = (e: any, shared: ReturnType<typeof frameFromHull>, colorMode: 'theta'|'shear'|'solid') => {
  if (!e) return;
  const payload = { ...shared, colorMode, viewAvg: true };
  if (!e._bootstrapped) {
    e.bootstrap?.(payload);
    e._bootstrapped = true;
    requestAnimationFrame(() => pushUniformsWhenReady(e, payload));
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
    exposure: 3.8,
    zeroStop: 1e-6,
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
        ensureStrobeMux();

        const shared = frameFromHull(parameters?.hull, parameters?.gridSpan);

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

        requestAnimationFrame(() => {
          applyReal(leftEngine.current, shared, L, (parameters?.viz?.colorMode ?? colorMode) as any);
          applyShow(
            rightEngine.current,
            shared,
            R,
            (parameters?.viz?.colorMode ?? colorMode) as any,
            {
              T: parameters?.viz?.curvatureGainT ?? 0.70,
              boostMax: parameters?.viz?.curvatureBoostMax ?? heroExaggeration,
              decades: parameters?.curvatureGainDec ?? 3,
              vizGain: 1.25,
              exposure: parameters?.viz?.exposure ?? 7.5,
              zeroStop: parameters?.viz?.zeroStop ?? 1e-7,
            }
          );
        });

        // lock framing across resizes (prevents "camera pulled back")
        roRef.current = new ResizeObserver(() => {
          const fresh = frameFromHull(parameters?.hull, parameters?.gridSpan);
          const camL = compactCameraZ(L, fresh.axesScene);
          const camR = compactCameraZ(R, fresh.axesScene);
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
    const shared = frameFromHull(parameters?.hull, parameters?.gridSpan);

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

    applyReal(leftEngine.current,  shared, leftRef.current,  (parameters?.viz?.colorMode ?? colorMode) as any);

    applyShow(
      rightEngine.current,
      shared,
      rightRef.current,
      (parameters?.viz?.colorMode ?? colorMode) as any,
      {
        T: parameters?.viz?.curvatureGainT ?? 0.70,
        boostMax: parameters?.viz?.curvatureBoostMax ?? heroExaggeration,
        decades: parameters?.curvatureGainDec ?? 3,
        vizGain: 1.25,
        exposure: parameters?.viz?.exposure ?? 7.5,
        zeroStop: parameters?.viz?.zeroStop ?? 1e-7,
      }
    );
  }, [
    parameters?.hull?.a, parameters?.hull?.b, parameters?.hull?.c,
    parameters?.gridSpan,
    parameters?.viz?.curvatureGainT,
    parameters?.viz?.curvatureBoostMax,
    parameters?.viz?.exposure,
    parameters?.viz?.zeroStop,
    parameters?.curvatureGainDec,
    colorMode
  ]);

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