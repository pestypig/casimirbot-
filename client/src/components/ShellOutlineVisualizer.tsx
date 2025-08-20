import React, { useEffect, useRef, useState } from "react";

type Props = {
  parameters?: {
    hull?: { a:number; b:number; c:number };
    wallWidth?: number;
    epsilonTilt?: number;
    betaTiltVec?: [number,number,number];
    // NEW: mode coupling
    mode?: string;
    dutyCycle?: number;
    sectors?: number;
    gammaGeo?: number;
    qSpoil?: number;
    qCavity?: number;
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
    s.src = "/warp-engine-outline.js?v=4";
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
      // NEW: mode coupling
      mode: parameters?.mode || 'hover',
      dutyCycle: parameters?.dutyCycle ?? 0.14,
      sectors: parameters?.sectors ?? 1,
      gammaGeo: parameters?.gammaGeo ?? 26,
      qSpoil: parameters?.qSpoil ?? 1.0,
      qCavity: parameters?.qCavity ?? 1e9,
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
      // NEW: mode coupling
      mode: parameters?.mode || 'hover',
      dutyCycle: parameters?.dutyCycle ?? 0.14,
      sectors: parameters?.sectors ?? 1,
      gammaGeo: parameters?.gammaGeo ?? 26,
      qSpoil: parameters?.qSpoil ?? 1.0,
      qCavity: parameters?.qCavity ?? 1e9,
    });
  }, [parameters?.hull, parameters?.wallWidth, parameters?.epsilonTilt, parameters?.betaTiltVec, parameters?.mode, parameters?.dutyCycle, parameters?.sectors, parameters?.gammaGeo, parameters?.qSpoil, parameters?.qCavity]);

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <canvas ref={canvasRef} style={{ width: "100%", height: "420px", display: "block" }} />
    </div>
  );
}

export default ShellOutlineVisualizer;