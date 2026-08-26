#!/usr/bin/env python3
"""Symbolic replay of the S4-R1 positive-branch tail leading identities."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-positive-branch-tail-factorization.v1.json"
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
    check("positive_lambda_only", contract["domain"]["continuation_parameter"] == "0<lambda<=1 only", contract["domain"])
    check("vacuum_excluded", contract["domain"]["vacuum_lambda_zero_included"] is False, contract["domain"])
    check("raw_fields_excluded_from_algebra", contract["analytic_tail_unknowns"]["raw_sigma_or_p_in_coefficient_algebra"] is False, contract["analytic_tail_unknowns"])

    omega, kappa, mass, beta, h0 = sp.symbols("omega kappa M beta H0", positive=True)
    kappa_rule = {kappa**2: 1 - omega**2}

    # The 1/r KG coefficient after inserting exp(-kappa*r) r^beta into
    # asymptotic Schwarzschild EKG is
    # -2*kappa*(beta+1)+2*M*(2*omega^2-1).
    kg_coulomb = -2 * kappa * (beta + 1) + 2 * mass * (2 * omega**2 - 1)
    beta_value = mass * (2 * omega**2 - 1) / kappa - 1
    check("beta_cancels_KG_coulomb", sp.simplify(kg_coulomb.subs(beta, beta_value)) == 0, str(sp.simplify(kg_coulomb.subs(beta, beta_value))))

    rho_hat_0 = sp.Rational(1, 2) * (omega**2 + kappa**2 + 1) * h0**2
    rho_plus_pr_hat_0 = (omega**2 + kappa**2) * h0**2
    rho_hat_0 = sp.expand(rho_hat_0).subs(kappa**2, 1 - omega**2)
    rho_plus_pr_hat_0 = sp.expand(rho_plus_pr_hat_0).subs(kappa**2, 1 - omega**2)
    check("rho_hat_zero", sp.simplify(rho_hat_0 - h0**2) == 0, str(rho_hat_0))
    check("rho_plus_pr_hat_zero", sp.simplify(rho_plus_pr_hat_0 - h0**2) == 0, str(rho_plus_pr_hat_0))

    d0 = h0**2 / (4 * kappa)
    s0 = h0**2 / (4 * kappa)
    check("D0_mass_equation", sp.simplify(2 * kappa * d0 - rho_hat_0 / 2) == 0, str(sp.simplify(2 * kappa * d0 - rho_hat_0 / 2)))
    check("S0_lapse_equation", sp.simplify(2 * kappa * s0 - rho_plus_pr_hat_0 / 2) == 0, str(sp.simplify(2 * kappa * s0 - rho_plus_pr_hat_0 / 2)))

    q = sp.symbols("q", positive=True)
    h = sp.Function("H")(q)
    kval = sp.Function("K")(q)
    p_factor = (-kappa + beta * q) * h - q**2 * kval
    expected_pq = beta * h + (-kappa + (beta - 2) * q) * kval - q**2 * sp.diff(kval, q)
    actual_pq = sp.diff(p_factor, q).subs(sp.diff(h, q), kval)
    check("P_q_identity", sp.simplify(actual_pq - expected_pq) == 0, str(sp.simplify(actual_pq - expected_pq)))

    check("formal_germ_subjects", set(contract["analytic_tail_unknowns"]["coefficient_algebra_subjects"]) == {"D", "S", "H", "K"}, contract["analytic_tail_unknowns"]["coefficient_algebra_subjects"])
    check("full_functions_not_claimed_analytic", "not claimed real analytic" in contract["analytic_tail_unknowns"]["expected_regular_class"] and contract["flat_sector_correction"]["forbidden_claim"].startswith("the full exact"), contract["analytic_tail_unknowns"])
    check("flat_remainder_exact_decomposition", contract["flat_sector_correction"]["exact_decomposition"].startswith("X=X_formal+R_X"), contract["flat_sector_correction"])
    check("vacuum_blocker_explicit", contract["vacuum_endpoint_blocker"]["ordinary_positive_branch_recurrence_may_certify_vacuum_connection"] is False, contract["vacuum_endpoint_blocker"])
    recurrence = contract["formal_recurrence"]
    check("full_recurrence_bound", contract["readiness"]["full_recurrence_complete"] is True, contract["readiness"])
    check("recurrence_not_tail_proof", recurrence["formal_recurrence_is_full_tail_proof"] is False, recurrence["formal_recurrence_is_full_tail_proof"])
    check("flat_remainder_unbound", contract["readiness"]["flat_sector_remainder_complete"] is False, contract["readiness"])

    # Rational manufactured recurrence.  These values satisfy the two exact
    # identities but are unrelated to the selected member.
    omega_v = sp.Rational(3, 5)
    kappa_v = sp.Rational(4, 5)
    mass_v = sp.Rational(2, 7)
    beta_v = sp.simplify(mass_v * (2 * omega_v**2 - 1) / kappa_v - 1)
    h0_v = sp.Rational(3, 8)
    qv = sp.symbols("qv")
    order = 8
    h_coefficients = [h0_v]

    def scalar_residual(series: sp.Expr) -> sp.Expr:
        f0 = 1 - 2 * mass_v * qv
        return sp.expand(
            f0**2
            * (
                qv**4 * sp.diff(series, qv, 2)
                + (2 * kappa_v * qv**2 - 2 * beta_v * qv**3) * sp.diff(series, qv)
                + (
                    kappa_v**2
                    - 2 * kappa_v * (beta_v + 1) * qv
                    + beta_v * (beta_v + 1) * qv**2
                )
                * series
            )
            - 2
            * mass_v
            * f0
            * (qv**4 * sp.diff(series, qv) + (kappa_v * qv**2 - beta_v * qv**3) * series)
            + (omega_v**2 - f0) * series
        )

    for n in range(order):
        truncated = sum(value * qv**index for index, value in enumerate(h_coefficients))
        remainder_coefficient = sp.expand(scalar_residual(truncated)).coeff(qv, n + 2)
        next_h = sp.simplify(-remainder_coefficient / (2 * kappa_v * (n + 1)))
        h_coefficients.append(next_h)

    h_series = sum(value * qv**index for index, value in enumerate(h_coefficients))
    scalar_series = sp.series(scalar_residual(h_series), qv, 0, order + 2).removeO().expand()
    check("manufactured_beta_exact", beta_v == sp.Rational(-11, 10), str(beta_v))
    check("manufactured_scalar_recurrence", scalar_series == 0, str(scalar_series))

    f0_v = 1 - 2 * mass_v * qv
    p_over_a_v = (-kappa_v + beta_v * qv) * h_series - qv**2 * sp.diff(h_series, qv)
    rho_hat_v = omega_v**2 * h_series**2 / (2 * f0_v) + f0_v * p_over_a_v**2 / 2 + h_series**2 / 2
    rho_plus_pr_v = omega_v**2 * h_series**2 / f0_v + f0_v * p_over_a_v**2

    d_coefficients = [h0_v**2 / (4 * kappa_v)]
    e_coefficients = [h0_v**2 / (4 * kappa_v)]
    for n in range(1, order + 1):
        rho_n = sp.series(rho_hat_v / 2, qv, 0, n + 1).removeO().expand().coeff(qv, n)
        source_n = sp.series(rho_plus_pr_v / (2 * f0_v), qv, 0, n + 1).removeO().expand().coeff(qv, n)
        d_coefficients.append(sp.simplify((rho_n - (n - 2 * beta_v - 3) * d_coefficients[n - 1]) / (2 * kappa_v)))
        e_coefficients.append(sp.simplify((source_n - (n - 2 * beta_v - 2) * e_coefficients[n - 1]) / (2 * kappa_v)))

    d_series = sum(value * qv**index for index, value in enumerate(d_coefficients))
    e_series = sum(value * qv**index for index, value in enumerate(e_coefficients))
    mass_residual = sp.expand((2 * kappa_v - (2 * beta_v + 2) * qv) * d_series + qv**2 * sp.diff(d_series, qv) - rho_hat_v / 2)
    lapse_residual = sp.expand((2 * kappa_v - (2 * beta_v + 1) * qv) * e_series + qv**2 * sp.diff(e_series, qv) - rho_plus_pr_v / (2 * f0_v))
    mass_low = sp.series(mass_residual, qv, 0, order + 1).removeO().expand()
    lapse_low = sp.series(lapse_residual, qv, 0, order + 1).removeO().expand()
    check("manufactured_mass_recurrence", mass_low == 0, str(mass_low))
    check("manufactured_lapse_recurrence", lapse_low == 0, str(lapse_low))
    check("state_grid_still_blocked", contract["readiness"]["state_grid_unblocked"] is False, contract["readiness"])
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", not any(contract["authority"].values()), contract["authority"])

    passed = all(entry["pass"] for entry in checks)
    result = {
        "schema": "nhm2.g2h_e_s4_r1.positive_tail_replay.v1",
        "status": "PASS" if passed else "FAIL",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": sum(bool(entry["pass"]) for entry in checks),
        "checks_total": len(checks),
        "candidate_evaluations": 0,
        "positive_lambda_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_FLAT_REMAINDER_AND_VACUUM_CHART_RESEARCH" if passed else "STOP_TAIL_DEFINITION",
        "checks": checks,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
