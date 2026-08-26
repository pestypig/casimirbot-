#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-011b.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011b scalar Lyapunov/LMI/K1/K2 producer
Current maturity: implemented candidate-neutral audit target
Target maturity: independently source/runtime-audited C08-011b slice
Required frozen inputs: acknowledged Borel definition and audited C08-011a
Required evidence: exact P/Pinv/EP, compact Horner LMI and fixed K selectors
Stop/fail criteria: semantic drift, touching acceptance, sampling or candidate access
Explicit non-goals: finite continuation, growth witness, handler or execution
Downstream gate unlocked: C08-011c implementation only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-tail-lyapunov-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-tail-lyapunov-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-tail-lyapunov-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_tail_lyapunov_v1.hpp":
        "63d6f1b9353770b673f0e80e8af244a6f3e27917376c97b801748319282af473",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_tail_lyapunov_v1.cpp":
        "a1bf7f1d7da7bc7cf960b7a8c2e2dec2a5d9ee660b7eeaf5d245a50a043ab9a0",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_tail_lyapunov_fixture_v1.cpp":
        "fc5441be882eec2af8c473d1b54aa148d0d93eccf5d8fb406fd759c9c4a5cab5",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-tail-lyapunov-fixture.v1":
        "22852f79ccca7b5af0a8e124218390651162b0d95b887b742a6fb528bdace6bd",
    "scripts/nhm2_g2h_e_s5_c08_tail_split_chronology_runtime_audit.py":
        "d5e20f571b3a1d1dad59592932a90aa6cdf088051eabe31916eccbe1579671ca",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
}
EXPECTED_EXECUTABLE = "f9f39ad2d7043ce57baf7be3be858e032fa3bd9507f95534a1b30f420915b5f3"
PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False,
                          capture_output=True, text=True)


def parse_report(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{path}", digest(ROOT / path) == expected)
                  for path, expected in EXPECTED.items())
    checks.append(("protected_absent_before",
                   all(not (ROOT / path).exists() for path in PROTECTED)))

    header = (G2H / "mini_boson_star_primary_c08_tail_lyapunov_v1.hpp").read_text(
        encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_tail_lyapunov_v1.cpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_tail_lyapunov_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in header),
        ("dyadic_denominator_256", "kDyadicDenominatorBits = 256" in header),
        ("state_dimension_4", "kStateDimension = 4U" in header),
        ("parameter_dimension_3", "kParameterDimension = 3U" in header),
        ("selector_exponent_1024", "kKSelectorMaximumExponent = 1024U" in header),
        ("predecessor_required", "predecessor_c08_004_passed" in header
         and "FailureDetail::predecessor_not_passed" in source),
        ("exact_onset_schedule", all(token in source for token in (
            "1U, 2U, 4U, 8U, 16U, 32U, 64U",
            "128U, 256U, 512U, 1024U, 2048U, 4096U"))),
        ("strict_parameter_boxes", "fmpq_cmp(box.lower, box.upper) <= 0" in source
         and "fmpq_sgn(input.h0.lower) <= 0" in source
         and "fmpq_sgn(input.theta2.lower) < 0" in source),
        ("strict_denominator_margin", "fmpq_sgn(input.kappa.lower) <= 0" in source
         and "fmpq_sgn(gap) <= 0" in source),
        ("sigma0_bound_to_mu_upper", "input.theta2.upper" in source
         and "fmpq_mul_si(expected_sigma0, mu_upper, 2)" in source
         and "fmpq_equal(expected_sigma0, input.sigma0)" in source),
        ("positive_and_vacuum_mu", "input.chart == Chart::positive" in source
         and "fmpq_mul(mu, input.eta" not in source
         and "mu = scale(theta2, input.eta)" in source),
        ("lyapunov_fraction_free_solve",
         "fmpq_mat_solve_fraction_free" in source),
        ("shifted_asymptotic_matrix", all(token in source for token in (
            "fmpq_mul_si(temporary, temporary, -4)",
            "fmpq_mul_si(temporary, mu, 4)",
            "fmpq_sub(fmpq_mat_entry(shifted"))),
        ("lyapunov_equation_all_16_entries",
         "row * kStateDimension + column" in source
         and "fmpq_set_si(fmpq_mat_entry(rhs, equation, 0), -1" in source),
        ("dyadic_round_exact", "fmpz_mul_2exp(scaled, fmpq_numref(source)" in source
         and "fmpz_fdiv_qr" in source
         and "comparison == 0" in source
         and "fmpq_set_fmpz_frac" in source),
        ("rounding_touch_fails", "FailureDetail::dyadic_rounding_tie" in source),
        ("symmetry_exact", "fmpq_equal(fmpq_mat_entry(matrix" in source),
        ("exact_ldl", "exact_ldl_positive" in source
         and "fmpq_sgn(value) <= 0" in source),
        ("exact_inverse_identity", "fmpq_mat_inv" in source
         and "fmpq_mat_mul(product" in source
         and "fmpq_mat_equal(product, identity)" in source),
        ("ep_from_positive_inverse_diagonal",
         "fmpq_sgn(diagonal) <= 0" in source
         and "arb_sqrt" in source and "arb_max(output.ep" in source),
        ("polynomial_exact_coefficients",
         "std::map<Exponents, Rational>" in source
         and "fmpq_mul(product" in source),
        ("fixed_multivariate_horner", "evaluate_horner_recursive" in source
         and "maximum_exponent" in source
         and "variable_ordinal + 1U" in source),
        ("fixed_variable_order_recorded",
         "fixed_variable_order_u_h0_kappa_theta2 = true" in source),
        ("compact_u_box", "fmpq_set_ui(inverse_t0, 1UL, input.t0)" in source
         and "exact_interval(boxes.data() + 0, zero, inverse_t0)" in source),
        ("all_parameter_boxes", all(token in source for token in (
            "input.h0.lower, input.h0.upper",
            "input.kappa.lower, input.kappa.upper",
            "input.theta2.lower, input.theta2.upper"))),
        ("positive_cleared_denominator", "multiply(k2," in source
         and "add(one, multiply(two, multiply(kappa, u)))" in source),
        ("universal_row_all_four_numerators", all(token in source for token in (
            "const Polynomial r0", "const Polynomial r1",
            "const Polynomial r2", "const Polynomial r3"))),
        ("base_lmi_complete", "denominator_times_a" in source
         and "fmpq_mul_si(factor, input.sigma0, -2)" in source
         and "negative_lmi[row][column] = negate(entry)" in source),
        ("interval_ldl_strict", "interval_ldl_positive" in source
         and "!arb_is_positive(value)" in source),
        ("cleared_denominator_recorded", "cleared_denominator" in header
         and "arb_is_positive(output->cleared_denominator)" in source),
        ("no_subdivision_or_sampling", "subdivision_used = false" in source
         and "point_sampling_used = false" in source),
        ("first_derivative_quotient_exact",
         "derivative(row_numerators[column], first_variable)" in source
         and "derivative(denominator, first_variable)" in source),
        ("ordered_second_derivative_quotient_exact",
         "derivative(qa, second_variable)" in source
         and "multiply(two, multiply(qa" in source),
        ("operator_denominator_powers", "power(denominator, 4U)" in source
         and "power(denominator, 6U)" in source),
        ("operator_gram_complete", "gram_polynomial" in source
         and "q[left][row]" in source and "q[right][column]" in source),
        ("all_first_and_ordered_second", "first_derivative_matrices_verified = kParameterDimension" in source
         and "kParameterDimension * kParameterDimension" in source),
        ("all_selected_ldl_pivots_retained",
         "kParameterDimension * kStateDimension" in header
         and "kParameterDimension * kParameterDimension * kStateDimension" in header
         and "matrix_ordinal * kStateDimension + index" in source),
        ("independent_k_selectors", source.count(
            "exponent <= kKSelectorMaximumExponent") == 2),
        ("first_passing_k_selected", "output->k1_exponent = exponent" in source
         and "output->k2_exponent = exponent" in source),
        ("selected_k_values_recorded", "fmpz_mul_2exp(output->k1" in source
         and "fmpz_mul_2exp(output->k2" in source),
        ("selector_touch_or_exhaustion_fails", "k1_selector_exhausted" in source
         and "k2_selector_exhausted" in source),
        ("candidate_neutral_no_files", all(token not in source for token in (
            "fstream", "ifstream", "filesystem", "fopen", "shat", "6/5"))),
        ("authority_counters_default_zero", "candidate_evaluations = 0U" in header
         and "authority_promoted = false" in header),
        ("fixture_manufactured_positive", "641, 20UL" in fixture
         and "K1 exponent=" in fixture),
        ("fixture_manufactured_vacuum", "Chart::vacuum" in fixture
         and "2557, 80UL" in fixture),
        ("fixture_nonpoint_box", "128207, 4000UL" in fixture
         and "interval_result.accepted" in fixture),
        ("fixture_determinism", "fmpq_mat_equal(output.p_lyap" in fixture
         and "arb_equal(output.ep" in fixture),
        ("fixture_predecessor_guard", "no_predecessor" in fixture),
        ("fixture_onset_guard", "positive(3U)" in fixture),
        ("fixture_box_guard", "reversed.kappa" in fixture),
        ("fixture_sigma_guard", "sigma0_tier_mismatch" in fixture),
        ("fixture_parameter_margin_guard", "parameter_margin_not_strict" in fixture),
        ("fixture_denominator_guard", "nonpositive_denominator_margin" in fixture),
        ("fixture_null_guards", "nullptr, &null_output_result" in fixture
         and "&output, nullptr" in fixture),
        ("digest_pinned_builder", "@sha256:9e94d19f" in dockerfile),
        ("digest_pinned_runtime", "@sha256:8334e977" in dockerfile),
        ("strict_compile", "-fno-fast-math" in dockerfile
         and "-Werror" in dockerfile),
        ("arb_flint_mpfr_gmp_bound", all(token in dockerfile for token in (
            "-lflint-arb", "-lflint", "-lgmp", "-lmpfr"))),
    ))

    predecessor = run([sys.executable,
        "scripts/nhm2_g2h_e_s5_c08_tail_split_chronology_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_011a_predecessor_81_of_81", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 81
                   and predecessor_report.get("checks_total") == 81))
    replay = run(["node", "scripts/nhm2_g2h_e_s5_borel_growth_independent_replay.mjs"])
    replay_report = parse_report(replay)
    checks.append(("acknowledged_definition_replay_27_of_27", replay.returncode == 0
                   and replay_report.get("checks_passed") == 27
                   and replay_report.get("checks_total") == 27))

    built = run(["docker", "build", "--network=none", "--quiet", "--file",
                 str(DOCKERFILE), "--tag", IMAGE, "."])
    checks.append(("docker_build", built.returncode == 0))
    image_id = ""
    executable_hash = ""
    reports: list[dict[str, object]] = []
    if built.returncode == 0:
        inspected = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
        image_id = inspected.stdout.strip()
        checks.append(("local_image_identity_recorded", inspected.returncode == 0
                       and image_id.startswith("sha256:") and len(image_id) == 71))
        executable = run(["docker", "run", "--rm", "--network", "none",
                          "--entrypoint", "sha256sum", IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_hash = executable.stdout.strip().split()[0]
        checks.append(("executable_identity", executable_hash == EXPECTED_EXECUTABLE))
        for ordinal in range(2):
            executed = run(["docker", "run", "--rm", "--network", "none",
                            "--read-only", "--cap-drop", "ALL", "--security-opt",
                            "no-new-privileges", "--pids-limit", "64", IMAGE])
            report = parse_report(executed)
            reports.append(report)
            checks.extend((
                (f"fixture_{ordinal}_exit_zero", executed.returncode == 0),
                (f"fixture_{ordinal}_23_of_23", report.get("checks_passed") == 23
                 and report.get("checks_total") == 23),
                (f"fixture_{ordinal}_fixed_k1", report.get("k1_exponent") == 3),
                (f"fixture_{ordinal}_fixed_k2", report.get("k2_exponent") == 4),
                (f"fixture_{ordinal}_four_variables",
                 report.get("compact_variables") == 4),
                (f"fixture_{ordinal}_three_first", report.get("first_derivatives") == 3),
                (f"fixture_{ordinal}_nine_second",
                 report.get("ordered_second_derivatives") == 9),
                (f"fixture_{ordinal}_horner_no_sampling",
                 report.get("fixed_variable_order") is True
                 and report.get("subdivision_used") is False
                 and report.get("point_sampling_used") is False),
                (f"fixture_{ordinal}_candidate_inert",
                 report.get("candidate_evaluations") == 0
                 and report.get("positive_parameter_samples") == 0
                 and report.get("candidate_roots_created") is False),
                (f"fixture_{ordinal}_authority_false",
                 report.get("scientific_handler_linked") is False
                 and report.get("authority_promoted") is False),
            ))
        checks.append(("deterministic_fixture_report",
                       len(reports) == 2 and reports[0] == reports[1]))
    else:
        checks.extend((name, False) for name in (
            "local_image_identity_recorded", "executable_identity",
            "fixture_0_exit_zero", "fixture_0_23_of_23", "fixture_0_fixed_k1",
            "fixture_0_fixed_k2", "fixture_0_four_variables",
            "fixture_0_three_first", "fixture_0_nine_second",
            "fixture_0_horner_no_sampling", "fixture_0_candidate_inert",
            "fixture_0_authority_false", "fixture_1_exit_zero",
            "fixture_1_23_of_23", "fixture_1_fixed_k1", "fixture_1_fixed_k2",
            "fixture_1_four_variables", "fixture_1_three_first",
            "fixture_1_nine_second", "fixture_1_horner_no_sampling",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report"))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_tail_lyapunov_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "fixture_report": reports[0] if reports else {},
        "predecessor_audit": predecessor_report,
        "definition_replay": replay_report,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authorization_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
