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
    activeControlAuthorityFactorMin: 1.2;
  };
  suppliedForceGapEvidence: {
    evidenceTier: string;
    evidenceRef: string | null;
    casimirForceN: number | null;
    forceGradientNPerM: number | null;
    effectiveSpringConstantNPerM: number | null;
    activeGapControlAuthorityN: number | null;
  };
  margins: {
    suppliedForceToIdealStackForce: number | null;
    suppliedGradientToIdealGradient: number | null;
    pullInMarginToIdealGradient: number | null;
    activeAuthorityMarginToIdealLoad: number | null;
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

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const finiteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const safeRatio = (numerator: number | null, denominator: number | null): number | null =>
  numerator == null || denominator == null || denominator === 0
    ? null
    : round(numerator / denominator);

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
  const suppliedAuthority = forceGapEvidence?.activeGapControlAuthorityN ?? null;
  const pullInMarginToIdealGradient = safeRatio(suppliedSpring, idealGradient);
  const activeAuthorityMarginToIdealLoad = safeRatio(suppliedAuthority, requiredActiveAuthority);
  const blockers = [
    ...(forceGapEvidence == null || forceGapEvidence.evidenceTier === "missing"
      ? ["force_gap_receipt_missing_for_load_budget"]
      : []),
    ...(forceGapEvidence?.evidenceTier !== "measured" &&
    forceGapEvidence?.evidenceTier !== "validated_simulation"
      ? ["force_gap_load_budget_tier_not_measured_or_validated"]
      : []),
    ...(suppliedForce == null ? ["force_gap_casimir_force_missing_for_447_layer_budget"] : []),
    ...(suppliedGradient == null ? ["force_gap_gradient_missing_for_447_layer_budget"] : []),
    ...(pullInMarginToIdealGradient == null
      ? ["ideal_load_pull_in_margin_missing"]
      : pullInMarginToIdealGradient < 1
        ? ["ideal_load_pull_in_margin_below_one"]
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
      activeControlAuthorityFactorMin: AUTHORITY_FACTOR,
    },
    suppliedForceGapEvidence: {
      evidenceTier: forceGapEvidence?.evidenceTier ?? "missing",
      evidenceRef: forceGapEvidence?.evidenceRef ?? null,
      casimirForceN: finiteOrNull(suppliedForce),
      forceGradientNPerM: finiteOrNull(suppliedGradient),
      effectiveSpringConstantNPerM: finiteOrNull(suppliedSpring),
      activeGapControlAuthorityN: finiteOrNull(suppliedAuthority),
    },
    margins: {
      suppliedForceToIdealStackForce: safeRatio(
        suppliedForce == null ? null : Math.abs(suppliedForce),
        idealStackForceN == null ? null : Math.abs(idealStackForceN),
      ),
      suppliedGradientToIdealGradient: safeRatio(suppliedGradient, idealGradient),
      pullInMarginToIdealGradient,
      activeAuthorityMarginToIdealLoad,
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
    idealLoadBudget.activeControlAuthorityFactorMin === 1.2 &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    margins != null &&
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
