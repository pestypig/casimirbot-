import { createHash } from "node:crypto";
import path from "node:path";

import {
  computeNhm2ExternalNumericalKernelLedgerSha256,
  NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES,
  type Nhm2ExternalNumericalKernelExecutableBindingV1,
  type Nhm2ExternalNumericalKernelSealedLedgerV1,
} from "./nhm2-external-numerical-kernel-executor";

export const NHM2_CALCULIX_MECHANICS_INPUT_VERSION =
  "nhm2_calculix_mechanics_support_control_input/v1" as const;
export const NHM2_CALCULIX_MECHANICS_PLAN_VERSION =
  "nhm2_calculix_mechanics_support_control_external_plan/v1" as const;
export const NHM2_CALCULIX_VERSION = "2.23" as const;
export const NHM2_CALCULIX_REPOSITORY =
  "https://github.com/Dhondtguido/CalculiX" as const;
export const NHM2_CALCULIX_RELEASE_ARCHIVE_URI =
  "https://www.dhondt.de/ccx_2.23.src.tar.bz2" as const;
export const NHM2_CALCULIX_RELEASE_ARCHIVE_SHA256 =
  "9c88385c10fb04f5dc6c4e98027a51bebdd8aee3920e05190d6c1dd08357d6e7" as const;
export const NHM2_CALCULIX_RELEASE_ARCHIVE_SIZE_BYTES = 1_551_289 as const;
export const NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_URI =
  "https://www.dhondt.de/ccx_2.23.tar.bz2" as const;
export const NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_SHA256 =
  "35d426fed5eb164fbbaaafa20819d13d22e30bc2b9bc9c6c4ed957e9468355dd" as const;
export const NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_SIZE_BYTES =
  2_502_788 as const;
export const NHM2_CALCULIX_OFFICIAL_EXECUTABLE_SHA256 =
  "31be21fc2f0902bd9a05acc2651dbac6dc2a2573dabbf235e39a38cb6f458862" as const;
export const NHM2_CALCULIX_OFFICIAL_EXECUTABLE_SIZE_BYTES = 6_959_696 as const;

/**
 * Source-byte pins are taken from the official 2.23 source archive. The
 * upstream Git repository does not publish a 2.23 tag, and its development
 * branch uses DEVELOPMENT banners, so the release archive is the governing
 * source authority rather than an inferred branch snapshot.
 */
export const NHM2_CALCULIX_2_23_CRITICAL_SOURCE_BINDINGS = [
  {
    suffix: "CalculiX/ccx_2.23/src/ccx_2.23.c",
    sha256: "5b3fffaa55699b61f23c86ddb6bbf016b2411e6beb9a002231338bdd041fd144",
    sizeBytes: 64_487,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/openfile.f",
    sha256: "e5e8215d1e400aa74bfb6e63e335fac69540a7de9a3388ac36ef2d69f33ad860",
    sizeBytes: 4_202,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/readinput.c",
    sha256: "22d450400b57694e5b038667d4d19243883c661e9dcd979f9f4d44de4ee8a9c3",
    sizeBytes: 16_111,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/nonlingeo.c",
    sha256: "8684bb6d7fa7097c0a854db5a45eb9e2d11adfde574e688184ecbbbad56ff83f",
    sizeBytes: 139_093,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/statics.f",
    sha256: "d5add12845e7dc6e7a19043fa6114012b9f36ed0723590308d60f4b09eee4599",
    sizeBytes: 8_557,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/dynamics.f",
    sha256: "d861c936c204853e84e7647b4164e78556c11b6eb0a532b623d4a75622f53e5e",
    sizeBytes: 9_324,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/contactpairs.f",
    sha256: "e2b7e8176adc70f02f5140308a0c6a591fc9f7f620026867708e6345a9d9c488",
    sizeBytes: 9_939,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/amplitudes.f",
    sha256: "3302aa2195bb45bbe42b92518ec560e51111a5828fd7af26ca23a25aad87aa36",
    sizeBytes: 5_450,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/materialdata_me.f",
    sha256: "5635e36037c74296aa5b0196c2d02d936f4e1ed8b0579e764a7a3c01ab899ca6",
    sizeBytes: 14_823,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/frd.c",
    sha256: "6439bca2ae53c813ab6887c3c560dd15db5947fd8cf9b9f01ada5753d5ed9915",
    sizeBytes: 87_512,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/writesta.f",
    sha256: "6ea931a048cf62af9f75b0e92dbbdc9b630791858470703d9bf73a57d9c5b35e",
    sizeBytes: 1_569,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/writecvg.f",
    sha256: "cffd7f25dbae489807f7d06df27b2dc16e8de10a4086a93f08b4be1e7fd44cd4",
    sizeBytes: 2_520,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/Makefile",
    sha256: "ad72fbb724836e97633062b8e2f2ad6e4b178b2747b9e7516e840c6038129c63",
    sizeBytes: 651,
  },
  {
    suffix: "CalculiX/ccx_2.23/src/README.INSTALL",
    sha256: "c974f617cf8f57e3291c0531380a43f1134d48c5c641fb2d6d870ee6089e5835",
    sizeBytes: 17_998,
  },
] as const;

export type Nhm2CalculixInputFileBindingV1 = {
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2CalculixModelDependencyKindV1 =
  | "cad_geometry_receipt"
  | "contact_model"
  | "control_actuation_model"
  | "deck_include_closure_receipt"
  | "deck_semantic_audit_receipt"
  | "fatigue_model"
  | "fem_include"
  | "material_coupon_receipt"
  | "material_model"
  | "mesh"
  | "mesh_generation_receipt"
  | "pull_in_criterion"
  | "scuff_load_transfer_receipt"
  | "scuff_nodal_load_include"
  | "support_model"
  | "thermal_model";

export type Nhm2CalculixModelDependencyBindingV1 =
  Nhm2CalculixInputFileBindingV1 & {
    kind: Nhm2CalculixModelDependencyKindV1;
  };

export type Nhm2CalculixStepIdV1 =
  | "thermal_preload"
  | "support_static_ramp"
  | "control_actuation_transient"
  | "pull_in_continuation";

export type Nhm2CalculixProcedureV1 =
  "coupled_temperature_displacement" | "static" | "dynamic_implicit";

export type Nhm2CalculixNonlinearStepV1 = {
  stepId: Nhm2CalculixStepIdV1;
  procedure: Nhm2CalculixProcedureV1;
  nlgeom: true;
  automaticIncrementation: true;
  initialIncrementSeconds: number;
  totalTimeSeconds: number;
  minimumIncrementSeconds: number;
  maximumIncrementSeconds: number;
  integrationAlpha: number | null;
};

export type Nhm2CalculixMechanicsSupportControlInputV1 = {
  artifactId: "nhm2.calculix_mechanics_support_control_input";
  contractVersion: typeof NHM2_CALCULIX_MECHANICS_INPUT_VERSION;
  package: {
    name: "CalculiX CrunchiX";
    version: typeof NHM2_CALCULIX_VERSION;
    repository: typeof NHM2_CALCULIX_REPOSITORY;
    releaseArchiveUri: typeof NHM2_CALCULIX_RELEASE_ARCHIVE_URI;
    releaseArchiveSha256: typeof NHM2_CALCULIX_RELEASE_ARCHIVE_SHA256;
    releaseArchiveSizeBytes: typeof NHM2_CALCULIX_RELEASE_ARCHIVE_SIZE_BYTES;
    officialExecutableArchiveUri: typeof NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_URI;
    officialExecutableArchiveSha256: typeof NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_SHA256;
    officialExecutableArchiveSizeBytes: typeof NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_SIZE_BYTES;
    officialExecutableSha256: typeof NHM2_CALCULIX_OFFICIAL_EXECUTABLE_SHA256;
    officialExecutableSizeBytes: typeof NHM2_CALCULIX_OFFICIAL_EXECUTABLE_SIZE_BYTES;
    executablePlatform: "linux";
    executableArchitecture: "x86_64";
    officialGitTag: null;
    sourceAuthority: "official_release_archive";
    executableName: "ccx_2.23";
    harnessOnly: boolean;
  };
  units: {
    length: "m";
    force: "N";
    time: "s";
    temperature: "K";
    mass: "kg";
    stress: "Pa";
    pressure: "Pa";
    energy: "J";
    heatFlux: "W/m^2";
  };
  model: {
    authority: "full_cad_fem_deck_receipt_bound";
    jobName: "nhm2_mechanics_support_control";
    deckEncoding: "utf8_no_bom_lf";
    includeResolution: "ledger_relative_only";
    mainDeck: Nhm2CalculixInputFileBindingV1;
    dependencies: Nhm2CalculixModelDependencyBindingV1[];
  };
  loadTransfer: {
    sourceSolver: "scuff-em";
    sourceLane: "casimir_finite_temperature_maxwell_stress";
    sourceOutputRole: "casimir_stress_traction";
    sourceObservationSha256: string;
    sourceOutputSha256: string;
    loadTransferReceiptPath: string;
    nodalLoadIncludePath: string;
    tractionUnits: "Pa";
    nodalForceUnits: "N";
    coordinateFrameBinding: "same_cad_frame";
    conservativeResultantRelativeTolerance: number;
    conservativeMomentRelativeTolerance: number;
  };
  supportControl: {
    supportModelPath: string;
    controlActuationModelPath: string;
    supportFraction: number;
    minimumStructuralSupportFraction: number;
    maximumSupportFractionForRetention: number;
    supportRetentionOverlapRatio: number;
    supportSafetyFactor: number;
    actuationMode: "prescribed_nodal_force_history";
    actuationChannelCount: number;
    activeChannelCount: number;
    actuationPeriodSeconds: number;
    burstDuty: number;
    cycleDuty: number;
    peakCommandForceNewtons: number;
  };
  thermal: {
    thermalModelPath: string;
    analysisMode: "transient_coupled_temperature_displacement";
    initialTemperatureKelvin: number;
    ambientTemperatureKelvin: number;
    minimumAllowedTemperatureKelvin: number;
    maximumAllowedTemperatureKelvin: number;
    convectionCoefficientWattsPerSquareMeterKelvin: number;
    emissivity: number;
    cycleCount: number;
  };
  fatigue: {
    fatigueModelPath: string;
    materialCouponReceiptPath: string;
    method: "strain_life_coffin_manson";
    meanStressCorrection: "morrow";
    designCycles: number;
    minimumLifeFactor: number;
    maximumMinerDamage: number;
  };
  contact: {
    contactModelPath: string;
    formulation: "surface_to_surface_penalty";
    sliding: "finite";
    normalBehavior: "hard";
    frictionCoefficient: number;
    penaltyScale: number;
    maximumPenetrationMeters: number;
  };
  pullIn: {
    criterionPath: string;
    criterion: "minimum_gap_and_positive_tangent_stiffness";
    nominalGapMeters: number;
    minimumAllowedGapMeters: number;
    maximumClosingDisplacementMeters: number;
    minimumTangentStiffnessNewtonsPerMeter: number;
    requiredLoadFactor: number;
  };
  nonlinearTimeStepPolicy: {
    linearSolver: "spooles_serial";
    deterministicThreadCount: 1;
    maximumEquilibriumIterations: 100;
    deckSemanticAuditReceiptPath: string;
    steps: [
      Nhm2CalculixNonlinearStepV1,
      Nhm2CalculixNonlinearStepV1,
      Nhm2CalculixNonlinearStepV1,
      Nhm2CalculixNonlinearStepV1,
    ];
  };
  requestedOutputs: {
    frdEncoding: "ascii";
    outputEveryIncrement: true;
    fieldVariables: readonly ["U", "S", "E", "PEEQ", "NT", "RF"];
    printVariables: readonly ["RF", "U"];
    convergenceFiles: readonly ["sta", "cvg"];
  };
};

export type Nhm2CalculixToolchainEvidenceV1 = {
  sourceArchiveRelativePath: string;
  executableArchiveRelativePath: string;
  buildReceiptRelativePath: string;
  compilerLockRelativePath: string;
  versionObservationRelativePath: string;
};

export type Nhm2CalculixMechanicsSupportControlExternalPlanV1 = {
  artifactId: "nhm2.calculix_mechanics_support_control_external_plan";
  contractVersion: typeof NHM2_CALCULIX_MECHANICS_PLAN_VERSION;
  status: "sealed_external_partial_plan_execution_blocked";
  inputManifestRelativePath: string;
  input: Nhm2CalculixMechanicsSupportControlInputV1;
  lane: "mechanics_nonlinear_support_control";
  solver: {
    family: "calculix";
    implementationId: "calculix.ccx_2_23.stock";
    version: typeof NHM2_CALCULIX_VERSION;
    producerMode: "external_binary";
  };
  executable: Nhm2ExternalNumericalKernelExecutableBindingV1;
  ledgers: {
    toolchain: Nhm2ExternalNumericalKernelSealedLedgerV1;
    input: Nhm2ExternalNumericalKernelSealedLedgerV1;
  };
  toolchainEvidence: Nhm2CalculixToolchainEvidenceV1;
  outputRoot: string;
  deterministicInvocation: {
    command: string;
    arguments: readonly ["-i", string];
    workingDirectory: string;
    environmentAllowlist: string[];
    environment: Record<string, string>;
    jobPrefixAbsolutePath: string;
    inputDeckAbsolutePath: string;
    stockOutputRoot: "input_ledger_root_beside_job_prefix";
  };
  freshOutputInventory: {
    admissionRequirement: "output_root_must_not_exist";
    exactFinalInventoryKnown: false;
    stockOutputCandidatesRelativeToInputRoot: readonly [
      string,
      string,
      string,
      string,
    ];
    stockAuxiliaryOutputsMayExist: true;
    requiredGovernedRoles: readonly [
      "mechanics_field_results",
      "mechanics_nonlinear_history",
      "mechanics_solver_report",
    ];
    stockFilesAssignedGovernedRoles: false;
  };
  executorRunSpec: null;
  blockers: readonly [
    "external_execution_observation_required",
    "independent_scientific_content_replay_required",
    "stock_ccx_job_prefix_couples_input_and_output_roots",
    "stock_ccx_exact_three_role_output_contract_unavailable",
    "stock_ccx_auxiliary_output_inventory_unbounded_for_executor",
    "trusted_ccx_staging_and_output_adapter_required",
    "stock_ccx_fatigue_life_postprocessor_absent",
    "scuff_local_traction_to_fem_load_transfer_replay_required",
    "mesh_contact_thermal_fatigue_convergence_unresolved",
    "pull_in_tangent_stability_replay_required",
    "material_coupon_correspondence_replay_required",
    "filesystem_link_and_freshness_observation_required",
  ];
  claimBoundary: {
    officialCalculixReleaseBytesPinned: true;
    completeInputLedgerDeclared: true;
    executableAndBuildEvidenceLedgerBound: true;
    stockExecutableDirectlyAdmitted: false;
    externalExecutionObserved: false;
    mechanicsFieldResultsEstablished: false;
    nonlinearHistoryEstablished: false;
    fatigueLifeEstablished: false;
    pullInMarginEstablished: false;
    supportRetentionOverlapEstablished: false;
    thermalMarginEstablished: false;
    loadTransferEstablished: false;
    theoryClosureClaimAllowed: false;
    empiricalValidationEstablished: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2CalculixMechanicsSupportControlExternalPlanInput = {
  input: Nhm2CalculixMechanicsSupportControlInputV1;
  inputManifestRelativePath: string;
  executable: Nhm2ExternalNumericalKernelExecutableBindingV1;
  toolchainLedger: Nhm2ExternalNumericalKernelSealedLedgerV1;
  inputLedger: Nhm2ExternalNumericalKernelSealedLedgerV1;
  toolchainEvidence: Nhm2CalculixToolchainEvidenceV1;
  outputRoot: string;
};

export class Nhm2CalculixMechanicsPlanError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2CalculixMechanicsPlanError";
    this.code = code;
  }
}

const SHA256 = /^[a-f0-9]{64}$/;
const JOB_NAME = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$/;
const MAX_LEDGER_ENTRIES = 100_000;
const MAX_INPUT_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_INPUT_AGGREGATE_BYTES = 8 * 1024 * 1024 * 1024;
const MAX_JOB_PREFIX_CHARACTERS = 127;

const fail = (code: string, message: string): never => {
  throw new Nhm2CalculixMechanicsPlanError(code, message);
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

const normalizeAbsoluteForComparison = (value: string): string => {
  let normalized = path.normalize(value);
  if (process.platform === "win32") normalized = normalized.toLowerCase();
  return normalized;
};

const isContainedPath = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
};

const pathsOverlap = (left: string, right: string): boolean => {
  const normalizedLeft = normalizeAbsoluteForComparison(left);
  const normalizedRight = normalizeAbsoluteForComparison(right);
  return (
    normalizedLeft === normalizedRight ||
    isContainedPath(left, right) ||
    isContainedPath(right, left)
  );
};

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

export const serializeNhm2CalculixMechanicsSupportControlInput = (
  input: Nhm2CalculixMechanicsSupportControlInputV1,
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

const validateFileBinding = (
  binding: Nhm2CalculixInputFileBindingV1,
  label: string,
): void => {
  exactKeys(binding, ["relativePath", "sha256", "sizeBytes"], label);
  if (
    typeof binding.relativePath !== "string" ||
    !portableRelativePath(binding.relativePath) ||
    typeof binding.sha256 !== "string" ||
    !SHA256.test(binding.sha256) ||
    !Number.isSafeInteger(binding.sizeBytes) ||
    binding.sizeBytes <= 0 ||
    binding.sizeBytes > MAX_INPUT_FILE_BYTES
  ) {
    fail("input_file_binding_invalid", `${label} is invalid.`);
  }
};

const requiredDependencyKinds: readonly Nhm2CalculixModelDependencyKindV1[] = [
  "cad_geometry_receipt",
  "contact_model",
  "control_actuation_model",
  "deck_include_closure_receipt",
  "deck_semantic_audit_receipt",
  "fatigue_model",
  "fem_include",
  "material_coupon_receipt",
  "material_model",
  "mesh",
  "mesh_generation_receipt",
  "pull_in_criterion",
  "scuff_load_transfer_receipt",
  "scuff_nodal_load_include",
  "support_model",
  "thermal_model",
];

const dependencyKindSet = new Set(requiredDependencyKinds);

const exactOneDependencyKinds = new Set<Nhm2CalculixModelDependencyKindV1>([
  "cad_geometry_receipt",
  "contact_model",
  "control_actuation_model",
  "deck_include_closure_receipt",
  "deck_semantic_audit_receipt",
  "fatigue_model",
  "mesh_generation_receipt",
  "pull_in_criterion",
  "scuff_load_transfer_receipt",
  "scuff_nodal_load_include",
  "support_model",
  "thermal_model",
]);

const validateModel = (
  input: Nhm2CalculixMechanicsSupportControlInputV1,
): void => {
  exactKeys(
    input.model,
    [
      "authority",
      "deckEncoding",
      "dependencies",
      "includeResolution",
      "jobName",
      "mainDeck",
    ],
    "input.model",
  );
  if (
    input.model.authority !== "full_cad_fem_deck_receipt_bound" ||
    input.model.deckEncoding !== "utf8_no_bom_lf" ||
    input.model.includeResolution !== "ledger_relative_only" ||
    input.model.jobName !== "nhm2_mechanics_support_control" ||
    !JOB_NAME.test(input.model.jobName)
  ) {
    fail("model_policy_invalid", "CAD/FEM model policy is invalid.");
  }
  validateFileBinding(input.model.mainDeck, "input.model.mainDeck");
  const expectedDeckSuffix = `/${input.model.jobName}.inp`;
  if (
    input.model.mainDeck.relativePath !== `${input.model.jobName}.inp` &&
    !input.model.mainDeck.relativePath.endsWith(expectedDeckSuffix)
  ) {
    fail(
      "main_deck_binding_invalid",
      "Main deck basename must be the governed job name with .inp extension.",
    );
  }
  if (
    !Array.isArray(input.model.dependencies) ||
    input.model.dependencies.length < requiredDependencyKinds.length ||
    input.model.dependencies.length > MAX_LEDGER_ENTRIES
  ) {
    fail(
      "dependency_inventory_invalid",
      "Model dependency inventory is incomplete.",
    );
  }
  let previousPath = "";
  const pathSet = new Set<string>([input.model.mainDeck.relativePath]);
  for (const [index, dependency] of input.model.dependencies.entries()) {
    exactKeys(
      dependency,
      ["kind", "relativePath", "sha256", "sizeBytes"],
      `input.model.dependencies[${index}]`,
    );
    validateFileBinding(
      {
        relativePath: dependency.relativePath,
        sha256: dependency.sha256,
        sizeBytes: dependency.sizeBytes,
      },
      `input.model.dependencies[${index}]`,
    );
    if (
      !dependencyKindSet.has(dependency.kind) ||
      (index > 0 && compareUtf8(previousPath, dependency.relativePath) >= 0) ||
      pathSet.has(dependency.relativePath)
    ) {
      fail(
        "dependency_inventory_invalid",
        "Dependencies must be unique, sorted, and use governed kinds.",
      );
    }
    previousPath = dependency.relativePath;
    pathSet.add(dependency.relativePath);
  }
  for (const kind of requiredDependencyKinds) {
    const count = input.model.dependencies.filter(
      (dependency) => dependency.kind === kind,
    ).length;
    if (count === 0 || (exactOneDependencyKinds.has(kind) && count !== 1)) {
      fail(
        "dependency_inventory_invalid",
        `Dependency inventory has an invalid ${kind} count.`,
      );
    }
  }
};

const dependencyAtPath = (
  input: Nhm2CalculixMechanicsSupportControlInputV1,
  relativePath: string,
  kind: Nhm2CalculixModelDependencyKindV1,
  label: string,
): void => {
  if (
    !portableRelativePath(relativePath) ||
    input.model.dependencies.filter(
      (dependency) =>
        dependency.relativePath === relativePath && dependency.kind === kind,
    ).length !== 1
  ) {
    fail("dependency_reference_invalid", `${label} is not bound to ${kind}.`);
  }
};

const finiteInRange = (
  value: number,
  minimum: number,
  maximum: number,
): boolean => Number.isFinite(value) && value >= minimum && value <= maximum;

const validatePhysicsPolicies = (
  input: Nhm2CalculixMechanicsSupportControlInputV1,
): void => {
  exactKeys(
    input.loadTransfer,
    [
      "conservativeMomentRelativeTolerance",
      "conservativeResultantRelativeTolerance",
      "coordinateFrameBinding",
      "loadTransferReceiptPath",
      "nodalForceUnits",
      "nodalLoadIncludePath",
      "sourceLane",
      "sourceObservationSha256",
      "sourceOutputRole",
      "sourceOutputSha256",
      "sourceSolver",
      "tractionUnits",
    ],
    "input.loadTransfer",
  );
  if (
    input.loadTransfer.sourceSolver !== "scuff-em" ||
    input.loadTransfer.sourceLane !==
      "casimir_finite_temperature_maxwell_stress" ||
    input.loadTransfer.sourceOutputRole !== "casimir_stress_traction" ||
    !SHA256.test(input.loadTransfer.sourceObservationSha256) ||
    !SHA256.test(input.loadTransfer.sourceOutputSha256) ||
    input.loadTransfer.tractionUnits !== "Pa" ||
    input.loadTransfer.nodalForceUnits !== "N" ||
    input.loadTransfer.coordinateFrameBinding !== "same_cad_frame" ||
    !finiteInRange(
      input.loadTransfer.conservativeResultantRelativeTolerance,
      0,
      0.05,
    ) ||
    !finiteInRange(
      input.loadTransfer.conservativeMomentRelativeTolerance,
      0,
      0.05,
    )
  ) {
    fail(
      "load_transfer_policy_invalid",
      "SCUFF-to-FEM load transfer is invalid.",
    );
  }
  dependencyAtPath(
    input,
    input.loadTransfer.loadTransferReceiptPath,
    "scuff_load_transfer_receipt",
    "loadTransferReceiptPath",
  );
  dependencyAtPath(
    input,
    input.loadTransfer.nodalLoadIncludePath,
    "scuff_nodal_load_include",
    "nodalLoadIncludePath",
  );

  exactKeys(
    input.supportControl,
    [
      "activeChannelCount",
      "actuationChannelCount",
      "actuationMode",
      "actuationPeriodSeconds",
      "burstDuty",
      "controlActuationModelPath",
      "cycleDuty",
      "maximumSupportFractionForRetention",
      "minimumStructuralSupportFraction",
      "peakCommandForceNewtons",
      "supportFraction",
      "supportModelPath",
      "supportRetentionOverlapRatio",
      "supportSafetyFactor",
    ],
    "input.supportControl",
  );
  const support = input.supportControl;
  const expectedOverlap =
    support.maximumSupportFractionForRetention /
    support.minimumStructuralSupportFraction;
  if (
    support.actuationMode !== "prescribed_nodal_force_history" ||
    !finiteInRange(support.supportFraction, Number.MIN_VALUE, 1) ||
    !finiteInRange(
      support.minimumStructuralSupportFraction,
      Number.MIN_VALUE,
      1,
    ) ||
    !finiteInRange(
      support.maximumSupportFractionForRetention,
      Number.MIN_VALUE,
      1,
    ) ||
    support.minimumStructuralSupportFraction >
      support.maximumSupportFractionForRetention ||
    support.supportFraction < support.minimumStructuralSupportFraction ||
    support.supportFraction > support.maximumSupportFractionForRetention ||
    !Number.isFinite(support.supportRetentionOverlapRatio) ||
    support.supportRetentionOverlapRatio < 1 ||
    Math.abs(support.supportRetentionOverlapRatio - expectedOverlap) >
      1e-12 * Math.max(1, Math.abs(expectedOverlap)) ||
    !finiteInRange(support.supportSafetyFactor, 1, 100) ||
    !Number.isSafeInteger(support.actuationChannelCount) ||
    support.actuationChannelCount <= 0 ||
    support.actuationChannelCount > 1_000_000 ||
    !Number.isSafeInteger(support.activeChannelCount) ||
    support.activeChannelCount <= 0 ||
    support.activeChannelCount > support.actuationChannelCount ||
    !finiteInRange(support.actuationPeriodSeconds, Number.MIN_VALUE, 1e9) ||
    !finiteInRange(support.burstDuty, Number.MIN_VALUE, 1) ||
    !finiteInRange(support.cycleDuty, Number.MIN_VALUE, 1) ||
    !finiteInRange(support.peakCommandForceNewtons, 0, 1e15)
  ) {
    fail(
      "support_control_policy_invalid",
      "Support-retention overlap or control-actuation policy is invalid.",
    );
  }
  dependencyAtPath(
    input,
    support.supportModelPath,
    "support_model",
    "supportModelPath",
  );
  dependencyAtPath(
    input,
    support.controlActuationModelPath,
    "control_actuation_model",
    "controlActuationModelPath",
  );

  exactKeys(
    input.thermal,
    [
      "ambientTemperatureKelvin",
      "analysisMode",
      "convectionCoefficientWattsPerSquareMeterKelvin",
      "cycleCount",
      "emissivity",
      "initialTemperatureKelvin",
      "maximumAllowedTemperatureKelvin",
      "minimumAllowedTemperatureKelvin",
      "thermalModelPath",
    ],
    "input.thermal",
  );
  const thermal = input.thermal;
  if (
    thermal.analysisMode !== "transient_coupled_temperature_displacement" ||
    !finiteInRange(thermal.minimumAllowedTemperatureKelvin, 0, 1e5) ||
    !finiteInRange(thermal.maximumAllowedTemperatureKelvin, 0, 1e5) ||
    thermal.minimumAllowedTemperatureKelvin >=
      thermal.maximumAllowedTemperatureKelvin ||
    !finiteInRange(
      thermal.initialTemperatureKelvin,
      thermal.minimumAllowedTemperatureKelvin,
      thermal.maximumAllowedTemperatureKelvin,
    ) ||
    !finiteInRange(
      thermal.ambientTemperatureKelvin,
      thermal.minimumAllowedTemperatureKelvin,
      thermal.maximumAllowedTemperatureKelvin,
    ) ||
    !finiteInRange(
      thermal.convectionCoefficientWattsPerSquareMeterKelvin,
      0,
      1e9,
    ) ||
    !finiteInRange(thermal.emissivity, 0, 1) ||
    !Number.isSafeInteger(thermal.cycleCount) ||
    thermal.cycleCount <= 0 ||
    thermal.cycleCount > 1_000_000_000_000
  ) {
    fail("thermal_policy_invalid", "Thermal policy is invalid.");
  }
  dependencyAtPath(
    input,
    thermal.thermalModelPath,
    "thermal_model",
    "thermalModelPath",
  );

  exactKeys(
    input.fatigue,
    [
      "designCycles",
      "fatigueModelPath",
      "materialCouponReceiptPath",
      "maximumMinerDamage",
      "meanStressCorrection",
      "method",
      "minimumLifeFactor",
    ],
    "input.fatigue",
  );
  if (
    input.fatigue.method !== "strain_life_coffin_manson" ||
    input.fatigue.meanStressCorrection !== "morrow" ||
    !Number.isSafeInteger(input.fatigue.designCycles) ||
    input.fatigue.designCycles <= 0 ||
    input.fatigue.designCycles > 1_000_000_000_000_000 ||
    !finiteInRange(input.fatigue.minimumLifeFactor, 1, 1e6) ||
    !finiteInRange(input.fatigue.maximumMinerDamage, 0, 1)
  ) {
    fail("fatigue_policy_invalid", "Fatigue policy is invalid.");
  }
  dependencyAtPath(
    input,
    input.fatigue.fatigueModelPath,
    "fatigue_model",
    "fatigueModelPath",
  );
  dependencyAtPath(
    input,
    input.fatigue.materialCouponReceiptPath,
    "material_coupon_receipt",
    "materialCouponReceiptPath",
  );

  exactKeys(
    input.contact,
    [
      "contactModelPath",
      "formulation",
      "frictionCoefficient",
      "maximumPenetrationMeters",
      "normalBehavior",
      "penaltyScale",
      "sliding",
    ],
    "input.contact",
  );
  if (
    input.contact.formulation !== "surface_to_surface_penalty" ||
    input.contact.sliding !== "finite" ||
    input.contact.normalBehavior !== "hard" ||
    !finiteInRange(input.contact.frictionCoefficient, 0, 2) ||
    !finiteInRange(input.contact.penaltyScale, Number.MIN_VALUE, 1e12) ||
    !finiteInRange(
      input.contact.maximumPenetrationMeters,
      0,
      input.pullIn.minimumAllowedGapMeters,
    )
  ) {
    fail("contact_policy_invalid", "Contact policy is invalid.");
  }
  dependencyAtPath(
    input,
    input.contact.contactModelPath,
    "contact_model",
    "contactModelPath",
  );

  exactKeys(
    input.pullIn,
    [
      "criterion",
      "criterionPath",
      "maximumClosingDisplacementMeters",
      "minimumAllowedGapMeters",
      "minimumTangentStiffnessNewtonsPerMeter",
      "nominalGapMeters",
      "requiredLoadFactor",
    ],
    "input.pullIn",
  );
  const expectedClosing =
    input.pullIn.nominalGapMeters - input.pullIn.minimumAllowedGapMeters;
  if (
    input.pullIn.criterion !== "minimum_gap_and_positive_tangent_stiffness" ||
    !finiteInRange(input.pullIn.nominalGapMeters, Number.MIN_VALUE, 1) ||
    !finiteInRange(
      input.pullIn.minimumAllowedGapMeters,
      Number.MIN_VALUE,
      input.pullIn.nominalGapMeters,
    ) ||
    input.pullIn.minimumAllowedGapMeters >= input.pullIn.nominalGapMeters ||
    !Number.isFinite(input.pullIn.maximumClosingDisplacementMeters) ||
    Math.abs(input.pullIn.maximumClosingDisplacementMeters - expectedClosing) >
      1e-12 * Math.max(expectedClosing, 1e-300) ||
    !finiteInRange(
      input.pullIn.minimumTangentStiffnessNewtonsPerMeter,
      Number.MIN_VALUE,
      1e30,
    ) ||
    !finiteInRange(input.pullIn.requiredLoadFactor, 1 + Number.EPSILON, 1e6)
  ) {
    fail("pull_in_policy_invalid", "Pull-in criterion is invalid.");
  }
  dependencyAtPath(
    input,
    input.pullIn.criterionPath,
    "pull_in_criterion",
    "criterionPath",
  );
};

const expectedStepShape = [
  ["thermal_preload", "coupled_temperature_displacement"],
  ["support_static_ramp", "static"],
  ["control_actuation_transient", "dynamic_implicit"],
  ["pull_in_continuation", "static"],
] as const;

const validateNonlinearPolicy = (
  input: Nhm2CalculixMechanicsSupportControlInputV1,
): void => {
  exactKeys(
    input.nonlinearTimeStepPolicy,
    [
      "deckSemanticAuditReceiptPath",
      "deterministicThreadCount",
      "linearSolver",
      "maximumEquilibriumIterations",
      "steps",
    ],
    "input.nonlinearTimeStepPolicy",
  );
  const policy = input.nonlinearTimeStepPolicy;
  if (
    policy.linearSolver !== "spooles_serial" ||
    policy.deterministicThreadCount !== 1 ||
    policy.maximumEquilibriumIterations !== 100 ||
    !Array.isArray(policy.steps) ||
    policy.steps.length !== expectedStepShape.length
  ) {
    fail("nonlinear_time_step_policy_invalid", "Nonlinear policy is invalid.");
  }
  dependencyAtPath(
    input,
    policy.deckSemanticAuditReceiptPath,
    "deck_semantic_audit_receipt",
    "deckSemanticAuditReceiptPath",
  );
  for (let index = 0; index < expectedStepShape.length; index += 1) {
    const step = policy.steps[index];
    exactKeys(
      step,
      [
        "automaticIncrementation",
        "initialIncrementSeconds",
        "integrationAlpha",
        "maximumIncrementSeconds",
        "minimumIncrementSeconds",
        "nlgeom",
        "procedure",
        "stepId",
        "totalTimeSeconds",
      ],
      `input.nonlinearTimeStepPolicy.steps[${index}]`,
    );
    const [expectedId, expectedProcedure] = expectedStepShape[index];
    const dynamic = step.procedure === "dynamic_implicit";
    if (
      step.stepId !== expectedId ||
      step.procedure !== expectedProcedure ||
      step.nlgeom !== true ||
      step.automaticIncrementation !== true ||
      !finiteInRange(step.totalTimeSeconds, Number.MIN_VALUE, 1e12) ||
      !finiteInRange(
        step.minimumIncrementSeconds,
        Number.MIN_VALUE,
        step.totalTimeSeconds,
      ) ||
      !finiteInRange(
        step.initialIncrementSeconds,
        step.minimumIncrementSeconds,
        step.totalTimeSeconds,
      ) ||
      !finiteInRange(
        step.maximumIncrementSeconds,
        step.initialIncrementSeconds,
        step.totalTimeSeconds,
      ) ||
      (dynamic
        ? step.integrationAlpha !== -0.05
        : step.integrationAlpha !== null)
    ) {
      fail(
        "nonlinear_time_step_policy_invalid",
        `Nonlinear step ${index} differs from the governed policy.`,
      );
    }
  }
};

const validateInput = (
  input: Nhm2CalculixMechanicsSupportControlInputV1,
  production: boolean,
): void => {
  exactKeys(
    input,
    [
      "artifactId",
      "contact",
      "contractVersion",
      "fatigue",
      "loadTransfer",
      "model",
      "nonlinearTimeStepPolicy",
      "package",
      "pullIn",
      "requestedOutputs",
      "supportControl",
      "thermal",
      "units",
    ],
    "input",
  );
  if (
    input.artifactId !== "nhm2.calculix_mechanics_support_control_input" ||
    input.contractVersion !== NHM2_CALCULIX_MECHANICS_INPUT_VERSION
  ) {
    fail("input_manifest_invalid", "Input identity is invalid.");
  }
  exactKeys(
    input.package,
    [
      "executableName",
      "executableArchitecture",
      "executablePlatform",
      "harnessOnly",
      "name",
      "officialExecutableArchiveSha256",
      "officialExecutableArchiveSizeBytes",
      "officialExecutableArchiveUri",
      "officialExecutableSha256",
      "officialExecutableSizeBytes",
      "officialGitTag",
      "releaseArchiveSha256",
      "releaseArchiveSizeBytes",
      "releaseArchiveUri",
      "repository",
      "sourceAuthority",
      "version",
    ],
    "input.package",
  );
  if (
    input.package.name !== "CalculiX CrunchiX" ||
    input.package.version !== NHM2_CALCULIX_VERSION ||
    input.package.repository !== NHM2_CALCULIX_REPOSITORY ||
    input.package.releaseArchiveUri !== NHM2_CALCULIX_RELEASE_ARCHIVE_URI ||
    input.package.releaseArchiveSha256 !==
      NHM2_CALCULIX_RELEASE_ARCHIVE_SHA256 ||
    input.package.releaseArchiveSizeBytes !==
      NHM2_CALCULIX_RELEASE_ARCHIVE_SIZE_BYTES ||
    input.package.officialExecutableArchiveUri !==
      NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_URI ||
    input.package.officialExecutableArchiveSha256 !==
      NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_SHA256 ||
    input.package.officialExecutableArchiveSizeBytes !==
      NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_SIZE_BYTES ||
    input.package.officialExecutableSha256 !==
      NHM2_CALCULIX_OFFICIAL_EXECUTABLE_SHA256 ||
    input.package.officialExecutableSizeBytes !==
      NHM2_CALCULIX_OFFICIAL_EXECUTABLE_SIZE_BYTES ||
    input.package.executablePlatform !== "linux" ||
    input.package.executableArchitecture !== "x86_64" ||
    input.package.officialGitTag !== null ||
    input.package.sourceAuthority !== "official_release_archive" ||
    input.package.executableName !== "ccx_2.23" ||
    typeof input.package.harnessOnly !== "boolean"
  ) {
    fail(
      "calculix_package_binding_invalid",
      "CalculiX release binding is invalid.",
    );
  }
  if (production && input.package.harnessOnly) {
    fail("harness_package_forbidden", "A harness-only package is forbidden.");
  }
  exactKeys(
    input.units,
    [
      "energy",
      "force",
      "heatFlux",
      "length",
      "mass",
      "pressure",
      "stress",
      "temperature",
      "time",
    ],
    "input.units",
  );
  if (
    JSON.stringify(input.units) !==
    JSON.stringify({
      length: "m",
      force: "N",
      time: "s",
      temperature: "K",
      mass: "kg",
      stress: "Pa",
      pressure: "Pa",
      energy: "J",
      heatFlux: "W/m^2",
    })
  ) {
    fail(
      "unit_system_invalid",
      "The mechanics lane requires a frozen SI unit system.",
    );
  }
  validateModel(input);
  validatePhysicsPolicies(input);
  validateNonlinearPolicy(input);
  exactKeys(
    input.requestedOutputs,
    [
      "convergenceFiles",
      "fieldVariables",
      "frdEncoding",
      "outputEveryIncrement",
      "printVariables",
    ],
    "input.requestedOutputs",
  );
  if (
    input.requestedOutputs.frdEncoding !== "ascii" ||
    input.requestedOutputs.outputEveryIncrement !== true ||
    JSON.stringify(input.requestedOutputs.fieldVariables) !==
      JSON.stringify(["U", "S", "E", "PEEQ", "NT", "RF"]) ||
    JSON.stringify(input.requestedOutputs.printVariables) !==
      JSON.stringify(["RF", "U"]) ||
    JSON.stringify(input.requestedOutputs.convergenceFiles) !==
      JSON.stringify(["sta", "cvg"])
  ) {
    fail(
      "requested_output_policy_invalid",
      "Requested output policy is invalid.",
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
    ledger.entries.length === 0 ||
    ledger.entries.length > MAX_LEDGER_ENTRIES ||
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

const validateOfficialSources = (
  ledger: Nhm2ExternalNumericalKernelSealedLedgerV1,
  evidence: Nhm2CalculixToolchainEvidenceV1,
): void => {
  const archive = ledger.entries.find(
    (entry) => entry.relativePath === evidence.sourceArchiveRelativePath,
  );
  if (
    archive?.sha256 !== NHM2_CALCULIX_RELEASE_ARCHIVE_SHA256 ||
    archive.sizeBytes !== NHM2_CALCULIX_RELEASE_ARCHIVE_SIZE_BYTES ||
    !/(^|\/)ccx_2\.23\.src\.tar\.bz2$/.test(archive.relativePath)
  ) {
    fail(
      "official_calculix_release_archive_invalid",
      "Toolchain must bind the exact official CalculiX 2.23 source archive.",
    );
  }
  const executableArchive = ledger.entries.find(
    (entry) => entry.relativePath === evidence.executableArchiveRelativePath,
  );
  if (
    executableArchive?.sha256 !==
      NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_SHA256 ||
    executableArchive.sizeBytes !==
      NHM2_CALCULIX_OFFICIAL_EXECUTABLE_ARCHIVE_SIZE_BYTES ||
    !/(^|\/)ccx_2\.23\.tar\.bz2$/.test(executableArchive.relativePath)
  ) {
    fail(
      "official_calculix_executable_archive_invalid",
      "Toolchain must bind the exact official CalculiX 2.23 Linux executable archive.",
    );
  }
  for (const binding of NHM2_CALCULIX_2_23_CRITICAL_SOURCE_BINDINGS) {
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
        "official_calculix_source_binding_invalid",
        `Toolchain must bind the official 2.23 ${binding.suffix} bytes.`,
      );
    }
  }
};

const governedEnvironment = {
  CCX_LOG_ALLOC: "0",
  CCX_NPROC_EQUATION_SOLVER: "1",
  CCX_NPROC_RESULTS: "1",
  CCX_NPROC_STIFFNESS: "1",
  LANG: "C",
  LC_ALL: "C",
  MKL_NUM_THREADS: "1",
  NUMBER_OF_CPUS: "1",
  OMP_NUM_THREADS: "1",
  OPENBLAS_NUM_THREADS: "1",
  TZ: "UTC",
} as const;

const blockers = [
  "external_execution_observation_required",
  "independent_scientific_content_replay_required",
  "stock_ccx_job_prefix_couples_input_and_output_roots",
  "stock_ccx_exact_three_role_output_contract_unavailable",
  "stock_ccx_auxiliary_output_inventory_unbounded_for_executor",
  "trusted_ccx_staging_and_output_adapter_required",
  "stock_ccx_fatigue_life_postprocessor_absent",
  "scuff_local_traction_to_fem_load_transfer_replay_required",
  "mesh_contact_thermal_fatigue_convergence_unresolved",
  "pull_in_tangent_stability_replay_required",
  "material_coupon_correspondence_replay_required",
  "filesystem_link_and_freshness_observation_required",
] as const;

const claimBoundary: Nhm2CalculixMechanicsSupportControlExternalPlanV1["claimBoundary"] =
  {
    officialCalculixReleaseBytesPinned: true,
    completeInputLedgerDeclared: true,
    executableAndBuildEvidenceLedgerBound: true,
    stockExecutableDirectlyAdmitted: false,
    externalExecutionObserved: false,
    mechanicsFieldResultsEstablished: false,
    nonlinearHistoryEstablished: false,
    fatigueLifeEstablished: false,
    pullInMarginEstablished: false,
    supportRetentionOverlapEstablished: false,
    thermalMarginEstablished: false,
    loadTransferEstablished: false,
    theoryClosureClaimAllowed: false,
    empiricalValidationEstablished: false,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
    routeEtaClaimAllowed: false,
    speedAuthorityClaimAllowed: false,
  };

const suspiciousCalculixSubstitution = (value: string): boolean => {
  const portable = value.replaceAll("\\", "/").toLowerCase();
  return (
    /(^|\/)server\/services\/.*calculix/.test(portable) ||
    /(^|\/)(mock|fake|simulated?)[-_].*calculix/.test(portable) ||
    portable.includes("simulatecalculix") ||
    portable.includes("mockcalculix")
  );
};

const validatePlanBindings = (
  plan: Nhm2CalculixMechanicsSupportControlExternalPlanV1,
): void => {
  validateLedgerCommitment(plan.ledgers.toolchain, "toolchain");
  validateLedgerCommitment(plan.ledgers.input, "input");
  exactKeys(
    plan.toolchainEvidence,
    [
      "buildReceiptRelativePath",
      "compilerLockRelativePath",
      "executableArchiveRelativePath",
      "sourceArchiveRelativePath",
      "versionObservationRelativePath",
    ],
    "plan.toolchainEvidence",
  );
  const evidencePaths = Object.values(plan.toolchainEvidence);
  if (
    evidencePaths.some((value) => !portableRelativePath(value)) ||
    new Set(evidencePaths).size !== evidencePaths.length ||
    evidencePaths.some(
      (value) =>
        plan.ledgers.toolchain.entries.filter(
          (entry) => entry.relativePath === value && entry.sizeBytes > 0,
        ).length !== 1,
    )
  ) {
    fail(
      "toolchain_evidence_invalid",
      "Toolchain source, build, compiler, and version evidence must be uniquely ledger-bound.",
    );
  }
  validateOfficialSources(plan.ledgers.toolchain, plan.toolchainEvidence);

  const expectedInputEntries = [
    { ...plan.input.model.mainDeck },
    ...plan.input.model.dependencies.map(
      ({ relativePath, sha256: digest, sizeBytes }) => ({
        relativePath,
        sha256: digest,
        sizeBytes,
      }),
    ),
    {
      relativePath: plan.inputManifestRelativePath,
      sha256: sha256(
        serializeNhm2CalculixMechanicsSupportControlInput(plan.input),
      ),
      sizeBytes: Buffer.byteLength(
        serializeNhm2CalculixMechanicsSupportControlInput(plan.input),
        "utf8",
      ),
    },
  ].sort((left, right) => compareUtf8(left.relativePath, right.relativePath));
  if (
    JSON.stringify(plan.ledgers.input.entries) !==
    JSON.stringify(expectedInputEntries)
  ) {
    fail(
      "input_ledger_binding_invalid",
      "Input ledger must exactly bind the manifest, deck, includes, mesh, models, and receipts.",
    );
  }

  if (!path.isAbsolute(plan.executable.absolutePath)) {
    fail(
      "calculix_executable_binding_invalid",
      "CalculiX executable path must be absolute.",
    );
  }
  const executableRelativePath = path
    .relative(plan.ledgers.toolchain.rootPath, plan.executable.absolutePath)
    .split(path.sep)
    .join("/");
  const executableEntry = plan.ledgers.toolchain.entries.find(
    (entry) => entry.relativePath === executableRelativePath,
  );
  if (
    executableRelativePath.startsWith("../") ||
    path.posix.isAbsolute(executableRelativePath) ||
    executableEntry?.sha256 !== plan.executable.sha256 ||
    executableEntry.sizeBytes !== plan.executable.sizeBytes ||
    plan.executable.sha256 !== NHM2_CALCULIX_OFFICIAL_EXECUTABLE_SHA256 ||
    plan.executable.sizeBytes !==
      NHM2_CALCULIX_OFFICIAL_EXECUTABLE_SIZE_BYTES ||
    !/(^|\/)ccx_2\.23$/.test(executableRelativePath)
  ) {
    fail(
      "calculix_executable_binding_invalid",
      "Executable must be an exact ccx_2.23 binary inside the sealed toolchain.",
    );
  }

  const candidates = [
    plan.executable.absolutePath,
    plan.ledgers.input.rootPath,
    plan.ledgers.toolchain.rootPath,
    ...plan.ledgers.input.entries.map((entry) => entry.relativePath),
    ...plan.ledgers.toolchain.entries.map((entry) => entry.relativePath),
  ];
  if (candidates.some(suspiciousCalculixSubstitution)) {
    fail(
      "mock_or_simulated_calculix_forbidden",
      "Mock, simulated, or repository-service CalculiX substitutions are forbidden.",
    );
  }

  if (
    !path.isAbsolute(plan.outputRoot) ||
    pathsOverlap(
      plan.ledgers.input.rootPath,
      plan.ledgers.toolchain.rootPath,
    ) ||
    pathsOverlap(plan.ledgers.input.rootPath, plan.outputRoot) ||
    pathsOverlap(plan.ledgers.toolchain.rootPath, plan.outputRoot)
  ) {
    fail(
      "filesystem_roots_invalid",
      "Input, toolchain, and fresh output roots must be absolute and pairwise disjoint.",
    );
  }
};

const stockOutputCandidates = (
  input: Nhm2CalculixMechanicsSupportControlInputV1,
): [string, string, string, string] => {
  const prefix = input.model.mainDeck.relativePath.slice(0, -4);
  return [`${prefix}.dat`, `${prefix}.frd`, `${prefix}.sta`, `${prefix}.cvg`];
};

const expectedInvocation = (
  plan: Nhm2CalculixMechanicsSupportControlExternalPlanV1,
): Nhm2CalculixMechanicsSupportControlExternalPlanV1["deterministicInvocation"] => {
  const deckAbsolutePath = path.resolve(
    plan.ledgers.input.rootPath,
    ...plan.input.model.mainDeck.relativePath.split("/"),
  );
  const jobPrefixAbsolutePath = deckAbsolutePath.slice(0, -4);
  return {
    command: plan.executable.absolutePath,
    arguments: ["-i", jobPrefixAbsolutePath],
    workingDirectory: plan.outputRoot,
    environmentAllowlist: Object.keys(governedEnvironment).sort(compareUtf8),
    environment: { ...governedEnvironment },
    jobPrefixAbsolutePath,
    inputDeckAbsolutePath: deckAbsolutePath,
    stockOutputRoot: "input_ledger_root_beside_job_prefix",
  };
};

export function validateNhm2CalculixMechanicsSupportControlExternalPlan(
  plan: Nhm2CalculixMechanicsSupportControlExternalPlanV1,
): void {
  validateInput(plan.input, true);
  if (
    plan.artifactId !==
      "nhm2.calculix_mechanics_support_control_external_plan" ||
    plan.contractVersion !== NHM2_CALCULIX_MECHANICS_PLAN_VERSION ||
    plan.status !== "sealed_external_partial_plan_execution_blocked" ||
    !portableRelativePath(plan.inputManifestRelativePath) ||
    plan.inputManifestRelativePath === plan.input.model.mainDeck.relativePath ||
    plan.lane !== "mechanics_nonlinear_support_control" ||
    plan.solver.family !== "calculix" ||
    plan.solver.implementationId !== "calculix.ccx_2_23.stock" ||
    plan.solver.version !== NHM2_CALCULIX_VERSION ||
    plan.solver.producerMode !== "external_binary"
  ) {
    fail(
      "calculix_plan_identity_invalid",
      "CalculiX partial plan identity is invalid.",
    );
  }
  validatePlanBindings(plan);

  const expected = expectedInvocation(plan);
  if (
    expected.jobPrefixAbsolutePath.length > MAX_JOB_PREFIX_CHARACTERS ||
    JSON.stringify(plan.deterministicInvocation) !== JSON.stringify(expected)
  ) {
    fail(
      "calculix_invocation_invalid",
      "Invocation must be the exact stock ccx_2.23 -i job-prefix call within its 127-character limit.",
    );
  }
  const expectedInventory: Nhm2CalculixMechanicsSupportControlExternalPlanV1["freshOutputInventory"] =
    {
      admissionRequirement: "output_root_must_not_exist",
      exactFinalInventoryKnown: false,
      stockOutputCandidatesRelativeToInputRoot: stockOutputCandidates(
        plan.input,
      ),
      stockAuxiliaryOutputsMayExist: true,
      requiredGovernedRoles: [
        ...NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES
          .mechanics_nonlinear_support_control.requiredOutputRoles,
      ],
      stockFilesAssignedGovernedRoles: false,
    };
  if (
    JSON.stringify(plan.freshOutputInventory) !==
      JSON.stringify(expectedInventory) ||
    plan.executorRunSpec !== null ||
    JSON.stringify(plan.blockers) !== JSON.stringify(blockers) ||
    JSON.stringify(plan.claimBoundary) !== JSON.stringify(claimBoundary)
  ) {
    fail(
      "calculix_claim_boundary_invalid",
      "Blocked execution, output incompatibility, blockers, or claim boundary was weakened.",
    );
  }
}

export function buildNhm2CalculixMechanicsSupportControlExternalPlan(
  bindings: BuildNhm2CalculixMechanicsSupportControlExternalPlanInput,
): Nhm2CalculixMechanicsSupportControlExternalPlanV1 {
  const plan: Nhm2CalculixMechanicsSupportControlExternalPlanV1 = {
    artifactId: "nhm2.calculix_mechanics_support_control_external_plan",
    contractVersion: NHM2_CALCULIX_MECHANICS_PLAN_VERSION,
    status: "sealed_external_partial_plan_execution_blocked",
    inputManifestRelativePath: bindings.inputManifestRelativePath,
    input: bindings.input,
    lane: "mechanics_nonlinear_support_control",
    solver: {
      family: "calculix",
      implementationId: "calculix.ccx_2_23.stock",
      version: NHM2_CALCULIX_VERSION,
      producerMode: "external_binary",
    },
    executable: { ...bindings.executable },
    ledgers: {
      toolchain: bindings.toolchainLedger,
      input: bindings.inputLedger,
    },
    toolchainEvidence: { ...bindings.toolchainEvidence },
    outputRoot: bindings.outputRoot,
    deterministicInvocation:
      {} as Nhm2CalculixMechanicsSupportControlExternalPlanV1["deterministicInvocation"],
    freshOutputInventory: {
      admissionRequirement: "output_root_must_not_exist",
      exactFinalInventoryKnown: false,
      stockOutputCandidatesRelativeToInputRoot: stockOutputCandidates(
        bindings.input,
      ),
      stockAuxiliaryOutputsMayExist: true,
      requiredGovernedRoles: [
        ...NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES
          .mechanics_nonlinear_support_control.requiredOutputRoles,
      ],
      stockFilesAssignedGovernedRoles: false,
    },
    executorRunSpec: null,
    blockers,
    claimBoundary: { ...claimBoundary },
  };
  plan.deterministicInvocation = expectedInvocation(plan);
  validateNhm2CalculixMechanicsSupportControlExternalPlan(plan);
  return plan;
}
