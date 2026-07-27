import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_FAILURE_ORDER,
  CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_INPUT_VERSION,
  CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_RESULT_VERSION,
  CasimirDpApparatusScaleTransportStage4_2BInput,
  evaluateCasimirDpApparatusScaleTransportStage4_2B,
} from "../shared/casimir-dp-apparatus-scale-transport-stage4-2b";

const hash = (character: string) => character.repeat(64);

function receipt(
  id: string,
  provenanceClass: "measured" | "design_class" | "simulated" =
    "design_class",
  digest = hash("a"),
) {
  return {
    receipt_id: id,
    artifact_path: `artifacts/${id}.json`,
    provenance_class: provenanceClass,
    expected_sha256: digest,
    actual_sha256: digest,
    integrity_verified: true,
  };
}

function boundaryState(
  id: "on" | "off",
  condition: "boundary_on" | "boundary_off",
) {
  const cells = [
    {
      cell_id: "left",
      center_m: [-1e-8, 0, 0] as [number, number, number],
      volume_m3: 1e-21,
      branch_a_density_kg_m3: 3_000,
      branch_b_density_kg_m3: 1_000,
    },
    {
      cell_id: "right",
      center_m: [1e-8, 0, 0] as [number, number, number],
      volume_m3: 1e-21,
      branch_a_density_kg_m3: 1_000,
      branch_b_density_kg_m3: 3_000,
    },
  ];
  return {
    boundary_state_id: id,
    boundary_condition: condition,
    surface_distance_m: condition === "boundary_on" ? 5e-6 : 5e-3,
    orientation_unit_vector: [0, 0, 1] as [number, number, number],
    hold_time_s: 0.1,
    density_provenance: "design_class" as const,
    density_receipt: receipt(`${id}-density`),
    wavepacket_receipt: receipt(`${id}-wavepacket`),
    trajectory_receipt: receipt(`${id}-trajectory`),
    preparation_fidelity: {
      preparation_class: "assumed_design" as const,
      fidelity: 0.99,
      standard_uncertainty: 0.005,
      receipt: receipt(`${id}-preparation`),
    },
    mobile_object_mass_a_kg: 4e-18,
    mobile_object_mass_b_kg: 4e-18,
    mobile_object_material_id: "silica",
    expected_joint_branch_mass_kg: 4e-18,
    density_cells: cells,
    branch_swap_probe: {
      branch_a_density_kg_m3: cells.map(
        (cell) => cell.branch_b_density_kg_m3,
      ),
      branch_b_density_kg_m3: cells.map(
        (cell) => cell.branch_a_density_kg_m3,
      ),
    },
    dp_binding: {
      mass_density_convention: "continuum_voxel_density",
      smearing_kernel_id: "gaussian-r0",
      smearing_kernel_sha256: hash("b"),
      trajectory_sha256: hash("c"),
      model_parameters_sha256: hash("d"),
    },
  };
}

function validInput() {
  return {
    schema_version:
      CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_INPUT_VERSION,
    campaign_id:
      "casimir-dp-apparatus-scale-transport-stage4-2b-v1" as const,
    evidence_class: "synthetic_fixture" as const,
    claim_ceiling:
      "composition_aware_branch_density_parameter_transport_only" as const,
    promotion_allowed: false as const,
    authority_bindings: [
      {
        authority_id: "stage4_1" as const,
        artifact_path: "docs/stage4-1-receipt.json",
        expected_sha256: hash("1"),
        actual_sha256: hash("1"),
        integrity_verified: true,
      },
      {
        authority_id: "stage4_2a" as const,
        artifact_path: "docs/stage4-2a-receipt.json",
        expected_sha256: hash("2"),
        actual_sha256: hash("2"),
        integrity_verified: true,
      },
    ],
    object: {
      object_id: "silica-75nm",
      material_id: "silica",
      total_mass_kg: 4e-18,
      total_mass_standard_uncertainty_kg: 4e-20,
      mass_accounting_basis: "measured_total_mass" as const,
      density_provenance: "design_class" as const,
      mass_receipt: receipt("mass", "measured"),
      composition_receipt: receipt("composition"),
      geometry_receipt: receipt("geometry"),
      characteristic_radius_m: 75e-9,
      shape: "sphere" as const,
      porosity_fraction: 0,
      coating_thickness_m: 0,
      composition: [
        {
          component_id: "silica-bulk",
          material_id: "silica",
          mass_fraction: 1,
          mass_fraction_standard_uncertainty: 0.001,
          accounting_role: "measured_bulk_component" as const,
        },
      ],
    },
    scales: {
      branch_separation_m: 20e-9,
      smearing_length_m: 5e-10,
      hold_time_s: 0.1,
    },
    boundary_states: [
      boundaryState("off", "boundary_off"),
      boundaryState("on", "boundary_on"),
    ],
    registered_boundary_pair: {
      reference_state_id: "off",
      comparison_state_id: "on",
      complete_joint_system_equivalence_required: true,
    },
    sensitivity_budget: {
      dp_chi_per_l1_mismatch_kg: 1e18,
      ordinary_chi_per_l1_mismatch_kg: 1e16,
      convergence_l1_mass_error_kg: 1e-30,
      systematic_fraction: 0.1,
      target_standard_uncertainty: 1e-3,
    },
    covariance_ancestry: [
      {
        ancestry_id: "mass-geometry-shared",
        quantity_ids: ["mass", "density", "radius"],
        relationship: "shared_ancestor" as const,
        treatment: "full_cross_covariance" as const,
      },
    ],
    unit_registry: {
      c_m_s: 299_792_458,
      hbar_J_s: 1.054_571_817_646_156_5e-34,
      gravitational_constant_m3_kg_s2: 6.674_30e-11,
      kilogram_per_dalton: 1.660_539_066_60e-27,
      meter_per_nanometer: 1e-9,
    },
    tolerances: {
      mass_absolute_kg: 1e-30,
      mass_relative: 1e-12,
      composition_absolute: 1e-12,
      branch_swap_absolute_kg: 1e-30,
      density_identity_absolute_kg: 1e-30,
      density_identity_relative: 1e-12,
      unit_relative: 1e-12,
    },
  };
}

function codes(result: ReturnType<
  typeof evaluateCasimirDpApparatusScaleTransportStage4_2B
>) {
  return result.failures.map((failure) => failure.code);
}

describe("Casimir-DP Stage-4.2B apparatus scale transport", () => {
  it("passes a composition-aware synthetic ledger without promoting evidence", () => {
    const input =
      CasimirDpApparatusScaleTransportStage4_2BInput.parse(
        validInput(),
      );
    const result =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input);

    expect(result.schema_version).toBe(
      CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_RESULT_VERSION,
    );
    expect(result.status).toBe("pass");
    expect(result.failures).toEqual([]);
    expect(result.first_failure_code).toBeNull();
    expect(result.promotion_allowed).toBe(false);
    expect(result.observable_bridge_edges_added).toBe(0);
    expect(result.object_ledger.total_mass_kg).toBe(4e-18);
    expect(result.object_ledger.total_mass_Da).toBeCloseTo(
      2.408_856_305e9,
      0,
    );
    expect(result.final_gates).toMatchObject({
      authority_integrity: "pass",
      artifact_integrity: "pass",
      admissible_density_provenance: "pass",
      preparation_fidelity_typing: "pass",
      composition_and_mass_accounting: "pass",
      mass_conservation: "pass",
      branch_swap_symmetry: "pass",
      no_hidden_object_mutation: "pass",
      conditional_boundary_identity: "pass",
      sensitivity_weighted_mismatch: "pass",
      unit_dimension_closure: "pass",
      covariance_ancestry: "pass",
      measured_evidence: "not_ready",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
    });
  });

  it("separates exact identity, numerical recovery, and experimental mismatch", () => {
    const result =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(
        validInput(),
      );
    const equivalence =
      result.complete_joint_system_boundary_equivalence;

    expect(equivalence.symbolic_identity).toMatchObject({
      recovered: true,
      gate: "pass",
    });
    expect(equivalence.numerical_recovery).toMatchObject({
      l1_delta_rho_mismatch_kg: 0,
      relative_only_tolerance_used: false,
      convergence_error_allowance_kg: 1e-30,
      gate: "pass",
    });
    expect(equivalence.experimental_mismatch).toMatchObject({
      dp_delta_chi_bound: 0,
      ordinary_delta_chi_bound: 0,
      combined_delta_chi_bound: 0,
      strict_inequality_required: true,
      gate: "pass",
    });
    const scales = result.dimensionless_scale_vector;
    expect(scales.gravitational_coupling).toBeCloseTo(
      scales.mass_over_planck_mass ** 2,
      12,
    );
    expect(scales.branch_separation_over_radius).toBeCloseTo(
      20 / 75,
      12,
    );
    expect(scales.interpretation).toBe(
      "dimensionless_reparameterization_not_planck_scale_access",
    );
  });

  it("rejects electron-only and selected-QCD-term bulk-mass reconstruction", () => {
    for (const massAccountingBasis of [
      "electron_rest_mass_reconstruction",
      "selected_qcd_term_reconstruction",
    ] as const) {
      const input = validInput();
      input.object.mass_accounting_basis = massAccountingBasis;
      const result =
        evaluateCasimirDpApparatusScaleTransportStage4_2B(input);
      expect(result.first_failure_code).toBe(
        "STA_FORBIDDEN_BULK_MASS_RECONSTRUCTION",
      );
      expect(codes(result)).toContain(
        "STA_FORBIDDEN_BULK_MASS_RECONSTRUCTION",
      );
    }
  });

  it("fails closed on authority and artifact hash mismatches", () => {
    const input = validInput();
    input.authority_bindings[1].actual_sha256 = hash("3");
    input.boundary_states[0].trajectory_receipt.actual_sha256 =
      hash("e");

    const result =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input);
    expect(codes(result)).toEqual([
      "STA_AUTHORITY_INTEGRITY_INVALID",
      "STA_RECEIPT_INTEGRITY_INVALID",
    ]);
  });

  it("rejects simulation-only density while keeping preparation class explicit", () => {
    const input = validInput();
    input.boundary_states[0].density_provenance = "simulated_only";
    input.boundary_states[0].density_receipt.provenance_class =
      "simulated";
    input.boundary_states[1].preparation_fidelity.preparation_class =
      "measured";
    input.boundary_states[1].preparation_fidelity.receipt.provenance_class =
      "design_class";

    const result =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input);
    expect(codes(result)).toEqual([
      "STA_DENSITY_PROVENANCE_INVALID",
      "STA_PREPARATION_FIDELITY_INVALID",
    ]);
    expect(result.preparation_fidelity_ledger).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          boundary_state_id: "on",
          preparation_class: "measured",
          receipt_provenance_class: "design_class",
          gate: "not_ready",
        }),
      ]),
    );
  });

  it("checks composition closure, branch mass, swap, and hidden object mutation independently", () => {
    const input = validInput();
    input.object.composition[0].mass_fraction = 0.9;
    input.boundary_states[0].density_cells[0]
      .branch_a_density_kg_m3 += 100;
    input.boundary_states[1].branch_swap_probe
      .branch_a_density_kg_m3[0] += 100;
    input.boundary_states[1].mobile_object_mass_b_kg *= 1.1;

    const result =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input);
    expect(codes(result)).toEqual([
      "STA_COMPOSITION_LEDGER_INVALID",
      "STA_MASS_CONSERVATION_FAILED",
      "STA_BRANCH_SWAP_SYMMETRY_FAILED",
      "STA_HIDDEN_OBJECT_MUTATION",
      "STA_CONDITIONAL_BOUNDARY_IDENTITY_FAILED",
      "STA_NUMERICAL_NULL_RECOVERY_FAILED",
      "STA_SENSITIVITY_MISMATCH_BUDGET_EXCEEDED",
    ]);
  });

  it("uses an absolute-plus-relative null tolerance derived from convergence error", () => {
    const input = validInput();
    input.registered_boundary_pair
      .complete_joint_system_equivalence_required = false;
    const on = input.boundary_states[1];
    const densityShift = 2e-10;
    on.density_cells[0].branch_a_density_kg_m3 += densityShift;
    on.density_cells[1].branch_a_density_kg_m3 -= densityShift;
    on.branch_swap_probe.branch_b_density_kg_m3[0] += densityShift;
    on.branch_swap_probe.branch_b_density_kg_m3[1] -= densityShift;

    const within =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input);
    expect(
      within.complete_joint_system_boundary_equivalence
        .symbolic_identity.recovered,
    ).toBe(false);
    expect(
      within.complete_joint_system_boundary_equivalence
        .numerical_recovery.gate,
    ).toBe("pass");
    expect(codes(within)).not.toContain(
      "STA_NUMERICAL_NULL_RECOVERY_FAILED",
    );

    input.sensitivity_budget.convergence_l1_mass_error_kg = 0;
    input.tolerances.density_identity_absolute_kg = 0;
    input.tolerances.density_identity_relative = 0;
    const outside =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input);
    expect(codes(outside)).toContain(
      "STA_NUMERICAL_NULL_RECOVERY_FAILED",
    );
  });

  it("fails the sensitivity allocation even when numerical equivalence tolerance passes", () => {
    const input = validInput();
    input.registered_boundary_pair
      .complete_joint_system_equivalence_required = false;
    const on = input.boundary_states[1];
    const densityShift = 1e-7;
    on.density_cells[0].branch_a_density_kg_m3 += densityShift;
    on.density_cells[1].branch_a_density_kg_m3 -= densityShift;
    on.branch_swap_probe.branch_b_density_kg_m3[0] += densityShift;
    on.branch_swap_probe.branch_b_density_kg_m3[1] -= densityShift;
    input.sensitivity_budget.convergence_l1_mass_error_kg = 1e-20;
    input.sensitivity_budget.dp_chi_per_l1_mismatch_kg = 1e25;

    const result =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input);
    expect(
      result.complete_joint_system_boundary_equivalence
        .numerical_recovery.gate,
    ).toBe("pass");
    expect(codes(result)).toContain(
      "STA_SENSITIVITY_MISMATCH_BUDGET_EXCEEDED",
    );
  });

  it("fails incorrect unit constants and shared ancestry treated as independent", () => {
    const input = validInput();
    input.unit_registry.meter_per_nanometer = 1e-6;
    input.covariance_ancestry[0].treatment =
      "treated_as_independent";

    const result =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input);
    expect(codes(result)).toEqual([
      "STA_UNIT_ROUNDTRIP_FAILED",
      "STA_PROVENANCE_ANCESTRY_INVALID",
    ]);
  });

  it("keeps failure ordering stable and report values JSON-safe on incomparable grids", () => {
    const input = validInput();
    input.boundary_states[1].density_cells[0].center_m[0] = -2e-8;
    input.boundary_states[1].density_cells[0].cell_id = "shifted-left";
    input.unit_registry.c_m_s = 3e8;
    input.object.mass_accounting_basis =
      "electron_rest_mass_reconstruction";

    const result =
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input);
    const order = new Map(
      CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_FAILURE_ORDER.map(
        (code, index) => [code, index],
      ),
    );
    expect(result.failures.every((failure, index, failures) =>
      index === 0 ||
      (order.get(failures[index - 1].code) ?? -1) <=
        (order.get(failure.code) ?? -1)
    )).toBe(true);
    expect(
      result.complete_joint_system_boundary_equivalence
        .numerical_recovery.l1_delta_rho_mismatch_kg,
    ).toBeNull();
    expect(
      result.complete_joint_system_boundary_equivalence
        .experimental_mismatch.combined_delta_chi_bound,
    ).toBeNull();
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(JSON.stringify(result)).not.toContain("null,null,null");
  });

  it("uses strict schemas for unregistered shortcuts", () => {
    const input = validInput() as Record<string, unknown>;
    input.compton_frequency_collapse_clock_Hz = 1;

    expect(() =>
      evaluateCasimirDpApparatusScaleTransportStage4_2B(input)
    ).toThrow();
  });
});
