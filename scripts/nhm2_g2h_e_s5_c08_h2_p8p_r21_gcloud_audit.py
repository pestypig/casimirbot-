#!/usr/bin/env python3
"""Static audit of candidate-neutral P8P-R21 local gcloud preflight."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r21-local-gcloud-install-authentication.md"
R20 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r20-quota-dialog-incomplete-result.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "r20_identity": digest(R20) == "46ce3c07e03e174b4c54c3b4c10a9a94545da2bf4d81715b55e13e2d696d756c",
    "official_url": "google-cloud-sdk-583.0.0-windows-x86_64-bundled-python.zip" in text and "docs.cloud.google.com/sdk/docs/downloads-versioned-archives" in text,
    "archive_hash": "2394aa3fe69697fda1aa418990f49139a3f01dcab7eaef68258abd3118b1a155" in text,
    "user_scoped": "dedicated initially absent user-local NHM2 tooling directory" in flat,
    "no_system_install": "must not run the interactive system installer" in flat and "add or change PATH" in flat,
    "version": "report version 583.0.0" in flat,
    "dedicated_config": "dedicated initially absent R21 configuration directory" in flat,
    "explicit_login": "exactly one interactive `gcloud auth login`" in flat and "separate action-time authorization" in flat,
    "no_iam_keys": "Do not create API/OAuth keys or service accounts" in flat and "do not modify IAM" in flat,
    "identity": "pestypig@gmail.com" in text and "dark-stratum-455714-h4" in text,
    "zero_compute_api": "Do not invoke a Compute Engine API" in flat,
    "first_failure": "First failure is terminal and consumes R21" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
