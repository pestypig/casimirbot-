#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-004."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-margins-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-margins-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-margins-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_margins_v1.hpp":
        "ab68946c846a89b56f5aa00179cc3531084ff04d1ef85215d8e1248d355de2f5",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_margins_v1.cpp":
        "9732f50149d60f0ef45c9a1647cbf6b6ad9565e62bd77b502c8de9d23c312d6b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_margins_fixture_v1.cpp":
        "5ea89bba3e11b71e9e7ac2def029264fefa9503862105b4665e6bd3a4fb1bc28",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-margins-fixture.v1":
        "8de6f713fa517fb1b30c25fb562e634dcdb77bcbbc31eb9283612ade89f2e552",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_identity_v1.hpp":
        "0792473be2827adb45ed6705742c8e4d8a13813dfcf59477560ea84069a462e4",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_identity_v1.cpp":
        "be2f0807f68a6caae2da48c62d6985eaa091f47959c0303d8eba3595e17904d9",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_grid_v1.hpp":
        "85bebb7814a1dd7c190e58a031f8e791bb736b0693be0f04035f9826130252c7",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_grid_v1.cpp":
        "63901c2dca4af9f77113249324a3004f002dd63f8d0b56bcc04d1e7eaad20a4b",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-statement.txt":
        "8fb6486066bcb44b361e7d37df44c7549713cfde03b0038d09548c511fb01bd9",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-decision.v1.json":
        "67d438ccaa7b8600afac21ceda8faacd6802d2f8dae6d47c8ea2507a0ed10932",
}

EXPECTED_EXECUTABLE = "3addff4e1c7adcd4cd81d8039eda6758b162fd261d719fbe9be6ae905f3288be"

PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False, capture_output=True, text=True)


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

    source = (G2H / "mini_boson_star_primary_c08_margins_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_margins_v1.hpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_margins_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("predecessor_gate_first", source.find("predecessor_c08_003_passed")
         < source.find("using primary_c08_identity_v1::Chart")),
        ("chart_parameter_formulas", "arb_set(output->mu, input.theta2)" in source
         and "arb_mul(output->mu, input.eta, input.theta2" in source
         and "arb_mul(beta_plus_one, input.theta2, one_minus" in source),
        ("directed_mu_upper_not_midpoint", "arb_get_ubound_arf" in source
         and "arb_get_mid_arf" not in source
         and "arb_midref(" not in source),
        ("strict_gap_formula", "arb_set_ui(output->g, 255UL)" in source
         and "arb_sub(output->g, output->g, two_mu_upper" in source
         and "arb_is_positive(output->g)" in source),
        ("all_growth_tiers", all(token in source for token in (
            "output->sigma0", "output->sigma1", "output->sigma2",
            "output->tau0", "output->tau1", "output->tau2",
            "output->delta", "output->internal_gaps"))),
        ("formal_metric_margin", "arb_div_ui(output->formal_metric_margin, output->g, 255UL"
         in source),
        ("carrier_denominators", "output->two_kappa" in source
         and "output->carrier_a" in source and "scales = {1UL, 2UL, 2UL}" in source),
        ("touching_rejected", "arb_is_positive(input.kappa)" in source
         and "arb_is_positive(input.h0)" in source
         and "unsafe_upper" in fixture),
        ("no_state_or_file_ingress", "state_storage" not in source
         and "fstream" not in source and "ifstream" not in source
         and "shat" not in source.lower() and "6/5" not in source),
        ("candidate_neutral_header", "no state-vector read" in header
         and "parameter sampling" in header
         and "candidate evaluation" in header),
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
                       "scripts/nhm2_g2h_e_s5_c08_endpoint_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_003_predecessor_41_of_41", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 41
                   and predecessor_report.get("checks_total") == 41))

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
                (f"fixture_{ordinal}_28_of_28", report.get("checks_passed") == 28
                 and report.get("checks_total") == 28),
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
            ("fixture_0_exit_zero", False), ("fixture_0_28_of_28", False),
            ("fixture_0_no_midpoint", False), ("fixture_0_zero_state_reads", False),
            ("fixture_0_candidate_inert", False), ("fixture_0_authority_false", False),
            ("fixture_1_exit_zero", False), ("fixture_1_28_of_28", False),
            ("fixture_1_no_midpoint", False), ("fixture_1_zero_state_reads", False),
            ("fixture_1_candidate_inert", False), ("fixture_1_authority_false", False),
            ("deterministic_fixture_report", False),
        ))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_margins_runtime_audit.v1",
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
