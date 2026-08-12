import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateCasimirDpPenroseCandidatePreflight,
  type PenroseCandidateAuthorityIntegrity,
} from "../shared/casimir-dp-penrose-candidate-preflight";
import {
  PENROSE_CANDIDATE_REQUIRED_NONBRIDGES,
  PENROSE_RELATIONAL_CANDIDATE_FORMAL_RELATIONS,
} from "../shared/casimir-dp-penrose-candidate-theory-stage0";
import type { CasimirDpManifoldKernelRegistryInput } from
  "../shared/casimir-dp-manifold-kernel-registry";
import {
  CasimirDpPenroseCandidateTheoryStage0Config,
  type CasimirDpPenroseCandidateTheoryStage0Config as PenroseConfig,
  type PenroseTheoryRequirement,
} from "../shared/contracts/casimir-dp-penrose-candidate-theory-stage0.v1";

const configPath = path.resolve(
  process.cwd(),
  "configs/research/casimir-dp-penrose-candidate-theory-stage0.v1.json",
);
const config = CasimirDpPenroseCandidateTheoryStage0Config.parse(
  JSON.parse(readFileSync(configPath, "utf8")),
);
const manifoldFixture = JSON.parse(
  readFileSync(
    path.resolve(
      process.cwd(),
      "configs/research/fixtures/casimir-dp-stage3-manifold-registry.synthetic.v1.json",
    ),
    "utf8",
  ),
) as CasimirDpManifoldKernelRegistryInput;

function cloneConfig(): PenroseConfig {
  return structuredClone(config);
}

function passingAuthorities(
  input: PenroseConfig,
): PenroseCandidateAuthorityIntegrity[] {
  return input.upstream_authorities.map((row) => ({
    role: row.role,
    path: row.path,
    expected_sha256: row.sha256,
    actual_sha256: row.sha256,
    gate: "pass",
  }));
}

function supplied(
  specification = "synthetic structural test definition",
): PenroseTheoryRequirement {
  return {
    status: "supplied",
    specification,
    source_ids: ["penrose-1996-gravity-state-reduction"],
    equation_ids: ["synthetic-structural-test-equation"],
    evidence_receipt_sha256: "a".repeat(64),
  };
}

function completeDefinition(input: PenroseConfig): void {
  input.theory_definition.branch_state_contract = supplied();
  input.theory_definition.branch_correspondence = supplied();
  input.theory_definition.invariant_incompatibility_functional = supplied();
  input.theory_definition.equivalence_principle_recovery = supplied();
  input.dynamics.kind = "markovian";
  input.dynamics.reduction_law = supplied();
  input.dynamics.lifetime_distribution = supplied();
  input.dynamics.stochastic_unravelling = supplied();
  input.dynamics.born_probability_law = supplied();
  input.dynamics.normalization_contract = supplied();
  input.dynamics.markovian_cptp_contract = supplied();
  input.consistency.causal_support_and_no_signalling = supplied();
  input.consistency.energy_momentum_balance = supplied();
  input.consistency.gauge_and_diffeomorphism_robustness = supplied();
  input.consistency.vacuum_stability_or_hadamard_contract = supplied();
  Object.keys(input.consistency.recovery_limits).forEach((key) => {
    input.consistency.recovery_limits[
      key as keyof typeof input.consistency.recovery_limits
    ] = true;
  });
  input.observable_contract.complex_coherence_projection = supplied();
  input.observable_contract.companion_prediction_or_justified_null =
    supplied();
}

describe("Penrose relational candidate Stage-0 preflight", () => {
  it("parses the maintained candidate and fails first at branch correspondence", () => {
    const result = evaluateCasimirDpPenroseCandidatePreflight({
      config,
      authorityIntegrity: passingAuthorities(config),
    });

    expect(result.candidate_status).toBe("blocked");
    expect(result.maturity).toBe("stage0_exploratory");
    expect(result.first_failure_code).toBe(
      "PCT_BRANCH_CORRESPONDENCE_MISSING",
    );
    expect(result.failures.map((row) => row.code)).toEqual(
      expect.arrayContaining([
        "PCT_INVARIANT_INCOMPATIBILITY_FUNCTIONAL_MISSING",
        "PCT_EQUIVALENCE_RECOVERY_MISSING",
        "PCT_REDUCTION_DYNAMICS_MISSING",
        "PCT_PROBABILITY_LAW_MISSING",
        "PCT_CAUSALITY_OR_NO_SIGNALLING_MISSING",
        "PCT_ENERGY_MOMENTUM_BALANCE_MISSING",
        "PCT_COHERENCE_PROJECTION_MISSING",
        "PCT_COMPANION_OR_JUSTIFIED_NULL_MISSING",
      ]),
    );
    expect(result.numerical_output).toBeNull();
    expect(result.model_comparison_admission).toBe(false);
    expect(result.empirically_validated).toBe(false);
  });

  it("does not accept the Penrose lifetime slogan as a reduction dynamics", () => {
    const input = cloneConfig();
    input.theory_definition.branch_correspondence = supplied();
    input.theory_definition.invariant_incompatibility_functional = supplied();
    input.theory_definition.equivalence_principle_recovery = supplied();

    const result = evaluateCasimirDpPenroseCandidatePreflight({
      config: input,
      authorityIntegrity: passingAuthorities(input),
    });
    expect(PENROSE_RELATIONAL_CANDIDATE_FORMAL_RELATIONS.penrose_lifetime_notation)
      .toContain("hbar/E_I");
    expect(result.first_failure_code).toBe("PCT_REDUCTION_DYNAMICS_MISSING");
    expect(result.symbolic_prediction_ledger[0]).toEqual(
      expect.objectContaining({
        status: "registered_heuristic",
        numerical_value: null,
      }),
    );
  });

  it("keeps frequency coincidence and other semantic shortcuts as nonbridges", () => {
    const present = new Set(config.nonbridges.map((row) => row.nonbridge_id));
    for (const id of PENROSE_CANDIDATE_REQUIRED_NONBRIDGES) {
      expect(present.has(id)).toBe(true);
    }
    expect(
      config.nonbridges.find(
        (row) => row.nonbridge_id === "compton_frequency_to_cavity_mode",
      )?.status,
    ).toBe("null");
  });

  it("preserves the fixed-branch boundary null without calling the manifold registry", () => {
    const result = evaluateCasimirDpPenroseCandidatePreflight({
      config,
      authorityIntegrity: passingAuthorities(config),
      boundaryRegistry: manifoldFixture,
    });
    expect(result.registered_content.boundary_policy).toBe(
      "boundary_independent",
    );
    expect(result.registered_content.fixed_branch_boundary_null).toBe(true);
    expect(result.boundary_registry_preflight).toBeNull();
    expect(result.symbolic_prediction_ledger[2].status).toBe("registered_null");
  });

  it("propagates the existing MK first failure for an optional boundary extension", () => {
    const input = cloneConfig();
    completeDefinition(input);
    input.boundary_policy = {
      mode: "registered_extension",
      fixed_branch_difference_null: false,
      extension_model_id: "M_bridge_tensor_noise_v1",
      manifold_registry_fixture_path:
        "configs/research/fixtures/casimir-dp-stage3-manifold-registry.synthetic.v1.json",
      manifold_registry_fixture_sha256: "b".repeat(64),
      interpretation: "synthetic boundary-extension registry propagation test",
    };
    const registry = structuredClone(manifoldFixture);
    const entry = registry.entries[0];
    if (entry?.entry_kind !== "candidate") throw new Error("candidate fixture missing");
    entry.stress_energy!.source_kind = "scalar_pressure";

    const result = evaluateCasimirDpPenroseCandidatePreflight({
      config: input,
      authorityIntegrity: passingAuthorities(input),
      boundaryRegistry: registry,
    });
    expect(result.candidate_status).toBe("blocked");
    expect(result.first_failure_code).toBe(
      "MK_SOURCE_MUST_BE_RENORMALIZED_TENSOR",
    );
    expect(result.boundary_registry_preflight?.status).toBe("blocked");
    expect(result.numerical_output).toBeNull();
  });

  it("requires CPTP for Markovian and consistency for non-Markovian definitions", () => {
    const markovian = cloneConfig();
    completeDefinition(markovian);
    markovian.dynamics.markovian_cptp_contract = {
      ...supplied(),
      status: "missing",
      specification: null,
      equation_ids: [],
    };
    expect(
      evaluateCasimirDpPenroseCandidatePreflight({
        config: markovian,
        authorityIntegrity: passingAuthorities(markovian),
      }).first_failure_code,
    ).toBe("PCT_MARKOVIAN_CPTP_CONTRACT_MISSING");

    const nonMarkovian = cloneConfig();
    completeDefinition(nonMarkovian);
    nonMarkovian.dynamics.kind = "non_markovian";
    nonMarkovian.dynamics.non_markovian_consistency_contract = {
      ...supplied(),
      status: "missing",
      specification: null,
      equation_ids: [],
    };
    expect(
      evaluateCasimirDpPenroseCandidatePreflight({
        config: nonMarkovian,
        authorityIntegrity: passingAuthorities(nonMarkovian),
      }).first_failure_code,
    ).toBe("PCT_NON_MARKOVIAN_CONSISTENCY_MISSING");
  });

  it("keeps a structurally complete synthetic definition Stage 0 and unvalidated", () => {
    const input = cloneConfig();
    completeDefinition(input);
    const result = evaluateCasimirDpPenroseCandidatePreflight({
      config: input,
      authorityIntegrity: passingAuthorities(input),
    });
    expect(result.candidate_status).toBe("definition_complete_not_validated");
    expect(result.first_failure_code).toBeNull();
    expect(result.maturity).toBe("stage0_exploratory");
    expect(result.numerical_prediction_permission).toBe(
      "forbidden_pending_separate_source_backed_calculator",
    );
    expect(result.model_comparison_admission).toBe(false);
    expect(result.empirically_validated).toBe(false);
    expect(result.registration_is_empirical_validation).toBe(false);
  });

  it("fails before theory inspection when an upstream authority drifts", () => {
    const authorities = passingAuthorities(config);
    authorities[0].gate = "not_ready";
    authorities[0].actual_sha256 = "0".repeat(64);
    const result = evaluateCasimirDpPenroseCandidatePreflight({
      config,
      authorityIntegrity: authorities,
    });
    expect(result.first_failure_code).toBe("PCT_AUTHORITY_INTEGRITY_FAILED");
    expect(result.numerical_output).toBeNull();
  });
});

