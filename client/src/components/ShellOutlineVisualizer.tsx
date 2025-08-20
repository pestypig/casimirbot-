import React, { useEffect, useRef, useState } from "react";

type Props = {
  parameters?: {
    hull?: { a:number; b:number; c:number };
    wallWidth?: number;
    epsilonTilt?: number;
    betaTiltVec?: [number,number,number];
  };
};

declare global { interface Window { OutlineEngine?: any; } }

export function ShellOutlineVisualizer({ parameters }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<any>(null);
  const [ready, setReady] = useState(!!window.OutlineEngine);

  useEffect(() => {
    if (window.OutlineEngine) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "/warp-engine-outline.js?v=3";
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    if (!engineRef.current) {
      engineRef.current = new window.OutlineEngine(canvasRef.current);
    }
    const hull = parameters?.hull || { a:0.42, b:0.11, c:0.09 };
    engineRef.current.bootstrap({
      hullAxes: [hull.a, hull.b, hull.c],
      wallWidth: parameters?.wallWidth ?? 0.06,
      epsilonTilt: parameters?.epsilonTilt ?? 0.0,
      betaTiltVec: (parameters?.betaTiltVec || [0,-1,0]) as [number,number,number],
    });
  }, [ready]);

  useEffect(() => {
    if (!engineRef.current) return;
    const hull = parameters?.hull || { a:0.42, b:0.11, c:0.09 };
    engineRef.current.updateUniforms({
      hullAxes: [hull.a, hull.b, hull.c],
      wallWidth: parameters?.wallWidth ?? 0.06,
      epsilonTilt: parameters?.epsilonTilt ?? 0.0,
      betaTiltVec: (parameters?.betaTiltVec || [0,-1,0]) as [number,number,number],
    });
  }, [parameters?.hull, parameters?.wallWidth, parameters?.epsilonTilt, parameters?.betaTiltVec]);

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <canvas ref={canvasRef} style={{ width: "100%", height: "420px", display: "block" }} />
    </div>
  );
}

export default ShellOutlineVisualizer;