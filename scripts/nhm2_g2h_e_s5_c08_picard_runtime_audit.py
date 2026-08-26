#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-009."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-picard-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-picard-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-picard-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_picard_v1.hpp":
        "81e35c40c98f5d66e0ef451f3024ed1782817098df6277dd84c90783359f62ef",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_picard_v1.cpp":
        "40841cba273290321c8d2f01609ea0c5c420b2248719dffe9fc23233bc6fface",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_picard_fixture_v1.cpp":
        "daa6035c38845271803834b0be057eedbe2c56898386efd44f01739185704268",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-picard-fixture.v1":
        "b6d7b57546896303a93b87d2376e6f2e6cbcfdf662e4f535f875c244e502368b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_panel_defect_v1.cpp":
        "39b854b33a176720d881c949bd7d599932b1367685c6124d6709ddb08939ae32",
    "scripts/nhm2_g2h_e_s5_c08_panel_defect_runtime_audit.py":
        "079ea2a654f434416759e52de37a687f5182a2fc5a32be993af9f160aba2ccd7",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
}
EXPECTED_EXECUTABLE = "06fd28304cbb3d1f3759ebae687d98d6c04c37b29d38526f1eceb775bc2e62e9"

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

    source = (G2H / "mini_boson_star_primary_c08_picard_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_picard_v1.hpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_picard_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    chronology = (
        source.find("for (unsigned halving")
        < source.find("for (const unsigned order")
        < source.find("for (unsigned exponent"))
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("frozen_inventory", all(token in header for token in (
            "kOrderCandidateCount = 7U", "kMaximumPanelOrder = 192U",
            "kMaximumPanelHalvings = 32U",
            "kMaximumInflationExponent = 16U", "kStateCount", "kJetCount"))),
        ("fixed_order_schedule", all(token in source for token in (
            "24U, 32U, 48U, 64U, 96U, 128U, 192U", "kOrders"))),
        ("halving_order_inflation_chronology", chronology),
        ("first_lambda_return", "exponent <= kMaximumInflationExponent" in source
         and "accepted_inflation_exponent = exponent" in source
         and "return true" in source),
        ("common_radius_lambda_h_dmax", "arb_mul(radius, dmax, panel_output.panel_width" in source
         and "arb_mul_2exp_si(radius, radius" in source),
        ("complete_52_defect_max", "defect_output.magnitude(state, jet)" in source
         and "state < kStateCount" in source and "jet < kJetCount" in source),
        ("correlation_preserving_correction", "-d + (F(p+E)-F(p))" in source
         and "defect_box" in source and "correction" in source
         and "derivative_ranges" not in source),
        ("exact_linear_state_increment", "equation_ranges[source + 1U]" in source
         and "common_box" in source and "jet_div(solved, negative" in source),
        ("complete_parameter_box", "equation_ranges" in source
         and "state_ranges" in source and "arb_union(xi_panel" in source),
        ("strict_componentwise_containment", "arb_lt(image_bound, radius)" in source
         and "arb_sub(margin, radius, image_bound" in source),
        ("no_touching_acceptance", "arb_le(image_bound, radius)" not in source),
        ("all_one_component_weights", "component_weights_all_one = true" in source),
        ("numerical_width_2_minus_180", "arb_get_rad_arb" in source
         and "arb_mul_2exp_si(threshold, scale, -180L)" in source
         and "arb_le(error, threshold)" in source),
        ("polynomial_plus_remainder_width", "arb_set(error, common_radius)" in source
         and "panel_output.at(degree, state, jet)" in source),
        ("exact_zero_remainder_path", "defect_output.all_exact_zero" in source
         and "exact_zero_remainder = true" in source
         and "arb_zero(output->common_remainder_radius)" in source),
        ("frozen_failure_code", "C08-009_PICARD_INFLATION_OR_WIDTH_EXHAUSTION" in source
         and "panel_halving_exhaustion" not in source
         and "nonfinite_or_denominator" not in source),
        ("fail_closed_predecessors", "FailureDetail::predecessor_not_passed" in source
         and source.find("defect::evaluate") < source.find("panel::evaluate")),
        ("no_midpoint_or_signed_cancellation", "midpoint_acceptance_used = false" in source
         and "signed_cancellation_used = false" in source),
        ("candidate_neutral_header", "Candidate-neutral C08-009" in header
         and "no selected-state ingress" in header),
        ("no_selected_or_file_ingress", "fstream" not in source
         and "ifstream" not in source and "shat" not in source.lower()
         and "6/5" not in source),
        ("positive_and_vacuum_fixtures", "positive_margins" in fixture
         and "vacuum_margins" in fixture),
        ("corruption_fixtures", "predecessor_c08_003_passed = false" in fixture
         and "identity = nullptr" in fixture and "invalid_target" in fixture),
        ("selection_and_strict_fixture_checks", "accepted_order >= 24U" in fixture
         and "strict_component_checks >= 52U" in fixture
         and "numerical_width_checks == 52U" in fixture),
        ("resource_caps_fixture_check", all(token in fixture for token in (
            "kOrderCandidateCount == 7U", "kMaximumPanelOrder == 192U",
            "kMaximumPanelHalvings == 32U",
            "kMaximumInflationExponent == 16U"))),
        ("digest_pinned_offline_images", "@sha256:9e94d19f" in dockerfile
         and "@sha256:8334e977" in dockerfile),
    ))

    exact = run([sys.executable, "scripts/nhm2_g2h_e_s5_formal_germ_growth_audit.py"])
    exact_report = parse_report(exact)
    checks.append(("parent_exact_64_of_64", exact.returncode == 0
                   and exact_report.get("checks_passed") == 64
                   and exact_report.get("checks_total") == 64))
    replay = run(["node", "scripts/nhm2_g2h_e_s5_borel_growth_independent_replay.mjs"])
    replay_report = parse_report(replay)
    checks.append(("parent_replay_27_of_27", replay.returncode == 0
                   and replay_report.get("checks_passed") == 27
                   and replay_report.get("checks_total") == 27))
    predecessor = run([sys.executable,
                       "scripts/nhm2_g2h_e_s5_c08_panel_defect_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_008_predecessor_49_of_49", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 49
                   and predecessor_report.get("checks_total") == 49))

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
                            "no-new-privileges", IMAGE])
            report = parse_report(executed)
            reports.append(report)
            checks.extend((
                (f"fixture_{ordinal}_exit_zero", executed.returncode == 0),
                (f"fixture_{ordinal}_13_of_13", report.get("checks_passed") == 13
                 and report.get("checks_total") == 13),
                (f"fixture_{ordinal}_first_selection",
                 report.get("accepted_order") == 24
                 and report.get("accepted_panel_halvings") == 5
                 and report.get("accepted_inflation_exponent") == 2),
                (f"fixture_{ordinal}_strict_picard",
                 report.get("picard_inclusion_performed") is True
                 and report.get("panel_accepted") is True
                 and report.get("strict_component_checks", 0) >= 52
                 and report.get("numerical_width_checks") == 52),
                (f"fixture_{ordinal}_full_box_no_midpoint",
                 report.get("complete_parameter_box_used") is True
                 and report.get("component_weights_all_one") is True
                 and report.get("midpoint_acceptance_used") is False),
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
            "fixture_0_exit_zero", "fixture_0_13_of_13",
            "fixture_0_first_selection", "fixture_0_strict_picard",
            "fixture_0_full_box_no_midpoint", "fixture_0_zero_state_reads",
            "fixture_0_candidate_inert", "fixture_0_authority_false",
            "fixture_1_exit_zero", "fixture_1_13_of_13",
            "fixture_1_first_selection", "fixture_1_strict_picard",
            "fixture_1_full_box_no_midpoint", "fixture_1_zero_state_reads",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report")))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_picard_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "fixture_report": reports[0] if reports else {},
        "parent_exact": exact_report,
        "parent_replay": replay_report,
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
