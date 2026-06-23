import type {
  Nhm2TileSourceFullApparatusTensorEvidenceV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_OPERATING_BUDGET_CONTRACT_VERSION =
  "nhm2_tile_source_full_apparatus_tensor_operating_budget/v1";

export type Nhm2TileSourceFullApparatusTensorOperatingBudgetV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_OPERATING_BUDGET_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    fullApparatusTensorEvidenceRef: string | null;
    tensorValueArtifactRef: string | null;
  };
  operatingTargets: {
    requiredComponentGroups: ["T00", "T0i", "diagonalTij", "offDiagonalTij"];
    requiredComponentGroupCount: 4;
    requiredTensorComponentCount: 10;
    requiredTermCount: 9;
    requiredRegionCount: 3;
    requiredSubsystemReceiptCount: 5;
    requiredAuthorityMetadataCount: 4;
    requiredRegions: ["wall", "hull", "exterior_shell"];
    regionalTensorSampleCountMin: number;
    sourceSideOnly: true;
    targetEchoForbidden: true;
    scalarT00OnlyForbidden: true;
    requiredCoverageFraction: 1;
  };
  suppliedFullApparatusTensorEvidence: {
    evidenceTier: string;
    tensorValueArtifactRef: string | null;
    tensorValueArtifactContract: string | null;
    sameChart: boolean;
    sameBasis: boolean;
    sameUnits: boolean;
    noMetricTargetEcho: boolean;
    components: {
      T00: boolean;
      T0i: boolean;
      diagonalTij: boolean;
      offDiagonalTij: boolean;
    };
    componentRefs: {
      T00: string | null;
      T0i: string | null;
      diagonalTij: string | null;
      offDiagonalTij: string | null;
    };
    componentDetailRefs: {
      T00: string | null;
      T01: string | null;
      T02: string | null;
      T03: string | null;
      T11: string | null;
      T12: string | null;
      T13: string | null;
      T22: string | null;
      T23: string | null;
      T33: string | null;
    };
    termCoverage: {
      supportStructureStressEnergy: boolean;
      spacerContactStressEnergy: boolean;
      activeControlFieldEnergy: boolean;
      thermalLoadStressEnergy: boolean;
      patchPotentialElectrostaticStress: boolean;
      fatigueDamageEvolution: boolean;
      layerScalingCrossTerms: boolean;
      casimirInteractionStressEnergy: boolean;
      materialStrainEnergy: boolean;
    };
    termRefs: {
      supportStructureStressEnergy: string | null;
      spacerContactStressEnergy: string | null;
      activeControlFieldEnergy: string | null;
      thermalLoadStressEnergy: string | null;
      patchPotentialElectrostaticStress: string | null;
      fatigueDamageEvolution: string | null;
      layerScalingCrossTerms: string | null;
      casimirInteractionStressEnergy: string | null;
      materialStrainEnergy: string | null;
    };
    subsystemReceiptRefs: {
      materialCoupon: string | null;
      forceGapPullIn: string | null;
      roughnessPatch: string | null;
      activeControl: string | null;
      fatigueLayerScaling: string | null;
    };
    regionalCoverage: {
      wall: boolean;
      hull: boolean;
      exteriorShell: boolean;
    };
    regionalSupportRefs: {
      wall: string | null;
      hull: string | null;
      exteriorShell: string | null;
    };
    regionalSampleCounts: {
      wall: number | null;
      hull: number | null;
      exteriorShell: number | null;
    };
  };
  derivedOperatingBudget: {
    componentCoverageFraction: number;
    termCoverageFraction: number;
    regionalCoverageFraction: number;
    authorityMetadataComplete: boolean;
    componentRefsComplete: boolean;
    componentDetailRefsComplete: boolean;
    tensorValueArtifactAvailable: boolean;
    termRefsComplete: boolean;
    subsystemReceiptRefsComplete: boolean;
    regionalSupportRefsComplete: boolean;
    regionalSampleCountsComplete: boolean;
    regionalSampleCountsMeetMinimum: boolean;
    fullTensorCoverageComplete: boolean;
    requiredStressEnergyTermsComplete: boolean;
    requiredRegionalCoverageComplete: boolean;
    scalarT00Only: boolean;
  };
  requiredCorrections: {
    requiredComponentGroupCount: 4;
    componentGroupMissingCount: number;
    missingComponentGroupIds: string[];
    componentGroupRefMissingCount: number;
    missingComponentGroupRefIds: string[];
    requiredTensorComponentCount: 10;
    tensorComponentRefMissingCount: number;
    missingTensorComponentIds: string[];
    requiredStressEnergyTermCount: 9;
    stressEnergyTermMissingCount: number;
    missingStressEnergyTermIds: string[];
    stressEnergyTermRefMissingCount: number;
    missingStressEnergyTermRefIds: string[];
    requiredSubsystemReceiptCount: 5;
    subsystemReceiptRefMissingCount: number;
    missingSubsystemReceiptRefIds: string[];
    requiredRegionCount: 3;
    regionCoverageMissingCount: number;
    missingRegionIds: string[];
    regionalSupportRefMissingCount: number;
    missingRegionalSupportRefIds: string[];
    regionalSampleCountMissingOrInvalidCount: number;
    missingOrInvalidRegionalSampleCountIds: string[];
    regionalTensorSampleCountMin: number;
    regionalSampleCountBelowMinimumCount: number;
    regionalSampleCountBelowMinimumIds: string[];
    wallRegionalSampleCountShortfall: number | null;
    hullRegionalSampleCountShortfall: number | null;
    exteriorShellRegionalSampleCountShortfall: number | null;
    requiredAuthorityMetadataCount: 4;
    authorityMetadataMissingCount: number;
    missingAuthorityMetadataIds: string[];
    componentCoverageFractionShortfall: number;
    termCoverageFractionShortfall: number;
    regionalCoverageFractionShortfall: number;
    tensorValueArtifactRequired: true;
    tensorValueArtifactAvailable: boolean;
    scalarT00OnlyForbidden: true;
    scalarT00OnlyDetected: boolean;
  };
  blockers: string[];
  summary: {
    operatingBudgetComputed: boolean;
    fullApparatusTensorEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    firstBlocker: string;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    operatingBudgetOnly: true;
    fullApparatusTensorBudgetDoesNotSupplyTensorValues: true;
    tensorValueArtifactRequiredForSourceAuthority: true;
    scalarCasimirT00IsNotFullApparatusTensor: true;
    sourceTensorAuthorityRequiresDownstreamGates: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceFullApparatusTensorOperatingBudgetInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  fullApparatusTensorEvidence?: Nhm2TileSourceFullApparatusTensorEvidenceV1 | null;
};

const DEFAULT_SELECTED_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isNumberOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const shortfallToMinimum = (value: number | null | undefined, minimum: number): number | null =>
  value == null ? null : round(Math.max(0, minimum - value));

const COMPONENT_GROUP_IDS = ["T00", "T0i", "diagonalTij", "offDiagonalTij"] as const;
const TENSOR_COMPONENT_IDS = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const;
const STRESS_ENERGY_TERM_IDS = [
  "supportStructureStressEnergy",
  "spacerContactStressEnergy",
  "activeControlFieldEnergy",
  "thermalLoadStressEnergy",
  "patchPotentialElectrostaticStress",
  "fatigueDamageEvolution",
  "layerScalingCrossTerms",
  "casimirInteractionStressEnergy",
  "materialStrainEnergy",
] as const;
const SUBSYSTEM_RECEIPT_IDS = [
  "materialCoupon",
  "forceGapPullIn",
  "roughnessPatch",
  "activeControl",
  "fatigueLayerScaling",
] as const;
const REGION_IDS = ["wall", "hull", "exteriorShell"] as const;
const REGIONAL_TENSOR_SAMPLE_COUNT_MIN = 447;
const AUTHORITY_METADATA_IDS = [
  "sameChart",
  "sameBasis",
  "sameUnits",
  "noMetricTargetEcho",
] as const;

const defaultEvidence = (): Nhm2TileSourceFullApparatusTensorEvidenceV1 => ({
  evidenceTier: "missing",
  evidenceRef: null,
  tensorValueArtifactRef: null,
  tensorValueArtifactContract: null,
  sameChart: false,
  sameBasis: false,
  sameUnits: false,
  noMetricTargetEcho: false,
  components: {
    T00: false,
    T0i: false,
    diagonalTij: false,
    offDiagonalTij: false,
  },
  termCoverage: {
    supportStructureStressEnergy: false,
    spacerContactStressEnergy: false,
    activeControlFieldEnergy: false,
    thermalLoadStressEnergy: false,
    patchPotentialElectrostaticStress: false,
    fatigueDamageEvolution: false,
    layerScalingCrossTerms: false,
    casimirInteractionStressEnergy: false,
    materialStrainEnergy: false,
  },
  regionalCoverage: {
    wall: false,
    hull: false,
    exteriorShell: false,
  },
});

export const buildNhm2TileSourceFullApparatusTensorOperatingBudget = (
  input: BuildNhm2TileSourceFullApparatusTensorOperatingBudgetInput = {},
): Nhm2TileSourceFullApparatusTensorOperatingBudgetV1 => {
  const evidence = input.fullApparatusTensorEvidence ?? defaultEvidence();
  const componentValues = Object.values(evidence.components);
  const termValues = Object.values(evidence.termCoverage);
  const regionValues = Object.values(evidence.regionalCoverage);
  const componentCoverageFraction = round(
    componentValues.filter(Boolean).length / componentValues.length,
  );
  const termCoverageFraction = round(termValues.filter(Boolean).length / termValues.length);
  const regionalCoverageFraction = round(
    regionValues.filter(Boolean).length / regionValues.length,
  );
  const authorityMetadataComplete =
    evidence.sameChart &&
    evidence.sameBasis &&
    evidence.sameUnits &&
    evidence.noMetricTargetEcho;
  const componentRefsComplete =
    evidence.componentRefs?.T00 != null &&
    evidence.componentRefs.T0i != null &&
    evidence.componentRefs.diagonalTij != null &&
    evidence.componentRefs.offDiagonalTij != null;
  const componentDetailRefsComplete =
    evidence.componentDetailRefs?.T00 != null &&
    evidence.componentDetailRefs.T01 != null &&
    evidence.componentDetailRefs.T02 != null &&
    evidence.componentDetailRefs.T03 != null &&
    evidence.componentDetailRefs.T11 != null &&
    evidence.componentDetailRefs.T12 != null &&
    evidence.componentDetailRefs.T13 != null &&
    evidence.componentDetailRefs.T22 != null &&
    evidence.componentDetailRefs.T23 != null &&
    evidence.componentDetailRefs.T33 != null;
  const tensorValueArtifactAvailable =
    evidence.tensorValueArtifactRef != null &&
    evidence.tensorValueArtifactContract ===
      "nhm2_tile_source_full_apparatus_tensor_values/v1";
  const termRefsComplete =
    evidence.termRefs?.supportStructureStressEnergy != null &&
    evidence.termRefs.spacerContactStressEnergy != null &&
    evidence.termRefs.activeControlFieldEnergy != null &&
    evidence.termRefs.thermalLoadStressEnergy != null &&
    evidence.termRefs.patchPotentialElectrostaticStress != null &&
    evidence.termRefs.fatigueDamageEvolution != null &&
    evidence.termRefs.layerScalingCrossTerms != null &&
    evidence.termRefs.casimirInteractionStressEnergy != null &&
    evidence.termRefs.materialStrainEnergy != null;
  const subsystemReceiptRefsComplete =
    evidence.subsystemReceiptRefs?.materialCoupon != null &&
    evidence.subsystemReceiptRefs.forceGapPullIn != null &&
    evidence.subsystemReceiptRefs.roughnessPatch != null &&
    evidence.subsystemReceiptRefs.activeControl != null &&
    evidence.subsystemReceiptRefs.fatigueLayerScaling != null;
  const regionalSupportRefsComplete =
    evidence.regionalSupportRefs?.wall != null &&
    evidence.regionalSupportRefs.hull != null &&
    evidence.regionalSupportRefs.exteriorShell != null;
  const regionalSampleCountsComplete =
    isPositiveFiniteNumber(evidence.regionalSampleCounts?.wall) &&
    isPositiveFiniteNumber(evidence.regionalSampleCounts?.hull) &&
    isPositiveFiniteNumber(evidence.regionalSampleCounts?.exteriorShell);
  const regionalSampleCountBelowMinimumIds = REGION_IDS.filter(
    (regionId) =>
      isPositiveFiniteNumber(evidence.regionalSampleCounts?.[regionId]) &&
      evidence.regionalSampleCounts[regionId] < REGIONAL_TENSOR_SAMPLE_COUNT_MIN,
  );
  const regionalSampleCountsMeetMinimum =
    regionalSampleCountsComplete && regionalSampleCountBelowMinimumIds.length === 0;
  const fullTensorCoverageComplete = componentCoverageFraction === 1;
  const requiredStressEnergyTermsComplete = termCoverageFraction === 1;
  const requiredRegionalCoverageComplete = regionalCoverageFraction === 1;
  const scalarT00Only =
    evidence.components.T00 &&
    !evidence.components.T0i &&
    !evidence.components.diagonalTij &&
    !evidence.components.offDiagonalTij;
  const missingComponentGroupIds = COMPONENT_GROUP_IDS.filter((componentId) => {
    if (componentId === "T00") return !evidence.components.T00;
    if (componentId === "T0i") return !evidence.components.T0i;
    if (componentId === "diagonalTij") return !evidence.components.diagonalTij;
    return !evidence.components.offDiagonalTij;
  });
  const missingComponentGroupRefIds = COMPONENT_GROUP_IDS.filter(
    (componentId) => evidence.componentRefs?.[componentId] == null,
  );
  const missingTensorComponentIds = TENSOR_COMPONENT_IDS.filter(
    (componentId) => evidence.componentDetailRefs?.[componentId] == null,
  );
  const missingStressEnergyTermIds = STRESS_ENERGY_TERM_IDS.filter(
    (termId) => !evidence.termCoverage[termId],
  );
  const missingStressEnergyTermRefIds = STRESS_ENERGY_TERM_IDS.filter(
    (termId) => evidence.termRefs?.[termId] == null,
  );
  const missingSubsystemReceiptRefIds = SUBSYSTEM_RECEIPT_IDS.filter(
    (subsystemId) => evidence.subsystemReceiptRefs?.[subsystemId] == null,
  );
  const missingRegionIds = REGION_IDS.filter((regionId) => !evidence.regionalCoverage[regionId]);
  const missingRegionalSupportRefIds = REGION_IDS.filter(
    (regionId) => evidence.regionalSupportRefs?.[regionId] == null,
  );
  const missingOrInvalidRegionalSampleCountIds = REGION_IDS.filter(
    (regionId) => !isPositiveFiniteNumber(evidence.regionalSampleCounts?.[regionId]),
  );
  const missingAuthorityMetadataIds = AUTHORITY_METADATA_IDS.filter(
    (metadataId) => evidence[metadataId] !== true,
  );
  const blockers = [
    ...(evidence.evidenceTier === "missing"
      ? ["full_apparatus_tensor_receipt_missing_for_operating_budget"]
      : []),
    ...(evidence.evidenceTier !== "measured" &&
    evidence.evidenceTier !== "validated_simulation"
      ? ["full_apparatus_tensor_operating_budget_tier_not_measured_or_validated"]
      : []),
    ...(evidence.tensorValueArtifactRef == null
      ? ["full_apparatus_tensor_value_artifact_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.tensorValueArtifactContract !==
    "nhm2_tile_source_full_apparatus_tensor_values/v1"
      ? ["full_apparatus_tensor_value_artifact_contract_missing_or_invalid_for_operating_budget"]
      : []),
    ...(!evidence.sameChart ? ["full_apparatus_tensor_not_same_chart_for_operating_budget"] : []),
    ...(!evidence.sameBasis ? ["full_apparatus_tensor_not_same_basis_for_operating_budget"] : []),
    ...(!evidence.sameUnits ? ["full_apparatus_tensor_not_same_units_for_operating_budget"] : []),
    ...(!evidence.noMetricTargetEcho
      ? ["full_apparatus_tensor_metric_echo_detected_or_not_checked_for_operating_budget"]
      : []),
    ...(scalarT00Only ? ["full_apparatus_tensor_scalar_T00_only_forbidden"] : []),
    ...(!evidence.components.T00 ? ["full_apparatus_T00_missing_for_operating_budget"] : []),
    ...(evidence.componentRefs?.T00 == null
      ? ["full_apparatus_T00_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.components.T0i ? ["full_apparatus_T0i_missing_for_operating_budget"] : []),
    ...(evidence.componentRefs?.T0i == null
      ? ["full_apparatus_T0i_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.components.diagonalTij
      ? ["full_apparatus_diagonal_Tij_missing_for_operating_budget"]
      : []),
    ...(evidence.componentRefs?.diagonalTij == null
      ? ["full_apparatus_diagonal_Tij_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.components.offDiagonalTij
      ? ["full_apparatus_off_diagonal_Tij_missing_for_operating_budget"]
      : []),
    ...(evidence.componentRefs?.offDiagonalTij == null
      ? ["full_apparatus_off_diagonal_Tij_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T00 == null
      ? ["full_apparatus_T00_detail_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T01 == null
      ? ["full_apparatus_T01_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T02 == null
      ? ["full_apparatus_T02_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T03 == null
      ? ["full_apparatus_T03_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T11 == null
      ? ["full_apparatus_T11_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T12 == null
      ? ["full_apparatus_T12_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T13 == null
      ? ["full_apparatus_T13_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T22 == null
      ? ["full_apparatus_T22_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T23 == null
      ? ["full_apparatus_T23_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.componentDetailRefs?.T33 == null
      ? ["full_apparatus_T33_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.termCoverage.supportStructureStressEnergy
      ? ["full_apparatus_support_structure_stress_energy_missing_for_operating_budget"]
      : []),
    ...(evidence.termRefs?.supportStructureStressEnergy == null
      ? ["full_apparatus_support_structure_stress_energy_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.termCoverage.spacerContactStressEnergy
      ? ["full_apparatus_spacer_contact_stress_energy_missing_for_operating_budget"]
      : []),
    ...(evidence.termRefs?.spacerContactStressEnergy == null
      ? ["full_apparatus_spacer_contact_stress_energy_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.termCoverage.activeControlFieldEnergy
      ? ["full_apparatus_active_control_field_energy_missing_for_operating_budget"]
      : []),
    ...(evidence.termRefs?.activeControlFieldEnergy == null
      ? ["full_apparatus_active_control_field_energy_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.termCoverage.thermalLoadStressEnergy
      ? ["full_apparatus_thermal_load_stress_energy_missing_for_operating_budget"]
      : []),
    ...(evidence.termRefs?.thermalLoadStressEnergy == null
      ? ["full_apparatus_thermal_load_stress_energy_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.termCoverage.patchPotentialElectrostaticStress
      ? ["full_apparatus_patch_potential_electrostatic_stress_missing_for_operating_budget"]
      : []),
    ...(evidence.termRefs?.patchPotentialElectrostaticStress == null
      ? ["full_apparatus_patch_potential_electrostatic_stress_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.termCoverage.fatigueDamageEvolution
      ? ["full_apparatus_fatigue_damage_evolution_missing_for_operating_budget"]
      : []),
    ...(evidence.termRefs?.fatigueDamageEvolution == null
      ? ["full_apparatus_fatigue_damage_evolution_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.termCoverage.layerScalingCrossTerms
      ? ["full_apparatus_layer_scaling_cross_terms_missing_for_operating_budget"]
      : []),
    ...(evidence.termRefs?.layerScalingCrossTerms == null
      ? ["full_apparatus_layer_scaling_cross_terms_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.termCoverage.casimirInteractionStressEnergy
      ? ["full_apparatus_casimir_interaction_stress_energy_missing_for_operating_budget"]
      : []),
    ...(evidence.termRefs?.casimirInteractionStressEnergy == null
      ? ["full_apparatus_casimir_interaction_stress_energy_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.termCoverage.materialStrainEnergy
      ? ["full_apparatus_material_strain_energy_missing_for_operating_budget"]
      : []),
    ...(evidence.termRefs?.materialStrainEnergy == null
      ? ["full_apparatus_material_strain_energy_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.subsystemReceiptRefs?.materialCoupon == null
      ? ["full_apparatus_material_coupon_receipt_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.subsystemReceiptRefs?.forceGapPullIn == null
      ? ["full_apparatus_force_gap_receipt_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.subsystemReceiptRefs?.roughnessPatch == null
      ? ["full_apparatus_roughness_patch_receipt_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.subsystemReceiptRefs?.activeControl == null
      ? ["full_apparatus_active_control_receipt_ref_missing_for_operating_budget"]
      : []),
    ...(evidence.subsystemReceiptRefs?.fatigueLayerScaling == null
      ? ["full_apparatus_fatigue_layer_scaling_receipt_ref_missing_for_operating_budget"]
      : []),
    ...(!evidence.regionalCoverage.wall
      ? ["full_apparatus_wall_region_missing_for_operating_budget"]
      : []),
    ...(evidence.regionalSupportRefs?.wall == null
      ? ["full_apparatus_wall_region_support_ref_missing_for_operating_budget"]
      : []),
    ...(!isPositiveFiniteNumber(evidence.regionalSampleCounts?.wall)
      ? ["full_apparatus_wall_region_sample_count_missing_or_invalid_for_operating_budget"]
      : evidence.regionalSampleCounts.wall < REGIONAL_TENSOR_SAMPLE_COUNT_MIN
        ? ["full_apparatus_wall_region_sample_count_below_447_for_operating_budget"]
      : []),
    ...(!evidence.regionalCoverage.hull
      ? ["full_apparatus_hull_region_missing_for_operating_budget"]
      : []),
    ...(evidence.regionalSupportRefs?.hull == null
      ? ["full_apparatus_hull_region_support_ref_missing_for_operating_budget"]
      : []),
    ...(!isPositiveFiniteNumber(evidence.regionalSampleCounts?.hull)
      ? ["full_apparatus_hull_region_sample_count_missing_or_invalid_for_operating_budget"]
      : evidence.regionalSampleCounts.hull < REGIONAL_TENSOR_SAMPLE_COUNT_MIN
        ? ["full_apparatus_hull_region_sample_count_below_447_for_operating_budget"]
      : []),
    ...(!evidence.regionalCoverage.exteriorShell
      ? ["full_apparatus_exterior_shell_region_missing_for_operating_budget"]
      : []),
    ...(evidence.regionalSupportRefs?.exteriorShell == null
      ? ["full_apparatus_exterior_shell_region_support_ref_missing_for_operating_budget"]
      : []),
    ...(!isPositiveFiniteNumber(evidence.regionalSampleCounts?.exteriorShell)
      ? ["full_apparatus_exterior_shell_region_sample_count_missing_or_invalid_for_operating_budget"]
      : evidence.regionalSampleCounts.exteriorShell < REGIONAL_TENSOR_SAMPLE_COUNT_MIN
        ? [
            "full_apparatus_exterior_shell_region_sample_count_below_447_for_operating_budget",
          ]
      : []),
  ];
  const falsifiesCurrentCandidate =
    evidence.evidenceTier === "measured" || evidence.evidenceTier === "validated_simulation"
      ? blockers.length > 0
      : false;
  return {
    contractVersion: NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_OPERATING_BUDGET_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.selectedProfileId ?? DEFAULT_SELECTED_PROFILE_ID,
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    sourceRefs: {
      fullApparatusTensorEvidenceRef: evidence.evidenceRef ?? null,
      tensorValueArtifactRef: evidence.tensorValueArtifactRef ?? null,
    },
    operatingTargets: {
      requiredComponentGroups: ["T00", "T0i", "diagonalTij", "offDiagonalTij"],
      requiredComponentGroupCount: 4,
      requiredTensorComponentCount: 10,
      requiredTermCount: 9,
      requiredRegionCount: 3,
      requiredSubsystemReceiptCount: 5,
      requiredAuthorityMetadataCount: 4,
      requiredRegions: ["wall", "hull", "exterior_shell"],
      regionalTensorSampleCountMin: REGIONAL_TENSOR_SAMPLE_COUNT_MIN,
      sourceSideOnly: true,
      targetEchoForbidden: true,
      scalarT00OnlyForbidden: true,
      requiredCoverageFraction: 1,
    },
    suppliedFullApparatusTensorEvidence: {
      evidenceTier: evidence.evidenceTier,
      tensorValueArtifactRef: evidence.tensorValueArtifactRef ?? null,
      tensorValueArtifactContract: evidence.tensorValueArtifactContract ?? null,
      sameChart: evidence.sameChart,
      sameBasis: evidence.sameBasis,
      sameUnits: evidence.sameUnits,
      noMetricTargetEcho: evidence.noMetricTargetEcho,
      components: { ...evidence.components },
      componentRefs: {
        T00: evidence.componentRefs?.T00 ?? null,
        T0i: evidence.componentRefs?.T0i ?? null,
        diagonalTij: evidence.componentRefs?.diagonalTij ?? null,
        offDiagonalTij: evidence.componentRefs?.offDiagonalTij ?? null,
      },
      componentDetailRefs: {
        T00: evidence.componentDetailRefs?.T00 ?? null,
        T01: evidence.componentDetailRefs?.T01 ?? null,
        T02: evidence.componentDetailRefs?.T02 ?? null,
        T03: evidence.componentDetailRefs?.T03 ?? null,
        T11: evidence.componentDetailRefs?.T11 ?? null,
        T12: evidence.componentDetailRefs?.T12 ?? null,
        T13: evidence.componentDetailRefs?.T13 ?? null,
        T22: evidence.componentDetailRefs?.T22 ?? null,
        T23: evidence.componentDetailRefs?.T23 ?? null,
        T33: evidence.componentDetailRefs?.T33 ?? null,
      },
      termCoverage: { ...evidence.termCoverage },
      termRefs: {
        supportStructureStressEnergy: evidence.termRefs?.supportStructureStressEnergy ?? null,
        spacerContactStressEnergy: evidence.termRefs?.spacerContactStressEnergy ?? null,
        activeControlFieldEnergy: evidence.termRefs?.activeControlFieldEnergy ?? null,
        thermalLoadStressEnergy: evidence.termRefs?.thermalLoadStressEnergy ?? null,
        patchPotentialElectrostaticStress:
          evidence.termRefs?.patchPotentialElectrostaticStress ?? null,
        fatigueDamageEvolution: evidence.termRefs?.fatigueDamageEvolution ?? null,
        layerScalingCrossTerms: evidence.termRefs?.layerScalingCrossTerms ?? null,
        casimirInteractionStressEnergy: evidence.termRefs?.casimirInteractionStressEnergy ?? null,
        materialStrainEnergy: evidence.termRefs?.materialStrainEnergy ?? null,
      },
      subsystemReceiptRefs: {
        materialCoupon: evidence.subsystemReceiptRefs?.materialCoupon ?? null,
        forceGapPullIn: evidence.subsystemReceiptRefs?.forceGapPullIn ?? null,
        roughnessPatch: evidence.subsystemReceiptRefs?.roughnessPatch ?? null,
        activeControl: evidence.subsystemReceiptRefs?.activeControl ?? null,
        fatigueLayerScaling: evidence.subsystemReceiptRefs?.fatigueLayerScaling ?? null,
      },
      regionalCoverage: { ...evidence.regionalCoverage },
      regionalSupportRefs: {
        wall: evidence.regionalSupportRefs?.wall ?? null,
        hull: evidence.regionalSupportRefs?.hull ?? null,
        exteriorShell: evidence.regionalSupportRefs?.exteriorShell ?? null,
      },
      regionalSampleCounts: {
        wall: evidence.regionalSampleCounts?.wall ?? null,
        hull: evidence.regionalSampleCounts?.hull ?? null,
        exteriorShell: evidence.regionalSampleCounts?.exteriorShell ?? null,
      },
    },
    derivedOperatingBudget: {
      componentCoverageFraction,
      termCoverageFraction,
      regionalCoverageFraction,
      authorityMetadataComplete,
      componentRefsComplete,
      componentDetailRefsComplete,
      tensorValueArtifactAvailable,
      termRefsComplete,
      subsystemReceiptRefsComplete,
      regionalSupportRefsComplete,
      regionalSampleCountsComplete,
      regionalSampleCountsMeetMinimum,
      fullTensorCoverageComplete,
      requiredStressEnergyTermsComplete,
      requiredRegionalCoverageComplete,
      scalarT00Only,
    },
    requiredCorrections: {
      requiredComponentGroupCount: 4,
      componentGroupMissingCount: missingComponentGroupIds.length,
      missingComponentGroupIds,
      componentGroupRefMissingCount: missingComponentGroupRefIds.length,
      missingComponentGroupRefIds,
      requiredTensorComponentCount: 10,
      tensorComponentRefMissingCount: missingTensorComponentIds.length,
      missingTensorComponentIds,
      requiredStressEnergyTermCount: 9,
      stressEnergyTermMissingCount: missingStressEnergyTermIds.length,
      missingStressEnergyTermIds,
      stressEnergyTermRefMissingCount: missingStressEnergyTermRefIds.length,
      missingStressEnergyTermRefIds,
      requiredSubsystemReceiptCount: 5,
      subsystemReceiptRefMissingCount: missingSubsystemReceiptRefIds.length,
      missingSubsystemReceiptRefIds,
      requiredRegionCount: 3,
      regionCoverageMissingCount: missingRegionIds.length,
      missingRegionIds,
      regionalSupportRefMissingCount: missingRegionalSupportRefIds.length,
      missingRegionalSupportRefIds,
      regionalSampleCountMissingOrInvalidCount: missingOrInvalidRegionalSampleCountIds.length,
      missingOrInvalidRegionalSampleCountIds,
      regionalTensorSampleCountMin: REGIONAL_TENSOR_SAMPLE_COUNT_MIN,
      regionalSampleCountBelowMinimumCount: regionalSampleCountBelowMinimumIds.length,
      regionalSampleCountBelowMinimumIds,
      wallRegionalSampleCountShortfall: shortfallToMinimum(
        evidence.regionalSampleCounts?.wall,
        REGIONAL_TENSOR_SAMPLE_COUNT_MIN,
      ),
      hullRegionalSampleCountShortfall: shortfallToMinimum(
        evidence.regionalSampleCounts?.hull,
        REGIONAL_TENSOR_SAMPLE_COUNT_MIN,
      ),
      exteriorShellRegionalSampleCountShortfall: shortfallToMinimum(
        evidence.regionalSampleCounts?.exteriorShell,
        REGIONAL_TENSOR_SAMPLE_COUNT_MIN,
      ),
      requiredAuthorityMetadataCount: 4,
      authorityMetadataMissingCount: missingAuthorityMetadataIds.length,
      missingAuthorityMetadataIds,
      componentCoverageFractionShortfall: round(Math.max(0, 1 - componentCoverageFraction)),
      termCoverageFractionShortfall: round(Math.max(0, 1 - termCoverageFraction)),
      regionalCoverageFractionShortfall: round(Math.max(0, 1 - regionalCoverageFraction)),
      tensorValueArtifactRequired: true,
      tensorValueArtifactAvailable,
      scalarT00OnlyForbidden: true,
      scalarT00OnlyDetected: scalarT00Only,
    },
    blockers,
    summary: {
      operatingBudgetComputed: true,
      fullApparatusTensorEvidenceReady: blockers.length === 0,
      falsifiesCurrentCandidate,
      firstBlocker: blockers[0] ?? "none",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      operatingBudgetOnly: true,
      fullApparatusTensorBudgetDoesNotSupplyTensorValues: true,
      tensorValueArtifactRequiredForSourceAuthority: true,
      scalarCasimirT00IsNotFullApparatusTensor: true,
      sourceTensorAuthorityRequiresDownstreamGates: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceFullApparatusTensorOperatingBudget = (
  value: unknown,
): value is Nhm2TileSourceFullApparatusTensorOperatingBudgetV1 => {
  if (!isRecord(value)) return false;
  const targets = isRecord(value.operatingTargets) ? value.operatingTargets : null;
  const supplied = isRecord(value.suppliedFullApparatusTensorEvidence)
    ? value.suppliedFullApparatusTensorEvidence
    : null;
  const budget = isRecord(value.derivedOperatingBudget)
    ? value.derivedOperatingBudget
    : null;
  const requiredCorrections = isRecord(value.requiredCorrections)
    ? value.requiredCorrections
    : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion ===
      NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_OPERATING_BUDGET_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    targets != null &&
    Array.isArray(targets.requiredComponentGroups) &&
    targets.requiredComponentGroupCount === 4 &&
    targets.requiredTensorComponentCount === 10 &&
    targets.requiredTermCount === 9 &&
    targets.requiredRegionCount === 3 &&
    targets.requiredSubsystemReceiptCount === 5 &&
    targets.requiredAuthorityMetadataCount === 4 &&
    Array.isArray(targets.requiredRegions) &&
    targets.requiredRegions.length === 3 &&
    typeof targets.regionalTensorSampleCountMin === "number" &&
    targets.sourceSideOnly === true &&
    targets.targetEchoForbidden === true &&
    targets.scalarT00OnlyForbidden === true &&
    targets.requiredCoverageFraction === 1 &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    budget != null &&
    typeof budget.componentCoverageFraction === "number" &&
    typeof budget.termCoverageFraction === "number" &&
    typeof budget.regionalCoverageFraction === "number" &&
    typeof budget.authorityMetadataComplete === "boolean" &&
    typeof budget.componentRefsComplete === "boolean" &&
    typeof budget.componentDetailRefsComplete === "boolean" &&
    typeof budget.tensorValueArtifactAvailable === "boolean" &&
    typeof budget.termRefsComplete === "boolean" &&
    typeof budget.subsystemReceiptRefsComplete === "boolean" &&
    typeof budget.regionalSupportRefsComplete === "boolean" &&
    typeof budget.regionalSampleCountsComplete === "boolean" &&
    typeof budget.regionalSampleCountsMeetMinimum === "boolean" &&
    typeof budget.fullTensorCoverageComplete === "boolean" &&
    typeof budget.requiredStressEnergyTermsComplete === "boolean" &&
    typeof budget.requiredRegionalCoverageComplete === "boolean" &&
    typeof budget.scalarT00Only === "boolean" &&
    requiredCorrections != null &&
    requiredCorrections.requiredComponentGroupCount === 4 &&
    typeof requiredCorrections.componentGroupMissingCount === "number" &&
    Array.isArray(requiredCorrections.missingComponentGroupIds) &&
    typeof requiredCorrections.componentGroupRefMissingCount === "number" &&
    Array.isArray(requiredCorrections.missingComponentGroupRefIds) &&
    requiredCorrections.requiredTensorComponentCount === 10 &&
    typeof requiredCorrections.tensorComponentRefMissingCount === "number" &&
    Array.isArray(requiredCorrections.missingTensorComponentIds) &&
    requiredCorrections.requiredStressEnergyTermCount === 9 &&
    typeof requiredCorrections.stressEnergyTermMissingCount === "number" &&
    Array.isArray(requiredCorrections.missingStressEnergyTermIds) &&
    typeof requiredCorrections.stressEnergyTermRefMissingCount === "number" &&
    Array.isArray(requiredCorrections.missingStressEnergyTermRefIds) &&
    requiredCorrections.requiredSubsystemReceiptCount === 5 &&
    typeof requiredCorrections.subsystemReceiptRefMissingCount === "number" &&
    Array.isArray(requiredCorrections.missingSubsystemReceiptRefIds) &&
    requiredCorrections.requiredRegionCount === 3 &&
    typeof requiredCorrections.regionCoverageMissingCount === "number" &&
    Array.isArray(requiredCorrections.missingRegionIds) &&
    typeof requiredCorrections.regionalSupportRefMissingCount === "number" &&
    Array.isArray(requiredCorrections.missingRegionalSupportRefIds) &&
    typeof requiredCorrections.regionalSampleCountMissingOrInvalidCount === "number" &&
    Array.isArray(requiredCorrections.missingOrInvalidRegionalSampleCountIds) &&
    typeof requiredCorrections.regionalTensorSampleCountMin === "number" &&
    typeof requiredCorrections.regionalSampleCountBelowMinimumCount === "number" &&
    Array.isArray(requiredCorrections.regionalSampleCountBelowMinimumIds) &&
    isNumberOrNull(requiredCorrections.wallRegionalSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.hullRegionalSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.exteriorShellRegionalSampleCountShortfall) &&
    requiredCorrections.requiredAuthorityMetadataCount === 4 &&
    typeof requiredCorrections.authorityMetadataMissingCount === "number" &&
    Array.isArray(requiredCorrections.missingAuthorityMetadataIds) &&
    typeof requiredCorrections.componentCoverageFractionShortfall === "number" &&
    typeof requiredCorrections.termCoverageFractionShortfall === "number" &&
    typeof requiredCorrections.regionalCoverageFractionShortfall === "number" &&
    requiredCorrections.tensorValueArtifactRequired === true &&
    typeof requiredCorrections.tensorValueArtifactAvailable === "boolean" &&
    requiredCorrections.scalarT00OnlyForbidden === true &&
    typeof requiredCorrections.scalarT00OnlyDetected === "boolean" &&
    Array.isArray(value.blockers) &&
    value.blockers.every((entry) => typeof entry === "string") &&
    summary != null &&
    summary.operatingBudgetComputed === true &&
    typeof summary.fullApparatusTensorEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.operatingBudgetOnly === true &&
      boundary.fullApparatusTensorBudgetDoesNotSupplyTensorValues === true &&
    boundary.tensorValueArtifactRequiredForSourceAuthority === true &&
    boundary.scalarCasimirT00IsNotFullApparatusTensor === true &&
    boundary.sourceTensorAuthorityRequiresDownstreamGates === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
