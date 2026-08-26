#!/usr/bin/env python3
"""Candidate-neutral audit for the isolated G2H-E-S5 A4 flat remainder producer."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-flat-remainder-fixture:v1-audit"

SOURCES = {
    "mini_boson_star_primary_flat_remainder_v1.hpp":
        "1f1843b239118d8634e987fe408d718a666972c1ff56ee2575a2dad8ee7a179d",
    "mini_boson_star_primary_flat_remainder_v1.cpp":
        "90e0a01a8796af8dead3113b3ca349b6501da9fc92a48601ae44d6958d4be499",
    "mini_boson_star_primary_flat_remainder_fixture_v1.cpp":
        "995c798778632e2fd4238e705e8c081d161b79e2245ff4c0e7030bd0d1c3a718",
    "Dockerfile.primary.mini-boson-flat-remainder-fixture.v1":
        "f48531ed08256caf63e5188cc0a87d144b5b4016e7a63d8aa326de9c2a1e5560",
}

CONTRACTS = {
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-flat-carrier-remainder-contract.v1.json":
        "09ca71e9ea3d93ca31468ceb1a953cd0930b86f1f117211b3e4a5925cf865103",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-validated-inverse-radii-contract.v1.json":
        "a180d03a7ea4f2b9499bdce9984b7310d178e777016a48a0809d76768a0ba529",
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
    checks.extend((f"contract_hash:{path}", digest(ROOT / path) == expected)
                  for path, expected in CONTRACTS.items())
    checks.append(("protected_roots_absent_before", all(not (ROOT / p).exists() for p in PROTECTED)))

    source = (G2H / "mini_boson_star_primary_flat_remainder_v1.cpp").read_text(encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_flat_remainder_v1.hpp").read_text(encoding="utf-8")
    checks.extend((
        ("frozen_13_jet_inventory", "parameter_jet_count = 13U" in header),
        ("frozen_four_residual_components", "residual_component_count = 4U" in header),
        ("separate_tail_inputs", "full_parameter_jet_tails" in header and "formal_parameter_jet_tails" in header),
        ("inverse_majorants_explicit", all(token in header for token in (
            "inverse_y_majorant", "inverse_z1_majorant", "inverse_z2_majorant"))),
        ("ordered_hessian_orientations", "second_jet(a, b)" in source),
        ("finite_composition_before_projection", "arb_add(expression, expression, term" in source),
        ("failure_016_to_020_present", all(token in source for token in (
            "C08-016_", "C08-017_", "C08-018_", "C08-019_", "C08-020_"))),
        ("no_selected_identity_literal", "6/5" not in source and "shat" not in source),
        ("no_candidate_root_literal", "mini-boson-star-primary" not in source),
    ))

    dockerfile = G2H / "Dockerfile.primary.mini-boson-flat-remainder-fixture.v1"
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
            ("fixture_12_of_12", report.get("checks_passed") == 12 and report.get("checks_total") == 12),
            ("fixture_full_mask", report.get("fixture_mask") == 4095),
            ("fixture_candidate_inert", report.get("candidate_evaluations") == 0
             and report.get("positive_parameter_samples") == 0
             and report.get("candidate_roots_created") is False),
            ("fixture_authority_false", report.get("authority_promoted") is False
             and report.get("scientific_handler_linked") is False),
        ))
    else:
        checks.extend((
            ("fixture_exit_zero", False), ("fixture_12_of_12", False),
            ("fixture_full_mask", False), ("fixture_candidate_inert", False),
            ("fixture_authority_false", False),
        ))
    checks.append(("protected_roots_absent_after", all(not (ROOT / p).exists() for p in PROTECTED)))

    passed = sum(ok for _, ok in checks)
    result = {
        "schema": "nhm2.g2h_e_s5.flat_remainder_runtime_audit.v1",
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
