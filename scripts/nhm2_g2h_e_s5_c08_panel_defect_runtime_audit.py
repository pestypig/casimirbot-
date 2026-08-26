#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-008."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-panel-defect-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-panel-defect-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-panel-defect-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_panel_defect_v1.hpp":
        "be25ab1ea1c250d921757c62ba0628158587732b390ae9f0c91db13ffe843bd8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_panel_defect_v1.cpp":
        "39b854b33a176720d881c949bd7d599932b1367685c6124d6709ddb08939ae32",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_panel_defect_fixture_v1.cpp":
        "95cad01677d4fd5403a7117e0b45f82dcec037b79ff1d143748afbbe5d554db8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-panel-defect-fixture.v1":
        "ecca5a1ec7f108ac7539aeeafa4d14d0a2c3cd5ba0c9ada65b92988d309f80f7",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_positive_panel_v1.cpp":
        "36831f63e0db30476b450d94686d0b3bf3aee5aeea1034d36a64e2b86f5cce0e",
    "scripts/nhm2_g2h_e_s5_c08_positive_panel_runtime_audit.py":
        "c5747a1f3f711daad96c32eb521ec659a5c37f6536f6c833793e538685bb6bd5",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
}
EXPECTED_EXECUTABLE = "8357a784b1802c3b91c84ee521b5496d24ed56046ed1070a53f87fb52b2aad16"

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

    source = (G2H / "mini_boson_star_primary_c08_panel_defect_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_panel_defect_v1.hpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_panel_defect_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("frozen_inventory", "kStateCount =" in header
         and "kJetCount =" in header and "kMaximumPanelOrder" in header
         and "kMaximumDefectDegree = kMaximumPanelOrder + 2U" in header),
        ("predecessor_replayed_first",
         source.find("panel::evaluate(input.panel") < source.find("if (output == nullptr)")),
        ("complete_ordered_jet_product", all(token in source for token in (
            "left.values + first_index(a)", "right.values + first_index(b)",
            "left.values + first_index(b)", "right.values + first_index(a)",
            "left.values, right.values + index"))),
        ("integral_identity_inventory", all(token in source for token in (
            "panel::State::B, panel::State::V",
            "panel::State::J1, panel::State::B",
            "panel::State::J2, panel::State::J1"))),
        ("cleared_scalar_identity", "P2*V' + P1*V + P0*B + PJ1*J1 + PJ2*J2" in source
         and "polynomial_multiply_add" in source),
        ("degree_order_plus_two", "residual_size = static_cast<std::size_t>(order) + 3U" in source
         and "maximum_defect_degree = order + 2U" in source),
        ("low_order_zero_replay", "degree < order" in source
         and "arb_contains_zero(output->coefficient" in source),
        ("complete_interval_range", "polynomial_range" in source
         and "arb_union(xi_panel" in source and "panel_output.panel_width" in source),
        ("directed_rational_v_defect", "polynomial_range(p2_range" in source
         and "arb_is_positive(p2_range.values)" in source
         and "jet_div(actual_v_range" in source),
        ("exact_upper_magnitudes", "arb_get_ubound_arf" in source
         and "arb_set_arf(target, upper)" in source),
        ("exact_zero_branch_replayed", "exact_zero_identity_self_test" in source
         and "all_exact_zero" in source and "arb_is_zero(output->coefficient" in source),
        ("no_picard_or_panel_acceptance", "panel_accepted = false" in source
         and "picard_inclusion_performed = false" in source
         and "signed_cancellation_used = false" in source),
        ("positive_and_vacuum_fixtures", "positive_margins" in fixture
         and "vacuum_margins" in fixture),
        ("order_192_fixture", "requested_order = 192U" in fixture
         and "complete_defect_coefficient_balls == 10140U" in fixture),
        ("exact_zero_fixture_flag", "exact_zero_branch_exercised" in fixture
         and "exact_zero_replay_passed" in fixture),
        ("corruption_and_resource_fixtures", "requested_order = 25U" in fixture
         and "panel_halvings = 33U" in fixture and "nonfinite" in fixture),
        ("no_selected_or_file_ingress", "state_storage" not in source
         and "fstream" not in source and "ifstream" not in source
         and "shat" not in source.lower() and "6/5" not in source),
        ("candidate_neutral_header", "Candidate-neutral C08-008" in header
         and "not perform Picard inclusion" in header
         and "sample selected data" in header),
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
                       "scripts/nhm2_g2h_e_s5_c08_positive_panel_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_007_predecessor_58_of_58", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 58
                   and predecessor_report.get("checks_total") == 58))

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
                (f"fixture_{ordinal}_19_of_19", report.get("checks_passed") == 19
                 and report.get("checks_total") == 19),
                (f"fixture_{ordinal}_no_picard_or_panel",
                 report.get("picard_inclusion_performed") is False
                 and report.get("panel_accepted") is False
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
            "fixture_0_exit_zero", "fixture_0_19_of_19",
            "fixture_0_no_picard_or_panel", "fixture_0_zero_state_reads",
            "fixture_0_candidate_inert", "fixture_0_authority_false",
            "fixture_1_exit_zero", "fixture_1_19_of_19",
            "fixture_1_no_picard_or_panel", "fixture_1_zero_state_reads",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report")))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_panel_defect_runtime_audit.v1",
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
