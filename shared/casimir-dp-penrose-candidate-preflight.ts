// math-stage: diagnostic

import {
  preflightCasimirDpManifoldBridge,
  type CasimirDpManifoldKernelEntryResult,
  type CasimirDpManifoldKernelRegistryInput,
} from "./casimir-dp-manifold-kernel-registry";
import {
  enumeratePenroseCandidateObligations,
  PENROSE_CANDIDATE_REQUIRED_NONBRIDGES,
  PENROSE_RELATIONAL_CANDIDATE_FORMAL_RELATIONS,
} from "./casimir-dp-penrose-candidate-theory-stage0";
import type { CasimirDpPenroseCandidateTheoryStage0Config } from
  "./contracts/casimir-dp-penrose-candidate-theory-stage0.v1";

export type PenroseCandidateAuthorityIntegrity = {
  role: string;
  path: string;
  expected_sha256: string;
  actual_sha256: string | null;
  gate: "pass" | "not_ready";
};

export type PenroseCandidateFailure = {
  code: string;
  path: string;
  reason: string;
};

export type PenroseCandidatePreflightResult = {
  schema_version: "casimir_dp_penrose_candidate_preflight_result/1";
  campaign_id: string;
  candidate_id: string;
  candidate_version: string;
  candidate_status: "blocked" | "definition_complete_not_validated";
  maturity: "stage0_exploratory";
  first_failure_code: string | null;
  failures: PenroseCandidateFailure[];
  authority_integrity: PenroseCandidateAuthorityIntegrity[];
  registered_content: {
    penrose_lifetime_relation: "heuristic_relation_only";
    branch_geometry_dynamics: "blocked" | "formally_defined_not_validated";
    boundary_policy: "boundary_independent" | "registered_extension";
    fixed_branch_boundary_null: boolean;
  };
  formal_relations: typeof PENROSE_RELATIONAL_CANDIDATE_FORMAL_RELATIONS;
  symbolic_prediction_ledger: Array<{
    prediction_id: string;
    status: "registered_heuristic" | "blocked" | "registered_null";
    numerical_value: null;
    maximum_claim: string;
  }>;
  boundary_registry_preflight: CasimirDpManifoldKernelEntryResult | null;
  outcome_map: CasimirDpPenroseCandidateTheoryStage0Config["outcome_map"];
  falsifiers: CasimirDpPenroseCandidateTheoryStage0Config["falsifiers"];
  nonbridges: CasimirDpPenroseCandidateTheoryStage0Config["nonbridges"];
  numerical_output: null;
  numerical_prediction_permission:
    "forbidden_pending_separate_source_backed_calculator";
  model_comparison_admission: false;
  empirically_validated: false;
  registration_is_empirical_validation: false;
  final_gates: CasimirDpPenroseCandidateTheoryStage0Config["final_status_policy"];
  claim_ceiling: "formal_candidate_definition_only";
};

function requirementFailure(args: {
  code: string;
  path: string;
  label: string;
  status: "supplied" | "missing" | "justified_null";
  specification: string | null;
  sourceIds: string[];
  equationIds: string[];
  allowJustifiedNull?: boolean;
}): PenroseCandidateFailure | null {
  const acceptedStatus =
    args.status === "supplied" ||
    (args.allowJustifiedNull === true && args.status === "justified_null");
  if (
    acceptedStatus &&
    args.specification != null &&
    args.specification.trim().length > 0 &&
    args.sourceIds.length > 0 &&
    args.equationIds.length > 0
  ) {
    return null;
  }
  return {
    code: args.code,
    path: args.path,
    reason: `The candidate lacks ${args.label}.`,
  };
}

export function evaluateCasimirDpPenroseCandidatePreflight(args: {
  config: CasimirDpPenroseCandidateTheoryStage0Config;
  authorityIntegrity: PenroseCandidateAuthorityIntegrity[];
  boundaryRegistry?: CasimirDpManifoldKernelRegistryInput | null;
}): PenroseCandidatePreflightResult {
  const { config } = args;
  const failures: PenroseCandidateFailure[] = [];

  const authorityFailure = args.authorityIntegrity.find(
    (row) => row.gate !== "pass",
  );
  if (authorityFailure != null) {
    failures.push({
      code: "PCT_AUTHORITY_INTEGRITY_FAILED",
      path: authorityFailure.path,
      reason: `Upstream authority ${authorityFailure.role} is missing or has a hash mismatch.`,
    });
  }

  if (
    config.candidate_id !== "penrose_relational_branch_incompatibility_v0" ||
    config.candidate_version !== "0.1.0" ||
    config.maturity !== "stage0_exploratory"
  ) {
    failures.push({
      code: "PCT_IDENTITY_INVALID",
      path: "candidate_id",
      reason: "The frozen candidate identity or Stage-0 maturity is invalid.",
    });
  }

  for (const obligation of enumeratePenroseCandidateObligations(config)) {
    const failure = requirementFailure({
      code: obligation.code,
      path: obligation.path,
      label: obligation.label,
      status: obligation.requirement.status,
      specification: obligation.requirement.specification,
      sourceIds: obligation.requirement.source_ids,
      equationIds: obligation.requirement.equation_ids,
      allowJustifiedNull:
        obligation.code === "PCT_COMPANION_OR_JUSTIFIED_NULL_MISSING",
    });
    if (failure != null) failures.push(failure);
  }

  if (config.dynamics.phase_and_contraction_separated !== true) {
    failures.push({
      code: "PCT_PHASE_RATE_SEPARATION_MISSING",
      path: "dynamics.phase_and_contraction_separated",
      reason: "Hamiltonian phase and intrinsic contraction must remain separate.",
    });
  }
  if (config.dynamics.kind === "markovian") {
    const requirement = config.dynamics.markovian_cptp_contract;
    const failure = requirementFailure({
      code: "PCT_MARKOVIAN_CPTP_CONTRACT_MISSING",
      path: "dynamics.markovian_cptp_contract",
      label: "a Markovian CPTP and trace-preservation proof",
      status: requirement.status,
      specification: requirement.specification,
      sourceIds: requirement.source_ids,
      equationIds: requirement.equation_ids,
    });
    if (failure != null) failures.push(failure);
  }
  if (config.dynamics.kind === "non_markovian") {
    const requirement = config.dynamics.non_markovian_consistency_contract;
    const failure = requirementFailure({
      code: "PCT_NON_MARKOVIAN_CONSISTENCY_MISSING",
      path: "dynamics.non_markovian_consistency_contract",
      label: "a non-Markovian consistency and no-signalling analysis",
      status: requirement.status,
      specification: requirement.specification,
      sourceIds: requirement.source_ids,
      equationIds: requirement.equation_ids,
    });
    if (failure != null) failures.push(failure);
  }

  const recoveryLimits = Object.values(config.consistency.recovery_limits);
  if (recoveryLimits.some((value) => value !== true)) {
    failures.push({
      code: "PCT_RECOVERY_LIMITS_MISSING",
      path: "consistency.recovery_limits",
      reason: "Every declared zero, ordinary-theory, and Newtonian recovery limit must pass.",
    });
  }

  if (config.falsifiers.length < 8) {
    failures.push({
      code: "PCT_FALSIFIERS_MISSING",
      path: "falsifiers",
      reason: "The candidate requires frozen internal, experimental, and independent falsifiers.",
    });
  }

  const presentNonbridges = new Set(
    config.nonbridges.map((entry) => entry.nonbridge_id),
  );
  if (
    PENROSE_CANDIDATE_REQUIRED_NONBRIDGES.some(
      (id) => !presentNonbridges.has(id),
    )
  ) {
    failures.push({
      code: "PCT_NONBRIDGE_LEDGER_INCOMPLETE",
      path: "nonbridges",
      reason: "The semantic nonbridge ledger is incomplete.",
    });
  }

  let boundaryRegistryPreflight: CasimirDpManifoldKernelEntryResult | null =
    null;
  if (config.boundary_policy.mode === "boundary_independent") {
    if (
      config.boundary_policy.fixed_branch_difference_null !== true ||
      config.boundary_policy.extension_model_id !== null ||
      config.boundary_policy.manifold_registry_fixture_path !== null ||
      config.boundary_policy.manifold_registry_fixture_sha256 !== null
    ) {
      failures.push({
        code: "PCT_BOUNDARY_INDEPENDENT_POLICY_INVALID",
        path: "boundary_policy",
        reason: "The boundary-independent candidate must preserve the fixed-branch null and declare no extension.",
      });
    }
  } else {
    if (
      config.boundary_policy.extension_model_id == null ||
      args.boundaryRegistry == null
    ) {
      failures.push({
        code: "PCT_BOUNDARY_REGISTRY_MISSING",
        path: "boundary_policy.manifold_registry_fixture_path",
        reason: "A boundary extension must supply an existing manifold-registry entry.",
      });
    } else {
      boundaryRegistryPreflight = preflightCasimirDpManifoldBridge(
        args.boundaryRegistry,
        config.boundary_policy.extension_model_id,
      );
      if (boundaryRegistryPreflight.status !== "registered") {
        failures.push({
          code:
            boundaryRegistryPreflight.first_failure_code ??
            "PCT_BOUNDARY_REGISTRY_BLOCKED",
          path: "boundary_policy",
          reason: "The optional boundary extension failed the existing manifold-kernel registry.",
        });
      }
    }
  }

  const firstFailure = failures[0] ?? null;
  const complete = firstFailure == null;
  return {
    schema_version: "casimir_dp_penrose_candidate_preflight_result/1",
    campaign_id: config.campaign_id,
    candidate_id: config.candidate_id,
    candidate_version: config.candidate_version,
    candidate_status: complete
      ? "definition_complete_not_validated"
      : "blocked",
    maturity: "stage0_exploratory",
    first_failure_code: firstFailure?.code ?? null,
    failures,
    authority_integrity: args.authorityIntegrity,
    registered_content: {
      penrose_lifetime_relation: "heuristic_relation_only",
      branch_geometry_dynamics: complete
        ? "formally_defined_not_validated"
        : "blocked",
      boundary_policy: config.boundary_policy.mode,
      fixed_branch_boundary_null:
        config.boundary_policy.fixed_branch_difference_null,
    },
    formal_relations: PENROSE_RELATIONAL_CANDIDATE_FORMAL_RELATIONS,
    symbolic_prediction_ledger: [
      {
        prediction_id: "penrose_lifetime_scale",
        status: "registered_heuristic",
        numerical_value: null,
        maximum_claim:
          "tau approximately hbar over E_I is a heuristic scale, not a survival law",
      },
      {
        prediction_id: "branch_geometry_complex_coherence",
        status: "blocked",
        numerical_value: null,
        maximum_claim:
          "no coherence prediction until a generative dynamics and separate calculator pass",
      },
      {
        prediction_id: "fixed_branch_boundary_modifier",
        status:
          config.boundary_policy.mode === "boundary_independent"
            ? "registered_null"
            : "blocked",
        numerical_value: null,
        maximum_claim:
          "no intrinsic Casimir modifier for the boundary-independent candidate",
      },
    ],
    boundary_registry_preflight: boundaryRegistryPreflight,
    outcome_map: config.outcome_map,
    falsifiers: config.falsifiers,
    nonbridges: config.nonbridges,
    numerical_output: null,
    numerical_prediction_permission:
      "forbidden_pending_separate_source_backed_calculator",
    model_comparison_admission: false,
    empirically_validated: false,
    registration_is_empirical_validation: false,
    final_gates: config.final_status_policy,
    claim_ceiling: "formal_candidate_definition_only",
  };
}

