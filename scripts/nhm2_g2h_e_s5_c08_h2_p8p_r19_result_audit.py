#!/usr/bin/env python3
"""Audit the immutable P8P-R19 Cloud Shell quota result."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r19-cloudshell-quota-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r19-fresh-cloudshell-consent-authentication.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "packet_identity": digest(PACKET) == "07ab2750a25f574b03234924fff90d177ba7d838be47d5eff01cb0b3e0cd50f3",
    "classification": "BLOCKED_CLOUD_SHELL_TEMPORARY_USAGE_LIMIT / R19 EXHAUSTED" in text,
    "one_tab": "exactly one fresh standalone Cloud Shell tab" in flat,
    "one_consent": "clicked exactly once" in flat,
    "bounded_wait": "55 seconds after consent" in flat and "maximum of 60 seconds" in flat,
    "quota_signal": "temporarily exceeded a" in flat and "Cloud Shell limitations" in flat,
    "no_terminal": "no terminal input surface or returned prompt" in flat,
    "no_command": "identity command was not entered" in flat,
    "zero_resource": "No upload, Compute Engine API request, VM/disk/resource action" in flat,
    "no_retry": "No retry, reload, second tab, second click or fallback occurred" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
