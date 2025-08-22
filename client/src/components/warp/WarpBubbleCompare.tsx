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

// helpers for proper Real vs Show configuration
const sameFraming = (hull?: {a:number;b:number;c:number}, gridSpan?: number) => {
  const a = hull?.a ?? 503.5, b = hull?.b ?? 132, c = hull?.c ?? 86.5;
  const s = 1/1200; // same scale used in engine
  return {
    hullAxes: [a,b,c] as [number,number,number],
    axesScene: [a*s, b*s, c*s] as [number,number,number],
    gridSpan: gridSpan ?? Math.max(2.6, Math.max(a*s, b*s, c*s) * 1.35), // match GRID_DEFAULTS
  };
};

function configureReal(e: any, shared: ReturnType<typeof sameFraming>) {
  e.updateUniforms({
    // identical geometry/framing to the SHOW side
    ...shared,
    lockFraming: true,

    // hard "true physics" baseline
    physicsParityMode: true,
    colorMode: 'theta',
    vizGain: 1,
    displayGain: 1,
    curvatureBoostMax: 1,
    curvatureGainT: 0,
    userGain: 1,
    exposure: 3.5,
    zeroStop: 1e-5,

    // no interior tilt in baseline
    epsilonTilt: 0,
    betaTiltVec: [0,0,0],
  });
  e.requestRewarp?.();
}

function configureShow(e: any, shared: ReturnType<typeof sameFraming>, opts?: {
  gainT?: number;         // 0..1
  boostMax?: number;      // ≥1
  vizGain?: number;
  exposure?: number;
  zeroStop?: number;
}) {
  const T        = Math.max(0, Math.min(1, opts?.gainT ?? 0.55));
  const boostMax = Math.max(1, opts?.boostMax ?? 40);
  const dispGain = 1 + T * (boostMax - 1);

  e.updateUniforms({
    ...shared,
    lockFraming: true,           // keep identical camera/frustum

    physicsParityMode: false,
    colorMode: 'theta',
    curvatureGainT: T,
    curvatureBoostMax: boostMax,
    displayGain: dispGain,
    vizGain: opts?.vizGain ?? 1.0,
    exposure: opts?.exposure ?? 6.0,
    zeroStop: opts?.zeroStop ?? 1e-7,
    cosmeticLevel: 10,           // current visual feel
    // (optional) keep whatever tilt you like on the demo side
  });
  e.requestRewarp?.();
}

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

        // ensure no globals can cross-talk in compare view
        (window as any).__warp_setGainDec = () => {};      // neutralize global slider
        (window as any).__warp_setCosmetic = () => {};

        // lock both to the same hull/framing
        const shared = sameFraming(parameters?.hull, parameters?.gridSpan);

        // configure the two views
        configureReal(leftEngine.current, shared);
        configureShow(rightEngine.current, shared, {
          gainT: 0.55,        // feel free to bind to a UI slider
          boostMax: 40,
          vizGain: 1.0,
          exposure: 6.0,
          zeroStop: 1e-7
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

  // Update when parameters or exag change
  useEffect(() => {
    if (!leftEngine.current || !rightEngine.current) return;
    const shared = sameFraming(parameters?.hull, parameters?.gridSpan);
    configureReal(leftEngine.current, shared);
    configureShow(rightEngine.current, shared, {
      gainT: parameters.viz?.curvatureGainT ?? 0.55,
      boostMax: parameters.viz?.curvatureBoostMax ?? 40,
      vizGain: 1.0,
      exposure: parameters.viz?.exposure ?? 6.0,
      zeroStop: parameters.viz?.zeroStop ?? 1e-7
    });
  }, [parameters]);

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