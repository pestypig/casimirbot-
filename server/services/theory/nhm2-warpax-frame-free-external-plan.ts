import { createHash } from "node:crypto";
import path from "node:path";

import {
  computeNhm2ExternalNumericalKernelLedgerSha256,
  type Nhm2ExternalNumericalKernelExecutableBindingV1,
  type Nhm2ExternalNumericalKernelRunSpecV1,
  type Nhm2ExternalNumericalKernelSealedLedgerV1,
} from "./nhm2-external-numerical-kernel-executor";

export const NHM2_WARPAX_FRAME_FREE_INPUT_VERSION =
  "nhm2_warpax_frame_free_input/v1" as const;
export const NHM2_WARPAX_FRAME_FREE_PLAN_VERSION =
  "nhm2_warpax_frame_free_external_plan/v1" as const;
export const NHM2_WARPAX_VERSION = "1.3.0" as const;
export const NHM2_WARPAX_TAG = "v1.3.0" as const;
export const NHM2_WARPAX_COMMIT_SHA =
  "187985fe28c49b28caac5964759b3d34ba03b3f3" as const;
export const NHM2_WARPAX_REPOSITORY =
  "https://github.com/anindex/warpax" as const;
export const NHM2_WARPAX_FRAME_FREE_DRIVER_SHA256 =
  "9b18afefc9d4c6aa0ed335b459e72e61af0e7cf32616099ef16dc76bf3e2e678" as const;

export const NHM2_WARPAX_OFFICIAL_V1_3_CRITICAL_SOURCE_BINDINGS = [
  {
    suffix: "warpax/energy_conditions/_gen_eig_callback.py",
    sha256: "70d8e8fc866d61cae034ffd3bc12b2f7ddeafc410714ad0db2625b6d3c2e97b0",
    sizeBytes: 4_099,
  },
  {
    suffix: "warpax/energy_conditions/classification.py",
    sha256: "693a4b488c17100dff72a5253cec589bee3997559583e2aaa05239b5a083c93a",
    sizeBytes: 14_487,
  },
  {
    suffix: "warpax/energy_conditions/eigenvalue_checks.py",
    sha256: "879a43ba19506d43ec085f6dd64f6d4835149fa61036e9b843cf8f910e5d53e6",
    sizeBytes: 3_755,
  },
  {
    suffix: "warpax/energy_conditions/frame_free.py",
    sha256: "ead8a12b62b64ee67fa4ebc9fb67bf0c306f44a3cfbdde457d3bbb41374b98f0",
    sizeBytes: 8_251,
  },
  {
    suffix: "warpax/energy_conditions/types.py",
    sha256: "411f2be3ff3ab99b3df137eb417aefdeb9fa594a6c4ee183fa136dc8551a6bcd",
    sizeBytes: 7_664,
  },
  {
    suffix: "warpax/energy_conditions/verifier.py",
    sha256: "6591be714271737fbed0c8a5284fd40a9806e9d1e95ec9dad064f2ce38b924ea",
    sizeBytes: 23_002,
  },
] as const;

export type Nhm2WarpaxFrameFreeSolver = "auto" | "standard" | "generalized";

export type Nhm2WarpaxFrameFreeRawTensorBindingV1 = {
  relativePath: string;
  sha256: string;
  shape: [number, 4, 4];
  dtype: "float64";
  byteOrder: "little";
  storageOrder: "row_major";
  indexPosition: "covariant";
  chart: string;
  units: string;
};

export type Nhm2WarpaxFrameFreeInputV1 = {
  artifactId: "nhm2.warpax_frame_free_input";
  contractVersion: typeof NHM2_WARPAX_FRAME_FREE_INPUT_VERSION;
  package: {
    name: "warpax";
    version: typeof NHM2_WARPAX_VERSION;
    repository: typeof NHM2_WARPAX_REPOSITORY;
    tag: typeof NHM2_WARPAX_TAG;
    commitSha: typeof NHM2_WARPAX_COMMIT_SHA;
    harnessOnly: boolean;
  };
  metricSignature: "(-,+,+,+)";
  unitSystem: "geometric_G_eq_c_eq_1";
  stressEnergy: Nhm2WarpaxFrameFreeRawTensorBindingV1 & {
    units: "inverse_length_squared";
  };
  metric: Nhm2WarpaxFrameFreeRawTensorBindingV1 & {
    units: "dimensionless";
  };
  solver: Nhm2WarpaxFrameFreeSolver;
  tolerance: number;
};

export type Nhm2WarpaxFrameFreeExternalPlanV1 = {
  artifactId: "nhm2.warpax_frame_free_external_plan";
  contractVersion: typeof NHM2_WARPAX_FRAME_FREE_PLAN_VERSION;
  status: "sealed_external_execution_plan_scientific_replay_required";
  inputManifestRelativePath: string;
  driverRelativePath: string;
  input: Nhm2WarpaxFrameFreeInputV1;
  runSpec: Nhm2ExternalNumericalKernelRunSpecV1;
  blockers: readonly [
    "independent_scientific_content_replay_required",
    "spatial_continuum_coverage_unresolved",
    "global_interval_coverage_unresolved",
    "warpax_v1_3_grid_tolerance_not_forwarded_to_batch_classifier",
  ];
  claimBoundary: {
    typeIAlgebraicAllObserverResultAtSamplesAllowed: true;
    nonTypeIBfgsSubstitutionAllowed: false;
    spatialContinuumCoverageEstablished: false;
    globalIntervalCoverageEstablished: false;
    theoryClosureClaimAllowed: false;
    empiricalValidationEstablished: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2WarpaxFrameFreeExternalPlanInput = {
  input: Nhm2WarpaxFrameFreeInputV1;
  inputManifestRelativePath: string;
  driverRelativePath: string;
  executable: Nhm2ExternalNumericalKernelExecutableBindingV1;
  toolchainLedger: Nhm2ExternalNumericalKernelSealedLedgerV1;
  inputLedger: Nhm2ExternalNumericalKernelSealedLedgerV1;
  outputRoot: string;
};

export class Nhm2WarpaxFrameFreePlanError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2WarpaxFrameFreePlanError";
    this.code = code;
  }
}

const SHA256 = /^[a-f0-9]{64}$/;
const MAX_POINTS = 1_000_000;
const DRIVER_MAX_BYTES = 1024 * 1024;
const MANIFEST_MAX_BYTES = 1024 * 1024;
const RESULT_MAX_BYTES = 2 * 1024 * 1024 * 1024;
const TRACE_MAX_BYTES = 64 * 1024 * 1024;
const OUTPUT_AGGREGATE_MAX_BYTES = RESULT_MAX_BYTES + TRACE_MAX_BYTES;

const fail = (code: string, message: string): never => {
  throw new Nhm2WarpaxFrameFreePlanError(code, message);
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const portableRelativePath = (value: string): boolean =>
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !path.posix.isAbsolute(value) &&
  value
    .split("/")
    .every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        fail(
          "input_manifest_invalid",
          "Canonical JSON forbids non-finite numbers.",
        );
      }
      return JSON.stringify(Object.is(value, -0) ? 0 : value);
    case "string":
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
      }
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record)
        .sort(compareUtf8)
        .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
        .join(",")}}`;
    }
    default:
      return fail(
        "input_manifest_invalid",
        "Input is not canonical-JSON serializable.",
      );
  }
};

export const serializeNhm2WarpaxFrameFreeInput = (
  input: Nhm2WarpaxFrameFreeInputV1,
): string => canonicalJson(input);

function exactKeys(
  value: unknown,
  keys: readonly string[],
  label: string,
): asserts value is Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    fail("input_manifest_invalid", `${label} must be an object.`);
  }
  const observed = Object.keys(value as object).sort(compareUtf8);
  const expected = [...keys].sort(compareUtf8);
  if (JSON.stringify(observed) !== JSON.stringify(expected)) {
    fail(
      "input_manifest_invalid",
      `${label} keys do not match the v1 contract.`,
    );
  }
}

const validateDescriptor = (
  value: unknown,
  label: string,
): Nhm2WarpaxFrameFreeRawTensorBindingV1 => {
  exactKeys(
    value,
    [
      "byteOrder",
      "chart",
      "dtype",
      "indexPosition",
      "relativePath",
      "sha256",
      "shape",
      "storageOrder",
      "units",
    ],
    label,
  );
  const shape = value.shape;
  if (
    !portableRelativePath(String(value.relativePath)) ||
    typeof value.relativePath !== "string" ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    !Array.isArray(shape) ||
    shape.length !== 3 ||
    !Number.isSafeInteger(shape[0]) ||
    (shape[0] as number) <= 0 ||
    (shape[0] as number) > MAX_POINTS ||
    shape[1] !== 4 ||
    shape[2] !== 4 ||
    value.dtype !== "float64" ||
    value.byteOrder !== "little" ||
    value.storageOrder !== "row_major" ||
    value.indexPosition !== "covariant" ||
    typeof value.chart !== "string" ||
    value.chart.length === 0 ||
    value.chart.trim() !== value.chart ||
    value.chart.length > 256 ||
    typeof value.units !== "string" ||
    value.units.length === 0
  ) {
    fail("input_descriptor_invalid", `${label} is invalid.`);
  }
  return value as Nhm2WarpaxFrameFreeRawTensorBindingV1;
};

const validateInput = (
  value: Nhm2WarpaxFrameFreeInputV1,
  production: boolean,
): void => {
  exactKeys(
    value,
    [
      "artifactId",
      "contractVersion",
      "metric",
      "metricSignature",
      "package",
      "solver",
      "stressEnergy",
      "tolerance",
      "unitSystem",
    ],
    "input",
  );
  if (
    value.artifactId !== "nhm2.warpax_frame_free_input" ||
    value.contractVersion !== NHM2_WARPAX_FRAME_FREE_INPUT_VERSION ||
    value.metricSignature !== "(-,+,+,+)" ||
    value.unitSystem !== "geometric_G_eq_c_eq_1" ||
    !["auto", "standard", "generalized"].includes(value.solver) ||
    !Number.isFinite(value.tolerance) ||
    value.tolerance <= 0 ||
    value.tolerance > 1
  ) {
    fail(
      "input_manifest_invalid",
      "Input identity, conventions, solver, or tolerance is invalid.",
    );
  }
  exactKeys(
    value.package,
    ["commitSha", "harnessOnly", "name", "repository", "tag", "version"],
    "input.package",
  );
  if (
    value.package.name !== "warpax" ||
    value.package.version !== NHM2_WARPAX_VERSION ||
    value.package.repository !== NHM2_WARPAX_REPOSITORY ||
    value.package.tag !== NHM2_WARPAX_TAG ||
    value.package.commitSha !== NHM2_WARPAX_COMMIT_SHA ||
    typeof value.package.harnessOnly !== "boolean"
  ) {
    fail(
      "warpax_package_binding_invalid",
      "warpax is not pinned to official v1.3.0.",
    );
  }
  if (production && value.package.harnessOnly) {
    fail(
      "harness_package_forbidden",
      "A harness-only warpax package cannot enter the governed execution plan.",
    );
  }
  const stressEnergy = validateDescriptor(
    value.stressEnergy,
    "input.stressEnergy",
  );
  const metric = validateDescriptor(value.metric, "input.metric");
  if (
    stressEnergy.units !== "inverse_length_squared" ||
    metric.units !== "dimensionless" ||
    stressEnergy.chart !== metric.chart ||
    JSON.stringify(stressEnergy.shape) !== JSON.stringify(metric.shape) ||
    stressEnergy.relativePath === metric.relativePath
  ) {
    fail(
      "same_chart_tensor_binding_invalid",
      "Tensor/metric units, chart, shape, or paths are incompatible.",
    );
  }
};

const validateLedgerCommitment = (
  ledger: Nhm2ExternalNumericalKernelSealedLedgerV1,
  kind: "input" | "toolchain",
): void => {
  if (
    ledger.kind !== kind ||
    !path.isAbsolute(ledger.rootPath) ||
    ledger.entries.some(
      (entry, index) =>
        !portableRelativePath(entry.relativePath) ||
        !SHA256.test(entry.sha256) ||
        !Number.isSafeInteger(entry.sizeBytes) ||
        entry.sizeBytes < 0 ||
        (index > 0 &&
          compareUtf8(
            ledger.entries[index - 1].relativePath,
            entry.relativePath,
          ) >= 0),
    ) ||
    ledger.ledgerSha256 !==
      computeNhm2ExternalNumericalKernelLedgerSha256({
        kind,
        entries: ledger.entries,
      })
  ) {
    fail(
      "sealed_ledger_invalid",
      `${kind} ledger is not an exact sorted commitment.`,
    );
  }
};

const legacySimulatedScuffReference = (value: string): boolean => {
  const portable = value.replaceAll("\\", "/").toLowerCase();
  return (
    portable.endsWith("/server/services/scuffem.ts") ||
    portable.endsWith("/scuffem.ts") ||
    portable.includes("simulatescuffemexecution")
  );
};

const rejectLegacySimulatedScuff = (
  plan: Nhm2WarpaxFrameFreeExternalPlanV1,
): void => {
  const candidates = [
    plan.runSpec.executable.absolutePath,
    plan.runSpec.ledgers.input.rootPath,
    plan.runSpec.ledgers.toolchain.rootPath,
    ...plan.runSpec.ledgers.input.entries.map((entry) => entry.relativePath),
    ...plan.runSpec.ledgers.toolchain.entries.map(
      (entry) => entry.relativePath,
    ),
    ...plan.runSpec.arguments.flatMap((argument) =>
      "value" in argument
        ? [argument.value]
        : "relativePath" in argument
          ? [argument.relativePath]
          : [],
    ),
  ];
  if (candidates.some(legacySimulatedScuffReference)) {
    fail(
      "legacy_simulated_scuff_forbidden",
      "The legacy simulated SCUFF service is not an external scientific solver and is forbidden in this lane.",
    );
  }
};

const validateOfficialCriticalSources = (
  ledger: Nhm2ExternalNumericalKernelSealedLedgerV1,
): void => {
  for (const binding of NHM2_WARPAX_OFFICIAL_V1_3_CRITICAL_SOURCE_BINDINGS) {
    const matches = ledger.entries.filter(
      (entry) =>
        entry.relativePath === binding.suffix ||
        entry.relativePath.endsWith(`/${binding.suffix}`),
    );
    if (
      matches.length !== 1 ||
      matches[0].sha256 !== binding.sha256 ||
      matches[0].sizeBytes !== binding.sizeBytes
    ) {
      fail(
        "official_warpax_source_binding_invalid",
        `Toolchain must bind the official v1.3.0 ${binding.suffix} bytes.`,
      );
    }
  }
  const metadataMatches = ledger.entries.filter((entry) =>
    /(^|\/)warpax-1\.3\.0\.dist-info\/METADATA$/.test(entry.relativePath),
  );
  if (metadataMatches.length !== 1) {
    fail(
      "warpax_distribution_metadata_missing",
      "Toolchain must contain exactly one warpax-1.3.0 distribution metadata file.",
    );
  }
};

const expectedArguments = (
  driverRelativePath: string,
  inputManifestRelativePath: string,
): Nhm2ExternalNumericalKernelRunSpecV1["arguments"] => [
  { kind: "input_path", relativePath: driverRelativePath },
  { kind: "literal", value: "--input" },
  { kind: "input_path", relativePath: inputManifestRelativePath },
  { kind: "literal", value: "--result" },
  { kind: "output_path", relativePath: "observer-result.json" },
  { kind: "literal", value: "--trace" },
  { kind: "output_path", relativePath: "observer-trace.json" },
];

const expectedOutputs: Nhm2ExternalNumericalKernelRunSpecV1["expectedOutputs"] =
  [
    {
      role: "observer_optimizer_result",
      relativePath: "observer-result.json",
      maxBytes: RESULT_MAX_BYTES,
    },
    {
      role: "observer_optimizer_trace",
      relativePath: "observer-trace.json",
      maxBytes: TRACE_MAX_BYTES,
    },
  ];

const governedEnvironment = {
  JAX_ENABLE_X64: "1",
  JAX_PLATFORMS: "cpu",
  PYTHONHASHSEED: "0",
  PYTHONNOUSERSITE: "1",
  PYTHONSAFEPATH: "1",
} as const;

const claimBoundary: Nhm2WarpaxFrameFreeExternalPlanV1["claimBoundary"] = {
  typeIAlgebraicAllObserverResultAtSamplesAllowed: true,
  nonTypeIBfgsSubstitutionAllowed: false,
  spatialContinuumCoverageEstablished: false,
  globalIntervalCoverageEstablished: false,
  theoryClosureClaimAllowed: false,
  empiricalValidationEstablished: false,
  physicalViabilityClaimAllowed: false,
  transportClaimAllowed: false,
  propulsionClaimAllowed: false,
  routeEtaClaimAllowed: false,
  speedAuthorityClaimAllowed: false,
};

const blockers = [
  "independent_scientific_content_replay_required",
  "spatial_continuum_coverage_unresolved",
  "global_interval_coverage_unresolved",
  "warpax_v1_3_grid_tolerance_not_forwarded_to_batch_classifier",
] as const;

export function validateNhm2WarpaxFrameFreeExternalPlan(
  plan: Nhm2WarpaxFrameFreeExternalPlanV1,
): void {
  validateInput(plan.input, true);
  if (
    plan.artifactId !== "nhm2.warpax_frame_free_external_plan" ||
    plan.contractVersion !== NHM2_WARPAX_FRAME_FREE_PLAN_VERSION ||
    plan.status !==
      "sealed_external_execution_plan_scientific_replay_required" ||
    !portableRelativePath(plan.inputManifestRelativePath) ||
    !portableRelativePath(plan.driverRelativePath) ||
    plan.inputManifestRelativePath === plan.driverRelativePath
  ) {
    fail(
      "warpax_plan_identity_invalid",
      "Warpax external plan identity or paths are invalid.",
    );
  }
  const spec = plan.runSpec;
  validateLedgerCommitment(spec.ledgers.toolchain, "toolchain");
  validateLedgerCommitment(spec.ledgers.input, "input");
  rejectLegacySimulatedScuff(plan);
  validateOfficialCriticalSources(spec.ledgers.toolchain);
  if (
    spec.lane !== "observer_continuous_optimizer" ||
    spec.solver.family !== "warpax" ||
    spec.solver.implementationId !==
      "warpax.energy_conditions.frame_free.certify_grid_frame_free" ||
    spec.solver.version !== NHM2_WARPAX_VERSION ||
    spec.solver.producerMode !== "external_binary"
  ) {
    fail(
      "warpax_plan_solver_invalid",
      "Plan is not bound to the governed warpax frame-free lane.",
    );
  }
  const expectedInputEntries = [
    plan.driverRelativePath,
    plan.input.metric.relativePath,
    plan.input.stressEnergy.relativePath,
    plan.inputManifestRelativePath,
  ].sort(compareUtf8);
  if (
    JSON.stringify(
      spec.ledgers.input.entries.map((entry) => entry.relativePath),
    ) !== JSON.stringify(expectedInputEntries)
  ) {
    fail(
      "input_ledger_inventory_invalid",
      "Input ledger must contain exactly driver, manifest, tensor, and metric.",
    );
  }
  const entryByPath = new Map(
    spec.ledgers.input.entries.map((entry) => [entry.relativePath, entry]),
  );
  const driverEntry = entryByPath.get(plan.driverRelativePath);
  const manifestEntry = entryByPath.get(plan.inputManifestRelativePath);
  const stressEntry = entryByPath.get(plan.input.stressEnergy.relativePath);
  const metricEntry = entryByPath.get(plan.input.metric.relativePath);
  const serializedInput = Buffer.from(
    serializeNhm2WarpaxFrameFreeInput(plan.input),
    "utf8",
  );
  const rawBytes = plan.input.stressEnergy.shape[0] * 4 * 4 * 8;
  if (
    driverEntry?.sha256 !== NHM2_WARPAX_FRAME_FREE_DRIVER_SHA256 ||
    driverEntry.sizeBytes <= 0 ||
    driverEntry.sizeBytes > DRIVER_MAX_BYTES ||
    manifestEntry?.sha256 !== sha256(serializedInput) ||
    manifestEntry.sizeBytes !== serializedInput.byteLength ||
    manifestEntry.sizeBytes > MANIFEST_MAX_BYTES ||
    stressEntry?.sha256 !== plan.input.stressEnergy.sha256 ||
    stressEntry.sizeBytes !== rawBytes ||
    metricEntry?.sha256 !== plan.input.metric.sha256 ||
    metricEntry.sizeBytes !== rawBytes
  ) {
    fail(
      "input_ledger_binding_invalid",
      "Input ledger bytes do not match the governed manifest bindings.",
    );
  }
  const executableRelativePath = path
    .relative(spec.ledgers.toolchain.rootPath, spec.executable.absolutePath)
    .split(path.sep)
    .join("/");
  const executableEntry = spec.ledgers.toolchain.entries.find(
    (entry) => entry.relativePath === executableRelativePath,
  );
  if (
    !path.isAbsolute(spec.executable.absolutePath) ||
    executableRelativePath.startsWith("../") ||
    executableEntry?.sha256 !== spec.executable.sha256 ||
    executableEntry.sizeBytes !== spec.executable.sizeBytes
  ) {
    fail(
      "python_executable_binding_invalid",
      "Python executable is not bound inside the sealed toolchain.",
    );
  }
  if (
    !path.isAbsolute(spec.outputRoot) ||
    JSON.stringify(spec.arguments) !==
      JSON.stringify(
        expectedArguments(
          plan.driverRelativePath,
          plan.inputManifestRelativePath,
        ),
      ) ||
    JSON.stringify(spec.expectedOutputs) !== JSON.stringify(expectedOutputs) ||
    JSON.stringify(spec.environmentAllowlist) !==
      JSON.stringify(Object.keys(governedEnvironment).sort(compareUtf8)) ||
    JSON.stringify(spec.environment) !== JSON.stringify(governedEnvironment) ||
    spec.timeoutMs !== 60 * 60 * 1_000 ||
    spec.maxCapturedOutputBytes !== 1024 * 1024 ||
    spec.maxLedgerFileBytes !== 2 * 1024 * 1024 * 1024 ||
    spec.maxLedgerAggregateBytes !== 8 * 1024 * 1024 * 1024 ||
    spec.maxOutputAggregateBytes !== OUTPUT_AGGREGATE_MAX_BYTES
  ) {
    fail(
      "warpax_run_spec_invalid",
      "Warpax run spec differs from the governed deterministic invocation.",
    );
  }
  if (
    JSON.stringify(plan.blockers) !== JSON.stringify(blockers) ||
    JSON.stringify(plan.claimBoundary) !== JSON.stringify(claimBoundary)
  ) {
    fail(
      "warpax_claim_boundary_invalid",
      "Warpax plan weakened its blockers or claim boundary.",
    );
  }
}

export function buildNhm2WarpaxFrameFreeExternalPlan(
  bindings: BuildNhm2WarpaxFrameFreeExternalPlanInput,
): Nhm2WarpaxFrameFreeExternalPlanV1 {
  const runSpec: Nhm2ExternalNumericalKernelRunSpecV1 = {
    lane: "observer_continuous_optimizer",
    solver: {
      family: "warpax",
      implementationId:
        "warpax.energy_conditions.frame_free.certify_grid_frame_free",
      version: NHM2_WARPAX_VERSION,
      producerMode: "external_binary",
    },
    executable: { ...bindings.executable },
    ledgers: {
      toolchain: bindings.toolchainLedger,
      input: bindings.inputLedger,
    },
    outputRoot: bindings.outputRoot,
    arguments: expectedArguments(
      bindings.driverRelativePath,
      bindings.inputManifestRelativePath,
    ),
    environmentAllowlist: Object.keys(governedEnvironment).sort(compareUtf8),
    environment: { ...governedEnvironment },
    expectedOutputs: expectedOutputs.map((entry) => ({ ...entry })),
    timeoutMs: 60 * 60 * 1_000,
    maxCapturedOutputBytes: 1024 * 1024,
    maxLedgerFileBytes: 2 * 1024 * 1024 * 1024,
    maxLedgerAggregateBytes: 8 * 1024 * 1024 * 1024,
    maxOutputAggregateBytes: OUTPUT_AGGREGATE_MAX_BYTES,
  };
  const plan: Nhm2WarpaxFrameFreeExternalPlanV1 = {
    artifactId: "nhm2.warpax_frame_free_external_plan",
    contractVersion: NHM2_WARPAX_FRAME_FREE_PLAN_VERSION,
    status: "sealed_external_execution_plan_scientific_replay_required",
    inputManifestRelativePath: bindings.inputManifestRelativePath,
    driverRelativePath: bindings.driverRelativePath,
    input: bindings.input,
    runSpec,
    blockers,
    claimBoundary: { ...claimBoundary },
  };
  validateNhm2WarpaxFrameFreeExternalPlan(plan);
  return plan;
}
