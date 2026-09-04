#!/usr/bin/env python3
"""Static audit of candidate-neutral P8P-R23 x64 archive reuse."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r23-x64-checksum-reuse-authentication.md"
R22 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r22-checksum-misbinding-result.md"
ARCHIVE = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\google-cloud-sdk-583.0.0-windows-x86_64-bundled-python.zip")
EXTRACT = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk")
CONFIG = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config")

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "r22_identity": digest(R22) == "4fdbfdbe32c7c94408fa3a6fc5b867a80cf90ea850f72a8648bf5cfaad093afc",
    "archive_present": ARCHIVE.is_file(),
    "archive_size": ARCHIVE.stat().st_size == 101597540,
    "archive_hash": digest(ARCHIVE) == "25fe2511abdf05d514bbb67859475e7e76acc1f36c0bcac37232e1e34892d768",
    "zip_signature": ARCHIVE.read_bytes()[:4] == b"PK\x03\x04",
    "extract_absent": not EXTRACT.exists(),
    "config_absent": not CONFIG.exists(),
    "no_download": "authorizes no second download" in flat and "No retry, download" in flat,
    "version": "Google Cloud SDK 583.0.0" in text,
    "one_auth": "invoke exactly one `gcloud auth login" in flat,
    "browser_scope": "exactly one fresh in-app-browser tab" in flat,
    "no_password": "Do not automate a password or password-manager surface" in flat,
    "dedicated_project": "dark-stratum-455714-h4" in text and "pestypig@gmail.com" in text,
    "zero_compute_api": "Do not invoke a Compute Engine API" in flat,
    "first_failure": "First failure is terminal and consumes R23" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
