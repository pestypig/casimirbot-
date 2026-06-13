import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2ReferenceRunArtifact,
  type Nhm2ReferenceRunArtifact,
} from "../../shared/contracts/nhm2-reference-run.v1";
import { isNhm2QeiDossierArtifact } from "../../shared/contracts/nhm2-qei-dossier.v1";
import {
  isNhm2QeiWorldlineDossier,
  type Nhm2QeiWorldlineDossierV1,
} from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  isNhm2RegionalSourceClosureEvidenceArtifact,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2TileEffectiveCounterpartArtifact,
} from "../../shared/contracts/nhm2-tile-effective-counterpart.v1";

export const NHM2_REFERENCE_RUN_VALIDATION_ARTIFACT_ID =
  "nhm2_reference_run_validation";
export const NHM2_REFERENCE_RUN_VALIDATION_SCHEMA_VERSION =
  "nhm2_reference_run_validation/v1";

export const NHM2_REFERENCE_RUN_GATE_IDS = [
  "GATE_CLAIM_LOCK",
  "GATE_NO_LATEST_ALIAS",
  "GATE_PROFILE_MATCH",
  "GATE_OBSERVER_ARTIFACT_CONSISTENCY",
  "GATE_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS",
  "GATE_REGIONAL_SOURCE_CLOSURE_COUNTERPART",
  "GATE_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT",
  "GATE_TILE_EFFECTIVE_COUNTERPART_ARTIFACT",
  "GATE_TILE_COUNTERPART_NOT_METRIC_ECHO",
  "GATE_TILE_COUNTERPART_FULL_TENSOR_AUTHORITY",
  "GATE_TILE_COUNTERPART_QEI_LINKAGE",
  "GATE_SOURCE_CLOSURE_EVIDENCE_USES_COUNTERPART",
  "GATE_FULL_TENSOR_WHERE_CLAIMED",
  "GATE_QEI_DOSSIER_PRESENT",
  "GATE_REPRODUCIBILITY_FIELDS",
  "GATE_LITERATURE_CLAIM_MAP",
  "GATE_CERTIFICATE_DOES_NOT_OVERRIDE_REVIEW",
] as const;

export type Nhm2ReferenceRunGateId =
  (typeof NHM2_REFERENCE_RUN_GATE_IDS)[number];
export type Nhm2ReferenceRunValidationState = "pass" | "review" | "fail";

export type Nhm2ReferenceRunValidationGate = {
  gateId: Nhm2ReferenceRunGateId;
  state: Nhm2ReferenceRunValidationState;
  reasonCodes: string[];
};

export type Nhm2ReferenceRunValidationArtifact = {
  artifactId: typeof NHM2_REFERENCE_RUN_VALIDATION_ARTIFACT_ID;
  schemaVersion: typeof NHM2_REFERENCE_RUN_VALIDATION_SCHEMA_VERSION;
  runId: string;
  overallState: Nhm2ReferenceRunValidationState;
  gates: Nhm2ReferenceRunValidationGate[];
  claimTierAllowed: "diagnostic" | "reduced-order" | "certified" | null;
  validationClaimAllowed: false;
  adapterVerificationStatus:
    | "pass"
    | "fail"
    | "blocked_infra_endpoint_unavailable"
    | "not_run"
    | "unknown";
  adapterVerificationPhysicsImpact: "none_claimed";
};

export type Nhm2AdapterVerificationStatus =
  Nhm2ReferenceRunValidationArtifact["adapterVerificationStatus"];

export type LiteratureClaimMap = {
  schemaVersion: "nhm2_literature_claim_map/v1";
  claimPolicy: {
    externalTheoryDoesNotValidateNHM2: boolean;
    webOrPaperCitationRequiredForExternalTheoryClaims: boolean;
    noPredictiveLanguageFromExperimentalMathOnly: boolean;
  };
  sources: Array<{
    sourceId: string;
    title: string;
    url: string;
    versionNote?: string;
    claimSupport: string[];
    nonSupport: string[];
  }>;
};

type ObserverConsistencyInput = {
  fullLoopObserverSection: Record<string, unknown> | null;
  detailedObserverArtifact: Record<string, unknown> | null;
  publicLatestReadable?: boolean | null;
  localLatestReadable?: boolean | null;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readJsonIfExists = (path: string): unknown | null => {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    return null;
  }
};

const sha256FileIfExists = (path: string): string | null => {
  if (!existsSync(path)) return null;
  return createHash("sha256").update(readFileSync(path)).digest("hex");
};

const resolveRepoPath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const gate = (
  gateId: Nhm2ReferenceRunGateId,
  state: Nhm2ReferenceRunValidationState,
  reasonCodes: string[] = [],
): Nhm2ReferenceRunValidationGate => ({ gateId, state, reasonCodes });

const aggregate = (
  gates: Nhm2ReferenceRunValidationGate[],
): Nhm2ReferenceRunValidationState => {
  if (gates.some((entry) => entry.state === "fail")) return "fail";
  if (gates.some((entry) => entry.state === "review")) return "review";
  return "pass";
};

const getNested = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>((cursor, part) => asRecord(cursor)?.[part], value);

const REQUIRED_REGIONAL_SOURCE_CLOSURE_REGIONS = [
  "hull",
  "wall",
  "exterior_shell",
] as const;

const FULL_TENSOR_COMPONENTS = [
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

const FULL_TENSOR_LOWER_COMPONENTS = [
  "T10",
  "T20",
  "T30",
  "T21",
  "T31",
  "T32",
] as const;

const extractObserverConditionStatus = (
  artifact: Record<string, unknown> | null,
  family: "metric_required" | "tile_effective",
  condition: "wec" | "nec" | "dec" | "sec",
): string | null => {
  const direct = asString(getNested(artifact, [family, "conditions", condition, "status"]));
  if (direct != null) return direct;
  return asString(getNested(artifact, [family, "observerSummary", condition, "status"]));
};

const extractReasonCodes = (artifact: Record<string, unknown> | null): string[] =>
  Array.isArray(artifact?.reasonCodes)
    ? artifact.reasonCodes.filter((entry): entry is string => typeof entry === "string")
    : [];

const extractProfileId = (artifact: Record<string, unknown> | null): string | null =>
  asString(artifact?.shiftLapseProfileId) ??
  asString(artifact?.selectedProfileId) ??
  asString(artifact?.profileId);

export const evaluateObserverConsistency = (
  input: ObserverConsistencyInput,
): Nhm2ReferenceRunValidationGate => {
  const fullLoopState = asString(input.fullLoopObserverSection?.state);
  const detailedStatus = asString(input.detailedObserverArtifact?.status);
  const reasons = new Set<string>();

  if (input.publicLatestReadable === false && input.localLatestReadable !== false) {
    reasons.add("artifact_publication_surface_unreliable");
  }
  if (input.fullLoopObserverSection == null || input.detailedObserverArtifact == null) {
    reasons.add("observer_artifact_missing");
  }
  if (fullLoopState === "pass" && detailedStatus === "fail") {
    reasons.add("full_loop_observer_pass_detailed_fail");
  }
  if (fullLoopState != null && detailedStatus != null && fullLoopState !== detailedStatus) {
    reasons.add("observer_status_mismatch");
  }

  const fullLoopRefs = Array.isArray(input.fullLoopObserverSection?.artifactRefs)
    ? input.fullLoopObserverSection?.artifactRefs
    : [];
  const fullLoopObserverStatus = fullLoopRefs
    .map((entry) => asString(asRecord(entry)?.status))
    .find((entry) => entry != null);
  if (
    fullLoopObserverStatus != null &&
    detailedStatus != null &&
    fullLoopObserverStatus !== detailedStatus
  ) {
    reasons.add("observer_artifact_ref_status_mismatch");
  }

  const detailedReasonCodes = extractReasonCodes(input.detailedObserverArtifact);
  if (detailedStatus === "fail" && detailedReasonCodes.length === 0) {
    reasons.add("observer_fail_missing_reason_codes");
  }

  const conditionPairs: Array<["metric_required" | "tile_effective", "wec" | "nec" | "dec" | "sec"]> = [
    ["metric_required", "wec"],
    ["metric_required", "nec"],
    ["metric_required", "dec"],
    ["metric_required", "sec"],
    ["tile_effective", "wec"],
    ["tile_effective", "nec"],
    ["tile_effective", "dec"],
    ["tile_effective", "sec"],
  ];
  for (const [family, condition] of conditionPairs) {
    const status = extractObserverConditionStatus(
      input.detailedObserverArtifact,
      family,
      condition,
    );
    if (fullLoopState === "pass" && status === "fail") {
      reasons.add(`${family}_${condition}_detailed_fail`);
    }
  }

  return gate(
    "GATE_OBSERVER_ARTIFACT_CONSISTENCY",
    reasons.size > 0 ? "fail" : "pass",
    Array.from(reasons),
  );
};

export const evaluateRegionalSourceClosureCounterparts = (
  sourceClosureArtifact: Record<string, unknown> | null,
): Nhm2ReferenceRunValidationGate => {
  const reasons = new Set<string>();
  const regions = asRecord(sourceClosureArtifact?.regionComparisons)?.regions;
  if (!Array.isArray(regions) || regions.length === 0) {
    return gate("GATE_REGIONAL_SOURCE_CLOSURE_COUNTERPART", "review", [
      "regional_source_closure_missing",
    ]);
  }

  for (const region of regions) {
    const record = asRecord(region);
    if (record == null) continue;
    const regionId = asString(record.regionId) ?? "unknown_region";
    const basisStatus = asString(record.comparisonBasisStatus);
    const counterpartStatus = asString(record.counterpartResolutionStatus);
    const expectedRole = asString(record.metricExpectedCounterpartRole);
    const tileTrace = asString(
      getNested(record, ["tileT00Diagnostics", "trace", "pathFacts", "comparisonRole"]),
    );
    const tileTensorRef = asString(record.tileTensorRef) ?? "";
    const tileTraceRef =
      asString(getNested(record, ["tileT00Diagnostics", "trace", "tensorRef"])) ?? "";

    if (
      basisStatus !== "same_basis" ||
      counterpartStatus !== "resolved" ||
      expectedRole !== "tile_effective_counterpart"
    ) {
      reasons.add(`${regionId}_counterpart_not_same_basis`);
    }
    if (
      tileTrace === "gr_matter_channel_observation" ||
      tileTensorRef.includes("gr_matter_channel_observation") ||
      tileTraceRef.includes("gr_matter_channel_observation")
    ) {
      reasons.add(`${regionId}_observation_path_not_counterpart`);
    }
    if (record.status === "pass" && basisStatus !== "same_basis") {
      reasons.add(`${regionId}_pass_without_same_basis`);
    }
  }

  return gate(
    "GATE_REGIONAL_SOURCE_CLOSURE_COUNTERPART",
    reasons.size > 0 ? "fail" : "pass",
    Array.from(reasons),
  );
};

export const evaluateRegionalSourceClosureRequiredRegions = (
  sourceClosureArtifact: Record<string, unknown> | null,
): Nhm2ReferenceRunValidationGate => {
  const regions = asRecord(sourceClosureArtifact?.regionComparisons)?.regions;
  if (!Array.isArray(regions) || regions.length === 0) {
    return gate("GATE_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS", "fail", [
      "regional_source_closure_regions_missing",
    ]);
  }

  const present = new Set<string>();
  for (const region of regions) {
    const regionId = asString(asRecord(region)?.regionId);
    if (regionId != null) present.add(regionId);
  }
  const missing = REQUIRED_REGIONAL_SOURCE_CLOSURE_REGIONS.filter(
    (regionId) => !present.has(regionId),
  );

  return gate(
    "GATE_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS",
    missing.length > 0 ? "fail" : "pass",
    missing.map((regionId) => `regional_source_closure_region_missing:${regionId}`),
  );
};

const collectTensorComponents = (
  value: unknown,
  components = new Set<string>(),
): Set<string> => {
  const record = asRecord(value);
  if (record == null) {
    if (Array.isArray(value)) {
      for (const entry of value) collectTensorComponents(entry, components);
    }
    return components;
  }
  for (const [key, nested] of Object.entries(record)) {
    if (/^T[0-3][0-3]$/.test(key)) components.add(key);
    collectTensorComponents(nested, components);
  }
  return components;
};

const hasTensorSymmetryDeclaration = (artifact: Record<string, unknown> | null): boolean => {
  const text = JSON.stringify(artifact ?? {}).toLowerCase();
  return (
    text.includes("symmetric_tensor") ||
    text.includes("tensor_symmetry") ||
    text.includes("tensorsymmetry") ||
    text.includes("symmetric stress tensor") ||
    text.includes("symmetric_stress_tensor") ||
    text.includes("\"symmetry\":\"symmetric\"") ||
    text.includes("\"symmetric\":true")
  );
};

export const evaluateFullTensorAuthority = (
  artifact: Record<string, unknown> | null,
): Nhm2ReferenceRunValidationGate => {
  const reasons = new Set<string>();
  const text = JSON.stringify(artifact ?? {});
  if (/diagonal_proxy/i.test(text) || /pressure proxy/i.test(text)) {
    reasons.add("diagonal_proxy_present_reduced_order_only");
  }
  const components = collectTensorComponents(artifact);
  const missingDeclared = FULL_TENSOR_COMPONENTS.filter(
    (component) => !components.has(component),
  );
  for (const component of missingDeclared) {
    reasons.add(`full_tensor_component_missing:${component}`);
  }
  const hasSymmetryDeclaration = hasTensorSymmetryDeclaration(artifact);
  const missingLower = FULL_TENSOR_LOWER_COMPONENTS.filter(
    (component) => !components.has(component),
  );
  if (missingLower.length > 0 && !hasSymmetryDeclaration) {
    reasons.add("full_tensor_symmetry_or_lower_components_missing");
    for (const component of missingLower) {
      reasons.add(`full_tensor_component_missing:${component}`);
    }
  }
  if (missingDeclared.length > 0 || (missingLower.length > 0 && !hasSymmetryDeclaration)) {
    reasons.add("full_tensor_components_not_emitted");
  }
  return gate(
    "GATE_FULL_TENSOR_WHERE_CLAIMED",
    reasons.size > 0 ? "review" : "pass",
    Array.from(reasons),
  );
};

export const evaluateLiteratureClaimMap = (
  value: unknown,
): Nhm2ReferenceRunValidationGate => {
  const record = asRecord(value);
  const reasons = new Set<string>();
  if (record?.schemaVersion !== "nhm2_literature_claim_map/v1") {
    reasons.add("literature_claim_map_schema_mismatch");
  }
  const policy = asRecord(record?.claimPolicy);
  if (policy?.externalTheoryDoesNotValidateNHM2 !== true) {
    reasons.add("external_theory_boundary_missing");
  }
  if (policy?.webOrPaperCitationRequiredForExternalTheoryClaims !== true) {
    reasons.add("external_citation_policy_missing");
  }
  if (policy?.noPredictiveLanguageFromExperimentalMathOnly !== true) {
    reasons.add("experimental_math_predictive_language_policy_missing");
  }
  const sources = Array.isArray(record?.sources) ? record.sources : [];
  if (sources.length === 0) reasons.add("literature_sources_missing");
  for (const source of sources) {
    const sourceRecord = asRecord(source);
    const sourceId = asString(sourceRecord?.sourceId) ?? "unknown_source";
    const support = Array.isArray(sourceRecord?.claimSupport)
      ? sourceRecord.claimSupport
      : [];
    const nonSupport = Array.isArray(sourceRecord?.nonSupport)
      ? sourceRecord.nonSupport
      : [];
    const url = asString(sourceRecord?.url);
    if (
      url == null ||
      (!url.startsWith("https://arxiv.org/abs/") &&
        !url.startsWith("https://doi.org/") &&
        !url.startsWith("https://journals.aps.org/"))
    ) {
      reasons.add(`${sourceId}_primary_literature_url_missing`);
    }
    if (support.length > 0 && nonSupport.length === 0) {
      reasons.add(`${sourceId}_non_support_missing`);
    }
  }
  return gate(
    "GATE_LITERATURE_CLAIM_MAP",
    reasons.size > 0 ? "fail" : "pass",
    Array.from(reasons),
  );
};

export const evaluateQeiDossier = (
  qeiDossier: unknown | null,
): Nhm2ReferenceRunValidationGate => {
  if (isNhm2QeiWorldlineDossier(qeiDossier)) {
    return evaluateQeiWorldlineDossier(qeiDossier);
  }
  if (!isNhm2QeiDossierArtifact(qeiDossier)) {
    return gate("GATE_QEI_DOSSIER_PRESENT", "review", ["qei_dossier_missing"]);
  }

  const reasons = new Set<string>();
  if (qeiDossier.status !== "pass") {
    reasons.add(`qei_dossier_status_not_pass:${qeiDossier.status}`);
  }
  if (qeiDossier.rhoSource === "proxy") {
    reasons.add("qei_proxy_rho_source_blocks_physical_mechanism");
  }
  if (qeiDossier.rhoSource === "unknown") {
    reasons.add("qei_rho_source_unknown");
  }
  if (qeiDossier.qeiApplicabilityStatus !== "PASS") {
    reasons.add(
      `qei_applicability_not_pass:${qeiDossier.qeiApplicabilityStatus}`,
    );
  }
  if (qeiDossier.quantumStateAssumptions.length === 0) {
    reasons.add("qei_quantum_state_assumptions_missing");
  }
  if (qeiDossier.renormalizationConvention == null) {
    reasons.add("qei_renormalization_convention_missing");
  }
  if (qeiDossier.cavityBoundaryModel == null) {
    reasons.add("qei_cavity_boundary_model_missing");
  }
  if (qeiDossier.samplingWorldlines.length === 0) {
    reasons.add("qei_sampling_worldlines_missing");
  }
  const worldlineIds = new Set(
    qeiDossier.samplingWorldlines.map((worldline) => worldline.id),
  );
  if (
    qeiDossier.worstWorldlineId == null ||
    !worldlineIds.has(qeiDossier.worstWorldlineId)
  ) {
    reasons.add("qei_worst_worldline_unresolved");
  }
  if (qeiDossier.dutyCyclePass !== true) {
    reasons.add("qei_duty_cycle_not_pass");
  }
  if (qeiDossier.lightCrossingConsistencyStatus !== "pass") {
    reasons.add(
      `qei_light_crossing_not_pass:${qeiDossier.lightCrossingConsistencyStatus}`,
    );
  }
  if (qeiDossier.cycleAverageClosureStatus !== "pass") {
    reasons.add(
      `qei_cycle_average_closure_not_pass:${qeiDossier.cycleAverageClosureStatus}`,
    );
  }
  if (qeiDossier.literatureRefs.length === 0) {
    reasons.add("qei_literature_refs_missing");
  }

  const state: Nhm2ReferenceRunValidationState =
    reasons.size === 0 ? "pass" : qeiDossier.status === "fail" ? "fail" : "review";
  return gate("GATE_QEI_DOSSIER_PRESENT", state, Array.from(reasons));
};

const evaluateQeiWorldlineDossier = (
  qeiDossier: Nhm2QeiWorldlineDossierV1,
): Nhm2ReferenceRunValidationGate => {
  const reasons = new Set<string>();
  if (!qeiDossier.summary.hasWallWorldline) {
    reasons.add("qei_wall_worldline_missing");
  }
  if (!qeiDossier.summary.dossierComplete) {
    reasons.add("qei_worldline_dossier_incomplete");
  }
  if (qeiDossier.summary.allMarginsPass === false) {
    reasons.add("qei_margin_failed");
  }
  if (qeiDossier.summary.allMarginsPass == null) {
    reasons.add("qei_margin_status_missing");
  }
  if (qeiDossier.summary.anyProxy) {
    reasons.add("qei_proxy_evidence_present");
  }
  for (const worldline of qeiDossier.worldlines) {
    const prefix = `qei_worldline:${worldline.worldlineId}`;
    if (worldline.samplingFunction.tauSeconds == null) {
      reasons.add(`${prefix}:sampling_tau_missing`);
    }
    if (!worldline.samplingFunction.normalized) {
      reasons.add(`${prefix}:sampling_function_not_normalized`);
    }
    if (worldline.sampledRho.status !== "computed") {
      reasons.add(`${prefix}:sampled_rho_${worldline.sampledRho.status}`);
    }
    if (worldline.sampledRho.valueSI == null) {
      reasons.add(`${prefix}:sampled_rho_value_missing`);
    }
    if (worldline.sampledRho.provenanceRef == null) {
      reasons.add(`${prefix}:sampled_rho_provenance_missing`);
    }
    if (worldline.bound.status === "missing") {
      reasons.add(`${prefix}:qei_bound_missing`);
    }
    if (worldline.bound.status === "proxy") {
      reasons.add(`${prefix}:qei_bound_proxy`);
    }
    if (worldline.bound.valueSI == null) {
      reasons.add(`${prefix}:qei_bound_value_missing`);
    }
    if (worldline.bound.provenanceRef == null) {
      reasons.add(`${prefix}:qei_bound_provenance_missing`);
    }
    if (worldline.margin.pass !== true) {
      reasons.add(
        worldline.margin.pass === false
          ? `${prefix}:qei_margin_failed`
          : `${prefix}:qei_margin_status_missing`,
      );
    }
    for (const [field, status] of Object.entries(worldline.consistency)) {
      if (status !== "pass") {
        reasons.add(`${prefix}:${field}_${status}`);
      }
    }
    for (const blocker of worldline.blockers) {
      reasons.add(`${prefix}:${blocker}`);
    }
  }

  const state: Nhm2ReferenceRunValidationState =
    reasons.size === 0
      ? "pass"
      : qeiDossier.summary.allMarginsPass === false ||
          qeiDossier.worldlines.some((worldline) => worldline.margin.pass === false)
        ? "fail"
        : "review";
  return gate("GATE_QEI_DOSSIER_PRESENT", state, Array.from(reasons));
};

export const evaluateRegionalSourceClosureEvidenceArtifact = (
  value: unknown | null,
  strictPromotion = false,
): Nhm2ReferenceRunValidationGate => {
  if (value == null) {
    return gate(
      "GATE_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT",
      strictPromotion ? "fail" : "review",
      ["regional_source_closure_evidence_artifact_missing"],
    );
  }
  if (!isNhm2RegionalSourceClosureEvidenceArtifact(value)) {
    return gate("GATE_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT", "fail", [
      "regional_source_closure_evidence_artifact_invalid",
    ]);
  }

  const reasons = new Set<string>();
  if (!value.profileMatch) reasons.add("regional_evidence_profile_mismatch");
  if (value.missingRequiredRegions.length > 0) {
    for (const regionId of value.missingRequiredRegions) {
      reasons.add(`regional_evidence_region_missing:${regionId}`);
    }
  }
  if (value.overallState !== "pass") {
    reasons.add(`regional_evidence_overall_not_pass:${value.overallState}`);
  }
  for (const region of value.regions) {
    if (region.comparisonBasisStatus !== "same_basis") {
      reasons.add(`${region.regionId}_basis_not_same:${region.comparisonBasisStatus}`);
    }
    if (
      region.tileEffectiveCounterpart.comparisonRole !==
      "tile_effective_counterpart"
    ) {
      reasons.add(
        `${region.regionId}_tile_role_not_counterpart:${region.tileEffectiveCounterpart.comparisonRole}`,
      );
    }
    if (region.residuals.pass === false) {
      reasons.add(`${region.regionId}_residual_failed`);
    }
    if (
      region.metricRequired.tensorAuthorityMode === "diagonal_reduced_order" ||
      region.metricRequired.tensorAuthorityMode === "proxy" ||
      region.tileEffectiveCounterpart.tensorAuthorityMode ===
        "diagonal_reduced_order" ||
      region.tileEffectiveCounterpart.tensorAuthorityMode === "proxy"
    ) {
      reasons.add(`${region.regionId}_tensor_authority_not_promotion_safe`);
    }
  }

  return gate(
    "GATE_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT",
    reasons.size > 0 ? (value.overallState === "fail" ? "fail" : "review") : "pass",
    Array.from(reasons),
  );
};

export const evaluateTileEffectiveCounterpartArtifact = (
  value: unknown | null,
): Nhm2ReferenceRunValidationGate => {
  if (value == null) {
    return gate("GATE_TILE_EFFECTIVE_COUNTERPART_ARTIFACT", "review", [
      "tile_effective_counterpart_artifact_missing",
    ]);
  }
  if (!isNhm2TileEffectiveCounterpartArtifact(value)) {
    return gate("GATE_TILE_EFFECTIVE_COUNTERPART_ARTIFACT", "fail", [
      "tile_effective_counterpart_artifact_invalid",
    ]);
  }
  const required = new Set(["global", "hull", "wall", "exterior_shell"]);
  for (const region of value.regions) required.delete(region.regionId);
  const reasons = Array.from(required).map(
    (regionId) => `tile_counterpart_region_missing:${regionId}`,
  );
  if (!value.profileMatch) reasons.push("tile_counterpart_profile_mismatch");
  return gate(
    "GATE_TILE_EFFECTIVE_COUNTERPART_ARTIFACT",
    reasons.length > 0 ? "fail" : "pass",
    reasons,
  );
};

export const evaluateTileCounterpartNotMetricEcho = (
  value: unknown | null,
): Nhm2ReferenceRunValidationGate => {
  if (!isNhm2TileEffectiveCounterpartArtifact(value)) {
    return gate("GATE_TILE_COUNTERPART_NOT_METRIC_ECHO", "review", [
      "tile_effective_counterpart_artifact_missing",
    ]);
  }
  const reasons = value.regions.flatMap((region) => {
    const regionReasons: string[] = [];
    if (
      region.comparisonRole === "metric_echo_diagnostic_only" ||
      region.provenance.derivationMode === "metric_echo" ||
      !region.provenance.notDerivedFromMetricRequiredTensor
    ) {
      regionReasons.push(`${region.regionId}_metric_echo_not_source_closure`);
    }
    return regionReasons;
  });
  return gate(
    "GATE_TILE_COUNTERPART_NOT_METRIC_ECHO",
    reasons.length > 0 ? "fail" : "pass",
    reasons,
  );
};

export const evaluateTileCounterpartFullTensorAuthority = (
  value: unknown | null,
): Nhm2ReferenceRunValidationGate => {
  if (!isNhm2TileEffectiveCounterpartArtifact(value)) {
    return gate("GATE_TILE_COUNTERPART_FULL_TENSOR_AUTHORITY", "review", [
      "tile_effective_counterpart_artifact_missing",
    ]);
  }
  const reasons: string[] = [];
  let fail = false;
  for (const region of value.regions) {
    if (region.tensorAuthorityMode === "proxy") {
      fail = true;
      reasons.push(`${region.regionId}_proxy_tensor_authority`);
    } else if (
      region.tensorAuthorityMode === "diagonal_reduced_order" ||
      region.tensorAuthorityMode === "unknown"
    ) {
      reasons.push(`${region.regionId}_full_tensor_authority_missing`);
    }
  }
  return gate(
    "GATE_TILE_COUNTERPART_FULL_TENSOR_AUTHORITY",
    fail ? "fail" : reasons.length > 0 ? "review" : "pass",
    reasons,
  );
};

export const evaluateTileCounterpartQeiLinkage = (
  value: unknown | null,
): Nhm2ReferenceRunValidationGate => {
  if (!isNhm2TileEffectiveCounterpartArtifact(value)) {
    return gate("GATE_TILE_COUNTERPART_QEI_LINKAGE", "review", [
      "tile_effective_counterpart_artifact_missing",
    ]);
  }
  const reasons: string[] = [];
  if (value.qeiDossierRef == null) reasons.push("tile_counterpart_qei_dossier_ref_missing");
  if (value.qeiApplicabilityStatus === "FAIL") {
    return gate("GATE_TILE_COUNTERPART_QEI_LINKAGE", "fail", [
      ...reasons,
      "tile_counterpart_qei_failed",
    ]);
  }
  if (value.qeiApplicabilityStatus !== "PASS") {
    reasons.push(`tile_counterpart_qei_not_pass:${value.qeiApplicabilityStatus}`);
  }
  if (value.sourceAuthorityMode === "proxy") {
    return gate("GATE_TILE_COUNTERPART_QEI_LINKAGE", "fail", [
      ...reasons,
      "tile_counterpart_proxy_source_authority",
    ]);
  }
  return gate(
    "GATE_TILE_COUNTERPART_QEI_LINKAGE",
    reasons.length > 0 ? "review" : "pass",
    reasons,
  );
};

export const evaluateSourceClosureEvidenceUsesCounterpart = (
  regionalEvidence: unknown | null,
  explicitTileCounterpartProvided = false,
): Nhm2ReferenceRunValidationGate => {
  if (!isNhm2RegionalSourceClosureEvidenceArtifact(regionalEvidence)) {
    return gate("GATE_SOURCE_CLOSURE_EVIDENCE_USES_COUNTERPART", "review", [
      "regional_source_closure_evidence_artifact_missing",
    ]);
  }
  const reasons: string[] = [];
  let fail = false;
  for (const region of regionalEvidence.regions) {
    const role = region.tileEffectiveCounterpart.comparisonRole;
    if (role === "gr_matter_channel_observation" || role === "metric_echo_diagnostic_only") {
      fail = true;
      reasons.push(`${region.regionId}_source_evidence_uses_${role}`);
    } else if (
      role !== "tile_effective_counterpart" ||
      !region.tileEffectiveCounterpart.tensorRef?.startsWith("nhm2_tile_effective_counterpart")
    ) {
      if (explicitTileCounterpartProvided) {
        fail = true;
      }
      reasons.push(`${region.regionId}_source_evidence_uses_legacy_or_missing_counterpart`);
    }
  }
  return gate(
    "GATE_SOURCE_CLOSURE_EVIDENCE_USES_COUNTERPART",
    fail ? "fail" : reasons.length > 0 ? "review" : "pass",
    reasons,
  );
};

const certificateIsExplicitlyNonPromotional = (
  certificate: Record<string, unknown> | null,
): boolean =>
  certificate != null &&
  (certificate.nonPromotional === true ||
    certificate.promotionAllowed === false ||
    certificate.promotional === false ||
    certificate.validationPromotionAllowed === false ||
    asString(certificate.promotionSafety) === "non_promotional" ||
    asString(certificate.claimEffect) === "non_promotional");

const certificateImpliesPromotion = (
  certificate: Record<string, unknown> | null,
): boolean => {
  if (certificate == null) return false;
  const textValues = Object.entries(certificate)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => `${key}:${value}`.toLowerCase());
  return (
    certificate.state === "pass" ||
    certificate.status === "pass" ||
    textValues.some((entry) =>
      /\b(green|certified|admissible|pass)\b/.test(entry),
    ) ||
    asBoolean(certificate.certificateGreen) === true ||
    asBoolean(certificate.admissible) === true ||
    asBoolean(certificate.certified) === true
  );
};

const classifyAdapterVerification = (
  referenceRun: Nhm2ReferenceRunArtifact | null,
  override?: Nhm2AdapterVerificationStatus,
): Nhm2AdapterVerificationStatus => {
  if (override != null) return override;
  const command = referenceRun?.commands.find((entry) =>
    /casimir:verify|adapter/i.test(`${entry.id} ${entry.command}`),
  );
  if (command == null) return "not_run";
  if (command.status === "pass") return "pass";
  if (command.status === "not_run") return "not_run";
  if (/econnrefused|endpoint|adapter.*unavailable/i.test(command.command)) {
    return "blocked_infra_endpoint_unavailable";
  }
  return "fail";
};

export const validateNhm2ReferenceRun = (args: {
  referenceRun: unknown;
  repoRoot?: string;
  fullLoopAudit?: Record<string, unknown> | null;
  observerAudit?: Record<string, unknown> | null;
  sourceClosure?: Record<string, unknown> | null;
  qeiDossier?: unknown | null;
  literatureClaimMap?: unknown | null;
  adapterVerificationStatus?: Nhm2AdapterVerificationStatus;
  regionalSourceClosureEvidence?: unknown | null;
  tileEffectiveCounterpart?: unknown | null;
  strictPromotion?: boolean;
}): Nhm2ReferenceRunValidationArtifact => {
  const referenceRun = args.referenceRun as Nhm2ReferenceRunArtifact;
  const structuralPass = isNhm2ReferenceRunArtifact(args.referenceRun);
  const gates: Nhm2ReferenceRunValidationGate[] = [];

  gates.push(
    gate(
      "GATE_CLAIM_LOCK",
      structuralPass &&
        referenceRun.claimLock.validationClaimAllowed === false &&
        referenceRun.claimLock.validationMode === "red_team_hardening"
        ? "pass"
        : "fail",
      structuralPass ? [] : ["reference_run_contract_invalid"],
    ),
  );

  gates.push(
    gate(
      "GATE_NO_LATEST_ALIAS",
      structuralPass &&
        referenceRun.artifactSet.every((entry) => entry.usesLatestAlias === false)
        ? "pass"
        : "fail",
      structuralPass
        ? referenceRun.artifactSet
            .filter((entry) => entry.usesLatestAlias)
            .map((entry) => `latest_alias:${entry.path}`)
        : ["reference_run_contract_invalid"],
    ),
  );

  gates.push(
    gate(
      "GATE_PROFILE_MATCH",
      structuralPass &&
        referenceRun.selectedFamily.profileMatch &&
        referenceRun.artifactSet.every((entry) => entry.profileMatch !== false)
        ? "pass"
        : "fail",
      structuralPass
        ? referenceRun.artifactSet
            .filter((entry) => entry.profileMatch === false)
            .map((entry) => `profile_mismatch:${entry.path}`)
        : ["reference_run_contract_invalid"],
    ),
  );

  const fullLoopAudit =
    args.fullLoopAudit ??
    (structuralPass
      ? asRecord(
          readJsonFromArtifactSet(args.repoRoot ?? process.cwd(), referenceRun, [
            "nhm2_full_loop",
            "nhm2-full-loop-audit",
          ]),
        )
      : null);
  const observerAudit =
    args.observerAudit ??
    (structuralPass
      ? asRecord(
          readJsonFromArtifactSet(args.repoRoot ?? process.cwd(), referenceRun, [
            "nhm2_observer_audit",
            "nhm2-observer-audit",
          ]),
        )
      : null);
  const sourceClosure =
    args.sourceClosure ??
    (structuralPass
      ? asRecord(
          readJsonFromArtifactSet(args.repoRoot ?? process.cwd(), referenceRun, [
            "nhm2_source_closure",
            "nhm2-source-closure",
          ]),
        )
      : null);

  gates.push(
    evaluateObserverConsistency({
      fullLoopObserverSection: asRecord(
        getNested(fullLoopAudit, ["sections", "observer_audit"]),
      ),
      detailedObserverArtifact: observerAudit,
    }),
  );
  gates.push(evaluateRegionalSourceClosureRequiredRegions(sourceClosure));
  gates.push(evaluateRegionalSourceClosureCounterparts(sourceClosure));
  gates.push(
    evaluateRegionalSourceClosureEvidenceArtifact(
      args.regionalSourceClosureEvidence ?? null,
      args.strictPromotion === true,
    ),
  );
  gates.push(evaluateTileEffectiveCounterpartArtifact(args.tileEffectiveCounterpart ?? null));
  gates.push(evaluateTileCounterpartNotMetricEcho(args.tileEffectiveCounterpart ?? null));
  gates.push(evaluateTileCounterpartFullTensorAuthority(args.tileEffectiveCounterpart ?? null));
  gates.push(evaluateTileCounterpartQeiLinkage(args.tileEffectiveCounterpart ?? null));
  gates.push(
    evaluateSourceClosureEvidenceUsesCounterpart(
      args.regionalSourceClosureEvidence ?? null,
      isNhm2TileEffectiveCounterpartArtifact(args.tileEffectiveCounterpart ?? null),
    ),
  );
  gates.push(evaluateFullTensorAuthority(sourceClosure));

  const qeiDossier = args.qeiDossier ?? null;
  gates.push(evaluateQeiDossier(qeiDossier));

  const reproducibility = asRecord(
    getNested(fullLoopAudit, [
      "sections",
      "uncertainty_perturbation_reproducibility",
    ]),
  );
  const missingRepro = [
    "meshConvergenceOrder",
    "boundaryConditionSensitivity",
    "smoothingKernelSensitivity",
    "independentReproductionStatus",
    "artifactHashConsistencyStatus",
  ].filter((field) => reproducibility?.[field] == null);
  gates.push(
    gate(
      "GATE_REPRODUCIBILITY_FIELDS",
      missingRepro.length === 0 ? "pass" : "review",
      missingRepro.map((field) => `reproducibility_field_missing:${field}`),
    ),
  );

  gates.push(evaluateLiteratureClaimMap(args.literatureClaimMap ?? null));

  const certificate = asRecord(
    getNested(fullLoopAudit, ["sections", "certificate_policy_result"]),
  );
  const certificateOverridesReview =
    fullLoopAudit?.overallState !== "pass" &&
    certificateImpliesPromotion(certificate) &&
    !certificateIsExplicitlyNonPromotional(certificate);
  gates.push(
    gate(
      "GATE_CERTIFICATE_DOES_NOT_OVERRIDE_REVIEW",
      certificateOverridesReview ? "fail" : "pass",
      certificateOverridesReview
        ? ["certificate_policy_green_overrode_non_pass_full_loop"]
        : [],
    ),
  );

  const overallState = aggregate(gates);
  const adapterVerificationStatus = classifyAdapterVerification(
    structuralPass ? referenceRun : null,
    args.adapterVerificationStatus,
  );
  return {
    artifactId: NHM2_REFERENCE_RUN_VALIDATION_ARTIFACT_ID,
    schemaVersion: NHM2_REFERENCE_RUN_VALIDATION_SCHEMA_VERSION,
    runId: structuralPass ? referenceRun.runId : "unknown",
    overallState,
    gates,
    claimTierAllowed:
      overallState === "pass"
        ? "reduced-order"
        : overallState === "review"
          ? "diagnostic"
          : null,
    validationClaimAllowed: false,
    adapterVerificationStatus,
    adapterVerificationPhysicsImpact: "none_claimed",
  };
};

const readJsonFromArtifactSet = (
  repoRoot: string,
  referenceRun: Nhm2ReferenceRunArtifact,
  idHints: string[],
): unknown | null => {
  const entry = referenceRun.artifactSet.find((candidate) =>
    idHints.some(
      (hint) => candidate.artifactId.includes(hint) || candidate.path.includes(hint),
    ),
  );
  if (entry == null) return null;
  return readJsonIfExists(resolveRepoPath(repoRoot, entry.path));
};

const parseArgs = (argv: string[]): Record<string, string | boolean> => {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const referenceRunPath = asString(args["reference-run"]);
  if (referenceRunPath == null) {
    throw new Error("--reference-run is required");
  }
  const repoRoot = process.cwd();
  const referenceRun = readJsonIfExists(resolveRepoPath(repoRoot, referenceRunPath));
  const literaturePath = resolveRepoPath(
    repoRoot,
    asString(args["literature-map"]) ?? "docs/research/nhm2-literature-claim-map.v1.json",
  );
  const regionalEvidencePath = asString(args["regional-evidence"]);
  const tileCounterpartPath = asString(args["tile-effective-counterpart"]);
  const qeiDossierPath = asString(args["qei-dossier"]);
  const qeiWorldlineDossierPath = asString(args["qei-worldline-dossier"]);
  const validation = validateNhm2ReferenceRun({
    referenceRun,
    repoRoot,
    literatureClaimMap: readJsonIfExists(literaturePath),
    qeiDossier:
      qeiWorldlineDossierPath != null
        ? readJsonIfExists(resolveRepoPath(repoRoot, qeiWorldlineDossierPath))
        : qeiDossierPath == null
        ? null
        : readJsonIfExists(resolveRepoPath(repoRoot, qeiDossierPath)),
    regionalSourceClosureEvidence:
      regionalEvidencePath == null
        ? null
        : readJsonIfExists(resolveRepoPath(repoRoot, regionalEvidencePath)),
    tileEffectiveCounterpart:
      tileCounterpartPath == null
        ? null
        : readJsonIfExists(resolveRepoPath(repoRoot, tileCounterpartPath)),
    strictPromotion: args["strict-promotion"] === true,
  });
  const outPath = asString(args.out);
  const body = `${JSON.stringify(validation, null, 2)}\n`;
  if (outPath != null) {
    writeFileSync(resolveRepoPath(repoRoot, outPath), body, "utf8");
  } else {
    process.stdout.write(body);
  }
  if (validation.overallState === "fail") process.exitCode = 1;
};

const invokedPath = process.argv[1] ? normalize(process.argv[1]) : "";
if (invokedPath === normalize(fileURLToPath(import.meta.url))) {
  main();
}

export const hashReferenceRunFile = sha256FileIfExists;
