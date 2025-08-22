import React, { useEffect, useRef } from "react";

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
    if (!leftRef.current || !rightRef.current) return;
    leftEngine.current  = new window.WarpEngine(leftRef.current);
    rightEngine.current = new window.WarpEngine(rightRef.current);

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

    return () => {
      leftEngine.current?.destroy?.();
      rightEngine.current?.destroy?.();
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