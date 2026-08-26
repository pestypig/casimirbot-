#!/usr/bin/env python3
"""Audit the isolated, candidate-neutral C08-001 identity/state-length gate."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-identity-fixture:v1-audit"

SOURCES = {
    "mini_boson_star_primary_c08_identity_v1.hpp":
        "0792473be2827adb45ed6705742c8e4d8a13813dfcf59477560ea84069a462e4",
    "mini_boson_star_primary_c08_identity_v1.cpp":
        "be2f0807f68a6caae2da48c62d6985eaa091f47959c0303d8eba3595e17904d9",
    "mini_boson_star_primary_c08_identity_fixture_v1.cpp":
        "eaaa7b113d5510681ae381a5ce2a3ce50eadea199849250cf6d4b7c6b31f1d48",
    "Dockerfile.primary.mini-boson-c08-identity-fixture.v1":
        "c15198d2c43d579adf4c59f6f72676dd1147803a70679bc95b75c43c905fb3bb",
    "mini_boson_star_primary_grid_v1.hpp":
        "85bebb7814a1dd7c190e58a031f8e791bb736b0693be0f04035f9826130252c7",
    "mini_boson_star_primary_grid_v1.cpp":
        "63901c2dca4af9f77113249324a3004f002dd63f8d0b56bcc04d1e7eaad20a4b",
}

FROZEN = {
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json":
        "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-checkpoint-abi.v1.json":
        "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca",
}

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


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"source_hash:{name}", digest(G2H / name) == expected)
                  for name, expected in SOURCES.items())
    checks.extend((f"frozen_hash:{path}", digest(ROOT / path) == expected)
                  for path, expected in FROZEN.items())
    checks.append(("protected_absent_before", all(not (ROOT / path).exists()
                                                   for path in PROTECTED)))

    source = (G2H / "mini_boson_star_primary_c08_identity_v1.cpp").read_text(encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_identity_v1.hpp").read_text(encoding="utf-8")
    validate_body = source.split("bool validate(const InputIdentity &input) {", 1)[1].split(
        "std::size_t fixture_count()", 1)[0]
    checks.extend((
        ("four_frozen_identities_bound", all(value in source for value in FROZEN.values())),
        ("vacuum_cell_zero_only", "chart == Chart::vacuum) return ordinal == 0U" in source),
        ("positive_cells_one_to_1023", "ordinal >= 1U && ordinal <= 1023U" in source),
        ("frozen_grid_primitive_used", "frozen_node_count(input.grid_node_count)" in validate_body),
        ("chart_specific_state_length_used", "expected_state_length" in validate_body),
        ("storage_required", "input.state_storage == nullptr" in validate_body),
        ("state_coefficients_not_read", "arb_" not in validate_body
         and "state_storage[" not in validate_body),
        ("selected_identity_not_embedded", "shat" not in source and "6/5" not in source),
        ("candidate_neutral_contract_comment", "reads no state coefficient" in header),
    ))

    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-identity-fixture.v1"
    built = run(["docker", "build", "--quiet", "--file", str(dockerfile),
                 "--tag", IMAGE, str(G2H)])
    checks.append(("docker_build", built.returncode == 0))
    report: dict[str, object] = {}
    if built.returncode == 0:
        executed = run(["docker", "run", "--rm", "--network", "none", "--read-only",
                        "--cap-drop", "ALL", "--security-opt", "no-new-privileges", IMAGE])
        checks.append(("fixture_exit_zero", executed.returncode == 0))
        try:
            report = json.loads(executed.stdout.strip().splitlines()[-1])
        except (IndexError, json.JSONDecodeError):
            report = {}
        checks.extend((
            ("fixture_10_of_10", report.get("checks_passed") == 10
             and report.get("checks_total") == 10),
            ("fixture_full_mask", report.get("fixture_mask") == 1023),
            ("fixture_reads_zero_coefficients", report.get("state_coefficients_read") == 0),
            ("fixture_candidate_inert", report.get("candidate_evaluations") == 0
             and report.get("positive_parameter_samples") == 0
             and report.get("candidate_roots_created") is False),
            ("fixture_authority_false", report.get("authority_promoted") is False
             and report.get("scientific_handler_linked") is False),
        ))
    else:
        checks.extend((
            ("fixture_exit_zero", False), ("fixture_10_of_10", False),
            ("fixture_full_mask", False), ("fixture_reads_zero_coefficients", False),
            ("fixture_candidate_inert", False), ("fixture_authority_false", False),
        ))
    checks.append(("protected_absent_after", all(not (ROOT / path).exists()
                                                  for path in PROTECTED)))

    passed = sum(ok for _, ok in checks)
    result = {
        "schema": "nhm2.g2h_e_s5.c08_identity_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "fixture_report": report,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
