import {
  buildNhm2LayerStackMechanicalReceipt,
  isNhm2LayerStackMechanicalReceipt,
  type Nhm2LayerStackMechanicalReceiptV1,
} from "./nhm2-layer-stack-mechanical-receipt.v1";
import type {
  Nhm2TileSourceForceGapPullInEvidenceV1,
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_FORCE_GAP_LOAD_BUDGET_CONTRACT_VERSION =
  "nhm2_tile_source_force_gap_load_budget/v1";

export type Nhm2TileSourceForceGapLoadBudgetV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_FORCE_GAP_LOAD_BUDGET_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    mechanicalReceiptRef: string | null;
    materialEvidenceReceiptsRef: string | null;
  };
  frozenGeometry: {
    gapMeters: number;
    tileAreaMeters2: number;
    layerCount: number;
    stackThicknessMeters: number;
  };
  idealLoadBudget: {
    pressurePa: number;
    forcePerLayerN: number;
    forcePer447LayerStackN: number;
    forceScaleKilonewtons: number;
    forceGradientNPerM: number;
    requiredSpringConstantNPerM: number;
    requiredActiveGapControlAuthorityN: number;
    forceGradientConsistencyMin: 0.75;
    activeControlAuthorityFactorMin: 1.2;
  };
  suppliedForceGapEvidence: {
    evidenceTier: string;
    evidenceRef: string | null;
    gapMetrologyRef: string | null;
    forceGapCurveRef: string | null;
    forceGradientCurveRef: string | null;
    stiffnessModelRef: string | null;
    pullInSweepRef: string | null;
    stictionProtocolRef: string | null;
    activeControlAuthorityRef: string | null;
    curveMinGapMeters: number | null;
    curveMaxGapMeters: number | null;
    localSampleWindowMeters: number | null;
    forceGapCurveSampleCountNearOperatingGap: number | null;
    forceGradientCurveSampleCountNearOperatingGap: number | null;
    casimirForceN: number | null;
    forceGradientNPerM: number | null;
    effectiveSpringConstantNPerM: number | null;
    stictionMargin: number | null;
    activeGapControlAuthorityN: number | null;
  };
  margins: {
    curveModelRefsAvailable: boolean;
    curveBracketsOperatingGap: boolean;
    localCurveSamplingComplete: boolean;
    localSampleWindowMargin: number | null;
    forceGapCurveLocalSampleMargin: number | null;
    forceGradientCurveLocalSampleMargin: number | null;
    suppliedForceToIdealStackForce: number | null;
    suppliedGradientToIdealGradient: number | null;
    suppliedGradientConsistencyWithForceCurve: number | null;
    pullInMarginToIdealGradient: number | null;
    stictionMarginToMinimum: number | null;
    activeAuthorityMarginToIdealLoad: number | null;
  };
  requiredCorrections: {
    pullInMarginDefinition: "effectiveSpringConstantNPerM / idealForceGradientNPerM";
    springConstantMinNPerM: number;
    springConstantShortfallNPerM: number | null;
    stictionMarginMin: 1;
    stictionMarginShortfall: number | null;
    activeGapControlAuthorityMinN: number;
    activeGapControlAuthorityShortfallN: number | null;
    forceGradientConsistencyMin: 0.75;
    forceGradientConsistencyShortfall: number | null;
    localSampleWindowMinMeters: number;
    localSampleWindowShortfallMeters: number | null;
    localCurveSampleCountMin: number;
    forceGapCurveLocalSampleCountShortfall: number | null;
    forceGradientCurveLocalSampleCountShortfall: number | null;
    suppliedForceDeltaFromIdealStackForceN: number | null;
    suppliedForceAbsTargetN: number;
  };
  blockers: string[];
  summary: {
    loadBudgetComputed: boolean;
    forceGapEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    firstBlocker: string;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    idealLoadBudgetOnly: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    internalLoadIsNotThrust: true;
    forceBudgetDoesNotSupplyFullApparatusTensor: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceForceGapLoadBudgetInput = {
  generatedAt?: string | null;
  mechanicalReceipt?: Nhm2LayerStackMechanicalReceiptV1 | null;
  mechanicalReceiptRef?: string | null;
  materialEvidenceReceipts?: Nhm2TileSourceMaterialEvidenceReceiptsV1 | null;
  materialEvidenceReceiptsRef?: string | null;
  forceGapPullInEvidence?: Nhm2TileSourceForceGapPullInEvidenceV1 | null;
};

const AUTHORITY_FACTOR = 1.2;
const FORCE_GRADIENT_CONSISTENCY_MIN = 0.75;
const LOCAL_SAMPLE_WINDOW_MIN_METERS = 1e-9;
const LOCAL_CURVE_SAMPLE_COUNT_MIN = 9;

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const finiteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const positiveFiniteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

const positiveIntegerOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value > 0
    ? value
    : null;

const safeRatio = (numerator: number | null, denominator: number | null): number | null =>
  numerator == null || denominator == null || denominator === 0
    ? null
    : round(numerator / denominator);

const symmetricRatioMargin = (actual: number | null, expected: number | null): number | null => {
  if (actual == null || expected == null || actual <= 0 || expected <= 0) return null;
  const ratio = actual / expected;
  return round(Math.min(ratio, 1 / ratio));
};

const shortfall = (required: number | null, supplied: number | null): number | null =>
  required == null || supplied == null ? null : round(Math.max(0, required - supplied));

export const buildNhm2TileSourceForceGapLoadBudget = (
  input: BuildNhm2TileSourceForceGapLoadBudgetInput = {},
): Nhm2TileSourceForceGapLoadBudgetV1 => {
  const mechanicalReceipt =
    input.mechanicalReceipt ??
    buildNhm2LayerStackMechanicalReceipt({
      generatedAt: input.generatedAt,
      selectedProfileId: input.materialEvidenceReceipts?.selectedProfileId ?? null,
    });
  if (!isNhm2LayerStackMechanicalReceipt(mechanicalReceipt)) {
    throw new Error("mechanical receipt must be nhm2_layer_stack_mechanical_receipt/v1");
  }
  const forceGapEvidence = input.forceGapPullInEvidence ?? null;
  const gapMeters = mechanicalReceipt.inputGeometry.gapMeters.valueSI ?? 8e-9;
  const idealStackForceN =
    mechanicalReceipt.idealCasimirLoad.forcePer447LayerStackN.valueSI ?? null;
  const idealGradient =
    idealStackForceN == null ? null : round((4 * idealStackForceN) / gapMeters);
  const requiredActiveAuthority =
    idealStackForceN == null ? null : round(Math.abs(idealStackForceN) * AUTHORITY_FACTOR);
  const suppliedForce = forceGapEvidence?.casimirForceN ?? null;
  const suppliedGradient = forceGapEvidence?.forceGradientNPerM ?? null;
  const suppliedSpring = forceGapEvidence?.effectiveSpringConstantNPerM ?? null;
  const suppliedStictionMargin = forceGapEvidence?.stictionMargin ?? null;
  const suppliedAuthority = forceGapEvidence?.activeGapControlAuthorityN ?? null;
  const localSampleWindowMeters = positiveFiniteOrNull(
    forceGapEvidence?.localSampleWindowMeters,
  );
  const forceGapCurveSampleCountNearOperatingGap = positiveIntegerOrNull(
    forceGapEvidence?.forceGapCurveSampleCountNearOperatingGap,
  );
  const forceGradientCurveSampleCountNearOperatingGap = positiveIntegerOrNull(
    forceGapEvidence?.forceGradientCurveSampleCountNearOperatingGap,
  );
  const curveModelRefsAvailable =
    forceGapEvidence?.gapMetrologyRef != null &&
    forceGapEvidence?.forceGapCurveRef != null &&
    forceGapEvidence.forceGradientCurveRef != null &&
    forceGapEvidence.stiffnessModelRef != null &&
    forceGapEvidence.pullInSweepRef != null &&
    forceGapEvidence.stictionProtocolRef != null &&
    forceGapEvidence.activeControlAuthorityRef != null;
  const curveBracketsOperatingGap =
    forceGapEvidence?.curveMinGapMeters != null &&
    forceGapEvidence.curveMaxGapMeters != null &&
    forceGapEvidence.curveMinGapMeters <= gapMeters &&
    forceGapEvidence.curveMaxGapMeters >= gapMeters;
  const localSampleWindowMargin = safeRatio(
    localSampleWindowMeters,
    LOCAL_SAMPLE_WINDOW_MIN_METERS,
  );
  const forceGapCurveLocalSampleMargin = safeRatio(
    forceGapCurveSampleCountNearOperatingGap,
    LOCAL_CURVE_SAMPLE_COUNT_MIN,
  );
  const forceGradientCurveLocalSampleMargin = safeRatio(
    forceGradientCurveSampleCountNearOperatingGap,
    LOCAL_CURVE_SAMPLE_COUNT_MIN,
  );
  const localCurveSamplingComplete =
    localSampleWindowMargin != null &&
    localSampleWindowMargin >= 1 &&
    forceGapCurveLocalSampleMargin != null &&
    forceGapCurveLocalSampleMargin >= 1 &&
    forceGradientCurveLocalSampleMargin != null &&
    forceGradientCurveLocalSampleMargin >= 1;
  const pullInMarginToIdealGradient = safeRatio(suppliedSpring, idealGradient);
  const expectedGradientFromSuppliedForce =
    suppliedForce == null ? null : round((4 * Math.abs(suppliedForce)) / gapMeters);
  const suppliedGradientConsistencyWithForceCurve = symmetricRatioMargin(
    suppliedGradient,
    expectedGradientFromSuppliedForce,
  );
  const stictionMarginToMinimum = safeRatio(suppliedStictionMargin, 1);
  const activeAuthorityMarginToIdealLoad = safeRatio(suppliedAuthority, requiredActiveAuthority);
  const forceGradientConsistencyShortfall =
    suppliedGradientConsistencyWithForceCurve == null
      ? null
      : round(Math.max(0, FORCE_GRADIENT_CONSISTENCY_MIN - suppliedGradientConsistencyWithForceCurve));
  const blockers = [
    ...(forceGapEvidence == null || forceGapEvidence.evidenceTier === "missing"
      ? ["force_gap_receipt_missing_for_load_budget"]
      : []),
    ...(forceGapEvidence?.evidenceTier !== "measured" &&
    forceGapEvidence?.evidenceTier !== "validated_simulation"
      ? ["force_gap_load_budget_tier_not_measured_or_validated"]
      : []),
    ...(forceGapEvidence?.gapMetrologyRef == null
      ? ["force_gap_metrology_ref_missing_for_load_budget"]
      : []),
    ...(forceGapEvidence?.forceGapCurveRef == null
      ? ["force_gap_curve_ref_missing_for_load_budget"]
      : []),
    ...(forceGapEvidence?.forceGradientCurveRef == null
      ? ["force_gradient_curve_ref_missing_for_load_budget"]
      : []),
    ...(forceGapEvidence?.stiffnessModelRef == null
      ? ["force_gap_stiffness_model_ref_missing_for_load_budget"]
      : []),
    ...(forceGapEvidence?.pullInSweepRef == null
      ? ["force_gap_pull_in_sweep_ref_missing_for_load_budget"]
      : []),
    ...(forceGapEvidence?.stictionProtocolRef == null
      ? ["force_gap_stiction_protocol_ref_missing_for_load_budget"]
      : []),
    ...(forceGapEvidence?.activeControlAuthorityRef == null
      ? ["force_gap_active_control_authority_ref_missing_for_load_budget"]
      : []),
    ...(!curveBracketsOperatingGap
      ? ["force_gap_curve_does_not_bracket_8nm_for_load_budget"]
      : []),
    ...(forceGapEvidence?.localSampleWindowMeters == null
      ? ["force_gap_local_sample_window_missing_for_load_budget"]
      : localSampleWindowMeters == null
        ? ["force_gap_local_sample_window_invalid_for_load_budget"]
        : localSampleWindowMargin == null || localSampleWindowMargin < 1
          ? ["force_gap_local_sample_window_below_1nm_for_load_budget"]
          : []),
    ...(forceGapEvidence?.forceGapCurveSampleCountNearOperatingGap == null
      ? ["force_gap_curve_local_sample_count_missing_for_load_budget"]
      : forceGapCurveSampleCountNearOperatingGap == null
        ? ["force_gap_curve_local_sample_count_invalid_for_load_budget"]
        : forceGapCurveLocalSampleMargin == null || forceGapCurveLocalSampleMargin < 1
          ? ["force_gap_curve_local_sample_count_below_9_for_load_budget"]
          : []),
    ...(forceGapEvidence?.forceGradientCurveSampleCountNearOperatingGap == null
      ? ["force_gradient_curve_local_sample_count_missing_for_load_budget"]
      : forceGradientCurveSampleCountNearOperatingGap == null
        ? ["force_gradient_curve_local_sample_count_invalid_for_load_budget"]
        : forceGradientCurveLocalSampleMargin == null ||
            forceGradientCurveLocalSampleMargin < 1
          ? ["force_gradient_curve_local_sample_count_below_9_for_load_budget"]
          : []),
    ...(suppliedForce == null ? ["force_gap_casimir_force_missing_for_447_layer_budget"] : []),
    ...(suppliedGradient == null ? ["force_gap_gradient_missing_for_447_layer_budget"] : []),
    ...(suppliedGradientConsistencyWithForceCurve == null
      ? ["force_gap_gradient_consistency_with_force_curve_missing_for_load_budget"]
      : suppliedGradientConsistencyWithForceCurve < FORCE_GRADIENT_CONSISTENCY_MIN
        ? ["force_gap_gradient_inconsistent_with_force_curve_for_load_budget"]
        : []),
    ...(pullInMarginToIdealGradient == null
      ? ["ideal_load_pull_in_margin_missing"]
      : pullInMarginToIdealGradient < 1
        ? ["ideal_load_pull_in_margin_below_one"]
        : []),
    ...(stictionMarginToMinimum == null
      ? ["force_gap_stiction_margin_missing_for_load_budget"]
      : stictionMarginToMinimum < 1
        ? ["force_gap_stiction_margin_below_one_for_load_budget"]
        : []),
    ...(activeAuthorityMarginToIdealLoad == null
      ? ["ideal_load_active_control_authority_missing"]
      : activeAuthorityMarginToIdealLoad < 1
        ? ["ideal_load_active_control_authority_below_1p2x_stack_force"]
        : []),
  ];
  const evidenceReady = blockers.length === 0;
  const falsifiesCurrentCandidate =
    forceGapEvidence?.evidenceTier === "measured" ||
    forceGapEvidence?.evidenceTier === "validated_simulation"
      ? blockers.some((blocker) =>
          [
            "ideal_load_pull_in_margin_below_one",
            "force_gap_gradient_inconsistent_with_force_curve_for_load_budget",
            "force_gap_local_sample_window_below_1nm_for_load_budget",
            "force_gap_curve_local_sample_count_below_9_for_load_budget",
            "force_gradient_curve_local_sample_count_below_9_for_load_budget",
            "force_gap_stiction_margin_below_one_for_load_budget",
            "ideal_load_active_control_authority_below_1p2x_stack_force",
          ].includes(blocker),
        )
      : false;
  return {
    contractVersion: NHM2_TILE_SOURCE_FORCE_GAP_LOAD_BUDGET_CONTRACT_VERSION,
    generatedAt: mechanicalReceipt.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: mechanicalReceipt.selectedProfileId,
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    sourceRefs: {
      mechanicalReceiptRef: input.mechanicalReceiptRef ?? null,
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
    },
    frozenGeometry: {
      gapMeters,
      tileAreaMeters2: mechanicalReceipt.inputGeometry.tileAreaMeters2.valueSI ?? 0,
      layerCount: mechanicalReceipt.inputGeometry.layerCount.valueSI ?? 0,
      stackThicknessMeters: mechanicalReceipt.inputGeometry.stackThicknessMeters.valueSI ?? 0,
    },
    idealLoadBudget: {
      pressurePa: mechanicalReceipt.idealCasimirLoad.pressurePa.valueSI ?? 0,
      forcePerLayerN: mechanicalReceipt.idealCasimirLoad.forcePerTileN.valueSI ?? 0,
      forcePer447LayerStackN: idealStackForceN ?? 0,
      forceScaleKilonewtons: mechanicalReceipt.summary.forceScaleKilonewtons,
      forceGradientNPerM: idealGradient ?? 0,
      requiredSpringConstantNPerM: idealGradient ?? 0,
      requiredActiveGapControlAuthorityN: requiredActiveAuthority ?? 0,
      forceGradientConsistencyMin: FORCE_GRADIENT_CONSISTENCY_MIN,
      activeControlAuthorityFactorMin: AUTHORITY_FACTOR,
    },
    suppliedForceGapEvidence: {
      evidenceTier: forceGapEvidence?.evidenceTier ?? "missing",
      evidenceRef: forceGapEvidence?.evidenceRef ?? null,
      gapMetrologyRef: forceGapEvidence?.gapMetrologyRef ?? null,
      forceGapCurveRef: forceGapEvidence?.forceGapCurveRef ?? null,
      forceGradientCurveRef: forceGapEvidence?.forceGradientCurveRef ?? null,
      stiffnessModelRef: forceGapEvidence?.stiffnessModelRef ?? null,
      pullInSweepRef: forceGapEvidence?.pullInSweepRef ?? null,
      stictionProtocolRef: forceGapEvidence?.stictionProtocolRef ?? null,
      activeControlAuthorityRef: forceGapEvidence?.activeControlAuthorityRef ?? null,
      curveMinGapMeters: finiteOrNull(forceGapEvidence?.curveMinGapMeters),
      curveMaxGapMeters: finiteOrNull(forceGapEvidence?.curveMaxGapMeters),
      localSampleWindowMeters,
      forceGapCurveSampleCountNearOperatingGap,
      forceGradientCurveSampleCountNearOperatingGap,
      casimirForceN: finiteOrNull(suppliedForce),
      forceGradientNPerM: finiteOrNull(suppliedGradient),
      effectiveSpringConstantNPerM: finiteOrNull(suppliedSpring),
      stictionMargin: finiteOrNull(suppliedStictionMargin),
      activeGapControlAuthorityN: finiteOrNull(suppliedAuthority),
    },
    margins: {
      curveModelRefsAvailable,
      curveBracketsOperatingGap,
      localCurveSamplingComplete,
      localSampleWindowMargin,
      forceGapCurveLocalSampleMargin,
      forceGradientCurveLocalSampleMargin,
      suppliedForceToIdealStackForce: safeRatio(
        suppliedForce == null ? null : Math.abs(suppliedForce),
        idealStackForceN == null ? null : Math.abs(idealStackForceN),
      ),
      suppliedGradientToIdealGradient: safeRatio(suppliedGradient, idealGradient),
      suppliedGradientConsistencyWithForceCurve,
      pullInMarginToIdealGradient,
      stictionMarginToMinimum,
      activeAuthorityMarginToIdealLoad,
    },
    requiredCorrections: {
      pullInMarginDefinition: "effectiveSpringConstantNPerM / idealForceGradientNPerM",
      springConstantMinNPerM: idealGradient ?? 0,
      springConstantShortfallNPerM: shortfall(idealGradient, suppliedSpring),
      stictionMarginMin: 1,
      stictionMarginShortfall: shortfall(1, suppliedStictionMargin),
      activeGapControlAuthorityMinN: requiredActiveAuthority ?? 0,
      activeGapControlAuthorityShortfallN: shortfall(requiredActiveAuthority, suppliedAuthority),
      forceGradientConsistencyMin: FORCE_GRADIENT_CONSISTENCY_MIN,
      forceGradientConsistencyShortfall,
      localSampleWindowMinMeters: LOCAL_SAMPLE_WINDOW_MIN_METERS,
      localSampleWindowShortfallMeters: shortfall(
        LOCAL_SAMPLE_WINDOW_MIN_METERS,
        localSampleWindowMeters,
      ),
      localCurveSampleCountMin: LOCAL_CURVE_SAMPLE_COUNT_MIN,
      forceGapCurveLocalSampleCountShortfall: shortfall(
        LOCAL_CURVE_SAMPLE_COUNT_MIN,
        forceGapCurveSampleCountNearOperatingGap,
      ),
      forceGradientCurveLocalSampleCountShortfall: shortfall(
        LOCAL_CURVE_SAMPLE_COUNT_MIN,
        forceGradientCurveSampleCountNearOperatingGap,
      ),
      suppliedForceDeltaFromIdealStackForceN:
        suppliedForce == null || idealStackForceN == null
          ? null
          : round(Math.abs(suppliedForce) - Math.abs(idealStackForceN)),
      suppliedForceAbsTargetN: idealStackForceN == null ? 0 : Math.abs(idealStackForceN),
    },
    blockers,
    summary: {
      loadBudgetComputed: idealStackForceN != null && idealGradient != null,
      forceGapEvidenceReady: evidenceReady,
      falsifiesCurrentCandidate,
      firstBlocker: blockers[0] ?? "none",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      idealLoadBudgetOnly: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      internalLoadIsNotThrust: true,
      forceBudgetDoesNotSupplyFullApparatusTensor: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceForceGapLoadBudget = (
  value: unknown,
): value is Nhm2TileSourceForceGapLoadBudgetV1 => {
  if (!isRecord(value)) return false;
  const frozenGeometry = isRecord(value.frozenGeometry) ? value.frozenGeometry : null;
  const idealLoadBudget = isRecord(value.idealLoadBudget) ? value.idealLoadBudget : null;
  const supplied = isRecord(value.suppliedForceGapEvidence)
    ? value.suppliedForceGapEvidence
    : null;
  const margins = isRecord(value.margins) ? value.margins : null;
  const requiredCorrections = isRecord(value.requiredCorrections)
    ? value.requiredCorrections
    : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_FORCE_GAP_LOAD_BUDGET_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    frozenGeometry != null &&
    typeof frozenGeometry.gapMeters === "number" &&
    typeof frozenGeometry.tileAreaMeters2 === "number" &&
    typeof frozenGeometry.layerCount === "number" &&
    typeof frozenGeometry.stackThicknessMeters === "number" &&
    idealLoadBudget != null &&
    typeof idealLoadBudget.pressurePa === "number" &&
    typeof idealLoadBudget.forcePerLayerN === "number" &&
    typeof idealLoadBudget.forcePer447LayerStackN === "number" &&
    typeof idealLoadBudget.forceGradientNPerM === "number" &&
    typeof idealLoadBudget.requiredSpringConstantNPerM === "number" &&
    typeof idealLoadBudget.requiredActiveGapControlAuthorityN === "number" &&
    idealLoadBudget.forceGradientConsistencyMin === 0.75 &&
    idealLoadBudget.activeControlAuthorityFactorMin === 1.2 &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    (supplied.gapMetrologyRef === null || typeof supplied.gapMetrologyRef === "string") &&
    (supplied.forceGapCurveRef === null || typeof supplied.forceGapCurveRef === "string") &&
    (supplied.forceGradientCurveRef === null ||
      typeof supplied.forceGradientCurveRef === "string") &&
    (supplied.stiffnessModelRef === null || typeof supplied.stiffnessModelRef === "string") &&
    (supplied.pullInSweepRef === null || typeof supplied.pullInSweepRef === "string") &&
    (supplied.stictionProtocolRef === null || typeof supplied.stictionProtocolRef === "string") &&
    (supplied.activeControlAuthorityRef === null ||
      typeof supplied.activeControlAuthorityRef === "string") &&
    (supplied.curveMinGapMeters === null || typeof supplied.curveMinGapMeters === "number") &&
    (supplied.curveMaxGapMeters === null || typeof supplied.curveMaxGapMeters === "number") &&
    (supplied.localSampleWindowMeters === null ||
      typeof supplied.localSampleWindowMeters === "number") &&
    (supplied.forceGapCurveSampleCountNearOperatingGap === null ||
      typeof supplied.forceGapCurveSampleCountNearOperatingGap === "number") &&
    (supplied.forceGradientCurveSampleCountNearOperatingGap === null ||
      typeof supplied.forceGradientCurveSampleCountNearOperatingGap === "number") &&
    margins != null &&
    typeof margins.curveModelRefsAvailable === "boolean" &&
    typeof margins.curveBracketsOperatingGap === "boolean" &&
    typeof margins.localCurveSamplingComplete === "boolean" &&
    requiredCorrections != null &&
    requiredCorrections.pullInMarginDefinition ===
      "effectiveSpringConstantNPerM / idealForceGradientNPerM" &&
    typeof requiredCorrections.springConstantMinNPerM === "number" &&
    (requiredCorrections.springConstantShortfallNPerM === null ||
      typeof requiredCorrections.springConstantShortfallNPerM === "number") &&
    requiredCorrections.stictionMarginMin === 1 &&
    (requiredCorrections.stictionMarginShortfall === null ||
      typeof requiredCorrections.stictionMarginShortfall === "number") &&
    typeof requiredCorrections.activeGapControlAuthorityMinN === "number" &&
    (requiredCorrections.activeGapControlAuthorityShortfallN === null ||
      typeof requiredCorrections.activeGapControlAuthorityShortfallN === "number") &&
    requiredCorrections.forceGradientConsistencyMin === 0.75 &&
    (requiredCorrections.forceGradientConsistencyShortfall === null ||
      typeof requiredCorrections.forceGradientConsistencyShortfall === "number") &&
    typeof requiredCorrections.localSampleWindowMinMeters === "number" &&
    (requiredCorrections.localSampleWindowShortfallMeters === null ||
      typeof requiredCorrections.localSampleWindowShortfallMeters === "number") &&
    typeof requiredCorrections.localCurveSampleCountMin === "number" &&
    (requiredCorrections.forceGapCurveLocalSampleCountShortfall === null ||
      typeof requiredCorrections.forceGapCurveLocalSampleCountShortfall === "number") &&
    (requiredCorrections.forceGradientCurveLocalSampleCountShortfall === null ||
      typeof requiredCorrections.forceGradientCurveLocalSampleCountShortfall === "number") &&
    (requiredCorrections.suppliedForceDeltaFromIdealStackForceN === null ||
      typeof requiredCorrections.suppliedForceDeltaFromIdealStackForceN === "number") &&
    typeof requiredCorrections.suppliedForceAbsTargetN === "number" &&
    Array.isArray(value.blockers) &&
    value.blockers.every((entry) => typeof entry === "string") &&
    summary != null &&
    typeof summary.loadBudgetComputed === "boolean" &&
    typeof summary.forceGapEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.idealLoadBudgetOnly === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.internalLoadIsNotThrust === true &&
    boundary.forceBudgetDoesNotSupplyFullApparatusTensor === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
