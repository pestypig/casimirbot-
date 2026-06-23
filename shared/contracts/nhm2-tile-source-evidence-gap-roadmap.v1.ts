import type { Nhm2LayerStackReceiptSurfaceId } from "./nhm2-layer-stack-full-apparatus-receipt-loop.v1";
import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
  Nhm2TileSourceReceiptSurfaceStatusV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";
import type { Nhm2TileSourcePhysicalValidationPlanV1 } from "./nhm2-tile-source-physical-validation-plan.v1";
import type {
  Nhm2TileSourceOperatingBudgetCorrectionValueV1,
  Nhm2TileSourceOperatingBudgetReadinessV1,
  Nhm2TileSourceOperatingBudgetSurfaceIdV1,
} from "./nhm2-tile-source-operating-budget-readiness.v1";

export const NHM2_TILE_SOURCE_EVIDENCE_GAP_ROADMAP_CONTRACT_VERSION =
  "nhm2_tile_source_evidence_gap_roadmap/v1";

export type Nhm2TileSourceEvidenceGapRoadmapItemV1 = {
  itemId: Nhm2LayerStackReceiptSurfaceId;
  priorityRank: number;
  status: "open" | "falsifying" | "satisfied";
  evidenceTier: string;
  evidenceRef: string | null;
  firstBlocker: string;
  decisionQuestion: string;
  requiredEvidence: string[];
  goCriteria: string[];
  noGoCriteria: string[];
  numericalMargins: Record<string, number | null>;
  operatingBudgetSurfaceId: Nhm2TileSourceOperatingBudgetSurfaceIdV1 | null;
  operatingBudgetReady: boolean | null;
  operatingBudgetFirstBlocker: string | null;
  operatingBudgetNumericalMargins: Record<string, number | boolean | null>;
  requiredCorrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
  decisiveMeasurements: Array<{
    measurementId: string;
    quantity: string;
    target: string;
    unit: string | null;
    evidenceArtifact: string;
    marginKey: string | null;
    currentMargin: number | boolean | null;
    requiredCorrectionKey: string | null;
    requiredCorrectionValue: Nhm2TileSourceOperatingBudgetCorrectionValueV1 | null;
    goCriterion: string;
    noGoCriterion: string;
    falsificationConsequence: string;
  }>;
  unlocks: string[];
  artifactToProduce: string;
};

export type Nhm2TileSourceEvidenceGapRoadmapV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_EVIDENCE_GAP_ROADMAP_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
    physicalValidationPlanRef: string | null;
    operatingBudgetReadinessRef: string | null;
  };
  roadmapItems: Nhm2TileSourceEvidenceGapRoadmapItemV1[];
  summary: {
    currentDisposition: "receipt_ready" | "review" | "falsified";
    nextBestItemId: Nhm2LayerStackReceiptSurfaceId | "none";
    openItemCount: number;
    falsifyingItemCount: number;
    satisfiedItemCount: number;
    materialEvidenceReady: boolean;
    fullApparatusTensorReady: boolean;
    operatingBudgetsReady: boolean | null;
    downstreamGatesPass: boolean | null;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    roadmapOnly: true;
    roadmapDoesNotSupplyEvidence: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    fullApparatusTensorRequired: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceEvidenceGapRoadmapInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  physicalValidationPlan?: Nhm2TileSourcePhysicalValidationPlanV1 | null;
  operatingBudgetReadiness?: Nhm2TileSourceOperatingBudgetReadinessV1 | null;
  materialEvidenceReceiptsRef?: string | null;
  physicalValidationPlanRef?: string | null;
  operatingBudgetReadinessRef?: string | null;
};

const ROADMAP_POLICY: Record<
  Nhm2LayerStackReceiptSurfaceId,
  {
    priorityRank: number;
    decisionQuestion: string;
    requiredEvidence: string[];
    goCriteria: string[];
    noGoCriteria: string[];
    decisiveMeasurements: Array<{
      measurementId: string;
      quantity: string;
      target: string;
      unit: string | null;
      evidenceArtifact: string;
      marginKey: string | null;
      requiredCorrectionKey: string | null;
      goCriterion: string;
      noGoCriterion: string;
      falsificationConsequence: string;
    }>;
    unlocks: string[];
    artifactToProduce: string;
  }
> = {
  material_coupon: {
    priorityRank: 1,
    decisionQuestion:
      "Can the ultra-high-stress TiN candidate stack carry the 447-layer support stress at cryogenic operating conditions?",
    requiredEvidence: [
      "447-layer load-case compatibility receipt",
      "cryogenic tensile/fracture coupon curve",
      "coupon fatigue/cycling receipt",
      "dielectric-response receipt",
      "conductivity receipt",
      "roughness and fabrication-tolerance coupon metrology",
    ],
    goCriteria: [
      "measured or validated evidence tier",
      "coupon provenance is tied to the frozen 447-layer 8 nm / 4 K / 15 GHz load case",
      "fracture/yield margin at least 2x support stress",
      "coupon fatigue cycle count meets the required campaign cycle count",
      "4 K coupon state supplied",
      "dielectric and conductivity references supplied",
    ],
    noGoCriteria: [
      "fracture/yield margin below 1",
      "candidate material mismatch",
      "coupon is not compatible with the selected 447-layer stack/load case",
      "coupon fatigue cycling fails the required campaign cycle count",
      "roughness or fabrication tolerance cannot support the 8 nm stack",
    ],
    decisiveMeasurements: [
      {
        measurementId: "coupon_stack_compatibility",
        quantity: "447-layer frozen load-case and stack compatibility",
        target: "2 compatibility refs: load case and layer stack",
        unit: "ref count",
        evidenceArtifact: "receipt://material_coupon/447_layer_load_case_compatibility_v1",
        marginKey: "campaignCompatibilityRefsAvailable",
        requiredCorrectionKey: "missingCampaignCompatibilityRefCount",
        goCriterion: "load-case and layer-stack compatibility refs are present",
        noGoCriterion: "coupon cannot be tied to the frozen 447-layer 8 nm / 4 K / 15 GHz load case",
        falsificationConsequence: "coupon evidence cannot stand in for the selected tile-source architecture",
      },
      {
        measurementId: "coupon_tensile_stress_margin",
        quantity: "cryogenic tensile stress against frozen support stress",
        target: "measured tensile stress >= 5.45707087858e8 Pa",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://material_coupon/tensile_stress_4k_v1",
        marginKey: "tensileStressMargin",
        requiredCorrectionKey: "tensileStressShortfallPa",
        goCriterion: "tensile stress margin >= 1 with 4 K curve provenance",
        noGoCriterion: "measured tensile stress below frozen support stress or curve missing",
        falsificationConsequence: "candidate stack cannot carry the frozen support-stress load path",
      },
      {
        measurementId: "coupon_fracture_yield_margin",
        quantity: "fracture or yield stress margin against 2x support stress",
        target: "fracture/yield stress >= 1.09141417572e9 Pa",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://material_coupon/fracture_yield_margin_v1",
        marginKey: "fractureOrYieldStressMargin",
        requiredCorrectionKey: "fractureOrYieldStressShortfallPa",
        goCriterion: "margin >= 1 with curve provenance tied to 4 K / 447-layer load case",
        noGoCriterion: "margin < 1 or fracture/yield curve missing",
        falsificationConsequence: "447-layer TiN support stack is mechanically inadmissible",
      },
      {
        measurementId: "coupon_fatigue_cycle_margin",
        quantity: "coupon fatigue cycles under cryogenic campaign load",
        target: "cycle count >= 1e9",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://material_coupon/fatigue_cycle_margin_v1",
        marginKey: "couponFatigueCycleMargin",
        requiredCorrectionKey: "couponCycleCountShortfall",
        goCriterion: "cycle margin >= 1 with fatigue curve provenance",
        noGoCriterion: "cycle margin < 1 or fatigue curve missing",
        falsificationConsequence: "candidate cannot survive the required switching/campaign lifetime",
      },
      {
        measurementId: "coupon_cryogenic_state",
        quantity: "cryogenic coupon state",
        target: "coupon material state characterized at <= 4 K",
        unit: "K",
        evidenceArtifact: "receipt://material_coupon/cryogenic_4k_state_v1",
        marginKey: "cryogenicTemperatureMargin",
        requiredCorrectionKey: "cryogenicTemperatureReductionK",
        goCriterion: "cryogenic temperature margin >= 1 with state and cycle provenance",
        noGoCriterion: "coupon state is missing or characterized above the 4 K operating target",
        falsificationConsequence: "material coupon cannot support the frozen cryogenic load case",
      },
      {
        measurementId: "coupon_dielectric_response",
        quantity: "dielectric response at 15 GHz and 4 K",
        target: "dielectric response ref and finite loss tangent at 15 GHz / 4 K",
        unit: null,
        evidenceArtifact: "receipt://material_coupon/dielectric_response_v1",
        marginKey: "dielectricResponseReceiptComplete",
        requiredCorrectionKey: "dielectricResponseReceiptComplete",
        goCriterion: "dielectric response ref includes finite numeric loss tangent at target frequency/temperature",
        noGoCriterion: "dielectric response missing, not numeric, or not tied to 15 GHz / 4 K",
        falsificationConsequence: "material receipt cannot support Lifshitz/source-tensor dielectric credibility",
      },
      {
        measurementId: "coupon_conductivity_response",
        quantity: "conductivity response at 15 GHz and 4 K",
        target: "conductivity ref and finite positive conductivity at 15 GHz / 4 K",
        unit: null,
        evidenceArtifact: "receipt://material_coupon/conductivity_v1",
        marginKey: "conductivityReceiptComplete",
        requiredCorrectionKey: "conductivityReceiptComplete",
        goCriterion: "conductivity response ref includes finite positive conductivity at target frequency/temperature",
        noGoCriterion: "conductivity response missing, non-positive, or not tied to 15 GHz / 4 K",
        falsificationConsequence: "material receipt cannot support Lifshitz/source-tensor conductivity credibility",
      },
      {
        measurementId: "coupon_roughness_rms",
        quantity: "coupon RMS roughness",
        target: "roughness RMS <= 1e-10 m",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://material_coupon/roughness_rms_v1",
        marginKey: "roughnessRmsMargin",
        requiredCorrectionKey: "roughnessRmsReductionMeters",
        goCriterion: "roughness RMS margin >= 1 with traceable surface-height map",
        noGoCriterion: "roughness RMS exceeds 0.1 nm or surface-height map is missing",
        falsificationConsequence: "candidate cannot enter 8 nm force-gap or roughness/asperity admission",
      },
      {
        measurementId: "coupon_fabrication_tolerance",
        quantity: "coupon fabrication tolerance",
        target: "fabrication tolerance <= 5e-10 m",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://material_coupon/fabrication_tolerance_v1",
        marginKey: "fabricationToleranceMargin",
        requiredCorrectionKey: "fabricationToleranceReductionMeters",
        goCriterion: "fabrication-tolerance margin >= 1 with spatial tolerance map",
        noGoCriterion: "fabrication tolerance exceeds 0.5 nm or tolerance map is missing",
        falsificationConsequence: "candidate cannot preserve the 8 nm operating-gap geometry",
      },
    ],
    unlocks: ["material_credibility", "full_apparatus_tensor"],
    artifactToProduce: "receipt://material_coupon/tin_447_layer_cryogenic_v1",
  },
  force_gap_pull_in: {
    priorityRank: 2,
    decisionQuestion:
      "Can the 8 nm gap operate without pull-in, stiction, or insufficient active gap-control authority?",
    requiredEvidence: [
      "8 nm gap metrology receipt",
      "F(g) force-gap curve",
      "dF/dg force-gradient curve",
      "curve bracket showing the supplied force sweep spans 8 nm",
      "effective spring constant",
      "pull-in sweep protocol",
      "stiction margin",
      "stiction protocol",
      "active gap-control authority protocol",
    ],
    goCriteria: [
      "force-gap curve brackets the 8 nm operating point",
      "pull-in margin at least 1",
      "stiction margin at least 1",
      "active authority at least 1.2x absolute Casimir force",
    ],
    noGoCriteria: [
      "force curve does not bracket 8 nm",
      "pull-in margin below 1",
      "stiction margin below 1",
      "active authority below 1.2x absolute Casimir force",
    ],
    decisiveMeasurements: [
      {
        measurementId: "gap_metrology_8nm",
        quantity: "8 nm gap metrology receipt",
        target: "gap metrology ref tied to 8e-9 m operating point",
        unit: "m",
        evidenceArtifact: "receipt://force_gap_pull_in/gap_metrology_8nm_v1",
        marginKey: "gapMetrologyRefAvailable",
        requiredCorrectionKey: null,
        goCriterion: "gap metrology receipt resolves the 8 nm operating point and uncertainty",
        noGoCriterion: "gap metrology is missing or not tied to the 8 nm operating point",
        falsificationConsequence: "force-gap and pull-in claims cannot be evaluated at the frozen gap",
      },
      {
        measurementId: "force_curve_brackets_8nm",
        quantity: "measured/simulated F(g) curve at the 8 nm operating point",
        target: "F(g) curve brackets 8e-9 m and absolute force matches the 447-layer load budget",
        unit: "N",
        evidenceArtifact: "receipt://force_gap_pull_in/force_gap_curve_8nm_v1",
        marginKey: "curveBracketsOperatingGap",
        requiredCorrectionKey: "suppliedForceDeltaFromIdealStackForceN",
        goCriterion: "curve brackets 8 nm and absolute force is consistent with the load budget",
        noGoCriterion: "8 nm lies outside the supplied force-gap curve or force magnitude is inconsistent",
        falsificationConsequence: "pull-in and force authority cannot be evaluated for the frozen gap",
      },
      {
        measurementId: "force_gradient_curve_8nm",
        quantity: "measured/simulated dF/dg force-gradient curve at 8 nm",
        target: "force-gradient consistency margin >= 0.75",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://force_gap_pull_in/force_gradient_8nm_v1",
        marginKey: "suppliedGradientConsistencyWithForceCurve",
        requiredCorrectionKey: "forceGradientConsistencyShortfall",
        goCriterion: "dF/dg curve is consistent with F(g) at 8 nm within the reduced-order tolerance",
        noGoCriterion: "dF/dg curve is missing or inconsistent with the force curve",
        falsificationConsequence: "pull-in and active-control stability cannot be evaluated from the force curve",
      },
      {
        measurementId: "stiffness_model_8nm",
        quantity: "effective spring constant at 8 nm",
        target: "effective stiffness >= ideal force-gradient requirement",
        unit: "N/m",
        evidenceArtifact: "receipt://force_gap_pull_in/stiffness_model_8nm_v1",
        marginKey: "pullInMarginToIdealGradient",
        requiredCorrectionKey: "springConstantShortfallNPerM",
        goCriterion: "effective stiffness model exceeds the ideal 8 nm force gradient",
        noGoCriterion: "stiffness model is missing or below the ideal 8 nm force gradient",
        falsificationConsequence: "447-layer stack lacks a mechanical stiffness basis for pull-in avoidance",
      },
      {
        measurementId: "pull_in_margin",
        quantity: "spring stiffness margin against Casimir force gradient",
        target: "pull-in margin >= 1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://force_gap_pull_in/pull_in_margin_8nm_v1",
        marginKey: "pullInMarginToIdealGradient",
        requiredCorrectionKey: "springConstantShortfallNPerM",
        goCriterion: "effective stiffness exceeds force gradient at 8 nm",
        noGoCriterion: "pull-in margin < 1",
        falsificationConsequence: "447-layer gap collapses or cannot be operated statically",
      },
      {
        measurementId: "stiction_margin",
        quantity: "stiction margin at the 8 nm operating point",
        target: "stiction margin >= 1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://force_gap_pull_in/stiction_margin_8nm_v1",
        marginKey: "stictionMarginToMinimum",
        requiredCorrectionKey: "stictionMarginShortfall",
        goCriterion: "stiction margin >= 1 with protocol provenance",
        noGoCriterion: "stiction margin < 1 or stiction protocol missing",
        falsificationConsequence: "447-layer stack cannot recover or remain separable at the 8 nm gap",
      },
      {
        measurementId: "active_gap_authority",
        quantity: "active gap-control authority against 447-layer load",
        target: "active authority >= 1.2x absolute stack load",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://force_gap_pull_in/active_authority_447_layer_v1",
        marginKey: "activeAuthorityMarginToIdealLoad",
        requiredCorrectionKey: "activeGapControlAuthorityShortfallN",
        goCriterion: "authority margin >= 1.2",
        noGoCriterion: "authority margin < 1.2 or actuator authority missing",
        falsificationConsequence: "active-control campaign cannot hold the 8 nm layered stack",
      },
    ],
    unlocks: ["active_control_energy", "covariant_conservation"],
    artifactToProduce: "receipt://force_gap_pull_in/8nm_447_layer_v1",
  },
  roughness_patch_metrology: {
    priorityRank: 3,
    decisionQuestion:
      "Do roughness tails, asperities, and patch potentials remain below the 8 nm operating-gap contamination budget?",
    requiredEvidence: [
      "RMS roughness metrology",
      "asperity p99 and max-tail map",
      "patch-voltage map",
      "residual electrostatic correction",
    ],
    goCriteria: [
      "roughness RMS no greater than 0.1 nm",
      "max asperity below half the 8 nm gap",
      "patch RMS no greater than 10 mV",
      "residual electrostatic force correction no greater than 5%",
    ],
    noGoCriteria: [
      "asperity tail exceeds half gap",
      "patch/electrostatic correction dominates the Casimir row",
      "roughness correction cannot be bounded",
    ],
    decisiveMeasurements: [
      {
        measurementId: "roughness_gap_metrology_8nm",
        quantity: "8 nm paired-surface gap metrology",
        target: "gap metrology ref tied to paired roughness/patch maps at 8e-9 m",
        unit: "m",
        evidenceArtifact: "receipt://roughness_patch_metrology/gap_metrology_8nm_v1",
        marginKey: "gapMetrologyRefAvailable",
        requiredCorrectionKey: null,
        goCriterion: "gap metrology ref is present and tied to the paired-surface map set",
        noGoCriterion: "gap metrology is missing or not registered to roughness/patch maps",
        falsificationConsequence: "surface-map statistics cannot be applied to the 8 nm operating gap",
      },
      {
        measurementId: "roughness_map_resolution",
        quantity: "roughness-map lateral resolution",
        target: "map lateral resolution <= 5e-10 m",
        unit: "m",
        evidenceArtifact: "receipt://roughness_patch_metrology/roughness_map_resolution_v1",
        marginKey: "roughnessMapResolutionMargin",
        requiredCorrectionKey: "roughnessMapResolutionReductionMeters",
        goCriterion: "map resolution is fine enough to resolve sub-nm roughness and asperity tails",
        noGoCriterion: "map resolution is too coarse to bound asperities at the 8 nm gap",
        falsificationConsequence: "roughness and asperity-tail evidence cannot support gap admission",
      },
      {
        measurementId: "roughness_scan_area",
        quantity: "roughness/patch scan-area coverage",
        target: "scan area coverage >= 0.95",
        unit: "dimensionless fraction",
        evidenceArtifact: "receipt://roughness_patch_metrology/scan_area_coverage_v1",
        marginKey: "scanAreaCoverageMargin",
        requiredCorrectionKey: "roughnessScanAreaFractionShortfall",
        goCriterion: "scan-area coverage margin >= 1 with paired-surface provenance",
        noGoCriterion: "scan-area coverage is too small to bound rare asperity/patch tails",
        falsificationConsequence: "localized high-risk surface regions may be hidden by undersampling",
      },
      {
        measurementId: "roughness_rms_margin",
        quantity: "paired-surface RMS roughness",
        target: "roughness RMS <= 1e-10 m",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://roughness_patch_metrology/roughness_rms_map_v1",
        marginKey: "roughnessRmsMargin",
        requiredCorrectionKey: "roughnessRmsReductionMeters",
        goCriterion: "RMS roughness margin >= 1 with map provenance",
        noGoCriterion: "RMS roughness exceeds 0.1 nm or map missing",
        falsificationConsequence: "8 nm Casimir gap is not a clean controllable surface pair",
      },
      {
        measurementId: "asperity_p99_tail",
        quantity: "asperity p99 height against 8 nm gap",
        target: "asperity p99 <= 2e-9 m",
        unit: "m",
        evidenceArtifact: "receipt://roughness_patch_metrology/asperity_p99_tail_v1",
        marginKey: "asperityP99Margin",
        requiredCorrectionKey: "asperityP99ReductionMeters",
        goCriterion: "p99 asperity margin >= 1 with tail-distribution provenance",
        noGoCriterion: "p99 asperity height exceeds 2 nm or distribution is missing",
        falsificationConsequence: "common asperity tails threaten 8 nm gap stability",
      },
      {
        measurementId: "asperity_p999_tail",
        quantity: "asperity p99.9 height against 8 nm gap",
        target: "asperity p99.9 <= 3e-9 m",
        unit: "m",
        evidenceArtifact: "receipt://roughness_patch_metrology/asperity_p999_tail_v1",
        marginKey: "asperityP999Margin",
        requiredCorrectionKey: "asperityP999ReductionMeters",
        goCriterion: "p99.9 asperity margin >= 1 with tail-fit provenance",
        noGoCriterion: "p99.9 asperity height exceeds 3 nm or tail fit is missing",
        falsificationConsequence: "rare asperity tails may dominate pull-in/stiction risk",
      },
      {
        measurementId: "asperity_tail_clearance",
        quantity: "asperity max clearance against 8 nm gap",
        target: "asperity max leaves required minimum gap clearance",
        unit: "m",
        evidenceArtifact: "receipt://roughness_patch_metrology/asperity_tail_map_v1",
        marginKey: "minimumGapClearanceMeters",
        requiredCorrectionKey: "gapClearanceShortfallMeters",
        goCriterion: "minimum clearance remains positive with tail-map provenance",
        noGoCriterion: "asperity tail consumes the required clearance",
        falsificationConsequence: "surface contact/stiction invalidates 8 nm stack operation",
      },
      {
        measurementId: "patch_voltage_rms",
        quantity: "patch-voltage RMS at the 8 nm surface pair",
        target: "patch voltage RMS <= 0.01 V",
        unit: "V",
        evidenceArtifact: "receipt://roughness_patch_metrology/patch_voltage_rms_v1",
        marginKey: "patchVoltageMargin",
        requiredCorrectionKey: "patchVoltageReductionVolts",
        goCriterion: "patch-voltage RMS margin >= 1 with voltage-map calibration",
        noGoCriterion: "patch-voltage RMS exceeds 10 mV or map/calibration is missing",
        falsificationConsequence: "electrostatic patch stresses contaminate the Casimir source row",
      },
      {
        measurementId: "patch_voltage_correlation_length",
        quantity: "patch-voltage spatial correlation length",
        target: "positive patch-potential correlation length tied to the voltage map",
        unit: "m",
        evidenceArtifact: "receipt://roughness_patch_metrology/patch_voltage_correlation_length_v1",
        marginKey: "patchVoltageCorrelationLengthAvailable",
        requiredCorrectionKey: "patchVoltageCorrelationLengthAvailable",
        goCriterion: "patch correlation length is positive and registered to the voltage/roughness maps",
        noGoCriterion: "patch correlation length is missing or not registered to the surface maps",
        falsificationConsequence: "patch-potential electrostatic force cannot be bounded from RMS voltage alone",
      },
      {
        measurementId: "patch_derived_electrostatic_fraction",
        quantity: "patch-voltage-derived electrostatic force fraction",
        target: "patch-derived electrostatic fraction <= 0.05",
        unit: "dimensionless fraction",
        evidenceArtifact: "receipt://roughness_patch_metrology/patch_derived_electrostatic_fraction_v1",
        marginKey: "patchVoltageDerivedElectrostaticMargin",
        requiredCorrectionKey: "patchVoltageDerivedElectrostaticFractionReduction",
        goCriterion: "patch-derived electrostatic fraction margin >= 1",
        noGoCriterion: "patch-derived electrostatic fraction exceeds 5% or is unbounded",
        falsificationConsequence: "patch potentials become a required full-apparatus T_munu term",
      },
      {
        measurementId: "patch_potential_force_fraction",
        quantity: "patch-potential electrostatic force fraction",
        target: "residual electrostatic force <= 5% of Casimir load",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://roughness_patch_metrology/patch_potential_force_v1",
        marginKey: "residualElectrostaticMargin",
        requiredCorrectionKey: "residualElectrostaticForceFractionReduction",
        goCriterion: "residual electrostatic margin >= 1",
        noGoCriterion: "patch/electrostatic correction exceeds 5% or is unbounded",
        falsificationConsequence: "source row is contaminated by electrostatic stress-energy",
      },
    ],
    unlocks: ["force_gap_pull_in", "full_apparatus_tensor"],
    artifactToProduce: "receipt://roughness_patch_metrology/8nm_surface_map_v1",
  },
  active_control_energy: {
    priorityRank: 4,
    decisionQuestion:
      "Can the active control layer hold the gap, timing, noise, and heat budget without becoming the dominant source tensor term?",
    requiredEvidence: [
      "actuator authority trace against the 447-layer force-gap load",
      "gap-sensor calibration at the 8 nm operating gap",
      "energy per control cycle",
      "control bandwidth",
      "controller stability margins",
      "gap-noise spectrum",
      "heat-load and heat-sink capacity receipt",
      "timing jitter receipt",
      "sector light-crossing synchronization receipt",
      "sector-boundary timing map",
      "phase-noise spectrum",
      "lock-acquisition trace",
      "failure-mode receipt",
    ],
    goCriteria: [
      "supplied actuator authority clears the 447-layer load",
      "bandwidth at least 2x switching rate",
      "controller phase/gain margins clear stability thresholds",
      "gap noise no greater than 1% of 8 nm",
      "timing jitter no greater than 0.1 cycle",
      "sector-boundary skew no greater than 0.1 cycle",
      "light-crossing sync margin at least 1",
      "phase noise no greater than 0.05 cycle",
      "finite heat-load, heat-sink capacity, and cycle-energy receipts",
    ],
    noGoCriteria: [
      "supplied actuator authority below 447-layer load",
      "gap-lock bandwidth below target",
      "controller stability margin below target",
      "gap noise exceeds 1% gap",
      "timing jitter exceeds 0.1 cycle",
      "sector-boundary skew exceeds 0.1 cycle",
      "light-crossing sync margin below 1",
      "phase noise exceeds 0.05 cycle",
      "control heat or field energy overwhelms source tensor",
    ],
    decisiveMeasurements: [
      {
        measurementId: "active_control_trace_refs",
        quantity: "active-control waveform, calibration, transfer, thermal, timing, sector-sync, and lock traces",
        target: "17 active-control trace refs",
        unit: "ref count",
        evidenceArtifact: "receipt://active_control/trace_refs_v1",
        marginKey: "activeControlTraceRefsAvailable",
        requiredCorrectionKey: "missingTraceRefCount",
        goCriterion: "all required active-control waveform, calibration, thermal, timing, sector-sync, and lock traces are present",
        noGoCriterion: "active-control scalar values are supplied without the required trace provenance",
        falsificationConsequence: "active-control receipts cannot support apparatus tensor or timing authority",
      },
      {
        measurementId: "switching_rate_sync",
        quantity: "active-control switching-rate synchronization",
        target: "switching rate = 15 GHz",
        unit: "Hz",
        evidenceArtifact: "receipt://active_control/switching_rate_sync_v1",
        marginKey: "activeControlTraceRefsAvailable",
        requiredCorrectionKey: "switchingRateAbsDeltaHz",
        goCriterion: "switching-rate trace is synchronized to 15 GHz",
        noGoCriterion: "switching-rate trace is missing or not synchronized to the campaign rate",
        falsificationConsequence: "time-dependent source cannot be phase-registered to the frozen campaign",
      },
      {
        measurementId: "active_control_bandwidth",
        quantity: "gap-control bandwidth",
        target: "bandwidth >= 30 GHz for 15 GHz switching",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://active_control/bandwidth_15ghz_switching_v1",
        marginKey: "bandwidthMargin",
        requiredCorrectionKey: "bandwidthShortfallHz",
        goCriterion: "bandwidth margin >= 1",
        noGoCriterion: "bandwidth below 30 GHz or trace missing",
        falsificationConsequence: "time-dependent source cannot be synchronized to the campaign",
      },
      {
        measurementId: "gap_control_authority",
        quantity: "active gap-control authority against 447-layer load",
        target: "gap-control authority clears the 447-layer load",
        unit: "N",
        evidenceArtifact: "receipt://active_control/gap_control_authority_v1",
        marginKey: "gapControlAuthorityMargin",
        requiredCorrectionKey: "gapControlAuthorityShortfallN",
        goCriterion: "actuator authority clears the 447-layer force-gap load with trace provenance",
        noGoCriterion: "actuator authority is missing or below the 447-layer load",
        falsificationConsequence: "controller cannot hold the 8 nm stack against the internal load",
      },
      {
        measurementId: "gap_noise_margin",
        quantity: "RMS gap noise",
        target: "gap noise RMS <= 8e-11 m",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://active_control/gap_noise_spectrum_v1",
        marginKey: "noiseMargin",
        requiredCorrectionKey: "gapNoiseRmsReductionMeters",
        goCriterion: "noise margin >= 1 with spectrum provenance",
        noGoCriterion: "gap noise exceeds 1% of the 8 nm gap",
        falsificationConsequence: "source modulation loses gap-defined tensor authority",
      },
      {
        measurementId: "timing_jitter_margin",
        quantity: "active-control timing jitter",
        target: "timing jitter <= 0.1 switching cycle",
        unit: "s",
        evidenceArtifact: "receipt://active_control/timing_jitter_v1",
        marginKey: "timingMargin",
        requiredCorrectionKey: "timingJitterReductionSeconds",
        goCriterion: "timing-jitter margin >= 1 with timing-sync trace provenance",
        noGoCriterion: "timing jitter exceeds 0.1 cycle or timing-sync trace is missing",
        falsificationConsequence: "sector switching cannot be synchronized to the intended source timing",
      },
      {
        measurementId: "sector_light_crossing_sync",
        quantity: "sector light-crossing and boundary timing synchronization",
        target: "sector-boundary skew <= 0.1 cycle and light-crossing sync margin >= 1",
        unit: "s_or_dimensionless_margin",
        evidenceArtifact: "receipt://active_control/sector_light_crossing_sync_v1",
        marginKey: "lightCrossingSyncMargin",
        requiredCorrectionKey: "lightCrossingSyncMarginShortfall",
        goCriterion: "sector light-crossing sync margin >= 1 and sector-boundary timing map is present",
        noGoCriterion: "sector light-crossing sync receipt is missing, boundary skew exceeds 0.1 cycle, or sync margin is below 1",
        falsificationConsequence:
          "distributed tile sectors cannot be phase-registered into a same-run time-dependent source tensor",
      },
      {
        measurementId: "phase_noise_margin",
        quantity: "active-control phase noise",
        target: "phase noise <= 0.05 switching cycle",
        unit: "s",
        evidenceArtifact: "receipt://active_control/phase_noise_v1",
        marginKey: "phaseNoiseMargin",
        requiredCorrectionKey: "phaseNoiseReductionSeconds",
        goCriterion: "phase-noise margin >= 1 with phase-noise spectrum provenance",
        noGoCriterion: "phase noise exceeds 0.05 cycle or spectrum is missing",
        falsificationConsequence: "sector timing cannot preserve the intended time-dependent source sequence",
      },
      {
        measurementId: "controller_phase_margin",
        quantity: "controller phase margin",
        target: "controller phase margin >= 45 degrees",
        unit: "degrees",
        evidenceArtifact: "receipt://active_control/controller_phase_margin_v1",
        marginKey: "controllerPhaseMargin",
        requiredCorrectionKey: "controllerPhaseMarginShortfallDegrees",
        goCriterion: "controller phase margin clears 45 degrees with stability receipt",
        noGoCriterion: "controller phase margin below 45 degrees or stability receipt missing",
        falsificationConsequence: "gap lock is dynamically unstable at the campaign operating point",
      },
      {
        measurementId: "controller_gain_margin",
        quantity: "controller gain margin",
        target: "controller gain margin >= 6 dB",
        unit: "dB",
        evidenceArtifact: "receipt://active_control/controller_gain_margin_v1",
        marginKey: "controllerGainMargin",
        requiredCorrectionKey: "controllerGainMarginShortfallDb",
        goCriterion: "controller gain margin clears 6 dB with stability receipt",
        noGoCriterion: "controller gain margin below 6 dB or stability receipt missing",
        falsificationConsequence: "gap lock cannot be treated as a stable active-control subsystem",
      },
      {
        measurementId: "active_control_heat_load",
        quantity: "active-control heat load",
        target: "heat load covers computed active-control power",
        unit: "W",
        evidenceArtifact: "receipt://active_control/heat_load_v1",
        marginKey: "thermalAccountingMargin",
        requiredCorrectionKey: "heatLoadShortfallW",
        goCriterion: "heat-load trace accounts for computed control power",
        noGoCriterion: "heat load is missing or below computed active-control power",
        falsificationConsequence: "thermal stress-energy term is unbounded in the apparatus tensor",
      },
      {
        measurementId: "active_control_source_tensor_contamination",
        quantity: "active-control source-tensor contamination fraction",
        target: "active-control fields/noise/sidebands contribute <= 5% of apparatus source tensor",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://active_control/source_tensor_contamination_v1",
        marginKey: "sourceTensorContaminationMargin",
        requiredCorrectionKey: "sourceTensorContaminationFractionReduction",
        goCriterion: "active-control source-tensor contamination margin >= 1 with model provenance",
        noGoCriterion: "active-control field/noise/thermal/timing sidebands exceed 5% or are unbounded",
        falsificationConsequence:
          "controller lock cannot be admitted into full-apparatus T_mu_nu without quantifying active-control stress-energy contamination",
      },
      {
        measurementId: "thermal_sink_capacity",
        quantity: "active-control heat sink capacity",
        target: "thermal sink capacity >= 1.2x active-control heat load",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://active_control/heat_load_sink_capacity_v1",
        marginKey: "thermalSinkCapacityMargin",
        requiredCorrectionKey: "heatSinkCapacityShortfallW",
        goCriterion: "thermal sink margin >= 1.2",
        noGoCriterion: "heat load cannot be removed or overwhelms the source tensor",
        falsificationConsequence: "thermal apparatus term invalidates the tile-source tensor candidate",
      },
      {
        measurementId: "energy_per_cycle_heat_limit",
        quantity: "active-control energy per cycle under heat limit",
        target: "energy per cycle below heat-limited maximum",
        unit: "J",
        evidenceArtifact: "receipt://active_control/energy_per_cycle_heat_limit_v1",
        marginKey: "controlPowerW",
        requiredCorrectionKey: "energyPerCycleReductionJ",
        goCriterion: "cycle energy remains within heat-limited operating budget",
        noGoCriterion: "cycle energy exceeds heat-limited maximum or waveform is missing",
        falsificationConsequence: "active-control power becomes incompatible with the thermal budget",
      },
      {
        measurementId: "failure_mode_coverage",
        quantity: "active-control failure-mode coverage",
        target: "5 failure modes covered",
        unit: "ref count",
        evidenceArtifact: "receipt://active_control/failure_mode_coverage_v1",
        marginKey: "failureModeCoverageComplete",
        requiredCorrectionKey: "missingFailureModeCount",
        goCriterion: "loss-of-lock, thermal runaway, noise runaway, timing desync, and fail-safe shutdown are covered",
        noGoCriterion: "failure-mode receipt is missing or required failure modes are not covered",
        falsificationConsequence: "active-control layer cannot be operated as a bounded experimental source",
      },
    ],
    unlocks: ["full_apparatus_tensor", "covariant_conservation"],
    artifactToProduce: "receipt://active_control/gap_lock_energy_noise_heat_v1",
  },
  fatigue_lifetime: {
    priorityRank: 5,
    decisionQuestion:
      "Does the 447-layer device survive the required cycling without fatigue, creep, drift, or thermal cycling failure?",
    requiredEvidence: [
      "load spectrum",
      "cryogenic fatigue curve",
      "cycle count to failure",
      "required cycle count",
      "creep/drift bound",
      "thermal cycling receipt",
      "delamination margin",
      "interlayer adhesion margin",
    ],
    goCriteria: [
      "cycle-count margin at least 1",
      "support-coupled fatigue path remains bounded",
      "delamination and interlayer adhesion margins at least 1",
    ],
    noGoCriteria: [
      "cycle-count margin below 1",
      "drift changes the 8 nm operating gap",
      "delamination or interlayer adhesion margin below 1",
    ],
    decisiveMeasurements: [
      {
        measurementId: "fatigue_provenance_refs",
        quantity: "fatigue load-spectrum, cycle, cryogenic, curve, thermal, creep, delamination, and adhesion refs",
        target: "8 fatigue provenance refs",
        unit: "ref count",
        evidenceArtifact: "receipt://fatigue_lifetime/provenance_refs_v1",
        marginKey: "fatigueProvenanceRefsAvailable",
        requiredCorrectionKey: "missingFatigueProvenanceRefCount",
        goCriterion: "all fatigue, drift, thermal, delamination, and adhesion provenance refs are present",
        noGoCriterion: "fatigue scalar margins are supplied without required protocol and curve provenance",
        falsificationConsequence: "fatigue/lifetime evidence cannot be tied to the frozen 447-layer campaign",
      },
      {
        measurementId: "fatigue_cycle_margin",
        quantity: "cycle-count margin under load spectrum",
        target: "cycle margin >= 1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://fatigue_lifetime/cycle_count_margin_v1",
        marginKey: "cycleMargin",
        requiredCorrectionKey: "cycleCountShortfall",
        goCriterion: "cycle margin >= 1 with load-spectrum provenance",
        noGoCriterion: "cycle margin < 1 or fatigue curve missing",
        falsificationConsequence: "device cannot survive the campaign duty history",
      },
      {
        measurementId: "thermal_cycle_drift",
        quantity: "thermal-cycle drift fraction",
        target: "thermal-cycle drift <= 0.01",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://fatigue_lifetime/thermal_cycle_drift_v1",
        marginKey: "thermalCycleDriftMargin",
        requiredCorrectionKey: "thermalCycleDriftReduction",
        goCriterion: "thermal-cycle drift margin >= 1",
        noGoCriterion: "thermal cycling changes the 8 nm operating gap beyond tolerance",
        falsificationConsequence: "layered gap geometry cannot remain frozen over campaign operation",
      },
      {
        measurementId: "creep_drift",
        quantity: "creep/drift fraction",
        target: "creep drift <= 0.01",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://fatigue_lifetime/creep_drift_v1",
        marginKey: "creepDriftMargin",
        requiredCorrectionKey: "creepDriftReduction",
        goCriterion: "creep/drift margin >= 1",
        noGoCriterion: "creep drift changes the 8 nm operating gap beyond tolerance",
        falsificationConsequence: "layered gap geometry cannot remain frozen over campaign operation",
      },
      {
        measurementId: "delamination_margin",
        quantity: "delamination margin",
        target: "delamination margin >= 1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://fatigue_lifetime/delamination_margin_v1",
        marginKey: "delaminationMargin",
        requiredCorrectionKey: "delaminationMarginShortfall",
        goCriterion: "delamination margin clears threshold",
        noGoCriterion: "delamination margin below 1",
        falsificationConsequence: "447-layer stack cannot be treated as a mechanically coherent source",
      },
      {
        measurementId: "interlayer_adhesion_margin",
        quantity: "interlayer adhesion margin",
        target: "interlayer adhesion margin >= 1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://fatigue_lifetime/interlayer_adhesion_margin_v1",
        marginKey: "interlayerAdhesionMargin",
        requiredCorrectionKey: "interlayerAdhesionMarginShortfall",
        goCriterion: "interlayer adhesion margin clears threshold",
        noGoCriterion: "interlayer adhesion margin below 1",
        falsificationConsequence: "447-layer stack cannot be treated as a mechanically coherent source",
      },
    ],
    unlocks: ["layer_scaling", "material_credibility"],
    artifactToProduce: "receipt://fatigue_lifetime/447_layer_cycle_life_v1",
  },
  layer_scaling: {
    priorityRank: 6,
    decisionQuestion:
      "Do 447 layers preserve enough active area and near-additive source behavior after support coupling is included?",
    requiredEvidence: [
      "layer scaling efficiency",
      "per-layer variation map",
      "nonadditivity bound",
      "active-area retention",
      "support-coupling status",
      "electromagnetic coupling loss map",
      "mechanical coupling loss map",
      "source tensor retention map",
    ],
    goCriteria: [
      "layer scaling efficiency at least 0.9",
      "per-layer variation no greater than 0.05",
      "nonadditivity fraction no greater than 0.1",
      "active-area retention at least 0.6",
      "support, electromagnetic, and mechanical coupling losses each no greater than 0.1",
      "source tensor retention at least 0.9",
      "support coupling passes",
    ],
    noGoCriteria: [
      "active area retention below target",
      "per-layer variation exceeds 5%",
      "nonadditivity exceeds 10%",
      "coupling loss exceeds 10%",
      "source tensor retention below 90%",
      "support coupling fails",
    ],
    decisiveMeasurements: [
      {
        measurementId: "layer_scaling_provenance_refs",
        quantity: "layer scaling, variation, nonadditivity, active-area, coupling, multiphysics, and retention refs",
        target: "9 layer-scaling provenance refs",
        unit: "ref count",
        evidenceArtifact: "receipt://layer_scaling/provenance_refs_v1",
        marginKey: "layerScalingProvenanceRefsAvailable",
        requiredCorrectionKey: "missingLayerScalingProvenanceRefCount",
        goCriterion: "all layer-scaling, variation, coupling, and retention refs are present",
        noGoCriterion: "layer scaling values are supplied without required maps and coupling provenance",
        falsificationConsequence: "447-layer additivity cannot be evaluated as a physical source architecture",
      },
      {
        measurementId: "layer_scaling_efficiency",
        quantity: "447-layer scaling efficiency",
        target: "scaling efficiency >= 0.9",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://layer_scaling/scaling_efficiency_v1",
        marginKey: "scalingMargin",
        requiredCorrectionKey: "layerScalingEfficiencyShortfall",
        goCriterion: "scaling margin >= 1",
        noGoCriterion: "layer scaling efficiency below 0.9",
        falsificationConsequence: "layer count cannot be converted into source strength",
      },
      {
        measurementId: "per_layer_variation",
        quantity: "per-layer variation fraction",
        target: "per-layer variation <= 0.05",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://layer_scaling/per_layer_variation_v1",
        marginKey: "perLayerVariationMargin",
        requiredCorrectionKey: "perLayerVariationReduction",
        goCriterion: "per-layer variation margin >= 1 with spatial map provenance",
        noGoCriterion: "per-layer variation exceeds 5% or map is missing",
        falsificationConsequence: "447-layer source cannot be treated as a controlled repeated unit",
      },
      {
        measurementId: "layer_nonadditivity",
        quantity: "layer nonadditivity fraction",
        target: "layer nonadditivity <= 0.1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://layer_scaling/nonadditivity_v1",
        marginKey: "nonadditivityMargin",
        requiredCorrectionKey: "layerNonadditivityReduction",
        goCriterion: "nonadditivity margin >= 1 with model provenance",
        noGoCriterion: "nonadditivity exceeds 10% or model is missing",
        falsificationConsequence: "447 layers cannot be assumed to scale from a single tile row",
      },
      {
        measurementId: "active_area_retention",
        quantity: "active Casimir area retained after supports/control routing",
        target: "active area retention >= 0.6",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://layer_scaling/active_area_retention_v1",
        marginKey: "activeAreaMargin",
        requiredCorrectionKey: "activeAreaRetentionShortfall",
        goCriterion: "active-area margin >= 1",
        noGoCriterion: "active area retention below 0.6",
        falsificationConsequence: "architecture cannot preserve enough active source area",
      },
      {
        measurementId: "support_coupling_status",
        quantity: "support coupling admission status",
        target: "support coupling status = pass",
        unit: "status",
        evidenceArtifact: "receipt://layer_scaling/support_coupling_status_v1",
        marginKey: "supportCouplingStatusSatisfied",
        requiredCorrectionKey: "supportCouplingStatusSatisfied",
        goCriterion: "support coupling status is pass with map provenance",
        noGoCriterion: "support coupling status is review, fail, missing, or unreceipted",
        falsificationConsequence: "support structure changes the tile source tensor instead of merely holding it",
      },
      {
        measurementId: "support_coupling_fraction",
        quantity: "support coupling fraction",
        target: "support coupling <= 0.1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://layer_scaling/support_coupling_fraction_v1",
        marginKey: "supportCouplingMargin",
        requiredCorrectionKey: "supportCouplingFractionReduction",
        goCriterion: "support coupling margin >= 1",
        noGoCriterion: "support coupling exceeds 10% or map is missing",
        falsificationConsequence: "supports become a dominant apparatus tensor term",
      },
      {
        measurementId: "electromagnetic_coupling_fraction",
        quantity: "electromagnetic cross-layer coupling fraction",
        target: "electromagnetic coupling <= 0.1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://layer_scaling/electromagnetic_coupling_fraction_v1",
        marginKey: "electromagneticCouplingMargin",
        requiredCorrectionKey: "electromagneticCouplingFractionReduction",
        goCriterion: "electromagnetic coupling margin >= 1",
        noGoCriterion: "electromagnetic cross-layer coupling exceeds 10% or map is missing",
        falsificationConsequence: "multi-layer electromagnetic coupling invalidates scalar layer additivity",
      },
      {
        measurementId: "mechanical_coupling_fraction",
        quantity: "mechanical cross-layer coupling fraction",
        target: "mechanical coupling <= 0.1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://layer_scaling/mechanical_coupling_fraction_v1",
        marginKey: "mechanicalCouplingMargin",
        requiredCorrectionKey: "mechanicalCouplingFractionReduction",
        goCriterion: "mechanical coupling margin >= 1",
        noGoCriterion: "mechanical cross-layer coupling exceeds 10% or map is missing",
        falsificationConsequence: "multi-layer mechanical coupling invalidates scalar layer additivity",
      },
      {
        measurementId: "effective_active_layer_count",
        quantity: "effective active layer count after scaling and area retention",
        target: "effective active layers >= 217.242",
        unit: "layers",
        evidenceArtifact: "receipt://layer_scaling/effective_active_layer_count_v1",
        marginKey: "effectiveActiveLayerCountMargin",
        requiredCorrectionKey: "effectiveActiveLayerCountShortfall",
        goCriterion: "effective active layer count clears the reduced-order minimum",
        noGoCriterion: "scaling, nonadditivity, or active-area loss leaves too few active layers",
        falsificationConsequence: "447-layer geometry cannot preserve enough active Casimir area",
      },
      {
        measurementId: "source_tensor_retention",
        quantity: "source tensor retention after layer/support coupling",
        target: "source tensor retention >= 0.9",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://layer_scaling/source_tensor_retention_v1",
        marginKey: "sourceTensorRetentionMargin",
        requiredCorrectionKey: "sourceTensorRetentionFractionShortfall",
        goCriterion: "source-tensor retention margin >= 1",
        noGoCriterion: "source tensor retention below 0.9",
        falsificationConsequence: "full apparatus tensor cannot inherit the scalar layer budget",
      },
      {
        measurementId: "effective_source_tensor_layer_count",
        quantity: "effective source tensor layer count after retention",
        target: "effective source tensor layers >= 402.3",
        unit: "layers",
        evidenceArtifact: "receipt://layer_scaling/effective_source_tensor_layer_count_v1",
        marginKey: "effectiveSourceTensorLayerCountMargin",
        requiredCorrectionKey: "effectiveSourceTensorLayerCountShortfall",
        goCriterion: "effective source tensor layer count clears the reduced-order minimum",
        noGoCriterion: "source tensor retention leaves too few effective source layers",
        falsificationConsequence: "full apparatus tensor cannot retain the intended 447-layer source strength",
      },
    ],
    unlocks: ["regional_residual_closure", "full_apparatus_tensor"],
    artifactToProduce: "receipt://layer_scaling/447_layer_nonadditivity_v1",
  },
  full_apparatus_tensor: {
    priorityRank: 7,
    decisionQuestion:
      "Can the complete apparatus emit source-side T00, T0i, diagonal Tij, and off-diagonal Tij without metric-target echo?",
    requiredEvidence: [
      "same-chart tensor authority",
      "same-basis and same-unit metadata",
      "T00/T0i/diagonal Tij/off-diagonal Tij component coverage",
      "support, spacer, control, thermal, electrostatic, fatigue, scaling, Casimir, and material-strain terms",
      "upstream material, force-gap, roughness/patch, active-control, and fatigue/layer-scaling receipt refs",
      "wall/hull/exterior regional coverage",
    ],
    goCriteria: [
      "all components present",
      "all apparatus terms present",
      "upstream subsystem receipt refs tied to apparatus tensor terms",
      "regional wall/hull/exterior coverage present",
      "no metric-target echo",
    ],
    noGoCriteria: [
      "missing T0i or off-diagonal Tij",
      "support/control/electrostatic/thermal terms hidden",
      "full-apparatus tensor terms asserted without upstream subsystem receipt refs",
      "metric-target echo detected or not checked",
    ],
    decisiveMeasurements: [
      {
        measurementId: "tensor_value_artifact",
        quantity: "source-side full apparatus tensor value artifact",
        target: "tensor value artifact contract present and typed",
        unit: "boolean",
        evidenceArtifact: "receipt://full_apparatus_tensor/tensor_value_artifact_v1",
        marginKey: "tensorValueArtifactAvailable",
        requiredCorrectionKey: "tensorValueArtifactAvailable",
        goCriterion: "tensor value artifact exists with nhm2_tile_source_full_apparatus_tensor_values/v1 contract",
        noGoCriterion: "full apparatus tensor is asserted without a typed tensor-value artifact",
        falsificationConsequence: "source-side same-basis authority has no tensor object to consume",
      },
      {
        measurementId: "tensor_authority_metadata",
        quantity: "same-chart, same-basis, same-unit, no-target-echo metadata",
        target: "4 authority metadata fields complete",
        unit: "metadata count",
        evidenceArtifact: "receipt://full_apparatus_tensor/authority_metadata_v1",
        marginKey: "authorityMetadataComplete",
        requiredCorrectionKey: "authorityMetadataMissingCount",
        goCriterion: "same chart, same basis, same units, and no metric-target echo are all receipted",
        noGoCriterion: "authority metadata is missing or metric-target echo is unchecked",
        falsificationConsequence: "source tensor cannot be compared to the metric-required tensor",
      },
      {
        measurementId: "component_group_coverage",
        quantity: "source-side tensor component-group coverage",
        target: "4 groups: T00, T0i, diagonal Tij, off-diagonal Tij",
        unit: "group count",
        evidenceArtifact: "receipt://full_apparatus_tensor/component_groups_v1",
        marginKey: "fullTensorCoverageComplete",
        requiredCorrectionKey: "componentGroupMissingCount",
        goCriterion: "all component groups are present and non-proxy",
        noGoCriterion: "T0i, diagonal Tij, or off-diagonal Tij group is missing",
        falsificationConsequence: "full tensor closure cannot be claimed from scalar or diagonal-only evidence",
      },
      {
        measurementId: "component_group_refs",
        quantity: "source-side tensor component-group provenance refs",
        target: "4 component group refs",
        unit: "ref count",
        evidenceArtifact: "receipt://full_apparatus_tensor/component_group_refs_v1",
        marginKey: "componentRefsComplete",
        requiredCorrectionKey: "componentGroupRefMissingCount",
        goCriterion: "T00, T0i, diagonal Tij, and off-diagonal Tij group refs are present",
        noGoCriterion: "component groups are boolean-only or lack provenance refs",
        falsificationConsequence: "component authority ledger cannot distinguish source evidence from placeholders",
      },
      {
        measurementId: "tensor_component_detail_refs",
        quantity: "source-side full tensor component coverage",
        target: "10 component refs covering T00, T0i, diagonal Tij, off-diagonal Tij",
        unit: "coverage fraction",
        evidenceArtifact: "receipt://full_apparatus_tensor/component_detail_refs_v1",
        marginKey: "componentDetailRefsComplete",
        requiredCorrectionKey: "tensorComponentRefMissingCount",
        goCriterion: "component coverage fraction = 1",
        noGoCriterion: "any required component missing, scalar-proxy, or silently zeroed",
        falsificationConsequence: "source-side same-basis tensor authority cannot pass",
      },
      {
        measurementId: "apparatus_stress_energy_term_coverage",
        quantity: "apparatus stress-energy term boolean coverage",
        target: "9 terms: Casimir, support, spacer, electrostatic, active-control, thermal, strain, fatigue, layer-scaling",
        unit: "term count",
        evidenceArtifact: "receipt://full_apparatus_tensor/stress_energy_term_coverage_v1",
        marginKey: "requiredStressEnergyTermsComplete",
        requiredCorrectionKey: "stressEnergyTermMissingCount",
        goCriterion: "all required apparatus stress-energy terms are included in the tensor model",
        noGoCriterion: "support/control/electrostatic/thermal/material terms are omitted",
        falsificationConsequence: "apparatus tensor hides non-Casimir stress-energy and cannot represent the source",
      },
      {
        measurementId: "apparatus_stress_energy_term_refs",
        quantity: "apparatus stress-energy term coverage",
        target: "9 term refs: Casimir, support, spacer, electrostatic, active-control, thermal, strain, fatigue, layer-scaling",
        unit: "coverage fraction",
        evidenceArtifact: "receipt://full_apparatus_tensor/stress_energy_terms_v1",
        marginKey: "termRefsComplete",
        requiredCorrectionKey: "stressEnergyTermRefMissingCount",
        goCriterion: "term coverage fraction = 1",
        noGoCriterion: "support/control/electrostatic/thermal/material terms hidden",
        falsificationConsequence: "apparatus tensor is incomplete and cannot represent the real tile source",
      },
      {
        measurementId: "subsystem_receipt_traceability",
        quantity: "upstream subsystem receipt refs for full-apparatus tensor terms",
        target:
          "material coupon, force-gap, roughness/patch, active-control, and fatigue/layer-scaling refs complete",
        unit: "ref count",
        evidenceArtifact: "receipt://full_apparatus_tensor/subsystem_receipt_traceability_v1",
        marginKey: "subsystemReceiptRefsComplete",
        requiredCorrectionKey: "subsystemReceiptRefMissingCount",
        goCriterion: "all five upstream subsystem receipt refs are present and tied to the tensor terms",
        noGoCriterion: "full-apparatus tensor terms are asserted without upstream experimental receipt refs",
        falsificationConsequence:
          "full-apparatus tensor cannot be admitted as material-source evidence independent of its subsystem receipts",
      },
      {
        measurementId: "regional_tensor_coverage",
        quantity: "wall/hull/exterior regional tensor coverage",
        target: "wall, hull, and exterior_shell regions complete",
        unit: "region count",
        evidenceArtifact: "receipt://full_apparatus_tensor/regional_coverage_v1",
        marginKey: "requiredRegionalCoverageComplete",
        requiredCorrectionKey: "regionCoverageMissingCount",
        goCriterion: "wall, hull, and exterior-shell tensor regions are present",
        noGoCriterion: "regional tensor coverage is missing or not same-run",
        falsificationConsequence: "regional residual closure cannot evaluate the source tensor by region",
      },
      {
        measurementId: "regional_support_refs",
        quantity: "wall/hull/exterior regional tensor support coverage",
        target: "wall, hull, and exterior_shell support refs complete",
        unit: "coverage fraction",
        evidenceArtifact: "receipt://full_apparatus_tensor/regional_supports_v1",
        marginKey: "regionalSupportRefsComplete",
        requiredCorrectionKey: "regionalSupportRefMissingCount",
        goCriterion: "regional coverage fraction = 1 with same atlas/support basis",
        noGoCriterion: "regional supports missing or not same-basis",
        falsificationConsequence: "regional residual closure cannot consume the source tensor",
      },
      {
        measurementId: "regional_tensor_sample_counts",
        quantity: "wall/hull/exterior regional tensor sampling support",
        target: ">= 447 tensor samples in each closure region for the frozen 447-layer candidate",
        unit: "sample count",
        evidenceArtifact: "receipt://full_apparatus_tensor/regional_sample_counts_v1",
        marginKey: "regionalSampleCountsMeetMinimum",
        requiredCorrectionKey: "regionalSampleCountBelowMinimumCount",
        goCriterion: "wall, hull, and exterior-shell tensor regions each have at least 447 samples",
        noGoCriterion: "any closure region has fewer than 447 tensor samples",
        falsificationConsequence:
          "regional residual, conservation, QEI, and observer gates cannot trust the source tensor sampling support",
      },
    ],
    unlocks: [
      "source_side_same_basis_authority",
      "covariant_conservation",
      "qei_worldline_dossier",
      "observer_family_energy_conditions",
      "coupled_closure",
    ],
    artifactToProduce: "receipt://full_apparatus_tensor/source_side_Tmunu_v1",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const itemStatus = (surface: Nhm2TileSourceReceiptSurfaceStatusV1): "open" | "falsifying" | "satisfied" => {
  if (surface.status === "pass") return "satisfied";
  if (surface.status === "fail") return "falsifying";
  return "open";
};

const budgetSurfaceFromReceiptSurface = (
  surfaceId: Nhm2LayerStackReceiptSurfaceId,
): Nhm2TileSourceOperatingBudgetSurfaceIdV1 => {
  switch (surfaceId) {
    case "force_gap_pull_in":
      return "force_gap_load";
    case "roughness_patch_metrology":
      return "roughness_patch";
    case "active_control_energy":
      return "active_control";
    case "fatigue_lifetime":
    case "layer_scaling":
      return "fatigue_layer_scaling";
    default:
      return surfaceId;
  }
};

const roadmapStatus = (
  surface: Nhm2TileSourceReceiptSurfaceStatusV1,
  budgetStatus:
    | NonNullable<Nhm2TileSourceOperatingBudgetReadinessV1["budgetStatuses"][number]>
    | null,
): "open" | "falsifying" | "satisfied" => {
  const receiptStatus = itemStatus(surface);
  if (receiptStatus === "falsifying" || budgetStatus?.falsifiesCurrentCandidate === true) {
    return "falsifying";
  }
  if (receiptStatus === "satisfied" && budgetStatus?.ready === false) {
    return "open";
  }
  return receiptStatus;
};

const decisiveMeasurementsForItem = (
  policy: (typeof ROADMAP_POLICY)[Nhm2LayerStackReceiptSurfaceId],
  surface: Nhm2TileSourceReceiptSurfaceStatusV1,
  budgetStatus:
    | NonNullable<Nhm2TileSourceOperatingBudgetReadinessV1["budgetStatuses"][number]>
    | null,
): Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"] =>
  policy.decisiveMeasurements.map((measurement) => {
    const currentMargin =
      (measurement.marginKey == null
        ? null
        : budgetStatus?.numericalMargins[measurement.marginKey] ??
          surface.numericalMargins[measurement.marginKey]) ?? null;
    const requiredCorrectionValue =
      (measurement.requiredCorrectionKey == null
        ? null
        : budgetStatus?.requiredCorrections[measurement.requiredCorrectionKey]) ?? null;
    return {
      ...measurement,
      currentMargin,
      requiredCorrectionValue,
    };
  });

export const buildNhm2TileSourceEvidenceGapRoadmap = (
  input: BuildNhm2TileSourceEvidenceGapRoadmapInput,
): Nhm2TileSourceEvidenceGapRoadmapV1 => {
  const materialEvidence = input.materialEvidenceReceipts;
  const operatingBudgetReadiness = input.operatingBudgetReadiness ?? null;
  const roadmapItems = materialEvidence.receiptSurfaces
    .map((surface) => {
      const policy = ROADMAP_POLICY[surface.surfaceId];
      const budgetSurfaceId = budgetSurfaceFromReceiptSurface(surface.surfaceId);
      const budgetStatus =
        operatingBudgetReadiness?.budgetStatuses.find(
          (status) => status.surfaceId === budgetSurfaceId,
        ) ?? null;
      return {
        itemId: surface.surfaceId,
        priorityRank: policy.priorityRank,
        status: roadmapStatus(surface, budgetStatus),
        evidenceTier: surface.evidenceTier,
        evidenceRef: surface.evidenceRef,
        firstBlocker: surface.blockers[0] ?? budgetStatus?.firstBlocker ?? "none",
        decisionQuestion: policy.decisionQuestion,
        requiredEvidence: policy.requiredEvidence,
        goCriteria: policy.goCriteria,
        noGoCriteria: policy.noGoCriteria,
        numericalMargins: surface.numericalMargins,
        operatingBudgetSurfaceId: budgetSurfaceId,
        operatingBudgetReady: budgetStatus?.ready ?? null,
        operatingBudgetFirstBlocker: budgetStatus?.firstBlocker ?? null,
        operatingBudgetNumericalMargins: budgetStatus?.numericalMargins ?? {},
        requiredCorrections: budgetStatus?.requiredCorrections ?? {},
        decisiveMeasurements: decisiveMeasurementsForItem(policy, surface, budgetStatus),
        unlocks: policy.unlocks,
        artifactToProduce: policy.artifactToProduce,
      };
    })
    .sort((a, b) => a.priorityRank - b.priorityRank);
  const openItems = roadmapItems.filter((item) => item.status === "open");
  const falsifyingItems = roadmapItems.filter((item) => item.status === "falsifying");
  const satisfiedItems = roadmapItems.filter((item) => item.status === "satisfied");
  const nextItem = falsifyingItems[0] ?? openItems[0] ?? null;
  return {
    contractVersion: NHM2_TILE_SOURCE_EVIDENCE_GAP_ROADMAP_CONTRACT_VERSION,
    generatedAt: materialEvidence.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: materialEvidence.selectedProfileId,
    frozenCandidateId: materialEvidence.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
      physicalValidationPlanRef: input.physicalValidationPlanRef ?? null,
      operatingBudgetReadinessRef: input.operatingBudgetReadinessRef ?? null,
    },
    roadmapItems,
    summary: {
      currentDisposition: materialEvidence.summary.candidateDisposition,
      nextBestItemId: nextItem?.itemId ?? "none",
      openItemCount: openItems.length,
      falsifyingItemCount: falsifyingItems.length,
      satisfiedItemCount: satisfiedItems.length,
      materialEvidenceReady: materialEvidence.summary.materialEvidenceReady,
      fullApparatusTensorReady: materialEvidence.summary.fullApparatusTensorReady,
      operatingBudgetsReady: operatingBudgetReadiness?.summary.allOperatingBudgetsReady ?? null,
      downstreamGatesPass: input.physicalValidationPlan?.summary.downstreamGatesPass ?? null,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      roadmapOnly: true,
      roadmapDoesNotSupplyEvidence: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      fullApparatusTensorRequired: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceEvidenceGapRoadmap = (
  value: unknown,
): value is Nhm2TileSourceEvidenceGapRoadmapV1 => {
  if (!isRecord(value)) return false;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_EVIDENCE_GAP_ROADMAP_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    Array.isArray(value.roadmapItems) &&
    value.roadmapItems.length === 7 &&
    value.roadmapItems.every(
      (item) =>
        isRecord(item) &&
        typeof item.itemId === "string" &&
        typeof item.priorityRank === "number" &&
        ["open", "falsifying", "satisfied"].includes(String(item.status)) &&
        typeof item.evidenceTier === "string" &&
        (item.evidenceRef === null || typeof item.evidenceRef === "string") &&
        typeof item.firstBlocker === "string" &&
        typeof item.decisionQuestion === "string" &&
        Array.isArray(item.requiredEvidence) &&
        Array.isArray(item.goCriteria) &&
        Array.isArray(item.noGoCriteria) &&
        isRecord(item.numericalMargins) &&
        (item.operatingBudgetSurfaceId === null ||
          typeof item.operatingBudgetSurfaceId === "string") &&
        (item.operatingBudgetReady === null || typeof item.operatingBudgetReady === "boolean") &&
        (item.operatingBudgetFirstBlocker === null ||
          typeof item.operatingBudgetFirstBlocker === "string") &&
        isRecord(item.operatingBudgetNumericalMargins) &&
        Object.values(item.operatingBudgetNumericalMargins).every(
          (entry) =>
            entry === null ||
            typeof entry === "boolean" ||
            (typeof entry === "number" && Number.isFinite(entry)),
        ) &&
        isRecord(item.requiredCorrections) &&
        Object.values(item.requiredCorrections).every(
          (entry) =>
            entry === null ||
            typeof entry === "string" ||
            typeof entry === "boolean" ||
            (typeof entry === "number" && Number.isFinite(entry)) ||
            (Array.isArray(entry) && entry.every((value) => typeof value === "string")),
        ) &&
        Array.isArray(item.decisiveMeasurements) &&
        item.decisiveMeasurements.length > 0 &&
        item.decisiveMeasurements.every(
          (measurement) =>
            isRecord(measurement) &&
            typeof measurement.measurementId === "string" &&
            typeof measurement.quantity === "string" &&
            typeof measurement.target === "string" &&
            (measurement.unit === null || typeof measurement.unit === "string") &&
            typeof measurement.evidenceArtifact === "string" &&
            (measurement.marginKey === null || typeof measurement.marginKey === "string") &&
            (measurement.currentMargin === null ||
              typeof measurement.currentMargin === "boolean" ||
              (typeof measurement.currentMargin === "number" &&
                Number.isFinite(measurement.currentMargin))) &&
            (measurement.requiredCorrectionKey === null ||
              typeof measurement.requiredCorrectionKey === "string") &&
            (measurement.requiredCorrectionValue === null ||
              typeof measurement.requiredCorrectionValue === "string" ||
              typeof measurement.requiredCorrectionValue === "boolean" ||
              (typeof measurement.requiredCorrectionValue === "number" &&
                Number.isFinite(measurement.requiredCorrectionValue)) ||
              (Array.isArray(measurement.requiredCorrectionValue) &&
                measurement.requiredCorrectionValue.every((value) => typeof value === "string"))) &&
            typeof measurement.goCriterion === "string" &&
            typeof measurement.noGoCriterion === "string" &&
            typeof measurement.falsificationConsequence === "string",
        ) &&
        Array.isArray(item.unlocks) &&
        typeof item.artifactToProduce === "string",
    ) &&
    summary != null &&
    typeof summary.currentDisposition === "string" &&
    typeof summary.nextBestItemId === "string" &&
    typeof summary.openItemCount === "number" &&
    typeof summary.falsifyingItemCount === "number" &&
    typeof summary.satisfiedItemCount === "number" &&
    typeof summary.materialEvidenceReady === "boolean" &&
    typeof summary.fullApparatusTensorReady === "boolean" &&
    (summary.operatingBudgetsReady === null || typeof summary.operatingBudgetsReady === "boolean") &&
    (summary.downstreamGatesPass === null || typeof summary.downstreamGatesPass === "boolean") &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.roadmapOnly === true &&
    boundary.roadmapDoesNotSupplyEvidence === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.fullApparatusTensorRequired === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
