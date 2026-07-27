import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_CONGRUENCE_FIRST_FAILURE_ORDER,
  CasimirDpTensorDimensionalCongruenceInput,
  evaluateCasimirDpTensorDimensionalCongruence,
  type CasimirDpTensorDimensionalCongruenceInput as CongruenceInput,
} from "../shared/casimir-dp-tensor-dimensional-congruence";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage4-congruence.synthetic.v1.json",
);
const fixture = CasimirDpTensorDimensionalCongruenceInput.parse(
  JSON.parse(readFileSync(fixturePath, "utf8")),
);

function clone(): CongruenceInput {
  return structuredClone(fixture);
}

function edge(
  input: CongruenceInput,
  kind: CongruenceInput["edges"][number]["kind"],
) {
  const match = input.edges.find((row) => row.kind === kind);
  if (!match) throw new Error(`fixture is missing ${kind}`);
  return match;
}

function quantity(
  input: CongruenceInput,
  role: CongruenceInput["quantities"][number]["role"],
) {
  const match = input.quantities.find((row) => row.role === role);
  if (!match) throw new Error(`fixture is missing ${role}`);
  return match;
}

describe("Casimir-DP Stage-4 tensor/dimensional/semantic congruence", () => {
  it("admits both typed chains while retaining diagnostic claim ceilings", () => {
    const result = evaluateCasimirDpTensorDimensionalCongruence(fixture);

    expect(result.status).toBe("pass");
    expect(result.first_failure_code).toBeNull();
    expect(result.failures).toEqual([]);
    expect(result.qed_chain.status).toBe("pass");
    expect(result.tensor_bridge_chain.status).toBe(
      "registered_congruence_only",
    );
    expect(result.tensor_bridge_chain.numerical_bridge_output).toBeNull();
    expect(result.tensor_bridge_chain.empirically_validated).toBe(false);
    expect(result.frequency_non_bridge.status).toBe(
      "same_dimension_not_connected",
    );
    expect(result.frequency_non_bridge.shared_dimension).toBe("T^-1");
    expect(result.frequency_non_bridge.sourced_transfer_kernel_present)
      .toBe(false);
    expect(result.invariance.basis_round_trip_gate).toBe("pass");
    expect(result.invariance.unit_round_trip_gate).toBe("pass");
    expect(result.promotion_allowed).toBe(false);
    expect(result.collapse_identification).toBe("blocked");
    expect(result.manifold_dynamics).toBe("blocked");
    expect(result.physical_viability).toBe("not_evaluated");
    expect(result.maximum_claim).toBe("synthetic_congruence_validation");
  });

  it("fails the h/hbar and nu/omega 2pi identities closed", () => {
    const input = clone();
    input.convention_checks.angular_frequency_rad_s =
      input.convention_checks.frequency_Hz;

    const result = evaluateCasimirDpTensorDimensionalCongruence(input);
    expect(result.status).toBe("blocked");
    expect(result.first_failure_code).toBe("CD_H_HBAR_2PI_MISMATCH");
    expect(result.convention_diagnostics.h_hbar_2pi_gate).toBe("blocked");
  });

  it("requires the per-Hz to per-rad/s spectral Jacobian", () => {
    const input = clone();
    input.convention_checks.psd_per_rad_s =
      input.convention_checks.psd_per_Hz;

    const result = evaluateCasimirDpTensorDimensionalCongruence(input);
    expect(result.first_failure_code).toBe(
      "CD_SPECTRAL_JACOBIAN_MISMATCH",
    );
    expect(result.convention_diagnostics.spectral_jacobian_gate)
      .toBe("blocked");
  });

  it("does not infer force noise from Green and alpha without coupling/FDT", () => {
    const input = clone();
    edge(input, "green_alpha_to_force_noise")
      .explicit_coupling_or_fdt_ref = null;

    const result = evaluateCasimirDpTensorDimensionalCongruence(input);
    expect(result.first_failure_code).toBe(
      "CD_GREEN_NOISE_COUPLING_MISSING",
    );
    expect(result.qed_chain.status).toBe("blocked");
    expect(result.collapse_identification).toBe("blocked");
  });

  it.each(["scalar_pressure", "t00_scalar"] as const)(
    "rejects %s as a complete tensor bridge source",
    (sourceKind) => {
      const input = clone();
      edge(input, "stress_noise_to_retarded_response").source_term_kind =
        sourceKind;

      const result = evaluateCasimirDpTensorDimensionalCongruence(input);
      expect(result.first_failure_code).toBe("CD_SCALAR_SOURCE_NOT_TENSOR");
      expect(result.tensor_bridge_chain.status).toBe("blocked");
      expect(result.tensor_bridge_chain.numerical_bridge_output).toBeNull();
      expect(result.manifold_dynamics).toBe("blocked");
    },
  );

  it("keeps equal Compton, DP, and cavity dimensions disconnected", () => {
    const result = evaluateCasimirDpTensorDimensionalCongruence(fixture);
    expect(result.frequency_non_bridge.semantic_quantity_ids).toEqual([
      "frequency.compton_rest_energy_angular",
      "frequency.dp_self_energy_inverse_timescale",
      "frequency.cavity_mode_angular",
    ]);
    expect(result.frequency_non_bridge.status).toBe(
      "same_dimension_not_connected",
    );

    const attempted = clone();
    const template = structuredClone(edge(attempted, "metric_to_phase"));
    template.edge_id = "unsourced_frequency_identity";
    template.kind = "frequency_transfer_kernel";
    template.source_quantity_ids = ["omega_C", "Gamma_DP"];
    template.target_quantity_id = "omega_cavity";
    template.dimension_transform.source_powers = [
      { quantity_id: "omega_C", power: 1 },
      { quantity_id: "Gamma_DP", power: 0 },
    ];
    template.dimension_transform.kernel_dimension = {
      mass: 0,
      length: 0,
      time: 0,
      current: 0,
      temperature: 0,
      amount: 0,
      luminous_intensity: 0,
    };
    template.descriptor.si_dimension = {
      mass: 0,
      length: 0,
      time: -1,
      current: 0,
      temperature: 0,
      amount: 0,
      luminous_intensity: 0,
    };
    template.descriptor.semantic_quantity_id =
      "transform.unsourced_frequency_identity";
    template.sourced_transfer_kernel_ref = null;
    attempted.edges.push(template);

    const blocked = evaluateCasimirDpTensorDimensionalCongruence(attempted);
    expect(blocked.failures.some(
      (row) => row.code === "CD_UNSOURCED_FREQUENCY_KERNEL",
    )).toBe(true);
    expect(blocked.frequency_non_bridge.status).toBe(
      "same_dimension_not_connected",
    );
  });

  it("checks quantity dimensions, tensor ranks, and edge semantics separately", () => {
    const wrongDimension = clone();
    quantity(wrongDimension, "force_noise_psd")
      .descriptor.si_dimension.time = -4;
    expect(
      evaluateCasimirDpTensorDimensionalCongruence(wrongDimension)
        .first_failure_code,
    ).toBe("CD_QUANTITY_DIMENSION_INVALID");

    const wrongTensor = clone();
    const green = quantity(wrongTensor, "green_tensor");
    green.descriptor.tensor.rank = 0;
    green.descriptor.tensor.index_variance = [];
    green.descriptor.tensor.symmetry = "scalar";
    expect(
      evaluateCasimirDpTensorDimensionalCongruence(wrongTensor)
        .first_failure_code,
    ).toBe("CD_QUANTITY_TENSOR_INVALID");

    const wrongSemanticMap = clone();
    edge(wrongSemanticMap, "energy_noise_to_chi")
      .semantic_mapping.passed = false;
    const semanticResult =
      evaluateCasimirDpTensorDimensionalCongruence(wrongSemanticMap);
    expect(semanticResult.first_failure_code).toBe(
      "CD_SEMANTIC_MAPPING_FAILED",
    );
    expect(semanticResult.qed_chain.status).toBe("blocked");
  });

  it("fails basis and unit round-trip invariance independently", () => {
    const basis = clone();
    basis.invariance_checks.basis_round_trip_relative_error = 1e-3;
    const basisResult = evaluateCasimirDpTensorDimensionalCongruence(basis);
    expect(basisResult.first_failure_code).toBe(
      "CD_BASIS_ROUND_TRIP_FAILED",
    );
    expect(basisResult.invariance.basis_round_trip_gate).toBe("blocked");

    const unit = clone();
    unit.invariance_checks.unit_round_trip_relative_error = 1e-3;
    const unitResult = evaluateCasimirDpTensorDimensionalCongruence(unit);
    expect(unitResult.first_failure_code).toBe(
      "CD_UNIT_ROUND_TRIP_FAILED",
    );
    expect(unitResult.invariance.unit_round_trip_gate).toBe("blocked");
  });

  it.each([
    [
      "stress conservation",
      (input: CongruenceInput) => {
        input.physical_checks.stress_conservation_residual = 1;
      },
      "CD_STRESS_CONSERVATION_FAILED",
    ],
    [
      "tensor symmetry",
      (input: CongruenceInput) => {
        input.physical_checks.stress_noise_pair_symmetry_passed = false;
      },
      "CD_TENSOR_SYMMETRY_FAILED",
    ],
    [
      "gauge constraints",
      (input: CongruenceInput) => {
        input.physical_checks.gauge_constraints_passed = false;
      },
      "CD_GAUGE_CONSTRAINT_FAILED",
    ],
    [
      "covariance positivity",
      (input: CongruenceInput) => {
        input.physical_checks.covariance_minimum_eigenvalue = -1;
      },
      "CD_COVARIANCE_NOT_PSD",
    ],
  ] as const)(
    "blocks the tensor chain when %s fails",
    (_label, mutate, expectedCode) => {
      const input = clone();
      mutate(input);
      const result = evaluateCasimirDpTensorDimensionalCongruence(input);
      expect(result.first_failure_code).toBe(expectedCode);
      expect(result.tensor_bridge_chain.status).toBe("blocked");
      expect(result.tensor_bridge_chain.numerical_bridge_output).toBeNull();
    },
  );

  it("requires every recovery limit and preserves deterministic ordering", () => {
    const input = clone();
    input.recovery_limits.no_boundary_contrast = false;

    const result = evaluateCasimirDpTensorDimensionalCongruence(input);
    expect(result.first_failure_code).toBe("CD_RECOVERY_LIMIT_FAILED");
    expect(CASIMIR_DP_CONGRUENCE_FIRST_FAILURE_ORDER[0]).toBe(
      "CD_RECEIPT_INTEGRITY_FAILED",
    );
  });

  it("requires evidence and transform integrity on every node and edge", () => {
    const input = clone();
    quantity(input, "green_tensor")
      .descriptor.evidence_receipt.actual_sha256 = "f".repeat(64);
    edge(input, "metric_to_rate")
      .descriptor.transform_receipt.integrity_verified = false;

    const result = evaluateCasimirDpTensorDimensionalCongruence(input);
    expect(result.first_failure_code).toBe(
      "CD_RECEIPT_INTEGRITY_FAILED",
    );
    expect(result.failures.filter(
      (row) => row.code === "CD_RECEIPT_INTEGRITY_FAILED",
    )).toHaveLength(2);
    expect(result.promotion_allowed).toBe(false);
  });

  it("rejects structurally incomplete metadata at schema admission", () => {
    const raw = structuredClone(fixture) as unknown as {
      quantities: Array<{ descriptor: Record<string, unknown> }>;
    };
    delete raw.quantities[0].descriptor.spectral;
    expect(() =>
      CasimirDpTensorDimensionalCongruenceInput.parse(raw)
    ).toThrow();
  });
});
