#!/usr/bin/env python3
"""Symbolic/manufactured audit of the S4-R1 flat-carrier definition."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-flat-carrier-remainder-contract.v1.json"
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
POSITIVE = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-positive-branch-tail-factorization.v1.json"
GRID = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    predecessors = contract["immutable_predecessors"]
    check("r2_hash", digest(R2) == predecessors["r2"]["sha256"], digest(R2))
    check("positive_tail_hash", digest(POSITIVE) == predecessors["positive_tail"]["raw_sha256"], digest(POSITIVE))
    check("state_grid_hash", digest(GRID) == predecessors["state_grid_v2"]["raw_sha256"], digest(GRID))

    a, b, q = sp.symbols("a b q", positive=True)
    carrier = sp.exp(-a / q) * q ** (-b)
    polynomial = sp.Integer(1)
    for order in range(5):
        reconstructed = sp.exp(-a / q) * q ** (-b - 2 * order) * polynomial
        check(f"P_reconstruct_{order}", sp.simplify(sp.diff(carrier, q, order) - reconstructed) == 0, str(sp.expand(polynomial)))
        polynomial = sp.expand((a - (b + 2 * order) * q) * polynomial + q**2 * sp.diff(polynomial, q))

    for u, v in ((1, 0), (0, 1), (2, 0), (1, 1), (0, 2)):
        expected = (-1) ** (u + v) * q ** (-u) * sp.log(q) ** v * carrier
        actual = sp.diff(carrier, a, u, b, v)
        check(f"mixed_parameter_{u}_{v}", sp.simplify(actual - expected) == 0, "exact identity")

    manufactured = carrier.subs({a: sp.Rational(3, 5), b: sp.Rational(-2, 3)})
    for order in range(5):
        check(f"flat_limit_{order}", sp.limit(sp.diff(manufactured, q, order), q, 0, dir="+") == 0, "zero")

    triples = [(u, v, j) for u in range(3) for v in range(3 - u) for j in range(13)]
    check("mixed_inventory_count", len(triples) == contract["mathematical_envelopes"]["count"] == 78, len(triples))
    check("mixed_inventory_unique", len(set(triples)) == 78, True)

    constant_upper = sp.Rational(512, 90) * sp.Rational(22, 7) ** 4
    check("constant_556_strict", constant_upper < 556, str(constant_upper))
    check("weighted_T3_manufactured", 4**8 <= 1 + 556 * 3**12, {"weighted_norm": 4**8, "bound": 1 + 556 * 3**12})

    readiness = contract["readiness"]
    check("definition_complete", all(readiness[key] is True for key in ("carrier_family_complete", "mixed_derivative_inventory_complete", "coefficient_norm_theorem_complete", "formal_subtraction_definition_complete", "record_fields_complete")), readiness)
    check("scientific_bounds_false", all(readiness[key] is False for key in ("fixture_audit_complete", "independent_definition_audit_complete", "candidate_specific_bounds_computed", "endpoint_or_continuation_proved", "implementation_authorized", "candidate_execution_authorized")), readiness)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", all(value is False for value in contract["authority"].values()), contract["authority"])

    passed = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.flat_carrier_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS validates symbolic carrier and bound definitions only; no candidate-specific bound or proof was executed",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_INDEPENDENT_REPLAY_AND_APPROXIMATE_INVERSE_DEFINITION",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
