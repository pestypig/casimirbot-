import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
  Nhm2TileSourceReceiptSurfaceStatusV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_TEST_PLAN_CONTRACT_VERSION =
  "nhm2_tile_source_full_apparatus_tensor_test_plan/v1";

export type Nhm2FullApparatusTensorTestId =
  | "full_apparatus_tensor_provenance"
  | "same_chart"
  | "same_basis"
  | "same_units"
  | "no_metric_target_echo"
  | "T00_component"
  | "T0i_components"
  | "diagonal_Tij_components"
  | "off_diagonal_Tij_components"
  | "support_structure_stress_energy"
  | "spacer_contact_stress_energy"
  | "active_control_field_energy"
  | "thermal_load_stress_energy"
  | "patch_potential_electrostatic_stress"
  | "fatigue_damage_evolution"
  | "layer_scaling_cross_terms"
  | "casimir_interaction_stress_energy"
  | "material_strain_energy"
  | "regional_wall_coverage"
  | "regional_hull_coverage"
  | "regional_exterior_shell_coverage";

export type Nhm2FullApparatusTensorTestStatus = "satisfied" | "open" | "falsifying";

export type Nhm2FullApparatusTensorTestPlanItemV1 = {
  testId: Nhm2FullApparatusTensorTestId;
  status: Nhm2FullApparatusTensorTestStatus;
  blockerIds: string[];
  requiredMeasurement: string;
  acceptanceCriterion: string;
  artifactToProduce: string;
};

export type Nhm2TileSourceFullApparatusTensorTestPlanV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_TEST_PLAN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
  };
  fullApparatusTensorTarget: {
    requiredComponents: ["T00", "T0i", "diagonalTij", "offDiagonalTij"];
    requiredTensorComponentCount: 10;
    requiredTermCount: 9;
    requiredRegions: ["wall", "hull", "exterior_shell"];
    sourceSideOnly: true;
    targetEchoForbidden: true;
    evidenceTierRequired: "measured_or_validated_simulation";
  };
  testItems: Nhm2FullApparatusTensorTestPlanItemV1[];
  summary: {
    fullApparatusTensorReceiptStatus: "pass" | "review" | "fail" | "missing";
    nextRequiredTestId: Nhm2FullApparatusTensorTestId | "none";
    openTestCount: number;
    falsifyingTestCount: number;
    satisfiedTestCount: number;
    componentCoverageFraction: number | null;
    termCoverageFraction: number | null;
    fullApparatusTensorEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    fullApparatusTensorPlanOnly: true;
    planDoesNotSupplyEvidence: true;
    scalarCasimirT00IsNotFullApparatusTensor: true;
    sourceTensorAuthorityRequiresDownstreamGates: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceFullApparatusTensorTestPlanInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  materialEvidenceReceiptsRef?: string | null;
};

const TEST_POLICY: Record<
  Nhm2FullApparatusTensorTestId,
  {
    blockers: string[];
    requiredMeasurement: string;
    acceptanceCriterion: string;
    artifactToProduce: string;
  }
> = {
  full_apparatus_tensor_provenance: {
    blockers: [
      "support_drive_terms_in_full_apparatus_Tmunu_missing",
      "full_apparatus_tensor_tier_not_measured_or_validated",
    ],
    requiredMeasurement:
      "Measured or validated-simulation full-apparatus tensor receipt with source-side provenance and frozen candidate identity.",
    acceptanceCriterion: "Evidence tier is measured or validated_simulation, not declared_model or missing.",
    artifactToProduce: "receipt://full_apparatus_tensor/provenance_v1",
  },
  same_chart: {
    blockers: ["full_apparatus_tensor_not_same_chart"],
    requiredMeasurement: "Chart metadata matching the NHM2 source authority and regional closure run.",
    acceptanceCriterion: "Tensor receipt is declared on the same chart.",
    artifactToProduce: "receipt://full_apparatus_tensor/same_chart_v1",
  },
  same_basis: {
    blockers: ["full_apparatus_tensor_not_same_basis"],
    requiredMeasurement: "Basis metadata matching the source-side same-basis authority path.",
    acceptanceCriterion: "Tensor receipt is declared in the same tensor basis.",
    artifactToProduce: "receipt://full_apparatus_tensor/same_basis_v1",
  },
  same_units: {
    blockers: ["full_apparatus_tensor_not_same_units"],
    requiredMeasurement: "Unit metadata for all stress-energy components.",
    acceptanceCriterion: "Tensor receipt uses the same units as closure evidence.",
    artifactToProduce: "receipt://full_apparatus_tensor/same_units_v1",
  },
  no_metric_target_echo: {
    blockers: ["full_apparatus_tensor_metric_echo_detected_or_not_checked"],
    requiredMeasurement: "Anti-target-echo receipt proving source tensor fields were not copied or fitted from metric-required tensor.",
    acceptanceCriterion: "No metric-target echo is detected.",
    artifactToProduce: "receipt://full_apparatus_tensor/no_metric_target_echo_v1",
  },
  T00_component: {
    blockers: ["full_apparatus_T00_missing", "full_apparatus_T00_detail_ref_missing"],
    requiredMeasurement: "Source-side T00 component for the full apparatus.",
    acceptanceCriterion: "T00 is present with a component-level source-side receipt ref.",
    artifactToProduce: "receipt://full_apparatus_tensor/T00_v1",
  },
  T0i_components: {
    blockers: [
      "full_apparatus_T0i_missing",
      "full_apparatus_T01_ref_missing",
      "full_apparatus_T02_ref_missing",
      "full_apparatus_T03_ref_missing",
    ],
    requiredMeasurement: "Source-side momentum-density components T0i for the full apparatus.",
    acceptanceCriterion: "T01, T02, and T03 are present with component-level source-side receipt refs and are not zero-filled.",
    artifactToProduce: "receipt://full_apparatus_tensor/T0i_v1",
  },
  diagonal_Tij_components: {
    blockers: [
      "full_apparatus_diagonal_Tij_missing",
      "full_apparatus_T11_ref_missing",
      "full_apparatus_T22_ref_missing",
      "full_apparatus_T33_ref_missing",
    ],
    requiredMeasurement: "Source-side diagonal spatial stress components Tij for the full apparatus.",
    acceptanceCriterion: "T11, T22, and T33 are present with component-level source-side receipt refs.",
    artifactToProduce: "receipt://full_apparatus_tensor/diagonal_Tij_v1",
  },
  off_diagonal_Tij_components: {
    blockers: [
      "full_apparatus_off_diagonal_Tij_missing",
      "full_apparatus_T12_ref_missing",
      "full_apparatus_T13_ref_missing",
      "full_apparatus_T23_ref_missing",
    ],
    requiredMeasurement: "Source-side off-diagonal spatial stress components Tij for the full apparatus.",
    acceptanceCriterion: "T12, T13, and T23 are present with component-level source-side receipt refs and are not zero-filled.",
    artifactToProduce: "receipt://full_apparatus_tensor/off_diagonal_Tij_v1",
  },
  support_structure_stress_energy: {
    blockers: ["full_apparatus_support_structure_stress_energy_missing"],
    requiredMeasurement: "Stress-energy contribution from the support structure.",
    acceptanceCriterion: "Support-structure stress-energy term is included.",
    artifactToProduce: "receipt://full_apparatus_tensor/support_structure_stress_energy_v1",
  },
  spacer_contact_stress_energy: {
    blockers: ["full_apparatus_spacer_contact_stress_energy_missing"],
    requiredMeasurement: "Stress-energy contribution from spacer/contact loads.",
    acceptanceCriterion: "Spacer/contact stress-energy term is included.",
    artifactToProduce: "receipt://full_apparatus_tensor/spacer_contact_stress_energy_v1",
  },
  active_control_field_energy: {
    blockers: ["full_apparatus_active_control_field_energy_missing"],
    requiredMeasurement: "Stress-energy contribution from active drive/control fields.",
    acceptanceCriterion: "Active-control field energy term is included.",
    artifactToProduce: "receipt://full_apparatus_tensor/active_control_field_energy_v1",
  },
  thermal_load_stress_energy: {
    blockers: ["full_apparatus_thermal_load_stress_energy_missing"],
    requiredMeasurement: "Stress-energy contribution from thermal load and gradients.",
    acceptanceCriterion: "Thermal-load stress-energy term is included.",
    artifactToProduce: "receipt://full_apparatus_tensor/thermal_load_stress_energy_v1",
  },
  patch_potential_electrostatic_stress: {
    blockers: ["full_apparatus_patch_potential_electrostatic_stress_missing"],
    requiredMeasurement: "Electrostatic stress contribution from patch-potential residuals.",
    acceptanceCriterion: "Patch-potential electrostatic stress term is included.",
    artifactToProduce: "receipt://full_apparatus_tensor/patch_potential_electrostatic_stress_v1",
  },
  fatigue_damage_evolution: {
    blockers: ["full_apparatus_fatigue_damage_evolution_missing"],
    requiredMeasurement: "Stress-energy evolution or correction from fatigue damage.",
    acceptanceCriterion: "Fatigue-damage evolution term is included.",
    artifactToProduce: "receipt://full_apparatus_tensor/fatigue_damage_evolution_v1",
  },
  layer_scaling_cross_terms: {
    blockers: ["full_apparatus_layer_scaling_cross_terms_missing"],
    requiredMeasurement: "Cross terms from 447-layer mechanical/electromagnetic scaling.",
    acceptanceCriterion: "Layer-scaling cross terms are included.",
    artifactToProduce: "receipt://full_apparatus_tensor/layer_scaling_cross_terms_v1",
  },
  casimir_interaction_stress_energy: {
    blockers: ["full_apparatus_casimir_interaction_stress_energy_missing"],
    requiredMeasurement: "Casimir interaction stress-energy contribution beyond scalar T00 replay.",
    acceptanceCriterion: "Casimir interaction stress-energy term is included.",
    artifactToProduce: "receipt://full_apparatus_tensor/casimir_interaction_stress_energy_v1",
  },
  material_strain_energy: {
    blockers: ["full_apparatus_material_strain_energy_missing"],
    requiredMeasurement: "Material strain-energy contribution from loaded plates and supports.",
    acceptanceCriterion: "Material strain-energy term is included.",
    artifactToProduce: "receipt://full_apparatus_tensor/material_strain_energy_v1",
  },
  regional_wall_coverage: {
    blockers: ["full_apparatus_wall_region_missing"],
    requiredMeasurement: "Wall-region tensor coverage using the canonical regional support.",
    acceptanceCriterion: "Wall-region tensor coverage is present.",
    artifactToProduce: "receipt://full_apparatus_tensor/wall_region_v1",
  },
  regional_hull_coverage: {
    blockers: ["full_apparatus_hull_region_missing"],
    requiredMeasurement: "Hull-region tensor coverage using the canonical regional support.",
    acceptanceCriterion: "Hull-region tensor coverage is present.",
    artifactToProduce: "receipt://full_apparatus_tensor/hull_region_v1",
  },
  regional_exterior_shell_coverage: {
    blockers: ["full_apparatus_exterior_shell_region_missing"],
    requiredMeasurement: "Exterior-shell tensor coverage using the canonical regional support.",
    acceptanceCriterion: "Exterior-shell tensor coverage is present.",
    artifactToProduce: "receipt://full_apparatus_tensor/exterior_shell_region_v1",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const fullApparatusSurface = (
  receipts: Nhm2TileSourceMaterialEvidenceReceiptsV1,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const surface = receipts.receiptSurfaces.find((entry) => entry.surfaceId === "full_apparatus_tensor");
  if (surface == null) {
    throw new Error("full_apparatus_tensor surface missing from nhm2 material evidence receipts");
  }
  return surface;
};

const itemStatus = (
  surface: Nhm2TileSourceReceiptSurfaceStatusV1,
  blockers: string[],
): Nhm2FullApparatusTensorTestStatus => {
  if (!blockers.some((blocker) => surface.blockers.includes(blocker))) return "satisfied";
  return surface.status === "fail" ? "falsifying" : "open";
};

export const buildNhm2TileSourceFullApparatusTensorTestPlan = (
  input: BuildNhm2TileSourceFullApparatusTensorTestPlanInput,
): Nhm2TileSourceFullApparatusTensorTestPlanV1 => {
  const receipts = input.materialEvidenceReceipts;
  const surface = fullApparatusSurface(receipts);
  const testItems = (Object.keys(TEST_POLICY) as Nhm2FullApparatusTensorTestId[]).map(
    (testId) => {
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
    },
  );
  const openItems = testItems.filter((item) => item.status === "open");
  const falsifyingItems = testItems.filter((item) => item.status === "falsifying");
  const satisfiedItems = testItems.filter((item) => item.status === "satisfied");
  const nextItem = falsifyingItems[0] ?? openItems[0] ?? null;
  return {
    contractVersion: NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_TEST_PLAN_CONTRACT_VERSION,
    generatedAt: receipts.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receipts.selectedProfileId,
    frozenCandidateId: receipts.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
    },
    fullApparatusTensorTarget: {
      requiredComponents: ["T00", "T0i", "diagonalTij", "offDiagonalTij"],
      requiredTensorComponentCount: 10,
      requiredTermCount: 9,
      requiredRegions: ["wall", "hull", "exterior_shell"],
      sourceSideOnly: true,
      targetEchoForbidden: true,
      evidenceTierRequired: "measured_or_validated_simulation",
    },
    testItems,
    summary: {
      fullApparatusTensorReceiptStatus: surface.status,
      nextRequiredTestId: nextItem?.testId ?? "none",
      openTestCount: openItems.length,
      falsifyingTestCount: falsifyingItems.length,
      satisfiedTestCount: satisfiedItems.length,
      componentCoverageFraction: surface.numericalMargins.componentCoverageFraction ?? null,
      termCoverageFraction: surface.numericalMargins.termCoverageFraction ?? null,
      fullApparatusTensorEvidenceReady: surface.status === "pass",
      falsifiesCurrentCandidate: surface.status === "fail",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      fullApparatusTensorPlanOnly: true,
      planDoesNotSupplyEvidence: true,
      scalarCasimirT00IsNotFullApparatusTensor: true,
      sourceTensorAuthorityRequiresDownstreamGates: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceFullApparatusTensorTestPlan = (
  value: unknown,
): value is Nhm2TileSourceFullApparatusTensorTestPlanV1 => {
  if (!isRecord(value)) return false;
  const target = isRecord(value.fullApparatusTensorTarget)
    ? value.fullApparatusTensorTarget
    : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_TEST_PLAN_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    target != null &&
    Array.isArray(target.requiredComponents) &&
    target.requiredComponents.length === 4 &&
    target.requiredTensorComponentCount === 10 &&
    target.requiredTermCount === 9 &&
    Array.isArray(target.requiredRegions) &&
    target.requiredRegions.length === 3 &&
    target.sourceSideOnly === true &&
    target.targetEchoForbidden === true &&
    target.evidenceTierRequired === "measured_or_validated_simulation" &&
    Array.isArray(value.testItems) &&
    value.testItems.length === 21 &&
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
    typeof summary.fullApparatusTensorReceiptStatus === "string" &&
    typeof summary.nextRequiredTestId === "string" &&
    typeof summary.openTestCount === "number" &&
    typeof summary.falsifyingTestCount === "number" &&
    typeof summary.satisfiedTestCount === "number" &&
    (summary.componentCoverageFraction === null ||
      typeof summary.componentCoverageFraction === "number") &&
    (summary.termCoverageFraction === null || typeof summary.termCoverageFraction === "number") &&
    typeof summary.fullApparatusTensorEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.fullApparatusTensorPlanOnly === true &&
    boundary.planDoesNotSupplyEvidence === true &&
    boundary.scalarCasimirT00IsNotFullApparatusTensor === true &&
    boundary.sourceTensorAuthorityRequiresDownstreamGates === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
