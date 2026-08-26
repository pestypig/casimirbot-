#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-003."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-endpoint-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-endpoint-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-endpoint-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_endpoint_v1.hpp":
        "48b64bf3305e9eb368b4af570a20c8d518e52c600f36e31d1385779dbee3a175",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_endpoint_v1.cpp":
        "b4f741e60e7c9660edb777e8297482843cd83a17dd0020380086d8ae3209994f",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_endpoint_fixture_v1.cpp":
        "f1f0bccc765ca0363a937a8e733ab698f0c1d7493ea6bfa512364b349fb78317",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-endpoint-fixture.v1":
        "b434ceef9c97ec019f6ac7da800875fe67a60209b85a3c6c2a8dc9fa2869bc03",
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
    "scripts/nhm2_g2h_e_s5_borel_acknowledgement_gate.py":
        "66014c833ab55b8b64bc92421251dd9b1cf04acbec3c96cfbe8306c9f88bcc40",
}

EXPECTED_EXECUTABLE = "3d4eb5be5a643db02e091312c98b0cbee3885d56cf68bebddb17c2574a78252b"

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

    source = (G2H / "mini_boson_star_primary_c08_endpoint_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_endpoint_v1.hpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("exact_endpoint_block", "6L * identity.grid_node_count" in source
         and "7L * identity.grid_node_count" in source),
        ("every_endpoint_coefficient_finite", "endpoint_coefficient_nonfinite" in source
         and "arb_is_finite(input.identity->state_storage + index)" in source),
        ("tail_radius_checked", "arb_radref(input.endpoint_tail_image)" in source
         and "arb_le(tail_radius, input.order8_tail_norm)" in source),
        ("strict_positive_endpoint", "arb_is_positive(h0)" in source),
        ("full_banach_derivative_recorded", "infinite_tail_operator_norm = 1U" in source
         and "finite_hessian_exact_zero = true" in source
         and "finite_gradient_ones = end - begin" in source),
        ("predecessor_gate_first", source.find("predecessor_c08_001_passed")
         < source.find("shape(*input.identity")),
        ("no_file_or_candidate_ingress", "fstream" not in source
         and "ifstream" not in source and "shat" not in source.lower()
         and "6/5" not in source),
        ("candidate_neutral_header", "candidate-neutral endpoint functional" in header
         and "never receives selected data" in header),
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

    definition_audit = run([sys.executable,
                            "scripts/nhm2_g2h_e_s5_formal_germ_growth_audit.py"])
    definition_report = parse_report(definition_audit)
    checks.append(("parent_exact_audit_64_of_64", definition_audit.returncode == 0
                   and definition_report.get("checks_passed") == 64
                   and definition_report.get("checks_total") == 64))
    replay = run(["node", "scripts/nhm2_g2h_e_s5_borel_growth_independent_replay.mjs"])
    replay_report = parse_report(replay)
    checks.append(("parent_replay_27_of_27", replay.returncode == 0
                   and replay_report.get("checks_passed") == 27
                   and replay_report.get("checks_total") == 27))

    built = run(["docker", "build", "--quiet", "--file", str(DOCKERFILE),
                 "--tag", IMAGE, "."])
    checks.append(("docker_build", built.returncode == 0))
    image_id = ""
    executable_hash = ""
    fixture_reports: list[dict[str, object]] = []
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
            fixture_reports.append(report)
            checks.extend((
                (f"fixture_{ordinal}_exit_zero", executed.returncode == 0),
                (f"fixture_{ordinal}_25_of_25", report.get("checks_passed") == 25
                 and report.get("checks_total") == 25),
                (f"fixture_{ordinal}_bounded_reads",
                 report.get("maximum_endpoint_coefficients_read") == 256),
                (f"fixture_{ordinal}_candidate_inert",
                 report.get("candidate_evaluations") == 0
                 and report.get("positive_parameter_samples") == 0
                 and report.get("candidate_roots_created") is False),
                (f"fixture_{ordinal}_authority_false",
                 report.get("authority_promoted") is False
                 and report.get("scientific_handler_linked") is False),
            ))
        checks.append(("deterministic_fixture_report",
                       len(fixture_reports) == 2
                       and fixture_reports[0] == fixture_reports[1]))
    else:
        checks.extend((
            ("local_image_identity_recorded", False), ("executable_identity", False),
            ("fixture_0_exit_zero", False), ("fixture_0_25_of_25", False),
            ("fixture_0_bounded_reads", False), ("fixture_0_candidate_inert", False),
            ("fixture_0_authority_false", False), ("fixture_1_exit_zero", False),
            ("fixture_1_25_of_25", False), ("fixture_1_bounded_reads", False),
            ("fixture_1_candidate_inert", False), ("fixture_1_authority_false", False),
            ("deterministic_fixture_report", False),
        ))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_endpoint_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "fixture_report": fixture_reports[0] if fixture_reports else {},
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
