#!/usr/bin/env python3
"""Static audit of the P8P-R13 read-only operation diagnosis."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r13-operation-list-diagnosis.md"
R12_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r12-start-completion-failure-result.md"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "r12_identity": digest(R12_RESULT) == "2044624917c0d16ba76c481795a9b366d60a6bee325bd5ffb1c8cd44db2507e8",
    "read_only": "FROZEN READ-ONLY DIAGNOSIS / ZERO BILLABLE ACTION" in text,
    "exact_url": "compute/operations?project=dark-stratum-455714-h4" in text,
    "one_tab_read": "exactly one fresh visible in-app-browser tab" in flat and "exactly one accessibility read" in flat,
    "exact_resource": all(value in text for value in (
        "1920090043510946854", "us-east1-c", "nhm2-h2-p8j-r9-c2d-32-20260831")),
    "no_input": all(value in flat for value in (
        "may not click, type, filter, sort, refresh, navigate", "query an API",
        "start/stop a resource", "use a fallback")),
    "inconclusive_terminal": "diagnosis is inconclusive and terminal" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": all(value in flat for value in (
        "Candidate evaluations and positive samples remain zero",
        "physical, propulsion and transport authority remain false")),
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
