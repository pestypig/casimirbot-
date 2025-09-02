// warp-uniforms.ts
// Canonical normalization for warp renderer uniforms, with robust aliasing
// and physics-aware fallbacks so UI code can depend on consistent fields.

// ─────────────────────────────────────────────────────────────────────────────
// Warp uniforms normalization + pane builders (authoritative, pane-agnostic)
// ─────────────────────────────────────────────────────────────────────────────

type Num = number | undefined | null;
const N = (x: Num, d = 0) => (Number.isFinite(x as number) ? Number(x) : d);
const clamp = (x:number, lo:number, hi:number)=>Math.max(lo, Math.min(hi, x));

export type WarpUniforms = {
  // sectors + duties
  sectorCount: number;         // ship-wide total sectors (e.g. 400)
  sectors: number;             // sectors concurrently live in this pane
  dutyCycle: number;           // local burst duty (UI knob)
  dutyLocal: number;           // alias of dutyCycle
  dutyEffectiveFR: number;     // Ford–Roman effective duty (server preferred)
  // chain
  gammaGeo: number;            // 26
  deltaAOverA: number;         // q
  qSpoilingFactor: number;     // alias of q
  gammaVdB: number;            // visual γ_VdB (SHOW)
  gammaVanDenBroeck: number;   // alias
  gammaVanDenBroeck_vis: number;
  gammaVanDenBroeck_mass: number;
  // hints
  thetaScaleExpected?: number;
  viewAvg?: boolean;
  viewMassFraction?: number;
  colorMode?: 'theta'|'curvature'|'power';
  // purple shift
  epsilonTilt?: number;
  betaTiltVec?: [number, number, number];
  // tagging
  __src?: string;
  __version?: number;
};

export function normalizeWU(raw: any = {}): WarpUniforms {
  const sectorCount = Math.max(1, Math.floor(N(raw.sectorCount, 400)));
  const sectors     = Math.max(1, Math.floor(N(raw.sectors, 1)));

  // Prefer server-computed FR duty if present, else reconstruct d_FR = dutyLocal * (S_live / S_total)
  const dutyLocal        = clamp(N(raw.dutyCycle, N(raw.dutyLocal, 0.01)), 0, 1);
  const frHint           = raw.dutyEffective_FR ?? raw.dutyEffectiveFR; // server name(s)
  const dutyEffectiveFR  = Number.isFinite(+frHint)
    ? clamp(+frHint, 0, 1)
    : clamp(dutyLocal * (sectors / sectorCount), 0, 1);

  const gammaGeo         = Math.max(1, N(raw.gammaGeo ?? raw.g_y, 26));
  const deltaAOverA      = Math.max(1e-12, N(raw.deltaAOverA ?? raw.qSpoilingFactor, 1));
  const qSpoilingFactor  = deltaAOverA;
  const gammaVdB_vis     = Math.max(1, N(raw.gammaVanDenBroeck_vis ?? raw.gammaVanDenBroeck ?? raw.gammaVdB, 2.86e5));
  const gammaVdB_mass    = Math.max(1, Math.min(1e2, N(raw.gammaVanDenBroeck_mass, 38.3)));

  // server hint (expected θ) is UI-only
  const thetaScaleExpected = Number.isFinite(+raw.thetaScaleExpected) ? +raw.thetaScaleExpected : undefined;

  // pane-agnostic defaults: view-averaging on (pane decides how to display)
  const viewAvg = true;
  const viewMassFraction = sectors / sectorCount;

  return {
    ...raw,
    // normalized numerics
    sectorCount, sectors, dutyCycle: dutyLocal, dutyLocal, dutyEffectiveFR,
    gammaGeo,
    // q aliases
    deltaAOverA, qSpoilingFactor, qSpoil: deltaAOverA,
    // γ aliases
    gammaVdB: gammaVdB_vis,
    gammaVanDenBroeck: gammaVdB_vis,
    gammaVanDenBroeck_vis: gammaVdB_vis,
    gammaVanDenBroeck_mass: gammaVdB_mass,
    // expected θ (hint)
    thetaScaleExpected,
    // renderer helpers
    viewAvg, viewMassFraction,
    colorMode: raw.colorMode ?? 'theta',
    // purple shift passthrough (already clamped elsewhere)
    epsilonTilt: raw.epsilonTilt,
    betaTiltVec: raw.betaTiltVec,
    __src: raw.__src ?? 'server',
    __version: Number.isFinite(+raw.__version) ? +raw.__version : 1,
  };
}

// Helper: deterministic pane view fraction
export function viewMassFractionForPane(wu: WarpUniforms, pane: 'REAL'|'SHOW') {
  return pane === 'REAL' ? (1 / Math.max(1, wu.sectorCount)) : 1.0;
}

// Pane builders (parity/ridge decided here; theta never shipped from UI)
export function buildREAL(wu: WarpUniforms) {
  return {
    ...wu,
    physicsParityMode: true,
    ridgeMode: 0,
    viewAvg: true,
    // REAL visuals use FR directly; collapse sectors so engine sees the averaged duty:
    dutyEffectiveFR: wu.dutyEffectiveFR,
    dutyCycle: wu.dutyEffectiveFR,
    sectors: 1,
    sectorCount: 1,
    vShip: 0,
    // Mass-pocket γ (clamped physical range); visual γ is logged only
    gammaVanDenBroeck_mass: wu.gammaVanDenBroeck_mass,
    gammaVanDenBroeck_vis: wu.gammaVanDenBroeck_vis,
    // never ship UI theta
    thetaScale: undefined,
    u_thetaScale: undefined,
  };
}

export function buildSHOW(wu: WarpUniforms, opts?: { T?: number; boost?: number; userGain?: number }) {
  const T = clamp(N(opts?.T, 0.70), 0, 1);
  const boost = Math.max(1, N(opts?.boost, 40));
  return {
    ...wu,
    physicsParityMode: false,
    ridgeMode: 1,
    viewAvg: true,          // SHOW is non-FR; averaging state shouldn't affect pane mass=1.0
    // SHOW displays instantaneous local view (sectors/sectors don't downscale display mass)
    dutyCycle: wu.dutyCycle,
    sectors: wu.sectors,
    sectorCount: wu.sectorCount,
    vShip: 1,
    gammaVanDenBroeck_vis: wu.gammaVanDenBroeck_vis,
    curvatureGainT: T,
    curvatureBoostMax: boost,
    userGain: Math.max(1, N(opts?.userGain, 2)),
    // never ship UI theta
    thetaScale: undefined,
    u_thetaScale: undefined,
  };
}

// --- compatibility aliases for existing call-sites ---
export const buildRealPacket = buildREAL;
export const buildShowPacket = buildSHOW;

// ---- Legacy shims (keep until every call-site is migrated) ----
export { buildREAL, buildSHOW };