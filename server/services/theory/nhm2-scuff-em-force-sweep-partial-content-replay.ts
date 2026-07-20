import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isDeepStrictEqual, TextDecoder } from "node:util";

import type { Nhm2ExternalNumericalKernelObservationV1 } from "./nhm2-external-numerical-kernel-executor";
import {
  computeNhm2ExternalNumericalKernelStagingIdentitySha256,
  NHM2_EXTERNAL_NUMERICAL_KERNEL_OBSERVATION_VERSION,
  type Nhm2ExternalNumericalKernelLedgerObservationV1,
  type Nhm2ExternalNumericalKernelOutputObservationV1,
} from "./nhm2-external-numerical-kernel-executor";
import {
  admitNhm2ScuffEmServerExecutorReceipt,
  reverifyNhm2ScuffEmServerExecutorReceipt,
  type Nhm2ScuffEmExecutorReceiptNotReadyV1,
} from "./nhm2-scuff-em-executor-receipt-admission";
import {
  NHM2_SCUFF_EM_COMMIT_SHA,
  NHM2_SCUFF_EM_CRITICAL_SOURCE_BINDINGS,
  NHM2_SCUFF_EM_MATSUBARA_PRINT_POLICY,
  NHM2_SCUFF_EM_VERSION,
  Nhm2ScuffEmForceSweepPlanError,
  type Nhm2ScuffEmForceSweepExternalPlanV1,
  validateNhm2ScuffEmForceSweepExternalPlan,
} from "./nhm2-scuff-em-force-sweep-external-plan";

export const NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_VERSION =
  "nhm2_scuff_em_force_sweep_partial_content_replay/v1" as const;

export const NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS = {
  maxOutputFileCount: 3,
  maxPathDepth: 1,
  maxPathUtf8Bytes: 256,
  maxIntegratedSweepBytes: 8 * 1024 * 1024,
  maxMatsubaraBytes: 64 * 1024 * 1024,
  maxSolverLogBytes: 8 * 1024 * 1024,
  maxAggregateBytes: 80 * 1024 * 1024,
  maxTextLineUtf8Bytes: 16 * 1024,
  maxMatsubaraRows: 1_000_000,
} as const;

export const NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_BLOCKERS = [
  "same_user_staged_toolchain_mutation_exclusion_not_os_enforced",
  "scuff_output_si_conversion_unresolved",
  "local_maxwell_stress_traction_field_unresolved",
  "mesh_refinement_convergence_unresolved",
  "measured_dielectric_correspondence_replay_required",
  "matsubara_sum_convergence_independent_replay_required",
  "force_gradient_uncertainty_replay_required",
  "independent_scientific_content_replay_required",
] as const;

export const NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE = {
  equationVersion: "nhm2_scuff_em_pinned_matsubara_sequence/v1",
  sourceFileSuffix: "applications/scuff-cas3D/SumsIntegrals.cc",
  firstTermEquation: "xi_0 = XIMIN",
  subsequentTermEquation: "xi_n = 2*pi*BOLTZMANNK*T*n for n>=1",
  ximinRawScuff: NHM2_SCUFF_EM_MATSUBARA_PRINT_POLICY.ximinRawScuff,
  boltzmannKInternalPerKelvin:
    NHM2_SCUFF_EM_MATSUBARA_PRINT_POLICY.boltzmannKInternalPerKelvin,
  printedFrequencyFormat: "%.6e",
  unitAuthority: "raw_scuff_internal_units_only",
} as const;

export type Nhm2ScuffEmForceSweepPartialReplayBlocker =
  (typeof NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_BLOCKERS)[number];

export type Nhm2ScuffEmForceSweepPartialReplayFileBindingV1 = {
  role:
    | "casimir_integrated_force_sweep"
    | "casimir_matsubara_spectrum"
    | "casimir_solver_log";
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  modifiedAt: string;
  freshness: "new";
  writtenWithinExecutionInterval: true;
};

export type Nhm2ScuffEmIntegratedSweepRowV1 = {
  label: string;
  separationMetersFromFrozenInput: number;
  energyRawScuff: number;
  energyNumericalXiIntegrationErrorRawScuff: number;
  zForceRawScuff: number;
  zForceNumericalXiIntegrationErrorRawScuff: number;
};

export type Nhm2ScuffEmRawCentralDifferenceV1 = {
  centerLabel: string;
  leftLabel: string;
  rightLabel: string;
  centralSpanMetersFromFrozenInput: number;
  zForceCentralDifferenceRawScuffPerInputMeter: number;
  propagatedAbsoluteNumericalXiIntegrationErrorRawScuffPerInputMeter: number;
  propagationMethod: "sum_of_reported_absolute_integration_errors_over_central_span";
  reportedErrorConfidenceLevelEstablished: false;
};

export type Nhm2ScuffEmForceSweepPartialReplayArtifactV1 = {
  artifactId: "nhm2.scuff_em_force_sweep_partial_content_replay";
  contractVersion: typeof NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_VERSION;
  generatedAt: string;
  status: "partial_raw_scuff_content_replayed_blocked";
  sourceBinding: {
    repository: "https://github.com/HomerReid/scuff-em";
    commitSha: typeof NHM2_SCUFF_EM_COMMIT_SHA;
    version: typeof NHM2_SCUFF_EM_VERSION;
    planSha256: string;
    toolchainLedgerSha256: string;
    inputLedgerSha256: string;
    serverExecutorReceiptSha256: string;
    serverExecutorReceiptSizeBytes: number;
    criticalSourceBindings: Array<{
      suffix: string;
      sha256: string;
      sizeBytes: number;
    }>;
  };
  executionBinding: {
    runIdentitySha256: string;
    observationSha256: string;
    outputInventorySha256: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    outputRoot: string;
    runOwnedToolchainStagingIdentitySha256: string;
    runOwnedToolchainSourceLedgerSha256: string;
    stagedExecutableSha256: string;
    externalBinaryExecutionObserved: true;
  };
  sourceToBinaryProvenance: {
    officialBinaryArtifactPublishedAtPin: false;
    gitTreeObjectId: string;
    gitTrackedEntryCount: number;
    gitTreeVerificationReceiptSha256: string;
    fullSourceLedgerSha256: string;
    fullSourceEntryCount: number;
    fullSourceAggregateBytes: number;
    reproducibleBuildReceiptSha256: string;
    compilerExecutableSha256: string;
    linkerExecutableSha256: string;
    buildDriverExecutableSha256: string;
    firstBuildExecutableSha256: string;
    secondBuildExecutableSha256: string;
    runExecutableSha256: string;
    byteIdenticalRebuilds: true;
    sourceToBinaryProvenanceEstablished: true;
  };
  files: Nhm2ScuffEmForceSweepPartialReplayFileBindingV1[];
  integratedSweep: {
    columnDeclarations: readonly [
      "transform tag",
      "energy",
      "energy error due to numerical Xi integration",
      "z-force",
      "z-force error due to numerical Xi integration",
    ];
    unitAuthority: "raw_scuff_internal_units_only";
    rows: Nhm2ScuffEmIntegratedSweepRowV1[];
  };
  matsubaraSpectrum: {
    columnDeclarations: readonly [
      "transform tag",
      "imaginary angular frequency",
      "energy Xi integrand",
      "z-force Xi integrand",
    ];
    unitAuthority: "raw_scuff_internal_units_only";
    rowCount: number;
    frequencyBlockCount: number;
    transformationCountPerBlock: number;
    frequenciesRawScuff: number[];
    sequenceReplay: {
      equationVersion: typeof NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.equationVersion;
      sourceFileSuffix: typeof NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.sourceFileSuffix;
      sourceFileSha256: string;
      firstTermEquation: typeof NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.firstTermEquation;
      subsequentTermEquation: typeof NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.subsequentTermEquation;
      ximinRawScuff: typeof NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.ximinRawScuff;
      boltzmannKInternalPerKelvin: typeof NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.boltzmannKInternalPerKelvin;
      temperatureKelvinFromFrozenInput: number;
      printedFrequencyFormat: typeof NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.printedFrequencyFormat;
      unitAuthority: typeof NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.unitAuthority;
    };
    firstFrequencyUsesPinnedXiminProxy: true;
    pinnedXiminRawScuff: 0.001;
    subsequentPinnedMatsubaraSequenceVerified: true;
    allDeclaredIntegrandValuesFinite: true;
    energyIntegrandRangeRawScuff: [number, number];
    zForceIntegrandRangeRawScuff: [number, number];
    solverLogUsedForScientificAuthority: false;
  };
  rawCentralDifferences: Nhm2ScuffEmRawCentralDifferenceV1[];
  blockers: readonly Nhm2ScuffEmForceSweepPartialReplayBlocker[];
  claimBoundary: {
    diagnosticPartialReplayOnly: true;
    rawScuffIntegratedEnergyAndZForceReplayed: true;
    rawScuffCentralDifferencesComputed: true;
    matsubaraHeaderAndSequenceReplayed: true;
    siUnitConversionEstablished: false;
    localMaxwellStressTractionFieldEstablished: false;
    meshConvergenceEstablished: false;
    materialMeasurementCorrespondenceEstablished: false;
    independentScientificReplayEstablished: false;
    theoryClosureClaimAllowed: false;
    empiricalValidationEstablished: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type ReplayNhm2ScuffEmForceSweepPartialContentInput = {
  receiptId: string;
  /** Test-only mutation point; every output is re-opened afterward. */
  afterContentReplayForTesting?: () => void | Promise<void>;
};

export class Nhm2ScuffEmForceSweepPartialReplayError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2ScuffEmForceSweepPartialReplayError";
    this.code = code;
  }
}

type FileIdentity = {
  dev: string;
  ino: string;
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  nlink: number;
};

type SecureFile = {
  relativePath: string;
  absolutePath: string;
  bytes: Buffer;
  sha256: string;
  sizeBytes: number;
  modifiedAt: string;
  identity: FileIdentity;
};

type InventoryEntry = {
  relativePath: string;
  identity: FileIdentity;
};

type ParsedTextTable = {
  columns: string[];
  rows: string[][];
};

type ParsedMatsubara = {
  rowCount: number;
  frequencies: number[];
  energyRange: [number, number];
  zForceRange: [number, number];
};

const SHA256 = /^[a-f0-9]{64}$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const PINNED_XIMIN = NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.ximinRawScuff;
const PINNED_BOLTZMANN_K_INTERNAL_PER_KELVIN =
  NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.boltzmannKInternalPerKelvin;

const OUT_COLUMNS = [
  "transform tag",
  "energy",
  "energy error due to numerical Xi integration",
  "z-force",
  "z-force error due to numerical Xi integration",
] as const;

const BY_XI_COLUMNS = [
  "transform tag",
  "imaginary angular frequency",
  "energy Xi integrand",
  "z-force Xi integrand",
] as const;

const EXPECTED_EXECUTOR_CLAIM_BOUNDARY = {
  externalBinaryExecutionObserved: true,
  solverOutputScientificallyValidated: false,
  theoryClosureClaimAllowed: false,
  empiricalValidationEstablished: false,
  physicalViabilityClaimAllowed: false,
  transportClaimAllowed: false,
  propulsionClaimAllowed: false,
  routeEtaClaimAllowed: false,
  speedAuthorityClaimAllowed: false,
  operatingSystemHermeticityAsserted: false,
  networkIsolationAsserted: false,
  filesystemSandboxAsserted: false,
} as const;

const fail = (code: string, message: string): never => {
  throw new Nhm2ScuffEmForceSweepPartialReplayError(code, message);
};

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

const hashDomain = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(`${domain}\n`, "utf8")
    .update(stableJson(value), "utf8")
    .digest("hex");

const stableJson = (value: unknown): string => {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        fail("hash_input_invalid", "Cannot bind a non-finite numeric value.");
      }
      return JSON.stringify(Object.is(value, -0) ? 0 : value);
    case "string":
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
      }
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record)
        .sort(utf8Compare)
        .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
        .join(",")}}`;
    }
    default:
      return fail("hash_input_invalid", "Cannot bind a non-JSON value.");
  }
};

const exactKeys = (
  value: unknown,
  keys: readonly string[],
  label: string,
): value is Record<string, unknown> => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    fail("execution_observation_invalid", `${label} must be an object.`);
  }
  const observed = Object.keys(value as object).sort(utf8Compare);
  const expected = [...keys].sort(utf8Compare);
  if (!isDeepStrictEqual(observed, expected)) {
    fail(
      "execution_observation_invalid",
      `${label} keys do not match the governed observation contract.`,
    );
  }
  return true;
};

const canonicalIsoMillis = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const millis = Date.parse(value);
  return Number.isFinite(millis) && new Date(millis).toISOString() === value;
};

const normalizedFilesystemPath = (value: string): string => {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
};

const sameFilesystemPath = (left: string, right: string): boolean =>
  normalizedFilesystemPath(left) === normalizedFilesystemPath(right);

const isContainedPath = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

const pathsOverlap = (left: string, right: string): boolean =>
  sameFilesystemPath(left, right) ||
  isContainedPath(left, right) ||
  isContainedPath(right, left);

const statIdentity = (
  stat: Awaited<ReturnType<typeof fs.lstat>>,
): FileIdentity => ({
  dev: String(stat.dev),
  ino: String(stat.ino),
  mode: Number(stat.mode),
  size: Number(stat.size),
  mtimeMs: Number(stat.mtimeMs),
  ctimeMs: Number(stat.ctimeMs),
  birthtimeMs: Number(stat.birthtimeMs),
  nlink: Number(stat.nlink),
});

const statIdentityMatches = (
  left: Awaited<ReturnType<typeof fs.lstat>>,
  right: Awaited<ReturnType<typeof fs.lstat>>,
): boolean => isDeepStrictEqual(statIdentity(left), statIdentity(right));

const isPortableRootFile = (value: string): boolean =>
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("/") &&
  !value.includes("\0") &&
  value !== "." &&
  value !== ".." &&
  Buffer.byteLength(value, "utf8") <=
    NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxPathUtf8Bytes;

const legacySimulatedScuffReference = (value: string): boolean => {
  const portable = value.replaceAll("\\", "/").toLowerCase();
  return (
    portable.endsWith("/server/services/scuffem.ts") ||
    portable.endsWith("/scuffem.ts") ||
    portable.includes("simulatescuffemexecution")
  );
};

const resolveArguments = (
  plan: Nhm2ScuffEmForceSweepExternalPlanV1,
): string[] => {
  const inputRoot = path.resolve(plan.runSpec.ledgers.input.rootPath);
  const outputRoot = path.resolve(plan.runSpec.outputRoot);
  return plan.runSpec.arguments.map((argument) => {
    switch (argument.kind) {
      case "literal":
        return argument.value;
      case "input_path":
        return path.join(inputRoot, ...argument.relativePath.split("/"));
      case "output_path":
        return path.join(outputRoot, ...argument.relativePath.split("/"));
      case "output_root":
        return outputRoot;
    }
  });
};

const computeOutputInventorySha256 = (
  outputs: readonly Nhm2ExternalNumericalKernelOutputObservationV1[],
): string =>
  sha256(
    JSON.stringify({
      domain: "nhm2_external_numerical_kernel_output_inventory/v1",
      outputs: outputs.map(({ role, relativePath, sha256, sizeBytes }) => ({
        role,
        relativePath,
        sha256,
        sizeBytes,
      })),
    }),
  );

const validateLedgerObservation = (input: {
  observed: Nhm2ExternalNumericalKernelLedgerObservationV1;
  expected: Nhm2ScuffEmForceSweepExternalPlanV1["runSpec"]["ledgers"][
    "input" | "toolchain"];
  phase: "pre" | "post";
  processStartedAtMs: number;
  processCompletedAtMs: number;
}): number => {
  const { observed, expected, phase } = input;
  exactKeys(
    observed,
    [
      "aggregateBytes",
      "entries",
      "entryCount",
      "kind",
      "ledgerSha256",
      "observedAt",
    ],
    `${phase}RunLedgers.${expected.kind}`,
  );
  if (!canonicalIsoMillis(observed.observedAt)) {
    fail(
      "execution_interval_invalid",
      `${phase}-run ${expected.kind} ledger time is invalid.`,
    );
  }
  const observedAtMs = Date.parse(observed.observedAt);
  if (
    (phase === "pre" && observedAtMs > input.processStartedAtMs) ||
    (phase === "post" && observedAtMs < input.processCompletedAtMs)
  ) {
    fail(
      "execution_interval_invalid",
      `${phase}-run ${expected.kind} ledger lies outside its execution phase.`,
    );
  }
  const aggregateBytes = expected.entries.reduce(
    (total, entry) => total + entry.sizeBytes,
    0,
  );
  if (
    observed.kind !== expected.kind ||
    observed.ledgerSha256 !== expected.ledgerSha256 ||
    observed.entryCount !== expected.entries.length ||
    observed.aggregateBytes !== aggregateBytes ||
    !isDeepStrictEqual(observed.entries, expected.entries)
  ) {
    fail(
      "execution_ledger_binding_invalid",
      `${phase}-run ${expected.kind} ledger does not match the sealed plan.`,
    );
  }
  for (const [index, entry] of observed.entries.entries()) {
    exactKeys(
      entry,
      ["relativePath", "sha256", "sizeBytes"],
      `${phase}RunLedgers.${expected.kind}.entries[${index}]`,
    );
  }
  return observedAtMs;
};

const validateObservation = (
  plan: Nhm2ScuffEmForceSweepExternalPlanV1,
  observation: Nhm2ExternalNumericalKernelObservationV1,
): { startedAtMs: number; completedAtMs: number } => {
  exactKeys(
    observation,
    [
      "artifactId",
      "blockers",
      "claimBoundary",
      "contractVersion",
      "executable",
      "generatedAt",
      "lane",
      "outputInventorySha256",
      "outputs",
      "postRunLedgers",
      "preRunLedgers",
      "process",
      "runOwnedToolchain",
      "solver",
      "status",
    ],
    "observation",
  );
  exactKeys(
    observation.solver,
    ["family", "implementationId", "producerMode", "version"],
    "observation.solver",
  );
  exactKeys(
    observation.executable,
    ["absolutePath", "sha256", "sizeBytes"],
    "observation.executable",
  );
  exactKeys(
    observation.preRunLedgers,
    ["input", "toolchain"],
    "observation.preRunLedgers",
  );
  exactKeys(
    observation.postRunLedgers,
    ["input", "toolchain"],
    "observation.postRunLedgers",
  );
  exactKeys(
    observation.process,
    [
      "args",
      "command",
      "completedAt",
      "cwd",
      "durationMs",
      "environment",
      "exitCode",
      "outputLimitExceeded",
      "signal",
      "spawnError",
      "startedAt",
      "stderr",
      "stderrBytes",
      "stderrSha256",
      "stdout",
      "stdoutBytes",
      "stdoutSha256",
      "timedOut",
    ],
    "observation.process",
  );
  exactKeys(
    observation.runOwnedToolchain,
    [
      "authority",
      "executablePath",
      "executableRelativePath",
      "permissions",
      "postRunLedger",
      "preSpawnLedger",
      "removedAfterExecution",
      "rootPath",
      "sourceLedgerSha256",
      "stagingIdentitySha256",
    ],
    "observation.runOwnedToolchain",
  );
  exactKeys(
    observation.runOwnedToolchain.permissions,
    [
      "dataFileMode",
      "directoryMode",
      "executableAuxiliaryMode",
      "executableMode",
      "osLevelImmutabilityAsserted",
      "policy",
    ],
    "observation.runOwnedToolchain.permissions",
  );
  exactKeys(
    observation.claimBoundary,
    Object.keys(EXPECTED_EXECUTOR_CLAIM_BOUNDARY),
    "observation.claimBoundary",
  );
  if (
    observation.artifactId !== "nhm2.external_numerical_kernel_observation" ||
    observation.contractVersion !==
      NHM2_EXTERNAL_NUMERICAL_KERNEL_OBSERVATION_VERSION ||
    observation.status !== "execution_observed_scientific_replay_required" ||
    observation.lane !== plan.runSpec.lane ||
    !isDeepStrictEqual(observation.solver, plan.runSpec.solver) ||
    !isDeepStrictEqual(observation.executable, plan.runSpec.executable)
  ) {
    fail(
      "execution_observation_binding_invalid",
      "Execution observation identity does not match the SCUFF plan.",
    );
  }
  if (
    legacySimulatedScuffReference(observation.process.command) ||
    observation.process.args.some(legacySimulatedScuffReference)
  ) {
    fail(
      "legacy_simulated_scuff_forbidden",
      "The legacy simulated SCUFF service cannot satisfy this replay.",
    );
  }
  if (
    !canonicalIsoMillis(observation.process.startedAt) ||
    !canonicalIsoMillis(observation.process.completedAt) ||
    !canonicalIsoMillis(observation.generatedAt)
  ) {
    fail("execution_interval_invalid", "Execution timestamps are invalid.");
  }
  const startedAtMs = Date.parse(observation.process.startedAt);
  const completedAtMs = Date.parse(observation.process.completedAt);
  const generatedAtMs = Date.parse(observation.generatedAt);
  if (
    completedAtMs < startedAtMs ||
    observation.process.durationMs !== completedAtMs - startedAtMs ||
    generatedAtMs < completedAtMs
  ) {
    fail(
      "execution_interval_invalid",
      "Execution interval or duration is inconsistent.",
    );
  }
  const expectedArgs = resolveArguments(plan);
  const stdoutBytes = Buffer.from(observation.process.stdout, "utf8");
  const stderrBytes = Buffer.from(observation.process.stderr, "utf8");
  if (
    !sameFilesystemPath(
      observation.process.command,
      observation.runOwnedToolchain.executablePath,
    ) ||
    !isDeepStrictEqual(observation.process.args, expectedArgs) ||
    !sameFilesystemPath(observation.process.cwd, plan.runSpec.outputRoot) ||
    !isDeepStrictEqual(
      observation.process.environment,
      plan.runSpec.environment,
    ) ||
    observation.process.exitCode !== 0 ||
    observation.process.signal !== null ||
    observation.process.spawnError !== null ||
    observation.process.timedOut !== false ||
    observation.process.outputLimitExceeded !== false ||
    observation.process.stdoutBytes !== stdoutBytes.byteLength ||
    observation.process.stderrBytes !== stderrBytes.byteLength ||
    observation.process.stdoutSha256 !== sha256(stdoutBytes) ||
    observation.process.stderrSha256 !== sha256(stderrBytes) ||
    stdoutBytes.byteLength + stderrBytes.byteLength >
      plan.runSpec.maxCapturedOutputBytes
  ) {
    fail(
      "execution_process_binding_invalid",
      "Successful process observation differs from the sealed invocation.",
    );
  }
  const preTimes = (["input", "toolchain"] as const).map((kind) =>
    validateLedgerObservation({
      observed: observation.preRunLedgers[kind],
      expected: plan.runSpec.ledgers[kind],
      phase: "pre",
      processStartedAtMs: startedAtMs,
      processCompletedAtMs: completedAtMs,
    }),
  );
  const postTimes = (["input", "toolchain"] as const).map((kind) =>
    validateLedgerObservation({
      observed: observation.postRunLedgers[kind],
      expected: plan.runSpec.ledgers[kind],
      phase: "post",
      processStartedAtMs: startedAtMs,
      processCompletedAtMs: completedAtMs,
    }),
  );
  if (
    Math.max(...preTimes) > startedAtMs ||
    Math.min(...postTimes) < completedAtMs ||
    generatedAtMs < Math.max(...postTimes)
  ) {
    fail(
      "execution_interval_invalid",
      "Ledger observations are not ordered around the external execution.",
    );
  }

  const sourceToolchainRoot = path.resolve(
    plan.runSpec.ledgers.toolchain.rootPath,
  );
  const executableRelativePath = path
    .relative(sourceToolchainRoot, plan.runSpec.executable.absolutePath)
    .split(path.sep)
    .join("/");
  const stagedPreAt = validateLedgerObservation({
    observed: observation.runOwnedToolchain.preSpawnLedger,
    expected: plan.runSpec.ledgers.toolchain,
    phase: "pre",
    processStartedAtMs: startedAtMs,
    processCompletedAtMs: completedAtMs,
  });
  const stagedPostAt = validateLedgerObservation({
    observed: observation.runOwnedToolchain.postRunLedger,
    expected: plan.runSpec.ledgers.toolchain,
    phase: "post",
    processStartedAtMs: startedAtMs,
    processCompletedAtMs: completedAtMs,
  });
  const expectedStagedExecutablePath = path.resolve(
    observation.runOwnedToolchain.rootPath,
    ...executableRelativePath.split("/"),
  );
  const expectedStagingIdentity =
    computeNhm2ExternalNumericalKernelStagingIdentitySha256({
      rootPath: observation.runOwnedToolchain.rootPath,
      executableRelativePath,
      executablePath: expectedStagedExecutablePath,
      sourceLedgerSha256: plan.runSpec.ledgers.toolchain.ledgerSha256,
      stagedLedger: observation.runOwnedToolchain.preSpawnLedger,
    });
  if (
    observation.runOwnedToolchain.authority !== "executor_created_fresh_copy" ||
    !path.isAbsolute(observation.runOwnedToolchain.rootPath) ||
    !isContainedPath(
      path.resolve(os.tmpdir()),
      path.resolve(observation.runOwnedToolchain.rootPath),
    ) ||
    !path
      .basename(observation.runOwnedToolchain.rootPath)
      .startsWith("nhm2-external-toolchain-") ||
    pathsOverlap(
      observation.runOwnedToolchain.rootPath,
      plan.runSpec.ledgers.toolchain.rootPath,
    ) ||
    pathsOverlap(
      observation.runOwnedToolchain.rootPath,
      plan.runSpec.ledgers.input.rootPath,
    ) ||
    pathsOverlap(
      observation.runOwnedToolchain.rootPath,
      plan.runSpec.outputRoot,
    ) ||
    observation.runOwnedToolchain.executableRelativePath !==
      executableRelativePath ||
    !sameFilesystemPath(
      observation.runOwnedToolchain.executablePath,
      expectedStagedExecutablePath,
    ) ||
    observation.runOwnedToolchain.sourceLedgerSha256 !==
      plan.runSpec.ledgers.toolchain.ledgerSha256 ||
    observation.runOwnedToolchain.stagingIdentitySha256 !==
      expectedStagingIdentity ||
    stagedPreAt > startedAtMs ||
    stagedPostAt < completedAtMs ||
    !isDeepStrictEqual(
      observation.runOwnedToolchain.preSpawnLedger.entries,
      observation.runOwnedToolchain.postRunLedger.entries,
    ) ||
    observation.runOwnedToolchain.removedAfterExecution !== true ||
    !isDeepStrictEqual(observation.runOwnedToolchain.permissions, {
      policy: "owner_read_execute_only_best_effort/v1",
      executableMode: "0500",
      executableAuxiliaryMode: "0500",
      dataFileMode: "0400",
      directoryMode: "0500",
      osLevelImmutabilityAsserted: false,
    })
  ) {
    fail(
      "run_owned_toolchain_binding_invalid",
      "Run-owned SCUFF toolchain does not match the executor-v2 staged byte identity.",
    );
  }

  const expectedOutputs = [...plan.runSpec.expectedOutputs].sort(
    (left, right) => utf8Compare(left.role, right.role),
  );
  if (
    !Array.isArray(observation.outputs) ||
    observation.outputs.length !== expectedOutputs.length
  ) {
    fail(
      "execution_output_binding_invalid",
      "Execution observation must bind exactly three SCUFF outputs.",
    );
  }
  for (const [index, output] of observation.outputs.entries()) {
    exactKeys(
      output,
      [
        "freshness",
        "modifiedAt",
        "relativePath",
        "role",
        "sha256",
        "sizeBytes",
      ],
      `observation.outputs[${index}]`,
    );
    const expected = expectedOutputs[index];
    if (
      expected == null ||
      output.role !== expected.role ||
      output.relativePath !== expected.relativePath ||
      !SHA256.test(output.sha256) ||
      !Number.isSafeInteger(output.sizeBytes) ||
      output.sizeBytes < 0 ||
      output.sizeBytes > expected.maxBytes ||
      output.freshness !== "new" ||
      !canonicalIsoMillis(output.modifiedAt)
    ) {
      fail(
        "execution_output_binding_invalid",
        "Observed output declarations differ from the sealed output roles.",
      );
    }
    const modifiedAtMs = Date.parse(output.modifiedAt);
    if (modifiedAtMs < startedAtMs || modifiedAtMs > completedAtMs) {
      fail(
        "output_freshness_interval_mismatch",
        `${output.relativePath} was not written during the observed execution.`,
      );
    }
  }
  if (
    observation.outputInventorySha256 !==
      computeOutputInventorySha256(observation.outputs) ||
    !isDeepStrictEqual(observation.blockers, [
      "independent_scientific_content_replay_required",
      "same_user_staged_toolchain_mutation_exclusion_not_os_enforced",
    ])
  ) {
    fail(
      "execution_output_binding_invalid",
      "Output inventory or executor blocker binding is invalid.",
    );
  }
  if (
    !isDeepStrictEqual(
      observation.claimBoundary,
      EXPECTED_EXECUTOR_CLAIM_BOUNDARY,
    )
  ) {
    fail(
      "execution_claim_boundary_invalid",
      "Execution observation attempted to promote scientific authority.",
    );
  }
  return { startedAtMs, completedAtMs };
};

async function assertPathChainSafe(absolutePath: string): Promise<void> {
  const parsed = path.parse(absolutePath);
  const relative = path.relative(parsed.root, absolutePath);
  const segments = relative.length === 0 ? [] : relative.split(path.sep);
  let cursor = parsed.root;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    const stat = await fs
      .lstat(cursor)
      .catch((error: unknown) =>
        fail(
          "output_root_unreadable",
          `Output path component is unreadable: ${(error as NodeJS.ErrnoException).code ?? "unknown"}.`,
        ),
      );
    if (stat.isSymbolicLink()) {
      fail(
        "output_root_symlink_or_reparse",
        "Output root path contains a symbolic link or reparse point.",
      );
    }
    const realPath = await fs.realpath(cursor);
    if (!sameFilesystemPath(realPath, cursor)) {
      fail(
        "output_root_symlink_or_reparse",
        "Output root path resolves through an alias or reparse point.",
      );
    }
  }
}

async function validateRoot(outputRoot: string): Promise<{
  root: string;
  rootRealPath: string;
  identity: FileIdentity;
}> {
  if (typeof outputRoot !== "string" || !path.isAbsolute(outputRoot)) {
    fail("output_root_unreadable", "Output root must be an absolute path.");
  }
  const root = path.resolve(outputRoot);
  await assertPathChainSafe(root);
  const stat = await fs.lstat(root);
  if (stat.isSymbolicLink()) {
    fail(
      "output_root_symlink_or_reparse",
      "Output root is a symbolic link or reparse point.",
    );
  }
  if (!stat.isDirectory()) {
    fail("output_root_not_directory", "Output root is not a directory.");
  }
  const rootRealPath = await fs.realpath(root);
  if (!sameFilesystemPath(root, rootRealPath)) {
    fail(
      "output_root_symlink_or_reparse",
      "Output root resolves through an alias or reparse point.",
    );
  }
  return { root, rootRealPath, identity: statIdentity(stat) };
}

async function snapshotExactInventory(input: {
  root: string;
  expectedPaths: readonly string[];
}): Promise<InventoryEntry[]> {
  const expected = [...input.expectedPaths].sort(utf8Compare);
  if (
    expected.length !==
      NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxOutputFileCount ||
    new Set(expected).size !== expected.length ||
    expected.some(
      (entry) =>
        !isPortableRootFile(entry) ||
        entry.split("/").length >
          NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxPathDepth,
    )
  ) {
    fail(
      "output_path_invalid",
      "SCUFF replay requires exactly three bounded root-level output paths.",
    );
  }
  const directoryEntries = await fs.readdir(input.root, {
    encoding: "utf8",
    withFileTypes: true,
  });
  directoryEntries.sort((left, right) => utf8Compare(left.name, right.name));
  if (
    directoryEntries.length !== expected.length ||
    !isDeepStrictEqual(
      directoryEntries.map((entry) => entry.name),
      expected,
    )
  ) {
    fail(
      "output_inventory_mismatch",
      "Output root has missing, extra, nested, or reordered inventory entries.",
    );
  }
  const inventory: InventoryEntry[] = [];
  for (const entry of directoryEntries) {
    const absolutePath = path.join(input.root, entry.name);
    const stat = await fs.lstat(absolutePath);
    if (entry.isSymbolicLink() || stat.isSymbolicLink()) {
      fail(
        "output_entry_symlink_or_reparse",
        `Output is a symbolic link or reparse point: ${entry.name}.`,
      );
    }
    if (!entry.isFile() || !stat.isFile()) {
      fail(
        "output_entry_not_regular",
        `Output is not a regular root-level file: ${entry.name}.`,
      );
    }
    if (stat.nlink !== 1) {
      fail(
        "output_entry_hardlinked",
        `Output must have exactly one hard link: ${entry.name}.`,
      );
    }
    inventory.push({ relativePath: entry.name, identity: statIdentity(stat) });
  }
  return inventory;
}

const roleLimit = (role: string): number => {
  switch (role) {
    case "casimir_integrated_force_sweep":
      return NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxIntegratedSweepBytes;
    case "casimir_matsubara_spectrum":
      return NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxMatsubaraBytes;
    case "casimir_solver_log":
      return NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxSolverLogBytes;
    default:
      return fail("execution_output_binding_invalid", "Unknown output role.");
  }
};

async function readSecureFile(input: {
  root: string;
  rootRealPath: string;
  output: Nhm2ExternalNumericalKernelOutputObservationV1;
  startedAtMs: number;
  completedAtMs: number;
}): Promise<SecureFile> {
  const { output } = input;
  if (!isPortableRootFile(output.relativePath)) {
    fail("output_path_invalid", "Output path is not a bounded root file.");
  }
  const absolutePath = path.resolve(input.root, output.relativePath);
  if (path.dirname(absolutePath) !== input.root) {
    fail("output_path_invalid", "Output path escaped its fresh root.");
  }
  const before = await fs.lstat(absolutePath);
  if (before.isSymbolicLink()) {
    fail(
      "output_entry_symlink_or_reparse",
      `Output is a symbolic link: ${output.relativePath}.`,
    );
  }
  if (!before.isFile()) {
    fail(
      "output_entry_not_regular",
      `Output is not regular: ${output.relativePath}.`,
    );
  }
  if (before.nlink !== 1) {
    fail(
      "output_entry_hardlinked",
      `Output is hardlinked: ${output.relativePath}.`,
    );
  }
  const maximum = roleLimit(output.role);
  if (
    !Number.isSafeInteger(before.size) ||
    before.size < 0 ||
    before.size > maximum
  ) {
    fail(
      "output_resource_limit_exceeded",
      `Output exceeds its replay byte ceiling: ${output.relativePath}.`,
    );
  }
  const realPath = await fs.realpath(absolutePath);
  const expectedRealPath = path.resolve(
    input.rootRealPath,
    output.relativePath,
  );
  if (
    !sameFilesystemPath(realPath, expectedRealPath) ||
    !sameFilesystemPath(realPath, absolutePath)
  ) {
    fail(
      "output_realpath_mismatch",
      `Output resolves through an alias or outside its root: ${output.relativePath}.`,
    );
  }
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const noFollow =
      process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
    handle = await fs.open(absolutePath, fsConstants.O_RDONLY | noFollow);
    const opened = await handle.stat();
    if (!statIdentityMatches(before, opened)) {
      fail(
        "output_changed_while_replaying",
        `Output identity changed while opening: ${output.relativePath}.`,
      );
    }
    const bytes = Buffer.allocUnsafe(before.size);
    let offset = 0;
    while (offset < before.size) {
      const { bytesRead } = await handle.read(
        bytes,
        offset,
        before.size - offset,
        offset,
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    const probe = Buffer.allocUnsafe(1);
    const overflow = await handle.read(probe, 0, 1, offset);
    const after = await fs.lstat(absolutePath);
    if (
      offset !== before.size ||
      overflow.bytesRead !== 0 ||
      after.isSymbolicLink() ||
      !after.isFile() ||
      after.nlink !== 1 ||
      !statIdentityMatches(before, after)
    ) {
      fail(
        "output_changed_while_replaying",
        `Output changed during bounded replay: ${output.relativePath}.`,
      );
    }
    const digest = sha256(bytes);
    const modifiedAt = after.mtime.toISOString();
    if (
      digest !== output.sha256 ||
      bytes.byteLength !== output.sizeBytes ||
      modifiedAt !== output.modifiedAt
    ) {
      fail(
        "output_bytes_binding_mismatch",
        `Output bytes do not match the execution observation: ${output.relativePath}.`,
      );
    }
    if (
      after.mtimeMs < input.startedAtMs ||
      after.mtimeMs > input.completedAtMs
    ) {
      fail(
        "output_freshness_interval_mismatch",
        `Output mtime lies outside execution: ${output.relativePath}.`,
      );
    }
    return {
      relativePath: output.relativePath,
      absolutePath,
      bytes,
      sha256: digest,
      sizeBytes: bytes.byteLength,
      modifiedAt,
      identity: statIdentity(after),
    };
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

const decodeBoundedUtf8 = (file: SecureFile): string => {
  if (
    file.bytes.byteLength >= UTF8_BOM.byteLength &&
    file.bytes.subarray(0, UTF8_BOM.byteLength).equals(UTF8_BOM)
  ) {
    fail("output_utf8_invalid", `${file.relativePath} contains a UTF-8 BOM.`);
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(file.bytes);
  } catch {
    return fail(
      "output_utf8_invalid",
      `${file.relativePath} is not valid UTF-8.`,
    );
  }
  if (!Buffer.from(text, "utf8").equals(file.bytes) || text.includes("\0")) {
    fail(
      "output_utf8_invalid",
      `${file.relativePath} failed UTF-8 round-trip or contains NUL.`,
    );
  }
  return text;
};

const inspectBoundedOpaqueLog = (file: SecureFile): void => {
  const text = decodeBoundedUtf8(file);
  for (const line of text.split(/\r?\n/)) {
    if (
      Buffer.byteLength(line, "utf8") >
      NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxTextLineUtf8Bytes
    ) {
      fail(
        "output_resource_limit_exceeded",
        `${file.relativePath} contains an overlong opaque log line.`,
      );
    }
  }
};

const parseHeaderDeclaredTable = (input: {
  file: SecureFile;
  expectedColumns: readonly string[];
  maxRows: number;
}): ParsedTextTable => {
  const text = decodeBoundedUtf8(input.file);
  const lines = text.split(/\r?\n/);
  if (lines.length > input.maxRows + 64) {
    fail(
      "output_resource_limit_exceeded",
      `${input.file.relativePath} exceeds its bounded line count.`,
    );
  }
  const columns: string[] = [];
  const rows: string[][] = [];
  let dataColumnMarkerCount = 0;
  let runBannerCount = 0;
  let sawData = false;
  for (const line of lines) {
    if (
      Buffer.byteLength(line, "utf8") >
      NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxTextLineUtf8Bytes
    ) {
      fail(
        "output_resource_limit_exceeded",
        `${input.file.relativePath} contains an overlong line.`,
      );
    }
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("#")) {
      if (sawData) {
        fail(
          "output_header_invalid",
          `${input.file.relativePath} contains a header after data rows.`,
        );
      }
      if (trimmed === "# data file columns:") dataColumnMarkerCount += 1;
      if (trimmed.startsWith("# scuff-cas3D run on ")) runBannerCount += 1;
      const declaration = /^#\s*(\d+)\s*:\s*(.*?)\s*$/.exec(trimmed);
      if (declaration != null) {
        const expectedIndex = columns.length + 1;
        if (Number(declaration[1]) !== expectedIndex) {
          fail(
            "output_header_invalid",
            `${input.file.relativePath} has reordered or duplicate columns.`,
          );
        }
        columns.push(declaration[2].replace(/\s+/g, " ").trim());
      }
      continue;
    }
    sawData = true;
    rows.push(trimmed.split(/\s+/));
    if (rows.length > input.maxRows) {
      fail(
        "output_resource_limit_exceeded",
        `${input.file.relativePath} exceeds its bounded data-row count.`,
      );
    }
  }
  if (
    dataColumnMarkerCount !== 1 ||
    runBannerCount !== 1 ||
    !isDeepStrictEqual(columns, input.expectedColumns) ||
    rows.length === 0
  ) {
    fail(
      "output_header_invalid",
      `${input.file.relativePath} does not have the pinned header-declared columns.`,
    );
  }
  return { columns, rows };
};

const parseFiniteDecimal = (token: string, label: string): number => {
  if (!DECIMAL.test(token)) {
    fail("output_format_invalid", `${label} is not a decimal number.`);
  }
  const value = Number(token);
  if (!Number.isFinite(value)) {
    fail("output_format_invalid", `${label} is non-finite.`);
  }
  return Object.is(value, -0) ? 0 : value;
};

const parseIntegratedSweep = (input: {
  plan: Nhm2ScuffEmForceSweepExternalPlanV1;
  file: SecureFile;
}): Nhm2ScuffEmIntegratedSweepRowV1[] => {
  const table = parseHeaderDeclaredTable({
    file: input.file,
    expectedColumns: OUT_COLUMNS,
    maxRows: input.plan.input.geometry.sweep.length,
  });
  const expectedSweep = input.plan.input.geometry.sweep;
  if (table.rows.length !== expectedSweep.length) {
    fail(
      "integrated_sweep_label_mismatch",
      "Integrated sweep row count does not match the frozen transformations.",
    );
  }
  const seen = new Set<string>();
  return table.rows.map((tokens, index) => {
    const expected = expectedSweep[index];
    if (
      expected == null ||
      tokens.length !== OUT_COLUMNS.length ||
      tokens[0] !== expected.label ||
      seen.has(tokens[0])
    ) {
      fail(
        "integrated_sweep_label_mismatch",
        "Integrated sweep labels are missing, duplicated, or reordered.",
      );
    }
    seen.add(tokens[0]);
    const energy = parseFiniteDecimal(tokens[1], `${expected.label}.energy`);
    const energyError = parseFiniteDecimal(
      tokens[2],
      `${expected.label}.energy_error`,
    );
    const zForce = parseFiniteDecimal(tokens[3], `${expected.label}.z_force`);
    const zForceError = parseFiniteDecimal(
      tokens[4],
      `${expected.label}.z_force_error`,
    );
    if (energyError < 0 || zForceError < 0) {
      fail(
        "integrated_sweep_row_invalid",
        "SCUFF numerical-integration errors must be nonnegative.",
      );
    }
    return {
      label: expected.label,
      separationMetersFromFrozenInput: expected.separationMeters,
      energyRawScuff: energy,
      energyNumericalXiIntegrationErrorRawScuff: energyError,
      zForceRawScuff: zForce,
      zForceNumericalXiIntegrationErrorRawScuff: zForceError,
    };
  });
};

const printedScientificHalfUlp = (expected: number): number => {
  const magnitude = Math.abs(expected);
  if (!Number.isFinite(magnitude) || magnitude === 0) return 0;
  const exponent = Math.floor(Math.log10(magnitude));
  return (
    0.5 *
    10 ** (exponent - NHM2_SCUFF_EM_MATSUBARA_PRINT_POLICY.digitsAfterDecimal)
  );
};

const nearPrintedScientific = (observed: number, expected: number): boolean => {
  if (!Number.isFinite(observed) || !Number.isFinite(expected)) return false;
  const halfPrintedUlp = printedScientificHalfUlp(expected);
  const binarySlack =
    8 *
    Number.EPSILON *
    Math.max(Math.abs(observed), Math.abs(expected), Number.MIN_VALUE);
  return Math.abs(observed - expected) <= halfPrintedUlp + binarySlack;
};

const parseMatsubara = (input: {
  plan: Nhm2ScuffEmForceSweepExternalPlanV1;
  file: SecureFile;
}): ParsedMatsubara => {
  const table = parseHeaderDeclaredTable({
    file: input.file,
    expectedColumns: BY_XI_COLUMNS,
    maxRows: NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxMatsubaraRows,
  });
  const labels = input.plan.input.geometry.sweep.map((entry) => entry.label);
  if (table.rows.length % labels.length !== 0) {
    fail(
      "matsubara_row_invalid",
      "Matsubara rows do not form complete transformation blocks.",
    );
  }
  const blockCount = table.rows.length / labels.length;
  if (blockCount < 3) {
    fail(
      "matsubara_sequence_invalid",
      "Pinned finite-temperature convergence requires at least three frequency blocks.",
    );
  }
  const frequencies: number[] = [];
  let minimumEnergy = Number.POSITIVE_INFINITY;
  let maximumEnergy = Number.NEGATIVE_INFINITY;
  let minimumZForce = Number.POSITIVE_INFINITY;
  let maximumZForce = Number.NEGATIVE_INFINITY;
  for (let block = 0; block < blockCount; block += 1) {
    let blockFrequency: number | null = null;
    for (let labelIndex = 0; labelIndex < labels.length; labelIndex += 1) {
      const rowIndex = block * labels.length + labelIndex;
      const tokens = table.rows[rowIndex];
      if (
        tokens == null ||
        tokens.length !== BY_XI_COLUMNS.length ||
        tokens[0] !== labels[labelIndex]
      ) {
        fail(
          "matsubara_row_invalid",
          "Matsubara transformation labels are missing, duplicated, or reordered.",
        );
      }
      const xi = parseFiniteDecimal(tokens[1], `byXi[${rowIndex}].xi`);
      const energy = parseFiniteDecimal(
        tokens[2],
        `byXi[${rowIndex}].energy_integrand`,
      );
      const zForce = parseFiniteDecimal(
        tokens[3],
        `byXi[${rowIndex}].z_force_integrand`,
      );
      if (xi < 0 || (blockFrequency != null && xi !== blockFrequency)) {
        fail(
          "matsubara_sequence_invalid",
          "Matsubara frequency is negative or inconsistent within a block.",
        );
      }
      blockFrequency ??= xi;
      minimumEnergy = Math.min(minimumEnergy, energy);
      maximumEnergy = Math.max(maximumEnergy, energy);
      minimumZForce = Math.min(minimumZForce, zForce);
      maximumZForce = Math.max(maximumZForce, zForce);
    }
    frequencies.push(blockFrequency ?? Number.NaN);
  }
  if (!nearPrintedScientific(frequencies[0], PINNED_XIMIN)) {
    fail(
      "matsubara_sequence_invalid",
      "First Matsubara block does not use the pinned XIMIN proxy.",
    );
  }
  const step =
    2 *
    Math.PI *
    PINNED_BOLTZMANN_K_INTERNAL_PER_KELVIN *
    input.plan.input.thermodynamics.temperatureKelvin;
  for (let index = 1; index < frequencies.length; index += 1) {
    if (
      frequencies[index] <= frequencies[index - 1] ||
      !nearPrintedScientific(frequencies[index], step * index)
    ) {
      fail(
        "matsubara_sequence_invalid",
        "Matsubara frequency blocks do not match the pinned source sequence.",
      );
    }
  }
  return {
    rowCount: table.rows.length,
    frequencies,
    energyRange: [minimumEnergy, maximumEnergy],
    zForceRange: [minimumZForce, maximumZForce],
  };
};

const computeRawCentralDifferences = (
  rows: readonly Nhm2ScuffEmIntegratedSweepRowV1[],
): Nhm2ScuffEmRawCentralDifferenceV1[] => {
  const gradients: Nhm2ScuffEmRawCentralDifferenceV1[] = [];
  for (let index = 1; index < rows.length - 1; index += 1) {
    const left = rows[index - 1];
    const center = rows[index];
    const right = rows[index + 1];
    const span =
      right.separationMetersFromFrozenInput -
      left.separationMetersFromFrozenInput;
    const gradient = (right.zForceRawScuff - left.zForceRawScuff) / span;
    const propagatedError =
      (right.zForceNumericalXiIntegrationErrorRawScuff +
        left.zForceNumericalXiIntegrationErrorRawScuff) /
      span;
    if (
      !Number.isFinite(span) ||
      span <= 0 ||
      !Number.isFinite(gradient) ||
      !Number.isFinite(propagatedError) ||
      propagatedError < 0
    ) {
      fail(
        "derived_raw_gradient_nonfinite",
        "Raw SCUFF central difference or propagated error is invalid.",
      );
    }
    gradients.push({
      centerLabel: center.label,
      leftLabel: left.label,
      rightLabel: right.label,
      centralSpanMetersFromFrozenInput: span,
      zForceCentralDifferenceRawScuffPerInputMeter: gradient,
      propagatedAbsoluteNumericalXiIntegrationErrorRawScuffPerInputMeter:
        propagatedError,
      propagationMethod:
        "sum_of_reported_absolute_integration_errors_over_central_span",
      reportedErrorConfidenceLevelEstablished: false,
    });
  }
  return gradients;
};

const claimBoundary =
  (): Nhm2ScuffEmForceSweepPartialReplayArtifactV1["claimBoundary"] => ({
    diagnosticPartialReplayOnly: true,
    rawScuffIntegratedEnergyAndZForceReplayed: true,
    rawScuffCentralDifferencesComputed: true,
    matsubaraHeaderAndSequenceReplayed: true,
    siUnitConversionEstablished: false,
    localMaxwellStressTractionFieldEstablished: false,
    meshConvergenceEstablished: false,
    materialMeasurementCorrespondenceEstablished: false,
    independentScientificReplayEstablished: false,
    theoryClosureClaimAllowed: false,
    empiricalValidationEstablished: false,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
    routeEtaClaimAllowed: false,
    speedAuthorityClaimAllowed: false,
  });

/**
 * Re-opens a fresh external SCUFF run and independently parses only the raw
 * integrated Energy/ZForce and bounded Matsubara tables declared by the
 * pinned source. It cannot establish SI units, local traction, convergence,
 * material correspondence, theory closure, or any operational authority.
 */
export async function replayNhm2ScuffEmForceSweepPartialContent(
  input: ReplayNhm2ScuffEmForceSweepPartialContentInput,
): Promise<
  | Nhm2ScuffEmForceSweepPartialReplayArtifactV1
  | Nhm2ScuffEmExecutorReceiptNotReadyV1
> {
  const suppliedKeys = Object.keys(input).sort(utf8Compare);
  const allowedKeys = ["afterContentReplayForTesting", "receiptId"].filter(
    (key) => key in input,
  );
  allowedKeys.sort(utf8Compare);
  if (!isDeepStrictEqual(suppliedKeys, allowedKeys)) {
    fail(
      "caller_supplied_execution_binding_forbidden",
      "SCUFF replay accepts only a server-resolved receiptId; caller plan, observation, paths, and provenance are forbidden.",
    );
  }
  const admission = await admitNhm2ScuffEmServerExecutorReceipt({
    receiptId: input.receiptId,
  });
  if (admission.status === "not_ready") return admission;
  const replayInput = {
    plan: admission.receipt.plan,
    observation: admission.receipt.observation,
  };
  try {
    validateNhm2ScuffEmForceSweepExternalPlan(replayInput.plan);
  } catch (error) {
    if (error instanceof Nhm2ScuffEmForceSweepPlanError) {
      fail(error.code, `SCUFF plan rejected: ${error.message}`);
    }
    throw error;
  }
  const interval = validateObservation(
    replayInput.plan,
    replayInput.observation,
  );
  const root = await validateRoot(replayInput.plan.runSpec.outputRoot);
  const expectedPaths = replayInput.plan.runSpec.expectedOutputs.map(
    (entry) => entry.relativePath,
  );
  const inventoryBefore = await snapshotExactInventory({
    root: root.root,
    expectedPaths,
  });
  const files = new Map<string, SecureFile>();
  let aggregateBytes = 0;
  for (const output of replayInput.observation.outputs) {
    const file = await readSecureFile({
      root: root.root,
      rootRealPath: root.rootRealPath,
      output,
      ...interval,
    });
    aggregateBytes += file.sizeBytes;
    if (
      !Number.isSafeInteger(aggregateBytes) ||
      aggregateBytes >
        NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_LIMITS.maxAggregateBytes
    ) {
      fail(
        "output_resource_limit_exceeded",
        "SCUFF outputs exceed the aggregate replay byte ceiling.",
      );
    }
    files.set(output.role, file);
  }
  const integratedFile = files.get("casimir_integrated_force_sweep");
  const matsubaraFile = files.get("casimir_matsubara_spectrum");
  const logFile = files.get("casimir_solver_log");
  if (integratedFile == null || matsubaraFile == null || logFile == null) {
    fail(
      "output_inventory_mismatch",
      "One or more required SCUFF outputs were not reopened.",
    );
  }
  const verifiedIntegratedFile = integratedFile as SecureFile;
  const verifiedMatsubaraFile = matsubaraFile as SecureFile;
  const verifiedLogFile = logFile as SecureFile;
  const integratedRows = parseIntegratedSweep({
    plan: replayInput.plan,
    file: verifiedIntegratedFile,
  });
  const matsubara = parseMatsubara({
    plan: replayInput.plan,
    file: verifiedMatsubaraFile,
  });
  inspectBoundedOpaqueLog(verifiedLogFile);
  const gradients = computeRawCentralDifferences(integratedRows);

  await input.afterContentReplayForTesting?.();

  for (const output of replayInput.observation.outputs) {
    const before = files.get(output.role);
    const after = await readSecureFile({
      root: root.root,
      rootRealPath: root.rootRealPath,
      output,
      ...interval,
    });
    if (
      before == null ||
      before.sha256 !== after.sha256 ||
      before.sizeBytes !== after.sizeBytes ||
      !isDeepStrictEqual(before.identity, after.identity)
    ) {
      fail(
        "output_changed_while_replaying",
        `Output changed after content replay: ${output.relativePath}.`,
      );
    }
  }
  const inventoryAfter = await snapshotExactInventory({
    root: root.root,
    expectedPaths,
  });
  const rootAfter = await fs.lstat(root.root);
  if (
    !isDeepStrictEqual(inventoryBefore, inventoryAfter) ||
    !isDeepStrictEqual(root.identity, statIdentity(rootAfter))
  ) {
    fail(
      "output_changed_while_replaying",
      "Output inventory or root identity changed during scientific replay.",
    );
  }
  await reverifyNhm2ScuffEmServerExecutorReceipt(admission).catch(
    (error: unknown) =>
      fail(
        "server_owned_executor_receipt_changed_during_replay",
        error instanceof Error ? error.message : "Executor receipt changed.",
      ),
  );

  const planSha256 = hashDomain(
    "nhm2_scuff_em_force_sweep_external_plan_binding/v1",
    replayInput.plan,
  );
  const observationSha256 = hashDomain(
    "nhm2_external_numerical_kernel_observation_binding/v1",
    replayInput.observation,
  );
  const runIdentitySha256 = hashDomain(
    "nhm2_scuff_em_force_sweep_partial_replay_run_identity/v1",
    {
      planSha256,
      observationSha256,
      startedAt: replayInput.observation.process.startedAt,
      completedAt: replayInput.observation.process.completedAt,
      command: replayInput.observation.process.command,
      args: replayInput.observation.process.args,
      outputInventorySha256: replayInput.observation.outputInventorySha256,
    },
  );
  const fileBindings = replayInput.observation.outputs.map((output) => ({
    role: output.role as Nhm2ScuffEmForceSweepPartialReplayFileBindingV1["role"],
    relativePath: output.relativePath,
    sha256: output.sha256,
    sizeBytes: output.sizeBytes,
    modifiedAt: output.modifiedAt,
    freshness: "new" as const,
    writtenWithinExecutionInterval: true as const,
  }));
  const sumsIntegralsSource = NHM2_SCUFF_EM_CRITICAL_SOURCE_BINDINGS.find(
    (entry) =>
      entry.suffix === NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE.sourceFileSuffix,
  );
  if (sumsIntegralsSource == null) {
    fail(
      "pinned_matsubara_source_binding_missing",
      "Pinned SumsIntegrals.cc source binding is missing.",
    );
  }
  const verifiedSumsIntegralsSource = sumsIntegralsSource as {
    suffix: string;
    sha256: string;
    sizeBytes: number;
  };
  return {
    artifactId: "nhm2.scuff_em_force_sweep_partial_content_replay",
    contractVersion: NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_VERSION,
    generatedAt: new Date().toISOString(),
    status: "partial_raw_scuff_content_replayed_blocked",
    sourceBinding: {
      repository: "https://github.com/HomerReid/scuff-em",
      commitSha: NHM2_SCUFF_EM_COMMIT_SHA,
      version: NHM2_SCUFF_EM_VERSION,
      planSha256,
      toolchainLedgerSha256:
        replayInput.plan.runSpec.ledgers.toolchain.ledgerSha256,
      inputLedgerSha256: replayInput.plan.runSpec.ledgers.input.ledgerSha256,
      serverExecutorReceiptSha256: admission.receiptSha256,
      serverExecutorReceiptSizeBytes: admission.receiptSizeBytes,
      criticalSourceBindings: NHM2_SCUFF_EM_CRITICAL_SOURCE_BINDINGS.map(
        (entry) => ({ ...entry }),
      ),
    },
    executionBinding: {
      runIdentitySha256,
      observationSha256,
      outputInventorySha256: replayInput.observation.outputInventorySha256,
      startedAt: replayInput.observation.process.startedAt,
      completedAt: replayInput.observation.process.completedAt,
      durationMs: replayInput.observation.process.durationMs,
      outputRoot: path.resolve(replayInput.plan.runSpec.outputRoot),
      runOwnedToolchainStagingIdentitySha256:
        replayInput.observation.runOwnedToolchain.stagingIdentitySha256,
      runOwnedToolchainSourceLedgerSha256:
        replayInput.observation.runOwnedToolchain.sourceLedgerSha256,
      stagedExecutableSha256: replayInput.observation.executable.sha256,
      externalBinaryExecutionObserved: true,
    },
    sourceToBinaryProvenance: {
      officialBinaryArtifactPublishedAtPin: false,
      gitTreeObjectId:
        admission.receipt.sourceToBinaryProvenance.fullSourceLedger
          .gitTreeObjectId,
      gitTrackedEntryCount:
        admission.receipt.sourceToBinaryProvenance.fullSourceLedger
          .gitTrackedEntryCount,
      gitTreeVerificationReceiptSha256:
        admission.receipt.sourceToBinaryProvenance.fullSourceLedger
          .gitTreeVerificationReceiptBinding.sha256,
      fullSourceLedgerSha256:
        admission.receipt.sourceToBinaryProvenance.fullSourceLedger
          .ledgerSha256,
      fullSourceEntryCount:
        admission.receipt.sourceToBinaryProvenance.fullSourceLedger.entryCount,
      fullSourceAggregateBytes:
        admission.receipt.sourceToBinaryProvenance.fullSourceLedger
          .aggregateBytes,
      reproducibleBuildReceiptSha256:
        admission.receipt.sourceToBinaryProvenance.reproducibleBuildReceipt
          .receiptBinding.sha256,
      compilerExecutableSha256:
        admission.receipt.sourceToBinaryProvenance.reproducibleBuildReceipt
          .compilerExecutableBinding.sha256,
      linkerExecutableSha256:
        admission.receipt.sourceToBinaryProvenance.reproducibleBuildReceipt
          .linkerExecutableBinding.sha256,
      buildDriverExecutableSha256:
        admission.receipt.sourceToBinaryProvenance.reproducibleBuildReceipt
          .buildDriverExecutableBinding.sha256,
      firstBuildExecutableSha256:
        admission.receipt.sourceToBinaryProvenance.reproducibleBuildReceipt
          .firstBuildExecutableSha256,
      secondBuildExecutableSha256:
        admission.receipt.sourceToBinaryProvenance.reproducibleBuildReceipt
          .secondBuildExecutableSha256,
      runExecutableSha256: replayInput.observation.executable.sha256,
      byteIdenticalRebuilds: true,
      sourceToBinaryProvenanceEstablished: true,
    },
    files: fileBindings,
    integratedSweep: {
      columnDeclarations: OUT_COLUMNS,
      unitAuthority: "raw_scuff_internal_units_only",
      rows: integratedRows,
    },
    matsubaraSpectrum: {
      columnDeclarations: BY_XI_COLUMNS,
      unitAuthority: "raw_scuff_internal_units_only",
      rowCount: matsubara.rowCount,
      frequencyBlockCount: matsubara.frequencies.length,
      transformationCountPerBlock: replayInput.plan.input.geometry.sweep.length,
      frequenciesRawScuff: matsubara.frequencies,
      sequenceReplay: {
        ...NHM2_SCUFF_EM_PINNED_MATSUBARA_SEQUENCE,
        sourceFileSha256: verifiedSumsIntegralsSource.sha256,
        temperatureKelvinFromFrozenInput:
          replayInput.plan.input.thermodynamics.temperatureKelvin,
      },
      firstFrequencyUsesPinnedXiminProxy: true,
      pinnedXiminRawScuff: PINNED_XIMIN,
      subsequentPinnedMatsubaraSequenceVerified: true,
      allDeclaredIntegrandValuesFinite: true,
      energyIntegrandRangeRawScuff: matsubara.energyRange,
      zForceIntegrandRangeRawScuff: matsubara.zForceRange,
      solverLogUsedForScientificAuthority: false,
    },
    rawCentralDifferences: gradients,
    blockers: NHM2_SCUFF_EM_FORCE_SWEEP_PARTIAL_REPLAY_BLOCKERS,
    claimBoundary: claimBoundary(),
  };
}
