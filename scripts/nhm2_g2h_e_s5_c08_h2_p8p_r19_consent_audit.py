#!/usr/bin/env python3
"""Static audit of candidate-neutral P8P-R19 consent authentication."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r19-fresh-cloudshell-consent-authentication.md"
R18 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r18-retained-tab-absent-result.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "r18_identity": digest(R18) == "d732adeb53c92d054ac5e36674743aa130d77e5269c1b883da3630ba5f77f6f0",
    "one_fresh_tab": "exactly one fresh visible in-app-browser tab" in flat and "second tab" in flat,
    "standalone_url": "https://shell.cloud.google.com/?show=terminal" in text,
    "exact_dialog": "exactly one dialog headed `Authorize Cloud Shell`" in flat,
    "one_consent": "Click that control exactly once" in flat and "second control" in flat,
    "consent_scope": "does not authorize mutation of IAM" in flat,
    "one_command": text.count("R19_CONNECTION_READY") == 2 and "exactly one read-only command" in flat,
    "read_only_identity": "gcloud config get-value project" in text and "gcloud auth list" in text,
    "expected_output": "dark-stratum-455714-h4" in text and "pestypig@gmail.com" in text,
    "zero_resource": "ZERO BILLABLE ACTION" in text and "invoke a Compute Engine API" in flat,
    "first_failure": "First failure is terminal and consumes R19" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
