#!/usr/bin/env python3
"""Static audit of the P8P-R11 semantic Start-menu preflight."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r11-iab-start-menu-preflight.md"
R10_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r10-iab-authentication-preflight-result.md"


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
    "r10_identity": digest(R10_RESULT) == "e1d47f7a1182cf1cff572308eb01a61bff45c0c34542b6bad91af9852cebb273",
    "read_only": "FROZEN READ-ONLY MENU PREFLIGHT / ZERO BILLABLE ACTION" in text,
    "exact_resource": all(value in text for value in (
        "1920090043510946854", "dark-stratum-455714-h4", "us-east1-c", "Stopped")),
    "exact_action": "click exactly once" in flat and "More actions nhm2-h2-p8j-r9-c2d-32-20260831" in flat,
    "one_read": "perform exactly one accessibility read" in flat,
    "no_activation": "must not click or activate any menu item" in flat,
    "no_compute_request": "submits no Google Compute request" in flat,
    "separate_start_authority": "separately frozen billable start successor" in flat,
    "bindings_unchanged": "Every VM, ingress, controller, scientific, evidence, ceiling, automatic-stop, P8Q and authority binding remains unchanged" in flat,
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
