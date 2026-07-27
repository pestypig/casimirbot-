import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_MANIFOLD_KERNEL_FIRST_FAILURE_ORDER,
  evaluateCasimirDpManifoldKernelRegistry,
  preflightCasimirDpManifoldBridge,
  type CasimirDpManifoldKernelCandidate,
  type CasimirDpManifoldKernelRegistryInput,
} from "../shared/casimir-dp-manifold-kernel-registry";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage3-manifold-registry.synthetic.v1.json",
);
const fixture = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as CasimirDpManifoldKernelRegistryInput;

function cloneFixture(): CasimirDpManifoldKernelRegistryInput {
  return structuredClone(fixture);
}

function candidate(
  input: CasimirDpManifoldKernelRegistryInput,
): CasimirDpManifoldKernelCandidate {
  const entry = input.entries[0];
  if (entry?.entry_kind !== "candidate") {
    throw new Error("synthetic fixture must begin with a candidate");
  }
  return entry;
}

describe("Casimir-DP Stage-3 manifold-kernel registry", () => {
  it("registers a complete signed-tensor schema without calling it validated", () => {
    const result = evaluateCasimirDpManifoldKernelRegistry(fixture);
    const entry = result.entries[0];

    expect(result.status).toBe("registered");
    expect(result.first_failure_code).toBeNull();
    expect(result.failures).toEqual([]);
    expect(result.registered_model_ids).toEqual([
      "M_bridge_tensor_noise_v1",
    ]);
    expect(entry.status).toBe("registered");
    expect(entry.proposed_scope).toContain("no empirical claim");
    expect(entry.numerical_bridge_output).toBeNull();
    expect(entry.numerical_output_permission).toBe(
      "eligible_only_in_a_separate_source_backed_calculator",
    );
    expect(entry.empirically_validated).toBe(false);
    expect(entry.registration_is_empirical_validation).toBe(false);
    expect(result.registration_is_empirical_validation).toBe(false);
    expect(candidate(fixture).stress_energy?.representative_renormalized_t00_J_m3)
      .toBeLessThan(0);
  });

  it("uses a stable first-missing-field order and preserves blocked scope", () => {
    const input = cloneFixture();
    const entry = candidate(input);
    delete entry.model_id;
    delete entry.version;
    entry.stress_energy!.source_kind = "scalar_pressure";
    entry.causal_response!.is_retarded_and_causal = false;

    const result = evaluateCasimirDpManifoldKernelRegistry(input);
    const blocked = result.entries[0];

    expect(result.status).toBe("blocked");
    expect(result.first_failure_code).toBe("MK_MODEL_ID_MISSING");
    expect(blocked.first_failure_code).toBe("MK_MODEL_ID_MISSING");
    expect(blocked.failures.slice(0, 4).map((row) => row.code)).toEqual([
      "MK_MODEL_ID_MISSING",
      "MK_VERSION_MISSING",
      "MK_SOURCE_MUST_BE_RENORMALIZED_TENSOR",
      "MK_RESPONSE_NOT_CAUSAL",
    ]);
    expect(blocked.proposed_scope).toBe(entry.proposed_scope);
    expect(blocked.numerical_bridge_output).toBeNull();
    expect(blocked.numerical_output_permission).toBe("forbidden");
    expect(CASIMIR_DP_MANIFOLD_KERNEL_FIRST_FAILURE_ORDER[0]).toBe(
      "MK_MODEL_ID_MISSING",
    );
  });

  it.each([
    [
      "scalar pressure",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.stress_energy!.source_kind = "scalar_pressure";
      },
      "MK_SOURCE_MUST_BE_RENORMALIZED_TENSOR",
    ],
    [
      "renormalization",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.stress_energy!.renormalized_t_munu_prescription = "";
      },
      "MK_RENORMALIZATION_MISSING",
    ],
    [
      "causal response",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.causal_response!.retarded_tensor_to_metric_kernel = "";
      },
      "MK_CAUSAL_RESPONSE_MISSING",
    ],
    [
      "gauge contract",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.causal_response!.gauge_and_coordinate_contract = "";
      },
      "MK_GAUGE_CONTRACT_MISSING",
    ],
    [
      "dimensional closure",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.causal_response!.dimensional_closure_passed = false;
      },
      "MK_DIMENSIONAL_CLOSURE_FAILED",
    ],
    [
      "stress-energy conservation",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.stress_energy!.conservation_residual = 1;
      },
      "MK_CONSERVATION_CONTRACT_INVALID",
    ],
    [
      "positive-semidefinite covariance",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.stress_noise!.covariance_minimum_eigenvalue = -1e-12;
      },
      "MK_NOISE_COVARIANCE_NOT_PSD",
    ],
    [
      "recovery limits",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.recovery_limits!.no_boundary_contrast = false;
      },
      "MK_RECOVERY_LIMIT_MISSING",
    ],
    [
      "internal falsifier",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.falsifiers!.experiment_internal = [];
      },
      "MK_INTERNAL_FALSIFIER_MISSING",
    ],
    [
      "independent falsifier",
      (entry: CasimirDpManifoldKernelCandidate) => {
        entry.falsifiers!.independent = [];
      },
      "MK_INDEPENDENT_FALSIFIER_MISSING",
    ],
  ])("fails closed when %s is invalid", (_label, mutate, expectedCode) => {
    const input = cloneFixture();
    mutate(candidate(input));
    const result = evaluateCasimirDpManifoldKernelRegistry(input);
    const blocked = result.entries[0];

    expect(result.status).toBe("blocked");
    expect(blocked.first_failure_code).toBe(expectedCode);
    expect(blocked.numerical_bridge_output).toBeNull();
    expect(blocked.numerical_output_permission).toBe("forbidden");
    expect(blocked.empirically_validated).toBe(false);
  });

  it("rejects nonphysical Markovian dynamics and negative produced rates", () => {
    const nonCptp = cloneFixture();
    candidate(nonCptp).matter_dynamics!.complete_positivity_passed = false;
    expect(
      evaluateCasimirDpManifoldKernelRegistry(nonCptp).first_failure_code,
    ).toBe("MK_MARKOVIAN_DYNAMICS_NOT_CPTP");

    const negativeRate = cloneFixture();
    candidate(negativeRate).matter_dynamics!.rate_validation_value_s = -1;
    const result = evaluateCasimirDpManifoldKernelRegistry(negativeRate);
    expect(result.first_failure_code).toBe("MK_NEGATIVE_PHYSICAL_RATE");
    expect(result.entries[0].numerical_bridge_output).toBeNull();
  });

  it("requires preregistration before custodian unblinding", () => {
    const input = cloneFixture();
    candidate(input).preregistered_at = input.campaign_unblinded_at;

    const result = evaluateCasimirDpManifoldKernelRegistry(input);
    expect(result.status).toBe("blocked");
    expect(result.first_failure_code).toBe(
      "MK_REGISTRATION_AFTER_UNBLINDING",
    );
    expect(result.entries[0].numerical_bridge_output).toBeNull();
  });

  it("fails closed on invalid registry authority before inspecting a model", () => {
    const input = cloneFixture() as unknown as Record<string, unknown>;
    input.schema_version = "casimir_dp_manifold_kernel_registry/0";
    input.registry_id = "";

    const result = evaluateCasimirDpManifoldKernelRegistry(
      input as unknown as CasimirDpManifoldKernelRegistryInput,
    );
    expect(result.status).toBe("blocked");
    expect(result.first_failure_code).toBe(
      "MK_REGISTRY_SCHEMA_VERSION_INVALID",
    );
    expect(result.entries).toEqual([]);
    expect(result.numerical_bridge_output).toBeNull();

    const preflight = preflightCasimirDpManifoldBridge(
      input as unknown as CasimirDpManifoldKernelRegistryInput,
      "M_bridge_tensor_noise_v1",
    );
    expect(preflight.first_failure_code).toBe(
      "MK_REGISTRY_SCHEMA_VERSION_INVALID",
    );
    expect(preflight.numerical_bridge_output).toBeNull();
  });

  it("preserves immutable rejection and blocks same-id re-entry", () => {
    const input = cloneFixture();
    input.entries.unshift({
      entry_kind: "rejected",
      model_id: "M_bridge_tensor_noise_v1",
      version: "0.9.0",
      tested_evidence_sha256: ["a".repeat(64)],
      rejection_criterion: "held-out kernel residual exceeded threshold",
      rejection_receipt_sha256: "b".repeat(64),
      rejected_at: "2026-07-22T12:00:00.000Z",
    });

    const result = evaluateCasimirDpManifoldKernelRegistry(input);
    expect(result.entries[0].status).toBe("rejected");
    expect(result.entries[0].maximum_claim).toBe(
      "immutable_model_specific_rejection_only",
    );
    expect(result.entries[1].status).toBe("blocked");
    expect(result.entries[1].first_failure_code).toBe(
      "MK_REJECTED_ID_REENTRY",
    );
    expect(result.rejected_model_ids).toEqual([
      "M_bridge_tensor_noise_v1",
    ]);
    expect(result.entries.every((entry) =>
      entry.numerical_bridge_output === null
    )).toBe(true);
  });

  it("does not let an empirical-validation claim pass schema registration", () => {
    const input = cloneFixture();
    candidate(input).empirical_validation_claim = true;

    const result = evaluateCasimirDpManifoldKernelRegistry(input);
    expect(result.status).toBe("blocked");
    expect(result.first_failure_code).toBe(
      "MK_REGISTRATION_IS_NOT_EMPIRICAL_VALIDATION",
    );
    expect(result.registration_is_empirical_validation).toBe(false);
  });
});
