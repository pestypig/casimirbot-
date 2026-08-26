#!/usr/bin/env python3
"""Fixture-only audit of the G2H-E-S4-R1 SP endpoint definition."""

from __future__ import annotations

import hashlib
import json
from fractions import Fraction
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-sp-endpoint-proof-contract.v1.json"
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
SCALARS = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1/scalars.f64le"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"
STATE_GRID = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exact_binary64_word(raw: bytes) -> Fraction:
    bits = int.from_bytes(raw, "little")
    sign = -1 if bits >> 63 else 1
    exponent = (bits >> 52) & 0x7FF
    fraction = bits & ((1 << 52) - 1)
    if exponent == 0x7FF or (exponent == 0 and fraction == 0 and sign < 0):
        raise ValueError("forbidden binary64 word")
    if exponent == 0:
        return Fraction(sign * fraction, 1 << 1074)
    significand = (1 << 52) | fraction
    shift = exponent - 1075
    return Fraction(sign * significand * (1 << max(shift, 0)), 1 << max(-shift, 0))


def main() -> int:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    check("r2_hash_preserved", sha256(R2) == contract["immutable_predecessors"]["r2"]["sha256"], sha256(R2))
    check("scalar_hash_preserved", sha256(SCALARS) == contract["exact_ingress"]["scalar_payload_sha256"], sha256(SCALARS))
    check("corrected_state_grid_hash", sha256(STATE_GRID) == contract["immutable_predecessors"]["corrected_state_grid"]["raw_sha256_at_binding"], sha256(STATE_GRID))

    words = [SCALARS.read_bytes()[i : i + 8] for i in range(0, SCALARS.stat().st_size, 8)]
    nu0, vc = exact_binary64_word(words[0]), exact_binary64_word(words[1])
    delta = nu0 - vc
    check("exact_ingress_order", vc < nu0 < 0 and delta > 0, "Vc<nu0<0 and delta>0")

    a, r = sp.symbols("a r", positive=True)
    U = sp.Function("U")
    V = sp.Function("V")
    N = sp.symbols("N", real=True)
    z = sp.symbols("z", positive=True)
    x = a * r
    ua = a**2 * U(x)
    va = a**2 * V(x)
    na = a**2 * N
    schrodinger_scaled = sp.simplify(
        -sp.diff(ua, r, 2) / 2 - sp.diff(ua, r) / r + va * ua - na * ua
    )
    poisson_scaled = sp.simplify(sp.diff(va, r, 2) + 2 * sp.diff(va, r) / r - ua**2)
    expected_s = a**4 * (
        -sp.diff(U(z), z, 2) / 2 - sp.diff(U(z), z) / z + V(z) * U(z) - N * U(z)
    ).subs(z, x)
    expected_p = a**4 * (
        sp.diff(V(z), z, 2) + 2 * sp.diff(V(z), z) / z - U(z) ** 2
    ).subs(z, x)
    check("schrodinger_scaling", sp.simplify(schrodinger_scaled - expected_s) == 0, "a^4 covariance")
    check("poisson_scaling", sp.simplify(poisson_scaled - expected_p) == 0, "a^4 covariance")

    member = a**2 * (N - sp.Symbol("V0"))
    member_derivative = sp.diff(member, a).subs(a, 1)
    check("scale_mode_member_derivative", sp.simplify(member_derivative - 2 * (N - sp.Symbol("V0"))) == 0, str(member_derivative))
    check("scale_mode_removed_for_frozen_member", 2 * delta > 0, "2*delta exact positive dyadic")

    radii = [Fraction(1, 1 << exponent) for exponent in range(192, 119, -1)]
    radius_spec = contract["validation_map"]["candidate_radii"]
    check("candidate_radius_count", len(radii) == radius_spec["count"] == 73, len(radii))
    check("candidate_radius_min", radii[0] == Fraction(1, 1 << 192), "2^-192")
    check("candidate_radius_max", radii[-1] == Fraction(1, 1 << 120), "2^-120")
    check("candidate_radii_strictly_increase", all(x < y for x, y in zip(radii, radii[1:])), True)

    def passes(y: Fraction, z0: Fraction, z1: Fraction, z2: Fraction, radius: Fraction) -> bool:
        polynomial = z2 * radius * radius - (1 - z0 - z1) * radius + y
        contraction = z0 + z1 + z2 * radius
        return polynomial < 0 and contraction < 1

    manufactured_radius = Fraction(1, 1 << 160)
    check("manufactured_strict_pass", passes(Fraction(1, 1 << 200), Fraction(1, 8), Fraction(1, 8), Fraction(1, 8), manufactured_radius), True)
    check("manufactured_polynomial_touch_fails", not passes(manufactured_radius, Fraction(0), Fraction(0), Fraction(0), manufactured_radius), True)
    check("manufactured_contraction_touch_fails", not passes(Fraction(0), Fraction(1), Fraction(0), Fraction(0), manufactured_radius), True)
    check("least_index_selection", next(i for i, candidate in enumerate(radii) if passes(Fraction(1, 1 << 200), Fraction(1, 8), Fraction(1, 8), Fraction(1, 8), candidate)) == 0, 0)

    readiness = contract["readiness"]
    check("definition_components_drafted", all(readiness[key] is True for key in ("continuous_endpoint_operator_complete", "frechet_derivative_complete", "scale_mode_border_definition_complete", "radii_predicates_complete")), readiness)
    check("scientific_proof_still_false", all(readiness[key] is False for key in ("endpoint_scientifically_executed", "endpoint_proved", "first_cell_validated", "positive_tail_overlap_proved", "implementation_authorized", "candidate_execution_authorized")), readiness)
    check("coefficient_realization_bound", readiness["coefficient_realization_complete"] is True and readiness["component_weights_complete"] is True, readiness)
    check("unbound_realizations_explicit", all(readiness[key] is False for key in ("approximate_inverse_realization_complete", "independent_definition_audit_complete")), readiness)
    check("zero_scientific_evaluations", contract["exact_ingress"]["positive_parameter_samples"] == 0 and contract["exact_ingress"]["selected_member_evaluations"] == 0, contract["exact_ingress"])
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", all(value is False for value in contract["authority"].values()), contract["authority"])

    passed = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.sp_endpoint_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS validates definition algebra and synthetic fail-closed behavior only; it is not an endpoint or candidate proof",
        "contract_raw_sha256": sha256(CONTRACT),
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "endpoint_scientific_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_COEFFICIENT_REALIZATION_REMAINDER_AND_OVERLAP_DEFINITION",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
