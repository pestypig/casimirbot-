#!/usr/bin/env python3
"""Exact candidate-neutral audit of the S4-R2 total quantum builder draft.

This script reads definitions and exact integers/rationals only.  It does not
open a candidate ingress, evaluate a positive continuation sample, or create a
scientific output root.
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
from math import comb
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
RUST_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def vandermonde_weights(epsilon_exponents: list[int]) -> list[Fraction]:
    """Solve sum_j w_j eps_j^k=delta(k,0), k=0..8 exactly."""
    eps = [Fraction(1, 1 << exponent) for exponent in epsilon_exponents]
    matrix = [[value**power for value in eps] + [Fraction(power == 0)] for power in range(9)]
    for column in range(9):
        pivot = next((row for row in range(column, 9) if matrix[row][column]), None)
        if pivot is None:
            raise ValueError("singular Richardson system")
        matrix[column], matrix[pivot] = matrix[pivot], matrix[column]
        scale = matrix[column][column]
        matrix[column] = [entry / scale for entry in matrix[column]]
        for row in range(9):
            if row == column:
                continue
            scale = matrix[row][column]
            matrix[row] = [left - scale * right for left, right in zip(matrix[row], matrix[column])]
    return [matrix[row][-1] for row in range(9)]


def main() -> int:
    contract = json.loads(CONTRACT.read_bytes())
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    check("schema", contract["schema"].endswith("total_quantum_builder_algorithms.v2"), contract["schema"])
    check("sealed_fixture_only", contract["status"].startswith("sealed_additive_candidate_neutral") and "no_scientific_execution_authority" in contract["status"], contract["status"])
    for name, binding in contract["immutable_predecessors"].items():
        observed = digest(ROOT / binding["path"])
        check(f"predecessor_{name}", observed == binding["raw_sha256"], observed)

    inherited = contract["preserved_selectors"]
    check("common_selectors", inherited["common"] == {
        "precision_bits": 512,
        "projection_lattice": "2^-448",
        "target_total_width": "2^-120",
        "per_tail_target": "2^-132",
        "static_state": "the one positive-frequency static ground G_plus from the quantum v1 contract",
        "hadamard_length": "1",
        "finite_ambiguity_vector": [0, 0, 0, 0],
        "mean_shape": [64, 4],
        "noise_shape": [256, 256],
        "adaptive_panels": 0,
    }, inherited["common"])
    check("primary_inherited_counts", inherited["primary"] == {
        "radial_degree": 24, "angular_max": 255, "subtraction_order": 20,
        "kappa_panels": 1024, "kappa_nodes": 32, "energy_panels": 2048,
        "energy_nodes": 32, "epsilon_exponents": [32, 40, 48, 56, 64, 72, 80, 88, 96],
        "Hadamard_order": 20,
    }, inherited["primary"])
    check("rust_inherited_counts", inherited["rust"] == {
        "radial_degree": 28, "Taylor_steps_per_cell": 48, "angular_max": 287,
        "subtraction_order": 22, "kappa_panels": 1536, "kappa_nodes": 24,
        "energy_panels": 2304, "energy_nodes": 24,
        "epsilon_exponents": [36, 44, 52, 60, 68, 76, 84, 92, 100],
        "Hadamard_order": 22,
    }, inherited["rust"])

    coordinates = contract["shared_exact_coordinates"]
    check("jet_count", coordinates["jet_count_through_four"] == comb(8, 4) == 70, coordinates["jet_count_through_four"])
    check("energy_endpoint", "4095/4096" in coordinates["energy_truncation"], coordinates["energy_truncation"])
    check("threshold_not_discarded", contract["common_total_rules"]["threshold_rule"].startswith("lambda=1 belongs"), contract["common_total_rules"]["threshold_rule"])

    p = contract["primary_cpp_arb_total_algorithm"]
    r = contract["independent_pure_rust_total_algorithm"]
    check("primary_radial_total", p["P08_radial_resolvent"]["budgets"] == {
        "cells": 256, "nodes_per_cell": 25, "unknowns_per_cell": 50,
        "LU_per_cell_solution": 1, "defect_sweeps": 8,
        "defect_enclosure_degree": 48, "projection_passes": 1,
    }, p["P08_radial_resolvent"]["budgets"])
    check("rust_radial_total", r["R08_radial_resolvent"]["budgets"] == {
        "cells": 256, "steps_per_cell": 48, "Taylor_degree": 28,
        "Picard_iterations": 12, "seed_radius_cap": "2^-16",
        "projection_passes_per_cell": 1,
    }, r["R08_radial_resolvent"]["budgets"])

    pb = p["P10_negative_axis"]["budgets"]
    rb = r["R10_negative_axis"]["budgets"]
    check("primary_kappa_panel_cover", Fraction(1023, 1048576) * pb["panels"] == Fraction(1023, 1024), pb)
    check("rust_kappa_panel_cover", Fraction(1, 128) * rb["panels"] == 12, rb)
    check("primary_GL32", pb["nodes_per_panel"] == 32 and pb["rational_bisections_per_root"] == 600 and pb["interval_Newton_steps_per_root"] == 16, pb)
    check("rust_TS24", rb["nodes_per_panel"] == 24 and rb["tanh_sinh_h"] == "1/8" and rb["pi_series_terms"] == 160, rb)

    pe = p["P11_physical_measure_and_smearing"]["budgets"]
    re = r["R11_physical_measure_and_smearing"]["budgets"]
    check("primary_energy_panel_cover", Fraction(4095, 8388608) * pe["base_energy_panels"] == Fraction(4095, 4096), pe)
    check("rust_energy_panel_cover", Fraction(4095, 9437184) * re["base_energy_panels"] == Fraction(4095, 4096), re)
    check("energy_counts_preserved", pe["nodes_per_panel"] == 32 and re["nodes_per_panel"] == 24 and pe["epsilon_levels"] == re["epsilon_levels"] == 9, [pe, re])
    check("smearing_disjoint", pe["smearing_panels_per_coordinate"] == 128 and re["smearing_panels_per_coordinate"] == 192, [pe, re])

    weight_details: dict[str, object] = {}
    moments_pass = True
    for lane in ("primary", "rust"):
        exponents = inherited[lane]["epsilon_exponents"]
        weights = vandermonde_weights(exponents)
        eps = [Fraction(1, 1 << exponent) for exponent in exponents]
        moments = [sum(weight * value**power for weight, value in zip(weights, eps)) for power in range(9)]
        moments_pass &= moments == [Fraction(1)] + [Fraction(0)] * 8
        weight_details[lane] = {
            "weights_sha256": hashlib.sha256(";".join(f"{w.numerator}/{w.denominator}" for w in weights).encode()).hexdigest(),
            "moments": [f"{m.numerator}/{m.denominator}" for m in moments],
        }
    check("Richardson_exact_moments", moments_pass, weight_details)

    check("Hadamard_orders", p["P12_Hadamard_RSET"]["budgets"]["transport_order"] == 20 and r["R12_Hadamard_RSET"]["budgets"]["transport_order"] == 22, [p["P12_Hadamard_RSET"]["budgets"], r["R12_Hadamard_RSET"]["budgets"]])
    check("Hadamard_jets", p["P12_Hadamard_RSET"]["budgets"]["jet_multiindices"] == r["R12_Hadamard_RSET"]["budgets"]["jet_multiindices"] == 70, True)
    check("noise_inventory", p["P13_noise_Gram"]["budgets"]["vectors"] == r["R13_noise_Gram"]["budgets"]["vectors"] == 256 and p["P13_noise_Gram"]["budgets"]["matrix_entries"] == r["R13_noise_Gram"]["budgets"]["matrix_entries"] == 65536 and p["P13_noise_Gram"]["budgets"]["lower_entries"] == r["R13_noise_Gram"]["budgets"]["lower_entries"] == 32896, True)
    check("noise_algorithms_disjoint", "Cholesky" in p["P13_noise_Gram"]["factor"] and "modified Gram-Schmidt" in r["R13_noise_Gram"]["factor"], True)

    error = contract["common_total_rules"]
    check("eight_error_components", len(error["error_components"]) == len(set(error["error_components"])) == 8, error["error_components"])
    check("component_sum_closes_total", Fraction(8, 1 << 132) < Fraction(1, 1 << 120), "8*2^-132 < 2^-120")
    check("touch_fails", "equality touches and fails" in error["strictness"], error["strictness"])
    check("no_fallback", "without precision escalation" in error["no_fallback"], error["no_fallback"])

    abi = contract["role_record_abi"]
    expected_roles = {"P08_R08", "P09_R09", "P10_R10", "P11_R11", "P12_R12", "P13_R13"}
    check("all_role_payloads", expected_roles.issubset(abi), sorted(expected_roles))
    frozen_keys = abi["frozen_envelope"]["required_keys"]
    check("record_chain_fields", "previous_record_sha256" in frozen_keys and "payload_sha256" in frozen_keys and "record_self_sha256" in frozen_keys and abi["common_suffix"][-1] == "partial_output_inventory", [frozen_keys, abi["common_suffix"]])
    check("partial_omits_later", "omit all later scientific fields" in abi["partial_output_rule"], abi["partial_output_rule"])
    check("failure_precedence_total", len(abi["within_role_failure_precedence"]) == 13 and len(set(abi["within_role_failure_precedence"])) == 13, abi["within_role_failure_precedence"])

    fixtures = contract["exhaustion_fixtures"]
    check("ten_exhaustion_classes", len(fixtures["required_per_lane"]) == 10 and len(set(fixtures["required_per_lane"])) == 10, fixtures["required_per_lane"])
    check("seven_corruption_classes", len(fixtures["corruption"]) == 7 and len(set(fixtures["corruption"])) == 7, fixtures["corruption"])

    closure = contract["closure_predicates"]
    check("atom_safe_measure", closure["pointwise_spectral_density_assumption"] is False and closure["finite_bound_pole_inventory_assumption"] is False and closure["threshold_mass_discarded"] is False, closure)
    check("weighted_Poisson_remainders", "sum_j |w_j|*epsilon_j^9" in p["P11_physical_measure_and_smearing"]["remainder"] and "sum_j |w_j|*epsilon_j^9" in r["R11_physical_measure_and_smearing"]["remainder"], [p["P11_physical_measure_and_smearing"]["remainder"], r["R11_physical_measure_and_smearing"]["remainder"]])
    check("state_remainder_not_geometric_transport", "not generated by local geometric transport" in p["P12_Hadamard_RSET"]["state_remainder"] and "never infer" in r["R12_Hadamard_RSET"]["state_remainder"], [p["P12_Hadamard_RSET"]["state_remainder"], r["R12_Hadamard_RSET"]["state_remainder"]])
    check("D4_transport_equations_explicit", "(n+1)*(2*n+4)" in p["P12_Hadamard_RSET"]["transport_equations"] and "V_0/V_(n+1) equations" in r["R12_Hadamard_RSET"]["transport_equations"], [p["P12_Hadamard_RSET"]["transport_equations"], r["R12_Hadamard_RSET"]["transport_equations"]])
    check("all_loops_finite_claim", closure["all_new_loops_have_literal_finite_budgets"] is True, closure)
    check("no_candidate_ingress", closure["candidate_ingress"] is False and closure["execution_authorized"] is False, closure)

    readiness = contract["readiness"]
    check("sealed_readiness_bounded", readiness == {
        "contract_draft_complete": True,
        "exact_definition_audit_complete": True,
        "source_language_disjoint_replay_complete": True,
        "definition_sealed": True,
        "quantum_source_implementation_eligible": True,
        "candidate_evaluated": False,
        "execution_authorized": False,
    }, readiness)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("rust_root_absent", not RUST_ROOT.exists(), str(RUST_ROOT.relative_to(ROOT)))
    check("all_authority_false", not any(contract["authority"].values()), contract["authority"])

    passed = sum(item["pass"] is True for item in checks)
    report = {
        "schema": "nhm2.g2h_e_s4_r2.total_quantum_builder_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS validates a candidate-neutral draft definition only; it is not a quantum proof or scientific execution",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "execution_authorized": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_SOURCE_LANGUAGE_DISJOINT_DEFINITION_REPLAY",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
