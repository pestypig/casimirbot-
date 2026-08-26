#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-010b."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-convolution-bivariate-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-convolution-bivariate-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-convolution-bivariate-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_ledger_v1.hpp":
        "68f10eba4d35d09630c4343fde425cd216e9da79a2d450d852e828f2fb345b46",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_ledger_v1.cpp":
        "6a077eeca8554cf65861747d545cfdb7b44cd6b100d442d5bc096a6712c585d7",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_bivariate_v1.hpp":
        "ca406246c6894be06dfcddd92f0f797f512c10ebd96060112aa07c69995df108",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_bivariate_v1.cpp":
        "f11d0c88fd98713adbf6eeffd4d7f1d65bc62df647f7a3a382b81581d5f2b1d1",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_bivariate_fixture_v1.cpp":
        "0a42a6dd1865b6082a933ad966b6216c49aef20718a4996fb1cf8a96f768730d",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-convolution-bivariate-fixture.v1":
        "11085b8884ba7886dfd47a6c444e9b1d4f34f52f94cb92704c62f3846440b357",
    "scripts/nhm2_g2h_e_s5_c08_convolution_ledger_runtime_audit.py":
        "4aafc263653b3b79262c3dc44fbacaf36221abb2fbc6ca31ce5be1918ae06a6d",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
}
EXPECTED_EXECUTABLE = "e5ab22157ea1a658f5ebbf9c4991bf9a7f466d36497de1137d4150b2391f3e1f"

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

    source = (G2H / "mini_boson_star_primary_c08_convolution_bivariate_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_convolution_bivariate_v1.hpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_convolution_bivariate_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("fixed_13_jet_inventory", "kJetCount = ledger::kJetCount" in header),
        ("fixed_target_order_schedule",
         "24U, 32U, 48U, 64U, 96U, 128U, 192U" in source),
        ("bounded_source_and_retained_orders",
         "kMaximumSourceOrder = 256U" in header
         and "kMaximumRetainedXiDegree = 192U" in header),
        ("exact_rectangle_ingress", "exact_finite(input.target_left)" in source
         and "exact_finite(input.u_left)" in source),
        ("finite_boundary_ingress", "finite(input.g_at_zero)" in source),
        ("c08_010a_direct_and_reflected_predecessors",
         "f_coverage.direct_intersecting_ordinals" in source
         and "g_coverage.reflected_intersecting_ordinals" in source),
        ("current_panel_exactly_bound", "exact_same_panel(input.f_ledger" in source
         and "exact_same_panel(input.gprime_ledger" in source),
        ("every_selected_model_translated",
         "for (const std::size_t ordinal : ordinals)" in source),
        ("exact_local_to_global_binomial_translation",
         "arb_neg(negative_center, model.expansion_center)" in source
         and "multiply_binomial(scaled, coefficient" in source),
        ("coefficientwise_source_hull", "arb_union(hull.at(degree)" in source),
        ("source_hull_radius_retained", "arb_get_rad_arb(radius" in source
         and "source_hull_radius(output->f_source_hull_radius_bound" in source),
        ("exact_directed_beta_identity", "right_powers.at(exponent)" in source
         and "left_powers.at(exponent)" in source
         and "arb_div_ui(quotient" in source),
        ("beta_alternating_sign", "(j & 1U) == 0U" in source),
        ("full_t_jacobian", "a + b + 1U;  // Full t Jacobian" in source),
        ("factorized_product_without_dense_tensor",
         "arb_mul(product, f_hull.at(a), g_hull.at(b)" in source),
        ("exact_center_translation",
         "output->target_center" in source
         and "multiply_binomial(scaled, global_t.at(global_degree)" in source),
        ("boundary_term_retained",
         "F(t)G(0) uses the current left-centered F panel" in source
         and "input.g_at_zero" in source),
        ("retained_order_is_three_way_minimum",
         "minimum_order(input.f_ledger" in source
         and "minimum_order(input.gprime_ledger" in source),
        ("discarded_centered_tail_positive",
         "arb_abs(magnitude, centered.at(degree))" in source
         and "set_exact_upper(output->discarded_xi_tail_bound" in source),
        ("remainders_deferred_only_to_c",
         "model remainders and 13-jet product assembly remain C08-010c duties" in header),
        ("no_midpoint_or_sampling", "midpoint_selection_used = false" in source
         and "point_sampling_used = false" in source
         and "arb_get_mid" not in source),
        ("candidate_neutral_no_file_ingress", "fstream" not in source
         and "ifstream" not in source and "shat" not in source.lower()
         and "6/5" not in source),
        ("manufactured_exact_identity_fixture",
         "2t+t^2/2" in fixture and "65L, 8L" in fixture
         and "9L, 2L" in fixture and "1L, 2L" in fixture),
        ("fixture_complete_source_geometry", "F(s)=s" in fixture
         and "G'(s)=1" in fixture and "f_models.size()" in fixture
         and "g_models.size()" in fixture),
        ("fixture_corruption_matrix", "bad_order" in fixture
         and "bad_jet" in fixture and "bad_boundary" in fixture
         and "nonexact_rectangle" in fixture and "old_target" in fixture),
        ("fixture_predecessor_corruption", "f_ledger_or_coverage" in fixture
         and "gprime_ledger_or_coverage" in fixture),
        ("digest_pinned_offline_images", "@sha256:9e94d19f" in dockerfile
         and "@sha256:8334e977" in dockerfile),
    ))

    predecessor = run([sys.executable,
                       "scripts/nhm2_g2h_e_s5_c08_convolution_ledger_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_010a_predecessor_61_of_61", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 61
                   and predecessor_report.get("checks_total") == 61))

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
        executable = run(["docker", "run", "--rm", "--entrypoint", "sha256sum",
                          IMAGE, EXECUTABLE])
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
                (f"fixture_{ordinal}_19_of_19", report.get("checks_passed") == 19
                 and report.get("checks_total") == 19),
                (f"fixture_{ordinal}_complete_model_composition",
                 report.get("direct_models") == 3
                 and report.get("reflected_models") == 3
                 and report.get("local_to_global_terms") == 2422),
                (f"fixture_{ordinal}_complete_exact_elimination",
                 report.get("beta_moments") == 1089
                 and report.get("factorized_product_terms") == 1089
                 and report.get("exact_bivariate_elimination") is True
                 and report.get("exact_dyadic_u_integration") is True),
                (f"fixture_{ordinal}_center_and_tail",
                 report.get("centered_translation_terms") == 2536
                 and report.get("retained_order") == 24
                 and report.get("discarded_tail_exact_zero") is True),
                (f"fixture_{ordinal}_no_selection_or_sampling",
                 report.get("midpoint_selection_used") is False
                 and report.get("point_sampling_used") is False),
                (f"fixture_{ordinal}_zero_state_reads",
                 report.get("state_coefficients_read") == 0),
                (f"fixture_{ordinal}_candidate_inert",
                 report.get("candidate_evaluations") == 0
                 and report.get("positive_parameter_samples") == 0
                 and report.get("candidate_roots_created") is False),
                (f"fixture_{ordinal}_authority_false",
                 report.get("authority_promoted") is False
                 and report.get("scientific_handler_linked") is False),
            ))
        checks.append(("deterministic_fixture_report",
                       len(reports) == 2 and reports[0] == reports[1]))
    else:
        checks.extend(((name, False) for name in (
            "local_image_identity_recorded", "executable_identity",
            "fixture_0_exit_zero", "fixture_0_19_of_19",
            "fixture_0_complete_model_composition",
            "fixture_0_complete_exact_elimination", "fixture_0_center_and_tail",
            "fixture_0_no_selection_or_sampling", "fixture_0_zero_state_reads",
            "fixture_0_candidate_inert", "fixture_0_authority_false",
            "fixture_1_exit_zero", "fixture_1_19_of_19",
            "fixture_1_complete_model_composition",
            "fixture_1_complete_exact_elimination", "fixture_1_center_and_tail",
            "fixture_1_no_selection_or_sampling", "fixture_1_zero_state_reads",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report")))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_convolution_bivariate_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "fixture_report": reports[0] if reports else {},
        "predecessor_audit": predecessor_report,
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
