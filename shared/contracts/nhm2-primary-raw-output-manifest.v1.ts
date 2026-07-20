import { createHash } from "node:crypto";

import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY,
  NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID,
  NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION,
  NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES,
  type Nhm2PrimaryRawNumericalContentPolicyV1,
  type Nhm2PrimaryRawRecordContentPolicyV1,
  type Nhm2PrimaryRawRoleContentPolicyV1,
} from "./nhm2-primary-raw-content-policy.v1";

export const NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID =
  "nhm2.primary_raw_output_manifest" as const;
export const NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION =
  "nhm2_primary_raw_output_manifest/v1" as const;
export const NHM2_PRIMARY_RAW_OUTPUT_INPUT_CLOSURE_ALGORITHM =
  "sha256_canonical_input_inventory_v1" as const;
export const NHM2_PRIMARY_RAW_OUTPUT_INPUT_ORDERING =
  "utf8_path_bytes_ascending" as const;
export const NHM2_PRIMARY_RAW_OUTPUT_FILE_ORDERING =
  "utf8_path_bytes_ascending" as const;
export const NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING =
  "nhm2_primary_raw_family_topological_v1" as const;
export const NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256_DOMAIN =
  "nhm2-primary-raw-content-policy-sha256/v1\n" as const;
export const NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256 = createHash("sha256")
  .update(NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256_DOMAIN, "utf8")
  .update(JSON.stringify(NHM2_PRIMARY_RAW_CONTENT_POLICY), "utf8")
  .digest("hex");

/**
 * The order is part of the protocol. Every parent must occur before its child.
 * These are raw producer domains, not evidence dispositions or gate results.
 */
export const NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS = [
  "semiclassical_state",
  "finite_temperature_finite_geometry_maxwell_stress",
  "mechanical_support_control_margin",
  "full_apparatus_source_tensor",
  "covariant_conservation",
  "continuous_observer_optimizer",
  "worldline_qei",
  "dynamic_backreaction_stability_causality",
  "observable_projection",
] as const;

export type Nhm2PrimaryRawOutputFamilyId =
  (typeof NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS)[number];

export const NHM2_PRIMARY_RAW_OUTPUT_PARENT_FAMILIES = {
  semiclassical_state: [],
  finite_temperature_finite_geometry_maxwell_stress: [],
  mechanical_support_control_margin: [
    "finite_temperature_finite_geometry_maxwell_stress",
  ],
  full_apparatus_source_tensor: [
    "semiclassical_state",
    "finite_temperature_finite_geometry_maxwell_stress",
    "mechanical_support_control_margin",
  ],
  covariant_conservation: ["full_apparatus_source_tensor"],
  continuous_observer_optimizer: ["full_apparatus_source_tensor"],
  worldline_qei: ["semiclassical_state", "full_apparatus_source_tensor"],
  dynamic_backreaction_stability_causality: [
    "semiclassical_state",
    "full_apparatus_source_tensor",
    "covariant_conservation",
  ],
  observable_projection: [
    "semiclassical_state",
    "finite_temperature_finite_geometry_maxwell_stress",
    "mechanical_support_control_margin",
    "full_apparatus_source_tensor",
    "covariant_conservation",
    "continuous_observer_optimizer",
    "worldline_qei",
    "dynamic_backreaction_stability_causality",
  ],
} as const satisfies Record<
  Nhm2PrimaryRawOutputFamilyId,
  readonly Nhm2PrimaryRawOutputFamilyId[]
>;

export type Nhm2PrimaryRawOutputRepresentationKind =
  "numerical_array" | "records";

/**
 * Each role names primitive output needed to reconstruct a later diagnostic.
 * It deliberately excludes producer-authored scientific dispositions.
 */
export const NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES = {
  semiclassical_state: {
    mode_basis_samples: "numerical_array",
    state_mode_coefficients: "numerical_array",
    mode_tensor_contribution_components: "numerical_array",
    two_point_function_samples: "numerical_array",
    renormalization_subtraction_samples: "numerical_array",
    renormalized_tensor_components: "numerical_array",
    ward_divergence_components: "numerical_array",
    switching_profile_samples: "numerical_array",
    renormalization_inputs: "records",
    uncertainty_samples: "numerical_array",
    backreaction_iteration_fields: "numerical_array",
  },
  finite_temperature_finite_geometry_maxwell_stress: {
    geometry_mesh_records: "records",
    material_region_records: "records",
    dielectric_response_samples: "numerical_array",
    matsubara_mode_samples: "numerical_array",
    electric_green_dyadic_components: "numerical_array",
    magnetic_green_dyadic_components: "numerical_array",
    electric_field_correlation_components: "numerical_array",
    magnetic_field_correlation_components: "numerical_array",
    integration_surface_samples: "numerical_array",
    maxwell_stress_components: "numerical_array",
    force_gap_gradient_samples: "numerical_array",
    roughness_patch_temperature_samples: "numerical_array",
    mesh_frequency_refinement_samples: "numerical_array",
  },
  mechanical_support_control_margin: {
    fea_mesh_records: "records",
    material_constitutive_records: "records",
    boundary_condition_records: "records",
    stiffness_matrix_entries: "records",
    load_vector_components: "numerical_array",
    displacement_components: "numerical_array",
    stress_strain_components: "numerical_array",
    residual_force_components: "numerical_array",
    stability_mode_samples: "numerical_array",
    support_retention_samples: "numerical_array",
    active_control_cycle_samples: "numerical_array",
    fabrication_tolerance_samples: "numerical_array",
    energy_heat_noise_samples: "numerical_array",
  },
  full_apparatus_source_tensor: {
    apparatus_term_ledger: "records",
    grid_topology_records: "records",
    coordinate_samples: "numerical_array",
    term_tensor_components: "numerical_array",
    total_tensor_components: "numerical_array",
    metric_tensor_components: "numerical_array",
    metric_required_tensor_components: "numerical_array",
    residual_components: "numerical_array",
    integration_weight_mask_samples: "numerical_array",
    normalization_samples: "numerical_array",
    source_provenance_edges: "records",
  },
  covariant_conservation: {
    derivative_stencil_records: "records",
    connection_coefficient_components: "numerical_array",
    tensor_derivative_components: "numerical_array",
    divergence_components: "numerical_array",
    switching_transition_components: "numerical_array",
    support_control_source_components: "numerical_array",
    boundary_normal_weight_samples: "numerical_array",
    boundary_flux_components: "numerical_array",
    cycle_energy_samples: "numerical_array",
    refinement_samples: "numerical_array",
    uncertainty_samples: "numerical_array",
  },
  continuous_observer_optimizer: {
    spatial_sample_index: "records",
    energy_condition_optimizer_bindings: "records",
    timelike_observer_vectors: "numerical_array",
    condition_optimum_timelike_vectors: "numerical_array",
    condition_optimum_objective_samples: "numerical_array",
    null_direction_vectors: "numerical_array",
    tensor_contraction_samples: "numerical_array",
    energy_condition_extrema: "numerical_array",
    optimizer_trace_samples: "numerical_array",
    optimizer_trace_objective_samples: "numerical_array",
    adversarial_start_samples: "numerical_array",
    adversarial_start_objective_samples: "numerical_array",
    globality_search_samples: "numerical_array",
    globality_objective_samples: "numerical_array",
    uncertainty_samples: "numerical_array",
  },
  worldline_qei: {
    worldline_catalog: "records",
    worldline_apparatus_interpolation_entries: "records",
    trajectory_components: "numerical_array",
    proper_time_samples: "numerical_array",
    four_velocity_components: "numerical_array",
    acceleration_curvature_components: "numerical_array",
    pulled_back_tensor_components: "numerical_array",
    pulled_back_metric_components: "numerical_array",
    contracted_tensor_samples: "numerical_array",
    sampling_function_samples: "numerical_array",
    quadrature_integrand_samples: "numerical_array",
    theorem_bound_inputs: "numerical_array",
    uncertainty_samples: "numerical_array",
  },
  dynamic_backreaction_stability_causality: {
    evolution_grid_records: "records",
    initial_data_components: "numerical_array",
    evolved_geometry_components: "numerical_array",
    evolved_source_components: "numerical_array",
    gauge_field_components: "numerical_array",
    constraint_residual_components: "numerical_array",
    backreaction_iteration_fields: "numerical_array",
    characteristic_ray_samples: "numerical_array",
    perturbation_mode_samples: "numerical_array",
    causal_screen_samples: "numerical_array",
    parameter_neighborhood_samples: "numerical_array",
    boundary_flux_samples: "numerical_array",
    resolution_refinement_samples: "numerical_array",
  },
  observable_projection: {
    observable_definition_records: "records",
    observable_sample_vectors: "numerical_array",
    projection_derivation_inputs: "records",
    projection_operator_entries: "records",
    projection_source_values: "numerical_array",
    projection_jacobian_components: "numerical_array",
    projection_uncertainty_samples: "numerical_array",
  },
} as const satisfies Record<
  Nhm2PrimaryRawOutputFamilyId,
  Record<string, Nhm2PrimaryRawOutputRepresentationKind>
>;

export type Nhm2PrimaryRawOutputSemanticRole<
  FamilyId extends Nhm2PrimaryRawOutputFamilyId = Nhm2PrimaryRawOutputFamilyId,
> = keyof (typeof NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES)[FamilyId] &
  string;

export const NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS = {
  candidateManifest: "candidate_manifest",
  selectedProfile: "selected_profile",
  chartDefinition: "chart_definition",
  atlas: "layered_ledger_atlas",
  units: "units_definition",
  normalization: "normalization_definition",
  solver: "solver_artifact",
  environment: "environment_lock",
  producerBundle: "producer_bundle",
} as const;

export type Nhm2PrimaryRawOutputHashedInputV1 = {
  inputId: string;
  path: string;
  sha256: string;
  sizeBytes: number;
  mediaType: string;
};

export type Nhm2PrimaryRawOutputInputBindingV1 = {
  inputId: string;
  sha256: string;
};

export type Nhm2PrimaryRawOutputNumericalRepresentationV1 = {
  kind: "numerical_array";
  dtype: "float64";
  encoding: "raw_ieee754";
  endianness: "little";
  shape: number[];
  storageOrder: "row-major";
  componentOrder: string[];
  unit: string;
};

export const NHM2_PRIMARY_RAW_OUTPUT_RECORD_FIELD_TYPES = [
  "boolean",
  "int64",
  "float64",
  "string",
  "timestamp_iso8601",
  "sha256",
] as const;

export type Nhm2PrimaryRawOutputRecordFieldType =
  (typeof NHM2_PRIMARY_RAW_OUTPUT_RECORD_FIELD_TYPES)[number];

export type Nhm2PrimaryRawOutputRecordSchemaFieldV1 = {
  name: string;
  type: Nhm2PrimaryRawOutputRecordFieldType;
  unit: string | null;
  nullable: boolean;
};

export type Nhm2PrimaryRawOutputRecordRepresentationV1 = {
  kind: "records";
  format: "json" | "ndjson";
  encoding: "utf8";
  recordMode: "record-stream";
  recordCount: number;
  schema: {
    schemaId: string;
    schemaVersion: string;
    primaryKey: string[];
    fields: Nhm2PrimaryRawOutputRecordSchemaFieldV1[];
  };
};

export type Nhm2PrimaryRawOutputFileV1 = {
  fileId: string;
  familyId: Nhm2PrimaryRawOutputFamilyId;
  semanticRole: string;
  path: string;
  sha256: string;
  sizeBytes: number;
  mediaType:
    "application/octet-stream" | "application/json" | "application/x-ndjson";
  representation:
    | Nhm2PrimaryRawOutputNumericalRepresentationV1
    | Nhm2PrimaryRawOutputRecordRepresentationV1;
};

export type Nhm2PrimaryRawOutputFamilyNodeV1 = {
  familyId: Nhm2PrimaryRawOutputFamilyId;
  parentFamilyIds: Nhm2PrimaryRawOutputFamilyId[];
  semanticRoles: string[];
  fileIds: string[];
};

export type Nhm2PrimaryRawOutputManifestV1 = {
  artifactId: typeof NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID;
  contractVersion: typeof NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION;
  contentPolicy: {
    artifactId: typeof NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID;
    contractVersion: typeof NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION;
    sha256: string;
  };
  generatedAt: string;
  identity: {
    candidateId: string;
    laneId: "nhm2_shift_lapse";
    selectedProfileId: string;
    chartId: string;
    candidateManifest: Nhm2PrimaryRawOutputInputBindingV1;
    selectedProfile: Nhm2PrimaryRawOutputInputBindingV1;
    chartDefinition: Nhm2PrimaryRawOutputInputBindingV1;
    atlas: Nhm2PrimaryRawOutputInputBindingV1;
    units: Nhm2PrimaryRawOutputInputBindingV1;
    normalization: Nhm2PrimaryRawOutputInputBindingV1;
  };
  execution: {
    planRole: "primary_numerical";
    requestId: string;
    runId: string;
    runtimeId: string;
    receiptId: string;
    sourceCommitSha: string;
    solver: {
      solverId: string;
      solverVersion: string;
      implementationId: string;
      input: Nhm2PrimaryRawOutputInputBindingV1;
    };
    environment: {
      environmentId: string;
      input: Nhm2PrimaryRawOutputInputBindingV1;
    };
    producerBundle: {
      bundleId: string;
      input: Nhm2PrimaryRawOutputInputBindingV1;
    };
    invocation: {
      command: string;
      argv: string[];
      workingDirectory: string;
    };
    startedAt: string;
    completedAt: string;
    durationMs: number;
    deterministicSeed: string;
    exitCode: number;
    terminationSignal: string | null;
  };
  inputClosure: {
    frozenBeforeExecution: true;
    digestAlgorithm: typeof NHM2_PRIMARY_RAW_OUTPUT_INPUT_CLOSURE_ALGORITHM;
    ordering: typeof NHM2_PRIMARY_RAW_OUTPUT_INPUT_ORDERING;
    entries: Nhm2PrimaryRawOutputHashedInputV1[];
    closureSha256: string;
  };
  familyDag: {
    ordering: typeof NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING;
    nodes: Nhm2PrimaryRawOutputFamilyNodeV1[];
  };
  fileInventory: {
    ordering: typeof NHM2_PRIMARY_RAW_OUTPUT_FILE_ORDERING;
    files: Nhm2PrimaryRawOutputFileV1[];
  };
  claimBoundary: {
    rawOutputEvidenceOnly: true;
    scientificEvaluationExternal: true;
    scientificConclusionEncoded: false;
    theoryClosureClaimAllowed: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedClaimAllowed: false;
    empiricalReceiptsRequired: true;
  };
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "contentPolicy",
  "generatedAt",
  "identity",
  "execution",
  "inputClosure",
  "familyDag",
  "fileInventory",
  "claimBoundary",
] as const;
const IDENTITY_KEYS = [
  "candidateId",
  "laneId",
  "selectedProfileId",
  "chartId",
  "candidateManifest",
  "selectedProfile",
  "chartDefinition",
  "atlas",
  "units",
  "normalization",
] as const;
const EXECUTION_KEYS = [
  "planRole",
  "requestId",
  "runId",
  "runtimeId",
  "receiptId",
  "sourceCommitSha",
  "solver",
  "environment",
  "producerBundle",
  "invocation",
  "startedAt",
  "completedAt",
  "durationMs",
  "deterministicSeed",
  "exitCode",
  "terminationSignal",
] as const;
const INPUT_CLOSURE_KEYS = [
  "frozenBeforeExecution",
  "digestAlgorithm",
  "ordering",
  "entries",
  "closureSha256",
] as const;
const INPUT_ENTRY_KEYS = [
  "inputId",
  "path",
  "sha256",
  "sizeBytes",
  "mediaType",
] as const;
const INPUT_BINDING_KEYS = ["inputId", "sha256"] as const;
const FAMILY_DAG_KEYS = ["ordering", "nodes"] as const;
const FAMILY_NODE_KEYS = [
  "familyId",
  "parentFamilyIds",
  "semanticRoles",
  "fileIds",
] as const;
const FILE_INVENTORY_KEYS = ["ordering", "files"] as const;
const FILE_KEYS = [
  "fileId",
  "familyId",
  "semanticRole",
  "path",
  "sha256",
  "sizeBytes",
  "mediaType",
  "representation",
] as const;
const NUMERICAL_KEYS = [
  "kind",
  "dtype",
  "encoding",
  "endianness",
  "shape",
  "storageOrder",
  "componentOrder",
  "unit",
] as const;
const RECORD_KEYS = [
  "kind",
  "format",
  "encoding",
  "recordMode",
  "recordCount",
  "schema",
] as const;
const RECORD_SCHEMA_KEYS = [
  "schemaId",
  "schemaVersion",
  "primaryKey",
  "fields",
] as const;
const RECORD_FIELD_KEYS = ["name", "type", "unit", "nullable"] as const;
const CLAIM_BOUNDARY_KEYS = [
  "rawOutputEvidenceOnly",
  "scientificEvaluationExternal",
  "scientificConclusionEncoded",
  "theoryClosureClaimAllowed",
  "physicalViabilityClaimAllowed",
  "transportClaimAllowed",
  "propulsionClaimAllowed",
  "routeEtaClaimAllowed",
  "speedClaimAllowed",
  "empiricalReceiptsRequired",
] as const;

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const IDENTIFIER = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const SCHEMA_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/;
const MEDIA_TYPE = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/;
const FORBIDDEN_DERIVED_FIELD_TOKENS = new Set([
  "authority",
  "status",
  "pass",
  "ready",
  "check",
  "checks",
  "blocker",
  "blockers",
  "verdict",
  "conclusion",
  "disposition",
  "gate",
  "admissible",
  "viable",
  "falsified",
  "success",
  "failure",
  "accepted",
  "rejected",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.trim() === value;

const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const milliseconds = Date.parse(value);
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
};

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const isExactSortedUniqueText = (values: unknown): values is string[] =>
  Array.isArray(values) &&
  values.length > 0 &&
  values.every(isText) &&
  new Set(values).size === values.length &&
  values.every(
    (value, index) =>
      index === 0 || utf8Compare(values[index - 1] as string, value) < 0,
  );

const isNonemptyUniqueText = (values: unknown): values is string[] =>
  Array.isArray(values) &&
  values.length > 0 &&
  values.every(isText) &&
  new Set(values).size === values.length;

const tokens = (value: string): string[] =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase());

const containsForbiddenDerivedToken = (value: string): boolean =>
  tokens(value).some((token) => FORBIDDEN_DERIVED_FIELD_TOKENS.has(token));

const collectForbiddenDerivedFields = (
  value: unknown,
  pointer: string,
  violations: string[],
  seen: WeakSet<object>,
): void => {
  if (value != null && typeof value === "object") {
    if (seen.has(value)) return;
    seen.add(value);
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectForbiddenDerivedFields(
        entry,
        `${pointer}/${index}`,
        violations,
        seen,
      ),
    );
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const nextPointer = `${pointer}/${key}`;
    const governedClaimBoundaryKey =
      pointer === "/claimBoundary" &&
      (CLAIM_BOUNDARY_KEYS as readonly string[]).includes(key);
    if (!governedClaimBoundaryKey && containsForbiddenDerivedToken(key)) {
      violations.push(`derived_field_forbidden:${nextPointer}`);
    }
    collectForbiddenDerivedFields(entry, nextPointer, violations, seen);
  }
};

const isIdentifier = (value: unknown): value is string =>
  typeof value === "string" && IDENTIFIER.test(value);

const isPortablePath = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    !/^[a-z0-9][a-z0-9._/-]*$/.test(value) ||
    value.includes("\\") ||
    value.startsWith("/") ||
    value.includes(":")
  ) {
    return false;
  }
  const segments = value.split("/");
  return (
    segments.length > 1 &&
    segments.every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    ) &&
    !segments.some((segment) => segment === "latest")
  );
};

const isRawPathForFamily = (
  value: unknown,
  familyId: Nhm2PrimaryRawOutputFamilyId,
): value is string =>
  isPortablePath(value) && value.startsWith(`raw/${familyId}/`);

const safeFloat64ByteCount = (shape: readonly number[]): number | null => {
  let elementCount = 1;
  for (const dimension of shape) {
    if (!Number.isSafeInteger(dimension) || dimension <= 0) return null;
    elementCount *= dimension;
    if (!Number.isSafeInteger(elementCount)) return null;
  }
  const sizeBytes = elementCount * Float64Array.BYTES_PER_ELEMENT;
  return Number.isSafeInteger(sizeBytes) ? sizeBytes : null;
};

const exactRoleNames = (familyId: Nhm2PrimaryRawOutputFamilyId): string[] =>
  Object.keys(NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES[familyId]);

const roleContentPolicy = (
  familyId: unknown,
  semanticRole: unknown,
): Nhm2PrimaryRawRoleContentPolicyV1 | null => {
  if (!isFamilyId(familyId) || typeof semanticRole !== "string") return null;
  const familyPolicies = NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES[familyId] as
    Record<string, Nhm2PrimaryRawRoleContentPolicyV1> | undefined;
  return familyPolicies?.[semanticRole] ?? null;
};

const isFamilyId = (value: unknown): value is Nhm2PrimaryRawOutputFamilyId =>
  typeof value === "string" &&
  (NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS as readonly string[]).includes(value);

const canonicalInputEntry = (
  entry: Nhm2PrimaryRawOutputHashedInputV1,
): Nhm2PrimaryRawOutputHashedInputV1 => ({
  inputId: entry.inputId,
  path: entry.path,
  sha256: entry.sha256,
  sizeBytes: entry.sizeBytes,
  mediaType: entry.mediaType,
});

export const computeNhm2PrimaryRawOutputInputClosureSha256 = (
  entries: readonly Nhm2PrimaryRawOutputHashedInputV1[],
): string =>
  createHash("sha256")
    .update("nhm2-primary-raw-output-input-closure/v1\n", "utf8")
    .update(JSON.stringify(entries.map(canonicalInputEntry)), "utf8")
    .digest("hex");

const validateInputBinding = (
  value: unknown,
  expectedInputId: string,
  entriesById: ReadonlyMap<string, Nhm2PrimaryRawOutputHashedInputV1>,
  pointer: string,
  violations: string[],
): void => {
  if (!isRecord(value) || !hasExactKeys(value, INPUT_BINDING_KEYS)) {
    violations.push(`input_binding_shape_invalid:${pointer}`);
    return;
  }
  if (value.inputId !== expectedInputId)
    violations.push(`input_binding_id_invalid:${pointer}`);
  if (!isSha256(value.sha256))
    violations.push(`input_binding_sha256_invalid:${pointer}`);
  const entry =
    typeof value.inputId === "string"
      ? entriesById.get(value.inputId)
      : undefined;
  if (entry == null) {
    violations.push(`input_binding_entry_missing:${pointer}`);
  } else if (entry.sha256 !== value.sha256) {
    violations.push(`input_binding_sha256_mismatch:${pointer}`);
  }
};

const validateNumericalRepresentation = (
  file: Record<string, unknown>,
  representation: Record<string, unknown>,
  pointer: string,
  violations: string[],
): void => {
  const contentPolicy = roleContentPolicy(
    file.familyId,
    file.semanticRole,
  ) as Nhm2PrimaryRawNumericalContentPolicyV1 | null;
  if (contentPolicy == null || contentPolicy.kind !== "numerical_array") {
    violations.push(`numerical_content_policy_missing:${pointer}`);
    return;
  }
  if (!hasExactKeys(representation, NUMERICAL_KEYS)) {
    violations.push(`numerical_representation_shape_invalid:${pointer}`);
    return;
  }
  if (
    representation.kind !== "numerical_array" ||
    representation.dtype !== "float64" ||
    representation.encoding !== "raw_ieee754" ||
    representation.endianness !== "little" ||
    representation.storageOrder !== "row-major"
  ) {
    violations.push(`numerical_encoding_invalid:${pointer}`);
  }
  const shape = Array.isArray(representation.shape) ? representation.shape : [];
  const sizeBytes = safeFloat64ByteCount(
    shape.filter((entry): entry is number => typeof entry === "number"),
  );
  if (
    shape.length !== contentPolicy.rank ||
    shape.some((entry) => !Number.isSafeInteger(entry) || Number(entry) <= 0) ||
    sizeBytes == null ||
    Number(shape[0]) < contentPolicy.minimumFirstAxis
  ) {
    violations.push(`numerical_shape_invalid:${pointer}`);
  } else if (file.sizeBytes !== sizeBytes) {
    violations.push(`numerical_size_byte_math_mismatch:${pointer}`);
  }
  const componentOrder = representation.componentOrder;
  if (
    !isNonemptyUniqueText(componentOrder) ||
    (Array.isArray(shape) &&
      Array.isArray(componentOrder) &&
      shape[shape.length - 1] !== componentOrder.length) ||
    (Array.isArray(componentOrder) &&
      componentOrder.some(
        (entry) => !isIdentifier(entry) || containsForbiddenDerivedToken(entry),
      )) ||
    !Array.isArray(componentOrder) ||
    componentOrder.length !== contentPolicy.componentOrder.length ||
    componentOrder.some(
      (entry, index) => entry !== contentPolicy.componentOrder[index],
    )
  ) {
    violations.push(`numerical_component_order_invalid:${pointer}`);
  }
  if (representation.unit !== contentPolicy.unit)
    violations.push(`numerical_unit_invalid:${pointer}`);
  if (
    file.mediaType !== "application/octet-stream" ||
    typeof file.path !== "string" ||
    !file.path.endsWith(".f64le")
  ) {
    violations.push(`numerical_file_format_invalid:${pointer}`);
  }
};

const validateRecordRepresentation = (
  file: Record<string, unknown>,
  representation: Record<string, unknown>,
  pointer: string,
  violations: string[],
): void => {
  const contentPolicy = roleContentPolicy(
    file.familyId,
    file.semanticRole,
  ) as Nhm2PrimaryRawRecordContentPolicyV1 | null;
  if (contentPolicy == null || contentPolicy.kind !== "records") {
    violations.push(`record_content_policy_missing:${pointer}`);
    return;
  }
  if (!hasExactKeys(representation, RECORD_KEYS)) {
    violations.push(`record_representation_shape_invalid:${pointer}`);
    return;
  }
  const format = representation.format;
  if (
    representation.kind !== "records" ||
    format !== contentPolicy.format ||
    representation.encoding !== "utf8" ||
    representation.recordMode !== "record-stream" ||
    !Number.isSafeInteger(representation.recordCount) ||
    Number(representation.recordCount) < contentPolicy.minimumRecordCount
  ) {
    violations.push(`record_encoding_invalid:${pointer}`);
  }
  if (
    file.mediaType !== "application/x-ndjson" ||
    typeof file.path !== "string" ||
    !file.path.endsWith(".ndjson")
  ) {
    violations.push(`record_file_format_invalid:${pointer}`);
  }
  const schema = isRecord(representation.schema) ? representation.schema : null;
  if (schema == null || !hasExactKeys(schema, RECORD_SCHEMA_KEYS)) {
    violations.push(`record_schema_shape_invalid:${pointer}`);
    return;
  }
  if (
    schema.schemaId !== contentPolicy.schemaId ||
    schema.schemaVersion !== contentPolicy.schemaVersion ||
    typeof schema.schemaVersion !== "string" ||
    !SCHEMA_VERSION.test(schema.schemaVersion)
  ) {
    violations.push(`record_schema_identity_invalid:${pointer}`);
  }
  const fields = Array.isArray(schema.fields) ? schema.fields : [];
  const fieldNames: string[] = [];
  if (fields.length === 0)
    violations.push(`record_schema_fields_empty:${pointer}`);
  for (const [fieldIndex, fieldValue] of fields.entries()) {
    const fieldPointer = `${pointer}/schema/fields/${fieldIndex}`;
    if (!isRecord(fieldValue) || !hasExactKeys(fieldValue, RECORD_FIELD_KEYS)) {
      violations.push(`record_schema_field_shape_invalid:${fieldPointer}`);
      continue;
    }
    if (!isIdentifier(fieldValue.name)) {
      violations.push(`record_schema_field_name_invalid:${fieldPointer}`);
    } else {
      fieldNames.push(fieldValue.name);
    }
    if (
      !NHM2_PRIMARY_RAW_OUTPUT_RECORD_FIELD_TYPES.includes(
        fieldValue.type as Nhm2PrimaryRawOutputRecordFieldType,
      ) ||
      (fieldValue.unit !== null && !isText(fieldValue.unit)) ||
      typeof fieldValue.nullable !== "boolean"
    ) {
      violations.push(`record_schema_field_definition_invalid:${fieldPointer}`);
    }
  }
  if (new Set(fieldNames).size !== fieldNames.length)
    violations.push(`record_schema_field_names_not_unique:${pointer}`);
  if (
    fields.length !== contentPolicy.fields.length ||
    fields.some((entry, index) => {
      const expected = contentPolicy.fields[index];
      return (
        !isRecord(entry) ||
        entry.name !== expected?.name ||
        entry.type !== expected.type ||
        entry.unit !== expected.unit ||
        entry.nullable !== expected.nullable
      );
    })
  ) {
    violations.push(`record_schema_not_frozen_policy:${pointer}`);
  }
  const primaryKey = schema.primaryKey;
  if (
    !isNonemptyUniqueText(primaryKey) ||
    !Array.isArray(primaryKey) ||
    primaryKey.some((entry) => !fieldNames.includes(entry)) ||
    primaryKey.length !== contentPolicy.primaryKey.length ||
    primaryKey.some((entry, index) => entry !== contentPolicy.primaryKey[index])
  ) {
    violations.push(`record_schema_primary_key_invalid:${pointer}`);
  } else {
    for (const key of primaryKey) {
      const field = fields.find(
        (entry) => isRecord(entry) && entry.name === key,
      ) as Record<string, unknown> | undefined;
      if (field?.nullable !== false) {
        violations.push(`record_schema_primary_key_nullable:${pointer}:${key}`);
      }
    }
  }
};

const unique = (values: string[]): string[] => [...new Set(values)];

/**
 * Returns deterministic structural violations. It never evaluates physics and
 * never accepts producer-authored scientific conclusions.
 */
export const nhm2PrimaryRawOutputManifestViolations = (
  value: unknown,
): string[] => {
  const violations: string[] = [];
  collectForbiddenDerivedFields(value, "", violations, new WeakSet<object>());
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) {
    return unique([...violations, "manifest_shape_invalid"]);
  }
  if (
    value.artifactId !== NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION ||
    !isIsoTimestamp(value.generatedAt)
  ) {
    violations.push("manifest_identity_invalid");
  }
  if (
    !isRecord(value.contentPolicy) ||
    !hasExactKeys(value.contentPolicy, [
      "artifactId",
      "contractVersion",
      "sha256",
    ]) ||
    value.contentPolicy.artifactId !==
      NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID ||
    value.contentPolicy.contractVersion !==
      NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION ||
    value.contentPolicy.sha256 !== NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256
  ) {
    violations.push("content_policy_binding_invalid");
  }

  const inputClosure = isRecord(value.inputClosure) ? value.inputClosure : null;
  const inputEntries =
    inputClosure != null && Array.isArray(inputClosure.entries)
      ? inputClosure.entries
      : [];
  const normalizedInputs: Nhm2PrimaryRawOutputHashedInputV1[] = [];
  if (
    inputClosure == null ||
    !hasExactKeys(inputClosure, INPUT_CLOSURE_KEYS) ||
    inputClosure.frozenBeforeExecution !== true ||
    inputClosure.digestAlgorithm !==
      NHM2_PRIMARY_RAW_OUTPUT_INPUT_CLOSURE_ALGORITHM ||
    inputClosure.ordering !== NHM2_PRIMARY_RAW_OUTPUT_INPUT_ORDERING
  ) {
    violations.push("input_closure_shape_invalid");
  }
  for (const [index, entryValue] of inputEntries.entries()) {
    const pointer = `/inputClosure/entries/${index}`;
    if (!isRecord(entryValue) || !hasExactKeys(entryValue, INPUT_ENTRY_KEYS)) {
      violations.push(`input_entry_shape_invalid:${pointer}`);
      continue;
    }
    if (
      !isIdentifier(entryValue.inputId) ||
      !isPortablePath(entryValue.path) ||
      !isSha256(entryValue.sha256) ||
      !Number.isSafeInteger(entryValue.sizeBytes) ||
      Number(entryValue.sizeBytes) <= 0 ||
      typeof entryValue.mediaType !== "string" ||
      !MEDIA_TYPE.test(entryValue.mediaType)
    ) {
      violations.push(`input_entry_invalid:${pointer}`);
      continue;
    }
    normalizedInputs.push(
      entryValue as unknown as Nhm2PrimaryRawOutputHashedInputV1,
    );
  }
  if (
    normalizedInputs.length !== inputEntries.length ||
    normalizedInputs.length !==
      Object.keys(NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS).length ||
    new Set(normalizedInputs.map((entry) => entry.inputId)).size !==
      normalizedInputs.length ||
    new Set(normalizedInputs.map((entry) => entry.path)).size !==
      normalizedInputs.length ||
    new Set(normalizedInputs.map((entry) => entry.sha256)).size !==
      normalizedInputs.length ||
    Object.values(NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS).some(
      (inputId) => !normalizedInputs.some((entry) => entry.inputId === inputId),
    ) ||
    normalizedInputs.some((entry) => {
      const toolchainInput = [
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.solver,
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.environment,
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.producerBundle,
      ].includes(entry.inputId as never);
      return toolchainInput
        ? !entry.path.startsWith("toolchain/")
        : !entry.path.startsWith("inputs/");
    }) ||
    normalizedInputs.some(
      (entry, index) =>
        index > 0 &&
        utf8Compare(normalizedInputs[index - 1].path, entry.path) >= 0,
    )
  ) {
    violations.push("input_entries_not_exact_sorted_unique");
  }
  if (
    inputClosure == null ||
    !isSha256(inputClosure.closureSha256) ||
    inputClosure.closureSha256 !==
      computeNhm2PrimaryRawOutputInputClosureSha256(normalizedInputs)
  ) {
    violations.push("input_closure_sha256_mismatch");
  }
  const inputsById = new Map(
    normalizedInputs.map((entry) => [entry.inputId, entry]),
  );

  const identity = isRecord(value.identity) ? value.identity : null;
  if (identity == null || !hasExactKeys(identity, IDENTITY_KEYS)) {
    violations.push("identity_shape_invalid");
  } else {
    if (
      !isIdentifier(identity.candidateId) ||
      identity.laneId !== "nhm2_shift_lapse" ||
      !isIdentifier(identity.selectedProfileId) ||
      !isIdentifier(identity.chartId)
    ) {
      violations.push("identity_values_invalid");
    }
    validateInputBinding(
      identity.candidateManifest,
      NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.candidateManifest,
      inputsById,
      "/identity/candidateManifest",
      violations,
    );
    validateInputBinding(
      identity.selectedProfile,
      NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.selectedProfile,
      inputsById,
      "/identity/selectedProfile",
      violations,
    );
    validateInputBinding(
      identity.chartDefinition,
      NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.chartDefinition,
      inputsById,
      "/identity/chartDefinition",
      violations,
    );
    validateInputBinding(
      identity.atlas,
      NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.atlas,
      inputsById,
      "/identity/atlas",
      violations,
    );
    validateInputBinding(
      identity.units,
      NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.units,
      inputsById,
      "/identity/units",
      violations,
    );
    validateInputBinding(
      identity.normalization,
      NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.normalization,
      inputsById,
      "/identity/normalization",
      violations,
    );
  }

  const execution = isRecord(value.execution) ? value.execution : null;
  if (execution == null || !hasExactKeys(execution, EXECUTION_KEYS)) {
    violations.push("execution_shape_invalid");
  } else {
    const solver = isRecord(execution.solver) ? execution.solver : null;
    const environment = isRecord(execution.environment)
      ? execution.environment
      : null;
    const producerBundle = isRecord(execution.producerBundle)
      ? execution.producerBundle
      : null;
    const invocation = isRecord(execution.invocation)
      ? execution.invocation
      : null;
    if (
      execution.planRole !== "primary_numerical" ||
      !isIdentifier(execution.requestId) ||
      !isIdentifier(execution.runId) ||
      !isIdentifier(execution.runtimeId) ||
      !isIdentifier(execution.receiptId) ||
      typeof execution.sourceCommitSha !== "string" ||
      !GIT_SHA.test(execution.sourceCommitSha) ||
      /^0+$/.test(execution.sourceCommitSha) ||
      !isText(execution.deterministicSeed) ||
      execution.exitCode !== 0 ||
      execution.terminationSignal !== null
    ) {
      violations.push("execution_values_invalid");
    }
    if (
      solver == null ||
      !hasExactKeys(solver, [
        "solverId",
        "solverVersion",
        "implementationId",
        "input",
      ]) ||
      !isIdentifier(solver.solverId) ||
      !isText(solver.solverVersion) ||
      !isIdentifier(solver.implementationId)
    ) {
      violations.push("execution_solver_invalid");
    } else {
      validateInputBinding(
        solver.input,
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.solver,
        inputsById,
        "/execution/solver/input",
        violations,
      );
    }
    if (
      environment == null ||
      !hasExactKeys(environment, ["environmentId", "input"]) ||
      !isIdentifier(environment.environmentId)
    ) {
      violations.push("execution_environment_invalid");
    } else {
      validateInputBinding(
        environment.input,
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.environment,
        inputsById,
        "/execution/environment/input",
        violations,
      );
    }
    if (
      producerBundle == null ||
      !hasExactKeys(producerBundle, ["bundleId", "input"]) ||
      !isIdentifier(producerBundle.bundleId)
    ) {
      violations.push("execution_producer_bundle_invalid");
    } else {
      validateInputBinding(
        producerBundle.input,
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.producerBundle,
        inputsById,
        "/execution/producerBundle/input",
        violations,
      );
    }
    if (
      invocation == null ||
      !hasExactKeys(invocation, ["command", "argv", "workingDirectory"]) ||
      !isText(invocation.command) ||
      !Array.isArray(invocation.argv) ||
      invocation.argv.length === 0 ||
      !invocation.argv.every(isText) ||
      !isText(invocation.workingDirectory)
    ) {
      violations.push("execution_invocation_invalid");
    }
    if (
      !isIsoTimestamp(execution.startedAt) ||
      !isIsoTimestamp(execution.completedAt) ||
      !Number.isSafeInteger(execution.durationMs) ||
      Number(execution.durationMs) <= 0 ||
      (isIsoTimestamp(execution.startedAt) &&
        isIsoTimestamp(execution.completedAt) &&
        Date.parse(execution.completedAt) - Date.parse(execution.startedAt) !==
          execution.durationMs) ||
      (isIsoTimestamp(value.generatedAt) &&
        isIsoTimestamp(execution.completedAt) &&
        Date.parse(value.generatedAt) < Date.parse(execution.completedAt))
    ) {
      violations.push("execution_interval_invalid");
    }
  }

  const familyDag = isRecord(value.familyDag) ? value.familyDag : null;
  const nodes =
    familyDag != null && Array.isArray(familyDag.nodes) ? familyDag.nodes : [];
  if (
    familyDag == null ||
    !hasExactKeys(familyDag, FAMILY_DAG_KEYS) ||
    familyDag.ordering !== NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING
  ) {
    violations.push("family_dag_shape_invalid");
  }
  const validNodes: Nhm2PrimaryRawOutputFamilyNodeV1[] = [];
  for (const [index, nodeValue] of nodes.entries()) {
    const pointer = `/familyDag/nodes/${index}`;
    if (!isRecord(nodeValue) || !hasExactKeys(nodeValue, FAMILY_NODE_KEYS)) {
      violations.push(`family_node_shape_invalid:${pointer}`);
      continue;
    }
    if (!isFamilyId(nodeValue.familyId)) {
      violations.push(`family_node_id_invalid:${pointer}`);
      continue;
    }
    const expectedFamilyId = NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS[index];
    if (nodeValue.familyId !== expectedFamilyId)
      violations.push(`family_node_order_invalid:${pointer}`);
    const expectedParents = [
      ...NHM2_PRIMARY_RAW_OUTPUT_PARENT_FAMILIES[nodeValue.familyId],
    ];
    const parentFamilyIds = Array.isArray(nodeValue.parentFamilyIds)
      ? nodeValue.parentFamilyIds
      : [];
    if (
      !Array.isArray(nodeValue.parentFamilyIds) ||
      parentFamilyIds.length !== expectedParents.length ||
      parentFamilyIds.some(
        (parent, parentIndex) => parent !== expectedParents[parentIndex],
      )
    ) {
      violations.push(`family_parent_set_invalid:${pointer}`);
    }
    const seenFamilyIds = new Set(validNodes.map((node) => node.familyId));
    if (
      !Array.isArray(nodeValue.parentFamilyIds) ||
      parentFamilyIds.some(
        (parent) => !isFamilyId(parent) || !seenFamilyIds.has(parent),
      )
    ) {
      violations.push(`family_parent_not_topological:${pointer}`);
    }
    const expectedRoles = exactRoleNames(nodeValue.familyId);
    if (
      !Array.isArray(nodeValue.semanticRoles) ||
      nodeValue.semanticRoles.length !== expectedRoles.length ||
      nodeValue.semanticRoles.some(
        (role, roleIndex) => role !== expectedRoles[roleIndex],
      )
    ) {
      violations.push(`family_semantic_roles_invalid:${pointer}`);
    }
    const fileIds = Array.isArray(nodeValue.fileIds)
      ? nodeValue.fileIds.filter(isText)
      : [];
    if (!isExactSortedUniqueText(nodeValue.fileIds))
      violations.push(`family_file_ids_invalid:${pointer}`);
    validNodes.push({
      familyId: nodeValue.familyId,
      parentFamilyIds: parentFamilyIds.filter(isFamilyId),
      semanticRoles: Array.isArray(nodeValue.semanticRoles)
        ? nodeValue.semanticRoles.filter(isText)
        : [],
      fileIds,
    });
  }
  if (
    validNodes.length !== NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS.length ||
    new Set(validNodes.map((node) => node.familyId)).size !==
      NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS.length ||
    NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS.some(
      (familyId) => !validNodes.some((node) => node.familyId === familyId),
    )
  ) {
    violations.push("family_set_not_exact");
  }

  const children = new Map<
    Nhm2PrimaryRawOutputFamilyId,
    Nhm2PrimaryRawOutputFamilyId[]
  >();
  for (const familyId of NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS)
    children.set(familyId, []);
  for (const node of validNodes) {
    for (const parent of node.parentFamilyIds) {
      if (isFamilyId(parent)) children.get(parent)?.push(node.familyId);
    }
  }
  const roots = validNodes
    .filter((node) => node.parentFamilyIds.length === 0)
    .map((node) => node.familyId);
  const reachableFamilies = new Set<Nhm2PrimaryRawOutputFamilyId>();
  const visit = (familyId: Nhm2PrimaryRawOutputFamilyId): void => {
    if (reachableFamilies.has(familyId)) return;
    reachableFamilies.add(familyId);
    for (const child of children.get(familyId) ?? []) visit(child);
  };
  roots.forEach(visit);
  if (reachableFamilies.size !== NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS.length) {
    violations.push("family_dag_not_root_reachable");
  }

  const fileInventory = isRecord(value.fileInventory)
    ? value.fileInventory
    : null;
  const files =
    fileInventory != null && Array.isArray(fileInventory.files)
      ? fileInventory.files
      : [];
  if (
    fileInventory == null ||
    !hasExactKeys(fileInventory, FILE_INVENTORY_KEYS) ||
    fileInventory.ordering !== NHM2_PRIMARY_RAW_OUTPUT_FILE_ORDERING
  ) {
    violations.push("file_inventory_shape_invalid");
  }
  const validFiles: Nhm2PrimaryRawOutputFileV1[] = [];
  for (const [index, fileValue] of files.entries()) {
    const pointer = `/fileInventory/files/${index}`;
    if (!isRecord(fileValue) || !hasExactKeys(fileValue, FILE_KEYS)) {
      violations.push(`file_shape_invalid:${pointer}`);
      continue;
    }
    if (
      !isIdentifier(fileValue.fileId) ||
      !isFamilyId(fileValue.familyId) ||
      !isIdentifier(fileValue.semanticRole) ||
      typeof fileValue.path !== "string" ||
      !isSha256(fileValue.sha256) ||
      !Number.isSafeInteger(fileValue.sizeBytes) ||
      Number(fileValue.sizeBytes) <= 0 ||
      typeof fileValue.mediaType !== "string"
    ) {
      violations.push(`file_identity_invalid:${pointer}`);
      continue;
    }
    if (!isRawPathForFamily(fileValue.path, fileValue.familyId))
      violations.push(`file_raw_path_invalid:${pointer}`);
    const rolePolicies =
      NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES[fileValue.familyId];
    const requiredKind = (rolePolicies as Record<string, string>)[
      fileValue.semanticRole
    ];
    if (requiredKind == null)
      violations.push(`file_semantic_role_invalid:${pointer}`);
    const representation = isRecord(fileValue.representation)
      ? fileValue.representation
      : null;
    if (representation == null || representation.kind !== requiredKind) {
      violations.push(`file_representation_kind_invalid:${pointer}`);
    } else if (representation.kind === "numerical_array") {
      validateNumericalRepresentation(
        fileValue,
        representation,
        pointer,
        violations,
      );
    } else if (representation.kind === "records") {
      validateRecordRepresentation(
        fileValue,
        representation,
        pointer,
        violations,
      );
    } else {
      violations.push(`file_representation_kind_invalid:${pointer}`);
    }
    validFiles.push(fileValue as unknown as Nhm2PrimaryRawOutputFileV1);
  }
  if (
    validFiles.length !== files.length ||
    validFiles.length === 0 ||
    new Set(validFiles.map((file) => file.fileId)).size !== validFiles.length ||
    new Set(validFiles.map((file) => file.path)).size !== validFiles.length ||
    new Set(validFiles.map((file) => file.sha256)).size !== validFiles.length ||
    new Set(validFiles.map((file) => `${file.familyId}:${file.semanticRole}`))
      .size !== validFiles.length ||
    validFiles.some(
      (file, index) =>
        index > 0 && utf8Compare(validFiles[index - 1].path, file.path) >= 0,
    )
  ) {
    violations.push("files_not_exact_sorted_unique");
  }
  const filesById = new Map(validFiles.map((file) => [file.fileId, file]));
  const ownedFileIds: string[] = [];
  for (const node of validNodes) {
    for (const fileId of node.fileIds) {
      ownedFileIds.push(fileId);
      const file = filesById.get(fileId);
      if (file == null) {
        violations.push(`family_file_missing:${node.familyId}:${fileId}`);
      } else if (file.familyId !== node.familyId) {
        violations.push(
          `family_file_owner_mismatch:${node.familyId}:${fileId}`,
        );
      }
    }
    for (const role of exactRoleNames(node.familyId)) {
      const matchingRoleFiles = node.fileIds.filter(
        (fileId) => filesById.get(fileId)?.semanticRole === role,
      );
      if (matchingRoleFiles.length !== 1) {
        violations.push(
          `family_semantic_role_cardinality_invalid:${node.familyId}:${role}`,
        );
      }
    }
  }
  if (
    ownedFileIds.length !== validFiles.length ||
    new Set(ownedFileIds).size !== ownedFileIds.length ||
    validFiles.some((file) => !ownedFileIds.includes(file.fileId))
  ) {
    violations.push("file_inventory_not_exactly_reachable");
  }

  const claimBoundary = isRecord(value.claimBoundary)
    ? value.claimBoundary
    : null;
  if (
    claimBoundary == null ||
    !hasExactKeys(claimBoundary, CLAIM_BOUNDARY_KEYS) ||
    claimBoundary.rawOutputEvidenceOnly !== true ||
    claimBoundary.scientificEvaluationExternal !== true ||
    claimBoundary.scientificConclusionEncoded !== false ||
    claimBoundary.theoryClosureClaimAllowed !== false ||
    claimBoundary.physicalViabilityClaimAllowed !== false ||
    claimBoundary.transportClaimAllowed !== false ||
    claimBoundary.propulsionClaimAllowed !== false ||
    claimBoundary.routeEtaClaimAllowed !== false ||
    claimBoundary.speedClaimAllowed !== false ||
    claimBoundary.empiricalReceiptsRequired !== true
  ) {
    violations.push("claim_boundary_invalid");
  }

  return unique(violations);
};

export const isNhm2PrimaryRawOutputManifest = (
  value: unknown,
): value is Nhm2PrimaryRawOutputManifestV1 =>
  nhm2PrimaryRawOutputManifestViolations(value).length === 0;
