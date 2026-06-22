import {
  buildNhm2ExperimentParameterTargets,
  type BuildNhm2ExperimentParameterTargetsInput,
} from "./nhm2-experiment-parameter-targets.v1";
import type { Nhm2ExperimentFacingStageId } from "./nhm2-experiment-facing-theory-roadmap.v1";

export const NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER_CONTRACT_VERSION =
  "nhm2_experiment_research_gap_ledger/v1";

export const NHM2_EXPERIMENT_RESEARCH_GAP_CLASSES = [
  "parameter_regime",
  "system_integration",
  "missing_observable",
  "theory_to_measurement",
  "replication",
  "no_gap_found",
] as const;

export const NHM2_EXPERIMENT_RESEARCH_LITERATURE_STATUSES = [
  "direct_precedent",
  "adjacent_precedent",
  "no_direct_precedent_found",
  "candidate_novel",
  "systematic_review_needed",
] as const;

export const NHM2_EXPERIMENT_CLAIM_IMPACTS = [
  "none",
  "supporting",
  "necessary",
  "decisive",
] as const;

export const NHM2_EXPERIMENT_INFORMATION_GAINS = ["low", "medium", "high"] as const;

export const NHM2_EXPERIMENT_READINESS_LEVELS = [
  "theory",
  "simulation",
  "bench",
  "pathfinder",
  "facility",
] as const;

export const NHM2_EXPERIMENT_RESEARCH_GAP_PRIORITIES = ["P0", "P1", "P2"] as const;

export type Nhm2ExperimentResearchGapClass =
  (typeof NHM2_EXPERIMENT_RESEARCH_GAP_CLASSES)[number];
export type Nhm2ExperimentResearchLiteratureStatus =
  (typeof NHM2_EXPERIMENT_RESEARCH_LITERATURE_STATUSES)[number];
export type Nhm2ExperimentClaimImpact =
  (typeof NHM2_EXPERIMENT_CLAIM_IMPACTS)[number];
export type Nhm2ExperimentInformationGain =
  (typeof NHM2_EXPERIMENT_INFORMATION_GAINS)[number];
export type Nhm2ExperimentReadinessLevel =
  (typeof NHM2_EXPERIMENT_READINESS_LEVELS)[number];
export type Nhm2ExperimentResearchGapPriority =
  (typeof NHM2_EXPERIMENT_RESEARCH_GAP_PRIORITIES)[number];

export type Nhm2ExperimentNearestPrecedentV1 = {
  citationId: string;
  coveredParameters: string[];
  uncoveredParameters: string[];
};

export type Nhm2ExperimentResearchSearchReceiptV1 = {
  cutoffDate: "2026-06-21";
  databases: string[];
  querySetHash: string;
  queries: string[];
  inclusionCriteria: string[];
  exclusionCriteria: string[];
};

export type Nhm2ExperimentResearchGapClaimBoundaryV1 = {
  diagnosticOnly: true;
  researchGapOnly: true;
  noNoveltyClaimWithoutSearchReceipt: true;
  literatureDoesNotValidateNHM2: true;
  nullResultsAreFalsificationEvidence: true;
  physicalViabilityClaimAllowed: false;
  transportClaimAllowed: false;
  routeEtaClaimAllowed: false;
  propulsionClaimAllowed: false;
  speedAuthorityClaimAllowed: false;
};

export type Nhm2ExperimentResearchGapRowV1 = {
  targetId: string;
  stageId: Nhm2ExperimentFacingStageId;
  scientificQuestion: string;
  gapClass: Nhm2ExperimentResearchGapClass;
  literatureStatus: Nhm2ExperimentResearchLiteratureStatus;
  nearestPrecedents: Nhm2ExperimentNearestPrecedentV1[];
  searchReceipt: Nhm2ExperimentResearchSearchReceiptV1;
  dominantSystematic: string;
  earliestFalsifier: string;
  nullResultMeaning: string;
  claimImpact: {
    physicalViability: Nhm2ExperimentClaimImpact;
    transport: Nhm2ExperimentClaimImpact;
  };
  expectedInformationGain: Nhm2ExperimentInformationGain;
  experimentalReadiness: Nhm2ExperimentReadinessLevel;
  nextAction: string;
  priority: Nhm2ExperimentResearchGapPriority;
  claimBoundary: Nhm2ExperimentResearchGapClaimBoundaryV1;
};

export type Nhm2ExperimentResearchGapLedgerV1 = {
  contractVersion: typeof NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  parameterTargetsRef: "nhm2_experiment_parameter_targets/v1";
  rows: Nhm2ExperimentResearchGapRowV1[];
  summary: {
    rowCount: number;
    mappedTargetCount: number;
    p0TargetIds: string[];
    highInformationTargetIds: string[];
    noDirectPrecedentTargetIds: string[];
    firstNextAction: string;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    researchGapLedgerOnly: true;
    literaturePrecedentsAreContextNotValidation: true;
    noDirectPrecedentIsNotNoveltyClaim: true;
    nullResultsMustRemainStageEvidence: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

type GapSeed = Omit<
  Nhm2ExperimentResearchGapRowV1,
  "targetId" | "stageId" | "searchReceipt" | "claimBoundary"
> & {
  searchQueries: string[];
};

const SEARCH_DATABASES = ["repo_code_search", "arxiv", "aps", "epj", "ligo_dcc", "crossref"] as const;

const COMMON_INCLUSION = [
  "Independent source, detector, or theory precedent relevant to the target row.",
  "Parameter ranges, observables, or systematics are explicit enough to compare to NHM2 targets.",
  "Reference is used as context or falsification planning, not as NHM2 validation.",
];

const COMMON_EXCLUSION = [
  "Speculative propulsion claims without measurement or mathematical receipts.",
  "Rows that only repeat NHM2 targets without independent precedent or falsifier value.",
  "Sources that require interpreting an ideal scalar formula as material evidence.",
];

const PRECEDENT = {
  regularizedCasimirGravity: "arxiv_1401_0784_regularized_casimir_gravity",
  conductivePlaneStack: "arxiv_1505_04169_conductive_plane_stack_casimir",
  archimedes2025: "epjconf_2025_archimedes_vacuum_gravity",
  advancedLigo: "physrevd_93_112004_advanced_ligo_sensitivity",
  stationaryWorldlineQei: "arxiv_2301_01698_stationary_worldline_qei",
  warpaxObserverRobust: "arxiv_2602_18023_warpax_observer_robust",
  genericWarpNec: "arxiv_2105_03079_generic_warp_nec",
  realMaterialCasimir: "arxiv_0902_4022_real_material_casimir_review",
  arbitraryMaterialCasimir: "arxiv_1010_5539_arbitrary_material_casimir",
  patchPotentials: "arxiv_1409_5012_patch_potentials",
  millimetreGravity: "nature_2021_millimetre_scale_gravitational_coupling",
  highStressFilms: "physrevapplied_2021_high_stress_nanomechanical_resonators",
  siliconCasimirChip: "nature_communications_2013_silicon_casimir_chip",
  dynamicalCasimir: "nature_2011_dynamical_casimir_effect",
} as const;

const boundary = (): Nhm2ExperimentResearchGapClaimBoundaryV1 => ({
  diagnosticOnly: true,
  researchGapOnly: true,
  noNoveltyClaimWithoutSearchReceipt: true,
  literatureDoesNotValidateNHM2: true,
  nullResultsAreFalsificationEvidence: true,
  physicalViabilityClaimAllowed: false,
  transportClaimAllowed: false,
  routeEtaClaimAllowed: false,
  propulsionClaimAllowed: false,
  speedAuthorityClaimAllowed: false,
});

const searchReceipt = (queries: string[]): Nhm2ExperimentResearchSearchReceiptV1 => ({
  cutoffDate: "2026-06-21",
  databases: [...SEARCH_DATABASES],
  querySetHash: `nhm2-gap-ledger:${queries.join("|").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  queries,
  inclusionCriteria: [...COMMON_INCLUSION],
  exclusionCriteria: [...COMMON_EXCLUSION],
});

const precedent = (
  citationId: string,
  coveredParameters: string[],
  uncoveredParameters: string[],
): Nhm2ExperimentNearestPrecedentV1 => ({
  citationId,
  coveredParameters,
  uncoveredParameters,
});

const SEEDS: Record<string, GapSeed> = {
  "prediction_freeze.observable_vector": {
    priority: "P1",
    scientificQuestion:
      "Can source, force, clock, metric-response, null-control, and falsifier observables be frozen before data without post-hoc target drift?",
    gapClass: "replication",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.advancedLigo, ["predefined detector channels", "sensitivity accounting"], ["NHM2 source tensor and metric-response observable vector"]),
      precedent(PRECEDENT.archimedes2025, ["vacuum-energy gravity program status"], ["same-chart NHM2 falsifier registry"]),
    ],
    searchQueries: ["NHM2 prediction freeze observable vector", "pre registered weak gravity experiment null controls"],
    dominantSystematic: "post-hoc observable selection or sign/phase reinterpretation",
    earliestFalsifier: "prediction artifact changes after data collection starts",
    nullResultMeaning: "A null with frozen sensitivity bounds would retire the matching observable route instead of being absorbed into later fitting.",
    claimImpact: { physicalViability: "necessary", transport: "supporting" },
    expectedInformationGain: "medium",
    experimentalReadiness: "theory",
    nextAction: "Emit a pre-data prediction receipt tying each observable to uncertainty and falsifier IDs.",
  },
  "tile_metrology.gap_m": {
    priority: "P1",
    scientificQuestion:
      "Can the 8 nm design gap be measured and held with roughness, temperature, dielectric response, and patch-potential systematics bounded?",
    gapClass: "parameter_regime",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.realMaterialCasimir, ["finite conductivity", "temperature", "roughness"], ["NHM2 8 nm tiled apparatus with drive and support stack"]),
      precedent(PRECEDENT.patchPotentials, ["patch-potential systematics"], ["integrated NHM2 tile arrays"]),
    ],
    searchQueries: ["8 nm Casimir gap metrology roughness patch potential", "real material Casimir force distance 8 nm"],
    dominantSystematic: "gap calibration error and electrostatic patch force leakage",
    earliestFalsifier: "force-gap curve is dominated by patch or roughness systematics at the 8 nm target",
    nullResultMeaning: "A bounded null would force the tile model away from ideal-plate gap scaling.",
    claimImpact: { physicalViability: "necessary", transport: "none" },
    expectedInformationGain: "medium",
    experimentalReadiness: "bench",
    nextAction: "Define a gap-metrology receipt with patch, roughness, temperature, and dielectric-response channels.",
  },
  "tile_metrology.tile_area_m2": {
    priority: "P2",
    scientificQuestion:
      "Can the 10 mm by 10 mm tile area be represented by a calibrated active area rather than a design rectangle?",
    gapClass: "parameter_regime",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.siliconCasimirChip, ["lithographic alignment and chip-scale area control"], ["10 mm NHM2 tile array with full support/drive stack"]),
    ],
    searchQueries: ["Casimir tile active area lithographic parallelism", "large area nanogap Casimir metrology active area"],
    dominantSystematic: "active-area edge fields and parallelism",
    earliestFalsifier: "active force area does not scale with the declared tile footprint",
    nullResultMeaning: "A null area-scaling result would invalidate using the design footprint in array source estimates.",
    claimImpact: { physicalViability: "supporting", transport: "none" },
    expectedInformationGain: "low",
    experimentalReadiness: "bench",
    nextAction: "Tie tile area to measured force participation rather than geometry alone.",
  },
  "tile_metrology.ideal_pressure_pa": {
    priority: "P1",
    scientificQuestion:
      "Can the ideal 8 nm pressure scale survive real-material, roughness, thermal, stress, and pull-in review?",
    gapClass: "theory_to_measurement",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.realMaterialCasimir, ["Lifshitz corrections", "finite temperature", "roughness"], ["NHM2 high-stress driven tile pressure receipt"]),
      precedent(PRECEDENT.highStressFilms, ["high-stress nanomechanical films"], ["Casimir-loaded 8 nm tiled stack"]),
    ],
    searchQueries: ["Casimir pressure 8 nm high stress film pull in", "Lifshitz correction nanogap pressure roughness"],
    dominantSystematic: "ideal scalar pressure being mistaken for material stress evidence",
    earliestFalsifier: "measured force-gap pressure is outside the real-material uncertainty band",
    nullResultMeaning: "A pressure null would downgrade ideal-pressure rows to calculator-only scaling references.",
    claimImpact: { physicalViability: "necessary", transport: "none" },
    expectedInformationGain: "medium",
    experimentalReadiness: "bench",
    nextAction: "Attach pressure targets to measured force-gap and mechanical-stability receipts.",
  },
  "tile_metrology.material_stack": {
    priority: "P1",
    scientificQuestion:
      "Can the Au-SiN-AlN freeze stack provide measured dielectric, stress, roughness, thermal, and fatigue receipts?",
    gapClass: "system_integration",
    literatureStatus: "systematic_review_needed",
    nearestPrecedents: [
      precedent(PRECEDENT.highStressFilms, ["thin-film stress comparators"], ["complete NHM2 material coupon stack"]),
      precedent(PRECEDENT.realMaterialCasimir, ["material response requirements"], ["Au-SiN-AlN driven-stack coupon evidence"]),
    ],
    searchQueries: ["Au SiN AlN Casimir material stack dielectric stress roughness", "AlN SiN MEMS high stress Casimir nanogap"],
    dominantSystematic: "material coupon properties not matching assembled tile behavior",
    earliestFalsifier: "coupon dielectric/stress/roughness receipts cannot reproduce the tile metrology curve",
    nullResultMeaning: "A null material coupon result would move the stack back to engineering review.",
    claimImpact: { physicalViability: "necessary", transport: "none" },
    expectedInformationGain: "medium",
    experimentalReadiness: "bench",
    nextAction: "Define the material-coupon receipt before treating the stack as source evidence.",
  },
  "cycle_energy_balance.ideal_tile_energy_j": {
    priority: "P1",
    scientificQuestion:
      "Can a driven tile cycle close electrical, mechanical, thermal, elastic, radiation, and loss channels around the ideal scalar energy scale?",
    gapClass: "missing_observable",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.dynamicalCasimir, ["drive-induced vacuum-radiation observation"], ["NHM2 full cycle stress-energy ledger"]),
      precedent(PRECEDENT.regularizedCasimirGravity, ["regularized vacuum-energy gravity accounting"], ["driven apparatus tensor closure"]),
    ],
    searchQueries: ["dynamical Casimir cycle energy balance mechanical heat radiation", "Casimir vacuum energy gravitational mass cycle ledger"],
    dominantSystematic: "unclosed drive, heat, elastic, or radiation channel",
    earliestFalsifier: "cycle energy does not close within the declared uncertainty budget",
    nullResultMeaning: "A closed null would bound any tile-cycle source delta instead of supporting amplification.",
    claimImpact: { physicalViability: "necessary", transport: "none" },
    expectedInformationGain: "medium",
    experimentalReadiness: "bench",
    nextAction: "Create a cycle-energy ledger that audits all non-Casimir channels before array scaling.",
  },
  "array_scaling.layer_count": {
    priority: "P0",
    scientificQuestion:
      "Can a 447-layer candidate stack scale source evidence without assuming linear ideal-plate multiplication?",
    gapClass: "parameter_regime",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.conductivePlaneStack, ["conductive-plane stack Casimir scaling"], ["447-layer NHM2 tile stack with drive, supports, and material receipts"]),
      precedent(PRECEDENT.arbitraryMaterialCasimir, ["arbitrary material/geometry Casimir computation"], ["hull-scale layered source tensor authority"]),
    ],
    searchQueries: ["447 layer Casimir stack scaling conductive planes", "multilayer Casimir stack nonadditive source scaling"],
    dominantSystematic: "nonadditive coupling, support stress, heat, and wiring invalidating a single layer multiplier",
    earliestFalsifier: "DeltaE_N/(N DeltaE_1) departs from the declared layer-scaling uncertainty band",
    nullResultMeaning: "A scaling null would falsify layer-count amplification as the route to regional source closure.",
    claimImpact: { physicalViability: "necessary", transport: "supporting" },
    expectedInformationGain: "high",
    experimentalReadiness: "simulation",
    nextAction: "Build a stack-scaling receipt with nonadditive Casimir, support, heat, and wiring terms.",
  },
  "array_scaling.stack_thickness_m": {
    priority: "P1",
    scientificQuestion:
      "Can the millimetre-class 447-layer stack thickness remain mechanically and thermally credible after supports and conductors are included?",
    gapClass: "system_integration",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.highStressFilms, ["film stress comparators"], ["447-layer assembled thermal/support envelope"]),
      precedent(PRECEDENT.conductivePlaneStack, ["stack concept comparator"], ["NHM2 engineering stack packaging"]),
    ],
    searchQueries: ["millimeter multilayer nanogap stack thermal stress support", "447 layer MEMS stack Casimir support geometry"],
    dominantSystematic: "support and wiring thickness changing the active source geometry",
    earliestFalsifier: "as-built stack thickness or thermal strain exceeds the source-model envelope",
    nullResultMeaning: "A packaging null would force layer count and source density to be recomputed.",
    claimImpact: { physicalViability: "supporting", transport: "none" },
    expectedInformationGain: "medium",
    experimentalReadiness: "simulation",
    nextAction: "Parameterize support, wiring, and thermal margins in the layer-stack geometry receipt.",
  },
  "full_apparatus_tensor.required_components": {
    priority: "P0",
    scientificQuestion:
      "Can the full apparatus emit source-side T_mu_nu components for plates, supports, drive fields, material stresses, and interaction energy without metric-target echo?",
    gapClass: "system_integration",
    literatureStatus: "no_direct_precedent_found",
    nearestPrecedents: [
      precedent(PRECEDENT.regularizedCasimirGravity, ["Casimir gravitational mass and regularized vacuum energy"], ["full NHM2 apparatus T00, T0i, diagonal Tij, and off-diagonal Tij"]),
      precedent(PRECEDENT.arbitraryMaterialCasimir, ["arbitrary geometry/material Casimir stress computation"], ["integrated source-side GR stress-energy tensor for the whole apparatus"]),
    ],
    searchQueries: ["full apparatus stress energy tensor Casimir supports drive fields", "Casimir gravitational mass full stress tensor apparatus"],
    dominantSystematic: "omitted supports, drive momentum, off-diagonal stresses, or metric-target leakage",
    earliestFalsifier: "any required tensor component is missing, scalar-proxy, silently zeroed, or target-derived",
    nullResultMeaning: "A component-level null would block source authority even if scalar T00 rows remain numerically aligned.",
    claimImpact: { physicalViability: "decisive", transport: "necessary" },
    expectedInformationGain: "high",
    experimentalReadiness: "simulation",
    nextAction: "Derive a source-side component ledger and same-basis tensor receipt before using array rows as GR source evidence.",
  },
  "vacuum_weight.one_tile_weight_equivalent_n": {
    priority: "P1",
    scientificQuestion:
      "Can a vacuum-weight apparatus place a meaningful upper bound on the ideal one-tile equivalent force scale?",
    gapClass: "missing_observable",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.archimedes2025, ["vacuum-energy gravity interaction pathfinder"], ["NHM2 one-tile force-equivalent bound"]),
      precedent(PRECEDENT.regularizedCasimirGravity, ["vacuum energy gravitational/inertial accounting"], ["phase-locked NHM2 active/dummy tile comparison"]),
    ],
    searchQueries: ["Archimedes vacuum energy gravity force equivalent Casimir", "Casimir vacuum weight active dummy phase locked balance"],
    dominantSystematic: "thermal, electrostatic, vibrational, or elastic force channel masking the vacuum-weight scale",
    earliestFalsifier: "active and dummy samples are indistinguishable at the pre-registered sensitivity",
    nullResultMeaning: "A null would set a gravitational-coupling upper bound for the tile energy delta.",
    claimImpact: { physicalViability: "supporting", transport: "none" },
    expectedInformationGain: "high",
    experimentalReadiness: "pathfinder",
    nextAction: "Translate the force-equivalent target into an active/dummy lock-in balance sensitivity plan.",
  },
  "metric_response.weak_field_h00_proxy": {
    priority: "P0",
    scientificQuestion:
      "Can detector-scale optical, clock/atom, and mechanical probes bound the weak-field metric response predicted by a receipted source?",
    gapClass: "theory_to_measurement",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.advancedLigo, ["strain sensitivity and detector calibration methodology"], ["near-field NHM2 source-induced metric response"]),
      precedent(PRECEDENT.millimetreGravity, ["small-source gravity measurement"], ["multi-probe invariant metric response from a Casimir source apparatus"]),
    ],
    searchQueries: ["weak field h00 proxy detector optical clock atom mechanical response", "Advanced LIGO sensitivity small source metric response"],
    dominantSystematic: "single-probe artifact interpreted as invariant metric response",
    earliestFalsifier: "no probe channel reaches the pre-registered h00_proxy sensitivity envelope",
    nullResultMeaning: "A detector null would bound the proposed metric-response coupling even if source-side receipts improve.",
    claimImpact: { physicalViability: "decisive", transport: "supporting" },
    expectedInformationGain: "high",
    experimentalReadiness: "facility",
    nextAction: "Convert h00_proxy into a multi-probe detector sensitivity and null-control design.",
  },
  "qei_observer_admissibility.worldline_and_observer_receipts": {
    priority: "P0",
    scientificQuestion:
      "Can QEI worldline applicability and observer-robust WEC/NEC/SEC/DEC integration be receipted against the same apparatus tensor?",
    gapClass: "theory_to_measurement",
    literatureStatus: "adjacent_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.stationaryWorldlineQei, ["stationary-worldline averaged energy bounds"], ["NHM2 wall/transition worldline applicability with source tensor"]),
      precedent(PRECEDENT.warpaxObserverRobust, ["observer-robust warp energy-condition checks"], ["integrated NHM2 source-side observer-family artifact"]),
      precedent(PRECEDENT.genericWarpNec, ["generic warp NEC caution"], ["positive NHM2 observer-family clearance"]),
    ],
    searchQueries: ["stationary worldline QEI warp drive source tensor observer robust", "WarpAX observer robust energy conditions WEC NEC SEC DEC"],
    dominantSystematic: "Eulerian-only or scalar-QEI evidence being promoted beyond its observer/worldline scope",
    earliestFalsifier: "wall or transition worldline margin fails, or any observer family finds a WEC/NEC/SEC/DEC violation",
    nullResultMeaning: "A robust violation null would keep the campaign in diagnostic review even with regional T00 closure.",
    claimImpact: { physicalViability: "decisive", transport: "necessary" },
    expectedInformationGain: "high",
    experimentalReadiness: "theory",
    nextAction: "Bind QEI worldlines and observer-family sampling to the same source tensor and atlas before claim review.",
  },
  "independent_replication.replication_receipt": {
    priority: "P1",
    scientificQuestion:
      "Can an independent lab reproduce the prediction-freeze, source, metric-response, and null-result disposition without local analysis leakage?",
    gapClass: "replication",
    literatureStatus: "direct_precedent",
    nearestPrecedents: [
      precedent(PRECEDENT.advancedLigo, ["large-instrument calibration and collaboration-grade review"], ["NHM2 independent source/metric response reproduction"]),
      precedent(PRECEDENT.archimedes2025, ["pathfinder experiment reporting"], ["independent NHM2 apparatus replication"]),
    ],
    searchQueries: ["independent replication weak gravity Casimir experiment blind analysis", "vacuum energy gravity experiment replication null result"],
    dominantSystematic: "local procedure, analysis, or apparatus-specific artifact",
    earliestFalsifier: "independent blind analysis fails to reproduce a pre-registered positive result",
    nullResultMeaning: "A replicated null at target sensitivity would close the tested campaign branch.",
    claimImpact: { physicalViability: "decisive", transport: "necessary" },
    expectedInformationGain: "high",
    experimentalReadiness: "facility",
    nextAction: "Define independent-lab handoff receipts and null-result disposition before any stronger claim review.",
  },
};

const fallbackSeed = (targetId: string): GapSeed => ({
  priority: "P2",
  scientificQuestion: `No additional research gap was found for ${targetId} beyond its parameter-target receipt.`,
  gapClass: "no_gap_found",
  literatureStatus: "systematic_review_needed",
  nearestPrecedents: [
    precedent("repo_parameter_target_only", ["repo target row"], ["independent systematic review"]),
  ],
  searchQueries: [`${targetId} NHM2 experiment target research gap`],
  dominantSystematic: "unreviewed target-specific evidence chain",
  earliestFalsifier: "the parameter-target receipt cannot be produced",
  nullResultMeaning: "A null would leave the target as a planning row only.",
  claimImpact: { physicalViability: "none", transport: "none" },
  expectedInformationGain: "low",
  experimentalReadiness: "theory",
  nextAction: "Run a systematic review before using this target outside the parameter ledger.",
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isEnum = <T extends readonly string[]>(value: unknown, entries: T): value is T[number] =>
  typeof value === "string" && entries.includes(value);

export const buildNhm2ExperimentResearchGapLedger = (
  input: BuildNhm2ExperimentParameterTargetsInput = {},
): Nhm2ExperimentResearchGapLedgerV1 => {
  const parameterTargets = buildNhm2ExperimentParameterTargets(input);
  const rows = parameterTargets.rows.map((target) => {
    const seed = SEEDS[target.parameterId] ?? fallbackSeed(target.parameterId);
    return {
      targetId: target.parameterId,
      stageId: target.stageId,
      scientificQuestion: seed.scientificQuestion,
      gapClass: seed.gapClass,
      literatureStatus: seed.literatureStatus,
      nearestPrecedents: seed.nearestPrecedents,
      searchReceipt: searchReceipt(seed.searchQueries),
      dominantSystematic: seed.dominantSystematic,
      earliestFalsifier: seed.earliestFalsifier,
      nullResultMeaning: seed.nullResultMeaning,
      claimImpact: seed.claimImpact,
      expectedInformationGain: seed.expectedInformationGain,
      experimentalReadiness: seed.experimentalReadiness,
      nextAction: seed.nextAction,
      priority: seed.priority,
      claimBoundary: boundary(),
    };
  });
  return {
    contractVersion: NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER_CONTRACT_VERSION,
    generatedAt: parameterTargets.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: parameterTargets.selectedProfileId,
    parameterTargetsRef: "nhm2_experiment_parameter_targets/v1",
    rows,
    summary: {
      rowCount: rows.length,
      mappedTargetCount: rows.length,
      p0TargetIds: rows.filter((entry) => entry.priority === "P0").map((entry) => entry.targetId),
      highInformationTargetIds: rows
        .filter((entry) => entry.expectedInformationGain === "high")
        .map((entry) => entry.targetId),
      noDirectPrecedentTargetIds: rows
        .filter((entry) => entry.literatureStatus === "no_direct_precedent_found")
        .map((entry) => entry.targetId),
      firstNextAction: rows[0]?.nextAction ?? "none",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      researchGapLedgerOnly: true,
      literaturePrecedentsAreContextNotValidation: true,
      noDirectPrecedentIsNotNoveltyClaim: true,
      nullResultsMustRemainStageEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

export const isNhm2ExperimentResearchGapLedger = (
  value: unknown,
): value is Nhm2ExperimentResearchGapLedgerV1 => {
  if (!isRecord(value)) return false;
  const rows = Array.isArray(value.rows) ? value.rows : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const claimBoundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.parameterTargetsRef === "nhm2_experiment_parameter_targets/v1" &&
    rows != null &&
    rows.length > 0 &&
    rows.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.targetId === "string" &&
        typeof entry.stageId === "string" &&
        typeof entry.scientificQuestion === "string" &&
        isEnum(entry.gapClass, NHM2_EXPERIMENT_RESEARCH_GAP_CLASSES) &&
        isEnum(entry.literatureStatus, NHM2_EXPERIMENT_RESEARCH_LITERATURE_STATUSES) &&
        Array.isArray(entry.nearestPrecedents) &&
        entry.nearestPrecedents.length > 0 &&
        entry.nearestPrecedents.every(
          (precedentEntry) =>
            isRecord(precedentEntry) &&
            typeof precedentEntry.citationId === "string" &&
            isStringArray(precedentEntry.coveredParameters) &&
            isStringArray(precedentEntry.uncoveredParameters),
        ) &&
        isRecord(entry.searchReceipt) &&
        entry.searchReceipt.cutoffDate === "2026-06-21" &&
        isStringArray(entry.searchReceipt.databases) &&
        typeof entry.searchReceipt.querySetHash === "string" &&
        isStringArray(entry.searchReceipt.queries) &&
        entry.searchReceipt.queries.length > 0 &&
        isStringArray(entry.searchReceipt.inclusionCriteria) &&
        isStringArray(entry.searchReceipt.exclusionCriteria) &&
        typeof entry.dominantSystematic === "string" &&
        typeof entry.earliestFalsifier === "string" &&
        typeof entry.nullResultMeaning === "string" &&
        isRecord(entry.claimImpact) &&
        isEnum(entry.claimImpact.physicalViability, NHM2_EXPERIMENT_CLAIM_IMPACTS) &&
        isEnum(entry.claimImpact.transport, NHM2_EXPERIMENT_CLAIM_IMPACTS) &&
        isEnum(entry.expectedInformationGain, NHM2_EXPERIMENT_INFORMATION_GAINS) &&
        isEnum(entry.experimentalReadiness, NHM2_EXPERIMENT_READINESS_LEVELS) &&
        typeof entry.nextAction === "string" &&
        isEnum(entry.priority, NHM2_EXPERIMENT_RESEARCH_GAP_PRIORITIES) &&
        isRecord(entry.claimBoundary) &&
        entry.claimBoundary.diagnosticOnly === true &&
        entry.claimBoundary.researchGapOnly === true &&
        entry.claimBoundary.noNoveltyClaimWithoutSearchReceipt === true &&
        entry.claimBoundary.literatureDoesNotValidateNHM2 === true &&
        entry.claimBoundary.nullResultsAreFalsificationEvidence === true &&
        entry.claimBoundary.physicalViabilityClaimAllowed === false &&
        entry.claimBoundary.transportClaimAllowed === false &&
        entry.claimBoundary.routeEtaClaimAllowed === false &&
        entry.claimBoundary.propulsionClaimAllowed === false &&
        entry.claimBoundary.speedAuthorityClaimAllowed === false,
    ) &&
    summary != null &&
    summary.rowCount === rows.length &&
    summary.mappedTargetCount === rows.length &&
    isStringArray(summary.p0TargetIds) &&
    isStringArray(summary.highInformationTargetIds) &&
    isStringArray(summary.noDirectPrecedentTargetIds) &&
    typeof summary.firstNextAction === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.routeEtaClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    claimBoundary != null &&
    claimBoundary.diagnosticOnly === true &&
    claimBoundary.researchGapLedgerOnly === true &&
    claimBoundary.literaturePrecedentsAreContextNotValidation === true &&
    claimBoundary.noDirectPrecedentIsNotNoveltyClaim === true &&
    claimBoundary.nullResultsMustRemainStageEvidence === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false &&
    claimBoundary.speedAuthorityClaimAllowed === false
  );
};
