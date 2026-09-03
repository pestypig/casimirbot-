#!/usr/bin/env python3
"""Independent audit of the P8P-R13 inconclusive operation-list result."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r13-operation-list-diagnosis-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r13-operation-list-diagnosis.md"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "packet_identity": digest(PACKET) == "84e279f910af7317d07ace3ceef194c3bd9ac29df7c8bb7233d24a3676fda3c4",
    "classification": "INCONCLUSIVE_OPERATIONS_CONTENT_NOT_RENDERED / R13 CLOSED" in text,
    "one_tab_read": "Exactly one fresh in-app-browser tab" in text and "one authorized accessibility read" in flat,
    "shell_only": "shell and navigation" in flat and "no Operations heading, operation table" in flat,
    "no_input": all(value in flat for value in (
        "No click, type, filter, sort, refresh, navigation, API query",
        "resource action or fallback occurred")),
    "cause_uninferred": "neither capacity nor quota failure" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "successor_narrow": "delayed read-only successor" in flat and "exactly one read" in flat,
    "authority_locks": all(value in flat for value in (
        "Candidate evaluations and positive samples remain zero",
        "physical, propulsion and transport authority remain false")),
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
