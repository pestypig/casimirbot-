import type { CasimirMaterialReceiptV1 } from "./casimir-material-receipt.v1";
import type { Nhm2ObserverRobustEnergyConditionArtifactV1 } from "./nhm2-observer-robust-energy-conditions.v1";
import type { Nhm2QeiWorldlineDossierV1 } from "./nhm2-qei-worldline-dossier.v1";
import type { Nhm2RegionalSourceClosureEvidenceArtifact } from "./nhm2-regional-source-closure-evidence.v1";
import {
  getNhm2AtlasConsumerHash,
  getNhm2RegionalSupportFunctionAtlasHash,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "./nhm2-regional-support-function-atlas.v1";
import type { Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 } from "./nhm2-source-side-same-basis-tensor-authority.v1";
import type { Nhm2TileCounterpartConservationArtifact } from "./nhm2-tile-counterpart-conservation.v1";

export const NHM2_COUPLED_CLOSURE_PASS_CANDIDATE_CONTRACT_VERSION =
  "nhm2_coupled_closure_pass_candidate/v1";

export const NHM2_COUPLED_CLOSURE_GATE_IDS = [
  "regional_support_function_atlas",
  "regional_source_tensor_authority",
  "source_closure_readiness",
  "regional_residuals",
  "conservation",
  "qei_worldline_dossier",
  "observer_robust_energy_conditions",
  "casimir_material_receipt",
] as const;

export const NHM2_COUPLED_CLOSURE_GATE_STATUS_VALUES = [
  "pass",
  "review",
  "fail",
  "missing",
  "blocked",
] as const;

export type Nhm2CoupledClosureGateId =
  (typeof NHM2_COUPLED_CLOSURE_GATE_IDS)[number];
export type Nhm2CoupledClosureGateStatus =
  (typeof NHM2_COUPLED_CLOSURE_GATE_STATUS_VALUES)[number];

export type Nhm2CoupledClosureGateV1 = {
  gateId: Nhm2CoupledClosureGateId;
  status: Nhm2CoupledClosureGateStatus;
  pass: boolean;
  blockers: string[];
  warnings: string[];
  primaryMetric: string | null;
};

export type Nhm2CoupledClosurePassCandidateArtifactRefsV1 = {
  regionalSupportFunctionAtlas: string | null;
  regionalMaterialSourceTensorModel: string | null;
  tileLocalSourceElements: string | null;
  tileEffectiveCounterpart: string | null;
  sourceSideSameBasisTensorAuthority: string | null;
  regionalSourceClosureEvidence: string | null;
  sourceClosurePassReadiness: string | null;
  conservation: string | null;
  qeiWorldlineDossier: string | null;
  observerRobustEnergyConditions: string | null;
  casimirMaterialReceipt: string | null;
};

export type Nhm2CoupledClosurePassCandidateArtifactV1 = {
  contractVersion: typeof NHM2_COUPLED_CLOSURE_PASS_CANDIDATE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  atlasRef?: string | null;
  atlasHash?: string | null;
  artifactRefs: Nhm2CoupledClosurePassCandidateArtifactRefsV1;
  gates: Nhm2CoupledClosureGateV1[];
  summary: {
    passCandidate: boolean;
    sourceClosurePassSignalAllowed: boolean;
    allRequiredRegionsAuthoritative: boolean;
    wallAuthorityPresent: boolean;
    wallClosureReady: boolean;
    regionalResidualsPass: boolean;
    conservationPass: boolean;
    qeiDossierPass: boolean;
    observerRobustPass: boolean;
    materialReceipted: boolean;
    atlasConsumerCongruencePass: boolean;
    firstBlocker: string;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    doesNotRecomputePhysics: true;
    requiresSameRunSameChartEvidence: true;
  };
};

export type Nhm2SourceClosurePassReadinessLikeV1 = {
  schemaVersion: "nhm2_source_closure_pass_readiness/v1";
  runId: string;
  laneId: string;
  selectedProfileId: string;
  sourceClosurePassSignalAllowed: boolean;
  firstRetirableBlocker: string;
  preflightBlockers: string[];
  regions: Array<{
    regionId: string;
    sourceClosurePassReady: boolean;
    blockers: string[];
  }>;
};

export type BuildNhm2CoupledClosurePassCandidateInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  artifactRefs?: Partial<Nhm2CoupledClosurePassCandidateArtifactRefsV1> | null;
  regionalSupportFunctionAtlas?: Nhm2RegionalSupportFunctionAtlasV1 | null;
  sourceAuthority?: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null;
  sourceClosurePassReadiness?: Nhm2SourceClosurePassReadinessLikeV1 | null;
  regionalEvidence?: Nhm2RegionalSourceClosureEvidenceArtifact | null;
  conservation?: Nhm2TileCounterpartConservationArtifact | null;
  qeiWorldlineDossier?: Nhm2QeiWorldlineDossierV1 | null;
  observerRobustEnergyConditions?: Nhm2ObserverRobustEnergyConditionArtifactV1 | null;
  casimirMaterialReceipt?: CasimirMaterialReceiptV1 | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => asText(value))
        .filter((value): value is string => value != null),
    ),
  );

const gate = (input: {
  gateId: Nhm2CoupledClosureGateId;
  status: Nhm2CoupledClosureGateStatus;
  blockers?: Array<string | null | undefined>;
  warnings?: Array<string | null | undefined>;
  primaryMetric?: string | null;
}): Nhm2CoupledClosureGateV1 => ({
  gateId: input.gateId,
  status: input.status,
  pass: input.status === "pass",
  blockers: uniqueText(input.blockers ?? []),
  warnings: uniqueText(input.warnings ?? []),
  primaryMetric: asText(input.primaryMetric),
});

const atlasGate = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1 | null | undefined,
  input: BuildNhm2CoupledClosurePassCandidateInput,
): Nhm2CoupledClosureGateV1 => {
  if (atlas == null) {
    return gate({
      gateId: "regional_support_function_atlas",
      status: "missing",
      blockers: ["regional_support_function_atlas_missing"],
    });
  }
  const atlasHash = getNhm2RegionalSupportFunctionAtlasHash(atlas);
  const consumers: Array<[string, unknown]> = [
    ["regional_source_closure_evidence", input.regionalEvidence],
    ["tile_counterpart_conservation", input.conservation],
    ["qei_worldline_dossier", input.qeiWorldlineDossier],
    ["observer_robust_energy_conditions", input.observerRobustEnergyConditions],
  ];
  const blockers = uniqueText([
    atlas.eligibility.atlasEligibleForClosureHarness
      ? null
      : "regional_support_function_atlas_not_eligible",
    ...consumers.flatMap(([label, artifact]) => {
      if (artifact == null) return [];
      const consumerHash = getNhm2AtlasConsumerHash(artifact);
      if (consumerHash == null) return [`${label}:atlas_hash_missing`];
      return consumerHash === atlasHash ? [] : [`${label}:atlas_hash_mismatch`];
    }),
  ]);
  return gate({
    gateId: "regional_support_function_atlas",
    status: blockers.length === 0 ? "pass" : "review",
    blockers,
    warnings:
      atlas.derivativeSupport.covariantDerivativeSupportAvailable
        ? []
        : ["atlas_covariant_derivative_support_not_available"],
    primaryMetric: `atlasHash=${atlasHash ?? "missing"}`,
  });
};

const sourceAuthorityGate = (
  artifact: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null | undefined,
): Nhm2CoupledClosureGateV1 => {
  if (artifact == null) {
    return gate({
      gateId: "regional_source_tensor_authority",
      status: "missing",
      blockers: ["source_side_same_basis_tensor_authority_missing"],
    });
  }
  const blockers: string[] = [];
  if (!artifact.summary.hasWallAuthority) blockers.push("wall_source_authority_missing");
  if (!artifact.summary.allRequiredRegionsAuthoritative) {
    blockers.push("required_regional_source_authority_incomplete");
  }
  if (artifact.summary.anyMetricEcho) blockers.push("metric_echo_forbidden");
  if (artifact.summary.anyProxy) blockers.push("proxy_source_authority");
  if (artifact.summary.anyMissingCounterpart) blockers.push("source_counterpart_missing");
  blockers.push(
    ...artifact.regions.flatMap((region) =>
      region.status === "authoritative_same_basis"
        ? []
        : region.blockers.map((blocker) => `${region.regionId}:${blocker}`),
    ),
  );
  return gate({
    gateId: "regional_source_tensor_authority",
    status: artifact.summary.anyMetricEcho
      ? "fail"
      : blockers.length === 0
        ? "pass"
        : "review",
    blockers,
    primaryMetric: `regions_authoritative=${artifact.summary.allRequiredRegionsAuthoritative}`,
  });
};

const sourceClosureGate = (
  artifact: Nhm2SourceClosurePassReadinessLikeV1 | null | undefined,
): Nhm2CoupledClosureGateV1 => {
  if (artifact == null) {
    return gate({
      gateId: "source_closure_readiness",
      status: "missing",
      blockers: ["source_closure_pass_readiness_missing"],
    });
  }
  const blockers = uniqueText([
    ...artifact.preflightBlockers,
    ...artifact.regions.flatMap((region) =>
      region.sourceClosurePassReady
        ? []
        : region.blockers.map((blocker) => `${region.regionId}:${blocker}`),
    ),
    artifact.sourceClosurePassSignalAllowed ? null : artifact.firstRetirableBlocker,
  ]);
  return gate({
    gateId: "source_closure_readiness",
    status: artifact.sourceClosurePassSignalAllowed ? "pass" : "review",
    blockers,
    primaryMetric: `sourceClosurePassSignalAllowed=${artifact.sourceClosurePassSignalAllowed}`,
  });
};

const regionalResidualsGate = (
  artifact: Nhm2RegionalSourceClosureEvidenceArtifact | null | undefined,
): Nhm2CoupledClosureGateV1 => {
  if (artifact == null) {
    return gate({
      gateId: "regional_residuals",
      status: "missing",
      blockers: ["regional_source_closure_evidence_missing"],
    });
  }
  const blockers = artifact.reasonCodes.length > 0 ? artifact.reasonCodes : [];
  const failedRegion = artifact.regions.find(
    (region) => region.status === "fail" || region.residuals.pass === false,
  );
  return gate({
    gateId: "regional_residuals",
    status:
      artifact.overallState === "pass" &&
      artifact.regions.every((region) => region.status === "pass" && region.residuals.pass === true)
        ? "pass"
        : artifact.overallState === "fail" || failedRegion != null
          ? "fail"
          : "review",
    blockers,
    primaryMetric:
      failedRegion == null
        ? `overallState=${artifact.overallState}`
        : `${failedRegion.regionId}.relLInf=${failedRegion.residuals.relLInf}`,
  });
};

const conservationGate = (
  artifact: Nhm2TileCounterpartConservationArtifact | null | undefined,
): Nhm2CoupledClosureGateV1 => {
  if (artifact == null) {
    return gate({
      gateId: "conservation",
      status: "missing",
      blockers: ["tile_counterpart_conservation_missing"],
    });
  }
  return gate({
    gateId: "conservation",
    status:
      artifact.overallState === "pass"
        ? "pass"
        : artifact.overallState === "fail"
          ? "fail"
          : artifact.overallState === "missing"
            ? "missing"
            : "review",
    blockers: artifact.reasonCodes,
    primaryMetric: `overallState=${artifact.overallState}`,
  });
};

const qeiGate = (
  artifact: Nhm2QeiWorldlineDossierV1 | null | undefined,
): Nhm2CoupledClosureGateV1 => {
  if (artifact == null) {
    return gate({
      gateId: "qei_worldline_dossier",
      status: "missing",
      blockers: ["qei_worldline_dossier_missing"],
    });
  }
  const blockers = uniqueText([
    artifact.summary.hasWallWorldline ? null : "wall_worldline_missing",
    artifact.summary.dossierComplete ? null : "qei_worldline_dossier_incomplete",
    artifact.summary.allMarginsPass === false ? "qei_margin_failed" : null,
    artifact.summary.allMarginsPass == null ? "qei_margin_status_missing" : null,
    artifact.summary.anyProxy ? "qei_proxy_evidence_present" : null,
    ...artifact.worldlines.flatMap((worldline) =>
      worldline.blockers.map((blocker) => `${worldline.worldlineId}:${blocker}`),
    ),
  ]);
  return gate({
    gateId: "qei_worldline_dossier",
    status:
      artifact.summary.dossierComplete &&
      artifact.summary.hasWallWorldline &&
      artifact.summary.allMarginsPass === true &&
      !artifact.summary.anyProxy
        ? "pass"
        : artifact.summary.allMarginsPass === false
          ? "fail"
          : "review",
    blockers,
    primaryMetric: `dossierComplete=${artifact.summary.dossierComplete}`,
  });
};

const observerGate = (
  artifact: Nhm2ObserverRobustEnergyConditionArtifactV1 | null | undefined,
): Nhm2CoupledClosureGateV1 => {
  if (artifact == null) {
    return gate({
      gateId: "observer_robust_energy_conditions",
      status: "missing",
      blockers: ["observer_robust_energy_conditions_missing"],
    });
  }
  const status: Nhm2CoupledClosureGateStatus = artifact.summary.anyViolation
    ? "fail"
    : artifact.summary.robustCheckComplete && !artifact.summary.eulerianOnly
      ? "pass"
      : "review";
  const blockers = status === "pass" ? [] : uniqueText([
    artifact.summary.robustCheckComplete
      ? null
      : "observer_robust_energy_condition_check_incomplete",
    artifact.summary.eulerianOnly ? "observer_scope_eulerian_only" : null,
    artifact.summary.anyViolation ? "observer_energy_condition_violation" : null,
    ...artifact.observerFamilies.flatMap((family) =>
      family.status === "pass"
        ? []
      : family.blockers.map((blocker) => `${family.familyId}:${blocker}`),
    ),
  ]);
  return gate({
    gateId: "observer_robust_energy_conditions",
    status,
    blockers,
    warnings:
      status === "pass"
        ? artifact.observerFamilies.flatMap((family) =>
            family.status === "not_run" || family.status === "missing"
              ? [`${family.familyId}:${family.status}`]
              : [],
          )
        : [],
    primaryMetric: `missedViolationRisk=${artifact.summary.missedViolationRisk}`,
  });
};

const materialReceiptGate = (
  artifact: CasimirMaterialReceiptV1 | null | undefined,
): Nhm2CoupledClosureGateV1 => {
  if (artifact == null) {
    return gate({
      gateId: "casimir_material_receipt",
      status: "missing",
      blockers: ["casimir_material_receipt_missing"],
    });
  }
  return gate({
    gateId: "casimir_material_receipt",
    status:
      artifact.status === "material_receipted"
        ? "pass"
        : artifact.status === "blocked"
          ? "blocked"
          : artifact.status === "missing"
            ? "missing"
            : "review",
    blockers:
      artifact.status === "material_receipted"
        ? []
        : [`casimir_material_receipt_status_${artifact.status}`],
    primaryMetric: `status=${artifact.status}`,
  });
};

const defaultRefs = (
  refs: Partial<Nhm2CoupledClosurePassCandidateArtifactRefsV1> | null | undefined,
): Nhm2CoupledClosurePassCandidateArtifactRefsV1 => ({
  regionalSupportFunctionAtlas: refs?.regionalSupportFunctionAtlas ?? null,
  regionalMaterialSourceTensorModel: refs?.regionalMaterialSourceTensorModel ?? null,
  tileLocalSourceElements: refs?.tileLocalSourceElements ?? null,
  tileEffectiveCounterpart: refs?.tileEffectiveCounterpart ?? null,
  sourceSideSameBasisTensorAuthority: refs?.sourceSideSameBasisTensorAuthority ?? null,
  regionalSourceClosureEvidence: refs?.regionalSourceClosureEvidence ?? null,
  sourceClosurePassReadiness: refs?.sourceClosurePassReadiness ?? null,
  conservation: refs?.conservation ?? null,
  qeiWorldlineDossier: refs?.qeiWorldlineDossier ?? null,
  observerRobustEnergyConditions: refs?.observerRobustEnergyConditions ?? null,
  casimirMaterialReceipt: refs?.casimirMaterialReceipt ?? null,
});

const firstIdentity = (
  input: BuildNhm2CoupledClosurePassCandidateInput,
  field: "runId" | "laneId" | "selectedProfileId",
): string | null => {
  const artifacts = [
    input.regionalEvidence,
    input.sourceClosurePassReadiness,
    input.conservation,
    input.sourceAuthority,
    input.qeiWorldlineDossier,
    input.observerRobustEnergyConditions,
  ];
  for (const artifact of artifacts) {
    const value = asText(isRecord(artifact) ? artifact[field] : null);
    if (value != null) return value;
  }
  return null;
};

export const buildNhm2CoupledClosurePassCandidate = (
  input: BuildNhm2CoupledClosurePassCandidateInput,
): Nhm2CoupledClosurePassCandidateArtifactV1 => {
  const gates = [
    atlasGate(input.regionalSupportFunctionAtlas, input),
    sourceAuthorityGate(input.sourceAuthority),
    sourceClosureGate(input.sourceClosurePassReadiness),
    regionalResidualsGate(input.regionalEvidence),
    conservationGate(input.conservation),
    qeiGate(input.qeiWorldlineDossier),
    observerGate(input.observerRobustEnergyConditions),
    materialReceiptGate(input.casimirMaterialReceipt),
  ];
  const blockerCount = gates.reduce((sum, entry) => sum + entry.blockers.length, 0);
  const firstNonPass = gates.find((entry) => entry.status !== "pass");
  const passCandidate = gates.every((entry) => entry.pass);
  const sourceAuthority = input.sourceAuthority?.summary;
  const readiness = input.sourceClosurePassReadiness;
  const qei = input.qeiWorldlineDossier?.summary;
  const observer = input.observerRobustEnergyConditions?.summary;
  return {
    contractVersion: NHM2_COUPLED_CLOSURE_PASS_CANDIDATE_CONTRACT_VERSION,
    generatedAt: asText(input.generatedAt) ?? new Date(0).toISOString(),
    laneId: asText(input.laneId) ?? firstIdentity(input, "laneId") ?? "nhm2_shift_lapse",
    selectedProfileId:
      asText(input.selectedProfileId) ?? firstIdentity(input, "selectedProfileId") ?? "unknown",
    runId: asText(input.runId) ?? firstIdentity(input, "runId") ?? "unknown",
    ...(input.regionalSupportFunctionAtlas == null
      ? {}
      : {
          atlasRef: input.artifactRefs?.regionalSupportFunctionAtlas ?? null,
          atlasHash: getNhm2RegionalSupportFunctionAtlasHash(
            input.regionalSupportFunctionAtlas,
          ),
        }),
    artifactRefs: defaultRefs(input.artifactRefs),
    gates,
    summary: {
      passCandidate,
      sourceClosurePassSignalAllowed:
        readiness?.sourceClosurePassSignalAllowed === true,
      allRequiredRegionsAuthoritative:
        sourceAuthority?.allRequiredRegionsAuthoritative === true,
      wallAuthorityPresent: sourceAuthority?.hasWallAuthority === true,
      wallClosureReady:
        readiness?.regions.find((region) => region.regionId === "wall")
          ?.sourceClosurePassReady === true,
      regionalResidualsPass:
        input.regionalEvidence?.overallState === "pass" &&
        input.regionalEvidence.regions.every((region) => region.residuals.pass === true),
      conservationPass: input.conservation?.overallState === "pass",
      qeiDossierPass:
        qei?.dossierComplete === true &&
        qei.hasWallWorldline === true &&
        qei.allMarginsPass === true &&
        qei.anyProxy === false,
      observerRobustPass:
        observer?.robustCheckComplete === true &&
        observer.eulerianOnly === false &&
        observer.anyViolation === false,
      materialReceipted: input.casimirMaterialReceipt?.status === "material_receipted",
      atlasConsumerCongruencePass:
        gates.find((entry) => entry.gateId === "regional_support_function_atlas")
          ?.pass === true,
      firstBlocker: firstNonPass?.blockers[0] ?? firstNonPass?.gateId ?? "none",
      blockerCount,
    },
    claimBoundary: {
      diagnosticOnly: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      doesNotRecomputePhysics: true,
      requiresSameRunSameChartEvidence: true,
    },
  };
};

const isNullableText = (value: unknown): value is string | null =>
  value === null || asText(value) != null;

const isGateId = (value: unknown): value is Nhm2CoupledClosureGateId =>
  NHM2_COUPLED_CLOSURE_GATE_IDS.includes(value as Nhm2CoupledClosureGateId);

const isGateStatus = (value: unknown): value is Nhm2CoupledClosureGateStatus =>
  NHM2_COUPLED_CLOSURE_GATE_STATUS_VALUES.includes(
    value as Nhm2CoupledClosureGateStatus,
  );

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => asText(entry) != null);

const isGate = (value: unknown): value is Nhm2CoupledClosureGateV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isGateId(record.gateId) &&
    isGateStatus(record.status) &&
    record.pass === (record.status === "pass") &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings) &&
    isNullableText(record.primaryMetric)
  );
};

export const isNhm2CoupledClosurePassCandidateArtifact = (
  value: unknown,
): value is Nhm2CoupledClosurePassCandidateArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const refs = isRecord(record?.artifactRefs) ? record?.artifactRefs : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  if (
    record == null ||
    record.contractVersion !== NHM2_COUPLED_CLOSURE_PASS_CANDIDATE_CONTRACT_VERSION ||
    asText(record.generatedAt) == null ||
    asText(record.laneId) == null ||
    asText(record.selectedProfileId) == null ||
    asText(record.runId) == null ||
    !(record.atlasRef === undefined || isNullableText(record.atlasRef)) ||
    !(record.atlasHash === undefined || isNullableText(record.atlasHash)) ||
    refs == null ||
    !isNullableText(refs.regionalSupportFunctionAtlas) ||
    !isNullableText(refs.regionalMaterialSourceTensorModel) ||
    !isNullableText(refs.tileLocalSourceElements) ||
    !isNullableText(refs.tileEffectiveCounterpart) ||
    !isNullableText(refs.sourceSideSameBasisTensorAuthority) ||
    !isNullableText(refs.regionalSourceClosureEvidence) ||
    !isNullableText(refs.sourceClosurePassReadiness) ||
    !isNullableText(refs.conservation) ||
    !isNullableText(refs.qeiWorldlineDossier) ||
    !isNullableText(refs.observerRobustEnergyConditions) ||
    !isNullableText(refs.casimirMaterialReceipt) ||
    !Array.isArray(record.gates) ||
    !record.gates.every(isGate) ||
    summary == null ||
    typeof summary.passCandidate !== "boolean" ||
    typeof summary.sourceClosurePassSignalAllowed !== "boolean" ||
    typeof summary.allRequiredRegionsAuthoritative !== "boolean" ||
    typeof summary.wallAuthorityPresent !== "boolean" ||
    typeof summary.wallClosureReady !== "boolean" ||
    typeof summary.regionalResidualsPass !== "boolean" ||
    typeof summary.conservationPass !== "boolean" ||
    typeof summary.qeiDossierPass !== "boolean" ||
    typeof summary.observerRobustPass !== "boolean" ||
    typeof summary.materialReceipted !== "boolean" ||
    typeof summary.atlasConsumerCongruencePass !== "boolean" ||
    asText(summary.firstBlocker) == null ||
    typeof summary.blockerCount !== "number" ||
    !Number.isFinite(summary.blockerCount) ||
    claimBoundary?.diagnosticOnly !== true ||
    claimBoundary?.physicalViabilityClaimAllowed !== false ||
    claimBoundary?.transportClaimAllowed !== false ||
    claimBoundary?.doesNotRecomputePhysics !== true ||
    claimBoundary?.requiresSameRunSameChartEvidence !== true
  ) {
    return false;
  }
  const gates = record.gates as Nhm2CoupledClosureGateV1[];
  const gateIds = new Set(gates.map((entry) => entry.gateId));
  if (gateIds.size !== NHM2_COUPLED_CLOSURE_GATE_IDS.length) return false;
  for (const gateId of NHM2_COUPLED_CLOSURE_GATE_IDS) {
    if (!gateIds.has(gateId)) return false;
  }
  if (summary.passCandidate !== gates.every((entry) => entry.status === "pass")) {
    return false;
  }
  return true;
};
