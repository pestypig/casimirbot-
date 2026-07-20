import { createHash } from "node:crypto";
import path from "node:path";

import {
  computeNhm2ExternalNumericalKernelLedgerSha256,
  type Nhm2ExternalNumericalKernelExecutableBindingV1,
  type Nhm2ExternalNumericalKernelRunSpecV1,
  type Nhm2ExternalNumericalKernelSealedLedgerV1,
} from "./nhm2-external-numerical-kernel-executor";

export const NHM2_SCUFF_EM_FORCE_SWEEP_INPUT_VERSION =
  "nhm2_scuff_em_force_sweep_input/v1" as const;
export const NHM2_SCUFF_EM_FORCE_SWEEP_PLAN_VERSION =
  "nhm2_scuff_em_force_sweep_external_plan/v1" as const;
export const NHM2_SCUFF_EM_REPOSITORY =
  "https://github.com/HomerReid/scuff-em" as const;
export const NHM2_SCUFF_EM_COMMIT_SHA =
  "9c6d0cb7695463af803dee8d04cdae939740cdcc" as const;
export const NHM2_SCUFF_EM_VERSION = "git-9c6d0cb76954" as const;
export const NHM2_SCUFF_EM_GIT_TREE_OBJECT_ID =
  "3f4db2adaf5977f1f16109508075b28708eda272" as const;
export const NHM2_SCUFF_EM_GIT_TRACKED_ENTRY_COUNT = 1_474 as const;
export const NHM2_SCUFF_EM_MATSUBARA_PRINT_POLICY = {
  ximinRawScuff: 0.001,
  boltzmannKInternalPerKelvin: 4.36763e-4,
  digitsAfterDecimal: 6,
} as const;

/**
 * These source-byte commitments pin the scuff-cas3D implementation at the
 * governed commit. The upstream repository publishes no release artifact for
 * this revision, so a mutable branch name is deliberately insufficient.
 */
export const NHM2_SCUFF_EM_CRITICAL_SOURCE_BINDINGS = [
  {
    suffix: "applications/scuff-cas3D/CasimirIntegrand.cc",
    sha256: "e5c6943f936ed12e1fa6c0f5b09d77247399dff0fa4b4b727793dc7153ef1872",
    sizeBytes: 19_949,
  },
  {
    suffix: "applications/scuff-cas3D/CreateSC3Data.cc",
    sha256: "7178efc375904713a076ff4cb37b7c4896aede297a6c83385103cb69e557540e",
    sizeBytes: 11_904,
  },
  {
    suffix: "applications/scuff-cas3D/Makefile.am",
    sha256: "6aa767d65dda6250d2720fb36d62a4d8e2b8b3af7f88e1055525d636ec4ae94b",
    sizeBytes: 692,
  },
  {
    suffix: "applications/scuff-cas3D/SumsIntegrals.cc",
    sha256: "11d253eff3a19c4cf96fb4459c406228fd839c7b2f2279cf19afa7533443cbfb",
    sizeBytes: 28_314,
  },
  {
    suffix: "applications/scuff-cas3D/scuff-cas3D.cc",
    sha256: "dcf9afcb566ff0d8e35209e87a10a27140bc7558d2043fe42899351a037632a2",
    sizeBytes: 15_379,
  },
  {
    suffix: "applications/scuff-cas3D/scuff-cas3D.h",
    sha256: "6148ab77a501f7f5ccb72d0a99f4e3dc2ce83dcf367b725aeef26bb8d393e4c7",
    sizeBytes: 5_649,
  },
] as const;

export type Nhm2ScuffEmInputFileBindingV1 = {
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2ScuffEmDependencyKindV1 =
  | "geometry_auxiliary"
  | "material_measurement_receipt"
  | "material_model"
  | "mesh"
  | "mesh_generation_receipt";

export type Nhm2ScuffEmDependencyBindingV1 = Nhm2ScuffEmInputFileBindingV1 & {
  kind: Nhm2ScuffEmDependencyKindV1;
};

export type Nhm2ScuffEmForceSweepPointV1 = {
  label: string;
  separationMeters: number;
};

export type Nhm2ScuffEmForceSweepInputV1 = {
  artifactId: "nhm2.scuff_em_force_sweep_input";
  contractVersion: typeof NHM2_SCUFF_EM_FORCE_SWEEP_INPUT_VERSION;
  package: {
    name: "scuff-em";
    repository: typeof NHM2_SCUFF_EM_REPOSITORY;
    commitSha: typeof NHM2_SCUFF_EM_COMMIT_SHA;
    version: typeof NHM2_SCUFF_EM_VERSION;
    executableName: "scuff-cas3D";
    noPublishedReleaseAtPin: true;
    harnessOnly: boolean;
  };
  geometry: {
    authority: "finite_compact_cad_bem";
    compactGeometry: true;
    periodicGeometry: false;
    lengthUnitMeters: number;
    baseGapMeters: number;
    movingObjectLabel: string;
    forceAxis: "z";
    geometryFile: Nhm2ScuffEmInputFileBindingV1;
    transformationFile: Nhm2ScuffEmInputFileBindingV1;
    dependencies: Nhm2ScuffEmDependencyBindingV1[];
    sweep: Nhm2ScuffEmForceSweepPointV1[];
  };
  thermodynamics: {
    ensemble: "thermal_equilibrium";
    summation: "matsubara";
    temperatureKelvin: number;
  };
  numerics: {
    absoluteTolerance: number;
    relativeTolerance: number;
  };
  requestedQuantities: readonly ["energy", "z_force"];
};

export type Nhm2ScuffEmForceSweepExternalPlanV1 = {
  artifactId: "nhm2.scuff_em_force_sweep_external_plan";
  contractVersion: typeof NHM2_SCUFF_EM_FORCE_SWEEP_PLAN_VERSION;
  status: "sealed_external_partial_execution_plan";
  inputManifestRelativePath: string;
  input: Nhm2ScuffEmForceSweepInputV1;
  runSpec: Nhm2ExternalNumericalKernelRunSpecV1;
  blockers: readonly [
    "external_execution_observation_required",
    "source_to_binary_reproducible_build_receipt_required",
    "independent_scientific_content_replay_required",
    "local_maxwell_stress_traction_field_unresolved",
    "mesh_refinement_convergence_unresolved",
    "measured_dielectric_correspondence_replay_required",
    "scuff_output_si_conversion_unresolved",
    "force_gradient_uncertainty_replay_required",
  ];
  claimBoundary: {
    officialScuffEmSourceBytesPinned: true;
    equilibriumFiniteTemperatureMatsubaraRequested: true;
    finiteGeometryIntegratedForceSweepRequested: true;
    rawScuffIntegratedEnergyAndZForceOutputAllowedAfterReplay: true;
    siUnitConversionEstablished: false;
    forceGradientEstablished: false;
    localMaxwellStressTractionFieldEstablished: false;
    nonEquilibriumTemperatureCoverageEstablished: false;
    meshConvergenceEstablished: false;
    materialMeasurementCorrespondenceEstablished: false;
    theoryClosureClaimAllowed: false;
    empiricalValidationEstablished: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2ScuffEmForceSweepExternalPlanInput = {
  input: Nhm2ScuffEmForceSweepInputV1;
  inputManifestRelativePath: string;
  executable: Nhm2ExternalNumericalKernelExecutableBindingV1;
  toolchainLedger: Nhm2ExternalNumericalKernelSealedLedgerV1;
  inputLedger: Nhm2ExternalNumericalKernelSealedLedgerV1;
  outputRoot: string;
};

export class Nhm2ScuffEmForceSweepPlanError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2ScuffEmForceSweepPlanError";
    this.code = code;
  }
}

const SHA256 = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}$/;
const MAX_INPUT_FILES = 10_000;
const MAX_INPUT_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_INPUT_AGGREGATE_BYTES = 8 * 1024 * 1024 * 1024;
const OUT_MAX_BYTES = 64 * 1024 * 1024;
const BY_XI_MAX_BYTES = 1024 * 1024 * 1024;
const LOG_MAX_BYTES = 64 * 1024 * 1024;
const OUTPUT_AGGREGATE_MAX_BYTES =
  OUT_MAX_BYTES + BY_XI_MAX_BYTES + LOG_MAX_BYTES;

const fail = (code: string, message: string): never => {
  throw new Nhm2ScuffEmForceSweepPlanError(code, message);
};

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

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

export const serializeNhm2ScuffEmForceSweepInput = (
  input: Nhm2ScuffEmForceSweepInputV1,
): string => canonicalJson(input);

const scientificNumber = (value: number): string => {
  const normalized = Object.is(value, -0) ? 0 : value;
  const rendered = normalized.toExponential(17);
  return rendered.replace(/e([+-])0+(\d+)$/, "e$1$2");
};

const scientificPrintedHalfUlp = (value: number): number => {
  const magnitude = Math.abs(value);
  if (!Number.isFinite(magnitude) || magnitude === 0) return 0;
  const exponent = Math.floor(Math.log10(magnitude));
  return (
    0.5 *
    10 ** (exponent - NHM2_SCUFF_EM_MATSUBARA_PRINT_POLICY.digitsAfterDecimal)
  );
};

export const serializeNhm2ScuffEmForceSweepTransformations = (
  input: Pick<Nhm2ScuffEmForceSweepInputV1, "geometry">,
): string =>
  `${input.geometry.sweep
    .map((point) => {
      const displacement =
        (point.separationMeters - input.geometry.baseGapMeters) /
        input.geometry.lengthUnitMeters;
      return `TRANS ${point.label} OBJECT ${input.geometry.movingObjectLabel} DISPLACED 0 0 ${scientificNumber(displacement)}`;
    })
    .join("\n")}\n`;

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

const validateFileBinding = (
  value: Nhm2ScuffEmInputFileBindingV1,
  label: string,
): void => {
  exactKeys(value, ["relativePath", "sha256", "sizeBytes"], label);
  if (
    typeof value.relativePath !== "string" ||
    !portableRelativePath(value.relativePath) ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    value.sizeBytes <= 0 ||
    value.sizeBytes > MAX_INPUT_FILE_BYTES
  ) {
    fail("input_file_binding_invalid", `${label} is invalid.`);
  }
};

const validateSweep = (input: Nhm2ScuffEmForceSweepInputV1): void => {
  const { baseGapMeters, lengthUnitMeters, movingObjectLabel, sweep } =
    input.geometry;
  if (
    !Number.isFinite(lengthUnitMeters) ||
    lengthUnitMeters <= 0 ||
    lengthUnitMeters > 1 ||
    !Number.isFinite(baseGapMeters) ||
    baseGapMeters <= 0 ||
    baseGapMeters > 1 ||
    !IDENTIFIER.test(movingObjectLabel) ||
    !Array.isArray(sweep) ||
    sweep.length < 5 ||
    sweep.length > 257 ||
    sweep.length % 2 !== 1
  ) {
    fail(
      "force_sweep_invalid",
      "Force-sweep geometry or sample count is invalid.",
    );
  }
  const center = (sweep.length - 1) / 2;
  for (let index = 0; index < sweep.length; index += 1) {
    const point = sweep[index];
    exactKeys(point, ["label", "separationMeters"], `geometry.sweep[${index}]`);
    if (
      point.label !== `gap_${index.toString().padStart(3, "0")}` ||
      !Number.isFinite(point.separationMeters) ||
      point.separationMeters <= 0 ||
      (index > 0 && point.separationMeters <= sweep[index - 1].separationMeters)
    ) {
      fail(
        "force_sweep_invalid",
        "Force-sweep points must be canonically labelled and strictly increasing.",
      );
    }
  }
  const scale = Math.max(1, Math.abs(baseGapMeters));
  if (
    Math.abs(sweep[center].separationMeters - baseGapMeters) >
    1e-15 * scale
  ) {
    fail(
      "force_sweep_invalid",
      "The center sweep point must equal the base gap.",
    );
  }
  for (let offset = 1; offset <= center; offset += 1) {
    const left = baseGapMeters - sweep[center - offset].separationMeters;
    const right = sweep[center + offset].separationMeters - baseGapMeters;
    const pairScale = Math.max(Math.abs(left), Math.abs(right), 1e-300);
    if (Math.abs(left - right) > 1e-12 * pairScale) {
      fail(
        "force_sweep_invalid",
        "Force-sweep points must be mirror-symmetric about the base gap.",
      );
    }
  }
};

const dependencyKinds = new Set<Nhm2ScuffEmDependencyKindV1>([
  "geometry_auxiliary",
  "material_measurement_receipt",
  "material_model",
  "mesh",
  "mesh_generation_receipt",
]);

const validateInput = (
  input: Nhm2ScuffEmForceSweepInputV1,
  production: boolean,
): void => {
  exactKeys(
    input,
    [
      "artifactId",
      "contractVersion",
      "geometry",
      "numerics",
      "package",
      "requestedQuantities",
      "thermodynamics",
    ],
    "input",
  );
  if (
    input.artifactId !== "nhm2.scuff_em_force_sweep_input" ||
    input.contractVersion !== NHM2_SCUFF_EM_FORCE_SWEEP_INPUT_VERSION ||
    JSON.stringify(input.requestedQuantities) !==
      JSON.stringify(["energy", "z_force"])
  ) {
    fail(
      "input_manifest_invalid",
      "Input identity or requested quantities are invalid.",
    );
  }
  exactKeys(
    input.package,
    [
      "commitSha",
      "executableName",
      "harnessOnly",
      "name",
      "noPublishedReleaseAtPin",
      "repository",
      "version",
    ],
    "input.package",
  );
  if (
    input.package.name !== "scuff-em" ||
    input.package.repository !== NHM2_SCUFF_EM_REPOSITORY ||
    input.package.commitSha !== NHM2_SCUFF_EM_COMMIT_SHA ||
    input.package.version !== NHM2_SCUFF_EM_VERSION ||
    input.package.executableName !== "scuff-cas3D" ||
    input.package.noPublishedReleaseAtPin !== true ||
    typeof input.package.harnessOnly !== "boolean"
  ) {
    fail(
      "scuff_package_binding_invalid",
      "SCUFF-EM package binding is invalid.",
    );
  }
  if (production && input.package.harnessOnly) {
    fail(
      "harness_package_forbidden",
      "A harness-only package is not admissible.",
    );
  }
  exactKeys(
    input.geometry,
    [
      "authority",
      "baseGapMeters",
      "compactGeometry",
      "dependencies",
      "forceAxis",
      "geometryFile",
      "lengthUnitMeters",
      "movingObjectLabel",
      "periodicGeometry",
      "sweep",
      "transformationFile",
    ],
    "input.geometry",
  );
  if (
    input.geometry.authority !== "finite_compact_cad_bem" ||
    input.geometry.compactGeometry !== true ||
    input.geometry.periodicGeometry !== false ||
    input.geometry.forceAxis !== "z"
  ) {
    fail(
      "geometry_authority_invalid",
      "This lane is restricted to compact finite-geometry z-force sweeps.",
    );
  }
  validateFileBinding(
    input.geometry.geometryFile,
    "input.geometry.geometryFile",
  );
  validateFileBinding(
    input.geometry.transformationFile,
    "input.geometry.transformationFile",
  );
  validateSweep(input);
  if (
    !Array.isArray(input.geometry.dependencies) ||
    input.geometry.dependencies.length < 4 ||
    input.geometry.dependencies.length > MAX_INPUT_FILES
  ) {
    fail("dependency_inventory_invalid", "Dependency inventory is incomplete.");
  }
  const dependencyPaths = new Set<string>();
  let previousPath = "";
  for (const [index, dependency] of input.geometry.dependencies.entries()) {
    exactKeys(
      dependency,
      ["kind", "relativePath", "sha256", "sizeBytes"],
      `input.geometry.dependencies[${index}]`,
    );
    validateFileBinding(
      {
        relativePath: dependency.relativePath,
        sha256: dependency.sha256,
        sizeBytes: dependency.sizeBytes,
      },
      `input.geometry.dependencies[${index}]`,
    );
    if (
      !dependencyKinds.has(dependency.kind) ||
      (index > 0 && compareUtf8(previousPath, dependency.relativePath) >= 0) ||
      dependencyPaths.has(dependency.relativePath)
    ) {
      fail(
        "dependency_inventory_invalid",
        "Dependencies must be unique, sorted, and use governed kinds.",
      );
    }
    previousPath = dependency.relativePath;
    dependencyPaths.add(dependency.relativePath);
  }
  const requiredKinds: Nhm2ScuffEmDependencyKindV1[] = [
    "material_measurement_receipt",
    "material_model",
    "mesh",
    "mesh_generation_receipt",
  ];
  if (
    requiredKinds.some(
      (kind) =>
        !input.geometry.dependencies.some((entry) => entry.kind === kind),
    ) ||
    dependencyPaths.has(input.geometry.geometryFile.relativePath) ||
    dependencyPaths.has(input.geometry.transformationFile.relativePath) ||
    input.geometry.geometryFile.relativePath ===
      input.geometry.transformationFile.relativePath
  ) {
    fail(
      "dependency_inventory_invalid",
      "Mesh, material-model, measurement, and mesh-generation receipts are required and paths must be distinct.",
    );
  }
  const transformBytes = Buffer.from(
    serializeNhm2ScuffEmForceSweepTransformations(input),
    "utf8",
  );
  if (
    input.geometry.transformationFile.sha256 !== sha256(transformBytes) ||
    input.geometry.transformationFile.sizeBytes !== transformBytes.byteLength
  ) {
    fail(
      "transformation_binding_invalid",
      "Transformation bytes do not match the frozen symmetric gap sweep.",
    );
  }
  exactKeys(
    input.thermodynamics,
    ["ensemble", "summation", "temperatureKelvin"],
    "input.thermodynamics",
  );
  const firstPhysicalMatsubaraFrequency =
    2 *
    Math.PI *
    NHM2_SCUFF_EM_MATSUBARA_PRINT_POLICY.boltzmannKInternalPerKelvin *
    input.thermodynamics.temperatureKelvin;
  const distinctPrintedFrequencyMargin =
    scientificPrintedHalfUlp(
      NHM2_SCUFF_EM_MATSUBARA_PRINT_POLICY.ximinRawScuff,
    ) + scientificPrintedHalfUlp(firstPhysicalMatsubaraFrequency);
  if (
    input.thermodynamics.ensemble !== "thermal_equilibrium" ||
    input.thermodynamics.summation !== "matsubara" ||
    !Number.isFinite(input.thermodynamics.temperatureKelvin) ||
    input.thermodynamics.temperatureKelvin <= 0 ||
    input.thermodynamics.temperatureKelvin > 10_000 ||
    !Number.isFinite(firstPhysicalMatsubaraFrequency) ||
    firstPhysicalMatsubaraFrequency <=
      NHM2_SCUFF_EM_MATSUBARA_PRINT_POLICY.ximinRawScuff +
        distinctPrintedFrequencyMargin
  ) {
    fail(
      "thermodynamic_binding_invalid",
      "Equilibrium temperature is invalid or does not keep the printed xi_1 Matsubara term distinct above the pinned XIMIN xi_0 proxy.",
    );
  }
  exactKeys(
    input.numerics,
    ["absoluteTolerance", "relativeTolerance"],
    "input.numerics",
  );
  if (
    !Number.isFinite(input.numerics.absoluteTolerance) ||
    input.numerics.absoluteTolerance < 0 ||
    !Number.isFinite(input.numerics.relativeTolerance) ||
    input.numerics.relativeTolerance <= 0 ||
    input.numerics.relativeTolerance > 0.1
  ) {
    fail("numeric_policy_invalid", "SCUFF-EM tolerance policy is invalid.");
  }
};

const validateLedgerCommitment = (
  ledger: Nhm2ExternalNumericalKernelSealedLedgerV1,
  kind: "input" | "toolchain",
): void => {
  if (
    ledger.kind !== kind ||
    !path.isAbsolute(ledger.rootPath) ||
    ledger.entries.length === 0 ||
    ledger.entries.length > MAX_INPUT_FILES ||
    ledger.entries.some(
      (entry, index) =>
        !portableRelativePath(entry.relativePath) ||
        !SHA256.test(entry.sha256) ||
        !Number.isSafeInteger(entry.sizeBytes) ||
        entry.sizeBytes < 0 ||
        entry.sizeBytes > MAX_INPUT_FILE_BYTES ||
        (index > 0 &&
          compareUtf8(
            ledger.entries[index - 1].relativePath,
            entry.relativePath,
          ) >= 0),
    ) ||
    ledger.entries.reduce((total, entry) => total + entry.sizeBytes, 0) >
      MAX_INPUT_AGGREGATE_BYTES ||
    ledger.ledgerSha256 !==
      computeNhm2ExternalNumericalKernelLedgerSha256({
        kind,
        entries: ledger.entries,
      })
  ) {
    fail("sealed_ledger_invalid", `${kind} ledger is not an exact commitment.`);
  }
};

const validateOfficialCriticalSources = (
  ledger: Nhm2ExternalNumericalKernelSealedLedgerV1,
): void => {
  for (const binding of NHM2_SCUFF_EM_CRITICAL_SOURCE_BINDINGS) {
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
        "official_scuff_source_binding_invalid",
        `Toolchain must bind the pinned ${binding.suffix} bytes.`,
      );
    }
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

const expectedArguments = (
  input: Nhm2ScuffEmForceSweepInputV1,
): Nhm2ExternalNumericalKernelRunSpecV1["arguments"] => [
  { kind: "literal", value: "--Geometry" },
  {
    kind: "input_path",
    relativePath: input.geometry.geometryFile.relativePath,
  },
  { kind: "literal", value: "--TransFile" },
  {
    kind: "input_path",
    relativePath: input.geometry.transformationFile.relativePath,
  },
  { kind: "literal", value: "--Temperature" },
  {
    kind: "literal",
    value: scientificNumber(input.thermodynamics.temperatureKelvin),
  },
  { kind: "literal", value: "--Energy" },
  { kind: "literal", value: "--ZForce" },
  { kind: "literal", value: "--FileBase" },
  { kind: "literal", value: "scuff-run" },
  { kind: "literal", value: "--AbsTol" },
  {
    kind: "literal",
    value: scientificNumber(input.numerics.absoluteTolerance),
  },
  { kind: "literal", value: "--RelTol" },
  {
    kind: "literal",
    value: scientificNumber(input.numerics.relativeTolerance),
  },
];

const expectedOutputs: Nhm2ExternalNumericalKernelRunSpecV1["expectedOutputs"] =
  [
    {
      role: "casimir_integrated_force_sweep",
      relativePath: "scuff-run.out",
      maxBytes: OUT_MAX_BYTES,
    },
    {
      role: "casimir_matsubara_spectrum",
      relativePath: "scuff-run.byXi",
      maxBytes: BY_XI_MAX_BYTES,
    },
    {
      role: "casimir_solver_log",
      relativePath: "scuff-cas3D.log",
      maxBytes: LOG_MAX_BYTES,
    },
  ];

const governedEnvironment = (inputRoot: string): Record<string, string> => ({
  LC_ALL: "C",
  MKL_NUM_THREADS: "1",
  OMP_NUM_THREADS: "1",
  OPENBLAS_NUM_THREADS: "1",
  SCUFF_MATPROP_PATH: path.resolve(inputRoot),
  SCUFF_MESH_PATH: path.resolve(inputRoot),
  TZ: "UTC",
});

const blockers = [
  "external_execution_observation_required",
  "source_to_binary_reproducible_build_receipt_required",
  "independent_scientific_content_replay_required",
  "local_maxwell_stress_traction_field_unresolved",
  "mesh_refinement_convergence_unresolved",
  "measured_dielectric_correspondence_replay_required",
  "scuff_output_si_conversion_unresolved",
  "force_gradient_uncertainty_replay_required",
] as const;

const claimBoundary: Nhm2ScuffEmForceSweepExternalPlanV1["claimBoundary"] = {
  officialScuffEmSourceBytesPinned: true,
  equilibriumFiniteTemperatureMatsubaraRequested: true,
  finiteGeometryIntegratedForceSweepRequested: true,
  rawScuffIntegratedEnergyAndZForceOutputAllowedAfterReplay: true,
  siUnitConversionEstablished: false,
  forceGradientEstablished: false,
  localMaxwellStressTractionFieldEstablished: false,
  nonEquilibriumTemperatureCoverageEstablished: false,
  meshConvergenceEstablished: false,
  materialMeasurementCorrespondenceEstablished: false,
  theoryClosureClaimAllowed: false,
  empiricalValidationEstablished: false,
  physicalViabilityClaimAllowed: false,
  transportClaimAllowed: false,
  propulsionClaimAllowed: false,
  routeEtaClaimAllowed: false,
  speedAuthorityClaimAllowed: false,
};

const normalizeAbsoluteForComparison = (value: string): string => {
  let normalized = path.normalize(value);
  if (process.platform === "win32") normalized = normalized.toLowerCase();
  return normalized;
};

export function validateNhm2ScuffEmForceSweepExternalPlan(
  plan: Nhm2ScuffEmForceSweepExternalPlanV1,
): void {
  validateInput(plan.input, true);
  if (
    plan.artifactId !== "nhm2.scuff_em_force_sweep_external_plan" ||
    plan.contractVersion !== NHM2_SCUFF_EM_FORCE_SWEEP_PLAN_VERSION ||
    plan.status !== "sealed_external_partial_execution_plan" ||
    !portableRelativePath(plan.inputManifestRelativePath)
  ) {
    fail("scuff_plan_identity_invalid", "SCUFF-EM plan identity is invalid.");
  }
  const spec = plan.runSpec;
  validateLedgerCommitment(spec.ledgers.toolchain, "toolchain");
  validateLedgerCommitment(spec.ledgers.input, "input");
  validateOfficialCriticalSources(spec.ledgers.toolchain);
  const legacyCandidates = [
    spec.executable.absolutePath,
    spec.ledgers.input.rootPath,
    spec.ledgers.toolchain.rootPath,
    ...spec.ledgers.input.entries.map((entry) => entry.relativePath),
    ...spec.ledgers.toolchain.entries.map((entry) => entry.relativePath),
    ...spec.arguments.flatMap((argument) =>
      "value" in argument
        ? [argument.value]
        : "relativePath" in argument
          ? [argument.relativePath]
          : [],
    ),
  ];
  if (legacyCandidates.some(legacySimulatedScuffReference)) {
    fail(
      "legacy_simulated_scuff_forbidden",
      "The legacy simulated SCUFF service is forbidden in this lane.",
    );
  }
  if (
    spec.lane !== "casimir_finite_temperature_integrated_force_sweep" ||
    spec.solver.family !== "scuff_em" ||
    spec.solver.implementationId !==
      "scuff-em.scuff-cas3D.integrated_force_sweep" ||
    spec.solver.version !== NHM2_SCUFF_EM_VERSION ||
    spec.solver.producerMode !== "external_binary"
  ) {
    fail("scuff_plan_solver_invalid", "SCUFF-EM solver binding is invalid.");
  }
  const expectedInputBindings = [
    {
      ...plan.input.geometry.geometryFile,
    },
    {
      ...plan.input.geometry.transformationFile,
    },
    ...plan.input.geometry.dependencies.map(
      ({ relativePath, sha256: digest, sizeBytes }) => ({
        relativePath,
        sha256: digest,
        sizeBytes,
      }),
    ),
    {
      relativePath: plan.inputManifestRelativePath,
      sha256: sha256(serializeNhm2ScuffEmForceSweepInput(plan.input)),
      sizeBytes: Buffer.byteLength(
        serializeNhm2ScuffEmForceSweepInput(plan.input),
        "utf8",
      ),
    },
  ].sort((left, right) => compareUtf8(left.relativePath, right.relativePath));
  if (
    JSON.stringify(spec.ledgers.input.entries) !==
    JSON.stringify(expectedInputBindings)
  ) {
    fail(
      "input_ledger_binding_invalid",
      "Input ledger does not exactly bind the manifest, geometry, transforms, meshes, and receipts.",
    );
  }
  if (!path.isAbsolute(spec.executable.absolutePath)) {
    fail(
      "scuff_executable_binding_invalid",
      "SCUFF executable path is not absolute.",
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
    executableRelativePath.startsWith("../") ||
    path.posix.isAbsolute(executableRelativePath) ||
    executableEntry?.sha256 !== spec.executable.sha256 ||
    executableEntry.sizeBytes !== spec.executable.sizeBytes ||
    !/^(?:.*\/)?scuff-cas3D(?:\.exe)?$/i.test(executableRelativePath)
  ) {
    fail(
      "scuff_executable_binding_invalid",
      "SCUFF executable is not exactly bound inside the sealed toolchain.",
    );
  }
  const environment = governedEnvironment(spec.ledgers.input.rootPath);
  if (
    !path.isAbsolute(spec.outputRoot) ||
    normalizeAbsoluteForComparison(spec.outputRoot) ===
      normalizeAbsoluteForComparison(spec.ledgers.input.rootPath) ||
    JSON.stringify(spec.arguments) !==
      JSON.stringify(expectedArguments(plan.input)) ||
    JSON.stringify(spec.expectedOutputs) !== JSON.stringify(expectedOutputs) ||
    JSON.stringify(spec.environmentAllowlist) !==
      JSON.stringify(Object.keys(environment).sort(compareUtf8)) ||
    JSON.stringify(spec.environment) !== JSON.stringify(environment) ||
    spec.timeoutMs !== 7 * 24 * 60 * 60 * 1_000 ||
    spec.maxCapturedOutputBytes !== 4 * 1024 * 1024 ||
    spec.maxLedgerFileBytes !== MAX_INPUT_FILE_BYTES ||
    spec.maxLedgerAggregateBytes !== MAX_INPUT_AGGREGATE_BYTES ||
    spec.maxOutputAggregateBytes !== OUTPUT_AGGREGATE_MAX_BYTES
  ) {
    fail(
      "scuff_run_spec_invalid",
      "SCUFF run spec differs from the governed deterministic invocation.",
    );
  }
  if (
    JSON.stringify(plan.blockers) !== JSON.stringify(blockers) ||
    JSON.stringify(plan.claimBoundary) !== JSON.stringify(claimBoundary)
  ) {
    fail(
      "scuff_claim_boundary_invalid",
      "SCUFF plan weakened its blockers or claim boundary.",
    );
  }
}

export function buildNhm2ScuffEmForceSweepExternalPlan(
  bindings: BuildNhm2ScuffEmForceSweepExternalPlanInput,
): Nhm2ScuffEmForceSweepExternalPlanV1 {
  const environment = governedEnvironment(bindings.inputLedger.rootPath);
  const runSpec: Nhm2ExternalNumericalKernelRunSpecV1 = {
    lane: "casimir_finite_temperature_integrated_force_sweep",
    solver: {
      family: "scuff_em",
      implementationId: "scuff-em.scuff-cas3D.integrated_force_sweep",
      version: NHM2_SCUFF_EM_VERSION,
      producerMode: "external_binary",
    },
    executable: { ...bindings.executable },
    ledgers: {
      toolchain: bindings.toolchainLedger,
      input: bindings.inputLedger,
    },
    outputRoot: bindings.outputRoot,
    arguments: expectedArguments(bindings.input),
    environmentAllowlist: Object.keys(environment).sort(compareUtf8),
    environment,
    expectedOutputs: expectedOutputs.map((entry) => ({ ...entry })),
    timeoutMs: 7 * 24 * 60 * 60 * 1_000,
    maxCapturedOutputBytes: 4 * 1024 * 1024,
    maxLedgerFileBytes: MAX_INPUT_FILE_BYTES,
    maxLedgerAggregateBytes: MAX_INPUT_AGGREGATE_BYTES,
    maxOutputAggregateBytes: OUTPUT_AGGREGATE_MAX_BYTES,
  };
  const plan: Nhm2ScuffEmForceSweepExternalPlanV1 = {
    artifactId: "nhm2.scuff_em_force_sweep_external_plan",
    contractVersion: NHM2_SCUFF_EM_FORCE_SWEEP_PLAN_VERSION,
    status: "sealed_external_partial_execution_plan",
    inputManifestRelativePath: bindings.inputManifestRelativePath,
    input: bindings.input,
    runSpec,
    blockers,
    claimBoundary: { ...claimBoundary },
  };
  validateNhm2ScuffEmForceSweepExternalPlan(plan);
  return plan;
}
