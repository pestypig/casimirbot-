#!/usr/bin/env python3
"""Read-only exact acknowledgement gate for the proposed C08-002 definition."""

# Program gate: G2H-E-S5 / A4
# Workstream: authenticated classical and quantum control branch
# Capability or component: C08-002 exact-byte acknowledgement validator
# Current maturity: audited proposal; acknowledgement absent
# Target maturity: exact acknowledgement admitted only with unchanged bytes
# Required frozen inputs: proposal, definition audits, request and template
# Required evidence: exact ASCII statement, artifact hashes, protected roots absent
# Stop/fail criteria: drift, qualification, template treated as evidence or authority
# Explicit non-goals: parser implementation, candidate evaluation or authorization
# Downstream gate unlocked: none; this validator cannot acknowledge by itself

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import sys
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[1]
REQUEST = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-request.md"
TEMPLATE = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-statement-template.txt"
LIVE_STATEMENT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-statement.txt"
DECISION = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-decision.v1.json"

EXPECTED_ARTIFACTS = {
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-resource-contract.v1.json":
        "efbff4c1f9490803e7283ff8d1906fbdeedae787d78047d42f3061bd975efc48",
    "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_definition_audit.py":
        "04e1f050fc46f9263753abd2145672b30afc569cddc989fb707dfc089df295b1",
    "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_definition_replay.mjs":
        "44498cd85d1e480df33b53bb1b3f208deeee37aa84db3e6de45756ab9ac4f3f7",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-request.md":
        "69935ba7f4721692cfd63420279c400f804b0dce68d57c0d5ae37fc4c104efbe",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-statement-template.txt":
        "92ca4c820f879946911e111ca8e7f6c0524947a7e6bab6efa70183850cba53c1",
}

PROTECTED_PATHS = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def extract_expected_statement() -> str:
    lines = REQUEST.read_text(encoding="utf-8").splitlines()
    try:
        start = lines.index("## Exact acknowledgement statement") + 1
    except ValueError as exc:
        raise ValueError("missing exact acknowledgement heading") from exc
    quoted: list[str] = []
    for line in lines[start:]:
        if line.startswith("> "):
            quoted.append(line[2:])
        elif quoted and not line.strip():
            break
    if not quoted:
        raise ValueError("missing exact acknowledgement blockquote")
    return " ".join(quoted)


def normalize_ascii_statement(value: str) -> str:
    if not re.fullmatch(r"[\x09\x0a\x0d\x20-\x7e]*", value):
        raise ValueError("non-ASCII or forbidden control character in acknowledgement")
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


def validate_statement_content(statement: str) -> tuple[bool, str]:
    try:
        expected = normalize_ascii_statement(extract_expected_statement())
        template = normalize_ascii_statement(TEMPLATE.read_text(encoding="utf-8"))
        actual = normalize_ascii_statement(statement)
    except (OSError, UnicodeError, ValueError) as exc:
        return False, str(exc)
    if template != expected:
        return False, "template differs from request blockquote"
    if actual != expected:
        return False, "statement differs from the exact acknowledgement form"
    state_ok, _ = artifact_state()
    if not state_ok:
        return False, "artifact drift or protected-root presence"
    return True, "content matches; this read-only check does not record acknowledgement"


def self_test() -> dict[str, Any]:
    expected = extract_expected_statement()
    proposal_hash = EXPECTED_ARTIFACTS[next(iter(EXPECTED_ARTIFACTS))]
    audit_hash = EXPECTED_ARTIFACTS["scripts/nhm2_g2h_e_s5_c08_canonical_ingress_definition_audit.py"]
    fixtures = {
        "exact_content": (expected, True),
        "line_wrapped_exact_content": (expected.replace(" with exact audit", "\nwith exact audit"), True),
        "proposal_hash_mutation": (expected.replace(proposal_hash, "0" + proposal_hash[1:]), False),
        "audit_hash_mutation": (expected.replace(audit_hash, "1" + audit_hash[1:]), False),
        "scope_omission": (expected.replace("candidate-neutral ", "", 1), False),
        "qualified_execution_authorization": (expected + " I also authorize execution.", False),
        "unicode_confusable": (expected.replace("SHA-256", "SHA\u2011256", 1), False),
    }
    checks: list[dict[str, Any]] = []
    for name, (statement, wanted) in fixtures.items():
        actual, detail = validate_statement_content(statement)
        checks.append({"name": name, "pass": actual == wanted,
                       "wanted_valid": wanted, "actual_valid": actual, "detail": detail})
    state_ok, state = artifact_state()
    checks.append({"name": "artifact_hashes_and_protected_roots", "pass": state_ok,
                   "wanted_valid": True, "actual_valid": state_ok, "detail": state})
    absent = not LIVE_STATEMENT.exists() and not DECISION.exists()
    checks.append({"name": "template_not_live_evidence", "pass": absent,
                   "wanted_valid": True, "actual_valid": absent,
                   "detail": {"live_statement_present": LIVE_STATEMENT.exists(),
                              "decision_present": DECISION.exists()}})
    passed = sum(1 for check in checks if check["pass"])
    return {
        "schema": "nhm2.g2h_e_s5_a4.c08_canonical_ingress_acknowledgement_gate.v1",
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


def check_current() -> tuple[int, dict[str, Any]]:
    if not LIVE_STATEMENT.is_file() or not DECISION.is_file():
        return 3, {
            "schema": "nhm2.g2h_e_s5_a4.c08_canonical_ingress_acknowledgement_gate.v1",
            "status": "ACKNOWLEDGEMENT_ABSENT",
            "live_statement_present": LIVE_STATEMENT.is_file(),
            "decision_present": DECISION.is_file(),
            "implementation_eligible": False,
            "candidate_evaluations": 0,
            "positive_parameter_samples": 0,
            "authorization_created": False,
            "authority_promoted": False,
        }
    valid, detail = validate_statement_content(LIVE_STATEMENT.read_text(encoding="utf-8"))
    try:
        decision = json.loads(DECISION.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        valid, detail, decision = False, str(exc), {}
    expected_statement_hash = sha256(LIVE_STATEMENT) if LIVE_STATEMENT.is_file() else None
    valid = valid and (
        decision.get("schema") == "nhm2.g2h_e_s5_a4.c08_canonical_ingress_acknowledgement_decision.v1"
        and decision.get("decision") == "ACKNOWLEDGED_CANDIDATE_NEUTRAL_ADDITIVE_RESOURCE_DEFINITION_ONLY"
        and decision.get("statement", {}).get("raw_sha256") == expected_statement_hash
        and decision.get("statement", {}).get("path") == str(LIVE_STATEMENT.relative_to(ROOT)).replace("\\", "/")
        and decision.get("scope", {}).get("candidate_neutral_c08_002_implementation_eligible") is True
        and decision.get("scope", {}).get("candidate_execution_authorized") is False
        and all(value is False for value in decision.get("authority", {}).values())
    )
    return (0 if valid else 2), {
        "schema": "nhm2.g2h_e_s5_a4.c08_canonical_ingress_acknowledgement_gate.v1",
        "status": "ACKNOWLEDGEMENT_VALID" if valid else "FAIL",
        "detail": detail if valid else "decision record or statement mismatch",
        "implementation_eligible": valid,
        "candidate_execution_authorized": False,
        "authorization_created": False,
        "authority_promoted": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--self-test", action="store_true")
    group.add_argument("--statement-file", type=pathlib.Path)
    group.add_argument("--check-current", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        report = self_test()
        print(json.dumps(report, sort_keys=True, separators=(",", ":")))
        return 0 if report["status"] == "PASS" else 1
    if args.check_current:
        code, report = check_current()
        print(json.dumps(report, sort_keys=True, separators=(",", ":")))
        return code
    try:
        statement = args.statement_file.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        print(json.dumps({"status": "FAIL", "detail": str(exc)}, sort_keys=True))
        return 2
    valid, detail = validate_statement_content(statement)
    report = {
        "schema": "nhm2.g2h_e_s5_a4.c08_canonical_ingress_acknowledgement_gate.v1",
        "status": "CONTENT_VALID_NOT_RECORDED" if valid else "FAIL",
        "detail": detail,
        "implementation_eligible": False,
        "acknowledgement_record_created": False,
        "authorization_created": False,
        "authority_promoted": False,
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if valid else 2


if __name__ == "__main__":
    sys.exit(main())
