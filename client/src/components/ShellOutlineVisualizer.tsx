import React, { useEffect, useRef } from "react";

type Props = {
  parameters?: {
    hull?: { a:number; b:number; c:number };
    wallWidth?: number;           // normalized like main viz
    epsilonTilt?: number;         // dimensionless tilt gain
    betaTiltVec?: [number,number,number];
  };
};

declare global {
  interface Window { OutlineEngine?: any; }
}

export function ShellOutlineVisualizer({ parameters }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<any>(null);

  // Load the outline engine script once
  useEffect(() => {
    if (window.OutlineEngine) return;
    const s = document.createElement("script");
    s.src = "/warp-engine-outline.js?v=2"; // cache-bust
    document.body.appendChild(s);
    return () => { /* script stays */ };
  }, []);

  // Bootstrap engine
  useEffect(() => {
    if (!window.OutlineEngine || !canvasRef.current) return;
    if (!engineRef.current) {
      engineRef.current = new window.OutlineEngine(canvasRef.current);
    }
    const hull = parameters?.hull || { a:0.42, b:0.11, c:0.09 };
    const uniforms = {
      hullAxes: [hull.a, hull.b, hull.c],
      wallWidth: typeof parameters?.wallWidth === 'number' ? parameters!.wallWidth : 0.06,
      epsilonTilt: typeof parameters?.epsilonTilt === 'number' ? parameters!.epsilonTilt : 0.0,
      betaTiltVec: (parameters?.betaTiltVec || [0,-1,0]) as [number,number,number],
    };
    engineRef.current.bootstrap(uniforms);
  }, [parameters]);

  // Update uniforms when props change later
  useEffect(() => {
    if (!engineRef.current) return;
    const hull = parameters?.hull || { a:0.42, b:0.11, c:0.09 };
    engineRef.current.updateUniforms({
      hullAxes: [hull.a, hull.b, hull.c],
      wallWidth: typeof parameters?.wallWidth === 'number' ? parameters!.wallWidth : 0.06,
      epsilonTilt: typeof parameters?.epsilonTilt === 'number' ? parameters!.epsilonTilt : 0.0,
      betaTiltVec: (parameters?.betaTiltVec || [0,-1,0]) as [number,number,number],
    });
  }, [parameters?.hull, parameters?.wallWidth, parameters?.epsilonTilt, parameters?.betaTiltVec]);

  // Responsive canvas: set CSS size so engine can pick it up
  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <canvas ref={canvasRef} style={{ width: "100%", height: "420px", display: "block" }} />
    </div>
  );
}

export default ShellOutlineVisualizer;