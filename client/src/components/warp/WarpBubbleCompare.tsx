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

// Derive identical framing and **sanitize** everything
const frameFromHull = (h?: Partial<Hull>, gridSpan?: number) => {
  const a = FIN(h?.a, 503.5), b = FIN(h?.b, 132.0), c = FIN(h?.c, 86.5);
  const s = 1/1200;
  const axesScene: [number,number,number] = [a*s, b*s, c*s];
  const span = Number.isFinite(gridSpan)
    ? Number(gridSpan)
    : Math.max(2.6, Math.max(...axesScene) * 1.35);

  // Seed BOTH axesScene and axesClip; NEVER null
  return {
    hullAxes: [a,b,c] as [number,number,number],
    axesScene,
    axesClip: axesScene,
    gridSpan: span,
  };
};

// Safe wrapper that strips nulls/undefined and revalidates arrays
const seed = (shared: ReturnType<typeof frameFromHull>, extra: Record<string,any> = {}) => ({
  colorMode: 'theta',
  lockFraming: true,
  ...shared,
  axesScene: v3(shared.axesScene, [0.40,0.22,0.22]),
  axesClip : v3(shared.axesClip , [0.40,0.22,0.22]),
  hullAxes : v3(shared.hullAxes , [503.5,132.0,86.5]),
  gridSpan : FIN(shared.gridSpan, 2.6),
  ...extra,
});

const prime = (e:any, shared: ReturnType<typeof frameFromHull>) => {
  const s = seed(shared);
  // bootstrap guarantees internal state; follow with one more uniforms push
  e.bootstrap?.(s);
  e.updateUniforms?.(s);
};

// REAL (parity) config
const applyReal = (e:any, shared: ReturnType<typeof frameFromHull>) => {
  prime(e, shared);
  e.updateUniforms({
    ...seed(shared),
    physicsParityMode: true,
    vizGain: 1, displayGain: 1,
    curvatureBoostMax: 1, curvatureGainT: 0, userGain: 1,
    exposure: 3.5, zeroStop: 1e-5,
    epsilonTilt: 0, betaTiltVec: [0,0,0],
  });
  e.requestRewarp?.();
};

// SHOW (boosted) config
const applyShow = (
  e:any,
  shared: ReturnType<typeof frameFromHull>,
  T=0.55, boostMax=40, vizGain=1.0, exposure=6.0, zeroStop=1e-7
) => {
  prime(e, shared);
  const t = Math.max(0, Math.min(1, T));
  const b = Math.max(1, boostMax);
  e.updateUniforms({
    ...seed(shared),
    physicsParityMode: false,
    curvatureGainT: t,
    curvatureBoostMax: b,
    displayGain: 1 + t*(b-1),
    vizGain, exposure, zeroStop,
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

        // neutralize any global demo controls so they don't cross-wire the pair
        (window as any).__warp_setGainDec = () => {};
        (window as any).__warp_setCosmetic = () => {};

        requestAnimationFrame(() => {
          // one more tick keeps WebGL state happy on slower devices
          requestAnimationFrame(() => {
            applyReal(leftEngine.current, shared);
            applyShow(
              rightEngine.current,
              shared,
              parameters?.viz?.curvatureGainT ?? 0.55,
              parameters?.viz?.curvatureBoostMax ?? 40,
              1.0,
              parameters?.viz?.exposure ?? 6.0,
              parameters?.viz?.zeroStop ?? 1e-7
            );
          });
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
    if (!leftEngine.current || !rightEngine.current) return;
    const shared = frameFromHull(parameters?.hull, parameters?.gridSpan);

    applyReal(leftEngine.current, shared);

    applyShow(
      rightEngine.current,
      shared,
      parameters?.viz?.curvatureGainT ?? 0.55,
      parameters?.viz?.curvatureBoostMax ?? 40,
      1.0,
      parameters?.viz?.exposure ?? 6.0,
      parameters?.viz?.zeroStop ?? 1e-7
    );
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