#!/usr/bin/env python3
"""Read-only A3 exact acknowledgement and artifact-identity gate."""

# Program gate: G2H-E-S5 — inert primary execution-preflight decision
# Workstream: authenticated classical and quantum control branch
# Capability or component: S5-A/A3 exact-byte acknowledgement gate
# Current maturity: repaired definition audited; acknowledgement absent
# Target maturity: exact acknowledgement admitted only with unchanged bytes
# Required frozen inputs: replacement request and its five bound artifacts
# Required evidence: exact text, hashes, mutation rejection, absent protected roots
# Stop/fail criteria: drift, qualification, Unicode confusable, protected root
# Explicit non-goals: C08 implementation, candidate evaluation or authorization
# Downstream gate unlocked: none; this validator cannot acknowledge by itself

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
REQUEST = ROOT / (
    "docs/research/"
    "nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-"
    "replacement-acknowledgement-request.md"
)

EXPECTED_ARTIFACTS = {
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
    "scripts/nhm2_g2h_e_s5_formal_germ_growth_audit.py":
        "1b98e89afe645696b083f439a291f9a0ee131cf76f06584c1a4050360748f471",
    "scripts/nhm2_g2h_e_s5_borel_growth_independent_replay.mjs":
        "04902f6d784a1e38c04c7329f0cebc9ee9257c7be5db5b964130fa8f088b5b8c",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-preacknowledgement-completeness-review.md":
        "01e00db3126bd0cc024faa2c88f2a9123c19e9c0448b2d0ab6899fd4435e6b13",
}

PROTECTED_PATHS = [
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def extract_expected_statement() -> str:
    lines = REQUEST.read_text(encoding="utf-8").splitlines()
    try:
        start = lines.index("## Exact acknowledgement form") + 1
    except ValueError as exc:
        raise ValueError("missing exact acknowledgement heading") from exc
    quoted: list[str] = []
    for line in lines[start:]:
        if line.startswith("> "):
            quoted.append(line[2:])
        elif quoted and line.strip() == "":
            break
    if not quoted:
        raise ValueError("missing exact acknowledgement blockquote")
    return " ".join(quoted)


def normalize_ascii_statement(value: str) -> str:
    if not re.fullmatch(r"[\x09\x0a\x0d\x20-\x7e]*", value):
        raise ValueError("non-ASCII or control character in acknowledgement")
    return re.sub(r"[ \t\r\n]+", " ", value.strip())


def artifact_state() -> tuple[bool, dict[str, Any]]:
    details: dict[str, Any] = {}
    ok = True
    for relative, expected in EXPECTED_ARTIFACTS.items():
        path = ROOT / relative
        actual = sha256(path) if path.is_file() else None
        match = actual == expected
        details[relative] = {"expected": expected, "actual": actual, "match": match}
        ok = ok and match
    protected = {relative: (ROOT / relative).exists() for relative in PROTECTED_PATHS}
    details["protected_paths"] = protected
    ok = ok and not any(protected.values())
    return ok, details


def validate_statement(statement: str) -> tuple[bool, str]:
    try:
        expected = normalize_ascii_statement(extract_expected_statement())
        actual = normalize_ascii_statement(statement)
    except (OSError, UnicodeError, ValueError) as exc:
        return False, str(exc)
    if actual != expected:
        return False, "statement differs from the exact acknowledgement form"
    state_ok, _ = artifact_state()
    if not state_ok:
        return False, "artifact drift or protected-root presence"
    return True, "exact statement and artifact state match"


def self_test() -> dict[str, Any]:
    expected = extract_expected_statement()
    contract_hash = EXPECTED_ARTIFACTS[next(iter(EXPECTED_ARTIFACTS))]
    fixtures = {
        "exact": (expected, True),
        "line_wrapped_exact": (expected.replace(" with state-jet", "\nwith state-jet"), True),
        "contract_hash_mutation": (expected.replace(contract_hash, "0" + contract_hash[1:]), False),
        "scope_omission": (expected.replace("candidate-neutral ", ""), False),
        "qualified_authorization": (expected + " I also authorize execution.", False),
        "unicode_confusable": (expected.replace("SHA-256", "SHA\u2011256", 1), False),
    }
    checks = []
    for name, (statement, wanted) in fixtures.items():
        actual, detail = validate_statement(statement)
        checks.append({
            "name": name,
            "pass": actual == wanted,
            "wanted_valid": wanted,
            "actual_valid": actual,
            "detail": detail,
        })
    state_ok, state = artifact_state()
    checks.append({
        "name": "artifact_hashes_and_protected_roots",
        "pass": state_ok,
        "wanted_valid": True,
        "actual_valid": state_ok,
        "detail": state,
    })
    passed = sum(1 for check in checks if check["pass"])
    return {
        "schema": "nhm2.g2h_e_s5_a.borel_acknowledgement_gate.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authorization_created": False,
        "authority_promoted": False,
        "acknowledgement_record_created": False,
        "checks": checks,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--self-test", action="store_true")
    group.add_argument("--statement-file", type=Path)
    args = parser.parse_args()

    if args.self_test:
        report = self_test()
        print(json.dumps(report, sort_keys=True, separators=(",", ":")))
        return 0 if report["status"] == "PASS" else 1

    try:
        statement = args.statement_file.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        print(json.dumps({"status": "FAIL", "detail": str(exc)}, sort_keys=True))
        return 2
    valid, detail = validate_statement(statement)
    report = {
        "schema": "nhm2.g2h_e_s5_a.borel_acknowledgement_gate.v1",
        "status": "ACKNOWLEDGEMENT_VALID" if valid else "FAIL",
        "detail": detail,
        "acknowledgement_record_created": False,
        "authorization_created": False,
        "authority_promoted": False,
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if valid else 2


if __name__ == "__main__":
    sys.exit(main())
