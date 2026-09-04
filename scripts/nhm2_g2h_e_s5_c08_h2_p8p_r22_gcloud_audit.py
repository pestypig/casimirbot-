#!/usr/bin/env python3
"""Static audit of candidate-neutral P8P-R22 exact-path gcloud preflight."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r22-exact-path-local-gcloud-install-authentication.md"
R21 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r21-path-under-specified-result.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "r21_identity": digest(R21) == "d202ecf2e11ae15b219503ef0a3d4f449af27609ac77b9ecf68d7070797faf4f",
    "exact_tool_root": "C:\\Users\\dan\\AppData\\Local\\NHM2\\p8p-r22-gcloud-583.0.0" in text,
    "exact_archive": "google-cloud-sdk-583.0.0-windows-x86_64-bundled-python.zip" in text,
    "exact_executable": "sdk\\google-cloud-sdk\\bin\\gcloud.cmd" in text,
    "exact_config": "C:\\Users\\dan\\AppData\\Local\\NHM2\\p8p-r22-gcloud-config" in text,
    "package_hash": "2394aa3fe69697fda1aa418990f49139a3f01dcab7eaef68258abd3118b1a155" in text,
    "absence_guard": "both initially absent" in flat,
    "no_system_install": "Do not run an installer" in flat and "modify PATH or system settings" in flat,
    "version": "Google Cloud SDK 583.0.0" in text,
    "one_auth": "exactly one `gcloud auth login" in flat and "--no-launch-browser" in text,
    "browser_scope": "exactly one fresh in-app-browser tab" in flat and "pestypig@gmail.com" in text,
    "no_password": "Do not automate a password or password-manager surface" in flat,
    "dedicated_project": "core/project" in text and "dark-stratum-455714-h4" in text,
    "zero_compute_api": "Do not invoke a Compute Engine API" in flat,
    "first_failure": "First failure is terminal and consumes R22" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
