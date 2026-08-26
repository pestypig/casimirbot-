#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-010a."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-convolution-ledger-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-convolution-ledger-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-convolution-ledger-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_ledger_v1.hpp":
        "68f10eba4d35d09630c4343fde425cd216e9da79a2d450d852e828f2fb345b46",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_ledger_v1.cpp":
        "6a077eeca8554cf65861747d545cfdb7b44cd6b100d442d5bc096a6712c585d7",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_ledger_fixture_v1.cpp":
        "fc93a1986daa865dd857ca2f530ffbdb859db3a149d60bbd69283e2b1d5fe2d4",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-convolution-ledger-fixture.v1":
        "bef80ff585d6fb7ff802883cc1b260a8e3b1a96ad500278fda801ff4c7c0da7b",
    "scripts/nhm2_g2h_e_s5_c08_picard_runtime_audit.py":
        "59e1ad1c121c7c2dc47e197151ef1f1e68c53ca1d1d3c512405c0f282a7fdf5d",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
}
EXPECTED_EXECUTABLE = "85768133e72aeb4877c327c70044cd4bcc8ce0587a2327268054ab858f5d7f36"

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

    source = (G2H / "mini_boson_star_primary_c08_convolution_ledger_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_convolution_ledger_v1.hpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_convolution_ledger_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("fixed_13_jet_inventory", "kJetCount = 13U" in header),
        ("fixed_resource_inventory", "kMaximumPositivePanels = 65536U" in header
         and "kMaximumLedgerModels" in header
         and "model_count > kMaximumLedgerModels" in source),
        ("origin_order_schedule", "32U, 48U, 64U, 96U, 128U, 192U, 256U" in source),
        ("positive_order_schedule", "24U, 32U, 48U, 64U, 96U, 128U, 192U" in source),
        ("exact_dyadic_rectangle", "arb_is_exact(value)" in source
         and "arb_lt(input.u_left, input.u_right)" in source
         and "arb_le(input.u_right, one)" in source),
        ("origin_then_positive_kind", "index == 0U ? ModelKind::origin" in source
         and "ModelKind::positive_panel" in source),
        ("append_only_ordinals", "model.ordinal == index" in source),
        ("left_endpoint_expansion_centers", "arb_equal(model.expansion_center, model.left_endpoint)" in source),
        ("exact_shared_faces", "arb_equal(model.left_endpoint" in source
         and "models[index - 1U].right_endpoint" in source),
        ("no_gap_or_domain_reversal", "arb_lt(model.left_endpoint, model.right_endpoint)" in source),
        ("complete_model_storage", "expected_coefficients" in source
         and "model.coefficient_count != expected_coefficients" in source
         and "model.remainder_count != kJetCount" in source),
        ("finite_coefficients", "arb_is_finite(model.coefficients + coefficient)" in source),
        ("symmetric_remainders", "arb_contains_zero(model.remainders + jet)" in source),
        ("target_covered_through_current_diagonal", "arb_lt(last.right_endpoint, input.target_right)" in source),
        ("complete_direct_rectangle", "arb_mul(output->direct_mapped_interval, target, direct_u" in source),
        ("complete_reflected_rectangle", "arb_sub(reflected_left, one, input.u_right" in source
         and "arb_mul(output->reflected_mapped_interval, target, reflected_u" in source),
        ("closed_domain_intersection", "arb_overlaps(domain, mapped)" in source),
        ("every_model_enumerated", "index < ledger.model_count" in source
         and "ordinals.push_back(model.ordinal)" in source),
        ("contiguous_intersection_ledger", "ordinals[index] != ordinals[index - 1U] + 1U" in source),
        ("shared_face_multiplicity_retained", "*shared_face = true" in source),
        ("no_midpoint_selection", "midpoint_selection_used = false" in source
         and "arb_get_mid" not in source and "arb_get_mid_arb" not in source),
        ("candidate_neutral_boundary", "Candidate-neutral C08-010a" in header
         and "no source-model" in header and "file I/O" in header),
        ("no_selected_or_file_ingress", "fstream" not in source
         and "ifstream" not in source and "shat" not in source.lower()
         and "6/5" not in source),
        ("three_model_shared_face_fixture", "origin_only_models" in fixture
         and "direct_intersecting_ordinals, {0U, 1U}" in fixture
         and "reflected_intersecting_ordinals, {0U, 1U, 2U}" in fixture),
        ("u_zero_one_fixture", "endpoint_rectangle.u_left = zero.value" in fixture
         and "endpoint_rectangle.u_right = one.value" in fixture),
        ("gap_center_chronology_corruption", "gap_models" in fixture
         and "center_models" in fixture and "chronology_models" in fixture),
        ("order_nonfinite_remainder_corruption", "wrong_order_models" in fixture
         and "arb_indeterminate" in fixture and "panel1_remainders" in fixture),
        ("resource_and_uncovered_corruption", "kMaximumLedgerModels + 1U" in fixture
         and "uncovered.target_right" in fixture),
        ("nonexact_u_corruption", "arb_add_error_2exp_si" in fixture),
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
                       "scripts/nhm2_g2h_e_s5_c08_picard_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_009_predecessor_59_of_59", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 59
                   and predecessor_report.get("checks_total") == 59))

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
                (f"fixture_{ordinal}_20_of_20", report.get("checks_passed") == 20
                 and report.get("checks_total") == 20),
                (f"fixture_{ordinal}_three_model_coverage",
                 report.get("models_validated") == 3
                 and report.get("direct_models") == 2
                 and report.get("reflected_models") == 3
                 and report.get("closed_intersection_checks") == 6),
                (f"fixture_{ordinal}_complete_no_midpoint",
                 report.get("every_intersecting_model_enumerated") is True
                 and report.get("midpoint_selection_used") is False),
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
            "fixture_0_exit_zero", "fixture_0_20_of_20",
            "fixture_0_three_model_coverage", "fixture_0_complete_no_midpoint",
            "fixture_0_zero_state_reads", "fixture_0_candidate_inert",
            "fixture_0_authority_false", "fixture_1_exit_zero",
            "fixture_1_20_of_20", "fixture_1_three_model_coverage",
            "fixture_1_complete_no_midpoint", "fixture_1_zero_state_reads",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report")))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_convolution_ledger_runtime_audit.v1",
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
