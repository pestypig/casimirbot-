import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
  Nhm2TileSourceReceiptSurfaceStatusV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_FORCE_GAP_PULL_IN_TEST_PLAN_CONTRACT_VERSION =
  "nhm2_tile_source_force_gap_pull_in_test_plan/v1";

export type Nhm2ForceGapPullInTestId =
  | "force_gap_provenance"
  | "operating_gap"
  | "casimir_force_at_gap"
  | "force_gradient"
  | "effective_spring_constant"
  | "pull_in_margin"
  | "stiction_margin"
  | "active_gap_control_authority";

export type Nhm2ForceGapPullInTestStatus = "satisfied" | "open" | "falsifying";

export type Nhm2ForceGapPullInTestPlanItemV1 = {
  testId: Nhm2ForceGapPullInTestId;
  status: Nhm2ForceGapPullInTestStatus;
  blockerIds: string[];
  requiredMeasurement: string;
  acceptanceCriterion: string;
  artifactToProduce: string;
};

export type Nhm2TileSourceForceGapPullInTestPlanV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_FORCE_GAP_PULL_IN_TEST_PLAN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
  };
  forceGapTarget: {
    operatingGapMeters: 8e-9;
    activeControlAuthorityFactorMin: 1.2;
    forceGradientConsistencyMin: 0.75;
    pullInMarginMin: 1;
    stictionMarginMin: 1;
    evidenceTierRequired: "measured_or_validated_simulation";
  };
  testItems: Nhm2ForceGapPullInTestPlanItemV1[];
  summary: {
    forceGapReceiptStatus: "pass" | "review" | "fail" | "missing";
    nextRequiredTestId: Nhm2ForceGapPullInTestId | "none";
    openTestCount: number;
    falsifyingTestCount: number;
    satisfiedTestCount: number;
    pullInMargin: number | null;
    stictionMargin: number | null;
    activeAuthorityMargin: number | null;
    forceGapEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    forceGapPlanOnly: true;
    planDoesNotSupplyEvidence: true;
    forceGapPassIsNotFullApparatusTensor: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceForceGapPullInTestPlanInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  materialEvidenceReceiptsRef?: string | null;
};

const TEST_POLICY: Record<
  Nhm2ForceGapPullInTestId,
  {
    blockers: string[];
    requiredMeasurement: string;
    acceptanceCriterion: string;
    artifactToProduce: string;
  }
> = {
  force_gap_provenance: {
    blockers: [
      "force_gap_curve_and_pull_in_margin_at_8nm_missing",
      "force_gap_tier_not_measured_or_validated",
      "force_gap_metrology_ref_missing",
      "force_gap_curve_ref_missing",
      "force_gradient_curve_ref_missing",
      "force_gap_stiffness_model_ref_missing",
      "pull_in_sweep_ref_missing",
      "stiction_protocol_ref_missing",
      "active_gap_control_authority_ref_missing",
    ],
    requiredMeasurement:
      "Measured or validated-simulation force-gap receipt with apparatus, F(g) curve, dF/dg curve, stiffness model, and data provenance.",
    acceptanceCriterion: "Evidence tier is measured or validated_simulation, not declared_model or missing.",
    artifactToProduce: "receipt://force_gap_pull_in/provenance_v1",
  },
  operating_gap: {
    blockers: ["force_gap_not_at_8nm", "force_gap_curve_does_not_bracket_8nm"],
    requiredMeasurement: "Gap metrology tying the force-gap curve to the 8 nm operating gap.",
    acceptanceCriterion: "Gap measurement is within 1 pm of 8 nm in the current reduced-order policy.",
    artifactToProduce: "receipt://force_gap_pull_in/operating_gap_8nm_v1",
  },
  casimir_force_at_gap: {
    blockers: ["casimir_force_at_gap_missing"],
    requiredMeasurement: "Measured or simulated Casimir force at the 8 nm operating gap.",
    acceptanceCriterion: "Finite Casimir force at gap is supplied with provenance.",
    artifactToProduce: "receipt://force_gap_pull_in/casimir_force_8nm_v1",
  },
  force_gradient: {
    blockers: [
      "pull_in_margin_missing",
      "force_gradient_consistency_with_force_curve_missing",
      "force_gradient_inconsistent_with_force_curve_at_8nm",
    ],
    requiredMeasurement:
      "dF/dg force-gradient curve at the 8 nm operating gap, tied to the same F(g) curve used for Casimir force.",
    acceptanceCriterion:
      "Finite force gradient is supplied for pull-in comparison and remains consistent with 4|F|/g to at least 0.75 symmetric-ratio margin.",
    artifactToProduce: "receipt://force_gap_pull_in/force_gradient_8nm_v1",
  },
  effective_spring_constant: {
    blockers: ["pull_in_margin_missing"],
    requiredMeasurement: "Effective spring/stiffness model for the 447-layer gap support.",
    acceptanceCriterion: "Finite effective spring constant is supplied for pull-in comparison.",
    artifactToProduce: "receipt://force_gap_pull_in/effective_spring_constant_v1",
  },
  pull_in_margin: {
    blockers: ["pull_in_sweep_ref_missing", "pull_in_margin_missing", "pull_in_margin_below_one"],
    requiredMeasurement: "Pull-in margin computed from effective spring constant divided by force gradient.",
    acceptanceCriterion: "Pull-in margin is at least 1.",
    artifactToProduce: "receipt://force_gap_pull_in/pull_in_margin_v1",
  },
  stiction_margin: {
    blockers: ["stiction_protocol_ref_missing", "stiction_margin_missing", "stiction_margin_below_one"],
    requiredMeasurement: "Stiction margin for the 8 nm gap stack.",
    acceptanceCriterion: "Stiction margin is at least 1.",
    artifactToProduce: "receipt://force_gap_pull_in/stiction_margin_v1",
  },
  active_gap_control_authority: {
    blockers: [
      "active_gap_control_authority_missing",
      "active_gap_control_authority_ref_missing",
      "active_gap_control_authority_below_1p2x_force",
    ],
    requiredMeasurement: "Active gap-control authority compared against the absolute Casimir load.",
    acceptanceCriterion: "Active gap-control authority is at least 1.2x absolute Casimir force.",
    artifactToProduce: "receipt://force_gap_pull_in/active_gap_control_authority_v1",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const forceGapSurface = (
  receipts: Nhm2TileSourceMaterialEvidenceReceiptsV1,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const surface = receipts.receiptSurfaces.find((entry) => entry.surfaceId === "force_gap_pull_in");
  if (surface == null) {
    throw new Error("force_gap_pull_in surface missing from nhm2 material evidence receipts");
  }
  return surface;
};

const itemStatus = (
  surface: Nhm2TileSourceReceiptSurfaceStatusV1,
  blockers: string[],
): Nhm2ForceGapPullInTestStatus => {
  if (!blockers.some((blocker) => surface.blockers.includes(blocker))) return "satisfied";
  return surface.status === "fail" ? "falsifying" : "open";
};

export const buildNhm2TileSourceForceGapPullInTestPlan = (
  input: BuildNhm2TileSourceForceGapPullInTestPlanInput,
): Nhm2TileSourceForceGapPullInTestPlanV1 => {
  const receipts = input.materialEvidenceReceipts;
  const surface = forceGapSurface(receipts);
  const testItems = (Object.keys(TEST_POLICY) as Nhm2ForceGapPullInTestId[]).map((testId) => {
    const policy = TEST_POLICY[testId];
    const blockerIds = surface.blockers.filter((blocker) => policy.blockers.includes(blocker));
    return {
      testId,
      status: itemStatus(surface, policy.blockers),
      blockerIds,
      requiredMeasurement: policy.requiredMeasurement,
      acceptanceCriterion: policy.acceptanceCriterion,
      artifactToProduce: policy.artifactToProduce,
    };
  });
  const openItems = testItems.filter((item) => item.status === "open");
  const falsifyingItems = testItems.filter((item) => item.status === "falsifying");
  const satisfiedItems = testItems.filter((item) => item.status === "satisfied");
  const nextItem = falsifyingItems[0] ?? openItems[0] ?? null;
  return {
    contractVersion: NHM2_TILE_SOURCE_FORCE_GAP_PULL_IN_TEST_PLAN_CONTRACT_VERSION,
    generatedAt: receipts.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receipts.selectedProfileId,
    frozenCandidateId: receipts.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
    },
    forceGapTarget: {
      operatingGapMeters: 8e-9,
      activeControlAuthorityFactorMin: 1.2,
      forceGradientConsistencyMin: 0.75,
      pullInMarginMin: 1,
      stictionMarginMin: 1,
      evidenceTierRequired: "measured_or_validated_simulation",
    },
    testItems,
    summary: {
      forceGapReceiptStatus: surface.status,
      nextRequiredTestId: nextItem?.testId ?? "none",
      openTestCount: openItems.length,
      falsifyingTestCount: falsifyingItems.length,
      satisfiedTestCount: satisfiedItems.length,
      pullInMargin: surface.numericalMargins.pullInMargin ?? null,
      stictionMargin: surface.numericalMargins.stictionMargin ?? null,
      activeAuthorityMargin: surface.numericalMargins.activeAuthorityMargin ?? null,
      forceGapEvidenceReady: surface.status === "pass",
      falsifiesCurrentCandidate: surface.status === "fail",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      forceGapPlanOnly: true,
      planDoesNotSupplyEvidence: true,
      forceGapPassIsNotFullApparatusTensor: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceForceGapPullInTestPlan = (
  value: unknown,
): value is Nhm2TileSourceForceGapPullInTestPlanV1 => {
  if (!isRecord(value)) return false;
  const target = isRecord(value.forceGapTarget) ? value.forceGapTarget : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_FORCE_GAP_PULL_IN_TEST_PLAN_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    target != null &&
    target.operatingGapMeters === 8e-9 &&
    target.activeControlAuthorityFactorMin === 1.2 &&
    target.forceGradientConsistencyMin === 0.75 &&
    target.pullInMarginMin === 1 &&
    target.stictionMarginMin === 1 &&
    target.evidenceTierRequired === "measured_or_validated_simulation" &&
    Array.isArray(value.testItems) &&
    value.testItems.length === 8 &&
    value.testItems.every(
      (item) =>
        isRecord(item) &&
        typeof item.testId === "string" &&
        ["satisfied", "open", "falsifying"].includes(String(item.status)) &&
        Array.isArray(item.blockerIds) &&
        typeof item.requiredMeasurement === "string" &&
        typeof item.acceptanceCriterion === "string" &&
        typeof item.artifactToProduce === "string",
    ) &&
    summary != null &&
    typeof summary.forceGapReceiptStatus === "string" &&
    typeof summary.nextRequiredTestId === "string" &&
    typeof summary.openTestCount === "number" &&
    typeof summary.falsifyingTestCount === "number" &&
    typeof summary.satisfiedTestCount === "number" &&
    (summary.pullInMargin === null || typeof summary.pullInMargin === "number") &&
    (summary.stictionMargin === null || typeof summary.stictionMargin === "number") &&
    (summary.activeAuthorityMargin === null || typeof summary.activeAuthorityMargin === "number") &&
    typeof summary.forceGapEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.forceGapPlanOnly === true &&
    boundary.planDoesNotSupplyEvidence === true &&
    boundary.forceGapPassIsNotFullApparatusTensor === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
