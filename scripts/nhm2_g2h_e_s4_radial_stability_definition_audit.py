#!/usr/bin/env python3
"""Definition/manufactured audit for the S4-R1 radial-stability proof ABI.

This script evaluates exact formulas and synthetic fixtures only.  It never
loads a boson-star center, a continuation sample, or either future output root.
"""

from __future__ import annotations

import hashlib
import json
from fractions import Fraction
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-radial-stability-contract.v1.json"
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
STATE_GRID = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json"
CONTINUATION = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-continuation-tube-contract.v1.json"
MASS = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-mass-observable-contract.v1.json"
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
    check("state_grid_hash", digest(STATE_GRID) == predecessors["state_grid_v2"]["raw_sha256"], digest(STATE_GRID))
    check("continuation_hash", digest(CONTINUATION) == predecessors["continuation"]["raw_sha256"], digest(CONTINUATION))
    check("mass_hash", digest(MASS) == predecessors["mass"]["raw_sha256"], digest(MASS))

    # Exact normalization replay in coefficient-vector form.  Coordinates are
    # A=omega^2*sigma^2/alpha^2, B=sigma'^2/b^2, C=sigma^2.
    half = Fraction(1, 2)
    rho_r2 = (half, half, half)
    psi_square = half
    alcubierre_bracket = tuple(psi_square * value for value in (1, 1, 1))
    check("psi_square_map", psi_square == half, str(psi_square))
    check("matter_bracket_map", alcubierre_bracket == rho_r2, [str(value) for value in alcubierre_bracket])
    check("mass_prime_map", tuple(half * value for value in alcubierre_bracket) == tuple(half * value for value in rho_r2), True)

    # alpha^2/gamma^2 under alpha=1/(b*s), gamma=b.
    b, s = sp.symbols("b s", positive=True)
    alpha = 1 / (b * s)
    p = sp.simplify(alpha**2 / b**2)
    check("principal_coefficient", p == 1 / (b**4 * s**2), str(p))
    check("theta_prime", sp.simplify(sp.Symbol("omega") * b / alpha) == sp.Symbol("omega") * b**2 * s, str(sp.simplify(sp.Symbol("omega") * b / alpha)))

    # Rotation-conjugation derivative used by the matrix Riccati certificate.
    k11, k12, k22, theta_p = sp.symbols("k11 k12 k22 theta_p", real=True)
    K = sp.Matrix([[k11, k12], [k12, k22]])
    J = sp.Matrix([[0, -1], [1, 0]])
    commutator = sp.simplify(K * J - J * K)
    check("KJ_minus_JK_symmetric", commutator == commutator.T, str(commutator))
    theta = sp.symbols("theta", real=True)
    R = sp.Matrix([[sp.cos(theta), -sp.sin(theta)], [sp.sin(theta), sp.cos(theta)]])
    dK = sp.Matrix([[sp.symbols("dk11"), sp.symbols("dk12")], [sp.symbols("dk12"), sp.symbols("dk22")]])
    direct = sp.diff(R.T, theta) * theta_p * K * R + R.T * dK * R + R.T * K * sp.diff(R, theta) * theta_p
    conjugated = R.T * (dK + theta_p * commutator) * R
    check("rotated_derivative", sp.simplify(direct - conjugated) == sp.zeros(2), str(sp.simplify(direct - conjugated)))

    # Scalar version of the completed-square identity, including its sign.
    x = sp.symbols("x", real=True)
    pp = sp.Function("p")(x)
    ss = sp.Function("S")(x)
    vv = sp.Function("v")(x)
    lhs = pp * sp.diff(vv, x) ** 2 + sp.Function("V")(x) * vv**2
    square = pp * (sp.diff(vv, x) - ss * vv) ** 2
    residual = (sp.Function("V")(x) - sp.diff(pp * ss, x) - pp * ss**2) * vv**2
    boundary_derivative = sp.diff(pp * ss * vv**2, x)
    check("Riccati_identity_sign", sp.simplify(lhs - square - residual - boundary_derivative) == 0, "lhs=square+residual+(p*S*v^2)' ")

    # Positive-definite and jump fixtures exercise strict/touch/fail behavior.
    def positive_definite_2x2(m11: Fraction, m12: Fraction, m22: Fraction) -> bool:
        return m11 > 0 and m11 * m22 - m12 * m12 > 0

    def positive_semidefinite_2x2(m11: Fraction, m12: Fraction, m22: Fraction) -> bool:
        return m11 >= 0 and m22 >= 0 and m11 * m22 - m12 * m12 >= 0

    check("Riccati_cell_pass", positive_definite_2x2(Fraction(3), Fraction(1), Fraction(5)), True)
    check("Riccati_cell_touch_fails", not positive_definite_2x2(Fraction(0), Fraction(0), Fraction(5)), True)
    check("Riccati_cell_indefinite_fails", not positive_definite_2x2(Fraction(1), Fraction(2), Fraction(1)), True)
    check("jump_zero_passes", positive_semidefinite_2x2(Fraction(0), Fraction(0), Fraction(0)), True)
    check("jump_positive_passes", positive_semidefinite_2x2(Fraction(2), Fraction(1), Fraction(2)), True)
    check("jump_negative_fails", not positive_semidefinite_2x2(Fraction(-1), Fraction(0), Fraction(1)), True)

    # Verify the constant-coefficient dispersion branches algebraically.
    k, omega = sp.symbols("k omega", real=True, positive=True)
    root = sp.sqrt(k**2 + 1)
    expected = [sp.expand((root - omega) ** 2), sp.expand((root + omega) ** 2)]
    trace = 2 * (k**2 + 1 + omega**2)
    determinant = sp.expand(expected[0] * expected[1])
    W_infinity = sp.Matrix([
        [1 + 2 * omega**2, 2 * omega * sp.sqrt(1 - omega**2)],
        [2 * omega * sp.sqrt(1 - omega**2), 1 - 2 * omega**2],
    ])
    symbol = (k**2 + omega**2) * sp.eye(2) + 2 * sp.I * k * omega * J + W_infinity
    check("dispersion_trace", sp.simplify(sum(expected) - trace) == 0, str(sp.simplify(sum(expected))))
    check("symbol_trace", sp.simplify(sp.trace(symbol) - sum(expected)) == 0, str(sp.simplify(sp.trace(symbol))))
    check("symbol_determinant", sp.simplify(symbol.det() - expected[0] * expected[1]) == 0, str(sp.simplify(symbol.det())))
    check("dispersion_threshold", sp.simplify(expected[0].subs(k, 0) - (1 - omega) ** 2) == 0, str(expected[0].subs(k, 0)))
    check("dispersion_product", determinant == sp.expand(((k**2 + 1 + omega**2) ** 2 - 4 * omega**2 * (k**2 + 1))), str(determinant))

    # Manufactured compact trial: w=r(2-r)e1 on [0,2], W=4I there.
    r = sp.symbols("r", nonnegative=True)
    trial = r * (2 - r)
    norm = sp.integrate(trial**2, (r, 0, 2))
    energy = sp.integrate(sp.diff(trial, r) ** 2 + 4 * trial**2, (r, 0, 2))
    quotient = sp.simplify(energy / norm)
    check("manufactured_trial_quotient", quotient == sp.Rational(13, 2), str(quotient))
    check("manufactured_discrete_mode_predicate", 0 < 1 <= quotient < 16, {"L": 1, "U": str(quotient), "Eess": 16})
    check("zero_lower_fails", not (0 < 0 <= quotient), True)
    check("threshold_touch_fails", not (sp.Rational(16) < sp.Rational(16)), True)

    # Turning-side and chronology fixtures.
    derivative_balls = [(Fraction(1, 8), Fraction(1, 4)), (Fraction(1, 16), Fraction(1, 8))]
    check("mass_derivative_pass", all(lower > 0 for lower, _ in derivative_balls), True)
    check("mass_derivative_touch_fails", not (Fraction(0) > 0), True)
    check("mass_derivative_negative_fails", not (Fraction(-1, 8) > 0), True)
    observation_order = contract["chronology_and_record_abi"]["observation_order"]
    check("chronology_order", observation_order.index("K certificate") < observation_order.index("lower verification") < observation_order.index("trial certificate") < observation_order.index("upper verification"), observation_order)
    check("post_observation_retune_false", contract["chronology_and_record_abi"]["post_observation_retune"] is False, False)

    readiness = contract["readiness"]
    complete_keys = (
        "convention_map_complete", "operator_complete", "domain_complete",
        "endpoint_and_essential_definition_complete", "lower_certificate_definition_complete",
        "upper_certificate_definition_complete", "turning_side_definition_complete",
        "record_and_failure_definition_complete",
    )
    false_keys = (
        "fixture_audit_complete", "independent_theory_audit_complete",
        "scientific_operator_evaluated", "scientific_eigenvalue_computed",
        "implementation_authorized", "candidate_execution_authorized",
    )
    check("definition_flags_complete", all(readiness[key] is True for key in complete_keys), readiness)
    check("scientific_and_authority_flags_false", all(readiness[key] is False for key in false_keys), readiness)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", all(value is False for value in contract["authority"].values()), contract["authority"])

    passed_count = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.radial_stability_definition_audit.v1",
        "status": "PASS" if passed_count == len(checks) else "FAIL",
        "meaning": "PASS validates exact definitions and manufactured fixtures only; no selected-member operator or eigenvalue was evaluated",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": passed_count,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_INDEPENDENT_THEORY_AUDIT_AND_QUANTUM_DEFINITION",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if passed_count == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
