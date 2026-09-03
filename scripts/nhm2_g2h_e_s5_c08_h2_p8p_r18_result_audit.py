#!/usr/bin/env python3
"""Audit the immutable P8P-R18 retained-tab-absent result."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r18-retained-tab-absent-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r18-cloudshell-consent-authentication.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "packet_identity": digest(PACKET) == "ea4031ad351d0a1d3ab33a6cb117cc24422f0480412bb5a7cc48fda6f33f6243",
    "classification": "BLOCKED_PREEXECUTION_RETAINED_CLOUD_SHELL_TAB_ABSENT / R18 EXHAUSTED" in text,
    "only_details_tab": "exactly one in-app-browser tab" in flat and "Compute Engine Details page" in flat,
    "standalone_absent": "No standalone `shell.cloud.google.com` tab was present" in flat,
    "first_failure": "triggered the frozen first- failure rule" in flat,
    "no_consent": "No `Authorize` or `Reject` control was clicked" in flat,
    "zero_command_resource": "No terminal command, upload, API request, VM/disk/resource action" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
