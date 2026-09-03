#!/usr/bin/env python3
"""Static audit of candidate-neutral P8P-R20 quota inspection."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r20-cloudshell-quota-reset-inspection.md"
R19 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r19-cloudshell-quota-result.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "r19_identity": digest(R19) == "6fd354483e187956980a6e3893dd18f47b51923aab5bafd8a11671b16f4fbae8",
    "official_doc": "https://docs.cloud.google.com/shell/docs/quotas-limits" in text,
    "retained_tab": "reuse only the retained standalone Cloud Shell tab" in flat,
    "session_once": "Activate Session information exactly once" in flat,
    "quota_once": "activate it exactly once" in flat,
    "read_only_fields": "remaining hours, total hours and reset date/time" in flat,
    "no_command": "Enter no terminal command" in flat,
    "first_failure": "First failure is terminal and consumes R20" in flat,
    "zero_resource": "ZERO BILLABLE ACTION" in text and "invoke a Compute Engine API" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
