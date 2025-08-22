import React, { useEffect, useRef } from "react";

// Robust engine loader
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function ensureWarpEngineCtor(): Promise<any> {
  const w = window as any;
  let Ctor = w.WarpEngine?.default || w.WarpEngine;
  if (typeof Ctor === 'function') return Ctor;

  // try fixed then fallback bundle—same paths your TSX loader uses
  const candidates = ['/warp-engine-fixed.js?v=tilt2', '/warp-engine.js?v=fallback'];
  for (const src of candidates) {
    try { await loadScript(src); } catch { /* keep trying */ }
    Ctor = (w.WarpEngine?.default || w.WarpEngine);
    if (typeof Ctor === 'function') return Ctor;
  }
  throw new Error('WarpEngine constructor not found after script load');
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

type Hull = { a:number; b:number; c:number };

const FIN = (v:any, d:number) => (Number.isFinite(v) ? Number(v) : d);
const v3 = (v:any, d:[number,number,number]) =>
  (Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)) ? (v as [number,number,number]) : d;

// Add axesClip and compute a compact camera distance so the hull fills the view
const frameFromHull = (hull?: Partial<Hull>, gridSpan?: number) => {
  const a = Number.isFinite(hull?.a) ? Number(hull!.a) : 503.5;
  const b = Number.isFinite(hull?.b) ? Number(hull!.b) : 132.0;
  const c = Number.isFinite(hull?.c) ? Number(hull!.c) : 86.5;
  const s = 1 / 1200;
  const axesScene: [number, number, number] = [a * s, b * s, c * s];

  // Grid span is kept, but we'll override the camera so minSpan can't push us far out
  const span = Number.isFinite(gridSpan)
    ? (gridSpan as number)
    : Math.max(2.6, Math.max(...axesScene) * 1.35);

  return {
    hullAxes: [a, b, c] as [number, number, number],
    axesScene,
    axesClip: axesScene,             // 🔒 seed axesClip too (avoids null paths)
    gridSpan: span,
  };
};

// Use the same FOV math the engine uses; pick a tighter margin than the engine's 1.22
const compactCameraZ = (canvas: HTMLCanvasElement, axesScene: [number,number,number]) => {
  const w = canvas.width || canvas.clientWidth || 800;
  const h = canvas.height || canvas.clientHeight || 320;
  const aspect = w / Math.max(1, h);
  const fovDesktop = Math.PI / 3.272; // ~55°
  const fovPortrait = Math.PI / 2.65; // ~68°
  const t = Math.min(1, Math.max(0, (1.2 - aspect) / 0.6));
  const fov = fovDesktop * (1 - t) + fovPortrait * t;
  const R = Math.max(...axesScene);
  const margin = 0.95;               // 👈 tighter than engine's base margin
  return (margin * R) / Math.tan(fov * 0.5);
};


// Race-proof primeOnce (ensures buffers exist before first update)
const primeOnce = (e: any, shared: ReturnType<typeof frameFromHull>, colorMode: 'theta'|'shear'|'solid') => {
  if (!e) return;
  const payload = { ...shared, colorMode };

  // First time: bootstrap then one deferred update
  if (!e._bootstrapped) {
    e.bootstrap?.(payload);
    e._bootstrapped = true;
    requestAnimationFrame(() => {
      try { e.updateUniforms?.(payload); } catch {}
    });
    return;
  }

  // Already bootstrapped: push immediately
  e.updateUniforms?.(payload);
};

// REAL = physics parity (no boosts), compact framing, theta color
const applyReal = (
  e: any,
  shared: ReturnType<typeof frameFromHull>,
  canvas: HTMLCanvasElement,
  colorMode: 'theta'|'shear'|'solid'
) => {
  primeOnce(e, shared, colorMode);
  const camZ = compactCameraZ(canvas, shared.axesScene);
  e.updateUniforms({
    ...shared,
    cameraZ: camZ,
    lockFraming: true,

    physicsParityMode: true,   // 🔒 NO boosts/cosmetics
    colorMode: 'theta',
    vizGain: 1,
    displayGain: 1,
    userGain: 1,               // explicit (shader & CPU use this)
    curvatureBoostMax: 1,
    curvatureGainT: 0,
    exposure: 4.0,             // subtler, but still shows sign
    zeroStop: 1e-5,

    epsilonTilt: 0,
    betaTiltVec: [0, 0, 0],
  });
  e.requestRewarp?.();
};

// SHOW = boosted/exaggerated, same framing & color, very obvious split
const applyShow = (
  e: any,
  shared: ReturnType<typeof frameFromHull>,
  canvas: HTMLCanvasElement,
  colorMode: 'theta'|'shear'|'solid',
  T = 0.70,
  boostMax = 40,
  vizGain = 1.25,             // slight seasoning so colors pop
  exposure = 7.5,             // more contrast than parity
  zeroStop = 1e-8             // deeper log for richer blues/reds
) => {
  primeOnce(e, shared, colorMode);
  const camZ = compactCameraZ(canvas, shared.axesScene);
  const t = Math.max(0, Math.min(1, T));
  const b = Math.max(1, boostMax);
  const gainNow = 1 + t * (b - 1); // decades slider mapping

  e.updateUniforms({
    ...shared,
    cameraZ: camZ,
    lockFraming: true,

    physicsParityMode: false,
    colorMode: 'theta',

    curvatureGainT: t,
    curvatureBoostMax: b,
    displayGain: gainNow,      // ⬅️ make it obvious
    userGain: gainNow,         // ⬅️ explicit so geometry & color diverge

    vizGain,
    exposure,
    zeroStop,
    cosmeticLevel: 10,
  });
  e.requestRewarp?.();
};

type Props = {
  parameters: any;                 // your compareParams from HelixCore
  parityExaggeration?: number;     // default 1
  heroExaggeration?: number;       // default 40 or 82
  colorMode?: "theta" | "shear" | "solid";
  lockFraming?: boolean;           // default true (prevents zoom-out at high gain)
};

export default function WarpBubbleCompare({
  parameters,
  parityExaggeration = 1,
  heroExaggeration = 82,
  colorMode = "theta",
  lockFraming = true,
}: Props) {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const leftEngine = useRef<any>(null);
  const rightEngine = useRef<any>(null);

  // Bootstrap once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!leftRef.current || !rightRef.current) return;
      try {
        const WarpCtor = await ensureWarpEngineCtor();
        if (cancelled) return;
        leftEngine.current  = new WarpCtor(leftRef.current);
        rightEngine.current = new WarpCtor(rightRef.current);
        ensureStrobeMux(); // wrap after engine creation

        const shared = frameFromHull(parameters?.hull, parameters?.gridSpan);
        
        // Additional safety check to ensure arrays are never null
        if (!shared.axesScene || !shared.axesClip || !shared.hullAxes) {
          console.error('❌ Null array detected in frameFromHull:', shared);
          return;
        }

        // neutralize any global demo controls so they don't cross-wire the pair
        (window as any).__warp_setGainDec = () => {};
        (window as any).__warp_setCosmetic = () => {};

        requestAnimationFrame(() => {
          applyReal(leftEngine.current,  shared, leftRef.current!,  colorMode);
          applyShow(rightEngine.current, shared, rightRef.current!, colorMode,
                    parameters?.viz?.curvatureGainT ?? 0.70,
                    parameters?.viz?.curvatureBoostMax ?? heroExaggeration,
                    1.0,
                    parameters?.viz?.exposure ?? 6.0,
                    parameters?.viz?.zeroStop ?? 1e-7);
        });
      } catch (e) {
        console.error('[WarpBubbleCompare] init failed:', e);
      }
    })();
    return () => {
      cancelled = true;
      try { leftEngine.current?.destroy?.(); } catch {}
      try { rightEngine.current?.destroy?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // Update when parameters change
  useEffect(() => {
    if (!leftEngine.current || !rightEngine.current || !leftRef.current || !rightRef.current) return;
    const shared = frameFromHull(parameters?.hull, parameters?.gridSpan);

    applyReal(leftEngine.current,  shared, leftRef.current,  colorMode);
    applyShow(rightEngine.current, shared, rightRef.current, colorMode,
              parameters?.viz?.curvatureGainT ?? 0.70,
              parameters?.viz?.curvatureBoostMax ?? heroExaggeration,
              1.0,
              parameters?.viz?.exposure ?? 6.0,
              parameters?.viz?.zeroStop ?? 1e-7);
  }, [
    parameters?.hull?.a, parameters?.hull?.b, parameters?.hull?.c,
    parameters?.gridSpan,
    parameters?.viz?.curvatureGainT,
    parameters?.viz?.curvatureBoostMax,
    parameters?.viz?.exposure,
    parameters?.viz?.zeroStop
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-md overflow-hidden bg-black/40">
        <div className="px-2 py-1 text-xs font-mono text-slate-300">Parity</div>
        <canvas ref={leftRef} className="w-full h-[320px]" />
      </div>
      <div className="rounded-md overflow-hidden bg-black/40">
        <div className="px-2 py-1 text-xs font-mono text-slate-300">Hero</div>
        <canvas ref={rightRef} className="w-full h-[320px]" />
      </div>
    </div>
  );
}