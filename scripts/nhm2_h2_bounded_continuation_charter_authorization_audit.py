#!/usr/bin/env python3
"""Audit the operator's standing H2 continuation authorization receipt."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-bounded-continuation-charter-v1-20260830"
PROPOSAL = BASE / "h2-bounded-continuation-charter-proposal.v1.json"
PROPOSAL_AUDIT = BASE / "h2-bounded-continuation-charter-proposal-independent-audit.v1.json"
AUTH = BASE / "h2-bounded-continuation-charter-authorization.v1.json"
OUTPUT = BASE / "h2-bounded-continuation-charter-authorization-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


a = json.loads(AUTH.read_text(encoding="utf-8"))
pa = json.loads(PROPOSAL_AUDIT.read_text(encoding="utf-8"))
expected_bounds = ["cloud", "cleanup", "evidence_protection", "stop", "scientific_boundary", "cost", "runtime", "storage", "authority_locks"]
checks = {
    "schema_exact": a["schema"] == "nhm2.g2h_e_s5.h2_bounded_continuation_operating_charter.authorization.v1",
    "proposal_identity": digest(PROPOSAL) == a["charter_proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945",
    "proposal_audit_identity": digest(PROPOSAL_AUDIT) == a["charter_audit_sha256"] == "d6f514bc9fdd16205b4efa3c31e1b1097f2f05ef968a4c4d1f50e71b37a38c5e",
    "proposal_audit_pass": pa["verdict"] == "PASS" and pa["passed"] == pa["total"] == 20,
    "authorization_true": a["authorized"] is True and a["status"] == "ACTIVE_UNTIL_CHARTER_EXPIRY_OR_BOUND_EXHAUSTION",
    "bounds_exact": a["accepted_bounds"] == expected_bounds,
    "statement_binds_hashes": a["charter_proposal_sha256"] in a["operator_statement"] and a["charter_audit_sha256"] in a["operator_statement"],
}
audit = {
    "schema": "nhm2.g2h_e_s5.h2_bounded_continuation_operating_charter.authorization.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "authorization_sha256": digest(AUTH),
    "charter_active": all(checks.values()),
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(AUTH))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
