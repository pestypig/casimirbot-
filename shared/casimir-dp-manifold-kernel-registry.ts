// math-stage: diagnostic

/**
 * Stage-3 validates the completeness and internal consistency of a proposed
 * Casimir-to-coherence bridge.  It deliberately does not calculate a bridge
 * phase/rate and registration is never treated as empirical validation.
 */

export type CasimirDpManifoldRegistryStatus =
  | "blocked"
  | "registered"
  | "rejected";

export type CasimirDpManifoldKernelSource = {
  source_id?: string;
  url?: string;
};

export type CasimirDpManifoldKernelCandidate = {
  entry_kind: "candidate";
  model_id?: string;
  version?: string;
  maturity?: "stage0_exploratory";
  proposed_scope?: string;
  sources?: CasimirDpManifoldKernelSource[];
  equation_ids?: string[];
  quantum_field_and_state?: string;
  apparatus_geometry_receipt_sha256?: string;
  stress_energy?: {
    source_kind?: "renormalized_tensor" | "scalar_pressure";
    renormalized_t_munu_prescription?: string;
    subtraction_reference_state?: string;
    frame_and_basis?: string;
    boundary_and_surface_terms?: string;
    representative_renormalized_t00_J_m3?: number;
    conservation_residual?: number;
    conservation_tolerance?: number;
    symmetry_identities_passed?: boolean;
  };
  stress_noise?: {
    tensor_noise_kernel_prescription?: string;
    covariance_ordering_convention?: string;
    covariance_is_positive_semidefinite?: boolean;
    covariance_minimum_eigenvalue?: number;
  };
  causal_response?: {
    retarded_tensor_to_metric_kernel?: string;
    is_retarded_and_causal?: boolean;
    gauge_and_coordinate_contract?: string;
    constraint_contract?: string;
    fourier_convention?: string;
    psd_sidedness?: "one_sided" | "two_sided";
    units_contract?: string;
    dimensional_closure_passed?: boolean;
  };
  matter_dynamics?: {
    metric_to_matter_coherence_equation?: string;
    evolution_kind?: "markovian" | "non_markovian";
    deterministic_phase_and_rate_are_distinct?: boolean;
    complete_positivity_passed?: boolean;
    trace_preservation_passed?: boolean;
    non_markovian_consistency_analysis?: string;
    physical_rate_produced?: boolean;
    rate_validation_value_s?: number | null;
  };
  recovery_limits?: {
    zero_coupling?: boolean;
    no_boundary_contrast?: boolean;
    weak_field?: boolean;
    standard_qed?: boolean;
    ordinary_gr?: boolean;
    standard_or_dp?: boolean;
  };
  parameter_contract?: {
    frozen_ranges_or_priors?: string;
    manifest_sha256?: string;
  };
  validity?: {
    domain_of_validity?: string;
    uncertainty_model?: string;
  };
  companion_observable?: {
    observable_id?: string;
    prediction_contract?: string;
  };
  falsifiers?: {
    experiment_internal?: string[];
    independent?: string[];
  };
  preregistered_at?: string;
  empirical_validation_claim?: boolean;
};

export type CasimirDpRejectedManifoldKernel = {
  entry_kind: "rejected";
  model_id?: string;
  version?: string;
  tested_evidence_sha256?: string[];
  rejection_criterion?: string;
  rejection_receipt_sha256?: string;
  rejected_at?: string;
};

export type CasimirDpManifoldKernelRegistryEntry =
  | CasimirDpManifoldKernelCandidate
  | CasimirDpRejectedManifoldKernel;

export type CasimirDpManifoldKernelRegistryInput = {
  schema_version: "casimir_dp_manifold_kernel_registry/1";
  registry_id: string;
  registry_version: string;
  campaign_unblinded_at: string | null;
  entries: CasimirDpManifoldKernelRegistryEntry[];
};

export type CasimirDpManifoldKernelFailure = {
  code: string;
  path: string;
  reason: string;
};

export type CasimirDpManifoldKernelEntryResult = {
  model_id: string;
  version: string;
  proposed_scope: string | null;
  status: CasimirDpManifoldRegistryStatus;
  first_failure_code: string | null;
  failures: CasimirDpManifoldKernelFailure[];
  missing_or_invalid_fields: string[];
  numerical_bridge_output: null;
  numerical_output_permission:
    | "forbidden"
    | "eligible_only_in_a_separate_source_backed_calculator";
  empirically_validated: false;
  registration_is_empirical_validation: false;
  registered_companion_observable_id: string | null;
  maximum_claim:
    | "schema_and_consistency_completeness_only"
    | "immutable_model_specific_rejection_only";
};

export type CasimirDpManifoldKernelRegistryResult = {
  schema_version: "casimir_dp_manifold_kernel_registry_result/1";
  registry_id: string;
  registry_version: string;
  status: CasimirDpManifoldRegistryStatus;
  first_failure_code: string | null;
  failures: CasimirDpManifoldKernelFailure[];
  entries: CasimirDpManifoldKernelEntryResult[];
  registered_model_ids: string[];
  rejected_model_ids: string[];
  numerical_bridge_output: null;
  registration_is_empirical_validation: false;
  claim_ceiling: "diagnostic";
};

const SHA256 = /^[a-f0-9]{64}$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validSha256(value: unknown): value is string {
  return typeof value === "string" && SHA256.test(value);
}

function validIsoInstant(value: unknown): value is string {
  return nonEmpty(value) && Number.isFinite(Date.parse(value));
}

function fail(
  code: string,
  path: string,
  reason: string,
): CasimirDpManifoldKernelFailure {
  return { code, path, reason };
}

/**
 * This array is public so the first-failure contract can be frozen by focused
 * tests and consumed by the Stage-3 receipt.
 */
export const CASIMIR_DP_MANIFOLD_KERNEL_FIRST_FAILURE_ORDER = [
  "MK_MODEL_ID_MISSING",
  "MK_VERSION_MISSING",
  "MK_MATURITY_INVALID",
  "MK_SCOPE_MISSING",
  "MK_SOURCES_MISSING",
  "MK_EQUATIONS_MISSING",
  "MK_FIELD_STATE_MISSING",
  "MK_GEOMETRY_RECEIPT_INVALID",
  "MK_SOURCE_MUST_BE_RENORMALIZED_TENSOR",
  "MK_RENORMALIZATION_MISSING",
  "MK_REFERENCE_STATE_MISSING",
  "MK_FRAME_MISSING",
  "MK_BOUNDARY_TERMS_MISSING",
  "MK_NOISE_KERNEL_MISSING",
  "MK_NOISE_ORDERING_MISSING",
  "MK_CAUSAL_RESPONSE_MISSING",
  "MK_RESPONSE_NOT_CAUSAL",
  "MK_GAUGE_CONTRACT_MISSING",
  "MK_CONSTRAINT_CONTRACT_MISSING",
  "MK_FOURIER_CONVENTION_MISSING",
  "MK_PSD_CONVENTION_MISSING",
  "MK_UNITS_MISSING",
  "MK_DIMENSIONAL_CLOSURE_FAILED",
  "MK_CONSERVATION_CONTRACT_INVALID",
  "MK_SYMMETRY_IDENTITIES_FAILED",
  "MK_NOISE_COVARIANCE_NOT_PSD",
  "MK_MATTER_DYNAMICS_MISSING",
  "MK_PHASE_RATE_DISTINCTION_MISSING",
  "MK_MARKOVIAN_DYNAMICS_NOT_CPTP",
  "MK_NON_MARKOVIAN_ANALYSIS_MISSING",
  "MK_NEGATIVE_PHYSICAL_RATE",
  "MK_RECOVERY_LIMIT_MISSING",
  "MK_PARAMETER_CONTRACT_MISSING",
  "MK_PARAMETER_MANIFEST_INVALID",
  "MK_VALIDITY_DOMAIN_MISSING",
  "MK_UNCERTAINTY_MODEL_MISSING",
  "MK_COMPANION_OBSERVABLE_MISSING",
  "MK_INTERNAL_FALSIFIER_MISSING",
  "MK_INDEPENDENT_FALSIFIER_MISSING",
  "MK_PREREGISTRATION_TIME_INVALID",
  "MK_REGISTRATION_AFTER_UNBLINDING",
  "MK_REGISTRATION_IS_NOT_EMPIRICAL_VALIDATION",
] as const;

export const CASIMIR_DP_MANIFOLD_REGISTRY_FIRST_FAILURE_ORDER = [
  "MK_REGISTRY_SCHEMA_VERSION_INVALID",
  "MK_REGISTRY_ID_MISSING",
  "MK_REGISTRY_VERSION_MISSING",
  "MK_CAMPAIGN_UNBLINDING_TIME_INVALID",
  "MK_ENTRIES_MISSING",
] as const;

function registryFailures(
  input: CasimirDpManifoldKernelRegistryInput,
): CasimirDpManifoldKernelFailure[] {
  const failures: CasimirDpManifoldKernelFailure[] = [];
  if (input.schema_version !== "casimir_dp_manifold_kernel_registry/1") {
    failures.push(
      fail(
        "MK_REGISTRY_SCHEMA_VERSION_INVALID",
        "schema_version",
        "The manifold-kernel registry schema version is invalid.",
      ),
    );
  }
  if (!nonEmpty(input.registry_id)) {
    failures.push(
      fail(
        "MK_REGISTRY_ID_MISSING",
        "registry_id",
        "A stable registry id is required.",
      ),
    );
  }
  if (!nonEmpty(input.registry_version)) {
    failures.push(
      fail(
        "MK_REGISTRY_VERSION_MISSING",
        "registry_version",
        "A stable registry version is required.",
      ),
    );
  }
  if (
    input.campaign_unblinded_at !== null &&
    !validIsoInstant(input.campaign_unblinded_at)
  ) {
    failures.push(
      fail(
        "MK_CAMPAIGN_UNBLINDING_TIME_INVALID",
        "campaign_unblinded_at",
        "The campaign-unblinding timestamp must be null or a valid instant.",
      ),
    );
  }
  if (!Array.isArray(input.entries) || input.entries.length === 0) {
    failures.push(
      fail(
        "MK_ENTRIES_MISSING",
        "entries",
        "The registry must contain at least one candidate or preserved rejection.",
      ),
    );
  }
  return failures;
}

function candidateFailures(
  entry: CasimirDpManifoldKernelCandidate,
  campaignUnblindedAt: string | null,
): CasimirDpManifoldKernelFailure[] {
  const failures: CasimirDpManifoldKernelFailure[] = [];
  const pushIf = (
    condition: boolean,
    code: string,
    path: string,
    reason: string,
  ) => {
    if (condition) failures.push(fail(code, path, reason));
  };

  pushIf(!nonEmpty(entry.model_id), "MK_MODEL_ID_MISSING", "model_id", "A stable model id is required.");
  pushIf(!nonEmpty(entry.version), "MK_VERSION_MISSING", "version", "A stable model version is required.");
  pushIf(entry.maturity !== "stage0_exploratory", "MK_MATURITY_INVALID", "maturity", "A candidate bridge remains Stage 0 exploratory.");
  pushIf(!nonEmpty(entry.proposed_scope), "MK_SCOPE_MISSING", "proposed_scope", "The proposed scope is required.");
  pushIf(
    !Array.isArray(entry.sources) ||
      entry.sources.length === 0 ||
      entry.sources.some((source) => !nonEmpty(source.source_id) || !nonEmpty(source.url)),
    "MK_SOURCES_MISSING",
    "sources",
    "At least one stable, fully identified source is required.",
  );
  pushIf(
    !Array.isArray(entry.equation_ids) ||
      entry.equation_ids.length === 0 ||
      entry.equation_ids.some((id) => !nonEmpty(id)),
    "MK_EQUATIONS_MISSING",
    "equation_ids",
    "Source equation identifiers are required.",
  );
  pushIf(!nonEmpty(entry.quantum_field_and_state), "MK_FIELD_STATE_MISSING", "quantum_field_and_state", "The quantum field and state are required.");
  pushIf(
    !validSha256(entry.apparatus_geometry_receipt_sha256),
    "MK_GEOMETRY_RECEIPT_INVALID",
    "apparatus_geometry_receipt_sha256",
    "A SHA-256 apparatus-geometry receipt is required.",
  );
  pushIf(
    entry.stress_energy?.source_kind !== "renormalized_tensor",
    "MK_SOURCE_MUST_BE_RENORMALIZED_TENSOR",
    "stress_energy.source_kind",
    "Scalar pressure or scalar energy density cannot replace a renormalized tensor source.",
  );
  pushIf(
    !nonEmpty(entry.stress_energy?.renormalized_t_munu_prescription),
    "MK_RENORMALIZATION_MISSING",
    "stress_energy.renormalized_t_munu_prescription",
    "The renormalized T_munu prescription is required.",
  );
  pushIf(
    !nonEmpty(entry.stress_energy?.subtraction_reference_state),
    "MK_REFERENCE_STATE_MISSING",
    "stress_energy.subtraction_reference_state",
    "The subtraction/reference state is required.",
  );
  pushIf(
    !nonEmpty(entry.stress_energy?.frame_and_basis),
    "MK_FRAME_MISSING",
    "stress_energy.frame_and_basis",
    "The frame and tensor basis are required.",
  );
  pushIf(
    !nonEmpty(entry.stress_energy?.boundary_and_surface_terms),
    "MK_BOUNDARY_TERMS_MISSING",
    "stress_energy.boundary_and_surface_terms",
    "Boundary and surface terms are required.",
  );
  pushIf(
    !nonEmpty(entry.stress_noise?.tensor_noise_kernel_prescription),
    "MK_NOISE_KERNEL_MISSING",
    "stress_noise.tensor_noise_kernel_prescription",
    "A tensor stress-noise kernel is required.",
  );
  pushIf(
    !nonEmpty(entry.stress_noise?.covariance_ordering_convention),
    "MK_NOISE_ORDERING_MISSING",
    "stress_noise.covariance_ordering_convention",
    "The covariance/operator ordering convention is required.",
  );
  pushIf(
    !nonEmpty(entry.causal_response?.retarded_tensor_to_metric_kernel),
    "MK_CAUSAL_RESPONSE_MISSING",
    "causal_response.retarded_tensor_to_metric_kernel",
    "A retarded tensor-to-metric response kernel is required.",
  );
  pushIf(
    entry.causal_response?.is_retarded_and_causal !== true,
    "MK_RESPONSE_NOT_CAUSAL",
    "causal_response.is_retarded_and_causal",
    "The response must be explicitly retarded and causal.",
  );
  pushIf(
    !nonEmpty(entry.causal_response?.gauge_and_coordinate_contract),
    "MK_GAUGE_CONTRACT_MISSING",
    "causal_response.gauge_and_coordinate_contract",
    "A gauge and coordinate contract is required.",
  );
  pushIf(
    !nonEmpty(entry.causal_response?.constraint_contract),
    "MK_CONSTRAINT_CONTRACT_MISSING",
    "causal_response.constraint_contract",
    "A gravitational constraint contract is required.",
  );
  pushIf(
    !nonEmpty(entry.causal_response?.fourier_convention),
    "MK_FOURIER_CONVENTION_MISSING",
    "causal_response.fourier_convention",
    "The Fourier/angular-frequency convention is required.",
  );
  pushIf(
    entry.causal_response?.psd_sidedness !== "one_sided" &&
      entry.causal_response?.psd_sidedness !== "two_sided",
    "MK_PSD_CONVENTION_MISSING",
    "causal_response.psd_sidedness",
    "A one- or two-sided PSD convention is required.",
  );
  pushIf(
    !nonEmpty(entry.causal_response?.units_contract),
    "MK_UNITS_MISSING",
    "causal_response.units_contract",
    "A complete units contract is required.",
  );
  pushIf(
    entry.causal_response?.dimensional_closure_passed !== true,
    "MK_DIMENSIONAL_CLOSURE_FAILED",
    "causal_response.dimensional_closure_passed",
    "The tensor-response and matter-dynamics chain must close dimensionally.",
  );

  const residual = entry.stress_energy?.conservation_residual;
  const tolerance = entry.stress_energy?.conservation_tolerance;
  pushIf(
    typeof residual !== "number" ||
      !Number.isFinite(residual) ||
      residual < 0 ||
      typeof tolerance !== "number" ||
      !Number.isFinite(tolerance) ||
      tolerance < 0 ||
      residual > tolerance,
    "MK_CONSERVATION_CONTRACT_INVALID",
    "stress_energy.conservation_residual",
    "The declared conservation residual must be finite, nonnegative, and within tolerance.",
  );
  pushIf(
    entry.stress_energy?.symmetry_identities_passed !== true,
    "MK_SYMMETRY_IDENTITIES_FAILED",
    "stress_energy.symmetry_identities_passed",
    "Required tensor symmetry identities must pass.",
  );
  pushIf(
    entry.stress_noise?.covariance_is_positive_semidefinite !== true ||
      typeof entry.stress_noise?.covariance_minimum_eigenvalue !== "number" ||
      !Number.isFinite(entry.stress_noise.covariance_minimum_eigenvalue) ||
      entry.stress_noise.covariance_minimum_eigenvalue < 0,
    "MK_NOISE_COVARIANCE_NOT_PSD",
    "stress_noise.covariance_is_positive_semidefinite",
    "The stress-noise covariance must be positive semidefinite; signed renormalized T00 is not restricted by this condition.",
  );
  pushIf(
    !nonEmpty(entry.matter_dynamics?.metric_to_matter_coherence_equation) ||
      (entry.matter_dynamics?.evolution_kind !== "markovian" &&
        entry.matter_dynamics?.evolution_kind !== "non_markovian"),
    "MK_MATTER_DYNAMICS_MISSING",
    "matter_dynamics.metric_to_matter_coherence_equation",
    "Source-backed metric-to-matter/coherence dynamics are required.",
  );
  pushIf(
    entry.matter_dynamics?.deterministic_phase_and_rate_are_distinct !== true,
    "MK_PHASE_RATE_DISTINCTION_MISSING",
    "matter_dynamics.deterministic_phase_and_rate_are_distinct",
    "Deterministic phase and stochastic/nonunitary rate must be distinguished.",
  );
  if (entry.matter_dynamics?.evolution_kind === "markovian") {
    pushIf(
      entry.matter_dynamics.complete_positivity_passed !== true ||
        entry.matter_dynamics.trace_preservation_passed !== true,
      "MK_MARKOVIAN_DYNAMICS_NOT_CPTP",
      "matter_dynamics",
      "A Markovian generator must pass complete-positivity and trace-preservation checks.",
    );
  }
  if (entry.matter_dynamics?.evolution_kind === "non_markovian") {
    pushIf(
      !nonEmpty(entry.matter_dynamics.non_markovian_consistency_analysis),
      "MK_NON_MARKOVIAN_ANALYSIS_MISSING",
      "matter_dynamics.non_markovian_consistency_analysis",
      "A source-backed non-Markovian consistency analysis is required.",
    );
  }
  if (entry.matter_dynamics?.physical_rate_produced === true) {
    pushIf(
      typeof entry.matter_dynamics.rate_validation_value_s !== "number" ||
        !Number.isFinite(entry.matter_dynamics.rate_validation_value_s) ||
        entry.matter_dynamics.rate_validation_value_s < 0,
      "MK_NEGATIVE_PHYSICAL_RATE",
      "matter_dynamics.rate_validation_value_s",
      "A produced physical rate must be finite and nonnegative.",
    );
  }

  const limits = entry.recovery_limits;
  pushIf(
    limits?.zero_coupling !== true ||
      limits.no_boundary_contrast !== true ||
      limits.weak_field !== true ||
      limits.standard_qed !== true ||
      limits.ordinary_gr !== true ||
      limits.standard_or_dp !== true,
    "MK_RECOVERY_LIMIT_MISSING",
    "recovery_limits",
    "Every zero/null and standard-theory recovery limit must pass.",
  );
  pushIf(
    !nonEmpty(entry.parameter_contract?.frozen_ranges_or_priors),
    "MK_PARAMETER_CONTRACT_MISSING",
    "parameter_contract.frozen_ranges_or_priors",
    "Frozen parameter ranges or priors are required.",
  );
  pushIf(
    !validSha256(entry.parameter_contract?.manifest_sha256),
    "MK_PARAMETER_MANIFEST_INVALID",
    "parameter_contract.manifest_sha256",
    "The frozen parameter manifest requires a SHA-256 receipt.",
  );
  pushIf(
    !nonEmpty(entry.validity?.domain_of_validity),
    "MK_VALIDITY_DOMAIN_MISSING",
    "validity.domain_of_validity",
    "The domain of validity is required.",
  );
  pushIf(
    !nonEmpty(entry.validity?.uncertainty_model),
    "MK_UNCERTAINTY_MODEL_MISSING",
    "validity.uncertainty_model",
    "An uncertainty model is required.",
  );
  pushIf(
    !nonEmpty(entry.companion_observable?.observable_id) ||
      !nonEmpty(entry.companion_observable?.prediction_contract),
    "MK_COMPANION_OBSERVABLE_MISSING",
    "companion_observable",
    "An independent companion observable and prediction contract are required.",
  );
  pushIf(
    !Array.isArray(entry.falsifiers?.experiment_internal) ||
      entry.falsifiers.experiment_internal.length === 0 ||
      entry.falsifiers.experiment_internal.some((item) => !nonEmpty(item)),
    "MK_INTERNAL_FALSIFIER_MISSING",
    "falsifiers.experiment_internal",
    "At least one experiment-internal falsifier is required.",
  );
  pushIf(
    !Array.isArray(entry.falsifiers?.independent) ||
      entry.falsifiers.independent.length === 0 ||
      entry.falsifiers.independent.some((item) => !nonEmpty(item)),
    "MK_INDEPENDENT_FALSIFIER_MISSING",
    "falsifiers.independent",
    "At least one independent falsifier is required.",
  );
  pushIf(
    !validIsoInstant(entry.preregistered_at),
    "MK_PREREGISTRATION_TIME_INVALID",
    "preregistered_at",
    "A valid preregistration timestamp is required.",
  );
  if (
    validIsoInstant(entry.preregistered_at) &&
    validIsoInstant(campaignUnblindedAt)
  ) {
    pushIf(
      Date.parse(entry.preregistered_at) >= Date.parse(campaignUnblindedAt),
      "MK_REGISTRATION_AFTER_UNBLINDING",
      "preregistered_at",
      "Registration must precede custodian unblinding.",
    );
  }
  pushIf(
    entry.empirical_validation_claim === true,
    "MK_REGISTRATION_IS_NOT_EMPIRICAL_VALIDATION",
    "empirical_validation_claim",
    "Schema registration is not empirical validation.",
  );

  const order = new Map(
    CASIMIR_DP_MANIFOLD_KERNEL_FIRST_FAILURE_ORDER.map((code, index) => [
      code,
      index,
    ]),
  );
  return failures.sort(
    (left, right) =>
      (order.get(left.code as (typeof CASIMIR_DP_MANIFOLD_KERNEL_FIRST_FAILURE_ORDER)[number]) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.code as (typeof CASIMIR_DP_MANIFOLD_KERNEL_FIRST_FAILURE_ORDER)[number]) ?? Number.MAX_SAFE_INTEGER),
  );
}

function rejectionFailures(
  entry: CasimirDpRejectedManifoldKernel,
): CasimirDpManifoldKernelFailure[] {
  const failures: CasimirDpManifoldKernelFailure[] = [];
  if (!nonEmpty(entry.model_id)) {
    failures.push(fail("MK_MODEL_ID_MISSING", "model_id", "A rejected entry must preserve its model id."));
  }
  if (!nonEmpty(entry.version)) {
    failures.push(fail("MK_VERSION_MISSING", "version", "A rejected entry must preserve its version."));
  }
  if (
    !Array.isArray(entry.tested_evidence_sha256) ||
    entry.tested_evidence_sha256.length === 0 ||
    entry.tested_evidence_sha256.some((hash) => !validSha256(hash))
  ) {
    failures.push(fail("MK_REJECTION_EVIDENCE_INVALID", "tested_evidence_sha256", "Rejected entries require immutable tested-evidence hashes."));
  }
  if (!nonEmpty(entry.rejection_criterion)) {
    failures.push(fail("MK_REJECTION_CRITERION_MISSING", "rejection_criterion", "Rejected entries require the frozen rejection criterion."));
  }
  if (!validSha256(entry.rejection_receipt_sha256)) {
    failures.push(fail("MK_REJECTION_RECEIPT_INVALID", "rejection_receipt_sha256", "Rejected entries require an immutable receipt hash."));
  }
  if (!validIsoInstant(entry.rejected_at)) {
    failures.push(fail("MK_REJECTION_TIME_INVALID", "rejected_at", "Rejected entries require a valid rejection timestamp."));
  }
  return failures;
}

function blockedResult(
  entry: CasimirDpManifoldKernelRegistryEntry,
  failures: CasimirDpManifoldKernelFailure[],
): CasimirDpManifoldKernelEntryResult {
  return {
    model_id: nonEmpty(entry.model_id) ? entry.model_id : "unidentified_model",
    version: nonEmpty(entry.version) ? entry.version : "unversioned",
    proposed_scope:
      entry.entry_kind === "candidate" && nonEmpty(entry.proposed_scope)
        ? entry.proposed_scope
        : null,
    status: "blocked",
    first_failure_code: failures[0]?.code ?? "MK_UNKNOWN_BLOCKER",
    failures,
    missing_or_invalid_fields: failures.map((failure) => failure.path),
    numerical_bridge_output: null,
    numerical_output_permission: "forbidden",
    empirically_validated: false,
    registration_is_empirical_validation: false,
    registered_companion_observable_id: null,
    maximum_claim: "schema_and_consistency_completeness_only",
  };
}

export function evaluateCasimirDpManifoldKernelRegistry(
  input: CasimirDpManifoldKernelRegistryInput,
): CasimirDpManifoldKernelRegistryResult {
  const registryProblems = registryFailures(input);
  if (registryProblems.length > 0) {
    return {
      schema_version: "casimir_dp_manifold_kernel_registry_result/1",
      registry_id: nonEmpty(input.registry_id)
        ? input.registry_id
        : "unidentified_registry",
      registry_version: nonEmpty(input.registry_version)
        ? input.registry_version
        : "unversioned",
      status: "blocked",
      first_failure_code: registryProblems[0].code,
      failures: registryProblems,
      entries: [],
      registered_model_ids: [],
      rejected_model_ids: [],
      numerical_bridge_output: null,
      registration_is_empirical_validation: false,
      claim_ceiling: "diagnostic",
    };
  }

  const rejectedIds = new Set(
    input.entries
      .filter((entry): entry is CasimirDpRejectedManifoldKernel => entry.entry_kind === "rejected")
      .map((entry) => entry.model_id)
      .filter(nonEmpty),
  );
  const activeIdentityCounts = new Map<string, number>();
  for (const entry of input.entries) {
    if (
      entry.entry_kind !== "candidate" ||
      !nonEmpty(entry.model_id) ||
      !nonEmpty(entry.version)
    ) {
      continue;
    }
    const identity = `${entry.model_id}@${entry.version}`;
    activeIdentityCounts.set(identity, (activeIdentityCounts.get(identity) ?? 0) + 1);
  }

  const results = input.entries.map((entry): CasimirDpManifoldKernelEntryResult => {
    if (entry.entry_kind === "rejected") {
      const failures = rejectionFailures(entry);
      if (failures.length > 0) return blockedResult(entry, failures);
      return {
        model_id: entry.model_id!,
        version: entry.version!,
        proposed_scope: null,
        status: "rejected",
        first_failure_code: null,
        failures: [],
        missing_or_invalid_fields: [],
        numerical_bridge_output: null,
        numerical_output_permission: "forbidden",
        empirically_validated: false,
        registration_is_empirical_validation: false,
        registered_companion_observable_id: null,
        maximum_claim: "immutable_model_specific_rejection_only",
      };
    }

    if (nonEmpty(entry.model_id) && rejectedIds.has(entry.model_id)) {
      return blockedResult(entry, [
        fail(
          "MK_REJECTED_ID_REENTRY",
          "model_id",
          "A rejected model id cannot be re-entered with changed parameters; use a new id and preserve the rejection.",
        ),
      ]);
    }
    const identity = `${entry.model_id ?? ""}@${entry.version ?? ""}`;
    if ((activeIdentityCounts.get(identity) ?? 0) > 1) {
      return blockedResult(entry, [
        fail(
          "MK_DUPLICATE_ACTIVE_IDENTITY",
          "model_id",
          "A model id/version may have only one active registry entry.",
        ),
      ]);
    }

    const failures = candidateFailures(entry, input.campaign_unblinded_at);
    if (failures.length > 0) return blockedResult(entry, failures);
    return {
      model_id: entry.model_id!,
      version: entry.version!,
      proposed_scope: entry.proposed_scope!,
      status: "registered",
      first_failure_code: null,
      failures: [],
      missing_or_invalid_fields: [],
      numerical_bridge_output: null,
      numerical_output_permission:
        "eligible_only_in_a_separate_source_backed_calculator",
      empirically_validated: false,
      registration_is_empirical_validation: false,
      registered_companion_observable_id:
        entry.companion_observable!.observable_id!,
      maximum_claim: "schema_and_consistency_completeness_only",
    };
  });

  const firstBlocked = results.find((entry) => entry.status === "blocked");
  const status: CasimirDpManifoldRegistryStatus = firstBlocked
    ? "blocked"
    : results.some((entry) => entry.status === "registered")
      ? "registered"
      : "rejected";
  return {
    schema_version: "casimir_dp_manifold_kernel_registry_result/1",
    registry_id: input.registry_id,
    registry_version: input.registry_version,
    status,
    first_failure_code: firstBlocked?.first_failure_code ?? null,
    failures: firstBlocked?.failures ?? [],
    entries: results,
    registered_model_ids: results
      .filter((entry) => entry.status === "registered")
      .map((entry) => entry.model_id),
    rejected_model_ids: results
      .filter((entry) => entry.status === "rejected")
      .map((entry) => entry.model_id),
    numerical_bridge_output: null,
    registration_is_empirical_validation: false,
    claim_ceiling: "diagnostic",
  };
}

export function preflightCasimirDpManifoldBridge(
  input: CasimirDpManifoldKernelRegistryInput,
  modelId: string,
): CasimirDpManifoldKernelEntryResult {
  const result = evaluateCasimirDpManifoldKernelRegistry(input);
  const match = result.entries.find((entry) => entry.model_id === modelId);
  if (match) return match;
  if (result.first_failure_code != null && result.entries.length === 0) {
    return {
      model_id: modelId,
      version: "unversioned",
      proposed_scope: null,
      status: "blocked",
      first_failure_code: result.first_failure_code,
      failures: result.failures,
      missing_or_invalid_fields: result.failures.map(
        (failure) => failure.path,
      ),
      numerical_bridge_output: null,
      numerical_output_permission: "forbidden",
      empirically_validated: false,
      registration_is_empirical_validation: false,
      registered_companion_observable_id: null,
      maximum_claim: "schema_and_consistency_completeness_only",
    };
  }
  return {
    model_id: modelId,
    version: "unversioned",
    proposed_scope: null,
    status: "blocked",
    first_failure_code: "MK_MODEL_NOT_IN_REGISTRY",
    failures: [
      fail(
        "MK_MODEL_NOT_IN_REGISTRY",
        "entries",
        "The requested bridge model is absent from the supplied registry.",
      ),
    ],
    missing_or_invalid_fields: ["entries"],
    numerical_bridge_output: null,
    numerical_output_permission: "forbidden",
    empirically_validated: false,
    registration_is_empirical_validation: false,
    registered_companion_observable_id: null,
    maximum_claim: "schema_and_consistency_completeness_only",
  };
}
