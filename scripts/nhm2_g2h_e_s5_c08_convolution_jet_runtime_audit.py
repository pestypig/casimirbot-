#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-010c."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-convolution-jet-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-convolution-jet-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-convolution-jet-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_bivariate_v1.hpp":
        "ca406246c6894be06dfcddd92f0f797f512c10ebd96060112aa07c69995df108",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_bivariate_v1.cpp":
        "f11d0c88fd98713adbf6eeffd4d7f1d65bc62df647f7a3a382b81581d5f2b1d1",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_jet_v1.hpp":
        "219fbbfd9e5056cda99dc00108ee003a22286311be9fc409695e444780f02b6f",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_jet_v1.cpp":
        "eccf43d23ae6667816441bbcbb0185630cbbec981d88206a54771e72dfe196d2",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_jet_fixture_v1.cpp":
        "1a2c1edcd60311325937b5a8fa380cb8b32c73578ca36dad9a414ad529923643",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-convolution-jet-fixture.v1":
        "9c9e1db133a1a1684cb5164eeb8688cbb40b96ddbd102e7670478080818051b0",
    "scripts/nhm2_g2h_e_s5_c08_convolution_bivariate_runtime_audit.py":
        "30f9b428a8f4fe442457d212b71b01b0e7f457cf4c4eee75611c53add17fad84",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
}
EXPECTED_EXECUTABLE = "1f517bdb1e65220f76002d1d917bc5cbf8e757f5f3fbba7d13668a12d5e0f0d0"

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

    source = (G2H / "mini_boson_star_primary_c08_convolution_jet_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_convolution_jet_v1.hpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_convolution_jet_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("fixed_parameter_count", "kParameterCount = 3U" in header),
        ("fixed_13_jet_count", "kJetCount = 13U" in header),
        ("fixed_43_elementary_count", "kElementaryConvolutions = 43U" in header),
        ("row_major_ordered_second_layout",
         "4U + a * kParameterCount + b" in header),
        ("exact_boundary_inventory", "g_at_zero_count != kJetCount" in source
         and "finite(input.g_at_zero_jets + jet)" in source),
        ("c08_010a_coverage_replayed", "ledger::evaluate(coverage_input_f" in source
         and "ledger::evaluate(coverage_input_g" in source),
        ("c08_010b_invoked_for_every_term", "bivariate::evaluate(predecessor" in source),
        ("base_identity", "value_jet(), value_jet(), value_jet()" in source),
        ("first_identity_complete", "first, value_jet(), first" in source
         and "value_jet(), first, first" in source),
        ("second_identity_outer_terms", "destination, value_jet(), destination" in source
         and "value_jet(), destination" in source),
        ("first_mixed_orientation", "first_jet(a), first_jet(b)" in source),
        ("second_mixed_orientation", "first_jet(b), first_jet(a)" in source),
        ("all_nine_ordered_seconds", "b < kParameterCount" in source
         and "ordered_second_terms += 4U" in source),
        ("complete_positive_cross_formula", "arb_mul(product1, pf, effective_rg" in source
         and "arb_mul(product2, pg, effective_rf" in source
         and "arb_mul(product3, effective_rf, effective_rg" in source),
        ("positive_u_width_and_t_scale", "input.u_right, input.u_left" in source
         and "input.target_right, u_width" in source),
        ("model_remainders_read_for_selected_models",
         "model.remainders + jet" in source),
        ("polynomial_magnitudes_complete", "degree <= model.order" in source
         and "model.coefficients" in source),
        ("source_hull_radii_propagated",
         "elementary.f_source_hull_radius_bound" in source
         and "elementary.gprime_source_hull_radius_bound" in source),
        ("affine_radius_retained", "arb_get_rad_arb(radius" in source
         and "affine_radius_bound(affine" in source),
        ("discarded_polynomial_retained",
         "elementary.discarded_xi_tail_bound" in source),
        ("boundary_remainder_retained", "current_rf" in source
         and "boundary_value" in source and "add_positive(total, boundary)" in source),
        ("no_signed_remainder_cancellation",
         "signed_remainder_cancellation_used = false" in source
         and "Complete positive cross-term formula; no subtraction" in source),
        ("no_midpoint_or_sampling", "midpoint_selection_used = false" in source
         and "point_sampling_used = false" in source and "arb_get_mid" not in source),
        ("candidate_neutral_no_file_ingress", "fstream" not in source
         and "ifstream" not in source and "shat" not in source.lower()
         and "6/5" not in source),
        ("distinct_manufactured_jet_values", "pair_scale" in fixture
         and "second_exact" in fixture),
        ("nonzero_remainder_fixture", "arb_add_error_2exp_si" in fixture
         and "remainder_positive" in fixture),
        ("fixture_explicit_term_counts", "positive_remainder_cross_terms == 129U" in fixture
         and "mixed_orientation_terms == 18U" in fixture),
        ("fixture_corruption_matrix", "short_inventory" in fixture
         and "null_inventory" in fixture and "arb_indeterminate" in fixture
         and "bad_order" in fixture),
        ("digest_pinned_offline_images", "@sha256:9e94d19f" in dockerfile
         and "@sha256:8334e977" in dockerfile),
    ))

    predecessor = run([sys.executable,
                       "scripts/nhm2_g2h_e_s5_c08_convolution_bivariate_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_010b_predecessor_62_of_62", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 62
                   and predecessor_report.get("checks_total") == 62))

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
                (f"fixture_{ordinal}_17_of_17", report.get("checks_passed") == 17
                 and report.get("checks_total") == 17),
                (f"fixture_{ordinal}_complete_13_jet",
                 report.get("complete_ordered_13_jet_inventory") is True
                 and report.get("retained_order") == 24),
                (f"fixture_{ordinal}_complete_elementary_terms",
                 report.get("elementary_convolutions") == 43
                 and report.get("mixed_orientation_terms") == 18),
                (f"fixture_{ordinal}_positive_cross_terms",
                 report.get("positive_remainder_cross_terms") == 129
                 and report.get("signed_remainder_cancellation_used") is False),
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
            "fixture_0_exit_zero", "fixture_0_17_of_17",
            "fixture_0_complete_13_jet", "fixture_0_complete_elementary_terms",
            "fixture_0_positive_cross_terms", "fixture_0_zero_state_reads",
            "fixture_0_candidate_inert", "fixture_0_authority_false",
            "fixture_1_exit_zero", "fixture_1_17_of_17",
            "fixture_1_complete_13_jet", "fixture_1_complete_elementary_terms",
            "fixture_1_positive_cross_terms", "fixture_1_zero_state_reads",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report")))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_convolution_jet_runtime_audit.v1",
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
