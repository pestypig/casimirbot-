import {
  buildNhm2LayerStackFullApparatusReceiptLoop,
  type BuildNhm2LayerStackFullApparatusReceiptLoopInput,
  type Nhm2LayerStackFullApparatusReceiptRowV1,
} from "./nhm2-layer-stack-full-apparatus-receipt-loop.v1";
import type { Nhm2TileSourceMaterialEvidenceReceiptsV1 } from "./nhm2-tile-source-material-evidence-receipts.v1";
import type { Nhm2TileSourceOperatingBudgetReadinessV1 } from "./nhm2-tile-source-operating-budget-readiness.v1";

export const NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT_VERSION =
  "nhm2_tile_source_physical_validation_plan/v1";

export const NHM2_TILE_SOURCE_VALIDATION_STATUSES = [
  "physically_credible_source_candidate",
  "review",
  "falsified",
] as const;

export type Nhm2TileSourceValidationStatus =
  (typeof NHM2_TILE_SOURCE_VALIDATION_STATUSES)[number];

export type Nhm2TileSourceGateStatus = "pass" | "review" | "fail" | "not_run";

export type Nhm2TileSourceReceiptTargetV1 = {
  targetId:
    | "material_coupon"
    | "force_gap_pull_in"
    | "roughness_patch_metrology"
    | "active_control_energy"
    | "fatigue_lifetime"
    | "layer_scaling"
    | "full_apparatus_tensor";
  status: Nhm2TileSourceGateStatus;
  targetValues: Record<string, number | string | boolean | null>;
  evidenceRef: string | null;
  literatureRefs: string[];
  requiredChange: string;
  blockers: string[];
};

export type Nhm2TileSourceTensorAuthorityGateV1 = {
  sameChart: Nhm2TileSourceGateStatus;
  sameBasis: Nhm2TileSourceGateStatus;
  sameUnits: Nhm2TileSourceGateStatus;
  fullTensorComponents: {
    T00: Nhm2TileSourceGateStatus;
    T0i: Nhm2TileSourceGateStatus;
    diagonalTij: Nhm2TileSourceGateStatus;
    offDiagonalTij: Nhm2TileSourceGateStatus;
  };
  noMetricTargetEcho: Nhm2TileSourceGateStatus;
  regionalCompatibility: {
    wall: Nhm2TileSourceGateStatus;
    hull: Nhm2TileSourceGateStatus;
    exteriorShell: Nhm2TileSourceGateStatus;
  };
  sourceTensorAuthorityCandidateAllowed: boolean;
  blockers: string[];
};

export type Nhm2TileSourceDownstreamGateV1 = {
  gateId:
    | "regional_residual_closure"
    | "wall_t00_closure"
    | "covariant_conservation"
    | "qei_worldline_dossier"
    | "observer_family_energy_conditions"
    | "material_credibility"
    | "coupled_closure";
  status: Nhm2TileSourceGateStatus;
  artifactRef: string | null;
  requiredChange: string;
  blockers: string[];
};

export type Nhm2TileSourceFalsificationItemV1 = {
  blocker: string;
  numericalMargin: number | null;
  marginUnit: string | null;
  requiredChange: string;
  falsifiesCurrentCandidate: boolean;
};

export type Nhm2TileSourcePhysicalValidationPlanV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  receiptLoopRef: "nhm2_layer_stack_full_apparatus_receipt_loop/v1";
  frozenCandidate: {
    candidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
    architectureId: string;
    architectureKind: string;
    materialCandidate: string;
    selectionMethod: "highest_receipt_loop_readiness_nonfailed_row";
    sourceRetention: number;
    supportStressMPa: number;
    pullInMargin: number | null;
  };
  receiptTargets: Nhm2TileSourceReceiptTargetV1[];
  tensorAuthorityGate: Nhm2TileSourceTensorAuthorityGateV1;
  downstreamGates: Nhm2TileSourceDownstreamGateV1[];
  falsificationMap: Nhm2TileSourceFalsificationItemV1[];
  summary: {
    sourceCandidateStatus: Nhm2TileSourceValidationStatus;
    firstBlocker: string;
    allReceiptsPresent: boolean;
    operatingBudgetsReady: boolean;
    operatingBudgetsFalsifyCurrentCandidate: boolean;
    fullApparatusTensorCoverageComplete: boolean;
    downstreamGatesPass: boolean;
    decisiveFalsificationMapAvailable: boolean;
    physicallyCredibleSourceCandidate: boolean;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
    routeEtaClaimAllowed: false;
  };
  researchRefs: [
    "pmc_2024_casimir_mems_review",
    "physrevb_72_115426_roughness_pull_in",
    "physrevb_87_125413_roughness_mems_actuation",
    "physrevresearch_2_023355_patch_potential_measurement",
    "arxiv_1207_4429_surface_potential_nanomebrane",
    "rspa_2020_0311_casimir_pull_in_framework",
    "physrevapplied_15_034063_high_stress_sin",
    "nature_2025_aln_alscn_mems_mirror_review",
    "apl_127_222202_high_stress_tin"
  ];
  claimBoundary: {
    diagnosticOnly: true;
    validationPlanOnly: true;
    physicallyCredibleSourceCandidateIsNotPhysicalViability: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    sourceTensorMustNotCopyMetricTarget: true;
    fullSolveRequiresDownstreamGateClosure: true;
    operatingBudgetReadinessRequired: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2TileSourcePhysicalValidationPlanInput =
  BuildNhm2LayerStackFullApparatusReceiptLoopInput & {
    tensorAuthorityEvidenceSupplied?: boolean | null;
    downstreamGateStatuses?: Partial<Record<Nhm2TileSourceDownstreamGateV1["gateId"], Nhm2TileSourceGateStatus>> | null;
    materialEvidenceReceipts?: Nhm2TileSourceMaterialEvidenceReceiptsV1 | null;
    operatingBudgetReadiness?: Nhm2TileSourceOperatingBudgetReadinessV1 | null;
  };

const TARGET_CANDIDATE_ID = "topology_optimized_lattice_tin";
const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const targetRow = (rows: Nhm2LayerStackFullApparatusReceiptRowV1[]): Nhm2LayerStackFullApparatusReceiptRowV1 => {
  const explicit = rows.find((row) => row.architectureId === TARGET_CANDIDATE_ID);
  if (explicit != null) return explicit;
  const nonFailed = rows.find((row) => row.architectureBaseStatus !== "fail");
  if (nonFailed != null) return nonFailed;
  return rows[0];
};

const targetStatusFromReceipt = (
  row: Nhm2LayerStackFullApparatusReceiptRowV1,
  surfaceId: Nhm2TileSourceReceiptTargetV1["targetId"],
): Nhm2TileSourceGateStatus => {
  const surface = row.receiptSurfaces.find((entry) => entry.surfaceId === surfaceId);
  if (surface?.status === "receipted") return "pass";
  if (row.architectureBaseStatus === "fail") return "fail";
  return "review";
};

const receiptTarget = (
  row: Nhm2LayerStackFullApparatusReceiptRowV1,
  targetId: Nhm2TileSourceReceiptTargetV1["targetId"],
  targetValues: Record<string, number | string | boolean | null>,
  literatureRefs: string[],
  requiredChange: string,
): Nhm2TileSourceReceiptTargetV1 => {
  const surface = row.receiptSurfaces.find((entry) => entry.surfaceId === targetId);
  const status = targetStatusFromReceipt(row, targetId);
  return {
    targetId,
    status,
    targetValues,
    evidenceRef: status === "pass" ? `receipt://${targetId}/candidate/${row.architectureId}` : null,
    literatureRefs,
    requiredChange,
    blockers: status === "pass" ? [] : (surface?.blockers ?? [`${targetId}_receipt_missing`]),
  };
};

const downstreamGate = (
  gateId: Nhm2TileSourceDownstreamGateV1["gateId"],
  status: Nhm2TileSourceGateStatus,
  requiredChange: string,
  blockers?: string[],
): Nhm2TileSourceDownstreamGateV1 => ({
  gateId,
  status,
  artifactRef: status === "pass" ? `artifact://${gateId}/candidate/topology_optimized_lattice_tin` : null,
  requiredChange,
  blockers: status === "pass" ? [] : blockers ?? [`${gateId}_${status === "not_run" ? "not_run" : "incomplete"}`],
});

const allPass = (statuses: Nhm2TileSourceGateStatus[]): boolean =>
  statuses.every((status) => status === "pass");

const admittedStatus = (args: {
  requestedStatus: Nhm2TileSourceGateStatus;
  blockers: string[];
  falsifies: boolean;
}): Nhm2TileSourceGateStatus => {
  if (args.requestedStatus !== "pass" || args.blockers.length === 0) {
    return args.requestedStatus;
  }
  return args.falsifies ? "fail" : "review";
};

export const buildNhm2TileSourcePhysicalValidationPlan = (
  input: BuildNhm2TileSourcePhysicalValidationPlanInput = {},
): Nhm2TileSourcePhysicalValidationPlanV1 => {
  const materialEvidence = input.materialEvidenceReceipts ?? null;
  const operatingBudgetReadiness = input.operatingBudgetReadiness ?? null;
  const receiptLoopInput: BuildNhm2LayerStackFullApparatusReceiptLoopInput = {
    ...input,
    suppliedReceiptSurfaces:
      materialEvidence?.derivedReceiptInputs.suppliedReceiptSurfaces ??
      input.suppliedReceiptSurfaces,
    tensorTermCoverage:
      materialEvidence?.derivedReceiptInputs.tensorTermCoverage ??
      input.tensorTermCoverage,
  };
  const receiptLoop = buildNhm2LayerStackFullApparatusReceiptLoop(receiptLoopInput);
  const row = targetRow(receiptLoop.summary.rankedRowsByEvidenceReadiness);
  const receiptTargets = [
    receiptTarget(
      row,
      "material_coupon",
      {
        material: row.materialCandidate,
        allowableStressPa: row.materialCandidate === "ultra_high_stress_tin" ? 2.3e9 : null,
        supportStressMPa: row.supportStressMPa,
        cryogenicBehaviorRequired: true,
        conductivityRequired: true,
        dielectricResponseRequired: true,
        fabricationToleranceRequired: true,
      },
      ["apl_127_222202_high_stress_tin", "physrevapplied_15_034063_high_stress_sin", "nature_2025_aln_alscn_mems_mirror_review"],
      "Supply material coupon data for stress, fracture/yield, fatigue, cryogenic behavior, roughness, conductivity, dielectric response, and fabrication tolerance.",
    ),
    receiptTarget(
      row,
      "force_gap_pull_in",
      {
        gapMeters: 8e-9,
        pullInMarginMinimum: 1,
        observedPullInMargin: row.pullInMargin,
        forceGradientModelRequired: true,
        activeGapControlAuthorityRequired: true,
      },
      ["pmc_2024_casimir_mems_review", "rspa_2020_0311_casimir_pull_in_framework"],
      "Supply measured or simulated F(g), force gradient, spring constant, pull-in margin at 8 nm, stiction risk, and active gap-control authority.",
    ),
    receiptTarget(
      row,
      "roughness_patch_metrology",
      {
        roughnessRmsTargetMeters: 1e-10,
        asperityTailBelowGapRequired: true,
        patchVoltageMapRequired: true,
        residualElectrostaticForceCorrectionRequired: true,
      },
      ["physrevb_72_115426_roughness_pull_in", "physrevb_87_125413_roughness_mems_actuation", "physrevresearch_2_023355_patch_potential_measurement", "arxiv_1207_4429_surface_potential_nanomebrane"],
      "Supply RMS roughness, asperity-tail distribution, patch voltage map, residual electrostatic force, roughness correction, and patch-force correction.",
    ),
    receiptTarget(
      row,
      "active_control_energy",
      {
        controlEnergyPerCycleJ: null,
        controlNoiseSpectrumRequired: true,
        bandwidthMustExceedSwitchingRate: true,
        heatLoadReceiptRequired: true,
        timingSynchronizationRequired: true,
        failureModeReceiptRequired: true,
      },
      ["pmc_2024_casimir_mems_review", "nature_2025_aln_alscn_mems_mirror_review"],
      "Supply active-control energy per cycle, noise, bandwidth, heat load, timing synchronization, failure mode, and T_munu contribution.",
    ),
    receiptTarget(
      row,
      "fatigue_lifetime",
      {
        cycleLifetimeRequired: true,
        thermalCyclingRequired: true,
        creepOrDriftBoundRequired: true,
      },
      ["physrevapplied_15_034063_high_stress_sin", "apl_127_222202_high_stress_tin"],
      "Supply cycle lifetime, thermal cycling, creep/drift, and fatigue margin for the selected architecture.",
    ),
    receiptTarget(
      row,
      "layer_scaling",
      {
        layerCount: 447,
        minimumLayerScalingEfficiency: 0.9,
        nonlinearCrossLayerBoundRequired: true,
        forceAdditivityReceiptRequired: true,
      },
      ["pmc_2024_casimir_mems_review", "revmodphys_81_1827_real_material_casimir"],
      "Supply 447-layer force additivity, nonlinear cross-layer effects, and nonadditivity bounds.",
    ),
    receiptTarget(
      row,
      "full_apparatus_tensor",
      {
        requireCasimirFieldContribution: true,
        requireSupportStressEnergy: true,
        requireSpacerContactStress: true,
        requireElectrostaticPatchTerms: true,
        requireActiveControlFieldEnergy: true,
        requireThermalLoad: true,
        requireMaterialStrainEnergy: true,
        requireFatigueLayerScalingTerms: true,
      },
      ["revmodphys_81_1827_real_material_casimir"],
      "Supply full apparatus T_munu including Casimir field, support, spacer, electrostatic, active-control, thermal, strain, fatigue, and layer-scaling terms.",
    ),
  ];
  const tensorEvidenceSupplied =
    input.tensorAuthorityEvidenceSupplied ??
    materialEvidence?.derivedReceiptInputs.tensorAuthorityEvidenceSupplied ??
    false;
  const tensorStatus: Nhm2TileSourceGateStatus = tensorEvidenceSupplied ? "pass" : "review";
  const tensorAuthorityGate: Nhm2TileSourceTensorAuthorityGateV1 = {
    sameChart: tensorStatus,
    sameBasis: tensorStatus,
    sameUnits: tensorStatus,
    fullTensorComponents: {
      T00: tensorStatus,
      T0i: tensorStatus,
      diagonalTij: tensorStatus,
      offDiagonalTij: tensorStatus,
    },
    noMetricTargetEcho: tensorStatus,
    regionalCompatibility: {
      wall: tensorStatus,
      hull: tensorStatus,
      exteriorShell: tensorStatus,
    },
    sourceTensorAuthorityCandidateAllowed:
      tensorEvidenceSupplied && row.engineeringCandidateStatus === "candidate_window",
    blockers: tensorEvidenceSupplied
      ? []
      : [
          "same_chart_full_apparatus_tensor_missing",
          "source_tensor_component_coverage_missing",
          "metric_target_echo_test_missing",
          "regional_compatibility_not_run",
        ],
  };
  const downstreamStatuses = input.downstreamGateStatuses ?? {};
  const allReceiptsPresent = receiptTargets.every((target) => target.status === "pass");
  const operatingBudgetsReady =
    operatingBudgetReadiness?.summary.allOperatingBudgetsReady === true;
  const operatingBudgetsFalsifyCurrentCandidate =
    operatingBudgetReadiness?.summary.anyOperatingBudgetFalsifies === true;
  const fullApparatusTensorCoverageComplete = row.receiptSurfaces
    .find((surface) => surface.surfaceId === "full_apparatus_tensor")
    ?.status === "receipted";
  const tensorAuthorityPass = tensorAuthorityGate.sourceTensorAuthorityCandidateAllowed;
  const requestedMaterialCredibilityStatus =
    downstreamStatuses.material_credibility ?? "not_run";
  const materialCredibilityAdmissionBlockers =
    requestedMaterialCredibilityStatus === "pass"
      ? [
          ...(!allReceiptsPresent ? ["material_credibility_receipts_incomplete"] : []),
          ...(!operatingBudgetsReady
            ? ["material_credibility_operating_budgets_not_ready"]
            : []),
          ...(operatingBudgetsFalsifyCurrentCandidate
            ? ["material_credibility_operating_budget_falsifies_candidate"]
            : []),
        ]
      : [];
  const materialCredibilityStatus = admittedStatus({
    requestedStatus: requestedMaterialCredibilityStatus,
    blockers: materialCredibilityAdmissionBlockers,
    falsifies: operatingBudgetsFalsifyCurrentCandidate,
  });
  const upstreamDownstreamGates = [
    downstreamGate(
      "regional_residual_closure",
      downstreamStatuses.regional_residual_closure ?? "not_run",
      "Run regional wall/hull/exterior residual closure against the candidate apparatus tensor.",
    ),
    downstreamGate(
      "wall_t00_closure",
      downstreamStatuses.wall_t00_closure ?? "not_run",
      "Run wall T00 closure without treating T00-only closure as broad wall closure.",
    ),
    downstreamGate(
      "covariant_conservation",
      downstreamStatuses.covariant_conservation ?? "not_run",
      "Run covariant conservation with support/control/electrostatic/thermal terms included.",
    ),
    downstreamGate(
      "qei_worldline_dossier",
      downstreamStatuses.qei_worldline_dossier ?? "not_run",
      "Run QEI worldline dossier against the candidate apparatus tensor.",
    ),
    downstreamGate(
      "observer_family_energy_conditions",
      downstreamStatuses.observer_family_energy_conditions ?? "not_run",
      "Run observer-family WEC/NEC/SEC/DEC diagnostics against the candidate apparatus tensor.",
    ),
    downstreamGate(
      "material_credibility",
      materialCredibilityStatus,
      "Run material credibility admission over coupon, force-gap, roughness, patch, control, fatigue, and scaling receipts.",
      materialCredibilityAdmissionBlockers.length > 0
        ? materialCredibilityAdmissionBlockers
        : undefined,
    ),
  ];
  const requestedCoupledClosureStatus = downstreamStatuses.coupled_closure ?? "not_run";
  const coupledClosureAdmissionBlockers =
    requestedCoupledClosureStatus === "pass"
      ? [
          ...(!allReceiptsPresent ? ["coupled_closure_material_receipts_incomplete"] : []),
          ...(!operatingBudgetsReady ? ["coupled_closure_operating_budgets_not_ready"] : []),
          ...(!fullApparatusTensorCoverageComplete
            ? ["coupled_closure_full_apparatus_tensor_receipt_incomplete"]
            : []),
          ...(!tensorAuthorityPass ? ["coupled_closure_source_tensor_authority_not_admitted"] : []),
          ...upstreamDownstreamGates
            .filter((gate) => gate.status !== "pass")
            .map((gate) => `${gate.gateId}_not_pass_for_coupled_closure`),
        ]
      : [];
  const coupledClosureStatus = admittedStatus({
    requestedStatus: requestedCoupledClosureStatus,
    blockers: coupledClosureAdmissionBlockers,
    falsifies:
      operatingBudgetsFalsifyCurrentCandidate ||
      upstreamDownstreamGates.some((gate) => gate.status === "fail"),
  });
  const downstreamGates = [
    ...upstreamDownstreamGates,
    downstreamGate(
      "coupled_closure",
      coupledClosureStatus,
      "Run coupled closure after source authority, residuals, conservation, QEI, observer, and material gates complete.",
      coupledClosureAdmissionBlockers.length > 0
        ? coupledClosureAdmissionBlockers
        : undefined,
    ),
  ];
  const downstreamGatesPass = allPass(downstreamGates.map((gate) => gate.status));
  const physicallyCredibleSourceCandidate =
    allReceiptsPresent &&
    operatingBudgetsReady &&
    fullApparatusTensorCoverageComplete &&
    downstreamGatesPass &&
    tensorAuthorityPass;
  const firstReceiptBlocker =
    receiptTargets.find((target) => target.status !== "pass")?.blockers[0] ?? null;
  const firstOperatingBudgetBlocker =
    operatingBudgetReadiness == null
      ? "operating_budget_readiness_missing"
      : operatingBudgetReadiness.summary.firstBlocker !== "none"
        ? operatingBudgetReadiness.summary.firstBlocker
        : null;
  const firstTensorBlocker = tensorAuthorityGate.blockers[0] ?? null;
  const firstDownstreamBlocker =
    downstreamGates.find((gate) => gate.status !== "pass")?.blockers[0] ?? null;
  const firstBlocker =
    firstReceiptBlocker ??
    firstOperatingBudgetBlocker ??
    firstTensorBlocker ??
    firstDownstreamBlocker ??
    "none";
  const sourceCandidateStatus: Nhm2TileSourceValidationStatus = physicallyCredibleSourceCandidate
    ? "physically_credible_source_candidate"
    : row.architectureBaseStatus === "fail" || operatingBudgetsFalsifyCurrentCandidate
      ? "falsified"
      : "review";
  const falsificationMap: Nhm2TileSourceFalsificationItemV1[] = [
    ...receiptTargets.flatMap((target) =>
      target.status === "pass"
        ? []
        : target.blockers.map((blocker) => ({
            blocker,
            numericalMargin:
              target.targetId === "material_coupon"
                ? round((target.targetValues.supportStressMPa as number) ?? 0)
                : target.targetId === "force_gap_pull_in"
                  ? (target.targetValues.observedPullInMargin as number | null)
                  : null,
            marginUnit:
              target.targetId === "material_coupon"
                ? "MPa support stress"
                : target.targetId === "force_gap_pull_in"
                  ? "pull-in margin"
                  : null,
            requiredChange: target.requiredChange,
            falsifiesCurrentCandidate: target.status === "fail",
          })),
    ),
    ...tensorAuthorityGate.blockers.map((blocker) => ({
      blocker,
      numericalMargin: null,
      marginUnit: null,
      requiredChange:
        "Supply same-chart, same-basis, same-unit full apparatus T_munu with T00, T0i, diagonal Tij, off-diagonal Tij, no metric-target echo, and regional wall/hull/exterior compatibility.",
      falsifiesCurrentCandidate: false,
    })),
    ...(
      operatingBudgetReadiness == null
        ? [
            {
              blocker: "operating_budget_readiness_missing",
              numericalMargin: null,
              marginUnit: null,
              requiredChange:
                "Build nhm2_tile_source_operating_budget_readiness/v1 over material coupon, force-gap, roughness/patch, active-control, fatigue/layer-scaling, and full-apparatus tensor budgets.",
              falsifiesCurrentCandidate: false,
            },
          ]
        : operatingBudgetReadiness.blockers.map((blocker) => ({
            blocker,
            numericalMargin: null,
            marginUnit: null,
            requiredChange:
              "Clear operating-budget readiness for material coupon, force-gap, roughness/patch, active-control, fatigue/layer-scaling, and full-apparatus tensor evidence.",
            falsifiesCurrentCandidate:
              operatingBudgetReadiness.summary.anyOperatingBudgetFalsifies,
          }))
    ),
    ...downstreamGates.flatMap((gate) =>
      gate.status === "pass"
        ? []
        : gate.blockers.map((blocker) => ({
            blocker,
            numericalMargin: null,
            marginUnit: null,
            requiredChange: gate.requiredChange,
            falsifiesCurrentCandidate: gate.status === "fail",
          })),
    ),
  ];
  return {
    contractVersion: NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT_VERSION,
    generatedAt: receiptLoop.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receiptLoop.selectedProfileId,
    receiptLoopRef: "nhm2_layer_stack_full_apparatus_receipt_loop/v1",
    frozenCandidate: {
      candidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
      architectureId: row.architectureId,
      architectureKind: row.architectureKind,
      materialCandidate: row.materialCandidate,
      selectionMethod: "highest_receipt_loop_readiness_nonfailed_row",
      sourceRetention: row.sourceRetention,
      supportStressMPa: row.supportStressMPa,
      pullInMargin: row.pullInMargin,
    },
    receiptTargets,
    tensorAuthorityGate,
    downstreamGates,
    falsificationMap,
    summary: {
      sourceCandidateStatus,
      firstBlocker,
      allReceiptsPresent,
      operatingBudgetsReady,
      operatingBudgetsFalsifyCurrentCandidate,
      fullApparatusTensorCoverageComplete,
      downstreamGatesPass,
      decisiveFalsificationMapAvailable: falsificationMap.length > 0,
      physicallyCredibleSourceCandidate,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      routeEtaClaimAllowed: false,
    },
    researchRefs: [
      "pmc_2024_casimir_mems_review",
      "physrevb_72_115426_roughness_pull_in",
      "physrevb_87_125413_roughness_mems_actuation",
      "physrevresearch_2_023355_patch_potential_measurement",
      "arxiv_1207_4429_surface_potential_nanomebrane",
      "rspa_2020_0311_casimir_pull_in_framework",
      "physrevapplied_15_034063_high_stress_sin",
      "nature_2025_aln_alscn_mems_mirror_review",
      "apl_127_222202_high_stress_tin",
    ],
    claimBoundary: {
      diagnosticOnly: true,
      validationPlanOnly: true,
      physicallyCredibleSourceCandidateIsNotPhysicalViability: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      sourceTensorMustNotCopyMetricTarget: true,
      fullSolveRequiresDownstreamGateClosure: true,
      operatingBudgetReadinessRequired: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourcePhysicalValidationPlan = (
  value: unknown,
): value is Nhm2TileSourcePhysicalValidationPlanV1 => {
  if (!isRecord(value)) return false;
  const candidate = isRecord(value.frozenCandidate) ? value.frozenCandidate : null;
  const receiptTargets = Array.isArray(value.receiptTargets) ? value.receiptTargets : null;
  const tensorAuthorityGate = isRecord(value.tensorAuthorityGate) ? value.tensorAuthorityGate : null;
  const downstreamGates = Array.isArray(value.downstreamGates) ? value.downstreamGates : null;
  const falsificationMap = Array.isArray(value.falsificationMap) ? value.falsificationMap : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.receiptLoopRef === "nhm2_layer_stack_full_apparatus_receipt_loop/v1" &&
    candidate != null &&
    candidate.candidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    typeof candidate.architectureId === "string" &&
    typeof candidate.sourceRetention === "number" &&
    typeof candidate.supportStressMPa === "number" &&
    receiptTargets != null &&
    receiptTargets.length === 7 &&
    receiptTargets.every(
      (target) =>
        isRecord(target) &&
        typeof target.targetId === "string" &&
        typeof target.status === "string" &&
        ["pass", "review", "fail", "not_run"].includes(target.status) &&
        isRecord(target.targetValues) &&
        (target.evidenceRef === null || typeof target.evidenceRef === "string") &&
        Array.isArray(target.literatureRefs) &&
        typeof target.requiredChange === "string" &&
        Array.isArray(target.blockers),
    ) &&
    tensorAuthorityGate != null &&
    typeof tensorAuthorityGate.sourceTensorAuthorityCandidateAllowed === "boolean" &&
    Array.isArray(tensorAuthorityGate.blockers) &&
    downstreamGates != null &&
    downstreamGates.length === 7 &&
    downstreamGates.every(
      (gate) =>
        isRecord(gate) &&
        typeof gate.gateId === "string" &&
        typeof gate.status === "string" &&
        ["pass", "review", "fail", "not_run"].includes(gate.status) &&
        (gate.artifactRef === null || typeof gate.artifactRef === "string") &&
        typeof gate.requiredChange === "string" &&
        Array.isArray(gate.blockers),
    ) &&
    falsificationMap != null &&
    falsificationMap.every(
      (item) =>
        isRecord(item) &&
        typeof item.blocker === "string" &&
        (item.numericalMargin === null || typeof item.numericalMargin === "number") &&
        (item.marginUnit === null || typeof item.marginUnit === "string") &&
        typeof item.requiredChange === "string" &&
        typeof item.falsifiesCurrentCandidate === "boolean",
    ) &&
    summary != null &&
    typeof summary.sourceCandidateStatus === "string" &&
    typeof summary.firstBlocker === "string" &&
    typeof summary.allReceiptsPresent === "boolean" &&
    typeof summary.operatingBudgetsReady === "boolean" &&
    typeof summary.operatingBudgetsFalsifyCurrentCandidate === "boolean" &&
    typeof summary.fullApparatusTensorCoverageComplete === "boolean" &&
    typeof summary.downstreamGatesPass === "boolean" &&
    typeof summary.decisiveFalsificationMapAvailable === "boolean" &&
    typeof summary.physicallyCredibleSourceCandidate === "boolean" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    summary.routeEtaClaimAllowed === false &&
    Array.isArray(value.researchRefs) &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.validationPlanOnly === true &&
    boundary.physicallyCredibleSourceCandidateIsNotPhysicalViability === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.sourceTensorMustNotCopyMetricTarget === true &&
    boundary.fullSolveRequiresDownstreamGateClosure === true &&
    boundary.operatingBudgetReadinessRequired === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.routeEtaClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.speedAuthorityClaimAllowed === false
  );
};
