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
        measurementId: "coupon_material_response",
        quantity: "dielectric and conductivity response at 15 GHz and 4 K",
        target: "numeric dielectric and conductivity values with refs at 15 GHz / 4 K",
        unit: null,
        evidenceArtifact: "receipt://material_coupon/material_response_15ghz_4k_v1",
        marginKey: "materialResponseValuesAvailable",
        requiredCorrectionKey: "materialResponseNumericValuesAvailable",
        goCriterion: "dielectric and conductivity response refs include numeric values at target frequency/temperature",
        noGoCriterion: "material response missing or not tied to 15 GHz / 4 K",
        falsificationConsequence: "material receipt cannot support Lifshitz/source-tensor credibility",
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
        measurementId: "force_curve_brackets_8nm",
        quantity: "measured/simulated F(g) curve brackets the 8 nm operating point",
        target: "force curve domain includes 8e-9 m",
        unit: null,
        evidenceArtifact: "receipt://force_gap_pull_in/force_gap_curve_8nm_v1",
        marginKey: "curveBracketsOperatingGap",
        requiredCorrectionKey: null,
        goCriterion: "curve brackets 8 nm and includes force/gradient provenance",
        noGoCriterion: "8 nm lies outside the supplied force-gap curve",
        falsificationConsequence: "pull-in and force authority cannot be evaluated for the frozen gap",
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
      "phase noise no greater than 0.05 cycle",
      "finite heat-load, heat-sink capacity, and cycle-energy receipts",
    ],
    noGoCriteria: [
      "supplied actuator authority below 447-layer load",
      "gap-lock bandwidth below target",
      "controller stability margin below target",
      "gap noise exceeds 1% gap",
      "timing jitter exceeds 0.1 cycle",
      "phase noise exceeds 0.05 cycle",
      "control heat or field energy overwhelms source tensor",
    ],
    decisiveMeasurements: [
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
        measurementId: "thermal_creep_drift",
        quantity: "thermal-cycle and creep/drift fraction",
        target: "thermal and creep drift <= 0.01",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://fatigue_lifetime/thermal_creep_drift_v1",
        marginKey: "thermalCycleDriftMargin",
        requiredCorrectionKey: "thermalCycleDriftReduction",
        goCriterion: "thermal-cycle and creep margins >= 1",
        noGoCriterion: "drift changes the 8 nm operating gap beyond tolerance",
        falsificationConsequence: "layered gap geometry cannot remain frozen over campaign operation",
      },
      {
        measurementId: "delamination_adhesion_margin",
        quantity: "delamination and interlayer adhesion margins",
        target: "each margin >= 1",
        unit: "dimensionless margin",
        evidenceArtifact: "receipt://fatigue_lifetime/delamination_adhesion_v1",
        marginKey: "delaminationMargin",
        requiredCorrectionKey: "delaminationMarginShortfall",
        goCriterion: "delamination and adhesion margins clear threshold",
        noGoCriterion: "delamination or adhesion margin below 1",
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
      "wall/hull/exterior regional coverage",
    ],
    goCriteria: [
      "all components present",
      "all apparatus terms present",
      "regional wall/hull/exterior coverage present",
      "no metric-target echo",
    ],
    noGoCriteria: [
      "missing T0i or off-diagonal Tij",
      "support/control/electrostatic/thermal terms hidden",
      "metric-target echo detected or not checked",
    ],
    decisiveMeasurements: [
      {
        measurementId: "tensor_component_coverage",
        quantity: "source-side full tensor component coverage",
        target: "10 component refs covering T00, T0i, diagonal Tij, off-diagonal Tij",
        unit: "coverage fraction",
        evidenceArtifact: "receipt://full_apparatus_tensor/component_detail_refs_v1",
        marginKey: "componentCoverageFraction",
        requiredCorrectionKey: "tensorComponentRefMissingCount",
        goCriterion: "component coverage fraction = 1",
        noGoCriterion: "any required component missing, scalar-proxy, or silently zeroed",
        falsificationConsequence: "source-side same-basis tensor authority cannot pass",
      },
      {
        measurementId: "apparatus_stress_energy_terms",
        quantity: "apparatus stress-energy term coverage",
        target: "9 term refs: Casimir, support, spacer, electrostatic, active-control, thermal, strain, fatigue, layer-scaling",
        unit: "coverage fraction",
        evidenceArtifact: "receipt://full_apparatus_tensor/stress_energy_terms_v1",
        marginKey: "termCoverageFraction",
        requiredCorrectionKey: "stressEnergyTermRefMissingCount",
        goCriterion: "term coverage fraction = 1",
        noGoCriterion: "support/control/electrostatic/thermal/material terms hidden",
        falsificationConsequence: "apparatus tensor is incomplete and cannot represent the real tile source",
      },
      {
        measurementId: "regional_support_coverage",
        quantity: "wall/hull/exterior regional tensor support coverage",
        target: "wall, hull, and exterior_shell support refs complete",
        unit: "coverage fraction",
        evidenceArtifact: "receipt://full_apparatus_tensor/regional_supports_v1",
        marginKey: "regionalCoverageFraction",
        requiredCorrectionKey: "regionalSupportRefMissingCount",
        goCriterion: "regional coverage fraction = 1 with same atlas/support basis",
        noGoCriterion: "regional supports missing or not same-basis",
        falsificationConsequence: "regional residual closure cannot consume the source tensor",
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
