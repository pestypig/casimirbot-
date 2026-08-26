#!/usr/bin/env python3
"""Independent static/fixture audit for the draft G2H-E-S4-R1 analytic seed.

This script authenticates inherited, already-persisted Newtonian predictor bytes
and replays exact-dyadic algebra.  It never samples a positive R2 continuation
parameter and never creates a candidate output root.
"""

from __future__ import annotations

import hashlib
import json
import math
import struct
import sys
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-analytic-seed-contract.v1.json"
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def binary64_fraction(word: bytes) -> Fraction:
    if len(word) != 8:
        raise ValueError("binary64_short_read")
    bits = int.from_bytes(word, "little", signed=False)
    sign = -1 if bits >> 63 else 1
    exponent = (bits >> 52) & 0x7FF
    fraction = bits & ((1 << 52) - 1)
    if exponent == 0x7FF:
        raise ValueError("binary64_nonfinite")
    if exponent == 0:
        if fraction == 0:
            if sign < 0:
                raise ValueError("binary64_negative_zero")
            return Fraction(0)
        return sign * Fraction(fraction, 1 << 1074)
    significand = (1 << 52) + fraction
    power = exponent - 1075
    return sign * (Fraction(significand << power) if power >= 0 else Fraction(significand, 1 << (-power)))


def read_dyadics(path: Path) -> list[Fraction]:
    payload = path.read_bytes()
    if len(payload) % 8:
        raise ValueError("binary64_trailing_byte")
    return [binary64_fraction(payload[offset : offset + 8]) for offset in range(0, len(payload), 8)]


def chebyshev_value(coefficients: list[Fraction], t: Fraction) -> Fraction:
    if not coefficients:
        return Fraction(0)
    total = coefficients[0]
    if len(coefficients) == 1:
        return total
    t_previous = Fraction(1)
    t_current = t
    total += coefficients[1] * t_current
    for coefficient in coefficients[2:]:
        t_next = 2 * t * t_current - t_previous
        total += coefficient * t_next
        t_previous, t_current = t_current, t_next
    return total


def chebyshev_value_and_t_derivative(
    coefficients: list[Fraction], t: Fraction
) -> tuple[Fraction, Fraction]:
    if not coefficients:
        return Fraction(0), Fraction(0)
    total = coefficients[0]
    derivative = Fraction(0)
    if len(coefficients) == 1:
        return total, derivative
    t_previous, t_current = Fraction(1), t
    d_previous, d_current = Fraction(0), Fraction(1)
    total += coefficients[1] * t_current
    derivative += coefficients[1] * d_current
    for coefficient in coefficients[2:]:
        t_next = 2 * t * t_current - t_previous
        d_next = 2 * t_current + 2 * t * d_current - d_previous
        total += coefficient * t_next
        derivative += coefficient * d_next
        t_previous, t_current = t_current, t_next
        d_previous, d_current = d_current, d_next
    return total, derivative


def main() -> int:
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    check("draft_unsealed", contract["status"].startswith("draft_unsealed_"), contract["status"])
    check("gate_header", contract["work_packet_header"]["program_gate"] == "G2H-E-S4-R1", contract["work_packet_header"]["program_gate"])
    check("r2_raw_hash", sha256(R2) == contract["immutable_predecessor"]["sha256"], sha256(R2))

    for binding in contract["ordered_payload_bindings"]:
        path = ROOT / binding["path"]
        check(f"payload_{binding['ordinal']}_exists", path.is_file(), binding["path"])
        check(f"payload_{binding['ordinal']}_size", path.stat().st_size == binding["size_bytes"], path.stat().st_size)
        check(f"payload_{binding['ordinal']}_hash", sha256(path) == binding["raw_sha256"], sha256(path))

    for lineage_name in ("m5_r1_independent_admission", "b1_r1_materialization", "b1_r2_persistence"):
        binding = contract["admitted_seed_lineage"][lineage_name]
        path = ROOT / binding["path"]
        check(f"{lineage_name}_hash", sha256(path) == binding["raw_sha256"], sha256(path))
        check(f"{lineage_name}_size", path.stat().st_size == binding["size_bytes"], path.stat().st_size)
        receipt = json.loads(path.read_text(encoding="utf-8"))
        no_candidate = receipt.get("noCandidateSolve") is True or receipt.get("candidateExecuted") is False
        check(f"{lineage_name}_no_candidate", no_candidate, {"noCandidateSolve": receipt.get("noCandidateSolve"), "candidateExecuted": receipt.get("candidateExecuted")})

    payloads = {binding["role"]: read_dyadics(ROOT / binding["path"]) for binding in contract["ordered_payload_bindings"]}
    check("scalar_count", len(payloads["scalars"]) == 9, len(payloads["scalars"]))
    check("core_u_count", len(payloads["core_u_chebyshev_coefficients"]) == 128, len(payloads["core_u_chebyshev_coefficients"]))
    check("core_V_count", len(payloads["core_V_chebyshev_coefficients"]) == 128, len(payloads["core_V_chebyshev_coefficients"]))
    check("tail_H_positive_zero", all(value == 0 for value in payloads["tail_H_correction_coefficients"]), len(payloads["tail_H_correction_coefficients"]))
    check("tail_Q_positive_zero", all(value == 0 for value in payloads["tail_Q_correction_coefficients"]), len(payloads["tail_Q_correction_coefficients"]))

    nu0, vc, _, c_value, kappa, tail_power, _, _, _ = payloads["scalars"]
    delta = nu0 - vc
    check("nu0_negative", nu0 < 0, "exact_dyadic_sign")
    check("vc_below_nu0", vc < nu0, "exact_dyadic_order")
    check("delta_positive", delta > 0, "exact_dyadic_sign")
    check("C_positive", c_value > 0, "exact_dyadic_sign")
    check("kappa_positive", kappa > 0, "exact_dyadic_sign")

    u_coefficients = payloads["core_u_chebyshev_coefficients"]
    v_coefficients = payloads["core_V_chebyshev_coefficients"]
    u_origin = chebyshev_value(u_coefficients, Fraction(-1))
    v_origin = chebyshev_value(v_coefficients, Fraction(-1))
    check("legacy_u_origin_rounding_consistent", abs(u_origin - 1) <= Fraction(1, 1 << 48), "abs_error_le_2^-48")
    check("legacy_Vc_rounding_consistent", abs(v_origin - vc) <= Fraction(1, 1 << 48), "abs_error_le_2^-48")

    t_join = Fraction(31, 33)
    u_join, u_t_join = chebyshev_value_and_t_derivative(u_coefficients, t_join)
    v_join, v_t_join = chebyshev_value_and_t_derivative(v_coefficients, t_join)
    # t=2*z/(1+z)-1, hence dt/dz=2/(1+z)^2=2/1089 at z=32.
    u_prime_join = u_t_join * Fraction(2, 1089)
    v_prime_join = v_t_join * Fraction(2, 1089)
    legacy_u, legacy_u_prime, legacy_v, legacy_v_prime = payloads["legacy_join_barrier_diagnostic_only"]
    join_tolerance = Fraction(1, 1 << 44)
    check("legacy_U_rounding_consistent", abs(u_join - legacy_u) <= join_tolerance, "abs_error_le_2^-44")
    check("legacy_U1_rounding_consistent", abs(u_prime_join - legacy_u_prime) <= join_tolerance, "abs_error_le_2^-44")
    check("legacy_V_rounding_consistent", abs(v_join - legacy_v) <= join_tolerance, "abs_error_le_2^-44")
    check("legacy_V1_rounding_consistent", abs(v_prime_join - legacy_v_prime) <= join_tolerance, "abs_error_le_2^-44")

    # Exact manufactured replay of the C1 lift equations at z=R.  These
    # identities do not sample an R2 continuation parameter.
    radius = Fraction(32)
    h_eta = (-radius * kappa + tail_power) * u_join - radius * u_prime_join
    q_one = v_join + c_value / radius
    q_eta = (-2 * radius * kappa + 2 * tail_power) * q_one + c_value / radius - radius * v_prime_join
    reconstructed_u_prime = (-kappa + tail_power / radius) * u_join - h_eta / radius
    reconstructed_v_prime = c_value / (radius * radius) + 2 * (-kappa + tail_power / radius) * q_one - q_eta / radius
    check("tail_u_C1_identity", reconstructed_u_prime == u_prime_join, "exact_fraction_identity")
    check("tail_V_C1_identity", reconstructed_v_prime == v_prime_join, "exact_fraction_identity")

    zero_rule = contract["continuation_scale"]["lambda_zero_branch"]
    check("lambda_zero_exact_branch", "exact Minkowski/zero-field seed" in zero_rule, zero_rule)
    check("positive_lambda_fixture_forbidden", "evaluation at any positive R2 continuation lambda" in contract["fixture_boundary"]["forbidden"], "static_only")
    inverse = contract["finite_radius_inverse_algorithm"]
    check("inverse_mathematical_result_complete", inverse["status"].startswith("mathematical_result_and_acceptance_complete_"), inverse["status"])
    check("inverse_vacuum_exact", inverse["vacuum"] == "at lambda=0 return x=r exactly", inverse["vacuum"])
    check("inverse_no_point_export", inverse["output_enclosure"]["point_value_export"] is False, inverse["output_enclosure"])
    check("inverse_disjoint_realizations", inverse["implementation_disjointness"]["bitwise_equal_intermediate_algorithm_required"] is False and inverse["implementation_disjointness"]["joint_enclosure_and_same_mathematical_root_required"] is True, inverse["implementation_disjointness"])
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", not any(contract["authority"].values()), contract["authority"])

    passed = all(item["pass"] for item in checks)
    result = {
        "schema": "nhm2.g2h_e_s4_r1.analytic_seed_audit.v1",
        "status": "PASS" if passed else "FAIL",
        "contract_raw_sha256": sha256(CONTRACT),
        "checks_passed": sum(bool(item["pass"]) for item in checks),
        "checks_total": len(checks),
        "candidate_evaluations": 0,
        "positive_lambda_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_INDEPENDENT_SEED_AND_STATE_GRID_DEFINITION_AUDIT" if passed else "STOP_DEFINITION_REVIEW",
        "checks": checks,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
