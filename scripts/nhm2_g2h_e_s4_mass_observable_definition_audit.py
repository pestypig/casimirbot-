#!/usr/bin/env python3
"""Symbolic/manufactured audit of S4-R1 mass observable definitions."""

from __future__ import annotations

import hashlib
import json
from fractions import Fraction
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-mass-observable-contract.v1.json"
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    check("r2_hash", digest(R2) == contract["immutable_predecessor"]["sha256"], digest(R2))

    r = sp.symbols("r", positive=True)
    b = sp.Function("b")(r)
    rho = sp.symbols("rho")
    m = r * (1 - b ** -2) / 2
    bprime = (b - b**3) / (2 * r) + b**3 * r * rho / 2
    mprime = sp.simplify(sp.diff(m, r).subs(sp.diff(b, r), bprime))
    check("mass_derivative", sp.simplify(mprime - r**2 * rho / 2) == 0, str(mprime))

    M = sp.symbols("M", positive=True)
    alpha = sp.sqrt(1 - 2 * M / r)
    b_schwarzschild = 1 / alpha
    komar_boundary = sp.simplify(r**2 * sp.diff(alpha, r) / b_schwarzschild)
    check("Schwarzschild_Komar_boundary", sp.simplify(komar_boundary - M) == 0, str(komar_boundary))
    adm_boundary = sp.simplify(r * (1 - b_schwarzschild ** -2) / 2)
    check("Schwarzschild_ADM_boundary", sp.simplify(adm_boundary - M) == 0, str(adm_boundary))

    X, Y, Z = sp.symbols("X Y Z")
    rho_expr, pr_expr, pt_expr = X + Y + Z, X + Y - Z, X - Y - Z
    check("stress_combination", sp.simplify(rho_expr + pr_expr + 2 * pt_expr - (4 * X - 2 * Z)) == 0, str(sp.simplify(rho_expr + pr_expr + 2 * pt_expr)))

    # Manufactured rho=(105/8)*(1-r^2)^2 on [0,1] has M_energy=1/2.
    rho_manufactured = sp.Rational(105, 8) * (1 - r**2) ** 2
    manufactured_mass = sp.integrate(r**2 * rho_manufactured / 2, (r, 0, 1))
    check("manufactured_integrated_mass", manufactured_mass == sp.Rational(1, 2), str(manufactured_mass))

    balls = [(Fraction(1), Fraction(2)), (Fraction(3, 2), Fraction(5, 2)), (Fraction(5, 4), Fraction(7, 4)), (Fraction(4, 3), Fraction(5, 3))]
    intersection = (max(ball[0] for ball in balls), min(ball[1] for ball in balls))
    check("common_intersection", intersection[0] <= intersection[1], [str(value) for value in intersection])
    disjoint = [(Fraction(0), Fraction(1)), (Fraction(2), Fraction(3))]
    check("empty_intersection_fails", max(ball[0] for ball in disjoint) > min(ball[1] for ball in disjoint), True)
    check("identity_contains_zero", Fraction(-1, 1 << 402) <= 0 <= Fraction(1, 1 << 402) and Fraction(1, 1 << 401) <= Fraction(1, 1 << 400), True)
    check("identity_width_failure", Fraction(1, 1 << 399) > Fraction(1, 1 << 400), True)
    check("proper_volume_not_equality_mass", "not one of the three R2-C09 equality masses" in contract["integrated_energy_mass"]["proper_volume_comparator"], contract["integrated_energy_mass"]["proper_volume_comparator"])

    readiness = contract["readiness"]
    check("definition_complete", all(readiness[key] is True for key in ("mass_unit_complete", "ADM_map_complete", "Komar_maps_complete", "integrated_map_complete", "agreement_predicates_complete")), readiness)
    check("scientific_mass_false", all(readiness[key] is False for key in ("fixture_audit_complete", "independent_definition_audit_complete", "scientific_mass_computed", "implementation_authorized", "candidate_execution_authorized")), readiness)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", all(value is False for value in contract["authority"].values()), contract["authority"])

    passed = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.mass_observable_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS validates mass conventions and manufactured identities only; no selected-member mass was computed",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_RADIAL_STABILITY_DEFINITION",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
