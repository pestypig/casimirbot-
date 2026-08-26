#!/usr/bin/env python3
"""Exact symbolic replay of the S4-R1 vacuum blow-up chart.

No positive continuation parameter is sampled and no candidate root is made.
"""

from __future__ import annotations

import hashlib
import json
import struct
import sys
from fractions import Fraction
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-vacuum-blow-up-chart.v1.json"
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
SCALARS = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1/scalars.f64le"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exact_double(word: bytes) -> Fraction:
    bits = int.from_bytes(word, "little")
    sign = -1 if bits >> 63 else 1
    exponent = (bits >> 52) & 0x7FF
    mantissa = bits & ((1 << 52) - 1)
    if exponent == 0x7FF or (exponent == 0 and mantissa == 0 and sign < 0):
        raise ValueError("invalid_binary64")
    if exponent == 0:
        return sign * Fraction(mantissa, 1 << 1074)
    significand = (1 << 52) + mantissa
    power = exponent - 1075
    return sign * (Fraction(significand << power) if power >= 0 else Fraction(significand, 1 << (-power)))


def main() -> int:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    check("r2_hash", sha256(R2) == contract["immutable_predecessor"]["sha256"], sha256(R2))
    check("scalar_hash", sha256(SCALARS) == contract["seed_binding"]["scalar_payload_raw_sha256"], sha256(SCALARS))
    words = [exact_double(SCALARS.read_bytes()[offset : offset + 8]) for offset in range(0, 72, 8)]
    delta = words[0] - words[1]
    check("delta_exact_positive", delta > 0, "exact_dyadic_order")

    eta, xi = sp.symbols("eta xi", positive=True)
    mbar, ell, u, w, nbar = sp.symbols("Mbar L U W Nbar")
    mbar_xi, ell_xi = sp.symbols("Mbar_xi L_xi")
    f = 1 - 2 * eta * mbar / xi
    exponential = sp.exp(2 * eta * ell)
    frequency_squared = 1 + 2 * eta * nbar

    scaled_rho = exponential * frequency_squared * u**2 / f + eta * f * w**2 + u**2
    scaled_m = xi**2 * scaled_rho / 2
    scaled_l = -xi * (exponential * frequency_squared * u**2 / f**2 + eta * w**2)
    q_numerator = exponential * frequency_squared - f
    q_limit = sp.simplify(sp.diff(q_numerator, eta).subs(eta, 0))
    check("Q_eta_zero_limit", sp.simplify(q_limit - 2 * (ell + nbar + mbar / xi)) == 0, str(q_limit))
    check("mass_eta_zero", sp.simplify(scaled_m.subs(eta, 0) - xi**2 * u**2) == 0, str(scaled_m.subs(eta, 0)))
    check("L_eta_zero", sp.simplify(scaled_l.subs(eta, 0) + xi * u**2) == 0, str(scaled_l.subs(eta, 0)))

    # The member quotient has analytic limit L(0)+Nbar-delta.
    member_numerator = sp.exp(eta * ell) * sp.sqrt(1 + 2 * eta * nbar) - 1
    member_limit = sp.simplify(sp.diff(member_numerator, eta).subs(eta, 0))
    check("member_eta_zero_limit", sp.simplify(member_limit - (ell + nbar)) == 0, str(member_limit))

    # Exact SP recovery using V=-(L+Mbar/xi), Mbar'=xi^2 U^2 and L'=-xi U^2.
    potential_derivative = sp.diff(-(ell + mbar / xi), xi)
    potential_derivative = potential_derivative.subs({sp.Derivative(ell, xi): ell_xi, sp.Derivative(mbar, xi): mbar_xi})
    # Symbols above are constants to SymPy, so assemble the total derivative explicitly.
    potential_derivative = -ell_xi - mbar_xi / xi + mbar / xi**2
    potential_derivative = sp.simplify(potential_derivative.subs({ell_xi: -xi * u**2, mbar_xi: xi**2 * u**2}))
    check("poisson_first_integral", potential_derivative == mbar / xi**2, str(potential_derivative))

    # Manufactured even-origin identity: W'= -Q0*U0/3.
    q0, u0 = sp.symbols("Q0 U0")
    u2 = -q0 * u0 / 6
    w_prime_origin = 2 * u2
    check("origin_KG_factor", sp.simplify(w_prime_origin + q0 * u0 / 3) == 0, str(w_prime_origin))

    readiness = contract["readiness"]
    check("operator_complete", readiness["exact_change_of_variables_complete"] is True and readiness["eta_zero_operator_complete"] is True, readiness)
    check("proofs_still_false", all(readiness[key] is False for key in ("sp_endpoint_proved", "simple_kernel_proved", "transversality_proved", "first_cell_validated", "positive_tail_overlap_proved", "state_grid_unblocked", "implementation_authorized", "candidate_execution_authorized")), readiness)
    check("zero_positive_samples", contract["continuation_chart_assignment"]["positive_parameter_sampled_now"] is False, contract["continuation_chart_assignment"])
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", not any(contract["authority"].values()), contract["authority"])

    passed = all(entry["pass"] for entry in checks)
    result = {
        "schema": "nhm2.g2h_e_s4_r1.vacuum_chart_replay.v1",
        "status": "PASS" if passed else "FAIL",
        "contract_raw_sha256": sha256(CONTRACT),
        "checks_passed": sum(bool(entry["pass"]) for entry in checks),
        "checks_total": len(checks),
        "candidate_evaluations": 0,
        "positive_lambda_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_ENDPOINT_VALIDATION_AND_OVERLAP_DEFINITION" if passed else "STOP_VACUUM_CHART_DEFINITION",
        "checks": checks,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
