/**
 * Analytic design numbers for the proposed terrestrial 171Yb clock comparison.
 * These functions make no claim about achieved apparatus performance.
 * Frequency: BIPM 2025 recommended 171Yb optical transition, active 2026-03-27.
 */
export const YB171_CLOCK_FREQUENCY_HZ = 518_295_836_590_863.632;
export const STANDARD_GRAVITY_M_S2 = 9.80665;
export const LIGHT_SPEED_M_S = 299_792_458;

export type TerrestrialClockSignal = {
  heightDifferenceM: number;
  potentialDifferenceM2S2: number;
  fractionalRateDifference: number;
  frequencyDifferenceHz: number;
  phaseRateRadS: number;
  phaseAfterOneSecondRad: number;
  secondsForHalfRadian: number;
};

export function terrestrialClockSignal(
  heightDifferenceM: number,
  gravityM_S2 = STANDARD_GRAVITY_M_S2,
  clockFrequencyHz = YB171_CLOCK_FREQUENCY_HZ,
): TerrestrialClockSignal {
  if (![heightDifferenceM, gravityM_S2, clockFrequencyHz].every(Number.isFinite) ||
      heightDifferenceM <= 0 || gravityM_S2 <= 0 || clockFrequencyHz <= 0) {
    throw new Error("Positive finite height, gravity, and clock frequency are required");
  }
  const potentialDifferenceM2S2 = gravityM_S2 * heightDifferenceM;
  const fractionalRateDifference = potentialDifferenceM2S2 / LIGHT_SPEED_M_S ** 2;
  const frequencyDifferenceHz = clockFrequencyHz * fractionalRateDifference;
  const phaseRateRadS = 2 * Math.PI * frequencyDifferenceHz;
  return {
    heightDifferenceM,
    potentialDifferenceM2S2,
    fractionalRateDifference,
    frequencyDifferenceHz,
    phaseRateRadS,
    phaseAfterOneSecondRad: phaseRateRadS,
    secondsForHalfRadian: 0.5 / phaseRateRadS,
  };
}

export function responseCoefficients(kappaPlus: number, kappaMinus: number) {
  if (![kappaPlus, kappaMinus].every(Number.isFinite)) {
    throw new Error("Finite response coefficients are required");
  }
  return {
    kappa0: (kappaPlus + kappaMinus) / 2,
    etaES: (kappaPlus - kappaMinus) / 2,
  };
}

/** Ideal binary parity model near calibrated analysis phases. */
export function matchingOutcomeProbability(
  phaseRad: number,
  spinAssociation: 1 | -1,
  contrast: number,
  spinRotationRad: number,
  referencePhaseRad = 0,
) {
  if (![phaseRad, contrast, spinRotationRad, referencePhaseRad].every(Number.isFinite) ||
      contrast < 0 || contrast > 1) {
    throw new Error("Finite phase inputs and contrast in [0,1] are required");
  }
  const parity = contrast * Math.cos(
    phaseRad + spinAssociation * spinRotationRad - referencePhaseRad,
  );
  return (1 + parity) / 2;
}

/** Successful pair measurements, before losses, calibration, and systematics. */
export function idealSuccessfulPairsForUncertainty(
  heightDifferenceM: number,
  interrogationS: number,
  contrast: number,
  targetCoefficientUncertainty: number,
) {
  if (![interrogationS, contrast, targetCoefficientUncertainty].every(Number.isFinite) ||
      interrogationS <= 0 || contrast <= 0 || contrast > 1 || targetCoefficientUncertainty <= 0) {
    throw new Error("Positive finite interrogation, contrast, and target uncertainty are required");
  }
  const phase = terrestrialClockSignal(heightDifferenceM).phaseRateRadS * interrogationS;
  return Math.ceil(1 / (contrast * phase * targetCoefficientUncertainty) ** 2);
}
