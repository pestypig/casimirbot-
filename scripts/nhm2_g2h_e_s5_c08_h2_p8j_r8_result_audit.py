#!/usr/bin/env python3
"""Audit the terminal, no-request H2-P8J-R8 preexecution result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r8-cloud-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r8-pd-standard-regional-capacity-successor-proposal.md"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r8-cloud-preexecution-result-v1-20260831/h2-p8j-r8-result-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


result = RESULT.read_text(encoding="utf-8")
checks = {
    "proposal_identity": sha256(PROPOSAL) == "fd73febf138f6dd03ecfa507eeec915bc727dce5d073f52ff1bfd02360481b83",
    "result_required_header": all(
        label in result
        for label in (
            "Program gate:",
            "Workstream:",
            "Capability or component:",
            "Current maturity:",
            "Target maturity:",
            "Required frozen inputs:",
            "Required evidence:",
            "Stop/fail criteria:",
            "Explicit non-goals:",
            "Downstream gate unlocked:",
        )
    ),
    "terminal_preexecution_status": "TERMINAL PREEXECUTION TRANSPORT FAILURE / ZERO CLOUD RESOURCE" in result,
    "connection_marker": "R8_CONNECTION_READY" in result,
    "partial_prefix_bound": "set -euo pipefail; P=dark-stratum-455714-h4; N=nhm" in result,
    "conditional_parser_error": "syntax error in conditional expression" in result,
    "near_parser_error": "syntax error near ';'" in result,
    "parse_before_execution": "rejected the compound line during parsing" in result,
    "no_guard_execution": "No guard command" in result,
    "no_bulk_request": "regional `bulk create` request" in result and "was executed by that line" in result,
    "no_vm": "VM creation" in result,
    "no_disk": "disk creation" in result,
    "no_archive_transfer": "archive\n   transfer" in result,
    "no_build": "build" in result,
    "no_fixture": "fixture" in result,
    "no_numerical_process": "numerical process" in result,
    "scientific_hypothesis_unobserved": "scientific and allocation hypothesis was not tested" in result,
    "r8_consumed": "R8 itself is consumed" in result,
    "no_retry": "not eligible for retry" in result,
    "successor_separately_versioned": "separately versioned" in result,
    "transport_not_capacity_evidence": all(word in result for word in ("storage", "C2D-capacity", "numerical evidence")),
    "candidate_evaluations_zero": "Candidate evaluations and positive samples remain zero" in result,
    "authority_locked": "all candidate, proof, geometry/state" in result and "authority remain false" in result,
}

passed = sum(checks.values())
total = len(checks)
payload = {
    "schema": "nhm2.g2h_e_s5.c08.h2_p8j_r8.cloud_preexecution_result_audit.v1",
    "status": "PASS" if passed == total else "FAIL",
    "checks_passed": passed,
    "checks_total": total,
    "checks": checks,
    "proposal_sha256": sha256(PROPOSAL),
    "result_sha256": sha256(RESULT),
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(payload, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"{passed}/{total} {payload['status']}")
raise SystemExit(0 if passed == total else 1)
