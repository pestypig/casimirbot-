/**
 * Natário Metric — pipeline-true implementation + renderer metric uniforms
 * Conforms to EnergyPipelineState fields and FR duty usage.
 *
 * Also includes compact helpers that match your 12-case classification:
 * curves (1D), surfaces (2D), volumes (3D), graph forms, and spherical ↔ Cartesian maps.
 */
// ------------------------ Constants / Types ---------------------------------
import { PHYSICS_CONSTANTS } from '../core/physics-constants';
const C = PHYSICS_CONSTANTS.C;                    // m/s
const NM_TO_M = 1e-9;
const G = 6.67430e-11;                  // m³/(kg·s²)
const clamp01 = (x: number, lo = 1e-12) => Math.max(lo, Math.min(1, Number(x) || 0));

// Minimal shape expected from the pipeline (duck-typed)
export type PipelineLike = {
  // geometry / tiles
  tileArea_cm2?: number;
  gap_nm?: number;
  N_tiles?: number;
  hull?: { Lx_m: number; Ly_m: number; Lz_m: number; wallThickness_m?: number };
  // sectors / duty
  dutyEffective_FR?: number;         // canonical FR duty (preferred)
  dutyEffectiveFR?: number;          // alias used in UI/renderer
  sectorCount?: number;
  sectorStrobing?: number;           // concurrent sectors
  // gains
  gammaGeo?: number;
  gammaVanDenBroeck?: number;
  qCavity?: number;
  qSpoilingFactor?: number;
  // modulation
  modulationFreq_GHz?: number;
};

export interface MetricUniforms {
  useMetric: boolean;
  metric: number[];     // 3×3 row-major
  metricInv: number[];  // 3×3 row-major
}

export interface NatarioMetricResult {
  stressEnergyT00: number;       // J/m³ (time-averaged with FR duty)
  stressEnergyT11: number;       // −J/m³ (principal pressure proxy)
  stressEnergyT00_inst: number;  // J/m³ instantaneous (no duty avg)
  natarioShiftAmplitude: number; // β (dimensionless)
  sectorStrobingEfficiency: number;
  grValidityCheck: boolean;
  homogenizationRatio: number;   // τ_pulse / τ_LC
  timeAveragedCurvature: number; // ~ |G| scalar proxy
}

// ------------------------ Metric & Ellipsoid helpers ------------------------
const I3 = [1,0,0, 0,1,0, 0,0,1];
function invDiag3(d: [number,number,number]) { return [1/d[0],0,0, 0,1/d[1],0, 0,0,1/d[2]]; }

function axesFromHull(h?: PipelineLike['hull']): [number,number,number] {
  if (!h) return [503.5,132,86.5];
  return [h.Lx_m/2, h.Ly_m/2, h.Lz_m/2];
}
function geomMean(a:number,b:number,c:number){ return Math.cbrt(Math.max(1e-18,a*b*c)); }
function ellipsoidMetricDiag(a:number,b:number,c:number){
  // g_ij = diag(1/a², 1/b², 1/c²) so that ||x||_g ≈ ellipsoidal ρ
  return [1/(a*a),0,0, 0,1/(b*b),0, 0,0,1/(c*c)];
}
function geomFactorFromEllipsoid(a:number,b:number,c:number){
  const Reff = geomMean(a,b,c);
  return Reff / Math.max(a,b,c);
}

export function metricUniformsFromPipeline(state: PipelineLike, use=true): MetricUniforms {
  const [a,b,c] = axesFromHull(state.hull);
  const g = ellipsoidMetricDiag(a,b,c);
  const inv = [a*a,0,0, 0,b*b,0, 0,0,c*c];
  return { useMetric: !!use, metric: g, metricInv: inv };
}

// ------------------------ Core physics mapping ------------------------------
/**
 * Compute FR duty using the pipeline's canonical field if present.
 * Falls back to BURST_DUTY_LOCAL×(S_live/S_total) only if needed.
 */
function resolveDutyFR(state: PipelineLike): number {
  const given = state.dutyEffective_FR ?? state.dutyEffectiveFR;
  if (Number.isFinite(given as number) && (given as number) > 0) return clamp01(given as number);
  // soft fallback
  const S_total = Math.max(1, state.sectorCount ?? 400);
  const S_live  = Math.max(1, state.sectorStrobing ?? 1);
  const BURST_DUTY_LOCAL = 0.01;
  return clamp01(BURST_DUTY_LOCAL * (S_live / S_total));
}

/**
 * Stress-energy from per-tile static Casimir energy (J) already computed by the pipeline.
 * We reconstruct density via tile geometry and apply gains the same way θ does: γ_geo³ · γ_VdB · √(Q) · qSpoil
 */
export function computeStressEnergyFromPipeline(
  state: PipelineLike & { U_static?: number }
): { T00_avg: number; T00_inst: number; T11: number } {
  const E_tile = state.U_static ?? 0;           // J (per tile, static)
  const tileArea_m2 = (state.tileArea_cm2 ?? 25) * 1e-4;
  const gap_m = Math.max(1e-12, (state.gap_nm ?? 1) * NM_TO_M);
  const V_tile = Math.max(1e-18, tileArea_m2 * gap_m);
  const N = Math.max(1, state.N_tiles ?? 1.96e9);

  // Flat density (signed)
  const rho_flat = (E_tile / V_tile);          // J/m³, negative for Casimir if E_tile < 0

  const g = Math.max(1, state.gammaGeo ?? 26);
  const vdb = Math.max(1, state.gammaVanDenBroeck ?? 1);
  const qC = Math.max(1, state.qCavity ?? 1e9);
  const qS = Math.max(1e-12, state.qSpoilingFactor ?? 1);
  const Qgain = Math.sqrt(qC / 1e9);           // gentle Q model as agreed

  const rho_inst = rho_flat * Math.pow(g,3) * vdb * Qgain * qS;
  const dFR = resolveDutyFR(state);
  const rho_avg = rho_inst * dFR;

  // Pressure proxy (principal) ~ −ρ for Casimir-like stress
  return { T00_avg: rho_avg, T00_inst: rho_inst, T11: -rho_avg };
}

export function computeNatarioShiftBeta(
  T00_avg: number,
  hull: PipelineLike['hull']
): number {
  const [a,b,c] = axesFromHull(hull);
  const R = geomMean(a,b,c);
  const geo = geomFactorFromEllipsoid(a,b,c);
  const base = Math.sqrt(Math.max(0, (8*Math.PI*G*Math.abs(T00_avg)) / (C*C)));
  return base * R * geo; // dimensionless β
}

export function computeHomogenization(
  modulationFreq_GHz: number | undefined,
  tauLC_s: number | undefined
): { ratio: number; valid: boolean } {
  const fGHz = Math.max(1e-3, Number(modulationFreq_GHz ?? 15));
  const Tp = 1 / (fGHz * 1e9);
  const tLC = Math.max(1e-9, Number(tauLC_s ?? 1e-7)); // default 100 ns
  const r = Tp / tLC;
  return { ratio: r, valid: r < 1e-3 };
}

export function computeCurvatureProxy(T00_avg: number, homogenizationRatio: number): number {
  const einstein = (8*Math.PI*G) / (C**4);
  const k = 1.0;
  const H = Math.exp(-k * homogenizationRatio);
  return einstein * Math.abs(T00_avg) * H;
}

export function computeStrobingEfficiency(sectorCount: number|undefined, dFR: number, homogRatio: number): number {
  const tess = Math.min(1, Math.max(1, sectorCount ?? 400)/400);
  const duty = Math.sqrt(Math.max(0, dFR));
  const kT = 10.0;
  const temp = Math.exp(-kT * homogRatio);
  return tess * duty * temp;
}

/**
 * End-to-end Natário metric result + metric uniforms, fed from the pipeline state.
 * `U_static` should be the *per-tile* static Casimir energy (J) from the pipeline.
 */
export function natarioFromPipeline(state: PipelineLike & { U_static?: number }): NatarioMetricResult & MetricUniforms {
  const { T00_avg, T00_inst, T11 } = computeStressEnergyFromPipeline(state);
  const beta = computeNatarioShiftBeta(T00_avg, state.hull);
  const { ratio, valid } = computeHomogenization(state.modulationFreq_GHz, undefined);
  const K = computeCurvatureProxy(T00_avg, ratio);
  const eff = computeStrobingEfficiency(state.sectorCount, resolveDutyFR(state), ratio);
  const uniforms = metricUniformsFromPipeline(state, true);
  return {
    stressEnergyT00: T00_avg,
    stressEnergyT11: T11,
    stressEnergyT00_inst: T00_inst,
    natarioShiftAmplitude: beta,
    sectorStrobingEfficiency: eff,
    grValidityCheck: valid,
    homogenizationRatio: ratio,
    timeAveragedCurvature: K,
    ...uniforms
  };
}

// ------------------------ 12-case parameterization helpers ------------------
// 1) Curve: t ↦ (x,y,z)
export function generateCurve(
  f: (t:number)=>[number,number,number], t0:number, t1:number, segments:number
): Float32Array {
  const n = segments+1, pts = new Float32Array(n*3);
  for(let i=0;i<n;i++){ const t=t0+(t1-t0)*(i/segments); const [x,y,z]=f(t); pts.set([x,y,z], i*3); }
  return pts;
}
// 2) Surface: (u,v) ↦ (x,y,z)
export function generateSurface(
  f:(u:number,v:number)=>[number,number,number],
  u0:number,u1:number,uSeg:number,
  v0:number,v1:number,vSeg:number
): {positions:Float32Array; indices:Uint32Array} {
  const nx=uSeg+1, ny=vSeg+1, pos=new Float32Array(nx*ny*3);
  for(let j=0;j<ny;j++){ const v=v0+(v1-v0)*(j/vSeg);
    for(let i=0;i<nx;i++){ const u=u0+(u1-u0)*(i/uSeg);
      const [x,y,z]=f(u,v); pos.set([x,y,z], 3*(j*nx+i)); } }
  const idx=new Uint32Array(uSeg*vSeg*6); let p=0;
  for(let j=0;j<vSeg;j++) for(let i=0;i<uSeg;i++){
    const a=j*nx+i, b=a+1, c=a+nx, d=c+1; idx.set([a,b,c, b,d,c], p); p+=6; }
  return {positions:pos, indices:idx};
}
// 3) Volume: (u,v,t) ↦ (x,y,z) (point cloud)
export function generateVolume(
  f:(u:number,v:number,t:number)=>[number,number,number],
  u0:number,u1:number,uSeg:number,
  v0:number,v1:number,vSeg:number,
  t0:number,t1:number,tSeg:number
): Float32Array {
  const tot=(uSeg+1)*(vSeg+1)*(tSeg+1), pos=new Float32Array(tot*3); let p=0;
  for(let k=0;k<=tSeg;k++){ const tt=t0+(t1-t0)*(k/tSeg);
    for(let j=0;j<=vSeg;j++){ const v=v0+(v1-v0)*(j/vSeg);
      for(let i=0;i<=uSeg;i++){ const u=u0+(u1-u0)*(i/uSeg);
        const [x,y,z]=f(u,v,tt); pos.set([x,y,z], p); p+=3; } } }
  return pos;
}
// 10/10b) Spherical ↔ Cartesian maps
export const sphFromXYZ = (x:number,y:number,z:number): [number,number,number] => {
  const rho = Math.hypot(x,y,z) || 1e-12;
  const theta = Math.atan2(y,x);
  const phi = Math.acos(Math.max(-1, Math.min(1, z / rho)));
  return [rho, theta, phi];
};
export const xyzFromSph = (rho:number,theta:number,phi:number): [number,number,number] => {
  const s = Math.sin(phi), c = Math.cos(phi);
  return [rho*Math.cos(theta)*s, rho*Math.sin(theta)*s, rho*c];
};

// (4–6, 7–9, 11–12) are compositions of the above: graphs and transforms can be
// expressed by wrapping your f(u,v,…) and applying sphFromXYZ/xyzFromSph as needed.

// ---------------------------------------------------------------------------
// 🔁 Legacy API shims (compat with older imports)
// ---------------------------------------------------------------------------
// Old signature: (params, casimirEnergy) -> NatarioMetricResult
export function calculateNatarioMetric(
  params: any,
  casimirEnergy: number
): NatarioMetricResult & MetricUniforms {
  // Adapt older shapes into the new pipeline-like state
  const state: PipelineLike & { U_static?: number } = {
    // geometry/tiles
    tileArea_cm2:
      (typeof params?.tileArea_cm2 === 'number' && params.tileArea_cm2) ? params.tileArea_cm2 :
      (typeof params?.tileArea_m2 === 'number' ? params.tileArea_m2 * 1e4 : undefined),
    gap_nm: params?.gap_nm ?? params?.gap ?? 1,
    N_tiles: params?.N_tiles,
    hull: params?.hull,
    // sectors/duty (prefer FR if provided)
    dutyEffective_FR: params?.dutyEffective_FR ?? params?.dutyEffectiveFR,
    sectorCount: params?.sectorCount,
    sectorStrobing: params?.sectorStrobing,
    // gains
    gammaGeo: params?.gammaGeo,
    gammaVanDenBroeck: params?.gammaVanDenBroeck ?? params?.gammaVdB,
    qCavity: params?.qCavity ?? params?.cavityQ,
    qSpoilingFactor: params?.qSpoilingFactor ?? params?.deltaAOverA,
    // modulation
    modulationFreq_GHz: params?.modulationFreq_GHz,
    // pipeline per-tile energy (legacy call passed total/flat energy separately)
    U_static: casimirEnergy
  };
  return natarioFromPipeline(state);
}

// Old helper: keep same booleans/thresholds
export function validateGRConsistency(result: NatarioMetricResult): {
  strategyA: boolean;       // τ_pulse ≪ τ_LC
  burnettConjecture: boolean;
  fordRomanBound: boolean;
} {
  return {
    strategyA: result.homogenizationRatio < 1e-3,
    burnettConjecture: result.timeAveragedCurvature > 0 && result.grValidityCheck,
    fordRomanBound: result.sectorStrobingEfficiency > 0.1 && result.stressEnergyT00 < 0
  };
}

// Note: NatarioMetricResult is already exported above, so legacy imports will work