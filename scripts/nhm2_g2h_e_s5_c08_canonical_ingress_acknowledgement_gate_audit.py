#!/usr/bin/env python3
"""Audit the read-only C08-002 acknowledgement gate and absent live decision."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
GATE = ROOT / "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_acknowledgement_gate.py"
TEMPLATE = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-statement-template.txt"
LIVE = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-statement.txt"
DECISION = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-decision.v1.json"

EXPECTED = {
    "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_acknowledgement_gate.py":
        "c77c69e0ac83d46500ed39ec96c745cfcbb248ad024a441f8a9ff3bb7c83a4f8",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-resource-contract.v1.json":
        "efbff4c1f9490803e7283ff8d1906fbdeedae787d78047d42f3061bd975efc48",
    "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_definition_audit.py":
        "04e1f050fc46f9263753abd2145672b30afc569cddc989fb707dfc089df295b1",
    "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_definition_replay.mjs":
        "44498cd85d1e480df33b53bb1b3f208deeee37aa84db3e6de45756ab9ac4f3f7",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-request.md":
        "69935ba7f4721692cfd63420279c400f804b0dce68d57c0d5ae37fc4c104efbe",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-statement-template.txt":
        "92ca4c820f879946911e111ca8e7f6c0524947a7e6bab6efa70183850cba53c1",
}

PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def invoke(*arguments: str) -> tuple[int, dict[str, object]]:
    result = subprocess.run(
        [sys.executable, str(GATE), *arguments], cwd=ROOT,
        check=False, capture_output=True, text=True)
    try:
        report = json.loads(result.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        report = {"parse_failure": result.stdout, "stderr": result.stderr}
    return result.returncode, report


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{relative}", digest(ROOT / relative) == expected)
                  for relative, expected in EXPECTED.items())
    checks.append(("protected_absent_before", all(not (ROOT / path).exists() for path in PROTECTED)))
    checks.append(("live_statement_absent", not LIVE.exists()))
    checks.append(("decision_absent", not DECISION.exists()))

    self_code, self_report = invoke("--self-test")
    checks.extend((
        ("self_test_exit_zero", self_code == 0),
        ("self_test_9_of_9", self_report.get("checks_passed") == 9
         and self_report.get("checks_total") == 9),
        ("self_test_no_record", self_report.get("acknowledgement_record_created") is False),
        ("self_test_candidate_inert", self_report.get("candidate_evaluations") == 0
         and self_report.get("positive_parameter_samples") == 0
         and self_report.get("candidate_roots_created") is False),
        ("self_test_authority_false", self_report.get("authorization_created") is False
         and self_report.get("authority_promoted") is False),
    ))

    current_code, current_report = invoke("--check-current")
    checks.extend((
        ("current_absent_exit_three", current_code == 3),
        ("current_acknowledgement_absent", current_report.get("status") == "ACKNOWLEDGEMENT_ABSENT"),
        ("current_implementation_ineligible", current_report.get("implementation_eligible") is False),
        ("current_authority_false", current_report.get("authorization_created") is False
         and current_report.get("authority_promoted") is False),
    ))

    template_code, template_report = invoke("--statement-file", str(TEMPLATE))
    checks.extend((
        ("template_content_fixture_exit_zero", template_code == 0),
        ("template_content_not_recorded", template_report.get("status") == "CONTENT_VALID_NOT_RECORDED"
         and template_report.get("implementation_eligible") is False
         and template_report.get("acknowledgement_record_created") is False),
    ))
    checks.append(("protected_absent_after", all(not (ROOT / path).exists() for path in PROTECTED)))

    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5_a4.c08_canonical_ingress_acknowledgement_gate_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "self_test": self_report,
        "current_state": current_report,
        "template_probe": template_report,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "acknowledgement_record_created": False,
        "implementation_eligible": False,
        "authorization_created": False,
        "authority_promoted": False,
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
