import React, { useEffect, useRef, useState } from "react";
import { gatedUpdateUniforms } from "@/lib/warp-uniforms-gate";

type MechanicalParams = {
  /** Power-only mechanical knob from pipeline (used to back out damping) */
  qMechanical?: number;          // dimensionless
  /** Mechanical resonance center (Hz). If omitted, default to modulation freq */
  mechResonance_Hz?: number;     // f0
  /** Damping ratio ζ. If omitted, infer from qMechanical: Q≈1/(2ζ) */
  mechZeta?: number;             // ζ in [0, 1)
  /** Coupling strength of mech chain into the visible shell modulation */
  mechCoupling?: number;         // 0..1 (UI gain)
};

type Props = {
  parameters?: {
    hull?: { a:number; b:number; c:number };
    wallWidth?: number;
    epsilonTilt?: number;
    betaTiltVec?: [number,number,number];
    // Mode coupling
    mode?: string;
    dutyCycle?: number;
    sectors?: number;
    gammaGeo?: number;
    qSpoil?: number;
    qCavity?: number;
    // NEW: Mechanical response parameters
    qMechanical?: number;
    modulationHz?: number;        // convenience (else derive from pipeline GHz)
    mech?: MechanicalParams;
    // Ford-Roman window + light-crossing data
    dutyEffectiveFR?: number;     // authoritative burst/dwell ratio
    lightCrossing?: { tauLC_ms?: number; dwell_ms?: number; burst_ms?: number; };
    zeta?: number;                // Ford-Roman ζ for breach warnings
  };
  debugTag?: string; // Debug tag for console logging
};

declare global { interface Window { OutlineEngine?: any; } }

export function ShellOutlineVisualizer({ parameters, debugTag }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<any>(null);
  const [ready, setReady] = useState(!!window.OutlineEngine);

  // Mechanical response calculations
  const hull = parameters?.hull || { a: 0.42, b: 0.11, c: 0.09 };
  const f_mod = parameters?.modulationHz ?? 15e9;             // Hz (default 15 GHz)
  const qMech = parameters?.qMechanical ?? 1;                 // from pipeline
  const f0 = parameters?.mech?.mechResonance_Hz ?? f_mod;     // default: centered
  const zeta = parameters?.mech?.mechZeta 
             ?? (qMech > 0 ? 1 / (2 * qMech) : 0.005);       // Q≈1/(2ζ)
  const kCouple = Math.min(1, Math.max(0, parameters?.mech?.mechCoupling ?? 0.6));

  // Relative amplitude A_rel(ω) for a damped resonator at drive frequency f_mod
  const r = f_mod / f0; // ω/ω0 (since r uses frequency ratio, 2π cancels)
  const Arel = 1 / Math.sqrt((1 - r*r)**2 + (2*zeta*r)**2);  // dimensionless

  // Squash to a sane visual range; respect user coupling
  const mechGain = Math.tanh(kCouple * Arel);                // 0..~1

  console.log(`🔧 MECHANICAL RESPONSE: f_mod=${(f_mod/1e9).toFixed(1)}GHz, f0=${(f0/1e9).toFixed(1)}GHz, ζ=${zeta.toFixed(3)}, A_rel=${Arel.toFixed(2)}, mechGain=${mechGain.toFixed(3)}`);

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
      if (debugTag && typeof engineRef.current.setDebugTag === 'function') {
        engineRef.current.setDebugTag(debugTag);
      }
    }
    const initialUniforms = {
      hullAxes: [hull.a, hull.b, hull.c],
      wallWidth: parameters?.wallWidth ?? 0.06,
      epsilonTilt: parameters?.epsilonTilt ?? 0.0,
      betaTiltVec: parameters?.betaTiltVec || [0,-1,0],
      // Mode coupling
      mode: parameters?.mode || 'hover',
      dutyCycle: parameters?.dutyCycle ?? 0.14,
      sectors: parameters?.sectors ?? 1,
      gammaGeo: parameters?.gammaGeo ?? 26,
      qSpoil: parameters?.qSpoil ?? 1.0,
      qCavity: parameters?.qCavity ?? 1e9,

      // NEW: mechanical uniforms
      qMechanical: qMech,
      fMod_Hz: f_mod,
      f0_Hz: f0,
      mechZeta: zeta,
      mechGain,           // single "is-mechanics-hot?" scalar for the shader
      
      // Ford-Roman window + light-crossing data
      dutyEffectiveFR: parameters?.dutyEffectiveFR ?? 0.01,
      lightCrossing: parameters?.lightCrossing,
      zeta: parameters?.zeta
    };
    engineRef.current.bootstrap(initialUniforms);
  }, [ready]);

  useEffect(() => {
    if (!engineRef.current) return;
    const updatedUniforms = {
      hullAxes: [hull.a, hull.b, hull.c],
      wallWidth: parameters?.wallWidth ?? 0.06,
      epsilonTilt: parameters?.epsilonTilt ?? 0.0,
      betaTiltVec: parameters?.betaTiltVec || [0,-1,0],
      // Mode coupling
      mode: parameters?.mode || 'hover',
      dutyCycle: parameters?.dutyCycle ?? 0.14,
      sectors: parameters?.sectors ?? 1,
      gammaGeo: parameters?.gammaGeo ?? 26,
      qSpoil: parameters?.qSpoil ?? 1.0,
      qCavity: parameters?.qCavity ?? 1e9,

      // NEW: mechanical uniforms (computed above)
      qMechanical: qMech,
      fMod_Hz: f_mod,
      f0_Hz: f0,
      mechZeta: zeta,
      mechGain,           // single "is-mechanics-hot?" scalar for the shader
      
      // Ford-Roman window + light-crossing data
      dutyEffectiveFR: parameters?.dutyEffectiveFR ?? 0.01,
      lightCrossing: parameters?.lightCrossing,
      zeta: parameters?.zeta
    };
    gatedUpdateUniforms(engineRef.current, updatedUniforms, 'shell-outline');
  }, [hull.a, hull.b, hull.c, parameters?.wallWidth, parameters?.epsilonTilt, parameters?.betaTiltVec, parameters?.mode, parameters?.dutyCycle, parameters?.sectors, parameters?.gammaGeo, parameters?.qSpoil, parameters?.qCavity, parameters?.qMechanical, parameters?.modulationHz, parameters?.mech, qMech, f_mod, f0, zeta, mechGain, parameters?.dutyEffectiveFR, parameters?.lightCrossing, parameters?.zeta]);

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <canvas ref={canvasRef} style={{ width: "100%", height: "420px", display: "block" }} />
    </div>
  );
}

export default ShellOutlineVisualizer;