#!/usr/bin/env python3
"""Independent audit of the P8P-R10 authenticated read-only result."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r10-iab-authentication-preflight-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r10-iab-authentication-preflight.md"


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
    "packet_identity": digest(PACKET) == "12fe4a9851279e0dd8abba5d8a17d26e91f760fac314c898d2e3b70786494a55",
    "classification": "AUTHENTICATED_EXACT_RESOURCE / DIRECT_START_CONTROL_ABSENT / R10 CLOSED" in text,
    "one_tab_read": "Exactly one in-app-browser tab" in text and "single bound accessibility read" in flat,
    "exact_resource": all(value in text for value in (
        "1920090043510946854", "Stopped", "us-east1-c",
        "debian-12-bookworm-v20260817", "c2d-standard-32",
        "30 GB `Standard persistent disk`")),
    "menu_observed": "collapsed semantic `More actions" in flat,
    "direct_start_absent": "zero direct buttons or links named `Start / Resume`" in flat,
    "zero_activation": "No control was clicked or expanded" in flat,
    "zero_downstream": all(value in flat for value in (
        "No confirmation", "start request", "VM boot", "SSH", "upload",
        "Docker action", "calculation occurred")),
    "no_start_authority": "grants no start authority" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "successor_narrow": "one semantic expansion" in flat and "without activating any menu item" in flat,
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
