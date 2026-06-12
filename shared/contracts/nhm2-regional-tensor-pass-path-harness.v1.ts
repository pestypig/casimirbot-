import type { CasimirMaterialReceiptV1 } from "./casimir-material-receipt.v1";
import type { Nhm2CoupledClosurePassCandidateArtifactV1 } from "./nhm2-coupled-closure-pass-candidate.v1";
import type { Nhm2ObserverRobustEnergyConditionArtifactV1 } from "./nhm2-observer-robust-energy-conditions.v1";
import type { Nhm2QeiWorldlineDossierV1 } from "./nhm2-qei-worldline-dossier.v1";
import type { Nhm2RegionalMaterialSourceTensorModelV1 } from "./nhm2-regional-material-source-tensor-model.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";
import type { Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 } from "./nhm2-source-side-same-basis-tensor-authority.v1";
import type { Nhm2TileCounterpartConservationArtifact } from "./nhm2-tile-counterpart-conservation.v1";

export const NHM2_REGIONAL_TENSOR_PASS_PATH_HARNESS_CONTRACT_VERSION =
  "nhm2_regional_tensor_pass_path_harness/v1";

export const NHM2_REGIONAL_TENSOR_PASS_PATH_GATE_IDS = [
  "regional_material_source_tensors",
  "source_side_same_basis_authority",
  "wall_t00_residual",
  "regional_residuals",
  "conservation",
  "qei_worldline_dossier",
  "observer_robust_energy_conditions",
  "casimir_material_receipt",
  "coupled_closure_pass_candidate",
] as const;

export const NHM2_REGIONAL_TENSOR_PASS_PATH_GATE_STATUS_VALUES = [
  "pass",
  "review",
  "fail",
  "missing",
  "blocked",
] as const;

export type Nhm2RegionalTensorPassPathGateId =
  (typeof NHM2_REGIONAL_TENSOR_PASS_PATH_GATE_IDS)[number];
export type Nhm2RegionalTensorPassPathGateStatus =
  (typeof NHM2_REGIONAL_TENSOR_PASS_PATH_GATE_STATUS_VALUES)[number];

export type Nhm2RegionalTensorPassPathGateV1 = {
  gateId: Nhm2RegionalTensorPassPathGateId;
  status: Nhm2RegionalTensorPassPathGateStatus;
  pass: boolean;
  blockers: string[];
  warnings: string[];
  primaryMetric: string | null;
};

export type Nhm2RegionalTensorPassPathRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  requiredT00_SI: number | null;
  sourceT00_SI: number | null;
  relResidual: number | null;
  toleranceRelLInf: number | null;
  residualPass: boolean | null;
  sourceTensorAuthorityMode: string | null;
  sourceMaterialReceiptStatus: string | null;
  missingComponentIds: string[];
  blockers: string[];
  nextRequiredEvidence: string | null;
};

export type Nhm2RegionalTensorPassPathHarnessArtifactRefsV1 = {
  regionalMaterialSourceTensorModel: string | null;
  sourceSideSameBasisTensorAuthority: string | null;
  regionalSourceClosureEvidence: string | null;
  sourceClosurePassReadiness: string | null;
  conservation: string | null;
  qeiWorldlineDossier: string | null;
  observerRobustEnergyConditions: string | null;
  casimirMaterialReceipt: string | null;
  coupledClosurePassCandidate: string | null;
};

export type Nhm2SourceClosurePassReadinessPassPathLikeV1 = {
  schemaVersion?: "nhm2_source_closure_pass_readiness/v1";
  sourceClosurePassSignalAllowed?: boolean;
  firstRetirableBlocker?: string;
  preflightBlockers?: string[];
  regions?: Array<{
    regionId?: string;
    sourceClosurePassReady?: boolean;
    blockers?: string[];
    nextRequiredEvidence?: string;
  }>;
};

export type Nhm2RegionalTensorPassPathHarnessArtifactV1 = {
  contractVersion: typeof NHM2_REGIONAL_TENSOR_PASS_PATH_HARNESS_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  artifactRefs: Nhm2RegionalTensorPassPathHarnessArtifactRefsV1;
  regions: Nhm2RegionalTensorPassPathRegionV1[];
  gates: Nhm2RegionalTensorPassPathGateV1[];
  summary: {
    numericalPassPathReady: boolean;
    realRegionalSameBasisTensors: boolean;
    wallT00ClosurePass: boolean;
    regionalResidualsPass: boolean;
    conservationPass: boolean;
    qeiDossierPass: boolean;
    observerRobustPass: boolean;
    materialReceipted: boolean;
    coupledClosurePassCandidate: boolean;
    firstBlocker: string;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    doesNotValidatePhysicalSource: true;
    numericalPassPathIsNotPhysicalViability: true;
    scalarOrWallOnlyCannotPass: true;
    requiresSameRunArtifacts: true;
  };
};

export type BuildNhm2RegionalTensorPassPathHarnessInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  artifactRefs?: Partial<Nhm2RegionalTensorPassPathHarnessArtifactRefsV1> | null;
  regionalMaterialSourceTensorModel?: Nhm2RegionalMaterialSourceTensorModelV1 | null;
  sourceSideSameBasisTensorAuthority?: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null;
  regionalSourceClosureEvidence?: Nhm2RegionalSourceClosureEvidenceArtifact | null;
  sourceClosurePassReadiness?: Nhm2SourceClosurePassReadinessPassPathLikeV1 | null;
  conservation?: Nhm2TileCounterpartConservationArtifact | null;
  qeiWorldlineDossier?: Nhm2QeiWorldlineDossierV1 | null;
  observerRobustEnergyConditions?: Nhm2ObserverRobustEnergyConditionArtifactV1 | null;
  casimirMaterialReceipt?: CasimirMaterialReceiptV1 | null;
  coupledClosurePassCandidate?: Nhm2CoupledClosurePassCandidateArtifactV1 | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => asText(value))
        .filter((value): value is string => value != null),
    ),
  );

const gate = (input: {
  gateId: Nhm2RegionalTensorPassPathGateId;
  status: Nhm2RegionalTensorPassPathGateStatus;
  blockers?: Array<string | null | undefined>;
  warnings?: Array<string | null | undefined>;
  primaryMetric?: string | null;
}): Nhm2RegionalTensorPassPathGateV1 => ({
  gateId: input.gateId,
  status: input.status,
  pass: input.status === "pass",
  blockers: uniqueText(input.blockers ?? []),
  warnings: uniqueText(input.warnings ?? []),
  primaryMetric: asText(input.primaryMetric),
});

const firstNonPassingGateBlocker = (
  gates: Nhm2RegionalTensorPassPathGateV1[],
): string => {
  const first = gates.find((entry) => entry.status !== "pass");
  if (first == null) return "none";
  return first.blockers[0] ?? `${first.gateId}:non_pass`;
};

const refs = (
  input: Partial<Nhm2RegionalTensorPassPathHarnessArtifactRefsV1> | null | undefined,
): Nhm2RegionalTensorPassPathHarnessArtifactRefsV1 => ({
  regionalMaterialSourceTensorModel: input?.regionalMaterialSourceTensorModel ?? null,
  sourceSideSameBasisTensorAuthority: input?.sourceSideSameBasisTensorAuthority ?? null,
  regionalSourceClosureEvidence: input?.regionalSourceClosureEvidence ?? null,
  sourceClosurePassReadiness: input?.sourceClosurePassReadiness ?? null,
  conservation: input?.conservation ?? null,
  qeiWorldlineDossier: input?.qeiWorldlineDossier ?? null,
  observerRobustEnergyConditions: input?.observerRobustEnergyConditions ?? null,
  casimirMaterialReceipt: input?.casimirMaterialReceipt ?? null,
  coupledClosurePassCandidate: input?.coupledClosurePassCandidate ?? null,
});

const regionalMaterialGate = (
  model: Nhm2RegionalMaterialSourceTensorModelV1 | null | undefined,
): Nhm2RegionalTensorPassPathGateV1 => {
  if (model == null) {
    return gate({
      gateId: "regional_material_source_tensors",
      status: "missing",
      blockers: ["regional_material_source_tensor_model_missing"],
    });
  }
  const blockers: string[] = [];
  if (!model.summary.allRequiredRegionsPresent) {
    blockers.push(
      ...model.summary.missingRegionIds.map((regionId) => `regional_source_tensor_missing:${regionId}`),
    );
  }
  if (!model.summary.allRequiredRegionsFullTensor) {
    blockers.push("regional_full_tensor_authority_incomplete");
  }
  if (!model.summary.allRequiredRegionsMaterialReceipted) {
    blockers.push("regional_material_receipts_incomplete");
  }
  if (model.summary.proxyRegionIds.length > 0) {
    blockers.push(
      ...model.summary.proxyRegionIds.map((regionId) => `regional_source_tensor_proxy:${regionId}`),
    );
  }
  if (model.summary.blockerCount > 0) {
    blockers.push("regional_material_source_tensor_model_has_blockers");
  }
  return gate({
    gateId: "regional_material_source_tensors",
    status: blockers.length === 0 ? "pass" : "review",
    blockers,
    primaryMetric: `regions_full_tensor=${model.summary.allRequiredRegionsFullTensor}`,
  });
};

const sourceAuthorityGate = (
  authority: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null | undefined,
): Nhm2RegionalTensorPassPathGateV1 => {
  if (authority == null) {
    return gate({
      gateId: "source_side_same_basis_authority",
      status: "missing",
      blockers: ["source_side_same_basis_tensor_authority_missing"],
    });
  }
  const blockers: string[] = [];
  if (!authority.summary.hasWallAuthority) blockers.push("wall_source_authority_missing");
  if (!authority.summary.allRequiredRegionsAuthoritative) {
    blockers.push("required_regional_source_authority_incomplete");
  }
  if (authority.summary.anyMetricEcho) blockers.push("metric_echo_forbidden");
  if (authority.summary.anyProxy) blockers.push("source_authority_proxy_limited");
  if (authority.summary.anyMissingCounterpart) blockers.push("source_counterpart_missing");
  if (authority.summary.blockerCount > 0) {
    blockers.push("source_side_authority_has_blockers");
  }
  return gate({
    gateId: "source_side_same_basis_authority",
    status: authority.summary.anyMetricEcho ? "fail" : blockers.length === 0 ? "pass" : "review",
    blockers,
    primaryMetric: `all_required_regions_authoritative=${authority.summary.allRequiredRegionsAuthoritative}`,
  });
};

const regionalResidualGate = (
  evidence: Nhm2RegionalSourceClosureEvidenceArtifact | null | undefined,
): Nhm2RegionalTensorPassPathGateV1 => {
  if (evidence == null) {
    return gate({
      gateId: "regional_residuals",
      status: "missing",
      blockers: ["regional_source_closure_evidence_missing"],
    });
  }
  const blockers = evidence.regions.flatMap((region) =>
    region.status === "pass" && region.residuals.pass === true
      ? []
      : region.residuals.pass === true
        ? [`${region.regionId}:regional_scalar_T00_pass_authority_or_metadata_incomplete`]
        : [`${region.regionId}:regional_residual_not_pass`],
  );
  return gate({
    gateId: "regional_residuals",
    status:
      evidence.overallState === "pass" && blockers.length === 0
        ? "pass"
        : evidence.overallState === "fail"
          ? "fail"
          : "review",
    blockers: blockers.length > 0 ? blockers : evidence.reasonCodes,
    primaryMetric: `overallState=${evidence.overallState}`,
  });
};

const wallGate = (
  evidence: Nhm2RegionalSourceClosureEvidenceArtifact | null | undefined,
  readiness: Nhm2SourceClosurePassReadinessPassPathLikeV1 | null | undefined,
): Nhm2RegionalTensorPassPathGateV1 => {
  const wall = evidence?.regions.find((region) => region.regionId === "wall") ?? null;
  const wallReadiness =
    readiness?.regions?.find((region) => region.regionId === "wall") ?? null;
  if (wall == null) {
    return gate({
      gateId: "wall_t00_residual",
      status: "missing",
      blockers: ["wall_regional_evidence_missing"],
    });
  }
  const blockers = uniqueText([
    wall.residuals.pass === true ? null : "wall_T00_residual_not_pass",
    wall.status === "pass" ? null : `wall_regional_evidence_not_pass:${wall.status}`,
    wallReadiness == null ? "wall_source_closure_readiness_missing" : null,
    wallReadiness != null && wallReadiness.sourceClosurePassReady !== true
      ? "wall_source_closure_pass_readiness_false"
      : null,
    ...(wallReadiness?.blockers ?? []).map((blocker) => `wall:${blocker}`),
  ]);
  return gate({
    gateId: "wall_t00_residual",
    status: blockers.length === 0 ? "pass" : wall.status === "fail" ? "fail" : "review",
    blockers,
    primaryMetric:
      wall.residuals.relLInf == null
        ? null
        : `wall.relLInf=${wall.residuals.relLInf}`,
  });
};

const conservationGate = (
  conservation: Nhm2TileCounterpartConservationArtifact | null | undefined,
): Nhm2RegionalTensorPassPathGateV1 => {
  if (conservation == null) {
    return gate({
      gateId: "conservation",
      status: "missing",
      blockers: ["tile_counterpart_conservation_missing"],
    });
  }
  const blockers = conservation.regions.flatMap((region) =>
    region.status === "pass"
      ? []
      : region.blockers.length > 0
        ? region.blockers.map((blocker) => `${region.regionId}:${blocker}`)
        : [`${region.regionId}:conservation_not_pass`],
  );
  return gate({
    gateId: "conservation",
    status:
      conservation.overallState === "pass"
        ? "pass"
        : conservation.overallState === "fail"
          ? "fail"
          : conservation.overallState === "missing"
            ? "missing"
            : "review",
    blockers,
    primaryMetric: `overallState=${conservation.overallState}`,
  });
};

const qeiGate = (
  qei: Nhm2QeiWorldlineDossierV1 | null | undefined,
): Nhm2RegionalTensorPassPathGateV1 => {
  if (qei == null) {
    return gate({
      gateId: "qei_worldline_dossier",
      status: "missing",
      blockers: ["qei_worldline_dossier_missing"],
    });
  }
  const blockers = uniqueText([
    qei.summary.hasWallWorldline ? null : "qei_wall_worldline_missing",
    qei.summary.dossierComplete ? null : "qei_worldline_dossier_incomplete",
    qei.summary.allMarginsPass === true ? null : "qei_margins_not_all_pass",
    qei.summary.anyProxy ? "qei_worldline_dossier_proxy_values" : null,
    ...qei.worldlines.flatMap((worldline) =>
      worldline.blockers.map((blocker) => `${worldline.worldlineId}:${blocker}`),
    ),
  ]);
  return gate({
    gateId: "qei_worldline_dossier",
    status: blockers.length === 0 ? "pass" : qei.summary.anyProxy ? "review" : "blocked",
    blockers,
    primaryMetric: `has_wall_worldline=${qei.summary.hasWallWorldline}`,
  });
};

const observerGate = (
  observer: Nhm2ObserverRobustEnergyConditionArtifactV1 | null | undefined,
): Nhm2RegionalTensorPassPathGateV1 => {
  if (observer == null) {
    return gate({
      gateId: "observer_robust_energy_conditions",
      status: "missing",
      blockers: ["observer_robust_energy_conditions_missing"],
    });
  }
  const blockers = uniqueText([
    observer.summary.robustCheckComplete ? null : "observer_robust_check_incomplete",
    observer.summary.eulerianOnly ? "observer_scope_eulerian_only" : null,
    observer.summary.anyViolation ? "observer_energy_condition_violation" : null,
    ...observer.observerFamilies.flatMap((family) =>
      family.status === "pass"
        ? []
        : family.blockers.length > 0
          ? family.blockers.map((blocker) => `${family.familyId}:${blocker}`)
          : [`${family.familyId}:${family.status}`],
    ),
  ]);
  return gate({
    gateId: "observer_robust_energy_conditions",
    status:
      observer.summary.anyViolation
        ? "fail"
        : blockers.length === 0
          ? "pass"
          : "review",
    blockers,
    primaryMetric: `robustCheckComplete=${observer.summary.robustCheckComplete}`,
  });
};

const materialGate = (
  receipt: CasimirMaterialReceiptV1 | null | undefined,
): Nhm2RegionalTensorPassPathGateV1 => {
  if (receipt == null) {
    return gate({
      gateId: "casimir_material_receipt",
      status: "missing",
      blockers: ["casimir_material_receipt_missing"],
    });
  }
  return gate({
    gateId: "casimir_material_receipt",
    status:
      receipt.status === "material_receipted"
        ? "pass"
        : receipt.status === "blocked"
          ? "blocked"
          : "review",
    blockers:
      receipt.status === "material_receipted"
        ? []
        : [`casimir_material_receipt_status:${receipt.status}`],
    primaryMetric: `status=${receipt.status}`,
  });
};

const coupledGate = (
  coupled: Nhm2CoupledClosurePassCandidateArtifactV1 | null | undefined,
): Nhm2RegionalTensorPassPathGateV1 => {
  if (coupled == null) {
    return gate({
      gateId: "coupled_closure_pass_candidate",
      status: "missing",
      blockers: ["coupled_closure_pass_candidate_missing"],
    });
  }
  const failing = coupled.gates.filter((entry) => entry.status !== "pass");
  return gate({
    gateId: "coupled_closure_pass_candidate",
    status: coupled.summary.passCandidate
      ? "pass"
      : failing.some((entry) => entry.status === "fail" || entry.status === "blocked")
        ? "fail"
        : "review",
    blockers:
      failing.length === 0
        ? []
        : failing.flatMap((entry) =>
            entry.blockers.length > 0
              ? entry.blockers.map((blocker) => `${entry.gateId}:${blocker}`)
              : [`${entry.gateId}:non_pass`],
          ),
    primaryMetric: `passCandidate=${coupled.summary.passCandidate}`,
  });
};

const regionSummaries = (
  input: BuildNhm2RegionalTensorPassPathHarnessInput,
): Nhm2RegionalTensorPassPathRegionV1[] => {
  const modelByRegion = new Map(
    (input.regionalMaterialSourceTensorModel?.regions ?? []).map((region) => [
      region.regionId,
      region,
    ]),
  );
  const evidenceByRegion = new Map(
    (input.regionalSourceClosureEvidence?.regions ?? []).map((region) => [
      region.regionId,
      region,
    ]),
  );
  const readinessByRegion = new Map(
    (input.sourceClosurePassReadiness?.regions ?? [])
      .filter((region) =>
        NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
          region.regionId as Nhm2RegionalSourceClosureRegionId,
        ),
      )
      .map((region) => [region.regionId as Nhm2RegionalSourceClosureRegionId, region]),
  );
  return NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const model = modelByRegion.get(regionId) ?? null;
    const evidence = evidenceByRegion.get(regionId) ?? null;
    const readiness = readinessByRegion.get(regionId) ?? null;
    const blockers = uniqueText([
      ...(model?.blockers ?? []).map((blocker) => `source:${blocker}`),
      ...(evidence?.blockers ?? []).map((blocker) => `residual:${blocker}`),
      ...(readiness?.blockers ?? []).map((blocker) => `readiness:${blocker}`),
      evidence == null ? "regional_source_closure_evidence_missing" : null,
      model == null ? "regional_material_source_tensor_missing" : null,
      evidence?.residuals.pass === false ? "regional_residual_not_pass" : null,
    ]);
    return {
      regionId,
      requiredT00_SI: evidence?.metricRequired.tensor.T00 ?? null,
      sourceT00_SI: evidence?.tileEffectiveCounterpart.tensor.T00 ?? model?.tensor.T00 ?? null,
      relResidual: evidence?.residuals.relLInf ?? null,
      toleranceRelLInf: evidence?.residuals.toleranceRelLInf ?? null,
      residualPass: evidence?.residuals.pass ?? null,
      sourceTensorAuthorityMode:
        model?.tensorAuthorityMode ??
        evidence?.tileEffectiveCounterpart.tensorAuthorityMode ??
        null,
      sourceMaterialReceiptStatus: model?.materialReceiptStatus ?? null,
      missingComponentIds: model?.missingComponentIds ?? [],
      blockers,
      nextRequiredEvidence: asText(readiness?.nextRequiredEvidence),
    };
  });
};

export const buildNhm2RegionalTensorPassPathHarness = (
  input: BuildNhm2RegionalTensorPassPathHarnessInput,
): Nhm2RegionalTensorPassPathHarnessArtifactV1 => {
  const gates = [
    regionalMaterialGate(input.regionalMaterialSourceTensorModel),
    sourceAuthorityGate(input.sourceSideSameBasisTensorAuthority),
    wallGate(input.regionalSourceClosureEvidence, input.sourceClosurePassReadiness),
    regionalResidualGate(input.regionalSourceClosureEvidence),
    conservationGate(input.conservation),
    qeiGate(input.qeiWorldlineDossier),
    observerGate(input.observerRobustEnergyConditions),
    materialGate(input.casimirMaterialReceipt),
    coupledGate(input.coupledClosurePassCandidate),
  ];
  const gateById = new Map(gates.map((entry) => [entry.gateId, entry]));
  const getPass = (gateId: Nhm2RegionalTensorPassPathGateId) =>
    gateById.get(gateId)?.pass === true;
  const blockerCount = gates.reduce((sum, entry) => sum + entry.blockers.length, 0);
  const numericalPassPathReady = gates.every((entry) => entry.pass);
  const coupled = input.coupledClosurePassCandidate;
  const evidence = input.regionalSourceClosureEvidence;
  const model = input.regionalMaterialSourceTensorModel;
  return {
    contractVersion: NHM2_REGIONAL_TENSOR_PASS_PATH_HARNESS_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId:
      input.laneId ??
      coupled?.laneId ??
      evidence?.laneId ??
      model?.laneId ??
      "nhm2_shift_lapse",
    selectedProfileId:
      input.selectedProfileId ??
      coupled?.selectedProfileId ??
      evidence?.selectedProfileId ??
      model?.selectedProfileId ??
      "unknown",
    runId: input.runId ?? coupled?.runId ?? evidence?.runId ?? "unknown",
    artifactRefs: refs(input.artifactRefs),
    regions: regionSummaries(input),
    gates,
    summary: {
      numericalPassPathReady,
      realRegionalSameBasisTensors: getPass("regional_material_source_tensors"),
      wallT00ClosurePass: getPass("wall_t00_residual"),
      regionalResidualsPass: getPass("regional_residuals"),
      conservationPass: getPass("conservation"),
      qeiDossierPass: getPass("qei_worldline_dossier"),
      observerRobustPass: getPass("observer_robust_energy_conditions"),
      materialReceipted: getPass("casimir_material_receipt"),
      coupledClosurePassCandidate: getPass("coupled_closure_pass_candidate"),
      firstBlocker: firstNonPassingGateBlocker(gates),
      blockerCount,
    },
    claimBoundary: {
      diagnosticOnly: true,
      doesNotValidatePhysicalSource: true,
      numericalPassPathIsNotPhysicalViability: true,
      scalarOrWallOnlyCannotPass: true,
      requiresSameRunArtifacts: true,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isArtifactRefs = (
  value: unknown,
): value is Nhm2RegionalTensorPassPathHarnessArtifactRefsV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isNullableText(record.regionalMaterialSourceTensorModel) &&
    isNullableText(record.sourceSideSameBasisTensorAuthority) &&
    isNullableText(record.regionalSourceClosureEvidence) &&
    isNullableText(record.sourceClosurePassReadiness) &&
    isNullableText(record.conservation) &&
    isNullableText(record.qeiWorldlineDossier) &&
    isNullableText(record.observerRobustEnergyConditions) &&
    isNullableText(record.casimirMaterialReceipt) &&
    isNullableText(record.coupledClosurePassCandidate)
  );
};

const isGate = (value: unknown): value is Nhm2RegionalTensorPassPathGateV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    NHM2_REGIONAL_TENSOR_PASS_PATH_GATE_IDS.includes(
      record.gateId as Nhm2RegionalTensorPassPathGateId,
    ) &&
    NHM2_REGIONAL_TENSOR_PASS_PATH_GATE_STATUS_VALUES.includes(
      record.status as Nhm2RegionalTensorPassPathGateStatus,
    ) &&
    typeof record.pass === "boolean" &&
    record.pass === (record.status === "pass") &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings) &&
    (record.primaryMetric === null || typeof record.primaryMetric === "string")
  );
};

const isRegion = (value: unknown): value is Nhm2RegionalTensorPassPathRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
      record.regionId as Nhm2RegionalSourceClosureRegionId,
    ) &&
    (record.requiredT00_SI === null || typeof record.requiredT00_SI === "number") &&
    (record.sourceT00_SI === null || typeof record.sourceT00_SI === "number") &&
    (record.relResidual === null || typeof record.relResidual === "number") &&
    (record.toleranceRelLInf === null || typeof record.toleranceRelLInf === "number") &&
    (record.residualPass === null || typeof record.residualPass === "boolean") &&
    (record.sourceTensorAuthorityMode === null || typeof record.sourceTensorAuthorityMode === "string") &&
    (record.sourceMaterialReceiptStatus === null || typeof record.sourceMaterialReceiptStatus === "string") &&
    isStringArray(record.missingComponentIds) &&
    isStringArray(record.blockers) &&
    (record.nextRequiredEvidence === null || typeof record.nextRequiredEvidence === "string")
  );
};

export const isNhm2RegionalTensorPassPathHarnessArtifact = (
  value: unknown,
): value is Nhm2RegionalTensorPassPathHarnessArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_REGIONAL_TENSOR_PASS_PATH_HARNESS_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    isArtifactRefs(record.artifactRefs) &&
    Array.isArray(record.regions) &&
    record.regions.every(isRegion) &&
    new Set(
      (record.regions as Nhm2RegionalTensorPassPathRegionV1[]).map(
        (region) => region.regionId,
      ),
    ).size === NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.length &&
    NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every((regionId) =>
      (record.regions as Nhm2RegionalTensorPassPathRegionV1[]).some(
        (region) => region.regionId === regionId,
      ),
    ) &&
    Array.isArray(record.gates) &&
    record.gates.every(isGate) &&
    new Set(
      (record.gates as Nhm2RegionalTensorPassPathGateV1[]).map(
        (entry) => entry.gateId,
      ),
    ).size === NHM2_REGIONAL_TENSOR_PASS_PATH_GATE_IDS.length &&
    NHM2_REGIONAL_TENSOR_PASS_PATH_GATE_IDS.every((gateId) =>
      (record.gates as Nhm2RegionalTensorPassPathGateV1[]).some(
        (entry) => entry.gateId === gateId,
      ),
    ) &&
    summary != null &&
    typeof summary.numericalPassPathReady === "boolean" &&
    typeof summary.realRegionalSameBasisTensors === "boolean" &&
    typeof summary.wallT00ClosurePass === "boolean" &&
    typeof summary.regionalResidualsPass === "boolean" &&
    typeof summary.conservationPass === "boolean" &&
    typeof summary.qeiDossierPass === "boolean" &&
    typeof summary.observerRobustPass === "boolean" &&
    typeof summary.materialReceipted === "boolean" &&
    typeof summary.coupledClosurePassCandidate === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.doesNotValidatePhysicalSource === true &&
    claimBoundary.numericalPassPathIsNotPhysicalViability === true &&
    claimBoundary.scalarOrWallOnlyCannotPass === true &&
    claimBoundary.requiresSameRunArtifacts === true
  );
};
