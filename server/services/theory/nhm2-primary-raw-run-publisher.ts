import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  NHM2_PRIMARY_RAW_OUTPUT_INPUT_CLOSURE_ALGORITHM,
  NHM2_PRIMARY_RAW_OUTPUT_INPUT_ORDERING,
  NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS,
  computeNhm2PrimaryRawOutputInputClosureSha256,
  type Nhm2PrimaryRawOutputHashedInputV1,
  type Nhm2PrimaryRawOutputManifestV1,
} from "../../../shared/contracts/nhm2-primary-raw-output-manifest.v1";
import { NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID } from "../../../shared/contracts/nhm2-primary-producer-bundle.v1";
import {
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS,
  type Nhm2ExperimentReadyTheoryClosureEvidenceId,
} from "../../../shared/contracts/nhm2-experiment-ready-theory-closure.v1";
import type { TheoryRuntimeCommandV1, TheoryRuntimeExecutionResult } from "./runtime-adapters";
import type { Nhm2TheoryCandidatePlanAdmission } from "./nhm2-theory-candidate-plan-admission";
import {
  compileNhm2PrimaryRawExperimentReadyEvidenceFromFilesystem,
  NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_COMPILER_CONTRACT_VERSION,
  NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_IDS,
  type Nhm2PrimaryRawExperimentReadyEvidenceCompilation,
  type Nhm2PrimaryRawExperimentReadyEvidenceId,
} from "./nhm2-primary-raw-experiment-ready-evidence-compiler";
import {
  computeNhm2PrimaryRawMaterialDynamicsThresholdSha256,
  type Nhm2PrimaryRawMaterialDynamicsReplayInput,
  type Nhm2PrimaryRawMaterialDynamicsThresholds,
} from "./nhm2-primary-raw-material-dynamics-content-replay";
import {
  verifyNhm2PrimaryRawOutputFilesystem,
  type Nhm2PrimaryRawOutputFilesystemVerification,
  type Nhm2PrimaryRawOutputTrustedBindings,
} from "./nhm2-primary-raw-output-filesystem-verifier";
import { createTheoryRuntimeJsonFile } from "./runtime-atomic-json-store";

export const NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_FILENAME =
  "primary-raw-output-manifest.v1.json" as const;

const NHM2_PRIMARY_SERVER_PUBLISHED_EVIDENCE_ROLES = [
  ...NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_IDS,
  "prediction_falsifier_freeze",
] as const satisfies readonly Nhm2ExperimentReadyTheoryClosureEvidenceId[];

/**
 * These replay tolerances are a server-owned diagnostic projection of the
 * candidate's frozen policy. The compiler keeps the still-incomplete mapping
 * to every candidate policy entry as an explicit blocker; these values cannot
 * promote a claim by themselves.
 */
export const NHM2_PRIMARY_RAW_SERVER_REPLAY_THRESHOLDS = {
  relativeFloor: 1e-30,
  semiclassical: {
    rsetAbsoluteToleranceJPerM3: 1e-12,
    rsetRelativeTolerance: 0.1,
    maxRelativeUncertainty95: 0.1,
    maxFinalBackreactionDeltaJPerM3: 0.1,
    maxBackreactionConvergenceRatio: 0.1,
  },
  maxwell: {
    correlationAbsoluteTolerance: 1e-12,
    correlationRelativeTolerance: 0.1,
    stressAbsoluteTolerancePa: 1e-12,
    stressRelativeTolerance: 0.1,
    forceAbsoluteToleranceN: 1e-12,
    forceRelativeTolerance: 0.1,
    gradientAbsoluteToleranceNPerM: 1e-12,
    gradientRelativeTolerance: 0.1,
    maxAbsoluteForceGradientNPerM: 1e15,
  },
  mechanics: {
    residualAbsoluteToleranceN: 1e-12,
    residualRelativeTolerance: 0.1,
    residualComparisonAbsoluteToleranceN: 1e-12,
    residualComparisonRelativeTolerance: 0.1,
    minimumStructuralMargin: 0,
    minimumSourceRetentionMargin: 0,
    minimumOverlapRatio: 1,
    maxCycleEnergyJ: 1,
    maxWeightedHeatJ: 1,
    maxWeightedNoise: 1,
    maxTimingFraction: 1,
  },
  dynamics: {
    minimumRefinementOrder: 1,
    maxFinalIterationDelta: 0.1,
    maxPerturbationGrowthRate: 0,
    perturbationGrowthAbsoluteTolerance: 1e-12,
    minimumRayFrequency: 0,
    maximumCausalIntervalSquared: 0,
    minimumHyperbolicityMargin: 0,
    minimumNeighborhoodRobustMargin: 0.95,
    minimumNeighborhoodSamplesPerSide: 1,
  },
  observable: {
    predictionAbsoluteTolerance: 1e-12,
    predictionRelativeTolerance: 0.1,
    uncertaintyAbsoluteTolerance: 1e-12,
    uncertaintyRelativeTolerance: 0.1,
    maxPropagatedUncertainty95: 0.1,
  },
} as const satisfies Nhm2PrimaryRawMaterialDynamicsThresholds;

type PublishedArtifact = {
  evidenceRole: Nhm2ExperimentReadyTheoryClosureEvidenceId;
  outputPath: string;
  contractVersion: string;
  sha256: string;
  disposition: "pass" | "blocked" | "fail" | "ready" | "not_ready";
};

export type Nhm2PrimaryRawRunPublication = {
  status: "ready" | "not_ready" | "falsified";
  rawManifestPath: string;
  rawManifestSha256: string;
  rawVerification: Extract<
    Nhm2PrimaryRawOutputFilesystemVerification,
    { verified: true }
  >;
  compilation: Nhm2PrimaryRawExperimentReadyEvidenceCompilation;
  artifacts: PublishedArtifact[];
  blockers: string[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
};

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareUtf8);

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const normalizeRepoPath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\//, "");

const ensureContained = (root: string, candidate: string, label: string) => {
  const absolute = path.resolve(root, candidate);
  const relative = path.relative(root, absolute);
  if (
    relative.length === 0 ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} escaped its admitted root.`);
  }
  return absolute;
};

const actualInput = async (input: {
  projectRoot: string;
  inputId: string;
  logicalPath: string;
  repoPath: string;
  expectedSha256: string;
  mediaType: string;
}): Promise<Nhm2PrimaryRawOutputHashedInputV1> => {
  const absolute = ensureContained(
    input.projectRoot,
    input.repoPath,
    `Raw input ${input.inputId}`,
  );
  const stat = await fs.lstat(absolute);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) {
    throw new Error(`Raw input ${input.inputId} is not a unique regular file.`);
  }
  const bytes = await fs.readFile(absolute);
  const observedSha256 = sha256(bytes);
  if (observedSha256 !== input.expectedSha256.toLowerCase()) {
    throw new Error(`Raw input ${input.inputId} changed before compilation.`);
  }
  return {
    inputId: input.inputId,
    path: input.logicalPath,
    sha256: observedSha256,
    sizeBytes: bytes.byteLength,
    mediaType: input.mediaType,
  };
};

const bind = (
  entries: ReadonlyMap<string, Nhm2PrimaryRawOutputHashedInputV1>,
  inputId: string,
) => {
  const entry = entries.get(inputId);
  if (entry == null) throw new Error(`Missing trusted raw input ${inputId}.`);
  return { inputId, sha256: entry.sha256 };
};

export async function buildNhm2PrimaryRawTrustedBindings(input: {
  projectRoot: string;
  admission: Nhm2TheoryCandidatePlanAdmission;
  command: TheoryRuntimeCommandV1;
  execution: TheoryRuntimeExecutionResult;
}): Promise<Nhm2PrimaryRawOutputTrustedBindings> {
  if (
    input.execution.exitCode !== 0 ||
    input.execution.timedOut ||
    input.execution.error != null ||
    input.execution.completedAt == null ||
    input.execution.durationMs == null
  ) {
    throw new Error("Trusted raw bindings require a successful outer execution.");
  }
  const manifest = input.admission.manifest;
  const plan = input.admission.plan;
  const ids = NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS;
  const specs = [
    {
      inputId: ids.candidateManifest,
      logicalPath: "inputs/00-candidate-manifest.json",
      repoPath: input.admission.manifestPath,
      expectedSha256: input.admission.manifestRawSha256,
      mediaType: "application/json",
    },
    {
      inputId: ids.selectedProfile,
      logicalPath: "inputs/01-selected-profile.json",
      repoPath: manifest.bindings.profile.path,
      expectedSha256: manifest.bindings.profile.sha256,
      mediaType: "application/json",
    },
    {
      inputId: ids.chartDefinition,
      logicalPath: "inputs/02-chart-definition.json",
      repoPath: manifest.bindings.chart.path,
      expectedSha256: manifest.bindings.chart.sha256,
      mediaType: "application/json",
    },
    {
      inputId: ids.atlas,
      logicalPath: "inputs/03-layered-ledger-atlas.json",
      repoPath: manifest.bindings.atlas.path,
      expectedSha256: manifest.bindings.atlas.sha256,
      mediaType: "application/json",
    },
    {
      inputId: ids.units,
      logicalPath: "inputs/04-units-definition.json",
      repoPath: manifest.bindings.units.path,
      expectedSha256: manifest.bindings.units.sha256,
      mediaType: "application/json",
    },
    {
      inputId: ids.normalization,
      logicalPath: "inputs/05-normalization-definition.json",
      repoPath: manifest.bindings.normalization.path,
      expectedSha256: manifest.bindings.normalization.sha256,
      mediaType: "application/json",
    },
    {
      inputId: ids.solver,
      logicalPath: "toolchain/06-solver-descriptor.json",
      repoPath: plan.solver.path,
      expectedSha256: plan.solver.sha256,
      mediaType: "application/json",
    },
    {
      inputId: ids.environment,
      logicalPath: "toolchain/07-environment-lock.json",
      repoPath: plan.environmentLock.path,
      expectedSha256: plan.environmentLock.sha256,
      mediaType: "application/json",
    },
    {
      inputId: ids.producerBundle,
      logicalPath: "toolchain/08-primary-producer-bundle.mjs",
      repoPath: input.admission.primaryProducerBundle.bundle.path,
      expectedSha256: input.admission.primaryProducerBundle.bundle.sha256,
      mediaType: "application/javascript",
    },
  ] as const;
  const entries = (
    await Promise.all(
      specs.map((spec) =>
        actualInput({ projectRoot: input.projectRoot, ...spec }),
      ),
    )
  ).sort((left, right) => compareUtf8(left.path, right.path));
  const byId = new Map(entries.map((entry) => [entry.inputId, entry]));
  const inputClosure: Nhm2PrimaryRawOutputManifestV1["inputClosure"] = {
    frozenBeforeExecution: true,
    digestAlgorithm: NHM2_PRIMARY_RAW_OUTPUT_INPUT_CLOSURE_ALGORITHM,
    ordering: NHM2_PRIMARY_RAW_OUTPUT_INPUT_ORDERING,
    entries,
    closureSha256: computeNhm2PrimaryRawOutputInputClosureSha256(entries),
  };
  const identity: Nhm2PrimaryRawOutputManifestV1["identity"] = {
    candidateId: manifest.bindings.candidate.candidateId,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: manifest.bindings.profile.selectedProfileId,
    chartId: manifest.bindings.chart.chartId,
    candidateManifest: bind(byId, ids.candidateManifest),
    selectedProfile: bind(byId, ids.selectedProfile),
    chartDefinition: bind(byId, ids.chartDefinition),
    atlas: bind(byId, ids.atlas),
    units: bind(byId, ids.units),
    normalization: bind(byId, ids.normalization),
  };
  const execution: Nhm2PrimaryRawOutputManifestV1["execution"] = {
    planRole: "primary_numerical",
    requestId: plan.requestId,
    runId: plan.runId,
    runtimeId: plan.runtimeId,
    receiptId: plan.receiptId,
    sourceCommitSha: plan.sourceCommitSha.toLowerCase(),
    solver: {
      solverId: plan.solver.solverId,
      solverVersion: plan.solver.solverVersion,
      implementationId: plan.solver.implementationId,
      input: bind(byId, ids.solver),
    },
    environment: {
      environmentId: plan.environmentLock.environmentId,
      input: bind(byId, ids.environment),
    },
    producerBundle: {
      bundleId: NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
      input: bind(byId, ids.producerBundle),
    },
    invocation: {
      command: input.command.command,
      argv: [...input.command.args],
      workingDirectory: input.command.cwd,
    },
    startedAt: input.execution.startedAt,
    completedAt: input.execution.completedAt,
    durationMs: input.execution.durationMs,
    deterministicSeed: plan.deterministicSeedPolicy,
    exitCode: 0,
    terminationSignal: null,
  };
  return { identity, execution, inputClosure };
}

const artifactStatus = (artifact: unknown): "pass" | "blocked" | "fail" => {
  if (
    artifact != null &&
    typeof artifact === "object" &&
    "status" in artifact &&
    ((artifact as { status?: unknown }).status === "pass" ||
      (artifact as { status?: unknown }).status === "blocked" ||
      (artifact as { status?: unknown }).status === "fail")
  ) {
    return (artifact as { status: "pass" | "blocked" | "fail" }).status;
  }
  throw new Error("Compiled primary artifact has no fail-closed status.");
};

const evidenceEntries = (
  compilation: Nhm2PrimaryRawExperimentReadyEvidenceCompilation,
) =>
  Object.entries(compilation.evidence) as Array<
    [
      Nhm2PrimaryRawExperimentReadyEvidenceId,
      Nhm2PrimaryRawExperimentReadyEvidenceCompilation["evidence"][Nhm2PrimaryRawExperimentReadyEvidenceId],
    ]
  >;

type PreparedPublicationArtifact = PublishedArtifact & {
  absoluteOutputPath: string;
  payload: unknown;
};

const sameStringSet = (
  observed: readonly string[],
  expected: readonly string[],
): boolean =>
  JSON.stringify(uniqueSorted(observed)) ===
    JSON.stringify(uniqueSorted(expected)) &&
  observed.length === new Set(observed).size &&
  observed.length === expected.length;

const assertCompilationClaimBoundaryClosed = (
  compilation: Nhm2PrimaryRawExperimentReadyEvidenceCompilation,
): void => {
  const boundary = compilation.claimBoundary;
  if (
    boundary.diagnosticReplayOnly !== true ||
    boundary.experimentReadyTheoryClosureClaimAllowed !== false ||
    boundary.theoryClosureEstablished !== false ||
    boundary.physicalViabilityEstablished !== false ||
    boundary.transportEstablished !== false ||
    boundary.propulsionEstablished !== false ||
    boundary.routeEtaEstablished !== false ||
    boundary.certifiedSpeedEstablished !== false ||
    boundary.empiricalValidationEstablished !== false ||
    boundary.empiricalReceiptsRequired !== true
  ) {
    throw new Error(
      "Primary raw compiler attempted to widen its closed claim boundary.",
    );
  }
};

const expectedCompiledStatus = (input: {
  blockers: readonly string[];
  failures: readonly string[];
}): "pass" | "blocked" | "fail" =>
  input.blockers.length > 0
    ? "blocked"
    : input.failures.length > 0
      ? "fail"
      : "pass";

function preparePublicationArtifacts(input: {
  projectRoot: string;
  outputDirectory: string;
  admission: Nhm2TheoryCandidatePlanAdmission;
  rawVerification: Extract<
    Nhm2PrimaryRawOutputFilesystemVerification,
    { verified: true }
  >;
  compilation: Nhm2PrimaryRawExperimentReadyEvidenceCompilation;
}): PreparedPublicationArtifact[] {
  if (
    input.compilation.contractVersion !==
    NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_COMPILER_CONTRACT_VERSION
  ) {
    throw new Error("Primary raw compiler contract version is not canonical.");
  }
  if (
    input.compilation.source.candidateId !==
      input.rawVerification.manifest.identity.candidateId ||
    input.compilation.source.runId !==
      input.rawVerification.manifest.execution.runId ||
    input.compilation.source.manifestSha256 !==
      input.rawVerification.manifestSha256 ||
    !/^[a-f0-9]{64}$/.test(
      input.compilation.source.rawContentClosureSha256 ?? "",
    )
  ) {
    throw new Error(
      "Primary raw compiler source does not match the first verified filesystem replay.",
    );
  }
  if (
    input.compilation.replayIntegrity.grExactMatch !== true ||
    input.compilation.replayIntegrity.materialDynamicsExactMatch !== true ||
    input.compilation.replayIntegrity.grProvidedSha256 !==
      input.compilation.replayIntegrity.grRecomputedSha256 ||
    input.compilation.replayIntegrity.materialDynamicsProvidedSha256 !==
      input.compilation.replayIntegrity.materialDynamicsRecomputedSha256
  ) {
    throw new Error(
      "Primary raw compiler did not exactly reproduce its server-owned replay witnesses.",
    );
  }
  assertCompilationClaimBoundaryClosed(input.compilation);

  const expectedRoles = NHM2_PRIMARY_SERVER_PUBLISHED_EVIDENCE_ROLES;
  if (
    !sameStringSet(
      input.admission.evidenceOutputs.map((entry) => entry.evidenceRole),
      expectedRoles,
    )
  ) {
    throw new Error(
      "Primary plan must preallocate exactly the nine server-governed evidence roots.",
    );
  }
  const expectedByRole = new Map(
    input.admission.evidenceOutputs.map((output) => [
      output.evidenceRole,
      output,
    ]),
  );
  for (const evidenceRole of expectedRoles) {
    const expected = expectedByRole.get(evidenceRole);
    if (
      expected == null ||
      expected.contractVersion !==
        NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS[
          evidenceRole
        ]
    ) {
      throw new Error(
        `Primary plan ${evidenceRole} contract version is not canonical.`,
      );
    }
  }

  const compiledEntries = evidenceEntries(input.compilation);
  if (
    !sameStringSet(
      compiledEntries.map(([evidenceRole]) => evidenceRole),
      NHM2_PRIMARY_RAW_EXPERIMENT_READY_EVIDENCE_IDS,
    )
  ) {
    throw new Error(
      "Primary raw compiler must return exactly its eight governed physics roots.",
    );
  }

  const prepared: PreparedPublicationArtifact[] = [];
  for (const [evidenceRole, entry] of compiledEntries) {
    const expected = expectedByRole.get(evidenceRole);
    if (expected == null) {
      throw new Error(`Primary plan did not preallocate ${evidenceRole}.`);
    }
    const canonicalContractVersion =
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS[
        evidenceRole
      ];
    if (
      entry.artifact.contractVersion !== canonicalContractVersion ||
      entry.artifact.contractVersion !== expected.contractVersion
    ) {
      throw new Error(
        `Compiled ${evidenceRole} contract version is not the admitted canonical version.`,
      );
    }
    const disposition = artifactStatus(entry.artifact);
    if (
      !Array.isArray(entry.blockers) ||
      !Array.isArray(entry.failures) ||
      disposition !== entry.status ||
      entry.status !== expectedCompiledStatus(entry) ||
      entry.ready !== (entry.status === "pass")
    ) {
      throw new Error(
        `Compiled ${evidenceRole} status is inconsistent with server replay evidence.`,
      );
    }
    const absoluteOutputPath = ensureContained(
      input.projectRoot,
      expected.outputPath,
      `Compiled evidence ${evidenceRole}`,
    );
    const canonicalOutputPath = path.join(
      input.outputDirectory,
      "evidence",
      `${evidenceRole}.json`,
    );
    if (path.resolve(absoluteOutputPath) !== path.resolve(canonicalOutputPath)) {
      throw new Error(
        `Compiled evidence ${evidenceRole} does not use its exact run-owned path.`,
      );
    }
    prepared.push({
      evidenceRole,
      outputPath: normalizeRepoPath(expected.outputPath),
      contractVersion: canonicalContractVersion,
      sha256: "",
      disposition,
      absoluteOutputPath,
      payload: entry.artifact,
    });
  }

  const aggregateStatus = expectedCompiledStatus({
    blockers: compiledEntries.flatMap(([, entry]) => entry.blockers),
    failures: compiledEntries.flatMap(([, entry]) => entry.failures),
  });
  if (input.compilation.status !== aggregateStatus) {
    throw new Error(
      "Primary raw compiler aggregate status diverges from its eight roots.",
    );
  }

  const predictionExpected = expectedByRole.get("prediction_falsifier_freeze");
  if (predictionExpected == null) {
    throw new Error(
      "Primary plan did not preallocate prediction_falsifier_freeze.",
    );
  }
  const prediction = input.admission.predictionFreeze;
  const predictionContractVersion =
    NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS
      .prediction_falsifier_freeze;
  if (
    prediction.contractVersion !== predictionContractVersion ||
    predictionExpected.contractVersion !== predictionContractVersion
  ) {
    throw new Error(
      "Compiled prediction-freeze contract version is not canonical.",
    );
  }
  if (
    typeof prediction.readiness?.predictionFreezeReady !== "boolean" ||
    !Array.isArray(prediction.readiness.blockers)
  ) {
    throw new Error("Compiled prediction-freeze readiness is malformed.");
  }
  const predictionAbsoluteOutputPath = ensureContained(
    input.projectRoot,
    predictionExpected.outputPath,
    "Compiled prediction freeze",
  );
  if (
    path.resolve(predictionAbsoluteOutputPath) !==
    path.resolve(
      input.outputDirectory,
      "evidence",
      "prediction_falsifier_freeze.json",
    )
  ) {
    throw new Error(
      "Compiled prediction freeze does not use its exact run-owned path.",
    );
  }
  prepared.push({
    evidenceRole: "prediction_falsifier_freeze",
    outputPath: normalizeRepoPath(predictionExpected.outputPath),
    contractVersion: predictionContractVersion,
    sha256: "",
    disposition: prediction.readiness.predictionFreezeReady
      ? "ready"
      : "not_ready",
    absoluteOutputPath: predictionAbsoluteOutputPath,
    payload: prediction,
  });
  prepared.sort((left, right) => compareUtf8(left.evidenceRole, right.evidenceRole));
  if (
    prepared.length !== 9 ||
    !sameStringSet(
      prepared.map((entry) => entry.evidenceRole),
      expectedRoles,
    )
  ) {
    throw new Error(
      "Primary raw publication preflight did not resolve exactly nine governed roots.",
    );
  }
  return prepared;
}

const assertPublicationTargetsAbsent = async (
  artifacts: readonly PreparedPublicationArtifact[],
): Promise<void> => {
  for (const artifact of artifacts) {
    try {
      await fs.lstat(artifact.absoluteOutputPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") continue;
      throw error;
    }
    throw new Error(
      `Server-governed evidence root already exists: ${artifact.evidenceRole}.`,
    );
  }
};

/**
 * Server-owned authority boundary. The child may publish only the fixed raw
 * manifest plus its declared primitive files. This function reopens that
 * inventory twice (protocol verification, then compiler verification),
 * independently replays it, and exclusively creates the nine governed roots.
 */
export async function compileAndPublishNhm2PrimaryRawRun(input: {
  projectRoot: string;
  admission: Nhm2TheoryCandidatePlanAdmission;
  command: TheoryRuntimeCommandV1;
  execution: TheoryRuntimeExecutionResult;
}): Promise<Nhm2PrimaryRawRunPublication> {
  const outputDirectory = ensureContained(
    input.projectRoot,
    input.admission.outputDirectory,
    "Primary raw output directory",
  );
  const trusted = await buildNhm2PrimaryRawTrustedBindings(input);
  const rawManifestAbsolutePath = path.join(
    outputDirectory,
    NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_FILENAME,
  );
  const filesystem = {
    runRoot: outputDirectory,
    manifestPath: rawManifestAbsolutePath,
    trusted,
  } as const;
  const rawVerification = await verifyNhm2PrimaryRawOutputFilesystem(
    filesystem,
  );
  if (!rawVerification.verified) {
    throw new Error(
      `Primary raw filesystem verification failed: ${rawVerification.violations
        .map((violation) =>
          [violation.code, violation.field, violation.path, violation.detail]
            .filter(Boolean)
            .join(":"),
        )
        .join(", ")}`,
    );
  }
  const materialDynamicsReplayContext: Omit<
    Nhm2PrimaryRawMaterialDynamicsReplayInput,
    "rawVerification"
  > = {
    receipts: { materialMeasurement: [], materialCoupon: [] },
    thresholds: NHM2_PRIMARY_RAW_SERVER_REPLAY_THRESHOLDS,
    thresholdBinding: {
      frozenBeforeReplay: true,
      sha256: computeNhm2PrimaryRawMaterialDynamicsThresholdSha256(
        NHM2_PRIMARY_RAW_SERVER_REPLAY_THRESHOLDS,
      ),
    },
  };
  const compilation =
    await compileNhm2PrimaryRawExperimentReadyEvidenceFromFilesystem({
      filesystem,
      materialDynamicsReplayContext,
    });
  if (!compilation.acceptedInput) {
    throw new Error(
      `Primary raw compiler rejected verified input: ${compilation.blockers.join(", ")}`,
    );
  }

  const preparedArtifacts = preparePublicationArtifacts({
    projectRoot: input.projectRoot,
    outputDirectory,
    admission: input.admission,
    rawVerification,
    compilation,
  });
  await assertPublicationTargetsAbsent(preparedArtifacts);
  const artifacts: PublishedArtifact[] = [];
  for (const prepared of preparedArtifacts) {
    await createTheoryRuntimeJsonFile(
      prepared.absoluteOutputPath,
      prepared.payload,
    );
    const bytes = await fs.readFile(prepared.absoluteOutputPath);
    artifacts.push({
      evidenceRole: prepared.evidenceRole,
      outputPath: prepared.outputPath,
      contractVersion: prepared.contractVersion,
      sha256: sha256(bytes),
      disposition: prepared.disposition,
    });
  }

  const prediction = input.admission.predictionFreeze;
  const predictionDisposition = prediction.readiness.predictionFreezeReady
    ? ("ready" as const)
    : ("not_ready" as const);

  const physicsDispositions = artifacts
    .filter((artifact) => artifact.evidenceRole !== "prediction_falsifier_freeze")
    .map((artifact) => artifact.disposition);
  const status = physicsDispositions.includes("fail")
    ? ("falsified" as const)
    : physicsDispositions.every((disposition) => disposition === "pass") &&
        predictionDisposition === "ready"
      ? ("ready" as const)
      : ("not_ready" as const);
  const blockers = uniqueSorted([
    ...evidenceEntries(compilation).flatMap(([evidenceRole, entry]) =>
      entry.blockers.map((blocker) => `${evidenceRole}:${blocker}`),
    ),
    ...prediction.readiness.blockers.map(
      (blocker) => `prediction_falsifier_freeze:${blocker}`,
    ),
  ]);
  if (status !== "ready" && blockers.length === 0) {
    blockers.push("primary_raw_compilation_not_ready_without_reason");
  }
  return {
    status,
    rawManifestPath: normalizeRepoPath(
      path.relative(input.projectRoot, rawManifestAbsolutePath),
    ),
    rawManifestSha256: rawVerification.manifestSha256,
    rawVerification,
    compilation,
    artifacts,
    blockers,
    startedAt: rawVerification.manifest.execution.startedAt,
    completedAt: rawVerification.manifest.execution.completedAt,
    durationMs: rawVerification.manifest.execution.durationMs,
  };
}
