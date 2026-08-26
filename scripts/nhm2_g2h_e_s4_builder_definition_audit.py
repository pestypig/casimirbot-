#!/usr/bin/env python3
"""Exact/synthetic audit of the S4-R1 disjoint builder definitions.

No candidate background, positive continuation parameter or scientific output
root is an input.  This checks that implementation-time choices are finite,
total, disjoint and fail closed.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-disjoint-builder-algorithms.v1.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    for role, binding in contract["immutable_predecessors"].items():
        path = ROOT / binding["path"]
        observed = digest(path)
        check(f"{role}_hash", observed == binding["raw_sha256"], observed)

    common = contract["common_rules"]
    check("precision_fixed", common["precision"].startswith("512-bit") and "second floating precision" in common["precision"], common["precision"])
    check("projection_fixed", "2^-448" in common["projection"] and "ties choose even" in common["projection"], common["projection"])
    check("projection_not_membership_gated", "not membership of the dyadic" in common["projection"], common["projection"])
    check("least_ordinal_tie", "least canonical ordinal" in common["ordering"], common["ordering"])
    check("exhaustion_terminal", "terminates" in common["budget_exhaustion"] and "no fallback" in common["budget_exhaustion"], common["budget_exhaustion"])
    check("pre_ingress_freeze", "before any selected-background byte is read" in common["candidate_ingress_rule"], common["candidate_ingress_rule"])

    primary = contract["primary_cpp_arb_lineage"]
    independent = contract["independent_pure_rust_lineage"]
    check("lineages_distinct", "Arb/FLINT/GMP/MPFR" in primary["identity"] and "no C, GMP, MPFR, FLINT or Arb" in independent["identity"], [primary["identity"], independent["identity"]])
    check("inverse_algorithms_distinct", "complete-pivot Arb LU" in primary["classical_inverse_builder"]["finite_matrix"] and "Householder QR" in independent["classical_inverse_builder"]["finite_matrix"], True)
    check("stability_algorithms_distinct", "Chebyshev" in primary["stability_builder"]["Riccati_K"] and "Bernstein" in independent["stability_builder"]["Riccati_K"], True)
    check("quantum_algorithms_distinct", "Chebyshev collocation" in primary["quantum_builder"]["radial"] and "Taylor models" in independent["quantum_builder"]["radial"], True)

    p_inv = primary["classical_inverse_builder"]["budgets"]
    r_inv = independent["classical_inverse_builder"]["budgets"]
    check("maximum_dimension_matches_N256", p_inv["maximum_dimension"] == 2050 and r_inv["maximum_dimension"] == 2050, [p_inv["maximum_dimension"], r_inv["maximum_dimension"]])
    check("one_factorization", p_inv["LU_factorizations"] == 1 and r_inv["QR_factorizations"] == 1, [p_inv, r_inv])
    check("no_projection_retry", p_inv["projection_retries"] == 0 and r_inv["projection_retries"] == 0, [p_inv, r_inv])
    # Conservative bit bound for a 2050-square integer numerator matrix after
    # 2^-448 projection: n*(449+ceil(log2(sqrt(n)))) plus a sign bit.
    determinant_bound_bits = 2050 * (449 + math.ceil(math.log2(math.sqrt(2050)))) + 1
    modular_capacity_bits = r_inv["maximum_modular_primes_per_determinant"] * 60
    check("modular_determinant_budget_covers_bound", modular_capacity_bits > determinant_bound_bits, {"capacity_bits_lower": modular_capacity_bits, "Hadamard_bound_bits_upper": determinant_bound_bits})

    for lane_name, lane in (("primary", primary), ("independent", independent)):
        continuation = lane["continuation_builder"]["budgets"]
        check(f"{lane_name}_continuation_inventory", continuation["cells"] == 1024 and continuation["radii_per_cell"] == 73 and continuation["inverse_builds_per_cell"] == 1, continuation)
        check(f"{lane_name}_no_adaptive_continuation", continuation["adaptive_subdivisions"] == 0 and continuation["alternate_predictors"] == 0, continuation)
        stability = lane["stability_builder"]["budgets"]
        check(f"{lane_name}_stability_cover", stability["cells"] == 256 and stability["L"] == "2^-96", stability)
        quantum = lane["quantum_builder"]["budgets"]
        check(f"{lane_name}_quantum_widths", quantum["target_total_width"] == "2^-120" and quantum["per_tail_target"] == "2^-132", quantum)
        check(f"{lane_name}_quantum_no_adaptive_panels", quantum["adaptive_panels"] == 0, quantum)
        check(f"{lane_name}_limiting_absorption_levels", quantum["limiting_absorption_levels"] == 9, quantum)

    check("primary_quantum_selectors", primary["quantum_builder"]["budgets"]["ell_max"] == 255 and primary["quantum_builder"]["budgets"]["Hadamard_WKB_order"] == 20, primary["quantum_builder"]["budgets"])
    check("independent_quantum_selectors", independent["quantum_builder"]["budgets"]["ell_max"] == 287 and independent["quantum_builder"]["budgets"]["Hadamard_WKB_order"] == 22, independent["quantum_builder"]["budgets"])

    def no_nulls(value: object) -> bool:
        if value is None:
            return False
        if isinstance(value, dict):
            return all(no_nulls(key) and no_nulls(child) for key, child in value.items())
        if isinstance(value, list):
            return all(no_nulls(child) for child in value)
        return True

    check("no_null_builder_fields", no_nulls(primary) and no_nulls(independent), True)
    check("cross_lane_failure_terminal", contract["cross_lane_rules"]["one_lane_failure"].startswith("terminal pair failure"), contract["cross_lane_rules"]["one_lane_failure"])

    readiness = contract["readiness"]
    ready_keys = (
        "primary_classical_builder_complete",
        "independent_classical_builder_complete",
        "primary_stability_builder_complete",
        "independent_stability_builder_complete",
        "primary_quantum_builder_complete",
        "independent_quantum_builder_complete",
        "all_selectors_and_budgets_nonnull",
    )
    false_keys = (
        "fixture_audit_complete",
        "independent_definition_audit_complete",
        "producer_source_implemented",
        "runtime_bound",
        "candidate_evaluated",
        "implementation_authorized",
        "execution_authorized",
    )
    check("definition_flags_complete", all(readiness[key] is True for key in ready_keys), readiness)
    check("implementation_flags_false", all(readiness[key] is False for key in false_keys), readiness)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", all(value is False for value in contract["authority"].values()), contract["authority"])

    passed = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.builder_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS validates finite builder definitions and synthetic arithmetic only; no scientific builder or selected member ran",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_COMBINED_INDEPENDENT_R1_DEFINITION_AUDIT",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
