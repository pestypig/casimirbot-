export type WarpUniforms = {
  hull?: { a:number; b:number; c:number };
  axesScene?: [number,number,number];
  gridSpan?: number;
  wallWidth_m?: number;
  wallWidth_rho?: number;

  sectorCount: number;     // total
  sectors: number;         // concurrent
  dutyCycle: number;       // UI duty (0..1)
  dutyEffectiveFR: number; // FR ship-wide duty (0..1)

  gammaGeo: number;
  gammaVdB?: number;
  gammaVanDenBroeck?: number; // legacy alias
  deltaAOverA?: number;
  qSpoilingFactor?: number;   // legacy alias
  currentMode?: 'hover'|'cruise'|'emergency'|'standby';
};

const N = (x:any,d:any)=>Number.isFinite(+x)?+x:d;

export function normalizeWU(raw:any): WarpUniforms {
  if (!raw) return {
    sectorCount: 400, sectors: 1, dutyCycle: 0.01, dutyEffectiveFR: 0.01/400,
    gammaGeo: 26, gammaVdB: 1.4e5, deltaAOverA: 1
  };
  return {
    ...raw,
    gammaVdB: N(raw.gammaVdB ?? raw.gammaVanDenBroeck, 1.4e5),
    deltaAOverA: Math.max(1e-12, N(raw.deltaAOverA ?? raw.qSpoilingFactor, 1)),
    sectorCount: Math.max(1, N(raw.sectorCount, 400)),
    sectors: Math.max(1, N(raw.sectors, 1)),
    dutyCycle: Math.max(1e-12, N(raw.dutyCycle, 0.01)),
    dutyEffectiveFR: Math.max(1e-12, N(raw.dutyEffectiveFR, 0.01/Math.max(1,N(raw.sectorCount,400)))),
    gammaGeo: N(raw.gammaGeo, 26),
  };
}

// Pane builders (only pane-specific spice added here)
export function buildREAL(wu: WarpUniforms) {
  return {
    ...wu,
    physicsParityMode: true,
    ridgeMode: 0,
    exposure: 3.5,
    zeroStop: 1e-6,
    userGain: 1,
    displayGain: 1,
  };
}

export function buildSHOW(wu: WarpUniforms, opts?: { T?:number; boost?:number; userGain?:number }) {
  const T = Math.max(0, Math.min(1, opts?.T ?? 0.70));
  const boost = Math.max(1, opts?.boost ?? 40);
  return {
    ...wu,
    physicsParityMode: false,
    ridgeMode: 1,
    exposure: 6,
    zeroStop: 1e-7,
    curvatureGainT: T,
    curvatureBoostMax: boost,
    userGain: Math.max(1, opts?.userGain ?? 2),
  };
}