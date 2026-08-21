// math-stage: diagnostic

import {
  computeLifshitzEquilibrium,
  type LifshitzMaterial,
  type LifshitzSolverInput,
} from "./casimir-lifshitz";

export const NHM2_CASIMIR_CYCLE_WORK_VERSION = "nhm2_casimir_cycle_work/v1";

export type Nhm2CasimirCycleKind =
  "gap_only_control" | "switchable_material" | "thermal_nonreciprocal";

export type Nhm2CasimirForceCurveV1 = {
  stateId: string;
  evidenceTier: "measured" | "validated_simulation" | "literature_anchored";
  method:
    | "measured_force_curve"
    | "finite_geometry_maxwell_stress"
    | "equilibrium_lifshitz_planar";
  artifactSha256: string;
  gapsMeters: number[];
  forcesNewtons: number[];
  forceStandardUncertaintyNewtons: number[];
};

export type Nhm2CasimirCycleWorkInputV1 = {
  contractVersion: typeof NHM2_CASIMIR_CYCLE_WORK_VERSION;
  cycleId: string;
  systemBoundaryId: string;
  cycleKind: Nhm2CasimirCycleKind;
  couponTargetGapMeters: number;
  allowedCouponGapRangeMeters: readonly [number, number];
  contractionCurve: Nhm2CasimirForceCurveV1;
  expansionCurve: Nhm2CasimirForceCurveV1;
  supplyingReservoirIds: string[];
  switchingEnergyInputJ: number;
  actuatorEnergyInputJ: number;
  sensingControlEnergyInputJ: number;
  coolingEnergyInputJ: number;
  otherOperatingEnergyInputJ: number;
  identifiedInputExergyJ: number;
  hotReservoirTemperatureK: number | null;
  coldReservoirTemperatureK: number | null;
  hotReservoirEnergyInputJ: number | null;
};

export type Nhm2CasimirLifshitzCycleInputV1 = {
  cycleId: string;
  systemBoundaryId: string;
  cycleKind: "gap_only_control" | "switchable_material";
  temperatureK: number;
  areaM2: number;
  gapsMeters: number[];
  fixedMaterial: LifshitzMaterial;
  contractionStateId: string;
  contractionMaterial: LifshitzMaterial;
  contractionCalculationSha256: string;
  expansionStateId: string;
  expansionMaterial: LifshitzMaterial;
  expansionCalculationSha256: string;
  relativeModelForceUncertainty: number;
  numerics: LifshitzSolverInput["numerics"];
  supplyingReservoirIds: string[];
  switchingEnergyInputJ: number;
  actuatorEnergyInputJ: number;
  sensingControlEnergyInputJ: number;
  coolingEnergyInputJ: number;
  otherOperatingEnergyInputJ: number;
  identifiedInputExergyJ: number;
};

export type Nhm2CasimirCycleWorkResultV1 = {
  contractVersion: "nhm2_casimir_cycle_work_result/v1";
  status: "diagnostic_only";
  cycleKind: Nhm2CasimirCycleKind | null;
  derived: {
    contractionWorkByFieldJ: number | null;
    expansionWorkByFieldJ: number | null;
    grossMechanicalWorkByFieldJ: number | null;
    integratedForceUncertaintyJ: number | null;
    conservativeGrossMechanicalWorkLowerJ: number | null;
    totalKnownOperatingInputJ: number | null;
    mechanicalSurplusAfterKnownOperatingInputsJ: number | null;
    conservativeMechanicalSurplusLowerJ: number | null;
    exergyEfficiency: number | null;
    carnotEfficiencyLimit: number | null;
    thermalWorkLimitJ: number | null;
  };
  checks: {
    inputShapeValid: boolean;
    forceCurvesShareStrictGrid: boolean;
    couponTargetBracketed: boolean;
    allSupplyingReservoirsIdentified: boolean;
    gapOnlyNullControlPassed: boolean;
    usefulWorkWithinIdentifiedExergy: boolean;
    thermalCarnotBoundPassed: boolean;
    forceCurveEvidenceReady: boolean;
    measuredForceCurvesComplete: boolean;
  };
  experimentDecision:
    | "invalid_input"
    | "gap_only_null_reference"
    | "literature_model_requires_validated_force_curves"
    | "theoretical_margin_not_positive"
    | "reservoir_accounting_incomplete"
    | "validated_model_supports_coupon_test"
    | "measured_curve_supports_repeatability_test";
  blockers: string[];
  recommendedCoupon: {
    nominalGapMeters: 96e-9;
    allowedGapRangeMeters: readonly [80e-9, 150e-9];
    startQuasistatic: true;
    singlePairBeforeStack: true;
    requiredObservations: readonly [
      "force_gap_curve_in_each_state",
      "switching_and_reset_energy",
      "actuator_and_control_energy",
      "heat_radiation_and_leakage",
      "initial_final_state_closure",
      "repeat_cycle_drift_and_hysteresis",
    ];
  };
  claimBoundary: {
    diagnosticOnly: true;
    forceLoopAreaIsNotEnergyCreation: true;
    gapOnlyConservativeCycleCannotSupplyNetWork: true;
    everySupplyingReservoirMustBeBound: true;
    staticCasimirEnergyTimesFrequencyIsNotPower: true;
    couponResultDoesNotEstablishStackScaling: true;
    experimentRequiredForPracticalUtility: true;
    vacuumEnergyExtractionClaimAllowed: false;
    physicalViabilityClaimAllowed: false;
    propulsionClaimAllowed: false;
    transportClaimAllowed: false;
  };
};

const SHA256 = /^[0-9a-f]{64}$/;
const NOMINAL_COUPON_GAP_METERS = 96e-9;
const ALLOWED_COUPON_RANGE_METERS = [80e-9, 150e-9] as const;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const finiteNonnegative = (value: unknown): value is number =>
  finite(value) && value >= 0;

const boundedId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length >= 1 &&
  value.length <= 128 &&
  /^[\x20-\x7e]+$/.test(value);

const validCurve = (curve: Nhm2CasimirForceCurveV1): boolean => {
  if (
    !boundedId(curve?.stateId) ||
    !["measured", "validated_simulation", "literature_anchored"].includes(
      curve?.evidenceTier,
    ) ||
    ![
      "measured_force_curve",
      "finite_geometry_maxwell_stress",
      "equilibrium_lifshitz_planar",
    ].includes(curve?.method) ||
    !SHA256.test(curve?.artifactSha256 ?? "") ||
    !Array.isArray(curve?.gapsMeters) ||
    !Array.isArray(curve?.forcesNewtons) ||
    !Array.isArray(curve?.forceStandardUncertaintyNewtons) ||
    curve.gapsMeters.length < 3 ||
    curve.gapsMeters.length > 4096 ||
    curve.forcesNewtons.length !== curve.gapsMeters.length ||
    curve.forceStandardUncertaintyNewtons.length !== curve.gapsMeters.length
  ) {
    return false;
  }
  for (let index = 0; index < curve.gapsMeters.length; index += 1) {
    if (
      !finite(curve.gapsMeters[index]) ||
      curve.gapsMeters[index] <= 0 ||
      !finite(curve.forcesNewtons[index]) ||
      !finiteNonnegative(curve.forceStandardUncertaintyNewtons[index]) ||
      (index > 0 && curve.gapsMeters[index] <= curve.gapsMeters[index - 1])
    ) {
      return false;
    }
  }
  return true;
};

const trapezoid = (x: readonly number[], y: readonly number[]): number => {
  let sum = 0;
  for (let index = 1; index < x.length; index += 1) {
    sum += ((y[index - 1] + y[index]) / 2) * (x[index] - x[index - 1]);
  }
  return sum;
};

const round = (value: number): number => Number(value.toPrecision(15));

const emptyResult = (blockers: string[]): Nhm2CasimirCycleWorkResultV1 => ({
  contractVersion: "nhm2_casimir_cycle_work_result/v1",
  status: "diagnostic_only",
  cycleKind: null,
  derived: {
    contractionWorkByFieldJ: null,
    expansionWorkByFieldJ: null,
    grossMechanicalWorkByFieldJ: null,
    integratedForceUncertaintyJ: null,
    conservativeGrossMechanicalWorkLowerJ: null,
    totalKnownOperatingInputJ: null,
    mechanicalSurplusAfterKnownOperatingInputsJ: null,
    conservativeMechanicalSurplusLowerJ: null,
    exergyEfficiency: null,
    carnotEfficiencyLimit: null,
    thermalWorkLimitJ: null,
  },
  checks: {
    inputShapeValid: false,
    forceCurvesShareStrictGrid: false,
    couponTargetBracketed: false,
    allSupplyingReservoirsIdentified: false,
    gapOnlyNullControlPassed: false,
    usefulWorkWithinIdentifiedExergy: false,
    thermalCarnotBoundPassed: false,
    forceCurveEvidenceReady: false,
    measuredForceCurvesComplete: false,
  },
  experimentDecision: "invalid_input",
  blockers,
  recommendedCoupon: {
    nominalGapMeters: NOMINAL_COUPON_GAP_METERS,
    allowedGapRangeMeters: ALLOWED_COUPON_RANGE_METERS,
    startQuasistatic: true,
    singlePairBeforeStack: true,
    requiredObservations: [
      "force_gap_curve_in_each_state",
      "switching_and_reset_energy",
      "actuator_and_control_energy",
      "heat_radiation_and_leakage",
      "initial_final_state_closure",
      "repeat_cycle_drift_and_hysteresis",
    ],
  },
  claimBoundary: {
    diagnosticOnly: true,
    forceLoopAreaIsNotEnergyCreation: true,
    gapOnlyConservativeCycleCannotSupplyNetWork: true,
    everySupplyingReservoirMustBeBound: true,
    staticCasimirEnergyTimesFrequencyIsNotPower: true,
    couponResultDoesNotEstablishStackScaling: true,
    experimentRequiredForPracticalUtility: true,
    vacuumEnergyExtractionClaimAllowed: false,
    physicalViabilityClaimAllowed: false,
    propulsionClaimAllowed: false,
    transportClaimAllowed: false,
  },
});

export const computeNhm2CasimirCycleWork = (
  input: Nhm2CasimirCycleWorkInputV1,
): Nhm2CasimirCycleWorkResultV1 => {
  if (
    input?.contractVersion !== NHM2_CASIMIR_CYCLE_WORK_VERSION ||
    !boundedId(input?.cycleId) ||
    !boundedId(input?.systemBoundaryId) ||
    ![
      "gap_only_control",
      "switchable_material",
      "thermal_nonreciprocal",
    ].includes(input?.cycleKind) ||
    !finite(input?.couponTargetGapMeters) ||
    !Array.isArray(input?.allowedCouponGapRangeMeters) ||
    input.allowedCouponGapRangeMeters.length !== 2 ||
    !finite(input.allowedCouponGapRangeMeters[0]) ||
    !finite(input.allowedCouponGapRangeMeters[1]) ||
    input.allowedCouponGapRangeMeters[0] <= 0 ||
    input.allowedCouponGapRangeMeters[1] <=
      input.allowedCouponGapRangeMeters[0] ||
    input.couponTargetGapMeters !== NOMINAL_COUPON_GAP_METERS ||
    input.allowedCouponGapRangeMeters[0] !== ALLOWED_COUPON_RANGE_METERS[0] ||
    input.allowedCouponGapRangeMeters[1] !== ALLOWED_COUPON_RANGE_METERS[1] ||
    !validCurve(input?.contractionCurve) ||
    !validCurve(input?.expansionCurve) ||
    !Array.isArray(input?.supplyingReservoirIds) ||
    input.supplyingReservoirIds.length > 16 ||
    !input.supplyingReservoirIds.every(boundedId) ||
    new Set(input.supplyingReservoirIds).size !==
      input.supplyingReservoirIds.length ||
    ![
      input?.switchingEnergyInputJ,
      input?.actuatorEnergyInputJ,
      input?.sensingControlEnergyInputJ,
      input?.coolingEnergyInputJ,
      input?.otherOperatingEnergyInputJ,
      input?.identifiedInputExergyJ,
    ].every(finiteNonnegative)
  ) {
    return emptyResult(["cycle_input_invalid_or_unbounded"]);
  }

  const contraction = input.contractionCurve;
  const expansion = input.expansionCurve;
  const sharedGrid =
    contraction.gapsMeters.length === expansion.gapsMeters.length &&
    contraction.gapsMeters.every(
      (gap, index) => gap === expansion.gapsMeters[index],
    );
  if (!sharedGrid)
    return emptyResult(["force_curves_do_not_share_exact_ordered_grid"]);

  const minimumGap = contraction.gapsMeters[0];
  const maximumGap = contraction.gapsMeters[contraction.gapsMeters.length - 1];
  const couponTargetBracketed =
    input.couponTargetGapMeters >= minimumGap &&
    input.couponTargetGapMeters <= maximumGap;
  const contractionWork = -trapezoid(
    contraction.gapsMeters,
    contraction.forcesNewtons,
  );
  const expansionWork = trapezoid(
    expansion.gapsMeters,
    expansion.forcesNewtons,
  );
  const grossMechanicalWork = contractionWork + expansionWork;
  const combinedUncertainty = contraction.forceStandardUncertaintyNewtons.map(
    (value, index) => value + expansion.forceStandardUncertaintyNewtons[index],
  );
  const integratedUncertainty = trapezoid(
    contraction.gapsMeters,
    combinedUncertainty,
  );
  const conservativeGrossLower = grossMechanicalWork - integratedUncertainty;
  const totalKnownOperatingInput =
    input.switchingEnergyInputJ +
    input.actuatorEnergyInputJ +
    input.sensingControlEnergyInputJ +
    input.coolingEnergyInputJ +
    input.otherOperatingEnergyInputJ;
  const surplus = grossMechanicalWork - totalKnownOperatingInput;
  const conservativeSurplus = conservativeGrossLower - totalKnownOperatingInput;
  const exergyEfficiency =
    input.identifiedInputExergyJ > 0
      ? grossMechanicalWork / input.identifiedInputExergyJ
      : null;
  const reservoirsIdentified = input.supplyingReservoirIds.length > 0;
  const usefulWorkWithinIdentifiedExergy =
    grossMechanicalWork <= integratedUncertainty ||
    (input.identifiedInputExergyJ > 0 &&
      grossMechanicalWork <=
        input.identifiedInputExergyJ + integratedUncertainty);

  const thermalFieldsValid =
    input.cycleKind !== "thermal_nonreciprocal" ||
    (finite(input.hotReservoirTemperatureK) &&
      finite(input.coldReservoirTemperatureK) &&
      finiteNonnegative(input.hotReservoirEnergyInputJ) &&
      input.hotReservoirTemperatureK > input.coldReservoirTemperatureK &&
      input.coldReservoirTemperatureK > 0 &&
      input.hotReservoirEnergyInputJ > 0);
  if (!thermalFieldsValid)
    return emptyResult(["thermal_reservoir_definition_invalid"]);
  const carnotEfficiency =
    input.cycleKind === "thermal_nonreciprocal"
      ? 1 - input.coldReservoirTemperatureK! / input.hotReservoirTemperatureK!
      : null;
  const thermalWorkLimit =
    carnotEfficiency == null
      ? null
      : carnotEfficiency * input.hotReservoirEnergyInputJ!;
  const thermalCarnotBoundPassed =
    thermalWorkLimit == null ||
    grossMechanicalWork <= thermalWorkLimit + integratedUncertainty;

  const nullTolerance = Math.max(integratedUncertainty, Number.EPSILON);
  const gapOnlyNullControlPassed =
    input.cycleKind !== "gap_only_control" ||
    Math.abs(grossMechanicalWork) <= nullTolerance;
  const measuredForceCurvesComplete =
    contraction.evidenceTier === "measured" &&
    expansion.evidenceTier === "measured";
  const forceCurveEvidenceReady =
    contraction.evidenceTier !== "literature_anchored" &&
    expansion.evidenceTier !== "literature_anchored";
  const blockers = [
    ...(!couponTargetBracketed ? ["coupon_target_gap_not_bracketed"] : []),
    ...(!reservoirsIdentified ? ["supplying_reservoir_inventory_missing"] : []),
    ...(!gapOnlyNullControlPassed
      ? ["gap_only_control_has_nonzero_loop_work"]
      : []),
    ...(!usefulWorkWithinIdentifiedExergy
      ? ["mechanical_work_exceeds_identified_input_exergy"]
      : []),
    ...(!thermalCarnotBoundPassed
      ? ["thermal_cycle_exceeds_carnot_work_bound"]
      : []),
    ...(input.cycleKind === "switchable_material" &&
    contraction.stateId === expansion.stateId
      ? ["switchable_material_cycle_uses_one_material_state"]
      : []),
    ...(input.cycleKind === "gap_only_control" &&
    contraction.stateId !== expansion.stateId
      ? ["gap_only_control_uses_different_material_states"]
      : []),
  ];
  const structuralCycleInvalid = blockers.some(
    (blocker) =>
      blocker === "coupon_target_gap_not_bracketed" ||
      blocker === "switchable_material_cycle_uses_one_material_state" ||
      blocker === "gap_only_control_uses_different_material_states",
  );

  let experimentDecision: Nhm2CasimirCycleWorkResultV1["experimentDecision"];
  if (structuralCycleInvalid) {
    experimentDecision = "invalid_input";
  } else if (
    input.cycleKind === "gap_only_control" &&
    gapOnlyNullControlPassed
  ) {
    experimentDecision = "gap_only_null_reference";
  } else if (conservativeGrossLower <= 0 || conservativeSurplus <= 0) {
    experimentDecision = "theoretical_margin_not_positive";
  } else if (!forceCurveEvidenceReady) {
    experimentDecision = "literature_model_requires_validated_force_curves";
  } else if (
    !reservoirsIdentified ||
    !usefulWorkWithinIdentifiedExergy ||
    !thermalCarnotBoundPassed
  ) {
    experimentDecision = "reservoir_accounting_incomplete";
  } else if (measuredForceCurvesComplete) {
    experimentDecision = "measured_curve_supports_repeatability_test";
  } else {
    experimentDecision = "validated_model_supports_coupon_test";
  }

  return {
    ...emptyResult(blockers),
    cycleKind: input.cycleKind,
    derived: {
      contractionWorkByFieldJ: round(contractionWork),
      expansionWorkByFieldJ: round(expansionWork),
      grossMechanicalWorkByFieldJ: round(grossMechanicalWork),
      integratedForceUncertaintyJ: round(integratedUncertainty),
      conservativeGrossMechanicalWorkLowerJ: round(conservativeGrossLower),
      totalKnownOperatingInputJ: round(totalKnownOperatingInput),
      mechanicalSurplusAfterKnownOperatingInputsJ: round(surplus),
      conservativeMechanicalSurplusLowerJ: round(conservativeSurplus),
      exergyEfficiency:
        exergyEfficiency == null ? null : round(exergyEfficiency),
      carnotEfficiencyLimit:
        carnotEfficiency == null ? null : round(carnotEfficiency),
      thermalWorkLimitJ:
        thermalWorkLimit == null ? null : round(thermalWorkLimit),
    },
    checks: {
      inputShapeValid: true,
      forceCurvesShareStrictGrid: true,
      couponTargetBracketed,
      allSupplyingReservoirsIdentified: reservoirsIdentified,
      gapOnlyNullControlPassed,
      usefulWorkWithinIdentifiedExergy,
      thermalCarnotBoundPassed,
      forceCurveEvidenceReady,
      measuredForceCurvesComplete,
    },
    experimentDecision,
  };
};

export const computeNhm2CasimirLifshitzCycle = (
  input: Nhm2CasimirLifshitzCycleInputV1,
): Nhm2CasimirCycleWorkResultV1 => {
  if (
    !boundedId(input?.cycleId) ||
    !boundedId(input?.systemBoundaryId) ||
    !finite(input?.temperatureK) ||
    input.temperatureK <= 0 ||
    !finite(input?.areaM2) ||
    input.areaM2 <= 0 ||
    !Array.isArray(input?.gapsMeters) ||
    input.gapsMeters.length < 3 ||
    input.gapsMeters.length > 64 ||
    !input.gapsMeters.every(
      (gap, index) =>
        finite(gap) &&
        gap >= ALLOWED_COUPON_RANGE_METERS[0] &&
        gap <= ALLOWED_COUPON_RANGE_METERS[1] &&
        (index === 0 || gap > input.gapsMeters[index - 1]),
    ) ||
    !input.gapsMeters.includes(NOMINAL_COUPON_GAP_METERS) ||
    !boundedId(input?.contractionStateId) ||
    !boundedId(input?.expansionStateId) ||
    !SHA256.test(input?.contractionCalculationSha256 ?? "") ||
    !SHA256.test(input?.expansionCalculationSha256 ?? "") ||
    !finite(input?.relativeModelForceUncertainty) ||
    input.relativeModelForceUncertainty <= 0 ||
    input.relativeModelForceUncertainty > 1
  ) {
    return emptyResult(["lifshitz_cycle_input_invalid_or_unbounded"]);
  }

  try {
    const solveState = (material: LifshitzMaterial) =>
      input.gapsMeters.map((gap) =>
        computeLifshitzEquilibrium({
          schema_version: "casimir_lifshitz/1",
          gap_m: gap,
          temperature_K: input.temperatureK,
          material_1: input.fixedMaterial,
          material_2: material,
          geometry: { kind: "parallel_plates", area_m2: input.areaM2 },
          numerics: input.numerics,
        }),
      );
    const contractionResults = solveState(input.contractionMaterial);
    const expansionResults = solveState(input.expansionMaterial);
    if (
      [...contractionResults, ...expansionResults].some(
        (result) => result.convergence.status !== "pass",
      )
    ) {
      return emptyResult(["lifshitz_force_curve_convergence_not_ready"]);
    }

    const forceCurve = (
      stateId: string,
      artifactSha256: string,
      results: typeof contractionResults,
    ): Nhm2CasimirForceCurveV1 => ({
      stateId,
      evidenceTier: "literature_anchored",
      method: "equilibrium_lifshitz_planar",
      artifactSha256,
      gapsMeters: [...input.gapsMeters],
      forcesNewtons: results.map((result) => result.force_N),
      forceStandardUncertaintyNewtons: results.map(
        (result) =>
          Math.abs(result.force_N) * input.relativeModelForceUncertainty,
      ),
    });

    return computeNhm2CasimirCycleWork({
      contractVersion: NHM2_CASIMIR_CYCLE_WORK_VERSION,
      cycleId: input.cycleId,
      systemBoundaryId: input.systemBoundaryId,
      cycleKind: input.cycleKind,
      couponTargetGapMeters: NOMINAL_COUPON_GAP_METERS,
      allowedCouponGapRangeMeters: ALLOWED_COUPON_RANGE_METERS,
      contractionCurve: forceCurve(
        input.contractionStateId,
        input.contractionCalculationSha256,
        contractionResults,
      ),
      expansionCurve: forceCurve(
        input.expansionStateId,
        input.expansionCalculationSha256,
        expansionResults,
      ),
      supplyingReservoirIds: input.supplyingReservoirIds,
      switchingEnergyInputJ: input.switchingEnergyInputJ,
      actuatorEnergyInputJ: input.actuatorEnergyInputJ,
      sensingControlEnergyInputJ: input.sensingControlEnergyInputJ,
      coolingEnergyInputJ: input.coolingEnergyInputJ,
      otherOperatingEnergyInputJ: input.otherOperatingEnergyInputJ,
      identifiedInputExergyJ: input.identifiedInputExergyJ,
      hotReservoirTemperatureK: null,
      coldReservoirTemperatureK: null,
      hotReservoirEnergyInputJ: null,
    });
  } catch {
    return emptyResult(["lifshitz_cycle_solver_rejected_input"]);
  }
};
