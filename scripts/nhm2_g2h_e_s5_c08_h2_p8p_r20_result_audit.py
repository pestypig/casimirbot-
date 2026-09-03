#!/usr/bin/env python3
"""Audit the immutable P8P-R20 quota-dialog result."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r20-quota-dialog-incomplete-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r20-cloudshell-quota-reset-inspection.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "packet_identity": digest(PACKET) == "d3d6b52add1ad496c934b216574efe5c6ff3950e1cd8a61259ed4ad33ffd3c79",
    "classification": "BLOCKED_QUOTA_RESET_TIMESTAMP_NOT_RENDERED / R20 EXHAUSTED" in text,
    "session_once": "Session information control exactly once" in flat,
    "quota_once": "activated that item exactly once" in flat,
    "dialog": "`Cloud Shell quota` dialog" in flat,
    "values_absent": "did not render remaining hours, total hours or a reset date/time" in flat,
    "gcloud_absent": "no `gcloud` command" in flat,
    "zero_resource": "No terminal command, upload, API request, VM/disk/resource action" in flat,
    "no_retry": "No reload, retry or fallback occurred" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
