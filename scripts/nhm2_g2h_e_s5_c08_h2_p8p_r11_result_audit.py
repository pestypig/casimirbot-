#!/usr/bin/env python3
"""Independent audit of the P8P-R11 semantic Start-menu result."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r11-iab-start-menu-preflight-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r11-iab-start-menu-preflight.md"


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
    "packet_identity": digest(PACKET) == "7f3882a2b6b8d9afb03c81a028f61198c50a927a9685bcc385188c5736b2fd8a",
    "classification": "PASS_READONLY_EXACT_ENABLED_START_ITEM / R11 CLOSED" in text,
    "resource_continuity": all(value in text for value in (
        "1920090043510946854", "dark-stratum-455714-h4", "us-east1-c", "Stopped")),
    "one_expansion": "clicked exactly once" in flat and "single post-expansion accessibility read" in flat,
    "exact_enabled_start": "exactly one enabled semantic button named `Start / Resume`" in flat,
    "zero_activation": "No menu item was clicked" in flat,
    "zero_downstream": all(value in flat for value in (
        "No confirmation", "Google Compute request", "VM boot", "SSH",
        "upload", "Docker action", "calculation occurred")),
    "transport_proven": "deterministic semantic start transport exists" in flat,
    "separate_authority": "separately frozen, action-time-authorized successor" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
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
