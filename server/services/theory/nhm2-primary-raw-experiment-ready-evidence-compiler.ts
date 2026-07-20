import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import {
  buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress,
  type CasimirFiniteTemperatureFiniteGeometryMaxwellStressV1,
} from "../../../shared/contracts/casimir-finite-temperature-finite-geometry-maxwell-stress.v1";
import {
  buildNhm2ContinuousObserverOptimizer,
  type Nhm2ContinuousObserverOptimizerV1,
} from "../../../shared/contracts/nhm2-continuous-observer-optimizer.v1";
import {
  buildNhm2CovariantConservation,
  type Nhm2CovariantConservationV1,
} from "../../../shared/contracts/nhm2-covariant-conservation.v1";
import {
  buildNhm2DynamicBackreactionStabilityCausality,
  type Nhm2DynamicBackreactionStabilityCausalityV1,
} from "../../../shared/contracts/nhm2-dynamic-backreaction-stability-causality.v1";
import {
  buildNhm2FullApparatusSourceTensor,
  type Nhm2FullApparatusSourceTensorComponent,
  type Nhm2FullApparatusSourceTensorV1,
} from "../../../shared/contracts/nhm2-full-apparatus-source-tensor.v1";
import {
  buildNhm2MechanicalSupportControlMargin,
  type Nhm2MechanicalSupportControlMarginV1,
} from "../../../shared/contracts/nhm2-mechanical-support-control-margin.v1";
import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
  NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES,
  nhm2PrimaryRawOutputManifestViolations,
  type Nhm2PrimaryRawOutputFamilyId,
  type Nhm2PrimaryRawOutputHashedInputV1,
} from "../../../shared/contracts/nhm2-primary-raw-output-manifest.v1";
import {
  buildNhm2SemiclassicalStateRealizability,
  type Nhm2SemiclassicalStateRealizabilityV1,
} from "../../../shared/contracts/nhm2-semiclassical-state-realizability.v1";
import {
  buildNhm2WorldlineQeiCoverage,
  type Nhm2WorldlineQeiCoverageV1,
} from "../../../shared/contracts/nhm2-worldline-qei-coverage.v1";
import {
  replayNhm2PrimaryRawGrContent,
  type Nhm2PrimaryRawGrApparatusMetrics,
  type Nhm2PrimaryRawGrConservationMetrics,
  type Nhm2PrimaryRawGrContentReplay,
  type Nhm2PrimaryRawGrObserverMetrics,
  type Nhm2PrimaryRawGrQeiMetrics,
} from "./nhm2-primary-raw-gr-content-replay";
import {
  replayNhm2PrimaryRawMaterialDynamicsContent,
  type Nhm2DynamicsReplayMetrics,
  type Nhm2MaxwellReplayMetrics,
  type Nhm2MechanicalReplayMetrics,
  type Nhm2PrimaryRawMaterialDynamicsReplayInput,
  type Nhm2PrimaryRawMaterialDynamicsReplayResult,
  type Nhm2SemiclassicalReplayMetrics,
} from "./nhm2-primary-raw-material-dynamics-content-replay";
import {
  verifyNhm2PrimaryRawOutputFilesystem,
  type Nhm2PrimaryRawOutputFilesystemVerifierInput,
  type Nhm2PrimaryRawOutputFilesystemVerification,
  type Nhm2PrimaryRawOutputVerifiedFile,
  type Nhm2PrimaryRawOutputVerifiedNumericalFile,
} from "./nhm2-primary-raw-output-filesystem-verifier";

export const NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_COMPILER_CONTRACT_VERSION =
  "nhm2_primary_raw_experiment_ready_evidence_compiler/v1" as const;

export const NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_IDS = [
  "full_apparatus_source_tensor",
  "semiclassical_state",
  "covariant_conservation",
  "continuous_observer_optimizer",
  "worldline_qei",
  "dynamic_backreaction_stability_causality",
  "finite_temperature_finite_geometry_maxwell_stress",
  "mechanical_support_control_margin",
] as const;

export type Nhm2PrimaryRawExperimentReadyEvidenceId =
  (typeof NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_IDS)[number];
export type Nhm2PrimaryRawCompiledEvidenceStatus = "pass" | "fail" | "blocked";

type RawFileBinding = {
  fileId: string;
  familyId: Nhm2PrimaryRawOutputFamilyId;
  semanticRole: string;
  path: string;
  observedSha256: string;
  compilerRecomputedSha256: string;
  sizeBytes: number;
};

type CompiledEvidenceEntry<Artifact, Metrics> = {
  status: Nhm2PrimaryRawCompiledEvidenceStatus;
  ready: boolean;
  artifact: Artifact;
  replayMetrics: Metrics;
  rawFileBindings: RawFileBinding[];
  blockers: string[];
  failures: string[];
};

export type Nhm2PrimaryRawExperimentReadyEvidenceCompilation = {
  contractVersion: typeof NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_COMPILER_CONTRACT_VERSION;
  status: Nhm2PrimaryRawCompiledEvidenceStatus;
  acceptedInput: boolean;
  source: {
    candidateId: string | null;
    runId: string | null;
    manifestSha256: string | null;
    rawContentClosureSha256: string | null;
  };
  replayIntegrity: {
    grProvidedSha256: string;
    grRecomputedSha256: string;
    grExactMatch: boolean;
    materialDynamicsProvidedSha256: string;
    materialDynamicsRecomputedSha256: string;
    materialDynamicsExactMatch: boolean;
  };
  evidence: {
    full_apparatus_source_tensor: CompiledEvidenceEntry<
      Nhm2FullApparatusSourceTensorV1,
      Nhm2PrimaryRawGrApparatusMetrics
    >;
    semiclassical_state: CompiledEvidenceEntry<
      Nhm2SemiclassicalStateRealizabilityV1,
      Nhm2SemiclassicalReplayMetrics
    >;
    covariant_conservation: CompiledEvidenceEntry<
      Nhm2CovariantConservationV1,
      Nhm2PrimaryRawGrConservationMetrics
    >;
    continuous_observer_optimizer: CompiledEvidenceEntry<
      Nhm2ContinuousObserverOptimizerV1,
      Nhm2PrimaryRawGrObserverMetrics
    >;
    worldline_qei: CompiledEvidenceEntry<
      Nhm2WorldlineQeiCoverageV1,
      Nhm2PrimaryRawGrQeiMetrics
    >;
    dynamic_backreaction_stability_causality: CompiledEvidenceEntry<
      Nhm2DynamicBackreactionStabilityCausalityV1,
      Nhm2DynamicsReplayMetrics
    >;
    finite_temperature_finite_geometry_maxwell_stress: CompiledEvidenceEntry<
      CasimirFiniteTemperatureFiniteGeometryMaxwellStressV1,
      Nhm2MaxwellReplayMetrics
    >;
    mechanical_support_control_margin: CompiledEvidenceEntry<
      Nhm2MechanicalSupportControlMarginV1,
      Nhm2MechanicalReplayMetrics
    >;
  };
  blockers: string[];
  failures: string[];
  unresolvedKernelBlockers: string[];
  claimBoundary: {
    diagnosticReplayOnly: true;
    experimentReadyTheoryClosureClaimAllowed: false;
    theoryClosureEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
    empiricalValidationEstablished: false;
    empiricalReceiptsRequired: true;
  };
};

export type CompileNhm2PrimaryRawExperimentReadyEvidenceInput = {
  rawVerification: Nhm2PrimaryRawOutputFilesystemVerification;
  grReplay: Nhm2PrimaryRawGrContentReplay;
  materialDynamicsReplay: Nhm2PrimaryRawMaterialDynamicsReplayResult;
  /** Inputs needed to repeat the material/dynamics replay, excluding raw data. */
  materialDynamicsReplayContext: Omit<
    Nhm2PrimaryRawMaterialDynamicsReplayInput,
    "rawVerification"
  >;
};

export type CompileNhm2PrimaryRawExperimentReadyEvidenceFromFilesystemInput = {
  filesystem: Nhm2PrimaryRawOutputFilesystemVerifierInput;
  materialDynamicsReplayContext: Omit<
    Nhm2PrimaryRawMaterialDynamicsReplayInput,
    "rawVerification"
  >;
};

const SHA256 = /^[a-f0-9]{64}$/;
const HASH_DOMAIN =
  "nhm2-primary-raw-experiment-ready-evidence-compiler-content/v1\n";

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareUtf8);

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value);
    return encoded === undefined ? "null" : encoded;
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")),
    )
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const sha256Json = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");

const falseVerification = (): Nhm2PrimaryRawOutputFilesystemVerification => ({
  verified: false,
  violations: [{ code: "verifier_input_invalid" }],
  runRootRealPath: null,
  manifestPath: null,
  manifestSha256: null,
  manifest: null,
  files: [],
});

const encodeVerifiedContent = (
  file: Nhm2PrimaryRawOutputVerifiedFile,
): Buffer | null => {
  if (file.kind === "numerical_array") {
    const bytes = Buffer.alloc(file.values.length * 8);
    for (let index = 0; index < file.values.length; index += 1) {
      bytes.writeDoubleLE(file.values[index], index * 8);
    }
    return bytes;
  }
  if (file.descriptor.representation.kind !== "records") return null;
  if (file.descriptor.representation.format !== "ndjson") return null;
  const lines = file.records.map((record) => JSON.stringify(record));
  return Buffer.from(`${lines.join("\n")}\n`, "utf8");
};

const validateAndRehashRawVerification = (
  verification: Nhm2PrimaryRawOutputFilesystemVerification,
): {
  accepted: boolean;
  blockers: string[];
  bindings: RawFileBinding[];
  closureSha256: string | null;
} => {
  if (!verification.verified) {
    return {
      accepted: false,
      blockers: ["raw_filesystem_verification_required"],
      bindings: [],
      closureSha256: null,
    };
  }
  const blockers = nhm2PrimaryRawOutputManifestViolations(
    verification.manifest,
  ).map((entry) => `raw_manifest:${entry}`);
  if (!SHA256.test(verification.manifestSha256)) {
    blockers.push("raw_manifest_sha256_invalid");
  } else {
    const recomputedManifestSha256 = createHash("sha256")
      .update(JSON.stringify(verification.manifest), "utf8")
      .digest("hex");
    if (recomputedManifestSha256 !== verification.manifestSha256) {
      blockers.push("raw_manifest_content_rehash_mismatch");
    }
  }
  if (
    verification.manifest.contentPolicy.sha256 !==
    NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256
  ) {
    blockers.push("raw_content_policy_sha256_mismatch");
  }

  const descriptorById = new Map(
    verification.manifest.fileInventory.files.map((entry) => [
      entry.fileId,
      entry,
    ]),
  );
  const observedIds = new Set<string>();
  const roleKeys = new Set<string>();
  const bindings: RawFileBinding[] = [];
  for (const file of verification.files) {
    const descriptor = descriptorById.get(file.descriptor.fileId);
    if (descriptor == null) {
      blockers.push(`raw_file_not_in_manifest:${file.descriptor.fileId}`);
      continue;
    }
    if (observedIds.has(descriptor.fileId)) {
      blockers.push(`raw_file_duplicate:${descriptor.fileId}`);
      continue;
    }
    observedIds.add(descriptor.fileId);
    const roleKey = `${descriptor.familyId}:${descriptor.semanticRole}`;
    if (roleKeys.has(roleKey)) blockers.push(`raw_role_duplicate:${roleKey}`);
    roleKeys.add(roleKey);
    if (
      !isDeepStrictEqual(descriptor, file.descriptor) ||
      file.observedSha256 !== descriptor.sha256 ||
      file.observedSizeBytes !== descriptor.sizeBytes
    ) {
      blockers.push(`raw_descriptor_binding_mismatch:${descriptor.fileId}`);
    }
    const bytes = encodeVerifiedContent(file);
    if (bytes == null) {
      blockers.push(`raw_content_reencoding_unsupported:${descriptor.fileId}`);
      continue;
    }
    const recomputedSha256 = createHash("sha256").update(bytes).digest("hex");
    if (
      bytes.length !== descriptor.sizeBytes ||
      recomputedSha256 !== descriptor.sha256 ||
      recomputedSha256 !== file.observedSha256
    ) {
      blockers.push(`raw_content_rehash_mismatch:${descriptor.fileId}`);
    }
    bindings.push({
      fileId: descriptor.fileId,
      familyId: descriptor.familyId,
      semanticRole: descriptor.semanticRole,
      path: descriptor.path,
      observedSha256: file.observedSha256,
      compilerRecomputedSha256: recomputedSha256,
      sizeBytes: file.observedSizeBytes,
    });
  }
  if (observedIds.size !== descriptorById.size) {
    blockers.push("raw_file_inventory_not_exact");
  }
  for (const [familyId, roles] of Object.entries(
    NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES,
  )) {
    for (const semanticRole of Object.keys(roles)) {
      const roleKey = `${familyId}:${semanticRole}`;
      if (!roleKeys.has(roleKey)) blockers.push(`raw_role_missing:${roleKey}`);
    }
  }
  bindings.sort((left, right) => compareUtf8(left.path, right.path));
  const closureSha256 = createHash("sha256")
    .update(HASH_DOMAIN, "utf8")
    .update(canonicalJson(bindings), "utf8")
    .digest("hex");
  return {
    accepted: blockers.length === 0,
    blockers: uniqueSorted(blockers),
    bindings,
    closureSha256,
  };
};

type Verified = Extract<
  Nhm2PrimaryRawOutputFilesystemVerification,
  { verified: true }
>;

const inputEntry = (
  verification: Verified,
  inputId: string,
): Nhm2PrimaryRawOutputHashedInputV1 | null =>
  verification.manifest.inputClosure.entries.find(
    (entry) => entry.inputId === inputId,
  ) ?? null;

const inputArtifact = (verification: Verified, inputId: string) => {
  const entry = inputEntry(verification, inputId);
  return { path: entry?.path ?? null, sha256: entry?.sha256 ?? null };
};

const inputArtifactWithRef = (verification: Verified, inputId: string) => {
  const entry = inputEntry(verification, inputId);
  return {
    ref: entry?.path ?? null,
    sha256: entry == null ? null : `sha256:${entry.sha256}`,
  };
};

const fileFor = (
  verification: Verified,
  familyId: Nhm2PrimaryRawOutputFamilyId,
  semanticRole: string,
): Nhm2PrimaryRawOutputVerifiedFile | null =>
  verification.files.find(
    (entry) =>
      entry.descriptor.familyId === familyId &&
      entry.descriptor.semanticRole === semanticRole,
  ) ?? null;

const artifactFor = (
  verification: Verified,
  familyId: Nhm2PrimaryRawOutputFamilyId,
  semanticRole: string,
) => {
  const file = fileFor(verification, familyId, semanticRole);
  return {
    path: file?.descriptor.path ?? null,
    sha256: file?.observedSha256 ?? null,
  };
};

const prefixedArtifactFor = (
  verification: Verified,
  familyId: Nhm2PrimaryRawOutputFamilyId,
  semanticRole: string,
) => {
  const file = fileFor(verification, familyId, semanticRole);
  return {
    ref: file?.descriptor.path ?? null,
    sha256: file == null ? null : `sha256:${file.observedSha256}`,
  };
};

const numericalFileFor = (
  verification: Verified,
  familyId: Nhm2PrimaryRawOutputFamilyId,
  semanticRole: string,
): Nhm2PrimaryRawOutputVerifiedNumericalFile | null => {
  const file = fileFor(verification, familyId, semanticRole);
  return file?.kind === "numerical_array" ? file : null;
};

const arrayFor = (
  verification: Verified,
  familyId: Nhm2PrimaryRawOutputFamilyId,
  semanticRole: string,
) => {
  const file = numericalFileFor(verification, familyId, semanticRole);
  const representation = file?.descriptor.representation;
  return {
    path: file?.descriptor.path ?? null,
    sha256: file?.observedSha256 ?? null,
    dtype:
      representation?.kind === "numerical_array" ? ("float64" as const) : null,
    shape:
      representation?.kind === "numerical_array" ? representation.shape : [],
    sizeBytes: file?.observedSizeBytes ?? null,
    storageOrder:
      representation?.kind === "numerical_array"
        ? representation.storageOrder
        : null,
    componentOrder:
      representation?.kind === "numerical_array"
        ? [...representation.componentOrder]
        : [],
    unit:
      representation?.kind === "numerical_array" ? representation.unit : null,
  };
};

const prefixedArrayFor = (
  verification: Verified,
  familyId: Nhm2PrimaryRawOutputFamilyId,
  semanticRole: string,
) => {
  const file = numericalFileFor(verification, familyId, semanticRole);
  const representation = file?.descriptor.representation;
  return {
    ref: file?.descriptor.path ?? null,
    sha256: file == null ? null : `sha256:${file.observedSha256}`,
    dtype:
      representation?.kind === "numerical_array" ? ("float64" as const) : null,
    binaryEncoding:
      representation?.kind === "numerical_array"
        ? ("raw_ieee754" as const)
        : null,
    endianness:
      representation?.kind === "numerical_array"
        ? representation.endianness
        : null,
    shape:
      representation?.kind === "numerical_array" ? representation.shape : [],
    sizeBytes: file?.observedSizeBytes ?? null,
    storageOrder:
      representation?.kind === "numerical_array"
        ? representation.storageOrder
        : null,
    componentOrder:
      representation?.kind === "numerical_array"
        ? representation.componentOrder.map((entry) =>
            /^t(?:00|01|02|03|11|12|13|22|23|33)$/.test(entry)
              ? entry.toUpperCase()
              : entry,
          )
        : [],
    unit:
      representation?.kind === "numerical_array" ? representation.unit : null,
  };
};

const qeiArrayFor = (
  verification: Verified,
  familyId: Nhm2PrimaryRawOutputFamilyId,
  semanticRole: string,
) => {
  const value = prefixedArrayFor(verification, familyId, semanticRole);
  return {
    path: value.ref,
    sha256: value.sha256,
    dtype: value.dtype,
    binaryEncoding: value.binaryEncoding,
    endianness: value.endianness,
    shape: value.shape,
    sizeBytes: value.sizeBytes,
    storageOrder: value.storageOrder,
    componentOrder: value.componentOrder,
    unit: value.unit,
  };
};

const fullTensorArrayFor = (verification: Verified, semanticRole: string) => {
  const value = arrayFor(
    verification,
    "full_apparatus_source_tensor",
    semanticRole,
  );
  return {
    ...value,
    componentOrder: value.componentOrder
      .map((entry) => entry.toUpperCase())
      .filter((entry) =>
        [
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
        ].includes(entry),
      ) as Nhm2FullApparatusSourceTensorComponent[],
  };
};

const commonBinding = (verification: Verified) => {
  const manifest = verification.manifest;
  const candidate = inputEntry(
    verification,
    manifest.identity.candidateManifest.inputId,
  );
  const atlas = inputEntry(verification, manifest.identity.atlas.inputId);
  const units = inputEntry(verification, manifest.identity.units.inputId);
  const normalization = inputEntry(
    verification,
    manifest.identity.normalization.inputId,
  );
  return {
    candidateId: manifest.identity.candidateId,
    candidateManifestPath: candidate?.path ?? null,
    candidateManifestSha256: manifest.identity.candidateManifest.sha256,
    preRunManifestPath: candidate?.path ?? null,
    preRunManifestSha256: manifest.identity.candidateManifest.sha256,
    numericPolicySetPath: null,
    numericPolicySetRawSha256: null,
    numericPolicySetSemanticSha256: null,
    runId: manifest.execution.runId,
    requestId: manifest.execution.requestId,
    receiptId: manifest.execution.receiptId,
    runtimeId: manifest.execution.runtimeId,
    plannedOutputDirectory: verification.runRootRealPath,
    laneId: manifest.identity.laneId,
    selectedProfileId: manifest.identity.selectedProfileId,
    chartId: manifest.identity.chartId,
    atlasPath: atlas?.path ?? null,
    atlasSha256: manifest.identity.atlas.sha256,
    unitsPath: units?.path ?? null,
    unitsSha256: manifest.identity.units.sha256,
    normalizationPath: normalization?.path ?? null,
    normalizationSha256: manifest.identity.normalization.sha256,
    gitSha: manifest.execution.sourceCommitSha,
  } as const;
};

const commonProvenance = (verification: Verified) => {
  const manifest = verification.manifest;
  return {
    producerId: manifest.execution.producerBundle.bundleId,
    producerVersion: null,
    implementationId: manifest.execution.solver.implementationId,
    solverId: manifest.execution.solver.solverId,
    solverVersion: manifest.execution.solver.solverVersion,
    solver: inputArtifact(
      verification,
      manifest.execution.solver.input.inputId,
    ),
    environment: inputArtifact(
      verification,
      manifest.execution.environment.input.inputId,
    ),
    invocation: { path: null, sha256: null },
    inputManifest: inputArtifact(
      verification,
      manifest.identity.candidateManifest.inputId,
    ),
    command: manifest.execution.invocation.command,
    argv: [...manifest.execution.invocation.argv],
    workingDirectory: manifest.execution.invocation.workingDirectory,
    outputDirectory: verification.runRootRealPath,
    runId: manifest.execution.runId,
    requestId: manifest.execution.requestId,
    receiptId: manifest.execution.receiptId,
    runtimeId: manifest.execution.runtimeId,
    gitSha: manifest.execution.sourceCommitSha,
    startedAt: manifest.execution.startedAt,
    completedAt: manifest.execution.completedAt,
    durationMs: manifest.execution.durationMs,
    deterministicSeed: manifest.execution.deterministicSeed,
    runSpecificOutput: true,
  };
};

const emptyArtifacts = () => ({
  full_apparatus_source_tensor: buildNhm2FullApparatusSourceTensor(),
  semiclassical_state: buildNhm2SemiclassicalStateRealizability(),
  covariant_conservation: buildNhm2CovariantConservation(),
  continuous_observer_optimizer: buildNhm2ContinuousObserverOptimizer(),
  worldline_qei: buildNhm2WorldlineQeiCoverage(),
  dynamic_backreaction_stability_causality:
    buildNhm2DynamicBackreactionStabilityCausality(),
  finite_temperature_finite_geometry_maxwell_stress:
    buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(),
  mechanical_support_control_margin: buildNhm2MechanicalSupportControlMargin(),
});

const buildArtifacts = (
  verification: Verified,
  grReplay: Nhm2PrimaryRawGrContentReplay,
  materialReplay: Nhm2PrimaryRawMaterialDynamicsReplayResult,
) => {
  const manifest = verification.manifest;
  const binding = commonBinding(verification);
  const provenance = commonProvenance(verification);
  const selectedProfile = inputArtifact(
    verification,
    manifest.identity.selectedProfile.inputId,
  );
  const atlas = inputArtifact(verification, manifest.identity.atlas.inputId);
  const units = inputArtifact(verification, manifest.identity.units.inputId);
  const normalization = inputArtifact(
    verification,
    manifest.identity.normalization.inputId,
  );
  const rawTotal = fullTensorArrayFor(verification, "total_tensor_components");
  const rawRequired = fullTensorArrayFor(
    verification,
    "metric_required_tensor_components",
  );
  const rawResidual = fullTensorArrayFor(verification, "residual_components");
  const totalDescriptor = numericalFileFor(
    verification,
    "full_apparatus_source_tensor",
    "total_tensor_components",
  )?.descriptor.representation;
  const commonIdentity = {
    candidateId: manifest.identity.candidateId,
    candidateManifestSha256: manifest.identity.candidateManifest.sha256,
    preRunManifest: inputArtifact(
      verification,
      manifest.identity.candidateManifest.inputId,
    ),
    laneId: manifest.identity.laneId,
    runId: manifest.execution.runId,
    requestId: manifest.execution.requestId,
    receiptId: manifest.execution.receiptId,
    selectedProfileId: manifest.identity.selectedProfileId,
    chartId: manifest.identity.chartId,
    atlas,
    units,
    normalization,
    gitSha: manifest.execution.sourceCommitSha,
  } as const;
  const generatedAt = manifest.execution.completedAt;

  const full = buildNhm2FullApparatusSourceTensor({
    generatedAt,
    identity: {
      ...commonIdentity,
      runtimeId: manifest.execution.runtimeId,
      selectedProfile,
    },
    frozenFrame: {
      sourceFrame: {
        chartId: manifest.identity.chartId,
        basis: "coordinate",
        tensorIndexPosition: "covariant",
        unit: "J/m^3",
        atlasSha256: manifest.identity.atlas.sha256,
        unitsSha256: manifest.identity.units.sha256,
        normalizationSha256: manifest.identity.normalization.sha256,
      },
      metricFrame: {
        chartId: manifest.identity.chartId,
        basis: "coordinate",
        tensorIndexPosition: "covariant",
        unit: "J/m^3",
        atlasSha256: manifest.identity.atlas.sha256,
        unitsSha256: manifest.identity.units.sha256,
        normalizationSha256: manifest.identity.normalization.sha256,
      },
      componentOrder: rawTotal.componentOrder,
      tensorSymmetry: "symmetric",
      dtype: "float64",
      endianness: "little",
      arrayShape: rawTotal.shape,
      spatialSampleCount:
        totalDescriptor?.kind === "numerical_array"
          ? totalDescriptor.shape[0]
          : null,
      sampleIndex: artifactFor(
        verification,
        "full_apparatus_source_tensor",
        "grid_topology_records",
      ),
    },
    sourceTensor: {
      rawTotalTensorArray: rawTotal,
      componentLedger: artifactFor(
        verification,
        "full_apparatus_source_tensor",
        "apparatus_term_ledger",
      ),
      constitutiveRegistry: artifactFor(
        verification,
        "semiclassical_state",
        "renormalization_inputs",
      ),
      decompositionLedger: artifactFor(
        verification,
        "full_apparatus_source_tensor",
        "apparatus_term_ledger",
      ),
    },
    sourceProvenanceDag: {
      graph: artifactFor(
        verification,
        "full_apparatus_source_tensor",
        "source_provenance_edges",
      ),
      edgeIndex: artifactFor(
        verification,
        "full_apparatus_source_tensor",
        "source_provenance_edges",
      ),
    },
    metricComparison: {
      rawMetricTensorArray: fullTensorArrayFor(
        verification,
        "metric_tensor_components",
      ),
      rawRequiredSourceTensorArray: rawRequired,
      rawAbsoluteResidualArray: rawResidual,
      relativeResidualTolerance: grReplay.thresholds.sourceResidualRelativeMax,
    },
    evolutionCoupling: {
      sourceTensorInputSha256: rawTotal.sha256,
    },
    provenance: {
      ...provenance,
      producerId: provenance.producerId,
      solver: provenance.solver,
      environment: provenance.environment,
      invocation: provenance.invocation,
      inputManifest: provenance.inputManifest,
    },
  });

  const semiclassical = buildNhm2SemiclassicalStateRealizability({
    generatedAt,
    laneId: manifest.identity.laneId,
    selectedProfileId: manifest.identity.selectedProfileId,
    runId: manifest.execution.runId,
    fieldState: {
      stateArtifact: prefixedArrayFor(
        verification,
        "semiclassical_state",
        "state_mode_coefficients",
      ),
      stateConstruction: prefixedArtifactFor(
        verification,
        "semiclassical_state",
        "renormalization_inputs",
      ),
      sampleCount:
        materialReplay.families.semiclassical.metrics.sampleCount || null,
    },
    admissibility: {
      twoPointFunction: prefixedArrayFor(
        verification,
        "semiclassical_state",
        "two_point_function_samples",
      ),
    },
    renormalization: {
      prescription: prefixedArtifactFor(
        verification,
        "semiclassical_state",
        "renormalization_inputs",
      ),
    },
    stressTensor: {
      tensor: prefixedArrayFor(
        verification,
        "semiclassical_state",
        "renormalized_tensor_components",
      ),
      chartId: manifest.identity.chartId,
      unit: "J/m^3",
    },
    wardIdentity: {
      divergenceSamples: prefixedArrayFor(
        verification,
        "semiclassical_state",
        "ward_divergence_components",
      ),
      sampleCount:
        materialReplay.families.semiclassical.metrics.sampleCount || null,
    },
    qeiBinding: {
      worldlineSet: prefixedArtifactFor(
        verification,
        "worldline_qei",
        "worldline_catalog",
      ),
      worldlineCount: grReplay.families.worldline_qei.metrics.worldlineCount,
      minimumMarginSI: grReplay.families.worldline_qei.metrics.minimumMargin,
    },
    preparationSwitching: {
      switchingFunction: prefixedArtifactFor(
        verification,
        "semiclassical_state",
        "switching_profile_samples",
      ),
    },
    uncertaintyBudget: {
      maximumRelativeHalfWidth95:
        materialReplay.families.semiclassical.metrics
          .maximumRelativeUncertainty95,
    },
    backreaction: {
      geometry: prefixedArrayFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "evolved_geometry_components",
      ),
      sourceTensor: prefixedArrayFor(
        verification,
        "semiclassical_state",
        "renormalized_tensor_components",
      ),
      sampleCount:
        materialReplay.families.semiclassical.metrics.sampleCount || null,
      selfConsistentIterations:
        materialReplay.families.semiclassical.metrics
          .backreactionIterationDifferencesJPerM3.length,
    },
    provenance: {
      ...provenance,
      producer: provenance.producerId,
      producerVersion: null,
      solver: inputArtifactWithRef(
        verification,
        manifest.execution.solver.input.inputId,
      ),
      environment: inputArtifactWithRef(
        verification,
        manifest.execution.environment.input.inputId,
      ),
      invocation: { ref: null, sha256: null },
      inputManifest: inputArtifactWithRef(
        verification,
        manifest.identity.candidateManifest.inputId,
      ),
    },
  });

  const conservation = buildNhm2CovariantConservation({
    generatedAt,
    binding,
    sourceBinding: {
      sourceContractVersion: full.contractVersion,
      rawTotalSourceTensor: artifactFor(
        verification,
        "full_apparatus_source_tensor",
        "total_tensor_components",
      ),
      candidateId: manifest.identity.candidateId,
      candidateManifestSha256: manifest.identity.candidateManifest.sha256,
      runId: manifest.execution.runId,
      chartId: manifest.identity.chartId,
    },
    divergence: {
      derivativeDefinition: artifactFor(
        verification,
        "covariant_conservation",
        "derivative_stencil_records",
      ),
      connectionCoefficients: arrayFor(
        verification,
        "covariant_conservation",
        "connection_coefficient_components",
      ),
      volumeMask: arrayFor(
        verification,
        "full_apparatus_source_tensor",
        "integration_weight_mask_samples",
      ),
      sampleCount:
        grReplay.families.covariant_conservation.metrics.sampleCount || null,
    },
    discreteGlobalBalance: {
      evidence: artifactFor(
        verification,
        "covariant_conservation",
        "boundary_flux_components",
      ),
      outwardBoundaryFlux: arrayFor(
        verification,
        "covariant_conservation",
        "boundary_flux_components",
      ),
      sampleCount:
        grReplay.families.covariant_conservation.metrics.sampleCount || null,
      toleranceRelative: grReplay.thresholds.conservationRelativeMax,
    },
    cycleEnergyLedger: {
      evidence: artifactFor(
        verification,
        "covariant_conservation",
        "cycle_energy_samples",
      ),
      timeSeries: arrayFor(
        verification,
        "covariant_conservation",
        "cycle_energy_samples",
      ),
    },
    convergence: {
      evidence: artifactFor(
        verification,
        "covariant_conservation",
        "refinement_samples",
      ),
    },
    uncertaintyBudget: {
      evidence: artifactFor(
        verification,
        "covariant_conservation",
        "uncertainty_samples",
      ),
    },
    provenance,
  });

  const observer = buildNhm2ContinuousObserverOptimizer({
    generatedAt,
    identity: commonIdentity,
    sourceBinding: {
      sourceContractVersion: full.contractVersion,
      rawTotalSourceTensor: artifactFor(
        verification,
        "full_apparatus_source_tensor",
        "total_tensor_components",
      ),
      candidateId: manifest.identity.candidateId,
      candidateManifestSha256: manifest.identity.candidateManifest.sha256,
      runId: manifest.execution.runId,
      chartId: manifest.identity.chartId,
    },
    domain: {
      admittedSpatialSampleCount:
        grReplay.families.continuous_observer_optimizer.metrics
          .spatialSampleCount,
      optimizedSpatialSampleCount:
        grReplay.families.continuous_observer_optimizer.metrics
          .spatialSampleCount,
      spatialSampleIndex: artifactFor(
        verification,
        "continuous_observer_optimizer",
        "spatial_sample_index",
      ),
      timelikeManifold: {
        parameterization: "unit_timelike_hyperboloid",
        dimension: 3,
        parameterSamples: artifactFor(
          verification,
          "continuous_observer_optimizer",
          "timelike_observer_vectors",
        ),
      },
      nullManifold: {
        parameterization: "future_null_directions",
        dimension: 2,
        directionCount:
          grReplay.families.continuous_observer_optimizer.metrics
            .directionCount,
        directionSamples: artifactFor(
          verification,
          "continuous_observer_optimizer",
          "null_direction_vectors",
        ),
      },
    },
    extrema: {
      rawExtremaArray: artifactFor(
        verification,
        "continuous_observer_optimizer",
        "energy_condition_extrema",
      ),
    },
    optimizer: {
      objectiveDefinition: artifactFor(
        verification,
        "continuous_observer_optimizer",
        "energy_condition_optimizer_bindings",
      ),
      globalityCertificate: artifactFor(
        verification,
        "continuous_observer_optimizer",
        "globality_search_samples",
      ),
      adversarialStarts: {
        completedCount:
          grReplay.families.continuous_observer_optimizer.metrics
            .adversarialStartCount,
        distinctStartCount:
          grReplay.families.continuous_observer_optimizer.metrics
            .distinctAdversarialStartCount,
        starts: artifactFor(
          verification,
          "continuous_observer_optimizer",
          "adversarial_start_samples",
        ),
        replay: artifactFor(
          verification,
          "continuous_observer_optimizer",
          "optimizer_trace_samples",
        ),
      },
    },
    uncertainty: {
      rawSamples: artifactFor(
        verification,
        "continuous_observer_optimizer",
        "uncertainty_samples",
      ),
    },
    provenance,
  });

  const qei = buildNhm2WorldlineQeiCoverage({
    generatedAt,
    identity: commonIdentity,
    stateBinding: {
      stateArtifact: qeiArrayFor(
        verification,
        "semiclassical_state",
        "state_mode_coefficients",
      ),
      renormalizedStressTensor: qeiArrayFor(
        verification,
        "semiclassical_state",
        "renormalized_tensor_components",
      ),
      renormalizationPrescription: {
        path: artifactFor(
          verification,
          "semiclassical_state",
          "renormalization_inputs",
        ).path,
        sha256: prefixedArtifactFor(
          verification,
          "semiclassical_state",
          "renormalization_inputs",
        ).sha256,
      },
    },
    coverage: {
      admittedWorldlineCount:
        grReplay.families.worldline_qei.metrics.worldlineCount,
      evaluatedWorldlineCount:
        grReplay.families.worldline_qei.metrics.worldlineCount,
      worldlineSet: {
        path: artifactFor(verification, "worldline_qei", "worldline_catalog")
          .path,
        sha256: prefixedArtifactFor(
          verification,
          "worldline_qei",
          "worldline_catalog",
        ).sha256,
      },
      coverageManifest: {
        path: artifactFor(
          verification,
          "worldline_qei",
          "worldline_apparatus_interpolation_entries",
        ).path,
        sha256: prefixedArtifactFor(
          verification,
          "worldline_qei",
          "worldline_apparatus_interpolation_entries",
        ).sha256,
      },
    },
    uncertainty: {
      covariance: qeiArrayFor(
        verification,
        "worldline_qei",
        "uncertainty_samples",
      ),
    },
    provenance: {
      ...provenance,
      solver: {
        path: provenance.solver.path,
        sha256:
          provenance.solver.sha256 == null
            ? null
            : `sha256:${provenance.solver.sha256}`,
      },
      environment: {
        path: provenance.environment.path,
        sha256:
          provenance.environment.sha256 == null
            ? null
            : `sha256:${provenance.environment.sha256}`,
      },
      invocation: { path: null, sha256: null },
      inputManifest: {
        path: provenance.inputManifest.path,
        sha256:
          provenance.inputManifest.sha256 == null
            ? null
            : `sha256:${provenance.inputManifest.sha256}`,
      },
    },
  });

  const dynamics = buildNhm2DynamicBackreactionStabilityCausality({
    generatedAt,
    binding,
    initialCoupling: {
      initialData: artifactFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "evolution_grid_records",
      ),
      geometryState: arrayFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "initial_data_components",
      ),
      sourceTensor: arrayFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "evolved_source_components",
      ),
    },
    evolution: {
      samples: [],
    },
    bssnConstraints: {
      evidence: artifactFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "constraint_residual_components",
      ),
    },
    convergence: {
      evidence: artifactFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "resolution_refinement_samples",
      ),
    },
    semiclassicalBackreaction: {
      geometry: arrayFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "evolved_geometry_components",
      ),
      renormalizedStressTensor: arrayFor(
        verification,
        "semiclassical_state",
        "renormalized_tensor_components",
      ),
      sourceTensor: arrayFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "evolved_source_components",
      ),
      selfConsistentIterations:
        materialReplay.families.dynamics.metrics
          .backreactionIterationDifferences.length,
    },
    horizonCharacteristicScreen: {
      evidence: artifactFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "characteristic_ray_samples",
      ),
      outgoingNullExpansion: arrayFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "characteristic_ray_samples",
      ),
      minimumOutgoingExpansion:
        materialReplay.families.dynamics.metrics.minimumOutgoingExpansion,
      minimumHyperbolicityMargin:
        materialReplay.families.dynamics.metrics.minimumHyperbolicityMargin,
    },
    rayParticleScreen: {
      nullRayBundle: arrayFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "characteristic_ray_samples",
      ),
    },
    perturbationSpectrum: {
      spectrum: arrayFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "perturbation_mode_samples",
      ),
      maximumAllowedGrowthRatePerS: null,
    },
    globalCausalityScreen: {
      evidence: artifactFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "causal_screen_samples",
      ),
      causalIntervalSamples: arrayFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "causal_screen_samples",
      ),
    },
    parameterNeighborhood: {
      evidence: artifactFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "parameter_neighborhood_samples",
      ),
    },
    uncertainty: {
      evidence: artifactFor(
        verification,
        "dynamic_backreaction_stability_causality",
        "backreaction_iteration_fields",
      ),
    },
    provenance,
  });

  const maxwell = buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress({
    generatedAt,
    binding,
    thermodynamics: {
      matsubaraFrequencies: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "matsubara_mode_samples",
      ),
      matsubaraTermContributions: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "matsubara_mode_samples",
      ),
      matsubaraTermCount:
        materialReplay.families.maxwell.metrics.matsubaraModeCountPerSurface,
    },
    dielectricResponse: {
      kramersKronig: {
        residuals: arrayFor(
          verification,
          "finite_temperature_finite_geometry_maxwell_stress",
          "dielectric_response_samples",
        ),
      },
    },
    finiteGeometry: {
      mesh: artifactFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "geometry_mesh_records",
      ),
      materialMap: artifactFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "material_region_records",
      ),
      integrationSurface: artifactFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "integration_surface_samples",
      ),
      sampleCount: materialReplay.families.maxwell.metrics.surfaceCount,
      maxwellStressTensor: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "maxwell_stress_components",
      ),
      surfaceNormals: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "integration_surface_samples",
      ),
    },
    convergence: {
      evidence: artifactFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "mesh_frequency_refinement_samples",
      ),
      matsubaraResiduals: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "mesh_frequency_refinement_samples",
      ),
      meshResiduals: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "mesh_frequency_refinement_samples",
      ),
    },
    forceGapGradient: {
      evidence: artifactFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "force_gap_gradient_samples",
      ),
      gapCoordinates: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "force_gap_gradient_samples",
      ),
      integratedForce: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "force_gap_gradient_samples",
      ),
      forceGradient: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "force_gap_gradient_samples",
      ),
      sampleCount: materialReplay.families.maxwell.metrics.gapValuesM.length,
    },
    uncertainty: {
      evidence: artifactFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "roughness_patch_temperature_samples",
      ),
    },
    provenance,
  });

  const mechanics = buildNhm2MechanicalSupportControlMargin({
    generatedAt,
    binding,
    forceGradientImport: {
      sourceContractVersion: maxwell.contractVersion,
      sourceCandidateId: manifest.identity.candidateId,
      sourceCandidateManifestSha256: manifest.identity.candidateManifest.sha256,
      sourceRunId: manifest.execution.runId,
      forceGapCoordinates: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "force_gap_gradient_samples",
      ),
      integratedForce: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "force_gap_gradient_samples",
      ),
      forceGradient: arrayFor(
        verification,
        "finite_temperature_finite_geometry_maxwell_stress",
        "force_gap_gradient_samples",
      ),
      idealParallelPlateFallbackUsed: false,
    },
    nonlinearFea: {
      mesh: artifactFor(
        verification,
        "mechanical_support_control_margin",
        "fea_mesh_records",
      ),
      materialModels: artifactFor(
        verification,
        "mechanical_support_control_margin",
        "material_constitutive_records",
      ),
      boundaryConditions: artifactFor(
        verification,
        "mechanical_support_control_margin",
        "boundary_condition_records",
      ),
      loadMap: artifactFor(
        verification,
        "mechanical_support_control_margin",
        "load_vector_components",
      ),
      residualNorm: materialReplay.families.mechanics.metrics.residualL2N,
      displacementField: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "displacement_components",
      ),
      stressField: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "stress_strain_components",
      ),
      modalSpectrum: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "stability_mode_samples",
      ),
    },
    supportRetention: {
      evidence: artifactFor(
        verification,
        "mechanical_support_control_margin",
        "support_retention_samples",
      ),
      jointSamples: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "support_retention_samples",
      ),
    },
    fabricationEnvelope: {
      evidence: artifactFor(
        verification,
        "mechanical_support_control_margin",
        "fabrication_tolerance_samples",
      ),
      jointSamples: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "fabrication_tolerance_samples",
      ),
    },
    activeControl: {
      commandTrace: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "active_control_cycle_samples",
      ),
      responseTrace: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "active_control_cycle_samples",
      ),
      noiseSpectrum: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "energy_heat_noise_samples",
      ),
      heatTrace: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "energy_heat_noise_samples",
      ),
      timingTrace: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "energy_heat_noise_samples",
      ),
    },
    periodicCycleEnergy: {
      evidence: artifactFor(
        verification,
        "mechanical_support_control_margin",
        "active_control_cycle_samples",
      ),
      timeSeries: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "active_control_cycle_samples",
      ),
      inputEnergyJ:
        materialReplay.families.mechanics.metrics.powerIntegratedCycleEnergyJ,
    },
    apparatusStressEnergy: {
      evidence: artifactFor(
        verification,
        "full_apparatus_source_tensor",
        "total_tensor_components",
      ),
      fullSourceTensor: arrayFor(
        verification,
        "full_apparatus_source_tensor",
        "total_tensor_components",
      ),
      chartId: manifest.identity.chartId,
    },
    uncertainty: {
      evidence: artifactFor(
        verification,
        "mechanical_support_control_margin",
        "energy_heat_noise_samples",
      ),
      covariance: arrayFor(
        verification,
        "mechanical_support_control_margin",
        "energy_heat_noise_samples",
      ),
    },
    provenance,
  });

  return {
    full_apparatus_source_tensor: full,
    semiclassical_state: semiclassical,
    covariant_conservation: conservation,
    continuous_observer_optimizer: observer,
    worldline_qei: qei,
    dynamic_backreaction_stability_causality: dynamics,
    finite_temperature_finite_geometry_maxwell_stress: maxwell,
    mechanical_support_control_margin: mechanics,
  };
};

const CURRENT_KERNEL_BLOCKERS = {
  full_apparatus_source_tensor: [
    "cartesian_domain_coverage_proof_unresolved",
    "duty_scaled_stress_energy_authority_prohibited_unresolved",
    "semiclassical_mode_equation_kernel_unreplayed",
    "finite_geometry_maxwell_green_operator_kernel_unreplayed",
    "mechanical_source_tensor_feedback_unreplayed",
    "apparatus_non_metric_echo_audit_unreplayed",
    "source_tensor_evolution_coupling_unresolved",
  ],
  semiclassical_state: [
    "server_material_dynamics_threshold_mapping_to_candidate_policy_unresolved",
    "semiclassical_mode_equation_kernel_unreplayed",
    "hadamard_state_admissibility_unreplayed",
    "renormalization_counterterm_and_ward_identity_unreplayed",
    "qei_semiclassical_state_identity_binding_unresolved",
  ],
  covariant_conservation: [
    "cartesian_domain_coverage_proof_unresolved",
    "renormalization_counterterm_and_ward_identity_unreplayed",
    "spacetime_conservation_evolution_kernel_unresolved",
  ],
  continuous_observer_optimizer: [
    "cartesian_domain_coverage_proof_unresolved",
    "continuous_global_observer_optimality_proof_unresolved",
  ],
  worldline_qei: [
    "cartesian_domain_coverage_proof_unresolved",
    "duty_scaled_stress_energy_authority_prohibited_unresolved",
    "qei_semiclassical_state_identity_binding_unresolved",
    "applicable_qei_theorem_binding_unresolved",
  ],
  dynamic_backreaction_stability_causality: [
    "cartesian_domain_coverage_proof_unresolved",
    "server_material_dynamics_threshold_mapping_to_candidate_policy_unresolved",
    "bssn_evolution_equations_unresolved",
    "semiclassical_backreaction_kernel_unresolved",
    "stability_causality_evolution_kernel_unresolved",
  ],
  finite_temperature_finite_geometry_maxwell_stress: [
    "server_material_dynamics_threshold_mapping_to_candidate_policy_unresolved",
    "finite_geometry_maxwell_green_operator_kernel_unreplayed",
    "material_measurement_receipt_content_verifier_unbound",
    "gap_surface_topology_binding_unresolved",
  ],
  mechanical_support_control_margin: [
    "server_material_dynamics_threshold_mapping_to_candidate_policy_unresolved",
    "nonlinear_fea_constitutive_assembly_unreplayed",
    "pull_in_buckling_contact_stiction_solver_unreplayed",
    "stress_thermal_fatigue_modal_solver_unreplayed",
    "material_coupon_receipt_content_verifier_unbound",
    "mechanical_source_tensor_feedback_unreplayed",
  ],
} as const satisfies Record<
  Nhm2PrimaryRawExperimentReadyEvidenceId,
  readonly string[]
>;

const claimBoundary = () => ({
  diagnosticReplayOnly: true as const,
  experimentReadyTheoryClosureClaimAllowed: false as const,
  theoryClosureEstablished: false as const,
  physicalViabilityEstablished: false as const,
  transportEstablished: false as const,
  propulsionEstablished: false as const,
  routeEtaEstablished: false as const,
  certifiedSpeedEstablished: false as const,
  empiricalValidationEstablished: false as const,
  empiricalReceiptsRequired: true as const,
});

const entryStatus = (
  blockers: readonly string[],
  failures: readonly string[],
): Nhm2PrimaryRawCompiledEvidenceStatus =>
  blockers.length > 0 ? "blocked" : failures.length > 0 ? "fail" : "pass";

const familyBindings = (
  bindings: RawFileBinding[],
  familyId: Nhm2PrimaryRawOutputFamilyId,
): RawFileBinding[] => bindings.filter((entry) => entry.familyId === familyId);

/**
 * Compiles filesystem-verified primitives into the eight primary evidence
 * contracts. Both supplied replay objects are exact-match witnesses only: the
 * compiler rebuilds them and ignores their producer/caller-authored status.
 * Current missing scientific kernels are explicit, compiler-owned blockers.
 */
export function compileNhm2PrimaryRawExperimentReadyEvidence(
  input: CompileNhm2PrimaryRawExperimentReadyEvidenceInput,
): Nhm2PrimaryRawExperimentReadyEvidenceCompilation {
  const raw = validateAndRehashRawVerification(input.rawVerification);
  const replayVerification = raw.accepted
    ? input.rawVerification
    : falseVerification();
  const recomputedGr = replayNhm2PrimaryRawGrContent(replayVerification);
  const recomputedMaterial = replayNhm2PrimaryRawMaterialDynamicsContent({
    ...input.materialDynamicsReplayContext,
    rawVerification: replayVerification,
  });
  const grExactMatch = isDeepStrictEqual(input.grReplay, recomputedGr);
  const materialExactMatch = isDeepStrictEqual(
    input.materialDynamicsReplay,
    recomputedMaterial,
  );
  const globalBlockers = [...raw.blockers];
  if (!grExactMatch) {
    globalBlockers.push("provided_gr_replay_not_exact_outer_recomputation");
  }
  if (!materialExactMatch) {
    globalBlockers.push(
      "provided_material_dynamics_replay_not_exact_outer_recomputation",
    );
  }
  if (!recomputedGr.inputVerificationAccepted) {
    globalBlockers.push("gr_replay_did_not_accept_verified_raw_input");
  }
  if (!recomputedMaterial.acceptedInput) {
    globalBlockers.push(
      "material_dynamics_replay_did_not_accept_verified_raw_input",
    );
  }
  globalBlockers.push(
    ...recomputedMaterial.inputBlockers.map(
      (entry) => `material_dynamics_replay_input:${entry}`,
    ),
  );
  const artifacts =
    raw.accepted && input.rawVerification.verified
      ? buildArtifacts(input.rawVerification, recomputedGr, recomputedMaterial)
      : emptyArtifacts();

  const buildEntry = <Artifact extends { blockers: string[] }, Metrics>(input: {
    evidenceId: Nhm2PrimaryRawExperimentReadyEvidenceId;
    familyId: Nhm2PrimaryRawOutputFamilyId;
    artifact: Artifact;
    metrics: Metrics;
    replayBlockers: readonly string[];
    failures: readonly string[];
  }): CompiledEvidenceEntry<Artifact, Metrics> => {
    const blockers = uniqueSorted([
      ...globalBlockers,
      ...CURRENT_KERNEL_BLOCKERS[input.evidenceId],
      ...input.replayBlockers,
      ...input.artifact.blockers.map((entry) => `contract:${entry}`),
    ]);
    const failures = uniqueSorted(input.failures);
    const status = entryStatus(blockers, failures);
    return {
      status,
      ready: status === "pass",
      artifact: input.artifact,
      replayMetrics: input.metrics,
      rawFileBindings: familyBindings(raw.bindings, input.familyId),
      blockers,
      failures,
    };
  };

  const evidence = {
    full_apparatus_source_tensor: buildEntry({
      evidenceId: "full_apparatus_source_tensor",
      familyId: "full_apparatus_source_tensor",
      artifact: artifacts.full_apparatus_source_tensor,
      metrics: recomputedGr.families.full_apparatus_source_tensor.metrics,
      replayBlockers:
        recomputedGr.families.full_apparatus_source_tensor.blockers,
      failures: recomputedGr.families.full_apparatus_source_tensor.failures,
    }),
    semiclassical_state: buildEntry({
      evidenceId: "semiclassical_state",
      familyId: "semiclassical_state",
      artifact: artifacts.semiclassical_state,
      metrics: recomputedMaterial.families.semiclassical.metrics,
      replayBlockers: recomputedMaterial.families.semiclassical.blockers,
      failures: recomputedMaterial.families.semiclassical.breaches,
    }),
    covariant_conservation: buildEntry({
      evidenceId: "covariant_conservation",
      familyId: "covariant_conservation",
      artifact: artifacts.covariant_conservation,
      metrics: recomputedGr.families.covariant_conservation.metrics,
      replayBlockers: recomputedGr.families.covariant_conservation.blockers,
      failures: recomputedGr.families.covariant_conservation.failures,
    }),
    continuous_observer_optimizer: buildEntry({
      evidenceId: "continuous_observer_optimizer",
      familyId: "continuous_observer_optimizer",
      artifact: artifacts.continuous_observer_optimizer,
      metrics: recomputedGr.families.continuous_observer_optimizer.metrics,
      replayBlockers:
        recomputedGr.families.continuous_observer_optimizer.blockers,
      failures: recomputedGr.families.continuous_observer_optimizer.failures,
    }),
    worldline_qei: buildEntry({
      evidenceId: "worldline_qei",
      familyId: "worldline_qei",
      artifact: artifacts.worldline_qei,
      metrics: recomputedGr.families.worldline_qei.metrics,
      replayBlockers: recomputedGr.families.worldline_qei.blockers,
      failures: recomputedGr.families.worldline_qei.failures,
    }),
    dynamic_backreaction_stability_causality: buildEntry({
      evidenceId: "dynamic_backreaction_stability_causality",
      familyId: "dynamic_backreaction_stability_causality",
      artifact: artifacts.dynamic_backreaction_stability_causality,
      metrics: recomputedMaterial.families.dynamics.metrics,
      replayBlockers: recomputedMaterial.families.dynamics.blockers,
      failures: recomputedMaterial.families.dynamics.breaches,
    }),
    finite_temperature_finite_geometry_maxwell_stress: buildEntry({
      evidenceId: "finite_temperature_finite_geometry_maxwell_stress",
      familyId: "finite_temperature_finite_geometry_maxwell_stress",
      artifact: artifacts.finite_temperature_finite_geometry_maxwell_stress,
      metrics: recomputedMaterial.families.maxwell.metrics,
      replayBlockers: recomputedMaterial.families.maxwell.blockers,
      failures: recomputedMaterial.families.maxwell.breaches,
    }),
    mechanical_support_control_margin: buildEntry({
      evidenceId: "mechanical_support_control_margin",
      familyId: "mechanical_support_control_margin",
      artifact: artifacts.mechanical_support_control_margin,
      metrics: recomputedMaterial.families.mechanics.metrics,
      replayBlockers: recomputedMaterial.families.mechanics.blockers,
      failures: recomputedMaterial.families.mechanics.breaches,
    }),
  };
  const allEntries = Object.values(evidence);
  const blockers = uniqueSorted(allEntries.flatMap((entry) => entry.blockers));
  const failures = uniqueSorted(allEntries.flatMap((entry) => entry.failures));
  const status = entryStatus(blockers, failures);
  const verifiedManifest =
    raw.accepted && input.rawVerification.verified
      ? input.rawVerification.manifest
      : null;
  return {
    contractVersion:
      NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_COMPILER_CONTRACT_VERSION,
    status,
    acceptedInput:
      raw.accepted &&
      grExactMatch &&
      materialExactMatch &&
      recomputedGr.inputVerificationAccepted &&
      recomputedMaterial.acceptedInput,
    source: {
      candidateId: verifiedManifest?.identity.candidateId ?? null,
      runId: verifiedManifest?.execution.runId ?? null,
      manifestSha256:
        raw.accepted && input.rawVerification.verified
          ? input.rawVerification.manifestSha256
          : null,
      rawContentClosureSha256: raw.closureSha256,
    },
    replayIntegrity: {
      grProvidedSha256: sha256Json(input.grReplay),
      grRecomputedSha256: sha256Json(recomputedGr),
      grExactMatch,
      materialDynamicsProvidedSha256: sha256Json(input.materialDynamicsReplay),
      materialDynamicsRecomputedSha256: sha256Json(recomputedMaterial),
      materialDynamicsExactMatch: materialExactMatch,
    },
    evidence,
    blockers,
    failures,
    unresolvedKernelBlockers: uniqueSorted(
      NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_IDS.flatMap(
        (evidenceId) => CURRENT_KERNEL_BLOCKERS[evidenceId],
      ),
    ),
    claimBoundary: claimBoundary(),
  };
}

/**
 * Production entry point. It reopens the run directory through the raw
 * filesystem verifier and constructs both replay witnesses internally, so no
 * caller-authored verification or scientific disposition can enter the
 * compiler boundary.
 */
export async function compileNhm2PrimaryRawExperimentReadyEvidenceFromFilesystem(
  input: CompileNhm2PrimaryRawExperimentReadyEvidenceFromFilesystemInput,
): Promise<Nhm2PrimaryRawExperimentReadyEvidenceCompilation> {
  const rawVerification = await verifyNhm2PrimaryRawOutputFilesystem(
    input.filesystem,
  );
  const grReplay = replayNhm2PrimaryRawGrContent(rawVerification);
  const materialDynamicsReplay = replayNhm2PrimaryRawMaterialDynamicsContent({
    ...input.materialDynamicsReplayContext,
    rawVerification,
  });
  return compileNhm2PrimaryRawExperimentReadyEvidence({
    rawVerification,
    grReplay,
    materialDynamicsReplay,
    materialDynamicsReplayContext: input.materialDynamicsReplayContext,
  });
}
