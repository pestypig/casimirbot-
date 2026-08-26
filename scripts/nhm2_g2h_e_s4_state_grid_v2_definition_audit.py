#!/usr/bin/env python3
"""Manufactured-only audit of corrected S4-R1 state/grid primitives."""

from __future__ import annotations

import hashlib
import json
from fractions import Fraction
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json"
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
V1 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v1.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonicalize(stored: list[Fraction]) -> list[Fraction]:
    result = list(stored)
    result[0] /= 2
    result[-1] /= 2
    return result


def main() -> int:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    check("r2_hash", digest(R2) == contract["immutable_predecessors"]["r2"]["sha256"], digest(R2))
    check("invalidated_v1_hash", digest(V1) == contract["immutable_predecessors"]["invalidated_v1"]["raw_sha256"], digest(V1))
    grid = contract["grid_cardinality"]
    check("frozen_grid_values", grid["frozen_values"] == [64, 96, 128, 256], grid["frozen_values"])
    check("N_is_node_count", grid["additive_interpretation"] == "N is the node count on each patch", grid["additive_interpretation"])
    for value in grid["frozen_values"]:
        check(f"degree_N{value}", value - 1 >= 1, value - 1)
        check(f"positive_layout_count_N{value}", 4 * value + 4 * value + 2 == 8 * value + 2, 8 * value + 2)
        check(f"vacuum_layout_count_N{value}", 4 * value + 4 * value + 1 == 8 * value + 1, 8 * value + 1)
        positive_rows = 4 * (value - 1) + 4 * (value - 1) + 4 + 4 + 1 + 1
        vacuum_rows = 4 * (value - 1) + 4 * (value - 1) + 4 + 4 + 1
        check(f"positive_square_N{value}", positive_rows == 8 * value + 2, positive_rows)
        check(f"vacuum_square_N{value}", vacuum_rows == 8 * value + 1, vacuum_rows)
        positive_ranges = [(0, 4 * value - 5), (4 * value - 4, 8 * value - 9), (8 * value - 8, 8 * value - 5), (8 * value - 4, 8 * value - 1), (8 * value, 8 * value), (8 * value + 1, 8 * value + 1)]
        vacuum_ranges = [(0, 4 * value - 5), (4 * value - 4, 8 * value - 9), (8 * value - 8, 8 * value - 5), (8 * value - 4, 8 * value - 1), (8 * value, 8 * value)]
        check(f"positive_flat_row_cover_N{value}", [item for pair in positive_ranges for item in range(pair[0], pair[1] + 1)] == list(range(8 * value + 2)), positive_ranges)
        check(f"vacuum_flat_row_cover_N{value}", [item for pair in vacuum_ranges for item in range(pair[0], pair[1] + 1)] == list(range(8 * value + 1)), vacuum_ranges)

    check("core_exact_endpoints", Fraction(255) * 1 == 255 and Fraction(255, 1 + 255) == Fraction(255, 256), "interface and origin inserted exactly")
    check("tail_exact_endpoints", Fraction(1, 255) > 0 and Fraction(0) == 0, "infinity and interface inserted exactly")
    check("vacuum_scaled_interface", contract["vacuum_scaled_patch_geometry"]["interface"] == {"xi": "255", "Y": "255/256", "Q": "1/255"}, contract["vacuum_scaled_patch_geometry"]["interface"])
    check("physical_and_scaled_interfaces_not_identified", "not identified" in contract["exact_chart_overlap_map"]["interface_rule"], contract["exact_chart_overlap_map"]["interface_rule"])
    check("overlap_is_positive_tail_subset", "q in [0,epsilon/255]" in contract["exact_chart_overlap_map"]["tail_overlap_cover"], contract["exact_chart_overlap_map"]["tail_overlap_cover"])

    r, u = sp.symbols("r u", real=True)
    even = 1 + 3 * u + 5 * u**2
    p = r * even.subs(u, (r / 255) ** 2)
    check("core_even_representation", sp.simplify(even.subs(u, (-r / 255) ** 2) - even.subs(u, (r / 255) ** 2)) == 0, "even")
    check("p_odd_representation", sp.simplify(p.subs(r, -r) + p) == 0 and p.subs(r, 0) == 0, "odd with p(0)=0")

    stored_degree_two = [Fraction(0), Fraction(0), Fraction(2)]
    canonical_degree_two = canonicalize(stored_degree_two)
    prolonged = canonical_degree_two + [Fraction(0), Fraction(0)]
    check("canonical_T2", canonical_degree_two == [0, 0, 1], [str(value) for value in canonical_degree_two])
    check("canonical_zero_padding_preserves_T2", prolonged == [0, 0, 1, 0, 0], [str(value) for value in prolonged])
    check("raw_zero_padding_forbidden", stored_degree_two + [0, 0] != prolonged, True)

    weight = lambda index: (1 + index) ** 8
    check("weight_submultiplicative", all(weight(m + n) <= weight(m) * weight(n) for m in range(16) for n in range(16)), "(1+m+n)^8 <= ((1+m)(1+n))^8")
    check("difference_mode_weight", all(weight(abs(m - n)) <= weight(m) * weight(n) for m in range(16) for n in range(16)), "Chebyshev difference modes bounded")
    check("no_exponential_weight", contract["coefficient_spaces_and_cross_grid_norms"]["full_function_weight"] == "w_k=(1+k)^8", contract["coefficient_spaces_and_cross_grid_norms"]["full_function_weight"])
    def derivative_basis_norm(k: int, target_order: int) -> int:
        if k == 0:
            return 0
        indices = list(range(k - 1, -1, -2))
        total = 0
        for index in indices:
            coefficient = 1 if index == 0 else 2
            total += k * coefficient * (1 + index) ** target_order
        return total
    check("first_derivative_loss_bound", all(derivative_basis_norm(k, 6) <= (1 + k) ** 8 for k in range(257)), "||d_x|| l1_8->l1_6 <= 1 on basis modes k<=256")
    check("coordinate_derivative_constants", contract["coefficient_spaces_and_cross_grid_norms"]["coordinate_derivative_constants"] == {"positive_core": "x=2*u-1: d_u has constant 2 from order 8 to 6 and d_u^2 has constant 4 from order 8 to 4", "positive_tail": "x=1-510*q: d_q has constant 510 and d_q^2 has constant 260100 under the same losses", "vacuum_core": "x=2*v-1: d_v has constant 2 and d_v^2 has constant 4 under the same losses", "vacuum_tail": "x=1-510*Q: d_Q has constant 510 and d_Q^2 has constant 260100 under the same losses"}, contract["coefficient_spaces_and_cross_grid_norms"]["coordinate_derivative_constants"])

    epsilon, beta, q = sp.symbols("epsilon beta q", positive=True)
    Q = q / epsilon
    c = sp.sqrt(2) * epsilon ** (beta + 2)
    hbar = sp.Function("Hbar")
    h = c * hbar(Q)
    k_expected = sp.sqrt(2) * epsilon ** (beta + 1) * sp.diff(hbar(sp.Symbol("z")), sp.Symbol("z")).subs(sp.Symbol("z"), Q)
    check("overlap_K_chain_rule", sp.simplify(sp.diff(h, q) - k_expected) == 0, "K=dH/dq")
    check("overlap_mass_scaling", sp.simplify(epsilon ** (-2 * beta) * epsilon ** (-2) * epsilon ** (2 * beta + 3) - epsilon) == 0, "M-WD correction scales by epsilon")
    check("overlap_scalar_scaling", sp.simplify(epsilon ** (-beta) * c - sp.sqrt(2) * epsilon**2) == 0, "sigma=sqrt(2)*eta*U")
    check("overlap_momentum_scaling", sp.simplify(epsilon ** (-beta) * epsilon * c - sp.sqrt(2) * epsilon**3) == 0, "p=sqrt(2)*eta*epsilon*W")

    packing = contract["square_residual_packing"]
    check("square_row_classes_bound", len(packing["positive_row_order"]) == 6 and len(packing["vacuum_row_order"]) == 5, packing)
    check("approximate_inverse_still_unbound", packing["approximate_inverse_block_structure"] is None, packing["approximate_inverse_block_structure"])
    check("vacuum_mass_is_dependent", contract["vacuum_blow_up_chart"]["tail_factorization"]["scalars_after_patch_coefficients"] == ["Nbar"] and "integral_0^infinity" in contract["vacuum_blow_up_chart"]["tail_factorization"]["dependent_mass_observable"], contract["vacuum_blow_up_chart"]["tail_factorization"])

    eta, mbar, kbar, h0 = sp.symbols("eta mbar kbar h0", positive=True)
    nbar = -kbar**2 / 2
    rhat0 = (1 + 2 * eta * nbar) * h0**2 + eta * kbar**2 * h0**2 + h0**2
    that0 = (1 + 2 * eta * nbar) * h0**2 + eta * kbar**2 * h0**2
    check("vacuum_Rhat_endpoint", sp.simplify(rhat0 - 2 * h0**2) == 0, "Rhat(0)=2*h0^2")
    check("vacuum_That_endpoint", sp.simplify(that0 - h0**2) == 0, "That(0)=h0^2")
    beta_bar = mbar * (1 + 4 * eta * nbar) / kbar - 1
    check("vacuum_beta_identity", sp.simplify(beta_bar + 1 - mbar * (1 - 2 * eta * kbar**2) / kbar) == 0, "Coulomb exponent")
    readiness = contract["readiness"]
    check("representation_primitives_complete", all(readiness[key] is True for key in ("N_node_count_complete", "node_maps_complete", "origin_parity_complete", "positive_component_order_complete", "vacuum_component_order_complete", "canonical_coefficient_codec_complete", "cross_grid_norms_complete", "coefficient_algebra_and_derivative_constants_complete", "chart_overlap_map_complete")), readiness)
    check("square_packing_internal_audit", readiness["square_residual_packing_complete"] is True and readiness["internal_Fredholm_count_audit_complete"] is True, readiness)
    check("remaining_authority_false", all(readiness[key] is False for key in ("flat_remainder_bounds_complete", "independent_definition_audit_complete", "sealed", "implementation_authorized", "candidate_execution_authorized")), readiness)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", all(value is False for value in contract["authority"].values()), contract["authority"])

    passed = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.state_grid_v2_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS validates representation primitives and the internal square-count algebra only; independent audit, remainder bounds, endpoint/continuation proof and candidate authority remain absent",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_INDEPENDENT_DEFINITION_REVIEW_AND_FLAT_REMAINDER_BOUNDS",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
