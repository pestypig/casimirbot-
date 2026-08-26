#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-006."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-origin-series-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-origin-series-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-origin-series-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_origin_series_v1.hpp":
        "5a22d389f9f07fdd24fb53dbb39de3d1106579ce2c0fad8cf590603e298fb745",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_origin_series_v1.cpp":
        "cc1153df379fc86569813987e130ab4d67a2abe534f673a79fbf43588b05eb93",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_origin_series_fixture_v1.cpp":
        "b057a281e0e034eef5bd1f233676e8da0ecaeca20dd4be2f8976c8146742100d",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-origin-series-fixture.v1":
        "f94d6e70cda3bdaacdc1044165bd39ec0bc500d8e568a9215c38f7417895ec36",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_gevrey_v1.hpp":
        "113d888e9cad84bc1a36cf653ea840781b34200d56f97594fdcc526a296dc2cd",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_gevrey_v1.cpp":
        "f81c02d58366362b62860d482eea8802359057513bb02d5258df71bd643aad7b",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-statement.txt":
        "8fb6486066bcb44b361e7d37df44c7549713cfde03b0038d09548c511fb01bd9",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-decision.v1.json":
        "67d438ccaa7b8600afac21ceda8faacd6802d2f8dae6d47c8ea2507a0ed10932",
}

EXPECTED_EXECUTABLE = "8d8f945b6bdff6931f76b799313bc4063cc8cadff1cb87f1c0351c267c1f1709"

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

    source = (G2H / "mini_boson_star_primary_c08_origin_series_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_origin_series_v1.hpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_origin_series_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("frozen_13_by_5_inventory", "kJetCount = primary_c08_gevrey_v1::kJetCount" in header
         and "kTailKindCount = 5U" in header),
        ("frozen_order_schedule",
         "32U, 48U, 64U, 96U, 128U, 192U, 256U" in source),
        ("fixed_order_cap_256", "kMaximumOriginOrder = 256U" in header
         and "kOrderCandidateCount = 7U" in header),
        ("origin_order_predecessor_replay",
         "if (!primary_c08_gevrey_v1::evaluate(input.gevrey" in source
         and "FailureDetail::predecessor_not_passed" in source),
        ("first_passing_order", "output->selected_order = order" in source
         and "result->first_passing_order_used = true" in source
         and "return true;" in source),
        ("t0_from_dyadic_rate", "gevrey.selected_exponent" in source
         and "-static_cast<slong>(gevrey.selected_exponent) - 2L" in source),
        ("geometric_ratio_guard", "arb_mul(output.geometric_ratio" in source
         and "arb_le(output.geometric_ratio, quarter)" in source),
        ("endpoint_recurrence_to_order", "generate_next" in source
         and "coefficients.at(n + 1U, row)" in source),
        ("sum_all_lags_before_single_order_division",
         "for (std::size_t row = 0; pass && row < kJetCount; ++row) {\n"
         "        arb_div_ui(coefficients.at(n + 1U, row)" in source
         and "scalar_ode_value_compatibility" in fixture),
        ("b_tail_formula", "C*z^(r+1)/(1-z)" in source
         and "arb_div(base_tails + 0" in source),
        ("v_tail_formula", "C*A*((r+1)z^r/(1-z)+z^(r+1)/(1-z)^2)" in source
         and "arb_mul_ui(base_tails + 1" in source),
        ("b_second_tail_formula", "C*A^2*D^2[z^(r+1)/(1-z)]" in source
         and "2UL * (order + 1U)" in source),
        ("j1_j2_tail_formulas", "order + 2U" in source
         and "(order + 2U) * (order + 3U)" in source),
        ("width_rule_2_neg_180", "kWidthExponent = -180" in source
         and "arb_mul_2exp_si(tolerance, scale, kWidthExponent)" in source
         and "arb_get_rad_arb" in source),
        ("directed_magnitude_not_midpoint", "arb_get_ubound_arf" in source
         and "arb_get_mid_arf" not in source and "arb_midref(" not in source),
        ("all_tail_bounds_added_as_error", "arb_add_error(output.enclosed_values[jet] + kind" in source),
        ("positive_reference_order_128", "positive_output.selected_order == 128U" in fixture
         and "positive_result.order_attempts == 5U" in fixture),
        ("vacuum_reference_order_128", "vacuum_output.selected_order == 128U" in fixture
         and "vacuum_result.order_attempts == 5U" in fixture),
        ("reference_tail_exact", "reference_b_tail" in fixture
         and "-255L" in fixture and "3UL" in fixture),
        ("narrow_ball_fixture", "narrow_h0" in fixture and "-240L" in fixture),
        ("fixed_cap_exhaustion_fixture", "tiny_kappa" in fixture
         and "-180L" in fixture and "order_attempts == 7U" in fixture
         and "recurrence_coefficients_generated == 257U" in fixture),
        ("predecessor_and_corruption_fixtures", "predecessor_c08_003_passed = false" in fixture
         and "arb_indeterminate(nonfinite.value)" in fixture),
        ("no_state_or_file_ingress", "state_storage" not in source
         and "fstream" not in source and "ifstream" not in source
         and "shat" not in source.lower() and "6/5" not in source),
        ("candidate_neutral_header", "no state-vector read" in header
         and "sampling" in header and "candidate evaluation" in header),
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
                       "scripts/nhm2_g2h_e_s5_c08_gevrey_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_005_predecessor_55_of_55", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 55
                   and predecessor_report.get("checks_total") == 55))

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
                (f"fixture_{ordinal}_20_of_20", report.get("checks_passed") == 20
                 and report.get("checks_total") == 20),
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
            ("fixture_0_exit_zero", False), ("fixture_0_20_of_20", False),
            ("fixture_0_no_midpoint", False), ("fixture_0_zero_state_reads", False),
            ("fixture_0_candidate_inert", False), ("fixture_0_authority_false", False),
            ("fixture_1_exit_zero", False), ("fixture_1_20_of_20", False),
            ("fixture_1_no_midpoint", False), ("fixture_1_zero_state_reads", False),
            ("fixture_1_candidate_inert", False), ("fixture_1_authority_false", False),
            ("deterministic_fixture_report", False),
        ))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_origin_series_runtime_audit.v1",
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
