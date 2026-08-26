#!/usr/bin/env python3
"""Closure audit for the immutable G2H-E-S primary-v2 partial result."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s-primary-result.v1.json"
RESULT_SHA256 = "36509fd0eda9f6ac6df80326942b12afbae81c287f3d728a9a94abe1adc08ec4"
WORK_PROGRAM = ROOT / "docs/research/nhm2-spherical-boson-star-v2-work-program.md"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    data = json.loads(RESULT.read_text(encoding="utf-8"))
    audit = subprocess.run(
        [sys.executable, "scripts/nhm2_g2h_e_s_primary_partial_audit.py"],
        cwd=ROOT, text=True, encoding="utf-8", capture_output=True, check=False,
    )
    checks = [
        ("result_identity",
         sha256(RESULT) == RESULT_SHA256
         and RESULT.with_suffix(".sha256").read_text(encoding="ascii").split()[0]
         == RESULT_SHA256),
        ("typed_decision",
         data["decision"] == "PARTIAL_EXECUTION_PRE_MATH_AUTHORIZATION_SCHEMA_VERSION_SKEW"
         and data["static_attribution"]["typed_failure"]
         == "AUTHORIZATION_SCHEMA_VERSION_SKEW_V2_CHECKPOINT_V1_BINARY"),
        ("proposal_exhausted_no_retry",
         data["proposal_exhausted"] is True and data["retry_allowed"] is False),
        ("no_mathematical_decision",
         data["mathematical_decision"] is None
         and data["authority"]["candidate_evaluations"] == 0),
        ("root_and_manifest_absent",
         data["output_root_exists"] is False and data["primary_manifest_sha256"] is None
         and not (ROOT / "artifacts/research/nhm2/g2h/tolman-vii-primary-v2").exists()),
        ("retained_container_bound",
         data["container"]["retained"] is True
         and data["container"]["exit_code"] == 66
         and data["container"]["oom_killed"] is False),
        ("independent_lane_locked",
         data["independent_lane_executed"] is False
         and data["authority"]["independent_execution_authorized"] is False),
        ("all_claim_authority_false",
         all(value is False for key, value in data["authority"].items()
             if key != "candidate_evaluations")),
        ("partial_audit_passes", audit.returncode == 0 and "SUMMARY 16/16" in audit.stdout),
        ("canonical_active_gate",
         "Active program gate: **G2H-E-S-R1 — primary-v2 authorization-schema version-skew disposition**"
         in WORK_PROGRAM.read_text(encoding="utf-8")),
    ]
    for name, passed in checks:
        print(f"{'PASS' if passed else 'FAIL'} {name}")
    passed_count = sum(passed for _, passed in checks)
    print(f"SUMMARY {passed_count}/{len(checks)}")
    return 0 if passed_count == len(checks) else 1


if __name__ == "__main__":
    sys.exit(main())
