#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-007."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-positive-panel-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-positive-panel-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-positive-panel-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_positive_panel_v1.hpp":
        "67fa114b48b72cc997457f096a882952363836aa31de9976fb1f7096a73c5717",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_positive_panel_v1.cpp":
        "36831f63e0db30476b450d94686d0b3bf3aee5aeea1034d36a64e2b86f5cce0e",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_positive_panel_fixture_v1.cpp":
        "b819f839d88a0bbfbc58a99cf54665d180b09f6d8e4452b6427c54b564a3135f",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-positive-panel-fixture.v1":
        "9c15084051b23b84979fa882324bf2f09becc06c43db3030a9d103aef409177c",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_origin_series_v1.cpp":
        "cc1153df379fc86569813987e130ab4d67a2abe534f673a79fbf43588b05eb93",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_origin_series_fixture_v1.cpp":
        "b057a281e0e034eef5bd1f233676e8da0ecaeca20dd4be2f8976c8146742100d",
    "scripts/nhm2_g2h_e_s5_c08_origin_series_runtime_audit.py":
        "4203c4876844697960579ec372aebcada118eaf190296ab47bf3ca6c1b227965",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-statement.txt":
        "8fb6486066bcb44b361e7d37df44c7549713cfde03b0038d09548c511fb01bd9",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-decision.v1.json":
        "67d438ccaa7b8600afac21ceda8faacd6802d2f8dae6d47c8ea2507a0ed10932",
}

EXPECTED_EXECUTABLE = "186ee629e44bb387c7541beb66fc1809ecc78d2dae08dfc2241544c10c0bde1a"

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

    source = (G2H / "mini_boson_star_primary_c08_positive_panel_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_positive_panel_v1.hpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_positive_panel_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("frozen_state_and_jet_inventory", "kStateCount = 4U" in header
         and "kJetCount =" in header and "primary_c08_origin_series_v1::kJetCount" in header),
        ("frozen_order_schedule",
         "24U, 32U, 48U, 64U, 96U, 128U, 192U" in source),
        ("fixed_order_and_halving_caps", "kMaximumPanelOrder = 192U" in header
         and "kMaximumPanelHalvings = 32U" in header),
        ("predecessor_replayed_first",
         source.find("primary_c08_origin_series_v1::evaluate")
         < source.find("if (output == nullptr)")),
        ("exact_positive_target", "arb_is_exact(input.target_endpoint)" in source
         and "arb_is_positive(input.target_endpoint)" in source),
        ("three_panel_width_candidates", all(token in source for token in (
            "arb_mul_2exp_si(candidate_t, output.left_endpoint, -2L)",
            "arb_get_lbound_arf(lower, temporary, kPrecisionBits)",
            "arb_sub(candidate_target, input.target_endpoint, output.left_endpoint"))),
        ("fixed_panel_halving", "-static_cast<slong>(input.panel_halvings)" in source
         and "input.panel_halvings > kMaximumPanelHalvings" in source),
        ("full_panel_denominator_guards", "arb_union(output.t_panel" in source
         and "arb_is_positive(output.t_panel)" in source
         and "arb_is_positive(output.t_plus_two_kappa_panel)" in source
         and "arb_is_positive(output.scalar_p2_panel)" in source),
        ("no_midpoint_panel_selection", "arb_get_mid_arf" not in source
         and "arb_midref(" not in source),
        ("complete_ordered_jet_product", all(token in source for token in (
            "left.values + first_index(a)", "right.values + first_index(b)",
            "left.values + first_index(b)", "right.values + first_index(a)",
            "left.values + value_index", "right.values + index"))),
        ("reciprocal_denominator_guard",
         "arb_contains_zero(source.values + value_index)" in source),
        ("exact_universal_equation_inventory", all(token in source for token in (
            "P2=t*(t+2*kappa)", "P1=-2*(2*mu*kappa^2*t",
            "P0=mu*(c0+c1*t+c2*t^2)/kappa^2",
            "PJ1=2*mu^2*(2*kappa*t+1)",
            "PJ2=4*mu^2*(2*mu*kappa^2-mu-kappa)^2/kappa^2"))),
        ("affine_t_translation_for_p0_and_pj1",
         "jet_add(factor, factor, term); polynomial_mul_jet(temporary, t, factor)" in source
         and "polynomial_mul_jet(temporary, t, constant)" in source
         and "polynomial_mul_jet(temporary, t2, factor)" in source),
        ("coefficient_recurrence_in_increasing_order",
         "for (unsigned n = 0U; n < order; ++n)" in source
         and "n + 1U - degree" in source
         and "polynomials[0].coefficients[0]" in source),
        ("bounded_output_storage",
         "(kMaximumPanelOrder + 1U) * kStateCount * kJetCount" in source),
        ("origin_b_second_compatibility", "origin_derivative_compatible" in source
         and "TailKind::B_second" in source and "arb_overlaps" in source),
        ("positive_and_vacuum_fixtures", "positive_margins" in fixture
         and "vacuum_margins" in fixture),
        ("exact_p2_reference", "513L, 262144L" in fixture
         and "257L, 256L" in fixture),
        ("order_192_cap_fixture", "cap_order.requested_order = 192U" in fixture
         and "taylor_coefficient_balls == 10036U" in fixture),
        ("order_halving_target_corruption_fixtures", "requested_order = 25U" in fixture
         and "panel_halvings = 33U" in fixture and "nonexact_target" in fixture),
        ("all_ordered_mixed_orientations_retained", "second_index(a, b)" in fixture
         and "second_index(b, a)" in fixture and "arb_overlaps" in fixture),
        ("no_state_or_file_ingress", "state_storage" not in source
         and "fstream" not in source and "ifstream" not in source
         and "shat" not in source.lower() and "6/5" not in source),
        ("candidate_neutral_header", "no selected-state read" in header
         and "sampling" in header and "evaluation" in header),
        ("digest_pinned_offline_images", "@sha256:9e94d19f" in dockerfile
         and "@sha256:8334e977" in dockerfile),
    ))

    acknowledgement = run([
        sys.executable, "scripts/nhm2_g2h_e_s5_borel_acknowledgement_gate.py",
        "--statement-file",
        "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-statement.txt",
    ])
    acknowledgement_report = parse_report(acknowledgement)
    checks.append(("parent_acknowledgement_valid", acknowledgement.returncode == 0
                   and acknowledgement_report.get("status") == "ACKNOWLEDGEMENT_VALID"
                   and acknowledgement_report.get("authorization_created") is False
                   and acknowledgement_report.get("authority_promoted") is False))
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
                       "scripts/nhm2_g2h_e_s5_c08_origin_series_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_006_predecessor_58_of_58", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 58
                   and predecessor_report.get("checks_total") == 58))

    built = run(["docker", "build", "--quiet", "--file", str(DOCKERFILE),
                 "--tag", IMAGE, "."])
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
                (f"fixture_{ordinal}_24_of_24", report.get("checks_passed") == 24
                 and report.get("checks_total") == 24),
                (f"fixture_{ordinal}_no_midpoint",
                 report.get("midpoint_acceptance_used") is False),
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
        checks.extend((
            ("local_image_identity_recorded", False), ("executable_identity", False),
            ("fixture_0_exit_zero", False), ("fixture_0_24_of_24", False),
            ("fixture_0_no_midpoint", False), ("fixture_0_zero_state_reads", False),
            ("fixture_0_candidate_inert", False), ("fixture_0_authority_false", False),
            ("fixture_1_exit_zero", False), ("fixture_1_24_of_24", False),
            ("fixture_1_no_midpoint", False), ("fixture_1_zero_state_reads", False),
            ("fixture_1_candidate_inert", False), ("fixture_1_authority_false", False),
            ("deterministic_fixture_report", False),
        ))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_positive_panel_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "fixture_report": reports[0] if reports else {},
        "parent_acknowledgement": acknowledgement_report,
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
