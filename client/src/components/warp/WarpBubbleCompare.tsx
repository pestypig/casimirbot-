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

        leftEngine.current.bootstrap({
          ...parameters,
          physicsParityMode: true,
          colorMode,
          lockFraming,
          viewAvg: parameters?.viewAvg ?? true,
          exaggeration: 1, // parity always flat
        });

        rightEngine.current.bootstrap({
          ...parameters,
          physicsParityMode: false,
          colorMode,
          lockFraming,
          viewAvg: parameters?.viewAvg ?? true,
          exaggeration: heroExaggeration,
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

    leftEngine.current.updateUniforms({
      ...parameters,
      physicsParityMode: true,
      colorMode,
      lockFraming,
      exaggeration: parityExaggeration, // =1 by default (safe)
    });

    rightEngine.current.updateUniforms({
      ...parameters,
      physicsParityMode: false,
      colorMode,
      lockFraming,
      exaggeration: heroExaggeration,
    });
  }, [parameters, parityExaggeration, heroExaggeration, colorMode, lockFraming]);

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