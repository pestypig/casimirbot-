export type CurvatureLeverageLane =
  | "nhm2_full_solve"
  | "self_gravity_shape"
  | "tidal_response"
  | "ring_wave_response"
  | "stellar_hydrostatic";

export type CurvatureLeverageSourceKind =
  | "metric_required_tensor"
  | "mass_density"
  | "energy_density"
  | "tidal_potential"
  | "pressure_gradient";

export type CurvatureLeverageClaimTier = "diagnostic" | "reduced_order";
export type Nhm2CurvatureLeverageRegion = "global" | "hull" | "wall" | "exterior_shell";
export type Nhm2ClosureStatus = "pass" | "review" | "fail";
export type Nhm2EvidenceStatus = "present" | "missing" | "fail";

export interface CurvatureLeverageObservable {
  id: string;
  lane: CurvatureLeverageLane;
  sourceKind: CurvatureLeverageSourceKind;
  kappa_m2?: number;
  leverLength_m: number;
  leverage: number;
  responseGain: number;
  closureQuality: number;
  responseWeightedLeverage: number;
  responseLawId: string;
  closureMetricId: string;
  claimTier: CurvatureLeverageClaimTier;
  promotionAllowed: false;
}

export interface NHM2FullSolveCurvatureLeverage {
  lane: "nhm2_full_solve";
  metricRequiredTensorRef: string;
  tileEffectiveTensorRef?: string;
  region: Nhm2CurvatureLeverageRegion;
  leverLength_m: number;
  tensorNorm_m2: number;
  leverage: number;
  residualRelLInf?: number;
  observerClosureStatus: Nhm2ClosureStatus;
  qeiStatus: Nhm2EvidenceStatus;
  conservationStatus: Nhm2EvidenceStatus;
  promotionAllowed: false;
}

export function scaleNormalizedCurvatureLeverage(kappa_m2: number, leverLength_m: number): number {
  assertFinite("kappa_m2", kappa_m2);
  assertPositiveFinite("leverLength_m", leverLength_m);
  return Math.abs(kappa_m2) * leverLength_m * leverLength_m;
}

export function responseWeightedCurvatureLeverage(args: {
  leverage: number;
  responseGain?: number;
  closureQuality?: number;
}): number {
  assertFinite("leverage", args.leverage);
  const responseGain = args.responseGain ?? 1;
  const closureQuality = args.closureQuality ?? 1;
  assertNonnegativeFinite("responseGain", responseGain);
  assertNonnegativeFinite("closureQuality", closureQuality);
  return args.leverage * responseGain * closureQuality;
}

export function buildCurvatureLeverageObservable(
  args: Omit<
    CurvatureLeverageObservable,
    "leverage" | "responseWeightedLeverage" | "responseGain" | "closureQuality" | "promotionAllowed"
  > & {
    kappa_m2: number;
    responseGain?: number;
    closureQuality?: number;
  },
): CurvatureLeverageObservable {
  const leverage = scaleNormalizedCurvatureLeverage(args.kappa_m2, args.leverLength_m);
  const responseGain = args.responseGain ?? 1;
  const closureQuality = args.closureQuality ?? 1;
  return {
    ...args,
    responseGain,
    closureQuality,
    leverage,
    responseWeightedLeverage: responseWeightedCurvatureLeverage({
      leverage,
      responseGain,
      closureQuality,
    }),
    promotionAllowed: false,
  };
}

export function buildNhm2FullSolveCurvatureLeverage(
  args: Omit<NHM2FullSolveCurvatureLeverage, "lane" | "leverage" | "promotionAllowed">,
): NHM2FullSolveCurvatureLeverage {
  return {
    ...args,
    lane: "nhm2_full_solve",
    leverage: scaleNormalizedCurvatureLeverage(args.tensorNorm_m2, args.leverLength_m),
    promotionAllowed: false,
  };
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be finite`);
  }
}

function assertPositiveFinite(name: string, value: number): void {
  assertFinite(name, value);
  if (value <= 0) {
    throw new RangeError(`${name} must be positive`);
  }
}

function assertNonnegativeFinite(name: string, value: number): void {
  assertFinite(name, value);
  if (value < 0) {
    throw new RangeError(`${name} must be nonnegative`);
  }
}
