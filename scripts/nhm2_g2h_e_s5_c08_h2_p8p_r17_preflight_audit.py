#!/usr/bin/env python3
"""Static audit of the candidate-neutral P8P-R17 transport preflight."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r17-standalone-cloudshell-preflight.md"
R16 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r16-cloudshell-surface-preexecution-result.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "r16_identity": digest(R16) == "a4694fe2979c472602406ff7d79b6b38480a4ad0b8c2d51cf2177b8ab22d09e9",
    "standalone_url": "https://shell.cloud.google.com/?show=terminal" in text,
    "one_tab": "exactly one fresh visible in-app browser tab" in flat and "Do not open a second tab" in flat,
    "one_command": text.count("R17_CONNECTION_READY") == 2 and "exactly one read-only command" in flat,
    "read_only_identity": "gcloud config get-value project" in text and "gcloud auth list" in text,
    "expected_output": "dark-stratum-455714-h4" in text and "pestypig@gmail.com" in text,
    "zero_resource": "performs no Compute Engine API operation" in flat and "ZERO BILLABLE ACTION" in text,
    "first_failure": "First failure is terminal and consumes R17" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
